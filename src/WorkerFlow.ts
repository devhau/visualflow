import { ControlFlow } from "./components/ControlFlow";
import { EventFlow } from "./components/EventFlow";
import { TabFlow } from "./components/TabFlow";
import { ViewFlow } from "./components/ViewFlow";

export class WorkerFlow {

  public container: HTMLElement | null;
  public View: ViewFlow | null;
  public Control: ControlFlow | null;
  public tab: TabFlow | null;
  public dataNodeSelect: string | null = null;
  public option: any;

  private events: EventFlow;
  on(event: string, callback: any) {
    this.events.on(event, callback);
  }
  removeListener(event: string, callback: any) {
    this.events.removeListener(event, callback);
  }
  dispatch(event: string, details: any) {
    this.events.dispatch(event, details);
  }

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
    this.container = container;
    this.container.classList.add("workerflow");
    this.option = option || {
      control: {
      }
    };
    this.container.innerHTML = `
    <div class="workerflow-control">
      <h2 class="workerflow-control__header">Node Control</h2>
      <div class="workerflow-control__list">
      <div draggable="true">Node 1</div>
      </div>
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
    this.tab = new TabFlow(this, []);
    this.Control = new ControlFlow(this);
    this.events = new EventFlow(this);
  }
  public new() {
    this.tab?.NewProject();
  }
  public load(data: any) {
    this.tab?.LoadProject(data);
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
