
import { EventEnum } from "../core/Constant";
import { DataFlow } from "../core/DataFlow";
import { DataView } from "../core/DataView";
import { IMain } from "../core/IFlow";

export class PropertyView {
  private lastData: DataFlow | undefined;
  private hideKeys: string[] = ['lines', 'nodes', 'groups', 'variable', 'x', 'y', 'zoom'];
  private sortKeys: string[] = ['id', 'key', 'name', 'group'];
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-property-view');
    this.main.on(EventEnum.showProperty, (detail: any) => {
      this.Render(detail.data);
    });
  }
  public Render(data: DataFlow) {
    if (this.lastData == data) {
      return;
    }
    this.lastData = data;
    this.elNode.innerHTML = '';
    let properties: any = data.getProperties();
    this.sortKeys.forEach((key: string) => {
      if (this.hideKeys.includes(key) || !properties[key] || properties[key].hide) return;
      let propertyItem = document.createElement('div');
      propertyItem.classList.add('property-item');
      let propertyLabel = document.createElement('div');
      propertyLabel.classList.add('property-label');
      propertyLabel.innerHTML = properties[key].text ?? key;
      let propertyValue = document.createElement('div');
      propertyValue.classList.add('property-value');
      DataView.BindElement(propertyValue, data, this.main, key);
      propertyItem.appendChild(propertyLabel);
      propertyItem.appendChild(propertyValue);
      this.elNode.appendChild(propertyItem);
    });
    Object.keys(properties).forEach((key: string) => {
      if (this.hideKeys.includes(key) || this.sortKeys.includes(key) || !properties[key] || properties[key].hide) return;
      let propertyItem = document.createElement('div');
      propertyItem.classList.add('property-item');
      let propertyLabel = document.createElement('div');
      propertyLabel.classList.add('property-label');
      propertyLabel.innerHTML = properties[key].text ?? key;
      let propertyValue = document.createElement('div');
      propertyValue.classList.add('property-value');
      DataView.BindElement(propertyValue, data, this.main, key);
      propertyItem.appendChild(propertyLabel);
      propertyItem.appendChild(propertyValue);
      this.elNode.appendChild(propertyItem);
    });
  }
}
