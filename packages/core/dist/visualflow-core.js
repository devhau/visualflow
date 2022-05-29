
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow_core.js v0.0.1-beta
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
                    default: ""
                }
            };
        }
        async execute(nodeId, data, manager, next) {
            alert(manager.Val(data?.message));
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
            console.log(manager.Val(data?.message));
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
            await manager.delay(manager.Val(data?.number_delay));
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
                    default: 1
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
            for (let loop_index = data.number_start; loop_index < data.number_end && !manager.flgStopping; loop_index = loop_index + data.number_step) {
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
                if (manager.Val(condition_node) == true) {
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
            const case_input = manager.Val(data.case_input);
            for (let index = 0; index < condition && !manager.flgStopping; index++) {
                let node = 50001 + index;
                const condition_node = data[`case${node}`];
                if (manager.Val(condition_node) == case_input) {
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

    const gEval = eval;
    const PropertyEnum = {
        main: "main_project",
        solution: 'main_solution',
        line: 'main_line',
        variable: 'main_variable',
        groupCavas: "main_groupCavas",
    };
    class WorkerManager {
        events = {};
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
        }
        getProject() {
            if (this.$data.key === PropertyEnum.solution) {
                return this.$data?.projects?.find((item) => item.id == this.$project);
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
        Val($scrpit) {
            let rs = $scrpit;
            while ((`${rs}`.indexOf('\${')) >= 0) {
                rs = gEval(rs);
                console.log(rs);
            }
            rs = gEval(`${rs}`);
            console.log($scrpit, rs);
            return rs;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy1jb3JlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvd29ya2VyL3NldHVwLnRzIiwiLi4vc3JjL3dvcmtlci9ub2RlLnRzIiwiLi4vc3JjL25vZGVzL2FsZXJ0LnRzIiwiLi4vc3JjL25vZGVzL2Fzc2lnbi50cyIsIi4uL3NyYy9ub2Rlcy9iZWdpbi50cyIsIi4uL3NyYy9ub2Rlcy9jb25zb2xlLnRzIiwiLi4vc3JjL25vZGVzL2RlbGF5LnRzIiwiLi4vc3JjL25vZGVzL2VuZC50cyIsIi4uL3NyYy9ub2Rlcy9mb3IudHMiLCIuLi9zcmMvbm9kZXMvZ3JvdXAudHMiLCIuLi9zcmMvbm9kZXMvaWYudHMiLCIuLi9zcmMvbm9kZXMvcHJvamVjdC50cyIsIi4uL3NyYy9ub2Rlcy9zd2l0Y2gudHMiLCIuLi9zcmMvbm9kZXMvaW5kZXgudHMiLCIuLi9zcmMvd29ya2VyL21hbmFnZXIudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlclNldHVwIHtcbiAgbm9kZXMoKTogYW55W10ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBuZXdOb2RlcygpOiBXb3JrZXJOb2RlW10ge1xuICAgIHJldHVybiB0aGlzLm5vZGVzKCkubWFwKChpdGVtKSA9PiAobmV3IGl0ZW0oKSkpXG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyXCI7XG5cbmV4cG9ydCBlbnVtIEVudk5vZGUge1xuICBBbGwgPSAwLFxuICBXZWIgPSAxLFxuICBQQyA9IDIsXG4gIENsb3VkID0gMyxcbiAgTW9iaWxlID0gNCxcbiAgSU9TID0gNSxcbiAgQW5kcm9pZCA9IDZcbn1cbmV4cG9ydCB0eXBlIE9wdGlvbk5vZGUgPSB2b2lkICYge1xuICBrZXk6IFwiXCIsXG4gIG5hbWU6IFwiXCIsXG4gIGdyb3VwOiBcIlwiLFxuICBodG1sOiBcIlwiLFxuICBzY3JpcHQ6IFwiXCIsXG4gIHByb3BlcnRpZXM6IFwiXCIsXG4gIG9ubHlOb2RlOiBib29sZWFuLFxuICBkb3Q6IHtcbiAgICBsZWZ0OiAxLFxuICAgIHRvcDogMCxcbiAgICByaWdodDogMSxcbiAgICBib3R0b206IDAsXG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBXb3JrZXJOb2RlIHtcbiAgZW52KCk6IGFueVtdIHtcbiAgICByZXR1cm4gW0Vudk5vZGUuQWxsLCBFbnZOb2RlLkNsb3VkLCBFbnZOb2RlLlBDLCBFbnZOb2RlLldlYiwgRW52Tm9kZS5Nb2JpbGUsIEVudk5vZGUuSU9TLCBFbnZOb2RlLkFuZHJvaWRdO1xuICB9XG4gIHB1YmxpYyBDaGVja0VudihlbnY6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmVudigpLmluY2x1ZGVzKGVudik7XG4gIH1cbiAga2V5KCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBwdWJsaWMgY2hlY2tLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5rZXkoKSA9PSBrZXk7XG4gIH1cbiAgbmFtZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lOyB9XG4gIGljb24oKTogYW55IHsgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1wbGF5XCI+PC9pPic7IH1cbiAgZ3JvdXAoKTogYW55IHtcbiAgICByZXR1cm4gXCJDb21tb25cIjtcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkge1xuICAgIHJldHVybiBgYDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSB7IH1cbiAgcHJvcGVydGllcygpOiBhbnkgeyB9XG4gIG9wdGlvbigpOiBhbnkgeyB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG5cbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgbmV4dE5vZGUoZGF0YTogYW55LCBuZXh0OiBhbnksIG5vZGVJZDogYW55LCBpbmRleDogYW55ID0gbnVsbCkge1xuICAgIGlmIChkYXRhPy5saW5lcykge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBkYXRhLmxpbmVzKSB7XG4gICAgICAgIGlmIChpdGVtLmZyb20gPT0gbm9kZUlkICYmIChpbmRleCA9PSBudWxsIHx8IGl0ZW0uZnJvbUluZGV4ID09IGluZGV4KSkge1xuICAgICAgICAgIGF3YWl0IG5leHQoaXRlbS50byk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVBbGVydE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9hbGVydFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQWxlcnRcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtYmVsbFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwcjEwIHBsMTAgcGI0XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJtZXNzYWdlXCIvPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIGtleTogXCJtZXNzYWdlXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBhbGVydChtYW5hZ2VyLlZhbChkYXRhPy5tZXNzYWdlKSk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQXNzaWduTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2Fzc2lnblwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQXNzaWduXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJvbHRcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVudl9uYW1lOiB7XG4gICAgICAgIGtleTogXCJlbnZfbmFtZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9LFxuICAgICAgZW52X3ZhbHVlOiB7XG4gICAgICAgIGtleTogXCJlbnZfdmFsdWVcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgfVxuICAgIH1cbiAgfVxuICBvcHRpb24oKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY2xhc3M6ICcnLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDEsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPlxuICAgIDxkaXYgY2xhc3M9XCJwbDEwIHByMCBwdDIgcGIyXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJlbnZfbmFtZVwiLz4gPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cImZsZXgtbm9uZSBwMiB0ZXh0LWNlbnRlclwiPj08L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwicHIxMCBwbDAgcHQyIHBiMlwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiZW52X3ZhbHVlXCIvPjwvZGl2PlxuICAgIDxkaXY+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMFwiPjwvc3Bhbj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5leHBvcnQgY29uc3QgTm9kZUJlZ2luID0gXCJjb3JlX2JlZ2luXCI7XG5leHBvcnQgY2xhc3MgQ29yZUJlZ2luTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuXG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBOb2RlQmVnaW47XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJCZWdpblwiO1xuICB9XG4gIG9wdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb25seU5vZGU6IHRydWUsXG4gICAgICBzb3J0OiAwLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDEsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQ29uc29sZU5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9jb25zb2xlXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJDb25zb2xlXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXRlcm1pbmFsXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInByMTAgcGwxMCBwYjRcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm1lc3NhZ2VcIi8+PC9kaXY+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAga2V5OiBcIm1lc3NhZ2VcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgfVxuICAgIH1cbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnNvbGUubG9nKG1hbmFnZXIuVmFsKGRhdGE/Lm1lc3NhZ2UpKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVEZWxheU5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9kZWxheVwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiRGVsYXlcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtc3RvcHdhdGNoXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInByMTAgcGwxMCBwYjQgZGlzcGxheS1mbGV4XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJudW1iZXJfZGVsYXlcIi8+PHNwYW4gY2xhc3M9XCJwNFwiPm1zPC9zcGFuPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBudW1iZXJfZGVsYXk6IHtcbiAgICAgICAga2V5OiBcIm51bWJlcl9kZWxheVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxMDAwXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYXdhaXQgbWFuYWdlci5kZWxheShtYW5hZ2VyLlZhbChkYXRhPy5udW1iZXJfZGVsYXkpKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVFbmROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZW5kXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJFbmRcIjtcbiAgfVxuICBpY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1zdG9wXCI+PC9pPic7XG4gIH1cbiAgb3B0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvbmx5Tm9kZTogdHJ1ZSxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH07XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUZvck5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9mb3JcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkZvclwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1jaXJjbGUtbm90Y2hcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG51bWJlcl9zdGFydDoge1xuICAgICAgICBrZXk6IFwibnVtYmVyX3N0YXJ0XCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBudW1iZXJfZW5kOiB7XG4gICAgICAgIGtleTogXCJudW1iZXJfZW5kXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBudW1iZXJfc3RlcDoge1xuICAgICAgICBrZXk6IFwibnVtYmVyX3N0ZXBcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIGVudl9uYW1lOiB7XG4gICAgICAgIGtleTogXCJlbnZfbmFtZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAnbG9vcF9pbmRleCdcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiBgXG4gICAgICA8ZGl2IGNsYXNzPVwiZGlzcGxheS1mbGV4XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJmbGV4LW5vbmUgcGwxMCBwcjAgcHQ0IHBiMiB0ZXh0LWNlbnRlclwiID5Gb3I8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInBsMiBwcjAgcHQyIHBiMlwiID48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm51bWJlcl9zdGFydFwiIC8+IDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1ub25lIHBsMiBwcjAgcHQ0IHBiMiB0ZXh0LWNlbnRlclwiID5UbyA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInByMiBwbDAgcHQyIHBiMlwiID48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm51bWJlcl9lbmRcIiAvPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZmxleC1ub25lIHBsMiBwcjAgcHQ0MiBwYjIgdGV4dC1jZW50ZXJcIiA+U3RlcDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwicHIxMCBwbDAgcHQyIHBiMlwiID48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm51bWJlcl9zdGVwXCIgLz48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwIG5vZGUtZm9ybS1jb250cm9sXCI+R28gdG8gQ29udGVudDwvYnV0dG9uPlxuICAgICAgPC9kaXY+YDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5wYXJlbnQub3Blbkdyb3VwKG5vZGUuR2V0SWQoKSk7XG4gICAgfSlcbiAgICBjb25zdCB0ZW1wX2Vudl9uYW1lID0gYHRlbXBfJHtub2RlLkdldElkKCl9X2Vudl9uYW1lYDtcbiAgICBjb25zdCB0ZW1wX3ZhbHVlID0gbWFpbi50ZW1wLkdldCh0ZW1wX2Vudl9uYW1lKTtcbiAgICBpZiAoIXRlbXBfdmFsdWUpIHtcbiAgICAgIG1haW4udGVtcC5TZXQodGVtcF9lbnZfbmFtZSwgbm9kZS5kYXRhLkdldCgnZW52X25hbWUnKSk7XG4gICAgICBtYWluLm5ld1ZhcmlhYmxlKG5vZGUuZGF0YS5HZXQoJ2Vudl9uYW1lJyksIG5vZGUuR2V0SWQoKSk7XG4gICAgfSBlbHNlIGlmIChub2RlLmRhdGEuR2V0KCdlbnZfbmFtZScpICE9IHRlbXBfdmFsdWUpIHtcbiAgICAgIG1haW4uY2hhbmdlVmFyaWFibGVOYW1lKHRlbXBfdmFsdWUsIG5vZGUuZGF0YS5HZXQoJ2Vudl9uYW1lJyksIG5vZGUuR2V0SWQoKSk7XG4gICAgICBtYWluLnRlbXAuU2V0KHRlbXBfZW52X25hbWUsIG5vZGUuZGF0YS5HZXQoJ2Vudl9uYW1lJykpO1xuICAgIH1cblxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZGF0YS5pZCk7XG4gICAgZm9yIChsZXQgbG9vcF9pbmRleCA9IGRhdGEubnVtYmVyX3N0YXJ0OyBsb29wX2luZGV4IDwgZGF0YS5udW1iZXJfZW5kICYmICFtYW5hZ2VyLmZsZ1N0b3BwaW5nOyBsb29wX2luZGV4ID0gbG9vcF9pbmRleCArIGRhdGEubnVtYmVyX3N0ZXApIHtcbiAgICAgIGF3YWl0IG1hbmFnZXIuZXhjdXRlQXN5bmMoKTtcbiAgICB9XG4gICAgbWFuYWdlci5zZXRHcm91cChncm91cCk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlR3JvdXBOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZ3JvdXBcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkdyb3VwXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFyIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwIG5vZGUtZm9ybS1jb250cm9sXCI+R28gdG8gR3JvdXA8L2J1dHRvbj48L2Rpdj4nO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLnBhcmVudC5vcGVuR3JvdXAobm9kZS5HZXRJZCgpKTtcbiAgICB9KVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZGF0YS5pZCk7XG4gICAgYXdhaXQgbWFuYWdlci5leGN1dGVBc3luYygpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUlmTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2lmXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJJZlwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWVxdWFsc1wiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIGNvbmQ6IHtcbiAgICAgICAga2V5OiBcImNvbmRcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc3ViOiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9wdGlvbigpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjbGFzczogJycsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uID0gbm9kZS5kYXRhLkdldCgnY29uZGl0aW9uJyk7XG4gICAgbGV0IGh0bWwgPSAnJztcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZGl0aW9uOyBpbmRleCsrKSB7XG4gICAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInBsMTAgcHIxIHB0MiBwYjJcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNvbmQkezUwMDAxICsgaW5kZXh9XCIvPjwvZGl2PlxuICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIiBjbGFzcz1cInBsMSBwcjEwIHB0MiBwYjJcIj5UaGVuPC9kaXY+XG4gICAgICA8ZGl2PjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiJHs1MDAwMSArIGluZGV4fVwiPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDwvZGl2PmA7XG4gICAgfVxuICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBjbGFzcz1cInBsMTAgcHIxIHB0MiBwYjJcIj48YnV0dG9uIGNsYXNzPVwiYnRuQWRkQ29uZGl0aW9uXCI+QWRkPC9idXR0b24+PC9kaXY+XG4gICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIiBjbGFzcz1cInBsMSBwcjEwIHB0MiBwYjJcIj5FbHNlPC9kaXY+XG4gICAgPGRpdj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAwXCI+PC9zcGFuPjwvZGl2PlxuICAgIDwvZGl2PmA7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuQWRkQ29uZGl0aW9uJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5kYXRhLkluY3JlYXNlKCdjb25kaXRpb24nKTtcbiAgICB9KVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG5cbiAgICBjb25zdCBjb25kaXRpb24gPSBkYXRhLmNvbmRpdGlvbjtcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZGl0aW9uJiYgIW1hbmFnZXIuZmxnU3RvcHBpbmc7IGluZGV4KyspIHtcbiAgICAgIGxldCBub2RlID0gNTAwMDEgKyBpbmRleDtcbiAgICAgIGNvbnN0IGNvbmRpdGlvbl9ub2RlID0gZGF0YVtgY29uZCR7bm9kZX1gXTtcbiAgICAgIGlmIChtYW5hZ2VyLlZhbChjb25kaXRpb25fbm9kZSkgPT0gdHJ1ZSkge1xuICAgICAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCwgbm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQsIDUwMDAwKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVByb2plY3ROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfcHJvamVjdFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiUHJvamVjdFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXByb2plY3QtZGlhZ3JhbVwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvamVjdDoge1xuICAgICAgICBrZXk6IFwicHJvamVjdFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIGRhdGFTZWxlY3Q6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgICAgICByZXR1cm4gbWFpbi5nZXRQcm9qZWN0QWxsKCkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBpdGVtLkdldCgnaWQnKSxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS5HZXQoJ25hbWUnKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48c2VsZWN0IGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwicHJvamVjdFwiPjwvc2VsZWN0PjwvZGl2Pic7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gbWFuYWdlci5nZXRQcm9qZWN0Q3VycmVudCgpO1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldFByb2plY3QoZGF0YS5wcm9qZWN0KTtcbiAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgbWFuYWdlci5zZXRQcm9qZWN0KHByb2plY3QpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVN3aXRjaE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9zd2l0Y2hcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIlN3aXRjaFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXJhbmRvbVwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIGNhc2U6IHtcbiAgICAgICAga2V5OiBcImNhc2VcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc3ViOiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgY2FzZV9pbnB1dDoge1xuICAgICAgICBrZXk6IFwiY2FzZV9pbnB1dFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfSxcbiAgICB9XG4gIH1cbiAgb3B0aW9uKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzOiAnJyxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb24gPSBub2RlLmRhdGEuR2V0KCdjb25kaXRpb24nKTtcbiAgICBsZXQgaHRtbCA9ICcnO1xuICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIiBjbGFzcz1cInBsMTAgcHIxIHB0MiBwYjJcIj5JbnB1dDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJwbDIgcHIxIHB0MiBwYjJcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNhc2VfaW5wdXRcIi8+PC9kaXY+XG4gICAgPGRpdj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb247IGluZGV4KyspIHtcbiAgICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+XG4gICAgICA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiIGNsYXNzPVwicGwxMCBwcjEgcHQyIHBiMlwiPkNhc2U8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJwbDIgcHIxIHB0MiBwYjJcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNhc2UkezUwMDAxICsgaW5kZXh9XCIvPjwvZGl2PlxuICAgICAgPGRpdj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIiR7NTAwMDEgKyBpbmRleH1cIj48L3NwYW4+PC9kaXY+XG4gICAgICA8L2Rpdj5gO1xuICAgIH1cbiAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPlxuICAgIDxkaXYgY2xhc3M9XCJwbDEwIHByMSBwdDIgcGIyXCI+PGJ1dHRvbiBjbGFzcz1cImJ0bkFkZENvbmRpdGlvblwiPkFkZDwvYnV0dG9uPjwvZGl2PlxuICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCIgY2xhc3M9XCJwbDIgcHIxMCBwdDIgcGIyXCI+RGVmYXVsdDwvZGl2PlxuICAgIDxkaXY+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMFwiPjwvc3Bhbj48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICAgIHJldHVybiBodG1sO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkFkZENvbmRpdGlvbicpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUuZGF0YS5JbmNyZWFzZSgnY29uZGl0aW9uJyk7XG4gICAgfSlcbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuXG4gICAgY29uc3QgY29uZGl0aW9uID0gZGF0YS5jb25kaXRpb247XG4gICAgY29uc3QgY2FzZV9pbnB1dCA9IG1hbmFnZXIuVmFsKGRhdGEuY2FzZV9pbnB1dCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmRpdGlvbiYmICFtYW5hZ2VyLmZsZ1N0b3BwaW5nOyBpbmRleCsrKSB7XG4gICAgICBsZXQgbm9kZSA9IDUwMDAxICsgaW5kZXg7XG4gICAgICBjb25zdCBjb25kaXRpb25fbm9kZSA9IGRhdGFbYGNhc2Uke25vZGV9YF07XG4gICAgICBpZiAobWFuYWdlci5WYWwoY29uZGl0aW9uX25vZGUpID09IGNhc2VfaW5wdXQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQsIG5vZGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkLCA1MDAwMCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlclNldHVwIH0gZnJvbSBcIi4uL3dvcmtlci9zZXR1cFwiO1xuaW1wb3J0IHsgQ29yZUFsZXJ0Tm9kZSB9IGZyb20gXCIuL2FsZXJ0XCI7XG5pbXBvcnQgeyBDb3JlQXNzaWduTm9kZSB9IGZyb20gXCIuL2Fzc2lnblwiO1xuaW1wb3J0IHsgQ29yZUJlZ2luTm9kZSB9IGZyb20gXCIuL2JlZ2luXCI7XG5pbXBvcnQgeyBDb3JlQ29uc29sZU5vZGUgfSBmcm9tIFwiLi9jb25zb2xlXCI7XG5pbXBvcnQgeyBDb3JlRGVsYXlOb2RlIH0gZnJvbSBcIi4vZGVsYXlcIjtcbmltcG9ydCB7IENvcmVFbmROb2RlIH0gZnJvbSBcIi4vZW5kXCI7XG5pbXBvcnQgeyBDb3JlRm9yTm9kZSB9IGZyb20gXCIuL2ZvclwiO1xuaW1wb3J0IHsgQ29yZUdyb3VwTm9kZSB9IGZyb20gXCIuL2dyb3VwXCI7XG5pbXBvcnQgeyBDb3JlSWZOb2RlIH0gZnJvbSBcIi4vaWZcIjtcbmltcG9ydCB7IENvcmVQcm9qZWN0Tm9kZSB9IGZyb20gXCIuL3Byb2plY3RcIjtcbmltcG9ydCB7IENvcmVTd2l0Y2hOb2RlIH0gZnJvbSBcIi4vc3dpdGNoXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlU2V0dXAgZXh0ZW5kcyBXb3JrZXJTZXR1cCB7XG4gIG5vZGVzKCk6IGFueVtdIHtcbiAgICByZXR1cm4gW1xuICAgICAgQ29yZUJlZ2luTm9kZSxcbiAgICAgIENvcmVFbmROb2RlLFxuICAgICAgQ29yZUFzc2lnbk5vZGUsXG4gICAgICBDb3JlRGVsYXlOb2RlLFxuICAgICAgQ29yZUlmTm9kZSxcbiAgICAgIENvcmVTd2l0Y2hOb2RlLFxuICAgICAgQ29yZUZvck5vZGUsXG4gICAgICBDb3JlQWxlcnROb2RlLFxuICAgICAgQ29yZUNvbnNvbGVOb2RlLFxuICAgICAgQ29yZVByb2plY3ROb2RlLFxuICAgICAgQ29yZUdyb3VwTm9kZSxcbiAgICBdO1xuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlQmVnaW4gfSBmcm9tIFwiLi4vbm9kZXMvYmVnaW5cIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi9ub2RlXCI7XG5pbXBvcnQgeyBXb3JrZXJTZXR1cCB9IGZyb20gXCIuL3NldHVwXCI7XG5cbmNvbnN0IGdFdmFsID0gZXZhbDtcbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnLFxuICBncm91cENhdmFzOiBcIm1haW5fZ3JvdXBDYXZhc1wiLFxufTtcbmV4cG9ydCBjbGFzcyBXb3JrZXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gICAgdGhpcy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlICRkYXRhOiBhbnk7XG4gIHByaXZhdGUgJG5vZGVzOiBXb3JrZXJOb2RlW10gPSBbXTtcbiAgcHJpdmF0ZSAkcHJvamVjdDogYW55O1xuICBwcml2YXRlICRncm91cDogYW55ID0gXCJyb290XCI7XG4gIHByaXZhdGUgZGVsYXlfdGltZTogbnVtYmVyID0gMTAwO1xuICBwdWJsaWMgY29uc3RydWN0b3IoZGF0YTogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuTG9hZERhdGEoZGF0YSk7XG4gIH1cbiAgcHVibGljIHNldFByb2plY3QocHJvamVjdDogYW55KSB7XG4gICAgdGhpcy4kcHJvamVjdCA9IHByb2plY3Q7XG4gICAgdGhpcy4kZ3JvdXAgPSBcInJvb3RcIjtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdCgpIHtcbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuJGRhdGE/LnByb2plY3RzPy5maW5kKChpdGVtOiBhbnkpID0+IGl0ZW0uaWQgPT0gdGhpcy4kcHJvamVjdCk7XG4gICAgfVxuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLm1haW4pIHtcbiAgICAgIHJldHVybiB0aGlzLiRkYXRhO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgc2V0R3JvdXAoZ3JvdXA6IGFueSkge1xuICAgIHRoaXMuJGdyb3VwID0gZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldEdyb3VwQ3VycmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4kZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RDdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLiRwcm9qZWN0O1xuICB9XG4gIHB1YmxpYyBnZXROb2RlSW5Hcm91cChncm91cDogYW55ID0gbnVsbCkge1xuICAgIGxldCBfZ3JvdXAgPSBncm91cCA/PyB0aGlzLiRncm91cDtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0KCk/Lm5vZGVzPy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5ncm91cCA9PSBfZ3JvdXApO1xuICB9XG4gIHB1YmxpYyBnZXROb2RlQnlJZChfaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVJbkdyb3VwKCk/LmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLmlkID09IF9pZCk/LlswXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXROb2RlQnlLZXkoX2tleTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZUluR3JvdXAoKT8uZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0ua2V5ID09IF9rZXkpPy5bMF07XG4gIH1cbiAgcHVibGljIExvYWREYXRhKGRhdGE6IGFueSk6IFdvcmtlck1hbmFnZXIge1xuICAgIGlmICghZGF0YSkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy4kZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGRhdGEgPSBkYXRhO1xuICAgIH1cbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgdGhpcy4kcHJvamVjdCA9IHRoaXMuJGRhdGEucHJvamVjdDtcbiAgICB9XG4gICAgaWYgKCF0aGlzLiRwcm9qZWN0KSB7XG4gICAgICB0aGlzLiRwcm9qZWN0ID0gdGhpcy4kZGF0YS5wcm9qZWN0cz8uWzBdPy5pZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIG5ld1NldHVwKHNldHVwOiBhbnkpIHtcbiAgICB0aGlzLlNldHVwKG5ldyBzZXR1cCgpKTtcbiAgfVxuICBwdWJsaWMgU2V0dXAoc2V0dXA6IFdvcmtlclNldHVwKSB7XG4gICAgdGhpcy4kbm9kZXMgPSBbLi4udGhpcy4kbm9kZXMsIC4uLnNldHVwLm5ld05vZGVzKCldO1xuICB9XG4gIHB1YmxpYyBnZXRDb250cm9sTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuJG5vZGVzLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi57XG4gICAgICAgICAga2V5OiBcIlwiLFxuICAgICAgICAgIG5hbWU6IFwiXCIsXG4gICAgICAgICAgZ3JvdXA6IFwiXCIsXG4gICAgICAgICAgaHRtbDogXCJcIixcbiAgICAgICAgICBzY3JpcHQ6IFwiXCIsXG4gICAgICAgICAgcHJvcGVydGllczogXCJcIixcbiAgICAgICAgICBkb3Q6IHtcbiAgICAgICAgICAgIGxlZnQ6IDEsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMSxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC4uLml0ZW0ub3B0aW9uKCkgPz8ge30sXG4gICAgICAgIGtleTogaXRlbS5rZXkoKSxcbiAgICAgICAgbmFtZTogaXRlbS5uYW1lKCksXG4gICAgICAgIGljb246IGl0ZW0uaWNvbigpLFxuICAgICAgICBncm91cDogaXRlbS5ncm91cCgpLFxuICAgICAgICBodG1sOiBpdGVtLmh0bWwsXG4gICAgICAgIHNjcmlwdDogaXRlbS5zY3JpcHQsXG4gICAgICAgIHByb3BlcnRpZXM6IGl0ZW0ucHJvcGVydGllcygpID8/IHt9LFxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgcHJpdmF0ZSBnZXRXb3JrZXJOb2RlKF9rZXk6IHN0cmluZyk6IFdvcmtlck5vZGUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kbm9kZXM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5jaGVja0tleShfa2V5KSk/LlswXTtcbiAgfVxuICBwcml2YXRlIGFzeW5jIGV4Y3V0ZU5vZGUoJGlkOiBhbnkpIHtcbiAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQoJGlkKTtcbiAgICBhd2FpdCB0aGlzLmV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlKTtcbiAgfVxuICBkZWxheSh0aW1lOiBudW1iZXIgPSAxMDApIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWUpKTtcbiAgfVxuICBwcml2YXRlIGFzeW5jIGV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5mbGdTdG9wcGluZykge1xuICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX3N0b3BwaW5nJywge30pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmRlbGF5KHRoaXMuZGVsYXlfdGltZSk7XG4gICAgaWYgKGRhdGFOb2RlKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCdub2RlX3N0YXJ0JywgeyBub2RlOiBkYXRhTm9kZSB9KTtcbiAgICAgIGNvbnN0IHdvcmtlck5vZGUgPSB0aGlzLmdldFdvcmtlck5vZGUoZGF0YU5vZGUua2V5KTtcbiAgICAgIGF3YWl0IHdvcmtlck5vZGU/LmV4ZWN1dGUoZGF0YU5vZGUuaWQsIGRhdGFOb2RlLCB0aGlzLCB0aGlzLmV4Y3V0ZU5vZGUuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKCdub2RlX2VuZCcsIHsgbm9kZTogZGF0YU5vZGUgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBhc3luYyBleGN1dGVBc3luYygpIHtcbiAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5S2V5KGAke05vZGVCZWdpbn1gKTtcbiAgICBhd2FpdCB0aGlzLmV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlKTtcbiAgfVxuICBwdWJsaWMgZXhjdXRlKCkge1xuICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX3N0YXJ0Jywge30pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgICAgICBhd2FpdCB0aGlzLmV4Y3V0ZUFzeW5jKCk7XG4gICAgICAgIHRoaXMuZmxnU3RvcHBpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX2VuZCcsIHt9KTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV4KTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX2VuZCcsIHt9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmxnU3RvcHBpbmcgPSBmYWxzZTtcbiAgICB9KTtcbiAgfVxuICBmbGdTdG9wcGluZzogYW55ID0gbnVsbDtcbiAgcHVibGljIHN0b3AoKSB7XG4gICAgdGhpcy5mbGdTdG9wcGluZyA9IHRydWU7XG4gIH1cbiAgcHVibGljIFZhbCgkc2NycGl0OiBhbnkpOiBhbnkge1xuICAgIGxldCBycyA9ICRzY3JwaXQ7XG4gICAgd2hpbGUgKChgJHtyc31gLmluZGV4T2YoJ1xcJHsnKSkgPj0gMCkge1xuICAgICAgcnMgPSBnRXZhbChycyk7XG4gICAgICBjb25zb2xlLmxvZyhycyk7O1xuICAgIH1cbiAgICBycyA9IGdFdmFsKGAke3JzfWApO1xuICAgIGNvbnNvbGUubG9nKCRzY3JwaXQsIHJzKTtcbiAgICByZXR1cm4gcnM7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCB3b3JrZXJNYW5hZ2VyID0gbmV3IFdvcmtlck1hbmFnZXIoKTtcbiIsImltcG9ydCB7IENvcmVTZXR1cCB9IGZyb20gJy4vbm9kZXMvaW5kZXgnO1xuaW1wb3J0IHsgd29ya2VyTWFuYWdlciwgV29ya2VyTWFuYWdlciB9IGZyb20gJy4vd29ya2VyL2luZGV4Jztcblxud29ya2VyTWFuYWdlci5uZXdTZXR1cChDb3JlU2V0dXApO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIENvcmVTZXR1cCxcbiAgV29ya2VyTWFuYWdlcixcbiAgd29ya2VyTWFuYWdlclxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztVQUVhLFdBQVcsQ0FBQTtRQUN0QixLQUFLLEdBQUE7SUFDSCxRQUFBLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxRQUFRLEdBQUE7SUFDTixRQUFBLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtTQUNoRDtJQUNGOztJQ1BELElBQVksT0FRWCxDQUFBO0lBUkQsQ0FBQSxVQUFZLE9BQU8sRUFBQTtJ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
