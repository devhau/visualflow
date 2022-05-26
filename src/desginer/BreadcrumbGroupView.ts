import { EventEnum, IMain } from "../core/index";

export class BreadcrumbGroupView {
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-breadcrumb-group');
    this.main.on(EventEnum.groupChange, ({ group }: any) => {
      this.render(group)
    });
    this.elNode.innerHTML = '';
  }
  public render(group: any) {
    this.elNode.innerHTML = '';
    if (!this.elNode || !group) return;


    let elUL = document.createElement('ul');
    let isFirst = true;
    group.forEach((item: any) => {
      if (!isFirst) {
        let elLI2 = document.createElement('li');
        elLI2.innerHTML = ">";
        elUL.prepend(elLI2);
      }
      let elLI = document.createElement('li');
      elLI.innerHTML = item.text;
      elLI.addEventListener('click', () => this.setGroupId(item.id));
      elLI.classList.add('group-item');
      elUL.prepend(elLI);
      isFirst = false;
    });
    let elWarp = document.createElement('div');
    elWarp.classList.add('group-warp');
    let elBody = document.createElement('div');
    elBody.classList.add('group-body');
    elWarp.appendChild(elBody);
    elBody.appendChild(elUL);

    if (group.length > 1) {
      let elButtunDiv = document.createElement('div');
      elButtunDiv.classList.add('group-button');
      elButtunDiv.innerHTML = `<button><i class="fas fa-redo"></i></button>`;
      elButtunDiv.addEventListener('click', () => this.setGroupId(group[1].id));
      this.elNode.appendChild(elButtunDiv);
    }
    this.elNode.appendChild(elWarp);
  }
  private setGroupId(groupId: any) {
    this.main.dispatch(EventEnum.setGroup, { groupId });
  }
}
