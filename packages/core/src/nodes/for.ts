import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreForNode extends WorkerNode {
  key(): string {
    return "core_for";
  }
  name() {
    return "For";
  }
  icon() {
    return '<i class="fas fa-long-arrow-alt-right"></i>';
  }
  properties(): any {
    return {
      number_start: {
        key: "number_start",
        edit: true,
        default: 1
      },
      number_end: {
        key: "number_end",
        edit: true,
        default: 1
      },
      number_step: {
        key: "number_step",
        edit: true,
        default: 1
      },
      env_name: {
        key: "env_name",
        edit: true,
        default: 'loop_index'
      }
    }
  }

  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    const group = manager.getGroupCurrent();
    manager.setGroup(data.id);
    for (let loop_index = data.number_start; loop_index < data.number_end; loop_index = loop_index + data.number_step) {

      await manager.excuteAsync();
    }
    manager.setGroup(group);
    await this.nextNode(data, next, nodeId);
  }
}
