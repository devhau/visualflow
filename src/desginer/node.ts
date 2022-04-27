import { BaseFlow } from "../core/BaseFlow";
import { getUuid } from "../core/Utils";
import { Line } from "./Line";
import { DesginerView } from "./DesginerView";
import { EventEnum } from "../core/Constant";

const geval = eval;
export class Node extends BaseFlow<DesginerView> {
  /**
   * GET SET for Data
   */
  public getY() {
    return +this.data.Get('y');
  }
  public setY(value: any) {
    return this.data.Set('y', value, this);
  }
  public getX() {
    return +this.data.Get('x');
  }
  public setX(value: any) {
    return this.data.Set('x', value, this);
  }
  public elContent: Element | null | undefined;
  public arrLine: Line[] = [];
  private option: any = {};
  public constructor(parent: DesginerView, private keyNode: any, data: any = {}) {
    super(parent);
    this.option = this.parent.option.getControlNodeByKey(keyNode);
    this.properties = this.option.properties;
    this.data.InitData(data, this.properties);
    this.onSafe(EventEnum.dataChange, () => this.renderUI());
    this.elNode.classList.add('vs-node');

    if (this.option.class) {
      this.elNode.classList.add(this.option.class);
    }
    this.parent.elCanvas.appendChild(this.elNode);
    this.renderUI();
  }
  private renderUI() {
    this.elNode.innerHTML = `
      <div class="node-left">
        <div class="node-dot"></div>
      </div>
      <div class="node-container">
        <div class="node-top">
          <div class="node-dot"></div>
        </div>
        <div class="node-content"></div>
        <div class="node-bottom">
          <div class="node-dot"></div>
        </div>
      </div>
      <div class="node-right">
        <div class="node-dot"></div>
      </div>
    `;
    this.elContent = this.elNode.querySelector('.node-content');
  }
  public UpdateUI() {
    this.elNode.setAttribute('style', `top: ${this.getY()}px; left: ${this.getX()}px;`);
    this.arrLine.forEach((item) => {
      item.UpdateUI();
    })
  }
}
