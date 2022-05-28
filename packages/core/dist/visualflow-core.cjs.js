
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
    html(node, elParent) {
        return ``;
    }
    script({ elNode, main, node }) { }
    properties() { }
    option() { }
    execute(nodeId, data, manager, next) {
    }
    nextNode(data, next, nodeId, index = null) {
        if (data?.lines) {
            for (let item of data.lines) {
                if (item.from == nodeId && (index == null || item.fromIndex == index)) {
                    next(item.to);
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
    execute(nodeId, data, manager, next) {
        alert(data?.message);
        this.nextNode(data, next, nodeId);
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
    execute(nodeId, data, manager, next) {
        this.nextNode(data, next, nodeId);
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
    execute(nodeId, data, manager, next) {
        this.nextNode(data, next, nodeId);
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
    execute(nodeId, data, manager, next) {
        console.log(data?.message);
        this.nextNode(data, next, nodeId);
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
    html(node, elParent) {
        return '<div class="text-center p3"><button class="btnGoGroup node-form-control">Go to Group</button></div>';
    }
    script({ elNode, main, node }) {
        elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {
            node.parent.openGroup(node.GetId());
        });
    }
    execute(nodeId, data, manager, next) {
        const group = manager.getGroupCurrent();
        manager.setGroup(data.id);
        manager.excute();
        manager.setGroup(group);
        this.nextNode(data, next, nodeId);
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
    html(node, elParent) {
        return '<div class="text-center p3"><select class="node-form-control" node:model="project"></select></div>';
    }
    script({ elNode, main, node }) {
    }
    execute(nodeId, data, manager, next) {
        const project = manager.getProjectCurrent();
        const group = manager.getGroupCurrent();
        manager.setProject(data.project);
        manager.excute();
        manager.setProject(project);
        manager.setGroup(group);
        this.nextNode(data, next, nodeId);
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
    $data;
    $nodes = [];
    $project;
    $group = "root";
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
    excuteNode($id) {
        const dataNode = this.getNodeById($id);
        this.excuteDataNode(dataNode);
    }
    excuteDataNode(dataNode) {
        if (dataNode) {
            console.log(dataNode);
            const workerNode = this.getWorkerNode(dataNode.key);
            workerNode?.execute(dataNode.id, dataNode, this, this.excuteNode.bind(this));
        }
    }
    excute() {
        const dataNode = this.getNodeByKey(`${NodeBegin}`);
        this.excuteDataNode(dataNode);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy1jb3JlLmNqcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3dvcmtlci9zZXR1cC50cyIsIi4uL3NyYy93b3JrZXIvbm9kZS50cyIsIi4uL3NyYy9ub2Rlcy9hbGVydC50cyIsIi4uL3NyYy9ub2Rlcy9hc3NpZ24udHMiLCIuLi9zcmMvbm9kZXMvYmVnaW4udHMiLCIuLi9zcmMvbm9kZXMvY29uc29sZS50cyIsIi4uL3NyYy9ub2Rlcy9lbmQudHMiLCIuLi9zcmMvbm9kZXMvZ3JvdXAudHMiLCIuLi9zcmMvbm9kZXMvaWYudHMiLCIuLi9zcmMvbm9kZXMvcHJvamVjdC50cyIsIi4uL3NyYy9ub2Rlcy9zd2l0Y2gudHMiLCIuLi9zcmMvbm9kZXMvaW5kZXgudHMiLCIuLi9zcmMvd29ya2VyL21hbmFnZXIudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlclNldHVwIHtcbiAgbm9kZXMoKTogYW55W10ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBuZXdOb2RlcygpOiBXb3JrZXJOb2RlW10ge1xuICAgIHJldHVybiB0aGlzLm5vZGVzKCkubWFwKChpdGVtKSA9PiAobmV3IGl0ZW0oKSkpXG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyXCI7XG5cbmV4cG9ydCB0eXBlIE9wdGlvbk5vZGUgPSB2b2lkICYge1xuICBrZXk6IFwiXCIsXG4gIG5hbWU6IFwiXCIsXG4gIGdyb3VwOiBcIlwiLFxuICBodG1sOiBcIlwiLFxuICBzY3JpcHQ6IFwiXCIsXG4gIHByb3BlcnRpZXM6IFwiXCIsXG4gIG9ubHlOb2RlOiBib29sZWFuLFxuICBkb3Q6IHtcbiAgICBsZWZ0OiAxLFxuICAgIHRvcDogMCxcbiAgICByaWdodDogMSxcbiAgICBib3R0b206IDAsXG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBXb3JrZXJOb2RlIHtcbiAga2V5KCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbiAgcHVibGljIGNoZWNrS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMua2V5KCkgPT0ga2V5O1xuICB9XG4gIG5hbWUoKSB7IHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7IH1cbiAgaWNvbigpIHsgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1wbGF5XCI+PC9pPic7IH1cbiAgZ3JvdXAoKSB7XG4gICAgcmV0dXJuIFwiQ29tbW9uXCI7XG4gIH1cbiAgaHRtbChub2RlOiBhbnksIGVsUGFyZW50OiBhbnkpIHtcbiAgICByZXR1cm4gYGA7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgeyB9XG4gIHByb3BlcnRpZXMoKSB7IH1cbiAgb3B0aW9uKCk6IGFueSB7IH1cbiAgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcblxuICB9XG4gIHByb3RlY3RlZCBuZXh0Tm9kZShkYXRhOiBhbnksIG5leHQ6IGFueSwgbm9kZUlkOiBhbnksIGluZGV4OiBhbnkgPSBudWxsKSB7XG4gICAgaWYgKGRhdGE/LmxpbmVzKSB7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIGRhdGEubGluZXMpIHtcbiAgICAgICAgaWYgKGl0ZW0uZnJvbSA9PSBub2RlSWQgJiYgKGluZGV4ID09IG51bGwgfHwgaXRlbS5mcm9tSW5kZXggPT0gaW5kZXgpKSB7XG4gICAgICAgICAgbmV4dChpdGVtLnRvKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUFsZXJ0Tm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2FsZXJ0XCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJBbGVydFwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1iZWxsXCI+PC9pPic7XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInAxMFwiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwibWVzc2FnZVwiLz48L2Rpdj4nO1xuICB9XG4gIHByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZToge1xuICAgICAgICBrZXk6IFwibWVzc2FnZVwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgYWxlcnQoZGF0YT8ubWVzc2FnZSk7XG4gICAgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQXNzaWduTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2Fzc2lnblwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiQXNzaWduXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJvbHRcIj48L2k+JztcbiAgfVxuXG4gIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5leHBvcnQgY29uc3QgTm9kZUJlZ2luID0gXCJjb3JlX2JlZ2luXCI7XG5leHBvcnQgY2xhc3MgQ29yZUJlZ2luTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuXG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBOb2RlQmVnaW47XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJCZWdpblwiO1xuICB9XG4gIG9wdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb25seU5vZGU6IHRydWUsXG4gICAgICBzb3J0OiAwLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDEsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQ29uc29sZU5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9jb25zb2xlXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJDb25zb2xlXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJlbGxcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicDEwXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJtZXNzYWdlXCIvPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIGtleTogXCJtZXNzYWdlXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBjb25zb2xlLmxvZyhkYXRhPy5tZXNzYWdlKTtcbiAgICB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVFbmROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZW5kXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJFbmRcIjtcbiAgfVxuICBpY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1zdG9wXCI+PC9pPic7XG4gIH1cbiAgb3B0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvbmx5Tm9kZTogdHJ1ZSxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMSxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH07XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuLi93b3JrZXIvbWFuYWdlclwiO1xuaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUdyb3VwTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2dyb3VwXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJHcm91cFwiO1xuICB9XG4gIGljb24oKSB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhciBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JztcbiAgfVxuICBodG1sKG5vZGU6IGFueSwgZWxQYXJlbnQ6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48YnV0dG9uIGNsYXNzPVwiYnRuR29Hcm91cCBub2RlLWZvcm0tY29udHJvbFwiPkdvIHRvIEdyb3VwPC9idXR0b24+PC9kaXY+JztcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5wYXJlbnQub3Blbkdyb3VwKG5vZGUuR2V0SWQoKSk7XG4gICAgfSlcbiAgfVxuICBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IGdyb3VwID0gbWFuYWdlci5nZXRHcm91cEN1cnJlbnQoKTtcbiAgICBtYW5hZ2VyLnNldEdyb3VwKGRhdGEuaWQpO1xuICAgIG1hbmFnZXIuZXhjdXRlKCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChncm91cCk7XG4gICAgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlSWZOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfaWZcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIklmXCI7XG4gIH1cbiAgaWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtZXF1YWxzXCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBjb25kaXRpb246IHtcbiAgICAgICAga2V5OiBcImNvbmRpdGlvblwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgY29uZDoge1xuICAgICAgICBrZXk6IFwiY29uZFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzdWI6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgb3B0aW9uKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNsYXNzOiAnJyxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICBjb25zb2xlLmxvZyhub2RlLmRhdGEuR2V0KCdjb25kaXRpb24nKSk7XG4gICAgbGV0IGNvbmRpdGlvbiA9IG5vZGUuZGF0YS5HZXQoJ2NvbmRpdGlvbicpO1xuICAgIGxldCBodG1sID0gJyc7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmRpdGlvbjsgaW5kZXgrKykge1xuICAgICAgaHRtbCA9IGAke2h0bWx9PGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNvbmQkezUwMDAxICsgaW5kZXh9XCIvPiA8c3BhbiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIj5UaGVuPC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiJHs1MDAwMSArIGluZGV4fVwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+YFxuICAgIH1cbiAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiPkVsc2U8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMFwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+YFxuICAgIGh0bWwgPSBgJHtodG1sfTxkaXY+PGJ1dHRvbiBjbGFzcz1cImJ0bkFkZENvbmRpdGlvblwiPkFkZDwvZGl2PjwvZGl2PmA7XG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbiAgc2NyaXB0KHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHZvaWQge1xuICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuQWRkQ29uZGl0aW9uJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbm9kZS5kYXRhLkluY3JlYXNlKCdjb25kaXRpb24nKTtcbiAgICB9KVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlUHJvamVjdE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9wcm9qZWN0XCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJQcm9qZWN0XCI7XG4gIH1cbiAgaWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtcHJvamVjdC1kaWFncmFtXCI+PC9pPic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBwcm9qZWN0OiB7XG4gICAgICAgIGtleTogXCJwcm9qZWN0XCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHNlbGVjdDogdHJ1ZSxcbiAgICAgICAgZGF0YVNlbGVjdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtYWluLmdldFByb2plY3RBbGwoKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdmFsdWU6IGl0ZW0uR2V0KCdpZCcpLFxuICAgICAgICAgICAgICB0ZXh0OiBpdGVtLkdldCgnbmFtZScpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGh0bWwobm9kZTogYW55LCBlbFBhcmVudDogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxzZWxlY3QgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJwcm9qZWN0XCI+PC9zZWxlY3Q+PC9kaXY+JztcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG5cbiAgfVxuICBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnN0IHByb2plY3QgPSBtYW5hZ2VyLmdldFByb2plY3RDdXJyZW50KCk7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0UHJvamVjdChkYXRhLnByb2plY3QpO1xuICAgIG1hbmFnZXIuZXhjdXRlKCk7XG4gICAgbWFuYWdlci5zZXRQcm9qZWN0KHByb2plY3QpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZ3JvdXApO1xuICAgIHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVN3aXRjaE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9zd2l0Y2hcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIlN3aXRjaFwiO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJTZXR1cCB9IGZyb20gXCIuLi93b3JrZXIvc2V0dXBcIjtcbmltcG9ydCB7IENvcmVBbGVydE5vZGUgfSBmcm9tIFwiLi9hbGVydFwiO1xuaW1wb3J0IHsgQ29yZUFzc2lnbk5vZGUgfSBmcm9tIFwiLi9hc3NpZ25cIjtcbmltcG9ydCB7IENvcmVCZWdpbk5vZGUgfSBmcm9tIFwiLi9iZWdpblwiO1xuaW1wb3J0IHsgQ29yZUNvbnNvbGVOb2RlIH0gZnJvbSBcIi4vY29uc29sZVwiO1xuaW1wb3J0IHsgQ29yZUVuZE5vZGUgfSBmcm9tIFwiLi9lbmRcIjtcbmltcG9ydCB7IENvcmVHcm91cE5vZGUgfSBmcm9tIFwiLi9ncm91cFwiO1xuaW1wb3J0IHsgQ29yZUlmTm9kZSB9IGZyb20gXCIuL2lmXCI7XG5pbXBvcnQgeyBDb3JlUHJvamVjdE5vZGUgfSBmcm9tIFwiLi9wcm9qZWN0XCI7XG5pbXBvcnQgeyBDb3JlU3dpdGNoTm9kZSB9IGZyb20gXCIuL3N3aXRjaFwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZVNldHVwIGV4dGVuZHMgV29ya2VyU2V0dXAge1xuICBub2RlcygpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIENvcmVCZWdpbk5vZGUsXG4gICAgICBDb3JlRW5kTm9kZSxcbiAgICAgIENvcmVBc3NpZ25Ob2RlLFxuICAgICAgQ29yZUlmTm9kZSxcbiAgICAgIENvcmVTd2l0Y2hOb2RlLFxuICAgICAgQ29yZUFsZXJ0Tm9kZSxcbiAgICAgIENvcmVDb25zb2xlTm9kZSxcbiAgICAgIENvcmVQcm9qZWN0Tm9kZSxcbiAgICAgIENvcmVHcm91cE5vZGUsXG4gICAgXTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgTm9kZUJlZ2luIH0gZnJvbSBcIi4uL25vZGVzL2JlZ2luXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4vbm9kZVwiO1xuaW1wb3J0IHsgV29ya2VyU2V0dXAgfSBmcm9tIFwiLi9zZXR1cFwiO1xuXG5cbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnLFxuICBncm91cENhdmFzOiBcIm1haW5fZ3JvdXBDYXZhc1wiLFxufTtcbmV4cG9ydCBjbGFzcyBXb3JrZXJNYW5hZ2VyIHtcbiAgcHJpdmF0ZSAkZGF0YTogYW55O1xuICBwcml2YXRlICRub2RlczogV29ya2VyTm9kZVtdID0gW107XG4gIHByaXZhdGUgJHByb2plY3Q6IGFueTtcbiAgcHJpdmF0ZSAkZ3JvdXA6IGFueSA9IFwicm9vdFwiO1xuICBwdWJsaWMgY29uc3RydWN0b3IoZGF0YTogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuTG9hZERhdGEoZGF0YSk7XG4gIH1cbiAgcHVibGljIHNldFByb2plY3QocHJvamVjdDogYW55KSB7XG4gICAgdGhpcy4kcHJvamVjdCA9IHByb2plY3Q7XG4gICAgdGhpcy4kZ3JvdXAgPSBcInJvb3RcIjtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdCgpIHtcbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuJGRhdGE/LnByb2plY3RzPy5maW5kKChpdGVtOiBhbnkpID0+IGl0ZW0uaWQgPT0gdGhpcy4kcHJvamVjdCk7XG4gICAgfVxuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLm1haW4pIHtcbiAgICAgIHJldHVybiB0aGlzLiRkYXRhO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgc2V0R3JvdXAoZ3JvdXA6IGFueSkge1xuICAgIHRoaXMuJGdyb3VwID0gZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldEdyb3VwQ3VycmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4kZ3JvdXA7XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RDdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLiRwcm9qZWN0O1xuICB9XG4gIHB1YmxpYyBnZXROb2RlSW5Hcm91cChncm91cDogYW55ID0gbnVsbCkge1xuICAgIGxldCBfZ3JvdXAgPSBncm91cCA/PyB0aGlzLiRncm91cDtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0KCk/Lm5vZGVzPy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5ncm91cCA9PSBfZ3JvdXApO1xuICB9XG4gIHB1YmxpYyBnZXROb2RlQnlJZChfaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldE5vZGVJbkdyb3VwKCk/LmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLmlkID09IF9pZCk/LlswXTtcbiAgfVxuXG4gIHB1YmxpYyBnZXROb2RlQnlLZXkoX2tleTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZUluR3JvdXAoKT8uZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0ua2V5ID09IF9rZXkpPy5bMF07XG4gIH1cbiAgcHVibGljIExvYWREYXRhKGRhdGE6IGFueSk6IFdvcmtlck1hbmFnZXIge1xuICAgIGlmICghZGF0YSkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy4kZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGRhdGEgPSBkYXRhO1xuICAgIH1cbiAgICBpZiAodGhpcy4kZGF0YS5rZXkgPT09IFByb3BlcnR5RW51bS5zb2x1dGlvbikge1xuICAgICAgdGhpcy4kcHJvamVjdCA9IHRoaXMuJGRhdGEucHJvamVjdDtcbiAgICB9XG4gICAgaWYgKCF0aGlzLiRwcm9qZWN0KSB7XG4gICAgICB0aGlzLiRwcm9qZWN0ID0gdGhpcy4kZGF0YS5wcm9qZWN0cz8uWzBdPy5pZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIG5ld1NldHVwKHNldHVwOiBhbnkpIHtcbiAgICB0aGlzLlNldHVwKG5ldyBzZXR1cCgpKTtcbiAgfVxuICBwdWJsaWMgU2V0dXAoc2V0dXA6IFdvcmtlclNldHVwKSB7XG4gICAgdGhpcy4kbm9kZXMgPSBbLi4udGhpcy4kbm9kZXMsIC4uLnNldHVwLm5ld05vZGVzKCldO1xuICB9XG4gIHB1YmxpYyBnZXRDb250cm9sTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuJG5vZGVzLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi57XG4gICAgICAgICAga2V5OiBcIlwiLFxuICAgICAgICAgIG5hbWU6IFwiXCIsXG4gICAgICAgICAgZ3JvdXA6IFwiXCIsXG4gICAgICAgICAgaHRtbDogXCJcIixcbiAgICAgICAgICBzY3JpcHQ6IFwiXCIsXG4gICAgICAgICAgcHJvcGVydGllczogXCJcIixcbiAgICAgICAgICBkb3Q6IHtcbiAgICAgICAgICAgIGxlZnQ6IDEsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMSxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC4uLml0ZW0ub3B0aW9uKCkgPz8ge30sXG4gICAgICAgIGtleTogaXRlbS5rZXkoKSxcbiAgICAgICAgbmFtZTogaXRlbS5uYW1lKCksXG4gICAgICAgIGljb246IGl0ZW0uaWNvbigpLFxuICAgICAgICBncm91cDogaXRlbS5ncm91cCgpLFxuICAgICAgICBodG1sOiBpdGVtLmh0bWwsXG4gICAgICAgIHNjcmlwdDogaXRlbS5zY3JpcHQsXG4gICAgICAgIHByb3BlcnRpZXM6IGl0ZW0ucHJvcGVydGllcygpID8/IHt9LFxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgcHJpdmF0ZSBnZXRXb3JrZXJOb2RlKF9rZXk6IHN0cmluZyk6IFdvcmtlck5vZGUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kbm9kZXM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5jaGVja0tleShfa2V5KSk/LlswXTtcbiAgfVxuICBwcml2YXRlIGV4Y3V0ZU5vZGUoJGlkOiBhbnkpIHtcbiAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQoJGlkKTtcbiAgICB0aGlzLmV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlKTtcbiAgfVxuICBwcml2YXRlIGV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlOiBhbnkpIHtcbiAgICBpZiAoZGF0YU5vZGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGFOb2RlKTtcbiAgICAgIGNvbnN0IHdvcmtlck5vZGUgPSB0aGlzLmdldFdvcmtlck5vZGUoZGF0YU5vZGUua2V5KTtcbiAgICAgIHdvcmtlck5vZGU/LmV4ZWN1dGUoZGF0YU5vZGUuaWQsIGRhdGFOb2RlLCB0aGlzLCB0aGlzLmV4Y3V0ZU5vZGUuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBleGN1dGUoKSB7XG4gICAgY29uc3QgZGF0YU5vZGUgPSB0aGlzLmdldE5vZGVCeUtleShgJHtOb2RlQmVnaW59YCk7XG4gICAgdGhpcy5leGN1dGVEYXRhTm9kZShkYXRhTm9kZSk7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCB3b3JrZXJNYW5hZ2VyID0gbmV3IFdvcmtlck1hbmFnZXIoKTtcbiIsImltcG9ydCB7IENvcmVTZXR1cCB9IGZyb20gJy4vbm9kZXMvaW5kZXgnO1xuaW1wb3J0IHsgd29ya2VyTWFuYWdlciwgV29ya2VyTWFuYWdlciB9IGZyb20gJy4vd29ya2VyL2luZGV4Jztcblxud29ya2VyTWFuYWdlci5uZXdTZXR1cChDb3JlU2V0dXApO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIENvcmVTZXR1cCxcbiAgV29ya2VyTWFuYWdlcixcbiAgd29ya2VyTWFuYWdlclxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O01BRWEsV0FBVyxDQUFBO0lBQ3RCLEtBQUssR0FBQTtBQUNILFFBQUEsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELFFBQVEsR0FBQTtBQUNOLFFBQUEsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO0tBQ2hEO0FBQ0Y7O01DUVksVUFBVSxDQUFBO0lBQ3JCLEdBQUcsR0FBQTtBQUNELFFBQUEsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztLQUM5QjtBQUNNLElBQUEsUUFBUSxDQUFDLEdBQVcsRUFBQTtBQUN6QixRQUFBLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQztLQUMxQjtJQUNE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
