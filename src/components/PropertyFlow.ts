import { WorkerFlow } from "../WorkerFlow";
import { BaseFlow } from "../core/BaseFlow";
import { DataFlow } from "../core/DataFlow";

export class PropertyFlow extends BaseFlow<WorkerFlow> {
  private lastData: DataFlow | undefined;
  public constructor(parent: WorkerFlow) {
    super(parent);
    this.Id = this.parent.getUuid();
    this.elNode = this.parent.elNode.querySelector('.workerflow-property__list') || this.elNode;
    this.elNode.innerHTML = "";
  }
  public PropertyInfo(data: DataFlow) {
    if (this.lastData && this.lastData === data) return;
    this.lastData = data;
    this.RenderUI();
  }
  private RenderUI() {
    this.elNode.innerHTML = "";
    if (this.lastData) {
      for (let item of Object.keys(this.lastData.node.properties)) {
        let propertyInfo = document.createElement('div');
        propertyInfo.classList.add('workerflow-property__item');
        let elLabel = document.createElement('span');
        elLabel.innerHTML = item;
        let elItem = document.createElement('input');
        elItem.setAttribute('node:model', item);
        propertyInfo.appendChild(elLabel);
        propertyInfo.appendChild(elItem);
        this.elNode.appendChild(propertyInfo);
      }
      this.lastData?.BindEvent(this);
    }
  }
}
