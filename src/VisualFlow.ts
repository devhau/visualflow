import { IMain } from './core/BaseFlow';
import { DockManager } from './dock/DockManager';
import { EventFlow } from './core/EventFlow';
import { compareSort, EventEnum, PropertyEnum } from './core/Constant';
import { getTime, getUuid } from './core/Utils';
import { DataFlow } from './core/DataFlow';
export class VisualFlow implements IMain {
  private $data: DataFlow = new DataFlow(this);
  private $projectOpen: any;
  private $properties: any = {};
  private $control: any = {};
  private $controlDefault: any = {
    node_begin: {
      icon: '<i class="fas fa-play"></i>',
      sort: 0,
      name: 'Begin',
      class: 'node-test',
      html: '',
      dot: {
        top: 0,
        right: 1,
        left: 0,
        bottom: 1,
      },
      onlyNode: true
    },
    node_end: {
      icon: '<i class="fas fa-stop"></i>',
      sort: 0,
      name: 'End',
      html: '',
      dot: {
        left: 1,
        top: 1,
        right: 0,
        bottom: 0,
      },
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
      html: '<div class="text-center p3"><button class="btnGoGroup node-form-control">Go</button></div>',
      script: `node.elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {node.openGroup()});`,
      properties: {
        condition: {
          key: "condition",
          default: ''
        }
      },
      output: 2
    },
    node_option: {
      icon: '<i class="fas fa-object-group"></i>',
      sort: 0,
      name: 'Option',
      dot: {
        top: 1,
        right: 0,
        left: 1,
        bottom: 0,
      },
      html: `
      <div>
        <div class="node-content-row"><span>Họ tên :</span><span class="node-dot" node="50001"></span></div>
        <div class="node-content-row"><span>Họ tên :</span><span class="node-dot" node="50002"></span></div>
        <div class="node-content-row"><span>Họ tên :</span><span class="node-dot" node="50003"></span></div>
        <div class="node-content-row"><span>Họ tên :</span><span class="node-dot" node="50004"></span></div>
        <div class="node-content-row"><span>Họ tên :</span><span class="node-dot" node="50005"></span></div>


      </div>
      `,
      script: `node.elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {node.openGroup()});`,
      properties: {
        condition: {
          key: "condition",
          default: ''
        }
      },
      output: 2
    },
    node_project: {
      icon: '<i class="fas fa-object-group"></i>',
      sort: 0,
      name: 'Project',
      html: '<div class="text-center p3"><select class="listProject node-form-control" node:model="project"></select></div>',
      script: `
      const reloadProject = ()=>{
        node.elNode.querySelector('.listProject').innerHtml='';
        let option = document.createElement('option');
        option.text='none';
        option.value='';
        node.elNode.querySelector('.listProject').appendChild(option);
        node.parent.main.getProjectAll().forEach((item)=>{
          let option = document.createElement('option');
          option.text=item.Get('name');
          option.value=item.Get('id');
          node.elNode.querySelector('.listProject').appendChild(option);
        });
        node.elNode.querySelector('.listProject').value= node.data.Get('project')
      }
      reloadProject();

     ;`,
      properties: {
        project: {
          key: "project",
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
      ...(option?.properties || {}),
      id: {
        default: () => getTime()
      },
      name: {
        default: () => `app-${getTime()}`
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
    // set control
    this.$control = { ...option?.control || {}, ...this.$controlDefault };
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
    this.$control = controlTemp;
    this.container.classList.remove('vs-container');
    this.container.classList.add('vs-container');
    this.$dockManager = new DockManager(this.container, this);
    this.$dockManager.reset();
    this.$data.InitData({}, this.getPropertyByKey(PropertyEnum.solution));

  }
  getProjectAll(): any[] {
    return this.$data.Get('projects') ?? [];
  }
  open($data: any): void {
    this.$data.InitData($data, this.getPropertyByKey(PropertyEnum.solution));
  }
  SetProjectOpen($data: any): void {
    this.$projectOpen = $data;
  }
  CheckProjectOpen($data: any): boolean {
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
