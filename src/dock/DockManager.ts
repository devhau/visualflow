import { IEvent } from "../core/BaseFlow";
import { DockEnum } from "../core/Constant";
import { ControlDock } from "./ControlDock";
import { DockBase } from "./DockBase";
import { PropertyDock } from "./PropertyDock";
import { ViewDock } from "./ViewDock";

export class DockManager {
  private $dockManager: any = {};
  public constructor(private container: HTMLElement, protected event: IEvent) {
  }
  public reset() {
    this.$dockManager = {};
    this.addDock(DockEnum.left, ControlDock);
    this.addDock(DockEnum.right, PropertyDock);
    this.addDock(DockEnum.right, ControlDock);
    this.addDock(DockEnum.view, ViewDock);
    this.addDock(DockEnum.top, DockBase);
    this.addDock(DockEnum.bottom, DockBase);
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
          new $item(querySelector, this);
        })
      }
    });
  }
}