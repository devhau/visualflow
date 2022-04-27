import { IEvent } from "../core/BaseFlow";
import { DockBase } from "./DockBase";

export class ControlDock extends DockBase {
  public constructor(container: HTMLElement, protected event: IEvent) {
    super(container, event);
    this.elNode.classList.add('vs-control');
    this.BoxInfo('Control', (node: HTMLElement) => {
      node.innerHTML = "xin chào";
    });
  }
}
