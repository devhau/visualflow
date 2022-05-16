import { EventEnum, IMain, VariableNode, ScopeRoot } from "../core/index";

export class VariableView {
  private variables: VariableNode[] | undefined;
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-variable');
    this.main.on(EventEnum.changeVariable, this.Render.bind(this));
    this.main.on(EventEnum.openProject, this.Render.bind(this));
  }
  public Render() {
    this.variables = this.main.getVariable();
    this.elNode.innerHTML = `
      <table border="1">
        <thead>
          <tr>
            <td class="variable-name">Name</td>
            <td class="variable-type">Type</td>
            <td class="variable-scope">Scope</td>
            <td class="variable-default">Default</td>
            <td class="variable-button"></td>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    `;
    if (this.variables) {
      for (let item of this.variables) {
        new VariableItem(item, this);
      }
    }
  }
}
class VariableItem {
  private elNode: HTMLElement = document.createElement('tr');
  private nameInput: HTMLElement = document.createElement('input');
  private typeInput: HTMLElement = document.createElement('select');
  private scopeInput: HTMLElement = document.createElement('select');
  private valueDefaultInput: HTMLElement = document.createElement('input');
  public constructor(private variable: VariableNode, parent: VariableView) {
    (this.nameInput as any).value = this.variable.name;
    (this.valueDefaultInput as any).value = this.variable.initalValue ?? '';
    for (let item of ['text', 'number', 'date', 'object']) {
      let option = document.createElement('option');
      option.text = item;
      option.value = item;
      this.typeInput.appendChild(option);
    }
    let nameColumn = document.createElement('td');
    nameColumn.appendChild(this.nameInput);
    this.elNode.appendChild(nameColumn);

    let typeColumn = document.createElement('td');
    typeColumn.appendChild(this.typeInput);
    this.elNode.appendChild(typeColumn);

    let scopeColumn = document.createElement('td');
    scopeColumn.appendChild(this.scopeInput);
    this.elNode.appendChild(scopeColumn);


    let valueDefaultColumn = document.createElement('td');
    valueDefaultColumn.appendChild(this.valueDefaultInput);
    this.elNode.appendChild(valueDefaultColumn);

    let buttonRemove = document.createElement('button');
    buttonRemove.innerHTML = `-`;
    buttonRemove.addEventListener('click', () => {
      parent.main.removeVariable(variable);
    });
    let buttonRemoveColumn = document.createElement('td');
    buttonRemoveColumn.appendChild(buttonRemove);
    this.elNode.appendChild(buttonRemoveColumn);

    parent.elNode.querySelector('table tbody')?.appendChild(this.elNode);
    parent.main.on(EventEnum.groupChange, ({ group }: any) => {
      this.RenderScope(group);
    })
    this.RenderScope();
  }
  RenderScope(group: any = null) {
    this.scopeInput.innerHTML = '';
    if (group) {
      for (let item of group) {
        let option = document.createElement('option');
        option.text = item.text;
        option.value = item.id;
        this.scopeInput.prepend(option);
      }
    }
    let option = document.createElement('option');
    option.text = ScopeRoot;
    option.value = ScopeRoot;
    this.scopeInput.prepend(option);
    (this.scopeInput as any).value = this.variable.scope;
  }
}
