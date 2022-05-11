import { DataFlow } from "./DataFlow";
import { EventEnum } from "./Constant";
import { EventFlow } from "./EventFlow";
import { Node } from "../desginer/Node";

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
  newProject($name: string): void;
  openProject($name: string): void;
  getProjectAll(): any[];
  setProjectOpen($data: any): void;
  checkProjectOpen($data: any): boolean;
  getControlAll(): any;
  setControlChoose(key: string | null): void;
  getControlChoose(): string | null;
  getControlByKey(key: string): any;
  renderHtml(node: Node, elParent: Element): void;
  initOption(option: any, isDefault: boolean): void;
  checkInitOption(): boolean;
  importJson(data: any): void;
  exportJson(): any;
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
  public SetData(data: any, sender: any = null) {
    this.data.SetData(data, sender);
  }
  public SetDataFlow(data: DataFlow) {
    this.data.SetData(data, this, true);

    this.dispatch(`bind_data_event`, { data, sender: this });
    this.dispatch(EventEnum.change, { data, sender: this });
  }
  onSafe(event: string, callback: any) {
    this.events.onSafe(event, callback);
    return this;
  }
  on(event: string, callback: any) {
    this.events.on(event, callback);
    return this;
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
  RemoveDataEvent() {
    this.data.removeListener(EventEnum.dataChange, ({ key, value, sender }: any) => {
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
    this.data.removeListener(EventEnum.change, ({ key, value, sender }: any) => {
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
