import * as actions from './actions';
import { ReduxUtils } from "@dreamworld/pwa-helpers/redux-utils.js";

export default (state = {}, action) => {
  switch (action.type) {
    case actions.STARTED:
      state = ReduxUtils.replace(state, `${action.id}.status`, "IN_PROGRESS");
      state = ReduxUtils.replace(state, `${action.id}.startedAt`, new Date().getTime());
      return state;

    case actions.COMPLETED:
      const status = action?.error ? "FAILED" : "SUCCESS";
      const result = action?.result;
      const error = action?.error ? action.error : undefined;
      state = ReduxUtils.replace(state, `${action.id}.status`, status);
      state = ReduxUtils.replace(state, `${action.id}.completedAt`, new Date().getTime());
      state = ReduxUtils.replace(state, `${action.id}.result`, result);
      state = ReduxUtils.replace(state, `${action.id}.error`, error);
      return state;

    default:
      return state;
  }
};