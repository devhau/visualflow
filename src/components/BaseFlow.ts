import { EventFlow } from "./EventFlow";

export class FlowCore {
  private events: EventFlow;
  public elNode: HTMLElement = document.createElement('div');
  on(event: string, callback: any) {
    this.events.on(event, callback);
  }
  removeListener(event: string, callback: any) {
    this.events.removeListener(event, callback);
  }
  dispatch(event: string, details: any) {
    this.events.dispatch(event, details);
  }
  public constructor() {
    this.events = new EventFlow(this);
  }
}

export class BaseFlow<TParent> extends FlowCore {
  public constructor(public parent: TParent) {
    super();
  }
}
