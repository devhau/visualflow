import { IMain } from "../core/BaseFlow";
import { EventEnum } from "../core/Constant";
import { DataFlow } from "../core/DataFlow";
import { DockBase } from "./DockBase";

export class ProjectDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    this.elNode.classList.add('vs-control');
    this.BoxInfo('Project', this.renderUI.bind(this));
    this.main.on(EventEnum.change, this.renderUI.bind(this));
  }
  private renderUI() {
    let $node: HTMLElement | null = this.elNode.querySelector('.vs-boxinfo_content');
    if (!$node) return;
    $node.innerHTML = ``;
    let projects = this.main.getProjectAll();
    projects.forEach((item: DataFlow) => {
      let nodeItem = document.createElement('div');
      nodeItem.classList.add('node-item');
      nodeItem.innerHTML = `${item.Get('name')}`;
      $node?.appendChild(nodeItem);
    });
  }
}
