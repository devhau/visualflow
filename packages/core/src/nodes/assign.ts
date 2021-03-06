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
        text: 'name',
        edit: true,
        var: true,
        validate: '^([a-zA-Z0-9\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9]+)$',
        default: ""
      },
      env_value: {
        key: "env_value",
        text: 'value',
        edit: true,
        default: ""
      },

      env_scorp: {
        key: "env_scorp",
        text: 'scorp',
        edit: true,
        select: true,
        selectNone: 'Select scorp',
        default: '',
        dataSelect: ({ elNode, main, node }: any) => {
          return main.getGroupCurrent().map((item: any) => {
            return {
              value: item.id,
              text: item.text
            };
          })
        },
      }
    }
  }
  option(): any {
    return {
      class: '',
      dot: {
        left: 1,
        top: 0,
        right: 1,
        bottom: 0,
      }
    }
  }

  html({ elNode, main, node }: any): string {
    return `<div class="node-content-row">
    <div class="pl10 pr0 pt1 pb7"><input type="text" class="node-form-control" node:model="env_name"/> </div>
    <div class="flex-none pr6 pt6 pb7 text-center">=</div>
    <div class="pr10 pl0 pt1 pb7"><input type="text" class="node-form-control" node:model="env_value"/></div>
    <div></div>
    </div>`;
  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    manager.setVariableObject(data.env_name, manager.runCode(data.env_value, nodeId), data.env_scorp ?? nodeId)
    await this.nextNode(data, next, nodeId);
  }
}
