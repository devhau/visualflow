import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreAlertNode extends WorkerNode {
  key(): string {
    return "core_alert";
  }
  name() {
    return "Alert";
  }
  icon() {
    return '<i class="fas fa-bell"></i>';
  }
  html({ elNode, main, node }: any): string {
    return '<div class="p10"><input type="text" class="node-form-control" node:model="message"/></div>';
  }
  properties(): any {
    return {
      message: {
        key: "message",
        edit: true,
        default: ""
      }
    }
  }
  execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    alert(data?.message);
    this.nextNode(data, next, nodeId);
  }
}
