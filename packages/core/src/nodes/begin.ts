import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";
export const NodeBegin = "core_begin";
export class CoreBeginNode extends WorkerNode {

  key(): string {
    return NodeBegin;
  }
  name() {
    return "Begin";
  }
  option() {
    return {
      onlyNode: true,
      sort: 0,
      dot: {
        left: 0,
        top: 0,
        right: 1,
        bottom: 0,
      }
    };
  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    await this.nextNode(data, next, nodeId);
  }
}
