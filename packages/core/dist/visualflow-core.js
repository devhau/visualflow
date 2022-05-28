
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

    class WorkerNode {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy1jb3JlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvd29ya2VyL3NldHVwLnRzIiwiLi4vc3JjL3dvcmtlci9ub2RlLnRzIiwiLi4vc3JjL25vZGVzL2FsZXJ0LnRzIiwiLi4vc3JjL25vZGVzL2Fzc2lnbi50cyIsIi4uL3NyYy9ub2Rlcy9iZWdpbi50cyIsIi4uL3NyYy9ub2Rlcy9jb25zb2xlLnRzIiwiLi4vc3JjL25vZGVzL2VuZC50cyIsIi4uL3NyYy9ub2Rlcy9mb3IudHMiLCIuLi9zcmMvbm9kZXMvZ3JvdXAudHMiLCIuLi9zcmMvbm9kZXMvaWYudHMiLCIuLi9zcmMvbm9kZXMvcHJvamVjdC50cyIsIi4uL3NyYy9ub2Rlcy9zd2l0Y2gudHMiLCIuLi9zcmMvbm9kZXMvaW5kZXgudHMiLCIuLi9zcmMvd29ya2VyL21hbmFnZXIudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlclNldHVwIHtcbiAgbm9kZXMoKTogYW55W10ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBuZXdOb2RlcygpOiBXb3JrZXJOb2RlW10ge1xuICAgIHJldHVybiB0aGlzLm5vZGVzKCkubWFwKChpdGVtKSA9PiAobmV3IGl0ZW0oKSkpXG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyXCI7XG5cbmV4cG9ydCB0eXBlIE9wdGlvbk5vZGUgPSB2b2lkICYge1xuICBrZXk6IFwiXCIsXG4gIG5hbWU6IFwiXCIsXG4gIGdyb3VwOiBcIlwiLFxuICBodG1sOiBcIlwiLFxuICBzY3JpcHQ6IFwiXCIsXG4gIHByb3BlcnRpZXM6IFwiXCIsXG4gIG9ubHlOb2RlOiBib29sZWFuLFxuICBkb3Q6IHtcbiAgICBsZWZ0OiAxLFxuICAgIHRvcDogMCxcbiAgICByaWdodDogMSxcbiAgICBib3R0b206IDAsXG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBwdWJsaWMgY2hlY2tLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5rZXkoKSA9PSBrZXk7XG4gIH1cbiAgbmFtZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lOyB9XG4gIGljb24oKTogYW55IHsgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1wbGF5XCI+PC9pPic7IH1cbiAgZ3JvdXAoKTogYW55IHtcbiAgICByZXR1cm4gXCJDb21tb25cIjtcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkge1xuICAgIHJldHVybiBgYDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSB7IH1cbiAgcHJvcGVydGllcygpOiBhbnkgeyB9XG4gIG9wdGlvbigpOiBhbnkgeyB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG5cbiAgfVxuICBwcm90ZWN0ZWQgYXN5bmMgbmV4dE5vZGUoZGF0YTogYW55LCBuZXh0OiBhbnksIG5vZGVJZDogYW55LCBpbmRleDogYW55ID0gbnVsbCkge1xuICAgIGlmIChkYXRhPy5saW5lcykge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBkYXRhLmxpbmVzKSB7XG4gICAgICAgIGlmIChpdGVtLmZyb20gPT0gbm9kZUlkICYmIChpbmRleCA9PSBudWxsIHx8IGl0ZW0uZnJvbUluZGV4ID09IGluZGV4KSkge1xuICAgICAgICAgIGF3YWl0IG5leHQoaXRlbS50byk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVBbGVydE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9hbGVydFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQWxlcnRcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtYmVsbFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwMTBcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm1lc3NhZ2VcIi8+PC9kaXY+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAga2V5OiBcIm1lc3NhZ2VcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgfVxuICAgIH1cbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGFsZXJ0KGRhdGE/Lm1lc3NhZ2UpO1xuICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQXNzaWduTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2Fzc2lnblwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQXNzaWduXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJvbHRcIj48L2k+JztcbiAgfVxuXG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5leHBvcnQgY29uc3QgTm9kZUJlZ2luID0gXCJjb3JlX2JlZ2luXCI7XG5leHBvcnQgY2xhc3MgQ29yZUJlZ2luTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuXG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBOb2RlQmVnaW47XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJCZWdpblwiO1xuICB9XG4gIG9wdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb25seU5vZGU6IHRydWUsXG4gICAgICBzb3J0OiAwLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDEsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGFzeW5jIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQ29uc29sZU5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9jb25zb2xlXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJDb25zb2xlXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJlbGxcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicDEwXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJtZXNzYWdlXCIvPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIGtleTogXCJtZXNzYWdlXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zb2xlLmxvZyhkYXRhPy5tZXNzYWdlKTtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVFbmROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZW5kXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJFbmRcIjtcbiAgfVxuICBpY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1zdG9wXCI+PC9pPic7XG4gIH1cbiAgb3B0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvbmx5Tm9kZTogdHJ1ZSxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH07XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUZvck5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9mb3JcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkZvclwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1sb25nLWFycm93LWFsdC1yaWdodFwiPjwvaT4nO1xuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBhd2FpdCB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVHcm91cE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9ncm91cFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiR3JvdXBcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXIgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+PGJ1dHRvbiBjbGFzcz1cImJ0bkdvR3JvdXAgbm9kZS1mb3JtLWNvbnRyb2xcIj5HbyB0byBHcm91cDwvYnV0dG9uPjwvZGl2Pic7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIG5vZGUucGFyZW50Lm9wZW5Hcm91cChub2RlLkdldElkKCkpO1xuICAgIH0pXG4gIH1cbiAgYXN5bmMgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zdCBncm91cCA9IG1hbmFnZXIuZ2V0R3JvdXBDdXJyZW50KCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChkYXRhLmlkKTtcbiAgICBhd2FpdCBtYW5hZ2VyLmV4Y3V0ZUFzeW5jKCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChncm91cCk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlSWZOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfaWZcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIklmXCI7XG4gIH1cbiAgaWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtZXF1YWxzXCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25kaXRpb246IHtcbiAgICAgICAga2V5OiBcImNvbmRpdGlvblwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgY29uZDoge1xuICAgICAgICBrZXk6IFwiY29uZFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzdWI6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgb3B0aW9uKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzOiAnJyxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICBjb25zb2xlLmxvZyhub2RlLmRhdGEuR2V0KCdjb25kaXRpb24nKSk7XG4gICAgbGV0IGNvbmRpdGlvbiA9IG5vZGUuZGF0YS5HZXQoJ2NvbmRpdGlvbicpO1xuICAgIGxldCBodG1sID0gJyc7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmRpdGlvbjsgaW5kZXgrKykge1xuICAgICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNvbmQkezUwMDAxICsgaW5kZXh9XCIvPiA8c3BhbiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIj5UaGVuPC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiJHs1MDAwMSArIGluZGV4fVwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+YFxuICAgIH1cbiAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiPkVsc2U8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMFwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+YFxuICAgIGh0bWwgPSBgJHtodG1sfTxkaXY+PGJ1dHRvbiBjbGFzcz1cImJ0bkFkZENvbmRpdGlvblwiPkFkZDwvZGl2PjwvZGl2PmA7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuQWRkQ29uZGl0aW9uJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5kYXRhLkluY3JlYXNlKCdjb25kaXRpb24nKTtcbiAgICB9KVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlUHJvamVjdE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9wcm9qZWN0XCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJQcm9qZWN0XCI7XG4gIH1cbiAgaWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtcHJvamVjdC1kaWFncmFtXCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBwcm9qZWN0OiB7XG4gICAgICAgIGtleTogXCJwcm9qZWN0XCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHNlbGVjdDogdHJ1ZSxcbiAgICAgICAgZGF0YVNlbGVjdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtYWluLmdldFByb2plY3RBbGwoKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdmFsdWU6IGl0ZW0uR2V0KCdpZCcpLFxuICAgICAgICAgICAgICB0ZXh0OiBpdGVtLkdldCgnbmFtZScpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxzZWxlY3QgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJwcm9qZWN0XCI+PC9zZWxlY3Q+PC9kaXY+JztcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG5cbiAgfVxuICBhc3luYyBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IHByb2plY3QgPSBtYW5hZ2VyLmdldFByb2plY3RDdXJyZW50KCk7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0UHJvamVjdChkYXRhLnByb2plY3QpO1xuICAgIGF3YWl0IG1hbmFnZXIuZXhjdXRlQXN5bmMoKTtcbiAgICBtYW5hZ2VyLnNldFByb2plY3QocHJvamVjdCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChncm91cCk7XG4gICAgYXdhaXQgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlU3dpdGNoTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX3N3aXRjaFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiU3dpdGNoXCI7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlclNldHVwIH0gZnJvbSBcIi4uL3dvcmtlci9zZXR1cFwiO1xuaW1wb3J0IHsgQ29yZUFsZXJ0Tm9kZSB9IGZyb20gXCIuL2FsZXJ0XCI7XG5pbXBvcnQgeyBDb3JlQXNzaWduTm9kZSB9IGZyb20gXCIuL2Fzc2lnblwiO1xuaW1wb3J0IHsgQ29yZUJlZ2luTm9kZSB9IGZyb20gXCIuL2JlZ2luXCI7XG5pbXBvcnQgeyBDb3JlQ29uc29sZU5vZGUgfSBmcm9tIFwiLi9jb25zb2xlXCI7XG5pbXBvcnQgeyBDb3JlRW5kTm9kZSB9IGZyb20gXCIuL2VuZFwiO1xuaW1wb3J0IHsgQ29yZUZvck5vZGUgfSBmcm9tIFwiLi9mb3JcIjtcbmltcG9ydCB7IENvcmVHcm91cE5vZGUgfSBmcm9tIFwiLi9ncm91cFwiO1xuaW1wb3J0IHsgQ29yZUlmTm9kZSB9IGZyb20gXCIuL2lmXCI7XG5pbXBvcnQgeyBDb3JlUHJvamVjdE5vZGUgfSBmcm9tIFwiLi9wcm9qZWN0XCI7XG5pbXBvcnQgeyBDb3JlU3dpdGNoTm9kZSB9IGZyb20gXCIuL3N3aXRjaFwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVNldHVwIGV4dGVuZHMgV29ya2VyU2V0dXAge1xuICBub2RlcygpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIENvcmVCZWdpbk5vZGUsXG4gICAgICBDb3JlRW5kTm9kZSxcbiAgICAgIENvcmVBc3NpZ25Ob2RlLFxuICAgICAgQ29yZUlmTm9kZSxcbiAgICAgIENvcmVTd2l0Y2hOb2RlLFxuICAgICAgQ29yZUZvck5vZGUsXG4gICAgICBDb3JlQWxlcnROb2RlLFxuICAgICAgQ29yZUNvbnNvbGVOb2RlLFxuICAgICAgQ29yZVByb2plY3ROb2RlLFxuICAgICAgQ29yZUdyb3VwTm9kZSxcbiAgICBdO1xuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlQmVnaW4gfSBmcm9tIFwiLi4vbm9kZXMvYmVnaW5cIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi9ub2RlXCI7XG5pbXBvcnQgeyBXb3JrZXJTZXR1cCB9IGZyb20gXCIuL3NldHVwXCI7XG5cblxuZXhwb3J0IGNvbnN0IFByb3BlcnR5RW51bSA9IHtcbiAgbWFpbjogXCJtYWluX3Byb2plY3RcIixcbiAgc29sdXRpb246ICdtYWluX3NvbHV0aW9uJyxcbiAgbGluZTogJ21haW5fbGluZScsXG4gIHZhcmlhYmxlOiAnbWFpbl92YXJpYWJsZScsXG4gIGdyb3VwQ2F2YXM6IFwibWFpbl9ncm91cENhdmFzXCIsXG59O1xuZXhwb3J0IGNsYXNzIFdvcmtlck1hbmFnZXIge1xuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XG4gIHB1YmxpYyBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgICB0aGlzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgLyogRXZlbnRzICovXG4gIHB1YmxpYyBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcbiAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xuICAgICAgICBsaXN0ZW5lcnM6IFtdXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuXG4gICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZVxuXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVyc1xuICAgIGNvbnN0IGxpc3RlbmVySW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcbiAgICBjb25zdCBoYXNMaXN0ZW5lciA9IGxpc3RlbmVySW5kZXggPiAtMVxuICAgIGlmIChoYXNMaXN0ZW5lcikgbGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKVxuICB9XG5cbiAgcHVibGljIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMpO1xuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgJGRhdGE6IGFueTtcbiAgcHJpdmF0ZSAkbm9kZXM6IFdvcmtlck5vZGVbXSA9IFtdO1xuICBwcml2YXRlICRwcm9qZWN0OiBhbnk7XG4gIHByaXZhdGUgJGdyb3VwOiBhbnkgPSBcInJvb3RcIjtcbiAgcHJpdmF0ZSBkZWxheV90aW1lOiBudW1iZXIgPSAxMDA7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihkYXRhOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5Mb2FkRGF0YShkYXRhKTtcbiAgfVxuICBwdWJsaWMgc2V0UHJvamVjdChwcm9qZWN0OiBhbnkpIHtcbiAgICB0aGlzLiRwcm9qZWN0ID0gcHJvamVjdDtcbiAgICB0aGlzLiRncm91cCA9IFwicm9vdFwiO1xuICB9XG4gIHB1YmxpYyBnZXRQcm9qZWN0KCkge1xuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLnNvbHV0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy4kZGF0YT8ucHJvamVjdHM/LmZpbmQoKGl0ZW06IGFueSkgPT4gaXRlbS5pZCA9PSB0aGlzLiRwcm9qZWN0KTtcbiAgICB9XG4gICAgaWYgKHRoaXMuJGRhdGEua2V5ID09PSBQcm9wZXJ0eUVudW0ubWFpbikge1xuICAgICAgcmV0dXJuIHRoaXMuJGRhdGE7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBzZXRHcm91cChncm91cDogYW55KSB7XG4gICAgdGhpcy4kZ3JvdXAgPSBncm91cDtcbiAgfVxuICBwdWJsaWMgZ2V0R3JvdXBDdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLiRncm91cDtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdEN1cnJlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHByb2plY3Q7XG4gIH1cbiAgcHVibGljIGdldE5vZGVJbkdyb3VwKGdyb3VwOiBhbnkgPSBudWxsKSB7XG4gICAgbGV0IF9ncm91cCA9IGdyb3VwID8/IHRoaXMuJGdyb3VwO1xuICAgIHJldHVybiB0aGlzLmdldFByb2plY3QoKT8ubm9kZXM/LmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLmdyb3VwID09IF9ncm91cCk7XG4gIH1cbiAgcHVibGljIGdldE5vZGVCeUlkKF9pZDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZUluR3JvdXAoKT8uZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0uaWQgPT0gX2lkKT8uWzBdO1xuICB9XG5cbiAgcHVibGljIGdldE5vZGVCeUtleShfa2V5OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5nZXROb2RlSW5Hcm91cCgpPy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5rZXkgPT0gX2tleSk/LlswXTtcbiAgfVxuICBwdWJsaWMgTG9hZERhdGEoZGF0YTogYW55KTogV29ya2VyTWFuYWdlciB7XG4gICAgaWYgKCFkYXRhKSByZXR1cm4gdGhpcztcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLiRkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZGF0YSA9IGRhdGE7XG4gICAgfVxuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLnNvbHV0aW9uKSB7XG4gICAgICB0aGlzLiRwcm9qZWN0ID0gdGhpcy4kZGF0YS5wcm9qZWN0O1xuICAgIH1cbiAgICBpZiAoIXRoaXMuJHByb2plY3QpIHtcbiAgICAgIHRoaXMuJHByb2plY3QgPSB0aGlzLiRkYXRhLnByb2plY3RzPy5bMF0/LmlkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBwdWJsaWMgbmV3U2V0dXAoc2V0dXA6IGFueSkge1xuICAgIHRoaXMuU2V0dXAobmV3IHNldHVwKCkpO1xuICB9XG4gIHB1YmxpYyBTZXR1cChzZXR1cDogV29ya2VyU2V0dXApIHtcbiAgICB0aGlzLiRub2RlcyA9IFsuLi50aGlzLiRub2RlcywgLi4uc2V0dXAubmV3Tm9kZXMoKV07XG4gIH1cbiAgcHVibGljIGdldENvbnRyb2xOb2RlcygpIHtcbiAgICByZXR1cm4gdGhpcy4kbm9kZXMubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLntcbiAgICAgICAgICBrZXk6IFwiXCIsXG4gICAgICAgICAgbmFtZTogXCJcIixcbiAgICAgICAgICBncm91cDogXCJcIixcbiAgICAgICAgICBodG1sOiBcIlwiLFxuICAgICAgICAgIHNjcmlwdDogXCJcIixcbiAgICAgICAgICBwcm9wZXJ0aWVzOiBcIlwiLFxuICAgICAgICAgIGRvdDoge1xuICAgICAgICAgICAgbGVmdDogMSxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLi4uaXRlbS5vcHRpb24oKSA/PyB7fSxcbiAgICAgICAga2V5OiBpdGVtLmtleSgpLFxuICAgICAgICBuYW1lOiBpdGVtLm5hbWUoKSxcbiAgICAgICAgaWNvbjogaXRlbS5pY29uKCksXG4gICAgICAgIGdyb3VwOiBpdGVtLmdyb3VwKCksXG4gICAgICAgIGh0bWw6IGl0ZW0uaHRtbCxcbiAgICAgICAgc2NyaXB0OiBpdGVtLnNjcmlwdCxcbiAgICAgICAgcHJvcGVydGllczogaXRlbS5wcm9wZXJ0aWVzKCkgPz8ge30sXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBwcml2YXRlIGdldFdvcmtlck5vZGUoX2tleTogc3RyaW5nKTogV29ya2VyTm9kZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLmNoZWNrS2V5KF9rZXkpKT8uWzBdO1xuICB9XG4gIHByaXZhdGUgYXN5bmMgZXhjdXRlTm9kZSgkaWQ6IGFueSkge1xuICAgIGNvbnN0IGRhdGFOb2RlID0gdGhpcy5nZXROb2RlQnlJZCgkaWQpO1xuICAgIGF3YWl0IHRoaXMuZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGUpO1xuICB9XG4gIGRlbGF5KHRpbWU6IG51bWJlciA9IDEwMCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGltZSkpO1xuICB9XG4gIHByaXZhdGUgYXN5bmMgZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGU6IGFueSkge1xuICAgIGlmICh0aGlzLmZsZ1N0b3BwaW5nKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfc3RvcHBpbmcnLCB7fSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuZGVsYXkodGhpcy5kZWxheV90aW1lKTtcbiAgICBpZiAoZGF0YU5vZGUpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goJ25vZGVfc3RhcnQnLCB7IG5vZGU6IGRhdGFOb2RlIH0pO1xuICAgICAgY29uc3Qgd29ya2VyTm9kZSA9IHRoaXMuZ2V0V29ya2VyTm9kZShkYXRhTm9kZS5rZXkpO1xuICAgICAgYXdhaXQgd29ya2VyTm9kZT8uZXhlY3V0ZShkYXRhTm9kZS5pZCwgZGF0YU5vZGUsIHRoaXMsIHRoaXMuZXhjdXRlTm9kZS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goJ25vZGVfZW5kJywgeyBub2RlOiBkYXRhTm9kZSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGFzeW5jIGV4Y3V0ZUFzeW5jKCkge1xuICAgIGNvbnN0IGRhdGFOb2RlID0gdGhpcy5nZXROb2RlQnlLZXkoYCR7Tm9kZUJlZ2lufWApO1xuICAgIGF3YWl0IHRoaXMuZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGUpO1xuICB9XG4gIHB1YmxpYyBleGN1dGUoKSB7XG4gICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfc3RhcnQnLCB7fSk7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmZsZ1N0b3BwaW5nID0gZmFsc2U7XG4gICAgICAgIGF3YWl0IHRoaXMuZXhjdXRlQXN5bmMoKTtcbiAgICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfZW5kJywge30pO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXgpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKCd3b3JrZXJfZW5kJywge30pO1xuICAgICAgfVxuICAgICAgdGhpcy5mbGdTdG9wcGluZyA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG4gIGZsZ1N0b3BwaW5nOiBhbnkgPSBudWxsO1xuICBwdWJsaWMgc3RvcCgpIHtcbiAgICB0aGlzLmZsZ1N0b3BwaW5nID0gdHJ1ZTtcbiAgfVxufVxuZXhwb3J0IGNvbnN0IHdvcmtlck1hbmFnZXIgPSBuZXcgV29ya2VyTWFuYWdlcigpO1xuIiwiaW1wb3J0IHsgQ29yZVNldHVwIH0gZnJvbSAnLi9ub2Rlcy9pbmRleCc7XG5pbXBvcnQgeyB3b3JrZXJNYW5hZ2VyLCBXb3JrZXJNYW5hZ2VyIH0gZnJvbSAnLi93b3JrZXIvaW5kZXgnO1xuXG53b3JrZXJNYW5hZ2VyLm5ld1NldHVwKENvcmVTZXR1cCk7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgQ29yZVNldHVwLFxuICBXb3JrZXJNYW5hZ2VyLFxuICB3b3JrZXJNYW5hZ2VyXG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O1VBRWEsV0FBVyxDQUFBO1FBQ3RCLEtBQUssR0FB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
