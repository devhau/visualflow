import { WorkerFlow } from "../WorkerFlow";

export class TabFlow {
  private elTab: HTMLElement | undefined | null;
  public constructor(private parent: WorkerFlow, private modules: any = {}) {
    if (!this.modules) this.modules = {};
    this.elTab = parent.container?.querySelector('.workerflow-items');
    if (this.elTab) {
      this.elTab.innerHTML = '';
    }
    this.elTab?.addEventListener('mousedown', this.ClickTab.bind(this));
  }
  private ClickTab(e: any) {
    if (e.target.classList.contains('workerflow-item')) {
      let projectId = e.target.getAttribute('data-project');
      this.LoadProjectById(projectId);
    }
  }
  public LoadProjectById(projectId: any) {
    this.elTab?.querySelectorAll('.active').forEach((item) => {
      this.modules[item.getAttribute('data-project')?.toString() || ''] = this.parent.View?.toJson();
      item.classList.remove('active');
    })
    this.elTab?.querySelector(`[data-project="${projectId}"]`)?.classList.add('active');
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
    this.elTab?.querySelectorAll('.active').forEach((item) => {
      this.modules[item.getAttribute('data-project')?.toString() || ''] = this.parent.View?.toJson();
      item.classList.remove('active');
    })
    if (this.elTab?.querySelector(`[data-project="${data.id}"]`)) {
      this.elTab?.querySelector(`[data-project="${data.id}"]`)?.classList.add('active');
    } else {
      let item = document.createElement('div');
      item.classList.add("workerflow-item");
      item.classList.add('active');
      item.innerHTML = data.name;
      item.setAttribute('data-project', data.id);
      this.elTab?.appendChild(item);
    }
    this.modules[data.id] = data;
    this.parent.View?.load(this.modules[data.id]);
  }

}
