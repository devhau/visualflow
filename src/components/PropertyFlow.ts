import { WorkerFlow } from "../WorkerFlow";
import { BaseFlow } from "./BaseFlow";
import { DataFlow } from "./DataFlow";

export class PropertyFlow extends BaseFlow<WorkerFlow> {

  public constructor(parent: WorkerFlow) {
    super(parent);
    this.elNode = this.parent.elNode.querySelector('.workerflow-property__list') || this.elNode;
    this.elNode.innerHTML = "";
  }
  public PropertyInfo(properties: any, data: DataFlow) {

  }
}
