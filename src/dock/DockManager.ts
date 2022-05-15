import { IMain, DockEnum } from "../core/index";
import { ControlDock } from "./ControlDock";
import { VariableDock } from "./VariableDock";
import { ProjectDock } from "./ProjectDock";
import { PropertyDock } from "./PropertyDock";
import { ViewDock } from "./ViewDock";

export class DockManager {
  private $dockManager: any = {};
  public constructor(private container: HTMLElement, protected main: IMain) { }
  public reset() {
    this.$dockManager = {};
    this.addDock(DockEnum.left, ControlDock);
    this.addDock(DockEnum.left, ProjectDock);
    this.addDock(DockEnum.right, PropertyDock);
    this.addDock(DockEnum.view, ViewDock);
    //  this.addDock(DockEnum.top, TabDock);
    this.addDock(DockEnum.bottom, VariableDock);
    this.RenderUI();
  }
  public addDock($key: string, $view: any) {
    if (!this.$dockManager[$key])
      this.$dockManager[$key] = [];
    this.$dockManager[$key] = [...this.$dockManager[$key], $view];
  }

  public RenderUI() {
    this.container.innerHTML = `
      <div class="vs-left vs-dock"></div>
      <div class="vs-content">
        <div class="vs-top vs-dock"></div>
        <div class="vs-view vs-dock"></div>
        <div class="vs-bottom vs-dock"></div>
      </div>
      <div class="vs-right vs-dock"></div>
    `;
    Object.keys(this.$dockManager).forEach((key: string) => {
      let querySelector = this.container.querySelector(`.${key}`);
      if (querySelector) {
        this.$dockManager[key].forEach(($item: any) => {
          new $item(querySelector, this.main);
        })
      }
    });
  }
}
