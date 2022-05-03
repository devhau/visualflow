import { FlowCore, IMain } from "../core/BaseFlow";
import { EventEnum, PropertyEnum } from "../core/Constant";
import { DataFlow } from "../core/DataFlow";
import { DesginerView_Event } from "./DesginerView_Event";
import { DesginerView_Toolbar } from "./DesginerView_Toolbar";
import { Line } from "./Line";
import { Node } from "./Node";

export const Zoom = {
  max: 1.6,
  min: 0.6,
  value: 0.1,
  default: 1
}
export class DesginerView extends FlowCore {

  /**
   * GET SET for Data
   */
  public getZoom() {
    return +this.data.Get('zoom');
  }
  public setZoom(value: any) {
    return this.data.Set('zoom', value, this);
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
  private group: any[] = [];
  public GetGroupName(): any[] {
    return this.group.map((item) => this.GetDataById(item)?.Get('name'));
  }
  public BackGroup() {
    this.group.splice(0, 1);
    this.toolbar.renderPathGroup();
    this.RenderUI();
  }
  public CurrentGroup() {
    return this.group?.[0] ?? 'root';
  }
  public openGroup(id: any) {
    this.group = [id, ...this.group];
    this.toolbar.renderPathGroup();
    this.RenderUI();
  }
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
  public AddNodeItem(data: any): Node {
    return this.AddNode(data.Get('key'), data);
  }
  public AddNode(keyNode: string, data: any = {}): Node {
    return this.InsertNode(new Node(this, keyNode, data));
  }
  public InsertNode(node: Node): Node {
    this.nodes = [...this.nodes, node];
    return node;
  }
  public RemoveNode(node: Node) {
    var index = this.nodes.indexOf(node);
    this.data.Remove('nodes', node);
    if (index > -1) {
      this.nodes.splice(index, 1);
    }
    return this.nodes;
  }
  public ClearNode() {
    this.nodes?.forEach(item => item.delete(false));
    this.nodes = [];
  }
  public GetDataAllNode(): any[] {
    return (this.data.Get('nodes') ?? []);
  }
  public GetDataNode(): any[] {
    return this.GetDataAllNode().filter((item: DataFlow) => item.Get("group") === this.CurrentGroup());
  }
  /**
   * Varibute
  */
  public elCanvas: HTMLElement = document.createElement('div');
  public elToolbar: HTMLElement = document.createElement('div');
  public toolbar: DesginerView_Toolbar;
  public $lock: boolean = true;
  private zoom_last_value: any = 1;
  public constructor(elNode: HTMLElement, public main: IMain) {
    super();
    this.elNode = elNode;
    let properties: any = this.main.getPropertyByKey(PropertyEnum.main);
    this.data.InitData({}, properties);
    this.elNode.innerHTML = '';
    this.elNode.classList.remove('desginer-view')
    this.elCanvas.classList.remove("desginer-canvas");
    this.elNode.classList.add('desginer-view')
    this.elCanvas.classList.add("desginer-canvas");
    this.elToolbar.classList.add("desginer-toolbar");
    this.elNode.appendChild(this.elCanvas);
    this.elNode.appendChild(this.elToolbar);
    this.elNode.tabIndex = 0;
    this.RenderUI();
    this.on(EventEnum.dataChange, this.RenderUI.bind(this));
    new DesginerView_Event(this);
    this.toolbar = new DesginerView_Toolbar(this);
  }

  public updateView(x: any, y: any, zoom: any) {
    this.elCanvas.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
  }
  public UpdateUI() {
    this.updateView(this.getX(), this.getY(), this.getZoom());
  }
  public RenderUI(detail: any = {}) {
    if (detail.sender && detail.sender instanceof Node) return;
    if (detail.sender && detail.sender instanceof DesginerView) {
      this.UpdateUI();
      return;
    }
    this.ClearNode();
    this.GetDataNode().forEach((item: any) => {
      this.AddNodeItem(item);
    });
    this.GetAllNode().forEach((item: Node) => {
      item.RenderLine();
    })
    this.UpdateUI();
  }
  public Open($data: DataFlow) {
    this.data = $data;
    this.$lock = false;
    this.group = [];
    this.toolbar.renderPathGroup();
    this.BindDataEvent();
    this.RenderUI();
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

  public GetDataById(id: string): DataFlow | null {
    return this.GetDataAllNode().filter((item) => item.Get('id') === id)?.[0];
  }
  checkOnlyNode(key: string) {
    return (this.main.getControlByKey(key).onlyNode) && this.nodes.filter(item => item.CheckKey(key)).length > 0;
  }
  public zoom_refresh(flg: any = 0) {
    let temp_zoom = flg == 0 ? Zoom.default : (this.getZoom() + Zoom.value * flg);
    if (Zoom.max >= temp_zoom && temp_zoom >= Zoom.min) {
      this.setX((this.getX() / this.zoom_last_value) * temp_zoom);
      this.setY((this.getY() / this.zoom_last_value) * temp_zoom);
      this.zoom_last_value = temp_zoom;
      this.setZoom(this.zoom_last_value);
    }
  }
  public zoom_in() {
    this.zoom_refresh(1);
  }
  public zoom_out() {
    this.zoom_refresh(-1);
  }
  public zoom_reset() {
    this.zoom_refresh(0);
  }
}
