import { WorkerFlow } from "../WorkerFlow";
import { BaseFlow } from "./BaseFlow";
import { LineFlow } from "./LineFlow";
import { NodeFlow } from "./NodeFlow";

export enum MoveType {
  None = 0,
  Node = 1,
  Canvas = 2,
  Line = 3,
}
export class ViewFlow extends BaseFlow<WorkerFlow> {
  public elCanvas: HTMLElement;
  public flgDrap: boolean = false;
  public flgMove: boolean = false;
  private moveType: MoveType = MoveType.None;
  private zoom_max: number = 1.6;
  private zoom_min: number = 0.5;
  private zoom_value: number = 0.1;
  private zoom_last_value: number = 1;
  private pos_x: number = 0;
  private pos_y: number = 0;
  private mouse_x: number = 0;
  private mouse_y: number = 0;
  private nodes: NodeFlow[] = [];
  private lineSelected: LineFlow | null = null;
  private nodeSelected: NodeFlow | null = null;
  public nodeOver: NodeFlow | null = null;
  private dotSelected: NodeFlow | null = null;
  private tempLine: LineFlow | null = null;
  private timeFastClick: number = 0;
  private tagIngore = ['input', 'button', 'a', 'textarea'];
  private getX() {
    return +this.data.Get(this.properties.canvas_x.key)
  }
  private getY() {
    return +this.data.Get(this.properties.canvas_y.key)
  }
  private getZoom() {
    return this.data.Get(this.properties.zoom.key);
  }
  public properties = {
    name: {
      key: "name",
    },
    zoom: {
      key: "zoom",
      default: 1,
      type: "number"
    },
    canvas_x: {
      key: "canvas_x",
      default: 0,
      type: "number"
    },
    canvas_y: {
      key: "canvas_y",
      default: 0,
      type: "number"
    }
  };
  public readonly Event = {
    change: "change",
    selected: "Selected",
    updateView: "updateView"
  };
  public constructor(parent: WorkerFlow) {
    super(parent);
    this.elNode = this.parent.elNode.querySelector('.workerflow-desgin .workerflow-view') || this.elNode;
    this.elCanvas = document.createElement('div');
    this.elCanvas.classList.add("workerflow-canvas");
    this.elNode.appendChild(this.elCanvas);
    this.elNode.tabIndex = 0;
    this.addEvent();
    this.Reset();
    this.data.InitData(null, this.properties);
    this.on(this.data.Event.dataChange, (item: any) => {
      this.updateView();
    });
    this.updateView();
  }
  public getOption(keyNode: any) {
    return this.parent.getOption(keyNode);
  }
  private dropEnd(ev: any) {
    ev.preventDefault();
    if (Object.keys(this.parent.modules).length == 0) {
      this.parent.new();
    }
    let keyNode: string | null = '';
    if (ev.type === "touchend") {
      keyNode = this.parent.dataNodeSelect;
    } else {
      keyNode = ev.dataTransfer.getData("node");
    }
    let option = this.getOption(keyNode);
    if (option && option.onlyNode) {
      if (this.nodes.filter((item) => item.checkNode(keyNode)).length > 0) {
        return;
      }
    }
    let node = this.AddNode(option);

    let e_pos_x = 0;
    let e_pos_y = 0;
    if (ev.type === "touchmove") {
      e_pos_x = ev.touches[0].clientX;
      e_pos_y = ev.touches[0].clientY;
    } else {
      e_pos_x = ev.clientX;
      e_pos_y = ev.clientY;
    }
    let x = this.CalcX(this.elCanvas.getBoundingClientRect().x - e_pos_x);
    let y = this.CalcY(this.elCanvas.getBoundingClientRect().y - e_pos_y);

    node.updatePosition(x, y);

  }
  public toJson() {
    let nodes = this.nodes.map((item) => item.toJson());
    return {
      Id: this.Id,
      data: this.data.toJson(),
      nodes
    }
  }
  public load(data: any) {
    this.Reset();
    if (!data) {
      data = {};
    }
    if (!data.Id) {
      data.Id = this.parent.getUuid();
    }
    if (!data.data) {
      data.data = {};
    }
    if (!data.data[this.properties.name.key]) {
      data.data[this.properties.name.key] = `project-${this.parent.getTime()}`;
    }
    this.Id = data.Id;
    this.data.load(data.data);
    this.data.UpdateUI();
    this.nodes = (data.nodes ?? []).map((item: any) => {
      return (new NodeFlow(this, "")).load(item);
    });
    (data.nodes ?? []).forEach((item: any) => {
      (item.line ?? []).forEach((line: any) => {
        let fromNode = this.getNodeById(line.fromNode);
        let toNode = this.getNodeById(line.toNode);
        let ouputIndex = line.ouputIndex ?? 0;
        if (fromNode && toNode) {
          this.AddLine(fromNode, toNode, ouputIndex);
        }
      })
    });
    this.updateView();
  }
  public Reset() {
    this.nodes.forEach((item) => item.delete(false));
    this.nodes = [];
    this.data.Set(this.properties.canvas_x.key, 0);
    this.data.Set(this.properties.canvas_y.key, 0);
    this.updateView();
  }
  public getNodeById(nodeId: string) {
    return this.nodes?.filter((item) => item.Id == nodeId)[0];
  }
  public updateView() {
    this.elCanvas.style.transform = "translate(" + this.getX() + "px, " + this.getY() + "px) scale(" + this.getZoom() + ")";
    this.dispatch(this.Event.updateView, { x: this.getX(), y: this.getY(), zoom: this.getZoom() });
  }
  private CalcX(number: any) {
    return number * (this.elCanvas.clientWidth / (this.elNode?.clientWidth * this.getZoom()));
  }
  private CalcY(number: any) {
    return number * (this.elCanvas.clientHeight / (this.elNode?.clientHeight * this.getZoom()));
  }
  private dragover(e: any) {
    e.preventDefault();
  }
  public UnSelectLine() {
    this.SelectLine(null);
  }
  public UnSelectDot() {
    this.SelectDot(null);
  }
  public UnSelectNode() {
    this.SelectNode(null);
  }
  public UnSelect() {
    this.UnSelectLine();
    this.UnSelectNode();
    this.UnSelectDot();
  }
  public SelectLine(node: LineFlow | null) {
    if (node == null) {
      if (this.lineSelected) {
        this.lineSelected.elPath?.classList.remove('active');
        this.lineSelected = null;
      }
    } else {
      this.UnSelect();
      this.lineSelected = node;
      this.lineSelected.elPath.classList.add('active');
    }

  }
  private flgSelectNode = false;
  public SelectNode(node: NodeFlow | null) {
    if (node == null) {
      if (this.nodeSelected) {
        this.nodeSelected.elNode?.classList.remove('active');
        this.nodeSelected = null;
      }
      if (!this.flgSelectNode)
        this.parent.PropertyInfo(this.data);
    } else {
      this.flgSelectNode = true;
      this.UnSelect();
      this.nodeSelected = node;
      this.nodeSelected.elNode?.classList.add('active');
      this.parent.PropertyInfo(this.nodeSelected.data);
      this.flgSelectNode = false;
    }
  }
  public SelectDot(node: NodeFlow | null) {
    if (node == null) {
      if (this.dotSelected) {
        this.dotSelected.elNode?.classList.remove('active');
        this.dotSelected = null;
      }
    } else {
      this.UnSelect();
      this.dotSelected = node;
      this.dotSelected.elNode?.classList.add('active');
    }
  }
  public RemoveNode(node: NodeFlow) {
    var index = this.nodes.indexOf(node);
    if (index > -1) {
      this.nodes.splice(index, 1);
    }
    return this.nodes;
  }
  public AddNode(option: any = null): NodeFlow {
    let node = new NodeFlow(this, option);
    this.nodes = [...this.nodes, node];
    return node;
  }
  public AddLine(fromNode: NodeFlow, toNode: NodeFlow, outputIndex: number = 0) {
    if (fromNode == toNode) return;
    if (fromNode.arrLine.filter((item) => {
      return item.toNode === toNode && item.outputIndex == outputIndex && item != this.tempLine;
    }).length > 0) {
      return;
    }
    return new LineFlow(this, fromNode, toNode, outputIndex);
  }
  public addEvent() {
    /* Mouse and Touch Actions */
    this.elNode?.addEventListener('mouseup', this.EndMove.bind(this));
    this.elNode?.addEventListener('mouseleave', this.EndMove.bind(this));
    this.elNode?.addEventListener('mousemove', this.Move.bind(this));
    this.elNode?.addEventListener('mousedown', this.StartMove.bind(this));

    this.elNode?.addEventListener('touchend', this.EndMove.bind(this));
    this.elNode?.addEventListener('touchmove', this.Move.bind(this));
    this.elNode?.addEventListener('touchstart', this.StartMove.bind(this));
    /* Context Menu */
    this.elNode?.addEventListener('contextmenu', this.contextmenu.bind(this));

    /* Drop Drap */
    this.elNode?.addEventListener('drop', this.dropEnd.bind(this));
    this.elNode?.addEventListener('dragover', this.dragover.bind(this));
    /* Zoom Mouse */
    this.elNode?.addEventListener('wheel', this.zoom_enter.bind(this));
    /* Delete */
    this.elNode?.addEventListener('keydown', this.keydown.bind(this));
  }
  public keydown(e: any) {
    if (e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey)) {
      e.preventDefault()
      if (this.nodeSelected != null) {
        this.nodeSelected.delete();
        this.nodeSelected = null;
      }
      if (this.lineSelected != null) {
        this.lineSelected.delete();
        this.lineSelected = null;
      }
    }
  }
  public zoom_enter(event: any) {
    if (event.ctrlKey) {
      event.preventDefault()
      if (event.deltaY > 0) {
        // Zoom Out
        this.zoom_out();
      } else {
        // Zoom In
        this.zoom_in();
      }
    }
  }
  public zoom_refresh() {
    this.data.Set(this.properties.canvas_x.key, (this.getX() / this.zoom_last_value) * this.getZoom());
    this.data.Set(this.properties.canvas_y.key, (this.getY() / this.zoom_last_value) * this.getZoom());
    this.zoom_last_value = this.getZoom();
    this.updateView();
  }
  public zoom_in() {
    if (this.getZoom() < this.zoom_max) {
      this.data.Set(this.properties.zoom.key, (this.getZoom() + this.zoom_value));
      this.zoom_refresh();
    }
  }
  public zoom_out() {
    if (this.getZoom() > this.zoom_min) {
      this.data.Set(this.properties.zoom.key, (this.getZoom() - this.zoom_value));
      this.zoom_refresh();
    }
  }
  public zoom_reset() {
    if (this.getZoom() != 1) {
      this.data.Set(this.properties.zoom.key, this.properties.zoom.default);
      this.zoom_refresh();
    }
  }

  public StartMove(e: any) {
    if (this.tagIngore.includes(e.target.tagName.toLowerCase())) {
      return;
    }
    this.timeFastClick = this.parent.getTime();
    if (e.target.classList.contains('main-path')) {
      return;
    }
    if (this.moveType == MoveType.None) {
      if (this.nodeSelected && this.parent.checkParent(e.target, this.nodeSelected.elNode)) {
        if (e.target.classList.contains('dot')) {
          if (this.parent.checkParent(e.target, this.nodeSelected.elNodeInputs)) {
            return;
          }
          this.moveType = MoveType.Line;
          this.tempLine = new LineFlow(this, this.nodeSelected, null);
          this.tempLine.outputIndex = +(e.target.getAttribute('node'));
        } else {
          this.moveType = MoveType.Node;
        }
      } else {
        this.moveType = MoveType.Canvas;
      }
    }
    if (e.type === "touchstart") {
      this.pos_x = e.touches[0].clientX;
      this.pos_y = e.touches[0].clientY;
    } else {
      this.pos_x = e.clientX;
      this.pos_y = e.clientY;
    }
    this.flgDrap = true;
    this.flgMove = false;
  }
  public Move(e: any) {
    if (!this.flgDrap) return;
    this.flgMove = true;
    let e_pos_x = 0;
    let e_pos_y = 0;
    if (e.type === "touchmove") {
      e_pos_x = e.touches[0].clientX;
      e_pos_y = e.touches[0].clientY;
    } else {
      e_pos_x = e.clientX;
      e_pos_y = e.clientY;
    }
    switch (this.moveType) {
      case MoveType.Canvas:
        {
          let x = this.getX() + this.CalcX(-(this.pos_x - e_pos_x))
          let y = this.getY() + this.CalcY(-(this.pos_y - e_pos_y))
          this.elCanvas.style.transform = "translate(" + x + "px, " + y + "px) scale(" + this.getZoom() + ")";
          break;
        }
      case MoveType.Node:
        {
          let x = this.CalcX(this.pos_x - e_pos_x);
          let y = this.CalcY(this.pos_y - e_pos_y);
          this.pos_x = e_pos_x;
          this.pos_y = e_pos_y;
          this.nodeSelected?.updatePosition(x, y);
          break;
        }
      case MoveType.Line:
        {
          if (this.tempLine) {
            let x = this.CalcX(this.elCanvas.getBoundingClientRect().x - e_pos_x);
            let y = this.CalcY(this.elCanvas.getBoundingClientRect().y - e_pos_y);
            this.tempLine.updateTo(this.elCanvas.offsetLeft - x, this.elCanvas.offsetTop - y);
            this.tempLine.toNode = this.nodeOver;
          }
          break;
        }
    }

    if (e.type === "touchmove") {
      this.mouse_x = e_pos_x;
      this.mouse_y = e_pos_y;
    }
  }
  public EndMove(e: any) {
    if (!this.flgDrap) return;
    //fix Fast Click
    if (((this.parent.getTime() - this.timeFastClick) < 300) || !this.flgMove) {
      if (this.moveType === MoveType.Canvas && this.flgDrap)
        this.UnSelect();
      this.moveType = MoveType.None;
      this.flgDrap = false;
      this.flgMove = false;
      return;
    }
    if (this.tempLine && this.moveType == MoveType.Line) {
      if (this.tempLine.toNode && this.tempLine.toNode.checkInput()) {
        this.AddLine(this.tempLine.fromNode, this.tempLine.toNode, this.tempLine.outputIndex);
      }
      this.tempLine.delete();
      this.tempLine = null;
    }
    let e_pos_x = 0;
    let e_pos_y = 0;
    if (e.type === "touchend") {
      e_pos_x = this.mouse_x;
      e_pos_y = this.mouse_y;
    } else {
      e_pos_x = e.clientX;
      e_pos_y = e.clientY;
    }
    if (this.moveType === MoveType.Canvas) {
      this.data.Set(this.properties.canvas_x.key, this.getX() + this.CalcX(-(this.pos_x - e_pos_x)));
      this.data.Set(this.properties.canvas_y.key, this.getY() + this.CalcY(-(this.pos_y - e_pos_y)));
    }
    this.pos_x = e_pos_x;
    this.pos_y = e_pos_y;
    this.moveType = MoveType.None;
    this.flgDrap = false;
    this.flgMove = false;
  }
  public contextmenu(e: any) {
    e.preventDefault();
  }
}
