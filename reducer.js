import * as actions from './actions';
import { ReduxUtils } from "@dreamworld/pwa-helpers/redux-utils.js";

export default (state = {}, action) => {
  let oState = { ...state };

  switch (action.type) {
    case actions.STARTED:
      oState = ReduxUtils.replace(oState, `${action.id}.status`, "IN_PROGRESS");
      oState = ReduxUtils.replace(oState, `${action.id}.startedAt`, new Date().getTime());
      return oState;

    case actions.COMPLETED:
      let status = action?.result ? "SUCCESS" : "FAILED";
      let result = action?.result ? action.result : undefined;
      let error = action?.error ? action.error : undefined;
      oState = ReduxUtils.replace(oState, `${action.id}.status`, status);
      oState = ReduxUtils.replace(oState, `${action.id}.completedAt`, new Date().getTime());
      oState = ReduxUtils.replace(oState, `${action.id}.result`, result);
      oState = ReduxUtils.replace(oState, `${action.id}.error`, error);
      return oState;

    default:
      return state;
  }
};