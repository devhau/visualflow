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
}
