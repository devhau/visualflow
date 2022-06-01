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
    if (this.nodeEditor) {
      this.nodeEditor.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('sug-variable-item')) {
          this.setVar((e.target as any).innerText);
        }
      });
    }
    if (this.keyName)
      this.bindData();
  }

  public setVar(name: any) {
    let selectionStart = (this.elNode as any).selectionStart;
    if (this.property.var) {
      this.setNodeValue(name);
    } else {
      let txt: string = (this.elNode as any).value;

      let startIndex = txt.lastIndexOf("${", selectionStart);
      this.setNodeValue(`${txt.substring(0, startIndex)}\${${name}}${txt.substring(selectionStart, txt.length)}`);

    }
    setTimeout(() => {
      this.elNode?.focus();
      this.showSuggestions(false);
      (this.elNode as any).selectionStart = selectionStart + name.length;
      this.bindEvent();
    });
  }

  private checkShowSuggestions() {
    var arr = this.main.getVariable();
    if (!arr || arr.length == 0) {
      this.showSuggestions(false);
      return;
    }
    let txt: any = (this.elNode as any).value;
    let selectionStart = (this.elNode as any).selectionStart;
    let subTxt: any = "";
    let startIndex: number = 0;
    if (txt) {
      if (this.property.var) {
        subTxt = txt;
        this.showSuggestions(true);
      } else {
        startIndex = txt.lastIndexOf("${", selectionStart);
        let endIndex = txt.lastIndexOf("}", selectionStart);
        if (endIndex < startIndex) {
          subTxt = txt.substring(startIndex + 2, selectionStart);
          this.showSuggestions(true);
        }
        else {
          this.showSuggestions(false);
          return;
        }
      }

    }
    if (this.elSuggestionsContent) {
      let elList = document.createElement('div');
      let flg = false;
      console.log(subTxt);
      for (let item of arr) {
        const name = item.Get('name');
        if (subTxt && !name.startsWith(subTxt)) continue;
        let elItem = document.createElement('button');
        elItem.innerHTML = name;
        elItem.classList.add('sug-variable-item');
        elList.appendChild(elItem);
        flg = true;
      }
      this.elSuggestionsContent.appendChild(elList);
      if (!flg) {
        this.showSuggestions(false);
        return;
      }
      this.suggestionIndex = 0;
      this.setSuggestionIndex(0);
    }
  }
  private showSuggestions(flg: boolean = true) {
    if (!this.elSuggestions) return;
    if (this.elSuggestionsContent) this.elSuggestionsContent.innerHTML = '';
    if (flg) {
      this.elSuggestions.removeAttribute('style');
    } else {
      this.elSuggestions.setAttribute('style', 'display:none;');
    }
  }
  private elFocus: boolean = false;
  private regexValidate: any = null;
  private suggestionIndex: number = 0;
  private setSuggestionIndex(index: any) {
    if (!this.elSuggestions) return;
    let temp = (this.suggestionIndex + index);
    if (0 > temp || temp >= this.elSuggestions.querySelectorAll('.sug-variable-item').length - 1) return;
    this.suggestionIndex = temp;
    this.elSuggestions.querySelectorAll('.sug-variable-item').forEach((item, itemIndex) => {
      item.classList.remove('active');
      if (itemIndex == this.suggestionIndex) {
        item.classList.add('active');
      }
    })
  }
  private bindData() {
    if (this.keyName && this.elNode) {
      if (this.property.validate) {
        this.regexValidate = new RegExp(this.property.validate, 'i')
      }
      this.data.on(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
      // this.elNode.addEventListener('change', this.bindEvent.bind(this));
      this.elNode.addEventListener('keydown', (e: any) => {
        var charCode = (e.which) ? e.which : e.keyCode;
        if (charCode == 13 && this.suggestionIndex > -1) {
          let nameVar = this.elSuggestions?.querySelector('.active')?.innerHTML;
          if (nameVar) {
            this.setVar(nameVar);
          }
          e.preventDefault();
          e.returnValue = false;
          e.cancelBubble = true;
          return false;
        }
        if (charCode == 38) { // Up
          this.setSuggestionIndex(-1);
          e.preventDefault();
          e.returnValue = false;
          e.cancelBubble = true;
          return false;
        }
        if (charCode == 40) { // Down
          this.setSuggestionIndex(1);
          e.preventDefault();
          e.returnValue = false;
          e.cancelBubble = true;
          return false;
        }
        this.bindEvent();
      });
      this.elNode.addEventListener('paste', (e: any) => {
        if (this.regexValidate && !this.regexValidate.test(e.clipboardData.getData('Text'))) {
          e.preventDefault();
          e.returnValue = false;
          e.cancelBubble = true;
          return false;
        }
      });
      this.elNode.addEventListener('keypress', (e: any) => {
        var charCode = (e.which) ? e.which : e.keyCode;
        if (this.regexValidate && !this.regexValidate.test(String.fromCharCode(charCode))) {
          e.stopPropagation();
          e.preventDefault();
          e.returnValue = false;
          e.cancelBubble = true;
          return false;
        }
      });
      this.elNode.addEventListener('focus', () => {
        this.elFocus = true; this.suggestionIndex = 0;
        if (this.elSuggestions)
          this.elNode?.parentElement?.appendChild(this.elSuggestions);
      });
      this.elNode.setAttribute('autocomplete', 'off');
      this.elNode.addEventListener('blur', () => {
        this.elFocus = false;
        setTimeout(() => {
          if (this.elSuggestions && !this.elFocus) {
            this.elNode?.parentElement?.removeChild?.(this.elSuggestions);
            this.suggestionIndex = -1;
          }
        }, 500);
      });
      this.elNode.addEventListener("select", () => {
        this.checkShowSuggestions();
      })
      if (this.elNode && this.property && this.property.select && isFunction(this.property.dataSelect)) {
        if (this.property.selectNone) {
          let option = document.createElement('option');
          option.value = '';
          option.text = this.property.selectNone;
          this.elNode?.appendChild(option);
          (this.elNode as any).value = '';
        }

        this.property.dataSelect({ elNode: this.elNode, main: this.main, key: this.keyName }).forEach((item: any) => {
          let option = document.createElement('option');
          option.value = item.value;
          option.text = item.text;
          this.elNode?.appendChild(option);
        });
      }
      if (this.property && isFunction(this.property.script)) {
        this.property.script({ elNode: this.elNode, main: this.main, key: this.keyName });
      }
      this.setNodeValue(this.data.Get(this.keyName) ?? '');
    }
  }
  private setNodeValue(value: any) {
    if (this.elNode) {
      if (TagView.includes(this.elNode.tagName)) {
        (this.elNode as any).innerText = `${value ?? ""}`;
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
