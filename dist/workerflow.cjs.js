
  /**
   * @license
   * author: Nguyen Van Hau
   * workerflow.js v0.0.1
   * Released under the MIT license.
   */

'use strict';

class EventFlow {
    events = {};
    constructor() {
    }
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
            // console.error(`This event: ${event} does not exist`);
            return false;
        }
        this.events[event].listeners.forEach((listener) => {
            listener(details);
        });
    }
}

class DataFlow {
    node;
    data = {};
    events;
    onSafe(event, callback) {
        this.events.onSafe(event, callback);
    }
    on(event, callback) {
        this.events.on(event, callback);
    }
    removeListener(event, callback) {
        this.events.removeListener(event, callback);
    }
    dispatch(event, details) {
        this.events.dispatch(event, details);
    }
    Event = {
        dataChange: "dataChange",
        change: "change",
        dispose: "dispose"
    };
    constructor(node) {
        this.node = node;
        this.events = new EventFlow();
    }
    InitData(data = null, properties = -1) {
        if (properties !== -1) {
            this.node.properties = properties;
        }
        this.load(data);
        this.BindEvent(this.node);
    }
    BindEvent(node) {
    }
    Set(key, value, sender = null) {
        this.data[key] = value;
        this.dispatch(`${this.Event.dataChange}_${key}`, {
            key, value, sender
        });
        this.dispatch(this.Event.dataChange, {
            key, value, sender
        });
        this.dispatch(this.Event.change, {
            key, value, sender
        });
    }
    Get(key) {
        return this.data[key];
    }
    load(data) {
        this.data = {};
        for (let key of Object.keys(this.node.properties)) {
            this.data[key] = (data?.[key] ?? (this.node.properties[key]?.default ?? ""));
        }
    }
    toJson() {
        let rs = {};
        for (let key of Object.keys(this.node.properties)) {
            rs[key] = this.Get(key);
        }
        return rs;
    }
}

class FlowCore {
    Id;
    properties = {};
    data = new DataFlow(this);
    elNode = document.createElement('div');
    events;
    onSafe(event, callback) {
        this.events.onSafe(event, callback);
    }
    on(event, callback) {
        this.events.on(event, callback);
    }
    removeListener(event, callback) {
        this.events.removeListener(event, callback);
    }
    dispatch(event, details) {
        this.events.dispatch(event, details);
    }
    BindDataEvent() {
        this.data.on(this.data.Event.dataChange, ({ key, value, sender }) => {
            setTimeout(() => {
                this.dispatch(`${this.data.Event.dataChange}_${key}`, {
                    type: 'data',
                    key, value, sender
                });
                this.dispatch(this.data.Event.dataChange, {
                    type: 'data',
                    key, value, sender
                });
            });
        });
        this.data.on(this.data.Event.change, ({ key, value, sender }) => {
            setTimeout(() => {
                this.dispatch(this.data.Event.change, {
                    type: 'data',
                    key, value, sender
                });
            });
        });
    }
    constructor() {
        this.events = new EventFlow();
    }
}
class BaseFlow extends FlowCore {
    parent;
    constructor(parent) {
        super();
        this.parent = parent;
    }
}

class ControlFlow extends BaseFlow {
    constructor(parent) {
        super(parent);
        this.elNode = this.parent.elNode.querySelector('.workerflow-control__list') || this.elNode;
        if (this.elNode) {
            this.elNode.innerHTML = "";
            let keys = Object.keys(parent.option.control);
            keys.forEach(key => {
                let Node = document.createElement('div');
                Node.setAttribute('draggable', 'true');
                Node.setAttribute('data-node', key);
                Node.classList.add("workerflow-control__item");
                Node.innerHTML = parent.option.control[key].name;
                Node.addEventListener('dragstart', this.dragStart.bind(this));
                Node.addEventListener('dragend', this.dragend.bind(this));
                this.elNode.appendChild(Node);
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

class PropertyFlow extends BaseFlow {
    lastData;
    constructor(parent) {
        super(parent);
        this.Id = this.parent.getUuid();
        this.elNode = this.parent.elNode.querySelector('.workerflow-property__list') || this.elNode;
        this.elNode.innerHTML = "";
    }
    PropertyInfo(data) {
        if (this.lastData && this.lastData === data)
            return;
        this.lastData = data;
        this.RenderUI();
    }
    RenderUI() {
        this.elNode.innerHTML = "";
        if (this.lastData) {
            for (let item of Object.keys(this.lastData.node.properties)) {
                let propertyInfo = document.createElement('div');
                propertyInfo.classList.add('workerflow-property__item');
                let elLabel = document.createElement('span');
                elLabel.innerHTML = item;
                let elItem = document.createElement('input');
                elItem.setAttribute('node:model', item);
                propertyInfo.appendChild(elLabel);
                propertyInfo.appendChild(elItem);
                this.elNode.appendChild(propertyInfo);
            }
            this.lastData?.BindEvent(this);
        }
    }
}

class TabItemFlow extends BaseFlow {
    dataItem;
    ItemId;
    constructor(parent, dataItem) {
        super(parent);
        this.dataItem = dataItem;
        this.Id = this.parent.parent.getUuid();
        this.ItemId = dataItem.Id;
        this.elNode = document.createElement('div');
        this.elNode.classList.add("workerflow-item");
        this.elNode.setAttribute('data-project', this.ItemId);
        let nodeName = document.createElement('span');
        nodeName.setAttribute('node:model', 'name');
        nodeName.innerHTML = dataItem.name;
        this.elNode.appendChild(nodeName);
        this.parent.elNode.appendChild(this.elNode);
        this.elNode.addEventListener('click', this.ClickTab.bind(this));
    }
    ClickTab(e) {
        this.parent.LoadProjectById(this.ItemId);
    }
    SetData(dataItem) {
        this.dataItem = dataItem;
    }
    Active(flg = true) {
        if (flg) {
            this.elNode.classList.add('active');
            this.parent.parent.View?.load(this.dataItem);
        }
        else {
            this.elNode.classList.remove('active');
        }
    }
}
class TabFlow extends BaseFlow {
    tabs = [];
    tabActive;
    constructor(parent) {
        super(parent);
        this.elNode = this.parent.elNode.querySelector('.workerflow-items') || this.elNode;
        if (this.elNode) {
            this.elNode.innerHTML = '';
        }
    }
    LoadProjectById(projectId) {
        if (!projectId)
            return;
        let ProjectNext = this.tabs?.filter((item) => item.ItemId == projectId)?.[0];
        let dataNext = this.parent.modules[projectId];
        if (!dataNext)
            return;
        if (!ProjectNext) {
            ProjectNext = new TabItemFlow(this, dataNext);
            this.tabs = [...this.tabs, ProjectNext];
        }
        if (ProjectNext && this.tabActive) {
            if (this.tabActive == ProjectNext)
                return;
            this.UpdateData();
            this.tabActive.Active(false);
            this.tabActive = undefined;
        }
        this.tabActive = ProjectNext;
        this.tabActive.SetData(dataNext);
        this.tabActive.Active(true);
    }
    UpdateData() {
        if (this.tabActive) {
            this.parent.modules[this.tabActive.ItemId] = this.parent.View?.toJson();
        }
    }
    NewProject() {
        const data = {
            Id: this.parent.getUuid(),
            data: {
                name: `project-${this.parent.getTime()}`,
                x: 0,
                y: 0,
                zoom: 1,
            },
            nodes: []
        };
        this.LoadProject(data);
    }
    LoadProject(data) {
        this.parent.modules[data.Id] = data;
        this.LoadProjectById(data.Id);
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
        let { x: from_x, y: from_y } = this.fromNode.getDotOutput(this.outputIndex);
        var lineCurve = this.createCurvature(from_x, from_y, to_x, to_y, this.curvature, 'openclose');
        this.elPath.setAttributeNS(null, 'd', lineCurve);
    }
    update() {
        //Postion output
        if (this.toNode && this.toNode.elNode) {
            let to_x = this.toNode.getX() - 5;
            let to_y = this.toNode.getY() + this.toNode.elNode.clientHeight / 2;
            this.updateTo(to_x, to_y);
        }
    }
}

const geval = eval;
class NodeFlow extends BaseFlow {
    elNodeInputs = null;
    elNodeOutputs = null;
    elNodeContent = null;
    getY() {
        return +this.data.Get(this.propertieDefault.y.key);
    }
    getX() {
        return +this.data.Get(this.propertieDefault.x.key);
    }
    getDotInput(index = 1) {
        let elDot = this.elNodeOutputs?.querySelector(`.dot[node="${index}"]`);
        if (elDot) {
            let y = (this.elNode.offsetTop + elDot.offsetTop + 10);
            let x = (this.elNode.offsetLeft + elDot.offsetLeft - 10);
            return { x, y };
        }
        return {};
    }
    getDotOutput(index = 0) {
        let elDot = this.elNodeOutputs?.querySelector(`.dot[node="${index}"]`);
        if (elDot) {
            let y = (this.elNode.offsetTop + elDot.offsetTop + 10);
            let x = (this.elNode.offsetLeft + elDot.offsetLeft + 10);
            return { x, y };
        }
        return {};
    }
    arrLine = [];
    option;
    node;
    propertieDefault = {
        x: {
            key: "x",
            default: 0
        },
        y: {
            key: "y",
            default: 0
        }
    };
    properties = {};
    flgScript = false;
    Event = {
        ReUI: "ReUI",
        change: "change",
        updatePosition: "updatePosition",
        selected: "Selected",
        dataChange: "dataChange"
    };
    setOption(option = null, data = {}) {
        this.option = option || {};
        if (!this.option.properties) {
            this.option.properties = {};
        }
        this.node = this.option.node;
        this.Id = data?.Id ?? this.parent.parent.getUuid();
        this.properties = { ...this.propertieDefault, ...this.option.properties };
        this.data.InitData(data?.data);
    }
    constructor(parent, option = null) {
        super(parent);
        this.setOption(option, {});
        if (option) {
            this.ReUI();
        }
        this.on(this.Event.change, (e, sender) => {
            this.parent.dispatch(this.parent.Event.change, {
                ...e,
                targetNode: sender
            });
        });
    }
    toJson() {
        let LineJson = this.arrLine.filter((item) => item.fromNode === this).map((item) => ({
            fromNode: item.fromNode.Id,
            toNode: item.toNode?.Id,
            ouputIndex: item.outputIndex
        }));
        return {
            Id: this.Id,
            node: this.node,
            line: LineJson,
            data: this.data.toJson(),
        };
    }
    load(data) {
        let option = this.parent.getOption(data?.node);
        this.setOption(option, data);
        this.ReUI();
        return this;
    }
    output() {
        return this.option?.output ?? 0;
    }
    delete(isRemoveParent = true) {
        this.arrLine.forEach((item) => item.delete(this));
        this.data.dispatch(this.data.Event.change, {});
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
    ReUI() {
        if (this.elNode) {
            this.elNode.removeEventListener('mouseover', this.NodeOver.bind(this));
            this.elNode.removeEventListener('mouseleave', this.NodeLeave.bind(this));
            this.elNode.removeEventListener('mousedown', this.StartSelected.bind(this));
            this.elNode.removeEventListener('touchstart', this.StartSelected.bind(this));
            this.elNode.remove();
        }
        this.elNodeInputs = document.createElement('div');
        this.elNodeInputs.classList.add('workerflow-node_inputs');
        this.elNodeInputs.innerHTML = `<div class="inputs dot"></div>`;
        this.elNodeContent = document.createElement('div');
        this.elNodeContent.classList.add('workerflow-node_content');
        this.elNodeOutputs = document.createElement('div');
        this.elNodeOutputs.classList.add('workerflow-node_outputs');
        this.elNodeOutputs.innerHTML = `<div class="outputs dot" node="0"></div>`;
        this.elNode = document.createElement('div');
        this.elNode.classList.add("workerflow-node");
        if (this.option.class) {
            this.elNode.classList.add(this.option.class);
        }
        this.elNode.id = `node-${this.Id}`;
        this.elNode.setAttribute('data-node', this.Id);
        this.elNode.setAttribute('style', `top: ${this.getY()}px; left: ${this.getX()}px;`);
        this.elNode.addEventListener('mouseover', this.NodeOver.bind(this));
        this.elNode.addEventListener('mouseleave', this.NodeLeave.bind(this));
        this.elNode.addEventListener('mousedown', this.StartSelected.bind(this));
        this.elNode.addEventListener('touchstart', this.StartSelected.bind(this));
        this.elNode.appendChild(this.elNodeInputs);
        this.elNode.appendChild(this.elNodeContent);
        this.elNode.appendChild(this.elNodeOutputs);
        this.parent.elCanvas?.appendChild(this.elNode);
        if (this.data) {
            let dataTemp = this.data.toJson();
            this.data.load(dataTemp);
        }
        this.initOption();
        this.on(this.data.Event.dataChange, () => {
            this.UpdateUI();
        });
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
                for (let index = 0; index < this.option.output; index++) {
                    let output = document.createElement('div');
                    output.setAttribute('node', (300 + index).toString());
                    output.classList.add("dot");
                    output.classList.add("output_" + (index));
                    this.elNodeOutputs?.appendChild(output);
                }
            }
            if (this.option.input === 0 && this.elNodeInputs) {
                this.elNodeInputs.innerHTML = '';
            }
        }
        let self = this;
        setTimeout(() => {
            self.RunScript(self, self.elNode);
        }, 100);
    }
    RunScript(selfNode, el) {
        if (this.option && this.option.script && !this.flgScript) {
            this.flgScript = true;
            geval('(node,el)=>{' + this.option.script.toString() + '}')(selfNode, el);
            this.flgScript = true;
        }
    }
    checkNode(node) {
        return this.option && this.option.node == node;
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
                if (x !== this.getX()) {
                    this.data.Set(this.propertieDefault.x.key, x);
                }
                if (y !== this.getY()) {
                    this.data.Set(this.propertieDefault.y.key, y);
                }
            }
            else {
                this.data.Set(this.propertieDefault.y.key, (this.elNode.offsetTop - y));
                this.data.Set(this.propertieDefault.x.key, (this.elNode.offsetLeft - x));
            }
            this.dispatch(this.Event.updatePosition, { x: this.getX(), y: this.getY() });
            this.dispatch(this.Event.change, {});
            this.UpdateUI();
        }
    }
    UpdateUI() {
        this.elNode.setAttribute('style', `top: ${this.getY()}px; left: ${this.getX()}px;`);
        this.arrLine.forEach((item) => {
            item.update();
        });
    }
}

var MoveType;
(function (MoveType) {
    MoveType[MoveType["None"] = 0] = "None";
    MoveType[MoveType["Node"] = 1] = "Node";
    MoveType[MoveType["Canvas"] = 2] = "Canvas";
    MoveType[MoveType["Line"] = 3] = "Line";
})(MoveType || (MoveType = {}));
class ViewFlow extends BaseFlow {
    elCanvas;
    flgDrap = false;
    flgMove = false;
    moveType = MoveType.None;
    zoom_max = 1.6;
    zoom_min = 0.5;
    zoom_value = 0.1;
    zoom_last_value = 1;
    pos_x = 0;
    pos_y = 0;
    mouse_x = 0;
    mouse_y = 0;
    nodes = [];
    lineSelected = null;
    nodeSelected = null;
    nodeOver = null;
    dotSelected = null;
    tempLine = null;
    timeFastClick = 0;
    tagIngore = ['input', 'button', 'a', 'textarea'];
    getX() {
        return +this.data.Get(this.properties.x.key);
    }
    getY() {
        return +this.data.Get(this.properties.y.key);
    }
    getZoom() {
        return +this.data.Get(this.properties.zoom.key);
    }
    properties = {
        name: {
            key: "name",
        },
        zoom: {
            key: "zoom",
            default: 1,
            type: "number"
        },
        x: {
            key: "x",
            default: 0,
            type: "number"
        },
        y: {
            key: "y",
            default: 0,
            type: "number"
        }
    };
    Event = {
        change: "change",
        selected: "Selected",
        updateView: "updateView"
    };
    constructor(parent) {
        super(parent);
        this.elNode = this.parent.elNode.querySelector('.workerflow-desgin .workerflow-view') || this.elNode;
        this.elCanvas = document.createElement('div');
        this.elCanvas.classList.add("workerflow-canvas");
        this.elNode.appendChild(this.elCanvas);
        this.elNode.tabIndex = 0;
        this.addEvent();
        this.Reset();
        this.data.InitData(null, this.properties);
        this.on(this.data.Event.dataChange, (item) => {
            this.updateView();
        });
        this.updateView();
    }
    getOption(keyNode) {
        return this.parent.getOption(keyNode);
    }
    dropEnd(ev) {
        ev.preventDefault();
        if (Object.keys(this.parent.modules).length == 0) {
            this.parent.new();
        }
        let keyNode = '';
        if (ev.type === "touchend") {
            keyNode = this.parent.dataNodeSelect;
        }
        else {
            keyNode = ev.dataTransfer.getData("node");
        }
        let option = this.getOption(keyNode);
        if (option && option.onlyNode) {
            if (this.nodes.filter((item) => item.checkNode(keyNode)).length > 0) {
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
            Id: this.Id,
            data: this.data.toJson(),
            nodes
        };
    }
    load(data) {
        this.Reset();
        if (!data) {
            data = {};
        }
        if (!data.Id) {
            data.Id = this.parent.getUuid();
        }
        if (!data.data) {
            data.data = {};
        }
        if (!data.data[this.properties.name.key]) {
            data.data[this.properties.name.key] = `project-${this.parent.getTime()}`;
        }
        this.Id = data.Id;
        this.data.load(data.data);
        this.nodes = (data.nodes ?? []).map((item) => {
            return (new NodeFlow(this, "")).load(item);
        });
        (data.nodes ?? []).forEach((item) => {
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
        this.data.Set(this.properties.x.key, 0);
        this.data.Set(this.properties.y.key, 0);
        this.updateView();
    }
    getNodeById(nodeId) {
        return this.nodes?.filter((item) => item.Id == nodeId)[0];
    }
    updateView() {
        this.elCanvas.style.transform = "translate(" + this.getX() + "px, " + this.getY() + "px) scale(" + this.getZoom() + ")";
        this.dispatch(this.Event.updateView, { x: this.getX(), y: this.getY(), zoom: this.getZoom() });
    }
    CalcX(number) {
        return number * (this.elCanvas.clientWidth / (this.elNode?.clientWidth * this.getZoom()));
    }
    CalcY(number) {
        return number * (this.elCanvas.clientHeight / (this.elNode?.clientHeight * this.getZoom()));
    }
    dragover(e) {
        e.preventDefault();
    }
    UnSelectLine() {
        this.SelectLine(null);
    }
    UnSelectDot() {
        this.SelectDot(null);
    }
    UnSelectNode() {
        this.SelectNode(null);
    }
    UnSelect() {
        this.UnSelectLine();
        this.UnSelectNode();
        this.UnSelectDot();
    }
    SelectLine(node) {
        if (node == null) {
            if (this.lineSelected) {
                this.lineSelected.elPath?.classList.remove('active');
                this.lineSelected = null;
            }
        }
        else {
            this.UnSelect();
            this.lineSelected = node;
            this.lineSelected.elPath.classList.add('active');
        }
    }
    flgSelectNode = false;
    SelectNode(node) {
        if (node == null) {
            if (this.nodeSelected) {
                this.nodeSelected.elNode?.classList.remove('active');
                this.nodeSelected = null;
            }
            if (!this.flgSelectNode)
                this.parent.PropertyInfo(this.data);
        }
        else {
            this.flgSelectNode = true;
            this.UnSelect();
            this.nodeSelected = node;
            this.nodeSelected.elNode?.classList.add('active');
            this.parent.PropertyInfo(this.nodeSelected.data);
            this.flgSelectNode = false;
        }
    }
    SelectDot(node) {
        if (node == null) {
            if (this.dotSelected) {
                this.dotSelected.elNode?.classList.remove('active');
                this.dotSelected = null;
            }
        }
        else {
            this.UnSelect();
            this.dotSelected = node;
            this.dotSelected.elNode?.classList.add('active');
        }
    }
    RemoveNode(node) {
        var index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
        return this.nodes;
    }
    AddNode(option = null) {
        let node = new NodeFlow(this, option);
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
        this.elNode?.addEventListener('mouseup', this.EndMove.bind(this));
        this.elNode?.addEventListener('mouseleave', this.EndMove.bind(this));
        this.elNode?.addEventListener('mousemove', this.Move.bind(this));
        this.elNode?.addEventListener('mousedown', this.StartMove.bind(this));
        this.elNode?.addEventListener('touchend', this.EndMove.bind(this));
        this.elNode?.addEventListener('touchmove', this.Move.bind(this));
        this.elNode?.addEventListener('touchstart', this.StartMove.bind(this));
        /* Context Menu */
        this.elNode?.addEventListener('contextmenu', this.contextmenu.bind(this));
        /* Drop Drap */
        this.elNode?.addEventListener('drop', this.dropEnd.bind(this));
        this.elNode?.addEventListener('dragover', this.dragover.bind(this));
        /* Zoom Mouse */
        this.elNode?.addEventListener('wheel', this.zoom_enter.bind(this));
        /* Delete */
        this.elNode?.addEventListener('keydown', this.keydown.bind(this));
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
        this.data.Set(this.properties.x.key, (this.getX() / this.zoom_last_value) * this.getZoom());
        this.data.Set(this.properties.y.key, (this.getY() / this.zoom_last_value) * this.getZoom());
        this.zoom_last_value = this.getZoom();
        this.updateView();
    }
    zoom_in() {
        if (this.getZoom() < this.zoom_max) {
            this.data.Set(this.properties.zoom.key, (this.getZoom() + this.zoom_value));
            this.zoom_refresh();
        }
    }
    zoom_out() {
        if (this.getZoom() > this.zoom_min) {
            this.data.Set(this.properties.zoom.key, (this.getZoom() - this.zoom_value));
            this.zoom_refresh();
        }
    }
    zoom_reset() {
        if (this.getZoom() != 1) {
            this.data.Set(this.properties.zoom.key, this.properties.zoom.default);
            this.zoom_refresh();
        }
    }
    StartMove(e) {
        if (this.tagIngore.includes(e.target.tagName.toLowerCase())) {
            return;
        }
        this.timeFastClick = this.parent.getTime();
        if (e.target.classList.contains('main-path')) {
            return;
        }
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
                    let x = this.getX() + this.CalcX(-(this.pos_x - e_pos_x));
                    let y = this.getY() + this.CalcY(-(this.pos_y - e_pos_y));
                    this.elCanvas.style.transform = "translate(" + x + "px, " + y + "px) scale(" + this.getZoom() + ")";
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
        if (!this.flgDrap)
            return;
        //fix Fast Click
        if (((this.parent.getTime() - this.timeFastClick) < 300) || !this.flgMove) {
            if (this.moveType === MoveType.Canvas && this.flgDrap)
                this.UnSelect();
            this.moveType = MoveType.None;
            this.flgDrap = false;
            this.flgMove = false;
            return;
        }
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
            this.data.Set(this.properties.x.key, this.getX() + this.CalcX(-(this.pos_x - e_pos_x)));
            this.data.Set(this.properties.y.key, this.getY() + this.CalcY(-(this.pos_y - e_pos_y)));
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

class WorkerFlow extends FlowCore {
    View;
    Control;
    Property;
    Tab;
    modules = {};
    dataNodeSelect = null;
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
        super();
        this.elNode = container;
        this.elNode.classList.add("workerflow");
        this.option = option || {
            control: {}
        };
        this.elNode.innerHTML = `
    <div class="workerflow-control">
      <h2 class="workerflow-control__header">Node Control</h2>
      <div class="workerflow-control__list">
      </div>
    </div>
    <div class="workerflow-desgin">
      <div class="workerflow-items">
      </div>
      <div class="workerflow-view">
      </div>
    </div>
    <div class="workerflow-property">
      <h2 class="workerflow-property__header">Properties</h2>
      <div class="workerflow-property__list">
      </div>
      <h2 class="workerflow-property__header">Project</h2>
      <div class="workerflow-property__list">
      </div>
    </div>
    `;
        this.View = new ViewFlow(this);
        this.Tab = new TabFlow(this);
        this.Control = new ControlFlow(this);
        this.Property = new PropertyFlow(this);
    }
    new() {
        this.Tab?.NewProject();
    }
    openProject(moduels) {
        this.modules = moduels;
        let key = Object.keys(this.modules)[0];
        if (key) {
            this.load(this.modules[key]);
        }
    }
    load(data) {
        this.Tab?.LoadProject(data);
    }
    PropertyInfo(data) {
        this.Property?.PropertyInfo(data);
    }
    getOption(keyNode) {
        if (!keyNode)
            return;
        let control = this.option.control[keyNode];
        if (!control) {
            control = Object.values(this.option.control)[0];
        }
        control.node = keyNode;
        return control;
    }
    toJson() {
        this.Tab?.UpdateData();
        return this.modules;
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

module.exports = WorkerFlow;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5janMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL0V2ZW50Rmxvdy50cyIsIi4uL3NyYy9jb3JlL0RhdGFGbG93LnRzIiwiLi4vc3JjL2NvcmUvQmFzZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9Db250cm9sRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL1Byb3BlcnR5Rmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL1RhYkZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9MaW5lRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL05vZGVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVmlld0Zsb3cudHMiLCIuLi9zcmMvV29ya2VyRmxvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBGbG93Q29yZSB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudEZsb3cge1xuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcblxuICB9XG4gIHB1YmxpYyBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgICB0aGlzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgLyogRXZlbnRzICovXG4gIHB1YmxpYyBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcbiAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xuICAgICAgICBsaXN0ZW5lcnM6IFtdXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuXG4gICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZVxuXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVyc1xuICAgIGNvbnN0IGxpc3RlbmVySW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcbiAgICBjb25zdCBoYXNMaXN0ZW5lciA9IGxpc3RlbmVySW5kZXggPiAtMVxuICAgIGlmIChoYXNMaXN0ZW5lcikgbGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKVxuICB9XG5cbiAgcHVibGljIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gY29uc29sZS5lcnJvcihgVGhpcyBldmVudDogJHtldmVudH0gZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRmxvd0NvcmUgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBEYXRhRmxvdyB7XG4gIHByaXZhdGUgZGF0YTogYW55ID0ge307XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICB9XG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXG4gICAgZGlzcG9zZTogXCJkaXNwb3NlXCJcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIG5vZGU6IEZsb3dDb3JlKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG4gIH1cbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IC0xKSB7XG4gICAgICB0aGlzLm5vZGUucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICB0aGlzLkJpbmRFdmVudCh0aGlzLm5vZGUpO1xuICB9XG4gIHB1YmxpYyBCaW5kRXZlbnQobm9kZTogRmxvd0NvcmUpIHtcbiAgfVxuICBwdWJsaWMgU2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgIHRoaXMuZGlzcGF0Y2goYCR7dGhpcy5FdmVudC5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICB9KTtcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuZGF0YUNoYW5nZSwge1xuICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgfSk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge1xuICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgfSk7XG4gIH1cbiAgcHVibGljIEdldChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmRhdGFba2V5XTtcbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEgPSB7fTtcblxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcbiAgICAgIHRoaXMuZGF0YVtrZXldID0gKGRhdGE/LltrZXldID8/ICh0aGlzLm5vZGUucHJvcGVydGllc1trZXldPy5kZWZhdWx0ID8/IFwiXCIpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgcnM6IGFueSA9IHt9O1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcbiAgICAgIHJzW2tleV0gPSB0aGlzLkdldChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gcnM7XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgRmxvd0NvcmUge1xuICBwdWJsaWMgSWQ6IGFueTtcbiAgcHVibGljIHByb3BlcnRpZXM6IGFueSA9IHt9O1xuICBwdWJsaWMgZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICB9XG4gIEJpbmREYXRhRXZlbnQoKSB7XG4gICAgdGhpcy5kYXRhLm9uKHRoaXMuZGF0YS5FdmVudC5kYXRhQ2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaChgJHt0aGlzLmRhdGEuRXZlbnQuZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSlcbiAgICB0aGlzLmRhdGEub24odGhpcy5kYXRhLkV2ZW50LmNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5kYXRhLkV2ZW50LmNoYW5nZSwge1xuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG5cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQmFzZUZsb3c8VFBhcmVudCBleHRlbmRzIEZsb3dDb3JlPiBleHRlbmRzIEZsb3dDb3JlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJlbnQ6IFRQYXJlbnQpIHtcbiAgICBzdXBlcigpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcclxuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbnRyb2xGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4gIHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctY29udHJvbF9fbGlzdCcpIHx8IHRoaXMuZWxOb2RlO1xyXG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGFyZW50Lm9wdGlvbi5jb250cm9sKTtcclxuICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgbGV0IE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcclxuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywga2V5KTtcclxuICAgICAgICBOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIik7XHJcbiAgICAgICAgTm9kZS5pbm5lckhUTUwgPSBwYXJlbnQub3B0aW9uLmNvbnRyb2xba2V5XS5uYW1lO1xyXG4gICAgICAgIE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcclxuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcclxuICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChOb2RlKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBkcmFnZW5kKGU6IGFueSkge1xyXG4gICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGRyYWdTdGFydChlOiBhbnkpIHtcclxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XHJcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuY2xvc2VzdChcIi53b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcclxuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xyXG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eUZsb3cgZXh0ZW5kcyBCYXNlRmxvdzxXb3JrZXJGbG93PiB7XHJcbiAgcHJpdmF0ZSBsYXN0RGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogV29ya2VyRmxvdykge1xyXG4gICAgc3VwZXIocGFyZW50KTtcclxuICAgIHRoaXMuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XHJcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1wcm9wZXJ0eV9fbGlzdCcpIHx8IHRoaXMuZWxOb2RlO1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcclxuICB9XHJcbiAgcHVibGljIFByb3BlcnR5SW5mbyhkYXRhOiBEYXRhRmxvdykge1xyXG4gICAgaWYgKHRoaXMubGFzdERhdGEgJiYgdGhpcy5sYXN0RGF0YSA9PT0gZGF0YSkgcmV0dXJuO1xyXG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XHJcbiAgICB0aGlzLlJlbmRlclVJKCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgUmVuZGVyVUkoKSB7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgaWYgKHRoaXMubGFzdERhdGEpIHtcclxuICAgICAgZm9yIChsZXQgaXRlbSBvZiBPYmplY3Qua2V5cyh0aGlzLmxhc3REYXRhLm5vZGUucHJvcGVydGllcykpIHtcclxuICAgICAgICBsZXQgcHJvcGVydHlJbmZvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgcHJvcGVydHlJbmZvLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctcHJvcGVydHlfX2l0ZW0nKTtcclxuICAgICAgICBsZXQgZWxMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBlbExhYmVsLmlubmVySFRNTCA9IGl0ZW07XHJcbiAgICAgICAgbGV0IGVsSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgZWxJdGVtLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIGl0ZW0pO1xyXG4gICAgICAgIHByb3BlcnR5SW5mby5hcHBlbmRDaGlsZChlbExhYmVsKTtcclxuICAgICAgICBwcm9wZXJ0eUluZm8uYXBwZW5kQ2hpbGQoZWxJdGVtKTtcclxuICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChwcm9wZXJ0eUluZm8pO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMubGFzdERhdGE/LkJpbmRFdmVudCh0aGlzKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XHJcbmltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuZXhwb3J0IGNsYXNzIFRhYkl0ZW1GbG93IGV4dGVuZHMgQmFzZUZsb3c8VGFiRmxvdz57XHJcbiAgcHVibGljIEl0ZW1JZDogYW55O1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFRhYkZsb3csIHByaXZhdGUgZGF0YUl0ZW06IGFueSkge1xyXG4gICAgc3VwZXIocGFyZW50KTtcclxuICAgIHRoaXMuSWQgPSB0aGlzLnBhcmVudC5wYXJlbnQuZ2V0VXVpZCgpO1xyXG4gICAgdGhpcy5JdGVtSWQgPSBkYXRhSXRlbS5JZDtcclxuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1pdGVtXCIpO1xyXG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnLCB0aGlzLkl0ZW1JZCk7XHJcbiAgICBsZXQgbm9kZU5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBub2RlTmFtZS5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCAnbmFtZScpO1xyXG4gICAgbm9kZU5hbWUuaW5uZXJIVE1MID0gZGF0YUl0ZW0ubmFtZTtcclxuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG5vZGVOYW1lKTtcclxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuQ2xpY2tUYWIuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgQ2xpY2tUYWIoZTogYW55KSB7XHJcbiAgICB0aGlzLnBhcmVudC5Mb2FkUHJvamVjdEJ5SWQodGhpcy5JdGVtSWQpO1xyXG4gIH1cclxuICBwdWJsaWMgU2V0RGF0YShkYXRhSXRlbTogYW55KSB7XHJcbiAgICB0aGlzLmRhdGFJdGVtID0gZGF0YUl0ZW07XHJcbiAgfVxyXG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBib29sZWFuID0gdHJ1ZSkge1xyXG4gICAgaWYgKGZsZykge1xyXG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgdGhpcy5wYXJlbnQucGFyZW50LlZpZXc/LmxvYWQodGhpcy5kYXRhSXRlbSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcbmV4cG9ydCBjbGFzcyBUYWJGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4gIHtcclxuICBwdWJsaWMgdGFiczogVGFiSXRlbUZsb3dbXSA9IFtdO1xyXG4gIHByaXZhdGUgdGFiQWN0aXZlOiBUYWJJdGVtRmxvdyB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctaXRlbXMnKSB8fCB0aGlzLmVsTm9kZTtcclxuICAgIGlmICh0aGlzLmVsTm9kZSkge1xyXG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBMb2FkUHJvamVjdEJ5SWQocHJvamVjdElkOiBhbnkpIHtcclxuICAgIGlmICghcHJvamVjdElkKSByZXR1cm47XHJcbiAgICBsZXQgUHJvamVjdE5leHQgPSB0aGlzLnRhYnM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5JdGVtSWQgPT0gcHJvamVjdElkKT8uWzBdO1xyXG4gICAgbGV0IGRhdGFOZXh0OiBhbnkgPSB0aGlzLnBhcmVudC5tb2R1bGVzW3Byb2plY3RJZF07XHJcbiAgICBpZiAoIWRhdGFOZXh0KSByZXR1cm47XHJcbiAgICBpZiAoIVByb2plY3ROZXh0KSB7XHJcbiAgICAgIFByb2plY3ROZXh0ID0gbmV3IFRhYkl0ZW1GbG93KHRoaXMsIGRhdGFOZXh0KTtcclxuICAgICAgdGhpcy50YWJzID0gWy4uLnRoaXMudGFicywgUHJvamVjdE5leHRdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChQcm9qZWN0TmV4dCAmJiB0aGlzLnRhYkFjdGl2ZSkge1xyXG4gICAgICBpZiAodGhpcy50YWJBY3RpdmUgPT0gUHJvamVjdE5leHQpIHJldHVybjtcclxuICAgICAgdGhpcy5VcGRhdGVEYXRhKCk7XHJcbiAgICAgIHRoaXMudGFiQWN0aXZlLkFjdGl2ZShmYWxzZSk7XHJcbiAgICAgIHRoaXMudGFiQWN0aXZlID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgdGhpcy50YWJBY3RpdmUgPSBQcm9qZWN0TmV4dDtcclxuICAgIHRoaXMudGFiQWN0aXZlLlNldERhdGEoZGF0YU5leHQpO1xyXG4gICAgdGhpcy50YWJBY3RpdmUuQWN0aXZlKHRydWUpO1xyXG4gIH1cclxuICBwdWJsaWMgVXBkYXRlRGF0YSgpIHtcclxuICAgIGlmICh0aGlzLnRhYkFjdGl2ZSkge1xyXG4gICAgICB0aGlzLnBhcmVudC5tb2R1bGVzW3RoaXMudGFiQWN0aXZlLkl0ZW1JZF0gPSB0aGlzLnBhcmVudC5WaWV3Py50b0pzb24oKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIE5ld1Byb2plY3QoKSB7XHJcbiAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICBJZDogdGhpcy5wYXJlbnQuZ2V0VXVpZCgpLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgbmFtZTogYHByb2plY3QtJHt0aGlzLnBhcmVudC5nZXRUaW1lKCl9YCxcclxuICAgICAgICB4OiAwLFxyXG4gICAgICAgIHk6IDAsXHJcbiAgICAgICAgem9vbTogMSxcclxuICAgICAgfSxcclxuICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcbiAgICB0aGlzLkxvYWRQcm9qZWN0KGRhdGEpO1xyXG4gIH1cclxuICBwdWJsaWMgTG9hZFByb2plY3QoZGF0YTogYW55KSB7XHJcbiAgICB0aGlzLnBhcmVudC5tb2R1bGVzW2RhdGEuSWRdID0gZGF0YTtcclxuICAgIHRoaXMuTG9hZFByb2plY3RCeUlkKGRhdGEuSWQpO1xyXG4gIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9WaWV3Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgTGluZUZsb3cge1xuICBwdWJsaWMgZWxDb25uZWN0aW9uOiBTVkdFbGVtZW50IHwgbnVsbDtcbiAgcHVibGljIGVsUGF0aDogU1ZHUGF0aEVsZW1lbnQ7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVmlld0Zsb3csIHB1YmxpYyBmcm9tTm9kZTogTm9kZUZsb3csIHB1YmxpYyB0b05vZGU6IE5vZGVGbG93IHwgbnVsbCA9IG51bGwsIHB1YmxpYyBvdXRwdXRJbmRleDogbnVtYmVyID0gMCkge1xuICAgIHRoaXMuZWxDb25uZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwic3ZnXCIpO1xuICAgIHRoaXMuZWxQYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKFwibWFpbi1wYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgJycpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uLmNsYXNzTGlzdC5hZGQoXCJjb25uZWN0aW9uXCIpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uLmFwcGVuZENoaWxkKHRoaXMuZWxQYXRoKTtcbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcz8uYXBwZW5kQ2hpbGQodGhpcy5lbENvbm5lY3Rpb24pO1xuICAgIHRoaXMuZnJvbU5vZGUuQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnRvTm9kZT8uQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LlNlbGVjdExpbmUodGhpcyk7XG4gIH1cbiAgcHJpdmF0ZSBjcmVhdGVDdXJ2YXR1cmUoc3RhcnRfcG9zX3g6IG51bWJlciwgc3RhcnRfcG9zX3k6IG51bWJlciwgZW5kX3Bvc194OiBudW1iZXIsIGVuZF9wb3NfeTogbnVtYmVyLCBjdXJ2YXR1cmVfdmFsdWU6IG51bWJlciwgdHlwZTogc3RyaW5nKSB7XG4gICAgbGV0IGxpbmVfeCA9IHN0YXJ0X3Bvc194O1xuICAgIGxldCBsaW5lX3kgPSBzdGFydF9wb3NfeTtcbiAgICBsZXQgeCA9IGVuZF9wb3NfeDtcbiAgICBsZXQgeSA9IGVuZF9wb3NfeTtcbiAgICBsZXQgY3VydmF0dXJlID0gY3VydmF0dXJlX3ZhbHVlO1xuICAgIC8vdHlwZSBvcGVuY2xvc2Ugb3BlbiBjbG9zZSBvdGhlclxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ290aGVyJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuXG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGRlbGV0ZShub2RlVGhpczogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKHRoaXMuZnJvbU5vZGUgIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLmZyb21Ob2RlLlJlbW92ZUxpbmUodGhpcyk7XG4gICAgaWYgKHRoaXMudG9Ob2RlICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50b05vZGU/LlJlbW92ZUxpbmUodGhpcyk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24/LnJlbW92ZSgpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uID0gbnVsbDtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVG8odG9feDogbnVtYmVyLCB0b195OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5mcm9tTm9kZS5lbE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xuICAgIGxldCB7IHg6IGZyb21feCwgeTogZnJvbV95IH06IGFueSA9IHRoaXMuZnJvbU5vZGUuZ2V0RG90T3V0cHV0KHRoaXMub3V0cHV0SW5kZXgpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZSgpIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG9Ob2RlICYmIHRoaXMudG9Ob2RlLmVsTm9kZSkge1xuICAgICAgbGV0IHRvX3ggPSB0aGlzLnRvTm9kZS5nZXRYKCkgLSA1O1xuICAgICAgbGV0IHRvX3kgPSB0aGlzLnRvTm9kZS5nZXRZKCkgKyB0aGlzLnRvTm9kZS5lbE5vZGUuY2xpZW50SGVpZ2h0IC8gMjtcbiAgICAgIHRoaXMudXBkYXRlVG8odG9feCwgdG9feSk7XG4gICAgfVxuXG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xyXG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XHJcbmNvbnN0IGdldmFsID0gZXZhbDtcclxuZXhwb3J0IGNsYXNzIE5vZGVGbG93IGV4dGVuZHMgQmFzZUZsb3c8Vmlld0Zsb3c+IHtcclxuICBwdWJsaWMgZWxOb2RlSW5wdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHB1YmxpYyBlbE5vZGVPdXRwdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHB1YmxpYyBlbE5vZGVDb250ZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHB1YmxpYyBnZXRZKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXRYKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXREb3RJbnB1dChpbmRleDogbnVtYmVyID0gMSkge1xyXG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZU91dHB1dHM/LnF1ZXJ5U2VsZWN0b3IoYC5kb3Rbbm9kZT1cIiR7aW5kZXh9XCJdYCk7XHJcbiAgICBpZiAoZWxEb3QpIHtcclxuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xyXG4gICAgICBsZXQgeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0ICsgZWxEb3Qub2Zmc2V0TGVmdCAtIDEwKTtcclxuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuICBwdWJsaWMgZ2V0RG90T3V0cHV0KGluZGV4OiBudW1iZXIgPSAwKSB7XHJcbiAgICBsZXQgZWxEb3Q6IGFueSA9IHRoaXMuZWxOb2RlT3V0cHV0cz8ucXVlcnlTZWxlY3RvcihgLmRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcclxuICAgIGlmIChlbERvdCkge1xyXG4gICAgICBsZXQgeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgKyBlbERvdC5vZmZzZXRUb3AgKyAxMCk7XHJcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0ICsgMTApO1xyXG5cclxuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuICBwdWJsaWMgYXJyTGluZTogTGluZUZsb3dbXSA9IFtdO1xyXG4gIHByaXZhdGUgb3B0aW9uOiBhbnk7XHJcbiAgcHJpdmF0ZSBub2RlOiBhbnk7XHJcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVEZWZhdWx0ID0ge1xyXG4gICAgeDoge1xyXG4gICAgICBrZXk6IFwieFwiLFxyXG4gICAgICBkZWZhdWx0OiAwXHJcbiAgICB9LFxyXG4gICAgeToge1xyXG4gICAgICBrZXk6IFwieVwiLFxyXG4gICAgICBkZWZhdWx0OiAwXHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fVxyXG4gIHByaXZhdGUgZmxnU2NyaXB0OiBib29sZWFuID0gZmFsc2U7XHJcbiAgcHVibGljIHJlYWRvbmx5IEV2ZW50ID0ge1xyXG4gICAgUmVVSTogXCJSZVVJXCIsXHJcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXHJcbiAgICB1cGRhdGVQb3NpdGlvbjogXCJ1cGRhdGVQb3NpdGlvblwiLFxyXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcclxuICAgIGRhdGFDaGFuZ2U6IFwiZGF0YUNoYW5nZVwiXHJcbiAgfTtcclxuICBwdWJsaWMgc2V0T3B0aW9uKG9wdGlvbjogYW55ID0gbnVsbCwgZGF0YTogYW55ID0ge30pIHtcclxuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uIHx8IHt9O1xyXG4gICAgaWYgKCF0aGlzLm9wdGlvbi5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgIHRoaXMub3B0aW9uLnByb3BlcnRpZXMgPSB7fTtcclxuICAgIH1cclxuICAgIHRoaXMubm9kZSA9IHRoaXMub3B0aW9uLm5vZGU7XHJcbiAgICB0aGlzLklkID0gZGF0YT8uSWQgPz8gdGhpcy5wYXJlbnQucGFyZW50LmdldFV1aWQoKTtcclxuICAgIHRoaXMucHJvcGVydGllcyA9IHsgLi4udGhpcy5wcm9wZXJ0aWVEZWZhdWx0LCAuLi50aGlzLm9wdGlvbi5wcm9wZXJ0aWVzIH07XHJcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoZGF0YT8uZGF0YSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFZpZXdGbG93LCBvcHRpb246IGFueSA9IG51bGwpIHtcclxuICAgIHN1cGVyKHBhcmVudCk7XHJcbiAgICB0aGlzLnNldE9wdGlvbihvcHRpb24sIHt9KTtcclxuICAgIGlmIChvcHRpb24pIHtcclxuICAgICAgdGhpcy5SZVVJKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLm9uKHRoaXMuRXZlbnQuY2hhbmdlLCAoZTogYW55LCBzZW5kZXI6IGFueSkgPT4ge1xyXG4gICAgICB0aGlzLnBhcmVudC5kaXNwYXRjaCh0aGlzLnBhcmVudC5FdmVudC5jaGFuZ2UsIHtcclxuICAgICAgICAuLi5lLFxyXG4gICAgICAgIHRhcmdldE5vZGU6IHNlbmRlclxyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgfVxyXG4gIHB1YmxpYyB0b0pzb24oKSB7XHJcbiAgICBsZXQgTGluZUpzb24gPSB0aGlzLmFyckxpbmUuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmZyb21Ob2RlID09PSB0aGlzKS5tYXAoKGl0ZW0pID0+ICh7XHJcbiAgICAgIGZyb21Ob2RlOiBpdGVtLmZyb21Ob2RlLklkLFxyXG4gICAgICB0b05vZGU6IGl0ZW0udG9Ob2RlPy5JZCxcclxuICAgICAgb3VwdXRJbmRleDogaXRlbS5vdXRwdXRJbmRleFxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgSWQ6IHRoaXMuSWQsXHJcbiAgICAgIG5vZGU6IHRoaXMubm9kZSxcclxuICAgICAgbGluZTogTGluZUpzb24sXHJcbiAgICAgIGRhdGE6IHRoaXMuZGF0YS50b0pzb24oKSxcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XHJcbiAgICBsZXQgb3B0aW9uID0gdGhpcy5wYXJlbnQuZ2V0T3B0aW9uKGRhdGE/Lm5vZGUpO1xyXG4gICAgdGhpcy5zZXRPcHRpb24ob3B0aW9uLCBkYXRhKTtcclxuICAgIHRoaXMuUmVVSSgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBvdXRwdXQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xyXG4gIH1cclxuICBwdWJsaWMgZGVsZXRlKGlzUmVtb3ZlUGFyZW50ID0gdHJ1ZSkge1xyXG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcclxuICAgIHRoaXMuZGF0YS5kaXNwYXRjaCh0aGlzLmRhdGEuRXZlbnQuY2hhbmdlLCB7fSk7XHJcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlKCk7XHJcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcclxuICAgIGlmIChpc1JlbW92ZVBhcmVudClcclxuICAgICAgdGhpcy5wYXJlbnQuUmVtb3ZlTm9kZSh0aGlzKTtcclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcclxuICB9XHJcbiAgcHVibGljIEFkZExpbmUobGluZTogTGluZUZsb3cpIHtcclxuICAgIHRoaXMuYXJyTGluZSA9IFsuLi50aGlzLmFyckxpbmUsIGxpbmVdO1xyXG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xyXG4gIH1cclxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lRmxvdykge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcclxuICAgIHJldHVybiB0aGlzLmFyckxpbmU7XHJcbiAgfVxyXG4gIHB1YmxpYyBSZVVJKCkge1xyXG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XHJcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLk5vZGVMZWF2ZS5iaW5kKHRoaXMpKTtcclxuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcclxuICAgIH1cclxuICAgIHRoaXMuZWxOb2RlSW5wdXRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfaW5wdXRzJyk7XHJcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImlucHV0cyBkb3RcIj48L2Rpdj5gO1xyXG4gICAgdGhpcy5lbE5vZGVDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZUNvbnRlbnQuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX2NvbnRlbnQnKTtcclxuICAgIHRoaXMuZWxOb2RlT3V0cHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9vdXRwdXRzJyk7XHJcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJvdXRwdXRzIGRvdFwiIG5vZGU9XCIwXCI+PC9kaXY+YDtcclxuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1ub2RlXCIpO1xyXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb24uY2xhc3MpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5lbE5vZGUuaWQgPSBgbm9kZS0ke3RoaXMuSWR9YDtcclxuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgdGhpcy5JZCk7XHJcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcclxuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVJbnB1dHMpO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVDb250ZW50KTtcclxuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlT3V0cHV0cyk7XHJcblxyXG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcclxuICAgIGlmICh0aGlzLmRhdGEpIHtcclxuICAgICAgbGV0IGRhdGFUZW1wID0gdGhpcy5kYXRhLnRvSnNvbigpO1xyXG4gICAgICB0aGlzLmRhdGEubG9hZChkYXRhVGVtcCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmluaXRPcHRpb24oKTtcclxuICAgIHRoaXMub24odGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsICgpID0+IHtcclxuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuUmVVSSwge30pO1xyXG4gIH1cclxuICBwdWJsaWMgY2hlY2tJbnB1dCgpIHtcclxuICAgIHJldHVybiAhKHRoaXMub3B0aW9uPy5pbnB1dCA9PT0gMCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgaW5pdE9wdGlvbigpIHtcclxuICAgIGlmICh0aGlzLmVsTm9kZUNvbnRlbnQgJiYgdGhpcy5vcHRpb24gJiYgdGhpcy5lbE5vZGVPdXRwdXRzKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlQ29udGVudC5pbm5lckhUTUwgPSB0aGlzLm9wdGlvbi5odG1sO1xyXG4gICAgICBpZiAodGhpcy5vcHRpb24ub3V0cHV0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgZm9yIChsZXQgaW5kZXg6IG51bWJlciA9IDA7IGluZGV4IDwgdGhpcy5vcHRpb24ub3V0cHV0OyBpbmRleCsrKSB7XHJcbiAgICAgICAgICBsZXQgb3V0cHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICBvdXRwdXQuc2V0QXR0cmlidXRlKCdub2RlJywgKDMwMCArIGluZGV4KS50b1N0cmluZygpKTtcclxuICAgICAgICAgIG91dHB1dC5jbGFzc0xpc3QuYWRkKFwiZG90XCIpO1xyXG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJvdXRwdXRfXCIgKyAoaW5kZXgpKTtcclxuICAgICAgICAgIHRoaXMuZWxOb2RlT3V0cHV0cz8uYXBwZW5kQ2hpbGQob3V0cHV0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbi5pbnB1dCA9PT0gMCAmJiB0aGlzLmVsTm9kZUlucHV0cykge1xyXG4gICAgICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIHNlbGYuUnVuU2NyaXB0KHNlbGYsIHNlbGYuZWxOb2RlKTtcclxuICAgIH0sIDEwMCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBSdW5TY3JpcHQoc2VsZk5vZGU6IE5vZGVGbG93LCBlbDogSFRNTEVsZW1lbnQgfCBudWxsKSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24uc2NyaXB0ICYmICF0aGlzLmZsZ1NjcmlwdCkge1xyXG4gICAgICB0aGlzLmZsZ1NjcmlwdCA9IHRydWU7XHJcbiAgICAgIGdldmFsKCcobm9kZSxlbCk9PnsnICsgdGhpcy5vcHRpb24uc2NyaXB0LnRvU3RyaW5nKCkgKyAnfScpKHNlbGZOb2RlLCBlbCk7XHJcbiAgICAgIHRoaXMuZmxnU2NyaXB0ID0gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGNoZWNrTm9kZShub2RlOiBhbnkpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbiAmJiB0aGlzLm9wdGlvbi5ub2RlID09IG5vZGU7XHJcbiAgfVxyXG4gIHB1YmxpYyBOb2RlT3ZlcihlOiBhbnkpIHtcclxuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gdGhpcztcclxuICB9XHJcbiAgcHVibGljIE5vZGVMZWF2ZShlOiBhbnkpIHtcclxuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gbnVsbDtcclxuICB9XHJcbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XHJcbiAgICB0aGlzLnBhcmVudC5TZWxlY3ROb2RlKHRoaXMpO1xyXG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnNlbGVjdGVkLCB7fSk7XHJcbiAgfVxyXG4gIHB1YmxpYyB1cGRhdGVQb3NpdGlvbih4OiBhbnksIHk6IGFueSwgaUNoZWNrID0gZmFsc2UpIHtcclxuICAgIGlmICh0aGlzLmVsTm9kZSkge1xyXG4gICAgICBpZiAoaUNoZWNrKSB7XHJcbiAgICAgICAgaWYgKHggIT09IHRoaXMuZ2V0WCgpKSB7XHJcbiAgICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSwgeCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh5ICE9PSB0aGlzLmdldFkoKSkge1xyXG4gICAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueS5rZXksIHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSwgKHRoaXMuZWxOb2RlLm9mZnNldFRvcCAtIHkpKTtcclxuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSwgKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC51cGRhdGVQb3NpdGlvbiwgeyB4OiB0aGlzLmdldFgoKSwgeTogdGhpcy5nZXRZKCkgfSk7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcclxuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XHJcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcclxuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgIGl0ZW0udXBkYXRlKCk7XHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcclxuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xyXG5pbXBvcnQgeyBMaW5lRmxvdyB9IGZyb20gXCIuL0xpbmVGbG93XCI7XHJcbmltcG9ydCB7IE5vZGVGbG93IH0gZnJvbSBcIi4vTm9kZUZsb3dcIjtcclxuXHJcbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcclxuICBOb25lID0gMCxcclxuICBOb2RlID0gMSxcclxuICBDYW52YXMgPSAyLFxyXG4gIExpbmUgPSAzLFxyXG59XHJcbmV4cG9ydCBjbGFzcyBWaWV3RmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+IHtcclxuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50O1xyXG4gIHB1YmxpYyBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XHJcbiAgcHVibGljIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XHJcbiAgcHJpdmF0ZSB6b29tX21heDogbnVtYmVyID0gMS42O1xyXG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcclxuICBwcml2YXRlIHpvb21fdmFsdWU6IG51bWJlciA9IDAuMTtcclxuICBwcml2YXRlIHpvb21fbGFzdF92YWx1ZTogbnVtYmVyID0gMTtcclxuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xyXG4gIHByaXZhdGUgcG9zX3k6IG51bWJlciA9IDA7XHJcbiAgcHJpdmF0ZSBtb3VzZV94OiBudW1iZXIgPSAwO1xyXG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcclxuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XHJcbiAgcHJpdmF0ZSBsaW5lU2VsZWN0ZWQ6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSBub2RlU2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XHJcbiAgcHVibGljIG5vZGVPdmVyOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgZG90U2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSB0ZW1wTGluZTogTGluZUZsb3cgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIHRpbWVGYXN0Q2xpY2s6IG51bWJlciA9IDA7XHJcbiAgcHJpdmF0ZSB0YWdJbmdvcmUgPSBbJ2lucHV0JywgJ2J1dHRvbicsICdhJywgJ3RleHRhcmVhJ107XHJcbiAgcHJpdmF0ZSBnZXRYKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy54LmtleSlcclxuICB9XHJcbiAgcHJpdmF0ZSBnZXRZKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy55LmtleSlcclxuICB9XHJcbiAgcHJpdmF0ZSBnZXRab29tKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBwcm9wZXJ0aWVzID0ge1xyXG4gICAgbmFtZToge1xyXG4gICAgICBrZXk6IFwibmFtZVwiLFxyXG4gICAgfSxcclxuICAgIHpvb206IHtcclxuICAgICAga2V5OiBcInpvb21cIixcclxuICAgICAgZGVmYXVsdDogMSxcclxuICAgICAgdHlwZTogXCJudW1iZXJcIlxyXG4gICAgfSxcclxuICAgIHg6IHtcclxuICAgICAga2V5OiBcInhcIixcclxuICAgICAgZGVmYXVsdDogMCxcclxuICAgICAgdHlwZTogXCJudW1iZXJcIlxyXG4gICAgfSxcclxuICAgIHk6IHtcclxuICAgICAga2V5OiBcInlcIixcclxuICAgICAgZGVmYXVsdDogMCxcclxuICAgICAgdHlwZTogXCJudW1iZXJcIlxyXG4gICAgfVxyXG4gIH07XHJcbiAgcHVibGljIHJlYWRvbmx5IEV2ZW50ID0ge1xyXG4gICAgY2hhbmdlOiBcImNoYW5nZVwiLFxyXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcclxuICAgIHVwZGF0ZVZpZXc6IFwidXBkYXRlVmlld1wiXHJcbiAgfTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctZGVzZ2luIC53b3JrZXJmbG93LXZpZXcnKSB8fCB0aGlzLmVsTm9kZTtcclxuICAgIHRoaXMuZWxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctY2FudmFzXCIpO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XHJcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XHJcbiAgICB0aGlzLmFkZEV2ZW50KCk7XHJcbiAgICB0aGlzLlJlc2V0KCk7XHJcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEobnVsbCwgdGhpcy5wcm9wZXJ0aWVzKTtcclxuICAgIHRoaXMub24odGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsIChpdGVtOiBhbnkpID0+IHtcclxuICAgICAgdGhpcy51cGRhdGVWaWV3KCk7XHJcbiAgICB9KTtcclxuICAgIHRoaXMudXBkYXRlVmlldygpO1xyXG4gIH1cclxuICBwdWJsaWMgZ2V0T3B0aW9uKGtleU5vZGU6IGFueSkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50LmdldE9wdGlvbihrZXlOb2RlKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBkcm9wRW5kKGV2OiBhbnkpIHtcclxuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZiAoT2JqZWN0LmtleXModGhpcy5wYXJlbnQubW9kdWxlcykubGVuZ3RoID09IDApIHtcclxuICAgICAgdGhpcy5wYXJlbnQubmV3KCk7XHJcbiAgICB9XHJcbiAgICBsZXQga2V5Tm9kZTogc3RyaW5nIHwgbnVsbCA9ICcnO1xyXG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xyXG4gICAgICBrZXlOb2RlID0gdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3Q7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xyXG4gICAgfVxyXG4gICAgbGV0IG9wdGlvbiA9IHRoaXMuZ2V0T3B0aW9uKGtleU5vZGUpO1xyXG4gICAgaWYgKG9wdGlvbiAmJiBvcHRpb24ub25seU5vZGUpIHtcclxuICAgICAgaWYgKHRoaXMubm9kZXMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmNoZWNrTm9kZShrZXlOb2RlKSkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgbGV0IG5vZGUgPSB0aGlzLkFkZE5vZGUob3B0aW9uKTtcclxuXHJcbiAgICBsZXQgZV9wb3NfeCA9IDA7XHJcbiAgICBsZXQgZV9wb3NfeSA9IDA7XHJcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xyXG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xyXG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XHJcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xyXG4gICAgfVxyXG4gICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xyXG4gICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xyXG5cclxuICAgIG5vZGUudXBkYXRlUG9zaXRpb24oeCwgeSk7XHJcblxyXG4gIH1cclxuICBwdWJsaWMgdG9Kc29uKCkge1xyXG4gICAgbGV0IG5vZGVzID0gdGhpcy5ub2Rlcy5tYXAoKGl0ZW0pID0+IGl0ZW0udG9Kc29uKCkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgSWQ6IHRoaXMuSWQsXHJcbiAgICAgIGRhdGE6IHRoaXMuZGF0YS50b0pzb24oKSxcclxuICAgICAgbm9kZXNcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XHJcbiAgICB0aGlzLlJlc2V0KCk7XHJcbiAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgZGF0YSA9IHt9O1xyXG4gICAgfVxyXG4gICAgaWYgKCFkYXRhLklkKSB7XHJcbiAgICAgIGRhdGEuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIWRhdGEuZGF0YSkge1xyXG4gICAgICBkYXRhLmRhdGEgPSB7fTtcclxuICAgIH1cclxuICAgIGlmICghZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0pIHtcclxuICAgICAgZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0gPSBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gO1xyXG4gICAgfVxyXG4gICAgdGhpcy5JZCA9IGRhdGEuSWQ7XHJcbiAgICB0aGlzLmRhdGEubG9hZChkYXRhLmRhdGEpO1xyXG4gICAgdGhpcy5ub2RlcyA9IChkYXRhLm5vZGVzID8/IFtdKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICByZXR1cm4gKG5ldyBOb2RlRmxvdyh0aGlzLCBcIlwiKSkubG9hZChpdGVtKTtcclxuICAgIH0pO1xyXG4gICAgKGRhdGEubm9kZXMgPz8gW10pLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAoaXRlbS5saW5lID8/IFtdKS5mb3JFYWNoKChsaW5lOiBhbnkpID0+IHtcclxuICAgICAgICBsZXQgZnJvbU5vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUuZnJvbU5vZGUpO1xyXG4gICAgICAgIGxldCB0b05vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUudG9Ob2RlKTtcclxuICAgICAgICBsZXQgb3VwdXRJbmRleCA9IGxpbmUub3VwdXRJbmRleCA/PyAwO1xyXG4gICAgICAgIGlmIChmcm9tTm9kZSAmJiB0b05vZGUpIHtcclxuICAgICAgICAgIHRoaXMuQWRkTGluZShmcm9tTm9kZSwgdG9Ob2RlLCBvdXB1dEluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICAgIHRoaXMudXBkYXRlVmlldygpO1xyXG4gIH1cclxuICBwdWJsaWMgUmVzZXQoKSB7XHJcbiAgICB0aGlzLm5vZGVzLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy54LmtleSwgMCk7XHJcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy55LmtleSwgMCk7XHJcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcclxuICB9XHJcbiAgcHVibGljIGdldE5vZGVCeUlkKG5vZGVJZDogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLklkID09IG5vZGVJZClbMF07XHJcbiAgfVxyXG4gIHB1YmxpYyB1cGRhdGVWaWV3KCkge1xyXG4gICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHRoaXMuZ2V0WCgpICsgXCJweCwgXCIgKyB0aGlzLmdldFkoKSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy5nZXRab29tKCkgKyBcIilcIjtcclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC51cGRhdGVWaWV3LCB7IHg6IHRoaXMuZ2V0WCgpLCB5OiB0aGlzLmdldFkoKSwgem9vbTogdGhpcy5nZXRab29tKCkgfSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgQ2FsY1gobnVtYmVyOiBhbnkpIHtcclxuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRXaWR0aCAvICh0aGlzLmVsTm9kZT8uY2xpZW50V2lkdGggKiB0aGlzLmdldFpvb20oKSkpO1xyXG4gIH1cclxuICBwcml2YXRlIENhbGNZKG51bWJlcjogYW55KSB7XHJcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxOb2RlPy5jbGllbnRIZWlnaHQgKiB0aGlzLmdldFpvb20oKSkpO1xyXG4gIH1cclxuICBwcml2YXRlIGRyYWdvdmVyKGU6IGFueSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH1cclxuICBwdWJsaWMgVW5TZWxlY3RMaW5lKCkge1xyXG4gICAgdGhpcy5TZWxlY3RMaW5lKG51bGwpO1xyXG4gIH1cclxuICBwdWJsaWMgVW5TZWxlY3REb3QoKSB7XHJcbiAgICB0aGlzLlNlbGVjdERvdChudWxsKTtcclxuICB9XHJcbiAgcHVibGljIFVuU2VsZWN0Tm9kZSgpIHtcclxuICAgIHRoaXMuU2VsZWN0Tm9kZShudWxsKTtcclxuICB9XHJcbiAgcHVibGljIFVuU2VsZWN0KCkge1xyXG4gICAgdGhpcy5VblNlbGVjdExpbmUoKTtcclxuICAgIHRoaXMuVW5TZWxlY3ROb2RlKCk7XHJcbiAgICB0aGlzLlVuU2VsZWN0RG90KCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBTZWxlY3RMaW5lKG5vZGU6IExpbmVGbG93IHwgbnVsbCkge1xyXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQpIHtcclxuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZC5lbFBhdGg/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5VblNlbGVjdCgpO1xyXG4gICAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG5vZGU7XHJcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4gIHByaXZhdGUgZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xyXG4gIHB1YmxpYyBTZWxlY3ROb2RlKG5vZGU6IE5vZGVGbG93IHwgbnVsbCkge1xyXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQpIHtcclxuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIXRoaXMuZmxnU2VsZWN0Tm9kZSlcclxuICAgICAgICB0aGlzLnBhcmVudC5Qcm9wZXJ0eUluZm8odGhpcy5kYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZmxnU2VsZWN0Tm9kZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuVW5TZWxlY3QoKTtcclxuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBub2RlO1xyXG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgICB0aGlzLnBhcmVudC5Qcm9wZXJ0eUluZm8odGhpcy5ub2RlU2VsZWN0ZWQuZGF0YSk7XHJcbiAgICAgIHRoaXMuZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgU2VsZWN0RG90KG5vZGU6IE5vZGVGbG93IHwgbnVsbCkge1xyXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5kb3RTZWxlY3RlZCkge1xyXG4gICAgICAgIHRoaXMuZG90U2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuICAgICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5VblNlbGVjdCgpO1xyXG4gICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbm9kZTtcclxuICAgICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlRmxvdykge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMubm9kZXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBBZGROb2RlKG9wdGlvbjogYW55ID0gbnVsbCk6IE5vZGVGbG93IHtcclxuICAgIGxldCBub2RlID0gbmV3IE5vZGVGbG93KHRoaXMsIG9wdGlvbik7XHJcbiAgICB0aGlzLm5vZGVzID0gWy4uLnRoaXMubm9kZXMsIG5vZGVdO1xyXG4gICAgcmV0dXJuIG5vZGU7XHJcbiAgfVxyXG4gIHB1YmxpYyBBZGRMaW5lKGZyb21Ob2RlOiBOb2RlRmxvdywgdG9Ob2RlOiBOb2RlRmxvdywgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcclxuICAgIGlmIChmcm9tTm9kZSA9PSB0b05vZGUpIHJldHVybjtcclxuICAgIGlmIChmcm9tTm9kZS5hcnJMaW5lLmZpbHRlcigoaXRlbSkgPT4ge1xyXG4gICAgICByZXR1cm4gaXRlbS50b05vZGUgPT09IHRvTm9kZSAmJiBpdGVtLm91dHB1dEluZGV4ID09IG91dHB1dEluZGV4ICYmIGl0ZW0gIT0gdGhpcy50ZW1wTGluZTtcclxuICAgIH0pLmxlbmd0aCA+IDApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBMaW5lRmxvdyh0aGlzLCBmcm9tTm9kZSwgdG9Ob2RlLCBvdXRwdXRJbmRleCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBhZGRFdmVudCgpIHtcclxuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXHJcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIC8qIENvbnRleHQgTWVudSAqL1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvKiBEcm9wIERyYXAgKi9cclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5kcm9wRW5kLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5kcmFnb3Zlci5iaW5kKHRoaXMpKTtcclxuICAgIC8qIFpvb20gTW91c2UgKi9cclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuem9vbV9lbnRlci5iaW5kKHRoaXMpKTtcclxuICAgIC8qIERlbGV0ZSAqL1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWRvd24uYmluZCh0aGlzKSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBrZXlkb3duKGU6IGFueSkge1xyXG4gICAgaWYgKGUua2V5ID09PSAnRGVsZXRlJyB8fCAoZS5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGUubWV0YUtleSkpIHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQuZGVsZXRlKCk7XHJcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLmxpbmVTZWxlY3RlZCAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZGVsZXRlKCk7XHJcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyB6b29tX2VudGVyKGV2ZW50OiBhbnkpIHtcclxuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuICAgICAgaWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcclxuICAgICAgICAvLyBab29tIE91dFxyXG4gICAgICAgIHRoaXMuem9vbV9vdXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBab29tIEluXHJcbiAgICAgICAgdGhpcy56b29tX2luKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIHpvb21fcmVmcmVzaCgpIHtcclxuICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLngua2V5LCAodGhpcy5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0aGlzLmdldFpvb20oKSk7XHJcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy55LmtleSwgKHRoaXMuZ2V0WSgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGhpcy5nZXRab29tKCkpO1xyXG4gICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0aGlzLmdldFpvb20oKTtcclxuICAgIHRoaXMudXBkYXRlVmlldygpO1xyXG4gIH1cclxuICBwdWJsaWMgem9vbV9pbigpIHtcclxuICAgIGlmICh0aGlzLmdldFpvb20oKSA8IHRoaXMuem9vbV9tYXgpIHtcclxuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuem9vbS5rZXksICh0aGlzLmdldFpvb20oKSArIHRoaXMuem9vbV92YWx1ZSkpO1xyXG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgem9vbV9vdXQoKSB7XHJcbiAgICBpZiAodGhpcy5nZXRab29tKCkgPiB0aGlzLnpvb21fbWluKSB7XHJcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnpvb20ua2V5LCAodGhpcy5nZXRab29tKCkgLSB0aGlzLnpvb21fdmFsdWUpKTtcclxuICAgICAgdGhpcy56b29tX3JlZnJlc2goKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIHpvb21fcmVzZXQoKSB7XHJcbiAgICBpZiAodGhpcy5nZXRab29tKCkgIT0gMSkge1xyXG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSwgdGhpcy5wcm9wZXJ0aWVzLnpvb20uZGVmYXVsdCk7XHJcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgU3RhcnRNb3ZlKGU6IGFueSkge1xyXG4gICAgaWYgKHRoaXMudGFnSW5nb3JlLmluY2x1ZGVzKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gdGhpcy5wYXJlbnQuZ2V0VGltZSgpO1xyXG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWFpbi1wYXRoJykpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTm9uZSkge1xyXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgJiYgdGhpcy5wYXJlbnQuY2hlY2tQYXJlbnQoZS50YXJnZXQsIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZSkpIHtcclxuICAgICAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdkb3QnKSkge1xyXG4gICAgICAgICAgaWYgKHRoaXMucGFyZW50LmNoZWNrUGFyZW50KGUudGFyZ2V0LCB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGVJbnB1dHMpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xyXG4gICAgICAgICAgdGhpcy50ZW1wTGluZSA9IG5ldyBMaW5lRmxvdyh0aGlzLCB0aGlzLm5vZGVTZWxlY3RlZCwgbnVsbCk7XHJcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lLm91dHB1dEluZGV4ID0gKyhlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuQ2FudmFzO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xyXG4gICAgICB0aGlzLnBvc194ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XHJcbiAgICAgIHRoaXMucG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucG9zX3ggPSBlLmNsaWVudFg7XHJcbiAgICAgIHRoaXMucG9zX3kgPSBlLmNsaWVudFk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xyXG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XHJcbiAgfVxyXG4gIHB1YmxpYyBNb3ZlKGU6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcclxuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XHJcbiAgICBsZXQgZV9wb3NfeCA9IDA7XHJcbiAgICBsZXQgZV9wb3NfeSA9IDA7XHJcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XHJcbiAgICAgIGVfcG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcclxuICAgICAgZV9wb3NfeSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcclxuICAgICAgZV9wb3NfeSA9IGUuY2xpZW50WTtcclxuICAgIH1cclxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xyXG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcclxuICAgICAgICB7XHJcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuZ2V0WCgpICsgdGhpcy5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcclxuICAgICAgICAgIGxldCB5ID0gdGhpcy5nZXRZKCkgKyB0aGlzLkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxyXG4gICAgICAgICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHggKyBcInB4LCBcIiArIHkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuZ2V0Wm9vbSgpICsgXCIpXCI7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcclxuICAgICAgICB7XHJcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xyXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcclxuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xyXG4gICAgICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XHJcbiAgICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZD8udXBkYXRlUG9zaXRpb24oeCwgeSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xyXG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XHJcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcclxuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLmVsQ2FudmFzLm9mZnNldExlZnQgLSB4LCB0aGlzLmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xyXG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnRvTm9kZSA9IHRoaXMubm9kZU92ZXI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xyXG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xyXG4gICAgICB0aGlzLm1vdXNlX3kgPSBlX3Bvc195O1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgRW5kTW92ZShlOiBhbnkpIHtcclxuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XHJcbiAgICAvL2ZpeCBGYXN0IENsaWNrXHJcbiAgICBpZiAoKCh0aGlzLnBhcmVudC5nZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMzAwKSB8fCAhdGhpcy5mbGdNb3ZlKSB7XHJcbiAgICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMgJiYgdGhpcy5mbGdEcmFwKVxyXG4gICAgICAgIHRoaXMuVW5TZWxlY3QoKTtcclxuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XHJcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xyXG4gICAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMudGVtcExpbmUgJiYgdGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5MaW5lKSB7XHJcbiAgICAgIGlmICh0aGlzLnRlbXBMaW5lLnRvTm9kZSAmJiB0aGlzLnRlbXBMaW5lLnRvTm9kZS5jaGVja0lucHV0KCkpIHtcclxuICAgICAgICB0aGlzLkFkZExpbmUodGhpcy50ZW1wTGluZS5mcm9tTm9kZSwgdGhpcy50ZW1wTGluZS50b05vZGUsIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXgpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMudGVtcExpbmUuZGVsZXRlKCk7XHJcbiAgICAgIHRoaXMudGVtcExpbmUgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xyXG4gICAgbGV0IGVfcG9zX3kgPSAwO1xyXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XHJcbiAgICAgIGVfcG9zX3ggPSB0aGlzLm1vdXNlX3g7XHJcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlX3Bvc194ID0gZS5jbGllbnRYO1xyXG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT09IE1vdmVUeXBlLkNhbnZhcykge1xyXG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy54LmtleSwgdGhpcy5nZXRYKCkgKyB0aGlzLkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKSk7XHJcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnkua2V5LCB0aGlzLmdldFkoKSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpKTtcclxuICAgIH1cclxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xyXG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XHJcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcclxuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xyXG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb250ZXh0bWVudShlOiBhbnkpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRmxvd0NvcmUgfSBmcm9tIFwiLi9jb3JlL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IENvbnRyb2xGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9Db250cm9sRmxvd1wiO1xyXG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL2NvcmUvRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgUHJvcGVydHlGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9Qcm9wZXJ0eUZsb3dcIjtcclxuaW1wb3J0IHsgVGFiRmxvdywgVGFiSXRlbUZsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL1RhYkZsb3dcIjtcclxuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL1ZpZXdGbG93XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgV29ya2VyRmxvdyBleHRlbmRzIEZsb3dDb3JlIHtcclxuXHJcbiAgcHVibGljIFZpZXc6IFZpZXdGbG93IHwgbnVsbDtcclxuICBwdWJsaWMgQ29udHJvbDogQ29udHJvbEZsb3cgfCBudWxsO1xyXG4gIHB1YmxpYyBQcm9wZXJ0eTogUHJvcGVydHlGbG93IHwgbnVsbDtcclxuICBwdWJsaWMgVGFiOiBUYWJGbG93IHwgbnVsbDtcclxuICBwdWJsaWMgbW9kdWxlczogYW55ID0ge307XHJcbiAgcHVibGljIGRhdGFOb2RlU2VsZWN0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICBwdWJsaWMgb3B0aW9uOiBhbnk7XHJcblxyXG4gIHB1YmxpYyBjaGVja1BhcmVudChub2RlOiBhbnksIG5vZGVDaGVjazogYW55KSB7XHJcbiAgICBpZiAobm9kZSAmJiBub2RlQ2hlY2spIHtcclxuICAgICAgaWYgKG5vZGUgPT0gbm9kZUNoZWNrKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgbGV0IHBhcmVudDogYW55ID0gbm9kZTtcclxuICAgICAgd2hpbGUgKChwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudCkgIT0gbnVsbCkge1xyXG4gICAgICAgIGlmIChub2RlQ2hlY2sgPT0gcGFyZW50KSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG9wdGlvbjogYW55ID0gbnVsbCkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMuZWxOb2RlID0gY29udGFpbmVyO1xyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3dcIik7XHJcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbiB8fCB7XHJcbiAgICAgIGNvbnRyb2w6IHt9XHJcbiAgICB9O1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxyXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbFwiPlxyXG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2hlYWRlclwiPk5vZGUgQ29udHJvbDwvaDI+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2xpc3RcIj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWRlc2dpblwiPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1pdGVtc1wiPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctdmlld1wiPlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctcHJvcGVydHlcIj5cclxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1wcm9wZXJ0eV9faGVhZGVyXCI+UHJvcGVydGllczwvaDI+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXByb3BlcnR5X19saXN0XCI+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LXByb3BlcnR5X19oZWFkZXJcIj5Qcm9qZWN0PC9oMj5cclxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctcHJvcGVydHlfX2xpc3RcIj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICAgIGA7XHJcbiAgICB0aGlzLlZpZXcgPSBuZXcgVmlld0Zsb3codGhpcyk7XHJcbiAgICB0aGlzLlRhYiA9IG5ldyBUYWJGbG93KHRoaXMpO1xyXG4gICAgdGhpcy5Db250cm9sID0gbmV3IENvbnRyb2xGbG93KHRoaXMpO1xyXG4gICAgdGhpcy5Qcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eUZsb3codGhpcyk7XHJcbiAgfVxyXG4gIHB1YmxpYyBuZXcoKSB7XHJcbiAgICB0aGlzLlRhYj8uTmV3UHJvamVjdCgpO1xyXG4gIH1cclxuICBwdWJsaWMgb3BlblByb2plY3QobW9kdWVsczogYW55KSB7XHJcbiAgICB0aGlzLm1vZHVsZXMgPSBtb2R1ZWxzO1xyXG4gICAgbGV0IGtleSA9IE9iamVjdC5rZXlzKHRoaXMubW9kdWxlcylbMF07XHJcbiAgICBpZiAoa2V5KSB7XHJcbiAgICAgIHRoaXMubG9hZCh0aGlzLm1vZHVsZXNba2V5XSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcclxuICAgIHRoaXMuVGFiPy5Mb2FkUHJvamVjdChkYXRhKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBQcm9wZXJ0eUluZm8oZGF0YTogRGF0YUZsb3cpIHtcclxuICAgIHRoaXMuUHJvcGVydHk/LlByb3BlcnR5SW5mbyhkYXRhKTtcclxuICB9XHJcbiAgcHVibGljIGdldE9wdGlvbihrZXlOb2RlOiBhbnkpIHtcclxuICAgIGlmICgha2V5Tm9kZSkgcmV0dXJuO1xyXG4gICAgbGV0IGNvbnRyb2wgPSB0aGlzLm9wdGlvbi5jb250cm9sW2tleU5vZGVdO1xyXG4gICAgaWYgKCFjb250cm9sKSB7XHJcbiAgICAgIGNvbnRyb2wgPSBPYmplY3QudmFsdWVzKHRoaXMub3B0aW9uLmNvbnRyb2wpWzBdO1xyXG4gICAgfVxyXG4gICAgY29udHJvbC5ub2RlID0ga2V5Tm9kZTtcclxuICAgIHJldHVybiBjb250cm9sO1xyXG4gIH1cclxuICBwdWJsaWMgdG9Kc29uKCkge1xyXG4gICAgdGhpcy5UYWI/LlVwZGF0ZURhdGEoKTtcclxuICAgIHJldHVybiB0aGlzLm1vZHVsZXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICB9XHJcbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcclxuICAgIC8vIGh0dHA6Ly93d3cuaWV0Zi5vcmcvcmZjL3JmYzQxMjIudHh0XHJcbiAgICBsZXQgczogYW55ID0gW107XHJcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM2OyBpKyspIHtcclxuICAgICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xyXG4gICAgfVxyXG4gICAgc1sxNF0gPSBcIjRcIjsgIC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxyXG4gICAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcclxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcclxuXHJcbiAgICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcclxuICAgIHJldHVybiB1dWlkO1xyXG4gIH1cclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztNQUVhLFNBQVMsQ0FBQTtJQUNaLE1BQU0sR0FBUSxFQUFFLENBQUM7QUFDekIsSUFBQSxXQUFBLEdBQUE7S0FFQztJQUNNLE1BQU0sQ0FBQyxLQUFhLEVBQUUsUUFBYSxFQUFBO0FBQ3hDLFFBQUEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDckMsUUFBQSxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztLQUMxQjs7SUFFTSxFQUFF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
