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
      right: 0,
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
      left: 0,
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
    html: '<div>condition:<br/><input class="node-form-control" node:model="condition"/></div>',
    script: ``,
    properties: {
      condition: {
        key: "condition",
        edit: true,
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
    script: ({ elNode, main, node }: any) => {
      elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => { node.openGroup() });
    },
    properties: {},
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
    script: ({ elNode, main, node }: any) => {
      elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => { node.openGroup() });
    },
    properties: {},
    output: 2
  },
  node_project: {
    icon: '<i class="fas fa-object-group"></i>',
    sort: 0,
    name: 'Project',
    group: 'common',
    html: '<div class="text-center p3"><select class="node-form-control" node:model="project"></select></div>',
    script: ({ elNode, main, node }: any) => {

    },
    properties: {
      project: {
        key: "project",
        edit: true,
        select: true,
        dataSelect: ({ elNode, main, node }: any) => {
          return main.getProjectAll().map((item: any) => {
            return {
              value: item.Get('id'),
              text: item.Get('name')
            };
          })
        },
        script: ({ elNode, main, node }: any) => {

        },
        default: ''
      }
    },
  },
}
