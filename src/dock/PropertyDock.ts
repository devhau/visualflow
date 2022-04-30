import { IMain } from "../core/BaseFlow";
import { EventEnum } from "../core/Constant";
import { DataFlow } from "../core/DataFlow";
import { Editor, EditorType } from "../core/Editor";
import { DockBase } from "./DockBase";

export class PropertyDock extends DockBase {
  private lastData: DataFlow | undefined;
  private labelKeys: string[] = ['id', 'key'];
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
    let properties: any = data.getProperties()
    Object.keys(properties).forEach((key: string) => {
      let propertyItem = document.createElement('div');
      propertyItem.classList.add('property-item');
      let propertyLabel = document.createElement('div');
      propertyLabel.classList.add('property-label');
      propertyLabel.innerHTML = key;
      let propertyValue = document.createElement('div');
      propertyValue.classList.add('property-value');
      if (this.labelKeys.includes(key)) {
        new Editor(data, key, propertyValue, EditorType.Label);
      } else {
        new Editor(data, key, propertyValue, EditorType.Text);
      }
      propertyItem.appendChild(propertyLabel);
      propertyItem.appendChild(propertyValue);
      node.appendChild(propertyItem);
    })
  }
}
