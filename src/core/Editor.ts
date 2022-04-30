import { BaseFlow, FlowCore } from "./BaseFlow"
import { EventEnum } from "./Constant";
import { DataFlow } from "./DataFlow";
import { LOG } from "./Utils";
export enum EditorType {
  Label,
  Text,
  Inline
}
export class Editor {
  private isEdit: boolean = false;
  private elInput: HTMLDataElement | null = null;
  private elLabel: HTMLElement | null = null;
  private elNode: HTMLElement = document.createElement('div');
  public constructor(public data: DataFlow, private key: string, el: HTMLElement | null = null, private type: EditorType = EditorType.Label, chagne: boolean = false) {

    this.data = data;
    this.data.onSafe(`${EventEnum.dataChange}_${key}`, this.changeData.bind(this));
    this.data.onSafe(EventEnum.dispose, this.dispose.bind(this));
    this.isEdit = type === EditorType.Text;
    this.elNode.classList.add('node-editor');
    if (chagne && el) {
      el.parentElement?.insertBefore(this.elNode, el);
      el.parentElement?.removeChild(el);
      el?.remove();
    } else if (el) {
      el.appendChild(this.elNode);
    }
    this.render();
  }
  public render() {
    let data = this.data.Get(this.key);

    if (this.isEdit) {
      if (this.elLabel) {
        this.elLabel.removeEventListener('dblclick', this.switchModeEdit.bind(this));
        this.elLabel.remove();
        this.elLabel = null;
      }
      if (this.elInput) {
        this.elInput.value = data;
        return;
      }
      this.elInput = document.createElement('input');
      this.elInput.classList.add('node-form-control');
      this.elInput.addEventListener('keydown', this.inputData.bind(this));
      this.elInput.value = data;
      this.elInput.setAttribute('node:model', this.key);
      this.elNode.appendChild(this.elInput);
    } else {
      if (this.elInput) {
        this.elInput.removeEventListener('keyup', this.inputData.bind(this));
        this.elInput.remove();
        this.elInput = null;
      }
      if (this.elLabel) {
        this.elLabel.innerHTML = data;
        return;
      }
      this.elLabel = document.createElement('span');
      if (this.type == EditorType.Inline) {
        this.elLabel.addEventListener('dblclick', this.switchModeEdit.bind(this));
      }
      this.elLabel.setAttribute('node:model', this.key);
      this.elLabel.innerHTML = data;
      this.elNode.appendChild(this.elLabel);
    }
  }
  public switchModeEdit() {
    this.isEdit = true;
    this.render();
  }
  public inputData(e: any) {
    setTimeout(() => {
      this.data.Set(this.key, e.target.value, this);
    })
  }
  public changeData({ key, value, sender }: any) {
    this.render();
  }
  public dispose() {
    this.elInput?.removeEventListener('keydown', this.inputData.bind(this));
    this.elLabel?.removeEventListener('dblclick', this.switchModeEdit.bind(this));
    this.data.removeListener(`${EventEnum.dataChange}_${this.key}`, this.changeData.bind(this));
    this.data.removeListener(EventEnum.dispose, this.dispose.bind(this));
  }

}
