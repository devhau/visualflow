import { WorkerManager } from "../worker/manager";
import { WorkerNode } from "../worker/node";

export class CoreProjectNode extends WorkerNode {
  key(): string {
    return "core_project";
  }
  name() {
    return "Project";
  }
  icon(): string {
    return '<i class="fas fa-project-diagram"></i>';
  }
  properties(): any {
    return {
      project: {
        key: "project",
        edit: true,
        select: true,
        selectNone: 'Select project',
        default: '',
        dataSelect: ({ elNode, main, node }: any) => {
          return main.getProjectAll().map((item: any) => {
            return {
              value: item.Get('id'),
              text: item.Get('name')
            };
          })
        },
      }
    }
  }
  html({ elNode, main, node }: any): string {
    return '<div class="text-center p3"><select class="node-form-control" node:model="project"></select></div>';
  }
  script({ elNode, main, node }: any): void {

  }
  async execute(nodeId: any, data: any, manager: WorkerManager, next: any) {
    const project = manager.getProjectCurrent();
    const group = manager.getGroupCurrent();
    manager.setProject(data.project);
    await manager.excuteAsync();
    manager.setProject(project);
    manager.setGroup(group);
    await this.nextNode(data, next, nodeId);
  }
}
