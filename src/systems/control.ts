export const Control = {
  node_begin: {
    icon: '<i class="fas fa-play"></i>',
    sort: 0,
    name: 'Begin',
    group: 'common',
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
    group: 'common',
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
    group: 'common',
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
    group: 'common',
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
    group: 'common',
    html: `
    <div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50001"></span></span></div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50002"></span></span></div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50003"></span></span></div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50004"></span></span></div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50005"></span></span></div>
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
    group: 'common',
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
  },
}
