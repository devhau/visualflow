import { NodeFlow } from "./NodeFlow";

export class DataFlow {
  private data: any = {};
  public constructor(private node: NodeFlow) {
    setTimeout(() => {
      this.node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
        item.addEventListener('keyup', this.changeInput.bind(this));
      });
    });
  }
  public changeInput(e: any) {
    this.data[e.target.getAttribute(`node:model`)] = e.target.value;
  }
  public load(data: any) {
    this.data = data || {};
    setTimeout(() => {
      this.node.elNode.querySelectorAll(`[node\\:model]`).forEach((item: any) => {
        item.value = this.data[item.getAttribute(`node:model`)] ?? null;
      });
    });
  }
  public toJson() {
    return this.data;
  }
}
