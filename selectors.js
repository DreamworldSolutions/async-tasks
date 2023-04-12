import _get from "lodash-es/get.js";
import { reduxPath } from "./constants.js";

/**
 * It returns Task object
 * @param {Object} state Redux state
 * @param {String} id taskId
 * @returns {Object} returns task contains { status: String, startedAt: Number, completedAt: Number, result: Object, error: Object | String }
 */
export const get = (state, id) => _get(state, `${reduxPath}.${id}`);

/**
 * It returns Task status
 * @param {Object} state 
 * @param {String} id 
 * @returns {String} status. Possible values: `IN_PROGRESS`, `SUCCESS` OR `FAILED`.
 */
export const status = (state, id) => _get(state, `${reduxPath}.${id}.status`);

/**
 * It returns Task result
 * @param {Object} state Redux state
 * @param {String} id TaskId
 * @returns {Object} Task result
 */
export const result = (state, id) => _get(state, `${reduxPath}.${id}.result`);