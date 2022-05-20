import { EventEnum, IMain, DataFlow } from "../core/index";

export class ProjectView {
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-project');
    this.main.on(EventEnum.changeVariable, this.Render.bind(this));
    this.main.on(EventEnum.openProject, this.Render.bind(this));
  }
  public Render() {
    this.elNode.innerHTML = ``;
    let projects = this.main.getProjectAll();
    projects.forEach((item: DataFlow) => {
      let nodeItem = document.createElement('div');
      nodeItem.classList.add('node-item');
      nodeItem.innerHTML = `${item.Get('name')}`;
      nodeItem.setAttribute('data-project-id', item.Get('id'));
      item.onSafe(`${EventEnum.dataChange}_name`, () => {
        nodeItem.innerHTML = `${item.Get('name')}`;
      });
      if (this.main.checkProjectOpen(item)) {
        nodeItem.classList.add('active');
      }
      nodeItem.addEventListener('click', () => {
        this.main.setProjectOpen(item);
      });
      this.elNode?.appendChild(nodeItem);
    });
  }
}
