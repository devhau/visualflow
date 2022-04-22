import { FlowCore } from "./BaseFlow";

export class DataFlow {
  private data: any = {};
  public nodes: FlowCore[] = [];
  public readonly Event = {
    dataChange: "dataChange",
    change: "change"
  }
  public constructor(public node: FlowCore) {
  }
  public InitData(data: any = null, properties: any = -1) {
    if (properties !== -1) {
      this.node.properties = properties;
    }
    this.load(data);
    this.BindEvent(this.node);
    this.UpdateUI();
  }
  public RemoveEventAll() {
    for (let node of this.nodes) {
      node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
        item.removeEventListener('keyup', this.changeInput.bind(this));
      });
    }
    this.nodes = [];
  }
  public RemoveEvent(node: FlowCore) {
    let index = this.nodes.indexOf(node);
    if (index > -1) {
      this.nodes[index].elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
        item.removeEventListener('keyup', this.changeInput.bind(this));
      });
      node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
        item.removeEventListener('keyup', this.changeInput.bind(this));
      });
      this.nodes = this.nodes.filter((item) => item.Id != node.Id);
    }
  }
  public BindEvent(node: FlowCore) {
    this.RemoveEvent(node);
    this.nodes = [... this.nodes, node];
    node.elNode.querySelectorAll(`[node\\:model]`).forEach((item: any) => {
      if (item.tagName == 'SPAN' || item.tagName == 'DIV') {
        item.innerHTML = `${this.data[item.getAttribute(`node:model`)]}`;
      } else {
        item.value = this.data[item.getAttribute(`node:model`)];
      }
    });
    node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
      item.addEventListener('keyup', this.changeInput.bind(this));
    });
  }
  private SetValue(key: string, value: any, elUpdate = null) {
    for (let node of this.nodes) {
      node.elNode.querySelectorAll(`[node\\:model="${key}"]`).forEach((item: any) => {
        if (item != elUpdate) {
          if (item.tagName == 'SPAN' || item.tagName == 'DIV') {
            item.innerHTML = `${value}`;
          } else {
            item.value = value;
          }
        }
      });
      node.dispatch(this.Event.dataChange, { key, value, elUpdate });
      node.dispatch(this.Event.change, { key, value, elUpdate });
    }
  }
  public Set(key: string, value: any, elUpdate = null) {
    this.data[key] = value;
    setTimeout(() => {
      this.SetValue(key, value, elUpdate);
    }, 100);
  }
  public Get(key: string) {
    return this.data[key];
  }
  public changeInput(e: any) {
    this.Set(e.target.getAttribute(`node:model`), e.target.value, e.target);
  }

  public UpdateUI() {
    setTimeout(() => {
      for (let node of this.nodes) {
        node.elNode.querySelectorAll(`[node\\:model]`).forEach((item: any) => {
          if (item.tagName == 'SPAN' || item.tagName == 'DIV') {
            item.innerHTML = `${this.data[item.getAttribute(`node:model`)]}`;
          } else {
            item.value = this.data[item.getAttribute(`node:model`)];
          }
        });
      }
    }, 100);
  }
  public load(data: any) {
    this.data = {};

    for (let key of Object.keys(this.node.properties)) {
      this.data[key] = (data?.[key] ?? (this.node.properties[key]?.default ?? ""));
    }
  }
  public toJson() {
    let rs: any = {};
    for (let key of Object.keys(this.node.properties)) {
      rs[key] = this.Get(key);
    }
    return rs;
  }
}
