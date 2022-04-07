import { WorkerFlow } from "../WorkerFlow";

export class ViewFlow {
  private elView: HTMLElement | undefined | null;
  private elCanvas: HTMLElement | null = null;
  private parent: WorkerFlow;
  private flgDrap: boolean = false;
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
  public constructor(parent: WorkerFlow) {
    this.parent = parent;
    this.elView = this.parent.container?.querySelector('.workerflow-desgin .workerflow-view');
    if (this.elView) {
      this.elCanvas = document.createElement('div');
      this.elCanvas.classList.add("workerflow-canvas");
      this.elView.appendChild(this.elCanvas);
      this.elView.tabIndex = 0;
      this.addEvent();
    }
  }
  public addEvent() {
    if (!this.elView) return;
    /* Mouse and Touch Actions */
    this.elView.addEventListener('mouseup', this.EndMove.bind(this));
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
    console.log("StartMove");
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

    let e_pos_x = 0;
    let e_pos_y = 0;
    if (e.type === "touchmove") {
      e_pos_x = e.touches[0].clientX;
      e_pos_y = e.touches[0].clientY;
    } else {
      e_pos_x = e.clientX;
      e_pos_y = e.clientY;
    }
    console.log("Move");
    let x = this.canvas_x + (-(this.pos_x - e_pos_x))
    let y = this.canvas_y + (-(this.pos_y - e_pos_y))
    // this.dispatch('translate', { x: x, y: y });
    this.elCanvas.style.transform = "translate(" + x + "px, " + y + "px) scale(" + this.zoom + ")";
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
  }
  public contextmenu(e: any) {
    e.preventDefault();
  }
}
