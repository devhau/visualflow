import { EventEnum, IMain } from "../core/index";
import { DesginerView } from "../desginer/index";
import { DockBase } from "./DockBase";

export class ViewDock extends DockBase {
  private view: DesginerView | undefined;
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);

    this.view = new DesginerView(this.elNode, main);

  }
}
