import { DataFlow } from "./DataFlow";
import { EventEnum } from "./Constant";
import { EventFlow } from "./EventFlow";

export interface IProperty {
  getPropertyByKey(key: string): any;
}
export interface IControlNode extends IProperty {
  getControlNodeByKey(key: string): any;
}
export interface IEvent {
  onSafe(event: string, callback: any): void;
  on(event: string, callback: any): void;
  removeListener(event: string, callback: any): void;
  dispatch(event: string, details: any): void;
}
export interface IMain extends IControlNode, IEvent {
  getControlAll(): any[];
  setControlChoose(key: string | null): void;
  getControlChoose(): string | null;
  getControlByKey(key: string): any;
}
export class FlowCore implements IEvent {
  public GetId() {
    return this.data.Get('id');
  }
  public SetId(id: string) {
    return this.data.Set('id', id);
  }
  public properties: any = {};
  public data: DataFlow = new DataFlow();
  public elNode: HTMLElement = document.createElement('div');
  public CheckElementChild(el: HTMLElement) {
    return this.elNode == el || this.elNode.contains(el);
  }
  private events: EventFlow;
  public setData(data: DataFlow) {
    this.data = data;
    this.BindDataEvent();
    this.dispatch(`bind_data_event`, { data, sender: this });
  }
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
    this.data.on(EventEnum.dataChange, ({ key, value, sender }: any) => {
      setTimeout(() => {
        this.dispatch(`${EventEnum.dataChange}_${key}`, {
          type: 'data',
          key, value, sender
        });
        this.dispatch(EventEnum.dataChange, {
          type: 'data',
          key, value, sender
        });
      });
    })
    this.data.on(EventEnum.change, ({ key, value, sender }: any) => {
      setTimeout(() => {
        this.dispatch(EventEnum.change, {
          type: 'data',
          key, value, sender
        });
      });
    });
  }
  public constructor() {
    this.events = new EventFlow();
    this.BindDataEvent();
  }
}

export class BaseFlow<TParent extends FlowCore> extends FlowCore {
  public constructor(public parent: TParent) {
    super();
  }
}
