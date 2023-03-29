import _get from "lodash-es/get.js";

export const get = (state, id) => _get(state, `asyncTasks.${id}`);
export const status = (state, id) => _get(state, `asyncTasks.${id}.status`);
export const result = (state, id) => _get(state, `asyncTasks.${id}.result`);