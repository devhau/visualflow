import { EventEnum, IMain, Variable } from "../core/index";
import { ScopeRoot } from "../core/Variable";

export class VariableView {
  private variables: Variable[] | undefined;
  public constructor(public elNode: HTMLElement, public main: IMain) {
    this.elNode.classList.add('vs-variable');
    this.main.on(EventEnum.changeVariable, this.Render.bind(this));
    this.main.on(EventEnum.openProject, this.Render.bind(this));
  }
  public Render() {
    this.variables = this.main.getVariable();
    this.elNode.innerHTML = `
      <table>
        <thead>
          <tr>
            <td>Name</td>
            <td>Scope</td>
            <td>InitalValue</td>
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
  private scopeInput: HTMLElement = document.createElement('select');
  private initValueInput: HTMLElement = document.createElement('input');
  public constructor(private variable: Variable, parent: VariableView) {
    this.elNode.classList.add('variable-item');
    (this.nameInput as any).value = this.variable.name;
    this.nameInput.classList.add('variable-name');
    (this.initValueInput as any).value = this.variable.initalValue ?? '';
    this.initValueInput.classList.add('variable-init-value');
    this.scopeInput.classList.add('variable-scope');

    let nameColumn = document.createElement('td');
    nameColumn.appendChild(this.nameInput);
    let scopeColumn = document.createElement('td');
    scopeColumn.appendChild(this.scopeInput);
    let initValueColumn = document.createElement('td');
    initValueColumn.appendChild(this.initValueInput);

    this.elNode.appendChild(nameColumn);
    this.elNode.appendChild(scopeColumn);
    this.elNode.appendChild(initValueColumn);
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
