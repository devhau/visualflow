import { EventEnum, IMain } from "../core/index";
import { DesginerView } from "../desginer/index";
import { DockBase } from "./DockBase";

export class ViewDock extends DockBase {
  private view: DesginerView | undefined;
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);

    this.view = new DesginerView(this.elNode, main);
    this.view.on(EventEnum.showProperty, (data: any) => { main.dispatch(EventEnum.showProperty, data); });
    this.main.on(EventEnum.openProject, (item: any) => {
      this.view?.Open(item.data);
    })
  }
}
