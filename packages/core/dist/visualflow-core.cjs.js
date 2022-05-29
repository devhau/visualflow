
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow_core.js v0.0.1-beta
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
    }
    async nextNode(data, next, nodeId, index = null) {
        if (data?.lines) {
            for (let item of data.lines) {
                if (item.from == nodeId && (index == null || item.fromIndex == index)) {
                    await next(item.to);
                }
            }
        }
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
                default: "${Date()}"
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
                edit: true,
                default: ""
            },
            env_value: {
                key: "env_value",
                edit: true,
                default: ""
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
        return `<div class="node-content-row">
    <div class="pl10 pr0 pt2 pb2"><input type="text" class="node-form-control" node:model="env_name"/> </div>
    <div class="flex-none p2 text-center">=</div>
    <div class="pr10 pl0 pt2 pb2"><input type="text" class="node-form-control" node:model="env_value"/></div>
    <div><span class="node-dot" node="50000"></span></div>
    </div>`;
    }
    async execute(nodeId, data, manager, next) {
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
        <button class="btnGoGroup node-form-control">Go to Content</button>
      </div>`;
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {
            node.parent.openGroup(node.GetId());
        });
        const temp_env_name = `temp_${node.GetId()}_env_name`;
        const temp_value = main.temp.Get(temp_env_name);
        if (!temp_value) {
            main.temp.Set(temp_env_name, node.data.Get('env_name'));
            main.newVariable(node.data.Get('env_name'), node.GetId());
        }
        else if (node.data.Get('env_name') != temp_value) {
            main.changeVariableName(temp_value, node.data.Get('env_name'), node.GetId());
            main.temp.Set(temp_env_name, node.data.Get('env_name'));
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
        return '<div class="text-center p3"><button class="btnGoGroup node-form-control">Go to Group</button></div>';
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
                default: 1
            },
            cond: {
                key: "cond",
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
        const condition = node.data.Get('condition');
        let html = '';
        for (let index = 0; index < condition; index++) {
            html = `${html}<div class="node-content-row">
      <div class="pl10 pr1 pt2 pb2"><input type="text" class="node-form-control" node:model="cond${50001 + index}"/></div>
      <div style="text-align:right" class="pl1 pr10 pt2 pb2">Then</div>
      <div><span class="node-dot" node="${50001 + index}"></span></div>
      </div>`;
        }
        html = `${html}<div class="node-content-row">
    <div class="pl10 pr1 pt2 pb2"><button class="btnAddCondition">Add</button></div>
    <div style="text-align:right" class="pl1 pr10 pt2 pb2">Else</div>
    <div><span class="node-dot" node="50000"></span></div>
    </div>`;
        return html;
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnAddCondition')?.addEventListener('click', () => {
            node.data.Increase('condition');
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
        return '<div class="text-center p3"><select class="node-form-control" node:model="project"></select></div>';
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
                default: 1
            },
            case: {
                key: "case",
                edit: true,
                sub: true,
                default: 1
            },
            case_input: {
                key: "case_input",
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
        const condition = node.data.Get('condition');
        let html = '';
        html = `${html}<div class="node-content-row">
    <div style="text-align:right" class="pl10 pr1 pt2 pb2">Input</div>
    <div class="pl2 pr1 pt2 pb2"><input type="text" class="node-form-control" node:model="case_input"/></div>
    <div></div>
    </div>`;
        for (let index = 0; index < condition; index++) {
            html = `${html}<div class="node-content-row">
      <div style="text-align:right" class="pl10 pr1 pt2 pb2">Case</div>
      <div class="pl2 pr1 pt2 pb2"><input type="text" class="node-form-control" node:model="case${50001 + index}"/></div>
      <div><span class="node-dot" node="${50001 + index}"></span></div>
      </div>`;
        }
        html = `${html}<div class="node-content-row">
    <div class="pl10 pr1 pt2 pb2"><button class="btnAddCondition">Add</button></div>
    <div style="text-align:right" class="pl2 pr10 pt2 pb2">Default</div>
    <div><span class="node-dot" node="50000"></span></div>
    </div>`;
        return html;
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnAddCondition')?.addEventListener('click', () => {
            node.data.Increase('condition');
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
            CoreAlertNode,
            CoreConsoleNode,
            CoreProjectNode,
            CoreGroupNode,
        ];
    }
}

class WorkerScript {
    runCodeInBrowser(script, variableObj) {
        return window.eval(this.GetTextInBrowser(script, variableObj));
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
    delay_time = 100;
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
    getWorkerNode(_key) {
        return this.$nodes?.filter((item) => item.checkKey(_key))?.[0];
    }
    async excuteNode($id) {
        const dataNode = this.getNodeById($id);
        await this.excuteDataNode(dataNode);
    }
    delay(time = 100) {
        return new Promise(resolve => setTimeout(resolve, time));
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
            await workerNode?.execute(dataNode.id, dataNode, this, this.excuteNode.bind(this));
            this.dispatch('node_end', { node: dataNode });
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
        let $variable = this.variableValue[project ?? this.$project];
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
        let $variable = this.variableValue[project ?? this.$project];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy1jb3JlLmNqcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3dvcmtlci9zZXR1cC50cyIsIi4uL3NyYy93b3JrZXIvbm9kZS50cyIsIi4uL3NyYy9ub2Rlcy9hbGVydC50cyIsIi4uL3NyYy9ub2Rlcy9hc3NpZ24udHMiLCIuLi9zcmMvbm9kZXMvYmVnaW4udHMiLCIuLi9zcmMvbm9kZXMvY29uc29sZS50cyIsIi4uL3NyYy9ub2Rlcy9kZWxheS50cyIsIi4uL3NyYy9ub2Rlcy9lbmQudHMiLCIuLi9zcmMvbm9kZXMvZm9yLnRzIiwiLi4vc3JjL25vZGVzL2dyb3VwLnRzIiwiLi4vc3JjL25vZGVzL2lmLnRzIiwiLi4vc3JjL25vZGVzL3Byb2plY3QudHMiLCIuLi9zcmMvbm9kZXMvc3dpdGNoLnRzIiwiLi4vc3JjL25vZGVzL2luZGV4LnRzIiwiLi4vc3JjL3dvcmtlci9zY3JpcHQudHMiLCIuLi9zcmMvd29ya2VyL21hbmFnZXIudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlclNldHVwIHtcbiAgbm9kZXMoKTogYW55W10ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBuZXdOb2RlcygpOiBXb3JrZXJOb2RlW10ge1xuICAgIHJldHVybiB0aGlzLm5vZGVzKCkubWFwKChpdGVtKSA9PiAobmV3IGl0ZW0oKSkpXG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyXCI7XG5cbmV4cG9ydCBlbnVtIEVudk5vZGUge1xuICBBbGwgPSAwLFxuICBXZWIgPSAxLFxuICBQQyA9IDIsXG4gIENsb3VkID0gMyxcbiAgTW9iaWxlID0gNCxcbiAgSU9TID0gNSxcbiAgQW5kcm9pZCA9IDZcbn1cbmV4cG9ydCB0eXBlIE9wdGlvbk5vZGUgPSB2b2lkICYge1xuICBrZXk6IFwiXCIsXG4gIG5hbWU6IFwiXCIsXG4gIGdyb3VwOiBcIlwiLFxuICBodG1sOiBcIlwiLFxuICBzY3JpcHQ6IFwiXCIsXG4gIHByb3BlcnRpZXM6IFwiXCIsXG4gIG9ubHlOb2RlOiBib29sZWFuLFxuICBkb3Q6IHtcbiAgICBsZWZ0OiAxLFxuICAgIHRvcDogMCxcbiAgICByaWdodDogMSxcbiAgICBib3R0b206IDAsXG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBXb3JrZXJOb2RlIHtcbiAgZW52KCk6IGFueVtdIHtcbiAgICByZXR1cm4gW0Vudk5vZGUuQWxsLCBFbnZOb2RlLkNsb3VkLCBFbnZOb2RlLlBDLCBFbnZOb2RlLldlYiwgRW52Tm9kZS5Nb2JpbGUsIEVudk5vZGUuSU9TLCBFbnZOb2RlLkFuZHJvaWRdO1xuICB9XG4gIHB1YmxpYyBDaGVja0VudihlbnY6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmVudigpLmluY2x1ZGVzKGVudik7XG4gIH1cbiAga2V5KCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBwdWJsaWMgY2hlY2tLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5rZXkoKSA9PSBrZXk7XG4gIH1cbiAgbmFtZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lOyB9XG4gIGljb24oKTogYW55IHsgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1wbGF5XCI+PC9pPic7IH1cbiAgZ3JvdXAoKTogYW55IHtcbiAgICByZXR1cm4gXCJDb21tb25cIjtcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkge1xuICAgIHJldHVybiBgYDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSB7IH1cbiAgcHJvcGVydGllcygpOiBhbnkgeyB9XG4gIG9wdGlvbigpOiBhbnkgeyB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG5cbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgbmV4dE5vZGUoZGF0YTogYW55LCBuZXh0OiBhbnksIG5vZGVJZDogYW55LCBpbmRleDogYW55ID0gbnVsbCkge1xuICAgIGlmIChkYXRhPy5saW5lcykge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBkYXRhLmxpbmVzKSB7XG4gICAgICAgIGlmIChpdGVtLmZyb20gPT0gbm9kZUlkICYmIChpbmRleCA9PSBudWxsIHx8IGl0ZW0uZnJvbUluZGV4ID09IGluZGV4KSkge1xuICAgICAgICAgIGF3YWl0IG5leHQoaXRlbS50byk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVBbGVydE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9hbGVydFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQWxlcnRcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtYmVsbFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwcjEwIHBsMTAgcGI0XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJtZXNzYWdlXCIvPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIGtleTogXCJtZXNzYWdlXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiJHtEYXRlKCl9XCJcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBhbGVydChtYW5hZ2VyLmdldFRleHQoZGF0YT8ubWVzc2FnZSwgbm9kZUlkKSk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQXNzaWduTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2Fzc2lnblwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQXNzaWduXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJvbHRcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVudl9uYW1lOiB7XG4gICAgICAgIGtleTogXCJlbnZfbmFtZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9LFxuICAgICAgZW52X3ZhbHVlOiB7XG4gICAgICAgIGtleTogXCJlbnZfdmFsdWVcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgfVxuICAgIH1cbiAgfVxuICBvcHRpb24oKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY2xhc3M6ICcnLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDEsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPlxuICAgIDxkaXYgY2xhc3M9XCJwbDEwIHByMCBwdDIgcGIyXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJlbnZfbmFtZVwiLz4gPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImZsZXgtbm9uZSBwMiB0ZXh0LWNlbnRlclwiPj08L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwicHIxMCBwbDAgcHQyIHBiMlwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiZW52X3ZhbHVlXCIvPjwvZGl2PlxuICAgIDxkaXY+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMFwiPjwvc3Bhbj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5leHBvcnQgY29uc3QgTm9kZUJlZ2luID0gXCJjb3JlX2JlZ2luXCI7XG5leHBvcnQgY2xhc3MgQ29yZUJlZ2luTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuXG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBOb2RlQmVnaW47XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJCZWdpblwiO1xuICB9XG4gIG9wdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb25seU5vZGU6IHRydWUsXG4gICAgICBzb3J0OiAwLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDEsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQ29uc29sZU5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9jb25zb2xlXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJDb25zb2xlXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXRlcm1pbmFsXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInByMTAgcGwxMCBwYjRcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm1lc3NhZ2VcIi8+PC9kaXY+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAga2V5OiBcIm1lc3NhZ2VcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgfVxuICAgIH1cbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnNvbGUubG9nKG1hbmFnZXIuZ2V0VGV4dChkYXRhPy5tZXNzYWdlLG5vZGVJZCkpO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZURlbGF5Tm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2RlbGF5XCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJEZWxheVwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1zdG9wd2F0Y2hcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicHIxMCBwbDEwIHBiNCBkaXNwbGF5LWZsZXhcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm51bWJlcl9kZWxheVwiLz48c3BhbiBjbGFzcz1cInA0XCI+bXM8L3NwYW4+PC9kaXY+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG51bWJlcl9kZWxheToge1xuICAgICAgICBrZXk6IFwibnVtYmVyX2RlbGF5XCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDEwMDBcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBhd2FpdCBtYW5hZ2VyLmRlbGF5KG1hbmFnZXIucnVuQ29kZShkYXRhPy5udW1iZXJfZGVsYXksbm9kZUlkKSk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlRW5kTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2VuZFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiRW5kXCI7XG4gIH1cbiAgaWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtc3RvcFwiPjwvaT4nO1xuICB9XG4gIG9wdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb25seU5vZGU6IHRydWUsXG4gICAgICBzb3J0OiAwLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDEsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVGb3JOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZm9yXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJGb3JcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtY2lyY2xlLW5vdGNoXCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBudW1iZXJfc3RhcnQ6IHtcbiAgICAgICAga2V5OiBcIm51bWJlcl9zdGFydFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgbnVtYmVyX2VuZDoge1xuICAgICAgICBrZXk6IFwibnVtYmVyX2VuZFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxMFxuICAgICAgfSxcbiAgICAgIG51bWJlcl9zdGVwOiB7XG4gICAgICAgIGtleTogXCJudW1iZXJfc3RlcFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgZW52X25hbWU6IHtcbiAgICAgICAga2V5OiBcImVudl9uYW1lXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6ICdsb29wX2luZGV4J1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxkaXYgY2xhc3M9XCJkaXNwbGF5LWZsZXhcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImZsZXgtbm9uZSBwbDEwIHByMCBwdDQgcGIyIHRleHQtY2VudGVyXCIgPkZvcjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGwyIHByMCBwdDIgcGIyXCIgPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibnVtYmVyX3N0YXJ0XCIgLz4gPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LW5vbmUgcGwyIHByMCBwdDQgcGIyIHRleHQtY2VudGVyXCIgPlRvIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicHIyIHBsMCBwdDIgcGIyXCIgPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibnVtYmVyX2VuZFwiIC8+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LW5vbmUgcGwyIHByMCBwdDQyIHBiMiB0ZXh0LWNlbnRlclwiID5TdGVwPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwcjEwIHBsMCBwdDIgcGIyXCIgPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibnVtYmVyX3N0ZXBcIiAvPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bkdvR3JvdXAgbm9kZS1mb3JtLWNvbnRyb2xcIj5HbyB0byBDb250ZW50PC9idXR0b24+XG4gICAgICA8L2Rpdj5gO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLnBhcmVudC5vcGVuR3JvdXAobm9kZS5HZXRJZCgpKTtcbiAgICB9KVxuICAgIGNvbnN0IHRlbXBfZW52X25hbWUgPSBgdGVtcF8ke25vZGUuR2V0SWQoKX1fZW52X25hbWVgO1xuICAgIGNvbnN0IHRlbXBfdmFsdWUgPSBtYWluLnRlbXAuR2V0KHRlbXBfZW52X25hbWUpO1xuICAgIGlmICghdGVtcF92YWx1ZSkge1xuICAgICAgbWFpbi50ZW1wLlNldCh0ZW1wX2Vudl9uYW1lLCBub2RlLmRhdGEuR2V0KCdlbnZfbmFtZScpKTtcbiAgICAgIG1haW4ubmV3VmFyaWFibGUobm9kZS5kYXRhLkdldCgnZW52X25hbWUnKSwgbm9kZS5HZXRJZCgpKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUuZGF0YS5HZXQoJ2Vudl9uYW1lJykgIT0gdGVtcF92YWx1ZSkge1xuICAgICAgbWFpbi5jaGFuZ2VWYXJpYWJsZU5hbWUodGVtcF92YWx1ZSwgbm9kZS5kYXRhLkdldCgnZW52X25hbWUnKSwgbm9kZS5HZXRJZCgpKTtcbiAgICAgIG1haW4udGVtcC5TZXQodGVtcF9lbnZfbmFtZSwgbm9kZS5kYXRhLkdldCgnZW52X25hbWUnKSk7XG4gICAgfVxuXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBncm91cCA9IG1hbmFnZXIuZ2V0R3JvdXBDdXJyZW50KCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChkYXRhLmlkKTtcbiAgICBjb25zdCBudW1iZXJfc3RhcnQgPSArbWFuYWdlci5nZXRUZXh0KGRhdGEubnVtYmVyX3N0YXJ0LCBub2RlSWQpO1xuICAgIGNvbnN0IG51bWJlcl9lbmQgPSArbWFuYWdlci5nZXRUZXh0KGRhdGEubnVtYmVyX2VuZCwgbm9kZUlkKTtcbiAgICBjb25zdCBudW1iZXJfc3RlcCA9ICttYW5hZ2VyLmdldFRleHQoZGF0YS5udW1iZXJfc3RlcCwgbm9kZUlkKTtcblxuICAgIGZvciAobGV0IGxvb3BfaW5kZXggPSBudW1iZXJfc3RhcnQ7IGxvb3BfaW5kZXggPD0gbnVtYmVyX2VuZCAmJiAhbWFuYWdlci5mbGdTdG9wcGluZzsgbG9vcF9pbmRleCA9IGxvb3BfaW5kZXggKyBudW1iZXJfc3RlcCkge1xuICAgICAgbWFuYWdlci5zZXRWYXJpYWJsZU9iamVjdChkYXRhLmVudl9uYW1lLCBsb29wX2luZGV4LCBub2RlSWQpO1xuICAgICAgYXdhaXQgbWFuYWdlci5leGN1dGVBc3luYygpO1xuICAgIH1cbiAgICBtYW5hZ2VyLnNldEdyb3VwKGdyb3VwKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVHcm91cE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9ncm91cFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiR3JvdXBcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXIgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+PGJ1dHRvbiBjbGFzcz1cImJ0bkdvR3JvdXAgbm9kZS1mb3JtLWNvbnRyb2xcIj5HbyB0byBHcm91cDwvYnV0dG9uPjwvZGl2Pic7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUucGFyZW50Lm9wZW5Hcm91cChub2RlLkdldElkKCkpO1xuICAgIH0pXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBncm91cCA9IG1hbmFnZXIuZ2V0R3JvdXBDdXJyZW50KCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChkYXRhLmlkKTtcbiAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChncm91cCk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlSWZOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfaWZcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIklmXCI7XG4gIH1cbiAgaWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtZXF1YWxzXCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25kaXRpb246IHtcbiAgICAgICAga2V5OiBcImNvbmRpdGlvblwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgY29uZDoge1xuICAgICAgICBrZXk6IFwiY29uZFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzdWI6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgb3B0aW9uKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzOiAnJyxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSBub2RlLmRhdGEuR2V0KCdjb25kaXRpb24nKTtcbiAgICBsZXQgaHRtbCA9ICcnO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb247IGluZGV4KyspIHtcbiAgICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwicGwxMCBwcjEgcHQyIHBiMlwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiY29uZCR7NTAwMDEgKyBpbmRleH1cIi8+PC9kaXY+XG4gICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiIGNsYXNzPVwicGwxIHByMTAgcHQyIHBiMlwiPlRoZW48L2Rpdj5cbiAgICAgIDxkaXY+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCIkezUwMDAxICsgaW5kZXh9XCI+PC9zcGFuPjwvZGl2PlxuICAgICAgPC9kaXY+YDtcbiAgICB9XG4gICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj5cbiAgICA8ZGl2IGNsYXNzPVwicGwxMCBwcjEgcHQyIHBiMlwiPjxidXR0b24gY2xhc3M9XCJidG5BZGRDb25kaXRpb25cIj5BZGQ8L2J1dHRvbj48L2Rpdj5cbiAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiIGNsYXNzPVwicGwxIHByMTAgcHQyIHBiMlwiPkVsc2U8L2Rpdj5cbiAgICA8ZGl2PjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDBcIj48L3NwYW4+PC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5BZGRDb25kaXRpb24nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLmRhdGEuSW5jcmVhc2UoJ2NvbmRpdGlvbicpO1xuICAgIH0pXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcblxuICAgIGNvbnN0IGNvbmRpdGlvbiA9IGRhdGEuY29uZGl0aW9uO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb24gJiYgIW1hbmFnZXIuZmxnU3RvcHBpbmc7IGluZGV4KyspIHtcbiAgICAgIGxldCBub2RlID0gNTAwMDEgKyBpbmRleDtcbiAgICAgIGNvbnN0IGNvbmRpdGlvbl9ub2RlID0gZGF0YVtgY29uZCR7bm9kZX1gXTtcbiAgICAgIGlmIChtYW5hZ2VyLnJ1bkNvZGUoY29uZGl0aW9uX25vZGUsIG5vZGVJZCkgPT0gdHJ1ZSkge1xuICAgICAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCwgbm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQsIDUwMDAwKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVByb2plY3ROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfcHJvamVjdFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiUHJvamVjdFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXByb2plY3QtZGlhZ3JhbVwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvamVjdDoge1xuICAgICAgICBrZXk6IFwicHJvamVjdFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIGRhdGFTZWxlY3Q6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgICAgICByZXR1cm4gbWFpbi5nZXRQcm9qZWN0QWxsKCkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBpdGVtLkdldCgnaWQnKSxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS5HZXQoJ25hbWUnKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48c2VsZWN0IGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwicHJvamVjdFwiPjwvc2VsZWN0PjwvZGl2Pic7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gbWFuYWdlci5nZXRQcm9qZWN0Q3VycmVudCgpO1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldFByb2plY3QoZGF0YS5wcm9qZWN0KTtcbiAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgbWFuYWdlci5zZXRQcm9qZWN0KHByb2plY3QpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVN3aXRjaE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9zd2l0Y2hcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIlN3aXRjaFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXJhbmRvbVwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIGNhc2U6IHtcbiAgICAgICAga2V5OiBcImNhc2VcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc3ViOiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgY2FzZV9pbnB1dDoge1xuICAgICAgICBrZXk6IFwiY2FzZV9pbnB1dFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfSxcbiAgICB9XG4gIH1cbiAgb3B0aW9uKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzOiAnJyxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSBub2RlLmRhdGEuR2V0KCdjb25kaXRpb24nKTtcbiAgICBsZXQgaHRtbCA9ICcnO1xuICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIiBjbGFzcz1cInBsMTAgcHIxIHB0MiBwYjJcIj5JbnB1dDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJwbDIgcHIxIHB0MiBwYjJcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNhc2VfaW5wdXRcIi8+PC9kaXY+XG4gICAgPGRpdj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb247IGluZGV4KyspIHtcbiAgICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiIGNsYXNzPVwicGwxMCBwcjEgcHQyIHBiMlwiPkNhc2U8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJwbDIgcHIxIHB0MiBwYjJcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNhc2UkezUwMDAxICsgaW5kZXh9XCIvPjwvZGl2PlxuICAgICAgPGRpdj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIiR7NTAwMDEgKyBpbmRleH1cIj48L3NwYW4+PC9kaXY+XG4gICAgICA8L2Rpdj5gO1xuICAgIH1cbiAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPlxuICAgIDxkaXYgY2xhc3M9XCJwbDEwIHByMSBwdDIgcGIyXCI+PGJ1dHRvbiBjbGFzcz1cImJ0bkFkZENvbmRpdGlvblwiPkFkZDwvYnV0dG9uPjwvZGl2PlxuICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIgY2xhc3M9XCJwbDIgcHIxMCBwdDIgcGIyXCI+RGVmYXVsdDwvZGl2PlxuICAgIDxkaXY+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMFwiPjwvc3Bhbj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICAgIHJldHVybiBodG1sO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkFkZENvbmRpdGlvbicpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUuZGF0YS5JbmNyZWFzZSgnY29uZGl0aW9uJyk7XG4gICAgfSlcbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IGNvbmRpdGlvbiA9IGRhdGEuY29uZGl0aW9uO1xuICAgIGNvbnN0IGNhc2VfaW5wdXQgPSBtYW5hZ2VyLmdldFRleHQoZGF0YS5jYXNlX2lucHV0LG5vZGVJZCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmRpdGlvbiAmJiAhbWFuYWdlci5mbGdTdG9wcGluZzsgaW5kZXgrKykge1xuICAgICAgbGV0IG5vZGUgPSA1MDAwMSArIGluZGV4O1xuICAgICAgY29uc3QgY29uZGl0aW9uX25vZGUgPSBkYXRhW2BjYXNlJHtub2RlfWBdO1xuICAgICAgaWYgKG1hbmFnZXIuZ2V0VGV4dChjb25kaXRpb25fbm9kZSxub2RlSWQpID09IGNhc2VfaW5wdXQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQsIG5vZGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkLCA1MDAwMCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlclNldHVwIH0gZnJvbSBcIi4uL3dvcmtlci9zZXR1cFwiO1xuaW1wb3J0IHsgQ29yZUFsZXJ0Tm9kZSB9IGZyb20gXCIuL2FsZXJ0XCI7XG5pbXBvcnQgeyBDb3JlQXNzaWduTm9kZSB9IGZyb20gXCIuL2Fzc2lnblwiO1xuaW1wb3J0IHsgQ29yZUJlZ2luTm9kZSB9IGZyb20gXCIuL2JlZ2luXCI7XG5pbXBvcnQgeyBDb3JlQ29uc29sZU5vZGUgfSBmcm9tIFwiLi9jb25zb2xlXCI7XG5pbXBvcnQgeyBDb3JlRGVsYXlOb2RlIH0gZnJvbSBcIi4vZGVsYXlcIjtcbmltcG9ydCB7IENvcmVFbmROb2RlIH0gZnJvbSBcIi4vZW5kXCI7XG5pbXBvcnQgeyBDb3JlRm9yTm9kZSB9IGZyb20gXCIuL2ZvclwiO1xuaW1wb3J0IHsgQ29yZUdyb3VwTm9kZSB9IGZyb20gXCIuL2dyb3VwXCI7XG5pbXBvcnQgeyBDb3JlSWZOb2RlIH0gZnJvbSBcIi4vaWZcIjtcbmltcG9ydCB7IENvcmVQcm9qZWN0Tm9kZSB9IGZyb20gXCIuL3Byb2plY3RcIjtcbmltcG9ydCB7IENvcmVTd2l0Y2hOb2RlIH0gZnJvbSBcIi4vc3dpdGNoXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlU2V0dXAgZXh0ZW5kcyBXb3JrZXJTZXR1cCB7XG4gIG5vZGVzKCk6IGFueVtdIHtcbiAgICByZXR1cm4gW1xuICAgICAgQ29yZUJlZ2luTm9kZSxcbiAgICAgIENvcmVFbmROb2RlLFxuICAgICAgQ29yZUFzc2lnbk5vZGUsXG4gICAgICBDb3JlRGVsYXlOb2RlLFxuICAgICAgQ29yZUlmTm9kZSxcbiAgICAgIENvcmVTd2l0Y2hOb2RlLFxuICAgICAgQ29yZUZvck5vZGUsXG4gICAgICBDb3JlQWxlcnROb2RlLFxuICAgICAgQ29yZUNvbnNvbGVOb2RlLFxuICAgICAgQ29yZVByb2plY3ROb2RlLFxuICAgICAgQ29yZUdyb3VwTm9kZSxcbiAgICBdO1xuICB9XG59XG4iLCJleHBvcnQgY2xhc3MgV29ya2VyU2NyaXB0IHtcbiAgcHJpdmF0ZSBydW5Db2RlSW5Ccm93c2VyKHNjcmlwdDogc3RyaW5nLCB2YXJpYWJsZU9iajogYW55KSB7XG4gICAgcmV0dXJuIHdpbmRvdy5ldmFsKHRoaXMuR2V0VGV4dEluQnJvd3NlcihzY3JpcHQsIHZhcmlhYmxlT2JqKSk7XG4gIH1cbiAgcHJpdmF0ZSBHZXRUZXh0SW5Ccm93c2VyKHNjcmlwdDogc3RyaW5nLCB2YXJpYWJsZU9iajogYW55KSB7XG4gICAgbGV0IHBhcmFtVGV4dCA9IFwiXCI7XG4gICAgbGV0IHBhcmFtVmFsdWU6IGFueSA9IFtdO1xuICAgIGlmICghdmFyaWFibGVPYmopIHZhcmlhYmxlT2JqID0ge307XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHZhcmlhYmxlT2JqKSkge1xuICAgICAgaWYgKHBhcmFtVGV4dCAhPSBcIlwiKSB7XG4gICAgICAgIHBhcmFtVGV4dCA9IGAke3BhcmFtVGV4dH0sJHtrZXl9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtVGV4dCA9IGtleTtcbiAgICAgIH1cbiAgICAgIHBhcmFtVmFsdWUgPSBbLi4ucGFyYW1WYWx1ZSwgdmFyaWFibGVPYmpba2V5XV07XG4gICAgfVxuICAgIHJldHVybiB3aW5kb3cuZXZhbCgnKCgnICsgcGFyYW1UZXh0ICsgJyk9PihgJyArIHNjcmlwdCArICdgKSknKSguLi5wYXJhbVZhbHVlKVxuICB9XG4gIHByaXZhdGUgR2V0VGV4dEluTm9kZShzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHByaXZhdGUgcnVuQ29kZUluTm9kZShzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIGNvbnN0IHsgVk0gfSA9IHJlcXVpcmUoJ3ZtMicpO1xuICAgIGNvbnN0IHZtID0gbmV3IFZNKCk7XG4gICAgcmV0dXJuIHZtLnJ1bkluQ29udGV4dChzY3JpcHQsIHZhcmlhYmxlT2JqKTtcbiAgfVxuICBwdWJsaWMgcnVuQ29kZShzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIGlmICh3aW5kb3cgIT0gdW5kZWZpbmVkICYmIGRvY3VtZW50ICE9IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMucnVuQ29kZUluQnJvd3NlcihzY3JpcHQsIHZhcmlhYmxlT2JqKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucnVuQ29kZUluTm9kZShzY3JpcHQsIHZhcmlhYmxlT2JqKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldFRleHQoc2NyaXB0OiBzdHJpbmcsIHZhcmlhYmxlT2JqOiBhbnkpIHtcbiAgICBpZiAod2luZG93ICE9IHVuZGVmaW5lZCAmJiBkb2N1bWVudCAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLkdldFRleHRJbkJyb3dzZXIoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLkdldFRleHRJbk5vZGUoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlQmVnaW4gfSBmcm9tIFwiLi4vbm9kZXMvYmVnaW5cIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi9ub2RlXCI7XG5pbXBvcnQgeyBXb3JrZXJTY3JpcHQgfSBmcm9tIFwiLi9zY3JpcHRcIjtcbmltcG9ydCB7IFdvcmtlclNldHVwIH0gZnJvbSBcIi4vc2V0dXBcIjtcbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnLFxuICBncm91cENhdmFzOiBcIm1haW5fZ3JvdXBDYXZhc1wiLFxufTtcbmV4cG9ydCBjbGFzcyBXb3JrZXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgc2NyaXB0Q29kZTogV29ya2VyU2NyaXB0ID0gbmV3IFdvcmtlclNjcmlwdCgpO1xuICBwcml2YXRlIHZhcmlhYmxlVmFsdWU6IGFueSA9IHt9O1xuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gICAgdGhpcy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlICRkYXRhOiBhbnk7XG4gIHByaXZhdGUgJG5vZGVzOiBXb3JrZXJOb2RlW10gPSBbXTtcbiAgcHJpdmF0ZSAkcHJvamVjdDogYW55O1xuICBwcml2YXRlICRncm91cDogYW55ID0gXCJyb290XCI7XG4gIHByaXZhdGUgZGVsYXlfdGltZTogbnVtYmVyID0gMTAwO1xuICBwdWJsaWMgY29uc3RydWN0b3IoZGF0YTogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuTG9hZERhdGEoZGF0YSk7XG4gIH1cbiAgcHVibGljIHNldFByb2plY3QocHJvamVjdDogYW55KSB7XG4gICAgdGhpcy4kcHJvamVjdCA9IHByb2plY3Q7XG4gICAgdGhpcy4kZ3JvdXAgPSBcInJvb3RcIjtcbiAgICBpZiAodGhpcy52YXJpYWJsZVZhbHVlW3RoaXMuJHByb2plY3RdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBwcmogPSB0aGlzLmdldFByb2plY3RCeUlkKHRoaXMuJHByb2plY3QpO1xuICAgICAgdGhpcy52YXJpYWJsZVZhbHVlW3RoaXMuJHByb2plY3RdID0gcHJqLnZhcmlhYmxlLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgICB2YWx1ZTogaXRlbS5pbml0YWxWYWx1ZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RCeUlkKGlkOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YT8ucHJvamVjdHM/LmZpbmQoKGl0ZW06IGFueSkgPT4gaXRlbS5pZCA9PSBpZCk7XG4gIH1cbiAgcHVibGljIGdldFByb2plY3QoKSB7XG4gICAgaWYgKHRoaXMuJGRhdGEua2V5ID09PSBQcm9wZXJ0eUVudW0uc29sdXRpb24pIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFByb2plY3RCeUlkKHRoaXMuJHByb2plY3QpO1xuICAgIH1cbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5tYWluKSB7XG4gICAgICByZXR1cm4gdGhpcy4kZGF0YTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHNldEdyb3VwKGdyb3VwOiBhbnkpIHtcbiAgICB0aGlzLiRncm91cCA9IGdyb3VwO1xuICB9XG4gIHB1YmxpYyBnZXRHcm91cEN1cnJlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuJGdyb3VwO1xuICB9XG4gIHB1YmxpYyBnZXRQcm9qZWN0Q3VycmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvamVjdDtcbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUluR3JvdXAoZ3JvdXA6IGFueSA9IG51bGwpIHtcbiAgICBsZXQgX2dyb3VwID0gZ3JvdXAgPz8gdGhpcy4kZ3JvdXA7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdCgpPy5ub2Rlcz8uZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0uZ3JvdXAgPT0gX2dyb3VwKTtcbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUJ5SWQoX2lkOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5nZXROb2RlSW5Hcm91cCgpPy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5pZCA9PSBfaWQpPy5bMF07XG4gIH1cblxuICBwdWJsaWMgZ2V0Tm9kZUJ5S2V5KF9rZXk6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVJbkdyb3VwKCk/LmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLmtleSA9PSBfa2V5KT8uWzBdO1xuICB9XG4gIHB1YmxpYyBMb2FkRGF0YShkYXRhOiBhbnkpOiBXb3JrZXJNYW5hZ2VyIHtcbiAgICBpZiAoIWRhdGEpIHJldHVybiB0aGlzO1xuICAgIHRoaXMudmFyaWFibGVWYWx1ZSA9IHt9XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy4kZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGRhdGEgPSBkYXRhO1xuICAgIH1cbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgdGhpcy4kcHJvamVjdCA9IHRoaXMuJGRhdGEucHJvamVjdDtcbiAgICB9XG4gICAgaWYgKCF0aGlzLiRwcm9qZWN0KSB7XG4gICAgICB0aGlzLiRwcm9qZWN0ID0gdGhpcy4kZGF0YS5wcm9qZWN0cz8uWzBdPy5pZDtcbiAgICB9XG4gICAgdGhpcy5zZXRQcm9qZWN0KHRoaXMuJHByb2plY3QpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHVibGljIG5ld1NldHVwKHNldHVwOiBhbnkpIHtcbiAgICB0aGlzLlNldHVwKG5ldyBzZXR1cCgpKTtcbiAgfVxuICBwdWJsaWMgU2V0dXAoc2V0dXA6IFdvcmtlclNldHVwKSB7XG4gICAgdGhpcy4kbm9kZXMgPSBbLi4udGhpcy4kbm9kZXMsIC4uLnNldHVwLm5ld05vZGVzKCldO1xuICB9XG4gIHB1YmxpYyBnZXRDb250cm9sTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuJG5vZGVzLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi57XG4gICAgICAgICAga2V5OiBcIlwiLFxuICAgICAgICAgIG5hbWU6IFwiXCIsXG4gICAgICAgICAgZ3JvdXA6IFwiXCIsXG4gICAgICAgICAgaHRtbDogXCJcIixcbiAgICAgICAgICBzY3JpcHQ6IFwiXCIsXG4gICAgICAgICAgcHJvcGVydGllczogXCJcIixcbiAgICAgICAgICBkb3Q6IHtcbiAgICAgICAgICAgIGxlZnQ6IDEsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMSxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC4uLml0ZW0ub3B0aW9uKCkgPz8ge30sXG4gICAgICAgIGtleTogaXRlbS5rZXkoKSxcbiAgICAgICAgbmFtZTogaXRlbS5uYW1lKCksXG4gICAgICAgIGljb246IGl0ZW0uaWNvbigpLFxuICAgICAgICBncm91cDogaXRlbS5ncm91cCgpLFxuICAgICAgICBodG1sOiBpdGVtLmh0bWwsXG4gICAgICAgIHNjcmlwdDogaXRlbS5zY3JpcHQsXG4gICAgICAgIHByb3BlcnRpZXM6IGl0ZW0ucHJvcGVydGllcygpID8/IHt9LFxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgcHJpdmF0ZSBnZXRXb3JrZXJOb2RlKF9rZXk6IHN0cmluZyk6IFdvcmtlck5vZGUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kbm9kZXM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5jaGVja0tleShfa2V5KSk/LlswXTtcbiAgfVxuICBwcml2YXRlIGFzeW5jIGV4Y3V0ZU5vZGUoJGlkOiBhbnkpIHtcbiAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQoJGlkKTtcbiAgICBhd2FpdCB0aGlzLmV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlKTtcbiAgfVxuICBkZWxheSh0aW1lOiBudW1iZXIgPSAxMDApIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWUpKTtcbiAgfVxuICBwcml2YXRlIGFzeW5jIGV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5mbGdTdG9wcGluZykge1xuICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX3N0b3BwaW5nJywge30pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmRlbGF5KHRoaXMuZGVsYXlfdGltZSk7XG4gICAgaWYgKGRhdGFOb2RlKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCdub2RlX3N0YXJ0JywgeyBub2RlOiBkYXRhTm9kZSB9KTtcbiAgICAgIGNvbnN0IHdvcmtlck5vZGUgPSB0aGlzLmdldFdvcmtlck5vZGUoZGF0YU5vZGUua2V5KTtcbiAgICAgIGF3YWl0IHdvcmtlck5vZGU/LmV4ZWN1dGUoZGF0YU5vZGUuaWQsIGRhdGFOb2RlLCB0aGlzLCB0aGlzLmV4Y3V0ZU5vZGUuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKCdub2RlX2VuZCcsIHsgbm9kZTogZGF0YU5vZGUgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBhc3luYyBleGN1dGVBc3luYygpIHtcbiAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5S2V5KGAke05vZGVCZWdpbn1gKTtcbiAgICBhd2FpdCB0aGlzLmV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlKTtcbiAgfVxuICBwdWJsaWMgZXhjdXRlKCkge1xuICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX3N0YXJ0Jywge30pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgICAgICBhd2FpdCB0aGlzLmV4Y3V0ZUFzeW5jKCk7XG4gICAgICAgIHRoaXMuZmxnU3RvcHBpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX2VuZCcsIHt9KTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV4KTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX2VuZCcsIHt9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmxnU3RvcHBpbmcgPSBmYWxzZTtcbiAgICB9KTtcbiAgfVxuICBmbGdTdG9wcGluZzogYW55ID0gbnVsbDtcbiAgcHVibGljIHN0b3AoKSB7XG4gICAgdGhpcy5mbGdTdG9wcGluZyA9IHRydWU7XG4gIH1cbiAgcHVibGljIHNldFZhcmlhYmxlT2JqZWN0KG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgbm9kZUlkOiBhbnksIHByb2plY3Q6IGFueSA9IG51bGwpIHtcbiAgICBsZXQgdHJlZVNjb3BlID0gW25vZGVJZF07XG4gICAgd2hpbGUgKG5vZGVJZCAhPSAncm9vdCcpIHtcbiAgICAgIGxldCBub2RlID0gdGhpcy5nZXROb2RlQnlJZChub2RlSWQpO1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgbm9kZUlkID0gbm9kZS5ncm91cFxuICAgICAgICB0cmVlU2NvcGUgPSBbLi4udHJlZVNjb3BlLCBub2RlSWRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZUlkID0gJ3Jvb3QnXG4gICAgICAgIHRyZWVTY29wZSA9IFsuLi50cmVlU2NvcGUsIG5vZGVJZF07XG4gICAgICB9XG4gICAgfVxuICAgIGxldCAkdmFyaWFibGUgPSB0aGlzLnZhcmlhYmxlVmFsdWVbcHJvamVjdCA/PyB0aGlzLiRwcm9qZWN0XTtcbiAgICBjb25zdCB0cmVlTGVuZ2h0ID0gdHJlZVNjb3BlLmxlbmd0aCAtIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gdHJlZUxlbmdodDsgaSsrKSB7XG4gICAgICBsZXQgaXRlbSA9ICR2YXJpYWJsZS5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5zY29wZSA9PT0gdHJlZVNjb3BlW2ldICYmIGl0ZW0ubmFtZSA9PSBuYW1lKT8uWzBdO1xuICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgaXRlbS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRWYXJpYWJsZU9iamVjdChub2RlSWQ6IGFueSwgcHJvamVjdDogYW55ID0gbnVsbCkge1xuICAgIGNvbnN0IHZhcmlhYmxlT2JqOiBhbnkgPSB7fTtcbiAgICBsZXQgdHJlZVNjb3BlID0gW25vZGVJZF07XG4gICAgd2hpbGUgKG5vZGVJZCAhPSAncm9vdCcpIHtcbiAgICAgIGxldCBub2RlID0gdGhpcy5nZXROb2RlQnlJZChub2RlSWQpO1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgbm9kZUlkID0gbm9kZS5ncm91cFxuICAgICAgICB0cmVlU2NvcGUgPSBbLi4udHJlZVNjb3BlLCBub2RlSWRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZUlkID0gJ3Jvb3QnXG4gICAgICAgIHRyZWVTY29wZSA9IFsuLi50cmVlU2NvcGUsIG5vZGVJZF07XG4gICAgICB9XG4gICAgfVxuICAgIGxldCAkdmFyaWFibGUgPSB0aGlzLnZhcmlhYmxlVmFsdWVbcHJvamVjdCA/PyB0aGlzLiRwcm9qZWN0XTtcbiAgICBjb25zdCB0cmVlTGVuZ2h0ID0gdHJlZVNjb3BlLmxlbmd0aCAtIDE7XG4gICAgZm9yIChsZXQgaSA9IHRyZWVMZW5naHQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAkdmFyaWFibGUuZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0uc2NvcGUgPT09IHRyZWVTY29wZVtpXSk/LmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICB2YXJpYWJsZU9ialtpdGVtLm5hbWVdID0gaXRlbS52YWx1ZTtcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiB2YXJpYWJsZU9iajtcbiAgfVxuICBwdWJsaWMgcnVuQ29kZSgkc2NycGl0OiBhbnksIG5vZGVJZDogYW55KTogYW55IHtcbiAgICBjb25zdCB2YXJpYWJsZU9iaiA9IHRoaXMuZ2V0VmFyaWFibGVPYmplY3Qobm9kZUlkKTtcbiAgICByZXR1cm4gdGhpcy5zY3JpcHRDb2RlLnJ1bkNvZGUoJHNjcnBpdCwgdmFyaWFibGVPYmopO1xuICB9XG4gIHB1YmxpYyBnZXRUZXh0KCRzY3JwaXQ6IGFueSwgbm9kZUlkOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IHZhcmlhYmxlT2JqID0gdGhpcy5nZXRWYXJpYWJsZU9iamVjdChub2RlSWQpO1xuICAgIHJldHVybiB0aGlzLnNjcmlwdENvZGUuZ2V0VGV4dCgkc2NycGl0LCB2YXJpYWJsZU9iaik7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCB3b3JrZXJNYW5hZ2VyID0gbmV3IFdvcmtlck1hbmFnZXIoKTtcbiIsImltcG9ydCB7IENvcmVTZXR1cCB9IGZyb20gJy4vbm9kZXMvaW5kZXgnO1xuaW1wb3J0IHsgd29ya2VyTWFuYWdlciwgV29ya2VyTWFuYWdlciB9IGZyb20gJy4vd29ya2VyL2luZGV4Jztcblxud29ya2VyTWFuYWdlci5uZXdTZXR1cChDb3JlU2V0dXApO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIENvcmVTZXR1cCxcbiAgV29ya2VyTWFuYWdlcixcbiAgd29ya2VyTWFuYWdlclxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O01BRWEsV0FBVyxDQUFBO0lBQ3RCLEtBQUssR0FBQTtBQUNILFFBQUEsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELFFBQVEsR0FBQTtBQUNOLFFBQUEsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO0tBQ2hEO0FBQ0Y7O0FDUEQsSUFBWSxPQVFYLENBQUE7QUFSRCxDQUFBLFVBQVksT0FBTyxFQUFBO0FBQ2pCLElBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxLQUFPLENBQUE7QUFDUCxJQUFBLE9BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsS0FBTyxDQUFBO0FBQ1AsSUFBQSxPQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLElBQU0sQ0FBQTtBQUNOLElBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxPQUFTLENBQUE7QUFDVCxJQUFBLE9BQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsUUFBVSxDQUFBO0FBQ1YsSUFBQSxPQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLEtBQU8sQ0FBQTtBQUNQLElBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxTQUFXLENBQUE7QUFDYixDQUFDLEVBUlcsT0FBTyxLQUFQLE9BQU8sR0FRbEIsRUFBQSxDQUFBLENBQUEsQ0FBQTtNQWdCWSxVQUFV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TUFBTSxDQUFDLENBQUMsSUFBUyxLQUFLLElBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDLENBQUM7S0FDOUU7QUFDTSxJQUFBLFdBQVcsQ0FBQyxHQUFRLEVBQUE7UUFDekIsT0FBTyxJQUFJLENBQUMsY0FBYyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBUyxLQUFLLElBQUksQ0FBQyxFQUFFLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDMUU7QUFFTSxJQUFBLFlBQVksQ0FBQyxJQUFTLEVBQUE7UUFDM0IsT0FBTyxJQUFJLENBQUMsY0FBYyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBUyxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDNUU7QUFDTSxJQUFBLFFBQVEsQ0FBQyxJQUFTLEVBQUE7QUFDdkIsUUFBQSxJQUFJLENBQUMsSUFBSTtBQUFFLFlBQUEsT0FBTyxJQUFJLENBQUM7QUFDdkIsUUFBQSxJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQTtBQUN2QixRQUFBLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQzVCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixTQUFBO0FBQU0sYUFBQTtBQUNMLFlBQUEsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDbkIsU0FBQTtRQUNELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssWUFBWSxDQUFDLFFBQVEsRUFBRTtZQUM1QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBQ3BDLFNBQUE7QUFDRCxRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQ2xCLFlBQUEsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBRSxF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
