import { BaseFlow } from "../core/BaseFlow";
import { getUuid } from "../core/Utils";
import { Line } from "./line";
import { DesginerView } from "./view";

const geval = eval;
export class Node extends BaseFlow<DesginerView> {
  public getY() {
    return +this.data.Get('y');
  }
  public getX() {
    return +this.data.Get('x');
  }
  public setY(value: any) {
    return +this.data.Set('y', value, this);
  }
  public setX(value: any) {
    return +this.data.Set('x', value, this);
  }
}
