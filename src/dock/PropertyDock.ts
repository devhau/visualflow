import { DataView, DataFlow, EventEnum, IMain } from "../core/index";
import { PropertyView } from "../desginer/PropertyView";
import { DockBase } from "./DockBase";

export class PropertyDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    this.elNode.classList.add('vs-property');
    this.BoxInfo('Property', (node: HTMLElement) => {
      new PropertyView(node, main);
    });
  }
}
