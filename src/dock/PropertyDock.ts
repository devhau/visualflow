import { DataView, DataFlow, EventEnum, IMain } from "../core/index";
import { DockBase } from "./DockBase";

export class PropertyDock extends DockBase {
  private lastData: DataFlow | undefined;
  private hideKeys: string[] = ['lines', 'nodes', 'groups', 'variable', 'x', 'y', 'zoom'];
  private sortKeys: string[] = ['id', 'key', 'name', 'group'];
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);

    this.elNode.classList.add('vs-property');
    this.BoxInfo('Property', (node: HTMLElement) => {
      main.on(EventEnum.showProperty, (detail: any) => {
        this.renderUI(node, detail.data);
      })
    });
  }

  private renderUI(node: HTMLElement, data: DataFlow) {
    if (this.lastData == data) {
      return;
    }
    this.lastData = data;
    node.innerHTML = '';
    let properties: any = data.getProperties();
    this.sortKeys.forEach((key: string) => {
      if (this.hideKeys.includes(key) || !properties[key]) return;
      let propertyItem = document.createElement('div');
      propertyItem.classList.add('property-item');
      let propertyLabel = document.createElement('div');
      propertyLabel.classList.add('property-label');
      propertyLabel.innerHTML = key;
      let propertyValue = document.createElement('div');
      propertyValue.classList.add('property-value');
      DataView.BindElement(propertyValue, data, this.main, key);
      propertyItem.appendChild(propertyLabel);
      propertyItem.appendChild(propertyValue);
      node.appendChild(propertyItem);
    });
    Object.keys(properties).forEach((key: string) => {
      if (this.hideKeys.includes(key) || this.sortKeys.includes(key)) return;
      let propertyItem = document.createElement('div');
      propertyItem.classList.add('property-item');
      let propertyLabel = document.createElement('div');
      propertyLabel.classList.add('property-label');
      propertyLabel.innerHTML = key;
      let propertyValue = document.createElement('div');
      propertyValue.classList.add('property-value');
      DataView.BindElement(propertyValue, data, this.main, key);
      propertyItem.appendChild(propertyLabel);
      propertyItem.appendChild(propertyValue);
      node.appendChild(propertyItem);
    });
  }
}
