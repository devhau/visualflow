import { FlowCore } from "./components/BaseFlow";
import { ControlFlow } from "./components/ControlFlow";
import { DataFlow } from "./components/DataFlow";
import { PropertyFlow } from "./components/PropertyFlow";
import { TabFlow } from "./components/TabFlow";
import { ViewFlow } from "./components/ViewFlow";

export class WorkerFlow extends FlowCore {

  public View: ViewFlow | null;
  public Control: ControlFlow | null;
  public Property: PropertyFlow | null;
  public Tab: TabFlow | null;
  public modules: any = {};
  public dataNodeSelect: string | null = null;
  public option: any;

  public checkParent(node: any, nodeCheck: any) {
    if (node && nodeCheck) {
      if (node == nodeCheck) return true;
      let parent: any = node;
      while ((parent = parent.parentElement) != null) {
        if (nodeCheck == parent) {
          return true;
        }
      }
    }
    return false;
  }
  public constructor(container: HTMLElement, option: any = null) {
    super();
    this.elNode = container;
    this.elNode.classList.add("workerflow");
    this.option = option || {
      control: {}
    };
    this.elNode.innerHTML = `
    <div class="workerflow-control">
      <h2 class="workerflow-control__header">Node Control</h2>
      <div class="workerflow-control__list">
      </div>
    </div>
    <div class="workerflow-desgin">
      <div class="workerflow-items">
      </div>
      <div class="workerflow-view">
      </div>
    </div>
    <div class="workerflow-property">
      <h2 class="workerflow-property__header">Properties</h2>
      <div class="workerflow-property__list">
      </div>
    </div>
    `;
    this.View = new ViewFlow(this);
    this.Tab = new TabFlow(this);
    this.Control = new ControlFlow(this);
    this.Property = new PropertyFlow(this);
    if (Object.keys(this.modules).length == 0) {
      this.new();
    }
  }
  public new() {
    this.Tab?.NewProject();
  }
  public load(data: any) {
    this.Tab?.LoadProject(data);
  }

  public PropertyInfo(data: DataFlow) {
    this.Property?.PropertyInfo(data);
  }
  public getOption(keyNode: any) {
    if (!keyNode) return;
    let control = this.option.control[keyNode];
    if (!control) {
      control = Object.values(this.option.control)[0];
    }
    control.key = keyNode;
    return control;
  }
  public toJson() {
    return this.View?.toJson();
  }
  public getTime(): number {
    return (new Date()).getTime();
  }
  public getUuid(): string {
    // http://www.ietf.org/rfc/rfc4122.txt
    let s: any = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    let uuid = s.join("");
    return uuid;
  }
}
