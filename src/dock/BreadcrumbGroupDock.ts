import { IMain, getTime } from "../core/index";
import { BreadcrumbGroupView } from "../desginer/index";
import { DockBase } from "./DockBase";

export class BreadcrumbGroupDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    new BreadcrumbGroupView(this.elNode, main);
  }
}
