import { DataFlow, EventEnum, IMain } from "../core/index";
import { downloadObjectAsJson, getTime, readFileLocal } from "../core/Utils";
import { ProjectView } from "../desginer/ProjectView";
import { DockBase } from "./DockBase";

export class ProjectDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    this.elNode.classList.add('vs-project');
    this.BoxInfo('Project', (elContent: any) => {
      new ProjectView(elContent, main);
    });
    let $nodeRight: HTMLElement | null = this.elNode.querySelector('.vs-boxinfo_header .vs-boxinfo_button');
    if ($nodeRight) {
      $nodeRight.innerHTML = ``;
      let buttonNew = document.createElement('button');
      buttonNew.innerHTML = `New`;
      buttonNew.addEventListener('click', () => this.main.newProject(''));
      $nodeRight?.appendChild(buttonNew);

      let buttonExport = document.createElement('button');
      buttonExport.innerHTML = `Export`;
      buttonExport.addEventListener('click', () => downloadObjectAsJson(this.main.exportJson(), `vs-solution-${getTime()}`));
      $nodeRight?.appendChild(buttonExport);

      let buttonImport = document.createElement('button');
      buttonImport.innerHTML = `Import`;
      buttonImport.addEventListener('click', () => {
        readFileLocal((rs: any) => {
          if (rs) {
            this.main.importJson(JSON.parse(rs));
          }
        });
      });
      $nodeRight?.appendChild(buttonImport);
    }
  }
}
