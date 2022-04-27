import { BaseFlow, FlowCore } from "./BaseFlow"
import { EventEnum } from "./EventEnum";
import { LOG } from "./Utils";
export enum EditorType {
  Label,
  Text,
  Inline
}
export class Editor<TParent extends FlowCore> extends BaseFlow<TParent> {
  private isEdit: boolean = true;
  private elInput: HTMLDataElement | null = null;
  private elLabel: HTMLElement | null = null;

  public constructor(public parent: TParent, private key: string, el: HTMLElement | null = null, private type: EditorType = EditorType.Label, chagne: boolean = false) {
    super(parent);
    this.data = parent.data;
    this.data.onSafe(`${EventEnum.dataChange}_${key}`, this.changeData.bind(this));
    this.data.onSafe(EventEnum.dispose, this.dispose.bind(this));
    this.isEdit = type == EditorType.Text;
    this.elNode.classList.add('node-editor');
    if (chagne && el) {
      el.parentElement?.insertBefore(this.elNode, el);
      el.remove();
    } else if (el) {
      el.appendChild(this.elNode);
    } else {
      this.parent.elNode.appendChild(this.elNode);
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
      this.elInput.addEventListener('keydown', this.inputData.bind(this));
      this.elInput.value = data;
      this.elInput.setAttribute('node:model', this.key);
      this.elNode.appendChild(this.elInput);
    } else {
      if (this.elInput) {
        this.elInput.removeEventListener('keydown', this.inputData.bind(this));
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
    }
  }
  public switchModeEdit() {
    this.isEdit = true;
    this.render();
  }
  public inputData(e: any) {
    this.data.Set(this.key, e.target.value, this);
  }
  public changeData({ key, value, sender }: any) {
    this.render();
    LOG('changeData: ? ? ?', key, value, sender);
  }
  public dispose() {
    this.elInput?.removeEventListener('keydown', this.inputData.bind(this));
    this.elLabel?.removeEventListener('dblclick', this.switchModeEdit.bind(this));
    this.data.removeListener(`${EventEnum.dataChange}_${this.key}`, this.changeData.bind(this));
    this.data.removeListener(EventEnum.dispose, this.dispose.bind(this));
  }

}
