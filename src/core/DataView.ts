import { IMain } from "./IFlow";
import { EventEnum } from "./Constant";
import { DataFlow } from "./DataFlow";
import { isFunction } from "./Utils";

export const TagView = ['SPAN', 'DIV', 'P', 'TEXTAREA'];
export class DataView {
  private elNode: HTMLElement | undefined;
  private property: any;
  private elSuggestions: Element | undefined;
  private elSuggestionsContent: Element | undefined;
  private nodeEditor: HTMLElement | undefined;
  public constructor(private el: Element, private data: DataFlow, private main: IMain, private keyName: string | null = null) {
    if (this.keyName) {
      if (!el.getAttribute('node:model')) {
        this.property = this.main.getPropertyByKey(this.data.Get('key'))?.[this.keyName];
        this.nodeEditor = el as HTMLElement;
        this.nodeEditor.classList.add('node-editor');
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
        this.elNode = this.el as HTMLElement;
        this.nodeEditor = document.createElement('span');
        this.nodeEditor.classList.add('node-editor');
        el.parentElement?.insertBefore(this.nodeEditor, el);
        el.parentElement?.removeChild(el);
        this.nodeEditor.appendChild(this.elNode);
      }
    }
    this.elSuggestions = document.createElement('div');
    this.elSuggestions.classList.add('node-editor_suggestions');
    this.elSuggestionsContent = document.createElement('div');
    this.elSuggestionsContent.classList.add('suggestions_content');
    this.elSuggestions.appendChild(this.elSuggestionsContent);
    this.showSuggestions(false);
    if (this.keyName)
      this.bindData();
  }
  private checkShowSuggestions() {
    if (this.elSuggestionsContent) {
      this.elSuggestionsContent.innerHTML = '';
      var arr = this.main.getVariable();
      if (!arr || arr.length == 0) {
        this.showSuggestions(false);
        return;
      }
      let elUl = document.createElement('ul');
      for (let item of arr) {
        let elLi = document.createElement('li');
        let elLink = document.createElement('a');
        elLi.appendChild(elLink);
        elLink.innerHTML = item.Get('name');
        elLink.addEventListener('click', () => {
          alert(elLink.innerHTML);
        });
        elUl.appendChild(elLi);
      }
      this.elSuggestionsContent.appendChild(elUl);
    }
    let txt: any = (this.elNode as any).value;
    let selectionStart = (this.elNode as any).selectionStart;
    if (txt) {
      let startIndex = txt.lastIndexOf("${", selectionStart);
      let endIndex = txt.lastIndexOf("}", selectionStart);
      if (endIndex < startIndex)
        this.showSuggestions(true);
      else
        this.showSuggestions(false);
    }
  }
  private showSuggestions(flg: boolean = true) {
    if (!this.elSuggestions) return;
    if (flg) {
      this.elSuggestions.removeAttribute('style');
    } else {
      this.elSuggestions.setAttribute('style', `display:none;`);
    }
  }
  private bindData() {
    if (this.keyName && this.elNode) {
      this.data.on(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
      this.elNode.addEventListener('change', this.bindEvent.bind(this));
      this.elNode.addEventListener('keydown', this.bindEvent.bind(this));
      this.elNode.addEventListener('focus', () => {
        if (this.elSuggestions)
          this.elNode?.parentElement?.appendChild(this.elSuggestions);
      });
      this.elNode.addEventListener('blur', () => {
        setTimeout(() => {
          if (this.elSuggestions)
            this.elNode?.parentElement?.removeChild(this.elSuggestions);
        });
      });
      this.elNode.addEventListener("select", () => {
        this.checkShowSuggestions();
      })
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
      this.setNodeValue(this.data.Get(this.keyName) ?? "");
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
    if (sender !== this && this.elNode && sender?.elNode !== this.elNode) {
      this.setNodeValue(value ?? "");
    }
  }
  private bindEvent() {
    setTimeout(() => {
      if (this.keyName && this.elNode) {
        this.data.Set(this.keyName, (this.elNode as any).value, this);
        this.checkShowSuggestions();
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
