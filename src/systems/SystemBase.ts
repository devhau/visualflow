import { DataFlow, IMain, compareSort, EventEnum, PropertyEnum, EventFlow, getTime, ScopeRoot } from "../core/index";
import { NodeItem } from "../desginer/index";
import { Control } from "./control";

export class SystemBase implements IMain {
  private $data: DataFlow = new DataFlow(this);
  private $projectOpen: DataFlow | undefined;
  private $properties: any = {};
  private $control: any = {};
  private events: EventFlow = new EventFlow();
  private $controlChoose: string | null = null;
  private $checkOption: boolean = false;
  private $group: any;
  public constructor() {
    //set project
    this.$properties[PropertyEnum.solution] = {
      id: {
        default: () => getTime()
      },
      key: {
        default: () => PropertyEnum.solution
      },
      name: {
        default: () => `solution-${getTime()}`,
        edit: true,
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
        default: () => `Flow-${getTime()}`,
        edit: true,
      },
      key: {
        default: PropertyEnum.main
      },
      variable: {
        default: []
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
    this.$properties[PropertyEnum.variable] = {
      key: {
        default: PropertyEnum.variable
      },
      name: {
        default: () => `var${getTime()}`
      },
      type: {
        default: () => 'text'
      },
      scope: {
        default: () => ScopeRoot
      },
      initalValue: {
        default: ''
      },
    }
    this.onSafe(EventEnum.groupChange, ({ group }: any) => {
      this.$group = group;
    })
  }
  newSolution($name: string = ''): void {
    this.openSolution({ name: $name });
  }
  openSolution($data: any): void {
    this.$data.InitData($data, this.getPropertyByKey(PropertyEnum.solution));
    this.openProject(this.$data.Get('projects')?.[0] ?? {});
  }
  removeVariable(varibale: DataFlow): void {
    this.$projectOpen?.Remove('variable', varibale);
    this.dispatch(EventEnum.changeVariable, { data: varibale });
  }
  addVariable(): DataFlow {
    let varibale = new DataFlow(this, { key: PropertyEnum.variable, scope: this.getGroupCurrent()?.[0]?.id });
    this.$projectOpen?.Append('variable', varibale);
    return varibale;
  }
  newVariable(): DataFlow {
    let varibale = this.addVariable();
    this.dispatch(EventEnum.changeVariable, { data: varibale });
    return varibale;
  }
  getVariable(): DataFlow[] {
    let arr: any = [];
    if (this.$projectOpen) {
      arr = this.$projectOpen.Get("variable");
      if (!arr) {
        arr = [];
        this.$projectOpen.Set('variable', arr);
      }
    }
    return arr.filter((item: any) => this.getGroupCurrent().findIndex((_group: any) => _group.id == item.Get('scope')) > -1);
  }
  getGroupCurrent(): any {
    return this.$group ?? [];
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
      this.$properties[`${item.key}`] = {
        ...(item.properties || {}),
        id: {
          default: () => getTime()
        },
        key: {
          default: item.key
        },
        name: {
          default: item.key,
          edit: true,
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
  renderHtml(node: NodeItem, elParent: Element) {
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
    setTimeout(() => {
      this.events.dispatch(event, details);
    });
  }

  getControlAll() {
    return this.$control ?? {};
  }
  getProjectAll(): any[] {
    return this.$data.Get('projects') ?? [];
  }
  importJson(data: any): void {
    this.openSolution(data);
  }
  setProjectOpen($data: any): void {
    if (this.$projectOpen != $data) {
      this.$projectOpen = $data;
      this.dispatch(EventEnum.change, {
        data: $data
      });
      this.dispatch(EventEnum.showProperty, {
        data: $data
      });
      this.dispatch(EventEnum.openProject, {
        data: $data
      });
    }
  }
  checkProjectOpen($data: any): boolean {
    return this.$projectOpen == $data;
  }
  newProject(): void {
    this.openProject({});
    this.dispatch(EventEnum.newProject, {});
  }
  openProject($data: any): void {
    let $project: any = null;
    if ($data instanceof DataFlow) {
      $project = this.getProjectById($data.Get('id'));
      if (!$project) {
        $project = $data;
        this.$data.Append('projects', $project);
      }
    } else {
      $project = new DataFlow(this);
      $project.InitData($data, this.getPropertyByKey(PropertyEnum.main));
      this.$data.Append('projects', $project);
    }
    this.setProjectOpen($project);
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
      properties: this.getPropertyByKey(`${key}`)
    }
  }
  getPropertyByKey(key: string) {
    return this.$properties[key];
  }
}
