import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreForEachNode extends WorkerNode {
  key(): string {
    return "core_forEach";
  }
  name() {
    return "For Each";
  }
  icon() {
    return '<i class="fas fa-circle-notch"></i>';
  }
  properties(): any {
    return {
      env_items: {
        key: "env_items",
        text: 'items',
        var: true,
        edit: true,
        default: ''
      },
      env_item: {
        key: "env_item",
        edit: true,
        default: 'item'
      },
      env_name: {
        key: "env_name",
        edit: true,
        default: 'loop_index'
      }
    }
  }
  html({ elNode, main, node }: any): string {
    return `
      <div class="display-flex">
        <div class="flex-none pl10 pr0 pt4 pb2 text-center" >ForEach</div>
        <div class="pr10 pl0 pt2 pb2" ><input type="text" class="node-form-control" node:model="env_item" /></div>
        <div class="pl2 pr0 pt2 pb2" ><input type="text" class="node-form-control" node:model="env_items" /> </div>
      </div>
      <div class="text-center p3">
        <button class="btnGoGroupl">Go to Content</button>
      </div>`;
  }
  script({ elNode, main, node }: any): void {
    elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {
      node.parent.openGroup(node.GetId());
    })
    main.tempVariable('env_name', node.getDataValue('env_name'), node.GetId());
    main.tempVariable('env_item', node.getDataValue('env_item'), node.GetId());

  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    const group = manager.getGroupCurrent();
    manager.setGroup(data.id);
    let env_items = data.env_items;
    if (env_items) {
      let loop_index = 0;
      for (let item of env_items) {
        manager.setVariableObject(data.env_name, loop_index, nodeId);
        manager.setVariableObject(data.env_item, item, nodeId);
        await manager.excuteAsync();
        loop_index++;
      }

    }


    manager.setGroup(group);
    await this.nextNode(data, next, nodeId);
  }
}
