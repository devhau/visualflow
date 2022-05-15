import { IMain } from "../core/index";
import { VariableView } from "../desginer/index";
import { DockBase } from "./DockBase";

export class VariableDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    new VariableView(this.elNode, main);
  }
}
