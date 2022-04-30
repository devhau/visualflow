import { FlowCore, IMain } from "../core/BaseFlow";
import { EventEnum, PropertyEnum } from "../core/Constant";
import { DesginerView_Event } from "./DesginerView_Event";
import { Line } from "./Line";
import { Node } from "./Node";

export class DesginerView extends FlowCore {
  /**
   * GET SET for Data
   */
  public getZoom() {
    return this.data.Get('zoom');
  }
  public setZoom(value: any) {
    return this.data.Set('zoom', value, this);
  }
  public getY() {
    return this.data.Get('y');
  }
  public setY(value: any) {
    return this.data.Set('y', value, this);
  }
  public getX() {
    return this.data.Get('x');
  }
  public setX(value: any) {
    return this.data.Set('x', value, this);
  }
  private readonly view_event: DesginerView_Event | undefined;

  private lineChoose: Line | undefined;
  public setLineChoose(node: Line | undefined): void {
    if (this.lineChoose) this.lineChoose.Active(false);
    this.lineChoose = node;
    if (this.lineChoose) {
      this.lineChoose.Active();
      this.setNodeChoose(undefined);
    }
  }
  public getLineChoose(): Line | undefined {
    return this.lineChoose;
  }
  private nodes: Node[] = [];
  private nodeChoose: Node | undefined;
  public setNodeChoose(node: Node | undefined): void {
    if (this.nodeChoose) this.nodeChoose.Active(false);
    this.nodeChoose = node;
    if (this.nodeChoose) {
      this.nodeChoose.Active();
      this.setLineChoose(undefined);
      this.dispatch(EventEnum.showProperty, { data: this.nodeChoose.data });
    } else {
      this.dispatch(EventEnum.showProperty, { data: this.data });
    }

  }
  public getNodeChoose(): Node | undefined {
    return this.nodeChoose;
  }
  public AddNode(keyNode: string, data: any = {}): Node {
    return this.InsertNode(new Node(this, keyNode, data));
  }
  public InsertNode(node: Node): Node {
    this.nodes = [...this.nodes, node];
    return node;
  }
  /**
   * Varibute
  */
  public elCanvas: HTMLElement = document.createElement('div');
  public constructor(elNode: HTMLElement, public main: IMain) {
    super();
    this.elNode = elNode;
    let properties: any = this.main.getPropertyByKey(PropertyEnum.main);
    this.data.InitData({}, properties);
    this.RenderUI();
    this.UpdateUI();
    this.on(EventEnum.dataChange, this.RenderUI.bind(this));
    this.view_event = new DesginerView_Event(this);
  }
  public updateView(x: any, y: any, zoom: any) {
    this.elCanvas.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
  }
  public UpdateUI() {
    setTimeout(() => {
      this.updateView(this.getX(), this.getY(), this.getZoom());
    });
  }
  public RenderUI() {
    this.elNode.innerHTML = '';
    this.elNode.classList.remove('desginer-view')
    this.elCanvas.classList.remove("desginer-canvas");
    this.elNode.classList.add('desginer-view')
    this.elCanvas.classList.add("desginer-canvas");
    this.elNode.appendChild(this.elCanvas);
    this.elNode.tabIndex = 0;
    this.UpdateUI();
  }
  public CalcX(number: any) {
    return number * (this.elCanvas.clientWidth / (this.elNode?.clientWidth * this.getZoom()));
  }
  public CalcY(number: any) {
    return number * (this.elCanvas.clientHeight / (this.elNode?.clientHeight * this.getZoom()));
  }
  public GetAllNode(): Node[] {
    return this.nodes || [];
  }
  public GetNodeById(id: string): Node | undefined {
    return this.GetAllNode().filter(node => node.GetId() == id)?.[0];
  }

  checkOnlyNode(key: string) {
    return (this.main.getControlByKey(key).onlyNode) && this.nodes.filter(item => item.CheckKey(key)).length > 0;
  }
}
