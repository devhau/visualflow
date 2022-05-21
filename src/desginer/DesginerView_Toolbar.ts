import { DesginerView } from "./DesginerView";

export class DesginerView_Toolbar {
  private elNode: HTMLElement | undefined;
  private elPathGroup: HTMLElement = document.createElement('div');
  private btnBack = document.createElement('button');
  public constructor(private parent: DesginerView) {
    //  this.elNode = parent.elToolbar;
    this.elPathGroup.classList.add('toolbar-group');
    this.renderUI();
    this.renderPathGroup();
  }
  public renderPathGroup() {
    this.btnBack.setAttribute('style', `display:none;`);
    this.elPathGroup.innerHTML = ``;
    let groups = this.parent.GetGroupName();
    let len = groups.length - 1;
    if (len < 0) return;
    for (let index = len; index >= 0; index--) {
      let text = document.createElement('span');
      if (index == 0) {
        text.innerHTML = `${groups[index].text}`;
      } else {
        text.innerHTML = `${groups[index].text} >> `;
      }
      text.setAttribute('group', groups[index].id);
      text.addEventListener('click', (ev) => this.parent.BackGroup(groups[index].id));
      this.elPathGroup.appendChild(text);
    }
    if (len > 1)
      this.btnBack.removeAttribute('style');
  }
  public renderUI() {
    if (!this.elNode) return;
    this.elNode.innerHTML = ``;
    this.btnBack.addEventListener('click', () => this.parent.BackGroup());
    this.btnBack.innerHTML = `Back`;
    let btnZoomIn = document.createElement('button');
    btnZoomIn.addEventListener('click', () => this.parent.zoom_in());
    btnZoomIn.innerHTML = `+`;
    let btnZoomOut = document.createElement('button');
    btnZoomOut.addEventListener('click', () => this.parent.zoom_out());
    btnZoomOut.innerHTML = `-`;
    let btnZoomReset = document.createElement('button');
    btnZoomReset.addEventListener('click', () => this.parent.zoom_reset());
    btnZoomReset.innerHTML = `*`;
    let buttonGroup = document.createElement('div');
    buttonGroup.classList.add('toolbar-button')
    buttonGroup.appendChild(this.btnBack);
    buttonGroup.appendChild(btnZoomIn);
    buttonGroup.appendChild(btnZoomOut);
    buttonGroup.appendChild(btnZoomReset);
    this.elNode.appendChild(this.elPathGroup);
    this.elNode.appendChild(buttonGroup);
  }
}
