import { WorkerFlow } from "../WorkerFlow";
import { BaseFlow } from "./BaseFlow";

export class TabFlow extends BaseFlow<WorkerFlow>  {
  public constructor(parent: WorkerFlow, private modules: any = {}) {
    super(parent);
    this.elNode = this.parent.elNode.querySelector('.workerflow-items') || this.elNode;
    if (this.elNode) {
      this.elNode.innerHTML = '';
    }
    this.elNode.addEventListener('mousedown', this.ClickTab.bind(this));
  }
  private ClickTab(e: any) {
    if (e.target.classList.contains('workerflow-item')) {
      let projectId = e.target.getAttribute('data-project');
      this.LoadProjectById(projectId);
    }
  }
  public LoadProjectById(projectId: any) {
    this.elNode.querySelectorAll('.active').forEach((item) => {
      this.modules[item.getAttribute('data-project')?.toString() || ''] = this.parent.View?.toJson();
      item.classList.remove('active');
    })
    this.elNode.querySelector(`[data-project="${projectId}"]`)?.classList.add('active');
    this.parent.View?.load(this.modules[projectId]);
  }
  public NewProject() {
    let data = {
      id: this.parent.getUuid(),
      name: `project-${this.parent.getTime()}`,
      x: 0,
      y: 0,
      zoom: 1,
      nodes: []
    }
    this.LoadProject(data);
  }
  public LoadProject(data: any) {
    this.elNode.querySelectorAll('.active').forEach((item) => {
      this.modules[item.getAttribute('data-project')?.toString() || ''] = this.parent.View?.toJson();
      item.classList.remove('active');
    })
    if (this.elNode.querySelector(`[data-project="${data.id}"]`)) {
      this.elNode.querySelector(`[data-project="${data.id}"]`)?.classList.add('active');
    } else {
      let item = document.createElement('div');
      item.classList.add("workerflow-item");
      item.classList.add('active');
      item.innerHTML = data.name;
      item.setAttribute('data-project', data.id);
      this.elNode.appendChild(item);
    }
    this.modules[data.id] = data;
    this.parent.View?.load(this.modules[data.id]);
  }

}
