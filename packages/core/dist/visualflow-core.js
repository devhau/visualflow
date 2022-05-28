
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
            return '<div class="p10"><input type="text" class="node-form-control" node:model="message"/></div>';
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
            alert(data?.message);
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
            return '<i class="fas fa-bell"></i>';
        }
        html({ elNode, main, node }) {
            return '<div class="p10"><input type="text" class="node-form-control" node:model="message"/></div>';
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
            console.log(data?.message);
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
            return '<i class="fas fa-long-arrow-alt-right"></i>';
        }
        async execute(nodeId, data, manager, next) {
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
            console.log(node.data.Get('condition'));
            let condition = node.data.Get('condition');
            let html = '';
            for (let index = 0; index < condition; index++) {
                html = `${html}<div class="node-content-row"><input type="text" class="node-form-control" node:model="cond${50001 + index}"/> <span style="text-align:right">Then</span><span><span class="node-dot" node="${50001 + index}"></span></span></div>`;
            }
            html = `${html}<div class="node-content-row"><span style="text-align:right">Else</span><span><span class="node-dot" node="50000"></span></span></div>`;
            html = `${html}<div><button class="btnAddCondition">Add</div></div>`;
            return html;
        }
        script({ elNode, main, node }) {
            elNode.querySelector('.btnAddCondition')?.addEventListener('click', () => {
                node.data.Increase('condition');
            });
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
    }

    class CoreSetup extends WorkerSetup {
        nodes() {
            return [
                CoreBeginNode,
                CoreEndNode,
                CoreAssignNode,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy1jb3JlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvd29ya2VyL3NldHVwLnRzIiwiLi4vc3JjL3dvcmtlci9ub2RlLnRzIiwiLi4vc3JjL25vZGVzL2FsZXJ0LnRzIiwiLi4vc3JjL25vZGVzL2Fzc2lnbi50cyIsIi4uL3NyYy9ub2Rlcy9iZWdpbi50cyIsIi4uL3NyYy9ub2Rlcy9jb25zb2xlLnRzIiwiLi4vc3JjL25vZGVzL2VuZC50cyIsIi4uL3NyYy9ub2Rlcy9mb3IudHMiLCIuLi9zcmMvbm9kZXMvZ3JvdXAudHMiLCIuLi9zcmMvbm9kZXMvaWYudHMiLCIuLi9zcmMvbm9kZXMvcHJvamVjdC50cyIsIi4uL3NyYy9ub2Rlcy9zd2l0Y2gudHMiLCIuLi9zcmMvbm9kZXMvaW5kZXgudHMiLCIuLi9zcmMvd29ya2VyL21hbmFnZXIudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlclNldHVwIHtcbiAgbm9kZXMoKTogYW55W10ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBuZXdOb2RlcygpOiBXb3JrZXJOb2RlW10ge1xuICAgIHJldHVybiB0aGlzLm5vZGVzKCkubWFwKChpdGVtKSA9PiAobmV3IGl0ZW0oKSkpXG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyXCI7XG5cbmV4cG9ydCBlbnVtIEVudk5vZGUge1xuICBBbGwgPSAwLFxuICBXZWIgPSAxLFxuICBQQyA9IDIsXG4gIENsb3VkID0gMyxcbiAgTW9iaWxlID0gNCxcbiAgSU9TID0gNSxcbiAgQW5kcm9pZCA9IDZcbn1cbmV4cG9ydCB0eXBlIE9wdGlvbk5vZGUgPSB2b2lkICYge1xuICBrZXk6IFwiXCIsXG4gIG5hbWU6IFwiXCIsXG4gIGdyb3VwOiBcIlwiLFxuICBodG1sOiBcIlwiLFxuICBzY3JpcHQ6IFwiXCIsXG4gIHByb3BlcnRpZXM6IFwiXCIsXG4gIG9ubHlOb2RlOiBib29sZWFuLFxuICBkb3Q6IHtcbiAgICBsZWZ0OiAxLFxuICAgIHRvcDogMCxcbiAgICByaWdodDogMSxcbiAgICBib3R0b206IDAsXG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBXb3JrZXJOb2RlIHtcbiAgZW52KCk6IGFueVtdIHtcbiAgICByZXR1cm4gW0Vudk5vZGUuQWxsLCBFbnZOb2RlLkNsb3VkLCBFbnZOb2RlLlBDLCBFbnZOb2RlLldlYiwgRW52Tm9kZS5Nb2JpbGUsIEVudk5vZGUuSU9TLCBFbnZOb2RlLkFuZHJvaWRdO1xuICB9XG4gIHB1YmxpYyBDaGVja0VudihlbnYpIHtcbiAgICByZXR1cm4gdGhpcy5lbnYoKS5pbmNsdWRlcyhlbnYpO1xuICB9XG4gIGtleSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbiAgcHVibGljIGNoZWNrS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMua2V5KCkgPT0ga2V5O1xuICB9XG4gIG5hbWUoKTogYW55IHsgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTsgfVxuICBpY29uKCk6IGFueSB7IHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtcGxheVwiPjwvaT4nOyB9XG4gIGdyb3VwKCk6IGFueSB7XG4gICAgcmV0dXJuIFwiQ29tbW9uXCI7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpIHtcbiAgICByZXR1cm4gYGA7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgeyB9XG4gIHByb3BlcnRpZXMoKTogYW55IHsgfVxuICBvcHRpb24oKTogYW55IHsgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuXG4gIH1cbiAgcHJvdGVjdGVkIGFzeW5jIG5leHROb2RlKGRhdGE6IGFueSwgbmV4dDogYW55LCBub2RlSWQ6IGFueSwgaW5kZXg6IGFueSA9IG51bGwpIHtcbiAgICBpZiAoZGF0YT8ubGluZXMpIHtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgZGF0YS5saW5lcykge1xuICAgICAgICBpZiAoaXRlbS5mcm9tID09IG5vZGVJZCAmJiAoaW5kZXggPT0gbnVsbCB8fCBpdGVtLmZyb21JbmRleCA9PSBpbmRleCkpIHtcbiAgICAgICAgICBhd2FpdCBuZXh0KGl0ZW0udG8pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQWxlcnROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfYWxlcnRcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkFsZXJ0XCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJlbGxcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicDEwXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJtZXNzYWdlXCIvPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIGtleTogXCJtZXNzYWdlXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBhbGVydChkYXRhPy5tZXNzYWdlKTtcbiAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUFzc2lnbk5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9hc3NpZ25cIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkFzc2lnblwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1ib2x0XCI+PC9pPic7XG4gIH1cblxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuZXhwb3J0IGNvbnN0IE5vZGVCZWdpbiA9IFwiY29yZV9iZWdpblwiO1xuZXhwb3J0IGNsYXNzIENvcmVCZWdpbk5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcblxuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gTm9kZUJlZ2luO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQmVnaW5cIjtcbiAgfVxuICBvcHRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9ubHlOb2RlOiB0cnVlLFxuICAgICAgc29ydDogMCxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUNvbnNvbGVOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfY29uc29sZVwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQ29uc29sZVwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1iZWxsXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInAxMFwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibWVzc2FnZVwiLz48L2Rpdj4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZToge1xuICAgICAgICBrZXk6IFwibWVzc2FnZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc29sZS5sb2coZGF0YT8ubWVzc2FnZSk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlRW5kTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2VuZFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiRW5kXCI7XG4gIH1cbiAgaWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtc3RvcFwiPjwvaT4nO1xuICB9XG4gIG9wdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb25seU5vZGU6IHRydWUsXG4gICAgICBzb3J0OiAwLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDEsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVGb3JOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZm9yXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJGb3JcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtbG9uZy1hcnJvdy1hbHQtcmlnaHRcIj48L2k+JztcbiAgfVxuXG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlR3JvdXBOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZ3JvdXBcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkdyb3VwXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFyIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwIG5vZGUtZm9ybS1jb250cm9sXCI+R28gdG8gR3JvdXA8L2J1dHRvbj48L2Rpdj4nO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLnBhcmVudC5vcGVuR3JvdXAobm9kZS5HZXRJZCgpKTtcbiAgICB9KVxuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZGF0YS5pZCk7XG4gICAgYXdhaXQgbWFuYWdlci5leGN1dGVBc3luYygpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUlmTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2lmXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJJZlwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWVxdWFsc1wiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIGNvbmQ6IHtcbiAgICAgICAga2V5OiBcImNvbmRcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc3ViOiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9wdGlvbigpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjbGFzczogJycsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgY29uc29sZS5sb2cobm9kZS5kYXRhLkdldCgnY29uZGl0aW9uJykpO1xuICAgIGxldCBjb25kaXRpb24gPSBub2RlLmRhdGEuR2V0KCdjb25kaXRpb24nKTtcbiAgICBsZXQgaHRtbCA9ICcnO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25kaXRpb247IGluZGV4KyspIHtcbiAgICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJjb25kJHs1MDAwMSArIGluZGV4fVwiLz4gPHNwYW4gc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCI+VGhlbjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIiR7NTAwMDEgKyBpbmRleH1cIj48L3NwYW4+PC9zcGFuPjwvZGl2PmBcbiAgICB9XG4gICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3BhbiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIj5FbHNlPC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDBcIj48L3NwYW4+PC9zcGFuPjwvZGl2PmBcbiAgICBodG1sID0gYCR7aHRtbH08ZGl2PjxidXR0b24gY2xhc3M9XCJidG5BZGRDb25kaXRpb25cIj5BZGQ8L2Rpdj48L2Rpdj5gO1xuICAgIHJldHVybiBodG1sO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkFkZENvbmRpdGlvbicpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUuZGF0YS5JbmNyZWFzZSgnY29uZGl0aW9uJyk7XG4gICAgfSlcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVByb2plY3ROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfcHJvamVjdFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiUHJvamVjdFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXByb2plY3QtZGlhZ3JhbVwiPjwvaT4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvamVjdDoge1xuICAgICAgICBrZXk6IFwicHJvamVjdFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIGRhdGFTZWxlY3Q6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgICAgICByZXR1cm4gbWFpbi5nZXRQcm9qZWN0QWxsKCkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBpdGVtLkdldCgnaWQnKSxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS5HZXQoJ25hbWUnKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48c2VsZWN0IGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwicHJvamVjdFwiPjwvc2VsZWN0PjwvZGl2Pic7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gbWFuYWdlci5nZXRQcm9qZWN0Q3VycmVudCgpO1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldFByb2plY3QoZGF0YS5wcm9qZWN0KTtcbiAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgbWFuYWdlci5zZXRQcm9qZWN0KHByb2plY3QpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIGF3YWl0IHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVN3aXRjaE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9zd2l0Y2hcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIlN3aXRjaFwiO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJTZXR1cCB9IGZyb20gXCIuLi93b3JrZXIvc2V0dXBcIjtcbmltcG9ydCB7IENvcmVBbGVydE5vZGUgfSBmcm9tIFwiLi9hbGVydFwiO1xuaW1wb3J0IHsgQ29yZUFzc2lnbk5vZGUgfSBmcm9tIFwiLi9hc3NpZ25cIjtcbmltcG9ydCB7IENvcmVCZWdpbk5vZGUgfSBmcm9tIFwiLi9iZWdpblwiO1xuaW1wb3J0IHsgQ29yZUNvbnNvbGVOb2RlIH0gZnJvbSBcIi4vY29uc29sZVwiO1xuaW1wb3J0IHsgQ29yZUVuZE5vZGUgfSBmcm9tIFwiLi9lbmRcIjtcbmltcG9ydCB7IENvcmVGb3JOb2RlIH0gZnJvbSBcIi4vZm9yXCI7XG5pbXBvcnQgeyBDb3JlR3JvdXBOb2RlIH0gZnJvbSBcIi4vZ3JvdXBcIjtcbmltcG9ydCB7IENvcmVJZk5vZGUgfSBmcm9tIFwiLi9pZlwiO1xuaW1wb3J0IHsgQ29yZVByb2plY3ROb2RlIH0gZnJvbSBcIi4vcHJvamVjdFwiO1xuaW1wb3J0IHsgQ29yZVN3aXRjaE5vZGUgfSBmcm9tIFwiLi9zd2l0Y2hcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVTZXR1cCBleHRlbmRzIFdvcmtlclNldHVwIHtcbiAgbm9kZXMoKTogYW55W10ge1xuICAgIHJldHVybiBbXG4gICAgICBDb3JlQmVnaW5Ob2RlLFxuICAgICAgQ29yZUVuZE5vZGUsXG4gICAgICBDb3JlQXNzaWduTm9kZSxcbiAgICAgIENvcmVJZk5vZGUsXG4gICAgICBDb3JlU3dpdGNoTm9kZSxcbiAgICAgIENvcmVGb3JOb2RlLFxuICAgICAgQ29yZUFsZXJ0Tm9kZSxcbiAgICAgIENvcmVDb25zb2xlTm9kZSxcbiAgICAgIENvcmVQcm9qZWN0Tm9kZSxcbiAgICAgIENvcmVHcm91cE5vZGUsXG4gICAgXTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgTm9kZUJlZ2luIH0gZnJvbSBcIi4uL25vZGVzL2JlZ2luXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4vbm9kZVwiO1xuaW1wb3J0IHsgV29ya2VyU2V0dXAgfSBmcm9tIFwiLi9zZXR1cFwiO1xuXG5cbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnLFxuICBncm91cENhdmFzOiBcIm1haW5fZ3JvdXBDYXZhc1wiLFxufTtcbmV4cG9ydCBjbGFzcyBXb3JrZXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gICAgdGhpcy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlICRkYXRhOiBhbnk7XG4gIHByaXZhdGUgJG5vZGVzOiBXb3JrZXJOb2RlW10gPSBbXTtcbiAgcHJpdmF0ZSAkcHJvamVjdDogYW55O1xuICBwcml2YXRlICRncm91cDogYW55ID0gXCJyb290XCI7XG4gIHByaXZhdGUgZGVsYXlfdGltZTogbnVtYmVyID0gMTAwO1xuICBwdWJsaWMgY29uc3RydWN0b3IoZGF0YTogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuTG9hZERhdGEoZGF0YSk7XG4gIH1cbiAgcHVibGljIHNldFByb2plY3QocHJvamVjdDogYW55KSB7XG4gICAgdGhpcy4kcHJvamVjdCA9IHByb2plY3Q7XG4gICAgdGhpcy4kZ3JvdXAgPSBcInJvb3RcIjtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdCgpIHtcbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuJGRhdGE/LnByb2plY3RzPy5maW5kKChpdGVtOiBhbnkpID0+IGl0ZW0uaWQgPT0gdGhpcy4kcHJvamVjdCk7XG4gICAgfVxuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLm1haW4pIHtcbiAgICAgIHJldHVybiB0aGlzLiRkYXRhO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgc2V0R3JvdXAoZ3JvdXA6IGFueSkge1xuICAgIHRoaXMuJGdyb3VwID0gZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldEdyb3VwQ3VycmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4kZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RDdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLiRwcm9qZWN0O1xuICB9XG4gIHB1YmxpYyBnZXROb2RlSW5Hcm91cChncm91cDogYW55ID0gbnVsbCkge1xuICAgIGxldCBfZ3JvdXAgPSBncm91cCA/PyB0aGlzLiRncm91cDtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0KCk/Lm5vZGVzPy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5ncm91cCA9PSBfZ3JvdXApO1xuICB9XG4gIHB1YmxpYyBnZXROb2RlQnlJZChfaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVJbkdyb3VwKCk/LmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLmlkID09IF9pZCk/LlswXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXROb2RlQnlLZXkoX2tleTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZUluR3JvdXAoKT8uZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0ua2V5ID09IF9rZXkpPy5bMF07XG4gIH1cbiAgcHVibGljIExvYWREYXRhKGRhdGE6IGFueSk6IFdvcmtlck1hbmFnZXIge1xuICAgIGlmICghZGF0YSkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy4kZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGRhdGEgPSBkYXRhO1xuICAgIH1cbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgdGhpcy4kcHJvamVjdCA9IHRoaXMuJGRhdGEucHJvamVjdDtcbiAgICB9XG4gICAgaWYgKCF0aGlzLiRwcm9qZWN0KSB7XG4gICAgICB0aGlzLiRwcm9qZWN0ID0gdGhpcy4kZGF0YS5wcm9qZWN0cz8uWzBdPy5pZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIG5ld1NldHVwKHNldHVwOiBhbnkpIHtcbiAgICB0aGlzLlNldHVwKG5ldyBzZXR1cCgpKTtcbiAgfVxuICBwdWJsaWMgU2V0dXAoc2V0dXA6IFdvcmtlclNldHVwKSB7XG4gICAgdGhpcy4kbm9kZXMgPSBbLi4udGhpcy4kbm9kZXMsIC4uLnNldHVwLm5ld05vZGVzKCldO1xuICB9XG4gIHB1YmxpYyBnZXRDb250cm9sTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuJG5vZGVzLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi57XG4gICAgICAgICAga2V5OiBcIlwiLFxuICAgICAgICAgIG5hbWU6IFwiXCIsXG4gICAgICAgICAgZ3JvdXA6IFwiXCIsXG4gICAgICAgICAgaHRtbDogXCJcIixcbiAgICAgICAgICBzY3JpcHQ6IFwiXCIsXG4gICAgICAgICAgcHJvcGVydGllczogXCJcIixcbiAgICAgICAgICBkb3Q6IHtcbiAgICAgICAgICAgIGxlZnQ6IDEsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMSxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC4uLml0ZW0ub3B0aW9uKCkgPz8ge30sXG4gICAgICAgIGtleTogaXRlbS5rZXkoKSxcbiAgICAgICAgbmFtZTogaXRlbS5uYW1lKCksXG4gICAgICAgIGljb246IGl0ZW0uaWNvbigpLFxuICAgICAgICBncm91cDogaXRlbS5ncm91cCgpLFxuICAgICAgICBodG1sOiBpdGVtLmh0bWwsXG4gICAgICAgIHNjcmlwdDogaXRlbS5zY3JpcHQsXG4gICAgICAgIHByb3BlcnRpZXM6IGl0ZW0ucHJvcGVydGllcygpID8/IHt9LFxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgcHJpdmF0ZSBnZXRXb3JrZXJOb2RlKF9rZXk6IHN0cmluZyk6IFdvcmtlck5vZGUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kbm9kZXM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5jaGVja0tleShfa2V5KSk/LlswXTtcbiAgfVxuICBwcml2YXRlIGFzeW5jIGV4Y3V0ZU5vZGUoJGlkOiBhbnkpIHtcbiAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQoJGlkKTtcbiAgICBhd2FpdCB0aGlzLmV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlKTtcbiAgfVxuICBkZWxheSh0aW1lOiBudW1iZXIgPSAxMDApIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWUpKTtcbiAgfVxuICBwcml2YXRlIGFzeW5jIGV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5mbGdTdG9wcGluZykge1xuICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX3N0b3BwaW5nJywge30pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmRlbGF5KHRoaXMuZGVsYXlfdGltZSk7XG4gICAgaWYgKGRhdGFOb2RlKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCdub2RlX3N0YXJ0JywgeyBub2RlOiBkYXRhTm9kZSB9KTtcbiAgICAgIGNvbnN0IHdvcmtlck5vZGUgPSB0aGlzLmdldFdvcmtlck5vZGUoZGF0YU5vZGUua2V5KTtcbiAgICAgIGF3YWl0IHdvcmtlck5vZGU/LmV4ZWN1dGUoZGF0YU5vZGUuaWQsIGRhdGFOb2RlLCB0aGlzLCB0aGlzLmV4Y3V0ZU5vZGUuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKCdub2RlX2VuZCcsIHsgbm9kZTogZGF0YU5vZGUgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBhc3luYyBleGN1dGVBc3luYygpIHtcbiAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5S2V5KGAke05vZGVCZWdpbn1gKTtcbiAgICBhd2FpdCB0aGlzLmV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlKTtcbiAgfVxuICBwdWJsaWMgZXhjdXRlKCkge1xuICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX3N0YXJ0Jywge30pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgICAgICBhd2FpdCB0aGlzLmV4Y3V0ZUFzeW5jKCk7XG4gICAgICAgIHRoaXMuZmxnU3RvcHBpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX2VuZCcsIHt9KTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV4KTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaCgnd29ya2VyX2VuZCcsIHt9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmxnU3RvcHBpbmcgPSBmYWxzZTtcbiAgICB9KTtcbiAgfVxuICBmbGdTdG9wcGluZzogYW55ID0gbnVsbDtcbiAgcHVibGljIHN0b3AoKSB7XG4gICAgdGhpcy5mbGdTdG9wcGluZyA9IHRydWU7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCB3b3JrZXJNYW5hZ2VyID0gbmV3IFdvcmtlck1hbmFnZXIoKTtcbiIsImltcG9ydCB7IENvcmVTZXR1cCB9IGZyb20gJy4vbm9kZXMvaW5kZXgnO1xuaW1wb3J0IHsgd29ya2VyTWFuYWdlciwgV29ya2VyTWFuYWdlciB9IGZyb20gJy4vd29ya2VyL2luZGV4Jztcblxud29ya2VyTWFuYWdlci5uZXdTZXR1cChDb3JlU2V0dXApO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIENvcmVTZXR1cCxcbiAgV29ya2VyTWFuYWdlcixcbiAgd29ya2VyTWFuYWdlclxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztVQUVhLFdBQVcsQ0FBQTtRQUN0QixLQUFLLEdBQUE7SUFDSCxRQUFBLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxRQUFRLEdBQUE7SUFDTixRQUFBLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtTQUNoRDtJQUNGOztJQ1BELElBQVksT0FRWCxDQUFBO0lBUkQsQ0FBQSxVQUFZLE9BQU8sRUFBQTtJQUNqQixJQUFBLE9BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsS0FBTyxDQUFBO0lBQ1AsSUFBQSxPQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLEtBQU8sQ0FBQTtJQUNQLElBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxJQUFNLENBQUE7SUFDTixJQUFBLE9BQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsT0FBUyxDQUFBO0lBQ1QsSUFBQSxPQUFBLENBQUEsT0FBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLFFBQVUsQ0FBQTtJQUNWLElBQUEsT0FBQSxDQUFBLE9BQUEsQ0FB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
