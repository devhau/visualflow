
import { NodeItem } from "../desginer/NodeItem";
import { DataFlow } from "./DataFlow";

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
  removeProject($data: any): void;
  checkProjectOpen($data: any): boolean;
  getControlAll(): any;
  setControlChoose(key: string | null): void;
  getControlChoose(): string | null;
  getControlByKey(key: string): any;
  renderHtml(detail: any): void;
  initOption(option: any, isDefault: boolean): void;
  checkInitOption(): boolean;
  importJson(data: any): void;
  exportJson(): any;
  getVariable(): DataFlow[];
  addVariable(): DataFlow;
  newVariable(): DataFlow;
  removeVariable(varibale: DataFlow): void;
  getGroupCurrent(): any;
  running(): boolean;
  setRunning(flg: any): void;
  runProject(): void;
  stopProject(): void;
  callbackRunProject(callback: any): void;
  callbackStopProject(callback: any): void;
}
