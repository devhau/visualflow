import { IMain } from "../core/BaseFlow";
import { EventEnum } from "../core/Constant";
import { DesginerView } from "../desginer/DesginerView";
import { DockBase } from "./DockBase";

export class ViewDock extends DockBase {
  private view: DesginerView | undefined;
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);

    this.view = new DesginerView(this.elNode, main);
    this.view.on(EventEnum.showProperty, (data: any) => { main.dispatch(EventEnum.showProperty, data); });
    this.main.on(EventEnum.openProject, (item: any) => {
      this.view?.Open(item.data);
      this.main.setProjectOpen(item.data);
    })
  }
}
