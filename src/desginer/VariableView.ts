import { EventEnum, IMain, VariableNode, ScopeRoot } from "../core/index";

export class VariableView {
  private variables: VariableNode[] | undefined;
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-variable');
    this.main.on(EventEnum.changeVariable, ({ group }: any) => {
      this.Render(group);
    });
    this.main.on(EventEnum.openProject, ({ group }: any) => {
      this.Render(group);
    });
    this.main.on(EventEnum.groupChange, ({ group }: any) => {
      this.Render(group);
    })
    this.Render();
  }
  public Render(group: any = null) {
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
    console.log(this.variables);
    if (this.variables) {
      if (!group) group = [ScopeRoot];
      if (!group.includes(ScopeRoot)) group = [...group, ScopeRoot]
      for (let item of this.variables.filter((item) => group.includes(item.scope))) {
        new VariableItem(item, this).RenderScope(group);
      }
    }
  }
  public changeData() {
    this.main.updateVariable(this.variables ?? []);
  }
}
class VariableItem {
  private elNode: HTMLElement = document.createElement('tr');
  private nameInput: HTMLElement = document.createElement('input');
  private typeInput: HTMLElement = document.createElement('select');
  private scopeInput: HTMLElement = document.createElement('select');
  private valueDefaultInput: HTMLElement = document.createElement('input');
  public constructor(private variable: VariableNode, private parent: VariableView) {
    (this.nameInput as any).value = this.variable.name;
    (this.valueDefaultInput as any).value = this.variable.initalValue ?? '';
    (this.typeInput as any).value = this.variable.type ?? '';
    for (let item of ['text', 'number', 'date', 'object']) {
      let option = document.createElement('option');
      option.text = item;
      option.value = item;
      this.typeInput.appendChild(option);
    }
    let nameColumn = document.createElement('td');
    nameColumn.appendChild(this.nameInput);
    this.elNode.appendChild(nameColumn);
    this.nameInput.addEventListener('keydown', (e: any) => {
      this.variable.name = e.target.value;
      this.change();
    });
    this.nameInput.addEventListener('change', (e: any) => {
      this.variable.name = e.target.value;
      this.change();
    });

    let typeColumn = document.createElement('td');
    typeColumn.appendChild(this.typeInput);
    this.elNode.appendChild(typeColumn);
    this.typeInput.addEventListener('change', (e: any) => {
      this.variable.type = e.target.value;
      this.change();
    });
    let scopeColumn = document.createElement('td');
    scopeColumn.appendChild(this.scopeInput);
    this.elNode.appendChild(scopeColumn);


    let valueDefaultColumn = document.createElement('td');
    valueDefaultColumn.appendChild(this.valueDefaultInput);
    this.elNode.appendChild(valueDefaultColumn);
    this.valueDefaultInput.addEventListener('change', (e: any) => {
      this.variable.initalValue = e.target.value;
      this.change();
    });
    this.valueDefaultInput.addEventListener('keydown', (e: any) => {
      this.variable.initalValue = e.target.value;
      this.change();
    });

    let buttonRemove = document.createElement('button');
    buttonRemove.innerHTML = `-`;
    buttonRemove.addEventListener('click', () => {
      parent.main.removeVariable(variable);
    });
    let buttonRemoveColumn = document.createElement('td');
    buttonRemoveColumn.appendChild(buttonRemove);
    this.elNode.appendChild(buttonRemoveColumn);

    parent.elNode.querySelector('table tbody')?.appendChild(this.elNode);

  }
  change() {
    this.parent.changeData();
  }
  RenderScope(group: any = null) {
    this.scopeInput.innerHTML = '';
    if (group) {
      for (let item of group) {
        if (item === ScopeRoot) continue;
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
    this.scopeInput.addEventListener('change', (e: any) => {
      this.variable.scope = e.target.value;
      this.change();
    });
  }
}
