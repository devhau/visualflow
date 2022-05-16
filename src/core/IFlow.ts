
import { Node } from "../desginer/Node";
import { VariableNode } from "./VariableNode";

export interface IProperty {
  getPropertyByKey(key: string): any;
}
export interface IControlNode extends IProperty {
  getControlNodeByKey(key: string): any;
}
export interface IEvent {
  onSafe(event: string, callback: any): void;
  on(event: string, callback: any): void;
  removeListener(event: string, callback: any): void;
  dispatch(event: string, details: any): void;
}
export interface IMain extends IControlNode, IEvent {
  newSolution($name: string): void;
  openSolution($data: any): void;
  newProject($name: string): void;
  openProject($name: string): void;
  getProjectAll(): any[];
  setProjectOpen($data: any): void;
  checkProjectOpen($data: any): boolean;
  getControlAll(): any;
  setControlChoose(key: string | null): void;
  getControlChoose(): string | null;
  getControlByKey(key: string): any;
  renderHtml(node: Node, elParent: Element): void;
  initOption(option: any, isDefault: boolean): void;
  checkInitOption(): boolean;
  importJson(data: any): void;
  exportJson(): any;
  getVariable(): VariableNode[];
  addVariable(): VariableNode;
  newVariable(): VariableNode;
  removeVariable(varibale: VariableNode): void;
}
