import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreWhileNode extends WorkerNode {
  key(): string {
    return "core_while";
  }
  name() {
    return "While";
  }
  icon() {
    return '<i class="fas fa-circle-notch"></i>';
  }
  html({ elNode, main, node }: any): string {
    return `<div class="pl12 pr12 pt2 pb2"><input type="text" class="node-form-control" node:model="condition"/></div>
      <div class="text-center p3" > <button class="btnGoGroup" > Go to Content </button></div > `;
  }
  properties(): any {
    return {
      condition: {
        key: "condition",
        edit: true,
        hide: true,
        default: ''
      }
    }
  }
  script({ elNode, main, node }: any): void {
    elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {
      node.parent.openGroup(node.GetId());
    })
  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    const group = manager.getGroupCurrent();
    manager.setGroup(data.id);
    const condition = data.condition;
    while (manager.runCode(condition, nodeId) == true && !manager.flgStopping) {
      await manager.excuteAsync();
    }
    manager.setGroup(group);
    await this.nextNode(data, next, nodeId);
  }
}
