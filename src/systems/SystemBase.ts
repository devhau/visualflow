import { DataFlow, IMain, compareSort, EventEnum, PropertyEnum, EventFlow, getTime } from "../core/index";
import { Node } from "../desginer/index";
import { Control } from "./control";

export class SystemBase implements IMain {
  private $data: DataFlow = new DataFlow(this);
  private $projectOpen: any;
  private $properties: any = {};
  private $control: any = {};
  private events: EventFlow = new EventFlow();
  private $controlChoose: string | null = null;
  private $checkOption: boolean = false;
  public constructor() {
    //set project
    this.$properties[PropertyEnum.solution] = {
      id: {
        default: () => getTime()
      },
      key: {
        default: PropertyEnum.solution
      },
      name: {
        default: () => `solution-${getTime()}`
      },
      projects: {
        default: []
      }
    };
    this.$properties[PropertyEnum.line] = {
      key: {
        default: PropertyEnum.line
      },
      from: {
        default: 0
      },
      fromIndex: {
        default: 0
      },
      to: {
        default: 0
      },
      toIndex: {
        default: 0
      }
    };
    //set project
    this.$properties[PropertyEnum.main] = {
      id: {
        default: () => getTime()
      },
      name: {
        default: () => `Flow-${getTime()}`
      },
      key: {
        default: PropertyEnum.main
      },
      groups: {
        default: []
      },
      nodes: {
        default: []
      }
    };
    this.$properties[PropertyEnum.groupCavas] = {
      key: {
        default: PropertyEnum.groupCavas
      },
      group: {
        default: ''
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
    }
  }
  exportJson() {
    return this.$data.toJson();
  }
  public checkInitOption() {
    return this.$checkOption;
  }
  initOption(option: any, isDefault: boolean = true): void {
    this.$checkOption = true;
    // set control
    this.$control = isDefault ? { ...option?.control || {}, ...Control } : { ...option?.control || {} };
    let controlTemp: any = {};
    Object.keys(this.$control).map((key) => ({ ...this.$control[key], key, sort: (this.$control[key].sort === undefined ? 99999 : this.$control[key].sort) })).sort(compareSort).forEach((item: any) => {
      controlTemp[item.key] = {
        dot: {
          left: 1,
          top: 1,
          right: 1,
          bottom: 1,
        },
        ...item
      };
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
  }
  renderHtml(node: Node, elParent: Element) {
    elParent.innerHTML = node.getOption()?.html;
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
  getProjectAll(): any[] {
    return this.$data.Get('projects') ?? [];
  }
  importJson(data: any): void {
    this.$data.InitData(data, this.getPropertyByKey(PropertyEnum.solution));
  }
  setProjectOpen($data: any): void {
    this.$projectOpen = $data;
  }
  checkProjectOpen($data: any): boolean {
    return this.$projectOpen == $data;
  }
  newProject(): void {
    this.openProject({});
    this.dispatch(EventEnum.newProject, {});
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
      this.dispatch(EventEnum.openProject, { data });
      this.dispatch(EventEnum.showProperty, { data });
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
