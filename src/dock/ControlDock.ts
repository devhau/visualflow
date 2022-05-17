import { IMain } from "../core/index";
import { ToolboxView } from "../desginer/index";
import { DockBase } from "./DockBase";

export class ControlDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    this.elNode.classList.add('vs-control');
    this.BoxInfo('Control', (node: HTMLElement) => {
      new ToolboxView(node, this.main);
    });
  }
}
