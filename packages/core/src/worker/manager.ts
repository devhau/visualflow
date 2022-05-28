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
  private events: any = {};
  public onSafe(event: string, callback: any) {
    this.removeListener(event, callback);
    this.on(event, callback);
  }
  /* Events */
  public on(event: string, callback: any) {
    // Check if the callback is not a function
    if (typeof callback !== 'function') {
      console.error(`The listener callback must be a function, the given type is ${typeof callback}`);
      return false;
    }
    // Check if the event is not a string
    if (typeof event !== 'string') {
      console.error(`The event name must be a string, the given type is ${typeof event}`);
      return false;
    }
    // Check if this event not exists
    if (this.events[event] === undefined) {
      this.events[event] = {
        listeners: []
      }
    }
    this.events[event].listeners.push(callback);
  }

  public removeListener(event: string, callback: any) {
    // Check if this event not exists

    if (!this.events[event]) return false

    const listeners = this.events[event].listeners
    const listenerIndex = listeners.indexOf(callback)
    const hasListener = listenerIndex > -1
    if (hasListener) listeners.splice(listenerIndex, 1)
  }

  public dispatch(event: string, details: any) {
    // Check if this event not exists
    if (this.events[event] === undefined) {
      return false;
    }
    this.events[event].listeners.forEach((listener: any) => {
      listener(details);
    });
  }
  private $data: any;
  private $nodes: WorkerNode[] = [];
  private $project: any;
  private $group: any = "root";
  private delay_time: number = 100;
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
  private async excuteNode($id: any) {
    const dataNode = this.getNodeById($id);
    await this.excuteDataNode(dataNode);
  }
  delay(time: number = 100) {
    return new Promise(resolve => setTimeout(resolve, time));
  }
  private async excuteDataNode(dataNode: any) {
    if (this.flgStopping) {
      this.dispatch('worker_stopping', {});
      return;
    }
    await this.delay(this.delay_time);
    if (dataNode) {
      this.dispatch('node_start', { node: dataNode });
      const workerNode = this.getWorkerNode(dataNode.key);
      await workerNode?.execute(dataNode.id, dataNode, this, this.excuteNode.bind(this));
      this.dispatch('node_end', { node: dataNode });
    }
  }
  public async excuteAsync() {
    const dataNode = this.getNodeByKey(`${NodeBegin}`);
    await this.excuteDataNode(dataNode);
  }
  public excute() {
    setTimeout(async () => {
      this.dispatch('worker_start', {});
      try {
        this.flgStopping = false;
        await this.excuteAsync();
        this.flgStopping = false;
        this.dispatch('worker_end', {});
      } catch (ex) {
        console.log(ex);
        this.dispatch('worker_end', {});
      }
      this.flgStopping = false;
    });
  }
  flgStopping: any = null;
  public stop() {
    this.flgStopping = true;
  }
}
export const workerManager = new WorkerManager();
