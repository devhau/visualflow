import { DesginerView } from "./DesginerView";

export class DesginerView_Toolbar {
  private elNode: HTMLElement | undefined;
  private elPathGroup: HTMLElement = document.createElement('div');
  public constructor(private parent: DesginerView) {
    this.elNode = parent.elToolbar;
    this.renderUI();
    this.renderPathGroup();
  }
  public renderPathGroup() {
    this.elPathGroup.innerHTML = ``;
    let groups = this.parent.GetGroupName();
    let len = groups.length - 1;
    if (len < 0) return;
    let text = document.createElement('span');
    text.innerHTML = `Root`;
    this.elPathGroup.appendChild(text);
    for (let index = len; index >= 0; index--) {
      let text = document.createElement('span');
      text.innerHTML = `>>${groups[index]}`;
      this.elPathGroup.appendChild(text);
    }
  }
  public renderUI() {
    if (!this.elNode) return;
    this.elNode.innerHTML = ``;
    let btnBack = document.createElement('button');
    btnBack.addEventListener('click', () => this.parent.BackGroup());
    btnBack.innerHTML = `Back`;
    let btnZoomIn = document.createElement('button');
    btnZoomIn.addEventListener('click', () => this.parent.zoom_in());
    btnZoomIn.innerHTML = `Zoom+`;
    let btnZoomOut = document.createElement('button');
    btnZoomOut.addEventListener('click', () => this.parent.zoom_out());
    btnZoomOut.innerHTML = `Zoom-`;
    this.elNode.appendChild(this.elPathGroup);
    this.elNode.appendChild(btnBack);
    this.elNode.appendChild(btnZoomIn);
    this.elNode.appendChild(btnZoomOut);
  }
}
