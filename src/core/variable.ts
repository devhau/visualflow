import { EventFlow } from "./EventFlow";

export const VariableScorp = "root";
export class Variable extends EventFlow {
  name: string = '';
  value: any;
  initalValue: any;
  scorp: string = VariableScorp;
}
