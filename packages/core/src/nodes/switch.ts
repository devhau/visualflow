import { WorkerNode } from "../worker/node";

export class CoreSwitchNode extends WorkerNode {
  key(): string {
    return "core_switch";
  }
  name() {
    return "Switch";
  }
}
