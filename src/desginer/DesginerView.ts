import { DataFlow, FlowCore, IMain, EventEnum, PropertyEnum, ScopeRoot } from "../core/index";
import { DesginerView_Event } from "./DesginerView_Event";
import { Line } from "./Line";
import { NodeItem } from "./NodeItem";

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
    return +this.getDataGroup().Get('zoom');
  }
  public setZoom(value: any) {
    return this.getDataGroup().Set('zoom', value, this);
  }
  public getY() {
    return +this.getDataGroup().Get('y');
  }
  public setY(value: any) {
    return this.getDataGroup().Set('y', value, this);
  }
  public getX() {
    return +this.getDataGroup().Get('x');
  }
  public setX(value: any) {
    return this.getDataGroup().Set('x', value, this);
  }
  private groupData: DataFlow | undefined;
  private lastGroupName: string = "";
  private getDataGroup(): DataFlow {
    if (this.$lock) return this.data;
    // cache groupData
    if (this.lastGroupName === this.CurrentGroup()) return this.groupData ?? this.data;
    this.lastGroupName = this.CurrentGroup();
    let groups = this.data.Get('groups');
    this.groupData = groups?.filter((item: DataFlow) => item.Get('group') == this.lastGroupName)?.[0];
    if (!this.groupData) {
      this.groupData = new DataFlow(this.main, {
        key: PropertyEnum.groupCavas,
        group: this.lastGroupName
      });
      this.data.Append('groups', this.groupData);
    } else {
    }
    let dataGroup = this.GetDataById(this.lastGroupName);
    if (dataGroup) {
      dataGroup.onSafe(`${EventEnum.dataChange}_name`, () => {
        this.changeGroup();
      });
    }

    return this.groupData;
  }
  private group: any[] = [];
  public GetGroupName(): any[] {
    return [...this.group.map((item) => ({ id: item, text: this.GetDataById(item)?.Get('name') })), { id: ScopeRoot, text: ScopeRoot }];
  }
  public BackGroup(id: any = null) {
    let index = 1;
    if (id) {
      index = this.group.indexOf(id);
      if (index < 0) index = 0;
    }
    if (index)
      this.group.splice(0, index);
    else this.group = [];
    this.RenderUI();
    this.changeGroup();
  }
  public CurrentGroup() {
    let name = this.group?.[0];
    if (name && name != '') {
      return name;
    }
    return 'root';
  }

  public CurrentGroupData() {
    return this.GetDataById(this.CurrentGroup()) ?? this.data;
  }
  public changeGroup() {
    setTimeout(() => {
      this.main.dispatch(EventEnum.groupChange, {
        group: this.GetGroupName()
      });
    });
  }
  public openGroup(id: any) {
    this.group = [id, ...this.group];
    this.RenderUI();
    this.changeGroup();;
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
  private nodes: NodeItem[] = [];
  private nodeChoose: NodeItem | undefined;
  public setNodeChoose(node: NodeItem | undefined): void {
    if (this.nodeChoose) this.nodeChoose.Active(false);
    this.nodeChoose = node;
    if (this.nodeChoose) {
      this.nodeChoose.Active();
      this.setLineChoose(undefined);
      this.dispatch(EventEnum.showProperty, { data: this.nodeChoose.data });
    } else {
      this.dispatch(EventEnum.showProperty, { data: this.CurrentGroupData() });
    }
  }
  public getNodeChoose(): NodeItem | undefined {
    return this.nodeChoose;
  }
  public AddNodeItem(data: any): NodeItem {
    return this.AddNode(data.Get('key'), data);
  }
  public AddNode(keyNode: string, data: any = {}): NodeItem {
    return this.InsertNode(new NodeItem(this, keyNode, data));
  }
  public InsertNode(node: NodeItem): NodeItem {
    this.nodes = [...this.nodes, node];
    return node;
  }
  public RemoveNode(node: NodeItem) {
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
    return (this.data?.Get('nodes') ?? []);
  }
  public GetDataNode(): any[] {
    return this.GetDataAllNode().filter((item: DataFlow) => item.Get("group") === this.CurrentGroup());
  }
  /**
   * Varibute
  */
  public elCanvas: HTMLElement = document.createElement('div');
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
    this.elNode.appendChild(this.elCanvas);
    this.elNode.tabIndex = 0;
    new DesginerView_Event(this);
    this.on(EventEnum.dataChange, this.RenderUI.bind(this));
    this.on(EventEnum.showProperty, (data: any) => { main.dispatch(EventEnum.showProperty, data); });
    this.main.on(EventEnum.openProject, (item: any) => {
      this.Open(item.data);
    });
    this.main.on(EventEnum.zoom, ({ zoom }: any) => {
      if (zoom == 0) {
        this.zoom_reset();
      } else if (zoom == 1) {
        this.zoom_out();
      } else if (zoom == -1) {
        this.zoom_in();
      }
      this.UpdateUI();
    });
    this.main.on(EventEnum.setGroup, ({ groupId }: any) => {
      this.BackGroup(groupId);
    });
    this.changeGroup();
  }

  public updateView(x: any, y: any, zoom: any) {
    this.elCanvas.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
  }
  public UpdateUI() {
    this.updateView(this.getX(), this.getY(), this.getZoom());
  }
  public RenderUI(detail: any = {}) {
    if (detail.sender && detail.sender instanceof NodeItem) return;
    if (detail.sender && detail.sender instanceof DesginerView) {
      this.UpdateUI();
      return;
    }
    this.ClearNode();
    this.GetDataNode().forEach((item: any) => {
      this.AddNodeItem(item);
    });
    this.GetAllNode().forEach((item: NodeItem) => {
      item.RenderLine();
    })
    this.UpdateUI();
  }
  public Open($data: DataFlow) {
    if ($data == this.data) {
      this.RenderUI();
      return;
    }
    this.data?.dispatch(EventEnum.dataChange, (detail: any) => this.dispatch(EventEnum.dataChange, detail));
    this.data = $data;
    this.data.on(EventEnum.dataChange, (detail: any) => this.dispatch(EventEnum.dataChange, detail));
    this.$lock = false;
    this.lastGroupName = '';
    this.groupData = undefined;
    this.group = [];
    this.RenderUI();
    this.changeGroup();
  }
  public CalcX(number: any) {
    return number * (this.elCanvas.clientWidth / (this.elNode?.clientWidth * this.getZoom()));
  }
  public CalcY(number: any) {
    return number * (this.elCanvas.clientHeight / (this.elNode?.clientHeight * this.getZoom()));
  }
  public GetAllNode(): NodeItem[] {
    return this.nodes || [];
  }
  public GetNodeById(id: string): NodeItem | undefined {
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
