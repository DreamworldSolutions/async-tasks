# Async Tasks
- It is used to manage async tasks with redux state.

### Usage pattern

#### Activate reducer on slice (Required) 

```javascript
import * as asyncTasks from '@dreamworld/async-tasks';
import { store } from "path/to/store";

asyncTask.init(store);
```
#### Use Generator function to run any async task

##### Foreground task
```javascript
import { run } from '@dreamworld/async-tasks';

try {
  const result = yield call(run, taskId, fn, timeoutMillis);
} catch (e) {
  //handle error
}
```

##### Background task
```javascript
import { run } from '@dreamworld/async-tasks';

try {
  const taskId = yield fork(run, taskId, fn, timeoutMillis);
  yield cancel(taskId);
} catch (e) {
  //handle error
}
```

#### To retrieve the result of a Task from another Saga
```javascript
import { taskResult } from '@dreamworld/async-tasks';

try {
  const result = yield call(taskResult, taskId);
} catch (e) {
  //if Task failed.
}

```

#### Selectors
- `Task get(id)`: Returns Task of given id.
- `String status(id)`: Returns current status of given taskId
- `Object result(id)`: Returns result of given taskId


It manages state at below path.

Path: `asyncTasks.$taskId`

| name          | data type  | description |
|---------------|----------- |-------------|
| status        | String     | Possible values: `IN_PROGRESS`, `SUCCESS` and `FAILED`. |
| startedAt     | Number     | What Task execution is started |
| completedAt   | Number     | When Task is completed; status changed to SUCCESS or FAILED. |
| result        | Object     | Task result. Promise resolved with this |
| error         | Error|String     | If rejected with Error then Error.message. If String, then directly used; Otherwise toString(). CANCELLED - if Task is cancelled by User. TIMED_OUT - If Task didn’t complete in set limit. |