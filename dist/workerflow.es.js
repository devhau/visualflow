
  /**
   * @license
   * author: Nguyen Van Hau
   * workerflow.js v0.0.1
   * Released under the MIT license.
   */

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

export { WorkerFlow as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5lcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvcmUvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29yZS9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0NvbnRyb2xGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvUHJvcGVydHlGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVGFiRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0xpbmVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvTm9kZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9WaWV3Rmxvdy50cyIsIi4uL3NyYy9Xb3JrZXJGbG93LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZsb3dDb3JlIH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFdmVudEZsb3cge1xyXG4gIHByaXZhdGUgZXZlbnRzOiBhbnkgPSB7fTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gIH1cclxuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHRoaXMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgLyogRXZlbnRzICovXHJcbiAgcHVibGljIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xyXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcclxuICAgICAgICBsaXN0ZW5lcnM6IFtdXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXHJcblxyXG4gICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZVxyXG5cclxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcclxuICAgIGNvbnN0IGxpc3RlbmVySW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcclxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXHJcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIGNvbnNvbGUuZXJyb3IoYFRoaXMgZXZlbnQ6ICR7ZXZlbnR9IGRvZXMgbm90IGV4aXN0YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xyXG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBGbG93Q29yZSB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcclxuICBwcml2YXRlIGRhdGE6IGFueSA9IHt9O1xyXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XHJcbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcclxuICB9XHJcbiAgcHVibGljIHJlYWRvbmx5IEV2ZW50ID0ge1xyXG4gICAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXHJcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXHJcbiAgICBkaXNwb3NlOiBcImRpc3Bvc2VcIlxyXG4gIH1cclxuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIG5vZGU6IEZsb3dDb3JlKSB7XHJcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcclxuICB9XHJcbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XHJcbiAgICBpZiAocHJvcGVydGllcyAhPT0gLTEpIHtcclxuICAgICAgdGhpcy5ub2RlLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xyXG4gICAgfVxyXG4gICAgdGhpcy5sb2FkKGRhdGEpO1xyXG4gICAgdGhpcy5CaW5kRXZlbnQodGhpcy5ub2RlKTtcclxuICB9XHJcbiAgcHVibGljIEJpbmRFdmVudChub2RlOiBGbG93Q29yZSkge1xyXG4gIH1cclxuICBwdWJsaWMgU2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwpIHtcclxuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XHJcbiAgICB0aGlzLmRpc3BhdGNoKGAke3RoaXMuRXZlbnQuZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xyXG4gICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgIH0pO1xyXG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmRhdGFDaGFuZ2UsIHtcclxuICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICB9KTtcclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHtcclxuICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcHVibGljIEdldChrZXk6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xyXG4gIH1cclxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcclxuICAgIHRoaXMuZGF0YSA9IHt9O1xyXG5cclxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcclxuICAgICAgdGhpcy5kYXRhW2tleV0gPSAoZGF0YT8uW2tleV0gPz8gKHRoaXMubm9kZS5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQgPz8gXCJcIikpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgdG9Kc29uKCkge1xyXG4gICAgbGV0IHJzOiBhbnkgPSB7fTtcclxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcclxuICAgICAgcnNba2V5XSA9IHRoaXMuR2V0KGtleSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcnM7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRmxvd0NvcmUge1xyXG4gIHB1YmxpYyBJZDogYW55O1xyXG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcclxuICBwdWJsaWMgZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3codGhpcyk7XHJcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xyXG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XHJcbiAgfVxyXG4gIEJpbmREYXRhRXZlbnQoKSB7XHJcbiAgICB0aGlzLmRhdGEub24odGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChgJHt0aGlzLmRhdGEuRXZlbnQuZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaCh0aGlzLmRhdGEuRXZlbnQuZGF0YUNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIHRoaXMuZGF0YS5vbih0aGlzLmRhdGEuRXZlbnQuY2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5kYXRhLkV2ZW50LmNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xyXG5cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlRmxvdzxUUGFyZW50IGV4dGVuZHMgRmxvd0NvcmU+IGV4dGVuZHMgRmxvd0NvcmUge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyZW50OiBUUGFyZW50KSB7XHJcbiAgICBzdXBlcigpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcclxuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbnRyb2xGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4gIHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctY29udHJvbF9fbGlzdCcpIHx8IHRoaXMuZWxOb2RlO1xyXG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGFyZW50Lm9wdGlvbi5jb250cm9sKTtcclxuICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgbGV0IE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcclxuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywga2V5KTtcclxuICAgICAgICBOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIik7XHJcbiAgICAgICAgTm9kZS5pbm5lckhUTUwgPSBwYXJlbnQub3B0aW9uLmNvbnRyb2xba2V5XS5uYW1lO1xyXG4gICAgICAgIE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcclxuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcclxuICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChOb2RlKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBkcmFnZW5kKGU6IGFueSkge1xyXG4gICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGRyYWdTdGFydChlOiBhbnkpIHtcclxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XHJcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuY2xvc2VzdChcIi53b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcclxuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xyXG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eUZsb3cgZXh0ZW5kcyBCYXNlRmxvdzxXb3JrZXJGbG93PiB7XHJcbiAgcHJpdmF0ZSBsYXN0RGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogV29ya2VyRmxvdykge1xyXG4gICAgc3VwZXIocGFyZW50KTtcclxuICAgIHRoaXMuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XHJcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1wcm9wZXJ0eV9fbGlzdCcpIHx8IHRoaXMuZWxOb2RlO1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcclxuICB9XHJcbiAgcHVibGljIFByb3BlcnR5SW5mbyhkYXRhOiBEYXRhRmxvdykge1xyXG4gICAgaWYgKHRoaXMubGFzdERhdGEgJiYgdGhpcy5sYXN0RGF0YSA9PT0gZGF0YSkgcmV0dXJuO1xyXG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XHJcbiAgICB0aGlzLlJlbmRlclVJKCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgUmVuZGVyVUkoKSB7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgaWYgKHRoaXMubGFzdERhdGEpIHtcclxuICAgICAgZm9yIChsZXQgaXRlbSBvZiBPYmplY3Qua2V5cyh0aGlzLmxhc3REYXRhLm5vZGUucHJvcGVydGllcykpIHtcclxuICAgICAgICBsZXQgcHJvcGVydHlJbmZvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgcHJvcGVydHlJbmZvLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctcHJvcGVydHlfX2l0ZW0nKTtcclxuICAgICAgICBsZXQgZWxMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBlbExhYmVsLmlubmVySFRNTCA9IGl0ZW07XHJcbiAgICAgICAgbGV0IGVsSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgZWxJdGVtLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIGl0ZW0pO1xyXG4gICAgICAgIHByb3BlcnR5SW5mby5hcHBlbmRDaGlsZChlbExhYmVsKTtcclxuICAgICAgICBwcm9wZXJ0eUluZm8uYXBwZW5kQ2hpbGQoZWxJdGVtKTtcclxuICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChwcm9wZXJ0eUluZm8pO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMubGFzdERhdGE/LkJpbmRFdmVudCh0aGlzKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XHJcbmltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuZXhwb3J0IGNsYXNzIFRhYkl0ZW1GbG93IGV4dGVuZHMgQmFzZUZsb3c8VGFiRmxvdz57XHJcbiAgcHVibGljIEl0ZW1JZDogYW55O1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFRhYkZsb3csIHByaXZhdGUgZGF0YUl0ZW06IGFueSkge1xyXG4gICAgc3VwZXIocGFyZW50KTtcclxuICAgIHRoaXMuSWQgPSB0aGlzLnBhcmVudC5wYXJlbnQuZ2V0VXVpZCgpO1xyXG4gICAgdGhpcy5JdGVtSWQgPSBkYXRhSXRlbS5JZDtcclxuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1pdGVtXCIpO1xyXG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnLCB0aGlzLkl0ZW1JZCk7XHJcbiAgICBsZXQgbm9kZU5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBub2RlTmFtZS5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCAnbmFtZScpO1xyXG4gICAgbm9kZU5hbWUuaW5uZXJIVE1MID0gZGF0YUl0ZW0ubmFtZTtcclxuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG5vZGVOYW1lKTtcclxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuQ2xpY2tUYWIuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgQ2xpY2tUYWIoZTogYW55KSB7XHJcbiAgICB0aGlzLnBhcmVudC5Mb2FkUHJvamVjdEJ5SWQodGhpcy5JdGVtSWQpO1xyXG4gIH1cclxuICBwdWJsaWMgU2V0RGF0YShkYXRhSXRlbTogYW55KSB7XHJcbiAgICB0aGlzLmRhdGFJdGVtID0gZGF0YUl0ZW07XHJcbiAgfVxyXG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBib29sZWFuID0gdHJ1ZSkge1xyXG4gICAgaWYgKGZsZykge1xyXG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgdGhpcy5wYXJlbnQucGFyZW50LlZpZXc/LmxvYWQodGhpcy5kYXRhSXRlbSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcbmV4cG9ydCBjbGFzcyBUYWJGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4gIHtcclxuICBwdWJsaWMgdGFiczogVGFiSXRlbUZsb3dbXSA9IFtdO1xyXG4gIHByaXZhdGUgdGFiQWN0aXZlOiBUYWJJdGVtRmxvdyB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctaXRlbXMnKSB8fCB0aGlzLmVsTm9kZTtcclxuICAgIGlmICh0aGlzLmVsTm9kZSkge1xyXG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBMb2FkUHJvamVjdEJ5SWQocHJvamVjdElkOiBhbnkpIHtcclxuICAgIGlmICghcHJvamVjdElkKSByZXR1cm47XHJcbiAgICBsZXQgUHJvamVjdE5leHQgPSB0aGlzLnRhYnM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5JdGVtSWQgPT0gcHJvamVjdElkKT8uWzBdO1xyXG4gICAgbGV0IGRhdGFOZXh0OiBhbnkgPSB0aGlzLnBhcmVudC5tb2R1bGVzW3Byb2plY3RJZF07XHJcbiAgICBpZiAoIWRhdGFOZXh0KSByZXR1cm47XHJcbiAgICBpZiAoIVByb2plY3ROZXh0KSB7XHJcbiAgICAgIFByb2plY3ROZXh0ID0gbmV3IFRhYkl0ZW1GbG93KHRoaXMsIGRhdGFOZXh0KTtcclxuICAgICAgdGhpcy50YWJzID0gWy4uLnRoaXMudGFicywgUHJvamVjdE5leHRdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChQcm9qZWN0TmV4dCAmJiB0aGlzLnRhYkFjdGl2ZSkge1xyXG4gICAgICBpZiAodGhpcy50YWJBY3RpdmUgPT0gUHJvamVjdE5leHQpIHJldHVybjtcclxuICAgICAgdGhpcy5VcGRhdGVEYXRhKCk7XHJcbiAgICAgIHRoaXMudGFiQWN0aXZlLkFjdGl2ZShmYWxzZSk7XHJcbiAgICAgIHRoaXMudGFiQWN0aXZlID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgdGhpcy50YWJBY3RpdmUgPSBQcm9qZWN0TmV4dDtcclxuICAgIHRoaXMudGFiQWN0aXZlLlNldERhdGEoZGF0YU5leHQpO1xyXG4gICAgdGhpcy50YWJBY3RpdmUuQWN0aXZlKHRydWUpO1xyXG4gIH1cclxuICBwdWJsaWMgVXBkYXRlRGF0YSgpIHtcclxuICAgIGlmICh0aGlzLnRhYkFjdGl2ZSkge1xyXG4gICAgICB0aGlzLnBhcmVudC5tb2R1bGVzW3RoaXMudGFiQWN0aXZlLkl0ZW1JZF0gPSB0aGlzLnBhcmVudC5WaWV3Py50b0pzb24oKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIE5ld1Byb2plY3QoKSB7XHJcbiAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICBJZDogdGhpcy5wYXJlbnQuZ2V0VXVpZCgpLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgbmFtZTogYHByb2plY3QtJHt0aGlzLnBhcmVudC5nZXRUaW1lKCl9YCxcclxuICAgICAgICB4OiAwLFxyXG4gICAgICAgIHk6IDAsXHJcbiAgICAgICAgem9vbTogMSxcclxuICAgICAgfSxcclxuICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcbiAgICB0aGlzLkxvYWRQcm9qZWN0KGRhdGEpO1xyXG4gIH1cclxuICBwdWJsaWMgTG9hZFByb2plY3QoZGF0YTogYW55KSB7XHJcbiAgICB0aGlzLnBhcmVudC5tb2R1bGVzW2RhdGEuSWRdID0gZGF0YTtcclxuICAgIHRoaXMuTG9hZFByb2plY3RCeUlkKGRhdGEuSWQpO1xyXG4gIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9WaWV3Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgTGluZUZsb3cge1xuICBwdWJsaWMgZWxDb25uZWN0aW9uOiBTVkdFbGVtZW50IHwgbnVsbDtcbiAgcHVibGljIGVsUGF0aDogU1ZHUGF0aEVsZW1lbnQ7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVmlld0Zsb3csIHB1YmxpYyBmcm9tTm9kZTogTm9kZUZsb3csIHB1YmxpYyB0b05vZGU6IE5vZGVGbG93IHwgbnVsbCA9IG51bGwsIHB1YmxpYyBvdXRwdXRJbmRleDogbnVtYmVyID0gMCkge1xuICAgIHRoaXMuZWxDb25uZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwic3ZnXCIpO1xuICAgIHRoaXMuZWxQYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKFwibWFpbi1wYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgJycpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uLmNsYXNzTGlzdC5hZGQoXCJjb25uZWN0aW9uXCIpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uLmFwcGVuZENoaWxkKHRoaXMuZWxQYXRoKTtcbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcz8uYXBwZW5kQ2hpbGQodGhpcy5lbENvbm5lY3Rpb24pO1xuICAgIHRoaXMuZnJvbU5vZGUuQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnRvTm9kZT8uQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LlNlbGVjdExpbmUodGhpcyk7XG4gIH1cbiAgcHJpdmF0ZSBjcmVhdGVDdXJ2YXR1cmUoc3RhcnRfcG9zX3g6IG51bWJlciwgc3RhcnRfcG9zX3k6IG51bWJlciwgZW5kX3Bvc194OiBudW1iZXIsIGVuZF9wb3NfeTogbnVtYmVyLCBjdXJ2YXR1cmVfdmFsdWU6IG51bWJlciwgdHlwZTogc3RyaW5nKSB7XG4gICAgbGV0IGxpbmVfeCA9IHN0YXJ0X3Bvc194O1xuICAgIGxldCBsaW5lX3kgPSBzdGFydF9wb3NfeTtcbiAgICBsZXQgeCA9IGVuZF9wb3NfeDtcbiAgICBsZXQgeSA9IGVuZF9wb3NfeTtcbiAgICBsZXQgY3VydmF0dXJlID0gY3VydmF0dXJlX3ZhbHVlO1xuICAgIC8vdHlwZSBvcGVuY2xvc2Ugb3BlbiBjbG9zZSBvdGhlclxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ290aGVyJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuXG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGRlbGV0ZShub2RlVGhpczogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKHRoaXMuZnJvbU5vZGUgIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLmZyb21Ob2RlLlJlbW92ZUxpbmUodGhpcyk7XG4gICAgaWYgKHRoaXMudG9Ob2RlICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50b05vZGU/LlJlbW92ZUxpbmUodGhpcyk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24/LnJlbW92ZSgpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uID0gbnVsbDtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVG8odG9feDogbnVtYmVyLCB0b195OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5mcm9tTm9kZS5lbE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xuICAgIGxldCB7IHg6IGZyb21feCwgeTogZnJvbV95IH06IGFueSA9IHRoaXMuZnJvbU5vZGUuZ2V0RG90T3V0cHV0KHRoaXMub3V0cHV0SW5kZXgpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZSgpIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG9Ob2RlICYmIHRoaXMudG9Ob2RlLmVsTm9kZSkge1xuICAgICAgbGV0IHRvX3ggPSB0aGlzLnRvTm9kZS5nZXRYKCkgLSA1O1xuICAgICAgbGV0IHRvX3kgPSB0aGlzLnRvTm9kZS5nZXRZKCkgKyB0aGlzLnRvTm9kZS5lbE5vZGUuY2xpZW50SGVpZ2h0IC8gMjtcbiAgICAgIHRoaXMudXBkYXRlVG8odG9feCwgdG9feSk7XG4gICAgfVxuXG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xyXG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XHJcbmNvbnN0IGdldmFsID0gZXZhbDtcclxuZXhwb3J0IGNsYXNzIE5vZGVGbG93IGV4dGVuZHMgQmFzZUZsb3c8Vmlld0Zsb3c+IHtcclxuICBwdWJsaWMgZWxOb2RlSW5wdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHB1YmxpYyBlbE5vZGVPdXRwdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHB1YmxpYyBlbE5vZGVDb250ZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHB1YmxpYyBnZXRZKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXRYKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXREb3RJbnB1dChpbmRleDogbnVtYmVyID0gMSkge1xyXG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZU91dHB1dHM/LnF1ZXJ5U2VsZWN0b3IoYC5kb3Rbbm9kZT1cIiR7aW5kZXh9XCJdYCk7XHJcbiAgICBpZiAoZWxEb3QpIHtcclxuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xyXG4gICAgICBsZXQgeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0ICsgZWxEb3Qub2Zmc2V0TGVmdCAtIDEwKTtcclxuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuICBwdWJsaWMgZ2V0RG90T3V0cHV0KGluZGV4OiBudW1iZXIgPSAwKSB7XHJcbiAgICBsZXQgZWxEb3Q6IGFueSA9IHRoaXMuZWxOb2RlT3V0cHV0cz8ucXVlcnlTZWxlY3RvcihgLmRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcclxuICAgIGlmIChlbERvdCkge1xyXG4gICAgICBsZXQgeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgKyBlbERvdC5vZmZzZXRUb3AgKyAxMCk7XHJcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0ICsgMTApO1xyXG5cclxuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuICBwdWJsaWMgYXJyTGluZTogTGluZUZsb3dbXSA9IFtdO1xyXG4gIHByaXZhdGUgb3B0aW9uOiBhbnk7XHJcbiAgcHJpdmF0ZSBub2RlOiBhbnk7XHJcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVEZWZhdWx0ID0ge1xyXG4gICAgeDoge1xyXG4gICAgICBrZXk6IFwieFwiLFxyXG4gICAgICBkZWZhdWx0OiAwXHJcbiAgICB9LFxyXG4gICAgeToge1xyXG4gICAgICBrZXk6IFwieVwiLFxyXG4gICAgICBkZWZhdWx0OiAwXHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fVxyXG4gIHByaXZhdGUgZmxnU2NyaXB0OiBib29sZWFuID0gZmFsc2U7XHJcbiAgcHVibGljIHJlYWRvbmx5IEV2ZW50ID0ge1xyXG4gICAgUmVVSTogXCJSZVVJXCIsXHJcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXHJcbiAgICB1cGRhdGVQb3NpdGlvbjogXCJ1cGRhdGVQb3NpdGlvblwiLFxyXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcclxuICAgIGRhdGFDaGFuZ2U6IFwiZGF0YUNoYW5nZVwiXHJcbiAgfTtcclxuICBwdWJsaWMgc2V0T3B0aW9uKG9wdGlvbjogYW55ID0gbnVsbCwgZGF0YTogYW55ID0ge30pIHtcclxuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uIHx8IHt9O1xyXG4gICAgaWYgKCF0aGlzLm9wdGlvbi5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgIHRoaXMub3B0aW9uLnByb3BlcnRpZXMgPSB7fTtcclxuICAgIH1cclxuICAgIHRoaXMubm9kZSA9IHRoaXMub3B0aW9uLm5vZGU7XHJcbiAgICB0aGlzLklkID0gZGF0YT8uSWQgPz8gdGhpcy5wYXJlbnQucGFyZW50LmdldFV1aWQoKTtcclxuICAgIHRoaXMucHJvcGVydGllcyA9IHsgLi4udGhpcy5wcm9wZXJ0aWVEZWZhdWx0LCAuLi50aGlzLm9wdGlvbi5wcm9wZXJ0aWVzIH07XHJcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoZGF0YT8uZGF0YSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFZpZXdGbG93LCBvcHRpb246IGFueSA9IG51bGwpIHtcclxuICAgIHN1cGVyKHBhcmVudCk7XHJcbiAgICB0aGlzLnNldE9wdGlvbihvcHRpb24sIHt9KTtcclxuICAgIGlmIChvcHRpb24pIHtcclxuICAgICAgdGhpcy5SZVVJKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLm9uKHRoaXMuRXZlbnQuY2hhbmdlLCAoZTogYW55LCBzZW5kZXI6IGFueSkgPT4ge1xyXG4gICAgICB0aGlzLnBhcmVudC5kaXNwYXRjaCh0aGlzLnBhcmVudC5FdmVudC5jaGFuZ2UsIHtcclxuICAgICAgICAuLi5lLFxyXG4gICAgICAgIHRhcmdldE5vZGU6IHNlbmRlclxyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgfVxyXG4gIHB1YmxpYyB0b0pzb24oKSB7XHJcbiAgICBsZXQgTGluZUpzb24gPSB0aGlzLmFyckxpbmUuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmZyb21Ob2RlID09PSB0aGlzKS5tYXAoKGl0ZW0pID0+ICh7XHJcbiAgICAgIGZyb21Ob2RlOiBpdGVtLmZyb21Ob2RlLklkLFxyXG4gICAgICB0b05vZGU6IGl0ZW0udG9Ob2RlPy5JZCxcclxuICAgICAgb3VwdXRJbmRleDogaXRlbS5vdXRwdXRJbmRleFxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgSWQ6IHRoaXMuSWQsXHJcbiAgICAgIG5vZGU6IHRoaXMubm9kZSxcclxuICAgICAgbGluZTogTGluZUpzb24sXHJcbiAgICAgIGRhdGE6IHRoaXMuZGF0YS50b0pzb24oKSxcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XHJcbiAgICBsZXQgb3B0aW9uID0gdGhpcy5wYXJlbnQuZ2V0T3B0aW9uKGRhdGE/Lm5vZGUpO1xyXG4gICAgdGhpcy5zZXRPcHRpb24ob3B0aW9uLCBkYXRhKTtcclxuICAgIHRoaXMuUmVVSSgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBvdXRwdXQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xyXG4gIH1cclxuICBwdWJsaWMgZGVsZXRlKGlzUmVtb3ZlUGFyZW50ID0gdHJ1ZSkge1xyXG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcclxuICAgIHRoaXMuZGF0YS5kaXNwYXRjaCh0aGlzLmRhdGEuRXZlbnQuY2hhbmdlLCB7fSk7XHJcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlKCk7XHJcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcclxuICAgIGlmIChpc1JlbW92ZVBhcmVudClcclxuICAgICAgdGhpcy5wYXJlbnQuUmVtb3ZlTm9kZSh0aGlzKTtcclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcclxuICB9XHJcbiAgcHVibGljIEFkZExpbmUobGluZTogTGluZUZsb3cpIHtcclxuICAgIHRoaXMuYXJyTGluZSA9IFsuLi50aGlzLmFyckxpbmUsIGxpbmVdO1xyXG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xyXG4gIH1cclxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lRmxvdykge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcclxuICAgIHJldHVybiB0aGlzLmFyckxpbmU7XHJcbiAgfVxyXG4gIHB1YmxpYyBSZVVJKCkge1xyXG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XHJcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLk5vZGVMZWF2ZS5iaW5kKHRoaXMpKTtcclxuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcclxuICAgIH1cclxuICAgIHRoaXMuZWxOb2RlSW5wdXRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfaW5wdXRzJyk7XHJcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImlucHV0cyBkb3RcIj48L2Rpdj5gO1xyXG4gICAgdGhpcy5lbE5vZGVDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZUNvbnRlbnQuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX2NvbnRlbnQnKTtcclxuICAgIHRoaXMuZWxOb2RlT3V0cHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9vdXRwdXRzJyk7XHJcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJvdXRwdXRzIGRvdFwiIG5vZGU9XCIwXCI+PC9kaXY+YDtcclxuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1ub2RlXCIpO1xyXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb24uY2xhc3MpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5lbE5vZGUuaWQgPSBgbm9kZS0ke3RoaXMuSWR9YDtcclxuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgdGhpcy5JZCk7XHJcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcclxuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVJbnB1dHMpO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVDb250ZW50KTtcclxuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlT3V0cHV0cyk7XHJcblxyXG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcclxuICAgIGlmICh0aGlzLmRhdGEpIHtcclxuICAgICAgbGV0IGRhdGFUZW1wID0gdGhpcy5kYXRhLnRvSnNvbigpO1xyXG4gICAgICB0aGlzLmRhdGEubG9hZChkYXRhVGVtcCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmluaXRPcHRpb24oKTtcclxuICAgIHRoaXMub24odGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsICgpID0+IHtcclxuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuUmVVSSwge30pO1xyXG4gIH1cclxuICBwdWJsaWMgY2hlY2tJbnB1dCgpIHtcclxuICAgIHJldHVybiAhKHRoaXMub3B0aW9uPy5pbnB1dCA9PT0gMCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgaW5pdE9wdGlvbigpIHtcclxuICAgIGlmICh0aGlzLmVsTm9kZUNvbnRlbnQgJiYgdGhpcy5vcHRpb24gJiYgdGhpcy5lbE5vZGVPdXRwdXRzKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlQ29udGVudC5pbm5lckhUTUwgPSB0aGlzLm9wdGlvbi5odG1sO1xyXG4gICAgICBpZiAodGhpcy5vcHRpb24ub3V0cHV0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgZm9yIChsZXQgaW5kZXg6IG51bWJlciA9IDA7IGluZGV4IDwgdGhpcy5vcHRpb24ub3V0cHV0OyBpbmRleCsrKSB7XHJcbiAgICAgICAgICBsZXQgb3V0cHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICBvdXRwdXQuc2V0QXR0cmlidXRlKCdub2RlJywgKDMwMCArIGluZGV4KS50b1N0cmluZygpKTtcclxuICAgICAgICAgIG91dHB1dC5jbGFzc0xpc3QuYWRkKFwiZG90XCIpO1xyXG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJvdXRwdXRfXCIgKyAoaW5kZXgpKTtcclxuICAgICAgICAgIHRoaXMuZWxOb2RlT3V0cHV0cz8uYXBwZW5kQ2hpbGQob3V0cHV0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbi5pbnB1dCA9PT0gMCAmJiB0aGlzLmVsTm9kZUlucHV0cykge1xyXG4gICAgICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIHNlbGYuUnVuU2NyaXB0KHNlbGYsIHNlbGYuZWxOb2RlKTtcclxuICAgIH0sIDEwMCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBSdW5TY3JpcHQoc2VsZk5vZGU6IE5vZGVGbG93LCBlbDogSFRNTEVsZW1lbnQgfCBudWxsKSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24uc2NyaXB0ICYmICF0aGlzLmZsZ1NjcmlwdCkge1xyXG4gICAgICB0aGlzLmZsZ1NjcmlwdCA9IHRydWU7XHJcbiAgICAgIGdldmFsKCcobm9kZSxlbCk9PnsnICsgdGhpcy5vcHRpb24uc2NyaXB0LnRvU3RyaW5nKCkgKyAnfScpKHNlbGZOb2RlLCBlbCk7XHJcbiAgICAgIHRoaXMuZmxnU2NyaXB0ID0gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGNoZWNrTm9kZShub2RlOiBhbnkpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbiAmJiB0aGlzLm9wdGlvbi5ub2RlID09IG5vZGU7XHJcbiAgfVxyXG4gIHB1YmxpYyBOb2RlT3ZlcihlOiBhbnkpIHtcclxuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gdGhpcztcclxuICB9XHJcbiAgcHVibGljIE5vZGVMZWF2ZShlOiBhbnkpIHtcclxuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gbnVsbDtcclxuICB9XHJcbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XHJcbiAgICB0aGlzLnBhcmVudC5TZWxlY3ROb2RlKHRoaXMpO1xyXG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnNlbGVjdGVkLCB7fSk7XHJcbiAgfVxyXG4gIHB1YmxpYyB1cGRhdGVQb3NpdGlvbih4OiBhbnksIHk6IGFueSwgaUNoZWNrID0gZmFsc2UpIHtcclxuICAgIGlmICh0aGlzLmVsTm9kZSkge1xyXG4gICAgICBpZiAoaUNoZWNrKSB7XHJcbiAgICAgICAgaWYgKHggIT09IHRoaXMuZ2V0WCgpKSB7XHJcbiAgICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSwgeCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh5ICE9PSB0aGlzLmdldFkoKSkge1xyXG4gICAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueS5rZXksIHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSwgKHRoaXMuZWxOb2RlLm9mZnNldFRvcCAtIHkpKTtcclxuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSwgKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC51cGRhdGVQb3NpdGlvbiwgeyB4OiB0aGlzLmdldFgoKSwgeTogdGhpcy5nZXRZKCkgfSk7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcclxuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XHJcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcclxuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgIGl0ZW0udXBkYXRlKCk7XHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcclxuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xyXG5pbXBvcnQgeyBMaW5lRmxvdyB9IGZyb20gXCIuL0xpbmVGbG93XCI7XHJcbmltcG9ydCB7IE5vZGVGbG93IH0gZnJvbSBcIi4vTm9kZUZsb3dcIjtcclxuXHJcbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcclxuICBOb25lID0gMCxcclxuICBOb2RlID0gMSxcclxuICBDYW52YXMgPSAyLFxyXG4gIExpbmUgPSAzLFxyXG59XHJcbmV4cG9ydCBjbGFzcyBWaWV3RmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+IHtcclxuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50O1xyXG4gIHB1YmxpYyBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XHJcbiAgcHVibGljIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XHJcbiAgcHJpdmF0ZSB6b29tX21heDogbnVtYmVyID0gMS42O1xyXG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcclxuICBwcml2YXRlIHpvb21fdmFsdWU6IG51bWJlciA9IDAuMTtcclxuICBwcml2YXRlIHpvb21fbGFzdF92YWx1ZTogbnVtYmVyID0gMTtcclxuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xyXG4gIHByaXZhdGUgcG9zX3k6IG51bWJlciA9IDA7XHJcbiAgcHJpdmF0ZSBtb3VzZV94OiBudW1iZXIgPSAwO1xyXG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcclxuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XHJcbiAgcHJpdmF0ZSBsaW5lU2VsZWN0ZWQ6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSBub2RlU2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XHJcbiAgcHVibGljIG5vZGVPdmVyOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgZG90U2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSB0ZW1wTGluZTogTGluZUZsb3cgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIHRpbWVGYXN0Q2xpY2s6IG51bWJlciA9IDA7XHJcbiAgcHJpdmF0ZSB0YWdJbmdvcmUgPSBbJ2lucHV0JywgJ2J1dHRvbicsICdhJywgJ3RleHRhcmVhJ107XHJcbiAgcHJpdmF0ZSBnZXRYKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy54LmtleSlcclxuICB9XHJcbiAgcHJpdmF0ZSBnZXRZKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy55LmtleSlcclxuICB9XHJcbiAgcHJpdmF0ZSBnZXRab29tKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBwcm9wZXJ0aWVzID0ge1xyXG4gICAgbmFtZToge1xyXG4gICAgICBrZXk6IFwibmFtZVwiLFxyXG4gICAgfSxcclxuICAgIHpvb206IHtcclxuICAgICAga2V5OiBcInpvb21cIixcclxuICAgICAgZGVmYXVsdDogMSxcclxuICAgICAgdHlwZTogXCJudW1iZXJcIlxyXG4gICAgfSxcclxuICAgIHg6IHtcclxuICAgICAga2V5OiBcInhcIixcclxuICAgICAgZGVmYXVsdDogMCxcclxuICAgICAgdHlwZTogXCJudW1iZXJcIlxyXG4gICAgfSxcclxuICAgIHk6IHtcclxuICAgICAga2V5OiBcInlcIixcclxuICAgICAgZGVmYXVsdDogMCxcclxuICAgICAgdHlwZTogXCJudW1iZXJcIlxyXG4gICAgfVxyXG4gIH07XHJcbiAgcHVibGljIHJlYWRvbmx5IEV2ZW50ID0ge1xyXG4gICAgY2hhbmdlOiBcImNoYW5nZVwiLFxyXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcclxuICAgIHVwZGF0ZVZpZXc6IFwidXBkYXRlVmlld1wiXHJcbiAgfTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctZGVzZ2luIC53b3JrZXJmbG93LXZpZXcnKSB8fCB0aGlzLmVsTm9kZTtcclxuICAgIHRoaXMuZWxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctY2FudmFzXCIpO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XHJcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XHJcbiAgICB0aGlzLmFkZEV2ZW50KCk7XHJcbiAgICB0aGlzLlJlc2V0KCk7XHJcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEobnVsbCwgdGhpcy5wcm9wZXJ0aWVzKTtcclxuICAgIHRoaXMub24odGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsIChpdGVtOiBhbnkpID0+IHtcclxuICAgICAgdGhpcy51cGRhdGVWaWV3KCk7XHJcbiAgICB9KTtcclxuICAgIHRoaXMudXBkYXRlVmlldygpO1xyXG4gIH1cclxuICBwdWJsaWMgZ2V0T3B0aW9uKGtleU5vZGU6IGFueSkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50LmdldE9wdGlvbihrZXlOb2RlKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBkcm9wRW5kKGV2OiBhbnkpIHtcclxuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZiAoT2JqZWN0LmtleXModGhpcy5wYXJlbnQubW9kdWxlcykubGVuZ3RoID09IDApIHtcclxuICAgICAgdGhpcy5wYXJlbnQubmV3KCk7XHJcbiAgICB9XHJcbiAgICBsZXQga2V5Tm9kZTogc3RyaW5nIHwgbnVsbCA9ICcnO1xyXG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xyXG4gICAgICBrZXlOb2RlID0gdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3Q7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xyXG4gICAgfVxyXG4gICAgbGV0IG9wdGlvbiA9IHRoaXMuZ2V0T3B0aW9uKGtleU5vZGUpO1xyXG4gICAgaWYgKG9wdGlvbiAmJiBvcHRpb24ub25seU5vZGUpIHtcclxuICAgICAgaWYgKHRoaXMubm9kZXMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmNoZWNrTm9kZShrZXlOb2RlKSkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgbGV0IG5vZGUgPSB0aGlzLkFkZE5vZGUob3B0aW9uKTtcclxuXHJcbiAgICBsZXQgZV9wb3NfeCA9IDA7XHJcbiAgICBsZXQgZV9wb3NfeSA9IDA7XHJcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xyXG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xyXG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XHJcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xyXG4gICAgfVxyXG4gICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xyXG4gICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xyXG5cclxuICAgIG5vZGUudXBkYXRlUG9zaXRpb24oeCwgeSk7XHJcblxyXG4gIH1cclxuICBwdWJsaWMgdG9Kc29uKCkge1xyXG4gICAgbGV0IG5vZGVzID0gdGhpcy5ub2Rlcy5tYXAoKGl0ZW0pID0+IGl0ZW0udG9Kc29uKCkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgSWQ6IHRoaXMuSWQsXHJcbiAgICAgIGRhdGE6IHRoaXMuZGF0YS50b0pzb24oKSxcclxuICAgICAgbm9kZXNcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XHJcbiAgICB0aGlzLlJlc2V0KCk7XHJcbiAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgZGF0YSA9IHt9O1xyXG4gICAgfVxyXG4gICAgaWYgKCFkYXRhLklkKSB7XHJcbiAgICAgIGRhdGEuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIWRhdGEuZGF0YSkge1xyXG4gICAgICBkYXRhLmRhdGEgPSB7fTtcclxuICAgIH1cclxuICAgIGlmICghZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0pIHtcclxuICAgICAgZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0gPSBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gO1xyXG4gICAgfVxyXG4gICAgdGhpcy5JZCA9IGRhdGEuSWQ7XHJcbiAgICB0aGlzLmRhdGEubG9hZChkYXRhLmRhdGEpO1xyXG4gICAgdGhpcy5ub2RlcyA9IChkYXRhLm5vZGVzID8/IFtdKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICByZXR1cm4gKG5ldyBOb2RlRmxvdyh0aGlzLCBcIlwiKSkubG9hZChpdGVtKTtcclxuICAgIH0pO1xyXG4gICAgKGRhdGEubm9kZXMgPz8gW10pLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAoaXRlbS5saW5lID8/IFtdKS5mb3JFYWNoKChsaW5lOiBhbnkpID0+IHtcclxuICAgICAgICBsZXQgZnJvbU5vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUuZnJvbU5vZGUpO1xyXG4gICAgICAgIGxldCB0b05vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUudG9Ob2RlKTtcclxuICAgICAgICBsZXQgb3VwdXRJbmRleCA9IGxpbmUub3VwdXRJbmRleCA/PyAwO1xyXG4gICAgICAgIGlmIChmcm9tTm9kZSAmJiB0b05vZGUpIHtcclxuICAgICAgICAgIHRoaXMuQWRkTGluZShmcm9tTm9kZSwgdG9Ob2RlLCBvdXB1dEluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICAgIHRoaXMudXBkYXRlVmlldygpO1xyXG4gIH1cclxuICBwdWJsaWMgUmVzZXQoKSB7XHJcbiAgICB0aGlzLm5vZGVzLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy54LmtleSwgMCk7XHJcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy55LmtleSwgMCk7XHJcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcclxuICB9XHJcbiAgcHVibGljIGdldE5vZGVCeUlkKG5vZGVJZDogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLklkID09IG5vZGVJZClbMF07XHJcbiAgfVxyXG4gIHB1YmxpYyB1cGRhdGVWaWV3KCkge1xyXG4gICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHRoaXMuZ2V0WCgpICsgXCJweCwgXCIgKyB0aGlzLmdldFkoKSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy5nZXRab29tKCkgKyBcIilcIjtcclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC51cGRhdGVWaWV3LCB7IHg6IHRoaXMuZ2V0WCgpLCB5OiB0aGlzLmdldFkoKSwgem9vbTogdGhpcy5nZXRab29tKCkgfSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgQ2FsY1gobnVtYmVyOiBhbnkpIHtcclxuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRXaWR0aCAvICh0aGlzLmVsTm9kZT8uY2xpZW50V2lkdGggKiB0aGlzLmdldFpvb20oKSkpO1xyXG4gIH1cclxuICBwcml2YXRlIENhbGNZKG51bWJlcjogYW55KSB7XHJcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxOb2RlPy5jbGllbnRIZWlnaHQgKiB0aGlzLmdldFpvb20oKSkpO1xyXG4gIH1cclxuICBwcml2YXRlIGRyYWdvdmVyKGU6IGFueSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH1cclxuICBwdWJsaWMgVW5TZWxlY3RMaW5lKCkge1xyXG4gICAgdGhpcy5TZWxlY3RMaW5lKG51bGwpO1xyXG4gIH1cclxuICBwdWJsaWMgVW5TZWxlY3REb3QoKSB7XHJcbiAgICB0aGlzLlNlbGVjdERvdChudWxsKTtcclxuICB9XHJcbiAgcHVibGljIFVuU2VsZWN0Tm9kZSgpIHtcclxuICAgIHRoaXMuU2VsZWN0Tm9kZShudWxsKTtcclxuICB9XHJcbiAgcHVibGljIFVuU2VsZWN0KCkge1xyXG4gICAgdGhpcy5VblNlbGVjdExpbmUoKTtcclxuICAgIHRoaXMuVW5TZWxlY3ROb2RlKCk7XHJcbiAgICB0aGlzLlVuU2VsZWN0RG90KCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBTZWxlY3RMaW5lKG5vZGU6IExpbmVGbG93IHwgbnVsbCkge1xyXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQpIHtcclxuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZC5lbFBhdGg/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5VblNlbGVjdCgpO1xyXG4gICAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG5vZGU7XHJcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4gIHByaXZhdGUgZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xyXG4gIHB1YmxpYyBTZWxlY3ROb2RlKG5vZGU6IE5vZGVGbG93IHwgbnVsbCkge1xyXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQpIHtcclxuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIXRoaXMuZmxnU2VsZWN0Tm9kZSlcclxuICAgICAgICB0aGlzLnBhcmVudC5Qcm9wZXJ0eUluZm8odGhpcy5kYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZmxnU2VsZWN0Tm9kZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuVW5TZWxlY3QoKTtcclxuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBub2RlO1xyXG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgICB0aGlzLnBhcmVudC5Qcm9wZXJ0eUluZm8odGhpcy5ub2RlU2VsZWN0ZWQuZGF0YSk7XHJcbiAgICAgIHRoaXMuZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgU2VsZWN0RG90KG5vZGU6IE5vZGVGbG93IHwgbnVsbCkge1xyXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5kb3RTZWxlY3RlZCkge1xyXG4gICAgICAgIHRoaXMuZG90U2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuICAgICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5VblNlbGVjdCgpO1xyXG4gICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbm9kZTtcclxuICAgICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlRmxvdykge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMubm9kZXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBBZGROb2RlKG9wdGlvbjogYW55ID0gbnVsbCk6IE5vZGVGbG93IHtcclxuICAgIGxldCBub2RlID0gbmV3IE5vZGVGbG93KHRoaXMsIG9wdGlvbik7XHJcbiAgICB0aGlzLm5vZGVzID0gWy4uLnRoaXMubm9kZXMsIG5vZGVdO1xyXG4gICAgcmV0dXJuIG5vZGU7XHJcbiAgfVxyXG4gIHB1YmxpYyBBZGRMaW5lKGZyb21Ob2RlOiBOb2RlRmxvdywgdG9Ob2RlOiBOb2RlRmxvdywgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcclxuICAgIGlmIChmcm9tTm9kZSA9PSB0b05vZGUpIHJldHVybjtcclxuICAgIGlmIChmcm9tTm9kZS5hcnJMaW5lLmZpbHRlcigoaXRlbSkgPT4ge1xyXG4gICAgICByZXR1cm4gaXRlbS50b05vZGUgPT09IHRvTm9kZSAmJiBpdGVtLm91dHB1dEluZGV4ID09IG91dHB1dEluZGV4ICYmIGl0ZW0gIT0gdGhpcy50ZW1wTGluZTtcclxuICAgIH0pLmxlbmd0aCA+IDApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBMaW5lRmxvdyh0aGlzLCBmcm9tTm9kZSwgdG9Ob2RlLCBvdXRwdXRJbmRleCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBhZGRFdmVudCgpIHtcclxuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXHJcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIC8qIENvbnRleHQgTWVudSAqL1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvKiBEcm9wIERyYXAgKi9cclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5kcm9wRW5kLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5kcmFnb3Zlci5iaW5kKHRoaXMpKTtcclxuICAgIC8qIFpvb20gTW91c2UgKi9cclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuem9vbV9lbnRlci5iaW5kKHRoaXMpKTtcclxuICAgIC8qIERlbGV0ZSAqL1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWRvd24uYmluZCh0aGlzKSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBrZXlkb3duKGU6IGFueSkge1xyXG4gICAgaWYgKGUua2V5ID09PSAnRGVsZXRlJyB8fCAoZS5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGUubWV0YUtleSkpIHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQuZGVsZXRlKCk7XHJcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLmxpbmVTZWxlY3RlZCAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZGVsZXRlKCk7XHJcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyB6b29tX2VudGVyKGV2ZW50OiBhbnkpIHtcclxuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuICAgICAgaWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcclxuICAgICAgICAvLyBab29tIE91dFxyXG4gICAgICAgIHRoaXMuem9vbV9vdXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBab29tIEluXHJcbiAgICAgICAgdGhpcy56b29tX2luKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIHpvb21fcmVmcmVzaCgpIHtcclxuICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLngua2V5LCAodGhpcy5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0aGlzLmdldFpvb20oKSk7XHJcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy55LmtleSwgKHRoaXMuZ2V0WSgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGhpcy5nZXRab29tKCkpO1xyXG4gICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0aGlzLmdldFpvb20oKTtcclxuICAgIHRoaXMudXBkYXRlVmlldygpO1xyXG4gIH1cclxuICBwdWJsaWMgem9vbV9pbigpIHtcclxuICAgIGlmICh0aGlzLmdldFpvb20oKSA8IHRoaXMuem9vbV9tYXgpIHtcclxuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuem9vbS5rZXksICh0aGlzLmdldFpvb20oKSArIHRoaXMuem9vbV92YWx1ZSkpO1xyXG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgem9vbV9vdXQoKSB7XHJcbiAgICBpZiAodGhpcy5nZXRab29tKCkgPiB0aGlzLnpvb21fbWluKSB7XHJcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnpvb20ua2V5LCAodGhpcy5nZXRab29tKCkgLSB0aGlzLnpvb21fdmFsdWUpKTtcclxuICAgICAgdGhpcy56b29tX3JlZnJlc2goKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIHpvb21fcmVzZXQoKSB7XHJcbiAgICBpZiAodGhpcy5nZXRab29tKCkgIT0gMSkge1xyXG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSwgdGhpcy5wcm9wZXJ0aWVzLnpvb20uZGVmYXVsdCk7XHJcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgU3RhcnRNb3ZlKGU6IGFueSkge1xyXG4gICAgaWYgKHRoaXMudGFnSW5nb3JlLmluY2x1ZGVzKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gdGhpcy5wYXJlbnQuZ2V0VGltZSgpO1xyXG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWFpbi1wYXRoJykpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTm9uZSkge1xyXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgJiYgdGhpcy5wYXJlbnQuY2hlY2tQYXJlbnQoZS50YXJnZXQsIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZSkpIHtcclxuICAgICAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdkb3QnKSkge1xyXG4gICAgICAgICAgaWYgKHRoaXMucGFyZW50LmNoZWNrUGFyZW50KGUudGFyZ2V0LCB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGVJbnB1dHMpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xyXG4gICAgICAgICAgdGhpcy50ZW1wTGluZSA9IG5ldyBMaW5lRmxvdyh0aGlzLCB0aGlzLm5vZGVTZWxlY3RlZCwgbnVsbCk7XHJcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lLm91dHB1dEluZGV4ID0gKyhlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuQ2FudmFzO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xyXG4gICAgICB0aGlzLnBvc194ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XHJcbiAgICAgIHRoaXMucG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucG9zX3ggPSBlLmNsaWVudFg7XHJcbiAgICAgIHRoaXMucG9zX3kgPSBlLmNsaWVudFk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xyXG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XHJcbiAgfVxyXG4gIHB1YmxpYyBNb3ZlKGU6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcclxuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XHJcbiAgICBsZXQgZV9wb3NfeCA9IDA7XHJcbiAgICBsZXQgZV9wb3NfeSA9IDA7XHJcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XHJcbiAgICAgIGVfcG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcclxuICAgICAgZV9wb3NfeSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcclxuICAgICAgZV9wb3NfeSA9IGUuY2xpZW50WTtcclxuICAgIH1cclxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xyXG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcclxuICAgICAgICB7XHJcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuZ2V0WCgpICsgdGhpcy5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcclxuICAgICAgICAgIGxldCB5ID0gdGhpcy5nZXRZKCkgKyB0aGlzLkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxyXG4gICAgICAgICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHggKyBcInB4LCBcIiArIHkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuZ2V0Wm9vbSgpICsgXCIpXCI7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcclxuICAgICAgICB7XHJcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xyXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcclxuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xyXG4gICAgICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XHJcbiAgICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZD8udXBkYXRlUG9zaXRpb24oeCwgeSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xyXG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XHJcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcclxuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLmVsQ2FudmFzLm9mZnNldExlZnQgLSB4LCB0aGlzLmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xyXG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnRvTm9kZSA9IHRoaXMubm9kZU92ZXI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xyXG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xyXG4gICAgICB0aGlzLm1vdXNlX3kgPSBlX3Bvc195O1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgRW5kTW92ZShlOiBhbnkpIHtcclxuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XHJcbiAgICAvL2ZpeCBGYXN0IENsaWNrXHJcbiAgICBpZiAoKCh0aGlzLnBhcmVudC5nZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMzAwKSB8fCAhdGhpcy5mbGdNb3ZlKSB7XHJcbiAgICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMgJiYgdGhpcy5mbGdEcmFwKVxyXG4gICAgICAgIHRoaXMuVW5TZWxlY3QoKTtcclxuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XHJcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xyXG4gICAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMudGVtcExpbmUgJiYgdGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5MaW5lKSB7XHJcbiAgICAgIGlmICh0aGlzLnRlbXBMaW5lLnRvTm9kZSAmJiB0aGlzLnRlbXBMaW5lLnRvTm9kZS5jaGVja0lucHV0KCkpIHtcclxuICAgICAgICB0aGlzLkFkZExpbmUodGhpcy50ZW1wTGluZS5mcm9tTm9kZSwgdGhpcy50ZW1wTGluZS50b05vZGUsIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXgpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMudGVtcExpbmUuZGVsZXRlKCk7XHJcbiAgICAgIHRoaXMudGVtcExpbmUgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xyXG4gICAgbGV0IGVfcG9zX3kgPSAwO1xyXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XHJcbiAgICAgIGVfcG9zX3ggPSB0aGlzLm1vdXNlX3g7XHJcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlX3Bvc194ID0gZS5jbGllbnRYO1xyXG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT09IE1vdmVUeXBlLkNhbnZhcykge1xyXG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy54LmtleSwgdGhpcy5nZXRYKCkgKyB0aGlzLkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKSk7XHJcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnkua2V5LCB0aGlzLmdldFkoKSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpKTtcclxuICAgIH1cclxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xyXG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XHJcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcclxuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xyXG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb250ZXh0bWVudShlOiBhbnkpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRmxvd0NvcmUgfSBmcm9tIFwiLi9jb3JlL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IENvbnRyb2xGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9Db250cm9sRmxvd1wiO1xyXG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL2NvcmUvRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgUHJvcGVydHlGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9Qcm9wZXJ0eUZsb3dcIjtcclxuaW1wb3J0IHsgVGFiRmxvdywgVGFiSXRlbUZsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL1RhYkZsb3dcIjtcclxuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL1ZpZXdGbG93XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgV29ya2VyRmxvdyBleHRlbmRzIEZsb3dDb3JlIHtcclxuXHJcbiAgcHVibGljIFZpZXc6IFZpZXdGbG93IHwgbnVsbDtcclxuICBwdWJsaWMgQ29udHJvbDogQ29udHJvbEZsb3cgfCBudWxsO1xyXG4gIHB1YmxpYyBQcm9wZXJ0eTogUHJvcGVydHlGbG93IHwgbnVsbDtcclxuICBwdWJsaWMgVGFiOiBUYWJGbG93IHwgbnVsbDtcclxuICBwdWJsaWMgbW9kdWxlczogYW55ID0ge307XHJcbiAgcHVibGljIGRhdGFOb2RlU2VsZWN0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICBwdWJsaWMgb3B0aW9uOiBhbnk7XHJcblxyXG4gIHB1YmxpYyBjaGVja1BhcmVudChub2RlOiBhbnksIG5vZGVDaGVjazogYW55KSB7XHJcbiAgICBpZiAobm9kZSAmJiBub2RlQ2hlY2spIHtcclxuICAgICAgaWYgKG5vZGUgPT0gbm9kZUNoZWNrKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgbGV0IHBhcmVudDogYW55ID0gbm9kZTtcclxuICAgICAgd2hpbGUgKChwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudCkgIT0gbnVsbCkge1xyXG4gICAgICAgIGlmIChub2RlQ2hlY2sgPT0gcGFyZW50KSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG9wdGlvbjogYW55ID0gbnVsbCkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMuZWxOb2RlID0gY29udGFpbmVyO1xyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3dcIik7XHJcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbiB8fCB7XHJcbiAgICAgIGNvbnRyb2w6IHt9XHJcbiAgICB9O1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxyXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbFwiPlxyXG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2hlYWRlclwiPk5vZGUgQ29udHJvbDwvaDI+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2xpc3RcIj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWRlc2dpblwiPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1pdGVtc1wiPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctdmlld1wiPlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctcHJvcGVydHlcIj5cclxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1wcm9wZXJ0eV9faGVhZGVyXCI+UHJvcGVydGllczwvaDI+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXByb3BlcnR5X19saXN0XCI+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LXByb3BlcnR5X19oZWFkZXJcIj5Qcm9qZWN0PC9oMj5cclxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctcHJvcGVydHlfX2xpc3RcIj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICAgIGA7XHJcbiAgICB0aGlzLlZpZXcgPSBuZXcgVmlld0Zsb3codGhpcyk7XHJcbiAgICB0aGlzLlRhYiA9IG5ldyBUYWJGbG93KHRoaXMpO1xyXG4gICAgdGhpcy5Db250cm9sID0gbmV3IENvbnRyb2xGbG93KHRoaXMpO1xyXG4gICAgdGhpcy5Qcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eUZsb3codGhpcyk7XHJcbiAgfVxyXG4gIHB1YmxpYyBuZXcoKSB7XHJcbiAgICB0aGlzLlRhYj8uTmV3UHJvamVjdCgpO1xyXG4gIH1cclxuICBwdWJsaWMgb3BlblByb2plY3QobW9kdWVsczogYW55KSB7XHJcbiAgICB0aGlzLm1vZHVsZXMgPSBtb2R1ZWxzO1xyXG4gICAgbGV0IGtleSA9IE9iamVjdC5rZXlzKHRoaXMubW9kdWxlcylbMF07XHJcbiAgICBpZiAoa2V5KSB7XHJcbiAgICAgIHRoaXMubG9hZCh0aGlzLm1vZHVsZXNba2V5XSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcclxuICAgIHRoaXMuVGFiPy5Mb2FkUHJvamVjdChkYXRhKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBQcm9wZXJ0eUluZm8oZGF0YTogRGF0YUZsb3cpIHtcclxuICAgIHRoaXMuUHJvcGVydHk/LlByb3BlcnR5SW5mbyhkYXRhKTtcclxuICB9XHJcbiAgcHVibGljIGdldE9wdGlvbihrZXlOb2RlOiBhbnkpIHtcclxuICAgIGlmICgha2V5Tm9kZSkgcmV0dXJuO1xyXG4gICAgbGV0IGNvbnRyb2wgPSB0aGlzLm9wdGlvbi5jb250cm9sW2tleU5vZGVdO1xyXG4gICAgaWYgKCFjb250cm9sKSB7XHJcbiAgICAgIGNvbnRyb2wgPSBPYmplY3QudmFsdWVzKHRoaXMub3B0aW9uLmNvbnRyb2wpWzBdO1xyXG4gICAgfVxyXG4gICAgY29udHJvbC5ub2RlID0ga2V5Tm9kZTtcclxuICAgIHJldHVybiBjb250cm9sO1xyXG4gIH1cclxuICBwdWJsaWMgdG9Kc29uKCkge1xyXG4gICAgdGhpcy5UYWI/LlVwZGF0ZURhdGEoKTtcclxuICAgIHJldHVybiB0aGlzLm1vZHVsZXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICB9XHJcbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcclxuICAgIC8vIGh0dHA6Ly93d3cuaWV0Zi5vcmcvcmZjL3JmYzQxMjIudHh0XHJcbiAgICBsZXQgczogYW55ID0gW107XHJcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM2OyBpKyspIHtcclxuICAgICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xyXG4gICAgfVxyXG4gICAgc1sxNF0gPSBcIjRcIjsgIC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxyXG4gICAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcclxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcclxuXHJcbiAgICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcclxuICAgIHJldHVybiB1dWlkO1xyXG4gIH1cclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7TUFFYSxTQUFTLENBQUE7SUFDWixNQUFNLEdBQVEsRUFBRSxDQUFDO0FBQ3pCLElBQUEsV0FBQSxHQUFBO0tBRUM7SUFDTSxNQUFNLENBQUMsS0FBYSxFQUFFLFFBQWEsRUFBQTtBQUN4QyxRQUFBLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3JDLFFBQUEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDMUI7O0lBRU0sRUFBRSxDQUFDLEtBQWEsRUFBRSxRQUFhLEVBQUE7O0FBRXBDLFFBQUEsSUFBSSxPQUFPLFFBQVEsS0FBSyxVQUFVLEVBQUU7WUFDbEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBLDREQUFBLEVBQStELE9BQU8sUUFBUSxDQUFBLENBQUUsQ0FBQyxDQUFDO0FBQ2hHLFlBQUEsT0FBTyxLQUFLLENBQUM7QUFDZCxTQUFBOztBQUVELFFBQUEsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBLG1EQUFBLEVBQXNELE9BQU8sS0FBSyxDQUFBLENBQUUsQ0FBQyxDQUFDO0FBQ3BGLFlBQUEsT0FBTyxLQUFLLENBQUM7QUFDZCxTQUFBOztRQUVELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxTQUFTLEVBQUU7QUFDcEMsWUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHO0FBQ25CLGdCQUFBLFNBQVMsRUFBRSxFQUFFO2FBQ2QsQ0FBQTtBQUNGLFNBQUE7QUFDRCxRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztL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QUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQzVGLFFBQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDNUYsUUFBQSxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7S0FDbkI7SUFDTSxPQUFPLEdBQUE7UUFDWixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzVFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNyQixTQUFBO0tBQ0Y7SUFDTSxRQUFRLEdBQUE7UUFDYixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzVFLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNyQixTQUFBO0tBQ0Y7SUFDTSxVQUFVLEdBQUE7QUFDZixRQUFBLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRTtZQUN2QixJQUFJLENBQUMsSUFBSSxD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
