import { DataFlow } from "./DataFlow";
import { EventFlow } from "./EventFlow";

export class FlowCore {
  public Id: any;
  public properties: any = {};
  public data: DataFlow = new DataFlow(this);
  public elNode: HTMLElement = document.createElement('div');
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
  BindDataEvent() {
    this.data.on(this.data.Event.dataChange, ({ key, value, sender }: any) => {
      setTimeout(() => {
        this.dispatch(`${this.data.Event.dataChange}_${key}`, {
          type: 'data',
          key, value, sender
        });
        this.dispatch(this.data.Event.dataChange, {
          type: 'data',
          key, value, sender
        });
      });
    })
    this.data.on(this.data.Event.change, ({ key, value, sender }: any) => {
      setTimeout(() => {
        this.dispatch(this.data.Event.change, {
          type: 'data',
          key, value, sender
        });
      });
    });
  }
  public constructor() {
    this.events = new EventFlow();

  }
}

export class BaseFlow<TParent extends FlowCore> extends FlowCore {
  public constructor(public parent: TParent) {
    super();
  }
}
