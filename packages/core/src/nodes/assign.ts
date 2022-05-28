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

  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    await this.nextNode(data, next, nodeId);
  }
}
