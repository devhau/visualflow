import { FlowCore } from "../core/BaseFlow";

export enum MoveType {
  None = 0,
  Node = 1,
  Canvas = 2,
  Line = 3,
}
export class DesginerView extends FlowCore {
  /**
   * GET SET for Data
   */
  public getZoom() {
    return +this.data.Get('zoom');
  }
  public setZoom(value: any) {
    return +this.data.Set('zoom', value, this);
  }
  public getY() {
    return +this.data.Get('y');
  }
  public setY(value: any) {
    return +this.data.Set('y', value, this);
  }
  public getX() {
    return +this.data.Get('x');
  }
  public setX(value: any) {
    return +this.data.Set('x', value, this);
  }
  /**
   * Varibute
  */
  public elCanvas: HTMLElement = document.createElement('div');
  public elNodePath: HTMLElement = document.createElement('div');
  public constructor(elNode: HTMLElement) {
    super();
    this.elNode = elNode;
    this.elNode.innerHTML = '';
    this.elNodePath.classList.add("node-path");
    this.elCanvas.classList.add("node-canvas");
    this.elNode.appendChild(this.elNodePath);
    this.elNode.appendChild(this.elCanvas);
  }
}
