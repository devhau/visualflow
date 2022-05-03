import { IMain } from './core/BaseFlow';
import { DockManager } from './dock/DockManager';
import { EventFlow } from './core/EventFlow';
import { compareSort, EventEnum, PropertyEnum } from './core/Constant';
import { getTime, getUuid } from './core/Utils';
import { DataFlow } from './core/DataFlow';
export class VisualFlow implements IMain {
  private $data: DataFlow = new DataFlow(this);
  private $properties: any = {};
  private $control: any = {};
  private $controlDefault: any = {
    node_begin: {
      icon: '<i class="fas fa-play"></i>',
      sort: 0,
      name: 'Begin',
      class: 'node-test',
      html: '',
      output: 1,
      input: 0,
      onlyNode: true
    },
    node_end: {
      icon: '<i class="fas fa-stop"></i>',
      sort: 0,
      name: 'End',
      html: '',
      output: 0,
      onlyNode: true
    },
    node_if: {
      icon: '<i class="fas fa-equals"></i>',
      sort: 0,
      name: 'If',
      html: '<div>condition:<br/><input node:model="condition"/></div>',
      script: ``,
      properties: {
        condition: {
          key: "condition",
          default: ''
        }
      },
      output: 2
    },
    node_group: {
      icon: '<i class="fas fa-object-group"></i>',
      sort: 0,
      name: 'Group',
      html: '<div class="text-center p3"><button>Go</button></div>',
      script: `console.log(node);console.log(view);`,
      properties: {
        condition: {
          key: "condition",
          default: ''
        }
      },
      output: 2
    },
  }
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
    this.$properties[PropertyEnum.solution] = {
      ...(option?.properties || {}),
      id: {
        default: () => getTime()
      },
      name: {
        default: () => `solution-${getTime()}`
      },
      projects: {
        default: []
      }
    };
    //set project
    this.$properties[PropertyEnum.main] = {
      ...(option?.properties || {}),
      id: {
        default: () => getTime()
      },
      name: {
        default: () => `app-${getTime()}`
      },
      x: {
        default: 0
      },
      y: {
        default: 0
      },
      zoom: {
        default: 1
      },
      nodes: {
        default: []
      }
    };
    // set control
    this.$control = { ...option?.control || {}, ...this.$controlDefault };
    let controlTemp: any = {};
    Object.keys(this.$control).map((key) => ({ ...this.$control[key], key, sort: (this.$control[key].sort === undefined ? 99999 : this.$control[key].sort) })).sort(compareSort).forEach((item: any) => {
      controlTemp[item.key] = item;
      this.$properties[`node_${item.key}`] = {
        ...(item.properties || {}),
        id: {
          default: () => getTime()
        },
        key: {
          default: item.key
        },
        name: {
          default: item.key
        },
        x: {
          default: 0
        },
        y: {
          default: 0
        },
        group: {
          default: ''
        },
        lines: {
          default: []
        }
      };
    });
    this.$control = controlTemp;
    this.container.classList.remove('vs-container');
    this.container.classList.add('vs-container');
    this.$dockManager = new DockManager(this.container, this);
    this.$dockManager.reset();
    this.$data.Set('id', getUuid());

  }
  getProjectAll(): any[] {
    return this.$data.Get('projects') ?? [];
  }
  open($data: any): void {
    this.$data.InitData($data, this.getPropertyByKey(PropertyEnum.solution));
  }
  newProject(): void {
    this.openProject({});
  }
  openProject($data: any): void {
    if ($data instanceof DataFlow) {
      let $project: any = this.getProjectById($data.Get('id'));
      if (!$project) {
        $project = $data;
        this.$data.Append('projects', $project);
      }
      this.dispatch(EventEnum.openProject, $project);
    } else {
      let data = new DataFlow(this);
      data.InitData($data, this.getPropertyByKey(PropertyEnum.main));
      this.$data.Append('projects', data);
      this.dispatch(EventEnum.openProject, data);
      this.dispatch(EventEnum.change, { data });
    }
  }
  public getProjectById($id: any) {
    return this.$data.Get('projects').filter((item: DataFlow) => item.Get('id') === $id)?.[0];
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
