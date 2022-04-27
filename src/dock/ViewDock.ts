import { IEvent } from "../core/BaseFlow";
import { DockBase } from "./DockBase";

export class ViewDock extends DockBase {
  public constructor(container: HTMLElement, protected event: IEvent) {
    super(container, event);
    this.elNode.innerHTML = 'ViewDock';
    this.elNode.classList.add('vs-view');
  }
}
