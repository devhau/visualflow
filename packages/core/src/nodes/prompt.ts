import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CorepromptNode extends WorkerNode {
  key(): string {
    return "core_prompt";
  }
  name() {
    return "Prompt";
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
      env_message: {
        key: "env_message",
        text: 'message',
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
    <div class="pr10 pl10 pt1 pb7"><textarea type="text" class="node-form-control" node:model="env_message"></textarea></div>
    <div></div>
    </div>`;
  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    let rs = prompt(data.env_message)
    manager.setVariableObject(data.env_name, rs, data.env_scorp ?? nodeId)
    await this.nextNode(data, next, nodeId);
  }
}
