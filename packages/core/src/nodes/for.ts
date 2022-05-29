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
    return '<i class="fas fa-circle-notch"></i>';
  }
  properties(): any {
    return {
      number_start: {
        key: "number_start",
        edit: true,
        default: 1
      },
      number_end: {
        key: "number_end",
        edit: true,
        default: 1
      },
      number_step: {
        key: "number_step",
        edit: true,
        default: 1
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
        <div class="flex-none pl10 pr0 pt4 pb2 text-center" >For</div>
        <div class="pl2 pr0 pt2 pb2" ><input type="text" class="node-form-control" node:model="number_start" /> </div>
        <div class="flex-none pl2 pr0 pt4 pb2 text-center" >To </div>
        <div class="pr2 pl0 pt2 pb2" ><input type="text" class="node-form-control" node:model="number_end" /></div>
        <div class="flex-none pl2 pr0 pt42 pb2 text-center" >Step</div>
        <div class="pr10 pl0 pt2 pb2" ><input type="text" class="node-form-control" node:model="number_step" /></div>
      </div>
      <div class="text-center p3">
        <button class="btnGoGroup node-form-control">Go to Content</button>
      </div>`;
  }
  script({ elNode, main, node }: any): void {
    elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {
      node.parent.openGroup(node.GetId());
    })
    const temp_env_name = `temp_${node.GetId()}_env_name`;
    const temp_value = main.temp.Get(temp_env_name);
    if (!temp_value) {
      main.temp.Set(temp_env_name, node.data.Get('env_name'));
      main.newVariable(node.data.Get('env_name'), node.GetId());
    } else if (node.data.Get('env_name') != temp_value) {
      main.changeVariableName(temp_value, node.data.Get('env_name'), node.GetId());
      main.temp.Set(temp_env_name, node.data.Get('env_name'));
    }

  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    const group = manager.getGroupCurrent();
    manager.setGroup(data.id);
    for (let loop_index = data.number_start; loop_index < data.number_end && !manager.flgStopping; loop_index = loop_index + data.number_step) {
      await manager.excuteAsync();
    }
    manager.setGroup(group);
    await this.nextNode(data, next, nodeId);
  }
}
