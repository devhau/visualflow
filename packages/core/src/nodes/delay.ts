import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreDelayNode extends WorkerNode {
  key(): string {
    return "core_delay";
  }
  name() {
    return "Delay";
  }
  icon() {
    return '<i class="fas fa-stopwatch"></i>';
  }
  html({ elNode, main, node }: any): string {
    return '<div class="pr10 pl10 pb4 display-flex"><input type="text" class="node-form-control" node:model="number_delay"/><span class="p4">ms</span></div>';
  }
  properties(): any {
    return {
      number_delay: {
        key: "number_delay",
        edit: true,
        default: 1000
      }
    }
  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    await manager.delay(manager.runCode(data?.number_delay,nodeId));
    await this.nextNode(data, next, nodeId);
  }
}
