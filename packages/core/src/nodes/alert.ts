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
    return '<div class="pr10 pl10 pb4"><input type="text" class="node-form-control" node:model="message"/></div>';
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
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    alert(manager.getText(data?.message, nodeId));
    await this.nextNode(data, next, nodeId);
  }
}
