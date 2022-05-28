import { NodeBegin } from "../nodes/begin";
import { WorkerNode } from "./node";
import { WorkerSetup } from "./setup";


export const PropertyEnum = {
  main: "main_project",
  solution: 'main_solution',
  line: 'main_line',
  variable: 'main_variable',
  groupCavas: "main_groupCavas",
};
export class WorkerManager {
  private $data: any;
  private $nodes: WorkerNode[] = [];
  private $project: any;
  private $group: any = "root";
  public constructor(data: any = null) {
    this.LoadData(data);
  }
  public setProject(project: any) {
    this.$project = project;
    this.$group = "root";
  }
  public getProject() {
    if (this.$data.key === PropertyEnum.solution) {
      return this.$data?.projects?.find((item: any) => item.id == this.$project);
    }
    if (this.$data.key === PropertyEnum.main) {
      return this.$data;
    }
  }
  public setGroup(group: any) {
    this.$group = group;
  }
  public getGroupCurrent() {
    return this.$group;
  }
  public getProjectCurrent() {
    return this.$project;
  }
  public getNodeInGroup(group: any = null) {
    let _group = group ?? this.$group;
    return this.getProject()?.nodes?.filter((item: any) => item.group == _group);
  }
  public getNodeById(_id: any) {
    return this.getNodeInGroup()?.filter((item: any) => item.id == _id)?.[0];
  }

  public getNodeByKey(_key: any) {
    return this.getNodeInGroup()?.filter((item: any) => item.key == _key)?.[0];
  }
  public LoadData(data: any): WorkerManager {
    if (!data) return this;
    if (typeof data === 'string') {
      this.$data = JSON.parse(data);
    } else {
      this.$data = data;
    }
    if (this.$data.key === PropertyEnum.solution) {
      this.$project = this.$data.project;
    }
    if (!this.$project) {
      this.$project = this.$data.projects?.[0]?.id;
    }
    return this;
  }
  public newSetup(setup: any) {
    this.Setup(new setup());
  }
  public Setup(setup: WorkerSetup) {
    this.$nodes = [...this.$nodes, ...setup.newNodes()];
  }
  public getControlNodes() {
    return this.$nodes.map((item: any) => {
      return {
        ...{
          key: "",
          name: "",
          group: "",
          html: "",
          script: "",
          properties: "",
          dot: {
            left: 1,
            top: 0,
            right: 1,
            bottom: 0,
          }
        },
        ...item.option() ?? {},
        key: item.key(),
        name: item.name(),
        icon: item.icon(),
        group: item.group(),
        html: item.html,
        script: item.script,
        properties: item.properties() ?? {},
      }
    })
  }
  private getWorkerNode(_key: string): WorkerNode | null {
    return this.$nodes?.filter((item) => item.checkKey(_key))?.[0];
  }
  private excuteNode($id: any) {
    const dataNode = this.getNodeById($id);
    this.excuteDataNode(dataNode);
  }
  private excuteDataNode(dataNode: any) {
    if (dataNode) {
      console.log(dataNode);
      const workerNode = this.getWorkerNode(dataNode.key);
      workerNode?.execute(dataNode.id, dataNode, this, this.excuteNode.bind(this));
    }
  }
  public excute() {
    const dataNode = this.getNodeByKey(`${NodeBegin}`);
    this.excuteDataNode(dataNode);
  }
}
export const workerManager = new WorkerManager();
