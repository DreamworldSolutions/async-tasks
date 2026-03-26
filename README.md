# @dreamworld/async-tasks

A Redux-Saga utility for managing async task lifecycle (in-progress, success, failure) in Redux applications, with built-in support for timeout, cancellation, and cross-saga result waiting.

---

## 1. User Guide

### Installation & Setup

**Install the package:**

```bash
yarn add @dreamworld/async-tasks
```

**Runtime dependencies** (must be installed in your project):

| Package | Version |
|---------|---------|
| `@dreamworld/pwa-helpers` | `^1.16.5` |
| `lodash-es` | `^4.17.21` |
| `redux-saga` | `^1.2.3` |

**Requirement:** Your Redux store must use `lazyReducerEnhancer` from `pwa-helpers/lazy-reducer-enhancer.js`, as `init()` calls `store.addReducers()` internally.

**Store setup:**

```javascript
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import createSagaMiddleware from 'redux-saga';

export const sagaMiddleware = createSagaMiddleware();

export const store = createStore(
  state => state,
  compose(
    lazyReducerEnhancer(combineReducers),
    applyMiddleware(sagaMiddleware)
  )
);
```

**Initialize the library** (once, before running sagas):

```javascript
import * as asyncTasks from '@dreamworld/async-tasks';
import { store, sagaMiddleware } from './store.js';
import rootSaga from './saga.js';

asyncTasks.init(store);
sagaMiddleware.run(rootSaga);
```

---

### Basic Usage

```javascript
import { call, fork, cancel } from 'redux-saga/effects';
import { run, taskResult } from '@dreamworld/async-tasks';

function fetchData() {
  return fetch('/api/data').then(r => r.json());
}

// Foreground task — blocks until complete
function* mySaga() {
  try {
    const result = yield call(run, 'fetch-data', fetchData);
    console.log('done:', result);
  } catch (err) {
    console.error('failed:', err);
  }
}

// Foreground task with timeout (3 seconds)
function* mySagaWithTimeout() {
  try {
    const result = yield call(run, 'fetch-data', fetchData, 3000);
  } catch (err) {
    // err === "TIMED_OUT" if timeout exceeded
  }
}

// Background task — non-blocking, cancellable
let taskRef;
function* myBackgroundSaga() {
  taskRef = yield fork(run, 'fetch-data', fetchData);
}

function* cancelSaga() {
  yield cancel(taskRef); // dispatches COMPLETED with error "CANCELLED"
}
```

---

### API Reference

#### Exported Functions

| Name | Signature | Return | Description |
|------|-----------|--------|-------------|
| `init` | `init(store)` | `void` | Registers the async-tasks reducer into the Redux store. Call once at app startup. |
| `run` | `run*(id, fn, timeoutMillis?)` | Generator | Executes `fn`, dispatches lifecycle actions. Must be used via `call()` or `fork()`. Re-throws errors after dispatching. |
| `taskResult` | `taskResult(id)` | `Promise` | Returns a Promise that resolves/rejects with the task result/error. Resolves immediately if the task is already complete. |
| `selectors` | namespace | — | Re-exports all selector functions (see below). |

#### `run` Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `String` | Yes | Unique task identifier. Used as the Redux state key. |
| `fn` | `Function \| GeneratorFunction` | Yes | Async function or generator function to execute. |
| `timeoutMillis` | `Number` | No | Timeout in milliseconds. If `fn` does not complete within this time, the task fails with error `"TIMED_OUT"`. |

#### `taskResult` Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `String` | Yes | Task ID to wait on. |

#### Selectors

All selectors accept `(state, id)` where `state` is the Redux root state.

| Name | Signature | Return Type | Description |
|------|-----------|-------------|-------------|
| `selectors.get` | `get(state, id)` | `Object \| undefined` | Returns the full task object. |
| `selectors.status` | `status(state, id)` | `String \| undefined` | Returns the task status. Possible values: `"IN_PROGRESS"`, `"SUCCESS"`, `"FAILED"`. |
| `selectors.result` | `result(state, id)` | `Object \| undefined` | Returns the task result value. |

#### Task Object Shape

Stored at Redux path `___DW_asyncTasks.<id>`.

| Field | Type | Description |
|-------|------|-------------|
| `status` | `String` | `"IN_PROGRESS"` \| `"SUCCESS"` \| `"FAILED"` |
| `startedAt` | `Number` | Unix timestamp (ms) when the task started. |
| `completedAt` | `Number` | Unix timestamp (ms) when the task completed. |
| `result` | `Object` | The resolved return value of `fn` (on success). |
| `error` | `Object \| String` | The rejection reason of `fn`; `"CANCELLED"` if cancelled via `cancel()`; `"TIMED_OUT"` if timeout elapsed. |

---

### Configuration Options

| Constant | Value | Description |
|----------|-------|-------------|
| `reduxPath` | `"___DW_asyncTasks"` | The Redux state key under which all task state is stored. Not configurable at runtime. |

---

### Advanced Usage

#### Cross-Saga Result Waiting

Use `taskResult(id)` from within a saga (via `call()`) to block until another task completes — even if that task was started in a different saga:

```javascript
import { call, fork } from 'redux-saga/effects';
import { run, taskResult } from '@dreamworld/async-tasks';

function* sagaA() {
  // Start waiting for task-2 concurrently while running task-1
  yield fork(waitForTask2);
  yield call(run, 'task-1', asyncFn1);
}

function* waitForTask2() {
  try {
    const result = yield call(taskResult, 'task-2');
    console.log('task-2 result:', result);
  } catch (err) {
    console.error('task-2 failed:', err);
  }
}
```

`taskResult` subscribes to the Redux state path `___DW_asyncTasks.<id>` and resolves/rejects as soon as the status becomes `SUCCESS` or `FAILED`.

#### Background Tasks with Cancellation

```javascript
import { fork, cancel, takeEvery } from 'redux-saga/effects';
import { run } from '@dreamworld/async-tasks';

let taskRef;

function* startBackground() {
  taskRef = yield fork(run, 'bg-task', longRunningFn);
}

function* cancelBackground() {
  if (taskRef) {
    yield cancel(taskRef);
    // Redux state: { status: "FAILED", error: "CANCELLED" }
  }
}

export default function* () {
  yield takeEvery('START', startBackground);
  yield takeEvery('CANCEL', cancelBackground);
}
```

#### Reading Task State in a Component

```javascript
import { selectors } from '@dreamworld/async-tasks';

// In a Redux-connected component's stateChanged handler:
stateChanged(state) {
  this._status = selectors.status(state, 'fetch-data');
  this._result = selectors.result(state, 'fetch-data');
  this._task   = selectors.get(state, 'fetch-data');
}
```

---

## 2. Developer Guide / Architecture

### Architecture Overview

**Design pattern: Saga Worker + Redux State Machine**

The library coordinates async operations using two complementary mechanisms:

1. **Redux state** — the single source of truth for task lifecycle. Components and sagas observe task state through Redux selectors.
2. **Redux-Saga generator** — `run*` is a saga worker that manages side-effect sequencing, timeout racing, and cancellation detection.

**Module responsibilities:**

| Module | Responsibility |
|--------|---------------|
| `index.js` | Public API: `init`, `run*`, `taskResult`. Wires reducer into store; implements saga logic. |
| `actions.js` | Defines action types (`___DW_ASYNC_TASK_STARTED`, `___DW_ASYNC_TASK_COMPLETED`) and action creators. |
| `reducer.js` | Handles state transitions: STARTED sets `status: "IN_PROGRESS"` and `startedAt`; COMPLETED sets `status`, `completedAt`, `result`, `error`. Uses `ReduxUtils.replace()` for immutable updates. |
| `selectors.js` | Provides `get`, `status`, `result` selectors via `lodash-es` path traversal. |
| `constants.js` | Single export: `reduxPath = "___DW_asyncTasks"`. Shared across modules to avoid magic strings. |

**Task lifecycle flow:**

```
run*(id, fn, timeoutMillis?)
  │
  ├─ put(started(id))
  │     → state: { status: "IN_PROGRESS", startedAt: <ts> }
  │
  ├─ [no timeout]    call(fn)
  │  [with timeout]  race({ result: call(fn), timeout: delay(timeoutMillis) })
  │                    └─ if timeout wins → throw "TIMED_OUT"
  │
  ├─ [success] put(completed(id, result))
  │               → state: { status: "SUCCESS", result, completedAt: <ts> }
  │            return result
  │
  ├─ [error]   put(completed(id, null, err))
  │               → state: { status: "FAILED", error, completedAt: <ts> }
  │            throw err  ← re-thrown to calling saga
  │
  └─ [finally, if cancelled()]
               put(completed(id, null, "CANCELLED"))
                  → state: { status: "FAILED", error: "CANCELLED", completedAt: <ts> }
```

**`taskResult` implementation:**

Uses `ReduxUtils.subscribe()` to watch `___DW_asyncTasks.<id>` in the Redux store. Resolves/rejects the returned Promise when `status` becomes `SUCCESS` or `FAILED`, then unsubscribes.

**Lazy reducer registration:**

`init(store)` calls `store.addReducers({ ___DW_asyncTasks: reducer })`, which requires the store to be enhanced with `lazyReducerEnhancer`. This enables the reducer to be registered dynamically without upfront store configuration.
