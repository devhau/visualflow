import { WorkerNode } from "../worker/node";

export class CoreIfNode extends WorkerNode {
  key(): string {
    return "core_if";
  }
  name() {
    return "If";
  }
  icon(): string {
    return '<i class="fas fa-equals"></i>';
  }
  properties(): any {
    return {
      condition: {
        key: "condition",
        edit: true,
        default: 1
      },
      cond: {
        key: "cond",
        edit: true,
        sub: true,
        default: 1
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
    console.log(node.data.Get('condition'));
    let condition = node.data.Get('condition');
    let html = '';
    for (let index = 0; index < condition; index++) {
      html = `${html}<div class="node-content-row"><input type="text" class="node-form-control" node:model="cond${50001 + index}"/> <span style="text-align:right">Then</span><span><span class="node-dot" node="${50001 + index}"></span></span></div>`
    }
    html = `${html}<div class="node-content-row"><span style="text-align:right">Else</span><span><span class="node-dot" node="50000"></span></span></div>`
    html = `${html}<div><button class="btnAddCondition">Add</div></div>`;
    return html;
  }
  script({ elNode, main, node }: any): void {
    elNode.querySelector('.btnAddCondition')?.addEventListener('click', () => {
      node.data.Increase('condition');
    })
  }
}
