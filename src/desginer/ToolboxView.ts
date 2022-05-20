import { IMain } from "../core/index";

export class ToolboxView {
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-toolbox');
    this.Render();
  }
  public Render() {
    let controls = this.main.getControlAll();
    let group: any = {};

    Object.keys(controls).forEach((item: any) => {
      let groupName = controls[item].group ?? "other";
      if (group[groupName] === undefined) group[groupName] = [];
      group[groupName] = [
        ...group[groupName],
        controls[item]
      ];
    });
    Object.keys(group).forEach((item: any) => {
      let itemBox = document.createElement('div');
      itemBox.classList.add('node-box');
      itemBox.innerHTML = `
        <h2 class="node-box_title">${item}</h2>
        <div class="node-box_boby"></div>
      `;
      itemBox.querySelector('.node-box_title')?.addEventListener('click', () => {
        if (itemBox.classList.contains('active')) {
          itemBox.classList.remove('active')
        } else {
          itemBox.classList.add('active')
        }
      });
      for (let _item of group[item]) {
        let nodeItem = document.createElement('div');
        nodeItem.classList.add('node-item');
        nodeItem.setAttribute('draggable', 'true');
        nodeItem.setAttribute('data-node', _item.key);
        nodeItem.innerHTML = `${_item.icon} <span>${_item.name}</span`;
        nodeItem.addEventListener('dragstart', this.dragStart.bind(this))
        nodeItem.addEventListener('dragend', this.dragend.bind(this))
        itemBox.querySelector('.node-box_boby')?.appendChild(nodeItem);
      }
      this.elNode.appendChild(itemBox);
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
