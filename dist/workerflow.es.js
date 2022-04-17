
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
        let from_x = this.fromNode.pos_x + this.fromNode.elNode.clientWidth + 5;
        let from_y = this.fromNode.pos_y + (this.fromNode.output() > 1 ? (((this.outputIndex - 1) * 21) + 15) : (2 + this.fromNode.elNode.clientHeight / 2));
        var lineCurve = this.createCurvature(from_x, from_y, to_x, to_y, this.curvature, 'openclose');
        this.elPath.setAttributeNS(null, 'd', lineCurve);
    }
    update() {
        //Postion output
        if (this.toNode) {
            let to_x = this.toNode.pos_x - 5;
            let to_y = this.toNode.pos_y + this.toNode.elNode.clientHeight / 2;
            this.updateTo(to_x, to_y);
        }
    }
}

const geval = eval;
class NodeFlow {
    parent;
    elNode;
    elNodeInputs;
    elNodeOutputs;
    elNodeContent;
    nodeId;
    pos_x = 0;
    pos_y = 0;
    arrLine = [];
    option;
    data = {};
    toJson() {
        let LineJson = this.arrLine.map((item) => ({
            fromNode: item.fromNode.nodeId,
            toNode: item.toNode?.nodeId,
            ouputIndex: item.outputIndex
        }));
        return {
            id: this.nodeId,
            node: this.option.key,
            line: LineJson,
            data: this.data,
            x: this.pos_x,
            y: this.pos_y
        };
    }
    output() {
        return this.option?.output ?? 0;
    }
    delete() {
        this.arrLine.forEach((item) => item.delete(this));
        this.elNode.removeEventListener('mouseover', this.NodeOver.bind(this));
        this.elNode.removeEventListener('mouseleave', this.NodeLeave.bind(this));
        this.elNode.removeEventListener('mousedown', this.StartSelected.bind(this));
        this.elNode.removeEventListener('touchstart', this.StartSelected.bind(this));
        this.elNode.remove();
        this.arrLine = [];
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
        this.elNode = document.createElement('div');
        this.elNode.classList.add("workerflow-node");
        this.elNode.id = `node-${id}`;
        this.elNodeInputs = document.createElement('div');
        this.elNodeInputs.classList.add('workerflow-node_inputs');
        this.elNodeInputs.innerHTML = `<div class="inputs dot"></div>`;
        this.elNodeContent = document.createElement('div');
        this.elNodeContent.classList.add('workerflow-node_content');
        this.elNodeOutputs = document.createElement('div');
        this.elNodeOutputs.classList.add('workerflow-node_outputs');
        this.elNodeOutputs.innerHTML = ``;
        this.elNode.setAttribute('data-node', id);
        this.elNode.setAttribute('style', `top: ${this.pos_y}px; left: ${this.pos_x}px;`);
        this.elNode.addEventListener('mouseover', this.NodeOver.bind(this));
        this.elNode.addEventListener('mouseleave', this.NodeLeave.bind(this));
        this.elNode.addEventListener('mousedown', this.StartSelected.bind(this));
        this.elNode.addEventListener('touchstart', this.StartSelected.bind(this));
        this.elNode.appendChild(this.elNodeInputs);
        this.elNode.appendChild(this.elNodeContent);
        this.elNode.appendChild(this.elNodeOutputs);
        if (this.option) {
            this.elNodeContent.innerHTML = this.option.html;
            this.elNodeOutputs.innerHTML = '';
            if (this.option.output) {
                for (let index = 1; index <= this.option.output; index++) {
                    let output = document.createElement('div');
                    output.setAttribute('node', (index).toString());
                    output.classList.add("dot");
                    output.classList.add("output_" + (index));
                    this.elNodeOutputs.appendChild(output);
                }
            }
        }
        this.parent.elCanvas?.appendChild(this.elNode);
        setTimeout(() => {
            this.RunScript(this, this.elNode);
        }, 100);
    }
    RunScript(selfNode, el) {
        if (this.option && this.option.script) {
            geval('(node,el)=>{' + this.option.script.toString() + '}')(selfNode, el);
        }
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
    constructor(parent) {
        this.parent = parent;
        this.projectId = parent.getUuid();
        this.elView = this.parent.container?.querySelector('.workerflow-desgin .workerflow-view') || document.createElement('div');
        this.elCanvas = document.createElement('div');
        this.elCanvas.classList.add("workerflow-canvas");
        this.elView.appendChild(this.elCanvas);
        this.elView.tabIndex = 0;
        this.addEvent();
        this.updateView();
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
        if (!keyNode)
            return;
        let node = this.AddNode(this.parent.option.control[keyNode]);
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
            if (this.tempLine.toNode) {
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
        this.Control = new ControlFlow(this);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5lcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbXBvbmVudHMvQ29udHJvbEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9MaW5lRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL05vZGVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVmlld0Zsb3cudHMiLCIuLi9zcmMvV29ya2VyRmxvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xGbG93IHtcbiAgcHJpdmF0ZSBlbENvbnRyb2w6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBwYXJlbnQ6IFdvcmtlckZsb3c7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFdvcmtlckZsb3cpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLmVsQ29udHJvbCA9IHBhcmVudC5jb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWNvbnRyb2xfX2xpc3QnKTtcbiAgICBpZiAodGhpcy5lbENvbnRyb2wpIHtcbiAgICAgIHRoaXMuZWxDb250cm9sLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHBhcmVudC5vcHRpb24uY29udHJvbCk7XG4gICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgbGV0IE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgTm9kZS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICAgIE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBrZXkpO1xuICAgICAgICBOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIik7XG4gICAgICAgIE5vZGUuaW5uZXJIVE1MID0gcGFyZW50Lm9wdGlvbi5jb250cm9sW2tleV0ubmFtZTtcbiAgICAgICAgTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLmRyYWdTdGFydC5iaW5kKHRoaXMpKVxuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgdGhpcy5lbENvbnRyb2w/LmFwcGVuZENoaWxkKE5vZGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkcmFnZW5kKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBkcmFnU3RhcnQoZTogYW55KSB7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuY2xvc2VzdChcIi53b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlRmxvdyB9IGZyb20gXCIuL05vZGVGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lRmxvdyB7XG4gIHB1YmxpYyBlbENvbm5lY3Rpb246IFNWR0VsZW1lbnQgfCBudWxsO1xuICBwdWJsaWMgZWxQYXRoOiBTVkdQYXRoRWxlbWVudDtcbiAgcHJpdmF0ZSBjdXJ2YXR1cmU6IG51bWJlciA9IDAuNTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBWaWV3RmxvdywgcHVibGljIGZyb21Ob2RlOiBOb2RlRmxvdywgcHVibGljIHRvTm9kZTogTm9kZUZsb3cgfCBudWxsID0gbnVsbCwgcHVibGljIG91dHB1dEluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJzdmdcIik7XG4gICAgdGhpcy5lbFBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJwYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoXCJtYWluLXBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCAnJyk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24uY2xhc3NMaXN0LmFkZChcImNvbm5lY3Rpb25cIik7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24uYXBwZW5kQ2hpbGQodGhpcy5lbFBhdGgpO1xuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzPy5hcHBlbmRDaGlsZCh0aGlzLmVsQ29ubmVjdGlvbik7XG4gICAgdGhpcy5mcm9tTm9kZS5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudG9Ob2RlPy5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQuU2VsZWN0TGluZSh0aGlzKTtcbiAgfVxuICBwcml2YXRlIGNyZWF0ZUN1cnZhdHVyZShzdGFydF9wb3NfeDogbnVtYmVyLCBzdGFydF9wb3NfeTogbnVtYmVyLCBlbmRfcG9zX3g6IG51bWJlciwgZW5kX3Bvc195OiBudW1iZXIsIGN1cnZhdHVyZV92YWx1ZTogbnVtYmVyLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBsZXQgbGluZV94ID0gc3RhcnRfcG9zX3g7XG4gICAgbGV0IGxpbmVfeSA9IHN0YXJ0X3Bvc195O1xuICAgIGxldCB4ID0gZW5kX3Bvc194O1xuICAgIGxldCB5ID0gZW5kX3Bvc195O1xuICAgIGxldCBjdXJ2YXR1cmUgPSBjdXJ2YXR1cmVfdmFsdWU7XG4gICAgLy90eXBlIG9wZW5jbG9zZSBvcGVuIGNsb3NlIG90aGVyXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG5cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb3RoZXInOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcblxuICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG5cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZGVsZXRlKG5vZGVUaGlzOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICBpZiAodGhpcy5mcm9tTm9kZSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbU5vZGUuUmVtb3ZlTGluZSh0aGlzKTtcbiAgICBpZiAodGhpcy50b05vZGUgIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLnRvTm9kZT8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24gPSBudWxsO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVUbyh0b194OiBudW1iZXIsIHRvX3k6IG51bWJlcikge1xuICAgIGxldCBmcm9tX3ggPSB0aGlzLmZyb21Ob2RlLnBvc194ICsgdGhpcy5mcm9tTm9kZS5lbE5vZGUuY2xpZW50V2lkdGggKyA1O1xuICAgIGxldCBmcm9tX3kgPSB0aGlzLmZyb21Ob2RlLnBvc195ICsgKHRoaXMuZnJvbU5vZGUub3V0cHV0KCkgPiAxID8gKCgodGhpcy5vdXRwdXRJbmRleCAtIDEpICogMjEpICsgMTUpIDogKDIgKyB0aGlzLmZyb21Ob2RlLmVsTm9kZS5jbGllbnRIZWlnaHQgLyAyKSk7XG4gICAgdmFyIGxpbmVDdXJ2ZSA9IHRoaXMuY3JlYXRlQ3VydmF0dXJlKGZyb21feCwgZnJvbV95LCB0b194LCB0b195LCB0aGlzLmN1cnZhdHVyZSwgJ29wZW5jbG9zZScpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgbGluZUN1cnZlKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlKCkge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50b05vZGUpIHtcbiAgICAgIGxldCB0b194ID0gdGhpcy50b05vZGUucG9zX3ggLSA1O1xuICAgICAgbGV0IHRvX3kgPSB0aGlzLnRvTm9kZS5wb3NfeSArIHRoaXMudG9Ob2RlLmVsTm9kZS5jbGllbnRIZWlnaHQgLyAyO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG5cbiAgfVxufVxuIiwiaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9WaWV3Rmxvd1wiO1xuY29uc3QgZ2V2YWwgPSBldmFsO1xuZXhwb3J0IGNsYXNzIE5vZGVGbG93IHtcbiAgcHJpdmF0ZSBwYXJlbnQ6IFZpZXdGbG93O1xuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudDtcbiAgcHVibGljIGVsTm9kZUlucHV0czogSFRNTEVsZW1lbnQgfCBudWxsIHwgbnVsbDtcbiAgcHVibGljIGVsTm9kZU91dHB1dHM6IEhUTUxFbGVtZW50IHwgbnVsbCB8IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVDb250ZW50OiBIVE1MRWxlbWVudCB8IG51bGwgfCBudWxsO1xuICBwdWJsaWMgbm9kZUlkOiBzdHJpbmc7XG4gIHB1YmxpYyBwb3NfeDogbnVtYmVyID0gMDtcbiAgcHVibGljIHBvc195OiBudW1iZXIgPSAwO1xuICBwdWJsaWMgYXJyTGluZTogTGluZUZsb3dbXSA9IFtdO1xuICBwcml2YXRlIG9wdGlvbjogYW55O1xuICBwdWJsaWMgZGF0YTogYW55ID0ge307XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgbGV0IExpbmVKc29uID0gdGhpcy5hcnJMaW5lLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAgIGZyb21Ob2RlOiBpdGVtLmZyb21Ob2RlLm5vZGVJZCxcbiAgICAgIHRvTm9kZTogaXRlbS50b05vZGU/Lm5vZGVJZCxcbiAgICAgIG91cHV0SW5kZXg6IGl0ZW0ub3V0cHV0SW5kZXhcbiAgICB9KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLm5vZGVJZCxcbiAgICAgIG5vZGU6IHRoaXMub3B0aW9uLmtleSxcbiAgICAgIGxpbmU6IExpbmVKc29uLFxuICAgICAgZGF0YTogdGhpcy5kYXRhLFxuICAgICAgeDogdGhpcy5wb3NfeCxcbiAgICAgIHk6IHRoaXMucG9zX3lcbiAgICB9XG4gIH1cbiAgcHVibGljIG91dHB1dCgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xuICB9XG4gIHB1YmxpYyBkZWxldGUoKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLk5vZGVPdmVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLk5vZGVMZWF2ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcbiAgICB0aGlzLnBhcmVudC5SZW1vdmVOb2RlKHRoaXMpO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gIH1cbiAgcHVibGljIFJlbW92ZUxpbmUobGluZTogTGluZUZsb3cpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmFyckxpbmUuaW5kZXhPZihsaW5lKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5hcnJMaW5lLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFyckxpbmU7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogVmlld0Zsb3csIGlkOiBzdHJpbmcsIG9wdGlvbjogYW55ID0gbnVsbCkge1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMubm9kZUlkID0gaWQ7XG4gICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1ub2RlXCIpO1xuICAgIHRoaXMuZWxOb2RlLmlkID0gYG5vZGUtJHtpZH1gO1xuICAgIHRoaXMuZWxOb2RlSW5wdXRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX2lucHV0cycpO1xuICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiaW5wdXRzIGRvdFwiPjwvZGl2PmA7XG4gICAgdGhpcy5lbE5vZGVDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGVDb250ZW50LmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9jb250ZW50Jyk7XG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9vdXRwdXRzJyk7XG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzLmlubmVySFRNTCA9IGBgO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgaWQpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMucG9zX3l9cHg7IGxlZnQ6ICR7dGhpcy5wb3NfeH1weDtgKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLk5vZGVPdmVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLk5vZGVMZWF2ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZUlucHV0cyk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVDb250ZW50KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZU91dHB1dHMpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9uKSB7XG4gICAgICB0aGlzLmVsTm9kZUNvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb24uaHRtbDtcbiAgICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5pbm5lckhUTUwgPSAnJztcbiAgICAgIGlmICh0aGlzLm9wdGlvbi5vdXRwdXQpIHtcbiAgICAgICAgZm9yIChsZXQgaW5kZXg6IG51bWJlciA9IDE7IGluZGV4IDw9IHRoaXMub3B0aW9uLm91dHB1dDsgaW5kZXgrKykge1xuICAgICAgICAgIGxldCBvdXRwdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICBvdXRwdXQuc2V0QXR0cmlidXRlKCdub2RlJywgKGluZGV4KS50b1N0cmluZygpKTtcbiAgICAgICAgICBvdXRwdXQuY2xhc3NMaXN0LmFkZChcImRvdFwiKTtcbiAgICAgICAgICBvdXRwdXQuY2xhc3NMaXN0LmFkZChcIm91dHB1dF9cIiArIChpbmRleCkpO1xuICAgICAgICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5hcHBlbmRDaGlsZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzPy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLlJ1blNjcmlwdCh0aGlzLCB0aGlzLmVsTm9kZSk7XG4gICAgfSwgMTAwKTtcbiAgfVxuICBwdWJsaWMgUnVuU2NyaXB0KHNlbGZOb2RlOiBOb2RlRmxvdywgZWw6IEhUTUxFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLnNjcmlwdCkge1xuICAgICAgZ2V2YWwoJyhub2RlLGVsKT0+eycgKyB0aGlzLm9wdGlvbi5zY3JpcHQudG9TdHJpbmcoKSArICd9Jykoc2VsZk5vZGUsIGVsKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIE5vZGVPdmVyKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gdGhpcztcbiAgfVxuICBwdWJsaWMgTm9kZUxlYXZlKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gbnVsbDtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5TZWxlY3ROb2RlKHRoaXMpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVQb3NpdGlvbih4OiBhbnksIHk6IGFueSwgaUNoZWNrID0gZmFsc2UpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGlmIChpQ2hlY2spIHtcbiAgICAgICAgdGhpcy5wb3NfeCA9IHg7XG4gICAgICAgIHRoaXMucG9zX3kgPSB5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wb3NfeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0IC0geCk7XG4gICAgICAgIHRoaXMucG9zX3kgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSk7XG4gICAgICB9XG4gICAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLnBvc195fXB4OyBsZWZ0OiAke3RoaXMucG9zX3h9cHg7YCk7XG4gICAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLnVwZGF0ZSgpO1xuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuXG5leHBvcnQgZW51bSBNb3ZlVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb2RlID0gMSxcbiAgQ2FudmFzID0gMixcbiAgTGluZSA9IDMsXG59XG5leHBvcnQgY2xhc3MgVmlld0Zsb3cge1xuICBwcml2YXRlIGVsVmlldzogSFRNTEVsZW1lbnQ7XG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcGFyZW50OiBXb3JrZXJGbG93O1xuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XG4gIHB1YmxpYyBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBmbGdNb3ZlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgcHJpdmF0ZSB6b29tOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIHpvb21fbWF4OiBudW1iZXIgPSAxLjY7XG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcbiAgcHJpdmF0ZSB6b29tX3ZhbHVlOiBudW1iZXIgPSAwLjE7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIGNhbnZhc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGNhbnZhc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBsaW5lU2VsZWN0ZWQ6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbm9kZVNlbGVjdGVkOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgbm9kZU92ZXI6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZG90U2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGltZUZhc3RDbGljazogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwcm9qZWN0SWQ6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgcHJvamVjdE5hbWU6IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFdvcmtlckZsb3cpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLnByb2plY3RJZCA9IHBhcmVudC5nZXRVdWlkKCk7XG4gICAgdGhpcy5lbFZpZXcgPSB0aGlzLnBhcmVudC5jb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWRlc2dpbiAud29ya2VyZmxvdy12aWV3JykgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctY2FudmFzXCIpO1xuICAgIHRoaXMuZWxWaWV3LmFwcGVuZENoaWxkKHRoaXMuZWxDYW52YXMpO1xuICAgIHRoaXMuZWxWaWV3LnRhYkluZGV4ID0gMDtcbiAgICB0aGlzLmFkZEV2ZW50KCk7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHJpdmF0ZSBkcm9wRW5kKGV2OiBhbnkpIHtcbiAgICBsZXQga2V5Tm9kZTogc3RyaW5nIHwgbnVsbCA9ICcnO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGtleU5vZGUgPSB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGtleU5vZGUgPSBldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcIm5vZGVcIik7XG4gICAgfVxuICAgIGlmICgha2V5Tm9kZSkgcmV0dXJuO1xuICAgIGxldCBub2RlID0gdGhpcy5BZGROb2RlKHRoaXMucGFyZW50Lm9wdGlvbi5jb250cm9sW2tleU5vZGVdKTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcblxuICAgIG5vZGUudXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgbm9kZXMgPSB0aGlzLm5vZGVzLm1hcCgoaXRlbSkgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLnByb2plY3RJZCxcbiAgICAgIG5hbWU6IHRoaXMucHJvamVjdE5hbWUsXG4gICAgICB4OiB0aGlzLmNhbnZhc194LFxuICAgICAgeTogdGhpcy5jYW52YXNfeSxcbiAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgIG5vZGVzXG4gICAgfVxuICB9XG4gIHB1YmxpYyB1cGRhdGVWaWV3KCkge1xuICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyB0aGlzLmNhbnZhc194ICsgXCJweCwgXCIgKyB0aGlzLmNhbnZhc195ICsgXCJweCkgc2NhbGUoXCIgKyB0aGlzLnpvb20gKyBcIilcIjtcbiAgfVxuICBwcml2YXRlIENhbGNYKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudFdpZHRoIC8gKHRoaXMuZWxWaWV3LmNsaWVudFdpZHRoICogdGhpcy56b29tKSk7XG4gIH1cbiAgcHJpdmF0ZSBDYWxjWShudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRIZWlnaHQgLyAodGhpcy5lbFZpZXcuY2xpZW50SGVpZ2h0ICogdGhpcy56b29tKSk7XG4gIH1cbiAgcHJpdmF0ZSBkcmFnb3ZlcihlOiBhbnkpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0TGluZSgpIHtcbiAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkLmVsUGF0aD8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG51bGw7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBVblNlbGVjdERvdCgpIHtcbiAgICBpZiAodGhpcy5kb3RTZWxlY3RlZCkge1xuICAgICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5kb3RTZWxlY3RlZCA9IG51bGw7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBVblNlbGVjdE5vZGUoKSB7XG4gICAgaWYgKHRoaXMubm9kZVNlbGVjdGVkKSB7XG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgVW5TZWxlY3QoKSB7XG4gICAgdGhpcy5VblNlbGVjdExpbmUoKTtcbiAgICB0aGlzLlVuU2VsZWN0Tm9kZSgpO1xuICAgIHRoaXMuVW5TZWxlY3REb3QoKTtcbiAgfVxuICBwdWJsaWMgU2VsZWN0TGluZShub2RlOiBMaW5lRmxvdykge1xuICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG5vZGU7XG4gICAgdGhpcy5saW5lU2VsZWN0ZWQuZWxQYXRoLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICB9XG4gIHB1YmxpYyBTZWxlY3ROb2RlKG5vZGU6IE5vZGVGbG93KSB7XG4gICAgdGhpcy5VblNlbGVjdCgpO1xuICAgIHRoaXMubm9kZVNlbGVjdGVkID0gbm9kZTtcbiAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICB9XG4gIHB1YmxpYyBTZWxlY3REb3Qobm9kZTogTm9kZUZsb3cpIHtcbiAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgdGhpcy5kb3RTZWxlY3RlZCA9IG5vZGU7XG4gICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVOb2RlKG5vZGU6IE5vZGVGbG93KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlKG9wdGlvbjogYW55ID0gbnVsbCk6IE5vZGVGbG93IHtcbiAgICBsZXQgTm9kZUlkID0gb3B0aW9uID8gb3B0aW9uLmlkIDogdGhpcy5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIGxldCBub2RlID0gbmV3IE5vZGVGbG93KHRoaXMsIE5vZGVJZCA/PyB0aGlzLnBhcmVudC5nZXRVdWlkKCksIG9wdGlvbik7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShmcm9tTm9kZTogTm9kZUZsb3csIHRvTm9kZTogTm9kZUZsb3csIG91dHB1dEluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGZyb21Ob2RlID09IHRvTm9kZSkgcmV0dXJuO1xuICAgIGlmIChmcm9tTm9kZS5hcnJMaW5lLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgcmV0dXJuIGl0ZW0udG9Ob2RlID09PSB0b05vZGUgJiYgaXRlbS5vdXRwdXRJbmRleCA9PSBvdXRwdXRJbmRleCAmJiBpdGVtICE9IHRoaXMudGVtcExpbmU7XG4gICAgfSkubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IExpbmVGbG93KHRoaXMsIGZyb21Ob2RlLCB0b05vZGUsIG91dHB1dEluZGV4KTtcbiAgfVxuICBwdWJsaWMgYWRkRXZlbnQoKSB7XG4gICAgLyogTW91c2UgYW5kIFRvdWNoIEFjdGlvbnMgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcbiAgICAvKiBDb250ZXh0IE1lbnUgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLnpvb21fZW50ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogRGVsZXRlICovXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5ZG93bi5iaW5kKHRoaXMpKTtcbiAgfVxuICBwdWJsaWMga2V5ZG93bihlOiBhbnkpIHtcbiAgICBpZiAoZS5rZXkgPT09ICdEZWxldGUnIHx8IChlLmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgZS5tZXRhS2V5KSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZC5kZWxldGUoKTtcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubGluZVNlbGVjdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZGVsZXRlKCk7XG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21fZW50ZXIoZXZlbnQ6IGFueSkge1xuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAoZXZlbnQuZGVsdGFZID4gMCkge1xuICAgICAgICAvLyBab29tIE91dFxuICAgICAgICB0aGlzLnpvb21fb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBab29tIEluXG4gICAgICAgIHRoaXMuem9vbV9pbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9yZWZyZXNoKCkge1xuICAgIHRoaXMuY2FudmFzX3ggPSAodGhpcy5jYW52YXNfeCAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRoaXMuem9vbTtcbiAgICB0aGlzLmNhbnZhc195ID0gKHRoaXMuY2FudmFzX3kgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0aGlzLnpvb207XG4gICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0aGlzLnpvb207XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIHpvb21faW4oKSB7XG4gICAgaWYgKHRoaXMuem9vbSA8IHRoaXMuem9vbV9tYXgpIHtcbiAgICAgIHRoaXMuem9vbSArPSB0aGlzLnpvb21fdmFsdWU7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9vdXQoKSB7XG4gICAgaWYgKHRoaXMuem9vbSA+IHRoaXMuem9vbV9taW4pIHtcbiAgICAgIHRoaXMuem9vbSAtPSB0aGlzLnpvb21fdmFsdWU7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICBpZiAodGhpcy56b29tICE9IDEpIHtcbiAgICAgIHRoaXMuem9vbSA9IDE7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBTdGFydE1vdmUoZTogYW55KSB7XG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gdGhpcy5wYXJlbnQuZ2V0VGltZSgpO1xuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vbmUpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAmJiB0aGlzLnBhcmVudC5jaGVja1BhcmVudChlLnRhcmdldCwgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlKSkge1xuICAgICAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdkb3QnKSkge1xuICAgICAgICAgIGlmICh0aGlzLnBhcmVudC5jaGVja1BhcmVudChlLnRhcmdldCwgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlSW5wdXRzKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmVGbG93KHRoaXMsIHRoaXMubm9kZVNlbGVjdGVkLCBudWxsKTtcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lLm91dHB1dEluZGV4ID0gKyhlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vZGU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBvc194ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBNb3ZlKGU6IGFueSkge1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgdGhpcy5mbGdNb3ZlID0gdHJ1ZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuY2FudmFzX3ggKyB0aGlzLkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgICAgIGxldCB5ID0gdGhpcy5jYW52YXNfeSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHggKyBcInB4LCBcIiArIHkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuem9vbSArIFwiKVwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLk5vZGU6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLnBvc195IC0gZV9wb3NfeSk7XG4gICAgICAgICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQ/LnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLkxpbmU6XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgICAgICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLmVsQ2FudmFzLm9mZnNldExlZnQgLSB4LCB0aGlzLmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS50b05vZGUgPSB0aGlzLm5vZGVPdmVyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIHRoaXMubW91c2VfeCA9IGVfcG9zX3g7XG4gICAgICB0aGlzLm1vdXNlX3kgPSBlX3Bvc195O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgRW5kTW92ZShlOiBhbnkpIHtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgodGhpcy5wYXJlbnQuZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDMwMCkgfHwgIXRoaXMuZmxnRHJhcCAmJiAhdGhpcy5mbGdNb3ZlKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5VblNlbGVjdCgpO1xuICAgIGlmICh0aGlzLnRlbXBMaW5lICYmIHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTGluZSkge1xuICAgICAgaWYgKHRoaXMudGVtcExpbmUudG9Ob2RlKSB7XG4gICAgICAgIHRoaXMuQWRkTGluZSh0aGlzLnRlbXBMaW5lLmZyb21Ob2RlLCB0aGlzLnRlbXBMaW5lLnRvTm9kZSwgdGhpcy50ZW1wTGluZS5vdXRwdXRJbmRleCk7XG4gICAgICB9XG4gICAgICB0aGlzLnRlbXBMaW5lLmRlbGV0ZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZSA9IG51bGw7XG4gICAgfVxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBlX3Bvc194ID0gdGhpcy5tb3VzZV94O1xuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIHRoaXMuY2FudmFzX3ggPSB0aGlzLmNhbnZhc194ICsgdGhpcy5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSk7XG4gICAgICB0aGlzLmNhbnZhc195ID0gdGhpcy5jYW52YXNfeSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpO1xuICAgIH1cbiAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwdWJsaWMgY29udGV4dG1lbnUoZTogYW55KSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBDb250cm9sRmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvQ29udHJvbEZsb3dcIjtcbmltcG9ydCB7IFZpZXdGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9WaWV3Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgV29ya2VyRmxvdyB7XG5cbiAgcHVibGljIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBwdWJsaWMgVmlldzogVmlld0Zsb3cgfCBudWxsO1xuICBwdWJsaWMgQ29udHJvbDogQ29udHJvbEZsb3cgfCBudWxsO1xuICBwdWJsaWMgZGF0YU5vZGVTZWxlY3Q6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XG4gIHB1YmxpYyBvcHRpb246IGFueTtcblxuICBwdWJsaWMgY2hlY2tQYXJlbnQobm9kZTogYW55LCBub2RlQ2hlY2s6IGFueSkge1xuICAgIGlmIChub2RlICYmIG5vZGVDaGVjaykge1xuICAgICAgaWYgKG5vZGUgPT0gbm9kZUNoZWNrKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGxldCBwYXJlbnQ6IGFueSA9IG5vZGU7XG4gICAgICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50KSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChub2RlQ2hlY2sgPT0gcGFyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvd1wiKTtcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbiB8fCB7XG4gICAgICBjb250cm9sOiB7XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbFwiPlxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sX19oZWFkZXJcIj5Ob2RlIENvbnRyb2w8L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbF9fbGlzdFwiPlxuICAgICAgPGRpdiBkcmFnZ2FibGU9XCJ0cnVlXCI+Tm9kZSAxPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1kZXNnaW5cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1zXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1cIj5UaMO0bmcgdGluIG3hu5tpPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1cIj5UaMO0bmcgdGluIG3hu5tpMTIzPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXZpZXdcIj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGA7XG4gICAgdGhpcy5WaWV3ID0gbmV3IFZpZXdGbG93KHRoaXMpO1xuICAgIHRoaXMuQ29udHJvbCA9IG5ldyBDb250cm9sRmxvdyh0aGlzKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIHJldHVybiB0aGlzLlZpZXc/LnRvSnNvbigpO1xuICB9XG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gIH1cbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcbiAgICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICAgIGxldCBzOiBhbnkgPSBbXTtcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XG4gICAgfVxuICAgIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7ICAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICAgIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICAgIHJldHVybiB1dWlkO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcbiAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xuICAgICAgICBsaXN0ZW5lcnM6IFtdXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG5cbiAgICBpZiAoIXRoaXMuZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXG4gICAgY29uc3QgbGlzdGVuZXJJbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKVxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXG4gIH1cblxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBjb25zb2xlLmVycm9yKGBUaGlzIGV2ZW50OiAke2V2ZW50fSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMsIHNlbGYpO1xuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7TUFFYSxXQUFXLENBQUE7QUFDZCxJQUFBLFNBQVMsQ0FBaUM7QUFDMUMsSUFBQSxNQUFNLENBQWE7QUFDM0IsSUFBQSxXQUFBLENBQW1CLE1BQWtCLEVBQUE7QUFDbkMsUUFBQSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDOUUsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2xCLFlBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQzlCLFlBQUEsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlDLFlBQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUc7Z0JBQ2pCLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekMsZ0JBQUEsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdkMsZ0JBQUEsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDcEMsZ0JBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUMvQyxnQkFBQSxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNqRCxnQkFBQSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7QUFDN0QsZ0JBQUEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO0FBQ3pELGdCQUFBLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLGFBQUMsQ0FBQyxDQUFDO0FBQ0osU0FBQTtLQUNGO0FBQ00sSUFBQSxPQUFPLENBQUMsQ0FBTSxFQUFBO0FBQ25CLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0tBQ25DO0FBRU0sSUFBQSxTQUFTLENBQUMsQ0FBTSxFQUFBO0FBQ3JCLFFBQUEsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRTtBQUMzQixZQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3RHLFNBQUE7QUFBTSxhQUFBO0FBQ0wsWUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNoRSxZQUFBLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLFNBQUE7S0FDRjtBQUNGOztNQ2hDWSxRQUFRLENBQUE7QUFJUSxJQUFBLE1BQUEsQ0FBQTtBQUF5QixJQUFBLFFBQUEsQ0FBQTtBQUEyQixJQUFBLE1BQUEsQ0FBQTtBQUF1QyxJQUFBLFdBQUEsQ0FBQTtBQUgvRyxJQUFBLFlBQVksQ0FBb0I7QUFDaEMsSUFBQSxNQUFNLENBQWlCO0lBQ3RCLFNBQVMsR0FBVyxHQUFHLENBQUM7SUFDaEMsV0FBMkIsQ0FBQSxNQUFnQixFQUFTLFFBQWtCLEVBQVMsU0FBMEIsSUFBSSxFQUFTLGNBQXNCLENBQUMsRUFBQTtRQUFsSCxJQUFNLENBQUEsTUFBQSxHQUFOLE1BQU0sQ0FBVTtRQUFTLElBQVEsQ0FBQSxRQUFBLEdBQVIsUUFBUSxDQUFVO1FBQVMsSUFBTSxDQUFBLE1BQUEsR0FBTixNQUFNLENBQXdCO1FBQVMsSUFBVyxDQUFBLFdBQUEsR0FBWCxXQUFXLENBQVk7UUFDM0ksSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xGLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyw0QkFBNEIsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM3RSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDdkMsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3pFLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNyRCxRQUFBLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVCLFFBQUEsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0tBQ2Y7QUFDTSxJQUFBLGFBQWEsQ0FBQyxDQUFNLEVBQUE7QUFDekIsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5QjtJQUNPLGVBQWUsQ0FBQyxXQUFtQixFQUFFLFdBQW1CLEVBQUUsU0FBaUIsRUFBRSxTQUFpQixFQUFFLGVBQXVCLEVBQUUsSUFBWSxFQUFBO1FBQzNJLElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQztRQUN6QixJQUFJLE1BQU0sR0FBRyxXQUFXLENBQUM7UUFDekIsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNsQixJQUFJLFNBQVMsR0FBRyxlQUFlLENBQUM7O0FBRWhDLFFBQUEsUUFBUSxJQUFJO0FBQ1YsWUFBQSxLQUFLLE1BQU07Z0JBQ1QsSUFBSSxXQUFXLElBQUksU0FBUyxFQUFFO0FBQzVCLG9CQUFBLElBQUksR0FBRyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDcEQsb0JBQUEsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELGlCQUFBO0FBQU0scUJBQUE7QUFDTCxvQkFBQSxJQUFJLEdBQUcsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBQ3BELG9CQUFBLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDaEQsaUJBQUE7QUFDRCxnQkFBQSxPQUFPLEtBQUssR0FBRyxNQUFNLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztBQUcvRyxZQUFBLEtBQUssT0FBTztnQkFDVixJQUFJLFdBQVcsSUFBSSxTQUFTLEVBQUU7QUFDNUIsb0JBQUEsSUFBSSxHQUFHLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNELG9CQUFBLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDaEQsaUJBQUE7QUFBTSxxQkFBQTtBQUNMLG9CQUFBLElBQUksR0FBRyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDcEQsb0JBQUEsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQztBQUNoRCxpQkFBQTtBQUNELGdCQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBRS9HLFlBQUEsS0FBSyxPQUFPO2dCQUNWLElBQUksV0FBVyxJQUFJLFNBQVMsRUFBRTtBQUM1QixvQkFBQSxJQUFJLEdBQUcsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0Qsb0JBQUEsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELGlCQUFBO0FBQU0scUJBQUE7QUFDTCxvQkFBQSxJQUFJLEdBQUcsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBQ3BELG9CQUFBLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDaEQsaUJBQUE7QUFDRCxnQkFBQSxPQUFPLEtBQUssR0FBRyxNQUFNLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQztBQUUvRyxZQUFBO0FBRUUsZ0JBQUEsSUFBSSxHQUFHLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQztBQUNwRCxnQkFBQSxJQUFJLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBRS9DLGdCQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sR0FBRyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ2hILFNBQUE7S0FDRjtJQUNNLE1BQU0sQ0FBQyxXQUFnQixJQUFJLEVBQUE7QUFDaEMsUUFBQSxJQUFJLENBQUMsTUFBTSxFQUFFLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzdFLFFBQUEsSUFBSSxDQUFDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM5RSxRQUFBLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRO0FBQzNCLFlBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakMsUUFBQSxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksUUFBUTtBQUN6QixZQUFBLElBQUksQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hDLFFBQUEsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsQ0FBQztBQUM1QixRQUFBLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0tBQzFCO0lBQ00sUUFBUSxDQUFDLElBQVksRUFBRSxJQUFZLEVBQUE7QUFDeEMsUUFBQSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3hFLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNySixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzlGLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDbEQ7SUFDTSxNQUFNLEdBQUE7O1FBRVgsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2YsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLFlBQUEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztBQUNuRSxZQUFBLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzNCLFNBQUE7S0FFRjtBQUNGOztBQzlGRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUM7TUFDTixRQUFRLENBQUE7QUFDWCxJQUFBLE1BQU0sQ0FBVztBQUNsQixJQUFBLE1BQU0sQ0FBYztBQUNwQixJQUFBLFlBQVksQ0FBNEI7QUFDeEMsSUFBQSxhQUFhLENBQTRCO0FBQ3pDLElBQUEsYUFBYSxDQUE0QjtBQUN6QyxJQUFBLE1BQU0sQ0FBUztJQUNmLEtBQUssR0FBVyxDQUFDLENBQUM7SUFDbEIsS0FBSyxHQUFXLENBQUMsQ0FBQztJQUNsQixPQUFPLEdBQWUsRUFBRSxDQUFDO0FBQ3hCLElBQUEsTUFBTSxDQUFNO0lBQ2IsSUFBSSxHQUFRLEVBQUUsQ0FBQztJQUNmLE1BQU0sR0FBQTtBQUNYLFFBQUEsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLE1BQU07QUFDekMsWUFBQSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNO0FBQzlCLFlBQUEsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTTtZQUMzQixVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVc7QUFDN0IsU0FBQSxDQUFDLENBQUMsQ0FBQztRQUNKLE9BQU87WUFDTCxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU07QUFDZixZQUFBLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUc7QUFDckIsWUFBQSxJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSztZQUNiLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSztTQUNkLENBQUE7S0FDRjtJQUNNLE1BQU0sR0FBQTtBQUNYLFFBQUEsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUM7S0FDakM7SUFDTSxNQUFNLEdBQUE7QUFDWCxRQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNsRCxRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdkUsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3pFLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM1RSxRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDN0UsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3JCLFFBQUEsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5QjtBQUNNLElBQUEsT0FBTyxDQUFDLElBQWMsRUFBQTtRQUMzQixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3hDO0FBQ00sSUFBQSxVQUFVLENBQUMsSUFBYyxFQUFBO1FBQzlCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZDLFFBQUEsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDZCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0IsU0FBQTtRQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztLQUNyQjtBQUNELElBQUEsV0FBQSxDQUFtQixNQUFnQixFQUFFLEVBQVUsRUFBRSxTQUFjLElBQUksRUFBQTtBQUNqRSxRQUFBLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLFFBQUEsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDckIsUUFBQSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBUSxLQUFBLEVBQUEsRUFBRSxFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBQzFELFFBQUEsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEdBQUcsZ0NBQWdDLENBQUM7UUFDL0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVELElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUM1RCxRQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDMUMsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQSxLQUFBLEVBQVEsSUFBSSxDQUFDLEtBQUssQ0FBYSxVQUFBLEVBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQSxHQUFBLENBQUssQ0FBQyxDQUFDO0FBQ2xGLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNwRSxRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdEUsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3pFLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUU1QyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZixJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNoRCxZQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNsQyxZQUFBLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdEIsZ0JBQUEsS0FBSyxJQUFJLEtBQUssR0FBVyxDQUFDLEVBQUUsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO29CQUNoRSxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNDLG9CQUFBLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDaEQsb0JBQUEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVCLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzFDLG9CQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3hDLGlCQUFBO0FBQ0YsYUFBQTtBQUNGLFNBQUE7UUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9DLFVBQVUsQ0FBQyxNQUFLO1lBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ25DLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDVDtJQUNNLFNBQVMsQ0FBQyxRQUFrQixFQUFFLEVBQWUsRUFBQTtRQUNsRCxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDckMsWUFBQSxLQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMzRSxTQUFBO0tBQ0Y7QUFDTSxJQUFBLFFBQVEsQ0FBQyxDQUFNLEVBQUE7QUFDcEIsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7S0FDN0I7QUFDTSxJQUFBLFNBQVMsQ0FBQyxDQUFNLEVBQUE7QUFDckIsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7S0FDN0I7QUFDTSxJQUFBLGFBQWEsQ0FBQyxDQUFNLEVBQUE7QUFDekIsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5QjtBQUNNLElBQUEsY0FBYyxDQUFDLENBQU0sRUFBRSxDQUFNLEVBQUUsTUFBTSxHQUFHLEtBQUssRUFBQTtRQUNsRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDZixZQUFBLElBQUksTUFBTSxFQUFFO0FBQ1YsZ0JBQUEsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixnQkFBQSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNoQixhQUFBO0FBQU0saUJBQUE7QUFDTCxnQkFBQSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzFDLGdCQUFBLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDMUMsYUFBQTtBQUNELFlBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUEsS0FBQSxFQUFRLElBQUksQ0FBQyxLQUFLLENBQWEsVUFBQSxFQUFBLElBQUksQ0FBQyxLQUFLLENBQUEsR0FBQSxDQUFLLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksS0FBSTtnQkFDNUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2hCLGFBQUMsQ0FBQyxDQUFBO0FBQ0gsU0FBQTtLQUNGO0FBQ0Y7O0FDekhELElBQVksUUFLWCxDQUFBO0FBTEQsQ0FBQSxVQUFZLFFBQVEsRUFBQTtBQUNsQixJQUFBLFFBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsTUFBUSxDQUFBO0FBQ1IsSUFBQSxRQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLE1BQVEsQ0FBQTtBQUNSLElBQUEsUUFBQSxDQUFBLFFBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxRQUFVLENBQUE7QUFDVixJQUFBLFFBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsTUFBUSxDQUFBO0FBQ1YsQ0FBQyxFQUxXLFFBQVEsS0FBUixRQUFRLEdBS25CLEVBQUEsQ0FBQSxDQUFBLENBQUE7TUFDWSxRQUFRLENBQUE7QUFDWCxJQUFBLE1BQU0sQ0FBYztBQUNyQixJQUFBLFFBQVEsQ0FBYztBQUNyQixJQUFBLE1BQU0sQ0FBYTtJQUNuQixLQUFLLEdBQWUsRUFBRSxDQUFDO0lBQ3hCLE9BQU8sR0FBWSxLQUFLLENBQUM7SUFDekIsT0FBTyxHQUFZLEtBQUssQ0FBQztBQUN4QixJQUFBLFFBQVEsR0FBYSxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQ25DLElBQUksR0FBVyxDQUFDLENBQUM7SUFDakIsUUFBUSxHQUFXLEdBQUcsQ0FBQztJQUN2QixRQUFRLEdBQVcsR0FBRyxDQUFDO0lBQ3ZCLFVBQVUsR0FBVyxHQUFHLENBQUM7SUFDekIsZUFBZSxHQUFXLENBQUMsQ0FBQztJQUM1QixRQUFRLEdBQVcsQ0FBQyxDQUFDO0lBQ3JCLFFBQVEsR0FBVyxDQUFDLENBQUM7SUFDckIsS0FBSyxHQUFXLENBQUMsQ0FBQztJQUNsQixLQUFLLEdBQVcsQ0FBQyxDQUFDO0lBQ2xCLE9BQU8sR0FBVyxDQUFDLENBQUM7SUFDcEIsT0FBTyxHQUFXLENBQUMsQ0FBQztJQUNwQixZQUFZLEdBQW9CLElBQUksQ0FBQztJQUNyQyxZQUFZLEdBQW9CLElBQUksQ0FBQztJQUN0QyxRQUFRLEdBQW9CLElBQUksQ0FBQztJQUNoQyxXQUFXLEdBQW9CLElBQUksQ0FBQztJQUNwQyxRQUFRLEdBQW9CLElBQUksQ0FBQztJQUNqQyxhQUFhLEdBQVcsQ0FBQyxDQUFDO0lBQzFCLFNBQVMsR0FBVyxFQUFFLENBQUM7SUFDdkIsV0FBVyxHQUFXLEVBQUUsQ0FBQztBQUNqQyxJQUFBLFdBQUEsQ0FBbUIsTUFBa0IsRUFBQTtBQUNuQyxRQUFBLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLFFBQUEsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMscUNBQXFDLENBQUMsSUFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNILElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdkMsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztLQUNuQjtBQUNPLElBQUEsT0FBTyxDQUFDLEVBQU8sRUFBQTtRQUNyQixJQUFJLE9BQU8sR0FBa0IsRUFBRSxDQUFDO0FBQ2hDLFFBQUEsSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRTtBQUMxQixZQUFBLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQztBQUN0QyxTQUFBO0FBQU0sYUFBQTtZQUNMLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNwQixPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDM0MsU0FBQTtBQUNELFFBQUEsSUFBSSxDQUFDLE9BQU87WUFBRSxPQUFPO0FBQ3JCLFFBQUEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM3RCxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ2hCLFFBQUEsSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRTtZQUMzQixPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDaEMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQ2pDLFNBQUE7QUFBTSxhQUFBO0FBQ0wsWUFBQSxPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQztBQUNyQixZQUFBLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO0FBQ3RCLFNBQUE7QUFDRCxRQUFBLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztBQUN0RSxRQUFBLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztBQUV0RSxRQUFBLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzNCO0lBQ00sTUFBTSxHQUFBO0FBQ1gsUUFBQSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNwRCxPQUFPO1lBQ0wsRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ2xCLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVztZQUN0QixDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDaEIsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLEtBQUs7U0FDTixDQUFBO0tBQ0Y7SUFDTSxVQUFVLEdBQUE7UUFDZixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0tBQ3hIO0FBQ08sSUFBQSxLQUFLLENBQUMsTUFBVyxFQUFBO1FBQ3ZCLE9BQU8sTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ3JGO0FBQ08sSUFBQSxLQUFLLENBQUMsTUFBVyxFQUFBO1FBQ3ZCLE9BQU8sTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ3ZGO0FBQ08sSUFBQSxRQUFRLENBQUMsQ0FBTSxFQUFBO1FBQ3JCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUNwQjtJQUNNLFlBQVksR0FBQTtRQUNqQixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDckIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRCxZQUFBLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQzFCLFNBQUE7S0FDRjtJQUNNLFdBQVcsR0FBQTtRQUNoQixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDcEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNwRCxZQUFBLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLFNBQUE7S0FDRjtJQUNNLFlBQVksR0FBQTtRQUNqQixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDckIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRCxZQUFBLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQzFCLFNBQUE7S0FDRjtJQUNNLFFBQVEsR0FBQTtRQUNiLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQ3BCO0FBQ00sSUFBQSxVQUFVLENBQUMsSUFBYyxFQUFBO1FBQzlCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNoQixRQUFBLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDbEQ7QUFDTSxJQUFBLFVBQVUsQ0FBQyxJQUFjLEVBQUE7UUFDOUIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2hCLFFBQUEsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDekIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUNuRDtBQUNNLElBQUEsU0FBUyxDQUFDLElBQWMsRUFBQTtRQUM3QixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEIsUUFBQSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUN4QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2xEO0FBQ00sSUFBQSxVQUFVLENBQUMsSUFBYyxFQUFBO1FBQzlCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JDLFFBQUEsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDZCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDN0IsU0FBQTtRQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztLQUNuQjtJQUNNLE9BQU8sQ0FBQyxTQUFjLElBQUksRUFBQTtBQUMvQixRQUFBLElBQUksTUFBTSxHQUFHLE1BQU0sR0FBRyxNQUFNLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDeEQsUUFBQSxJQUFJLElBQUksR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkUsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNuQyxRQUFBLE9BQU8sSUFBSSxDQUFDO0tBQ2I7QUFDTSxJQUFBLE9BQU8sQ0FBQyxRQUFrQixFQUFFLE1BQWdCLEVBQUUsY0FBc0IsQ0FBQyxFQUFBO1FBQzFFLElBQUksUUFBUSxJQUFJLE1BQU07WUFBRSxPQUFPO1FBQy9CLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEtBQUk7QUFDbkMsWUFBQSxPQUFPLElBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQzVGLFNBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDYixPQUFPO0FBQ1IsU0FBQTtRQUNELE9BQU8sSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDMUQ7SUFDTSxRQUFRLEdBQUE7O0FBRWIsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNwRSxRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDaEUsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBRXJFLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNsRSxRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDaEUsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQUV0RSxRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBR3pFLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM5RCxRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBRW5FLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFFbEUsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ2xFO0FBQ00sSUFBQSxPQUFPLENBQUMsQ0FBTSxFQUFBO0FBQ25CLFFBQUEsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLFFBQVEsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDOUQsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFBO0FBQ2xCLFlBQUEsSUFBSSxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUksRUFBRTtBQUM3QixnQkFBQSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzNCLGdCQUFBLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQzFCLGFBQUE7QUFDRCxZQUFBLElBQUksSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLEVBQUU7QUFDN0IsZ0JBQUEsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUMzQixnQkFBQSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUMxQixhQUFBO0FBQ0YsU0FBQTtLQUNGO0FBQ00sSUFBQSxVQUFVLENBQUMsS0FBVSxFQUFBO1FBQzFCLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtZQUNqQixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUE7QUFDdEIsWUFBQSxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFOztnQkFFcEIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2pCLGFBQUE7QUFBTSxpQkFBQTs7Z0JBRUwsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hCLGFBQUE7QUFDRixTQUFBO0tBQ0Y7SUFDTSxZQUFZLEdBQUE7QUFDakIsUUFBQSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDbkUsUUFBQSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDbkUsUUFBQSxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDakMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0tBQ25CO0lBQ00sT0FBTyxHQUFBO0FBQ1osUUFBQSxJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUM3QixZQUFBLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM3QixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDckIsU0FBQTtLQUNGO0lBQ00sUUFBUSxHQUFBO0FBQ2IsUUFBQSxJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUM3QixZQUFBLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM3QixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDckIsU0FBQTtLQUNGO0lBQ00sVUFBVSxHQUFBO0FBQ2YsUUFBQSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFFO0FBQ2xCLFlBQUEsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7WUFDZCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDckIsU0FBQTtLQUNGO0FBRU0sSUFBQSxTQUFTLENBQUMsQ0FBTSxFQUFBO1FBQ3JCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMzQyxRQUFBLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFO1lBQ2xDLElBQUksSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3BGLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3RDLG9CQUFBLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxFQUFFO3dCQUNyRSxPQUFPO0FBQ1IscUJBQUE7QUFDRCxvQkFBQSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7QUFDOUIsb0JBQUEsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM1RCxvQkFBQSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDOUQsaUJBQUE7QUFBTSxxQkFBQTtBQUNMLG9CQUFBLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztBQUMvQixpQkFBQTtBQUNGLGFBQUE7QUFBTSxpQkFBQTtBQUNMLGdCQUFBLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUNqQyxhQUFBO0FBQ0YsU0FBQTtBQUNELFFBQUEsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRTtZQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDbkMsU0FBQTtBQUFNLGFBQUE7QUFDTCxZQUFBLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUN2QixZQUFBLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUN4QixTQUFBO0FBQ0QsUUFBQSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUNwQixRQUFBLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0tBQ3RCO0FBQ00sSUFBQSxJQUFJLENBQUMsQ0FBTSxFQUFBO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTztZQUFFLE9BQU87QUFDMUIsUUFBQSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ2hCLFFBQUEsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRTtZQUMxQixPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDL0IsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQ2hDLFNBQUE7QUFBTSxhQUFBO0FBQ0wsWUFBQSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUNwQixZQUFBLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQ3JCLFNBQUE7UUFDRCxRQUFRLElBQUksQ0FBQyxRQUFRO1lBQ25CLEtBQUssUUFBUSxDQUFDLE1BQU07QUFDbEIsZ0JBQUE7QUFDRSxvQkFBQSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUE7QUFDM0Qsb0JBQUEsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFBO29CQUMzRCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsWUFBWSxHQUFHLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztvQkFDL0YsTUFBTTtBQUNQLGlCQUFBO1lBQ0gsS0FBSyxRQUFRLENBQUMsSUFBSTtBQUNoQixnQkFBQTtBQUNFLG9CQUFBLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQztBQUN6QyxvQkFBQSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUM7QUFDekMsb0JBQUEsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDckIsb0JBQUEsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDeEMsTUFBTTtBQUNQLGlCQUFBO1lBQ0gsS0FBSyxRQUFRLENBQUMsSUFBSTtBQUNoQixnQkFBQTtvQkFDRSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDakIsd0JBQUEsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0FBQ3RFLHdCQUFBLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQzt3QkFDdEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUNsRixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3RDLHFCQUFBO29CQUNELE1BQU07QUFDUCxpQkFBQTtBQUNKLFNBQUE7QUFFRCxRQUFBLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7QUFDMUIsWUFBQSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUN2QixZQUFBLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBQ3hCLFNBQUE7S0FDRjtBQUNNLElBQUEsT0FBTyxDQUFDLENBQU0sRUFBQTs7UUFFbkIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQzFGLFlBQUEsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0FBQzlCLFlBQUEsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDckIsWUFBQSxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNyQixPQUFPO0FBQ1IsU0FBQTtRQUVELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoQixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ25ELFlBQUEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3ZGLGFBQUE7QUFDRCxZQUFBLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDdkIsWUFBQSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztBQUN0QixTQUFBO1FBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztBQUNoQixRQUFBLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7QUFDekIsWUFBQSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUN2QixZQUFBLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ3hCLFNBQUE7QUFBTSxhQUFBO0FBQ0wsWUFBQSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUNwQixZQUFBLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQ3JCLFNBQUE7QUFDRCxRQUFBLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsTUFBTSxFQUFFO1lBQ3JDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3JFLFNBQUE7QUFDRCxRQUFBLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDO0FBQ3JCLFFBQUEsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDckIsUUFBQSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7QUFDOUIsUUFBQSxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNyQixRQUFBLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0tBQ3RCO0FBQ00sSUFBQSxXQUFXLENBQUMsQ0FBTSxFQUFBO1FBQ3ZCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUNwQjtBQUNGOztNQ2hWWSxVQUFVLENBQUE7QUFFZCxJQUFBLFNBQVMsQ0FBcUI7QUFDOUIsSUFBQSxJQUFJLENBQWtCO0FBQ3RCLElBQUEsT0FBTyxDQUFxQjtJQUM1QixjQUFjLEdBQWtCLElBQUksQ0FBQztJQUNwQyxNQUFNLEdBQVEsRUFBRSxDQUFDO0FBQ2xCLElBQUEsTUFBTSxDQUFNO0lBRVosV0FBVyxDQUFDLElBQVMsRUFBRSxTQUFjLEVBQUE7UUFDMUMsSUFBSSxJQUFJLElBQUksU0FBUyxFQUFFO1lBQ3JCLElBQUksSUFBSSxJQUFJLFNBQVM7QUFBRSxnQkFBQSxPQUFPLElBQUksQ0FBQztZQUNuQyxJQUFJLE1BQU0sR0FBUSxJQUFJLENBQUM7WUFDdkIsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsYUFBYSxLQUFLLElBQUksRUFBRTtnQkFDOUMsSUFBSSxTQUFTLElBQUksTUFBTSxFQUFFO0FBQ3ZCLG9CQUFBLE9BQU8sSUFBSSxDQUFDO0FBQ2IsaUJBQUE7QUFDRixhQUFBO0FBQ0YsU0FBQTtBQUNELFFBQUEsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUNELFdBQW1CLENBQUEsU0FBc0IsRUFBRSxNQUFBLEdBQWMsSUFBSSxFQUFBO0FBQzNELFFBQUEsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzNDLFFBQUEsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUk7QUFDdEIsWUFBQSxPQUFPLEVBQUUsRUFDUjtTQUNGLENBQUM7QUFDRixRQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLENBQUE7Ozs7Ozs7Ozs7Ozs7OztLQWUxQixDQUFDO1FBQ0YsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3RDO0lBQ00sTUFBTSxHQUFBO0FBQ1gsUUFBQSxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7S0FDNUI7SUFDTSxPQUFPLEdBQUE7UUFDWixPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQztLQUMvQjtJQUNNLE9BQU8sR0FBQTs7UUFFWixJQUFJLENBQUMsR0FBUSxFQUFFLENBQUM7UUFDaEIsSUFBSSxTQUFTLEdBQUcsa0JBQWtCLENBQUM7UUFDbkMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM5RCxTQUFBO0FBQ0QsUUFBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ1osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBRW5DLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDdEIsUUFBQSxPQUFPLElBQUksQ0FBQztLQUNiOztJQUVELEVBQUUsQ0FBQyxLQUFhLEVBQUUsUUFBYSxFQUFBOztBQUU3QixRQUFBLElBQUksT0FBTyxRQUFRLEtBQUssVUFBVSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQSw0REFBQSxFQUErRCxPQUFPLFFBQVEsQ0FBQSxDQUFFLENBQUMsQ0FBQztBQUNoRyxZQUFBLE9BQU8sS0FBSyxDQUFDO0FBQ2QsU0FBQTs7QUFFRCxRQUFBLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzdCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQSxtREFBQSxFQUFzRCxPQUFPLEtBQUssQ0FBQSxDQUFFLENBQUMsQ0FBQztBQUNwRixZQUFBLE9BQU8sS0FBSyxDQUFDO0FBQ2QsU0FBQTs7UUFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssU0FBUyxFQUFFO0FBQ3BDLFlBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRztBQUNuQixnQkFBQSxTQUFTLEVBQUUsRUFBRTthQUNkLENBQUE7QUFDRixTQUFBO0FBQ0QsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDN0M7SUFFRCxjQUFjLENBQUMsS0FBYSxFQUFFLFFBQWEsRUFBQTs7QUFHekMsUUFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFBRSxZQUFBLE9BQU8sS0FBSyxDQUFBO1FBRXJDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFBO1FBQzlDLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDakQsUUFBQSxNQUFNLFdBQVcsR0FBRyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDdEMsUUFBQSxJQUFJLFdBQVc7QUFBRSxZQUFBLFNBQVMsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFBO0tBQ3BEO0lBRUQsUUFBUSxDQUFDLEtBQWEsRUFBRSxPQUFZLEVBQUE7UUFDbEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDOztRQUVoQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssU0FBUyxFQUFFOztBQUVwQyxZQUFBLE9BQU8sS0FBSyxDQUFDO0FBQ2QsU0FBQTtBQUNELFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBYSxLQUFJO0FBQ3JELFlBQUEsUUFBUSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMxQixTQUFDLENBQUMsQ0FBQztLQUNKO0FBQ0Y7Ozs7In0=
