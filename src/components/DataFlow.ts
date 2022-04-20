import { FlowCore } from "./BaseFlow";

export class DataFlow {
  private data: any = {};
  public readonly Event: any = {
    dataChange: "dataChange",
    change: "change"
  }
  public constructor(private node: FlowCore) {
    setTimeout(() => {
      this.node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
        item.addEventListener('keyup', this.changeInput.bind(this));
      });
    }, 300);
  }
  public RemoveEvent() {
    this.node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
      item.removeEventListener('keyup', this.changeInput.bind(this));
    });
  }
  public Set(key: string, value: any, obj = null) {
    this.data[key] = value;
    setTimeout(() => {
      this.node.elNode.querySelectorAll(`[node\\:model="${key}"]`).forEach((item: any) => {
        if (item != obj)
          item.value = value;
      }, 300);
      this.node.dispatch(this.Event.dataChange, { key, value, obj });
      this.node.dispatch(this.Event.change, { key, value, obj });
    });
  }
  public Get(key: string) {
    return this.data[key];
  }
  public changeInput(e: any) {
    this.Set(e.target.getAttribute(`node:model`), e.target.value, e.target);
  }
  public load(data: any) {
    this.data = data || {};
    setTimeout(() => {
      this.node.elNode.querySelectorAll(`[node\\:model]`).forEach((item: any) => {
        item.value = this.data[item.getAttribute(`node:model`)] ?? null;
      }, 300);
    });
  }
  public toJson() {
    return this.data;
  }
}
