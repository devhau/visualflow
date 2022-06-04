
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow_core.js v0.0.1-hotfix
   * Released under the MIT license.
   */

var visualflow_core = (function () {
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

    return index;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy1jb3JlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvd29ya2VyL3NldHVwLnRzIiwiLi4vc3JjL3dvcmtlci9ub2RlLnRzIiwiLi4vc3JjL25vZGVzL2FsZXJ0LnRzIiwiLi4vc3JjL25vZGVzL2Fzc2lnbi50cyIsIi4uL3NyYy9ub2Rlcy9iZWdpbi50cyIsIi4uL3NyYy9ub2Rlcy9jb25zb2xlLnRzIiwiLi4vc3JjL25vZGVzL2RlbGF5LnRzIiwiLi4vc3JjL25vZGVzL2VuZC50cyIsIi4uL3NyYy9ub2Rlcy9mb3IudHMiLCIuLi9zcmMvbm9kZXMvZm9yLWVhY2gudHMiLCIuLi9zcmMvbm9kZXMvZ3JvdXAudHMiLCIuLi9zcmMvbm9kZXMvaWYudHMiLCIuLi9zcmMvbm9kZXMvcHJvamVjdC50cyIsIi4uL3NyYy9ub2Rlcy9wcm9tcHQudHMiLCIuLi9zcmMvbm9kZXMvc3dpdGNoLnRzIiwiLi4vc3JjL25vZGVzL3doaWxlLnRzIiwiLi4vc3JjL25vZGVzL2luZGV4LnRzIiwiLi4vc3JjL3dvcmtlci9zY3JpcHQudHMiLCIuLi9zcmMvd29ya2VyL21hbmFnZXIudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlclNldHVwIHtcbiAgbm9kZXMoKTogYW55W10ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBuZXdOb2RlcygpOiBXb3JrZXJOb2RlW10ge1xuICAgIHJldHVybiB0aGlzLm5vZGVzKCkubWFwKChpdGVtKSA9PiAobmV3IGl0ZW0oKSkpXG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyXCI7XG5cbmV4cG9ydCBlbnVtIEVudk5vZGUge1xuICBBbGwgPSAwLFxuICBXZWIgPSAxLFxuICBQQyA9IDIsXG4gIENsb3VkID0gMyxcbiAgTW9iaWxlID0gNCxcbiAgSU9TID0gNSxcbiAgQW5kcm9pZCA9IDZcbn1cbmV4cG9ydCB0eXBlIE9wdGlvbk5vZGUgPSB2b2lkICYge1xuICBrZXk6IFwiXCIsXG4gIG5hbWU6IFwiXCIsXG4gIGdyb3VwOiBcIlwiLFxuICBodG1sOiBcIlwiLFxuICBzY3JpcHQ6IFwiXCIsXG4gIHByb3BlcnRpZXM6IFwiXCIsXG4gIG9ubHlOb2RlOiBib29sZWFuLFxuICBkb3Q6IHtcbiAgICBsZWZ0OiAxLFxuICAgIHRvcDogMCxcbiAgICByaWdodDogMSxcbiAgICBib3R0b206IDAsXG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBXb3JrZXJOb2RlIHtcbiAgZW52KCk6IGFueVtdIHtcbiAgICByZXR1cm4gW0Vudk5vZGUuQWxsLCBFbnZOb2RlLkNsb3VkLCBFbnZOb2RlLlBDLCBFbnZOb2RlLldlYiwgRW52Tm9kZS5Nb2JpbGUsIEVudk5vZGUuSU9TLCBFbnZOb2RlLkFuZHJvaWRdO1xuICB9XG4gIHB1YmxpYyBDaGVja0VudihlbnY6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmVudigpLmluY2x1ZGVzKGVudik7XG4gIH1cbiAga2V5KCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBwdWJsaWMgY2hlY2tLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5rZXkoKSA9PSBrZXk7XG4gIH1cbiAgbmFtZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lOyB9XG4gIGljb24oKTogYW55IHsgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1wbGF5XCI+PC9pPic7IH1cbiAgZ3JvdXAoKTogYW55IHtcbiAgICByZXR1cm4gXCJDb21tb25cIjtcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkge1xuICAgIHJldHVybiBgYDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSB7IH1cbiAgcHJvcGVydGllcygpOiBhbnkgeyB9XG4gIG9wdGlvbigpOiBhbnkgeyB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgbmV4dE5vZGUoZGF0YTogYW55LCBuZXh0OiBhbnksIG5vZGVJZDogYW55LCBpbmRleDogYW55ID0gbnVsbCkge1xuICAgIGlmIChkYXRhPy5saW5lcykge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBkYXRhLmxpbmVzKSB7XG4gICAgICAgIGlmIChpdGVtLmZyb20gPT0gbm9kZUlkICYmIChpbmRleCA9PSBudWxsIHx8IGl0ZW0uZnJvbUluZGV4ID09IGluZGV4KSkge1xuICAgICAgICAgIHJldHVybiBhd2FpdCBuZXh0KGl0ZW0udG8pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhd2FpdCBuZXh0KHVuZGVmaW5lZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVBbGVydE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9hbGVydFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQWxlcnRcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtYmVsbFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwcjEwIHBsMTAgcGI0XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJtZXNzYWdlXCIvPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIGtleTogXCJtZXNzYWdlXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBhbGVydChtYW5hZ2VyLmdldFRleHQoZGF0YT8ubWVzc2FnZSwgbm9kZUlkKSk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQXNzaWduTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2Fzc2lnblwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQXNzaWduXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJvbHRcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVudl9uYW1lOiB7XG4gICAgICAgIGtleTogXCJlbnZfbmFtZVwiLFxuICAgICAgICB0ZXh0OiAnbmFtZScsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHZhcjogdHJ1ZSxcbiAgICAgICAgdmFsaWRhdGU6ICdeKFthLXpBLVowLTlcXHUwNjAwLVxcdTA2RkZcXHUwNjYwLVxcdTA2NjlcXHUwNkYwLVxcdTA2RjldKykkJyxcbiAgICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgfSxcbiAgICAgIGVudl92YWx1ZToge1xuICAgICAgICBrZXk6IFwiZW52X3ZhbHVlXCIsXG4gICAgICAgIHRleHQ6ICd2YWx1ZScsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH0sXG5cbiAgICAgIGVudl9zY29ycDoge1xuICAgICAgICBrZXk6IFwiZW52X3Njb3JwXCIsXG4gICAgICAgIHRleHQ6ICdzY29ycCcsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHNlbGVjdDogdHJ1ZSxcbiAgICAgICAgc2VsZWN0Tm9uZTogJ1NlbGVjdCBzY29ycCcsXG4gICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICBkYXRhU2VsZWN0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG1haW4uZ2V0R3JvdXBDdXJyZW50KCkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBpdGVtLmlkLFxuICAgICAgICAgICAgICB0ZXh0OiBpdGVtLnRleHRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgb3B0aW9uKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzOiAnJyxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj5cbiAgICA8ZGl2IGNsYXNzPVwicGwxMCBwcjAgcHQxIHBiN1wiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiZW52X25hbWVcIi8+IDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJmbGV4LW5vbmUgcHI2IHB0NiBwYjcgdGV4dC1jZW50ZXJcIj49PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInByMTAgcGwwIHB0MSBwYjdcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImVudl92YWx1ZVwiLz48L2Rpdj5cbiAgICA8ZGl2PjwvZGl2PlxuICAgIDwvZGl2PmA7XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBtYW5hZ2VyLnNldFZhcmlhYmxlT2JqZWN0KGRhdGEuZW52X25hbWUsIG1hbmFnZXIucnVuQ29kZShkYXRhLmVudl92YWx1ZSwgbm9kZUlkKSwgZGF0YS5lbnZfc2NvcnAgPz8gbm9kZUlkKVxuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuZXhwb3J0IGNvbnN0IE5vZGVCZWdpbiA9IFwiY29yZV9iZWdpblwiO1xuZXhwb3J0IGNsYXNzIENvcmVCZWdpbk5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcblxuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gTm9kZUJlZ2luO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQmVnaW5cIjtcbiAgfVxuICBvcHRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9ubHlOb2RlOiB0cnVlLFxuICAgICAgc29ydDogMCxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUNvbnNvbGVOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfY29uc29sZVwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQ29uc29sZVwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS10ZXJtaW5hbFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwcjEwIHBsMTAgcGI0XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJtZXNzYWdlXCIvPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIGtleTogXCJtZXNzYWdlXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zb2xlLmxvZyhtYW5hZ2VyLmdldFRleHQoZGF0YT8ubWVzc2FnZSxub2RlSWQpKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVEZWxheU5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9kZWxheVwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiRGVsYXlcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtc3RvcHdhdGNoXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInByMTAgcGwxMCBwYjQgZGlzcGxheS1mbGV4XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJudW1iZXJfZGVsYXlcIi8+PHNwYW4gY2xhc3M9XCJwNFwiPm1zPC9zcGFuPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBudW1iZXJfZGVsYXk6IHtcbiAgICAgICAga2V5OiBcIm51bWJlcl9kZWxheVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxMDAwXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYXdhaXQgbWFuYWdlci5kZWxheShtYW5hZ2VyLnJ1bkNvZGUoZGF0YT8ubnVtYmVyX2RlbGF5LG5vZGVJZCkpO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUVuZE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9lbmRcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkVuZFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3BcIj48L2k+JztcbiAgfVxuICBvcHRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9ubHlOb2RlOiB0cnVlLFxuICAgICAgc29ydDogMCxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlRm9yTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2ZvclwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiRm9yXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWNpcmNsZS1ub3RjaFwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgbnVtYmVyX3N0YXJ0OiB7XG4gICAgICAgIGtleTogXCJudW1iZXJfc3RhcnRcIixcbiAgICAgICAgdGV4dDogJ3N0YXJ0JyxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIG51bWJlcl9lbmQ6IHtcbiAgICAgICAga2V5OiBcIm51bWJlcl9lbmRcIixcbiAgICAgICAgdGV4dDogJ2VuZCcsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDEwXG4gICAgICB9LFxuICAgICAgbnVtYmVyX3N0ZXA6IHtcbiAgICAgICAga2V5OiBcIm51bWJlcl9zdGVwXCIsXG4gICAgICAgIHRleHQ6ICdzdGVwJyxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIGVudl9uYW1lOiB7XG4gICAgICAgIGtleTogXCJlbnZfbmFtZVwiLFxuICAgICAgICB0ZXh0OiAnbmFtZScsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6ICdsb29wX2luZGV4J1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxkaXYgY2xhc3M9XCJkaXNwbGF5LWZsZXhcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImZsZXgtbm9uZSBwbDEwIHByMCBwdDQgcGIyIHRleHQtY2VudGVyXCIgPkZvcjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicGwyIHByMCBwdDIgcGIyXCIgPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibnVtYmVyX3N0YXJ0XCIgLz4gPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LW5vbmUgcGwyIHByMCBwdDQgcGIyIHRleHQtY2VudGVyXCIgPlRvIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicHIyIHBsMCBwdDIgcGIyXCIgPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibnVtYmVyX2VuZFwiIC8+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LW5vbmUgcGwyIHByMCBwdDQyIHBiMiB0ZXh0LWNlbnRlclwiID5TdGVwPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwcjEwIHBsMCBwdDIgcGIyXCIgPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibnVtYmVyX3N0ZXBcIiAvPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bkdvR3JvdXBsXCI+R28gdG8gQ29udGVudDwvYnV0dG9uPlxuICAgICAgPC9kaXY+YDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5wYXJlbnQub3Blbkdyb3VwKG5vZGUuR2V0SWQoKSk7XG4gICAgfSlcbiAgICBtYWluLnRlbXBWYXJpYWJsZSgnZW52X25hbWUnLG5vZGUuZ2V0RGF0YVZhbHVlKCdlbnZfbmFtZScpLG5vZGUuR2V0SWQoKSk7XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBncm91cCA9IG1hbmFnZXIuZ2V0R3JvdXBDdXJyZW50KCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChkYXRhLmlkKTtcbiAgICBjb25zdCBudW1iZXJfc3RhcnQgPSArbWFuYWdlci5nZXRUZXh0KGRhdGEubnVtYmVyX3N0YXJ0LCBub2RlSWQpO1xuICAgIGNvbnN0IG51bWJlcl9lbmQgPSArbWFuYWdlci5nZXRUZXh0KGRhdGEubnVtYmVyX2VuZCwgbm9kZUlkKTtcbiAgICBjb25zdCBudW1iZXJfc3RlcCA9ICttYW5hZ2VyLmdldFRleHQoZGF0YS5udW1iZXJfc3RlcCwgbm9kZUlkKTtcblxuICAgIGZvciAobGV0IGxvb3BfaW5kZXggPSBudW1iZXJfc3RhcnQ7IGxvb3BfaW5kZXggPD0gbnVtYmVyX2VuZCAmJiAhbWFuYWdlci5mbGdTdG9wcGluZzsgbG9vcF9pbmRleCA9IGxvb3BfaW5kZXggKyBudW1iZXJfc3RlcCkge1xuICAgICAgbWFuYWdlci5zZXRWYXJpYWJsZU9iamVjdChkYXRhLmVudl9uYW1lLCBsb29wX2luZGV4LCBub2RlSWQpO1xuICAgICAgYXdhaXQgbWFuYWdlci5leGN1dGVBc3luYygpO1xuICAgIH1cbiAgICBtYW5hZ2VyLnNldEdyb3VwKGdyb3VwKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVGb3JFYWNoTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2ZvckVhY2hcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkZvciBFYWNoXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWNpcmNsZS1ub3RjaFwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgZW52X2l0ZW1zOiB7XG4gICAgICAgIGtleTogXCJlbnZfaXRlbXNcIixcbiAgICAgICAgdGV4dDogJ2l0ZW1zJyxcbiAgICAgICAgdmFyOiB0cnVlLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfSxcbiAgICAgIGVudl9pdGVtOiB7XG4gICAgICAgIGtleTogXCJlbnZfaXRlbVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAnaXRlbSdcbiAgICAgIH0sXG4gICAgICBlbnZfbmFtZToge1xuICAgICAgICBrZXk6IFwiZW52X25hbWVcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJ2xvb3BfaW5kZXgnXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYFxuICAgICAgPGRpdiBjbGFzcz1cImRpc3BsYXktZmxleFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1ub25lIHBsMTAgcHIwIHB0NCBwYjIgdGV4dC1jZW50ZXJcIiA+Rm9yRWFjaDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicHIxMCBwbDAgcHQyIHBiMlwiID48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImVudl9pdGVtXCIgLz48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBsMiBwcjAgcHQyIHBiMlwiID48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImVudl9pdGVtc1wiIC8+IDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bkdvR3JvdXBsXCI+R28gdG8gQ29udGVudDwvYnV0dG9uPlxuICAgICAgPC9kaXY+YDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5wYXJlbnQub3Blbkdyb3VwKG5vZGUuR2V0SWQoKSk7XG4gICAgfSlcbiAgICBtYWluLnRlbXBWYXJpYWJsZSgnZW52X25hbWUnLCBub2RlLmdldERhdGFWYWx1ZSgnZW52X25hbWUnKSwgbm9kZS5HZXRJZCgpKTtcbiAgICBtYWluLnRlbXBWYXJpYWJsZSgnZW52X2l0ZW0nLCBub2RlLmdldERhdGFWYWx1ZSgnZW52X2l0ZW0nKSwgbm9kZS5HZXRJZCgpKTtcblxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZGF0YS5pZCk7XG4gICAgbGV0IGVudl9pdGVtcyA9IGRhdGEuZW52X2l0ZW1zO1xuICAgIGlmIChlbnZfaXRlbXMpIHtcbiAgICAgIGxldCBsb29wX2luZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgZW52X2l0ZW1zKSB7XG4gICAgICAgIG1hbmFnZXIuc2V0VmFyaWFibGVPYmplY3QoZGF0YS5lbnZfbmFtZSwgbG9vcF9pbmRleCwgbm9kZUlkKTtcbiAgICAgICAgbWFuYWdlci5zZXRWYXJpYWJsZU9iamVjdChkYXRhLmVudl9pdGVtLCBpdGVtLCBub2RlSWQpO1xuICAgICAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgICAgIGxvb3BfaW5kZXgrKztcbiAgICAgIH1cblxuICAgIH1cblxuXG4gICAgbWFuYWdlci5zZXRHcm91cChncm91cCk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlR3JvdXBOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZ3JvdXBcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkdyb3VwXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFyIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwXCI+R28gdG8gR3JvdXA8L2J1dHRvbj48L2Rpdj4nO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLnBhcmVudC5vcGVuR3JvdXAobm9kZS5HZXRJZCgpKTtcbiAgICB9KVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZGF0YS5pZCk7XG4gICAgYXdhaXQgbWFuYWdlci5leGN1dGVBc3luYygpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUlmTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2lmXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJJZlwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWVxdWFsc1wiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgaGlkZTogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIGNvbmQ6IHtcbiAgICAgICAga2V5OiBcImNvbmRcIixcbiAgICAgICAgaGlkZTogdHJ1ZSxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc3ViOiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9wdGlvbigpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjbGFzczogJycsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uID0gbm9kZS5nZXREYXRhVmFsdWUoJ2NvbmRpdGlvbicpO1xuICAgIGxldCBodG1sID0gJyc7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmRpdGlvbjsgaW5kZXgrKykge1xuICAgICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJwbDEyIHByMSBwdDIgcGIyXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJjb25kJHs1MDAwMSArIGluZGV4fVwiLz48L2Rpdj5cbiAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIgY2xhc3M9XCJwbDEgcHIxMiBwdDEwIHBiMTBcIj5UaGVuPC9kaXY+XG4gICAgICA8ZGl2PjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiJHs1MDAwMSArIGluZGV4fVwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDwvZGl2PmA7XG4gICAgfVxuICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBjbGFzcz1cInBsMTAgcHIxIHB0MTAgcGIxMFwiPjxidXR0b24gY2xhc3M9XCJidG5BZGRDb25kaXRpb25cIj4rPC9idXR0b24+IDxidXR0b24gY2xhc3M9XCJidG5FeGNlcHRDb25kaXRpb25cIj4tPC9idXR0b24+PC9kaXY+XG4gICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIiBjbGFzcz1cInBsMSBwcjEyIHB0MTAgcGIxMFwiPkVsc2U8L2Rpdj5cbiAgICA8ZGl2PjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDBcIj48L3NwYW4+PC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5BZGRDb25kaXRpb24nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLkluY3JlYXNlVmFsdWUoJ2NvbmRpdGlvbicpO1xuICAgIH0pXG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5FeGNlcHRDb25kaXRpb24nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLkRlY3JlYXNlVmFsdWUoJ2NvbmRpdGlvbicsMSk7XG4gICAgfSlcbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuXG4gICAgY29uc3QgY29uZGl0aW9uID0gZGF0YS5jb25kaXRpb247XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmRpdGlvbiAmJiAhbWFuYWdlci5mbGdTdG9wcGluZzsgaW5kZXgrKykge1xuICAgICAgbGV0IG5vZGUgPSA1MDAwMSArIGluZGV4O1xuICAgICAgY29uc3QgY29uZGl0aW9uX25vZGUgPSBkYXRhW2Bjb25kJHtub2RlfWBdO1xuICAgICAgaWYgKG1hbmFnZXIucnVuQ29kZShjb25kaXRpb25fbm9kZSwgbm9kZUlkKSA9PSB0cnVlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkLCBub2RlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCwgNTAwMDApO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlUHJvamVjdE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9wcm9qZWN0XCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJQcm9qZWN0XCI7XG4gIH1cbiAgaWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtcHJvamVjdC1kaWFncmFtXCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBwcm9qZWN0OiB7XG4gICAgICAgIGtleTogXCJwcm9qZWN0XCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHNlbGVjdDogdHJ1ZSxcbiAgICAgICAgc2VsZWN0Tm9uZTogJ1NlbGVjdCBwcm9qZWN0JyxcbiAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgIGRhdGFTZWxlY3Q6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgICAgICByZXR1cm4gbWFpbi5nZXRQcm9qZWN0QWxsKCkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBpdGVtLkdldCgnaWQnKSxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS5HZXQoJ25hbWUnKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcGwxMiBwcjAgcHQyIHBiMlwiPjxzZWxlY3QgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJwcm9qZWN0XCI+PC9zZWxlY3Q+PC9kaXY+JztcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG5cbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IHByb2plY3QgPSBtYW5hZ2VyLmdldFByb2plY3RDdXJyZW50KCk7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0UHJvamVjdChkYXRhLnByb2plY3QpO1xuICAgIGF3YWl0IG1hbmFnZXIuZXhjdXRlQXN5bmMoKTtcbiAgICBtYW5hZ2VyLnNldFByb2plY3QocHJvamVjdCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChncm91cCk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlcHJvbXB0Tm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX3Byb21wdFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiUHJvbXB0XCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJvbHRcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVudl9uYW1lOiB7XG4gICAgICAgIGtleTogXCJlbnZfbmFtZVwiLFxuICAgICAgICB0ZXh0OiAnbmFtZScsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHZhcjogdHJ1ZSxcbiAgICAgICAgdmFsaWRhdGU6ICdeKFthLXpBLVowLTlcXHUwNjAwLVxcdTA2RkZcXHUwNjYwLVxcdTA2NjlcXHUwNkYwLVxcdTA2RjldKykkJyxcbiAgICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgfSxcbiAgICAgIGVudl9tZXNzYWdlOiB7XG4gICAgICAgIGtleTogXCJlbnZfbWVzc2FnZVwiLFxuICAgICAgICB0ZXh0OiAnbWVzc2FnZScsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH0sXG5cbiAgICAgIGVudl9zY29ycDoge1xuICAgICAgICBrZXk6IFwiZW52X3Njb3JwXCIsXG4gICAgICAgIHRleHQ6ICdzY29ycCcsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHNlbGVjdDogdHJ1ZSxcbiAgICAgICAgc2VsZWN0Tm9uZTogJ1NlbGVjdCBzY29ycCcsXG4gICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICBkYXRhU2VsZWN0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG1haW4uZ2V0R3JvdXBDdXJyZW50KCkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBpdGVtLmlkLFxuICAgICAgICAgICAgICB0ZXh0OiBpdGVtLnRleHRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgb3B0aW9uKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzOiAnJyxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj5cbiAgICA8ZGl2IGNsYXNzPVwicHIxMCBwbDEwIHB0MSBwYjdcIj48dGV4dGFyZWEgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImVudl9tZXNzYWdlXCI+PC90ZXh0YXJlYT48L2Rpdj5cbiAgICA8ZGl2PjwvZGl2PlxuICAgIDwvZGl2PmA7XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBsZXQgcnMgPSBwcm9tcHQoZGF0YS5lbnZfbWVzc2FnZSlcbiAgICBtYW5hZ2VyLnNldFZhcmlhYmxlT2JqZWN0KGRhdGEuZW52X25hbWUsIHJzLCBkYXRhLmVudl9zY29ycCA/PyBub2RlSWQpXG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlU3dpdGNoTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX3N3aXRjaFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiU3dpdGNoXCI7XG4gIH1cbiAgaWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtcmFuZG9tXCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25kaXRpb246IHtcbiAgICAgICAga2V5OiBcImNvbmRpdGlvblwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBoaWRlOiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgY2FzZToge1xuICAgICAgICBrZXk6IFwiY2FzZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzdWI6IHRydWUsXG4gICAgICAgIGhpZGU6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBjYXNlX2lucHV0OiB7XG4gICAgICAgIGtleTogXCJjYXNlX2lucHV0XCIsXG4gICAgICAgIHRleHQ6ICdTd2l0Y2gnLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfSxcbiAgICB9XG4gIH1cbiAgb3B0aW9uKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzOiAnJyxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSBub2RlLmdldERhdGFWYWx1ZSgnY29uZGl0aW9uJyk7XG4gICAgbGV0IGh0bWwgPSAnJztcbiAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPlxuICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIgY2xhc3M9XCJwbDEwIHByMSBwdDEwIHBiMTBcIj5Td2l0Y2g8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwicGwyIHByMSBwdDIgcGIyXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJjYXNlX2lucHV0XCIvPjwvZGl2PlxuICAgIDxkaXY+PC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZGl0aW9uOyBpbmRleCsrKSB7XG4gICAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPlxuICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIiBjbGFzcz1cInBsMTIgcHIxMCBwdDEwIHBiMTBcIj5DYXNlPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwicGwyIHByMSBwdDIgcGIyXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJjYXNlJHs1MDAwMSArIGluZGV4fVwiLz48L2Rpdj5cbiAgICAgIDxkaXY+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCIkezUwMDAxICsgaW5kZXh9XCI+PC9zcGFuPjwvZGl2PlxuICAgICAgPC9kaXY+YDtcbiAgICB9XG4gICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj5cbiAgICA8ZGl2IGNsYXNzPVwicGwxMiBwcjEgcHQxMCBwYjEwXCI+PGJ1dHRvbiBjbGFzcz1cImJ0bkFkZENvbmRpdGlvblwiPis8L2J1dHRvbj4gPGJ1dHRvbiBjbGFzcz1cImJ0bkV4Y2VwdENvbmRpdGlvblwiPi08L2J1dHRvbj48L2Rpdj5cbiAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiIGNsYXNzPVwicGwyIHByMTAgcHQxMCBwYjEwXCI+RGVmYXVsdDwvZGl2PlxuICAgIDxkaXY+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMFwiPjwvc3Bhbj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICAgIHJldHVybiBodG1sO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkFkZENvbmRpdGlvbicpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUuSW5jcmVhc2VWYWx1ZSgnY29uZGl0aW9uJyk7XG4gICAgfSlcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkV4Y2VwdENvbmRpdGlvbicpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUuRGVjcmVhc2VWYWx1ZSgnY29uZGl0aW9uJywgMSk7XG4gICAgfSlcbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IGNvbmRpdGlvbiA9IGRhdGEuY29uZGl0aW9uO1xuICAgIGNvbnN0IGNhc2VfaW5wdXQgPSBtYW5hZ2VyLmdldFRleHQoZGF0YS5jYXNlX2lucHV0LCBub2RlSWQpO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb24gJiYgIW1hbmFnZXIuZmxnU3RvcHBpbmc7IGluZGV4KyspIHtcbiAgICAgIGxldCBub2RlID0gNTAwMDEgKyBpbmRleDtcbiAgICAgIGNvbnN0IGNvbmRpdGlvbl9ub2RlID0gZGF0YVtgY2FzZSR7bm9kZX1gXTtcbiAgICAgIGlmIChtYW5hZ2VyLmdldFRleHQoY29uZGl0aW9uX25vZGUsIG5vZGVJZCkgPT0gY2FzZV9pbnB1dCkge1xuICAgICAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCwgbm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQsIDUwMDAwKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVdoaWxlTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX3doaWxlXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJXaGlsZVwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1jaXJjbGUtbm90Y2hcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwicGwxMiBwcjEyIHB0MiBwYjJcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNvbmRpdGlvblwiLz48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiID4gPGJ1dHRvbiBjbGFzcz1cImJ0bkdvR3JvdXBcIiA+IEdvIHRvIENvbnRlbnQgPC9idXR0b24+PC9kaXYgPiBgO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgaGlkZTogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUucGFyZW50Lm9wZW5Hcm91cChub2RlLkdldElkKCkpO1xuICAgIH0pXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBncm91cCA9IG1hbmFnZXIuZ2V0R3JvdXBDdXJyZW50KCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChkYXRhLmlkKTtcbiAgICBjb25zdCBjb25kaXRpb24gPSBkYXRhLmNvbmRpdGlvbjtcbiAgICB3aGlsZSAobWFuYWdlci5ydW5Db2RlKGNvbmRpdGlvbiwgbm9kZUlkKSA9PSB0cnVlICYmICFtYW5hZ2VyLmZsZ1N0b3BwaW5nKSB7XG4gICAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgfVxuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyU2V0dXAgfSBmcm9tIFwiLi4vd29ya2VyL3NldHVwXCI7XG5pbXBvcnQgeyBDb3JlQWxlcnROb2RlIH0gZnJvbSBcIi4vYWxlcnRcIjtcbmltcG9ydCB7IENvcmVBc3NpZ25Ob2RlIH0gZnJvbSBcIi4vYXNzaWduXCI7XG5pbXBvcnQgeyBDb3JlQmVnaW5Ob2RlIH0gZnJvbSBcIi4vYmVnaW5cIjtcbmltcG9ydCB7IENvcmVDb25zb2xlTm9kZSB9IGZyb20gXCIuL2NvbnNvbGVcIjtcbmltcG9ydCB7IENvcmVEZWxheU5vZGUgfSBmcm9tIFwiLi9kZWxheVwiO1xuaW1wb3J0IHsgQ29yZUVuZE5vZGUgfSBmcm9tIFwiLi9lbmRcIjtcbmltcG9ydCB7IENvcmVGb3JOb2RlIH0gZnJvbSBcIi4vZm9yXCI7XG5pbXBvcnQgeyBDb3JlRm9yRWFjaE5vZGUgfSBmcm9tIFwiLi9mb3ItZWFjaFwiO1xuaW1wb3J0IHsgQ29yZUdyb3VwTm9kZSB9IGZyb20gXCIuL2dyb3VwXCI7XG5pbXBvcnQgeyBDb3JlSWZOb2RlIH0gZnJvbSBcIi4vaWZcIjtcbmltcG9ydCB7IENvcmVQcm9qZWN0Tm9kZSB9IGZyb20gXCIuL3Byb2plY3RcIjtcbmltcG9ydCB7IENvcmVwcm9tcHROb2RlIH0gZnJvbSBcIi4vcHJvbXB0XCI7XG5pbXBvcnQgeyBDb3JlU3dpdGNoTm9kZSB9IGZyb20gXCIuL3N3aXRjaFwiO1xuaW1wb3J0IHsgQ29yZVdoaWxlTm9kZSB9IGZyb20gXCIuL3doaWxlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlU2V0dXAgZXh0ZW5kcyBXb3JrZXJTZXR1cCB7XG4gIG5vZGVzKCk6IGFueVtdIHtcbiAgICByZXR1cm4gW1xuICAgICAgQ29yZUJlZ2luTm9kZSxcbiAgICAgIENvcmVFbmROb2RlLFxuICAgICAgQ29yZUFzc2lnbk5vZGUsXG4gICAgICBDb3JlRGVsYXlOb2RlLFxuICAgICAgQ29yZUlmTm9kZSxcbiAgICAgIENvcmVTd2l0Y2hOb2RlLFxuICAgICAgQ29yZUZvck5vZGUsXG4gICAgICBDb3JlRm9yRWFjaE5vZGUsXG4gICAgICBDb3JlV2hpbGVOb2RlLFxuICAgICAgQ29yZUFsZXJ0Tm9kZSxcbiAgICAgIENvcmVwcm9tcHROb2RlLFxuICAgICAgQ29yZUNvbnNvbGVOb2RlLFxuICAgICAgQ29yZVByb2plY3ROb2RlLFxuICAgICAgQ29yZUdyb3VwTm9kZSxcbiAgICBdO1xuICB9XG59XG4iLCJleHBvcnQgY2xhc3MgV29ya2VyU2NyaXB0IHtcbiAgcHJpdmF0ZSBydW5Db2RlSW5Ccm93c2VyKHNjcmlwdDogc3RyaW5nLCB2YXJpYWJsZU9iajogYW55KSB7XG4gICAgY29uc3QgcnMgPSB0aGlzLkdldFRleHRJbkJyb3dzZXIoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB3aW5kb3cuZXZhbChycyk7XG4gICAgfSBjYXRjaCB7IH1cbiAgICByZXR1cm4gcnM7XG4gIH1cbiAgcHJpdmF0ZSBHZXRUZXh0SW5Ccm93c2VyKHNjcmlwdDogc3RyaW5nLCB2YXJpYWJsZU9iajogYW55KSB7XG4gICAgbGV0IHBhcmFtVGV4dCA9IFwiXCI7XG4gICAgbGV0IHBhcmFtVmFsdWU6IGFueSA9IFtdO1xuICAgIGlmICghdmFyaWFibGVPYmopIHZhcmlhYmxlT2JqID0ge307XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHZhcmlhYmxlT2JqKSkge1xuICAgICAgaWYgKHBhcmFtVGV4dCAhPSBcIlwiKSB7XG4gICAgICAgIHBhcmFtVGV4dCA9IGAke3BhcmFtVGV4dH0sJHtrZXl9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtVGV4dCA9IGtleTtcbiAgICAgIH1cbiAgICAgIHBhcmFtVmFsdWUgPSBbLi4ucGFyYW1WYWx1ZSwgdmFyaWFibGVPYmpba2V5XV07XG4gICAgfVxuICAgIHJldHVybiB3aW5kb3cuZXZhbCgnKCgnICsgcGFyYW1UZXh0ICsgJyk9PihgJyArIHNjcmlwdCArICdgKSknKSguLi5wYXJhbVZhbHVlKVxuICB9XG4gIHByaXZhdGUgR2V0VGV4dEluTm9kZShzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHByaXZhdGUgcnVuQ29kZUluTm9kZShzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIGNvbnN0IHsgVk0gfSA9IHJlcXVpcmUoJ3ZtMicpO1xuICAgIGNvbnN0IHZtID0gbmV3IFZNKCk7XG4gICAgcmV0dXJuIHZtLnJ1bkluQ29udGV4dChzY3JpcHQsIHZhcmlhYmxlT2JqKTtcbiAgfVxuICBwdWJsaWMgcnVuQ29kZShzY3JpcHQ6IHN0cmluZywgdmFyaWFibGVPYmo6IGFueSkge1xuICAgIGlmICh3aW5kb3cgIT0gdW5kZWZpbmVkICYmIGRvY3VtZW50ICE9IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMucnVuQ29kZUluQnJvd3NlcihzY3JpcHQsIHZhcmlhYmxlT2JqKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucnVuQ29kZUluTm9kZShzY3JpcHQsIHZhcmlhYmxlT2JqKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldFRleHQoc2NyaXB0OiBzdHJpbmcsIHZhcmlhYmxlT2JqOiBhbnkpIHtcbiAgICBpZiAod2luZG93ICE9IHVuZGVmaW5lZCAmJiBkb2N1bWVudCAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLkdldFRleHRJbkJyb3dzZXIoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLkdldFRleHRJbk5vZGUoc2NyaXB0LCB2YXJpYWJsZU9iaik7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlQmVnaW4gfSBmcm9tIFwiLi4vbm9kZXMvYmVnaW5cIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi9ub2RlXCI7XG5pbXBvcnQgeyBXb3JrZXJTY3JpcHQgfSBmcm9tIFwiLi9zY3JpcHRcIjtcbmltcG9ydCB7IFdvcmtlclNldHVwIH0gZnJvbSBcIi4vc2V0dXBcIjtcbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnLFxuICBncm91cENhdmFzOiBcIm1haW5fZ3JvdXBDYXZhc1wiLFxufTtcbmV4cG9ydCBjbGFzcyBXb3JrZXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgc2NyaXB0Q29kZTogV29ya2VyU2NyaXB0ID0gbmV3IFdvcmtlclNjcmlwdCgpO1xuICBwcml2YXRlIHZhcmlhYmxlVmFsdWU6IGFueSA9IHt9O1xuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gICAgdGhpcy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlICRkYXRhOiBhbnk7XG4gIHByaXZhdGUgJG5vZGVzOiBXb3JrZXJOb2RlW10gPSBbXTtcbiAgcHJpdmF0ZSAkcHJvamVjdDogYW55O1xuICBwcml2YXRlICRncm91cDogYW55ID0gXCJyb290XCI7XG4gIHByaXZhdGUgZGVsYXlfdGltZTogbnVtYmVyID0gMTA7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihkYXRhOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5Mb2FkRGF0YShkYXRhKTtcbiAgfVxuICBwdWJsaWMgc2V0UHJvamVjdChwcm9qZWN0OiBhbnkpIHtcbiAgICB0aGlzLiRwcm9qZWN0ID0gcHJvamVjdDtcbiAgICB0aGlzLiRncm91cCA9IFwicm9vdFwiO1xuICAgIGlmICh0aGlzLnZhcmlhYmxlVmFsdWVbdGhpcy4kcHJvamVjdF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHByaiA9IHRoaXMuZ2V0UHJvamVjdEJ5SWQodGhpcy4kcHJvamVjdCk7XG4gICAgICB0aGlzLnZhcmlhYmxlVmFsdWVbdGhpcy4kcHJvamVjdF0gPSBwcmoudmFyaWFibGUubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5pdGVtLFxuICAgICAgICAgIHZhbHVlOiBpdGVtLmluaXRhbFZhbHVlXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdEJ5SWQoaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLiRkYXRhPy5wcm9qZWN0cz8uZmluZCgoaXRlbTogYW55KSA9PiBpdGVtLmlkID09IGlkKTtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdCgpIHtcbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdEJ5SWQodGhpcy4kcHJvamVjdCk7XG4gICAgfVxuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLm1haW4pIHtcbiAgICAgIHJldHVybiB0aGlzLiRkYXRhO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgc2V0R3JvdXAoZ3JvdXA6IGFueSkge1xuICAgIHRoaXMuJGdyb3VwID0gZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldEdyb3VwQ3VycmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4kZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RDdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLiRwcm9qZWN0O1xuICB9XG4gIHB1YmxpYyBnZXROb2RlSW5Hcm91cChncm91cDogYW55ID0gbnVsbCkge1xuICAgIGxldCBfZ3JvdXAgPSBncm91cCA/PyB0aGlzLiRncm91cDtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0KCk/Lm5vZGVzPy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5ncm91cCA9PSBfZ3JvdXApO1xuICB9XG4gIHB1YmxpYyBnZXROb2RlQnlJZChfaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVJbkdyb3VwKCk/LmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLmlkID09IF9pZCk/LlswXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXROb2RlQnlLZXkoX2tleTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZUluR3JvdXAoKT8uZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0ua2V5ID09IF9rZXkpPy5bMF07XG4gIH1cbiAgcHVibGljIExvYWREYXRhKGRhdGE6IGFueSk6IFdvcmtlck1hbmFnZXIge1xuICAgIGlmICghZGF0YSkgcmV0dXJuIHRoaXM7XG4gICAgdGhpcy52YXJpYWJsZVZhbHVlID0ge31cbiAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLiRkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZGF0YSA9IGRhdGE7XG4gICAgfVxuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLnNvbHV0aW9uKSB7XG4gICAgICB0aGlzLiRwcm9qZWN0ID0gdGhpcy4kZGF0YS5wcm9qZWN0O1xuICAgIH1cbiAgICBpZiAoIXRoaXMuJHByb2plY3QpIHtcbiAgICAgIHRoaXMuJHByb2plY3QgPSB0aGlzLiRkYXRhLnByb2plY3RzPy5bMF0/LmlkO1xuICAgIH1cbiAgICB0aGlzLnNldFByb2plY3QodGhpcy4kcHJvamVjdCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwdWJsaWMgbmV3U2V0dXAoc2V0dXA6IGFueSkge1xuICAgIHRoaXMuU2V0dXAobmV3IHNldHVwKCkpO1xuICB9XG4gIHB1YmxpYyBTZXR1cChzZXR1cDogV29ya2VyU2V0dXApIHtcbiAgICB0aGlzLiRub2RlcyA9IFsuLi50aGlzLiRub2RlcywgLi4uc2V0dXAubmV3Tm9kZXMoKV07XG4gIH1cbiAgcHVibGljIGdldENvbnRyb2xOb2RlcygpIHtcbiAgICByZXR1cm4gdGhpcy4kbm9kZXMubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLntcbiAgICAgICAgICBrZXk6IFwiXCIsXG4gICAgICAgICAgbmFtZTogXCJcIixcbiAgICAgICAgICBncm91cDogXCJcIixcbiAgICAgICAgICBodG1sOiBcIlwiLFxuICAgICAgICAgIHNjcmlwdDogXCJcIixcbiAgICAgICAgICBwcm9wZXJ0aWVzOiBcIlwiLFxuICAgICAgICAgIGRvdDoge1xuICAgICAgICAgICAgbGVmdDogMSxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLi4uaXRlbS5vcHRpb24oKSA/PyB7fSxcbiAgICAgICAga2V5OiBpdGVtLmtleSgpLFxuICAgICAgICBuYW1lOiBpdGVtLm5hbWUoKSxcbiAgICAgICAgaWNvbjogaXRlbS5pY29uKCksXG4gICAgICAgIGdyb3VwOiBpdGVtLmdyb3VwKCksXG4gICAgICAgIGh0bWw6IGl0ZW0uaHRtbCxcbiAgICAgICAgc2NyaXB0OiBpdGVtLnNjcmlwdCxcbiAgICAgICAgcHJvcGVydGllczogaXRlbS5wcm9wZXJ0aWVzKCkgPz8ge30sXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBkZWxheSh0aW1lOiBudW1iZXIgPSAxMDApIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWUpKTtcbiAgfVxuICBwcml2YXRlIGdldFdvcmtlck5vZGUoX2tleTogc3RyaW5nKTogV29ya2VyTm9kZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLmNoZWNrS2V5KF9rZXkpKT8uWzBdO1xuICB9XG4gIHByaXZhdGUgYXN5bmMgZXhjdXRlTm9kZSgkaWQ6IGFueSkge1xuICAgIGlmICgkaWQpIHtcbiAgICAgIGNvbnN0IGRhdGFOb2RlID0gdGhpcy5nZXROb2RlQnlJZCgkaWQpO1xuICAgICAgYXdhaXQgdGhpcy5leGN1dGVEYXRhTm9kZShkYXRhTm9kZSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgYXN5bmMgZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGU6IGFueSkge1xuICAgIGlmICh0aGlzLmZsZ1N0b3BwaW5nKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfc3RvcHBpbmcnLCB7fSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuZGVsYXkodGhpcy5kZWxheV90aW1lKTtcbiAgICBpZiAoZGF0YU5vZGUpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goJ25vZGVfc3RhcnQnLCB7IG5vZGU6IGRhdGFOb2RlIH0pO1xuICAgICAgY29uc3Qgd29ya2VyTm9kZSA9IHRoaXMuZ2V0V29ya2VyTm9kZShkYXRhTm9kZS5rZXkpO1xuICAgICAgYXdhaXQgd29ya2VyTm9kZT8uZXhlY3V0ZShkYXRhTm9kZS5pZCwgZGF0YU5vZGUsIHRoaXMsIGFzeW5jIChuZXh0SWQ6IGFueSkgPT4ge1xuICAgICAgICB0aGlzLmNsZWFyVmFyaWFibGVTY29wZShkYXRhTm9kZS5pZCk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goJ25vZGVfZW5kJywgeyBub2RlOiBkYXRhTm9kZSB9KTtcbiAgICAgICAgYXdhaXQgdGhpcy5leGN1dGVOb2RlKG5leHRJZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGFzeW5jIGV4Y3V0ZUFzeW5jKCkge1xuICAgIGNvbnN0IGRhdGFOb2RlID0gdGhpcy5nZXROb2RlQnlLZXkoYCR7Tm9kZUJlZ2lufWApO1xuICAgIGF3YWl0IHRoaXMuZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGUpO1xuICB9XG4gIHB1YmxpYyBleGN1dGUoKSB7XG4gICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfc3RhcnQnLCB7fSk7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmZsZ1N0b3BwaW5nID0gZmFsc2U7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhjdXRlQXN5bmMoKTtcbiAgICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfZW5kJywge30pO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXgpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfZW5kJywge30pO1xuICAgICAgfVxuICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG4gIGZsZ1N0b3BwaW5nOiBhbnkgPSBudWxsO1xuICBwdWJsaWMgc3RvcCgpIHtcbiAgICB0aGlzLmZsZ1N0b3BwaW5nID0gdHJ1ZTtcbiAgfVxuICBwdWJsaWMgY2xlYXJWYXJpYWJsZVNjb3BlKHNjb3BlOiBhbnksIHByb2plY3Q6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmdldFZhcmlhYmxlKHByb2plY3QpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgaWYgKHNjb3BlID09IGl0ZW0uc2NvcGUpXG4gICAgICAgIGl0ZW0udmFsdWUgPSBpdGVtLmluaXRhbFZhbHVlO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBnZXRWYXJpYWJsZShwcm9qZWN0OiBhbnkgPSBudWxsKSB7XG4gICAgcmV0dXJuIHRoaXMudmFyaWFibGVWYWx1ZVtwcm9qZWN0ID8/IHRoaXMuJHByb2plY3RdXG4gIH1cbiAgcHVibGljIHNldFZhcmlhYmxlT2JqZWN0KG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgbm9kZUlkOiBhbnksIHByb2plY3Q6IGFueSA9IG51bGwpIHtcbiAgICBsZXQgdHJlZVNjb3BlID0gW25vZGVJZF07XG4gICAgd2hpbGUgKG5vZGVJZCAhPSAncm9vdCcpIHtcbiAgICAgIGxldCBub2RlID0gdGhpcy5nZXROb2RlQnlJZChub2RlSWQpO1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgbm9kZUlkID0gbm9kZS5ncm91cFxuICAgICAgICB0cmVlU2NvcGUgPSBbLi4udHJlZVNjb3BlLCBub2RlSWRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZUlkID0gJ3Jvb3QnXG4gICAgICAgIHRyZWVTY29wZSA9IFsuLi50cmVlU2NvcGUsIG5vZGVJZF07XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGAke25hbWV9OiR7dmFsdWV9YCk7XG4gICAgbGV0ICR2YXJpYWJsZSA9IHRoaXMuZ2V0VmFyaWFibGUocHJvamVjdCk7XG4gICAgY29uc3QgdHJlZUxlbmdodCA9IHRyZWVTY29wZS5sZW5ndGggLSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHRyZWVMZW5naHQ7IGkrKykge1xuICAgICAgbGV0IGl0ZW0gPSAkdmFyaWFibGUuZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0uc2NvcGUgPT09IHRyZWVTY29wZVtpXSAmJiBpdGVtLm5hbWUgPT0gbmFtZSk/LlswXTtcbiAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgIGl0ZW0udmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgZ2V0VmFyaWFibGVPYmplY3Qobm9kZUlkOiBhbnksIHByb2plY3Q6IGFueSA9IG51bGwpIHtcbiAgICBjb25zdCB2YXJpYWJsZU9iajogYW55ID0ge307XG4gICAgbGV0IHRyZWVTY29wZSA9IFtub2RlSWRdO1xuICAgIHdoaWxlIChub2RlSWQgIT0gJ3Jvb3QnKSB7XG4gICAgICBsZXQgbm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQobm9kZUlkKTtcbiAgICAgIGlmIChub2RlKSB7XG4gICAgICAgIG5vZGVJZCA9IG5vZGUuZ3JvdXBcbiAgICAgICAgdHJlZVNjb3BlID0gWy4uLnRyZWVTY29wZSwgbm9kZUlkXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVJZCA9ICdyb290J1xuICAgICAgICB0cmVlU2NvcGUgPSBbLi4udHJlZVNjb3BlLCBub2RlSWRdO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgJHZhcmlhYmxlID0gdGhpcy5nZXRWYXJpYWJsZShwcm9qZWN0KTtcbiAgICBjb25zdCB0cmVlTGVuZ2h0ID0gdHJlZVNjb3BlLmxlbmd0aCAtIDE7XG4gICAgZm9yIChsZXQgaSA9IHRyZWVMZW5naHQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAkdmFyaWFibGUuZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0uc2NvcGUgPT09IHRyZWVTY29wZVtpXSk/LmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICB2YXJpYWJsZU9ialtpdGVtLm5hbWVdID0gaXRlbS52YWx1ZTtcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiB2YXJpYWJsZU9iajtcbiAgfVxuICBwdWJsaWMgcnVuQ29kZSgkc2NycGl0OiBhbnksIG5vZGVJZDogYW55KTogYW55IHtcbiAgICBjb25zdCB2YXJpYWJsZU9iaiA9IHRoaXMuZ2V0VmFyaWFibGVPYmplY3Qobm9kZUlkKTtcbiAgICByZXR1cm4gdGhpcy5zY3JpcHRDb2RlLnJ1bkNvZGUoJHNjcnBpdCwgdmFyaWFibGVPYmopO1xuICB9XG4gIHB1YmxpYyBnZXRUZXh0KCRzY3JwaXQ6IGFueSwgbm9kZUlkOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IHZhcmlhYmxlT2JqID0gdGhpcy5nZXRWYXJpYWJsZU9iamVjdChub2RlSWQpO1xuICAgIHJldHVybiB0aGlzLnNjcmlwdENvZGUuZ2V0VGV4dCgkc2NycGl0LCB2YXJpYWJsZU9iaik7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCB3b3JrZXJNYW5hZ2VyID0gbmV3IFdvcmtlck1hbmFnZXIoKTtcbiIsImltcG9ydCB7IENvcmVTZXR1cCB9IGZyb20gJy4vbm9kZXMvaW5kZXgnO1xuaW1wb3J0IHsgd29ya2VyTWFuYWdlciwgV29ya2VyTWFuYWdlciB9IGZyb20gJy4vd29ya2VyL2luZGV4Jztcblxud29ya2VyTWFuYWdlci5uZXdTZXR1cChDb3JlU2V0dXApO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIENvcmVTZXR1cCxcbiAgV29ya2VyTWFuYWdlcixcbiAgd29y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
