
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
                edit: true,
                default: 1
            },
            number_end: {
                key: "number_end",
                edit: true,
                default: 10
            },
            number_step: {
                key: "number_step",
                edit: true,
                default: 1
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
        const temp_env_name = `temp_${node.GetId()}_env_name`;
        const temp_value = main.temp.Get(temp_env_name);
        if (!temp_value) {
            main.temp.Set(temp_env_name, node.getDataValue('env_name'));
            main.newVariable(node.getDataValue('env_name'), node.GetId());
        }
        else if (node.getDataValue('env_name') != temp_value) {
            main.changeVariableName(temp_value, node.getDataValue('env_name'), node.GetId());
            main.temp.Set(temp_env_name, node.getDataValue('env_name'));
        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy1jb3JlLmNqcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3dvcmtlci9zZXR1cC50cyIsIi4uL3NyYy93b3JrZXIvbm9kZS50cyIsIi4uL3NyYy9ub2Rlcy9hbGVydC50cyIsIi4uL3NyYy9ub2Rlcy9hc3NpZ24udHMiLCIuLi9zcmMvbm9kZXMvYmVnaW4udHMiLCIuLi9zcmMvbm9kZXMvY29uc29sZS50cyIsIi4uL3NyYy9ub2Rlcy9kZWxheS50cyIsIi4uL3NyYy9ub2Rlcy9lbmQudHMiLCIuLi9zcmMvbm9kZXMvZm9yLnRzIiwiLi4vc3JjL25vZGVzL2dyb3VwLnRzIiwiLi4vc3JjL25vZGVzL2lmLnRzIiwiLi4vc3JjL25vZGVzL3Byb2plY3QudHMiLCIuLi9zcmMvbm9kZXMvcHJvbXB0LnRzIiwiLi4vc3JjL25vZGVzL3N3aXRjaC50cyIsIi4uL3NyYy9ub2Rlcy93aGlsZS50cyIsIi4uL3NyYy9ub2Rlcy9pbmRleC50cyIsIi4uL3NyYy93b3JrZXIvc2NyaXB0LnRzIiwiLi4vc3JjL3dvcmtlci9tYW5hZ2VyLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBXb3JrZXJTZXR1cCB7XG4gIG5vZGVzKCk6IGFueVtdIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgbmV3Tm9kZXMoKTogV29ya2VyTm9kZVtdIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlcygpLm1hcCgoaXRlbSkgPT4gKG5ldyBpdGVtKCkpKVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4vbWFuYWdlclwiO1xuXG5leHBvcnQgZW51bSBFbnZOb2RlIHtcbiAgQWxsID0gMCxcbiAgV2ViID0gMSxcbiAgUEMgPSAyLFxuICBDbG91ZCA9IDMsXG4gIE1vYmlsZSA9IDQsXG4gIElPUyA9IDUsXG4gIEFuZHJvaWQgPSA2XG59XG5leHBvcnQgdHlwZSBPcHRpb25Ob2RlID0gdm9pZCAmIHtcbiAga2V5OiBcIlwiLFxuICBuYW1lOiBcIlwiLFxuICBncm91cDogXCJcIixcbiAgaHRtbDogXCJcIixcbiAgc2NyaXB0OiBcIlwiLFxuICBwcm9wZXJ0aWVzOiBcIlwiLFxuICBvbmx5Tm9kZTogYm9vbGVhbixcbiAgZG90OiB7XG4gICAgbGVmdDogMSxcbiAgICB0b3A6IDAsXG4gICAgcmlnaHQ6IDEsXG4gICAgYm90dG9tOiAwLFxuICB9XG59XG5leHBvcnQgY2xhc3MgV29ya2VyTm9kZSB7XG4gIGVudigpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFtFbnZOb2RlLkFsbCwgRW52Tm9kZS5DbG91ZCwgRW52Tm9kZS5QQywgRW52Tm9kZS5XZWIsIEVudk5vZGUuTW9iaWxlLCBFbnZOb2RlLklPUywgRW52Tm9kZS5BbmRyb2lkXTtcbiAgfVxuICBwdWJsaWMgQ2hlY2tFbnYoZW52OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5lbnYoKS5pbmNsdWRlcyhlbnYpO1xuICB9XG4gIGtleSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbiAgcHVibGljIGNoZWNrS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMua2V5KCkgPT0ga2V5O1xuICB9XG4gIG5hbWUoKTogYW55IHsgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTsgfVxuICBpY29uKCk6IGFueSB7IHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtcGxheVwiPjwvaT4nOyB9XG4gIGdyb3VwKCk6IGFueSB7XG4gICAgcmV0dXJuIFwiQ29tbW9uXCI7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpIHtcbiAgICByZXR1cm4gYGA7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgeyB9XG4gIHByb3BlcnRpZXMoKTogYW55IHsgfVxuICBvcHRpb24oKTogYW55IHsgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIG5leHROb2RlKGRhdGE6IGFueSwgbmV4dDogYW55LCBub2RlSWQ6IGFueSwgaW5kZXg6IGFueSA9IG51bGwpIHtcbiAgICBpZiAoZGF0YT8ubGluZXMpIHtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgZGF0YS5saW5lcykge1xuICAgICAgICBpZiAoaXRlbS5mcm9tID09IG5vZGVJZCAmJiAoaW5kZXggPT0gbnVsbCB8fCBpdGVtLmZyb21JbmRleCA9PSBpbmRleCkpIHtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgbmV4dChpdGVtLnRvKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgbmV4dCh1bmRlZmluZWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQWxlcnROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfYWxlcnRcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkFsZXJ0XCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJlbGxcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicHIxMCBwbDEwIHBiNFwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibWVzc2FnZVwiLz48L2Rpdj4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZToge1xuICAgICAgICBrZXk6IFwibWVzc2FnZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYWxlcnQobWFuYWdlci5nZXRUZXh0KGRhdGE/Lm1lc3NhZ2UsIG5vZGVJZCkpO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUFzc2lnbk5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9hc3NpZ25cIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkFzc2lnblwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1ib2x0XCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBlbnZfbmFtZToge1xuICAgICAgICBrZXk6IFwiZW52X25hbWVcIixcbiAgICAgICAgdGV4dDogJ25hbWUnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICB2YXI6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlOiAnXihbYS16QS1aMC05XFx1MDYwMC1cXHUwNkZGXFx1MDY2MC1cXHUwNjY5XFx1MDZGMC1cXHUwNkY5XSspJCcsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH0sXG4gICAgICBlbnZfdmFsdWU6IHtcbiAgICAgICAga2V5OiBcImVudl92YWx1ZVwiLFxuICAgICAgICB0ZXh0OiAndmFsdWUnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9LFxuXG4gICAgICBlbnZfc2NvcnA6IHtcbiAgICAgICAga2V5OiBcImVudl9zY29ycFwiLFxuICAgICAgICB0ZXh0OiAnc2NvcnAnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIHNlbGVjdE5vbmU6ICdTZWxlY3Qgc2NvcnAnLFxuICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgZGF0YVNlbGVjdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtYWluLmdldEdyb3VwQ3VycmVudCgpLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5pZCxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS50ZXh0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9wdGlvbigpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjbGFzczogJycsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMSxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBjbGFzcz1cInBsMTAgcHIwIHB0MSBwYjdcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImVudl9uYW1lXCIvPiA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiZmxleC1ub25lIHByNiBwdDYgcGI3IHRleHQtY2VudGVyXCI+PTwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJwcjEwIHBsMCBwdDEgcGI3XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJlbnZfdmFsdWVcIi8+PC9kaXY+XG4gICAgPGRpdj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgbWFuYWdlci5zZXRWYXJpYWJsZU9iamVjdChkYXRhLmVudl9uYW1lLCBtYW5hZ2VyLnJ1bkNvZGUoZGF0YS5lbnZfdmFsdWUsIG5vZGVJZCksIGRhdGEuZW52X3Njb3JwID8/IG5vZGVJZClcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcbmV4cG9ydCBjb25zdCBOb2RlQmVnaW4gPSBcImNvcmVfYmVnaW5cIjtcbmV4cG9ydCBjbGFzcyBDb3JlQmVnaW5Ob2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG5cbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIE5vZGVCZWdpbjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkJlZ2luXCI7XG4gIH1cbiAgb3B0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvbmx5Tm9kZTogdHJ1ZSxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMCxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMSxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH07XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVDb25zb2xlTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2NvbnNvbGVcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkNvbnNvbGVcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtdGVybWluYWxcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicHIxMCBwbDEwIHBiNFwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibWVzc2FnZVwiLz48L2Rpdj4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZToge1xuICAgICAgICBrZXk6IFwibWVzc2FnZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc29sZS5sb2cobWFuYWdlci5nZXRUZXh0KGRhdGE/Lm1lc3NhZ2Usbm9kZUlkKSk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlRGVsYXlOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZGVsYXlcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkRlbGF5XCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3B3YXRjaFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwcjEwIHBsMTAgcGI0IGRpc3BsYXktZmxleFwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibnVtYmVyX2RlbGF5XCIvPjxzcGFuIGNsYXNzPVwicDRcIj5tczwvc3Bhbj48L2Rpdj4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgbnVtYmVyX2RlbGF5OiB7XG4gICAgICAgIGtleTogXCJudW1iZXJfZGVsYXlcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMTAwMFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGF3YWl0IG1hbmFnZXIuZGVsYXkobWFuYWdlci5ydW5Db2RlKGRhdGE/Lm51bWJlcl9kZWxheSxub2RlSWQpKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVFbmROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZW5kXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJFbmRcIjtcbiAgfVxuICBpY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1zdG9wXCI+PC9pPic7XG4gIH1cbiAgb3B0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvbmx5Tm9kZTogdHJ1ZSxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH07XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUZvck5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9mb3JcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkZvclwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1jaXJjbGUtbm90Y2hcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG51bWJlcl9zdGFydDoge1xuICAgICAgICBrZXk6IFwibnVtYmVyX3N0YXJ0XCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBudW1iZXJfZW5kOiB7XG4gICAgICAgIGtleTogXCJudW1iZXJfZW5kXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDEwXG4gICAgICB9LFxuICAgICAgbnVtYmVyX3N0ZXA6IHtcbiAgICAgICAga2V5OiBcIm51bWJlcl9zdGVwXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBlbnZfbmFtZToge1xuICAgICAgICBrZXk6IFwiZW52X25hbWVcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJ2xvb3BfaW5kZXgnXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYFxuICAgICAgPGRpdiBjbGFzcz1cImRpc3BsYXktZmxleFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1ub25lIHBsMTAgcHIwIHB0NCBwYjIgdGV4dC1jZW50ZXJcIiA+Rm9yPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwbDIgcHIwIHB0MiBwYjJcIiA+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJudW1iZXJfc3RhcnRcIiAvPiA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImZsZXgtbm9uZSBwbDIgcHIwIHB0NCBwYjIgdGV4dC1jZW50ZXJcIiA+VG8gPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwcjIgcGwwIHB0MiBwYjJcIiA+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJudW1iZXJfZW5kXCIgLz48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImZsZXgtbm9uZSBwbDIgcHIwIHB0NDIgcGIyIHRleHQtY2VudGVyXCIgPlN0ZXA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInByMTAgcGwwIHB0MiBwYjJcIiA+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJudW1iZXJfc3RlcFwiIC8+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuR29Hcm91cGxcIj5HbyB0byBDb250ZW50PC9idXR0b24+XG4gICAgICA8L2Rpdj5gO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLnBhcmVudC5vcGVuR3JvdXAobm9kZS5HZXRJZCgpKTtcbiAgICB9KVxuICAgIGNvbnN0IHRlbXBfZW52X25hbWUgPSBgdGVtcF8ke25vZGUuR2V0SWQoKX1fZW52X25hbWVgO1xuICAgIGNvbnN0IHRlbXBfdmFsdWUgPSBtYWluLnRlbXAuR2V0KHRlbXBfZW52X25hbWUpO1xuICAgIGlmICghdGVtcF92YWx1ZSkge1xuICAgICAgbWFpbi50ZW1wLlNldCh0ZW1wX2Vudl9uYW1lLCBub2RlLmdldERhdGFWYWx1ZSgnZW52X25hbWUnKSk7XG4gICAgICBtYWluLm5ld1ZhcmlhYmxlKG5vZGUuZ2V0RGF0YVZhbHVlKCdlbnZfbmFtZScpLCBub2RlLkdldElkKCkpO1xuICAgIH0gZWxzZSBpZiAobm9kZS5nZXREYXRhVmFsdWUoJ2Vudl9uYW1lJykgIT0gdGVtcF92YWx1ZSkge1xuICAgICAgbWFpbi5jaGFuZ2VWYXJpYWJsZU5hbWUodGVtcF92YWx1ZSwgbm9kZS5nZXREYXRhVmFsdWUoJ2Vudl9uYW1lJyksIG5vZGUuR2V0SWQoKSk7XG4gICAgICBtYWluLnRlbXAuU2V0KHRlbXBfZW52X25hbWUsIG5vZGUuZ2V0RGF0YVZhbHVlKCdlbnZfbmFtZScpKTtcbiAgICB9XG5cbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldEdyb3VwKGRhdGEuaWQpO1xuICAgIGNvbnN0IG51bWJlcl9zdGFydCA9ICttYW5hZ2VyLmdldFRleHQoZGF0YS5udW1iZXJfc3RhcnQsIG5vZGVJZCk7XG4gICAgY29uc3QgbnVtYmVyX2VuZCA9ICttYW5hZ2VyLmdldFRleHQoZGF0YS5udW1iZXJfZW5kLCBub2RlSWQpO1xuICAgIGNvbnN0IG51bWJlcl9zdGVwID0gK21hbmFnZXIuZ2V0VGV4dChkYXRhLm51bWJlcl9zdGVwLCBub2RlSWQpO1xuXG4gICAgZm9yIChsZXQgbG9vcF9pbmRleCA9IG51bWJlcl9zdGFydDsgbG9vcF9pbmRleCA8PSBudW1iZXJfZW5kICYmICFtYW5hZ2VyLmZsZ1N0b3BwaW5nOyBsb29wX2luZGV4ID0gbG9vcF9pbmRleCArIG51bWJlcl9zdGVwKSB7XG4gICAgICBtYW5hZ2VyLnNldFZhcmlhYmxlT2JqZWN0KGRhdGEuZW52X25hbWUsIGxvb3BfaW5kZXgsIG5vZGVJZCk7XG4gICAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgfVxuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUdyb3VwTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2dyb3VwXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJHcm91cFwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhciBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48YnV0dG9uIGNsYXNzPVwiYnRuR29Hcm91cFwiPkdvIHRvIEdyb3VwPC9idXR0b24+PC9kaXY+JztcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5wYXJlbnQub3Blbkdyb3VwKG5vZGUuR2V0SWQoKSk7XG4gICAgfSlcbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldEdyb3VwKGRhdGEuaWQpO1xuICAgIGF3YWl0IG1hbmFnZXIuZXhjdXRlQXN5bmMoKTtcbiAgICBtYW5hZ2VyLnNldEdyb3VwKGdyb3VwKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVJZk5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9pZlwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiSWZcIjtcbiAgfVxuICBpY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1lcXVhbHNcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmRpdGlvbjoge1xuICAgICAgICBrZXk6IFwiY29uZGl0aW9uXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGhpZGU6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBjb25kOiB7XG4gICAgICAgIGtleTogXCJjb25kXCIsXG4gICAgICAgIGhpZGU6IHRydWUsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHN1YjogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBvcHRpb24oKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY2xhc3M6ICcnLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDEsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbiA9IG5vZGUuZ2V0RGF0YVZhbHVlKCdjb25kaXRpb24nKTtcbiAgICBsZXQgaHRtbCA9ICcnO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb247IGluZGV4KyspIHtcbiAgICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwicGwxMiBwcjEgcHQyIHBiMlwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiY29uZCR7NTAwMDEgKyBpbmRleH1cIi8+PC9kaXY+XG4gICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiIGNsYXNzPVwicGwxIHByMTIgcHQxMCBwYjEwXCI+VGhlbjwvZGl2PlxuICAgICAgPGRpdj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIiR7NTAwMDEgKyBpbmRleH1cIj48L3NwYW4+PC9kaXY+XG4gICAgICA8L2Rpdj5gO1xuICAgIH1cbiAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPlxuICAgIDxkaXYgY2xhc3M9XCJwbDEwIHByMSBwdDEwIHBiMTBcIj48YnV0dG9uIGNsYXNzPVwiYnRuQWRkQ29uZGl0aW9uXCI+KzwvYnV0dG9uPiA8YnV0dG9uIGNsYXNzPVwiYnRuRXhjZXB0Q29uZGl0aW9uXCI+LTwvYnV0dG9uPjwvZGl2PlxuICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIgY2xhc3M9XCJwbDEgcHIxMiBwdDEwIHBiMTBcIj5FbHNlPC9kaXY+XG4gICAgPGRpdj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAwXCI+PC9zcGFuPjwvZGl2PlxuICAgIDwvZGl2PmA7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuQWRkQ29uZGl0aW9uJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5JbmNyZWFzZVZhbHVlKCdjb25kaXRpb24nKTtcbiAgICB9KVxuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuRXhjZXB0Q29uZGl0aW9uJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5EZWNyZWFzZVZhbHVlKCdjb25kaXRpb24nLDEpO1xuICAgIH0pXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcblxuICAgIGNvbnN0IGNvbmRpdGlvbiA9IGRhdGEuY29uZGl0aW9uO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb24gJiYgIW1hbmFnZXIuZmxnU3RvcHBpbmc7IGluZGV4KyspIHtcbiAgICAgIGxldCBub2RlID0gNTAwMDEgKyBpbmRleDtcbiAgICAgIGNvbnN0IGNvbmRpdGlvbl9ub2RlID0gZGF0YVtgY29uZCR7bm9kZX1gXTtcbiAgICAgIGlmIChtYW5hZ2VyLnJ1bkNvZGUoY29uZGl0aW9uX25vZGUsIG5vZGVJZCkgPT0gdHJ1ZSkge1xuICAgICAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCwgbm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQsIDUwMDAwKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVByb2plY3ROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfcHJvamVjdFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiUHJvamVjdFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXByb2plY3QtZGlhZ3JhbVwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvamVjdDoge1xuICAgICAgICBrZXk6IFwicHJvamVjdFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIHNlbGVjdE5vbmU6ICdTZWxlY3QgcHJvamVjdCcsXG4gICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICBkYXRhU2VsZWN0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG1haW4uZ2V0UHJvamVjdEFsbCgpLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5HZXQoJ2lkJyksXG4gICAgICAgICAgICAgIHRleHQ6IGl0ZW0uR2V0KCduYW1lJylcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHBsMTIgcHIwIHB0MiBwYjJcIj48c2VsZWN0IGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwicHJvamVjdFwiPjwvc2VsZWN0PjwvZGl2Pic7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gbWFuYWdlci5nZXRQcm9qZWN0Q3VycmVudCgpO1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldFByb2plY3QoZGF0YS5wcm9qZWN0KTtcbiAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgbWFuYWdlci5zZXRQcm9qZWN0KHByb2plY3QpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZXByb21wdE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9wcm9tcHRcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIlByb21wdFwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1ib2x0XCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBlbnZfbmFtZToge1xuICAgICAgICBrZXk6IFwiZW52X25hbWVcIixcbiAgICAgICAgdGV4dDogJ25hbWUnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICB2YXI6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlOiAnXihbYS16QS1aMC05XFx1MDYwMC1cXHUwNkZGXFx1MDY2MC1cXHUwNjY5XFx1MDZGMC1cXHUwNkY5XSspJCcsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH0sXG4gICAgICBlbnZfbWVzc2FnZToge1xuICAgICAgICBrZXk6IFwiZW52X21lc3NhZ2VcIixcbiAgICAgICAgdGV4dDogJ21lc3NhZ2UnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9LFxuXG4gICAgICBlbnZfc2NvcnA6IHtcbiAgICAgICAga2V5OiBcImVudl9zY29ycFwiLFxuICAgICAgICB0ZXh0OiAnc2NvcnAnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIHNlbGVjdE5vbmU6ICdTZWxlY3Qgc2NvcnAnLFxuICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgZGF0YVNlbGVjdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtYWluLmdldEdyb3VwQ3VycmVudCgpLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5pZCxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS50ZXh0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9wdGlvbigpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjbGFzczogJycsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMSxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBjbGFzcz1cInByMTAgcGwxMCBwdDEgcGI3XCI+PHRleHRhcmVhIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJlbnZfbWVzc2FnZVwiPjwvdGV4dGFyZWE+PC9kaXY+XG4gICAgPGRpdj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgbGV0IHJzID0gcHJvbXB0KGRhdGEuZW52X21lc3NhZ2UpXG4gICAgbWFuYWdlci5zZXRWYXJpYWJsZU9iamVjdChkYXRhLmVudl9uYW1lLCBycywgZGF0YS5lbnZfc2NvcnAgPz8gbm9kZUlkKVxuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVN3aXRjaE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9zd2l0Y2hcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIlN3aXRjaFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXJhbmRvbVwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgaGlkZTogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIGNhc2U6IHtcbiAgICAgICAga2V5OiBcImNhc2VcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc3ViOiB0cnVlLFxuICAgICAgICBoaWRlOiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgY2FzZV9pbnB1dDoge1xuICAgICAgICBrZXk6IFwiY2FzZV9pbnB1dFwiLFxuICAgICAgICB0ZXh0OiAnU3dpdGNoJyxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgfVxuICB9XG4gIG9wdGlvbigpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjbGFzczogJycsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uID0gbm9kZS5nZXREYXRhVmFsdWUoJ2NvbmRpdGlvbicpO1xuICAgIGxldCBodG1sID0gJyc7XG4gICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj5cbiAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiIGNsYXNzPVwicGwxMCBwcjEgcHQxMCBwYjEwXCI+U3dpdGNoPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInBsMiBwcjEgcHQyIHBiMlwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiY2FzZV9pbnB1dFwiLz48L2Rpdj5cbiAgICA8ZGl2PjwvZGl2PlxuICAgIDwvZGl2PmA7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmRpdGlvbjsgaW5kZXgrKykge1xuICAgICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj5cbiAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIgY2xhc3M9XCJwbDEyIHByMTAgcHQxMCBwYjEwXCI+Q2FzZTwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInBsMiBwcjEgcHQyIHBiMlwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiY2FzZSR7NTAwMDEgKyBpbmRleH1cIi8+PC9kaXY+XG4gICAgICA8ZGl2PjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiJHs1MDAwMSArIGluZGV4fVwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDwvZGl2PmA7XG4gICAgfVxuICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBjbGFzcz1cInBsMTIgcHIxIHB0MTAgcGIxMFwiPjxidXR0b24gY2xhc3M9XCJidG5BZGRDb25kaXRpb25cIj4rPC9idXR0b24+IDxidXR0b24gY2xhc3M9XCJidG5FeGNlcHRDb25kaXRpb25cIj4tPC9idXR0b24+PC9kaXY+XG4gICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIiBjbGFzcz1cInBsMiBwcjEwIHB0MTAgcGIxMFwiPkRlZmF1bHQ8L2Rpdj5cbiAgICA8ZGl2PjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDBcIj48L3NwYW4+PC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5BZGRDb25kaXRpb24nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLkluY3JlYXNlVmFsdWUoJ2NvbmRpdGlvbicpO1xuICAgIH0pXG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5FeGNlcHRDb25kaXRpb24nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLkRlY3JlYXNlVmFsdWUoJ2NvbmRpdGlvbicsIDEpO1xuICAgIH0pXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSBkYXRhLmNvbmRpdGlvbjtcbiAgICBjb25zdCBjYXNlX2lucHV0ID0gbWFuYWdlci5nZXRUZXh0KGRhdGEuY2FzZV9pbnB1dCwgbm9kZUlkKTtcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZGl0aW9uICYmICFtYW5hZ2VyLmZsZ1N0b3BwaW5nOyBpbmRleCsrKSB7XG4gICAgICBsZXQgbm9kZSA9IDUwMDAxICsgaW5kZXg7XG4gICAgICBjb25zdCBjb25kaXRpb25fbm9kZSA9IGRhdGFbYGNhc2Uke25vZGV9YF07XG4gICAgICBpZiAobWFuYWdlci5nZXRUZXh0KGNvbmRpdGlvbl9ub2RlLCBub2RlSWQpID09IGNhc2VfaW5wdXQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQsIG5vZGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkLCA1MDAwMCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVXaGlsZU5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV93aGlsZVwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiV2hpbGVcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtY2lyY2xlLW5vdGNoXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cInBsMTIgcHIxMiBwdDIgcGIyXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJjb25kaXRpb25cIi8+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIiA+IDxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwXCIgPiBHbyB0byBDb250ZW50IDwvYnV0dG9uPjwvZGl2ID4gYDtcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmRpdGlvbjoge1xuICAgICAgICBrZXk6IFwiY29uZGl0aW9uXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGhpZGU6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLnBhcmVudC5vcGVuR3JvdXAobm9kZS5HZXRJZCgpKTtcbiAgICB9KVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZGF0YS5pZCk7XG4gICAgY29uc3QgY29uZGl0aW9uID0gZGF0YS5jb25kaXRpb247XG4gICAgd2hpbGUgKG1hbmFnZXIucnVuQ29kZShjb25kaXRpb24sIG5vZGVJZCkgPT0gdHJ1ZSAmJiAhbWFuYWdlci5mbGdTdG9wcGluZykge1xuICAgICAgYXdhaXQgbWFuYWdlci5leGN1dGVBc3luYygpO1xuICAgIH1cbiAgICBtYW5hZ2VyLnNldEdyb3VwKGdyb3VwKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlclNldHVwIH0gZnJvbSBcIi4uL3dvcmtlci9zZXR1cFwiO1xuaW1wb3J0IHsgQ29yZUFsZXJ0Tm9kZSB9IGZyb20gXCIuL2FsZXJ0XCI7XG5pbXBvcnQgeyBDb3JlQXNzaWduTm9kZSB9IGZyb20gXCIuL2Fzc2lnblwiO1xuaW1wb3J0IHsgQ29yZUJlZ2luTm9kZSB9IGZyb20gXCIuL2JlZ2luXCI7XG5pbXBvcnQgeyBDb3JlQ29uc29sZU5vZGUgfSBmcm9tIFwiLi9jb25zb2xlXCI7XG5pbXBvcnQgeyBDb3JlRGVsYXlOb2RlIH0gZnJvbSBcIi4vZGVsYXlcIjtcbmltcG9ydCB7IENvcmVFbmROb2RlIH0gZnJvbSBcIi4vZW5kXCI7XG5pbXBvcnQgeyBDb3JlRm9yTm9kZSB9IGZyb20gXCIuL2ZvclwiO1xuaW1wb3J0IHsgQ29yZUdyb3VwTm9kZSB9IGZyb20gXCIuL2dyb3VwXCI7XG5pbXBvcnQgeyBDb3JlSWZOb2RlIH0gZnJvbSBcIi4vaWZcIjtcbmltcG9ydCB7IENvcmVQcm9qZWN0Tm9kZSB9IGZyb20gXCIuL3Byb2plY3RcIjtcbmltcG9ydCB7IENvcmVwcm9tcHROb2RlIH0gZnJvbSBcIi4vcHJvbXB0XCI7XG5pbXBvcnQgeyBDb3JlU3dpdGNoTm9kZSB9IGZyb20gXCIuL3N3aXRjaFwiO1xuaW1wb3J0IHsgQ29yZVdoaWxlTm9kZSB9IGZyb20gXCIuL3doaWxlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlU2V0dXAgZXh0ZW5kcyBXb3JrZXJTZXR1cCB7XG4gIG5vZGVzKCk6IGFueVtdIHtcbiAgICByZXR1cm4gW1xuICAgICAgQ29yZUJlZ2luTm9kZSxcbiAgICAgIENvcmVFbmROb2RlLFxuICAgICAgQ29yZUFzc2lnbk5vZGUsXG4gICAgICBDb3JlRGVsYXlOb2RlLFxuICAgICAgQ29yZUlmTm9kZSxcbiAgICAgIENvcmVTd2l0Y2hOb2RlLFxuICAgICAgQ29yZUZvck5vZGUsXG4gICAgICBDb3JlV2hpbGVOb2RlLFxuICAgICAgQ29yZUFsZXJ0Tm9kZSxcbiAgICAgIENvcmVwcm9tcHROb2RlLFxuICAgICAgQ29yZUNvbnNvbGVOb2RlLFxuICAgICAgQ29yZVByb2plY3ROb2RlLFxuICAgICAgQ29yZUdyb3VwTm9kZSxcbiAgICBdO1xuICB9XG59XG4iLCJleHBvcnQgY2xhc3MgV29ya2VyU2NyaXB0IHtcbiAgcHJpdmF0ZSBydW5Db2RlSW5Ccm93c2VyKHNjcmlwdDogc3RyaW5nLCB2YXJpYWJsZU9iajogYW55KSB7XG4gICAgY29uc3QgcnMgPSB0aGlzLkdldFRleHRJbkJyb3dzZXIoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB3aW5kb3cuZXZhbChycyk7XG4gICAgfSBjYXRjaCB7IH1cbiAgICByZXR1cm4gcnM7XG4gIH1cbiAgcHJpdmF0ZSBHZXRUZXh0SW5Ccm93c2VyKHNjcmlwdDogc3RyaW5nLCB2YXJpYWJsZU9iajogYW55KSB7XG4gICAgbGV0IHBhcmFtVGV4dCA9IFwiXCI7XG4gICAgbGV0IHBhcmFtVmFsdWU6IGFueSA9IFtdO1xuICAgIGlmICghdmFyaWFibGVPYmopIHZhcmlhYmxlT2JqID0ge307XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHZhcmlhYmxlT2JqKSkge1xuICAgICAgaWYgKHBhcmFtVGV4dCAhPSBcIlwiKSB7XG4gICAgICAgIHBhcmFtVGV4dCA9IGAke3BhcmFtVGV4dH0sJHtrZXl9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtVGV4dCA9IGtleTtcbiAgICAgIH1cbiAgICAgIHBhcmFtVmFsdWUgPSBbLi4ucGFyYW1WYWx1ZSwgdmFyaWFibGVPYmpba2V5XV07XG4gICAgfVxuICAgIHJldHVybiB3aW5kb3cuZXZhbCgnKCgnICsgcGFyYW1UZXh0ICsgJyk9PihgJyArIHNjcmlwdCArICdgKSknKSguLi5wYXJhbVZhbHVlKVxuICB9XG4gIHByaXZhdGUgR2V0VGV4dEluTm9kZShzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHByaXZhdGUgcnVuQ29kZUluTm9kZShzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIGNvbnN0IHsgVk0gfSA9IHJlcXVpcmUoJ3ZtMicpO1xuICAgIGNvbnN0IHZtID0gbmV3IFZNKCk7XG4gICAgcmV0dXJuIHZtLnJ1bkluQ29udGV4dChzY3JpcHQsIHZhcmlhYmxlT2JqKTtcbiAgfVxuICBwdWJsaWMgcnVuQ29kZShzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIGlmICh3aW5kb3cgIT0gdW5kZWZpbmVkICYmIGRvY3VtZW50ICE9IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMucnVuQ29kZUluQnJvd3NlcihzY3JpcHQsIHZhcmlhYmxlT2JqKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucnVuQ29kZUluTm9kZShzY3JpcHQsIHZhcmlhYmxlT2JqKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldFRleHQoc2NyaXB0OiBzdHJpbmcsIHZhcmlhYmxlT2JqOiBhbnkpIHtcbiAgICBpZiAod2luZG93ICE9IHVuZGVmaW5lZCAmJiBkb2N1bWVudCAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLkdldFRleHRJbkJyb3dzZXIoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLkdldFRleHRJbk5vZGUoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlQmVnaW4gfSBmcm9tIFwiLi4vbm9kZXMvYmVnaW5cIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi9ub2RlXCI7XG5pbXBvcnQgeyBXb3JrZXJTY3JpcHQgfSBmcm9tIFwiLi9zY3JpcHRcIjtcbmltcG9ydCB7IFdvcmtlclNldHVwIH0gZnJvbSBcIi4vc2V0dXBcIjtcbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnLFxuICBncm91cENhdmFzOiBcIm1haW5fZ3JvdXBDYXZhc1wiLFxufTtcbmV4cG9ydCBjbGFzcyBXb3JrZXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgc2NyaXB0Q29kZTogV29ya2VyU2NyaXB0ID0gbmV3IFdvcmtlclNjcmlwdCgpO1xuICBwcml2YXRlIHZhcmlhYmxlVmFsdWU6IGFueSA9IHt9O1xuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gICAgdGhpcy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlICRkYXRhOiBhbnk7XG4gIHByaXZhdGUgJG5vZGVzOiBXb3JrZXJOb2RlW10gPSBbXTtcbiAgcHJpdmF0ZSAkcHJvamVjdDogYW55O1xuICBwcml2YXRlICRncm91cDogYW55ID0gXCJyb290XCI7XG4gIHByaXZhdGUgZGVsYXlfdGltZTogbnVtYmVyID0gMTA7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihkYXRhOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5Mb2FkRGF0YShkYXRhKTtcbiAgfVxuICBwdWJsaWMgc2V0UHJvamVjdChwcm9qZWN0OiBhbnkpIHtcbiAgICB0aGlzLiRwcm9qZWN0ID0gcHJvamVjdDtcbiAgICB0aGlzLiRncm91cCA9IFwicm9vdFwiO1xuICAgIGlmICh0aGlzLnZhcmlhYmxlVmFsdWVbdGhpcy4kcHJvamVjdF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHByaiA9IHRoaXMuZ2V0UHJvamVjdEJ5SWQodGhpcy4kcHJvamVjdCk7XG4gICAgICB0aGlzLnZhcmlhYmxlVmFsdWVbdGhpcy4kcHJvamVjdF0gPSBwcmoudmFyaWFibGUubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5pdGVtLFxuICAgICAgICAgIHZhbHVlOiBpdGVtLmluaXRhbFZhbHVlXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdEJ5SWQoaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLiRkYXRhPy5wcm9qZWN0cz8uZmluZCgoaXRlbTogYW55KSA9PiBpdGVtLmlkID09IGlkKTtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdCgpIHtcbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdEJ5SWQodGhpcy4kcHJvamVjdCk7XG4gICAgfVxuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLm1haW4pIHtcbiAgICAgIHJldHVybiB0aGlzLiRkYXRhO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgc2V0R3JvdXAoZ3JvdXA6IGFueSkge1xuICAgIHRoaXMuJGdyb3VwID0gZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldEdyb3VwQ3VycmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4kZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RDdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLiRwcm9qZWN0O1xuICB9XG4gIHB1YmxpYyBnZXROb2RlSW5Hcm91cChncm91cDogYW55ID0gbnVsbCkge1xuICAgIGxldCBfZ3JvdXAgPSBncm91cCA/PyB0aGlzLiRncm91cDtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0KCk/Lm5vZGVzPy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5ncm91cCA9PSBfZ3JvdXApO1xuICB9XG4gIHB1YmxpYyBnZXROb2RlQnlJZChfaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVJbkdyb3VwKCk/LmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLmlkID09IF9pZCk/LlswXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXROb2RlQnlLZXkoX2tleTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZUluR3JvdXAoKT8uZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0ua2V5ID09IF9rZXkpPy5bMF07XG4gIH1cbiAgcHVibGljIExvYWREYXRhKGRhdGE6IGFueSk6IFdvcmtlck1hbmFnZXIge1xuICAgIGlmICghZGF0YSkgcmV0dXJuIHRoaXM7XG4gICAgdGhpcy52YXJpYWJsZVZhbHVlID0ge31cbiAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLiRkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZGF0YSA9IGRhdGE7XG4gICAgfVxuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLnNvbHV0aW9uKSB7XG4gICAgICB0aGlzLiRwcm9qZWN0ID0gdGhpcy4kZGF0YS5wcm9qZWN0O1xuICAgIH1cbiAgICBpZiAoIXRoaXMuJHByb2plY3QpIHtcbiAgICAgIHRoaXMuJHByb2plY3QgPSB0aGlzLiRkYXRhLnByb2plY3RzPy5bMF0/LmlkO1xuICAgIH1cbiAgICB0aGlzLnNldFByb2plY3QodGhpcy4kcHJvamVjdCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwdWJsaWMgbmV3U2V0dXAoc2V0dXA6IGFueSkge1xuICAgIHRoaXMuU2V0dXAobmV3IHNldHVwKCkpO1xuICB9XG4gIHB1YmxpYyBTZXR1cChzZXR1cDogV29ya2VyU2V0dXApIHtcbiAgICB0aGlzLiRub2RlcyA9IFsuLi50aGlzLiRub2RlcywgLi4uc2V0dXAubmV3Tm9kZXMoKV07XG4gIH1cbiAgcHVibGljIGdldENvbnRyb2xOb2RlcygpIHtcbiAgICByZXR1cm4gdGhpcy4kbm9kZXMubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLntcbiAgICAgICAgICBrZXk6IFwiXCIsXG4gICAgICAgICAgbmFtZTogXCJcIixcbiAgICAgICAgICBncm91cDogXCJcIixcbiAgICAgICAgICBodG1sOiBcIlwiLFxuICAgICAgICAgIHNjcmlwdDogXCJcIixcbiAgICAgICAgICBwcm9wZXJ0aWVzOiBcIlwiLFxuICAgICAgICAgIGRvdDoge1xuICAgICAgICAgICAgbGVmdDogMSxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLi4uaXRlbS5vcHRpb24oKSA/PyB7fSxcbiAgICAgICAga2V5OiBpdGVtLmtleSgpLFxuICAgICAgICBuYW1lOiBpdGVtLm5hbWUoKSxcbiAgICAgICAgaWNvbjogaXRlbS5pY29uKCksXG4gICAgICAgIGdyb3VwOiBpdGVtLmdyb3VwKCksXG4gICAgICAgIGh0bWw6IGl0ZW0uaHRtbCxcbiAgICAgICAgc2NyaXB0OiBpdGVtLnNjcmlwdCxcbiAgICAgICAgcHJvcGVydGllczogaXRlbS5wcm9wZXJ0aWVzKCkgPz8ge30sXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBkZWxheSh0aW1lOiBudW1iZXIgPSAxMDApIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWUpKTtcbiAgfVxuICBwcml2YXRlIGdldFdvcmtlck5vZGUoX2tleTogc3RyaW5nKTogV29ya2VyTm9kZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLmNoZWNrS2V5KF9rZXkpKT8uWzBdO1xuICB9XG4gIHByaXZhdGUgYXN5bmMgZXhjdXRlTm9kZSgkaWQ6IGFueSkge1xuICAgIGlmICgkaWQpIHtcbiAgICAgIGNvbnN0IGRhdGFOb2RlID0gdGhpcy5nZXROb2RlQnlJZCgkaWQpO1xuICAgICAgYXdhaXQgdGhpcy5leGN1dGVEYXRhTm9kZShkYXRhTm9kZSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgYXN5bmMgZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGU6IGFueSkge1xuICAgIGlmICh0aGlzLmZsZ1N0b3BwaW5nKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfc3RvcHBpbmcnLCB7fSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuZGVsYXkodGhpcy5kZWxheV90aW1lKTtcbiAgICBpZiAoZGF0YU5vZGUpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goJ25vZGVfc3RhcnQnLCB7IG5vZGU6IGRhdGFOb2RlIH0pO1xuICAgICAgY29uc3Qgd29ya2VyTm9kZSA9IHRoaXMuZ2V0V29ya2VyTm9kZShkYXRhTm9kZS5rZXkpO1xuICAgICAgYXdhaXQgd29ya2VyTm9kZT8uZXhlY3V0ZShkYXRhTm9kZS5pZCwgZGF0YU5vZGUsIHRoaXMsIGFzeW5jIChuZXh0SWQ6IGFueSkgPT4ge1xuICAgICAgICB0aGlzLmNsZWFyVmFyaWFibGVTY29wZShkYXRhTm9kZS5pZCk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goJ25vZGVfZW5kJywgeyBub2RlOiBkYXRhTm9kZSB9KTtcbiAgICAgICAgYXdhaXQgdGhpcy5leGN1dGVOb2RlKG5leHRJZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGFzeW5jIGV4Y3V0ZUFzeW5jKCkge1xuICAgIGNvbnN0IGRhdGFOb2RlID0gdGhpcy5nZXROb2RlQnlLZXkoYCR7Tm9kZUJlZ2lufWApO1xuICAgIGF3YWl0IHRoaXMuZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGUpO1xuICB9XG4gIHB1YmxpYyBleGN1dGUoKSB7XG4gICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfc3RhcnQnLCB7fSk7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmZsZ1N0b3BwaW5nID0gZmFsc2U7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhjdXRlQXN5bmMoKTtcbiAgICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfZW5kJywge30pO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXgpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfZW5kJywge30pO1xuICAgICAgfVxuICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG4gIGZsZ1N0b3BwaW5nOiBhbnkgPSBudWxsO1xuICBwdWJsaWMgc3RvcCgpIHtcbiAgICB0aGlzLmZsZ1N0b3BwaW5nID0gdHJ1ZTtcbiAgfVxuICBwdWJsaWMgY2xlYXJWYXJpYWJsZVNjb3BlKHNjb3BlOiBhbnksIHByb2plY3Q6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmdldFZhcmlhYmxlKHByb2plY3QpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgaWYgKHNjb3BlID09IGl0ZW0uc2NvcGUpXG4gICAgICAgIGl0ZW0udmFsdWUgPSBpdGVtLmluaXRhbFZhbHVlO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBnZXRWYXJpYWJsZShwcm9qZWN0OiBhbnkgPSBudWxsKSB7XG4gICAgcmV0dXJuIHRoaXMudmFyaWFibGVWYWx1ZVtwcm9qZWN0ID8/IHRoaXMuJHByb2plY3RdXG4gIH1cbiAgcHVibGljIHNldFZhcmlhYmxlT2JqZWN0KG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgbm9kZUlkOiBhbnksIHByb2plY3Q6IGFueSA9IG51bGwpIHtcbiAgICBsZXQgdHJlZVNjb3BlID0gW25vZGVJZF07XG4gICAgd2hpbGUgKG5vZGVJZCAhPSAncm9vdCcpIHtcbiAgICAgIGxldCBub2RlID0gdGhpcy5nZXROb2RlQnlJZChub2RlSWQpO1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgbm9kZUlkID0gbm9kZS5ncm91cFxuICAgICAgICB0cmVlU2NvcGUgPSBbLi4udHJlZVNjb3BlLCBub2RlSWRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZUlkID0gJ3Jvb3QnXG4gICAgICAgIHRyZWVTY29wZSA9IFsuLi50cmVlU2NvcGUsIG5vZGVJZF07XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGAke25hbWV9OiR7dmFsdWV9YCk7XG4gICAgbGV0ICR2YXJpYWJsZSA9IHRoaXMuZ2V0VmFyaWFibGUocHJvamVjdCk7XG4gICAgY29uc3QgdHJlZUxlbmdodCA9IHRyZWVTY29wZS5sZW5ndGggLSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHRyZWVMZW5naHQ7IGkrKykge1xuICAgICAgbGV0IGl0ZW0gPSAkdmFyaWFibGUuZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0uc2NvcGUgPT09IHRyZWVTY29wZVtpXSAmJiBpdGVtLm5hbWUgPT0gbmFtZSk/LlswXTtcbiAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgIGl0ZW0udmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgZ2V0VmFyaWFibGVPYmplY3Qobm9kZUlkOiBhbnksIHByb2plY3Q6IGFueSA9IG51bGwpIHtcbiAgICBjb25zdCB2YXJpYWJsZU9iajogYW55ID0ge307XG4gICAgbGV0IHRyZWVTY29wZSA9IFtub2RlSWRdO1xuICAgIHdoaWxlIChub2RlSWQgIT0gJ3Jvb3QnKSB7XG4gICAgICBsZXQgbm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQobm9kZUlkKTtcbiAgICAgIGlmIChub2RlKSB7XG4gICAgICAgIG5vZGVJZCA9IG5vZGUuZ3JvdXBcbiAgICAgICAgdHJlZVNjb3BlID0gWy4uLnRyZWVTY29wZSwgbm9kZUlkXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVJZCA9ICdyb290J1xuICAgICAgICB0cmVlU2NvcGUgPSBbLi4udHJlZVNjb3BlLCBub2RlSWRdO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgJHZhcmlhYmxlID0gdGhpcy5nZXRWYXJpYWJsZShwcm9qZWN0KTtcbiAgICBjb25zdCB0cmVlTGVuZ2h0ID0gdHJlZVNjb3BlLmxlbmd0aCAtIDE7XG4gICAgZm9yIChsZXQgaSA9IHRyZWVMZW5naHQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAkdmFyaWFibGUuZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0uc2NvcGUgPT09IHRyZWVTY29wZVtpXSk/LmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICB2YXJpYWJsZU9ialtpdGVtLm5hbWVdID0gaXRlbS52YWx1ZTtcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiB2YXJpYWJsZU9iajtcbiAgfVxuICBwdWJsaWMgcnVuQ29kZSgkc2NycGl0OiBhbnksIG5vZGVJZDogYW55KTogYW55IHtcbiAgICBjb25zdCB2YXJpYWJsZU9iaiA9IHRoaXMuZ2V0VmFyaWFibGVPYmplY3Qobm9kZUlkKTtcbiAgICByZXR1cm4gdGhpcy5zY3JpcHRDb2RlLnJ1bkNvZGUoJHNjcnBpdCwgdmFyaWFibGVPYmopO1xuICB9XG4gIHB1YmxpYyBnZXRUZXh0KCRzY3JwaXQ6IGFueSwgbm9kZUlkOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IHZhcmlhYmxlT2JqID0gdGhpcy5nZXRWYXJpYWJsZU9iamVjdChub2RlSWQpO1xuICAgIHJldHVybiB0aGlzLnNjcmlwdENvZGUuZ2V0VGV4dCgkc2NycGl0LCB2YXJpYWJsZU9iaik7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCB3b3JrZXJNYW5hZ2VyID0gbmV3IFdvcmtlck1hbmFnZXIoKTtcbiIsImltcG9ydCB7IENvcmVTZXR1cCB9IGZyb20gJy4vbm9kZXMvaW5kZXgnO1xuaW1wb3J0IHsgd29ya2VyTWFuYWdlciwgV29ya2VyTWFuYWdlciB9IGZyb20gJy4vd29ya2VyL2luZGV4Jztcblxud29ya2VyTWFuYWdlci5uZXdTZXR1cChDb3JlU2V0dXApO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIENvcmVTZXR1cCxcbiAgV29ya2VyTWFuYWdlcixcbiAgd29ya2VyTWFuYWdlclxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O01BRWEsV0FBVyxDQUFBO0lBQ3RCLEtBQUssR0FBQTtBQUNILFFBQUEsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELFFBQVEsR0FBQTtBQUNOLFFBQUEsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFD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
