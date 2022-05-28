
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow_core.js v0.0.1-beta
   * Released under the MIT license.
   */

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

export { index as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy1jb3JlLmVzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvd29ya2VyL3NldHVwLnRzIiwiLi4vc3JjL3dvcmtlci9ub2RlLnRzIiwiLi4vc3JjL25vZGVzL2FsZXJ0LnRzIiwiLi4vc3JjL25vZGVzL2Fzc2lnbi50cyIsIi4uL3NyYy9ub2Rlcy9iZWdpbi50cyIsIi4uL3NyYy9ub2Rlcy9jb25zb2xlLnRzIiwiLi4vc3JjL25vZGVzL2VuZC50cyIsIi4uL3NyYy9ub2Rlcy9ncm91cC50cyIsIi4uL3NyYy9ub2Rlcy9pZi50cyIsIi4uL3NyYy9ub2Rlcy9wcm9qZWN0LnRzIiwiLi4vc3JjL25vZGVzL3N3aXRjaC50cyIsIi4uL3NyYy9ub2Rlcy9pbmRleC50cyIsIi4uL3NyYy93b3JrZXIvbWFuYWdlci50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4vbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgV29ya2VyU2V0dXAge1xuICBub2RlcygpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIG5ld05vZGVzKCk6IFdvcmtlck5vZGVbXSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZXMoKS5tYXAoKGl0ZW0pID0+IChuZXcgaXRlbSgpKSlcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTWFuYWdlciB9IGZyb20gXCIuL21hbmFnZXJcIjtcblxuZXhwb3J0IHR5cGUgT3B0aW9uTm9kZSA9IHZvaWQgJiB7XG4gIGtleTogXCJcIixcbiAgbmFtZTogXCJcIixcbiAgZ3JvdXA6IFwiXCIsXG4gIGh0bWw6IFwiXCIsXG4gIHNjcmlwdDogXCJcIixcbiAgcHJvcGVydGllczogXCJcIixcbiAgb25seU5vZGU6IGJvb2xlYW4sXG4gIGRvdDoge1xuICAgIGxlZnQ6IDEsXG4gICAgdG9wOiAwLFxuICAgIHJpZ2h0OiAxLFxuICAgIGJvdHRvbTogMCxcbiAgfVxufVxuZXhwb3J0IGNsYXNzIFdvcmtlck5vZGUge1xuICBrZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBwdWJsaWMgY2hlY2tLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5rZXkoKSA9PSBrZXk7XG4gIH1cbiAgbmFtZSgpIHsgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZTsgfVxuICBpY29uKCkgeyByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXBsYXlcIj48L2k+JzsgfVxuICBncm91cCgpIHtcbiAgICByZXR1cm4gXCJDb21tb25cIjtcbiAgfVxuICBodG1sKG5vZGU6IGFueSwgZWxQYXJlbnQ6IGFueSkge1xuICAgIHJldHVybiBgYDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSB7IH1cbiAgcHJvcGVydGllcygpIHsgfVxuICBvcHRpb24oKTogYW55IHsgfVxuICBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuXG4gIH1cbiAgcHJvdGVjdGVkIG5leHROb2RlKGRhdGE6IGFueSwgbmV4dDogYW55LCBub2RlSWQ6IGFueSwgaW5kZXg6IGFueSA9IG51bGwpIHtcbiAgICBpZiAoZGF0YT8ubGluZXMpIHtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgZGF0YS5saW5lcykge1xuICAgICAgICBpZiAoaXRlbS5mcm9tID09IG5vZGVJZCAmJiAoaW5kZXggPT0gbnVsbCB8fCBpdGVtLmZyb21JbmRleCA9PSBpbmRleCkpIHtcbiAgICAgICAgICBuZXh0KGl0ZW0udG8pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlQWxlcnROb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfYWxlcnRcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkFsZXJ0XCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLWJlbGxcIj48L2k+JztcbiAgfVxuICBodG1sKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicDEwXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJtZXNzYWdlXCIvPjwvZGl2Pic7XG4gIH1cbiAgcHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIGtleTogXCJtZXNzYWdlXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IFwiXCJcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICBhbGVydChkYXRhPy5tZXNzYWdlKTtcbiAgICB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVBc3NpZ25Ob2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfYXNzaWduXCI7XG4gIH1cbiAgbmFtZSgpIHtcbiAgICByZXR1cm4gXCJBc3NpZ25cIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtYm9sdFwiPjwvaT4nO1xuICB9XG5cbiAgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcbmV4cG9ydCBjb25zdCBOb2RlQmVnaW4gPSBcImNvcmVfYmVnaW5cIjtcbmV4cG9ydCBjbGFzcyBDb3JlQmVnaW5Ob2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG5cbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIE5vZGVCZWdpbjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkJlZ2luXCI7XG4gIH1cbiAgb3B0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvbmx5Tm9kZTogdHJ1ZSxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBkb3Q6IHtcbiAgICAgICAgbGVmdDogMCxcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICByaWdodDogMSxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgfVxuICAgIH07XG4gIH1cbiAgZXhlY3V0ZShub2RlSWQ6IGFueSwgZGF0YTogYW55LCBtYW5hZ2VyOiBXb3JrZXJNYW5hZ2VyLCBuZXh0OiBhbnkpIHtcbiAgICB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVDb25zb2xlTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX2NvbnNvbGVcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkNvbnNvbGVcIjtcbiAgfVxuICBpY29uKCkge1xuICAgIHJldHVybiAnPGkgY2xhc3M9XCJmYXMgZmEtYmVsbFwiPjwvaT4nO1xuICB9XG4gIGh0bWwoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwMTBcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cIm1lc3NhZ2VcIi8+PC9kaXY+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAga2V5OiBcIm1lc3NhZ2VcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgfVxuICAgIH1cbiAgfVxuICBleGVjdXRlKG5vZGVJZDogYW55LCBkYXRhOiBhbnksIG1hbmFnZXI6IFdvcmtlck1hbmFnZXIsIG5leHQ6IGFueSkge1xuICAgIGNvbnNvbGUubG9nKGRhdGE/Lm1lc3NhZ2UpO1xuICAgIHRoaXMubmV4dE5vZGUoZGF0YSwgbmV4dCwgbm9kZUlkKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyTm9kZSB9IGZyb20gXCIuLi93b3JrZXIvbm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29yZUVuZE5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9lbmRcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkVuZFwiO1xuICB9XG4gIGljb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3BcIj48L2k+JztcbiAgfVxuICBvcHRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9ubHlOb2RlOiB0cnVlLFxuICAgICAgc29ydDogMCxcbiAgICAgIGRvdDoge1xuICAgICAgICBsZWZ0OiAxLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG59XG4iLCJpbXBvcnQgeyBXb3JrZXJNYW5hZ2VyIH0gZnJvbSBcIi4uL3dvcmtlci9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlR3JvdXBOb2RlIGV4dGVuZHMgV29ya2VyTm9kZSB7XG4gIGtleSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImNvcmVfZ3JvdXBcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIkdyb3VwXCI7XG4gIH1cbiAgaWNvbigpIHtcbiAgICByZXR1cm4gJzxpIGNsYXNzPVwiZmFyIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nO1xuICB9XG4gIGh0bWwobm9kZTogYW55LCBlbFBhcmVudDogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwIG5vZGUtZm9ybS1jb250cm9sXCI+R28gdG8gR3JvdXA8L2J1dHRvbj48L2Rpdj4nO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcbiAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLnBhcmVudC5vcGVuR3JvdXAobm9kZS5HZXRJZCgpKTtcbiAgICB9KVxuICB9XG4gIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgZ3JvdXAgPSBtYW5hZ2VyLmdldEdyb3VwQ3VycmVudCgpO1xuICAgIG1hbmFnZXIuc2V0R3JvdXAoZGF0YS5pZCk7XG4gICAgbWFuYWdlci5leGN1dGUoKTtcbiAgICBtYW5hZ2VyLnNldEdyb3VwKGdyb3VwKTtcbiAgICB0aGlzLm5leHROb2RlKGRhdGEsIG5leHQsIG5vZGVJZCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVJZk5vZGUgZXh0ZW5kcyBXb3JrZXJOb2RlIHtcbiAga2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiY29yZV9pZlwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiSWZcIjtcbiAgfVxuICBpY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1lcXVhbHNcIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmRpdGlvbjoge1xuICAgICAgICBrZXk6IFwiY29uZGl0aW9uXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBjb25kOiB7XG4gICAgICAgIGtleTogXCJjb25kXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHN1YjogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBvcHRpb24oKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgY2xhc3M6ICcnLFxuICAgICAgZG90OiB7XG4gICAgICAgIGxlZnQ6IDEsXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnNvbGUubG9nKG5vZGUuZGF0YS5HZXQoJ2NvbmRpdGlvbicpKTtcbiAgICBsZXQgY29uZGl0aW9uID0gbm9kZS5kYXRhLkdldCgnY29uZGl0aW9uJyk7XG4gICAgbGV0IGh0bWwgPSAnJztcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZGl0aW9uOyBpbmRleCsrKSB7XG4gICAgICBodG1sID0gYCR7aHRtbH08ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiY29uZCR7NTAwMDEgKyBpbmRleH1cIi8+IDxzcGFuIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiPlRoZW48L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCIkezUwMDAxICsgaW5kZXh9XCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5gXG4gICAgfVxuICAgIGh0bWwgPSBgJHtodG1sfTxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4gc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCI+RWxzZTwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAwXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5gXG4gICAgaHRtbCA9IGAke2h0bWx9PGRpdj48YnV0dG9uIGNsYXNzPVwiYnRuQWRkQ29uZGl0aW9uXCI+QWRkPC9kaXY+PC9kaXY+YDtcbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuICBzY3JpcHQoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KTogdm9pZCB7XG4gICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5BZGRDb25kaXRpb24nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBub2RlLmRhdGEuSW5jcmVhc2UoJ2NvbmRpdGlvbicpO1xuICAgIH0pXG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlck1hbmFnZXIgfSBmcm9tIFwiLi4vd29ya2VyL21hbmFnZXJcIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi4vd29ya2VyL25vZGVcIjtcblxuZXhwb3J0IGNsYXNzIENvcmVQcm9qZWN0Tm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX3Byb2plY3RcIjtcbiAgfVxuICBuYW1lKCkge1xuICAgIHJldHVybiBcIlByb2plY3RcIjtcbiAgfVxuICBpY29uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICc8aSBjbGFzcz1cImZhcyBmYS1wcm9qZWN0LWRpYWdyYW1cIj48L2k+JztcbiAgfVxuICBwcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb2plY3Q6IHtcbiAgICAgICAga2V5OiBcInByb2plY3RcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc2VsZWN0OiB0cnVlLFxuICAgICAgICBkYXRhU2VsZWN0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG1haW4uZ2V0UHJvamVjdEFsbCgpLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5HZXQoJ2lkJyksXG4gICAgICAgICAgICAgIHRleHQ6IGl0ZW0uR2V0KCduYW1lJylcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaHRtbChub2RlOiBhbnksIGVsUGFyZW50OiBhbnkpOiBzdHJpbmcge1xuICAgIHJldHVybiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+PHNlbGVjdCBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cInByb2plY3RcIj48L3NlbGVjdD48L2Rpdj4nO1xuICB9XG4gIHNjcmlwdCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpOiB2b2lkIHtcblxuICB9XG4gIGV4ZWN1dGUobm9kZUlkOiBhbnksIGRhdGE6IGFueSwgbWFuYWdlcjogV29ya2VyTWFuYWdlciwgbmV4dDogYW55KSB7XG4gICAgY29uc3QgcHJvamVjdCA9IG1hbmFnZXIuZ2V0UHJvamVjdEN1cnJlbnQoKTtcbiAgICBjb25zdCBncm91cCA9IG1hbmFnZXIuZ2V0R3JvdXBDdXJyZW50KCk7XG4gICAgbWFuYWdlci5zZXRQcm9qZWN0KGRhdGEucHJvamVjdCk7XG4gICAgbWFuYWdlci5leGN1dGUoKTtcbiAgICBtYW5hZ2VyLnNldFByb2plY3QocHJvamVjdCk7XG4gICAgbWFuYWdlci5zZXRHcm91cChncm91cCk7XG4gICAgdGhpcy5uZXh0Tm9kZShkYXRhLCBuZXh0LCBub2RlSWQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJOb2RlIH0gZnJvbSBcIi4uL3dvcmtlci9ub2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlU3dpdGNoTm9kZSBleHRlbmRzIFdvcmtlck5vZGUge1xuICBrZXkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJjb3JlX3N3aXRjaFwiO1xuICB9XG4gIG5hbWUoKSB7XG4gICAgcmV0dXJuIFwiU3dpdGNoXCI7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlclNldHVwIH0gZnJvbSBcIi4uL3dvcmtlci9zZXR1cFwiO1xuaW1wb3J0IHsgQ29yZUFsZXJ0Tm9kZSB9IGZyb20gXCIuL2FsZXJ0XCI7XG5pbXBvcnQgeyBDb3JlQXNzaWduTm9kZSB9IGZyb20gXCIuL2Fzc2lnblwiO1xuaW1wb3J0IHsgQ29yZUJlZ2luTm9kZSB9IGZyb20gXCIuL2JlZ2luXCI7XG5pbXBvcnQgeyBDb3JlQ29uc29sZU5vZGUgfSBmcm9tIFwiLi9jb25zb2xlXCI7XG5pbXBvcnQgeyBDb3JlRW5kTm9kZSB9IGZyb20gXCIuL2VuZFwiO1xuaW1wb3J0IHsgQ29yZUdyb3VwTm9kZSB9IGZyb20gXCIuL2dyb3VwXCI7XG5pbXBvcnQgeyBDb3JlSWZOb2RlIH0gZnJvbSBcIi4vaWZcIjtcbmltcG9ydCB7IENvcmVQcm9qZWN0Tm9kZSB9IGZyb20gXCIuL3Byb2plY3RcIjtcbmltcG9ydCB7IENvcmVTd2l0Y2hOb2RlIH0gZnJvbSBcIi4vc3dpdGNoXCI7XG5cbmV4cG9ydCBjbGFzcyBDb3JlU2V0dXAgZXh0ZW5kcyBXb3JrZXJTZXR1cCB7XG4gIG5vZGVzKCk6IGFueVtdIHtcbiAgICByZXR1cm4gW1xuICAgICAgQ29yZUJlZ2luTm9kZSxcbiAgICAgIENvcmVFbmROb2RlLFxuICAgICAgQ29yZUFzc2lnbk5vZGUsXG4gICAgICBDb3JlSWZOb2RlLFxuICAgICAgQ29yZVN3aXRjaE5vZGUsXG4gICAgICBDb3JlQWxlcnROb2RlLFxuICAgICAgQ29yZUNvbnNvbGVOb2RlLFxuICAgICAgQ29yZVByb2plY3ROb2RlLFxuICAgICAgQ29yZUdyb3VwTm9kZSxcbiAgICBdO1xuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlQmVnaW4gfSBmcm9tIFwiLi4vbm9kZXMvYmVnaW5cIjtcbmltcG9ydCB7IFdvcmtlck5vZGUgfSBmcm9tIFwiLi9ub2RlXCI7XG5pbXBvcnQgeyBXb3JrZXJTZXR1cCB9IGZyb20gXCIuL3NldHVwXCI7XG5cblxuZXhwb3J0IGNvbnN0IFByb3BlcnR5RW51bSA9IHtcbiAgbWFpbjogXCJtYWluX3Byb2plY3RcIixcbiAgc29sdXRpb246ICdtYWluX3NvbHV0aW9uJyxcbiAgbGluZTogJ21haW5fbGluZScsXG4gIHZhcmlhYmxlOiAnbWFpbl92YXJpYWJsZScsXG4gIGdyb3VwQ2F2YXM6IFwibWFpbl9ncm91cENhdmFzXCIsXG59O1xuZXhwb3J0IGNsYXNzIFdvcmtlck1hbmFnZXIge1xuICBwcml2YXRlICRkYXRhOiBhbnk7XG4gIHByaXZhdGUgJG5vZGVzOiBXb3JrZXJOb2RlW10gPSBbXTtcbiAgcHJpdmF0ZSAkcHJvamVjdDogYW55O1xuICBwcml2YXRlICRncm91cDogYW55ID0gXCJyb290XCI7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihkYXRhOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5Mb2FkRGF0YShkYXRhKTtcbiAgfVxuICBwdWJsaWMgc2V0UHJvamVjdChwcm9qZWN0OiBhbnkpIHtcbiAgICB0aGlzLiRwcm9qZWN0ID0gcHJvamVjdDtcbiAgICB0aGlzLiRncm91cCA9IFwicm9vdFwiO1xuICB9XG4gIHB1YmxpYyBnZXRQcm9qZWN0KCkge1xuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLnNvbHV0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy4kZGF0YT8ucHJvamVjdHM/LmZpbmQoKGl0ZW06IGFueSkgPT4gaXRlbS5pZCA9PSB0aGlzLiRwcm9qZWN0KTtcbiAgICB9XG4gICAgaWYgKHRoaXMuJGRhdGEua2V5ID09PSBQcm9wZXJ0eUVudW0ubWFpbikge1xuICAgICAgcmV0dXJuIHRoaXMuJGRhdGE7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBzZXRHcm91cChncm91cDogYW55KSB7XG4gICAgdGhpcy4kZ3JvdXAgPSBncm91cDtcbiAgfVxuICBwdWJsaWMgZ2V0R3JvdXBDdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLiRncm91cDtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdEN1cnJlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHByb2plY3Q7XG4gIH1cbiAgcHVibGljIGdldE5vZGVJbkdyb3VwKGdyb3VwOiBhbnkgPSBudWxsKSB7XG4gICAgbGV0IF9ncm91cCA9IGdyb3VwID8/IHRoaXMuJGdyb3VwO1xuICAgIHJldHVybiB0aGlzLmdldFByb2plY3QoKT8ubm9kZXM/LmZpbHRlcigoaXRlbTogYW55KSA9PiBpdGVtLmdyb3VwID09IF9ncm91cCk7XG4gIH1cbiAgcHVibGljIGdldE5vZGVCeUlkKF9pZDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm9kZUluR3JvdXAoKT8uZmlsdGVyKChpdGVtOiBhbnkpID0+IGl0ZW0uaWQgPT0gX2lkKT8uWzBdO1xuICB9XG5cbiAgcHVibGljIGdldE5vZGVCeUtleShfa2V5OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5nZXROb2RlSW5Hcm91cCgpPy5maWx0ZXIoKGl0ZW06IGFueSkgPT4gaXRlbS5rZXkgPT0gX2tleSk/LlswXTtcbiAgfVxuICBwdWJsaWMgTG9hZERhdGEoZGF0YTogYW55KTogV29ya2VyTWFuYWdlciB7XG4gICAgaWYgKCFkYXRhKSByZXR1cm4gdGhpcztcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLiRkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kZGF0YSA9IGRhdGE7XG4gICAgfVxuICAgIGlmICh0aGlzLiRkYXRhLmtleSA9PT0gUHJvcGVydHlFbnVtLnNvbHV0aW9uKSB7XG4gICAgICB0aGlzLiRwcm9qZWN0ID0gdGhpcy4kZGF0YS5wcm9qZWN0O1xuICAgIH1cbiAgICBpZiAoIXRoaXMuJHByb2plY3QpIHtcbiAgICAgIHRoaXMuJHByb2plY3QgPSB0aGlzLiRkYXRhLnByb2plY3RzPy5bMF0/LmlkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBwdWJsaWMgbmV3U2V0dXAoc2V0dXA6IGFueSkge1xuICAgIHRoaXMuU2V0dXAobmV3IHNldHVwKCkpO1xuICB9XG4gIHB1YmxpYyBTZXR1cChzZXR1cDogV29ya2VyU2V0dXApIHtcbiAgICB0aGlzLiRub2RlcyA9IFsuLi50aGlzLiRub2RlcywgLi4uc2V0dXAubmV3Tm9kZXMoKV07XG4gIH1cbiAgcHVibGljIGdldENvbnRyb2xOb2RlcygpIHtcbiAgICByZXR1cm4gdGhpcy4kbm9kZXMubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLntcbiAgICAgICAgICBrZXk6IFwiXCIsXG4gICAgICAgICAgbmFtZTogXCJcIixcbiAgICAgICAgICBncm91cDogXCJcIixcbiAgICAgICAgICBodG1sOiBcIlwiLFxuICAgICAgICAgIHNjcmlwdDogXCJcIixcbiAgICAgICAgICBwcm9wZXJ0aWVzOiBcIlwiLFxuICAgICAgICAgIGRvdDoge1xuICAgICAgICAgICAgbGVmdDogMSxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLi4uaXRlbS5vcHRpb24oKSA/PyB7fSxcbiAgICAgICAga2V5OiBpdGVtLmtleSgpLFxuICAgICAgICBuYW1lOiBpdGVtLm5hbWUoKSxcbiAgICAgICAgaWNvbjogaXRlbS5pY29uKCksXG4gICAgICAgIGdyb3VwOiBpdGVtLmdyb3VwKCksXG4gICAgICAgIGh0bWw6IGl0ZW0uaHRtbCxcbiAgICAgICAgc2NyaXB0OiBpdGVtLnNjcmlwdCxcbiAgICAgICAgcHJvcGVydGllczogaXRlbS5wcm9wZXJ0aWVzKCkgPz8ge30sXG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBwcml2YXRlIGdldFdvcmtlck5vZGUoX2tleTogc3RyaW5nKTogV29ya2VyTm9kZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLmNoZWNrS2V5KF9rZXkpKT8uWzBdO1xuICB9XG4gIHByaXZhdGUgZXhjdXRlTm9kZSgkaWQ6IGFueSkge1xuICAgIGNvbnN0IGRhdGFOb2RlID0gdGhpcy5nZXROb2RlQnlJZCgkaWQpO1xuICAgIHRoaXMuZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGUpO1xuICB9XG4gIHByaXZhdGUgZXhjdXRlRGF0YU5vZGUoZGF0YU5vZGU6IGFueSkge1xuICAgIGlmIChkYXRhTm9kZSkge1xuICAgICAgY29uc29sZS5sb2coZGF0YU5vZGUpO1xuICAgICAgY29uc3Qgd29ya2VyTm9kZSA9IHRoaXMuZ2V0V29ya2VyTm9kZShkYXRhTm9kZS5rZXkpO1xuICAgICAgd29ya2VyTm9kZT8uZXhlY3V0ZShkYXRhTm9kZS5pZCwgZGF0YU5vZGUsIHRoaXMsIHRoaXMuZXhjdXRlTm9kZS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGV4Y3V0ZSgpIHtcbiAgICBjb25zdCBkYXRhTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5S2V5KGAke05vZGVCZWdpbn1gKTtcbiAgICB0aGlzLmV4Y3V0ZURhdGFOb2RlKGRhdGFOb2RlKTtcbiAgfVxufVxuZXhwb3J0IGNvbnN0IHdvcmtlck1hbmFnZXIgPSBuZXcgV29ya2VyTWFuYWdlcigpO1xuIiwiaW1wb3J0IHsgQ29yZVNldHVwIH0gZnJvbSAnLi9ub2Rlcy9pbmRleCc7XG5pbXBvcnQgeyB3b3JrZXJNYW5hZ2VyLCBXb3JrZXJNYW5hZ2VyIH0gZnJvbSAnLi93b3JrZXIvaW5kZXgnO1xuXG53b3JrZXJNYW5hZ2VyLm5ld1NldHVwKENvcmVTZXR1cCk7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgQ29yZVNldHVwLFxuICBXb3JrZXJNYW5hZ2VyLFxuICB3b3JrZXJNYW5hZ2VyXG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O01BRWEsV0FBVyxDQUFBO0lBQ3RCLEtBQUssR0FBQTtBQUNILFFBQUEsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELFFBQVEsR0FBQTtBQUNOLFFBQUEsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBO0tBQ2hEO0FBQ0Y7O01DUVksVUFBVSxDQUFBO0lBQ3JCLEdBQUcsR0FBQTtBQUNELFFBQUEsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztLQUM5QjtBQUNNLElBQUEsUUFBUSxDQUFDLEdBQVcsRUFBQTtBQUN6QixRQUFBLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQztLQUMxQjtJQUNELElB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
