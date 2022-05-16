import { IMain, getTime } from "../core/index";
import { VariableView } from "../desginer/index";
import { DockBase } from "./DockBase";

export class VariableDock extends DockBase {
  public constructor(container: HTMLElement, protected main: IMain) {
    super(container, main);
    this.elNode.classList.add('vs-variable');
    this.BoxInfo('Variable', (node: HTMLElement) => {
      new VariableView(node, main);
    });
    let $nodeRight: HTMLElement | null = this.elNode.querySelector('.vs-boxinfo_header .vs-boxinfo_button');
    if ($nodeRight) {
      $nodeRight.innerHTML = ``;
      let buttonNew = document.createElement('button');
      $nodeRight?.appendChild(buttonNew);
      buttonNew.innerHTML = `New Variable`;
      buttonNew.addEventListener('click', () => {
        this.main.newVariable().name = `var${getTime()}`;
      });
    }
  }
}
