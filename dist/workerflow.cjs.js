
  /**
   * @license
   * author: Nguyen Van Hau
   * workerflow.js v0.0.1
   * Released under the MIT license.
   */

'use strict';

class DataFlow {
    node;
    data = {};
    nodes = [];
    Event = {
        dataChange: "dataChange",
        change: "change"
    };
    constructor(node) {
        this.node = node;
    }
    InitData(data = null, properties = -1) {
        if (properties !== -1) {
            this.node.properties = properties;
        }
        this.nodes = [this.node];
        this.load(data);
        this.BindEvent(this.node);
        this.UpdateUI();
    }
    RemoveEventAll() {
        for (let node of this.nodes) {
            node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
                item.removeEventListener('keyup', this.changeInput.bind(this));
            });
        }
        this.nodes = [];
    }
    RemoveEvent(node) {
        let index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes[index].elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
                item.removeEventListener('keyup', this.changeInput.bind(this));
            });
            node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
                item.removeEventListener('keyup', this.changeInput.bind(this));
            });
            this.nodes.splice(index);
        }
    }
    BindEvent(node) {
        this.RemoveEvent(node);
        this.nodes = [...this.nodes, node];
        node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
            if (item.tagName == 'SPAN' || item.tagName == 'DIV') {
                item.innerHTML = `${this.data[item.getAttribute(`node:model`)]}`;
            }
            else {
                item.value = this.data[item.getAttribute(`node:model`)];
            }
        });
        node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
            item.addEventListener('keyup', this.changeInput.bind(this));
        });
    }
    SetValue(key, value, elUpdate = null) {
        if (this.nodes.indexOf(this.node) == -1) {
            this.node.elNode.querySelectorAll(`[node\\:model="${key}"]`).forEach((item) => {
                if (item != elUpdate) {
                    if (item.tagName == 'SPAN' || item.tagName == 'DIV') {
                        item.innerHTML = `${value}`;
                    }
                    else {
                        item.value = value;
                    }
                }
            });
            this.node.dispatch(this.Event.dataChange, { key, value, elUpdate });
            this.node.dispatch(this.Event.change, { key, value, elUpdate });
        }
        for (let node of this.nodes) {
            node.elNode.querySelectorAll(`[node\\:model="${key}"]`).forEach((item) => {
                if (item != elUpdate) {
                    if (item.tagName == 'SPAN' || item.tagName == 'DIV') {
                        item.innerHTML = `${value}`;
                    }
                    else {
                        item.value = value;
                    }
                }
            });
            node.dispatch(this.Event.dataChange, { key, value, elUpdate });
            node.dispatch(this.Event.change, { key, value, elUpdate });
        }
    }
    Set(key, value, elUpdate = null) {
        this.data[key] = value;
        setTimeout(() => {
            this.SetValue(key, value, elUpdate);
        }, 100);
    }
    Get(key) {
        return this.data[key];
    }
    changeInput(e) {
        this.Set(e.target.getAttribute(`node:model`), e.target.value, e.target);
    }
    UpdateUI() {
        setTimeout(() => {
            for (let node of this.nodes) {
                node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
                    if (item.tagName == 'SPAN' || item.tagName == 'DIV') {
                        item.innerHTML = `${this.data[item.getAttribute(`node:model`)]}`;
                    }
                    else {
                        item.value = this.data[item.getAttribute(`node:model`)];
                    }
                });
            }
        }, 100);
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

class FlowCore {
    events;
    Id;
    properties = {};
    data = new DataFlow(this);
    elNode = document.createElement('div');
    on(event, callback) {
        this.events.on(event, callback);
    }
    removeListener(event, callback) {
        this.events.removeListener(event, callback);
    }
    dispatch(event, details) {
        this.events.dispatch(event, details);
    }
    constructor() {
        this.events = new EventFlow(this);
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
        if (this.lastData) {
            this.lastData.RemoveEvent(this);
        }
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
            this.parent.parent.View?.data.BindEvent(this);
        }
        else {
            this.elNode.classList.remove('active');
            this.parent.parent.View?.data.RemoveEvent(this);
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
        this.data.RemoveEventAll();
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
        this.data.RemoveEvent(this);
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
            this.data.RemoveEvent(this);
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
            this.data.UpdateUI();
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
        this.data.UpdateUI();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5janMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb25lbnRzL0RhdGFGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvQmFzZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9Db250cm9sRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL1Byb3BlcnR5Rmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL1RhYkZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9MaW5lRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL05vZGVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVmlld0Zsb3cudHMiLCIuLi9zcmMvV29ya2VyRmxvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBGbG93Q29yZSB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBEYXRhRmxvdyB7XG4gIHByaXZhdGUgZGF0YTogYW55ID0ge307XG4gIHB1YmxpYyBub2RlczogRmxvd0NvcmVbXSA9IFtdO1xuICBwdWJsaWMgcmVhZG9ubHkgRXZlbnQgPSB7XG4gICAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXG4gICAgY2hhbmdlOiBcImNoYW5nZVwiXG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBub2RlOiBGbG93Q29yZSkge1xuICB9XG4gIHB1YmxpYyBJbml0RGF0YShkYXRhOiBhbnkgPSBudWxsLCBwcm9wZXJ0aWVzOiBhbnkgPSAtMSkge1xuICAgIGlmIChwcm9wZXJ0aWVzICE9PSAtMSkge1xuICAgICAgdGhpcy5ub2RlLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIH1cbiAgICB0aGlzLm5vZGVzID0gW3RoaXMubm9kZV07XG4gICAgdGhpcy5sb2FkKGRhdGEpO1xuICAgIHRoaXMuQmluZEV2ZW50KHRoaXMubm9kZSk7XG4gICAgdGhpcy5VcGRhdGVVSSgpO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVFdmVudEFsbCgpIHtcbiAgICBmb3IgKGxldCBub2RlIG9mIHRoaXMubm9kZXMpIHtcbiAgICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbF1gKS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGl0ZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmNoYW5nZUlucHV0LmJpbmQodGhpcykpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMubm9kZXMgPSBbXTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlRXZlbnQobm9kZTogRmxvd0NvcmUpIHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yobm9kZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMubm9kZXNbaW5kZXhdLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5jaGFuZ2VJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgICAgbm9kZS5lbE5vZGUucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsXWApLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgaXRlbS5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuY2hhbmdlSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIEJpbmRFdmVudChub2RlOiBGbG93Q29yZSkge1xuICAgIHRoaXMuUmVtb3ZlRXZlbnQobm9kZSk7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICBpZiAoaXRlbS50YWdOYW1lID09ICdTUEFOJyB8fCBpdGVtLnRhZ05hbWUgPT0gJ0RJVicpIHtcbiAgICAgICAgaXRlbS5pbm5lckhUTUwgPSBgJHt0aGlzLmRhdGFbaXRlbS5nZXRBdHRyaWJ1dGUoYG5vZGU6bW9kZWxgKV19YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW0udmFsdWUgPSB0aGlzLmRhdGFbaXRlbS5nZXRBdHRyaWJ1dGUoYG5vZGU6bW9kZWxgKV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgbm9kZS5lbE5vZGUucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsXWApLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmNoYW5nZUlucHV0LmJpbmQodGhpcykpO1xuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgU2V0VmFsdWUoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIGVsVXBkYXRlID0gbnVsbCkge1xuICAgIGlmICh0aGlzLm5vZGVzLmluZGV4T2YodGhpcy5ub2RlKSA9PSAtMSkge1xuICAgICAgdGhpcy5ub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWw9XCIke2tleX1cIl1gKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGl0ZW0gIT0gZWxVcGRhdGUpIHtcbiAgICAgICAgICBpZiAoaXRlbS50YWdOYW1lID09ICdTUEFOJyB8fCBpdGVtLnRhZ05hbWUgPT0gJ0RJVicpIHtcbiAgICAgICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gYCR7dmFsdWV9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXRlbS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLm5vZGUuZGlzcGF0Y2godGhpcy5FdmVudC5kYXRhQ2hhbmdlLCB7IGtleSwgdmFsdWUsIGVsVXBkYXRlIH0pO1xuICAgICAgdGhpcy5ub2RlLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7IGtleSwgdmFsdWUsIGVsVXBkYXRlIH0pO1xuICAgIH1cbiAgICBmb3IgKGxldCBub2RlIG9mIHRoaXMubm9kZXMpIHtcbiAgICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbD1cIiR7a2V5fVwiXWApLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICBpZiAoaXRlbSAhPSBlbFVwZGF0ZSkge1xuICAgICAgICAgIGlmIChpdGVtLnRhZ05hbWUgPT0gJ1NQQU4nIHx8IGl0ZW0udGFnTmFtZSA9PSAnRElWJykge1xuICAgICAgICAgICAgaXRlbS5pbm5lckhUTUwgPSBgJHt2YWx1ZX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpdGVtLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG5vZGUuZGlzcGF0Y2godGhpcy5FdmVudC5kYXRhQ2hhbmdlLCB7IGtleSwgdmFsdWUsIGVsVXBkYXRlIH0pO1xuICAgICAgbm9kZS5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwgeyBrZXksIHZhbHVlLCBlbFVwZGF0ZSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgZWxVcGRhdGUgPSBudWxsKSB7XG4gICAgdGhpcy5kYXRhW2tleV0gPSB2YWx1ZTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuU2V0VmFsdWUoa2V5LCB2YWx1ZSwgZWxVcGRhdGUpO1xuICAgIH0sIDEwMCk7XG4gIH1cbiAgcHVibGljIEdldChrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmRhdGFba2V5XTtcbiAgfVxuICBwdWJsaWMgY2hhbmdlSW5wdXQoZTogYW55KSB7XG4gICAgdGhpcy5TZXQoZS50YXJnZXQuZ2V0QXR0cmlidXRlKGBub2RlOm1vZGVsYCksIGUudGFyZ2V0LnZhbHVlLCBlLnRhcmdldCk7XG4gIH1cblxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBmb3IgKGxldCBub2RlIG9mIHRoaXMubm9kZXMpIHtcbiAgICAgICAgbm9kZS5lbE5vZGUucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsXWApLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChpdGVtLnRhZ05hbWUgPT0gJ1NQQU4nIHx8IGl0ZW0udGFnTmFtZSA9PSAnRElWJykge1xuICAgICAgICAgICAgaXRlbS5pbm5lckhUTUwgPSBgJHt0aGlzLmRhdGFbaXRlbS5nZXRBdHRyaWJ1dGUoYG5vZGU6bW9kZWxgKV19YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXRlbS52YWx1ZSA9IHRoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sIDEwMCk7XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5kYXRhID0ge307XG5cbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5ub2RlLnByb3BlcnRpZXMpKSB7XG4gICAgICB0aGlzLmRhdGFba2V5XSA9IChkYXRhPy5ba2V5XSA/PyAodGhpcy5ub2RlLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCA/PyBcIlwiKSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgbGV0IHJzOiBhbnkgPSB7fTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5ub2RlLnByb3BlcnRpZXMpKSB7XG4gICAgICByc1trZXldID0gdGhpcy5HZXQoa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJzO1xuICB9XG59XG4iLCJpbXBvcnQgeyBGbG93Q29yZSB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudEZsb3cge1xuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogRmxvd0NvcmUpIHtcblxuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXMucGFyZW50O1xuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gY29uc29sZS5lcnJvcihgVGhpcyBldmVudDogJHtldmVudH0gZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XG4gICAgICBsaXN0ZW5lcihkZXRhaWxzLCBzZWxmKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBGbG93Q29yZSB7XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIHB1YmxpYyBJZDogYW55O1xuICBwdWJsaWMgcHJvcGVydGllczogYW55ID0ge307XG4gIHB1YmxpYyByZWFkb25seSBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3codGhpcyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEJhc2VGbG93PFRQYXJlbnQ+IGV4dGVuZHMgRmxvd0NvcmUge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIHBhcmVudDogVFBhcmVudCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgQ29udHJvbEZsb3cgZXh0ZW5kcyBCYXNlRmxvdzxXb3JrZXJGbG93PiAge1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1jb250cm9sX19saXN0JykgfHwgdGhpcy5lbE5vZGU7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwYXJlbnQub3B0aW9uLmNvbnRyb2wpO1xuICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGxldCBOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIE5vZGUuc2V0QXR0cmlidXRlKCdkcmFnZ2FibGUnLCAndHJ1ZScpO1xuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywga2V5KTtcbiAgICAgICAgTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1jb250cm9sX19pdGVtXCIpO1xuICAgICAgICBOb2RlLmlubmVySFRNTCA9IHBhcmVudC5vcHRpb24uY29udHJvbFtrZXldLm5hbWU7XG4gICAgICAgIE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcbiAgICAgICAgTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW5kJywgdGhpcy5kcmFnZW5kLmJpbmQodGhpcykpXG4gICAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKE5vZGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkcmFnZW5kKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBkcmFnU3RhcnQoZTogYW55KSB7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuY2xvc2VzdChcIi53b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcbmltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFByb3BlcnR5RmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+IHtcbiAgcHJpdmF0ZSBsYXN0RGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFdvcmtlckZsb3cpIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctcHJvcGVydHlfX2xpc3QnKSB8fCB0aGlzLmVsTm9kZTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICB9XG4gIHB1YmxpYyBQcm9wZXJ0eUluZm8oZGF0YTogRGF0YUZsb3cpIHtcbiAgICBpZiAodGhpcy5sYXN0RGF0YSAmJiB0aGlzLmxhc3REYXRhID09PSBkYXRhKSByZXR1cm47XG4gICAgaWYgKHRoaXMubGFzdERhdGEpIHtcbiAgICAgIHRoaXMubGFzdERhdGEuUmVtb3ZlRXZlbnQodGhpcyk7XG4gICAgfVxuICAgIHRoaXMubGFzdERhdGEgPSBkYXRhO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgfVxuICBwcml2YXRlIFJlbmRlclVJKCkge1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gICAgaWYgKHRoaXMubGFzdERhdGEpIHtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgT2JqZWN0LmtleXModGhpcy5sYXN0RGF0YS5ub2RlLnByb3BlcnRpZXMpKSB7XG4gICAgICAgIGxldCBwcm9wZXJ0eUluZm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgcHJvcGVydHlJbmZvLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctcHJvcGVydHlfX2l0ZW0nKTtcbiAgICAgICAgbGV0IGVsTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGVsTGFiZWwuaW5uZXJIVE1MID0gaXRlbTtcbiAgICAgICAgbGV0IGVsSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIGVsSXRlbS5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCBpdGVtKTtcbiAgICAgICAgcHJvcGVydHlJbmZvLmFwcGVuZENoaWxkKGVsTGFiZWwpO1xuICAgICAgICBwcm9wZXJ0eUluZm8uYXBwZW5kQ2hpbGQoZWxJdGVtKTtcbiAgICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJbmZvKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubGFzdERhdGE/LkJpbmRFdmVudCh0aGlzKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuZXhwb3J0IGNsYXNzIFRhYkl0ZW1GbG93IGV4dGVuZHMgQmFzZUZsb3c8VGFiRmxvdz57XG4gIHB1YmxpYyBJdGVtSWQ6IGFueTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogVGFiRmxvdywgcHJpdmF0ZSBkYXRhSXRlbTogYW55KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLklkID0gdGhpcy5wYXJlbnQucGFyZW50LmdldFV1aWQoKTtcbiAgICB0aGlzLkl0ZW1JZCA9IGRhdGFJdGVtLklkO1xuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctaXRlbVwiKTtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdCcsIHRoaXMuSXRlbUlkKTtcbiAgICBsZXQgbm9kZU5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgbm9kZU5hbWUuc2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJywgJ25hbWUnKTtcbiAgICBub2RlTmFtZS5pbm5lckhUTUwgPSBkYXRhSXRlbS5uYW1lO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG5vZGVOYW1lKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5DbGlja1RhYi5iaW5kKHRoaXMpKTtcbiAgfVxuICBwcml2YXRlIENsaWNrVGFiKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LkxvYWRQcm9qZWN0QnlJZCh0aGlzLkl0ZW1JZCk7XG4gIH1cbiAgcHVibGljIFNldERhdGEoZGF0YUl0ZW06IGFueSkge1xuICAgIHRoaXMuZGF0YUl0ZW0gPSBkYXRhSXRlbTtcbiAgfVxuICBwdWJsaWMgQWN0aXZlKGZsZzogYm9vbGVhbiA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIHRoaXMucGFyZW50LnBhcmVudC5WaWV3Py5sb2FkKHRoaXMuZGF0YUl0ZW0pO1xuICAgICAgdGhpcy5wYXJlbnQucGFyZW50LlZpZXc/LmRhdGEuQmluZEV2ZW50KHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgIHRoaXMucGFyZW50LnBhcmVudC5WaWV3Py5kYXRhLlJlbW92ZUV2ZW50KHRoaXMpO1xuICAgIH1cbiAgfVxuXG59XG5leHBvcnQgY2xhc3MgVGFiRmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+ICB7XG4gIHB1YmxpYyB0YWJzOiBUYWJJdGVtRmxvd1tdID0gW107XG4gIHByaXZhdGUgdGFiQWN0aXZlOiBUYWJJdGVtRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogV29ya2VyRmxvdykge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctaXRlbXMnKSB8fCB0aGlzLmVsTm9kZTtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICcnO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBMb2FkUHJvamVjdEJ5SWQocHJvamVjdElkOiBhbnkpIHtcbiAgICBpZiAoIXByb2plY3RJZCkgcmV0dXJuO1xuICAgIGxldCBQcm9qZWN0TmV4dCA9IHRoaXMudGFicz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLkl0ZW1JZCA9PSBwcm9qZWN0SWQpPy5bMF07XG4gICAgbGV0IGRhdGFOZXh0OiBhbnkgPSB0aGlzLnBhcmVudC5tb2R1bGVzW3Byb2plY3RJZF07XG4gICAgaWYgKCFkYXRhTmV4dCkgcmV0dXJuO1xuICAgIGlmICghUHJvamVjdE5leHQpIHtcbiAgICAgIFByb2plY3ROZXh0ID0gbmV3IFRhYkl0ZW1GbG93KHRoaXMsIGRhdGFOZXh0KTtcbiAgICAgIHRoaXMudGFicyA9IFsuLi50aGlzLnRhYnMsIFByb2plY3ROZXh0XTtcbiAgICB9XG5cbiAgICBpZiAoUHJvamVjdE5leHQgJiYgdGhpcy50YWJBY3RpdmUpIHtcbiAgICAgIGlmICh0aGlzLnRhYkFjdGl2ZSA9PSBQcm9qZWN0TmV4dCkgcmV0dXJuO1xuICAgICAgdGhpcy5VcGRhdGVEYXRhKCk7XG4gICAgICB0aGlzLnRhYkFjdGl2ZS5BY3RpdmUoZmFsc2UpO1xuICAgICAgdGhpcy50YWJBY3RpdmUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMudGFiQWN0aXZlID0gUHJvamVjdE5leHQ7XG4gICAgdGhpcy50YWJBY3RpdmUuU2V0RGF0YShkYXRhTmV4dCk7XG4gICAgdGhpcy50YWJBY3RpdmUuQWN0aXZlKHRydWUpO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVEYXRhKCkge1xuICAgIGlmICh0aGlzLnRhYkFjdGl2ZSkge1xuICAgICAgdGhpcy5wYXJlbnQubW9kdWxlc1t0aGlzLnRhYkFjdGl2ZS5JdGVtSWRdID0gdGhpcy5wYXJlbnQuVmlldz8udG9Kc29uKCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBOZXdQcm9qZWN0KCkge1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICBJZDogdGhpcy5wYXJlbnQuZ2V0VXVpZCgpLFxuICAgICAgZGF0YToge1xuICAgICAgICBuYW1lOiBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gLFxuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwLFxuICAgICAgICB6b29tOiAxLFxuICAgICAgfSxcbiAgICAgIG5vZGVzOiBbXVxuICAgIH1cbiAgICB0aGlzLkxvYWRQcm9qZWN0KGRhdGEpO1xuICB9XG4gIHB1YmxpYyBMb2FkUHJvamVjdChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5tb2R1bGVzW2RhdGEuSWRdID0gZGF0YTtcbiAgICB0aGlzLkxvYWRQcm9qZWN0QnlJZChkYXRhLklkKTtcbiAgfVxuXG59XG4iLCJpbXBvcnQgeyBOb2RlRmxvdyB9IGZyb20gXCIuL05vZGVGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lRmxvdyB7XG4gIHB1YmxpYyBlbENvbm5lY3Rpb246IFNWR0VsZW1lbnQgfCBudWxsO1xuICBwdWJsaWMgZWxQYXRoOiBTVkdQYXRoRWxlbWVudDtcbiAgcHJpdmF0ZSBjdXJ2YXR1cmU6IG51bWJlciA9IDAuNTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBWaWV3RmxvdywgcHVibGljIGZyb21Ob2RlOiBOb2RlRmxvdywgcHVibGljIHRvTm9kZTogTm9kZUZsb3cgfCBudWxsID0gbnVsbCwgcHVibGljIG91dHB1dEluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJzdmdcIik7XG4gICAgdGhpcy5lbFBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJwYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoXCJtYWluLXBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCAnJyk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24uY2xhc3NMaXN0LmFkZChcImNvbm5lY3Rpb25cIik7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24uYXBwZW5kQ2hpbGQodGhpcy5lbFBhdGgpO1xuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzPy5hcHBlbmRDaGlsZCh0aGlzLmVsQ29ubmVjdGlvbik7XG4gICAgdGhpcy5mcm9tTm9kZS5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudG9Ob2RlPy5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQuU2VsZWN0TGluZSh0aGlzKTtcbiAgfVxuICBwcml2YXRlIGNyZWF0ZUN1cnZhdHVyZShzdGFydF9wb3NfeDogbnVtYmVyLCBzdGFydF9wb3NfeTogbnVtYmVyLCBlbmRfcG9zX3g6IG51bWJlciwgZW5kX3Bvc195OiBudW1iZXIsIGN1cnZhdHVyZV92YWx1ZTogbnVtYmVyLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBsZXQgbGluZV94ID0gc3RhcnRfcG9zX3g7XG4gICAgbGV0IGxpbmVfeSA9IHN0YXJ0X3Bvc195O1xuICAgIGxldCB4ID0gZW5kX3Bvc194O1xuICAgIGxldCB5ID0gZW5kX3Bvc195O1xuICAgIGxldCBjdXJ2YXR1cmUgPSBjdXJ2YXR1cmVfdmFsdWU7XG4gICAgLy90eXBlIG9wZW5jbG9zZSBvcGVuIGNsb3NlIG90aGVyXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG5cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb3RoZXInOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcblxuICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG5cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZGVsZXRlKG5vZGVUaGlzOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICBpZiAodGhpcy5mcm9tTm9kZSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbU5vZGUuUmVtb3ZlTGluZSh0aGlzKTtcbiAgICBpZiAodGhpcy50b05vZGUgIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLnRvTm9kZT8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbj8ucmVtb3ZlKCk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24gPSBudWxsO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVUbyh0b194OiBudW1iZXIsIHRvX3k6IG51bWJlcikge1xuICAgIGlmICh0aGlzLmZyb21Ob2RlLmVsTm9kZSA9PSBudWxsKSByZXR1cm47XG4gICAgbGV0IHsgeDogZnJvbV94LCB5OiBmcm9tX3kgfTogYW55ID0gdGhpcy5mcm9tTm9kZS5nZXREb3RPdXRwdXQodGhpcy5vdXRwdXRJbmRleCk7XG4gICAgdmFyIGxpbmVDdXJ2ZSA9IHRoaXMuY3JlYXRlQ3VydmF0dXJlKGZyb21feCwgZnJvbV95LCB0b194LCB0b195LCB0aGlzLmN1cnZhdHVyZSwgJ29wZW5jbG9zZScpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgbGluZUN1cnZlKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlKCkge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50b05vZGUgJiYgdGhpcy50b05vZGUuZWxOb2RlKSB7XG4gICAgICBsZXQgdG9feCA9IHRoaXMudG9Ob2RlLmdldFgoKSAtIDU7XG4gICAgICBsZXQgdG9feSA9IHRoaXMudG9Ob2RlLmdldFkoKSArIHRoaXMudG9Ob2RlLmVsTm9kZS5jbGllbnRIZWlnaHQgLyAyO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG5cbiAgfVxufVxuIiwiaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9WaWV3Rmxvd1wiO1xuY29uc3QgZ2V2YWwgPSBldmFsO1xuZXhwb3J0IGNsYXNzIE5vZGVGbG93IGV4dGVuZHMgQmFzZUZsb3c8Vmlld0Zsb3c+IHtcbiAgcHVibGljIGVsTm9kZUlucHV0czogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGVsTm9kZU91dHB1dHM6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVDb250ZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQodGhpcy5wcm9wZXJ0aWVEZWZhdWx0Lnkua2V5KTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQodGhpcy5wcm9wZXJ0aWVEZWZhdWx0Lngua2V5KTtcbiAgfVxuICBwdWJsaWMgZ2V0RG90SW5wdXQoaW5kZXg6IG51bWJlciA9IDEpIHtcbiAgICBsZXQgZWxEb3Q6IGFueSA9IHRoaXMuZWxOb2RlT3V0cHV0cz8ucXVlcnlTZWxlY3RvcihgLmRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcbiAgICBpZiAoZWxEb3QpIHtcbiAgICAgIGxldCB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCArIGVsRG90Lm9mZnNldFRvcCArIDEwKTtcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0IC0gMTApO1xuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cbiAgcHVibGljIGdldERvdE91dHB1dChpbmRleDogbnVtYmVyID0gMCkge1xuICAgIGxldCBlbERvdDogYW55ID0gdGhpcy5lbE5vZGVPdXRwdXRzPy5xdWVyeVNlbGVjdG9yKGAuZG90W25vZGU9XCIke2luZGV4fVwiXWApO1xuICAgIGlmIChlbERvdCkge1xuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xuICAgICAgbGV0IHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCArIGVsRG90Lm9mZnNldExlZnQgKyAxMCk7XG5cbiAgICAgIHJldHVybiB7IHgsIHkgfTtcbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIHB1YmxpYyBhcnJMaW5lOiBMaW5lRmxvd1tdID0gW107XG4gIHByaXZhdGUgb3B0aW9uOiBhbnk7XG4gIHByaXZhdGUgbm9kZTogYW55O1xuICBwcml2YXRlIHByb3BlcnRpZURlZmF1bHQgPSB7XG4gICAgeDoge1xuICAgICAga2V5OiBcInhcIixcbiAgICAgIGRlZmF1bHQ6IDBcbiAgICB9LFxuICAgIHk6IHtcbiAgICAgIGtleTogXCJ5XCIsXG4gICAgICBkZWZhdWx0OiAwXG4gICAgfVxuICB9XG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fVxuICBwcml2YXRlIGZsZ1NjcmlwdDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgcmVhZG9ubHkgRXZlbnQgPSB7XG4gICAgUmVVSTogXCJSZVVJXCIsXG4gICAgY2hhbmdlOiBcImNoYW5nZVwiLFxuICAgIHVwZGF0ZVBvc2l0aW9uOiBcInVwZGF0ZVBvc2l0aW9uXCIsXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcbiAgICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIlxuICB9O1xuICBwdWJsaWMgc2V0T3B0aW9uKG9wdGlvbjogYW55ID0gbnVsbCwgZGF0YTogYW55ID0ge30pIHtcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbiB8fCB7fTtcbiAgICBpZiAoIXRoaXMub3B0aW9uLnByb3BlcnRpZXMpIHtcbiAgICAgIHRoaXMub3B0aW9uLnByb3BlcnRpZXMgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5ub2RlID0gdGhpcy5vcHRpb24ubm9kZTtcbiAgICB0aGlzLklkID0gZGF0YT8uSWQgPz8gdGhpcy5wYXJlbnQucGFyZW50LmdldFV1aWQoKTtcbiAgICB0aGlzLnByb3BlcnRpZXMgPSB7IC4uLnRoaXMucHJvcGVydGllRGVmYXVsdCwgLi4udGhpcy5vcHRpb24ucHJvcGVydGllcyB9O1xuICAgIHRoaXMuZGF0YS5Jbml0RGF0YShkYXRhPy5kYXRhKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBWaWV3Rmxvdywgb3B0aW9uOiBhbnkgPSBudWxsKSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLnNldE9wdGlvbihvcHRpb24sIHt9KTtcbiAgICBpZiAob3B0aW9uKSB7XG4gICAgICB0aGlzLlJlVUkoKTtcbiAgICB9XG4gICAgdGhpcy5vbih0aGlzLkV2ZW50LmNoYW5nZSwgKGU6IGFueSwgc2VuZGVyOiBhbnkpID0+IHtcbiAgICAgIHRoaXMucGFyZW50LmRpc3BhdGNoKHRoaXMucGFyZW50LkV2ZW50LmNoYW5nZSwge1xuICAgICAgICAuLi5lLFxuICAgICAgICB0YXJnZXROb2RlOiBzZW5kZXJcbiAgICAgIH0pO1xuICAgIH0pXG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgTGluZUpzb24gPSB0aGlzLmFyckxpbmUuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmZyb21Ob2RlID09PSB0aGlzKS5tYXAoKGl0ZW0pID0+ICh7XG4gICAgICBmcm9tTm9kZTogaXRlbS5mcm9tTm9kZS5JZCxcbiAgICAgIHRvTm9kZTogaXRlbS50b05vZGU/LklkLFxuICAgICAgb3VwdXRJbmRleDogaXRlbS5vdXRwdXRJbmRleFxuICAgIH0pKTtcbiAgICByZXR1cm4ge1xuICAgICAgSWQ6IHRoaXMuSWQsXG4gICAgICBub2RlOiB0aGlzLm5vZGUsXG4gICAgICBsaW5lOiBMaW5lSnNvbixcbiAgICAgIGRhdGE6IHRoaXMuZGF0YS50b0pzb24oKSxcbiAgICB9XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5kYXRhLlJlbW92ZUV2ZW50QWxsKCk7XG4gICAgbGV0IG9wdGlvbiA9IHRoaXMucGFyZW50LmdldE9wdGlvbihkYXRhPy5ub2RlKTtcbiAgICB0aGlzLnNldE9wdGlvbihvcHRpb24sIGRhdGEpO1xuICAgIHRoaXMuUmVVSSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHB1YmxpYyBvdXRwdXQoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uPy5vdXRwdXQgPz8gMDtcbiAgfVxuICBwdWJsaWMgZGVsZXRlKGlzUmVtb3ZlUGFyZW50ID0gdHJ1ZSkge1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLmRlbGV0ZSh0aGlzKSk7XG4gICAgdGhpcy5kYXRhLlJlbW92ZUV2ZW50KHRoaXMpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLk5vZGVPdmVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlKCk7XG4gICAgdGhpcy5hcnJMaW5lID0gW107XG4gICAgaWYgKGlzUmVtb3ZlUGFyZW50KVxuICAgICAgdGhpcy5wYXJlbnQuUmVtb3ZlTm9kZSh0aGlzKTtcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7fSk7XG4gIH1cbiAgcHVibGljIEFkZExpbmUobGluZTogTGluZUZsb3cpIHtcbiAgICB0aGlzLmFyckxpbmUgPSBbLi4udGhpcy5hcnJMaW5lLCBsaW5lXTtcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7fSk7XG4gIH1cbiAgcHVibGljIFJlbW92ZUxpbmUobGluZTogTGluZUZsb3cpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmFyckxpbmUuaW5kZXhPZihsaW5lKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5hcnJMaW5lLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcbiAgICByZXR1cm4gdGhpcy5hcnJMaW5lO1xuICB9XG4gIHB1YmxpYyBSZVVJKCkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5kYXRhLlJlbW92ZUV2ZW50KHRoaXMpO1xuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLk5vZGVMZWF2ZS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgICB9XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfaW5wdXRzJyk7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJpbnB1dHMgZG90XCI+PC9kaXY+YDtcbiAgICB0aGlzLmVsTm9kZUNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZUNvbnRlbnQuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX2NvbnRlbnQnKTtcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX291dHB1dHMnKTtcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJvdXRwdXRzIGRvdFwiIG5vZGU9XCIwXCI+PC9kaXY+YDtcbiAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LW5vZGVcIik7XG4gICAgdGhpcy5lbE5vZGUuaWQgPSBgbm9kZS0ke3RoaXMuSWR9YDtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScsIHRoaXMuSWQpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMuZ2V0WSgpfXB4OyBsZWZ0OiAke3RoaXMuZ2V0WCgpfXB4O2ApO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuTm9kZUxlYXZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlSW5wdXRzKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZUNvbnRlbnQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlT3V0cHV0cyk7XG5cbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcz8uYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIGlmICh0aGlzLmRhdGEpIHtcbiAgICAgIGxldCBkYXRhVGVtcCA9IHRoaXMuZGF0YS50b0pzb24oKTtcbiAgICAgIHRoaXMuZGF0YS5sb2FkKGRhdGFUZW1wKTtcbiAgICAgIHRoaXMuZGF0YS5VcGRhdGVVSSgpO1xuICAgIH1cbiAgICB0aGlzLmluaXRPcHRpb24oKTtcbiAgICB0aGlzLm9uKHRoaXMuZGF0YS5FdmVudC5kYXRhQ2hhbmdlLCAoKSA9PiB7XG4gICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgfSk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LlJlVUksIHt9KTtcbiAgfVxuICBwdWJsaWMgY2hlY2tJbnB1dCgpIHtcbiAgICByZXR1cm4gISh0aGlzLm9wdGlvbj8uaW5wdXQgPT09IDApO1xuICB9XG4gIHByaXZhdGUgaW5pdE9wdGlvbigpIHtcbiAgICBpZiAodGhpcy5lbE5vZGVDb250ZW50ICYmIHRoaXMub3B0aW9uICYmIHRoaXMuZWxOb2RlT3V0cHV0cykge1xuICAgICAgdGhpcy5lbE5vZGVDb250ZW50LmlubmVySFRNTCA9IHRoaXMub3B0aW9uLmh0bWw7XG4gICAgICBpZiAodGhpcy5vcHRpb24ub3V0cHV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5lbE5vZGVPdXRwdXRzLmlubmVySFRNTCA9ICcnO1xuICAgICAgICBmb3IgKGxldCBpbmRleDogbnVtYmVyID0gMDsgaW5kZXggPCB0aGlzLm9wdGlvbi5vdXRwdXQ7IGluZGV4KyspIHtcbiAgICAgICAgICBsZXQgb3V0cHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgb3V0cHV0LnNldEF0dHJpYnV0ZSgnbm9kZScsICgzMDAgKyBpbmRleCkudG9TdHJpbmcoKSk7XG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJkb3RcIik7XG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJvdXRwdXRfXCIgKyAoaW5kZXgpKTtcbiAgICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHM/LmFwcGVuZENoaWxkKG91dHB1dCk7XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9uLmlucHV0ID09PSAwICYmIHRoaXMuZWxOb2RlSW5wdXRzKSB7XG4gICAgICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9ICcnO1xuICAgICAgfVxuXG4gICAgfVxuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHNlbGYuUnVuU2NyaXB0KHNlbGYsIHNlbGYuZWxOb2RlKTtcbiAgICB9LCAxMDApO1xuICB9XG4gIHB1YmxpYyBSdW5TY3JpcHQoc2VsZk5vZGU6IE5vZGVGbG93LCBlbDogSFRNTEVsZW1lbnQgfCBudWxsKSB7XG4gICAgaWYgKHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLnNjcmlwdCAmJiAhdGhpcy5mbGdTY3JpcHQpIHtcbiAgICAgIHRoaXMuZmxnU2NyaXB0ID0gdHJ1ZTtcbiAgICAgIGdldmFsKCcobm9kZSxlbCk9PnsnICsgdGhpcy5vcHRpb24uc2NyaXB0LnRvU3RyaW5nKCkgKyAnfScpKHNlbGZOb2RlLCBlbCk7XG4gICAgICB0aGlzLmZsZ1NjcmlwdCA9IHRydWU7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBjaGVja05vZGUobm9kZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLm5vZGUgPT0gbm9kZTtcbiAgfVxuICBwdWJsaWMgTm9kZU92ZXIoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQubm9kZU92ZXIgPSB0aGlzO1xuICB9XG4gIHB1YmxpYyBOb2RlTGVhdmUoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQubm9kZU92ZXIgPSBudWxsO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LlNlbGVjdE5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnNlbGVjdGVkLCB7fSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgaWYgKGlDaGVjaykge1xuICAgICAgICBpZiAoeCAhPT0gdGhpcy5nZXRYKCkpIHtcbiAgICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSwgeCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHkgIT09IHRoaXMuZ2V0WSgpKSB7XG4gICAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueS5rZXksIHkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSwgKHRoaXMuZWxOb2RlLm9mZnNldFRvcCAtIHkpKTtcbiAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueC5rZXksICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0IC0geCkpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQudXBkYXRlUG9zaXRpb24sIHsgeDogdGhpcy5nZXRYKCksIHk6IHRoaXMuZ2V0WSgpIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0udXBkYXRlKCk7XG4gICAgfSlcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBMaW5lRmxvdyB9IGZyb20gXCIuL0xpbmVGbG93XCI7XG5pbXBvcnQgeyBOb2RlRmxvdyB9IGZyb20gXCIuL05vZGVGbG93XCI7XG5cbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcbiAgTm9uZSA9IDAsXG4gIE5vZGUgPSAxLFxuICBDYW52YXMgPSAyLFxuICBMaW5lID0gMyxcbn1cbmV4cG9ydCBjbGFzcyBWaWV3RmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+IHtcbiAgcHVibGljIGVsQ2FudmFzOiBIVE1MRWxlbWVudDtcbiAgcHVibGljIGZsZ0RyYXA6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBtb3ZlVHlwZTogTW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICBwcml2YXRlIHpvb21fbWF4OiBudW1iZXIgPSAxLjY7XG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcbiAgcHJpdmF0ZSB6b29tX3ZhbHVlOiBudW1iZXIgPSAwLjE7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBub2RlczogTm9kZUZsb3dbXSA9IFtdO1xuICBwcml2YXRlIGxpbmVTZWxlY3RlZDogTGluZUZsb3cgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBub2RlU2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBub2RlT3ZlcjogTm9kZUZsb3cgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBkb3RTZWxlY3RlZDogTm9kZUZsb3cgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0ZW1wTGluZTogTGluZUZsb3cgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0aW1lRmFzdENsaWNrOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHRhZ0luZ29yZSA9IFsnaW5wdXQnLCAnYnV0dG9uJywgJ2EnLCAndGV4dGFyZWEnXTtcbiAgcHJpdmF0ZSBnZXRYKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCh0aGlzLnByb3BlcnRpZXMueC5rZXkpXG4gIH1cbiAgcHJpdmF0ZSBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCh0aGlzLnByb3BlcnRpZXMueS5rZXkpXG4gIH1cbiAgcHJpdmF0ZSBnZXRab29tKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCh0aGlzLnByb3BlcnRpZXMuem9vbS5rZXkpO1xuICB9XG4gIHB1YmxpYyBwcm9wZXJ0aWVzID0ge1xuICAgIG5hbWU6IHtcbiAgICAgIGtleTogXCJuYW1lXCIsXG4gICAgfSxcbiAgICB6b29tOiB7XG4gICAgICBrZXk6IFwiem9vbVwiLFxuICAgICAgZGVmYXVsdDogMSxcbiAgICAgIHR5cGU6IFwibnVtYmVyXCJcbiAgICB9LFxuICAgIHg6IHtcbiAgICAgIGtleTogXCJ4XCIsXG4gICAgICBkZWZhdWx0OiAwLFxuICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgIH0sXG4gICAgeToge1xuICAgICAga2V5OiBcInlcIixcbiAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICB0eXBlOiBcIm51bWJlclwiXG4gICAgfVxuICB9O1xuICBwdWJsaWMgcmVhZG9ubHkgRXZlbnQgPSB7XG4gICAgY2hhbmdlOiBcImNoYW5nZVwiLFxuICAgIHNlbGVjdGVkOiBcIlNlbGVjdGVkXCIsXG4gICAgdXBkYXRlVmlldzogXCJ1cGRhdGVWaWV3XCJcbiAgfTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogV29ya2VyRmxvdykge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctZGVzZ2luIC53b3JrZXJmbG93LXZpZXcnKSB8fCB0aGlzLmVsTm9kZTtcbiAgICB0aGlzLmVsQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1jYW52YXNcIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XG4gICAgdGhpcy5lbE5vZGUudGFiSW5kZXggPSAwO1xuICAgIHRoaXMuYWRkRXZlbnQoKTtcbiAgICB0aGlzLlJlc2V0KCk7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKG51bGwsIHRoaXMucHJvcGVydGllcyk7XG4gICAgdGhpcy5vbih0aGlzLmRhdGEuRXZlbnQuZGF0YUNoYW5nZSwgKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gICAgfSk7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIGdldE9wdGlvbihrZXlOb2RlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0T3B0aW9uKGtleU5vZGUpO1xuICB9XG4gIHByaXZhdGUgZHJvcEVuZChldjogYW55KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoT2JqZWN0LmtleXModGhpcy5wYXJlbnQubW9kdWxlcykubGVuZ3RoID09IDApIHtcbiAgICAgIHRoaXMucGFyZW50Lm5ldygpO1xuICAgIH1cbiAgICBsZXQga2V5Tm9kZTogc3RyaW5nIHwgbnVsbCA9ICcnO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGtleU5vZGUgPSB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5Tm9kZSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwibm9kZVwiKTtcbiAgICB9XG4gICAgbGV0IG9wdGlvbiA9IHRoaXMuZ2V0T3B0aW9uKGtleU5vZGUpO1xuICAgIGlmIChvcHRpb24gJiYgb3B0aW9uLm9ubHlOb2RlKSB7XG4gICAgICBpZiAodGhpcy5ub2Rlcy5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uY2hlY2tOb2RlKGtleU5vZGUpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IG5vZGUgPSB0aGlzLkFkZE5vZGUob3B0aW9uKTtcblxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuXG4gICAgbm9kZS51cGRhdGVQb3NpdGlvbih4LCB5KTtcblxuICB9XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgbGV0IG5vZGVzID0gdGhpcy5ub2Rlcy5tYXAoKGl0ZW0pID0+IGl0ZW0udG9Kc29uKCkpO1xuICAgIHJldHVybiB7XG4gICAgICBJZDogdGhpcy5JZCxcbiAgICAgIGRhdGE6IHRoaXMuZGF0YS50b0pzb24oKSxcbiAgICAgIG5vZGVzXG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuUmVzZXQoKTtcbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIGRhdGEgPSB7fTtcbiAgICB9XG4gICAgaWYgKCFkYXRhLklkKSB7XG4gICAgICBkYXRhLklkID0gdGhpcy5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIH1cbiAgICBpZiAoIWRhdGEuZGF0YSkge1xuICAgICAgZGF0YS5kYXRhID0ge307XG4gICAgfVxuICAgIGlmICghZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0pIHtcbiAgICAgIGRhdGEuZGF0YVt0aGlzLnByb3BlcnRpZXMubmFtZS5rZXldID0gYHByb2plY3QtJHt0aGlzLnBhcmVudC5nZXRUaW1lKCl9YDtcbiAgICB9XG4gICAgdGhpcy5JZCA9IGRhdGEuSWQ7XG4gICAgdGhpcy5kYXRhLmxvYWQoZGF0YS5kYXRhKTtcbiAgICB0aGlzLmRhdGEuVXBkYXRlVUkoKTtcbiAgICB0aGlzLm5vZGVzID0gKGRhdGEubm9kZXMgPz8gW10pLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICByZXR1cm4gKG5ldyBOb2RlRmxvdyh0aGlzLCBcIlwiKSkubG9hZChpdGVtKTtcbiAgICB9KTtcbiAgICAoZGF0YS5ub2RlcyA/PyBbXSkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAoaXRlbS5saW5lID8/IFtdKS5mb3JFYWNoKChsaW5lOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IGZyb21Ob2RlID0gdGhpcy5nZXROb2RlQnlJZChsaW5lLmZyb21Ob2RlKTtcbiAgICAgICAgbGV0IHRvTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQobGluZS50b05vZGUpO1xuICAgICAgICBsZXQgb3VwdXRJbmRleCA9IGxpbmUub3VwdXRJbmRleCA/PyAwO1xuICAgICAgICBpZiAoZnJvbU5vZGUgJiYgdG9Ob2RlKSB7XG4gICAgICAgICAgdGhpcy5BZGRMaW5lKGZyb21Ob2RlLCB0b05vZGUsIG91cHV0SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pO1xuICAgIHRoaXMudXBkYXRlVmlldygpO1xuICB9XG4gIHB1YmxpYyBSZXNldCgpIHtcbiAgICB0aGlzLm5vZGVzLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLngua2V5LCAwKTtcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy55LmtleSwgMCk7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIGdldE5vZGVCeUlkKG5vZGVJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZXM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5JZCA9PSBub2RlSWQpWzBdO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVWaWV3KCkge1xuICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyB0aGlzLmdldFgoKSArIFwicHgsIFwiICsgdGhpcy5nZXRZKCkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuZ2V0Wm9vbSgpICsgXCIpXCI7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnVwZGF0ZVZpZXcsIHsgeDogdGhpcy5nZXRYKCksIHk6IHRoaXMuZ2V0WSgpLCB6b29tOiB0aGlzLmdldFpvb20oKSB9KTtcbiAgfVxuICBwcml2YXRlIENhbGNYKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudFdpZHRoIC8gKHRoaXMuZWxOb2RlPy5jbGllbnRXaWR0aCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHJpdmF0ZSBDYWxjWShudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRIZWlnaHQgLyAodGhpcy5lbE5vZGU/LmNsaWVudEhlaWdodCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHJpdmF0ZSBkcmFnb3ZlcihlOiBhbnkpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0TGluZSgpIHtcbiAgICB0aGlzLlNlbGVjdExpbmUobnVsbCk7XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0RG90KCkge1xuICAgIHRoaXMuU2VsZWN0RG90KG51bGwpO1xuICB9XG4gIHB1YmxpYyBVblNlbGVjdE5vZGUoKSB7XG4gICAgdGhpcy5TZWxlY3ROb2RlKG51bGwpO1xuICB9XG4gIHB1YmxpYyBVblNlbGVjdCgpIHtcbiAgICB0aGlzLlVuU2VsZWN0TGluZSgpO1xuICAgIHRoaXMuVW5TZWxlY3ROb2RlKCk7XG4gICAgdGhpcy5VblNlbGVjdERvdCgpO1xuICB9XG4gIHB1YmxpYyBTZWxlY3RMaW5lKG5vZGU6IExpbmVGbG93IHwgbnVsbCkge1xuICAgIGlmIChub2RlID09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLmxpbmVTZWxlY3RlZCkge1xuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZC5lbFBhdGg/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbm9kZTtcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9XG5cbiAgfVxuICBwcml2YXRlIGZsZ1NlbGVjdE5vZGUgPSBmYWxzZTtcbiAgcHVibGljIFNlbGVjdE5vZGUobm9kZTogTm9kZUZsb3cgfCBudWxsKSB7XG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMubm9kZVNlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5mbGdTZWxlY3ROb2RlKVxuICAgICAgICB0aGlzLnBhcmVudC5Qcm9wZXJ0eUluZm8odGhpcy5kYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5mbGdTZWxlY3ROb2RlID0gdHJ1ZTtcbiAgICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICAgIHRoaXMubm9kZVNlbGVjdGVkID0gbm9kZTtcbiAgICAgIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICB0aGlzLnBhcmVudC5Qcm9wZXJ0eUluZm8odGhpcy5ub2RlU2VsZWN0ZWQuZGF0YSk7XG4gICAgICB0aGlzLmZsZ1NlbGVjdE5vZGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFNlbGVjdERvdChub2RlOiBOb2RlRmxvdyB8IG51bGwpIHtcbiAgICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5kb3RTZWxlY3RlZCkge1xuICAgICAgICB0aGlzLmRvdFNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuZG90U2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbm9kZTtcbiAgICAgIHRoaXMuZG90U2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFJlbW92ZU5vZGUobm9kZTogTm9kZUZsb3cpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yobm9kZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubm9kZXM7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUob3B0aW9uOiBhbnkgPSBudWxsKTogTm9kZUZsb3cge1xuICAgIGxldCBub2RlID0gbmV3IE5vZGVGbG93KHRoaXMsIG9wdGlvbik7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShmcm9tTm9kZTogTm9kZUZsb3csIHRvTm9kZTogTm9kZUZsb3csIG91dHB1dEluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGZyb21Ob2RlID09IHRvTm9kZSkgcmV0dXJuO1xuICAgIGlmIChmcm9tTm9kZS5hcnJMaW5lLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgcmV0dXJuIGl0ZW0udG9Ob2RlID09PSB0b05vZGUgJiYgaXRlbS5vdXRwdXRJbmRleCA9PSBvdXRwdXRJbmRleCAmJiBpdGVtICE9IHRoaXMudGVtcExpbmU7XG4gICAgfSkubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IExpbmVGbG93KHRoaXMsIGZyb21Ob2RlLCB0b05vZGUsIG91dHB1dEluZGV4KTtcbiAgfVxuICBwdWJsaWMgYWRkRXZlbnQoKSB7XG4gICAgLyogTW91c2UgYW5kIFRvdWNoIEFjdGlvbnMgKi9cbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG4gICAgLyogQ29udGV4dCBNZW51ICovXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcblxuICAgIC8qIERyb3AgRHJhcCAqL1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMuZHJhZ292ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogWm9vbSBNb3VzZSAqL1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuem9vbV9lbnRlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBEZWxldGUgKi9cbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5ZG93bi5iaW5kKHRoaXMpKTtcbiAgfVxuICBwdWJsaWMga2V5ZG93bihlOiBhbnkpIHtcbiAgICBpZiAoZS5rZXkgPT09ICdEZWxldGUnIHx8IChlLmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgZS5tZXRhS2V5KSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZC5kZWxldGUoKTtcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMubGluZVNlbGVjdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZGVsZXRlKCk7XG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21fZW50ZXIoZXZlbnQ6IGFueSkge1xuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAoZXZlbnQuZGVsdGFZID4gMCkge1xuICAgICAgICAvLyBab29tIE91dFxuICAgICAgICB0aGlzLnpvb21fb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBab29tIEluXG4gICAgICAgIHRoaXMuem9vbV9pbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9yZWZyZXNoKCkge1xuICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLngua2V5LCAodGhpcy5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0aGlzLmdldFpvb20oKSk7XG4gICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMueS5rZXksICh0aGlzLmdldFkoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRoaXMuZ2V0Wm9vbSgpKTtcbiAgICB0aGlzLnpvb21fbGFzdF92YWx1ZSA9IHRoaXMuZ2V0Wm9vbSgpO1xuICAgIHRoaXMudXBkYXRlVmlldygpO1xuICB9XG4gIHB1YmxpYyB6b29tX2luKCkge1xuICAgIGlmICh0aGlzLmdldFpvb20oKSA8IHRoaXMuem9vbV9tYXgpIHtcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnpvb20ua2V5LCAodGhpcy5nZXRab29tKCkgKyB0aGlzLnpvb21fdmFsdWUpKTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX291dCgpIHtcbiAgICBpZiAodGhpcy5nZXRab29tKCkgPiB0aGlzLnpvb21fbWluKSB7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSwgKHRoaXMuZ2V0Wm9vbSgpIC0gdGhpcy56b29tX3ZhbHVlKSk7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICBpZiAodGhpcy5nZXRab29tKCkgIT0gMSkge1xuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuem9vbS5rZXksIHRoaXMucHJvcGVydGllcy56b29tLmRlZmF1bHQpO1xuICAgICAgdGhpcy56b29tX3JlZnJlc2goKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgU3RhcnRNb3ZlKGU6IGFueSkge1xuICAgIGlmICh0aGlzLnRhZ0luZ29yZS5pbmNsdWRlcyhlLnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudGltZUZhc3RDbGljayA9IHRoaXMucGFyZW50LmdldFRpbWUoKTtcbiAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtYWluLXBhdGgnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5Ob25lKSB7XG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgJiYgdGhpcy5wYXJlbnQuY2hlY2tQYXJlbnQoZS50YXJnZXQsIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZSkpIHtcbiAgICAgICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnZG90JykpIHtcbiAgICAgICAgICBpZiAodGhpcy5wYXJlbnQuY2hlY2tQYXJlbnQoZS50YXJnZXQsIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZUlucHV0cykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkxpbmU7XG4gICAgICAgICAgdGhpcy50ZW1wTGluZSA9IG5ldyBMaW5lRmxvdyh0aGlzLCB0aGlzLm5vZGVTZWxlY3RlZCwgbnVsbCk7XG4gICAgICAgICAgdGhpcy50ZW1wTGluZS5vdXRwdXRJbmRleCA9ICsoZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob2RlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuQ2FudmFzO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wb3NfeCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBvc194ID0gZS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGUuY2xpZW50WTtcbiAgICB9XG4gICAgdGhpcy5mbGdEcmFwID0gdHJ1ZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwdWJsaWMgTW92ZShlOiBhbnkpIHtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubW92ZVR5cGUpIHtcbiAgICAgIGNhc2UgTW92ZVR5cGUuQ2FudmFzOlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHggPSB0aGlzLmdldFgoKSArIHRoaXMuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLmdldFkoKSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHggKyBcInB4LCBcIiArIHkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuZ2V0Wm9vbSgpICsgXCIpXCI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5DYWxjWCh0aGlzLnBvc194IC0gZV9wb3NfeCk7XG4gICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcbiAgICAgICAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICAgICAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZD8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMuQ2FsY1kodGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnVwZGF0ZVRvKHRoaXMuZWxDYW52YXMub2Zmc2V0TGVmdCAtIHgsIHRoaXMuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnRvTm9kZSA9IHRoaXMubm9kZU92ZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcbiAgICAgIHRoaXMubW91c2VfeSA9IGVfcG9zX3k7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBFbmRNb3ZlKGU6IGFueSkge1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgLy9maXggRmFzdCBDbGlja1xuICAgIGlmICgoKHRoaXMucGFyZW50LmdldFRpbWUoKSAtIHRoaXMudGltZUZhc3RDbGljaykgPCAzMDApIHx8ICF0aGlzLmZsZ01vdmUpIHtcbiAgICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMgJiYgdGhpcy5mbGdEcmFwKVxuICAgICAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnRlbXBMaW5lICYmIHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTGluZSkge1xuICAgICAgaWYgKHRoaXMudGVtcExpbmUudG9Ob2RlICYmIHRoaXMudGVtcExpbmUudG9Ob2RlLmNoZWNrSW5wdXQoKSkge1xuICAgICAgICB0aGlzLkFkZExpbmUodGhpcy50ZW1wTGluZS5mcm9tTm9kZSwgdGhpcy50ZW1wTGluZS50b05vZGUsIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXgpO1xuICAgICAgfVxuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSBudWxsO1xuICAgIH1cbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy54LmtleSwgdGhpcy5nZXRYKCkgKyB0aGlzLkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKSk7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy55LmtleSwgdGhpcy5nZXRZKCkgKyB0aGlzLkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKSk7XG4gICAgfVxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBjb250ZXh0bWVudShlOiBhbnkpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEZsb3dDb3JlIH0gZnJvbSBcIi4vY29tcG9uZW50cy9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgQ29udHJvbEZsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL0NvbnRyb2xGbG93XCI7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvRGF0YUZsb3dcIjtcbmltcG9ydCB7IFByb3BlcnR5RmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvUHJvcGVydHlGbG93XCI7XG5pbXBvcnQgeyBUYWJGbG93LCBUYWJJdGVtRmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvVGFiRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL1ZpZXdGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBXb3JrZXJGbG93IGV4dGVuZHMgRmxvd0NvcmUge1xuXG4gIHB1YmxpYyBWaWV3OiBWaWV3RmxvdyB8IG51bGw7XG4gIHB1YmxpYyBDb250cm9sOiBDb250cm9sRmxvdyB8IG51bGw7XG4gIHB1YmxpYyBQcm9wZXJ0eTogUHJvcGVydHlGbG93IHwgbnVsbDtcbiAgcHVibGljIFRhYjogVGFiRmxvdyB8IG51bGw7XG4gIHB1YmxpYyBtb2R1bGVzOiBhbnkgPSB7fTtcbiAgcHVibGljIGRhdGFOb2RlU2VsZWN0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIG9wdGlvbjogYW55O1xuXG4gIHB1YmxpYyBjaGVja1BhcmVudChub2RlOiBhbnksIG5vZGVDaGVjazogYW55KSB7XG4gICAgaWYgKG5vZGUgJiYgbm9kZUNoZWNrKSB7XG4gICAgICBpZiAobm9kZSA9PSBub2RlQ2hlY2spIHJldHVybiB0cnVlO1xuICAgICAgbGV0IHBhcmVudDogYW55ID0gbm9kZTtcbiAgICAgIHdoaWxlICgocGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQpICE9IG51bGwpIHtcbiAgICAgICAgaWYgKG5vZGVDaGVjayA9PSBwYXJlbnQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG9wdGlvbjogYW55ID0gbnVsbCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5lbE5vZGUgPSBjb250YWluZXI7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3dcIik7XG4gICAgdGhpcy5vcHRpb24gPSBvcHRpb24gfHwge1xuICAgICAgY29udHJvbDoge31cbiAgICB9O1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sXCI+XG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2hlYWRlclwiPk5vZGUgQ29udHJvbDwvaDI+XG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sX19saXN0XCI+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1kZXNnaW5cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1zXCI+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXZpZXdcIj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXByb3BlcnR5XCI+XG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LXByb3BlcnR5X19oZWFkZXJcIj5Qcm9wZXJ0aWVzPC9oMj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXByb3BlcnR5X19saXN0XCI+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICBgO1xuICAgIHRoaXMuVmlldyA9IG5ldyBWaWV3Rmxvdyh0aGlzKTtcbiAgICB0aGlzLlRhYiA9IG5ldyBUYWJGbG93KHRoaXMpO1xuICAgIHRoaXMuQ29udHJvbCA9IG5ldyBDb250cm9sRmxvdyh0aGlzKTtcbiAgICB0aGlzLlByb3BlcnR5ID0gbmV3IFByb3BlcnR5Rmxvdyh0aGlzKTtcbiAgfVxuICBwdWJsaWMgbmV3KCkge1xuICAgIHRoaXMuVGFiPy5OZXdQcm9qZWN0KCk7XG4gIH1cbiAgcHVibGljIG9wZW5Qcm9qZWN0KG1vZHVlbHM6IGFueSkge1xuICAgIHRoaXMubW9kdWxlcyA9IG1vZHVlbHM7XG4gICAgbGV0IGtleSA9IE9iamVjdC5rZXlzKHRoaXMubW9kdWxlcylbMF07XG4gICAgaWYgKGtleSkge1xuICAgICAgdGhpcy5sb2FkKHRoaXMubW9kdWxlc1trZXldKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLlRhYj8uTG9hZFByb2plY3QoZGF0YSk7XG4gIH1cblxuICBwdWJsaWMgUHJvcGVydHlJbmZvKGRhdGE6IERhdGFGbG93KSB7XG4gICAgdGhpcy5Qcm9wZXJ0eT8uUHJvcGVydHlJbmZvKGRhdGEpO1xuICB9XG4gIHB1YmxpYyBnZXRPcHRpb24oa2V5Tm9kZTogYW55KSB7XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGNvbnRyb2wgPSB0aGlzLm9wdGlvbi5jb250cm9sW2tleU5vZGVdO1xuICAgIGlmICghY29udHJvbCkge1xuICAgICAgY29udHJvbCA9IE9iamVjdC52YWx1ZXModGhpcy5vcHRpb24uY29udHJvbClbMF07XG4gICAgfVxuICAgIGNvbnRyb2wubm9kZSA9IGtleU5vZGU7XG4gICAgcmV0dXJuIGNvbnRyb2w7XG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICB0aGlzLlRhYj8uVXBkYXRlRGF0YSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZXM7XG4gIH1cbiAgcHVibGljIGdldFRpbWUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgfVxuICBwdWJsaWMgZ2V0VXVpZCgpOiBzdHJpbmcge1xuICAgIC8vIGh0dHA6Ly93d3cuaWV0Zi5vcmcvcmZjL3JmYzQxMjIudHh0XG4gICAgbGV0IHM6IGFueSA9IFtdO1xuICAgIGxldCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM2OyBpKyspIHtcbiAgICAgIHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApLCAxKTtcbiAgICB9XG4gICAgc1sxNF0gPSBcIjRcIjsgIC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxuICAgIHNbMTldID0gaGV4RGlnaXRzLnN1YnN0cigoc1sxOV0gJiAweDMpIHwgMHg4LCAxKTsgIC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG4gICAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXG4gICAgbGV0IHV1aWQgPSBzLmpvaW4oXCJcIik7XG4gICAgcmV0dXJuIHV1aWQ7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O01BRWEsUUFBUSxDQUFBO0FBT08sSUFBQSxJQUFBLENBQUE7SUFObEIsSUFBSSxHQUFRLEVBQUUsQ0FBQztJQUNoQixLQUFLLEdBQWUsRUFBRSxDQUFDO0FBQ2QsSUFBQSxLQUFLLEdBQUc7QUFDdEIsUUFBQSxVQUFVLEVBQUUsWUFBWTtBQUN4QixRQUFBLE1BQU0sRUFBRSxRQUFRO0tBQ2pCLENBQUE7QUFDRCxJQUFBLFdBQUEsQ0FBMEIsSUFBYyxFQUFBO1FBQWQsSUFBSSxDQUFBLElBQUEsR0FBSixJQUFJLENBQVU7S0FDdkM7QUFDTSxJQUFBLFFBQVEsQ0FBQyxJQUFZLEdBQUEsSUFBSSxFQUFFLFVBQUEsR0FBa0IsQ0FBQyxDQUFDLEVBQUE7QUFDcEQsUUFBQSxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNyQixZQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztBQUNuQyxTQUFBO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEIsUUFB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
