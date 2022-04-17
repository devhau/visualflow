import { WorkerFlow } from "../WorkerFlow";
import { LineFlow } from "./LineFlow";
import { NodeFlow } from "./NodeFlow";

export enum MoveType {
  None = 0,
  Node = 1,
  Canvas = 2,
  Line = 3,
}
export class ViewFlow {
  private elView: HTMLElement;
  public elCanvas: HTMLElement;
  private parent: WorkerFlow;
  private nodes: NodeFlow[] = [];
  public flgDrap: boolean = false;
  public flgMove: boolean = false;
  private moveType: MoveType = MoveType.None;
  private zoom: number = 1;
  private zoom_max: number = 1.6;
  private zoom_min: number = 0.5;
  private zoom_value: number = 0.1;
  private zoom_last_value: number = 1;
  private canvas_x: number = 0;
  private canvas_y: number = 0;
  private pos_x: number = 0;
  private pos_y: number = 0;
  private mouse_x: number = 0;
  private mouse_y: number = 0;
  private lineSelected: LineFlow | null = null;
  private nodeSelected: NodeFlow | null = null;
  public nodeOver: NodeFlow | null = null;
  private dotSelected: NodeFlow | null = null;
  private tempLine: LineFlow | null = null;
  private timeFastClick: number = 0;
  private projectId: string = "";
  private projectName: string = "";
  public constructor(parent: WorkerFlow) {
    this.parent = parent;
    this.elView = this.parent.container?.querySelector('.workerflow-desgin .workerflow-view') || document.createElement('div');
    this.elCanvas = document.createElement('div');
    this.elCanvas.classList.add("workerflow-canvas");
    this.elView.appendChild(this.elCanvas);
    this.elView.tabIndex = 0;
    this.addEvent();
    this.Reset();
    this.updateView();

  }
  public getOption(keyNode: any) {
    if (!keyNode) return;
    let control = this.parent.option.control[keyNode];
    if (!control) {
      control = Object.values(this.parent.option.control)[0];
    }
    control.key = keyNode;
    return control;
  }
  private dropEnd(ev: any) {
    let keyNode: string | null = '';
    if (ev.type === "touchend") {
      keyNode = this.parent.dataNodeSelect;
    } else {
      ev.preventDefault();
      keyNode = ev.dataTransfer.getData("node");
    }

    let node = this.AddNode(this.getOption(keyNode));
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
      id: this.projectId,
      name: this.projectName,
      x: this.canvas_x,
      y: this.canvas_y,
      zoom: this.zoom,
      nodes
    }
  }
  public load(data: any) {
    this.Reset();
    this.projectId = data?.id ?? this.parent.getUuid();
    this.projectName = data?.name ?? `project-${this.parent.getTime()}`;
    this.canvas_x = data?.x ?? 0;
    this.canvas_y = data?.y ?? 0;
    this.zoom = data?.zoom ?? 1;
    this.nodes = (data?.nodes ?? []).map((item: any) => {
      return (new NodeFlow(this, "")).load(item);
    });
    (data?.nodes ?? []).forEach((item: any) => {
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
    this.projectId = this.parent.getUuid();
    this.projectName = `project-${this.parent.getTime()}`;
    this.canvas_x = 0;
    this.canvas_y = 0;
    this.zoom = 1;
    this.updateView();
  }
  public getNodeById(nodeId: string) {
    return this.nodes?.filter((item) => item.nodeId == nodeId)[0];
  }
  public updateView() {
    this.elCanvas.style.transform = "translate(" + this.canvas_x + "px, " + this.canvas_y + "px) scale(" + this.zoom + ")";
  }
  private CalcX(number: any) {
    return number * (this.elCanvas.clientWidth / (this.elView.clientWidth * this.zoom));
  }
  private CalcY(number: any) {
    return number * (this.elCanvas.clientHeight / (this.elView.clientHeight * this.zoom));
  }
  private dragover(e: any) {
    e.preventDefault();
  }
  public UnSelectLine() {
    if (this.lineSelected) {
      this.lineSelected.elPath?.classList.remove('active');
      this.lineSelected = null;
    }
  }
  public UnSelectDot() {
    if (this.dotSelected) {
      this.dotSelected.elNode?.classList.remove('active');
      this.dotSelected = null;
    }
  }
  public UnSelectNode() {
    if (this.nodeSelected) {
      this.nodeSelected.elNode?.classList.remove('active');
      this.nodeSelected = null;
    }
  }
  public UnSelect() {
    this.UnSelectLine();
    this.UnSelectNode();
    this.UnSelectDot();
  }
  public SelectLine(node: LineFlow) {
    this.UnSelect();
    this.lineSelected = node;
    this.lineSelected.elPath.classList.add('active');
  }
  public SelectNode(node: NodeFlow) {
    this.UnSelect();
    this.nodeSelected = node;
    this.nodeSelected.elNode?.classList.add('active');
  }
  public SelectDot(node: NodeFlow) {
    this.UnSelect();
    this.dotSelected = node;
    this.dotSelected.elNode?.classList.add('active');
  }
  public RemoveNode(node: NodeFlow) {
    var index = this.nodes.indexOf(node);
    if (index > -1) {
      this.nodes.splice(index, 1);
    }
    return this.nodes;
  }
  public AddNode(option: any = null): NodeFlow {
    let NodeId = option ? option.id : this.parent.getUuid();
    let node = new NodeFlow(this, NodeId ?? this.parent.getUuid(), option);
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
    this.elView.addEventListener('mouseup', this.EndMove.bind(this));
    this.elView.addEventListener('mouseleave', this.EndMove.bind(this));
    this.elView.addEventListener('mousemove', this.Move.bind(this));
    this.elView.addEventListener('mousedown', this.StartMove.bind(this));

    this.elView.addEventListener('touchend', this.EndMove.bind(this));
    this.elView.addEventListener('touchmove', this.Move.bind(this));
    this.elView.addEventListener('touchstart', this.StartMove.bind(this));
    /* Context Menu */
    this.elView.addEventListener('contextmenu', this.contextmenu.bind(this));

    /* Drop Drap */
    this.elView.addEventListener('drop', this.dropEnd.bind(this));
    this.elView.addEventListener('dragover', this.dragover.bind(this));
    /* Zoom Mouse */
    this.elView.addEventListener('wheel', this.zoom_enter.bind(this));
    /* Delete */
    this.elView.addEventListener('keydown', this.keydown.bind(this));
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
    this.canvas_x = (this.canvas_x / this.zoom_last_value) * this.zoom;
    this.canvas_y = (this.canvas_y / this.zoom_last_value) * this.zoom;
    this.zoom_last_value = this.zoom;
    this.updateView();
  }
  public zoom_in() {
    if (this.zoom < this.zoom_max) {
      this.zoom += this.zoom_value;
      this.zoom_refresh();
    }
  }
  public zoom_out() {
    if (this.zoom > this.zoom_min) {
      this.zoom -= this.zoom_value;
      this.zoom_refresh();
    }
  }
  public zoom_reset() {
    if (this.zoom != 1) {
      this.zoom = 1;
      this.zoom_refresh();
    }
  }

  public StartMove(e: any) {
    this.timeFastClick = this.parent.getTime();
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
          let x = this.canvas_x + this.CalcX(-(this.pos_x - e_pos_x))
          let y = this.canvas_y + this.CalcY(-(this.pos_y - e_pos_y))
          this.elCanvas.style.transform = "translate(" + x + "px, " + y + "px) scale(" + this.zoom + ")";
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
    //fix Fast Click
    if (((this.parent.getTime() - this.timeFastClick) < 300) || !this.flgDrap && !this.flgMove) {
      this.moveType = MoveType.None;
      this.flgDrap = false;
      this.flgMove = false;
      return;
    }

    this.UnSelect();
    if (this.tempLine && this.moveType == MoveType.Line) {
      if (this.tempLine.toNode) {
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
      this.canvas_x = this.canvas_x + this.CalcX(-(this.pos_x - e_pos_x));
      this.canvas_y = this.canvas_y + this.CalcY(-(this.pos_y - e_pos_y));
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
