
  /**
   * @license
   * author: Nguyen Van Hau
   * workerflow.js v0.0.1
   * Released under the MIT license.
   */

class ControlFlow {
    elControl;
    parent;
    constructor(parent) {
        this.parent = parent;
        this.elControl = parent.container?.querySelector('.workerflow-control__list');
        if (this.elControl) {
            this.elControl.innerHTML = "";
            let keys = Object.keys(parent.option.control);
            keys.forEach(key => {
                let Node = document.createElement('div');
                Node.setAttribute('draggable', 'true');
                Node.setAttribute('data-node', key);
                Node.classList.add("workerflow-control__item");
                Node.innerHTML = parent.option.control[key].name;
                Node.addEventListener('dragstart', this.dragStart.bind(this));
                Node.addEventListener('dragend', this.dragend.bind(this));
                this.elControl?.appendChild(Node);
            });
        }
    }
    dragend(e) {
        this.parent.dataNodeSelect = null;
    }
    dragStart(e) {
        if (e.type === "touchstart") {
            this.parent.dataNodeSelect = e.target.closest(".workerflow-control__item").getAttribute('data-node');
        }
        else {
            this.parent.dataNodeSelect = e.target.getAttribute('data-node');
            e.dataTransfer.setData("node", e.target.getAttribute('data-node'));
        }
    }
}

class EventFlow {
    parent;
    events = {};
    constructor(parent) {
        this.parent = parent;
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
        let self = this.parent;
        // Check if this event not exists
        if (this.events[event] === undefined) {
            // console.error(`This event: ${event} does not exist`);
            return false;
        }
        this.events[event].listeners.forEach((listener) => {
            listener(details, self);
        });
    }
}

class TabFlow {
    parent;
    modules;
    elTab;
    constructor(parent, modules = {}) {
        this.parent = parent;
        this.modules = modules;
        if (!this.modules)
            this.modules = {};
        this.elTab = parent.container?.querySelector('.workerflow-items');
        if (this.elTab) {
            this.elTab.innerHTML = '';
        }
        this.elTab?.addEventListener('mousedown', this.ClickTab.bind(this));
    }
    ClickTab(e) {
        if (e.target.classList.contains('workerflow-item')) {
            let projectId = e.target.getAttribute('data-project');
            this.LoadProjectById(projectId);
        }
    }
    LoadProjectById(projectId) {
        this.elTab?.querySelectorAll('.active').forEach((item) => {
            this.modules[item.getAttribute('data-project')?.toString() || ''] = this.parent.View?.toJson();
            item.classList.remove('active');
        });
        this.elTab?.querySelector(`[data-project="${projectId}"]`)?.classList.add('active');
        this.parent.View?.load(this.modules[projectId]);
    }
    NewProject() {
        let data = {
            id: this.parent.getUuid(),
            name: `project-${this.parent.getTime()}`,
            x: 0,
            y: 0,
            zoom: 1,
            nodes: []
        };
        this.LoadProject(data);
    }
    LoadProject(data) {
        this.elTab?.querySelectorAll('.active').forEach((item) => {
            this.modules[item.getAttribute('data-project')?.toString() || ''] = this.parent.View?.toJson();
            item.classList.remove('active');
        });
        if (this.elTab?.querySelector(`[data-project="${data.id}"]`)) {
            this.elTab?.querySelector(`[data-project="${data.id}"]`)?.classList.add('active');
        }
        else {
            let item = document.createElement('div');
            item.classList.add("workerflow-item");
            item.classList.add('active');
            item.innerHTML = data.name;
            item.setAttribute('data-project', data.id);
            this.elTab?.appendChild(item);
        }
        this.modules[data.id] = data;
        this.parent.View?.load(this.modules[data.id]);
    }
}

class LineFlow {
    parent;
    fromNode;
    toNode;
    outputIndex;
    elConnection;
    elPath;
    curvature = 0.5;
    constructor(parent, fromNode, toNode = null, outputIndex = 0) {
        this.parent = parent;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.outputIndex = outputIndex;
        this.elConnection = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        this.elPath = document.createElementNS('http://www.w3.org/2000/svg', "path");
        this.elPath.classList.add("main-path");
        this.elPath.addEventListener('mousedown', this.StartSelected.bind(this));
        this.elPath.addEventListener('touchstart', this.StartSelected.bind(this));
        this.elPath.setAttributeNS(null, 'd', '');
        this.elConnection.classList.add("connection");
        this.elConnection.appendChild(this.elPath);
        this.parent.elCanvas?.appendChild(this.elConnection);
        this.fromNode.AddLine(this);
        this.toNode?.AddLine(this);
        this.update();
    }
    StartSelected(e) {
        this.parent.SelectLine(this);
    }
    createCurvature(start_pos_x, start_pos_y, end_pos_x, end_pos_y, curvature_value, type) {
        let line_x = start_pos_x;
        let line_y = start_pos_y;
        let x = end_pos_x;
        let y = end_pos_y;
        let curvature = curvature_value;
        //type openclose open close other
        switch (type) {
            case 'open':
                if (start_pos_x >= end_pos_x) {
                    var hx1 = line_x + Math.abs(x - line_x) * curvature;
                    var hx2 = x - Math.abs(x - line_x) * (curvature * -1);
                }
                else {
                    var hx1 = line_x + Math.abs(x - line_x) * curvature;
                    var hx2 = x - Math.abs(x - line_x) * curvature;
                }
                return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;
            case 'close':
                if (start_pos_x >= end_pos_x) {
                    var hx1 = line_x + Math.abs(x - line_x) * (curvature * -1);
                    var hx2 = x - Math.abs(x - line_x) * curvature;
                }
                else {
                    var hx1 = line_x + Math.abs(x - line_x) * curvature;
                    var hx2 = x - Math.abs(x - line_x) * curvature;
                }
                return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;
            case 'other':
                if (start_pos_x >= end_pos_x) {
                    var hx1 = line_x + Math.abs(x - line_x) * (curvature * -1);
                    var hx2 = x - Math.abs(x - line_x) * (curvature * -1);
                }
                else {
                    var hx1 = line_x + Math.abs(x - line_x) * curvature;
                    var hx2 = x - Math.abs(x - line_x) * curvature;
                }
                return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;
            default:
                var hx1 = line_x + Math.abs(x - line_x) * curvature;
                var hx2 = x - Math.abs(x - line_x) * curvature;
                return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;
        }
    }
    delete(nodeThis = null) {
        this.elPath?.removeEventListener('mousedown', this.StartSelected.bind(this));
        this.elPath?.removeEventListener('touchstart', this.StartSelected.bind(this));
        if (this.fromNode != nodeThis)
            this.fromNode.RemoveLine(this);
        if (this.toNode != nodeThis)
            this.toNode?.RemoveLine(this);
        this.elConnection?.remove();
        this.elConnection = null;
    }
    updateTo(to_x, to_y) {
        if (this.fromNode.elNode == null)
            return;
        let from_x = this.fromNode.pos_x + this.fromNode.elNode.clientWidth + 5;
        let from_y = this.fromNode.pos_y + (this.fromNode.output() > 1 ? (((this.outputIndex - 1) * 21) + 15) : (2 + this.fromNode.elNode.clientHeight / 2));
        var lineCurve = this.createCurvature(from_x, from_y, to_x, to_y, this.curvature, 'openclose');
        this.elPath.setAttributeNS(null, 'd', lineCurve);
    }
    update() {
        //Postion output
        if (this.toNode && this.toNode.elNode) {
            let to_x = this.toNode.pos_x - 5;
            let to_y = this.toNode.pos_y + this.toNode.elNode.clientHeight / 2;
            this.updateTo(to_x, to_y);
        }
    }
}

class DataFlow {
    node;
    data = {};
    constructor(node) {
        this.node = node;
        setTimeout(() => {
            this.node.elNode?.querySelectorAll(`[node\\:model]`).forEach((item) => {
                item.addEventListener('keyup', this.changeInput.bind(this));
            });
        });
    }
    Set(key, value, obj = null) {
        this.data[key] = value;
        setTimeout(() => {
            this.node.elNode?.querySelectorAll(`[node\\:model="${key}"]`).forEach((item) => {
                if (item != obj)
                    item.value = value;
            });
            this.node.dispatch(this.node.Event.dataChange, { key, value, obj });
            this.node.dispatch(this.node.Event.change, { key, value, obj });
        });
    }
    changeInput(e) {
        this.Set(e.target.getAttribute(`node:model`), e.target.value, e.target);
    }
    load(data) {
        this.data = data || {};
        setTimeout(() => {
            this.node.elNode?.querySelectorAll(`[node\\:model]`).forEach((item) => {
                item.value = this.data[item.getAttribute(`node:model`)] ?? null;
            });
        });
    }
    toJson() {
        return this.data;
    }
}

const geval = eval;
class NodeFlow {
    parent;
    elNode = null;
    elNodeInputs = null;
    elNodeOutputs = null;
    elNodeContent = null;
    nodeId;
    pos_x = 0;
    pos_y = 0;
    arrLine = [];
    option;
    data = null;
    Event = {
        ReUI: "ReUI",
        change: "change",
        updatePosition: "updatePosition",
        selected: "Selected",
        dataChange: "dataChange"
    };
    events;
    on(event, callback) {
        console.log(event);
        this.events.on(event, callback);
    }
    removeListener(event, callback) {
        this.events.removeListener(event, callback);
    }
    dispatch(event, details) {
        this.events.dispatch(event, details);
    }
    toJson() {
        let LineJson = this.arrLine.filter((item) => item.fromNode === this).map((item) => ({
            fromNode: item.fromNode.nodeId,
            toNode: item.toNode?.nodeId,
            ouputIndex: item.outputIndex
        }));
        return {
            id: this.nodeId,
            node: this.option.key,
            line: LineJson,
            data: this.data?.toJson(),
            x: this.pos_x,
            y: this.pos_y
        };
    }
    load(data) {
        this.nodeId = data?.id ?? this.nodeId;
        this.option = this.parent.getOption(data?.node);
        this.data?.load(data?.data);
        this.updatePosition(data?.x, data?.y, true);
        this.initOption();
        return this;
    }
    output() {
        return this.option?.output ?? 0;
    }
    delete(isRemoveParent = true) {
        this.arrLine.forEach((item) => item.delete(this));
        this.elNode?.removeEventListener('mouseover', this.NodeOver.bind(this));
        this.elNode?.removeEventListener('mouseleave', this.NodeLeave.bind(this));
        this.elNode?.removeEventListener('mousedown', this.StartSelected.bind(this));
        this.elNode?.removeEventListener('touchstart', this.StartSelected.bind(this));
        this.elNode?.remove();
        this.arrLine = [];
        if (isRemoveParent)
            this.parent.RemoveNode(this);
        this.dispatch(this.Event.change, {});
    }
    AddLine(line) {
        this.arrLine = [...this.arrLine, line];
        this.dispatch(this.Event.change, {});
    }
    RemoveLine(line) {
        var index = this.arrLine.indexOf(line);
        if (index > -1) {
            this.arrLine.splice(index, 1);
        }
        this.dispatch(this.Event.change, {});
        return this.arrLine;
    }
    constructor(parent, id, option = null) {
        this.events = new EventFlow(this);
        this.option = option;
        this.parent = parent;
        this.nodeId = id;
        this.on(this.Event.change, (e, sender) => {
            this.parent.dispatch(this.parent.Event.change, {
                ...e,
                targetNode: sender
            });
        });
        this.ReUI();
    }
    ReUI() {
        if (this.elNode)
            this.elNode.remove();
        this.elNode = document.createElement('div');
        this.elNode.classList.add("workerflow-node");
        this.elNode.id = `node-${this.nodeId}`;
        this.elNodeInputs = document.createElement('div');
        this.elNodeInputs.classList.add('workerflow-node_inputs');
        this.elNodeInputs.innerHTML = `<div class="inputs dot"></div>`;
        this.elNodeContent = document.createElement('div');
        this.elNodeContent.classList.add('workerflow-node_content');
        this.elNodeOutputs = document.createElement('div');
        this.elNodeOutputs.classList.add('workerflow-node_outputs');
        this.elNodeOutputs.innerHTML = `<div class="outputs dot"></div>`;
        this.elNode.setAttribute('data-node', this.nodeId);
        this.elNode.setAttribute('style', `top: ${this.pos_y}px; left: ${this.pos_x}px;`);
        this.elNode.addEventListener('mouseover', this.NodeOver.bind(this));
        this.elNode.addEventListener('mouseleave', this.NodeLeave.bind(this));
        this.elNode.addEventListener('mousedown', this.StartSelected.bind(this));
        this.elNode.addEventListener('touchstart', this.StartSelected.bind(this));
        this.elNode.appendChild(this.elNodeInputs);
        this.elNode.appendChild(this.elNodeContent);
        this.elNode.appendChild(this.elNodeOutputs);
        this.parent.elCanvas?.appendChild(this.elNode);
        if (this.data) {
            this.data.load(this.data.toJson());
        }
        else {
            this.data = new DataFlow(this);
        }
        this.initOption();
        this.dispatch(this.Event.ReUI, {});
    }
    checkInput() {
        return !(this.option?.input === 0);
    }
    initOption() {
        if (this.elNodeContent && this.option && this.elNodeOutputs) {
            this.elNodeContent.innerHTML = this.option.html;
            if (this.option.output !== undefined) {
                this.elNodeOutputs.innerHTML = '';
                for (let index = 1; index <= this.option.output; index++) {
                    let output = document.createElement('div');
                    output.setAttribute('node', (index).toString());
                    output.classList.add("dot");
                    output.classList.add("output_" + (index));
                    this.elNodeOutputs.appendChild(output);
                }
            }
            if (this.option.input === 0 && this.elNodeInputs) {
                this.elNodeInputs.innerHTML = '';
            }
        }
        setTimeout(() => {
            this.RunScript(this, this.elNode);
        }, 100);
    }
    RunScript(selfNode, el) {
        if (this.option && this.option.script) {
            geval('(node,el)=>{' + this.option.script.toString() + '}')(selfNode, el);
        }
    }
    checkKey(key) {
        return this.option && this.option.key == key;
    }
    NodeOver(e) {
        this.parent.nodeOver = this;
    }
    NodeLeave(e) {
        this.parent.nodeOver = null;
    }
    StartSelected(e) {
        this.parent.SelectNode(this);
        this.dispatch(this.Event.selected, {});
    }
    updatePosition(x, y, iCheck = false) {
        if (this.elNode) {
            if (iCheck) {
                this.pos_x = x;
                this.pos_y = y;
            }
            else {
                this.pos_x = (this.elNode.offsetLeft - x);
                this.pos_y = (this.elNode.offsetTop - y);
            }
            this.elNode.setAttribute('style', `top: ${this.pos_y}px; left: ${this.pos_x}px;`);
            this.arrLine.forEach((item) => {
                item.update();
            });
            this.dispatch(this.Event.updatePosition, { x: this.pos_x, y: this.pos_y });
            this.dispatch(this.Event.change, {});
        }
    }
}

var MoveType;
(function (MoveType) {
    MoveType[MoveType["None"] = 0] = "None";
    MoveType[MoveType["Node"] = 1] = "Node";
    MoveType[MoveType["Canvas"] = 2] = "Canvas";
    MoveType[MoveType["Line"] = 3] = "Line";
})(MoveType || (MoveType = {}));
class ViewFlow {
    elView;
    elCanvas;
    parent;
    nodes = [];
    flgDrap = false;
    flgMove = false;
    moveType = MoveType.None;
    zoom = 1;
    zoom_max = 1.6;
    zoom_min = 0.5;
    zoom_value = 0.1;
    zoom_last_value = 1;
    canvas_x = 0;
    canvas_y = 0;
    pos_x = 0;
    pos_y = 0;
    mouse_x = 0;
    mouse_y = 0;
    lineSelected = null;
    nodeSelected = null;
    nodeOver = null;
    dotSelected = null;
    tempLine = null;
    timeFastClick = 0;
    projectId = "";
    projectName = "";
    tagIngore = ['input', 'button', 'a', 'textarea'];
    Event = {
        change: "change",
        selected: "Selected",
        updateView: "updateView"
    };
    events;
    on(event, callback) {
        this.events.on(event, callback);
    }
    removeListener(event, callback) {
        this.events.removeListener(event, callback);
    }
    dispatch(event, details) {
        this.events.dispatch(event, details);
    }
    constructor(parent) {
        this.parent = parent;
        this.events = new EventFlow(this);
        this.elView = this.parent.container?.querySelector('.workerflow-desgin .workerflow-view') || document.createElement('div');
        this.elCanvas = document.createElement('div');
        this.elCanvas.classList.add("workerflow-canvas");
        this.elView.appendChild(this.elCanvas);
        this.elView.tabIndex = 0;
        this.addEvent();
        this.Reset();
        this.updateView();
    }
    getOption(keyNode) {
        if (!keyNode)
            return;
        let control = this.parent.option.control[keyNode];
        if (!control) {
            control = Object.values(this.parent.option.control)[0];
        }
        control.key = keyNode;
        return control;
    }
    dropEnd(ev) {
        let keyNode = '';
        if (ev.type === "touchend") {
            keyNode = this.parent.dataNodeSelect;
        }
        else {
            ev.preventDefault();
            keyNode = ev.dataTransfer.getData("node");
        }
        let option = this.getOption(keyNode);
        if (option && option.onlyNode) {
            if (this.nodes.filter((item) => item.checkKey(keyNode)).length > 0) {
                return;
            }
        }
        let node = this.AddNode(option);
        let e_pos_x = 0;
        let e_pos_y = 0;
        if (ev.type === "touchmove") {
            e_pos_x = ev.touches[0].clientX;
            e_pos_y = ev.touches[0].clientY;
        }
        else {
            e_pos_x = ev.clientX;
            e_pos_y = ev.clientY;
        }
        let x = this.CalcX(this.elCanvas.getBoundingClientRect().x - e_pos_x);
        let y = this.CalcY(this.elCanvas.getBoundingClientRect().y - e_pos_y);
        node.updatePosition(x, y);
    }
    toJson() {
        let nodes = this.nodes.map((item) => item.toJson());
        return {
            id: this.projectId,
            name: this.projectName,
            x: this.canvas_x,
            y: this.canvas_y,
            zoom: this.zoom,
            nodes
        };
    }
    load(data) {
        this.Reset();
        this.projectId = data?.id ?? this.parent.getUuid();
        this.projectName = data?.name ?? `project-${this.parent.getTime()}`;
        this.canvas_x = data?.x ?? 0;
        this.canvas_y = data?.y ?? 0;
        this.zoom = data?.zoom ?? 1;
        this.nodes = (data?.nodes ?? []).map((item) => {
            return (new NodeFlow(this, "")).load(item);
        });
        (data?.nodes ?? []).forEach((item) => {
            (item.line ?? []).forEach((line) => {
                let fromNode = this.getNodeById(line.fromNode);
                let toNode = this.getNodeById(line.toNode);
                let ouputIndex = line.ouputIndex ?? 0;
                if (fromNode && toNode) {
                    this.AddLine(fromNode, toNode, ouputIndex);
                }
            });
        });
        this.updateView();
    }
    Reset() {
        this.nodes.forEach((item) => item.delete(false));
        this.nodes = [];
        this.projectId = this.parent.getUuid();
        this.projectName = `project-${this.parent.getTime()}`;
        this.canvas_x = 0;
        this.canvas_y = 0;
        this.zoom = 1;
        this.updateView();
    }
    getNodeById(nodeId) {
        return this.nodes?.filter((item) => item.nodeId == nodeId)[0];
    }
    updateView() {
        this.elCanvas.style.transform = "translate(" + this.canvas_x + "px, " + this.canvas_y + "px) scale(" + this.zoom + ")";
        this.dispatch(this.Event.updateView, { x: this.canvas_x, y: this.canvas_y, zoom: this.zoom });
    }
    CalcX(number) {
        return number * (this.elCanvas.clientWidth / (this.elView.clientWidth * this.zoom));
    }
    CalcY(number) {
        return number * (this.elCanvas.clientHeight / (this.elView.clientHeight * this.zoom));
    }
    dragover(e) {
        e.preventDefault();
    }
    UnSelectLine() {
        if (this.lineSelected) {
            this.lineSelected.elPath?.classList.remove('active');
            this.lineSelected = null;
        }
    }
    UnSelectDot() {
        if (this.dotSelected) {
            this.dotSelected.elNode?.classList.remove('active');
            this.dotSelected = null;
        }
    }
    UnSelectNode() {
        if (this.nodeSelected) {
            this.nodeSelected.elNode?.classList.remove('active');
            this.nodeSelected = null;
        }
    }
    UnSelect() {
        this.UnSelectLine();
        this.UnSelectNode();
        this.UnSelectDot();
    }
    SelectLine(node) {
        this.UnSelect();
        this.lineSelected = node;
        this.lineSelected.elPath.classList.add('active');
    }
    SelectNode(node) {
        this.UnSelect();
        this.nodeSelected = node;
        this.nodeSelected.elNode?.classList.add('active');
    }
    SelectDot(node) {
        this.UnSelect();
        this.dotSelected = node;
        this.dotSelected.elNode?.classList.add('active');
    }
    RemoveNode(node) {
        var index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
        return this.nodes;
    }
    AddNode(option = null) {
        let NodeId = option ? option.id : this.parent.getUuid();
        let node = new NodeFlow(this, NodeId ?? this.parent.getUuid(), option);
        this.nodes = [...this.nodes, node];
        return node;
    }
    AddLine(fromNode, toNode, outputIndex = 0) {
        if (fromNode == toNode)
            return;
        if (fromNode.arrLine.filter((item) => {
            return item.toNode === toNode && item.outputIndex == outputIndex && item != this.tempLine;
        }).length > 0) {
            return;
        }
        return new LineFlow(this, fromNode, toNode, outputIndex);
    }
    addEvent() {
        /* Mouse and Touch Actions */
        this.elView.addEventListener('mouseup', this.EndMove.bind(this));
        this.elView.addEventListener('mouseleave', this.EndMove.bind(this));
        this.elView.addEventListener('mousemove', this.Move.bind(this));
        this.elView.addEventListener('mousedown', this.StartMove.bind(this));
        this.elView.addEventListener('touchend', this.EndMove.bind(this));
        this.elView.addEventListener('touchmove', this.Move.bind(this));
        this.elView.addEventListener('touchstart', this.StartMove.bind(this));
        /* Context Menu */
        this.elView.addEventListener('contextmenu', this.contextmenu.bind(this));
        /* Drop Drap */
        this.elView.addEventListener('drop', this.dropEnd.bind(this));
        this.elView.addEventListener('dragover', this.dragover.bind(this));
        /* Zoom Mouse */
        this.elView.addEventListener('wheel', this.zoom_enter.bind(this));
        /* Delete */
        this.elView.addEventListener('keydown', this.keydown.bind(this));
    }
    keydown(e) {
        if (e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey)) {
            e.preventDefault();
            if (this.nodeSelected != null) {
                this.nodeSelected.delete();
                this.nodeSelected = null;
            }
            if (this.lineSelected != null) {
                this.lineSelected.delete();
                this.lineSelected = null;
            }
        }
    }
    zoom_enter(event) {
        if (event.ctrlKey) {
            event.preventDefault();
            if (event.deltaY > 0) {
                // Zoom Out
                this.zoom_out();
            }
            else {
                // Zoom In
                this.zoom_in();
            }
        }
    }
    zoom_refresh() {
        this.canvas_x = (this.canvas_x / this.zoom_last_value) * this.zoom;
        this.canvas_y = (this.canvas_y / this.zoom_last_value) * this.zoom;
        this.zoom_last_value = this.zoom;
        this.updateView();
    }
    zoom_in() {
        if (this.zoom < this.zoom_max) {
            this.zoom += this.zoom_value;
            this.zoom_refresh();
        }
    }
    zoom_out() {
        if (this.zoom > this.zoom_min) {
            this.zoom -= this.zoom_value;
            this.zoom_refresh();
        }
    }
    zoom_reset() {
        if (this.zoom != 1) {
            this.zoom = 1;
            this.zoom_refresh();
        }
    }
    StartMove(e) {
        if (this.tagIngore.includes(e.target.tagName.toLowerCase())) {
            return;
        }
        this.timeFastClick = this.parent.getTime();
        if (this.moveType == MoveType.None) {
            if (this.nodeSelected && this.parent.checkParent(e.target, this.nodeSelected.elNode)) {
                if (e.target.classList.contains('dot')) {
                    if (this.parent.checkParent(e.target, this.nodeSelected.elNodeInputs)) {
                        return;
                    }
                    this.moveType = MoveType.Line;
                    this.tempLine = new LineFlow(this, this.nodeSelected, null);
                    this.tempLine.outputIndex = +(e.target.getAttribute('node'));
                }
                else {
                    this.moveType = MoveType.Node;
                }
            }
            else {
                this.moveType = MoveType.Canvas;
            }
        }
        if (e.type === "touchstart") {
            this.pos_x = e.touches[0].clientX;
            this.pos_y = e.touches[0].clientY;
        }
        else {
            this.pos_x = e.clientX;
            this.pos_y = e.clientY;
        }
        this.flgDrap = true;
        this.flgMove = false;
    }
    Move(e) {
        if (!this.flgDrap)
            return;
        this.flgMove = true;
        let e_pos_x = 0;
        let e_pos_y = 0;
        if (e.type === "touchmove") {
            e_pos_x = e.touches[0].clientX;
            e_pos_y = e.touches[0].clientY;
        }
        else {
            e_pos_x = e.clientX;
            e_pos_y = e.clientY;
        }
        switch (this.moveType) {
            case MoveType.Canvas:
                {
                    let x = this.canvas_x + this.CalcX(-(this.pos_x - e_pos_x));
                    let y = this.canvas_y + this.CalcY(-(this.pos_y - e_pos_y));
                    this.elCanvas.style.transform = "translate(" + x + "px, " + y + "px) scale(" + this.zoom + ")";
                    break;
                }
            case MoveType.Node:
                {
                    let x = this.CalcX(this.pos_x - e_pos_x);
                    let y = this.CalcY(this.pos_y - e_pos_y);
                    this.pos_x = e_pos_x;
                    this.pos_y = e_pos_y;
                    this.nodeSelected?.updatePosition(x, y);
                    break;
                }
            case MoveType.Line:
                {
                    if (this.tempLine) {
                        let x = this.CalcX(this.elCanvas.getBoundingClientRect().x - e_pos_x);
                        let y = this.CalcY(this.elCanvas.getBoundingClientRect().y - e_pos_y);
                        this.tempLine.updateTo(this.elCanvas.offsetLeft - x, this.elCanvas.offsetTop - y);
                        this.tempLine.toNode = this.nodeOver;
                    }
                    break;
                }
        }
        if (e.type === "touchmove") {
            this.mouse_x = e_pos_x;
            this.mouse_y = e_pos_y;
        }
    }
    EndMove(e) {
        //fix Fast Click
        if (((this.parent.getTime() - this.timeFastClick) < 300) || !this.flgDrap && !this.flgMove) {
            this.moveType = MoveType.None;
            this.flgDrap = false;
            this.flgMove = false;
            return;
        }
        this.UnSelect();
        if (this.tempLine && this.moveType == MoveType.Line) {
            if (this.tempLine.toNode && this.tempLine.toNode.checkInput()) {
                this.AddLine(this.tempLine.fromNode, this.tempLine.toNode, this.tempLine.outputIndex);
            }
            this.tempLine.delete();
            this.tempLine = null;
        }
        let e_pos_x = 0;
        let e_pos_y = 0;
        if (e.type === "touchend") {
            e_pos_x = this.mouse_x;
            e_pos_y = this.mouse_y;
        }
        else {
            e_pos_x = e.clientX;
            e_pos_y = e.clientY;
        }
        if (this.moveType === MoveType.Canvas) {
            this.canvas_x = this.canvas_x + this.CalcX(-(this.pos_x - e_pos_x));
            this.canvas_y = this.canvas_y + this.CalcY(-(this.pos_y - e_pos_y));
        }
        this.pos_x = e_pos_x;
        this.pos_y = e_pos_y;
        this.moveType = MoveType.None;
        this.flgDrap = false;
        this.flgMove = false;
    }
    contextmenu(e) {
        e.preventDefault();
    }
}

class WorkerFlow {
    container;
    View;
    Control;
    tab;
    dataNodeSelect = null;
    option;
    events;
    on(event, callback) {
        this.events.on(event, callback);
    }
    removeListener(event, callback) {
        this.events.removeListener(event, callback);
    }
    dispatch(event, details) {
        this.events.dispatch(event, details);
    }
    checkParent(node, nodeCheck) {
        if (node && nodeCheck) {
            if (node == nodeCheck)
                return true;
            let parent = node;
            while ((parent = parent.parentElement) != null) {
                if (nodeCheck == parent) {
                    return true;
                }
            }
        }
        return false;
    }
    constructor(container, option = null) {
        this.container = container;
        this.container.classList.add("workerflow");
        this.option = option || {
            control: {}
        };
        this.container.innerHTML = `
    <div class="workerflow-control">
      <h2 class="workerflow-control__header">Node Control</h2>
      <div class="workerflow-control__list">
      <div draggable="true">Node 1</div>
      </div>
    </div>
    <div class="workerflow-desgin">
      <div class="workerflow-items">
        <div class="workerflow-item">Thông tin mới</div>
        <div class="workerflow-item">Thông tin mới123</div>
      </div>
      <div class="workerflow-view">
      </div>
    </div>
    `;
        this.View = new ViewFlow(this);
        this.tab = new TabFlow(this, []);
        this.Control = new ControlFlow(this);
        this.events = new EventFlow(this);
    }
    new() {
        this.tab?.NewProject();
    }
    load(data) {
        this.tab?.LoadProject(data);
    }
    toJson() {
        return this.View?.toJson();
    }
    getTime() {
        return (new Date()).getTime();
    }
    getUuid() {
        // http://www.ietf.org/rfc/rfc4122.txt
        let s = [];
        let hexDigits = "0123456789abcdef";
        for (let i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";
        let uuid = s.join("");
        return uuid;
    }
}

export { WorkerFlow as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5lcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbXBvbmVudHMvQ29udHJvbEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9UYWJGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvTGluZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9EYXRhRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL05vZGVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVmlld0Zsb3cudHMiLCIuLi9zcmMvV29ya2VyRmxvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xGbG93IHtcbiAgcHJpdmF0ZSBlbENvbnRyb2w6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBwYXJlbnQ6IFdvcmtlckZsb3c7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFdvcmtlckZsb3cpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLmVsQ29udHJvbCA9IHBhcmVudC5jb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWNvbnRyb2xfX2xpc3QnKTtcbiAgICBpZiAodGhpcy5lbENvbnRyb2wpIHtcbiAgICAgIHRoaXMuZWxDb250cm9sLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHBhcmVudC5vcHRpb24uY29udHJvbCk7XG4gICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgbGV0IE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgTm9kZS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICAgIE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBrZXkpO1xuICAgICAgICBOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIik7XG4gICAgICAgIE5vZGUuaW5uZXJIVE1MID0gcGFyZW50Lm9wdGlvbi5jb250cm9sW2tleV0ubmFtZTtcbiAgICAgICAgTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLmRyYWdTdGFydC5iaW5kKHRoaXMpKVxuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgdGhpcy5lbENvbnRyb2w/LmFwcGVuZENoaWxkKE5vZGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkcmFnZW5kKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBkcmFnU3RhcnQoZTogYW55KSB7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuY2xvc2VzdChcIi53b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKSk7XG4gICAgfVxuICB9XG59XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRGbG93IHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IGFueSkge1xuXG4gIH1cbiAgLyogRXZlbnRzICovXG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgZXZlbnQgbmFtZSBtdXN0IGJlIGEgc3RyaW5nLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBldmVudH1gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XG4gICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIGxldCBzZWxmID0gdGhpcy5wYXJlbnQ7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBjb25zb2xlLmVycm9yKGBUaGlzIGV2ZW50OiAke2V2ZW50fSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMsIHNlbGYpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFRhYkZsb3cge1xuICBwcml2YXRlIGVsVGFiOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogV29ya2VyRmxvdywgcHJpdmF0ZSBtb2R1bGVzOiBhbnkgPSB7fSkge1xuICAgIGlmICghdGhpcy5tb2R1bGVzKSB0aGlzLm1vZHVsZXMgPSB7fTtcbiAgICB0aGlzLmVsVGFiID0gcGFyZW50LmNvbnRhaW5lcj8ucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctaXRlbXMnKTtcbiAgICBpZiAodGhpcy5lbFRhYikge1xuICAgICAgdGhpcy5lbFRhYi5pbm5lckhUTUwgPSAnJztcbiAgICB9XG4gICAgdGhpcy5lbFRhYj8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5DbGlja1RhYi5iaW5kKHRoaXMpKTtcbiAgfVxuICBwcml2YXRlIENsaWNrVGFiKGU6IGFueSkge1xuICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3dvcmtlcmZsb3ctaXRlbScpKSB7XG4gICAgICBsZXQgcHJvamVjdElkID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnKTtcbiAgICAgIHRoaXMuTG9hZFByb2plY3RCeUlkKHByb2plY3RJZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBMb2FkUHJvamVjdEJ5SWQocHJvamVjdElkOiBhbnkpIHtcbiAgICB0aGlzLmVsVGFiPy5xdWVyeVNlbGVjdG9yQWxsKCcuYWN0aXZlJykuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgdGhpcy5tb2R1bGVzW2l0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnKT8udG9TdHJpbmcoKSB8fCAnJ10gPSB0aGlzLnBhcmVudC5WaWV3Py50b0pzb24oKTtcbiAgICAgIGl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfSlcbiAgICB0aGlzLmVsVGFiPy5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm9qZWN0PVwiJHtwcm9qZWN0SWR9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIHRoaXMucGFyZW50LlZpZXc/LmxvYWQodGhpcy5tb2R1bGVzW3Byb2plY3RJZF0pO1xuICB9XG4gIHB1YmxpYyBOZXdQcm9qZWN0KCkge1xuICAgIGxldCBkYXRhID0ge1xuICAgICAgaWQ6IHRoaXMucGFyZW50LmdldFV1aWQoKSxcbiAgICAgIG5hbWU6IGBwcm9qZWN0LSR7dGhpcy5wYXJlbnQuZ2V0VGltZSgpfWAsXG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICAgIHpvb206IDEsXG4gICAgICBub2RlczogW11cbiAgICB9XG4gICAgdGhpcy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuICBwdWJsaWMgTG9hZFByb2plY3QoZGF0YTogYW55KSB7XG4gICAgdGhpcy5lbFRhYj8ucXVlcnlTZWxlY3RvckFsbCgnLmFjdGl2ZScpLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIHRoaXMubW9kdWxlc1tpdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0Jyk/LnRvU3RyaW5nKCkgfHwgJyddID0gdGhpcy5wYXJlbnQuVmlldz8udG9Kc29uKCk7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH0pXG4gICAgaWYgKHRoaXMuZWxUYWI/LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3Q9XCIke2RhdGEuaWR9XCJdYCkpIHtcbiAgICAgIHRoaXMuZWxUYWI/LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3Q9XCIke2RhdGEuaWR9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1pdGVtXCIpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIGl0ZW0uaW5uZXJIVE1MID0gZGF0YS5uYW1lO1xuICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdCcsIGRhdGEuaWQpO1xuICAgICAgdGhpcy5lbFRhYj8uYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfVxuICAgIHRoaXMubW9kdWxlc1tkYXRhLmlkXSA9IGRhdGE7XG4gICAgdGhpcy5wYXJlbnQuVmlldz8ubG9hZCh0aGlzLm1vZHVsZXNbZGF0YS5pZF0pO1xuICB9XG5cbn1cbiIsImltcG9ydCB7IE5vZGVGbG93IH0gZnJvbSBcIi4vTm9kZUZsb3dcIjtcbmltcG9ydCB7IFZpZXdGbG93IH0gZnJvbSBcIi4vVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIExpbmVGbG93IHtcbiAgcHVibGljIGVsQ29ubmVjdGlvbjogU1ZHRWxlbWVudCB8IG51bGw7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50O1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFZpZXdGbG93LCBwdWJsaWMgZnJvbU5vZGU6IE5vZGVGbG93LCBwdWJsaWMgdG9Ob2RlOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsLCBwdWJsaWMgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgICB0aGlzLmVsUGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxDb25uZWN0aW9uKTtcbiAgICB0aGlzLmZyb21Ob2RlLkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy50b05vZGU/LkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5TZWxlY3RMaW5lKHRoaXMpO1xuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIGlmICh0aGlzLmZyb21Ob2RlICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy5mcm9tTm9kZS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvTm9kZSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMudG9Ob2RlPy5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uPy5yZW1vdmUoKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IG51bGw7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVRvKHRvX3g6IG51bWJlciwgdG9feTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuZnJvbU5vZGUuZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgZnJvbV94ID0gdGhpcy5mcm9tTm9kZS5wb3NfeCArIHRoaXMuZnJvbU5vZGUuZWxOb2RlLmNsaWVudFdpZHRoICsgNTtcbiAgICBsZXQgZnJvbV95ID0gdGhpcy5mcm9tTm9kZS5wb3NfeSArICh0aGlzLmZyb21Ob2RlLm91dHB1dCgpID4gMSA/ICgoKHRoaXMub3V0cHV0SW5kZXggLSAxKSAqIDIxKSArIDE1KSA6ICgyICsgdGhpcy5mcm9tTm9kZS5lbE5vZGUuY2xpZW50SGVpZ2h0IC8gMikpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZSgpIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG9Ob2RlICYmIHRoaXMudG9Ob2RlLmVsTm9kZSkge1xuICAgICAgbGV0IHRvX3ggPSB0aGlzLnRvTm9kZS5wb3NfeCAtIDU7XG4gICAgICBsZXQgdG9feSA9IHRoaXMudG9Ob2RlLnBvc195ICsgdGhpcy50b05vZGUuZWxOb2RlLmNsaWVudEhlaWdodCAvIDI7XG4gICAgICB0aGlzLnVwZGF0ZVRvKHRvX3gsIHRvX3kpO1xuICAgIH1cblxuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlRmxvdyB9IGZyb20gXCIuL05vZGVGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBEYXRhRmxvdyB7XG4gIHByaXZhdGUgZGF0YTogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIG5vZGU6IE5vZGVGbG93KSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLm5vZGUuZWxOb2RlPy5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5jaGFuZ2VJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIG9iaiA9IG51bGwpIHtcbiAgICB0aGlzLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5ub2RlLmVsTm9kZT8ucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsPVwiJHtrZXl9XCJdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGlmIChpdGVtICE9IG9iailcbiAgICAgICAgICBpdGVtLnZhbHVlID0gdmFsdWU7XG4gICAgICB9KTtcbiAgICAgIHRoaXMubm9kZS5kaXNwYXRjaCh0aGlzLm5vZGUuRXZlbnQuZGF0YUNoYW5nZSwgeyBrZXksIHZhbHVlLCBvYmogfSk7XG4gICAgICB0aGlzLm5vZGUuZGlzcGF0Y2godGhpcy5ub2RlLkV2ZW50LmNoYW5nZSwgeyBrZXksIHZhbHVlLCBvYmogfSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIGNoYW5nZUlucHV0KGU6IGFueSkge1xuICAgIHRoaXMuU2V0KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApLCBlLnRhcmdldC52YWx1ZSwgZS50YXJnZXQpO1xuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwge307XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLm5vZGUuZWxOb2RlPy5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGl0ZW0udmFsdWUgPSB0aGlzLmRhdGFbaXRlbS5nZXRBdHRyaWJ1dGUoYG5vZGU6bW9kZWxgKV0gPz8gbnVsbDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XG5pbXBvcnQgeyBMaW5lRmxvdyB9IGZyb20gXCIuL0xpbmVGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XG5jb25zdCBnZXZhbCA9IGV2YWw7XG5leHBvcnQgY2xhc3MgTm9kZUZsb3cge1xuICBwcml2YXRlIHBhcmVudDogVmlld0Zsb3c7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVJbnB1dHM6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVPdXRwdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZWxOb2RlQ29udGVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIG5vZGVJZDogc3RyaW5nO1xuICBwdWJsaWMgcG9zX3g6IG51bWJlciA9IDA7XG4gIHB1YmxpYyBwb3NfeTogbnVtYmVyID0gMDtcbiAgcHVibGljIGFyckxpbmU6IExpbmVGbG93W10gPSBbXTtcbiAgcHJpdmF0ZSBvcHRpb246IGFueTtcbiAgcHVibGljIGRhdGE6IERhdGFGbG93IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBSZVVJOiBcIlJlVUlcIixcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXG4gICAgdXBkYXRlUG9zaXRpb246IFwidXBkYXRlUG9zaXRpb25cIixcbiAgICBzZWxlY3RlZDogXCJTZWxlY3RlZFwiLFxuICAgIGRhdGFDaGFuZ2U6IFwiZGF0YUNoYW5nZVwiXG4gIH07XG5cbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCBMaW5lSnNvbiA9IHRoaXMuYXJyTGluZS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uZnJvbU5vZGUgPT09IHRoaXMpLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAgIGZyb21Ob2RlOiBpdGVtLmZyb21Ob2RlLm5vZGVJZCxcbiAgICAgIHRvTm9kZTogaXRlbS50b05vZGU/Lm5vZGVJZCxcbiAgICAgIG91cHV0SW5kZXg6IGl0ZW0ub3V0cHV0SW5kZXhcbiAgICB9KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLm5vZGVJZCxcbiAgICAgIG5vZGU6IHRoaXMub3B0aW9uLmtleSxcbiAgICAgIGxpbmU6IExpbmVKc29uLFxuICAgICAgZGF0YTogdGhpcy5kYXRhPy50b0pzb24oKSxcbiAgICAgIHg6IHRoaXMucG9zX3gsXG4gICAgICB5OiB0aGlzLnBvc195XG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMubm9kZUlkID0gZGF0YT8uaWQgPz8gdGhpcy5ub2RlSWQ7XG4gICAgdGhpcy5vcHRpb24gPSB0aGlzLnBhcmVudC5nZXRPcHRpb24oZGF0YT8ubm9kZSk7XG4gICAgdGhpcy5kYXRhPy5sb2FkKGRhdGE/LmRhdGEpO1xuICAgIHRoaXMudXBkYXRlUG9zaXRpb24oZGF0YT8ueCwgZGF0YT8ueSwgdHJ1ZSk7XG4gICAgdGhpcy5pbml0T3B0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIG91dHB1dCgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNSZW1vdmVQYXJlbnQgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuTm9kZUxlYXZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZSgpO1xuICAgIHRoaXMuYXJyTGluZSA9IFtdO1xuICAgIGlmIChpc1JlbW92ZVBhcmVudClcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7fSk7XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBWaWV3RmxvdywgaWQ6IHN0cmluZywgb3B0aW9uOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KHRoaXMpO1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMubm9kZUlkID0gaWQ7XG4gICAgdGhpcy5vbih0aGlzLkV2ZW50LmNoYW5nZSwgKGU6IGFueSwgc2VuZGVyOiBhbnkpID0+IHtcbiAgICAgIHRoaXMucGFyZW50LmRpc3BhdGNoKHRoaXMucGFyZW50LkV2ZW50LmNoYW5nZSwge1xuICAgICAgICAuLi5lLFxuICAgICAgICB0YXJnZXROb2RlOiBzZW5kZXJcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgdGhpcy5SZVVJKCk7XG4gIH1cbiAgcHVibGljIFJlVUkoKSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LW5vZGVcIik7XG4gICAgdGhpcy5lbE5vZGUuaWQgPSBgbm9kZS0ke3RoaXMubm9kZUlkfWA7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfaW5wdXRzJyk7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJpbnB1dHMgZG90XCI+PC9kaXY+YDtcbiAgICB0aGlzLmVsTm9kZUNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZUNvbnRlbnQuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX2NvbnRlbnQnKTtcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX291dHB1dHMnKTtcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJvdXRwdXRzIGRvdFwiPjwvZGl2PmA7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCB0aGlzLm5vZGVJZCk7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5wb3NfeX1weDsgbGVmdDogJHt0aGlzLnBvc194fXB4O2ApO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuTm9kZUxlYXZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlSW5wdXRzKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZUNvbnRlbnQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlT3V0cHV0cyk7XG5cbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcz8uYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIGlmICh0aGlzLmRhdGEpIHtcbiAgICAgIHRoaXMuZGF0YS5sb2FkKHRoaXMuZGF0YS50b0pzb24oKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YSA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5pbml0T3B0aW9uKCk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LlJlVUksIHt9KTtcbiAgfVxuICBwdWJsaWMgY2hlY2tJbnB1dCgpIHtcbiAgICByZXR1cm4gISh0aGlzLm9wdGlvbj8uaW5wdXQgPT09IDApO1xuICB9XG4gIHByaXZhdGUgaW5pdE9wdGlvbigpIHtcblxuICAgIGlmICh0aGlzLmVsTm9kZUNvbnRlbnQgJiYgdGhpcy5vcHRpb24gJiYgdGhpcy5lbE5vZGVPdXRwdXRzKSB7XG4gICAgICB0aGlzLmVsTm9kZUNvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb24uaHRtbDtcbiAgICAgIGlmICh0aGlzLm9wdGlvbi5vdXRwdXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGZvciAobGV0IGluZGV4OiBudW1iZXIgPSAxOyBpbmRleCA8PSB0aGlzLm9wdGlvbi5vdXRwdXQ7IGluZGV4KyspIHtcbiAgICAgICAgICBsZXQgb3V0cHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgb3V0cHV0LnNldEF0dHJpYnV0ZSgnbm9kZScsIChpbmRleCkudG9TdHJpbmcoKSk7XG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJkb3RcIik7XG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJvdXRwdXRfXCIgKyAoaW5kZXgpKTtcbiAgICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHMuYXBwZW5kQ2hpbGQob3V0cHV0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9uLmlucHV0ID09PSAwICYmIHRoaXMuZWxOb2RlSW5wdXRzKSB7XG4gICAgICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9ICcnO1xuICAgICAgfVxuXG4gICAgfVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5SdW5TY3JpcHQodGhpcywgdGhpcy5lbE5vZGUpO1xuICAgIH0sIDEwMCk7XG4gIH1cbiAgcHVibGljIFJ1blNjcmlwdChzZWxmTm9kZTogTm9kZUZsb3csIGVsOiBIVE1MRWxlbWVudCB8IG51bGwpIHtcbiAgICBpZiAodGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24uc2NyaXB0KSB7XG4gICAgICBnZXZhbCgnKG5vZGUsZWwpPT57JyArIHRoaXMub3B0aW9uLnNjcmlwdC50b1N0cmluZygpICsgJ30nKShzZWxmTm9kZSwgZWwpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgY2hlY2tLZXkoa2V5OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24ua2V5ID09IGtleTtcbiAgfVxuICBwdWJsaWMgTm9kZU92ZXIoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQubm9kZU92ZXIgPSB0aGlzO1xuICB9XG4gIHB1YmxpYyBOb2RlTGVhdmUoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQubm9kZU92ZXIgPSBudWxsO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LlNlbGVjdE5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnNlbGVjdGVkLCB7fSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgaWYgKGlDaGVjaykge1xuICAgICAgICB0aGlzLnBvc194ID0geDtcbiAgICAgICAgdGhpcy5wb3NfeSA9IHk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBvc194ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KTtcbiAgICAgICAgdGhpcy5wb3NfeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgLSB5KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMucG9zX3l9cHg7IGxlZnQ6ICR7dGhpcy5wb3NfeH1weDtgKTtcbiAgICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGl0ZW0udXBkYXRlKCk7XG4gICAgICB9KVxuICAgICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnVwZGF0ZVBvc2l0aW9uLCB7IHg6IHRoaXMucG9zX3gsIHk6IHRoaXMucG9zX3kgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7fSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuXG5leHBvcnQgZW51bSBNb3ZlVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb2RlID0gMSxcbiAgQ2FudmFzID0gMixcbiAgTGluZSA9IDMsXG59XG5leHBvcnQgY2xhc3MgVmlld0Zsb3cge1xuICBwcml2YXRlIGVsVmlldzogSFRNTEVsZW1lbnQ7XG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcGFyZW50OiBXb3JrZXJGbG93O1xuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XG4gIHB1YmxpYyBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBmbGdNb3ZlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgcHJpdmF0ZSB6b29tOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIHpvb21fbWF4OiBudW1iZXIgPSAxLjY7XG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcbiAgcHJpdmF0ZSB6b29tX3ZhbHVlOiBudW1iZXIgPSAwLjE7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIGNhbnZhc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGNhbnZhc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBsaW5lU2VsZWN0ZWQ6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbm9kZVNlbGVjdGVkOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgbm9kZU92ZXI6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZG90U2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGltZUZhc3RDbGljazogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwcm9qZWN0SWQ6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgcHJvamVjdE5hbWU6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgdGFnSW5nb3JlID0gWydpbnB1dCcsICdidXR0b24nLCAnYScsICd0ZXh0YXJlYSddO1xuXG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcbiAgICB1cGRhdGVWaWV3OiBcInVwZGF0ZVZpZXdcIlxuICB9O1xuXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KHRoaXMpO1xuICAgIHRoaXMuZWxWaWV3ID0gdGhpcy5wYXJlbnQuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1kZXNnaW4gLndvcmtlcmZsb3ctdmlldycpIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsVmlldy5hcHBlbmRDaGlsZCh0aGlzLmVsQ2FudmFzKTtcbiAgICB0aGlzLmVsVmlldy50YWJJbmRleCA9IDA7XG4gICAgdGhpcy5hZGRFdmVudCgpO1xuICAgIHRoaXMuUmVzZXQoKTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcblxuICB9XG4gIHB1YmxpYyBnZXRPcHRpb24oa2V5Tm9kZTogYW55KSB7XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGNvbnRyb2wgPSB0aGlzLnBhcmVudC5vcHRpb24uY29udHJvbFtrZXlOb2RlXTtcbiAgICBpZiAoIWNvbnRyb2wpIHtcbiAgICAgIGNvbnRyb2wgPSBPYmplY3QudmFsdWVzKHRoaXMucGFyZW50Lm9wdGlvbi5jb250cm9sKVswXTtcbiAgICB9XG4gICAgY29udHJvbC5rZXkgPSBrZXlOb2RlO1xuICAgIHJldHVybiBjb250cm9sO1xuICB9XG4gIHByaXZhdGUgZHJvcEVuZChldjogYW55KSB7XG4gICAgbGV0IGtleU5vZGU6IHN0cmluZyB8IG51bGwgPSAnJztcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBrZXlOb2RlID0gdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xuICAgIH1cbiAgICBsZXQgb3B0aW9uID0gdGhpcy5nZXRPcHRpb24oa2V5Tm9kZSk7XG4gICAgaWYgKG9wdGlvbiAmJiBvcHRpb24ub25seU5vZGUpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVzLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5jaGVja0tleShrZXlOb2RlKSkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBub2RlID0gdGhpcy5BZGROb2RlKG9wdGlvbik7XG5cbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcblxuICAgIG5vZGUudXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgbm9kZXMgPSB0aGlzLm5vZGVzLm1hcCgoaXRlbSkgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLnByb2plY3RJZCxcbiAgICAgIG5hbWU6IHRoaXMucHJvamVjdE5hbWUsXG4gICAgICB4OiB0aGlzLmNhbnZhc194LFxuICAgICAgeTogdGhpcy5jYW52YXNfeSxcbiAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgIG5vZGVzXG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuUmVzZXQoKTtcbiAgICB0aGlzLnByb2plY3RJZCA9IGRhdGE/LmlkID8/IHRoaXMucGFyZW50LmdldFV1aWQoKTtcbiAgICB0aGlzLnByb2plY3ROYW1lID0gZGF0YT8ubmFtZSA/PyBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gO1xuICAgIHRoaXMuY2FudmFzX3ggPSBkYXRhPy54ID8/IDA7XG4gICAgdGhpcy5jYW52YXNfeSA9IGRhdGE/LnkgPz8gMDtcbiAgICB0aGlzLnpvb20gPSBkYXRhPy56b29tID8/IDE7XG4gICAgdGhpcy5ub2RlcyA9IChkYXRhPy5ub2RlcyA/PyBbXSkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiAobmV3IE5vZGVGbG93KHRoaXMsIFwiXCIpKS5sb2FkKGl0ZW0pO1xuICAgIH0pO1xuICAgIChkYXRhPy5ub2RlcyA/PyBbXSkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAoaXRlbS5saW5lID8/IFtdKS5mb3JFYWNoKChsaW5lOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IGZyb21Ob2RlID0gdGhpcy5nZXROb2RlQnlJZChsaW5lLmZyb21Ob2RlKTtcbiAgICAgICAgbGV0IHRvTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQobGluZS50b05vZGUpO1xuICAgICAgICBsZXQgb3VwdXRJbmRleCA9IGxpbmUub3VwdXRJbmRleCA/PyAwO1xuICAgICAgICBpZiAoZnJvbU5vZGUgJiYgdG9Ob2RlKSB7XG4gICAgICAgICAgdGhpcy5BZGRMaW5lKGZyb21Ob2RlLCB0b05vZGUsIG91cHV0SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pO1xuICAgIHRoaXMudXBkYXRlVmlldygpO1xuICB9XG4gIHB1YmxpYyBSZXNldCgpIHtcbiAgICB0aGlzLm5vZGVzLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIHRoaXMucHJvamVjdElkID0gdGhpcy5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIHRoaXMucHJvamVjdE5hbWUgPSBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gO1xuICAgIHRoaXMuY2FudmFzX3ggPSAwO1xuICAgIHRoaXMuY2FudmFzX3kgPSAwO1xuICAgIHRoaXMuem9vbSA9IDE7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIGdldE5vZGVCeUlkKG5vZGVJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZXM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5ub2RlSWQgPT0gbm9kZUlkKVswXTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVmlldygpIHtcbiAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgdGhpcy5jYW52YXNfeCArIFwicHgsIFwiICsgdGhpcy5jYW52YXNfeSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy56b29tICsgXCIpXCI7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnVwZGF0ZVZpZXcsIHsgeDogdGhpcy5jYW52YXNfeCwgeTogdGhpcy5jYW52YXNfeSwgem9vbTogdGhpcy56b29tIH0pO1xuICB9XG4gIHByaXZhdGUgQ2FsY1gobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50V2lkdGggLyAodGhpcy5lbFZpZXcuY2xpZW50V2lkdGggKiB0aGlzLnpvb20pKTtcbiAgfVxuICBwcml2YXRlIENhbGNZKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudEhlaWdodCAvICh0aGlzLmVsVmlldy5jbGllbnRIZWlnaHQgKiB0aGlzLnpvb20pKTtcbiAgfVxuICBwcml2YXRlIGRyYWdvdmVyKGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3RMaW5lKCkge1xuICAgIGlmICh0aGlzLmxpbmVTZWxlY3RlZCkge1xuICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZWxQYXRoPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0RG90KCkge1xuICAgIGlmICh0aGlzLmRvdFNlbGVjdGVkKSB7XG4gICAgICB0aGlzLmRvdFNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0Tm9kZSgpIHtcbiAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZCA9IG51bGw7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBVblNlbGVjdCgpIHtcbiAgICB0aGlzLlVuU2VsZWN0TGluZSgpO1xuICAgIHRoaXMuVW5TZWxlY3ROb2RlKCk7XG4gICAgdGhpcy5VblNlbGVjdERvdCgpO1xuICB9XG4gIHB1YmxpYyBTZWxlY3RMaW5lKG5vZGU6IExpbmVGbG93KSB7XG4gICAgdGhpcy5VblNlbGVjdCgpO1xuICAgIHRoaXMubGluZVNlbGVjdGVkID0gbm9kZTtcbiAgICB0aGlzLmxpbmVTZWxlY3RlZC5lbFBhdGguY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIH1cbiAgcHVibGljIFNlbGVjdE5vZGUobm9kZTogTm9kZUZsb3cpIHtcbiAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBub2RlO1xuICAgIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIH1cbiAgcHVibGljIFNlbGVjdERvdChub2RlOiBOb2RlRmxvdykge1xuICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICB0aGlzLmRvdFNlbGVjdGVkID0gbm9kZTtcbiAgICB0aGlzLmRvdFNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIH1cbiAgcHVibGljIFJlbW92ZU5vZGUobm9kZTogTm9kZUZsb3cpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yobm9kZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubm9kZXM7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUob3B0aW9uOiBhbnkgPSBudWxsKTogTm9kZUZsb3cge1xuICAgIGxldCBOb2RlSWQgPSBvcHRpb24gPyBvcHRpb24uaWQgOiB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XG4gICAgbGV0IG5vZGUgPSBuZXcgTm9kZUZsb3codGhpcywgTm9kZUlkID8/IHRoaXMucGFyZW50LmdldFV1aWQoKSwgb3B0aW9uKTtcbiAgICB0aGlzLm5vZGVzID0gWy4uLnRoaXMubm9kZXMsIG5vZGVdO1xuICAgIHJldHVybiBub2RlO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGZyb21Ob2RlOiBOb2RlRmxvdywgdG9Ob2RlOiBOb2RlRmxvdywgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcbiAgICBpZiAoZnJvbU5vZGUgPT0gdG9Ob2RlKSByZXR1cm47XG4gICAgaWYgKGZyb21Ob2RlLmFyckxpbmUuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICByZXR1cm4gaXRlbS50b05vZGUgPT09IHRvTm9kZSAmJiBpdGVtLm91dHB1dEluZGV4ID09IG91dHB1dEluZGV4ICYmIGl0ZW0gIT0gdGhpcy50ZW1wTGluZTtcbiAgICB9KS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBuZXcgTGluZUZsb3codGhpcywgZnJvbU5vZGUsIHRvTm9kZSwgb3V0cHV0SW5kZXgpO1xuICB9XG4gIHB1YmxpYyBhZGRFdmVudCgpIHtcbiAgICAvKiBNb3VzZSBhbmQgVG91Y2ggQWN0aW9ucyAqL1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuICAgIC8qIENvbnRleHQgTWVudSAqL1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcblxuICAgIC8qIERyb3AgRHJhcCAqL1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLmRyb3BFbmQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCB0aGlzLmRyYWdvdmVyLmJpbmQodGhpcykpO1xuICAgIC8qIFpvb20gTW91c2UgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuem9vbV9lbnRlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBEZWxldGUgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG4gIHB1YmxpYyBrZXlkb3duKGU6IGFueSkge1xuICAgIGlmIChlLmtleSA9PT0gJ0RlbGV0ZScgfHwgKGUua2V5ID09PSAnQmFja3NwYWNlJyAmJiBlLm1ldGFLZXkpKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkLmRlbGV0ZSgpO1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZC5kZWxldGUoKTtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMuem9vbV9vdXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFpvb20gSW5cbiAgICAgICAgdGhpcy56b29tX2luKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX3JlZnJlc2goKSB7XG4gICAgdGhpcy5jYW52YXNfeCA9ICh0aGlzLmNhbnZhc194IC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGhpcy56b29tO1xuICAgIHRoaXMuY2FudmFzX3kgPSAodGhpcy5jYW52YXNfeSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRoaXMuem9vbTtcbiAgICB0aGlzLnpvb21fbGFzdF92YWx1ZSA9IHRoaXMuem9vbTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgfVxuICBwdWJsaWMgem9vbV9pbigpIHtcbiAgICBpZiAodGhpcy56b29tIDwgdGhpcy56b29tX21heCkge1xuICAgICAgdGhpcy56b29tICs9IHRoaXMuem9vbV92YWx1ZTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX291dCgpIHtcbiAgICBpZiAodGhpcy56b29tID4gdGhpcy56b29tX21pbikge1xuICAgICAgdGhpcy56b29tIC09IHRoaXMuem9vbV92YWx1ZTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX3Jlc2V0KCkge1xuICAgIGlmICh0aGlzLnpvb20gIT0gMSkge1xuICAgICAgdGhpcy56b29tID0gMTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIFN0YXJ0TW92ZShlOiBhbnkpIHtcbiAgICBpZiAodGhpcy50YWdJbmdvcmUuaW5jbHVkZXMoZS50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSB0aGlzLnBhcmVudC5nZXRUaW1lKCk7XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTm9uZSkge1xuICAgICAgaWYgKHRoaXMubm9kZVNlbGVjdGVkICYmIHRoaXMucGFyZW50LmNoZWNrUGFyZW50KGUudGFyZ2V0LCB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGUpKSB7XG4gICAgICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2RvdCcpKSB7XG4gICAgICAgICAgaWYgKHRoaXMucGFyZW50LmNoZWNrUGFyZW50KGUudGFyZ2V0LCB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGVJbnB1dHMpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xuICAgICAgICAgIHRoaXMudGVtcExpbmUgPSBuZXcgTGluZUZsb3codGhpcywgdGhpcy5ub2RlU2VsZWN0ZWQsIG51bGwpO1xuICAgICAgICAgIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXggPSArKGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9kZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkNhbnZhcztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIHRoaXMuZmxnRHJhcCA9IHRydWU7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIE1vdmUoZTogYW55KSB7XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICB0aGlzLmZsZ01vdmUgPSB0cnVlO1xuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGUuY2xpZW50WTtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLm1vdmVUeXBlKSB7XG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5jYW52YXNfeCArIHRoaXMuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLmNhbnZhc195ICsgdGhpcy5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcbiAgICAgICAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgeCArIFwicHgsIFwiICsgeSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy56b29tICsgXCIpXCI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5DYWxjWCh0aGlzLnBvc194IC0gZV9wb3NfeCk7XG4gICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcbiAgICAgICAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICAgICAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZD8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMuQ2FsY1kodGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnVwZGF0ZVRvKHRoaXMuZWxDYW52YXMub2Zmc2V0TGVmdCAtIHgsIHRoaXMuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnRvTm9kZSA9IHRoaXMubm9kZU92ZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcbiAgICAgIHRoaXMubW91c2VfeSA9IGVfcG9zX3k7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBFbmRNb3ZlKGU6IGFueSkge1xuICAgIC8vZml4IEZhc3QgQ2xpY2tcbiAgICBpZiAoKCh0aGlzLnBhcmVudC5nZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMzAwKSB8fCAhdGhpcy5mbGdEcmFwICYmICF0aGlzLmZsZ01vdmUpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgaWYgKHRoaXMudGVtcExpbmUgJiYgdGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5MaW5lKSB7XG4gICAgICBpZiAodGhpcy50ZW1wTGluZS50b05vZGUgJiYgdGhpcy50ZW1wTGluZS50b05vZGUuY2hlY2tJbnB1dCgpKSB7XG4gICAgICAgIHRoaXMuQWRkTGluZSh0aGlzLnRlbXBMaW5lLmZyb21Ob2RlLCB0aGlzLnRlbXBMaW5lLnRvTm9kZSwgdGhpcy50ZW1wTGluZS5vdXRwdXRJbmRleCk7XG4gICAgICB9XG4gICAgICB0aGlzLnRlbXBMaW5lLmRlbGV0ZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZSA9IG51bGw7XG4gICAgfVxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBlX3Bvc194ID0gdGhpcy5tb3VzZV94O1xuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIHRoaXMuY2FudmFzX3ggPSB0aGlzLmNhbnZhc194ICsgdGhpcy5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSk7XG4gICAgICB0aGlzLmNhbnZhc195ID0gdGhpcy5jYW52YXNfeSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpO1xuICAgIH1cbiAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwdWJsaWMgY29udGV4dG1lbnUoZTogYW55KSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBDb250cm9sRmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvQ29udHJvbEZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvRXZlbnRGbG93XCI7XG5pbXBvcnQgeyBUYWJGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9UYWJGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlckZsb3cge1xuXG4gIHB1YmxpYyBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgcHVibGljIFZpZXc6IFZpZXdGbG93IHwgbnVsbDtcbiAgcHVibGljIENvbnRyb2w6IENvbnRyb2xGbG93IHwgbnVsbDtcbiAgcHVibGljIHRhYjogVGFiRmxvdyB8IG51bGw7XG4gIHB1YmxpYyBkYXRhTm9kZVNlbGVjdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBvcHRpb246IGFueTtcblxuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cblxuICBwdWJsaWMgY2hlY2tQYXJlbnQobm9kZTogYW55LCBub2RlQ2hlY2s6IGFueSkge1xuICAgIGlmIChub2RlICYmIG5vZGVDaGVjaykge1xuICAgICAgaWYgKG5vZGUgPT0gbm9kZUNoZWNrKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGxldCBwYXJlbnQ6IGFueSA9IG5vZGU7XG4gICAgICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50KSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChub2RlQ2hlY2sgPT0gcGFyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvd1wiKTtcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbiB8fCB7XG4gICAgICBjb250cm9sOiB7XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbFwiPlxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sX19oZWFkZXJcIj5Ob2RlIENvbnRyb2w8L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbF9fbGlzdFwiPlxuICAgICAgPGRpdiBkcmFnZ2FibGU9XCJ0cnVlXCI+Tm9kZSAxPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1kZXNnaW5cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1zXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1cIj5UaMO0bmcgdGluIG3hu5tpPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1cIj5UaMO0bmcgdGluIG3hu5tpMTIzPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXZpZXdcIj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGA7XG4gICAgdGhpcy5WaWV3ID0gbmV3IFZpZXdGbG93KHRoaXMpO1xuICAgIHRoaXMudGFiID0gbmV3IFRhYkZsb3codGhpcywgW10pO1xuICAgIHRoaXMuQ29udHJvbCA9IG5ldyBDb250cm9sRmxvdyh0aGlzKTtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3codGhpcyk7XG4gIH1cbiAgcHVibGljIG5ldygpIHtcbiAgICB0aGlzLnRhYj8uTmV3UHJvamVjdCgpO1xuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMudGFiPy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIHJldHVybiB0aGlzLlZpZXc/LnRvSnNvbigpO1xuICB9XG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gIH1cbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcbiAgICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICAgIGxldCBzOiBhbnkgPSBbXTtcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XG4gICAgfVxuICAgIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7ICAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICAgIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICAgIHJldHVybiB1dWlkO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7TUFFYSxXQUFXLENBQUE7QUFDZCxJQUFBLFNBQVMsQ0FBaUM7QUFDMUMsSUFBQSxNQUFNLENBQWE7QUFDM0IsSUFBQSxXQUFBLENBQW1CLE1BQWtCLEVBQUE7QUFDbkMsUUFBQSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDOUUsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2xC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
