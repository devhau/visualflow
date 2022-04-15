import { WorkerFlow } from "../WorkerFlow";

export class ControlFlow {
  private elControl: HTMLElement | null | undefined;
  private parent: WorkerFlow;
  public constructor(parent: WorkerFlow) {
    this.parent = parent;
    this.elControl = parent.container?.querySelector('.workerflow-control__list');
    if (this.elControl) {
      this.elControl.innerHTML = "";
      let keys = Object.keys(parent.option.control);
      keys.forEach(key => {
        let Node = document.createElement('div');
        Node.setAttribute('draggable', 'true');
        Node.setAttribute('data-node', key);
        Node.classList.add("workerflow-control__item");
        Node.innerHTML = parent.option.control[key].name;
        Node.addEventListener('dragstart', this.dragStart.bind(this))
        Node.addEventListener('dragend', this.dragend.bind(this))
        this.elControl?.appendChild(Node);
      });
    }
  }
  public dragend(e: any) {
    this.parent.dataNodeSelect = null;
  }

  public dragStart(e: any) {
    if (e.type === "touchstart") {
      this.parent.dataNodeSelect = e.target.closest(".workerflow-control__item").getAttribute('data-node');
    } else {
      this.parent.dataNodeSelect = e.target.getAttribute('data-node');
      e.dataTransfer.setData("node", e.target.getAttribute('data-node'));
    }
  }
}
