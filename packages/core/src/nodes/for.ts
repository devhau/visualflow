import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreForNode extends WorkerNode {
  key(): string {
    return "core_for";
  }
  name() {
    return "For";
  }

  execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    this.nextNode(data, next, nodeId);
  }
}
