import { IControlNode, IEvent } from './core/BaseFlow';
import { DockManager } from './dock/DockManager';
import { EventFlow } from './core/EventFlow';
export class VisualStudio implements IControlNode, IEvent {
  private $properties: any = {};
  private $control: any = {};
  private $dockManager: DockManager;
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
  public constructor(private container: HTMLElement, option: any = null) {
    this.events = new EventFlow();
    //set project
    this.$properties['project'] = {
      ...(option?.properties || {}),
      name: {
        defautl: ""
      },
      x: {
        defautl: 0
      },
      y: {
        default: 0
      },
      zoom: {
        default: 0
      }
    };
    // set control
    this.$control = option?.control || {};
    Object.keys(this.$control).forEach((key: string) => {
      this.$properties[`node_${key}`] = {
        ...(this.$control[key].properties || {}),
        key: {
          defautl: key
        },
        name: {
          defautl: ""
        },
        x: {
          defautl: 0
        },
        y: {
          default: 0
        },
      };
    });
    this.container.classList.remove('vs-container');
    this.container.classList.add('vs-container');
    this.$dockManager = new DockManager(this.container, this);
    this.$dockManager.reset();
  }
  getControlNodeByKey(key: string) {
    return {
      ...this.$control[key],
      properties: this.getPropertyByKey(key)
    }
  }
  getPropertyByKey(key: string) {
    return this.$properties[key];
  }
}
