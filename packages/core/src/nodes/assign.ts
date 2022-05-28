import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreAssignNode extends WorkerNode {
  key(): string {
    return "core_assign";
  }
  name() {
    return "Assign";
  }
  icon() {
    return '<i class="fas fa-bolt"></i>';
  }

  execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    this.nextNode(data, next, nodeId);
  }
}
