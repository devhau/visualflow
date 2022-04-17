import { ControlFlow } from "./components/ControlFlow";
import { ViewFlow } from "./components/ViewFlow";

export class WorkerFlow {

  public container: HTMLElement | null;
  public View: ViewFlow | null;
  public Control: ControlFlow | null;
  public dataNodeSelect: string | null = null;
  private events: any = {};
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
    this.Control = new ControlFlow(this);
  }
  public load(data: any) {
    this.View?.load(data);
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
  /* Events */
  on(event: string, callback: any) {
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

  removeListener(event: string, callback: any) {
    // Check if this event not exists

    if (!this.events[event]) return false

    const listeners = this.events[event].listeners
    const listenerIndex = listeners.indexOf(callback)
    const hasListener = listenerIndex > -1
    if (hasListener) listeners.splice(listenerIndex, 1)
  }

  dispatch(event: string, details: any) {
    let self = this;
    // Check if this event not exists
    if (this.events[event] === undefined) {
      // console.error(`This event: ${event} does not exist`);
      return false;
    }
    this.events[event].listeners.forEach((listener: any) => {
      listener(details, self);
    });
  }
}
