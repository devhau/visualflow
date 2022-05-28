import { CoreSetup } from './nodes/index';
import { workerManager, WorkerManager } from './worker/index';

workerManager.newSetup(CoreSetup);

export default {
  CoreSetup,
  WorkerManager,
  workerManager
};
