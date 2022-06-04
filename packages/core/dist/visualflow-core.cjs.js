
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow_core.js v0.0.1-hotfix
   * Released under the MIT license.
   */

'use strict';

class WorkerSetup {
    nodes() {
        return [];
    }
    newNodes() {
        return this.nodes().map((item) => (new item()));
    }
}

var EnvNode;
(function (EnvNode) {
    EnvNode[EnvNode["All"] = 0] = "All";
    EnvNode[EnvNode["Web"] = 1] = "Web";
    EnvNode[EnvNode["PC"] = 2] = "PC";
    EnvNode[EnvNode["Cloud"] = 3] = "Cloud";
    EnvNode[EnvNode["Mobile"] = 4] = "Mobile";
    EnvNode[EnvNode["IOS"] = 5] = "IOS";
    EnvNode[EnvNode["Android"] = 6] = "Android";
})(EnvNode || (EnvNode = {}));
class WorkerNode {
    env() {
        return [EnvNode.All, EnvNode.Cloud, EnvNode.PC, EnvNode.Web, EnvNode.Mobile, EnvNode.IOS, EnvNode.Android];
    }
    CheckEnv(env) {
        return this.env().includes(env);
    }
    key() {
        return this.constructor.name;
    }
    checkKey(key) {
        return this.key() == key;
    }
    name() { return this.constructor.name; }
    icon() { return '<i class="fas fa-play"></i>'; }
    group() {
        return "Common";
    }
    html({ elNode, main, node }) {
        return ``;
    }
    script({ elNode, main, node }) { }
    properties() { }
    option() { }
    async execute(nodeId, data, manager, next) {
        return this.nextNode(data, next, nodeId);
    }
    async nextNode(data, next, nodeId, index = null) {
        if (data?.lines) {
            for (let item of data.lines) {
                if (item.from == nodeId && (index == null || item.fromIndex == index)) {
                    return await next(item.to);
                }
            }
        }
        return await next(undefined);
    }
}

class CoreAlertNode extends WorkerNode {
    key() {
        return "core_alert";
    }
    name() {
        return "Alert";
    }
    icon() {
        return '<i class="fas fa-bell"></i>';
    }
    html({ elNode, main, node }) {
        return '<div class="pr10 pl10 pb4"><input type="text" class="node-form-control" node:model="message"/></div>';
    }
    properties() {
        return {
            message: {
                key: "message",
                edit: true,
                default: ""
            }
        };
    }
    async execute(nodeId, data, manager, next) {
        alert(manager.getText(data?.message, nodeId));
        await this.nextNode(data, next, nodeId);
    }
}

class CoreAssignNode extends WorkerNode {
    key() {
        return "core_assign";
    }
    name() {
        return "Assign";
    }
    icon() {
        return '<i class="fas fa-bolt"></i>';
    }
    properties() {
        return {
            env_name: {
                key: "env_name",
                text: 'name',
                edit: true,
                var: true,
                validate: '^([a-zA-Z0-9\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9]+)$',
                default: ""
            },
            env_value: {
                key: "env_value",
                text: 'value',
                edit: true,
                default: ""
            },
            env_scorp: {
                key: "env_scorp",
                text: 'scorp',
                edit: true,
                select: true,
                selectNone: 'Select scorp',
                default: '',
                dataSelect: ({ elNode, main, node }) => {
                    return main.getGroupCurrent().map((item) => {
                        return {
                            value: item.id,
                            text: item.text
                        };
                    });
                },
            }
        };
    }
    option() {
        return {
            class: '',
            dot: {
                left: 1,
                top: 0,
                right: 1,
                bottom: 0,
            }
        };
    }
    html({ elNode, main, node }) {
        return `<div class="node-content-row">
    <div class="pl10 pr0 pt1 pb7"><input type="text" class="node-form-control" node:model="env_name"/> </div>
    <div class="flex-none pr6 pt6 pb7 text-center">=</div>
    <div class="pr10 pl0 pt1 pb7"><input type="text" class="node-form-control" node:model="env_value"/></div>
    <div></div>
    </div>`;
    }
    async execute(nodeId, data, manager, next) {
        manager.setVariableObject(data.env_name, manager.runCode(data.env_value, nodeId), data.env_scorp ?? nodeId);
        await this.nextNode(data, next, nodeId);
    }
}

const NodeBegin = "core_begin";
class CoreBeginNode extends WorkerNode {
    key() {
        return NodeBegin;
    }
    name() {
        return "Begin";
    }
    option() {
        return {
            onlyNode: true,
            sort: 0,
            dot: {
                left: 0,
                top: 0,
                right: 1,
                bottom: 0,
            }
        };
    }
    async execute(nodeId, data, manager, next) {
        await this.nextNode(data, next, nodeId);
    }
}

class CoreConsoleNode extends WorkerNode {
    key() {
        return "core_console";
    }
    name() {
        return "Console";
    }
    icon() {
        return '<i class="fas fa-terminal"></i>';
    }
    html({ elNode, main, node }) {
        return '<div class="pr10 pl10 pb4"><input type="text" class="node-form-control" node:model="message"/></div>';
    }
    properties() {
        return {
            message: {
                key: "message",
                edit: true,
                default: ""
            }
        };
    }
    async execute(nodeId, data, manager, next) {
        console.log(manager.getText(data?.message, nodeId));
        await this.nextNode(data, next, nodeId);
    }
}

class CoreDelayNode extends WorkerNode {
    key() {
        return "core_delay";
    }
    name() {
        return "Delay";
    }
    icon() {
        return '<i class="fas fa-stopwatch"></i>';
    }
    html({ elNode, main, node }) {
        return '<div class="pr10 pl10 pb4 display-flex"><input type="text" class="node-form-control" node:model="number_delay"/><span class="p4">ms</span></div>';
    }
    properties() {
        return {
            number_delay: {
                key: "number_delay",
                edit: true,
                default: 1000
            }
        };
    }
    async execute(nodeId, data, manager, next) {
        await manager.delay(manager.runCode(data?.number_delay, nodeId));
        await this.nextNode(data, next, nodeId);
    }
}

class CoreEndNode extends WorkerNode {
    key() {
        return "core_end";
    }
    name() {
        return "End";
    }
    icon() {
        return '<i class="fas fa-stop"></i>';
    }
    option() {
        return {
            onlyNode: true,
            sort: 0,
            dot: {
                left: 1,
                top: 0,
                right: 0,
                bottom: 0,
            }
        };
    }
}

class CoreForNode extends WorkerNode {
    key() {
        return "core_for";
    }
    name() {
        return "For";
    }
    icon() {
        return '<i class="fas fa-circle-notch"></i>';
    }
    properties() {
        return {
            number_start: {
                key: "number_start",
                text: 'start',
                edit: true,
                default: 1
            },
            number_end: {
                key: "number_end",
                text: 'end',
                edit: true,
                default: 10
            },
            number_step: {
                key: "number_step",
                text: 'step',
                edit: true,
                default: 1
            },
            env_name: {
                key: "env_name",
                text: 'name',
                edit: true,
                default: 'loop_index'
            }
        };
    }
    html({ elNode, main, node }) {
        return `
      <div class="display-flex">
        <div class="flex-none pl10 pr0 pt4 pb2 text-center" >For</div>
        <div class="pl2 pr0 pt2 pb2" ><input type="text" class="node-form-control" node:model="number_start" /> </div>
        <div class="flex-none pl2 pr0 pt4 pb2 text-center" >To </div>
        <div class="pr2 pl0 pt2 pb2" ><input type="text" class="node-form-control" node:model="number_end" /></div>
        <div class="flex-none pl2 pr0 pt42 pb2 text-center" >Step</div>
        <div class="pr10 pl0 pt2 pb2" ><input type="text" class="node-form-control" node:model="number_step" /></div>
      </div>
      <div class="text-center p3">
        <button class="btnGoGroupl">Go to Content</button>
      </div>`;
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {
            node.parent.openGroup(node.GetId());
        });
        main.tempVariable('env_name', node.getDataValue('env_name'), node.GetId());
    }
    async execute(nodeId, data, manager, next) {
        const group = manager.getGroupCurrent();
        manager.setGroup(data.id);
        const number_start = +manager.getText(data.number_start, nodeId);
        const number_end = +manager.getText(data.number_end, nodeId);
        const number_step = +manager.getText(data.number_step, nodeId);
        for (let loop_index = number_start; loop_index <= number_end && !manager.flgStopping; loop_index = loop_index + number_step) {
            manager.setVariableObject(data.env_name, loop_index, nodeId);
            await manager.excuteAsync();
        }
        manager.setGroup(group);
        await this.nextNode(data, next, nodeId);
    }
}

class CoreForEachNode extends WorkerNode {
    key() {
        return "core_forEach";
    }
    name() {
        return "For Each";
    }
    icon() {
        return '<i class="fas fa-circle-notch"></i>';
    }
    properties() {
        return {
            env_items: {
                key: "env_items",
                text: 'items',
                var: true,
                edit: true,
                default: ''
            },
            env_item: {
                key: "env_item",
                edit: true,
                default: 'item'
            },
            env_name: {
                key: "env_name",
                edit: true,
                default: 'loop_index'
            }
        };
    }
    html({ elNode, main, node }) {
        return `
      <div class="display-flex">
        <div class="flex-none pl10 pr0 pt4 pb2 text-center" >ForEach</div>
        <div class="pr10 pl0 pt2 pb2" ><input type="text" class="node-form-control" node:model="env_item" /></div>
        <div class="pl2 pr0 pt2 pb2" ><input type="text" class="node-form-control" node:model="env_items" /> </div>
      </div>
      <div class="text-center p3">
        <button class="btnGoGroupl">Go to Content</button>
      </div>`;
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {
            node.parent.openGroup(node.GetId());
        });
        main.tempVariable('env_name', node.getDataValue('env_name'), node.GetId());
        main.tempVariable('env_item', node.getDataValue('env_item'), node.GetId());
    }
    async execute(nodeId, data, manager, next) {
        const group = manager.getGroupCurrent();
        manager.setGroup(data.id);
        let env_items = data.env_items;
        if (env_items) {
            let loop_index = 0;
            for (let item of env_items) {
                manager.setVariableObject(data.env_name, loop_index, nodeId);
                manager.setVariableObject(data.env_item, item, nodeId);
                await manager.excuteAsync();
                loop_index++;
            }
        }
        manager.setGroup(group);
        await this.nextNode(data, next, nodeId);
    }
}

class CoreGroupNode extends WorkerNode {
    key() {
        return "core_group";
    }
    name() {
        return "Group";
    }
    icon() {
        return '<i class="far fa-object-group"></i>';
    }
    html({ elNode, main, node }) {
        return '<div class="text-center p3"><button class="btnGoGroup">Go to Group</button></div>';
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {
            node.parent.openGroup(node.GetId());
        });
    }
    async execute(nodeId, data, manager, next) {
        const group = manager.getGroupCurrent();
        manager.setGroup(data.id);
        await manager.excuteAsync();
        manager.setGroup(group);
        await this.nextNode(data, next, nodeId);
    }
}

class CoreIfNode extends WorkerNode {
    key() {
        return "core_if";
    }
    name() {
        return "If";
    }
    icon() {
        return '<i class="fas fa-equals"></i>';
    }
    properties() {
        return {
            condition: {
                key: "condition",
                edit: true,
                hide: true,
                default: 1
            },
            cond: {
                key: "cond",
                hide: true,
                edit: true,
                sub: true,
                default: 1
            }
        };
    }
    option() {
        return {
            class: '',
            dot: {
                left: 1,
                top: 0,
                right: 0,
                bottom: 0,
            }
        };
    }
    html({ elNode, main, node }) {
        const condition = node.getDataValue('condition');
        let html = '';
        for (let index = 0; index < condition; index++) {
            html = `${html}<div class="node-content-row">
      <div class="pl12 pr1 pt2 pb2"><input type="text" class="node-form-control" node:model="cond${50001 + index}"/></div>
      <div style="text-align:right" class="pl1 pr12 pt10 pb10">Then</div>
      <div><span class="node-dot" node="${50001 + index}"></span></div>
      </div>`;
        }
        html = `${html}<div class="node-content-row">
    <div class="pl10 pr1 pt10 pb10"><button class="btnAddCondition">+</button> <button class="btnExceptCondition">-</button></div>
    <div style="text-align:right" class="pl1 pr12 pt10 pb10">Else</div>
    <div><span class="node-dot" node="50000"></span></div>
    </div>`;
        return html;
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnAddCondition')?.addEventListener('click', () => {
            node.IncreaseValue('condition');
        });
        elNode.querySelector('.btnExceptCondition')?.addEventListener('click', () => {
            node.DecreaseValue('condition', 1);
        });
    }
    async execute(nodeId, data, manager, next) {
        const condition = data.condition;
        for (let index = 0; index < condition && !manager.flgStopping; index++) {
            let node = 50001 + index;
            const condition_node = data[`cond${node}`];
            if (manager.runCode(condition_node, nodeId) == true) {
                await this.nextNode(data, next, nodeId, node);
                return;
            }
        }
        await this.nextNode(data, next, nodeId, 50000);
    }
}

class CoreProjectNode extends WorkerNode {
    key() {
        return "core_project";
    }
    name() {
        return "Project";
    }
    icon() {
        return '<i class="fas fa-project-diagram"></i>';
    }
    properties() {
        return {
            project: {
                key: "project",
                edit: true,
                select: true,
                selectNone: 'Select project',
                default: '',
                dataSelect: ({ elNode, main, node }) => {
                    return main.getProjectAll().map((item) => {
                        return {
                            value: item.Get('id'),
                            text: item.Get('name')
                        };
                    });
                },
            }
        };
    }
    html({ elNode, main, node }) {
        return '<div class="text-center pl12 pr0 pt2 pb2"><select class="node-form-control" node:model="project"></select></div>';
    }
    script({ elNode, main, node }) {
    }
    async execute(nodeId, data, manager, next) {
        const project = manager.getProjectCurrent();
        const group = manager.getGroupCurrent();
        manager.setProject(data.project);
        await manager.excuteAsync();
        manager.setProject(project);
        manager.setGroup(group);
        await this.nextNode(data, next, nodeId);
    }
}

class CorepromptNode extends WorkerNode {
    key() {
        return "core_prompt";
    }
    name() {
        return "Prompt";
    }
    icon() {
        return '<i class="fas fa-bolt"></i>';
    }
    properties() {
        return {
            env_name: {
                key: "env_name",
                text: 'name',
                edit: true,
                var: true,
                validate: '^([a-zA-Z0-9\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9]+)$',
                default: ""
            },
            env_message: {
                key: "env_message",
                text: 'message',
                edit: true,
                default: ""
            },
            env_scorp: {
                key: "env_scorp",
                text: 'scorp',
                edit: true,
                select: true,
                selectNone: 'Select scorp',
                default: '',
                dataSelect: ({ elNode, main, node }) => {
                    return main.getGroupCurrent().map((item) => {
                        return {
                            value: item.id,
                            text: item.text
                        };
                    });
                },
            }
        };
    }
    option() {
        return {
            class: '',
            dot: {
                left: 1,
                top: 0,
                right: 1,
                bottom: 0,
            }
        };
    }
    html({ elNode, main, node }) {
        return `<div class="node-content-row">
    <div class="pr10 pl10 pt1 pb7"><textarea type="text" class="node-form-control" node:model="env_message"></textarea></div>
    <div></div>
    </div>`;
    }
    async execute(nodeId, data, manager, next) {
        let rs = prompt(data.env_message);
        manager.setVariableObject(data.env_name, rs, data.env_scorp ?? nodeId);
        await this.nextNode(data, next, nodeId);
    }
}

class CoreSwitchNode extends WorkerNode {
    key() {
        return "core_switch";
    }
    name() {
        return "Switch";
    }
    icon() {
        return '<i class="fas fa-random"></i>';
    }
    properties() {
        return {
            condition: {
                key: "condition",
                edit: true,
                hide: true,
                default: 1
            },
            case: {
                key: "case",
                edit: true,
                sub: true,
                hide: true,
                default: 1
            },
            case_input: {
                key: "case_input",
                text: 'Switch',
                edit: true,
                default: ''
            },
        };
    }
    option() {
        return {
            class: '',
            dot: {
                left: 1,
                top: 0,
                right: 0,
                bottom: 0,
            }
        };
    }
    html({ elNode, main, node }) {
        const condition = node.getDataValue('condition');
        let html = '';
        html = `${html}<div class="node-content-row">
    <div style="text-align:right" class="pl10 pr1 pt10 pb10">Switch</div>
    <div class="pl2 pr1 pt2 pb2"><input type="text" class="node-form-control" node:model="case_input"/></div>
    <div></div>
    </div>`;
        for (let index = 0; index < condition; index++) {
            html = `${html}<div class="node-content-row">
      <div style="text-align:right" class="pl12 pr10 pt10 pb10">Case</div>
      <div class="pl2 pr1 pt2 pb2"><input type="text" class="node-form-control" node:model="case${50001 + index}"/></div>
      <div><span class="node-dot" node="${50001 + index}"></span></div>
      </div>`;
        }
        html = `${html}<div class="node-content-row">
    <div class="pl12 pr1 pt10 pb10"><button class="btnAddCondition">+</button> <button class="btnExceptCondition">-</button></div>
    <div style="text-align:right" class="pl2 pr10 pt10 pb10">Default</div>
    <div><span class="node-dot" node="50000"></span></div>
    </div>`;
        return html;
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnAddCondition')?.addEventListener('click', () => {
            node.IncreaseValue('condition');
        });
        elNode.querySelector('.btnExceptCondition')?.addEventListener('click', () => {
            node.DecreaseValue('condition', 1);
        });
    }
    async execute(nodeId, data, manager, next) {
        const condition = data.condition;
        const case_input = manager.getText(data.case_input, nodeId);
        for (let index = 0; index < condition && !manager.flgStopping; index++) {
            let node = 50001 + index;
            const condition_node = data[`case${node}`];
            if (manager.getText(condition_node, nodeId) == case_input) {
                await this.nextNode(data, next, nodeId, node);
                return;
            }
        }
        await this.nextNode(data, next, nodeId, 50000);
    }
}

class CoreWhileNode extends WorkerNode {
    key() {
        return "core_while";
    }
    name() {
        return "While";
    }
    icon() {
        return '<i class="fas fa-circle-notch"></i>';
    }
    html({ elNode, main, node }) {
        return `<div class="pl12 pr12 pt2 pb2"><input type="text" class="node-form-control" node:model="condition"/></div>
      <div class="text-center p3" > <button class="btnGoGroup" > Go to Content </button></div > `;
    }
    properties() {
        return {
            condition: {
                key: "condition",
                edit: true,
                hide: true,
                default: ''
            }
        };
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {
            node.parent.openGroup(node.GetId());
        });
    }
    async execute(nodeId, data, manager, next) {
        const group = manager.getGroupCurrent();
        manager.setGroup(data.id);
        const condition = data.condition;
        while (manager.runCode(condition, nodeId) == true && !manager.flgStopping) {
            await manager.excuteAsync();
        }
        manager.setGroup(group);
        await this.nextNode(data, next, nodeId);
    }
}

class CoreSetup extends WorkerSetup {
    nodes() {
        return [
            CoreBeginNode,
            CoreEndNode,
            CoreAssignNode,
            CoreDelayNode,
            CoreIfNode,
            CoreSwitchNode,
            CoreForNode,
            CoreForEachNode,
            CoreWhileNode,
            CoreAlertNode,
            CorepromptNode,
            CoreConsoleNode,
            CoreProjectNode,
            CoreGroupNode,
        ];
    }
}

class WorkerScript {
    runCodeInBrowser(script, variableObj) {
        const rs = this.GetTextInBrowser(script, variableObj);
        try {
            return window.eval(rs);
        }
        catch { }
        return rs;
    }
    GetTextInBrowser(script, variableObj) {
        let paramText = "";
        let paramValue = [];
        if (!variableObj)
            variableObj = {};
        for (let key of Object.keys(variableObj)) {
            if (paramText != "") {
                paramText = `${paramText},${key}`;
            }
            else {
                paramText = key;
            }
            paramValue = [...paramValue, variableObj[key]];
        }
        return window.eval('((' + paramText + ')=>(`' + script + '`))')(...paramValue);
    }
    GetTextInNode(script, variableObj) {
        return "";
    }
    runCodeInNode(script, variableObj) {
        const { VM } = require('vm2');
        const vm = new VM();
        return vm.runInContext(script, variableObj);
    }
    runCode(script, variableObj) {
        if (window != undefined && document != undefined) {
            return this.runCodeInBrowser(script, variableObj);
        }
        else {
            return this.runCodeInNode(script, variableObj);
        }
    }
    getText(script, variableObj) {
        if (window != undefined && document != undefined) {
            return this.GetTextInBrowser(script, variableObj);
        }
        else {
            return this.GetTextInNode(script, variableObj);
        }
    }
}

const PropertyEnum = {
    main: "main_project",
    solution: 'main_solution',
    line: 'main_line',
    variable: 'main_variable',
    groupCavas: "main_groupCavas",
};
class WorkerManager {
    events = {};
    scriptCode = new WorkerScript();
    variableValue = {};
    onSafe(event, callback) {
        this.removeListener(event, callback);
        this.on(event, callback);
    }
    /* Events */
    on(event, callback) {
        // Check if the callback is not a function
        if (typeof callback !== 'function') {
            console.error(`The listener callback must be a function, the given type is ${typeof callback}`);
            return false;
        }
        // Check if the event is not a string
        if (typeof event !== 'string') {
            console.error(`The event name must be a string, the given type is ${typeof event}`);
            return false;
        }
        // Check if this event not exists
        if (this.events[event] === undefined) {
            this.events[event] = {
                listeners: []
            };
        }
        this.events[event].listeners.push(callback);
    }
    removeListener(event, callback) {
        // Check if this event not exists
        if (!this.events[event])
            return false;
        const listeners = this.events[event].listeners;
        const listenerIndex = listeners.indexOf(callback);
        const hasListener = listenerIndex > -1;
        if (hasListener)
            listeners.splice(listenerIndex, 1);
    }
    dispatch(event, details) {
        // Check if this event not exists
        if (this.events[event] === undefined) {
            return false;
        }
        this.events[event].listeners.forEach((listener) => {
            listener(details);
        });
    }
    $data;
    $nodes = [];
    $project;
    $group = "root";
    delay_time = 10;
    constructor(data = null) {
        this.LoadData(data);
    }
    setProject(project) {
        this.$project = project;
        this.$group = "root";
        if (this.variableValue[this.$project] === undefined) {
            let prj = this.getProjectById(this.$project);
            this.variableValue[this.$project] = prj.variable.map((item) => {
                return {
                    ...item,
                    value: item.initalValue
                };
            });
        }
    }
    getProjectById(id) {
        return this.$data?.projects?.find((item) => item.id == id);
    }
    getProject() {
        if (this.$data.key === PropertyEnum.solution) {
            return this.getProjectById(this.$project);
        }
        if (this.$data.key === PropertyEnum.main) {
            return this.$data;
        }
    }
    setGroup(group) {
        this.$group = group;
    }
    getGroupCurrent() {
        return this.$group;
    }
    getProjectCurrent() {
        return this.$project;
    }
    getNodeInGroup(group = null) {
        let _group = group ?? this.$group;
        return this.getProject()?.nodes?.filter((item) => item.group == _group);
    }
    getNodeById(_id) {
        return this.getNodeInGroup()?.filter((item) => item.id == _id)?.[0];
    }
    getNodeByKey(_key) {
        return this.getNodeInGroup()?.filter((item) => item.key == _key)?.[0];
    }
    LoadData(data) {
        if (!data)
            return this;
        this.variableValue = {};
        if (typeof data === 'string') {
            this.$data = JSON.parse(data);
        }
        else {
            this.$data = data;
        }
        if (this.$data.key === PropertyEnum.solution) {
            this.$project = this.$data.project;
        }
        if (!this.$project) {
            this.$project = this.$data.projects?.[0]?.id;
        }
        this.setProject(this.$project);
        return this;
    }
    newSetup(setup) {
        this.Setup(new setup());
    }
    Setup(setup) {
        this.$nodes = [...this.$nodes, ...setup.newNodes()];
    }
    getControlNodes() {
        return this.$nodes.map((item) => {
            return {
                ...{
                    key: "",
                    name: "",
                    group: "",
                    html: "",
                    script: "",
                    properties: "",
                    dot: {
                        left: 1,
                        top: 0,
                        right: 1,
                        bottom: 0,
                    }
                },
                ...item.option() ?? {},
                key: item.key(),
                name: item.name(),
                icon: item.icon(),
                group: item.group(),
                html: item.html,
                script: item.script,
                properties: item.properties() ?? {},
            };
        });
    }
    delay(time = 100) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
    getWorkerNode(_key) {
        return this.$nodes?.filter((item) => item.checkKey(_key))?.[0];
    }
    async excuteNode($id) {
        if ($id) {
            const dataNode = this.getNodeById($id);
            await this.excuteDataNode(dataNode);
        }
    }
    async excuteDataNode(dataNode) {
        if (this.flgStopping) {
            this.dispatch('worker_stopping', {});
            return;
        }
        await this.delay(this.delay_time);
        if (dataNode) {
            this.dispatch('node_start', { node: dataNode });
            const workerNode = this.getWorkerNode(dataNode.key);
            await workerNode?.execute(dataNode.id, dataNode, this, async (nextId) => {
                this.clearVariableScope(dataNode.id);
                this.dispatch('node_end', { node: dataNode });
                await this.excuteNode(nextId);
            });
        }
    }
    async excuteAsync() {
        const dataNode = this.getNodeByKey(`${NodeBegin}`);
        await this.excuteDataNode(dataNode);
    }
    excute() {
        setTimeout(async () => {
            this.dispatch('worker_start', {});
            try {
                this.flgStopping = false;
                await this.excuteAsync();
                this.flgStopping = false;
                this.dispatch('worker_end', {});
            }
            catch (ex) {
                console.log(ex);
                this.dispatch('worker_end', {});
            }
            this.flgStopping = false;
        });
    }
    flgStopping = null;
    stop() {
        this.flgStopping = true;
    }
    clearVariableScope(scope, project = null) {
        this.getVariable(project).forEach((item) => {
            if (scope == item.scope)
                item.value = item.initalValue;
        });
    }
    getVariable(project = null) {
        return this.variableValue[project ?? this.$project];
    }
    setVariableObject(name, value, nodeId, project = null) {
        let treeScope = [nodeId];
        while (nodeId != 'root') {
            let node = this.getNodeById(nodeId);
            if (node) {
                nodeId = node.group;
                treeScope = [...treeScope, nodeId];
            }
            else {
                nodeId = 'root';
                treeScope = [...treeScope, nodeId];
            }
        }
        console.log(`${name}:${value}`);
        let $variable = this.getVariable(project);
        const treeLenght = treeScope.length - 1;
        for (let i = 0; i <= treeLenght; i++) {
            let item = $variable.filter((item) => item.scope === treeScope[i] && item.name == name)?.[0];
            if (item) {
                item.value = value;
                return;
            }
        }
    }
    getVariableObject(nodeId, project = null) {
        const variableObj = {};
        let treeScope = [nodeId];
        while (nodeId != 'root') {
            let node = this.getNodeById(nodeId);
            if (node) {
                nodeId = node.group;
                treeScope = [...treeScope, nodeId];
            }
            else {
                nodeId = 'root';
                treeScope = [...treeScope, nodeId];
            }
        }
        let $variable = this.getVariable(project);
        const treeLenght = treeScope.length - 1;
        for (let i = treeLenght; i >= 0; i--) {
            $variable.filter((item) => item.scope === treeScope[i])?.forEach((item) => {
                variableObj[item.name] = item.value;
            });
        }
        return variableObj;
    }
    runCode($scrpit, nodeId) {
        const variableObj = this.getVariableObject(nodeId);
        return this.scriptCode.runCode($scrpit, variableObj);
    }
    getText($scrpit, nodeId) {
        const variableObj = this.getVariableObject(nodeId);
        return this.scriptCode.getText($scrpit, variableObj);
    }
}
const workerManager = new WorkerManager();

workerManager.newSetup(CoreSetup);
var index = {
    CoreSetup,
    WorkerManager,
    workerManager
};

module.exports = index;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy1jb3JlLmNqcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3dvcmtlci9zZXR1cC50cyIsIi4uL3NyYy93b3JrZXIvbm9kZS50cyIsIi4uL3NyYy9ub2Rlcy9hbGVydC50cyIsIi4uL3NyYy9ub2Rlcy9hc3NpZ24udHMiLCIuLi9zcmMvbm9kZXMvYmVnaW4udHMiLCIuLi9zcmMvbm9kZXMvY29uc29sZS50cyIsIi4uL3NyYy9ub2Rlcy9kZWxheS50cyIsIi4uL3NyYy9ub2Rlcy9lbmQudHMiLCIuLi9zcmMvbm9kZXMvZm9yLnRzIiwiLi4vc3JjL25vZGVzL2Zvci1lYWNoLnRzIiwiLi4vc3JjL25vZGVzL2dyb3VwLnRzIiwiLi4vc3JjL25vZGVzL2lmLnRzIiwiLi4vc3JjL25vZGVzL3Byb2plY3QudHMiLCIuLi9zcmMvbm9kZXMvcHJvbXB0LnRzIiwiLi4vc3JjL25vZGVzL3N3aXRjaC50cyIsIi4uL3NyYy9ub2Rlcy93aGlsZS50cyIsIi4uL3NyYy9ub2Rlcy9pbmRleC50cyIsIi4uL3NyYy93b3JrZXIvc2NyaXB0LnRzIiwiLi4vc3JjL3dvcmtlci9tYW5hZ2VyLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBXb3JrZXJTZXR1cCB7XG4gIG5vZGVzKCk6IGFueVtdIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgbmV3Tm9kZXMoKTogV29ya2VyTm9kZVtdIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlcygpLm1hcCgoaXRlbSkgPT4gKG5ldyBpdGVtKCkpKVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4vbWFuYWdlclwiO1xuXG5leHBvcnQgZW51bSBFbnZOb2RlIHtcbiAgQWxsID0gMCxcbiAgV2ViID0gMSxcbiAgUEMgPSAyLFxuICBDbG91ZCA9IDMsXG4gIE1vYmlsZSA9IDQsXG4gIElPUyA9IDUsXG4gIEFuZHJvaWQgPSA2XG59XG5leHBvcnQgdHlwZSBPcHRpb25Ob2RlID0gdm9pZCAmIHtcbiAga2V5OiBcIlwiLFxuICBuYW1lOiBcIlwiLFxuICBncm91cDogXCJcIixcbiAgaHRtbDogXCJcIixcbiAgc2NyaXB0OiBcIlwiLFxuICBwcm9wZXJ0aWVzOiBcIlwiLFxuICBvbmx5Tm9kZTogYm9vbGVhbixcbiAgZG90OiB7XG4gICAgbGVmdDogMSxcbiAgICB0b3A6IDAsXG4gICAgcmlnaHQ6IDEsXG4gICAgYm90dG9tOiAwLFxuICB9XG59XG5leHBvcnQgY2xhc3MgV29ya2VyTm9kZSB7XG4gIGVudigpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFtFbnZOb2RlLkFsbCwgRW52Tm9kZS5DbG91ZCwgRW52Tm9kZS5QQywgRW52Tm9kZS5XZWIsIEVudk5vZGUuTW9iaWxlLCBFbnZOb2RlLklPUywgRW52Tm9kZS5BbmRyb2lkXTtcbiAgfVxuICBwdWJsaWMgQ2hlY2tFbnYoZW52OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5lbnYoKS5pbmNsdWRlcyhlbnYpO1xuICB9XG4gIGtleSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbiAgcHVibGljIGNoZWNrS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMua2V5KCkgPT0ga2V5O1xuICB9XG4gIG5hbWUoKTogYW55IHsgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTsgfVxuICBpY29uKCk6IGFueSB7IHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtcGxheVwiPjwvaT4nOyB9XG4gIGdyb3VwKCk6IGFueSB7XG4gICAgcmV0dXJuIFwiQ29tbW9uXCI7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpIHtcbiAgICByZXR1cm4gYGA7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgeyB9XG4gIHByb3BlcnRpZXMoKTogYW55IHsgfVxuICBvcHRpb24oKTogYW55IHsgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIG5leHROb2RlKGRhdGE6IGFueSwgbmV4dDogYW55LCBub2RlSWQ6IGFueSwgaW5kZXg6IGFueSA9IG51bGwpIHtcbiAgICBpZiAoZGF0YT8ubGluZXMpIHtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgZGF0YS5saW5lcykge1xuICAgICAgICBpZiAoaXRlbS5mcm9tID09IG5vZGVJZCAmJiAoaW5kZXggPT0gbnVsbCB8fCBpdGVtLmZyb21JbmRleCA9PSBpbmRleCkpIHtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgbmV4dChpdGVtLnRvKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgbmV4dCh1bmRlZmluZWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQWxlcnROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfYWxlcnRcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkFsZXJ0XCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJlbGxcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicHIxMCBwbDEwIHBiNFwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibWVzc2FnZVwiLz48L2Rpdj4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZToge1xuICAgICAgICBrZXk6IFwibWVzc2FnZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYWxlcnQobWFuYWdlci5nZXRUZXh0KGRhdGE/Lm1lc3NhZ2UsIG5vZGVJZCkpO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUFzc2lnbk5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9hc3NpZ25cIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkFzc2lnblwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1ib2x0XCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBlbnZfbmFtZToge1xuICAgICAgICBrZXk6IFwiZW52X25hbWVcIixcbiAgICAgICAgdGV4dDogJ25hbWUnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICB2YXI6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlOiAnXihbYS16QS1aMC05XFx1MDYwMC1cXHUwNkZGXFx1MDY2MC1cXHUwNjY5XFx1MDZGMC1cXHUwNkY5XSspJCcsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH0sXG4gICAgICBlbnZfdmFsdWU6IHtcbiAgICAgICAga2V5OiBcImVudl92YWx1ZVwiLFxuICAgICAgICB0ZXh0OiAndmFsdWUnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9LFxuXG4gICAgICBlbnZfc2NvcnA6IHtcbiAgICAgICAga2V5OiBcImVudl9zY29ycFwiLFxuICAgICAgICB0ZXh0OiAnc2NvcnAnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIHNlbGVjdE5vbmU6ICdTZWxlY3Qgc2NvcnAnLFxuICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgZGF0YVNlbGVjdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtYWluLmdldEdyb3VwQ3VycmVudCgpLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5pZCxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS50ZXh0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9wdGlvbigpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjbGFzczogJycsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMSxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBjbGFzcz1cInBsMTAgcHIwIHB0MSBwYjdcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImVudl9uYW1lXCIvPiA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiZmxleC1ub25lIHByNiBwdDYgcGI3IHRleHQtY2VudGVyXCI+PTwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJwcjEwIHBsMCBwdDEgcGI3XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJlbnZfdmFsdWVcIi8+PC9kaXY+XG4gICAgPGRpdj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgbWFuYWdlci5zZXRWYXJpYWJsZU9iamVjdChkYXRhLmVudl9uYW1lLCBtYW5hZ2VyLnJ1bkNvZGUoZGF0YS5lbnZfdmFsdWUsIG5vZGVJZCksIGRhdGEuZW52X3Njb3JwID8/IG5vZGVJZClcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcbmV4cG9ydCBjb25zdCBOb2RlQmVnaW4gPSBcImNvcmVfYmVnaW5cIjtcbmV4cG9ydCBjbGFzcyBDb3JlQmVnaW5Ob2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG5cbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIE5vZGVCZWdpbjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkJlZ2luXCI7XG4gIH1cbiAgb3B0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvbmx5Tm9kZTogdHJ1ZSxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMCxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMSxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH07XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVDb25zb2xlTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2NvbnNvbGVcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkNvbnNvbGVcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtdGVybWluYWxcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicHIxMCBwbDEwIHBiNFwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibWVzc2FnZVwiLz48L2Rpdj4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZToge1xuICAgICAgICBrZXk6IFwibWVzc2FnZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc29sZS5sb2cobWFuYWdlci5nZXRUZXh0KGRhdGE/Lm1lc3NhZ2Usbm9kZUlkKSk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlRGVsYXlOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZGVsYXlcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkRlbGF5XCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3B3YXRjaFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwcjEwIHBsMTAgcGI0IGRpc3BsYXktZmxleFwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibnVtYmVyX2RlbGF5XCIvPjxzcGFuIGNsYXNzPVwicDRcIj5tczwvc3Bhbj48L2Rpdj4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgbnVtYmVyX2RlbGF5OiB7XG4gICAgICAgIGtleTogXCJudW1iZXJfZGVsYXlcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMTAwMFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGF3YWl0IG1hbmFnZXIuZGVsYXkobWFuYWdlci5ydW5Db2RlKGRhdGE/Lm51bWJlcl9kZWxheSxub2RlSWQpKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVFbmROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZW5kXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJFbmRcIjtcbiAgfVxuICBpY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1zdG9wXCI+PC9pPic7XG4gIH1cbiAgb3B0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvbmx5Tm9kZTogdHJ1ZSxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH07XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUZvck5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9mb3JcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkZvclwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1jaXJjbGUtbm90Y2hcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG51bWJlcl9zdGFydDoge1xuICAgICAgICBrZXk6IFwibnVtYmVyX3N0YXJ0XCIsXG4gICAgICAgIHRleHQ6ICdzdGFydCcsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBudW1iZXJfZW5kOiB7XG4gICAgICAgIGtleTogXCJudW1iZXJfZW5kXCIsXG4gICAgICAgIHRleHQ6ICdlbmQnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxMFxuICAgICAgfSxcbiAgICAgIG51bWJlcl9zdGVwOiB7XG4gICAgICAgIGtleTogXCJudW1iZXJfc3RlcFwiLFxuICAgICAgICB0ZXh0OiAnc3RlcCcsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBlbnZfbmFtZToge1xuICAgICAgICBrZXk6IFwiZW52X25hbWVcIixcbiAgICAgICAgdGV4dDogJ25hbWUnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAnbG9vcF9pbmRleCdcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBgXG4gICAgICA8ZGl2IGNsYXNzPVwiZGlzcGxheS1mbGV4XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LW5vbmUgcGwxMCBwcjAgcHQ0IHBiMiB0ZXh0LWNlbnRlclwiID5Gb3I8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBsMiBwcjAgcHQyIHBiMlwiID48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm51bWJlcl9zdGFydFwiIC8+IDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1ub25lIHBsMiBwcjAgcHQ0IHBiMiB0ZXh0LWNlbnRlclwiID5UbyA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInByMiBwbDAgcHQyIHBiMlwiID48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm51bWJlcl9lbmRcIiAvPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1ub25lIHBsMiBwcjAgcHQ0MiBwYjIgdGV4dC1jZW50ZXJcIiA+U3RlcDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicHIxMCBwbDAgcHQyIHBiMlwiID48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm51bWJlcl9zdGVwXCIgLz48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwbFwiPkdvIHRvIENvbnRlbnQ8L2J1dHRvbj5cbiAgICAgIDwvZGl2PmA7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUucGFyZW50Lm9wZW5Hcm91cChub2RlLkdldElkKCkpO1xuICAgIH0pXG4gICAgbWFpbi50ZW1wVmFyaWFibGUoJ2Vudl9uYW1lJyxub2RlLmdldERhdGFWYWx1ZSgnZW52X25hbWUnKSxub2RlLkdldElkKCkpO1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZGF0YS5pZCk7XG4gICAgY29uc3QgbnVtYmVyX3N0YXJ0ID0gK21hbmFnZXIuZ2V0VGV4dChkYXRhLm51bWJlcl9zdGFydCwgbm9kZUlkKTtcbiAgICBjb25zdCBudW1iZXJfZW5kID0gK21hbmFnZXIuZ2V0VGV4dChkYXRhLm51bWJlcl9lbmQsIG5vZGVJZCk7XG4gICAgY29uc3QgbnVtYmVyX3N0ZXAgPSArbWFuYWdlci5nZXRUZXh0KGRhdGEubnVtYmVyX3N0ZXAsIG5vZGVJZCk7XG5cbiAgICBmb3IgKGxldCBsb29wX2luZGV4ID0gbnVtYmVyX3N0YXJ0OyBsb29wX2luZGV4IDw9IG51bWJlcl9lbmQgJiYgIW1hbmFnZXIuZmxnU3RvcHBpbmc7IGxvb3BfaW5kZXggPSBsb29wX2luZGV4ICsgbnVtYmVyX3N0ZXApIHtcbiAgICAgIG1hbmFnZXIuc2V0VmFyaWFibGVPYmplY3QoZGF0YS5lbnZfbmFtZSwgbG9vcF9pbmRleCwgbm9kZUlkKTtcbiAgICAgIGF3YWl0IG1hbmFnZXIuZXhjdXRlQXN5bmMoKTtcbiAgICB9XG4gICAgbWFuYWdlci5zZXRHcm91cChncm91cCk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlRm9yRWFjaE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9mb3JFYWNoXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJGb3IgRWFjaFwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1jaXJjbGUtbm90Y2hcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVudl9pdGVtczoge1xuICAgICAgICBrZXk6IFwiZW52X2l0ZW1zXCIsXG4gICAgICAgIHRleHQ6ICdpdGVtcycsXG4gICAgICAgIHZhcjogdHJ1ZSxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgICBlbnZfaXRlbToge1xuICAgICAgICBrZXk6IFwiZW52X2l0ZW1cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJ2l0ZW0nXG4gICAgICB9LFxuICAgICAgZW52X25hbWU6IHtcbiAgICAgICAga2V5OiBcImVudl9uYW1lXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6ICdsb29wX2luZGV4J1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxkaXYgY2xhc3M9XCJkaXNwbGF5LWZsZXhcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImZsZXgtbm9uZSBwbDEwIHByMCBwdDQgcGIyIHRleHQtY2VudGVyXCIgPkZvckVhY2g8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInByMTAgcGwwIHB0MiBwYjJcIiA+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJlbnZfaXRlbVwiIC8+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwbDIgcHIwIHB0MiBwYjJcIiA+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJlbnZfaXRlbXNcIiAvPiA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwbFwiPkdvIHRvIENvbnRlbnQ8L2J1dHRvbj5cbiAgICAgIDwvZGl2PmA7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUucGFyZW50Lm9wZW5Hcm91cChub2RlLkdldElkKCkpO1xuICAgIH0pXG4gICAgbWFpbi50ZW1wVmFyaWFibGUoJ2Vudl9uYW1lJywgbm9kZS5nZXREYXRhVmFsdWUoJ2Vudl9uYW1lJyksIG5vZGUuR2V0SWQoKSk7XG4gICAgbWFpbi50ZW1wVmFyaWFibGUoJ2Vudl9pdGVtJywgbm9kZS5nZXREYXRhVmFsdWUoJ2Vudl9pdGVtJyksIG5vZGUuR2V0SWQoKSk7XG5cbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldEdyb3VwKGRhdGEuaWQpO1xuICAgIGxldCBlbnZfaXRlbXMgPSBkYXRhLmVudl9pdGVtcztcbiAgICBpZiAoZW52X2l0ZW1zKSB7XG4gICAgICBsZXQgbG9vcF9pbmRleCA9IDA7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIGVudl9pdGVtcykge1xuICAgICAgICBtYW5hZ2VyLnNldFZhcmlhYmxlT2JqZWN0KGRhdGEuZW52X25hbWUsIGxvb3BfaW5kZXgsIG5vZGVJZCk7XG4gICAgICAgIG1hbmFnZXIuc2V0VmFyaWFibGVPYmplY3QoZGF0YS5lbnZfaXRlbSwgaXRlbSwgbm9kZUlkKTtcbiAgICAgICAgYXdhaXQgbWFuYWdlci5leGN1dGVBc3luYygpO1xuICAgICAgICBsb29wX2luZGV4Kys7XG4gICAgICB9XG5cbiAgICB9XG5cblxuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUdyb3VwTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2dyb3VwXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJHcm91cFwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhciBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48YnV0dG9uIGNsYXNzPVwiYnRuR29Hcm91cFwiPkdvIHRvIEdyb3VwPC9idXR0b24+PC9kaXY+JztcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5wYXJlbnQub3Blbkdyb3VwKG5vZGUuR2V0SWQoKSk7XG4gICAgfSlcbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldEdyb3VwKGRhdGEuaWQpO1xuICAgIGF3YWl0IG1hbmFnZXIuZXhjdXRlQXN5bmMoKTtcbiAgICBtYW5hZ2VyLnNldEdyb3VwKGdyb3VwKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVJZk5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9pZlwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiSWZcIjtcbiAgfVxuICBpY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1lcXVhbHNcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmRpdGlvbjoge1xuICAgICAgICBrZXk6IFwiY29uZGl0aW9uXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGhpZGU6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBjb25kOiB7XG4gICAgICAgIGtleTogXCJjb25kXCIsXG4gICAgICAgIGhpZGU6IHRydWUsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHN1YjogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBvcHRpb24oKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY2xhc3M6ICcnLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDEsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbiA9IG5vZGUuZ2V0RGF0YVZhbHVlKCdjb25kaXRpb24nKTtcbiAgICBsZXQgaHRtbCA9ICcnO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb247IGluZGV4KyspIHtcbiAgICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwicGwxMiBwcjEgcHQyIHBiMlwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiY29uZCR7NTAwMDEgKyBpbmRleH1cIi8+PC9kaXY+XG4gICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiIGNsYXNzPVwicGwxIHByMTIgcHQxMCBwYjEwXCI+VGhlbjwvZGl2PlxuICAgICAgPGRpdj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIiR7NTAwMDEgKyBpbmRleH1cIj48L3NwYW4+PC9kaXY+XG4gICAgICA8L2Rpdj5gO1xuICAgIH1cbiAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPlxuICAgIDxkaXYgY2xhc3M9XCJwbDEwIHByMSBwdDEwIHBiMTBcIj48YnV0dG9uIGNsYXNzPVwiYnRuQWRkQ29uZGl0aW9uXCI+KzwvYnV0dG9uPiA8YnV0dG9uIGNsYXNzPVwiYnRuRXhjZXB0Q29uZGl0aW9uXCI+LTwvYnV0dG9uPjwvZGl2PlxuICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIgY2xhc3M9XCJwbDEgcHIxMiBwdDEwIHBiMTBcIj5FbHNlPC9kaXY+XG4gICAgPGRpdj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAwXCI+PC9zcGFuPjwvZGl2PlxuICAgIDwvZGl2PmA7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuQWRkQ29uZGl0aW9uJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5JbmNyZWFzZVZhbHVlKCdjb25kaXRpb24nKTtcbiAgICB9KVxuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuRXhjZXB0Q29uZGl0aW9uJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5EZWNyZWFzZVZhbHVlKCdjb25kaXRpb24nLDEpO1xuICAgIH0pXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcblxuICAgIGNvbnN0IGNvbmRpdGlvbiA9IGRhdGEuY29uZGl0aW9uO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb24gJiYgIW1hbmFnZXIuZmxnU3RvcHBpbmc7IGluZGV4KyspIHtcbiAgICAgIGxldCBub2RlID0gNTAwMDEgKyBpbmRleDtcbiAgICAgIGNvbnN0IGNvbmRpdGlvbl9ub2RlID0gZGF0YVtgY29uZCR7bm9kZX1gXTtcbiAgICAgIGlmIChtYW5hZ2VyLnJ1bkNvZGUoY29uZGl0aW9uX25vZGUsIG5vZGVJZCkgPT0gdHJ1ZSkge1xuICAgICAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCwgbm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQsIDUwMDAwKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVByb2plY3ROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfcHJvamVjdFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiUHJvamVjdFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXByb2plY3QtZGlhZ3JhbVwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvamVjdDoge1xuICAgICAgICBrZXk6IFwicHJvamVjdFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIHNlbGVjdE5vbmU6ICdTZWxlY3QgcHJvamVjdCcsXG4gICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICBkYXRhU2VsZWN0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG1haW4uZ2V0UHJvamVjdEFsbCgpLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5HZXQoJ2lkJyksXG4gICAgICAgICAgICAgIHRleHQ6IGl0ZW0uR2V0KCduYW1lJylcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHBsMTIgcHIwIHB0MiBwYjJcIj48c2VsZWN0IGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwicHJvamVjdFwiPjwvc2VsZWN0PjwvZGl2Pic7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gbWFuYWdlci5nZXRQcm9qZWN0Q3VycmVudCgpO1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldFByb2plY3QoZGF0YS5wcm9qZWN0KTtcbiAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgbWFuYWdlci5zZXRQcm9qZWN0KHByb2plY3QpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZXByb21wdE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9wcm9tcHRcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIlByb21wdFwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1ib2x0XCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBlbnZfbmFtZToge1xuICAgICAgICBrZXk6IFwiZW52X25hbWVcIixcbiAgICAgICAgdGV4dDogJ25hbWUnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICB2YXI6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlOiAnXihbYS16QS1aMC05XFx1MDYwMC1cXHUwNkZGXFx1MDY2MC1cXHUwNjY5XFx1MDZGMC1cXHUwNkY5XSspJCcsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH0sXG4gICAgICBlbnZfbWVzc2FnZToge1xuICAgICAgICBrZXk6IFwiZW52X21lc3NhZ2VcIixcbiAgICAgICAgdGV4dDogJ21lc3NhZ2UnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9LFxuXG4gICAgICBlbnZfc2NvcnA6IHtcbiAgICAgICAga2V5OiBcImVudl9zY29ycFwiLFxuICAgICAgICB0ZXh0OiAnc2NvcnAnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIHNlbGVjdE5vbmU6ICdTZWxlY3Qgc2NvcnAnLFxuICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgZGF0YVNlbGVjdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtYWluLmdldEdyb3VwQ3VycmVudCgpLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5pZCxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS50ZXh0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9wdGlvbigpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjbGFzczogJycsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMSxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBjbGFzcz1cInByMTAgcGwxMCBwdDEgcGI3XCI+PHRleHRhcmVhIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJlbnZfbWVzc2FnZVwiPjwvdGV4dGFyZWE+PC9kaXY+XG4gICAgPGRpdj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgbGV0IHJzID0gcHJvbXB0KGRhdGEuZW52X21lc3NhZ2UpXG4gICAgbWFuYWdlci5zZXRWYXJpYWJsZU9iamVjdChkYXRhLmVudl9uYW1lLCBycywgZGF0YS5lbnZfc2NvcnAgPz8gbm9kZUlkKVxuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVN3aXRjaE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9zd2l0Y2hcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIlN3aXRjaFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXJhbmRvbVwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgaGlkZTogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIGNhc2U6IHtcbiAgICAgICAga2V5OiBcImNhc2VcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc3ViOiB0cnVlLFxuICAgICAgICBoaWRlOiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgY2FzZV9pbnB1dDoge1xuICAgICAgICBrZXk6IFwiY2FzZV9pbnB1dFwiLFxuICAgICAgICB0ZXh0OiAnU3dpdGNoJyxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgfVxuICB9XG4gIG9wdGlvbigpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjbGFzczogJycsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uID0gbm9kZS5nZXREYXRhVmFsdWUoJ2NvbmRpdGlvbicpO1xuICAgIGxldCBodG1sID0gJyc7XG4gICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj5cbiAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiIGNsYXNzPVwicGwxMCBwcjEgcHQxMCBwYjEwXCI+U3dpdGNoPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInBsMiBwcjEgcHQyIHBiMlwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiY2FzZV9pbnB1dFwiLz48L2Rpdj5cbiAgICA8ZGl2PjwvZGl2PlxuICAgIDwvZGl2PmA7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmRpdGlvbjsgaW5kZXgrKykge1xuICAgICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj5cbiAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIgY2xhc3M9XCJwbDEyIHByMTAgcHQxMCBwYjEwXCI+Q2FzZTwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInBsMiBwcjEgcHQyIHBiMlwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiY2FzZSR7NTAwMDEgKyBpbmRleH1cIi8+PC9kaXY+XG4gICAgICA8ZGl2PjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiJHs1MDAwMSArIGluZGV4fVwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDwvZGl2PmA7XG4gICAgfVxuICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBjbGFzcz1cInBsMTIgcHIxIHB0MTAgcGIxMFwiPjxidXR0b24gY2xhc3M9XCJidG5BZGRDb25kaXRpb25cIj4rPC9idXR0b24+IDxidXR0b24gY2xhc3M9XCJidG5FeGNlcHRDb25kaXRpb25cIj4tPC9idXR0b24+PC9kaXY+XG4gICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIiBjbGFzcz1cInBsMiBwcjEwIHB0MTAgcGIxMFwiPkRlZmF1bHQ8L2Rpdj5cbiAgICA8ZGl2PjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDBcIj48L3NwYW4+PC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5BZGRDb25kaXRpb24nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLkluY3JlYXNlVmFsdWUoJ2NvbmRpdGlvbicpO1xuICAgIH0pXG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5FeGNlcHRDb25kaXRpb24nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLkRlY3JlYXNlVmFsdWUoJ2NvbmRpdGlvbicsIDEpO1xuICAgIH0pXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSBkYXRhLmNvbmRpdGlvbjtcbiAgICBjb25zdCBjYXNlX2lucHV0ID0gbWFuYWdlci5nZXRUZXh0KGRhdGEuY2FzZV9pbnB1dCwgbm9kZUlkKTtcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZGl0aW9uICYmICFtYW5hZ2VyLmZsZ1N0b3BwaW5nOyBpbmRleCsrKSB7XG4gICAgICBsZXQgbm9kZSA9IDUwMDAxICsgaW5kZXg7XG4gICAgICBjb25zdCBjb25kaXRpb25fbm9kZSA9IGRhdGFbYGNhc2Uke25vZGV9YF07XG4gICAgICBpZiAobWFuYWdlci5nZXRUZXh0KGNvbmRpdGlvbl9ub2RlLCBub2RlSWQpID09IGNhc2VfaW5wdXQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQsIG5vZGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkLCA1MDAwMCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVXaGlsZU5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV93aGlsZVwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiV2hpbGVcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtY2lyY2xlLW5vdGNoXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cInBsMTIgcHIxMiBwdDIgcGIyXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJjb25kaXRpb25cIi8+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIiA+IDxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwXCIgPiBHbyB0byBDb250ZW50IDwvYnV0dG9uPjwvZGl2ID4gYDtcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmRpdGlvbjoge1xuICAgICAgICBrZXk6IFwiY29uZGl0aW9uXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGhpZGU6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLnBhcmVudC5vcGVuR3JvdXAobm9kZS5HZXRJZCgpKTtcbiAgICB9KVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZGF0YS5pZCk7XG4gICAgY29uc3QgY29uZGl0aW9uID0gZGF0YS5jb25kaXRpb247XG4gICAgd2hpbGUgKG1hbmFnZXIucnVuQ29kZShjb25kaXRpb24sIG5vZGVJZCkgPT0gdHJ1ZSAmJiAhbWFuYWdlci5mbGdTdG9wcGluZykge1xuICAgICAgYXdhaXQgbWFuYWdlci5leGN1dGVBc3luYygpO1xuICAgIH1cbiAgICBtYW5hZ2VyLnNldEdyb3VwKGdyb3VwKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlclNldHVwIH0gZnJvbSBcIi4uL3dvcmtlci9zZXR1cFwiO1xuaW1wb3J0IHsgQ29yZUFsZXJ0Tm9kZSB9IGZyb20gXCIuL2FsZXJ0XCI7XG5pbXBvcnQgeyBDb3JlQXNzaWduTm9kZSB9IGZyb20gXCIuL2Fzc2lnblwiO1xuaW1wb3J0IHsgQ29yZUJlZ2luTm9kZSB9IGZyb20gXCIuL2JlZ2luXCI7XG5pbXBvcnQgeyBDb3JlQ29uc29sZU5vZGUgfSBmcm9tIFwiLi9jb25zb2xlXCI7XG5pbXBvcnQgeyBDb3JlRGVsYXlOb2RlIH0gZnJvbSBcIi4vZGVsYXlcIjtcbmltcG9ydCB7IENvcmVFbmROb2RlIH0gZnJvbSBcIi4vZW5kXCI7XG5pbXBvcnQgeyBDb3JlRm9yTm9kZSB9IGZyb20gXCIuL2ZvclwiO1xuaW1wb3J0IHsgQ29yZUZvckVhY2hOb2RlIH0gZnJvbSBcIi4vZm9yLWVhY2hcIjtcbmltcG9ydCB7IENvcmVHcm91cE5vZGUgfSBmcm9tIFwiLi9ncm91cFwiO1xuaW1wb3J0IHsgQ29yZUlmTm9kZSB9IGZyb20gXCIuL2lmXCI7XG5pbXBvcnQgeyBDb3JlUHJvamVjdE5vZGUgfSBmcm9tIFwiLi9wcm9qZWN0XCI7XG5pbXBvcnQgeyBDb3JlcHJvbXB0Tm9kZSB9IGZyb20gXCIuL3Byb21wdFwiO1xuaW1wb3J0IHsgQ29yZVN3aXRjaE5vZGUgfSBmcm9tIFwiLi9zd2l0Y2hcIjtcbmltcG9ydCB7IENvcmVXaGlsZU5vZGUgfSBmcm9tIFwiLi93aGlsZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVNldHVwIGV4dGVuZHMgV29ya2VyU2V0dXAge1xuICBub2RlcygpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIENvcmVCZWdpbk5vZGUsXG4gICAgICBDb3JlRW5kTm9kZSxcbiAgICAgIENvcmVBc3NpZ25Ob2RlLFxuICAgICAgQ29yZURlbGF5Tm9kZSxcbiAgICAgIENvcmVJZk5vZGUsXG4gICAgICBDb3JlU3dpdGNoTm9kZSxcbiAgICAgIENvcmVGb3JOb2RlLFxuICAgICAgQ29yZUZvckVhY2hOb2RlLFxuICAgICAgQ29yZVdoaWxlTm9kZSxcbiAgICAgIENvcmVBbGVydE5vZGUsXG4gICAgICBDb3JlcHJvbXB0Tm9kZSxcbiAgICAgIENvcmVDb25zb2xlTm9kZSxcbiAgICAgIENvcmVQcm9qZWN0Tm9kZSxcbiAgICAgIENvcmVHcm91cE5vZGUsXG4gICAgXTtcbiAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFdvcmtlclNjcmlwdCB7XG4gIHByaXZhdGUgcnVuQ29kZUluQnJvd3NlcihzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIGNvbnN0IHJzID0gdGhpcy5HZXRUZXh0SW5Ccm93c2VyKHNjcmlwdCwgdmFyaWFibGVPYmopO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gd2luZG93LmV2YWwocnMpO1xuICAgIH0gY2F0Y2ggeyB9XG4gICAgcmV0dXJuIHJzO1xuICB9XG4gIHByaXZhdGUgR2V0VGV4dEluQnJvd3NlcihzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIGxldCBwYXJhbVRleHQgPSBcIlwiO1xuICAgIGxldCBwYXJhbVZhbHVlOiBhbnkgPSBbXTtcbiAgICBpZiAoIXZhcmlhYmxlT2JqKSB2YXJpYWJsZU9iaiA9IHt9O1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh2YXJpYWJsZU9iaikpIHtcbiAgICAgIGlmIChwYXJhbVRleHQgIT0gXCJcIikge1xuICAgICAgICBwYXJhbVRleHQgPSBgJHtwYXJhbVRleHR9LCR7a2V5fWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJhbVRleHQgPSBrZXk7XG4gICAgICB9XG4gICAgICBwYXJhbVZhbHVlID0gWy4uLnBhcmFtVmFsdWUsIHZhcmlhYmxlT2JqW2tleV1dO1xuICAgIH1cbiAgICByZXR1cm4gd2luZG93LmV2YWwoJygoJyArIHBhcmFtVGV4dCArICcpPT4oYCcgKyBzY3JpcHQgKyAnYCkpJykoLi4ucGFyYW1WYWx1ZSlcbiAgfVxuICBwcml2YXRlIEdldFRleHRJbk5vZGUoc2NyaXB0OiBzdHJpbmcsIHZhcmlhYmxlT2JqOiBhbnkpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICBwcml2YXRlIHJ1bkNvZGVJbk5vZGUoc2NyaXB0OiBzdHJpbmcsIHZhcmlhYmxlT2JqOiBhbnkpIHtcbiAgICBjb25zdCB7IFZNIH0gPSByZXF1aXJlKCd2bTInKTtcbiAgICBjb25zdCB2bSA9IG5ldyBWTSgpO1xuICAgIHJldHVybiB2bS5ydW5JbkNvbnRleHQoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gIH1cbiAgcHVibGljIHJ1bkNvZGUoc2NyaXB0OiBzdHJpbmcsIHZhcmlhYmxlT2JqOiBhbnkpIHtcbiAgICBpZiAod2luZG93ICE9IHVuZGVmaW5lZCAmJiBkb2N1bWVudCAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLnJ1bkNvZGVJbkJyb3dzZXIoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJ1bkNvZGVJbk5vZGUoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRUZXh0KHNjcmlwdDogc3RyaW5nLCB2YXJpYWJsZU9iajogYW55KSB7XG4gICAgaWYgKHdpbmRvdyAhPSB1bmRlZmluZWQgJiYgZG9jdW1lbnQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5HZXRUZXh0SW5Ccm93c2VyKHNjcmlwdCwgdmFyaWFibGVPYmopO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5HZXRUZXh0SW5Ob2RlKHNjcmlwdCwgdmFyaWFibGVPYmopO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgTm9kZUJlZ2luIH0gZnJvbSBcIi4uL25vZGVzL2JlZ2luXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4vbm9kZVwiO1xuaW1wb3J0IHsgV29ya2VyU2NyaXB0IH0gZnJvbSBcIi4vc2NyaXB0XCI7XG5pbXBvcnQgeyBXb3JrZXJTZXR1cCB9IGZyb20gXCIuL3NldHVwXCI7XG5leHBvcnQgY29uc3QgUHJvcGVydHlFbnVtID0ge1xuICBtYWluOiBcIm1haW5fcHJvamVjdFwiLFxuICBzb2x1dGlvbjogJ21haW5fc29sdXRpb24nLFxuICBsaW5lOiAnbWFpbl9saW5lJyxcbiAgdmFyaWFibGU6ICdtYWluX3ZhcmlhYmxlJyxcbiAgZ3JvdXBDYXZhczogXCJtYWluX2dyb3VwQ2F2YXNcIixcbn07XG5leHBvcnQgY2xhc3MgV29ya2VyTWFuYWdlciB7XG4gIHByaXZhdGUgZXZlbnRzOiBhbnkgPSB7fTtcbiAgcHVibGljIHNjcmlwdENvZGU6IFdvcmtlclNjcmlwdCA9IG5ldyBXb3JrZXJTY3JpcHQoKTtcbiAgcHJpdmF0ZSB2YXJpYWJsZVZhbHVlOiBhbnkgPSB7fTtcbiAgcHVibGljIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgIHRoaXMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICAvKiBFdmVudHMgKi9cbiAgcHVibGljIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgZXZlbnQgbmFtZSBtdXN0IGJlIGEgc3RyaW5nLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBldmVudH1gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XG4gICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG5cbiAgICBpZiAoIXRoaXMuZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXG4gICAgY29uc3QgbGlzdGVuZXJJbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKVxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXG4gIH1cblxuICBwdWJsaWMgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xuICAgICAgbGlzdGVuZXIoZGV0YWlscyk7XG4gICAgfSk7XG4gIH1cbiAgcHJpdmF0ZSAkZGF0YTogYW55O1xuICBwcml2YXRlICRub2RlczogV29ya2VyTm9kZVtdID0gW107XG4gIHByaXZhdGUgJHByb2plY3Q6IGFueTtcbiAgcHJpdmF0ZSAkZ3JvdXA6IGFueSA9IFwicm9vdFwiO1xuICBwcml2YXRlIGRlbGF5X3RpbWU6IG51bWJlciA9IDEwO1xuICBwdWJsaWMgY29uc3RydWN0b3IoZGF0YTogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuTG9hZERhdGEoZGF0YSk7XG4gIH1cbiAgcHVibGljIHNldFByb2plY3QocHJvamVjdDogYW55KSB7XG4gICAgdGhpcy4kcHJvamVjdCA9IHByb2plY3Q7XG4gICAgdGhpcy4kZ3JvdXAgPSBcInJvb3RcIjtcbiAgICBpZiAodGhpcy52YXJpYWJsZVZhbHVlW3RoaXMuJHByb2plY3RdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBwcmogPSB0aGlzLmdldFByb2plY3RCeUlkKHRoaXMuJHByb2plY3QpO1xuICAgICAgdGhpcy52YXJpYWJsZVZhbHVlW3RoaXMuJHByb2plY3RdID0gcHJqLnZhcmlhYmxlLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICB2YWx1ZTogaXRlbS5pbml0YWxWYWx1ZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RCeUlkKGlkOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YT8ucHJvamVjdHM/LmZpbmQoKGl0ZW06IGFueSkgPT4gaXRlbS5pZCA9PSBpZCk7XG4gIH1cbiAgcHVibGljIGdldFByb2plY3QoKSB7XG4gICAgaWYgKHRoaXMuJGRhdGEua2V5ID09PSBQcm9wZXJ0eUVudW0uc29sdXRpb24pIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFByb2plY3RCeUlkKHRoaXMuJHByb2plY3QpO1xuICAgIH1cbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5tYWluKSB7XG4gICAgICByZXR1cm4gdGhpcy4kZGF0YTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHNldEdyb3VwKGdyb3VwOiBhbnkpIHtcbiAgICB0aGlzLiRncm91cCA9IGdyb3VwO1xuICB9XG4gIHB1YmxpYyBnZXRHcm91cEN1cnJlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuJGdyb3VwO1xuICB9XG4gIHB1YmxpYyBnZXRQcm9qZWN0Q3VycmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvamVjdDtcbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUluR3JvdXAoZ3JvdXA6IGFueSA9IG51bGwpIHtcbiAgICBsZXQgX2dyb3VwID0gZ3JvdXAgPz8gdGhpcy4kZ3JvdXA7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdCgpPy5ub2Rlcz8uZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0uZ3JvdXAgPT0gX2dyb3VwKTtcbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUJ5SWQoX2lkOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5nZXROb2RlSW5Hcm91cCgpPy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5pZCA9PSBfaWQpPy5bMF07XG4gIH1cblxuICBwdWJsaWMgZ2V0Tm9kZUJ5S2V5KF9rZXk6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVJbkdyb3VwKCk/LmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLmtleSA9PSBfa2V5KT8uWzBdO1xuICB9XG4gIHB1YmxpYyBMb2FkRGF0YShkYXRhOiBhbnkpOiBXb3JrZXJNYW5hZ2VyIHtcbiAgICBpZiAoIWRhdGEpIHJldHVybiB0aGlzO1xuICAgIHRoaXMudmFyaWFibGVWYWx1ZSA9IHt9XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy4kZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGRhdGEgPSBkYXRhO1xuICAgIH1cbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgdGhpcy4kcHJvamVjdCA9IHRoaXMuJGRhdGEucHJvamVjdDtcbiAgICB9XG4gICAgaWYgKCF0aGlzLiRwcm9qZWN0KSB7XG4gICAgICB0aGlzLiRwcm9qZWN0ID0gdGhpcy4kZGF0YS5wcm9qZWN0cz8uWzBdPy5pZDtcbiAgICB9XG4gICAgdGhpcy5zZXRQcm9qZWN0KHRoaXMuJHByb2plY3QpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHVibGljIG5ld1NldHVwKHNldHVwOiBhbnkpIHtcbiAgICB0aGlzLlNldHVwKG5ldyBzZXR1cCgpKTtcbiAgfVxuICBwdWJsaWMgU2V0dXAoc2V0dXA6IFdvcmtlclNldHVwKSB7XG4gICAgdGhpcy4kbm9kZXMgPSBbLi4udGhpcy4kbm9kZXMsIC4uLnNldHVwLm5ld05vZGVzKCldO1xuICB9XG4gIHB1YmxpYyBnZXRDb250cm9sTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuJG5vZGVzLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi57XG4gICAgICAgICAga2V5OiBcIlwiLFxuICAgICAgICAgIG5hbWU6IFwiXCIsXG4gICAgICAgICAgZ3JvdXA6IFwiXCIsXG4gICAgICAgICAgaHRtbDogXCJcIixcbiAgICAgICAgICBzY3JpcHQ6IFwiXCIsXG4gICAgICAgICAgcHJvcGVydGllczogXCJcIixcbiAgICAgICAgICBkb3Q6IHtcbiAgICAgICAgICAgIGxlZnQ6IDEsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMSxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC4uLml0ZW0ub3B0aW9uKCkgPz8ge30sXG4gICAgICAgIGtleTogaXRlbS5rZXkoKSxcbiAgICAgICAgbmFtZTogaXRlbS5uYW1lKCksXG4gICAgICAgIGljb246IGl0ZW0uaWNvbigpLFxuICAgICAgICBncm91cDogaXRlbS5ncm91cCgpLFxuICAgICAgICBodG1sOiBpdGVtLmh0bWwsXG4gICAgICAgIHNjcmlwdDogaXRlbS5zY3JpcHQsXG4gICAgICAgIHByb3BlcnRpZXM6IGl0ZW0ucHJvcGVydGllcygpID8/IHt9LFxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgZGVsYXkodGltZTogbnVtYmVyID0gMTAwKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0aW1lKSk7XG4gIH1cbiAgcHJpdmF0ZSBnZXRXb3JrZXJOb2RlKF9rZXk6IHN0cmluZyk6IFdvcmtlck5vZGUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kbm9kZXM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5jaGVja0tleShfa2V5KSk/LlswXTtcbiAgfVxuICBwcml2YXRlIGFzeW5jIGV4Y3V0ZU5vZGUoJGlkOiBhbnkpIHtcbiAgICBpZiAoJGlkKSB7XG4gICAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQoJGlkKTtcbiAgICAgIGF3YWl0IHRoaXMuZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGUpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGFzeW5jIGV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5mbGdTdG9wcGluZykge1xuICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX3N0b3BwaW5nJywge30pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmRlbGF5KHRoaXMuZGVsYXlfdGltZSk7XG4gICAgaWYgKGRhdGFOb2RlKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCdub2RlX3N0YXJ0JywgeyBub2RlOiBkYXRhTm9kZSB9KTtcbiAgICAgIGNvbnN0IHdvcmtlck5vZGUgPSB0aGlzLmdldFdvcmtlck5vZGUoZGF0YU5vZGUua2V5KTtcbiAgICAgIGF3YWl0IHdvcmtlck5vZGU/LmV4ZWN1dGUoZGF0YU5vZGUuaWQsIGRhdGFOb2RlLCB0aGlzLCBhc3luYyAobmV4dElkOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5jbGVhclZhcmlhYmxlU2NvcGUoZGF0YU5vZGUuaWQpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKCdub2RlX2VuZCcsIHsgbm9kZTogZGF0YU5vZGUgfSk7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhjdXRlTm9kZShuZXh0SWQpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBhc3luYyBleGN1dGVBc3luYygpIHtcbiAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5S2V5KGAke05vZGVCZWdpbn1gKTtcbiAgICBhd2FpdCB0aGlzLmV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlKTtcbiAgfVxuICBwdWJsaWMgZXhjdXRlKCkge1xuICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX3N0YXJ0Jywge30pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgICAgICBhd2FpdCB0aGlzLmV4Y3V0ZUFzeW5jKCk7XG4gICAgICAgIHRoaXMuZmxnU3RvcHBpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX2VuZCcsIHt9KTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV4KTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX2VuZCcsIHt9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmxnU3RvcHBpbmcgPSBmYWxzZTtcbiAgICB9KTtcbiAgfVxuICBmbGdTdG9wcGluZzogYW55ID0gbnVsbDtcbiAgcHVibGljIHN0b3AoKSB7XG4gICAgdGhpcy5mbGdTdG9wcGluZyA9IHRydWU7XG4gIH1cbiAgcHVibGljIGNsZWFyVmFyaWFibGVTY29wZShzY29wZTogYW55LCBwcm9qZWN0OiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5nZXRWYXJpYWJsZShwcm9qZWN0KS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGlmIChzY29wZSA9PSBpdGVtLnNjb3BlKVxuICAgICAgICBpdGVtLnZhbHVlID0gaXRlbS5pbml0YWxWYWx1ZTtcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgZ2V0VmFyaWFibGUocHJvamVjdDogYW55ID0gbnVsbCkge1xuICAgIHJldHVybiB0aGlzLnZhcmlhYmxlVmFsdWVbcHJvamVjdCA/PyB0aGlzLiRwcm9qZWN0XVxuICB9XG4gIHB1YmxpYyBzZXRWYXJpYWJsZU9iamVjdChuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIG5vZGVJZDogYW55LCBwcm9qZWN0OiBhbnkgPSBudWxsKSB7XG4gICAgbGV0IHRyZWVTY29wZSA9IFtub2RlSWRdO1xuICAgIHdoaWxlIChub2RlSWQgIT0gJ3Jvb3QnKSB7XG4gICAgICBsZXQgbm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQobm9kZUlkKTtcbiAgICAgIGlmIChub2RlKSB7XG4gICAgICAgIG5vZGVJZCA9IG5vZGUuZ3JvdXBcbiAgICAgICAgdHJlZVNjb3BlID0gWy4uLnRyZWVTY29wZSwgbm9kZUlkXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVJZCA9ICdyb290J1xuICAgICAgICB0cmVlU2NvcGUgPSBbLi4udHJlZVNjb3BlLCBub2RlSWRdO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhgJHtuYW1lfToke3ZhbHVlfWApO1xuICAgIGxldCAkdmFyaWFibGUgPSB0aGlzLmdldFZhcmlhYmxlKHByb2plY3QpO1xuICAgIGNvbnN0IHRyZWVMZW5naHQgPSB0cmVlU2NvcGUubGVuZ3RoIC0gMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSB0cmVlTGVuZ2h0OyBpKyspIHtcbiAgICAgIGxldCBpdGVtID0gJHZhcmlhYmxlLmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLnNjb3BlID09PSB0cmVlU2NvcGVbaV0gJiYgaXRlbS5uYW1lID09IG5hbWUpPy5bMF07XG4gICAgICBpZiAoaXRlbSkge1xuICAgICAgICBpdGVtLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIGdldFZhcmlhYmxlT2JqZWN0KG5vZGVJZDogYW55LCBwcm9qZWN0OiBhbnkgPSBudWxsKSB7XG4gICAgY29uc3QgdmFyaWFibGVPYmo6IGFueSA9IHt9O1xuICAgIGxldCB0cmVlU2NvcGUgPSBbbm9kZUlkXTtcbiAgICB3aGlsZSAobm9kZUlkICE9ICdyb290Jykge1xuICAgICAgbGV0IG5vZGUgPSB0aGlzLmdldE5vZGVCeUlkKG5vZGVJZCk7XG4gICAgICBpZiAobm9kZSkge1xuICAgICAgICBub2RlSWQgPSBub2RlLmdyb3VwXG4gICAgICAgIHRyZWVTY29wZSA9IFsuLi50cmVlU2NvcGUsIG5vZGVJZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlSWQgPSAncm9vdCdcbiAgICAgICAgdHJlZVNjb3BlID0gWy4uLnRyZWVTY29wZSwgbm9kZUlkXTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0ICR2YXJpYWJsZSA9IHRoaXMuZ2V0VmFyaWFibGUocHJvamVjdCk7XG4gICAgY29uc3QgdHJlZUxlbmdodCA9IHRyZWVTY29wZS5sZW5ndGggLSAxO1xuICAgIGZvciAobGV0IGkgPSB0cmVlTGVuZ2h0OyBpID49IDA7IGktLSkge1xuICAgICAgJHZhcmlhYmxlLmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLnNjb3BlID09PSB0cmVlU2NvcGVbaV0pPy5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgdmFyaWFibGVPYmpbaXRlbS5uYW1lXSA9IGl0ZW0udmFsdWU7XG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gdmFyaWFibGVPYmo7XG4gIH1cbiAgcHVibGljIHJ1bkNvZGUoJHNjcnBpdDogYW55LCBub2RlSWQ6IGFueSk6IGFueSB7XG4gICAgY29uc3QgdmFyaWFibGVPYmogPSB0aGlzLmdldFZhcmlhYmxlT2JqZWN0KG5vZGVJZCk7XG4gICAgcmV0dXJuIHRoaXMuc2NyaXB0Q29kZS5ydW5Db2RlKCRzY3JwaXQsIHZhcmlhYmxlT2JqKTtcbiAgfVxuICBwdWJsaWMgZ2V0VGV4dCgkc2NycGl0OiBhbnksIG5vZGVJZDogYW55KTogYW55IHtcbiAgICBjb25zdCB2YXJpYWJsZU9iaiA9IHRoaXMuZ2V0VmFyaWFibGVPYmplY3Qobm9kZUlkKTtcbiAgICByZXR1cm4gdGhpcy5zY3JpcHRDb2RlLmdldFRleHQoJHNjcnBpdCwgdmFyaWFibGVPYmopO1xuICB9XG59XG5leHBvcnQgY29uc3Qgd29ya2VyTWFuYWdlciA9IG5ldyBXb3JrZXJNYW5hZ2VyKCk7XG4iLCJpbXBvcnQgeyBDb3JlU2V0dXAgfSBmcm9tICcuL25vZGVzL2luZGV4JztcbmltcG9ydCB7IHdvcmtlck1hbmFnZXIsIFdvcmtlck1hbmFnZXIgfSBmcm9tICcuL3dvcmtlci9pbmRleCc7XG5cbndvcmtlck1hbmFnZXIubmV3U2V0dXAoQ29yZVNldHVwKTtcblxuZXhwb3J0IGRlZmF1bHQge1xuICBDb3JlU2V0dXAsXG4gIFdvcmtlck1hbmFnZXIsXG4g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
