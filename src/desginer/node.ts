import { BaseFlow } from "../core/BaseFlow";
import { getUuid } from "../core/Utils";
import { Line } from "./line";
import { DesginerView } from "./view";

const geval = eval;
export class Node extends BaseFlow<DesginerView> {
  /**
   * GET SET for Data
   */
  public getY() {
    return +this.data.Get('y');
  }
  public getX() {
    return +this.data.Get('x');
  }
  public setY(value: any) {
    return +this.data.Set('y', value, this);
  }
  public setX(value: any) {
    return +this.data.Set('x', value, this);
  }
  public constructor(parent: DesginerView, private option: any, data: any = {}) {
    super(parent);
    this.properties = option?.properties || {};
    this.data.load(data);
    this.onSafe(this.data.Event.dataChange, () => this.renderUI());
    this.elNode.classList.add('node-flow');
    if (this.option.class) {
      this.elNode.classList.add(this.option.class);
    }
    this.parent.elCanvas.appendChild(this.elNode);

    this.renderUI();

  }
  private renderUI() {
    this.elNode.innerHTML = `
      <div class="node-left"></div>
      <div class="node-container">
        <div class="node-top"></div>
        <div class="node-content"></div>
        <div class="node-bottom"></div>
      </div>
      <div class="node-right"></div>
    `;
  }
}
