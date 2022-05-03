import { IMain } from "../core/BaseFlow";
import { EventEnum } from "../core/Constant";
import { DataFlow } from "../core/DataFlow";
import { DockBase } from "./DockBase";

export class ProjectDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    this.elNode.classList.add('vs-project');
    this.BoxInfo('Project', this.renderUI.bind(this));
    this.main.on(EventEnum.change, this.renderUI.bind(this));
    this.main.on(EventEnum.openProject, (detail: any) => {
      this.elContent?.querySelectorAll('.active').forEach((_node) => {
        _node.classList.remove('active');
      });
      if (this.elContent && detail?.data?.Get('id')) {
        this.elContent.querySelector(`[data-project-id="${detail?.data?.Get('id')}"]`)?.classList.add('active');
      }
    })
  }
  private renderUI() {
    let $nodeRight: HTMLElement | null = this.elNode.querySelector('.vs-boxinfo_header .vs-boxinfo_button');
    if (!this.elContent) return;
    this.elContent.innerHTML = ``;
    if ($nodeRight) {
      $nodeRight.innerHTML = ``;
      let buttonNew = document.createElement('button');
      $nodeRight?.appendChild(buttonNew);
      buttonNew.innerHTML = `New`;
      buttonNew.addEventListener('click', () => this.main.newProject(''));
    }

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
      if (this.main.CheckProjectOpen(item)) {
        nodeItem.classList.add('active');
      }
      nodeItem.addEventListener('click', () => {
        this.main.dispatch(EventEnum.openProject, { data: item });
        this.main.dispatch(EventEnum.showProperty, { data: item });

      });
      this.elContent?.appendChild(nodeItem);
    });

  }
}
