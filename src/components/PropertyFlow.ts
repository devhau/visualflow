import { WorkerFlow } from "../WorkerFlow";
import { BaseFlow } from "./BaseFlow";
import { DataFlow } from "./DataFlow";

export class PropertyFlow extends BaseFlow<WorkerFlow> {
  private lastData: DataFlow | undefined;
  public constructor(parent: WorkerFlow) {
    super(parent);
    this.elNode = this.parent.elNode.querySelector('.workerflow-property__list') || this.elNode;
    this.elNode.innerHTML = "";
  }
  public PropertyInfo(data: DataFlow) {
    if (this.lastData && this.lastData === data) return;
    if (this.lastData) {
      this.lastData.RemoveEvent(this);
    }
    this.lastData = data;
    this.RenderUI();
  }
  private RenderUI() {
    this.elNode.innerHTML = "";
    if (this.lastData) {
      for (let item of Object.keys(this.lastData.node.properties)) {
        let elItem = document.createElement('input');
        elItem.setAttribute('node:model', item);
        this.elNode.appendChild(elItem);
      }
      this.lastData.BindEvent(this);
    }
  }
}
