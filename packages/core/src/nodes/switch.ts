import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreSwitchNode extends WorkerNode {
  key(): string {
    return "core_switch";
  }
  name() {
    return "Switch";
  }
  icon(): string {
    return '<i class="fas fa-random"></i>';
  }
  properties(): any {
    return {
      condition: {
        key: "condition",
        edit: true,
        default: 1
      },
      case: {
        key: "case",
        edit: true,
        sub: true,
        default: 1
      },
      case_input: {
        key: "case_input",
        edit: true,
        default: ''
      },
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
    const condition = node.data.Get('condition');
    let html = '';
    html = `${html}<div class="node-content-row">
    <div style="text-align:right" class="pl10 pr1 pt2 pb2">Input</div>
    <div class="pl2 pr1 pt2 pb2"><input type="text" class="node-form-control" node:model="case_input"/></div>
    <div></div>
    </div>`;
    for (let index = 0; index < condition; index++) {
      html = `${html}<div class="node-content-row">
      <div style="text-align:right" class="pl10 pr1 pt2 pb2">Case</div>
      <div class="pl2 pr1 pt2 pb2"><input type="text" class="node-form-control" node:model="case${50001 + index}"/></div>
      <div><span class="node-dot" node="${50001 + index}"></span></div>
      </div>`;
    }
    html = `${html}<div class="node-content-row">
    <div class="pl10 pr1 pt2 pb2"><button class="btnAddCondition">Add</button></div>
    <div style="text-align:right" class="pl2 pr10 pt2 pb2">Default</div>
    <div><span class="node-dot" node="50000"></span></div>
    </div>`;
    return html;
  }
  script({ elNode, main, node }: any): void {
    elNode.querySelector('.btnAddCondition')?.addEventListener('click', () => {
      node.data.Increase('condition');
    })
  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    const condition = data.condition;
    const case_input = manager.Val(data.case_input);
    for (let index = 0; index < condition && !manager.flgStopping; index++) {
      let node = 50001 + index;
      const condition_node = data[`case${node}`];
      if (manager.Val(condition_node) == case_input) {
        await this.nextNode(data, next, nodeId, node);
        return;
      }
    }
    await this.nextNode(data, next, nodeId, 50000);
  }
}
