
  /**
   * @license
   * author: Nguyen Van Hau
   * workerflow.js v0.0.1
   * Released under the MIT license.
   */

'use strict';

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

module.exports = WorkerFlow;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5janMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb25lbnRzL0NvbnRyb2xGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVGFiRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0xpbmVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9Ob2RlRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL1ZpZXdGbG93LnRzIiwiLi4vc3JjL1dvcmtlckZsb3cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sRmxvdyB7XG4gIHByaXZhdGUgZWxDb250cm9sOiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgcGFyZW50OiBXb3JrZXJGbG93O1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5lbENvbnRyb2wgPSBwYXJlbnQuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1jb250cm9sX19saXN0Jyk7XG4gICAgaWYgKHRoaXMuZWxDb250cm9sKSB7XG4gICAgICB0aGlzLmVsQ29udHJvbC5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwYXJlbnQub3B0aW9uLmNvbnRyb2wpO1xuICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGxldCBOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIE5vZGUuc2V0QXR0cmlidXRlKCdkcmFnZ2FibGUnLCAndHJ1ZScpO1xuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywga2V5KTtcbiAgICAgICAgTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1jb250cm9sX19pdGVtXCIpO1xuICAgICAgICBOb2RlLmlubmVySFRNTCA9IHBhcmVudC5vcHRpb24uY29udHJvbFtrZXldLm5hbWU7XG4gICAgICAgIE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcbiAgICAgICAgTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW5kJywgdGhpcy5kcmFnZW5kLmJpbmQodGhpcykpXG4gICAgICAgIHRoaXMuZWxDb250cm9sPy5hcHBlbmRDaGlsZChOb2RlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZHJhZ2VuZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdCA9IG51bGw7XG4gIH1cblxuICBwdWJsaWMgZHJhZ1N0YXJ0KGU6IGFueSkge1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdCA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIud29ya2VyZmxvdy1jb250cm9sX19pdGVtXCIpLmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJub2RlXCIsIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJykpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBUYWJGbG93IHtcbiAgcHJpdmF0ZSBlbFRhYjogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFdvcmtlckZsb3csIHByaXZhdGUgbW9kdWxlczogYW55ID0ge30pIHtcbiAgICBpZiAoIXRoaXMubW9kdWxlcykgdGhpcy5tb2R1bGVzID0ge307XG4gICAgdGhpcy5lbFRhYiA9IHBhcmVudC5jb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWl0ZW1zJyk7XG4gICAgaWYgKHRoaXMuZWxUYWIpIHtcbiAgICAgIHRoaXMuZWxUYWIuaW5uZXJIVE1MID0gJyc7XG4gICAgfVxuICAgIHRoaXMuZWxUYWI/LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuQ2xpY2tUYWIuYmluZCh0aGlzKSk7XG4gIH1cbiAgcHJpdmF0ZSBDbGlja1RhYihlOiBhbnkpIHtcbiAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCd3b3JrZXJmbG93LWl0ZW0nKSkge1xuICAgICAgbGV0IHByb2plY3RJZCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0Jyk7XG4gICAgICB0aGlzLkxvYWRQcm9qZWN0QnlJZChwcm9qZWN0SWQpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgTG9hZFByb2plY3RCeUlkKHByb2plY3RJZDogYW55KSB7XG4gICAgdGhpcy5lbFRhYj8ucXVlcnlTZWxlY3RvckFsbCgnLmFjdGl2ZScpLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIHRoaXMubW9kdWxlc1tpdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0Jyk/LnRvU3RyaW5nKCkgfHwgJyddID0gdGhpcy5wYXJlbnQuVmlldz8udG9Kc29uKCk7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH0pXG4gICAgdGhpcy5lbFRhYj8ucXVlcnlTZWxlY3RvcihgW2RhdGEtcHJvamVjdD1cIiR7cHJvamVjdElkfVwiXWApPy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB0aGlzLnBhcmVudC5WaWV3Py5sb2FkKHRoaXMubW9kdWxlc1twcm9qZWN0SWRdKTtcbiAgfVxuICBwdWJsaWMgTmV3UHJvamVjdCgpIHtcbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgIGlkOiB0aGlzLnBhcmVudC5nZXRVdWlkKCksXG4gICAgICBuYW1lOiBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gLFxuICAgICAgeDogMCxcbiAgICAgIHk6IDAsXG4gICAgICB6b29tOiAxLFxuICAgICAgbm9kZXM6IFtdXG4gICAgfVxuICAgIHRoaXMuTG9hZFByb2plY3QoZGF0YSk7XG4gIH1cbiAgcHVibGljIExvYWRQcm9qZWN0KGRhdGE6IGFueSkge1xuICAgIHRoaXMuZWxUYWI/LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY3RpdmUnKS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICB0aGlzLm1vZHVsZXNbaXRlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdCcpPy50b1N0cmluZygpIHx8ICcnXSA9IHRoaXMucGFyZW50LlZpZXc/LnRvSnNvbigpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9KVxuICAgIGlmICh0aGlzLmVsVGFiPy5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm9qZWN0PVwiJHtkYXRhLmlkfVwiXWApKSB7XG4gICAgICB0aGlzLmVsVGFiPy5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm9qZWN0PVwiJHtkYXRhLmlkfVwiXWApPy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGl0ZW0uY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctaXRlbVwiKTtcbiAgICAgIGl0ZW0uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICBpdGVtLmlubmVySFRNTCA9IGRhdGEubmFtZTtcbiAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnLCBkYXRhLmlkKTtcbiAgICAgIHRoaXMuZWxUYWI/LmFwcGVuZENoaWxkKGl0ZW0pO1xuICAgIH1cbiAgICB0aGlzLm1vZHVsZXNbZGF0YS5pZF0gPSBkYXRhO1xuICAgIHRoaXMucGFyZW50LlZpZXc/LmxvYWQodGhpcy5tb2R1bGVzW2RhdGEuaWRdKTtcbiAgfVxuXG59XG4iLCJpbXBvcnQgeyBOb2RlRmxvdyB9IGZyb20gXCIuL05vZGVGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lRmxvdyB7XG4gIHB1YmxpYyBlbENvbm5lY3Rpb246IFNWR0VsZW1lbnQgfCBudWxsO1xuICBwdWJsaWMgZWxQYXRoOiBTVkdQYXRoRWxlbWVudDtcbiAgcHJpdmF0ZSBjdXJ2YXR1cmU6IG51bWJlciA9IDAuNTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBWaWV3RmxvdywgcHVibGljIGZyb21Ob2RlOiBOb2RlRmxvdywgcHVibGljIHRvTm9kZTogTm9kZUZsb3cgfCBudWxsID0gbnVsbCwgcHVibGljIG91dHB1dEluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJzdmdcIik7XG4gICAgdGhpcy5lbFBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJwYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoXCJtYWluLXBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCAnJyk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24uY2xhc3NMaXN0LmFkZChcImNvbm5lY3Rpb25cIik7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24uYXBwZW5kQ2hpbGQodGhpcy5lbFBhdGgpO1xuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzPy5hcHBlbmRDaGlsZCh0aGlzLmVsQ29ubmVjdGlvbik7XG4gICAgdGhpcy5mcm9tTm9kZS5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudG9Ob2RlPy5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQuU2VsZWN0TGluZSh0aGlzKTtcbiAgfVxuICBwcml2YXRlIGNyZWF0ZUN1cnZhdHVyZShzdGFydF9wb3NfeDogbnVtYmVyLCBzdGFydF9wb3NfeTogbnVtYmVyLCBlbmRfcG9zX3g6IG51bWJlciwgZW5kX3Bvc195OiBudW1iZXIsIGN1cnZhdHVyZV92YWx1ZTogbnVtYmVyLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBsZXQgbGluZV94ID0gc3RhcnRfcG9zX3g7XG4gICAgbGV0IGxpbmVfeSA9IHN0YXJ0X3Bvc195O1xuICAgIGxldCB4ID0gZW5kX3Bvc194O1xuICAgIGxldCB5ID0gZW5kX3Bvc195O1xuICAgIGxldCBjdXJ2YXR1cmUgPSBjdXJ2YXR1cmVfdmFsdWU7XG4gICAgLy90eXBlIG9wZW5jbG9zZSBvcGVuIGNsb3NlIG90aGVyXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG5cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb3RoZXInOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcblxuICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG5cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZGVsZXRlKG5vZGVUaGlzOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICBpZiAodGhpcy5mcm9tTm9kZSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbU5vZGUuUmVtb3ZlTGluZSh0aGlzKTtcbiAgICBpZiAodGhpcy50b05vZGUgIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLnRvTm9kZT8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24gPSBudWxsO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVUbyh0b194OiBudW1iZXIsIHRvX3k6IG51bWJlcikge1xuICAgIGlmICh0aGlzLmZyb21Ob2RlLmVsTm9kZSA9PSBudWxsKSByZXR1cm47XG4gICAgbGV0IGZyb21feCA9IHRoaXMuZnJvbU5vZGUucG9zX3ggKyB0aGlzLmZyb21Ob2RlLmVsTm9kZS5jbGllbnRXaWR0aCArIDU7XG4gICAgbGV0IGZyb21feSA9IHRoaXMuZnJvbU5vZGUucG9zX3kgKyAodGhpcy5mcm9tTm9kZS5vdXRwdXQoKSA+IDEgPyAoKCh0aGlzLm91dHB1dEluZGV4IC0gMSkgKiAyMSkgKyAxNSkgOiAoMiArIHRoaXMuZnJvbU5vZGUuZWxOb2RlLmNsaWVudEhlaWdodCAvIDIpKTtcbiAgICB2YXIgbGluZUN1cnZlID0gdGhpcy5jcmVhdGVDdXJ2YXR1cmUoZnJvbV94LCBmcm9tX3ksIHRvX3gsIHRvX3ksIHRoaXMuY3VydmF0dXJlLCAnb3BlbmNsb3NlJyk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCBsaW5lQ3VydmUpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGUoKSB7XG4gICAgLy9Qb3N0aW9uIG91dHB1dFxuICAgIGlmICh0aGlzLnRvTm9kZSAmJiB0aGlzLnRvTm9kZS5lbE5vZGUpIHtcbiAgICAgIGxldCB0b194ID0gdGhpcy50b05vZGUucG9zX3ggLSA1O1xuICAgICAgbGV0IHRvX3kgPSB0aGlzLnRvTm9kZS5wb3NfeSArIHRoaXMudG9Ob2RlLmVsTm9kZS5jbGllbnRIZWlnaHQgLyAyO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG5cbiAgfVxufVxuIiwiaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgRGF0YUZsb3cge1xuICBwcml2YXRlIGRhdGE6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBub2RlOiBOb2RlRmxvdykge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5ub2RlLmVsTm9kZT8ucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsXWApLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuY2hhbmdlSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgU2V0KGtleTogc3RyaW5nLCBWYWx1ZTogYW55LCBvYmogPSBudWxsKSB7XG4gICAgdGhpcy5kYXRhW2tleV0gPSBWYWx1ZTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMubm9kZS5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbD1cIiR7a2V5fVwiXWApLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICBpZiAoaXRlbSAhPSBvYmopXG4gICAgICAgICAgaXRlbS52YWx1ZSA9IFZhbHVlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIGNoYW5nZUlucHV0KGU6IGFueSkge1xuICAgIHRoaXMuU2V0KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApLCBlLnRhcmdldC52YWx1ZSwgZS50YXJnZXQpO1xuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwge307XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLm5vZGUuZWxOb2RlPy5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGl0ZW0udmFsdWUgPSB0aGlzLmRhdGFbaXRlbS5nZXRBdHRyaWJ1dGUoYG5vZGU6bW9kZWxgKV0gPz8gbnVsbDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9WaWV3Rmxvd1wiO1xuY29uc3QgZ2V2YWwgPSBldmFsO1xuZXhwb3J0IGNsYXNzIE5vZGVGbG93IHtcbiAgcHJpdmF0ZSBwYXJlbnQ6IFZpZXdGbG93O1xuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZWxOb2RlSW5wdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZWxOb2RlT3V0cHV0czogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGVsTm9kZUNvbnRlbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBub2RlSWQ6IHN0cmluZztcbiAgcHVibGljIHBvc194OiBudW1iZXIgPSAwO1xuICBwdWJsaWMgcG9zX3k6IG51bWJlciA9IDA7XG4gIHB1YmxpYyBhcnJMaW5lOiBMaW5lRmxvd1tdID0gW107XG4gIHByaXZhdGUgb3B0aW9uOiBhbnk7XG4gIHB1YmxpYyBkYXRhOiBEYXRhRmxvdyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCBMaW5lSnNvbiA9IHRoaXMuYXJyTGluZS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uZnJvbU5vZGUgPT09IHRoaXMpLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAgIGZyb21Ob2RlOiBpdGVtLmZyb21Ob2RlLm5vZGVJZCxcbiAgICAgIHRvTm9kZTogaXRlbS50b05vZGU/Lm5vZGVJZCxcbiAgICAgIG91cHV0SW5kZXg6IGl0ZW0ub3V0cHV0SW5kZXhcbiAgICB9KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLm5vZGVJZCxcbiAgICAgIG5vZGU6IHRoaXMub3B0aW9uLmtleSxcbiAgICAgIGxpbmU6IExpbmVKc29uLFxuICAgICAgZGF0YTogdGhpcy5kYXRhPy50b0pzb24oKSxcbiAgICAgIHg6IHRoaXMucG9zX3gsXG4gICAgICB5OiB0aGlzLnBvc195XG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMubm9kZUlkID0gZGF0YT8uaWQgPz8gdGhpcy5ub2RlSWQ7XG4gICAgdGhpcy5vcHRpb24gPSB0aGlzLnBhcmVudC5nZXRPcHRpb24oZGF0YT8ubm9kZSk7XG4gICAgdGhpcy5kYXRhPy5sb2FkKGRhdGE/LmRhdGEpO1xuICAgIHRoaXMudXBkYXRlUG9zaXRpb24oZGF0YT8ueCwgZGF0YT8ueSwgdHJ1ZSk7XG4gICAgdGhpcy5pbml0T3B0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIG91dHB1dCgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNSZW1vdmVQYXJlbnQgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuTm9kZUxlYXZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZSgpO1xuICAgIHRoaXMuYXJyTGluZSA9IFtdO1xuICAgIGlmIChpc1JlbW92ZVBhcmVudClcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XG4gIH1cbiAgcHVibGljIEFkZExpbmUobGluZTogTGluZUZsb3cpIHtcbiAgICB0aGlzLmFyckxpbmUgPSBbLi4udGhpcy5hcnJMaW5lLCBsaW5lXTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lRmxvdykge1xuICAgIHZhciBpbmRleCA9IHRoaXMuYXJyTGluZS5pbmRleE9mKGxpbmUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBWaWV3RmxvdywgaWQ6IHN0cmluZywgb3B0aW9uOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5vcHRpb24gPSBvcHRpb247XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5ub2RlSWQgPSBpZDtcbiAgICB0aGlzLlJlVUkoKTtcbiAgfVxuICBwdWJsaWMgUmVVSSgpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHRoaXMuZWxOb2RlLnJlbW92ZSgpO1xuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctbm9kZVwiKTtcbiAgICB0aGlzLmVsTm9kZS5pZCA9IGBub2RlLSR7dGhpcy5ub2RlSWR9YDtcbiAgICB0aGlzLmVsTm9kZUlucHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlSW5wdXRzLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9pbnB1dHMnKTtcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImlucHV0cyBkb3RcIj48L2Rpdj5gO1xuICAgIHRoaXMuZWxOb2RlQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlQ29udGVudC5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfY29udGVudCcpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfb3V0cHV0cycpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIm91dHB1dHMgZG90XCI+PC9kaXY+YDtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScsIHRoaXMubm9kZUlkKTtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLnBvc195fXB4OyBsZWZ0OiAke3RoaXMucG9zX3h9cHg7YCk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVJbnB1dHMpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlQ29udGVudCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVPdXRwdXRzKTtcblxuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzPy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5kYXRhID0gbmV3IERhdGFGbG93KHRoaXMpO1xuICAgIHRoaXMuaW5pdE9wdGlvbigpO1xuXG4gIH1cbiAgcHVibGljIGNoZWNrSW5wdXQoKSB7XG4gICAgcmV0dXJuICEodGhpcy5vcHRpb24/LmlucHV0ID09PSAwKTtcbiAgfVxuICBwcml2YXRlIGluaXRPcHRpb24oKSB7XG5cbiAgICBpZiAodGhpcy5lbE5vZGVDb250ZW50ICYmIHRoaXMub3B0aW9uICYmIHRoaXMuZWxOb2RlT3V0cHV0cykge1xuICAgICAgdGhpcy5lbE5vZGVDb250ZW50LmlubmVySFRNTCA9IHRoaXMub3B0aW9uLmh0bWw7XG4gICAgICBpZiAodGhpcy5vcHRpb24ub3V0cHV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5lbE5vZGVPdXRwdXRzLmlubmVySFRNTCA9ICcnO1xuICAgICAgICBmb3IgKGxldCBpbmRleDogbnVtYmVyID0gMTsgaW5kZXggPD0gdGhpcy5vcHRpb24ub3V0cHV0OyBpbmRleCsrKSB7XG4gICAgICAgICAgbGV0IG91dHB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgIG91dHB1dC5zZXRBdHRyaWJ1dGUoJ25vZGUnLCAoaW5kZXgpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIG91dHB1dC5jbGFzc0xpc3QuYWRkKFwiZG90XCIpO1xuICAgICAgICAgIG91dHB1dC5jbGFzc0xpc3QuYWRkKFwib3V0cHV0X1wiICsgKGluZGV4KSk7XG4gICAgICAgICAgdGhpcy5lbE5vZGVPdXRwdXRzLmFwcGVuZENoaWxkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbi5pbnB1dCA9PT0gMCAmJiB0aGlzLmVsTm9kZUlucHV0cykge1xuICAgICAgICB0aGlzLmVsTm9kZUlucHV0cy5pbm5lckhUTUwgPSAnJztcbiAgICAgIH1cblxuICAgIH1cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuUnVuU2NyaXB0KHRoaXMsIHRoaXMuZWxOb2RlKTtcbiAgICB9LCAxMDApO1xuICB9XG4gIHB1YmxpYyBSdW5TY3JpcHQoc2VsZk5vZGU6IE5vZGVGbG93LCBlbDogSFRNTEVsZW1lbnQgfCBudWxsKSB7XG4gICAgaWYgKHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLnNjcmlwdCkge1xuICAgICAgZ2V2YWwoJyhub2RlLGVsKT0+eycgKyB0aGlzLm9wdGlvbi5zY3JpcHQudG9TdHJpbmcoKSArICd9Jykoc2VsZk5vZGUsIGVsKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGNoZWNrS2V5KGtleTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLmtleSA9PSBrZXk7XG4gIH1cbiAgcHVibGljIE5vZGVPdmVyKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gdGhpcztcbiAgfVxuICBwdWJsaWMgTm9kZUxlYXZlKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gbnVsbDtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5TZWxlY3ROb2RlKHRoaXMpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVQb3NpdGlvbih4OiBhbnksIHk6IGFueSwgaUNoZWNrID0gZmFsc2UpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGlmIChpQ2hlY2spIHtcbiAgICAgICAgdGhpcy5wb3NfeCA9IHg7XG4gICAgICAgIHRoaXMucG9zX3kgPSB5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wb3NfeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0IC0geCk7XG4gICAgICAgIHRoaXMucG9zX3kgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSk7XG4gICAgICB9XG4gICAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLnBvc195fXB4OyBsZWZ0OiAke3RoaXMucG9zX3h9cHg7YCk7XG4gICAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLnVwZGF0ZSgpO1xuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuXG5leHBvcnQgZW51bSBNb3ZlVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb2RlID0gMSxcbiAgQ2FudmFzID0gMixcbiAgTGluZSA9IDMsXG59XG5leHBvcnQgY2xhc3MgVmlld0Zsb3cge1xuICBwcml2YXRlIGVsVmlldzogSFRNTEVsZW1lbnQ7XG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcGFyZW50OiBXb3JrZXJGbG93O1xuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XG4gIHB1YmxpYyBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBmbGdNb3ZlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgcHJpdmF0ZSB6b29tOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIHpvb21fbWF4OiBudW1iZXIgPSAxLjY7XG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcbiAgcHJpdmF0ZSB6b29tX3ZhbHVlOiBudW1iZXIgPSAwLjE7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIGNhbnZhc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGNhbnZhc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBsaW5lU2VsZWN0ZWQ6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbm9kZVNlbGVjdGVkOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgbm9kZU92ZXI6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZG90U2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGltZUZhc3RDbGljazogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwcm9qZWN0SWQ6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgcHJvamVjdE5hbWU6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgdGFnSW5nb3JlID0gWydpbnB1dCcsICdidXR0b24nLCAnYScsICd0ZXh0YXJlYSddO1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5lbFZpZXcgPSB0aGlzLnBhcmVudC5jb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWRlc2dpbiAud29ya2VyZmxvdy12aWV3JykgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctY2FudmFzXCIpO1xuICAgIHRoaXMuZWxWaWV3LmFwcGVuZENoaWxkKHRoaXMuZWxDYW52YXMpO1xuICAgIHRoaXMuZWxWaWV3LnRhYkluZGV4ID0gMDtcbiAgICB0aGlzLmFkZEV2ZW50KCk7XG4gICAgdGhpcy5SZXNldCgpO1xuICAgIHRoaXMudXBkYXRlVmlldygpO1xuXG4gIH1cbiAgcHVibGljIGdldE9wdGlvbihrZXlOb2RlOiBhbnkpIHtcbiAgICBpZiAoIWtleU5vZGUpIHJldHVybjtcbiAgICBsZXQgY29udHJvbCA9IHRoaXMucGFyZW50Lm9wdGlvbi5jb250cm9sW2tleU5vZGVdO1xuICAgIGlmICghY29udHJvbCkge1xuICAgICAgY29udHJvbCA9IE9iamVjdC52YWx1ZXModGhpcy5wYXJlbnQub3B0aW9uLmNvbnRyb2wpWzBdO1xuICAgIH1cbiAgICBjb250cm9sLmtleSA9IGtleU5vZGU7XG4gICAgcmV0dXJuIGNvbnRyb2w7XG4gIH1cbiAgcHJpdmF0ZSBkcm9wRW5kKGV2OiBhbnkpIHtcbiAgICBsZXQga2V5Tm9kZTogc3RyaW5nIHwgbnVsbCA9ICcnO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGtleU5vZGUgPSB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGtleU5vZGUgPSBldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcIm5vZGVcIik7XG4gICAgfVxuICAgIGxldCBvcHRpb24gPSB0aGlzLmdldE9wdGlvbihrZXlOb2RlKTtcbiAgICBpZiAob3B0aW9uICYmIG9wdGlvbi5vbmx5Tm9kZSkge1xuICAgICAgaWYgKHRoaXMubm9kZXMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmNoZWNrS2V5KGtleU5vZGUpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IG5vZGUgPSB0aGlzLkFkZE5vZGUob3B0aW9uKTtcblxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuXG4gICAgbm9kZS51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCBub2RlcyA9IHRoaXMubm9kZXMubWFwKChpdGVtKSA9PiBpdGVtLnRvSnNvbigpKTtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHRoaXMucHJvamVjdElkLFxuICAgICAgbmFtZTogdGhpcy5wcm9qZWN0TmFtZSxcbiAgICAgIHg6IHRoaXMuY2FudmFzX3gsXG4gICAgICB5OiB0aGlzLmNhbnZhc195LFxuICAgICAgem9vbTogdGhpcy56b29tLFxuICAgICAgbm9kZXNcbiAgICB9XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5SZXNldCgpO1xuICAgIHRoaXMucHJvamVjdElkID0gZGF0YT8uaWQgPz8gdGhpcy5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIHRoaXMucHJvamVjdE5hbWUgPSBkYXRhPy5uYW1lID8/IGBwcm9qZWN0LSR7dGhpcy5wYXJlbnQuZ2V0VGltZSgpfWA7XG4gICAgdGhpcy5jYW52YXNfeCA9IGRhdGE/LnggPz8gMDtcbiAgICB0aGlzLmNhbnZhc195ID0gZGF0YT8ueSA/PyAwO1xuICAgIHRoaXMuem9vbSA9IGRhdGE/Lnpvb20gPz8gMTtcbiAgICB0aGlzLm5vZGVzID0gKGRhdGE/Lm5vZGVzID8/IFtdKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgcmV0dXJuIChuZXcgTm9kZUZsb3codGhpcywgXCJcIikpLmxvYWQoaXRlbSk7XG4gICAgfSk7XG4gICAgKGRhdGE/Lm5vZGVzID8/IFtdKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIChpdGVtLmxpbmUgPz8gW10pLmZvckVhY2goKGxpbmU6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZnJvbU5vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUuZnJvbU5vZGUpO1xuICAgICAgICBsZXQgdG9Ob2RlID0gdGhpcy5nZXROb2RlQnlJZChsaW5lLnRvTm9kZSk7XG4gICAgICAgIGxldCBvdXB1dEluZGV4ID0gbGluZS5vdXB1dEluZGV4ID8/IDA7XG4gICAgICAgIGlmIChmcm9tTm9kZSAmJiB0b05vZGUpIHtcbiAgICAgICAgICB0aGlzLkFkZExpbmUoZnJvbU5vZGUsIHRvTm9kZSwgb3VwdXRJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSk7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIFJlc2V0KCkge1xuICAgIHRoaXMubm9kZXMuZm9yRWFjaCgoaXRlbSkgPT4gaXRlbS5kZWxldGUoZmFsc2UpKTtcbiAgICB0aGlzLm5vZGVzID0gW107XG4gICAgdGhpcy5wcm9qZWN0SWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XG4gICAgdGhpcy5wcm9qZWN0TmFtZSA9IGBwcm9qZWN0LSR7dGhpcy5wYXJlbnQuZ2V0VGltZSgpfWA7XG4gICAgdGhpcy5jYW52YXNfeCA9IDA7XG4gICAgdGhpcy5jYW52YXNfeSA9IDA7XG4gICAgdGhpcy56b29tID0gMTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUJ5SWQobm9kZUlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5ub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLm5vZGVJZCA9PSBub2RlSWQpWzBdO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVWaWV3KCkge1xuICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyB0aGlzLmNhbnZhc194ICsgXCJweCwgXCIgKyB0aGlzLmNhbnZhc195ICsgXCJweCkgc2NhbGUoXCIgKyB0aGlzLnpvb20gKyBcIilcIjtcbiAgfVxuICBwcml2YXRlIENhbGNYKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudFdpZHRoIC8gKHRoaXMuZWxWaWV3LmNsaWVudFdpZHRoICogdGhpcy56b29tKSk7XG4gIH1cbiAgcHJpdmF0ZSBDYWxjWShudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRIZWlnaHQgLyAodGhpcy5lbFZpZXcuY2xpZW50SGVpZ2h0ICogdGhpcy56b29tKSk7XG4gIH1cbiAgcHJpdmF0ZSBkcmFnb3ZlcihlOiBhbnkpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0TGluZSgpIHtcbiAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkLmVsUGF0aD8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG51bGw7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBVblNlbGVjdERvdCgpIHtcbiAgICBpZiAodGhpcy5kb3RTZWxlY3RlZCkge1xuICAgICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5kb3RTZWxlY3RlZCA9IG51bGw7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBVblNlbGVjdE5vZGUoKSB7XG4gICAgaWYgKHRoaXMubm9kZVNlbGVjdGVkKSB7XG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgVW5TZWxlY3QoKSB7XG4gICAgdGhpcy5VblNlbGVjdExpbmUoKTtcbiAgICB0aGlzLlVuU2VsZWN0Tm9kZSgpO1xuICAgIHRoaXMuVW5TZWxlY3REb3QoKTtcbiAgfVxuICBwdWJsaWMgU2VsZWN0TGluZShub2RlOiBMaW5lRmxvdykge1xuICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG5vZGU7XG4gICAgdGhpcy5saW5lU2VsZWN0ZWQuZWxQYXRoLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICB9XG4gIHB1YmxpYyBTZWxlY3ROb2RlKG5vZGU6IE5vZGVGbG93KSB7XG4gICAgdGhpcy5VblNlbGVjdCgpO1xuICAgIHRoaXMubm9kZVNlbGVjdGVkID0gbm9kZTtcbiAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICB9XG4gIHB1YmxpYyBTZWxlY3REb3Qobm9kZTogTm9kZUZsb3cpIHtcbiAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgdGhpcy5kb3RTZWxlY3RlZCA9IG5vZGU7XG4gICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVOb2RlKG5vZGU6IE5vZGVGbG93KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlKG9wdGlvbjogYW55ID0gbnVsbCk6IE5vZGVGbG93IHtcbiAgICBsZXQgTm9kZUlkID0gb3B0aW9uID8gb3B0aW9uLmlkIDogdGhpcy5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIGxldCBub2RlID0gbmV3IE5vZGVGbG93KHRoaXMsIE5vZGVJZCA/PyB0aGlzLnBhcmVudC5nZXRVdWlkKCksIG9wdGlvbik7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShmcm9tTm9kZTogTm9kZUZsb3csIHRvTm9kZTogTm9kZUZsb3csIG91dHB1dEluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGZyb21Ob2RlID09IHRvTm9kZSkgcmV0dXJuO1xuICAgIGlmIChmcm9tTm9kZS5hcnJMaW5lLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgcmV0dXJuIGl0ZW0udG9Ob2RlID09PSB0b05vZGUgJiYgaXRlbS5vdXRwdXRJbmRleCA9PSBvdXRwdXRJbmRleCAmJiBpdGVtICE9IHRoaXMudGVtcExpbmU7XG4gICAgfSkubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IExpbmVGbG93KHRoaXMsIGZyb21Ob2RlLCB0b05vZGUsIG91dHB1dEluZGV4KTtcbiAgfVxuICBwdWJsaWMgYWRkRXZlbnQoKSB7XG4gICAgLyogTW91c2UgYW5kIFRvdWNoIEFjdGlvbnMgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcbiAgICAvKiBDb250ZXh0IE1lbnUgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLnpvb21fZW50ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogRGVsZXRlICovXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5ZG93bi5iaW5kKHRoaXMpKTtcbiAgfVxuICBwdWJsaWMga2V5ZG93bihlOiBhbnkpIHtcbiAgICBpZiAoZS5rZXkgPT09ICdEZWxldGUnIHx8IChlLmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgZS5tZXRhS2V5KSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZC5kZWxldGUoKTtcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubGluZVNlbGVjdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZGVsZXRlKCk7XG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21fZW50ZXIoZXZlbnQ6IGFueSkge1xuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAoZXZlbnQuZGVsdGFZID4gMCkge1xuICAgICAgICAvLyBab29tIE91dFxuICAgICAgICB0aGlzLnpvb21fb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBab29tIEluXG4gICAgICAgIHRoaXMuem9vbV9pbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9yZWZyZXNoKCkge1xuICAgIHRoaXMuY2FudmFzX3ggPSAodGhpcy5jYW52YXNfeCAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRoaXMuem9vbTtcbiAgICB0aGlzLmNhbnZhc195ID0gKHRoaXMuY2FudmFzX3kgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0aGlzLnpvb207XG4gICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0aGlzLnpvb207XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIHpvb21faW4oKSB7XG4gICAgaWYgKHRoaXMuem9vbSA8IHRoaXMuem9vbV9tYXgpIHtcbiAgICAgIHRoaXMuem9vbSArPSB0aGlzLnpvb21fdmFsdWU7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9vdXQoKSB7XG4gICAgaWYgKHRoaXMuem9vbSA+IHRoaXMuem9vbV9taW4pIHtcbiAgICAgIHRoaXMuem9vbSAtPSB0aGlzLnpvb21fdmFsdWU7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICBpZiAodGhpcy56b29tICE9IDEpIHtcbiAgICAgIHRoaXMuem9vbSA9IDE7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBTdGFydE1vdmUoZTogYW55KSB7XG4gICAgaWYgKHRoaXMudGFnSW5nb3JlLmluY2x1ZGVzKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gdGhpcy5wYXJlbnQuZ2V0VGltZSgpO1xuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vbmUpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAmJiB0aGlzLnBhcmVudC5jaGVja1BhcmVudChlLnRhcmdldCwgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlKSkge1xuICAgICAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdkb3QnKSkge1xuICAgICAgICAgIGlmICh0aGlzLnBhcmVudC5jaGVja1BhcmVudChlLnRhcmdldCwgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlSW5wdXRzKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmVGbG93KHRoaXMsIHRoaXMubm9kZVNlbGVjdGVkLCBudWxsKTtcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lLm91dHB1dEluZGV4ID0gKyhlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vZGU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBvc194ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBNb3ZlKGU6IGFueSkge1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgdGhpcy5mbGdNb3ZlID0gdHJ1ZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuY2FudmFzX3ggKyB0aGlzLkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgICAgIGxldCB5ID0gdGhpcy5jYW52YXNfeSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHggKyBcInB4LCBcIiArIHkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuem9vbSArIFwiKVwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLk5vZGU6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLnBvc195IC0gZV9wb3NfeSk7XG4gICAgICAgICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQ/LnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLkxpbmU6XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgICAgICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLmVsQ2FudmFzLm9mZnNldExlZnQgLSB4LCB0aGlzLmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS50b05vZGUgPSB0aGlzLm5vZGVPdmVyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIHRoaXMubW91c2VfeCA9IGVfcG9zX3g7XG4gICAgICB0aGlzLm1vdXNlX3kgPSBlX3Bvc195O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgRW5kTW92ZShlOiBhbnkpIHtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgodGhpcy5wYXJlbnQuZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDMwMCkgfHwgIXRoaXMuZmxnRHJhcCAmJiAhdGhpcy5mbGdNb3ZlKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5VblNlbGVjdCgpO1xuICAgIGlmICh0aGlzLnRlbXBMaW5lICYmIHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTGluZSkge1xuICAgICAgaWYgKHRoaXMudGVtcExpbmUudG9Ob2RlICYmIHRoaXMudGVtcExpbmUudG9Ob2RlLmNoZWNrSW5wdXQoKSkge1xuICAgICAgICB0aGlzLkFkZExpbmUodGhpcy50ZW1wTGluZS5mcm9tTm9kZSwgdGhpcy50ZW1wTGluZS50b05vZGUsIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXgpO1xuICAgICAgfVxuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSBudWxsO1xuICAgIH1cbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICB0aGlzLmNhbnZhc194ID0gdGhpcy5jYW52YXNfeCArIHRoaXMuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpO1xuICAgICAgdGhpcy5jYW52YXNfeSA9IHRoaXMuY2FudmFzX3kgKyB0aGlzLkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKTtcbiAgICB9XG4gICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIGNvbnRleHRtZW51KGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgQ29udHJvbEZsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL0NvbnRyb2xGbG93XCI7XG5pbXBvcnQgeyBUYWJGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9UYWJGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlckZsb3cge1xuXG4gIHB1YmxpYyBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgcHVibGljIFZpZXc6IFZpZXdGbG93IHwgbnVsbDtcbiAgcHVibGljIENvbnRyb2w6IENvbnRyb2xGbG93IHwgbnVsbDtcbiAgcHVibGljIHRhYjogVGFiRmxvdyB8IG51bGw7XG4gIHB1YmxpYyBkYXRhTm9kZVNlbGVjdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZXZlbnRzOiBhbnkgPSB7fTtcbiAgcHVibGljIG9wdGlvbjogYW55O1xuXG4gIHB1YmxpYyBjaGVja1BhcmVudChub2RlOiBhbnksIG5vZGVDaGVjazogYW55KSB7XG4gICAgaWYgKG5vZGUgJiYgbm9kZUNoZWNrKSB7XG4gICAgICBpZiAobm9kZSA9PSBub2RlQ2hlY2spIHJldHVybiB0cnVlO1xuICAgICAgbGV0IHBhcmVudDogYW55ID0gbm9kZTtcbiAgICAgIHdoaWxlICgocGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQpICE9IG51bGwpIHtcbiAgICAgICAgaWYgKG5vZGVDaGVjayA9PSBwYXJlbnQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG9wdGlvbjogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93XCIpO1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uIHx8IHtcbiAgICAgIGNvbnRyb2w6IHtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sXCI+XG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2hlYWRlclwiPk5vZGUgQ29udHJvbDwvaDI+XG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sX19saXN0XCI+XG4gICAgICA8ZGl2IGRyYWdnYWJsZT1cInRydWVcIj5Ob2RlIDE8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWRlc2dpblwiPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctaXRlbXNcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctaXRlbVwiPlRow7RuZyB0aW4gbeG7m2k8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctaXRlbVwiPlRow7RuZyB0aW4gbeG7m2kxMjM8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctdmlld1wiPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgYDtcbiAgICB0aGlzLlZpZXcgPSBuZXcgVmlld0Zsb3codGhpcyk7XG4gICAgdGhpcy50YWIgPSBuZXcgVGFiRmxvdyh0aGlzLCBbXSk7XG4gICAgdGhpcy5Db250cm9sID0gbmV3IENvbnRyb2xGbG93KHRoaXMpO1xuICAgIHRoaXMubmV3KCk7XG4gIH1cbiAgcHVibGljIG5ldygpIHtcbiAgICB0aGlzLnRhYj8uTmV3UHJvamVjdCgpO1xuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMudGFiPy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIHJldHVybiB0aGlzLlZpZXc/LnRvSnNvbigpO1xuICB9XG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gIH1cbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcbiAgICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICAgIGxldCBzOiBhbnkgPSBbXTtcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XG4gICAgfVxuICAgIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7ICAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICAgIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICAgIHJldHVybiB1dWlkO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcbiAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xuICAgICAgICBsaXN0ZW5lcnM6IFtdXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG5cbiAgICBpZiAoIXRoaXMuZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXG4gICAgY29uc3QgbGlzdGVuZXJJbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKVxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXG4gIH1cblxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBjb25zb2xlLmVycm9yKGBUaGlzIGV2ZW50OiAke2V2ZW50fSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMsIHNlbGYpO1xuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztNQUVhLFdBQVcsQ0FBQTtBQUNk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
