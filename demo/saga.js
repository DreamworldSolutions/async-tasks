import { call, fork, takeEvery, cancel } from 'redux-saga/effects';
import { run, taskResult } from "../index.js";

function asyncTask1() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ task: 1, response: true });
    }, 5000);
  });
}

function asyncTask2() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject({ code: "NOT_FOUND", message: "deleted" });
    }, 5000);
  });
}

let taskRef;
function* onTask({ taskId }) {
  try {
    let response;
    if (taskId === "task-1") {
      yield fork(waitForTaskResult);
      response = yield call(run, taskId, asyncTask1);
      console.log(response);
      return;
    }

    if (taskId === "task-2") {
      response = yield call(run, taskId, asyncTask2);
      console.log(response);
      return;
    }

    if (taskId === "task-3") {
      taskRef = yield fork(run, taskId, asyncTask1);
      console.log(taskRef);
      return;
    }

    if (taskId === "task-4") {
      response = yield call(run, taskId, asyncTask1, 3000);
      console.log(response);
      return;
    }

  } catch (err) {
    console.error("onTask: failed. error=", err);
  }
}

function* onCancel({ taskId }) {
  try {
    yield cancel(taskRef);
  } catch (err) {
    console.error("onCancel: failed. error=", err);
  }
}

function* waitForTaskResult() {
  try {
    let result = yield call(taskResult, "task-2");
    console.log("waitForTaskResult=", result);
  } catch (err) {
    console.error("waitForTaskResult: failed. error=", err);
  }
}

export default function* () {
  yield takeEvery("TASK", onTask);
  yield takeEvery("CANCEL", onCancel);
}