import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreForNode extends WorkerNode {
  key(): string {
    return "core_for";
  }
  name() {
    return "For";
  }
  icon() {
    return '<i class="fas fa-long-arrow-alt-right"></i>';
  }

  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    await this.nextNode(data, next, nodeId);
  }
}
