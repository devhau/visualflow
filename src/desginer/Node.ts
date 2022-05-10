import { BaseFlow } from "../core/BaseFlow";
import { Line } from "./Line";
import { DesginerView } from "./DesginerView";
import { EventEnum } from "../core/Constant";
import { DataFlow } from "../core/DataFlow";
import { DataView } from "../core/Editor";

const geval = eval;
export class Node extends BaseFlow<DesginerView> {
  /**
   * GET SET for Data
   */
  public getName() {
    return this.data.Get('name');
  }
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
  public getDataLine() {
    return this.data.Get('lines') ?? [];
  }
  public checkLineExists(fromIndex: number, to: Node, toIndex: Number) {
    return this.arrLine.filter((item: Line) => {
      if (!item.temp && item.to == to && item.toIndex == toIndex && item.fromIndex == fromIndex) {
        return true;
      }
      if (!item.temp && item.from == to && item.fromIndex == toIndex && item.toIndex == fromIndex) {
        return true;
      }
      return false
    }).length > 0;
  }
  public elContent: Element | null | undefined;
  public arrLine: Line[] = [];
  private option: any = {};
  private arrDataView: DataView[] = [];
  public constructor(parent: DesginerView, private keyNode: any, data: any = {}) {
    super(parent);
    this.option = this.parent.main.getControlNodeByKey(keyNode);
    this.properties = this.option?.properties;
    if (data instanceof DataFlow) {
      this.data = data;
    } else {
      this.data.InitData(data, this.properties);
      this.parent.data.Append('nodes', this.data);
    }
    this.data.on(EventEnum.dataChange, this.renderUI.bind(this));
    this.elNode.classList.add('vs-node');

    if (this.option.class) {
      this.elNode.classList.add(this.option.class);
    }
    this.parent.elCanvas.appendChild(this.elNode);
    this.elNode.setAttribute('node-id', this.GetId());
    this.elNode.addEventListener('mousedown', () => this.parent.setNodeChoose(this));
    this.elNode.addEventListener('touchstart', () => this.parent.setNodeChoose(this));
    this.renderUI();
  }
  public getOption() {
    return this.option;
  }
  private renderUI() {
    if (this.elNode.contains(document.activeElement)) return;
    this.elNode.setAttribute('style', `display:none;`);
    this.elNode.innerHTML = `
      <div class="node-left"></div>
      <div class="node-container">
        <div class="node-top"></div>
        <div class="node-content">
        <div class="title">${this.option.icon} ${this.getName()}</div>
        <div class="body">${this.option.html}</div>
        </div>
        <div class="node-bottom"></div>
      </div>
      <div class="node-right"></div>
    `;
    const addNodeDot = (num: number | null | undefined, start: number, query: string) => {
      if (num) {
        let nodeQuery = this.elNode.querySelector(query);
        if (nodeQuery) {
          nodeQuery.innerHTML = '';
          for (let i: number = 0; i < num; i++) {
            let nodeDot = document.createElement('div');
            nodeDot.classList.add('node-dot');
            nodeDot.setAttribute('node', `${start + i}`);
            nodeQuery.appendChild(nodeDot);
          }
        }
      }
    }
    addNodeDot(this.option?.dot?.left, 1000, '.node-left');
    addNodeDot(this.option?.dot?.top, 2000, '.node-top');
    addNodeDot(this.option?.dot?.bottom, 3000, '.node-bottom');
    addNodeDot(this.option?.dot?.right, 4000, '.node-right');

    this.elContent = this.elNode.querySelector('.node-content .body');
    this.UpdateUI();
    geval(`(node,view)=>{${this.option.script}}`)(this, this.parent);
    this.arrDataView.forEach((item) => item.unBindData());
    if (this.elContent)
      this.arrDataView = DataView.BindView(this.data, this.elContent);
  }
  public openGroup() {
    if (this.CheckKey('node_group')) {
      this.parent.openGroup(this.GetId());
    }
  }
  public updatePosition(x: any, y: any, iCheck = false) {
    if (this.elNode) {
      let tempx = x;
      let tempy = y;
      if (!iCheck) {
        tempy = (this.elNode.offsetTop - y);
        tempx = (this.elNode.offsetLeft - x);
      }
      if (tempx !== this.getX()) {
        this.setX(tempx);
      }
      if (tempy !== this.getY()) {
        this.setY(tempy);
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
  public delete(isClearData = true) {
    this.arrLine.forEach((item) => item.delete(this, isClearData));
    if (isClearData)
      this.data.delete();
    else {
      this.data.removeListener(EventEnum.dataChange, this.renderUI.bind(this));
      this.RemoveDataEvent();
    }
    this.elNode.removeEventListener('mousedown', () => this.parent.setNodeChoose(this));
    this.elNode.removeEventListener('touchstart', () => this.parent.setNodeChoose(this));
    this.elNode.remove();
    this.arrLine = [];
    if (isClearData)
      this.parent.RemoveNode(this);
    this.dispatch(EventEnum.change, {});
  }
  public RenderLine() {
    this.getDataLine().forEach((item: DataFlow) => {
      let nodeFrom = this;
      let nodeTo = this.parent.GetNodeById(item.Get('to'));
      let toIndex = item.Get('toIndex');
      let fromIndex = item.Get('fromIndex');
      new Line(nodeFrom, fromIndex, nodeTo, toIndex, item).UpdateUI();
    });
  }
}
