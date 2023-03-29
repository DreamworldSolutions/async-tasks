export const STARTED = '___DW___ASYNC_TASK_STARTED';
export const COMPLETED = '___DW___ASYNC_TASK_COMPLETED';

export const started = (id) => {
  return {
    type: STARTED,
    id
  };
};

export const completed = (id, result, error) => {
  return {
    type: COMPLETED,
    id,
    result,
    error
  };
};