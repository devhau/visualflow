import { WorkerFlow } from "../WorkerFlow";
import { BaseFlow } from "./BaseFlow";
export class TabItemFlow extends BaseFlow<TabFlow>{
  public ItemId: any;
  public constructor(parent: TabFlow, private dataItem: any) {
    super(parent);
    this.Id = this.parent.parent.getUuid();
    this.ItemId = dataItem.Id;
    this.elNode = document.createElement('div');
    this.elNode.classList.add("workerflow-item");
    this.elNode.setAttribute('data-project', this.ItemId);
    let nodeName = document.createElement('span');
    nodeName.setAttribute('node:model', 'name');
    nodeName.innerHTML = dataItem.name;
    this.elNode.appendChild(nodeName);
    this.parent.elNode.appendChild(this.elNode);
    this.elNode.addEventListener('click', this.ClickTab.bind(this));
  }
  private ClickTab(e: any) {
    this.parent.LoadProjectById(this.ItemId);
  }
  public SetData(dataItem: any) {
    this.dataItem = dataItem;
  }
  public Active(flg: boolean = true) {
    if (flg) {
      this.elNode.classList.add('active');
      this.parent.parent.View?.load(this.dataItem);
      this.parent.parent.View?.data.BindEvent(this);
    } else {
      this.elNode.classList.remove('active');
      this.parent.parent.View?.data.RemoveEvent(this);
    }
  }

}
export class TabFlow extends BaseFlow<WorkerFlow>  {
  public tabs: TabItemFlow[] = [];
  private tabActive: TabItemFlow | undefined;
  public constructor(parent: WorkerFlow) {
    super(parent);
    this.elNode = this.parent.elNode.querySelector('.workerflow-items') || this.elNode;
    if (this.elNode) {
      this.elNode.innerHTML = '';
    }
  }

  public LoadProjectById(projectId: any) {
    console.log(projectId);
    if (!projectId) return;
    let ProjectNext = this.tabs?.filter((item) => item.ItemId == projectId)?.[0];
    let dataNext: any = this.parent.modules[projectId];
    if (!dataNext) return;
    if (!ProjectNext) {
      ProjectNext = new TabItemFlow(this, dataNext);
      this.tabs = [...this.tabs, ProjectNext];
    }

    if (ProjectNext && this.tabActive) {
      if (this.tabActive == ProjectNext) return;
      this.parent.modules[this.tabActive.ItemId] = this.parent.View?.toJson();
      this.tabActive.Active(false);
      this.tabActive = undefined;
    }
    this.tabActive = ProjectNext;
    this.tabActive.SetData(dataNext);
    this.tabActive.Active(true);
  }
  public NewProject() {
    const data = {
      Id: this.parent.getUuid(),
      data: {
        name: `project-${this.parent.getTime()}`,
        x: 0,
        y: 0,
        zoom: 1,
      },
      nodes: []
    }
    this.LoadProject(data);
  }
  public LoadProject(data: any) {
    this.parent.modules[data.Id] = data;
    this.LoadProjectById(data.Id);
  }

}
