import { DataFlow, EventEnum, IMain, ScopeRoot } from "../core/index";

export class VariableView {
  private variables: DataFlow[] | undefined;
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-variable');
    this.main.onSafe(EventEnum.changeVariable, ({ data }: any) => {
      this.Render();
    });
    this.main.onSafe(EventEnum.openProject, () => {
      this.Render();
    });
    this.main.onSafe(EventEnum.groupChange, () => {
      this.Render();
    })
    this.Render();
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
        new VariableItem(item, this).RenderScope(this.main.getGroupCurrent());
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
  public constructor(private variable: DataFlow, private parent: VariableView) {
    (this.nameInput as any).value = this.variable.Get('name');
    (this.valueDefaultInput as any).value = this.variable.Get('initalValue') ?? '';
    (this.typeInput as any).value = this.variable.Get('type') ?? '';
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
      this.variable.Set('name', e.target.value);
    });
    this.nameInput.addEventListener('change', (e: any) => {
      this.variable.Set('name', e.target.value);
    });

    let typeColumn = document.createElement('td');
    typeColumn.appendChild(this.typeInput);
    this.elNode.appendChild(typeColumn);
    this.typeInput.addEventListener('change', (e: any) => {
      this.variable.Set('type', e.target.value);
    });
    let scopeColumn = document.createElement('td');
    scopeColumn.appendChild(this.scopeInput);
    this.elNode.appendChild(scopeColumn);


    let valueDefaultColumn = document.createElement('td');
    valueDefaultColumn.appendChild(this.valueDefaultInput);
    this.elNode.appendChild(valueDefaultColumn);
    this.valueDefaultInput.addEventListener('change', (e: any) => {
      this.variable.Set('initalValue', e.target.value);
    });
    this.valueDefaultInput.addEventListener('keydown', (e: any) => {
      this.variable.Set('initalValue', e.target.value);
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
    (this.scopeInput as any).value = this.variable.Get('scope');
    this.scopeInput.addEventListener('change', (e: any) => {
      this.variable.Set('scope', e.target.value);
    });
  }
}
