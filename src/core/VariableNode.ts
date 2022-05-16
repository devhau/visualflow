import { EventFlow } from "./EventFlow";

export const ScopeRoot = "root";
export class VariableNode extends EventFlow {
  name: string = '';
  value: any;
  initalValue: any;
  scope: string = ScopeRoot;
}
