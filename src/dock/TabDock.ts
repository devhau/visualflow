import { IMain, } from "../core/index";
import { TabProjectView } from "../desginer/index";
import { DockBase } from "./DockBase";

export class TabDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    new TabProjectView(this.elNode, main);
  }
}
