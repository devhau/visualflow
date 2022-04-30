import { getTime } from "../core/Utils";
import { DesginerView } from "./DesginerView";
import { Line } from "./Line";
import { Node } from "./Node";

export enum MoveType {
  None = 0,
  Node = 1,
  Canvas = 2,
  Line = 3,
}
export const Zoom = {
  max: 1.6,
  min: 0.6,
  value: 0.1,
  default: 1
}
export class DesginerView_Event {
  private zoom_last_value: any = 1;

  private timeFastClick: number = 0;
  private tagIngore = ['input', 'button', 'a', 'textarea'];

  private moveType: MoveType = MoveType.None;
  private flgDrap: boolean = false;
  private flgMove: boolean = false;

  private av_x: number = 0;
  private av_y: number = 0;

  private pos_x: number = 0;
  private pos_y: number = 0;
  private mouse_x: number = 0;
  private mouse_y: number = 0;

  private tempLine: Line | undefined;
  public constructor(private parent: DesginerView) {
    /* Mouse and Touch Actions */
    this.parent.elNode.addEventListener('mouseup', this.EndMove.bind(this));
    this.parent.elNode.addEventListener('mouseleave', this.EndMove.bind(this));
    this.parent.elNode.addEventListener('mousemove', this.Move.bind(this));
    this.parent.elNode.addEventListener('mousedown', this.StartMove.bind(this));

    this.parent.elNode.addEventListener('touchend', this.EndMove.bind(this));
    this.parent.elNode.addEventListener('touchmove', this.Move.bind(this));
    this.parent.elNode.addEventListener('touchstart', this.StartMove.bind(this));
    /* Context Menu */
    this.parent.elNode.addEventListener('contextmenu', this.contextmenu.bind(this));

    /* Drop Drap */
    this.parent.elNode.addEventListener('drop', this.node_dropEnd.bind(this));
    this.parent.elNode.addEventListener('dragover', this.node_dragover.bind(this));
    /* Zoom Mouse */
    this.parent.elNode.addEventListener('wheel', this.zoom_enter.bind(this));
    /* Delete */
    // this.parent.elNode.addEventListener('keydown', this.keydown.bind(this));
  }

  private contextmenu(ev: any) { ev.preventDefault(); }
  private node_dragover(ev: any) { ev.preventDefault(); }
  private node_dropEnd(ev: any) {
    ev.preventDefault();
    let keyNode: any = this.parent.main.getControlChoose();
    if (!keyNode && ev.type !== "touchend") {
      keyNode = ev.dataTransfer.getData("node");
    }
    if (!keyNode) return;
    let e_pos_x = 0;
    let e_pos_y = 0;
    if (ev.type === "touchmove") {
      e_pos_x = ev.touches[0].clientX;
      e_pos_y = ev.touches[0].clientY;
    } else {
      e_pos_x = ev.clientX;
      e_pos_y = ev.clientY;
    }
    let x = this.parent.CalcX(this.parent.elCanvas.getBoundingClientRect().x - e_pos_x);
    let y = this.parent.CalcY(this.parent.elCanvas.getBoundingClientRect().y - e_pos_y);

    if (this.parent.checkOnlyNode(keyNode)) {
      return;
    }
    let nodeItem = this.parent.AddNode(keyNode);
    nodeItem.updatePosition(x, y);
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
  public zoom_refresh(flg: any = 0) {
    let temp_zoom = flg == 0 ? Zoom.default : (this.parent.getZoom() + Zoom.value * flg);
    if (Zoom.max >= temp_zoom && temp_zoom >= Zoom.min) {
      this.parent.setX((this.parent.getX() / this.zoom_last_value) * temp_zoom);
      this.parent.setY((this.parent.getY() / this.zoom_last_value) * temp_zoom);
      this.zoom_last_value = temp_zoom;
      this.parent.setZoom(this.zoom_last_value);
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
  private StartMove(ev: any) {
    if (this.tagIngore.includes(ev.target.tagName.toLowerCase())) {
      return;
    }
    this.timeFastClick = getTime();
    if (ev.target.classList.contains('main-path')) {
      return;
    }
    if (ev.type === "touchstart") {
      this.pos_x = ev.touches[0].clientX;
      this.pos_y = ev.touches[0].clientY;
    } else {
      this.pos_x = ev.clientX;
      this.pos_y = ev.clientY;
    }
    this.moveType = MoveType.Canvas;
    let nodeChoose = this.parent.getNodeChoose();
    if (nodeChoose && nodeChoose.CheckElementChild(ev.target)) {
      this.moveType = MoveType.Node;
    } else {
      this.parent.setNodeChoose(undefined);
    }
    if (nodeChoose && this.moveType == MoveType.Node && ev.target.classList.contains("node-dot")) {
      this.moveType = MoveType.Line;
      let fromIndex = ev.target.getAttribute('node');
      this.tempLine = new Line(nodeChoose, fromIndex);
    }
    if (this.moveType == MoveType.Canvas) {
      this.av_x = this.parent.getX();
      this.av_y = this.parent.getY();
    }
    this.flgDrap = true;
    this.flgMove = false;
  }
  public Move(ev: any) {
    if (!this.flgDrap) return;
    this.flgMove = true;
    let e_pos_x = 0;
    let e_pos_y = 0;
    if (ev.type === "touchmove") {
      e_pos_x = ev.touches[0].clientX;
      e_pos_y = ev.touches[0].clientY;
    } else {
      e_pos_x = ev.clientX;
      e_pos_y = ev.clientY;
    }
    switch (this.moveType) {
      case MoveType.Canvas:
        {
          let x = this.av_x + this.parent.CalcX(-(this.pos_x - e_pos_x))
          let y = this.av_y + this.parent.CalcY(-(this.pos_y - e_pos_y))
          this.parent.setX(x);
          this.parent.setY(y);
          break;
        }
      case MoveType.Node:
        {
          let x = this.parent.CalcX(this.pos_x - e_pos_x);
          let y = this.parent.CalcY(this.pos_y - e_pos_y);
          this.pos_x = e_pos_x;
          this.pos_y = e_pos_y;
          this.parent.getNodeChoose()?.updatePosition(x, y);
          break;
        }
      case MoveType.Line:
        {
          if (this.tempLine) {
            let x = this.parent.CalcX(this.parent.elCanvas.getBoundingClientRect().x - e_pos_x);
            let y = this.parent.CalcY(this.parent.elCanvas.getBoundingClientRect().y - e_pos_y);
            this.tempLine.updateTo(this.parent.elCanvas.offsetLeft - x, this.parent.elCanvas.offsetTop - y);
            let nodeEl = ev.target.closest('[node-id]');
            let nodeId = nodeEl?.getAttribute('node-id');
            let nodeTo = nodeId ? this.parent.GetNodeById(nodeId) : undefined;
            if (nodeTo && ev.target.classList.contains("node-dot")) {
              let toIndex = ev.target.getAttribute('node');
              this.tempLine.setNodeTo(nodeTo, toIndex);
            } else {
              let toIndex = nodeEl?.querySelector('.node-dot')?.[0]?.getAttribute('node');
              this.tempLine.setNodeTo(nodeTo, toIndex);
            }
          }
          break;
        }
    }

    if (ev.type === "touchmove") {
      this.mouse_x = e_pos_x;
      this.mouse_y = e_pos_y;
    }
  }
  private EndMove(ev: any) {
    if (!this.flgDrap) return;
    //fix Fast Click
    if (((getTime() - this.timeFastClick) < 100) || !this.flgMove) {
      this.moveType = MoveType.None;
      this.flgDrap = false;
      this.flgMove = false;
      return;
    }

    let e_pos_x = 0;
    let e_pos_y = 0;
    if (ev.type === "touchend") {
      e_pos_x = this.mouse_x;
      e_pos_y = this.mouse_y;
    } else {
      e_pos_x = ev.clientX;
      e_pos_y = ev.clientY;
    }
    if (this.moveType === MoveType.Canvas) {
      let x = this.av_x + this.parent.CalcX(-(this.pos_x - e_pos_x))
      let y = this.av_y + this.parent.CalcY(-(this.pos_y - e_pos_y))
      this.parent.setX(x);
      this.parent.setY(y);
      this.av_x = 0;
      this.av_y = 0;
    }
    if (this.tempLine) {
      this.tempLine.Clone();
      this.tempLine.delete();
    }
    this.pos_x = e_pos_x;
    this.pos_y = e_pos_y;
    this.moveType = MoveType.None;
    this.flgDrap = false;
    this.flgMove = false;
  }
}
