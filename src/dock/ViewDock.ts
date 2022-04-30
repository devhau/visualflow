import { IControlNode, IMain } from "../core/BaseFlow";
import { EventEnum } from "../core/Constant";
import { DesginerView } from "../desginer/DesginerView";
import { DockBase } from "./DockBase";

export class ViewDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    new DesginerView(this.elNode, main).on(EventEnum.showProperty, (data: any) => main.dispatch(EventEnum.showProperty, data));
  }
}
