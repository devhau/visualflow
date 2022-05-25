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
    group.forEach((item: any) => {
      let elLI = document.createElement('li');
      elLI.innerHTML = item.text;
      elLI.addEventListener('click', () => alert(1));
      elUL.prepend(elLI);
    });
    this.elNode.appendChild(elUL);
  }
}
