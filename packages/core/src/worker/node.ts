import { WorkerManager } from "./manager";

export type OptionNode = void & {
  key: "",
  name: "",
  group: "",
  html: "",
  script: "",
  properties: "",
  onlyNode: boolean,
  dot: {
    left: 1,
    top: 0,
    right: 1,
    bottom: 0,
  }
}
export class WorkerNode {
  key(): any {
    return this.constructor.name;
  }
  public checkKey(key: string) {
    return this.key() == key;
  }
  name(): any { return this.constructor.name; }
  icon(): any { return '<i class="fas fa-play"></i>'; }
  group(): any {
    return "Common";
  }
  html(node: any, elParent: any) {
    return ``;
  }
  script({ elNode, main, node }: any) { }
  properties(): any { }
  option(): any { }
  execute(nodeId: any, data: any, manager: WorkerManager, next: any) {

  }
  protected nextNode(data: any, next: any, nodeId: any, index: any = null) {
    if (data?.lines) {
      for (let item of data.lines) {
        if (item.from == nodeId && (index == null || item.fromIndex == index)) {
          next(item.to);
        }
      }
    }
  }
}
