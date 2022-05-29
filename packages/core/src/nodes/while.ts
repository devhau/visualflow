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
    return '<div class="text-center p3"><button class="btnGoGroup node-form-control">Go to Group</button></div>';
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
    while (manager.Val(condition) == true && !manager.flgStopping) {
      await manager.excuteAsync();
    }
    manager.setGroup(group);
    await this.nextNode(data, next, nodeId);
  }
}
