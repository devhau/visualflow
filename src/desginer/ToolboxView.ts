import { IMain } from "../core/index";

export class ToolboxView {
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-toolboxf');
    this.Render();
  }
  public Render() {
    let controls = this.main.getControlAll();
    Object.keys(controls).forEach((item: any) => {
      let nodeItem = document.createElement('div');
      nodeItem.classList.add('node-item');
      nodeItem.setAttribute('draggable', 'true');
      nodeItem.setAttribute('data-node', item);
      nodeItem.innerHTML = `${controls[item].icon} <span>${controls[item].name}</span`;
      nodeItem.addEventListener('dragstart', this.dragStart.bind(this))
      nodeItem.addEventListener('dragend', this.dragend.bind(this))
      this.elNode.appendChild(nodeItem);
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
