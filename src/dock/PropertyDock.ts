import { IEvent } from "../core/BaseFlow";
import { DockBase } from "./DockBase";

export class PropertyDock extends DockBase {
  public constructor(container: HTMLElement, protected event: IEvent) {
    super(container, event);
    this.elNode.classList.add('vs-property');
    this.BoxInfo('Property', (node: HTMLElement) => {
      node.innerHTML = "xin chào";
    });
  }
}
