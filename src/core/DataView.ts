import { IMain } from "./BaseFlow";
import { EventEnum } from "./Constant";
import { DataFlow } from "./DataFlow";
import { isFunction } from "./Utils";

export const TagView = ['SPAN', 'DIV', 'P', 'TEXTAREA'];
export class DataView {
  private elNode: Element | undefined;
  private property: any;
  public constructor(private el: Element, private data: DataFlow, private main: IMain, private keyName: string | null = null) {
    if (this.keyName) {
      if (!el.getAttribute('node:model')) {
        this.property = this.main.getPropertyByKey(this.data.Get('key'))?.[this.keyName];
        this.el.classList.add('node-editor');
        if (this.property.edit) {
          if (this.property.select) {
            this.elNode = document.createElement('select');
          } else {
            this.elNode = document.createElement('input');
          }
          this.elNode.classList.add("node-form-control");
        } else {
          this.elNode = document.createElement('span');
        }
        this.elNode.setAttribute('node:model', this.keyName);
        this.el.appendChild(this.elNode);
      }
    } else {
      this.keyName = el?.getAttribute('node:model');
      if (this.keyName) {
        this.property = this.main.getPropertyByKey(this.data.Get('key'))?.[this.keyName];
        this.elNode = this.el;
        let nodeEditor = document.createElement('span');
        nodeEditor.classList.add('node-editor');
        el.parentElement?.insertBefore(nodeEditor, el);
        el.parentElement?.removeChild(el);
        nodeEditor.appendChild(this.elNode);
      }
    }
    if (this.keyName)
      this.bindData();
  }
  private bindData() {
    if (this.keyName && this.elNode) {
      this.data.on(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
      this.elNode.addEventListener('change', this.bindEvent.bind(this));
      this.elNode.addEventListener('keypress', this.bindEvent.bind(this));
      if (this.property && this.property.select && isFunction(this.property.dataSelect)) {
        const options = this.property.dataSelect({ elNode: this.elNode, main: this.main, key: this.keyName }).map(({ value, text }: any) => {
          let option = document.createElement('option');
          option.value = value;
          option.text = text;
          return option;
        });
        for (let option of options) {
          this.elNode.appendChild(option);
        }

      }
      if (this.property && isFunction(this.property.script)) {
        this.property.script({ elNode: this.elNode, main: this.main, key: this.keyName });
      }
      this.setNodeValue(this.data.Get(this.keyName));
    }
  }
  private setNodeValue(value: any) {
    if (this.elNode) {
      if (TagView.includes(this.elNode.tagName)) {
        (this.elNode as any).innerText = `${value}`;
      } else {
        (this.elNode as any).value = value;
      }
    }

  }
  private bindInput({ value, sender }: any) {
    if (sender !== this && this.elNode && sender.elNode !== this.elNode) {
      this.setNodeValue(value);
    }
  }
  private bindEvent() {
    setTimeout(() => {
      if (this.keyName && this.elNode) {
        this.data.Set(this.keyName, (this.elNode as any).value, this);
      }
    });
  }
  public Delete() {
    if (this.keyName && this.elNode) {
      this.data.removeListener(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
      this.elNode.removeEventListener('change', this.bindEvent.bind(this));
      this.elNode.removeEventListener('keydown', this.bindEvent.bind(this));
    }
  }
  public static BindElement(el: Element, data: DataFlow, main: IMain, key: string | null = null): DataView[] {
    if (el.childElementCount == 0 || el.getAttribute('node:model')) {
      return [new DataView(el, data, main, key)];
    }
    return Array.from(el.querySelectorAll('[node\\:model]')).map((item: Element) => {
      return new DataView(item, data, main);
    });
  }

}
