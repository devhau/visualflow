import { BaseFlow } from "../core/BaseFlow";
import { LineFlow } from "./LineFlow";
import { ViewFlow } from "./ViewFlow";
const geval = eval;
export class NodeFlow extends BaseFlow<ViewFlow> {
  public elNodeInputs: HTMLElement | null = null;
  public elNodeOutputs: HTMLElement | null = null;
  public elNodeContent: HTMLElement | null = null;
  public getY() {
    return +this.data.Get(this.propertieDefault.y.key);
  }
  public getX() {
    return +this.data.Get(this.propertieDefault.x.key);
  }
  public getDotInput(index: number = 1) {
    let elDot: any = this.elNodeOutputs?.querySelector(`.dot[node="${index}"]`);
    if (elDot) {
      let y = (this.elNode.offsetTop + elDot.offsetTop + 10);
      let x = (this.elNode.offsetLeft + elDot.offsetLeft - 10);
      return { x, y };
    }
    return {};
  }
  public getDotOutput(index: number = 0) {
    let elDot: any = this.elNodeOutputs?.querySelector(`.dot[node="${index}"]`);
    if (elDot) {
      let y = (this.elNode.offsetTop + elDot.offsetTop + 10);
      let x = (this.elNode.offsetLeft + elDot.offsetLeft + 10);

      return { x, y };
    }
    return {};
  }
  public arrLine: LineFlow[] = [];
  private option: any;
  private node: any;
  private propertieDefault = {
    x: {
      key: "x",
      default: 0
    },
    y: {
      key: "y",
      default: 0
    }
  }
  public properties: any = {}
  private flgScript: boolean = false;
  public readonly Event = {
    ReUI: "ReUI",
    change: "change",
    updatePosition: "updatePosition",
    selected: "Selected",
    dataChange: "dataChange"
  };
  public setOption(option: any = null, data: any = {}) {
    this.option = option || {};
    if (!this.option.properties) {
      this.option.properties = {};
    }
    this.node = this.option.node;
    this.Id = data?.Id ?? this.parent.parent.getUuid();
    this.properties = { ...this.propertieDefault, ...this.option.properties };
    this.data.InitData(data?.data);
  }
  public constructor(parent: ViewFlow, option: any = null) {
    super(parent);
    this.setOption(option, {});
    if (option) {
      this.ReUI();
    }
    this.on(this.Event.change, (e: any, sender: any) => {
      this.parent.dispatch(this.parent.Event.change, {
        ...e,
        targetNode: sender
      });
    })
  }
  public toJson() {
    let LineJson = this.arrLine.filter((item) => item.fromNode === this).map((item) => ({
      fromNode: item.fromNode.Id,
      toNode: item.toNode?.Id,
      ouputIndex: item.outputIndex
    }));
    return {
      Id: this.Id,
      node: this.node,
      line: LineJson,
      data: this.data.toJson(),
    }
  }
  public load(data: any) {
    let option = this.parent.getOption(data?.node);
    this.setOption(option, data);
    this.ReUI();
    return this;
  }
  public output() {
    return this.option?.output ?? 0;
  }
  public delete(isRemoveParent = true) {
    this.arrLine.forEach((item) => item.delete(this));
    this.data.dispatch(this.data.Event.change, {});
    this.elNode?.removeEventListener('mouseover', this.NodeOver.bind(this));
    this.elNode?.removeEventListener('mouseleave', this.NodeLeave.bind(this));
    this.elNode?.removeEventListener('mousedown', this.StartSelected.bind(this));
    this.elNode?.removeEventListener('touchstart', this.StartSelected.bind(this));
    this.elNode?.remove();
    this.arrLine = [];
    if (isRemoveParent)
      this.parent.RemoveNode(this);
    this.dispatch(this.Event.change, {});
  }
  public AddLine(line: LineFlow) {
    this.arrLine = [...this.arrLine, line];
    this.dispatch(this.Event.change, {});
  }
  public RemoveLine(line: LineFlow) {
    var index = this.arrLine.indexOf(line);
    if (index > -1) {
      this.arrLine.splice(index, 1);
    }
    this.dispatch(this.Event.change, {});
    return this.arrLine;
  }
  public ReUI() {
    if (this.elNode) {
      this.elNode.removeEventListener('mouseover', this.NodeOver.bind(this));
      this.elNode.removeEventListener('mouseleave', this.NodeLeave.bind(this));
      this.elNode.removeEventListener('mousedown', this.StartSelected.bind(this));
      this.elNode.removeEventListener('touchstart', this.StartSelected.bind(this));
      this.elNode.remove();
    }
    this.elNodeInputs = document.createElement('div');
    this.elNodeInputs.classList.add('workerflow-node_inputs');
    this.elNodeInputs.innerHTML = `<div class="inputs dot"></div>`;
    this.elNodeContent = document.createElement('div');
    this.elNodeContent.classList.add('workerflow-node_content');
    this.elNodeOutputs = document.createElement('div');
    this.elNodeOutputs.classList.add('workerflow-node_outputs');
    this.elNodeOutputs.innerHTML = `<div class="outputs dot" node="0"></div>`;
    this.elNode = document.createElement('div');
    this.elNode.classList.add("workerflow-node");
    if (this.option.class) {
      this.elNode.classList.add(this.option.class);
    }
    this.elNode.id = `node-${this.Id}`;
    this.elNode.setAttribute('data-node', this.Id);
    this.elNode.setAttribute('style', `top: ${this.getY()}px; left: ${this.getX()}px;`);
    this.elNode.addEventListener('mouseover', this.NodeOver.bind(this));
    this.elNode.addEventListener('mouseleave', this.NodeLeave.bind(this));
    this.elNode.addEventListener('mousedown', this.StartSelected.bind(this));
    this.elNode.addEventListener('touchstart', this.StartSelected.bind(this));
    this.elNode.appendChild(this.elNodeInputs);
    this.elNode.appendChild(this.elNodeContent);
    this.elNode.appendChild(this.elNodeOutputs);

    this.parent.elCanvas?.appendChild(this.elNode);
    if (this.data) {
      let dataTemp = this.data.toJson();
      this.data.load(dataTemp);
    }
    this.initOption();
    this.on(this.data.Event.dataChange, () => {
      this.UpdateUI();
    });
    this.dispatch(this.Event.ReUI, {});
  }
  public checkInput() {
    return !(this.option?.input === 0);
  }
  private initOption() {
    if (this.elNodeContent && this.option && this.elNodeOutputs) {
      this.elNodeContent.innerHTML = this.option.html;
      if (this.option.output !== undefined) {
        this.elNodeOutputs.innerHTML = '';
        for (let index: number = 0; index < this.option.output; index++) {
          let output = document.createElement('div');
          output.setAttribute('node', (300 + index).toString());
          output.classList.add("dot");
          output.classList.add("output_" + (index));
          this.elNodeOutputs?.appendChild(output);
        }

      }
      if (this.option.input === 0 && this.elNodeInputs) {
        this.elNodeInputs.innerHTML = '';
      }

    }
    let self = this;
    setTimeout(() => {
      self.RunScript(self, self.elNode);
    }, 100);
  }
  public RunScript(selfNode: NodeFlow, el: HTMLElement | null) {
    if (this.option && this.option.script && !this.flgScript) {
      this.flgScript = true;
      geval('(node,el)=>{' + this.option.script.toString() + '}')(selfNode, el);
      this.flgScript = true;
    }
  }
  public checkNode(node: any) {
    return this.option && this.option.node == node;
  }
  public NodeOver(e: any) {
    this.parent.nodeOver = this;
  }
  public NodeLeave(e: any) {
    this.parent.nodeOver = null;
  }
  public StartSelected(e: any) {
    this.parent.SelectNode(this);
    this.dispatch(this.Event.selected, {});
  }
  public updatePosition(x: any, y: any, iCheck = false) {
    if (this.elNode) {
      if (iCheck) {
        if (x !== this.getX()) {
          this.data.Set(this.propertieDefault.x.key, x);
        }
        if (y !== this.getY()) {
          this.data.Set(this.propertieDefault.y.key, y);
        }
      } else {
        this.data.Set(this.propertieDefault.y.key, (this.elNode.offsetTop - y));
        this.data.Set(this.propertieDefault.x.key, (this.elNode.offsetLeft - x));
      }

      this.dispatch(this.Event.updatePosition, { x: this.getX(), y: this.getY() });
      this.dispatch(this.Event.change, {});
      this.UpdateUI();
    }
  }
  public UpdateUI() {
    this.elNode.setAttribute('style', `top: ${this.getY()}px; left: ${this.getX()}px;`);
    this.arrLine.forEach((item) => {
      item.update();
    })
  }
}
