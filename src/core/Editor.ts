import { BaseFlow, FlowCore } from "./BaseFlow"
import { EventEnum } from "./Constant";
import { DataFlow } from "./DataFlow";
export enum EditorType {
  Label,
  Text,
  Inline
}
export const TagView = ['SPAN', 'DIV', 'P', 'TEXTAREA'];
export class DataView {
  private keyName: string | null | undefined = "";
  public constructor(public data: DataFlow, private el: HTMLElement | null = null) {
    this.keyName = el?.getAttribute('node:model');
    this.bindData();
  }
  private bindData() {
    if (this.keyName && this.el) {
      this.data.on(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
      this.el.addEventListener('change', this.bindEvent.bind(this));
      this.el.addEventListener('keydown', this.bindEvent.bind(this));
    }
  }
  public unBindData() {
    if (this.keyName && this.el) {
      this.data.removeListener(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
      this.el.removeEventListener('change', this.bindEvent.bind(this));
      this.el.removeEventListener('keydown', this.bindEvent.bind(this));
    }
  }
  private bindInput({ value, sender }: any) {

    if (sender !== this && this.el && sender.el !== this.el) {
      console.log(this.el.tagName);
      console.log(sender);
      if (TagView.includes(this.el.tagName)) {
        this.el.innerText = `${value}`;
      } else {
        (this.el as any).value = value;
      }
    }
  }
  private bindEvent() {
    if (this.keyName && this.el) {
      console.log(this.keyName);
      this.data.Set(this.keyName, (this.el as any).value, this);
    }
  }
  public static BindView(data: DataFlow, root: Element) {
    if (root) {
      return Array.from(root.querySelectorAll('[node\\:model]')).map((el) => {
        return new DataView(data, el as HTMLElement);
      });
    }
    return [];
  }
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
