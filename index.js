import { call, put, cancelled, race, delay } from 'redux-saga/effects';
import { ReduxUtils } from "@dreamworld/pwa-helpers/redux-utils.js";
import reducer from "./reducer.js";
import * as actions from "./actions.js";
import { reduxPath } from './constants.js';
export * as selectors from "./selectors.js";

var _store;
/**
 * It's used to init reducer in redux store.
 * @param {Object} store Redux store.
 */
export const init = (store) => {
  store.addReducers({
    [reduxPath]: reducer
  });

  _store = store;
};

/**
 * It starts async task
 * @param {String} id Required. Task id
 * @param {String} fn Required. Async function OR Generator function
 * @param {Number} timeoutMillis Optional. timeout in milliseconds
 * @returns 
 */
export function* run(id, fn, timeoutMillis) {
  try {
    yield put(actions.started(id));

    let result;
    if (!timeoutMillis) {
      result = yield call(fn);
    } else {
      result = yield race({
        result: call(fn),
        timeout: delay(timeoutMillis)
      });
    }

    if (result?.timeout) {
      throw "TIMED_OUT";
    }

    if (timeoutMillis) {
      result = result?.result;
    }

    yield put(actions.completed(id, result));
    return result;

  } catch(err) {
    yield put(actions.completed(id, null, err));
    throw err;
  } finally {
    if (yield cancelled()) {
      yield put(actions.completed(id, null, "CANCELLED"));
    }
  }
}

/**
 * It returns a promise that will be fulfilled/rejected with the result/error of the given taskId
 * If result is available then it will be fulfilled immediately. otherwise resolved when result is become available.
 * @param {String} id Task id
 * @returns {Promise}
 */
export function taskResult(id) {
  return new Promise((resolve, reject) => {
    let unsubscribe = ReduxUtils.subscribe(_store, `${reduxPath}.${id}`, (task) => {
      if (task?.error && task?.status === 'FAILED') {
        unsubscribe();
        reject(task.error);
        return;
      }

      if (task?.result && task?.status === 'SUCCESS') {
        unsubscribe();
        resolve(task.result);
        return;
      }
    });
  });
}