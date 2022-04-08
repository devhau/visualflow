import { ViewFlow } from "./ViewFlow";

export class NodeFlow {
  private parent: ViewFlow;
  public elNode: HTMLElement | null | null;
  public elNodeInputs: HTMLElement | null | null;
  public elNodeOutputs: HTMLElement | null | null;
  public elNodeContent: HTMLElement | null | null;
  public nodeId: string;
  public pos_x: number = 0;
  public pos_y: number = 0;
  public constructor(parent: ViewFlow, id: string, option: any = null) {
    this.parent = parent;
    this.nodeId = id;
    console.log(this.nodeId);
    this.elNode = document.createElement('div');
    this.elNode.classList.add("workerflow-node");
    this.elNode.id = `node-${id}`;
    this.elNodeInputs = document.createElement('div');
    this.elNodeInputs.classList.add('workerflow-node_inputs');
    this.elNodeContent = document.createElement('div');
    this.elNodeContent.classList.add('workerflow-node_content');
    this.elNodeOutputs = document.createElement('div');
    this.elNodeOutputs.classList.add('workerflow-node_outputs');

    this.elNode.setAttribute('data-node', id);
    this.elNode.setAttribute('style', `top: ${this.pos_y}px; left: ${this.pos_x}px;`);
    this.elNode.addEventListener('mousedown', this.StartSelected.bind(this));
    this.elNode.addEventListener('touchstart', this.StartSelected.bind(this));
    this.elNode.appendChild(this.elNodeInputs);
    this.elNode.appendChild(this.elNodeContent);
    this.elNode.appendChild(this.elNodeOutputs)
    this.parent.elCanvas?.appendChild(this.elNode);
  }
  public StartSelected(e: any) {
    this.parent.SelectNode(this);
  }
  public updatePosition(x: any, y: any) {
    if (this.elNode) {
      this.pos_x = (this.elNode.offsetLeft - x);
      this.pos_y = (this.elNode.offsetTop - y);
      this.elNode.setAttribute('style', `top: ${this.pos_y}px; left: ${this.pos_x}px;`);
    }
  }
}
