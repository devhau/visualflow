import { FlowCore } from "./BaseFlow";
import { EventFlow } from "./EventFlow";

export class DataFlow {
  private data: any = {};
  private events: EventFlow;
  onSafe(event: string, callback: any) {
    this.events.onSafe(event, callback);
  }
  on(event: string, callback: any) {
    this.events.on(event, callback);
  }
  removeListener(event: string, callback: any) {
    this.events.removeListener(event, callback);
  }
  dispatch(event: string, details: any) {
    this.events.dispatch(event, details);
  }
  public readonly Event = {
    dataChange: "dataChange",
    change: "change",
    dispose: "dispose"
  }
  public constructor(public node: FlowCore) {
    this.events = new EventFlow();
  }
  public InitData(data: any = null, properties: any = -1) {
    if (properties !== -1) {
      this.node.properties = properties;
    }
    this.load(data);
    this.BindEvent(this.node);
  }
  public BindEvent(node: FlowCore) {
  }
  public Set(key: string, value: any, sender: any = null) {
    this.data[key] = value;
    this.dispatch(`${this.Event.dataChange}_${key}`, {
      key, value, sender
    });
    this.dispatch(this.Event.dataChange, {
      key, value, sender
    });
    this.dispatch(this.Event.change, {
      key, value, sender
    });
  }
  public Get(key: string) {
    return this.data[key];
  }
  public load(data: any) {
    this.data = {};

    for (let key of Object.keys(this.node.properties)) {
      this.data[key] = (data?.[key] ?? (this.node.properties[key]?.default ?? ""));
    }
  }
  public toJson() {
    let rs: any = {};
    for (let key of Object.keys(this.node.properties)) {
      rs[key] = this.Get(key);
    }
    return rs;
  }
}
