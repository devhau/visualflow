import { IEvent } from "../core/BaseFlow";

export class DockBase {
  public elNode: HTMLElement = document.createElement('div');
  public constructor(container: HTMLElement, protected event: IEvent) {
    container.appendChild(this.elNode);
    this.elNode.innerHTML = 'DockBase';
  }
  public BoxInfo(title: string, $callback: any) {
    this.elNode.classList.remove('vs-boxinfo');
    this.elNode.classList.add('vs-boxinfo');
    this.elNode.innerHTML = `<div class="vs-boxinfo_title">${title}</div>
    <div class="vs-boxinfo_content"></div>`;
    if ($callback) {
      $callback(this.elNode.querySelector('.vs-boxinfo_content'));
    }
  }
}
