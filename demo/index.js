import { store, sagaMiddleware } from './store.js';
import saga from './saga.js';
import * as asyncTasks from '../index.js';

//Init reducer
asyncTasks.init(store);

sagaMiddleware.run(saga);