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
  public CheckKey(key: string) {
    return this.data.Get('key') == key;
  }
  public elContent: Element | null | undefined;
  public arrLine: Line[] = [];
  private option: any = {};

  public constructor(parent: DesginerView, private keyNode: any, data: any = {}) {
    super(parent);
    this.option = this.parent.main.getControlNodeByKey(keyNode);
    this.properties = this.option?.properties;
    this.data.InitData(data, this.properties);
    this.data.on(EventEnum.dataChange, this.renderUI.bind(this));
    this.elNode.classList.add('vs-node');

    if (this.option.class) {
      this.elNode.classList.add(this.option.class);
    }
    this.parent.elCanvas.appendChild(this.elNode);
    this.elNode.setAttribute('node-id', this.GetId());
    this.elNode.addEventListener('mousedown', () => this.parent.setNodeChoose(this));
    this.elNode.addEventListener('touchstart', () => this.parent.setNodeChoose(this));
    this.parent.data.Append('nodes', this.data);
    this.renderUI();
  }
  private renderUI() {
    this.elNode.setAttribute('style', `display:none;`);
    this.elNode.innerHTML = `
      <div class="node-left">
        <div class="node-dot" node="4000"></div>
      </div>
      <div class="node-container">
        <div class="node-top">
          <div class="node-dot" node="1000"></div>
        </div>
        <div class="node-content">${this.option.html}</div>
        <div class="node-bottom">
          <div class="node-dot" node="2000"></div>
        </div>
      </div>
      <div class="node-right">
        <div class="node-dot"  node="3000"></div>
      </div>
    `;
    this.elContent = this.elNode.querySelector('.node-content');
    this.UpdateUI();
  }
  public updatePosition(x: any, y: any, iCheck = false) {
    if (this.elNode) {
      if (iCheck) {
        if (x !== this.getX()) {
          this.setX(x);
        }
        if (y !== this.getY()) {
          this.setX(y);
        }
      } else {
        this.setY((this.elNode.offsetTop - y));
        this.setX((this.elNode.offsetLeft - x));
      }
    }
  }
  public Active(flg: any = true) {
    if (flg) {
      this.elNode.classList.add('active');
    } else {
      this.elNode.classList.remove('active');
    }
  }
  public RemoveLine(line: Line) {
    var index = this.arrLine.indexOf(line);
    if (index > -1) {
      this.arrLine.splice(index, 1);
    }
    return this.arrLine;
  }
  public AddLine(line: Line) {
    this.arrLine = [...this.arrLine, line];
  }
  public getPostisionDot(index: number = 0) {
    let elDot: any = this.elNode?.querySelector(`.node-dot[node="${index}"]`);
    if (elDot) {
      let y = (this.elNode.offsetTop + elDot.offsetTop + 10);
      let x = (this.elNode.offsetLeft + elDot.offsetLeft + 10);
      return { x, y };
    }
    return {};
  }
  public UpdateUI() {
    this.elNode.setAttribute('style', `top: ${this.getY()}px; left: ${this.getX()}px;`);
    this.arrLine.forEach((item) => {
      item.UpdateUI();
    })
  }
  public delete(isRemoveParent = true) {
    this.arrLine.forEach((item) => item.delete(this));
    this.data.delete();
    this.elNode.removeEventListener('mousedown', () => this.parent.setNodeChoose(this));
    this.elNode.removeEventListener('touchstart', () => this.parent.setNodeChoose(this));
    this.elNode.remove();
    this.arrLine = [];
    if (isRemoveParent)
      this.parent.RemoveNode(this);
    this.dispatch(EventEnum.change, {});
  }
}
