
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
    Set(key, Value, obj = null) {
        this.data[key] = Value;
        setTimeout(() => {
            this.node.elNode?.querySelectorAll(`[node\\:model="${key}"]`).forEach((item) => {
                if (item != obj)
                    item.value = Value;
            });
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
    }
    AddLine(line) {
        this.arrLine = [...this.arrLine, line];
    }
    RemoveLine(line) {
        var index = this.arrLine.indexOf(line);
        if (index > -1) {
            this.arrLine.splice(index, 1);
        }
        return this.arrLine;
    }
    constructor(parent, id, option = null) {
        this.option = option;
        this.parent = parent;
        this.nodeId = id;
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
        this.data = new DataFlow(this);
        this.initOption();
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
    constructor(parent) {
        this.parent = parent;
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
    events = {};
    option;
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
        this.new();
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
        let self = this;
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

export { WorkerFlow as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5lcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbXBvbmVudHMvQ29udHJvbEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9UYWJGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvTGluZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9EYXRhRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL05vZGVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVmlld0Zsb3cudHMiLCIuLi9zcmMvV29ya2VyRmxvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xGbG93IHtcbiAgcHJpdmF0ZSBlbENvbnRyb2w6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBwYXJlbnQ6IFdvcmtlckZsb3c7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFdvcmtlckZsb3cpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLmVsQ29udHJvbCA9IHBhcmVudC5jb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWNvbnRyb2xfX2xpc3QnKTtcbiAgICBpZiAodGhpcy5lbENvbnRyb2wpIHtcbiAgICAgIHRoaXMuZWxDb250cm9sLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHBhcmVudC5vcHRpb24uY29udHJvbCk7XG4gICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgbGV0IE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgTm9kZS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICAgIE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBrZXkpO1xuICAgICAgICBOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIik7XG4gICAgICAgIE5vZGUuaW5uZXJIVE1MID0gcGFyZW50Lm9wdGlvbi5jb250cm9sW2tleV0ubmFtZTtcbiAgICAgICAgTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLmRyYWdTdGFydC5iaW5kKHRoaXMpKVxuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgdGhpcy5lbENvbnRyb2w/LmFwcGVuZENoaWxkKE5vZGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkcmFnZW5kKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBkcmFnU3RhcnQoZTogYW55KSB7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuY2xvc2VzdChcIi53b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFRhYkZsb3cge1xuICBwcml2YXRlIGVsVGFiOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogV29ya2VyRmxvdywgcHJpdmF0ZSBtb2R1bGVzOiBhbnkgPSB7fSkge1xuICAgIGlmICghdGhpcy5tb2R1bGVzKSB0aGlzLm1vZHVsZXMgPSB7fTtcbiAgICB0aGlzLmVsVGFiID0gcGFyZW50LmNvbnRhaW5lcj8ucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctaXRlbXMnKTtcbiAgICBpZiAodGhpcy5lbFRhYikge1xuICAgICAgdGhpcy5lbFRhYi5pbm5lckhUTUwgPSAnJztcbiAgICB9XG4gICAgdGhpcy5lbFRhYj8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5DbGlja1RhYi5iaW5kKHRoaXMpKTtcbiAgfVxuICBwcml2YXRlIENsaWNrVGFiKGU6IGFueSkge1xuICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3dvcmtlcmZsb3ctaXRlbScpKSB7XG4gICAgICBsZXQgcHJvamVjdElkID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnKTtcbiAgICAgIHRoaXMuTG9hZFByb2plY3RCeUlkKHByb2plY3RJZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBMb2FkUHJvamVjdEJ5SWQocHJvamVjdElkOiBhbnkpIHtcbiAgICB0aGlzLmVsVGFiPy5xdWVyeVNlbGVjdG9yQWxsKCcuYWN0aXZlJykuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgdGhpcy5tb2R1bGVzW2l0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnKT8udG9TdHJpbmcoKSB8fCAnJ10gPSB0aGlzLnBhcmVudC5WaWV3Py50b0pzb24oKTtcbiAgICAgIGl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfSlcbiAgICB0aGlzLmVsVGFiPy5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm9qZWN0PVwiJHtwcm9qZWN0SWR9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIHRoaXMucGFyZW50LlZpZXc/LmxvYWQodGhpcy5tb2R1bGVzW3Byb2plY3RJZF0pO1xuICB9XG4gIHB1YmxpYyBOZXdQcm9qZWN0KCkge1xuICAgIGxldCBkYXRhID0ge1xuICAgICAgaWQ6IHRoaXMucGFyZW50LmdldFV1aWQoKSxcbiAgICAgIG5hbWU6IGBwcm9qZWN0LSR7dGhpcy5wYXJlbnQuZ2V0VGltZSgpfWAsXG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICAgIHpvb206IDEsXG4gICAgICBub2RlczogW11cbiAgICB9XG4gICAgdGhpcy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuICBwdWJsaWMgTG9hZFByb2plY3QoZGF0YTogYW55KSB7XG4gICAgdGhpcy5lbFRhYj8ucXVlcnlTZWxlY3RvckFsbCgnLmFjdGl2ZScpLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIHRoaXMubW9kdWxlc1tpdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0Jyk/LnRvU3RyaW5nKCkgfHwgJyddID0gdGhpcy5wYXJlbnQuVmlldz8udG9Kc29uKCk7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH0pXG4gICAgaWYgKHRoaXMuZWxUYWI/LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3Q9XCIke2RhdGEuaWR9XCJdYCkpIHtcbiAgICAgIHRoaXMuZWxUYWI/LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3Q9XCIke2RhdGEuaWR9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1pdGVtXCIpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIGl0ZW0uaW5uZXJIVE1MID0gZGF0YS5uYW1lO1xuICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdCcsIGRhdGEuaWQpO1xuICAgICAgdGhpcy5lbFRhYj8uYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfVxuICAgIHRoaXMubW9kdWxlc1tkYXRhLmlkXSA9IGRhdGE7XG4gICAgdGhpcy5wYXJlbnQuVmlldz8ubG9hZCh0aGlzLm1vZHVsZXNbZGF0YS5pZF0pO1xuICB9XG5cbn1cbiIsImltcG9ydCB7IE5vZGVGbG93IH0gZnJvbSBcIi4vTm9kZUZsb3dcIjtcbmltcG9ydCB7IFZpZXdGbG93IH0gZnJvbSBcIi4vVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIExpbmVGbG93IHtcbiAgcHVibGljIGVsQ29ubmVjdGlvbjogU1ZHRWxlbWVudCB8IG51bGw7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50O1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFZpZXdGbG93LCBwdWJsaWMgZnJvbU5vZGU6IE5vZGVGbG93LCBwdWJsaWMgdG9Ob2RlOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsLCBwdWJsaWMgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgICB0aGlzLmVsUGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxDb25uZWN0aW9uKTtcbiAgICB0aGlzLmZyb21Ob2RlLkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy50b05vZGU/LkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5TZWxlY3RMaW5lKHRoaXMpO1xuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIGlmICh0aGlzLmZyb21Ob2RlICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy5mcm9tTm9kZS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvTm9kZSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMudG9Ob2RlPy5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uPy5yZW1vdmUoKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IG51bGw7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVRvKHRvX3g6IG51bWJlciwgdG9feTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuZnJvbU5vZGUuZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgZnJvbV94ID0gdGhpcy5mcm9tTm9kZS5wb3NfeCArIHRoaXMuZnJvbU5vZGUuZWxOb2RlLmNsaWVudFdpZHRoICsgNTtcbiAgICBsZXQgZnJvbV95ID0gdGhpcy5mcm9tTm9kZS5wb3NfeSArICh0aGlzLmZyb21Ob2RlLm91dHB1dCgpID4gMSA/ICgoKHRoaXMub3V0cHV0SW5kZXggLSAxKSAqIDIxKSArIDE1KSA6ICgyICsgdGhpcy5mcm9tTm9kZS5lbE5vZGUuY2xpZW50SGVpZ2h0IC8gMikpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZSgpIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG9Ob2RlICYmIHRoaXMudG9Ob2RlLmVsTm9kZSkge1xuICAgICAgbGV0IHRvX3ggPSB0aGlzLnRvTm9kZS5wb3NfeCAtIDU7XG4gICAgICBsZXQgdG9feSA9IHRoaXMudG9Ob2RlLnBvc195ICsgdGhpcy50b05vZGUuZWxOb2RlLmNsaWVudEhlaWdodCAvIDI7XG4gICAgICB0aGlzLnVwZGF0ZVRvKHRvX3gsIHRvX3kpO1xuICAgIH1cblxuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlRmxvdyB9IGZyb20gXCIuL05vZGVGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBEYXRhRmxvdyB7XG4gIHByaXZhdGUgZGF0YTogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIG5vZGU6IE5vZGVGbG93KSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLm5vZGUuZWxOb2RlPy5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5jaGFuZ2VJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIFZhbHVlOiBhbnksIG9iaiA9IG51bGwpIHtcbiAgICB0aGlzLmRhdGFba2V5XSA9IFZhbHVlO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5ub2RlLmVsTm9kZT8ucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsPVwiJHtrZXl9XCJdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGlmIChpdGVtICE9IG9iailcbiAgICAgICAgICBpdGVtLnZhbHVlID0gVmFsdWU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgY2hhbmdlSW5wdXQoZTogYW55KSB7XG4gICAgdGhpcy5TZXQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKGBub2RlOm1vZGVsYCksIGUudGFyZ2V0LnZhbHVlLCBlLnRhcmdldCk7XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5kYXRhID0gZGF0YSB8fCB7fTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMubm9kZS5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbF1gKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgaXRlbS52YWx1ZSA9IHRoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXSA/PyBudWxsO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBMaW5lRmxvdyB9IGZyb20gXCIuL0xpbmVGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XG5jb25zdCBnZXZhbCA9IGV2YWw7XG5leHBvcnQgY2xhc3MgTm9kZUZsb3cge1xuICBwcml2YXRlIHBhcmVudDogVmlld0Zsb3c7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVJbnB1dHM6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVPdXRwdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZWxOb2RlQ29udGVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIG5vZGVJZDogc3RyaW5nO1xuICBwdWJsaWMgcG9zX3g6IG51bWJlciA9IDA7XG4gIHB1YmxpYyBwb3NfeTogbnVtYmVyID0gMDtcbiAgcHVibGljIGFyckxpbmU6IExpbmVGbG93W10gPSBbXTtcbiAgcHJpdmF0ZSBvcHRpb246IGFueTtcbiAgcHVibGljIGRhdGE6IERhdGFGbG93IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgbGV0IExpbmVKc29uID0gdGhpcy5hcnJMaW5lLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5mcm9tTm9kZSA9PT0gdGhpcykubWFwKChpdGVtKSA9PiAoe1xuICAgICAgZnJvbU5vZGU6IGl0ZW0uZnJvbU5vZGUubm9kZUlkLFxuICAgICAgdG9Ob2RlOiBpdGVtLnRvTm9kZT8ubm9kZUlkLFxuICAgICAgb3VwdXRJbmRleDogaXRlbS5vdXRwdXRJbmRleFxuICAgIH0pKTtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHRoaXMubm9kZUlkLFxuICAgICAgbm9kZTogdGhpcy5vcHRpb24ua2V5LFxuICAgICAgbGluZTogTGluZUpzb24sXG4gICAgICBkYXRhOiB0aGlzLmRhdGE/LnRvSnNvbigpLFxuICAgICAgeDogdGhpcy5wb3NfeCxcbiAgICAgIHk6IHRoaXMucG9zX3lcbiAgICB9XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5ub2RlSWQgPSBkYXRhPy5pZCA/PyB0aGlzLm5vZGVJZDtcbiAgICB0aGlzLm9wdGlvbiA9IHRoaXMucGFyZW50LmdldE9wdGlvbihkYXRhPy5ub2RlKTtcbiAgICB0aGlzLmRhdGE/LmxvYWQoZGF0YT8uZGF0YSk7XG4gICAgdGhpcy51cGRhdGVQb3NpdGlvbihkYXRhPy54LCBkYXRhPy55LCB0cnVlKTtcbiAgICB0aGlzLmluaXRPcHRpb24oKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBwdWJsaWMgb3V0cHV0KCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbj8ub3V0cHV0ID8/IDA7XG4gIH1cbiAgcHVibGljIGRlbGV0ZShpc1JlbW92ZVBhcmVudCA9IHRydWUpIHtcbiAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4gaXRlbS5kZWxldGUodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLk5vZGVPdmVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlKCk7XG4gICAgdGhpcy5hcnJMaW5lID0gW107XG4gICAgaWYgKGlzUmVtb3ZlUGFyZW50KVxuICAgICAgdGhpcy5wYXJlbnQuUmVtb3ZlTm9kZSh0aGlzKTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShsaW5lOiBMaW5lRmxvdykge1xuICAgIHRoaXMuYXJyTGluZSA9IFsuLi50aGlzLmFyckxpbmUsIGxpbmVdO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcnJMaW5lO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFZpZXdGbG93LCBpZDogc3RyaW5nLCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbjtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLm5vZGVJZCA9IGlkO1xuICAgIHRoaXMuUmVVSSgpO1xuICB9XG4gIHB1YmxpYyBSZVVJKCkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkgdGhpcy5lbE5vZGUucmVtb3ZlKCk7XG4gICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1ub2RlXCIpO1xuICAgIHRoaXMuZWxOb2RlLmlkID0gYG5vZGUtJHt0aGlzLm5vZGVJZH1gO1xuICAgIHRoaXMuZWxOb2RlSW5wdXRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX2lucHV0cycpO1xuICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiaW5wdXRzIGRvdFwiPjwvZGl2PmA7XG4gICAgdGhpcy5lbE5vZGVDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGVDb250ZW50LmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9jb250ZW50Jyk7XG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9vdXRwdXRzJyk7XG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwib3V0cHV0cyBkb3RcIj48L2Rpdj5gO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgdGhpcy5ub2RlSWQpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMucG9zX3l9cHg7IGxlZnQ6ICR7dGhpcy5wb3NfeH1weDtgKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLk5vZGVPdmVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLk5vZGVMZWF2ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZUlucHV0cyk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVDb250ZW50KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZU91dHB1dHMpO1xuXG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICB0aGlzLmRhdGEgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gICAgdGhpcy5pbml0T3B0aW9uKCk7XG5cbiAgfVxuICBwdWJsaWMgY2hlY2tJbnB1dCgpIHtcbiAgICByZXR1cm4gISh0aGlzLm9wdGlvbj8uaW5wdXQgPT09IDApO1xuICB9XG4gIHByaXZhdGUgaW5pdE9wdGlvbigpIHtcblxuICAgIGlmICh0aGlzLmVsTm9kZUNvbnRlbnQgJiYgdGhpcy5vcHRpb24gJiYgdGhpcy5lbE5vZGVPdXRwdXRzKSB7XG4gICAgICB0aGlzLmVsTm9kZUNvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb24uaHRtbDtcbiAgICAgIGlmICh0aGlzLm9wdGlvbi5vdXRwdXQgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgdGhpcy5lbE5vZGVPdXRwdXRzLmlubmVySFRNTCA9ICcnO1xuICAgICAgICBmb3IgKGxldCBpbmRleDogbnVtYmVyID0gMTsgaW5kZXggPD0gdGhpcy5vcHRpb24ub3V0cHV0OyBpbmRleCsrKSB7XG4gICAgICAgICAgbGV0IG91dHB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgIG91dHB1dC5zZXRBdHRyaWJ1dGUoJ25vZGUnLCAoaW5kZXgpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIG91dHB1dC5jbGFzc0xpc3QuYWRkKFwiZG90XCIpO1xuICAgICAgICAgIG91dHB1dC5jbGFzc0xpc3QuYWRkKFwib3V0cHV0X1wiICsgKGluZGV4KSk7XG4gICAgICAgICAgdGhpcy5lbE5vZGVPdXRwdXRzLmFwcGVuZENoaWxkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbi5pbnB1dCA9PT0gMCAmJiB0aGlzLmVsTm9kZUlucHV0cykge1xuICAgICAgICB0aGlzLmVsTm9kZUlucHV0cy5pbm5lckhUTUwgPSAnJztcbiAgICAgIH1cblxuICAgIH1cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuUnVuU2NyaXB0KHRoaXMsIHRoaXMuZWxOb2RlKTtcbiAgICB9LCAxMDApO1xuICB9XG4gIHB1YmxpYyBSdW5TY3JpcHQoc2VsZk5vZGU6IE5vZGVGbG93LCBlbDogSFRNTEVsZW1lbnQgfCBudWxsKSB7XG4gICAgaWYgKHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLnNjcmlwdCkge1xuICAgICAgZ2V2YWwoJyhub2RlLGVsKT0+eycgKyB0aGlzLm9wdGlvbi5zY3JpcHQudG9TdHJpbmcoKSArICd9Jykoc2VsZk5vZGUsIGVsKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGNoZWNrS2V5KGtleTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLmtleSA9PSBrZXk7XG4gIH1cbiAgcHVibGljIE5vZGVPdmVyKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gdGhpcztcbiAgfVxuICBwdWJsaWMgTm9kZUxlYXZlKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gbnVsbDtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5TZWxlY3ROb2RlKHRoaXMpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVQb3NpdGlvbih4OiBhbnksIHk6IGFueSwgaUNoZWNrID0gZmFsc2UpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGlmIChpQ2hlY2spIHtcbiAgICAgICAgdGhpcy5wb3NfeCA9IHg7XG4gICAgICAgIHRoaXMucG9zX3kgPSB5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wb3NfeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0IC0geCk7XG4gICAgICAgIHRoaXMucG9zX3kgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSk7XG4gICAgICB9XG4gICAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLnBvc195fXB4OyBsZWZ0OiAke3RoaXMucG9zX3h9cHg7YCk7XG4gICAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLnVwZGF0ZSgpO1xuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuXG5leHBvcnQgZW51bSBNb3ZlVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb2RlID0gMSxcbiAgQ2FudmFzID0gMixcbiAgTGluZSA9IDMsXG59XG5leHBvcnQgY2xhc3MgVmlld0Zsb3cge1xuICBwcml2YXRlIGVsVmlldzogSFRNTEVsZW1lbnQ7XG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcGFyZW50OiBXb3JrZXJGbG93O1xuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XG4gIHB1YmxpYyBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBmbGdNb3ZlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgcHJpdmF0ZSB6b29tOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIHpvb21fbWF4OiBudW1iZXIgPSAxLjY7XG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcbiAgcHJpdmF0ZSB6b29tX3ZhbHVlOiBudW1iZXIgPSAwLjE7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIGNhbnZhc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGNhbnZhc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBsaW5lU2VsZWN0ZWQ6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbm9kZVNlbGVjdGVkOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgbm9kZU92ZXI6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZG90U2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGltZUZhc3RDbGljazogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwcm9qZWN0SWQ6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgcHJvamVjdE5hbWU6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgdGFnSW5nb3JlID0gWydpbnB1dCcsICdidXR0b24nLCAnYScsICd0ZXh0YXJlYSddO1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5lbFZpZXcgPSB0aGlzLnBhcmVudC5jb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWRlc2dpbiAud29ya2VyZmxvdy12aWV3JykgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctY2FudmFzXCIpO1xuICAgIHRoaXMuZWxWaWV3LmFwcGVuZENoaWxkKHRoaXMuZWxDYW52YXMpO1xuICAgIHRoaXMuZWxWaWV3LnRhYkluZGV4ID0gMDtcbiAgICB0aGlzLmFkZEV2ZW50KCk7XG4gICAgdGhpcy5SZXNldCgpO1xuICAgIHRoaXMudXBkYXRlVmlldygpO1xuXG4gIH1cbiAgcHVibGljIGdldE9wdGlvbihrZXlOb2RlOiBhbnkpIHtcbiAgICBpZiAoIWtleU5vZGUpIHJldHVybjtcbiAgICBsZXQgY29udHJvbCA9IHRoaXMucGFyZW50Lm9wdGlvbi5jb250cm9sW2tleU5vZGVdO1xuICAgIGlmICghY29udHJvbCkge1xuICAgICAgY29udHJvbCA9IE9iamVjdC52YWx1ZXModGhpcy5wYXJlbnQub3B0aW9uLmNvbnRyb2wpWzBdO1xuICAgIH1cbiAgICBjb250cm9sLmtleSA9IGtleU5vZGU7XG4gICAgcmV0dXJuIGNvbnRyb2w7XG4gIH1cbiAgcHJpdmF0ZSBkcm9wRW5kKGV2OiBhbnkpIHtcbiAgICBsZXQga2V5Tm9kZTogc3RyaW5nIHwgbnVsbCA9ICcnO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGtleU5vZGUgPSB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGtleU5vZGUgPSBldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcIm5vZGVcIik7XG4gICAgfVxuICAgIGxldCBvcHRpb24gPSB0aGlzLmdldE9wdGlvbihrZXlOb2RlKTtcbiAgICBpZiAob3B0aW9uICYmIG9wdGlvbi5vbmx5Tm9kZSkge1xuICAgICAgaWYgKHRoaXMubm9kZXMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmNoZWNrS2V5KGtleU5vZGUpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IG5vZGUgPSB0aGlzLkFkZE5vZGUob3B0aW9uKTtcblxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuXG4gICAgbm9kZS51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCBub2RlcyA9IHRoaXMubm9kZXMubWFwKChpdGVtKSA9PiBpdGVtLnRvSnNvbigpKTtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHRoaXMucHJvamVjdElkLFxuICAgICAgbmFtZTogdGhpcy5wcm9qZWN0TmFtZSxcbiAgICAgIHg6IHRoaXMuY2FudmFzX3gsXG4gICAgICB5OiB0aGlzLmNhbnZhc195LFxuICAgICAgem9vbTogdGhpcy56b29tLFxuICAgICAgbm9kZXNcbiAgICB9XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5SZXNldCgpO1xuICAgIHRoaXMucHJvamVjdElkID0gZGF0YT8uaWQgPz8gdGhpcy5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIHRoaXMucHJvamVjdE5hbWUgPSBkYXRhPy5uYW1lID8/IGBwcm9qZWN0LSR7dGhpcy5wYXJlbnQuZ2V0VGltZSgpfWA7XG4gICAgdGhpcy5jYW52YXNfeCA9IGRhdGE/LnggPz8gMDtcbiAgICB0aGlzLmNhbnZhc195ID0gZGF0YT8ueSA/PyAwO1xuICAgIHRoaXMuem9vbSA9IGRhdGE/Lnpvb20gPz8gMTtcbiAgICB0aGlzLm5vZGVzID0gKGRhdGE/Lm5vZGVzID8/IFtdKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgcmV0dXJuIChuZXcgTm9kZUZsb3codGhpcywgXCJcIikpLmxvYWQoaXRlbSk7XG4gICAgfSk7XG4gICAgKGRhdGE/Lm5vZGVzID8/IFtdKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIChpdGVtLmxpbmUgPz8gW10pLmZvckVhY2goKGxpbmU6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZnJvbU5vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUuZnJvbU5vZGUpO1xuICAgICAgICBsZXQgdG9Ob2RlID0gdGhpcy5nZXROb2RlQnlJZChsaW5lLnRvTm9kZSk7XG4gICAgICAgIGxldCBvdXB1dEluZGV4ID0gbGluZS5vdXB1dEluZGV4ID8/IDA7XG4gICAgICAgIGlmIChmcm9tTm9kZSAmJiB0b05vZGUpIHtcbiAgICAgICAgICB0aGlzLkFkZExpbmUoZnJvbU5vZGUsIHRvTm9kZSwgb3VwdXRJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSk7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIFJlc2V0KCkge1xuICAgIHRoaXMubm9kZXMuZm9yRWFjaCgoaXRlbSkgPT4gaXRlbS5kZWxldGUoZmFsc2UpKTtcbiAgICB0aGlzLm5vZGVzID0gW107XG4gICAgdGhpcy5wcm9qZWN0SWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XG4gICAgdGhpcy5wcm9qZWN0TmFtZSA9IGBwcm9qZWN0LSR7dGhpcy5wYXJlbnQuZ2V0VGltZSgpfWA7XG4gICAgdGhpcy5jYW52YXNfeCA9IDA7XG4gICAgdGhpcy5jYW52YXNfeSA9IDA7XG4gICAgdGhpcy56b29tID0gMTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUJ5SWQobm9kZUlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5ub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLm5vZGVJZCA9PSBub2RlSWQpWzBdO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVWaWV3KCkge1xuICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyB0aGlzLmNhbnZhc194ICsgXCJweCwgXCIgKyB0aGlzLmNhbnZhc195ICsgXCJweCkgc2NhbGUoXCIgKyB0aGlzLnpvb20gKyBcIilcIjtcbiAgfVxuICBwcml2YXRlIENhbGNYKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudFdpZHRoIC8gKHRoaXMuZWxWaWV3LmNsaWVudFdpZHRoICogdGhpcy56b29tKSk7XG4gIH1cbiAgcHJpdmF0ZSBDYWxjWShudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRIZWlnaHQgLyAodGhpcy5lbFZpZXcuY2xpZW50SGVpZ2h0ICogdGhpcy56b29tKSk7XG4gIH1cbiAgcHJpdmF0ZSBkcmFnb3ZlcihlOiBhbnkpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0TGluZSgpIHtcbiAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkLmVsUGF0aD8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG51bGw7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBVblNlbGVjdERvdCgpIHtcbiAgICBpZiAodGhpcy5kb3RTZWxlY3RlZCkge1xuICAgICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5kb3RTZWxlY3RlZCA9IG51bGw7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBVblNlbGVjdE5vZGUoKSB7XG4gICAgaWYgKHRoaXMubm9kZVNlbGVjdGVkKSB7XG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgVW5TZWxlY3QoKSB7XG4gICAgdGhpcy5VblNlbGVjdExpbmUoKTtcbiAgICB0aGlzLlVuU2VsZWN0Tm9kZSgpO1xuICAgIHRoaXMuVW5TZWxlY3REb3QoKTtcbiAgfVxuICBwdWJsaWMgU2VsZWN0TGluZShub2RlOiBMaW5lRmxvdykge1xuICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG5vZGU7XG4gICAgdGhpcy5saW5lU2VsZWN0ZWQuZWxQYXRoLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICB9XG4gIHB1YmxpYyBTZWxlY3ROb2RlKG5vZGU6IE5vZGVGbG93KSB7XG4gICAgdGhpcy5VblNlbGVjdCgpO1xuICAgIHRoaXMubm9kZVNlbGVjdGVkID0gbm9kZTtcbiAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICB9XG4gIHB1YmxpYyBTZWxlY3REb3Qobm9kZTogTm9kZUZsb3cpIHtcbiAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgdGhpcy5kb3RTZWxlY3RlZCA9IG5vZGU7XG4gICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVOb2RlKG5vZGU6IE5vZGVGbG93KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlKG9wdGlvbjogYW55ID0gbnVsbCk6IE5vZGVGbG93IHtcbiAgICBsZXQgTm9kZUlkID0gb3B0aW9uID8gb3B0aW9uLmlkIDogdGhpcy5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIGxldCBub2RlID0gbmV3IE5vZGVGbG93KHRoaXMsIE5vZGVJZCA/PyB0aGlzLnBhcmVudC5nZXRVdWlkKCksIG9wdGlvbik7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShmcm9tTm9kZTogTm9kZUZsb3csIHRvTm9kZTogTm9kZUZsb3csIG91dHB1dEluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGZyb21Ob2RlID09IHRvTm9kZSkgcmV0dXJuO1xuICAgIGlmIChmcm9tTm9kZS5hcnJMaW5lLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgcmV0dXJuIGl0ZW0udG9Ob2RlID09PSB0b05vZGUgJiYgaXRlbS5vdXRwdXRJbmRleCA9PSBvdXRwdXRJbmRleCAmJiBpdGVtICE9IHRoaXMudGVtcExpbmU7XG4gICAgfSkubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IExpbmVGbG93KHRoaXMsIGZyb21Ob2RlLCB0b05vZGUsIG91dHB1dEluZGV4KTtcbiAgfVxuICBwdWJsaWMgYWRkRXZlbnQoKSB7XG4gICAgLyogTW91c2UgYW5kIFRvdWNoIEFjdGlvbnMgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcbiAgICAvKiBDb250ZXh0IE1lbnUgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLnpvb21fZW50ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogRGVsZXRlICovXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5ZG93bi5iaW5kKHRoaXMpKTtcbiAgfVxuICBwdWJsaWMga2V5ZG93bihlOiBhbnkpIHtcbiAgICBpZiAoZS5rZXkgPT09ICdEZWxldGUnIHx8IChlLmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgZS5tZXRhS2V5KSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZC5kZWxldGUoKTtcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubGluZVNlbGVjdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZGVsZXRlKCk7XG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21fZW50ZXIoZXZlbnQ6IGFueSkge1xuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAoZXZlbnQuZGVsdGFZID4gMCkge1xuICAgICAgICAvLyBab29tIE91dFxuICAgICAgICB0aGlzLnpvb21fb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBab29tIEluXG4gICAgICAgIHRoaXMuem9vbV9pbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9yZWZyZXNoKCkge1xuICAgIHRoaXMuY2FudmFzX3ggPSAodGhpcy5jYW52YXNfeCAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRoaXMuem9vbTtcbiAgICB0aGlzLmNhbnZhc195ID0gKHRoaXMuY2FudmFzX3kgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0aGlzLnpvb207XG4gICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0aGlzLnpvb207XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIHpvb21faW4oKSB7XG4gICAgaWYgKHRoaXMuem9vbSA8IHRoaXMuem9vbV9tYXgpIHtcbiAgICAgIHRoaXMuem9vbSArPSB0aGlzLnpvb21fdmFsdWU7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9vdXQoKSB7XG4gICAgaWYgKHRoaXMuem9vbSA+IHRoaXMuem9vbV9taW4pIHtcbiAgICAgIHRoaXMuem9vbSAtPSB0aGlzLnpvb21fdmFsdWU7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICBpZiAodGhpcy56b29tICE9IDEpIHtcbiAgICAgIHRoaXMuem9vbSA9IDE7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBTdGFydE1vdmUoZTogYW55KSB7XG4gICAgaWYgKHRoaXMudGFnSW5nb3JlLmluY2x1ZGVzKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gdGhpcy5wYXJlbnQuZ2V0VGltZSgpO1xuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vbmUpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAmJiB0aGlzLnBhcmVudC5jaGVja1BhcmVudChlLnRhcmdldCwgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlKSkge1xuICAgICAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdkb3QnKSkge1xuICAgICAgICAgIGlmICh0aGlzLnBhcmVudC5jaGVja1BhcmVudChlLnRhcmdldCwgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlSW5wdXRzKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmVGbG93KHRoaXMsIHRoaXMubm9kZVNlbGVjdGVkLCBudWxsKTtcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lLm91dHB1dEluZGV4ID0gKyhlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vZGU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBvc194ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBNb3ZlKGU6IGFueSkge1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgdGhpcy5mbGdNb3ZlID0gdHJ1ZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuY2FudmFzX3ggKyB0aGlzLkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgICAgIGxldCB5ID0gdGhpcy5jYW52YXNfeSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHggKyBcInB4LCBcIiArIHkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuem9vbSArIFwiKVwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLk5vZGU6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLnBvc195IC0gZV9wb3NfeSk7XG4gICAgICAgICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQ/LnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLkxpbmU6XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgICAgICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLmVsQ2FudmFzLm9mZnNldExlZnQgLSB4LCB0aGlzLmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS50b05vZGUgPSB0aGlzLm5vZGVPdmVyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIHRoaXMubW91c2VfeCA9IGVfcG9zX3g7XG4gICAgICB0aGlzLm1vdXNlX3kgPSBlX3Bvc195O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgRW5kTW92ZShlOiBhbnkpIHtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgodGhpcy5wYXJlbnQuZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDMwMCkgfHwgIXRoaXMuZmxnRHJhcCAmJiAhdGhpcy5mbGdNb3ZlKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5VblNlbGVjdCgpO1xuICAgIGlmICh0aGlzLnRlbXBMaW5lICYmIHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTGluZSkge1xuICAgICAgaWYgKHRoaXMudGVtcExpbmUudG9Ob2RlICYmIHRoaXMudGVtcExpbmUudG9Ob2RlLmNoZWNrSW5wdXQoKSkge1xuICAgICAgICB0aGlzLkFkZExpbmUodGhpcy50ZW1wTGluZS5mcm9tTm9kZSwgdGhpcy50ZW1wTGluZS50b05vZGUsIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXgpO1xuICAgICAgfVxuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSBudWxsO1xuICAgIH1cbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICB0aGlzLmNhbnZhc194ID0gdGhpcy5jYW52YXNfeCArIHRoaXMuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpO1xuICAgICAgdGhpcy5jYW52YXNfeSA9IHRoaXMuY2FudmFzX3kgKyB0aGlzLkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKTtcbiAgICB9XG4gICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIGNvbnRleHRtZW51KGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgQ29udHJvbEZsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL0NvbnRyb2xGbG93XCI7XG5pbXBvcnQgeyBUYWJGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9UYWJGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlckZsb3cge1xuXG4gIHB1YmxpYyBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgcHVibGljIFZpZXc6IFZpZXdGbG93IHwgbnVsbDtcbiAgcHVibGljIENvbnRyb2w6IENvbnRyb2xGbG93IHwgbnVsbDtcbiAgcHVibGljIHRhYjogVGFiRmxvdyB8IG51bGw7XG4gIHB1YmxpYyBkYXRhTm9kZVNlbGVjdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZXZlbnRzOiBhbnkgPSB7fTtcbiAgcHVibGljIG9wdGlvbjogYW55O1xuXG4gIHB1YmxpYyBjaGVja1BhcmVudChub2RlOiBhbnksIG5vZGVDaGVjazogYW55KSB7XG4gICAgaWYgKG5vZGUgJiYgbm9kZUNoZWNrKSB7XG4gICAgICBpZiAobm9kZSA9PSBub2RlQ2hlY2spIHJldHVybiB0cnVlO1xuICAgICAgbGV0IHBhcmVudDogYW55ID0gbm9kZTtcbiAgICAgIHdoaWxlICgocGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQpICE9IG51bGwpIHtcbiAgICAgICAgaWYgKG5vZGVDaGVjayA9PSBwYXJlbnQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG9wdGlvbjogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93XCIpO1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uIHx8IHtcbiAgICAgIGNvbnRyb2w6IHtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sXCI+XG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2hlYWRlclwiPk5vZGUgQ29udHJvbDwvaDI+XG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sX19saXN0XCI+XG4gICAgICA8ZGl2IGRyYWdnYWJsZT1cInRydWVcIj5Ob2RlIDE8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWRlc2dpblwiPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctaXRlbXNcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctaXRlbVwiPlRow7RuZyB0aW4gbeG7m2k8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctaXRlbVwiPlRow7RuZyB0aW4gbeG7m2kxMjM8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctdmlld1wiPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgYDtcbiAgICB0aGlzLlZpZXcgPSBuZXcgVmlld0Zsb3codGhpcyk7XG4gICAgdGhpcy50YWIgPSBuZXcgVGFiRmxvdyh0aGlzLCBbXSk7XG4gICAgdGhpcy5Db250cm9sID0gbmV3IENvbnRyb2xGbG93KHRoaXMpO1xuICAgIHRoaXMubmV3KCk7XG4gIH1cbiAgcHVibGljIG5ldygpIHtcbiAgICB0aGlzLnRhYj8uTmV3UHJvamVjdCgpO1xuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMudGFiPy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIHJldHVybiB0aGlzLlZpZXc/LnRvSnNvbigpO1xuICB9XG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gIH1cbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcbiAgICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICAgIGxldCBzOiBhbnkgPSBbXTtcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XG4gICAgfVxuICAgIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7ICAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICAgIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICAgIHJldHVybiB1dWlkO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcbiAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xuICAgICAgICBsaXN0ZW5lcnM6IFtdXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG5cbiAgICBpZiAoIXRoaXMuZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXG4gICAgY29uc3QgbGlzdGVuZXJJbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKVxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXG4gIH1cblxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBjb25zb2xlLmVycm9yKGBUaGlzIGV2ZW50OiAke2V2ZW50fSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMsIHNlbGYpO1xuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7TUFFYSxXQUFXLENBQUE7QUFDZCxJ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
