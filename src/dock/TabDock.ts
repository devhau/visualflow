import { IMain, EventEnum, DataFlow } from "../core/index";
import { DockBase } from "./DockBase";

export class TabDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    this.elNode.innerHTML = ``;
    this.elNode.classList.add('vs-tab');
    this.main.on(EventEnum.openProject, (detail: any) => {
      this.elNode?.querySelectorAll('.active').forEach((_node) => {
        _node.classList.remove('active');
      });
      if (this.elNode && detail?.data?.Get('id')) {
        this.elNode.querySelector(`[data-project-id="${detail?.data?.Get('id')}"]`)?.classList.add('active');
      }
    });
    this.main.on(EventEnum.newProject, this.render.bind(this));
  }

  render() {
    this.elNode.innerHTML = ``;
    let projects = this.main.getProjectAll();
    projects.forEach((item: DataFlow) => {
      let nodeItem = document.createElement('div');
      nodeItem.classList.add('node-item');
      nodeItem.innerHTML = `${item.Get('name')}`;
      nodeItem.setAttribute('data-project-id', item.Get('id'));
      item.removeListener(`${EventEnum.dataChange}_name`, () => {
        nodeItem.innerHTML = `${item.Get('name')}`;
      });
      item.on(`${EventEnum.dataChange}_name`, () => {
        nodeItem.innerHTML = `${item.Get('name')}`;
      });
      if (this.main.checkProjectOpen(item)) {
        nodeItem.classList.add('active');
      }
      nodeItem.addEventListener('click', () => {
        this.main.dispatch(EventEnum.openProject, { data: item });
        this.main.dispatch(EventEnum.showProperty, { data: item });
      });
      this.elNode?.appendChild(nodeItem);
    });
  }
}
