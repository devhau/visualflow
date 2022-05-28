import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreGroupNode extends WorkerNode {
  key(): string {
    return "core_group";
  }
  name() {
    return "Group";
  }
  icon() {
    return '<i class="far fa-object-group"></i>';
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
    await manager.excuteAsync();
    manager.setGroup(group);
    await this.nextNode(data, next, nodeId);
  }
}
