import { WorkerFlow } from "../WorkerFlow";
import { LineFlow } from "./LineFlow";
import { NodeFlow } from "./NodeFlow";

export class ViewFlow {
  private elView: HTMLElement | undefined | null;
  public elCanvas: HTMLElement | null = null;
  private parent: WorkerFlow;
  private nodes: NodeFlow[] = [];
  private flgDrap: boolean = false;
  private flgDrapMove: boolean = false;
  private zoom: number = 1;
  private zoom_max: number = 1.6;
  private zoom_min: number = 0.5;
  private zoom_value: number = 0.1;
  private zoom_last_value: number = 1;
  private canvas_x: number = 0;
  private canvas_y: number = 0;
  private pos_x: number = 0;
  private pos_x_start: number = 0;
  private pos_y: number = 0;
  private pos_y_start: number = 0;
  private mouse_x: number = 0;
  private mouse_y: number = 0;
  private nodeSelected: NodeFlow | null = null;
  private dotSelected: NodeFlow | null = null;
  public constructor(parent: WorkerFlow) {
    this.parent = parent;
    this.elView = this.parent.container?.querySelector('.workerflow-desgin .workerflow-view');
    if (this.elView) {
      this.elCanvas = document.createElement('div');
      this.elCanvas.classList.add("workerflow-canvas");
      this.elView.appendChild(this.elCanvas);
      this.elView.tabIndex = 0;
      this.addEvent();
      this.AddNode();
      this.AddNode();
      this.AddNode();
      new LineFlow(this.nodes[0], this.nodes[1]);
      new LineFlow(this.nodes[1], this.nodes[2]);
    }
  }
  public UnSelectNode() {
    if (this.nodeSelected) {
      this.nodeSelected.elNode?.classList.remove('active');
    }
    this.nodeSelected = null;
  }
  public SelectNode(node: NodeFlow) {
    this.UnSelectNode();
    this.nodeSelected = node;
    this.nodeSelected.elNode?.classList.add('active');
  }
  public UnSelectDot() {
    if (this.dotSelected) {
      this.dotSelected.elNode?.classList.remove('active');
    }
    this.dotSelected = null;
  }
  public SelectDot(node: NodeFlow) {
    this.UnSelectDot();
    this.dotSelected = node;
    this.dotSelected.elNode?.classList.add('active');
  }
  public AddNode() {
    this.nodes = [...this.nodes, new NodeFlow(this, this.parent.getUuid())];
  }
  public addEvent() {
    if (!this.elView) return;
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
  }

  public StartMove(e: any) {
    this.flgDrap = true;
    this.flgDrapMove = false;
    if (this.nodeSelected && (this.nodeSelected.elNode !== e.target && this.nodeSelected.elNode !== e.target.parents('.workerflow-node'))) {
      this.UnSelectNode();
    }
    console.log(this.nodeSelected);
    if (e.type === "touchstart") {
      this.pos_x = e.touches[0].clientX;
      this.pos_x_start = e.touches[0].clientX;
      this.pos_y = e.touches[0].clientY;
      this.pos_y_start = e.touches[0].clientY;
    } else {
      this.pos_x = e.clientX;
      this.pos_x_start = e.clientX;
      this.pos_y = e.clientY;
      this.pos_y_start = e.clientY;
    }
  }
  public Move(e: any) {
    if (!this.flgDrap || !this.elCanvas) return;
    this.flgDrapMove = true;
    let e_pos_x = 0;
    let e_pos_y = 0;
    if (e.type === "touchmove") {
      e_pos_x = e.touches[0].clientX;
      e_pos_y = e.touches[0].clientY;
    } else {
      e_pos_x = e.clientX;
      e_pos_y = e.clientY;
    }
    if (this.nodeSelected) {
      let x = (this.pos_x - e_pos_x) * this.elCanvas.clientWidth / (this.elCanvas.clientWidth * this.zoom);
      let y = (this.pos_y - e_pos_y) * this.elCanvas.clientHeight / (this.elCanvas.clientHeight * this.zoom);
      this.pos_x = e_pos_x;
      this.pos_y = e_pos_y;
      this.nodeSelected.updatePosition(x, y);
    } else {
      let x = this.canvas_x + (-(this.pos_x - e_pos_x))
      let y = this.canvas_y + (-(this.pos_y - e_pos_y))
      this.elCanvas.style.transform = "translate(" + x + "px, " + y + "px) scale(" + this.zoom + ")";

    }
    if (e.type === "touchmove") {
      this.mouse_x = e_pos_x;
      this.mouse_y = e_pos_y;
    }
  }
  public EndMove(e: any) {
    this.flgDrap = false;
    let e_pos_x = 0;
    let e_pos_y = 0;
    if (e.type === "touchend") {
      e_pos_x = this.mouse_x;
      e_pos_y = this.mouse_y;
    } else {
      e_pos_x = e.clientX;
      e_pos_y = e.clientY;
    }

    this.canvas_x = this.canvas_x + (-(this.pos_x - e_pos_x));
    this.canvas_y = this.canvas_y + (-(this.pos_y - e_pos_y));
    this.pos_x = e_pos_x;
    this.pos_y = e_pos_y;
    if (this.flgDrapMove) {
      this.UnSelectNode();
    }
  }
  public contextmenu(e: any) {
    e.preventDefault();
  }
}
