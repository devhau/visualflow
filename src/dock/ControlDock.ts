import { IMain } from "../core/BaseFlow";
import { DockBase } from "./DockBase";

export class ControlDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    this.elNode.classList.add('vs-control');
    this.BoxInfo('Control', (node: HTMLElement) => {
      let controls = this.main.getControlAll();
      console.log(controls);
      Object.keys(controls).forEach((item: any) => {
        let nodeItem = document.createElement('div');
        nodeItem.classList.add('node-item');
        nodeItem.setAttribute('draggable', 'true');
        nodeItem.setAttribute('data-node', item);
        nodeItem.innerHTML = `${controls[item].icon} <span>${controls[item].name}</span`;
        nodeItem.addEventListener('dragstart', this.dragStart.bind(this))
        nodeItem.addEventListener('dragend', this.dragend.bind(this))
        node.appendChild(nodeItem);
      });
    });
  }
  private dragend(e: any) {
    this.main.setControlChoose(null);
  }

  private dragStart(e: any) {
    let key = e.target.closest(".node-item").getAttribute('data-node');
    this.main.setControlChoose(key);
    if (e.type !== "touchstart") {
      e.dataTransfer.setData("node", key);
    }
  }
}
