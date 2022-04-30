import { IMain } from './core/BaseFlow';
import { DockManager } from './dock/DockManager';
import { EventFlow } from './core/EventFlow';
import { PropertyEnum } from './core/Constant';
import { getTime } from './core/Utils';
export class VisualFlow implements IMain {
  private $properties: any = {};
  private $control: any = {};
  private $controlChoose: string | null = null;
  private $dockManager: DockManager;
  private events: EventFlow;
  public getDockManager(): DockManager {
    return this.$dockManager;
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
  getControlAll() {
    return this.$control ?? {};
  }
  public constructor(private container: HTMLElement, option: any = null) {
    this.events = new EventFlow();
    //set project
    this.$properties[PropertyEnum.main] = {
      ...(option?.properties || {}),
      id: {
        default: () => getTime()
      },
      name: {
        default: ""
      },
      x: {
        default: 0
      },
      y: {
        default: 0
      },
      zoom: {
        default: 1
      }
    };
    // set control
    this.$control = option?.control || {};
    Object.keys(this.$control).forEach((key: string) => {
      this.$properties[`node_${key}`] = {
        ...(this.$control[key].properties || {}),
        id: {
          default: () => getTime()
        },
        key: {
          default: key
        },
        name: {
          default: ""
        },
        x: {
          default: 0
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
  setControlChoose(key: string | null): void {
    this.$controlChoose = key;
  }
  getControlChoose(): string | null {
    return this.$controlChoose;
  }
  getControlByKey(key: string) {
    return this.$control[key] || {};
  }
  getControlNodeByKey(key: string) {
    return {
      ...this.getControlByKey(key),
      properties: this.getPropertyByKey(`node_${key}`)
    }
  }
  getPropertyByKey(key: string) {
    return this.$properties[key];
  }
}
