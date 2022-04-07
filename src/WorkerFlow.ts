import { ViewFlow } from "./components/ViewFlow";

export class WorkerFlow {

  public container: HTMLElement | null;
  public View: ViewFlow | null;
  public constructor(container: HTMLElement) {
    this.container = container;
    this.container.classList.add("workerflow");
    this.container.innerHTML = `
    <div class="workerflow-control">
      <div class="workerflow-control__item" draggable="true">Node 1</div>
    </div>
    <div class="workerflow-desgin">
      <div class="workerflow-items">
        <div class="workerflow-item">Thông tin mới</div>
        <div class="workerflow-item">Thông tin mới123</div>
      </div>
      <div class="workerflow-view">
      </div>
    </div>
    `;
    this.View = new ViewFlow(this);
  }
}
