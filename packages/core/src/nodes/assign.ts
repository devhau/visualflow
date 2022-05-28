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
  properties(): any {
    return {
      env_name: {
        key: "env_name",
        edit: true,
        default: ""
      },
      env_value: {
        key: "env_value",
        edit: true,
        default: ""
      }
    }
  }
  option(): any {
    return {
      class: '',
      dot: {
        left: 1,
        top: 0,
        right: 0,
        bottom: 0,
      }
    }
  }

  html({ elNode, main, node }: any): string {
    return `<div class="node-content-row">
    <div class="pl10 pr0 pt2 pb2"><input type="text" class="node-form-control" node:model="env_name"/> </div>
    <div class="flex-none p2 text-center">=</div>
    <div class="pr10 pl0 pt2 pb2"><input type="text" class="node-form-control" node:model="env_value"/></div>
    <div><span class="node-dot" node="50000"></span></div>
    </div>`;
  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    await this.nextNode(data, next, nodeId);
  }
}
