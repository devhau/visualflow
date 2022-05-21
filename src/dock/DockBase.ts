import { IMain } from "../core/index";

export class DockBase {
  public elNode: HTMLElement = document.createElement('div');
  protected elContent: Element | undefined | null;
  public constructor(container: HTMLElement, protected main: IMain) {
    container.appendChild(this.elNode);
    this.elNode.innerHTML = 'DockBase';
  }

  public BoxInfo(title: string, $callback: any) {
    this.elNode.classList.remove('vs-boxinfo');
    this.elNode.classList.add('vs-boxinfo');
    this.elNode.innerHTML = `<div class="vs-boxinfo_header"><span class="vs-boxinfo_title">${title}</span><span class="vs-boxinfo_button"></span></div>
    <div class="vs-boxinfo_warp"><div class="vs-boxinfo_content"></div></div>`;
    this.elContent = this.elNode.querySelector('.vs-boxinfo_content');
    if ($callback) {
      $callback(this.elContent);
    }
  }
}
