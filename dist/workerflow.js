
  /**
   * @license
   * author: Nguyen Van Hau
   * workerflow.js v0.0.1
   * Released under the MIT license.
   */

var workerflow = (function () {
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
                this.nodes = this.nodes.filter((item) => item.Id != node.Id);
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
                    let elItem = document.createElement('input');
                    elItem.setAttribute('node:model', item);
                    this.elNode.appendChild(elItem);
                }
                this.lastData.BindEvent(this);
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
            console.log(projectId);
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
                this.parent.modules[this.tabActive.ItemId] = this.parent.View?.toJson();
                this.tabActive.Active(false);
                this.tabActive = undefined;
            }
            this.tabActive = ProjectNext;
            this.tabActive.SetData(dataNext);
            this.tabActive.Active(true);
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
            this.data.InitData(data, this.properties);
        }
        constructor(parent, option = null) {
            super(parent);
            this.setOption(option, {});
            if (option) {
                this.ReUI();
                this.on(this.data.Event.dataChange, () => {
                    this.UpdateUI();
                });
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
            this.data.load(data?.data);
            this.ReUI();
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
        ReUI() {
            if (this.elNode)
                this.elNode.remove();
            this.data.RemoveEvent(this);
            this.elNode = document.createElement('div');
            this.elNode.classList.add("workerflow-node");
            this.elNode.id = `node-${this.Id}`;
            this.elNodeInputs = document.createElement('div');
            this.elNodeInputs.classList.add('workerflow-node_inputs');
            this.elNodeInputs.innerHTML = `<div class="inputs dot"></div>`;
            this.elNodeContent = document.createElement('div');
            this.elNodeContent.classList.add('workerflow-node_content');
            this.elNodeOutputs = document.createElement('div');
            this.elNodeOutputs.classList.add('workerflow-node_outputs');
            this.elNodeOutputs.innerHTML = `<div class="outputs dot" node="0"></div>`;
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
            return +this.data.Get(this.properties.canvas_x.key);
        }
        getY() {
            return +this.data.Get(this.properties.canvas_y.key);
        }
        getZoom() {
            return this.data.Get(this.properties.zoom.key);
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
            canvas_x: {
                key: "canvas_x",
                default: 0,
                type: "number"
            },
            canvas_y: {
                key: "canvas_y",
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
            this.data.Set(this.properties.canvas_x.key, 0);
            this.data.Set(this.properties.canvas_y.key, 0);
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
            this.data.Set(this.properties.canvas_x.key, (this.getX() / this.zoom_last_value) * this.getZoom());
            this.data.Set(this.properties.canvas_y.key, (this.getY() / this.zoom_last_value) * this.getZoom());
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
                this.data.Set(this.properties.canvas_x.key, this.getX() + this.CalcX(-(this.pos_x - e_pos_x)));
                this.data.Set(this.properties.canvas_y.key, this.getY() + this.CalcY(-(this.pos_y - e_pos_y)));
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

    return WorkerFlow;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbXBvbmVudHMvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0NvbnRyb2xGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvUHJvcGVydHlGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVGFiRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0xpbmVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvTm9kZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9WaWV3Rmxvdy50cyIsIi4uL3NyYy9Xb3JrZXJGbG93LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZsb3dDb3JlIH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcbiAgcHJpdmF0ZSBkYXRhOiBhbnkgPSB7fTtcbiAgcHVibGljIG5vZGVzOiBGbG93Q29yZVtdID0gW107XG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCJcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIG5vZGU6IEZsb3dDb3JlKSB7XG4gIH1cbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IC0xKSB7XG4gICAgICB0aGlzLm5vZGUucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICB0aGlzLkJpbmRFdmVudCh0aGlzLm5vZGUpO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlRXZlbnRBbGwoKSB7XG4gICAgZm9yIChsZXQgbm9kZSBvZiB0aGlzLm5vZGVzKSB7XG4gICAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5jaGFuZ2VJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLm5vZGVzID0gW107XG4gIH1cbiAgcHVibGljIFJlbW92ZUV2ZW50KG5vZGU6IEZsb3dDb3JlKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzW2luZGV4XS5lbE5vZGUucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsXWApLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgaXRlbS5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuY2hhbmdlSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgICB9KTtcbiAgICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbF1gKS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGl0ZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmNoYW5nZUlucHV0LmJpbmQodGhpcykpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLm5vZGVzID0gdGhpcy5ub2Rlcy5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uSWQgIT0gbm9kZS5JZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBCaW5kRXZlbnQobm9kZTogRmxvd0NvcmUpIHtcbiAgICB0aGlzLlJlbW92ZUV2ZW50KG5vZGUpO1xuICAgIHRoaXMubm9kZXMgPSBbLi4uIHRoaXMubm9kZXMsIG5vZGVdO1xuICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbF1gKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGlmIChpdGVtLnRhZ05hbWUgPT0gJ1NQQU4nIHx8IGl0ZW0udGFnTmFtZSA9PSAnRElWJykge1xuICAgICAgICBpdGVtLmlubmVySFRNTCA9IGAke3RoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbS52YWx1ZSA9IHRoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuY2hhbmdlSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgfSk7XG4gIH1cbiAgcHJpdmF0ZSBTZXRWYWx1ZShrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgZWxVcGRhdGUgPSBudWxsKSB7XG4gICAgZm9yIChsZXQgbm9kZSBvZiB0aGlzLm5vZGVzKSB7XG4gICAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWw9XCIke2tleX1cIl1gKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGl0ZW0gIT0gZWxVcGRhdGUpIHtcbiAgICAgICAgICBpZiAoaXRlbS50YWdOYW1lID09ICdTUEFOJyB8fCBpdGVtLnRhZ05hbWUgPT0gJ0RJVicpIHtcbiAgICAgICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gYCR7dmFsdWV9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXRlbS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBub2RlLmRpc3BhdGNoKHRoaXMuRXZlbnQuZGF0YUNoYW5nZSwgeyBrZXksIHZhbHVlLCBlbFVwZGF0ZSB9KTtcbiAgICAgIG5vZGUuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHsga2V5LCB2YWx1ZSwgZWxVcGRhdGUgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIGVsVXBkYXRlID0gbnVsbCkge1xuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLlNldFZhbHVlKGtleSwgdmFsdWUsIGVsVXBkYXRlKTtcbiAgICB9LCAxMDApO1xuICB9XG4gIHB1YmxpYyBHZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2tleV07XG4gIH1cbiAgcHVibGljIGNoYW5nZUlucHV0KGU6IGFueSkge1xuICAgIHRoaXMuU2V0KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApLCBlLnRhcmdldC52YWx1ZSwgZS50YXJnZXQpO1xuICB9XG5cbiAgcHVibGljIFVwZGF0ZVVJKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgbm9kZSBvZiB0aGlzLm5vZGVzKSB7XG4gICAgICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbF1gKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAoaXRlbS50YWdOYW1lID09ICdTUEFOJyB8fCBpdGVtLnRhZ05hbWUgPT0gJ0RJVicpIHtcbiAgICAgICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gYCR7dGhpcy5kYXRhW2l0ZW0uZ2V0QXR0cmlidXRlKGBub2RlOm1vZGVsYCldfWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGl0ZW0udmFsdWUgPSB0aGlzLmRhdGFbaXRlbS5nZXRBdHRyaWJ1dGUoYG5vZGU6bW9kZWxgKV07XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LCAxMDApO1xuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMubm9kZS5wcm9wZXJ0aWVzKSkge1xuICAgICAgdGhpcy5kYXRhW2tleV0gPSAoZGF0YT8uW2tleV0gPz8gKHRoaXMubm9kZS5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQgPz8gXCJcIikpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCByczogYW55ID0ge307XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMubm9kZS5wcm9wZXJ0aWVzKSkge1xuICAgICAgcnNba2V5XSA9IHRoaXMuR2V0KGtleSk7XG4gICAgfVxuICAgIHJldHVybiBycztcbiAgfVxufVxuIiwiaW1wb3J0IHsgRmxvd0NvcmUgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRGbG93IHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IEZsb3dDb3JlKSB7XG5cbiAgfVxuICAvKiBFdmVudHMgKi9cbiAgcHVibGljIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgZXZlbnQgbmFtZSBtdXN0IGJlIGEgc3RyaW5nLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBldmVudH1gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XG4gICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG5cbiAgICBpZiAoIXRoaXMuZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXG4gICAgY29uc3QgbGlzdGVuZXJJbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKVxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXG4gIH1cblxuICBwdWJsaWMgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzLnBhcmVudDtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIGNvbnNvbGUuZXJyb3IoYFRoaXMgZXZlbnQ6ICR7ZXZlbnR9IGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xuICAgICAgbGlzdGVuZXIoZGV0YWlscywgc2VsZik7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgRmxvd0NvcmUge1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBwdWJsaWMgSWQ6IGFueTtcbiAgcHVibGljIHByb3BlcnRpZXM6IGFueSA9IHt9O1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KHRoaXMpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCYXNlRmxvdzxUUGFyZW50PiBleHRlbmRzIEZsb3dDb3JlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJlbnQ6IFRQYXJlbnQpIHtcbiAgICBzdXBlcigpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcbmltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4gIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogV29ya2VyRmxvdykge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctY29udHJvbF9fbGlzdCcpIHx8IHRoaXMuZWxOb2RlO1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGFyZW50Lm9wdGlvbi5jb250cm9sKTtcbiAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBsZXQgTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcbiAgICAgICAgTm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScsIGtleSk7XG4gICAgICAgIE5vZGUuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctY29udHJvbF9faXRlbVwiKTtcbiAgICAgICAgTm9kZS5pbm5lckhUTUwgPSBwYXJlbnQub3B0aW9uLmNvbnRyb2xba2V5XS5uYW1lO1xuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuZHJhZ1N0YXJ0LmJpbmQodGhpcykpXG4gICAgICAgIE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsIHRoaXMuZHJhZ2VuZC5iaW5kKHRoaXMpKVxuICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChOb2RlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZHJhZ2VuZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdCA9IG51bGw7XG4gIH1cblxuICBwdWJsaWMgZHJhZ1N0YXJ0KGU6IGFueSkge1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdCA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIud29ya2VyZmxvdy1jb250cm9sX19pdGVtXCIpLmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJub2RlXCIsIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJykpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eUZsb3cgZXh0ZW5kcyBCYXNlRmxvdzxXb3JrZXJGbG93PiB7XG4gIHByaXZhdGUgbGFzdERhdGE6IERhdGFGbG93IHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1wcm9wZXJ0eV9fbGlzdCcpIHx8IHRoaXMuZWxOb2RlO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gIH1cbiAgcHVibGljIFByb3BlcnR5SW5mbyhkYXRhOiBEYXRhRmxvdykge1xuICAgIGlmICh0aGlzLmxhc3REYXRhICYmIHRoaXMubGFzdERhdGEgPT09IGRhdGEpIHJldHVybjtcbiAgICBpZiAodGhpcy5sYXN0RGF0YSkge1xuICAgICAgdGhpcy5sYXN0RGF0YS5SZW1vdmVFdmVudCh0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHByaXZhdGUgUmVuZGVyVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBpZiAodGhpcy5sYXN0RGF0YSkge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBPYmplY3Qua2V5cyh0aGlzLmxhc3REYXRhLm5vZGUucHJvcGVydGllcykpIHtcbiAgICAgICAgbGV0IGVsSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIGVsSXRlbS5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCBpdGVtKTtcbiAgICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoZWxJdGVtKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubGFzdERhdGEuQmluZEV2ZW50KHRoaXMpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5leHBvcnQgY2xhc3MgVGFiSXRlbUZsb3cgZXh0ZW5kcyBCYXNlRmxvdzxUYWJGbG93PntcbiAgcHVibGljIEl0ZW1JZDogYW55O1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBUYWJGbG93LCBwcml2YXRlIGRhdGFJdGVtOiBhbnkpIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMuSWQgPSB0aGlzLnBhcmVudC5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIHRoaXMuSXRlbUlkID0gZGF0YUl0ZW0uSWQ7XG4gICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1pdGVtXCIpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0JywgdGhpcy5JdGVtSWQpO1xuICAgIGxldCBub2RlTmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBub2RlTmFtZS5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCAnbmFtZScpO1xuICAgIG5vZGVOYW1lLmlubmVySFRNTCA9IGRhdGFJdGVtLm5hbWU7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQobm9kZU5hbWUpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLkNsaWNrVGFiLmJpbmQodGhpcykpO1xuICB9XG4gIHByaXZhdGUgQ2xpY2tUYWIoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQuTG9hZFByb2plY3RCeUlkKHRoaXMuSXRlbUlkKTtcbiAgfVxuICBwdWJsaWMgU2V0RGF0YShkYXRhSXRlbTogYW55KSB7XG4gICAgdGhpcy5kYXRhSXRlbSA9IGRhdGFJdGVtO1xuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5wYXJlbnQucGFyZW50LlZpZXc/LmxvYWQodGhpcy5kYXRhSXRlbSk7XG4gICAgICB0aGlzLnBhcmVudC5wYXJlbnQuVmlldz8uZGF0YS5CaW5kRXZlbnQodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5wYXJlbnQucGFyZW50LlZpZXc/LmRhdGEuUmVtb3ZlRXZlbnQodGhpcyk7XG4gICAgfVxuICB9XG5cbn1cbmV4cG9ydCBjbGFzcyBUYWJGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4gIHtcbiAgcHVibGljIHRhYnM6IFRhYkl0ZW1GbG93W10gPSBbXTtcbiAgcHJpdmF0ZSB0YWJBY3RpdmU6IFRhYkl0ZW1GbG93IHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1pdGVtcycpIHx8IHRoaXMuZWxOb2RlO1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIExvYWRQcm9qZWN0QnlJZChwcm9qZWN0SWQ6IGFueSkge1xuICAgIGNvbnNvbGUubG9nKHByb2plY3RJZCk7XG4gICAgaWYgKCFwcm9qZWN0SWQpIHJldHVybjtcbiAgICBsZXQgUHJvamVjdE5leHQgPSB0aGlzLnRhYnM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5JdGVtSWQgPT0gcHJvamVjdElkKT8uWzBdO1xuICAgIGxldCBkYXRhTmV4dDogYW55ID0gdGhpcy5wYXJlbnQubW9kdWxlc1twcm9qZWN0SWRdO1xuICAgIGlmICghZGF0YU5leHQpIHJldHVybjtcbiAgICBpZiAoIVByb2plY3ROZXh0KSB7XG4gICAgICBQcm9qZWN0TmV4dCA9IG5ldyBUYWJJdGVtRmxvdyh0aGlzLCBkYXRhTmV4dCk7XG4gICAgICB0aGlzLnRhYnMgPSBbLi4udGhpcy50YWJzLCBQcm9qZWN0TmV4dF07XG4gICAgfVxuXG4gICAgaWYgKFByb2plY3ROZXh0ICYmIHRoaXMudGFiQWN0aXZlKSB7XG4gICAgICBpZiAodGhpcy50YWJBY3RpdmUgPT0gUHJvamVjdE5leHQpIHJldHVybjtcbiAgICAgIHRoaXMucGFyZW50Lm1vZHVsZXNbdGhpcy50YWJBY3RpdmUuSXRlbUlkXSA9IHRoaXMucGFyZW50LlZpZXc/LnRvSnNvbigpO1xuICAgICAgdGhpcy50YWJBY3RpdmUuQWN0aXZlKGZhbHNlKTtcbiAgICAgIHRoaXMudGFiQWN0aXZlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnRhYkFjdGl2ZSA9IFByb2plY3ROZXh0O1xuICAgIHRoaXMudGFiQWN0aXZlLlNldERhdGEoZGF0YU5leHQpO1xuICAgIHRoaXMudGFiQWN0aXZlLkFjdGl2ZSh0cnVlKTtcbiAgfVxuICBwdWJsaWMgTmV3UHJvamVjdCgpIHtcbiAgICBjb25zdCBkYXRhID0ge1xuICAgICAgSWQ6IHRoaXMucGFyZW50LmdldFV1aWQoKSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgbmFtZTogYHByb2plY3QtJHt0aGlzLnBhcmVudC5nZXRUaW1lKCl9YCxcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMCxcbiAgICAgICAgem9vbTogMSxcbiAgICAgIH0sXG4gICAgICBub2RlczogW11cbiAgICB9XG4gICAgdGhpcy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuICBwdWJsaWMgTG9hZFByb2plY3QoZGF0YTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQubW9kdWxlc1tkYXRhLklkXSA9IGRhdGE7XG4gICAgdGhpcy5Mb2FkUHJvamVjdEJ5SWQoZGF0YS5JZCk7XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9WaWV3Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgTGluZUZsb3cge1xuICBwdWJsaWMgZWxDb25uZWN0aW9uOiBTVkdFbGVtZW50IHwgbnVsbDtcbiAgcHVibGljIGVsUGF0aDogU1ZHUGF0aEVsZW1lbnQ7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVmlld0Zsb3csIHB1YmxpYyBmcm9tTm9kZTogTm9kZUZsb3csIHB1YmxpYyB0b05vZGU6IE5vZGVGbG93IHwgbnVsbCA9IG51bGwsIHB1YmxpYyBvdXRwdXRJbmRleDogbnVtYmVyID0gMCkge1xuICAgIHRoaXMuZWxDb25uZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwic3ZnXCIpO1xuICAgIHRoaXMuZWxQYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKFwibWFpbi1wYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgJycpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uLmNsYXNzTGlzdC5hZGQoXCJjb25uZWN0aW9uXCIpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uLmFwcGVuZENoaWxkKHRoaXMuZWxQYXRoKTtcbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcz8uYXBwZW5kQ2hpbGQodGhpcy5lbENvbm5lY3Rpb24pO1xuICAgIHRoaXMuZnJvbU5vZGUuQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnRvTm9kZT8uQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LlNlbGVjdExpbmUodGhpcyk7XG4gIH1cbiAgcHJpdmF0ZSBjcmVhdGVDdXJ2YXR1cmUoc3RhcnRfcG9zX3g6IG51bWJlciwgc3RhcnRfcG9zX3k6IG51bWJlciwgZW5kX3Bvc194OiBudW1iZXIsIGVuZF9wb3NfeTogbnVtYmVyLCBjdXJ2YXR1cmVfdmFsdWU6IG51bWJlciwgdHlwZTogc3RyaW5nKSB7XG4gICAgbGV0IGxpbmVfeCA9IHN0YXJ0X3Bvc194O1xuICAgIGxldCBsaW5lX3kgPSBzdGFydF9wb3NfeTtcbiAgICBsZXQgeCA9IGVuZF9wb3NfeDtcbiAgICBsZXQgeSA9IGVuZF9wb3NfeTtcbiAgICBsZXQgY3VydmF0dXJlID0gY3VydmF0dXJlX3ZhbHVlO1xuICAgIC8vdHlwZSBvcGVuY2xvc2Ugb3BlbiBjbG9zZSBvdGhlclxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ290aGVyJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuXG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGRlbGV0ZShub2RlVGhpczogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKHRoaXMuZnJvbU5vZGUgIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLmZyb21Ob2RlLlJlbW92ZUxpbmUodGhpcyk7XG4gICAgaWYgKHRoaXMudG9Ob2RlICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50b05vZGU/LlJlbW92ZUxpbmUodGhpcyk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24/LnJlbW92ZSgpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uID0gbnVsbDtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVG8odG9feDogbnVtYmVyLCB0b195OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5mcm9tTm9kZS5lbE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xuICAgIGxldCB7IHg6IGZyb21feCwgeTogZnJvbV95IH06IGFueSA9IHRoaXMuZnJvbU5vZGUuZ2V0RG90T3V0cHV0KHRoaXMub3V0cHV0SW5kZXgpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZSgpIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG9Ob2RlICYmIHRoaXMudG9Ob2RlLmVsTm9kZSkge1xuICAgICAgbGV0IHRvX3ggPSB0aGlzLnRvTm9kZS5nZXRYKCkgLSA1O1xuICAgICAgbGV0IHRvX3kgPSB0aGlzLnRvTm9kZS5nZXRZKCkgKyB0aGlzLnRvTm9kZS5lbE5vZGUuY2xpZW50SGVpZ2h0IC8gMjtcbiAgICAgIHRoaXMudXBkYXRlVG8odG9feCwgdG9feSk7XG4gICAgfVxuXG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcbmltcG9ydCB7IExpbmVGbG93IH0gZnJvbSBcIi4vTGluZUZsb3dcIjtcbmltcG9ydCB7IFZpZXdGbG93IH0gZnJvbSBcIi4vVmlld0Zsb3dcIjtcbmNvbnN0IGdldmFsID0gZXZhbDtcbmV4cG9ydCBjbGFzcyBOb2RlRmxvdyBleHRlbmRzIEJhc2VGbG93PFZpZXdGbG93PiB7XG4gIHB1YmxpYyBlbE5vZGVJbnB1dHM6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVPdXRwdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZWxOb2RlQ29udGVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGdldFkoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSk7XG4gIH1cbiAgcHVibGljIGdldFgoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSk7XG4gIH1cbiAgcHVibGljIGdldERvdElucHV0KGluZGV4OiBudW1iZXIgPSAxKSB7XG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZU91dHB1dHM/LnF1ZXJ5U2VsZWN0b3IoYC5kb3Rbbm9kZT1cIiR7aW5kZXh9XCJdYCk7XG4gICAgaWYgKGVsRG90KSB7XG4gICAgICBsZXQgeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgKyBlbERvdC5vZmZzZXRUb3AgKyAxMCk7XG4gICAgICBsZXQgeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0ICsgZWxEb3Qub2Zmc2V0TGVmdCAtIDEwKTtcbiAgICAgIHJldHVybiB7IHgsIHkgfTtcbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIHB1YmxpYyBnZXREb3RPdXRwdXQoaW5kZXg6IG51bWJlciA9IDApIHtcbiAgICBsZXQgZWxEb3Q6IGFueSA9IHRoaXMuZWxOb2RlT3V0cHV0cz8ucXVlcnlTZWxlY3RvcihgLmRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcbiAgICBpZiAoZWxEb3QpIHtcbiAgICAgIGxldCB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCArIGVsRG90Lm9mZnNldFRvcCArIDEwKTtcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0ICsgMTApO1xuXG4gICAgICByZXR1cm4geyB4LCB5IH07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuICBwdWJsaWMgYXJyTGluZTogTGluZUZsb3dbXSA9IFtdO1xuICBwcml2YXRlIG9wdGlvbjogYW55O1xuICBwcml2YXRlIG5vZGU6IGFueTtcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVEZWZhdWx0ID0ge1xuICAgIHg6IHtcbiAgICAgIGtleTogXCJ4XCIsXG4gICAgICBkZWZhdWx0OiAwXG4gICAgfSxcbiAgICB5OiB7XG4gICAgICBrZXk6IFwieVwiLFxuICAgICAgZGVmYXVsdDogMFxuICAgIH1cbiAgfVxuICBwdWJsaWMgcHJvcGVydGllczogYW55ID0ge31cbiAgcHJpdmF0ZSBmbGdTY3JpcHQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHJlYWRvbmx5IEV2ZW50ID0ge1xuICAgIFJlVUk6IFwiUmVVSVwiLFxuICAgIGNoYW5nZTogXCJjaGFuZ2VcIixcbiAgICB1cGRhdGVQb3NpdGlvbjogXCJ1cGRhdGVQb3NpdGlvblwiLFxuICAgIHNlbGVjdGVkOiBcIlNlbGVjdGVkXCIsXG4gICAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCJcbiAgfTtcbiAgcHVibGljIHNldE9wdGlvbihvcHRpb246IGFueSA9IG51bGwsIGRhdGE6IGFueSA9IHt9KSB7XG4gICAgdGhpcy5vcHRpb24gPSBvcHRpb24gfHwge307XG4gICAgaWYgKCF0aGlzLm9wdGlvbi5wcm9wZXJ0aWVzKSB7XG4gICAgICB0aGlzLm9wdGlvbi5wcm9wZXJ0aWVzID0ge307XG4gICAgfVxuICAgIHRoaXMubm9kZSA9IHRoaXMub3B0aW9uLm5vZGU7XG4gICAgdGhpcy5JZCA9IGRhdGE/LklkID8/IHRoaXMucGFyZW50LnBhcmVudC5nZXRVdWlkKCk7XG4gICAgdGhpcy5wcm9wZXJ0aWVzID0geyAuLi50aGlzLnByb3BlcnRpZURlZmF1bHQsIC4uLnRoaXMub3B0aW9uLnByb3BlcnRpZXMgfTtcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoZGF0YSwgdGhpcy5wcm9wZXJ0aWVzKTtcblxuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFZpZXdGbG93LCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMuc2V0T3B0aW9uKG9wdGlvbiwge30pO1xuICAgIGlmIChvcHRpb24pIHtcbiAgICAgIHRoaXMuUmVVSSgpO1xuICAgICAgdGhpcy5vbih0aGlzLmRhdGEuRXZlbnQuZGF0YUNoYW5nZSwgKCkgPT4ge1xuICAgICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgICB9KVxuICAgIH1cbiAgICB0aGlzLm9uKHRoaXMuRXZlbnQuY2hhbmdlLCAoZTogYW55LCBzZW5kZXI6IGFueSkgPT4ge1xuICAgICAgdGhpcy5wYXJlbnQuZGlzcGF0Y2godGhpcy5wYXJlbnQuRXZlbnQuY2hhbmdlLCB7XG4gICAgICAgIC4uLmUsXG4gICAgICAgIHRhcmdldE5vZGU6IHNlbmRlclxuICAgICAgfSk7XG4gICAgfSlcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCBMaW5lSnNvbiA9IHRoaXMuYXJyTGluZS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uZnJvbU5vZGUgPT09IHRoaXMpLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAgIGZyb21Ob2RlOiBpdGVtLmZyb21Ob2RlLklkLFxuICAgICAgdG9Ob2RlOiBpdGVtLnRvTm9kZT8uSWQsXG4gICAgICBvdXB1dEluZGV4OiBpdGVtLm91dHB1dEluZGV4XG4gICAgfSkpO1xuICAgIHJldHVybiB7XG4gICAgICBJZDogdGhpcy5JZCxcbiAgICAgIG5vZGU6IHRoaXMubm9kZSxcbiAgICAgIGxpbmU6IExpbmVKc29uLFxuICAgICAgZGF0YTogdGhpcy5kYXRhLnRvSnNvbigpLFxuICAgIH1cbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEuUmVtb3ZlRXZlbnRBbGwoKTtcbiAgICBsZXQgb3B0aW9uID0gdGhpcy5wYXJlbnQuZ2V0T3B0aW9uKGRhdGE/Lm5vZGUpO1xuICAgIHRoaXMuc2V0T3B0aW9uKG9wdGlvbiwgZGF0YSk7XG4gICAgdGhpcy5kYXRhLmxvYWQoZGF0YT8uZGF0YSk7XG4gICAgdGhpcy5SZVVJKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIG91dHB1dCgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNSZW1vdmVQYXJlbnQgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuTm9kZUxlYXZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZSgpO1xuICAgIHRoaXMuYXJyTGluZSA9IFtdO1xuICAgIGlmIChpc1JlbW92ZVBhcmVudClcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7fSk7XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgUmVVSSgpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHRoaXMuZWxOb2RlLnJlbW92ZSgpO1xuICAgIHRoaXMuZGF0YS5SZW1vdmVFdmVudCh0aGlzKTtcbiAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LW5vZGVcIik7XG4gICAgdGhpcy5lbE5vZGUuaWQgPSBgbm9kZS0ke3RoaXMuSWR9YDtcbiAgICB0aGlzLmVsTm9kZUlucHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlSW5wdXRzLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9pbnB1dHMnKTtcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImlucHV0cyBkb3RcIj48L2Rpdj5gO1xuICAgIHRoaXMuZWxOb2RlQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlQ29udGVudC5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfY29udGVudCcpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfb3V0cHV0cycpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIm91dHB1dHMgZG90XCIgbm9kZT1cIjBcIj48L2Rpdj5gO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgdGhpcy5JZCk7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVJbnB1dHMpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlQ29udGVudCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVPdXRwdXRzKTtcblxuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzPy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgaWYgKHRoaXMuZGF0YSkge1xuICAgICAgbGV0IGRhdGFUZW1wID0gdGhpcy5kYXRhLnRvSnNvbigpO1xuICAgICAgdGhpcy5kYXRhLmxvYWQoZGF0YVRlbXApO1xuICAgICAgdGhpcy5kYXRhLlVwZGF0ZVVJKCk7XG4gICAgfVxuICAgIHRoaXMuaW5pdE9wdGlvbigpO1xuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5SZVVJLCB7fSk7XG4gIH1cbiAgcHVibGljIGNoZWNrSW5wdXQoKSB7XG4gICAgcmV0dXJuICEodGhpcy5vcHRpb24/LmlucHV0ID09PSAwKTtcbiAgfVxuICBwcml2YXRlIGluaXRPcHRpb24oKSB7XG5cbiAgICBpZiAodGhpcy5lbE5vZGVDb250ZW50ICYmIHRoaXMub3B0aW9uICYmIHRoaXMuZWxOb2RlT3V0cHV0cykge1xuICAgICAgdGhpcy5lbE5vZGVDb250ZW50LmlubmVySFRNTCA9IHRoaXMub3B0aW9uLmh0bWw7XG4gICAgICBpZiAodGhpcy5vcHRpb24ub3V0cHV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5lbE5vZGVPdXRwdXRzLmlubmVySFRNTCA9ICcnO1xuICAgICAgICBmb3IgKGxldCBpbmRleDogbnVtYmVyID0gMDsgaW5kZXggPCB0aGlzLm9wdGlvbi5vdXRwdXQ7IGluZGV4KyspIHtcbiAgICAgICAgICBsZXQgb3V0cHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgb3V0cHV0LnNldEF0dHJpYnV0ZSgnbm9kZScsICgzMDAgKyBpbmRleCkudG9TdHJpbmcoKSk7XG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJkb3RcIik7XG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJvdXRwdXRfXCIgKyAoaW5kZXgpKTtcbiAgICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHM/LmFwcGVuZENoaWxkKG91dHB1dCk7XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9uLmlucHV0ID09PSAwICYmIHRoaXMuZWxOb2RlSW5wdXRzKSB7XG4gICAgICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9ICcnO1xuICAgICAgfVxuXG4gICAgfVxuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHNlbGYuUnVuU2NyaXB0KHNlbGYsIHNlbGYuZWxOb2RlKTtcbiAgICB9LCAxMDApO1xuICB9XG4gIHB1YmxpYyBSdW5TY3JpcHQoc2VsZk5vZGU6IE5vZGVGbG93LCBlbDogSFRNTEVsZW1lbnQgfCBudWxsKSB7XG4gICAgaWYgKHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLnNjcmlwdCAmJiAhdGhpcy5mbGdTY3JpcHQpIHtcbiAgICAgIHRoaXMuZmxnU2NyaXB0ID0gdHJ1ZTtcbiAgICAgIGdldmFsKCcobm9kZSxlbCk9PnsnICsgdGhpcy5vcHRpb24uc2NyaXB0LnRvU3RyaW5nKCkgKyAnfScpKHNlbGZOb2RlLCBlbCk7XG4gICAgICB0aGlzLmZsZ1NjcmlwdCA9IHRydWU7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBjaGVja05vZGUobm9kZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLm5vZGUgPT0gbm9kZTtcbiAgfVxuICBwdWJsaWMgTm9kZU92ZXIoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQubm9kZU92ZXIgPSB0aGlzO1xuICB9XG4gIHB1YmxpYyBOb2RlTGVhdmUoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQubm9kZU92ZXIgPSBudWxsO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LlNlbGVjdE5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnNlbGVjdGVkLCB7fSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgaWYgKGlDaGVjaykge1xuICAgICAgICBpZiAoeCAhPT0gdGhpcy5nZXRYKCkpIHtcbiAgICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSwgeCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHkgIT09IHRoaXMuZ2V0WSgpKSB7XG4gICAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueS5rZXksIHkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSwgKHRoaXMuZWxOb2RlLm9mZnNldFRvcCAtIHkpKTtcbiAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueC5rZXksICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0IC0geCkpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQudXBkYXRlUG9zaXRpb24sIHsgeDogdGhpcy5nZXRYKCksIHk6IHRoaXMuZ2V0WSgpIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0udXBkYXRlKCk7XG4gICAgfSlcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBMaW5lRmxvdyB9IGZyb20gXCIuL0xpbmVGbG93XCI7XG5pbXBvcnQgeyBOb2RlRmxvdyB9IGZyb20gXCIuL05vZGVGbG93XCI7XG5cbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcbiAgTm9uZSA9IDAsXG4gIE5vZGUgPSAxLFxuICBDYW52YXMgPSAyLFxuICBMaW5lID0gMyxcbn1cbmV4cG9ydCBjbGFzcyBWaWV3RmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+IHtcbiAgcHVibGljIGVsQ2FudmFzOiBIVE1MRWxlbWVudDtcbiAgcHVibGljIGZsZ0RyYXA6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBtb3ZlVHlwZTogTW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICBwcml2YXRlIHpvb21fbWF4OiBudW1iZXIgPSAxLjY7XG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcbiAgcHJpdmF0ZSB6b29tX3ZhbHVlOiBudW1iZXIgPSAwLjE7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBub2RlczogTm9kZUZsb3dbXSA9IFtdO1xuICBwcml2YXRlIGxpbmVTZWxlY3RlZDogTGluZUZsb3cgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBub2RlU2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBub2RlT3ZlcjogTm9kZUZsb3cgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBkb3RTZWxlY3RlZDogTm9kZUZsb3cgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0ZW1wTGluZTogTGluZUZsb3cgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB0aW1lRmFzdENsaWNrOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHRhZ0luZ29yZSA9IFsnaW5wdXQnLCAnYnV0dG9uJywgJ2EnLCAndGV4dGFyZWEnXTtcbiAgcHJpdmF0ZSBnZXRYKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCh0aGlzLnByb3BlcnRpZXMuY2FudmFzX3gua2V5KVxuICB9XG4gIHByaXZhdGUgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQodGhpcy5wcm9wZXJ0aWVzLmNhbnZhc195LmtleSlcbiAgfVxuICBwcml2YXRlIGdldFpvb20oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQodGhpcy5wcm9wZXJ0aWVzLnpvb20ua2V5KTtcbiAgfVxuICBwdWJsaWMgcHJvcGVydGllcyA9IHtcbiAgICBuYW1lOiB7XG4gICAgICBrZXk6IFwibmFtZVwiLFxuICAgIH0sXG4gICAgem9vbToge1xuICAgICAga2V5OiBcInpvb21cIixcbiAgICAgIGRlZmF1bHQ6IDEsXG4gICAgICB0eXBlOiBcIm51bWJlclwiXG4gICAgfSxcbiAgICBjYW52YXNfeDoge1xuICAgICAga2V5OiBcImNhbnZhc194XCIsXG4gICAgICBkZWZhdWx0OiAwLFxuICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgIH0sXG4gICAgY2FudmFzX3k6IHtcbiAgICAgIGtleTogXCJjYW52YXNfeVwiLFxuICAgICAgZGVmYXVsdDogMCxcbiAgICAgIHR5cGU6IFwibnVtYmVyXCJcbiAgICB9XG4gIH07XG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcbiAgICB1cGRhdGVWaWV3OiBcInVwZGF0ZVZpZXdcIlxuICB9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1kZXNnaW4gLndvcmtlcmZsb3ctdmlldycpIHx8IHRoaXMuZWxOb2RlO1xuICAgIHRoaXMuZWxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsQ2FudmFzKTtcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XG4gICAgdGhpcy5hZGRFdmVudCgpO1xuICAgIHRoaXMuUmVzZXQoKTtcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEobnVsbCwgdGhpcy5wcm9wZXJ0aWVzKTtcbiAgICB0aGlzLm9uKHRoaXMuZGF0YS5FdmVudC5kYXRhQ2hhbmdlLCAoaXRlbTogYW55KSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgICB9KTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgfVxuICBwdWJsaWMgZ2V0T3B0aW9uKGtleU5vZGU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXRPcHRpb24oa2V5Tm9kZSk7XG4gIH1cbiAgcHJpdmF0ZSBkcm9wRW5kKGV2OiBhbnkpIHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLnBhcmVudC5tb2R1bGVzKS5sZW5ndGggPT0gMCkge1xuICAgICAgdGhpcy5wYXJlbnQubmV3KCk7XG4gICAgfVxuICAgIGxldCBrZXlOb2RlOiBzdHJpbmcgfCBudWxsID0gJyc7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAga2V5Tm9kZSA9IHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0O1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xuICAgIH1cbiAgICBsZXQgb3B0aW9uID0gdGhpcy5nZXRPcHRpb24oa2V5Tm9kZSk7XG4gICAgaWYgKG9wdGlvbiAmJiBvcHRpb24ub25seU5vZGUpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVzLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5jaGVja05vZGUoa2V5Tm9kZSkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgbm9kZSA9IHRoaXMuQWRkTm9kZShvcHRpb24pO1xuXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGxldCB4ID0gdGhpcy5DYWxjWCh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICBsZXQgeSA9IHRoaXMuQ2FsY1kodGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG5cbiAgICBub2RlLnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuXG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgbm9kZXMgPSB0aGlzLm5vZGVzLm1hcCgoaXRlbSkgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIElkOiB0aGlzLklkLFxuICAgICAgZGF0YTogdGhpcy5kYXRhLnRvSnNvbigpLFxuICAgICAgbm9kZXNcbiAgICB9XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5SZXNldCgpO1xuICAgIGlmICghZGF0YSkge1xuICAgICAgZGF0YSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIWRhdGEuSWQpIHtcbiAgICAgIGRhdGEuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XG4gICAgfVxuICAgIGlmICghZGF0YS5kYXRhKSB7XG4gICAgICBkYXRhLmRhdGEgPSB7fTtcbiAgICB9XG4gICAgaWYgKCFkYXRhLmRhdGFbdGhpcy5wcm9wZXJ0aWVzLm5hbWUua2V5XSkge1xuICAgICAgZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0gPSBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gO1xuICAgIH1cbiAgICB0aGlzLklkID0gZGF0YS5JZDtcbiAgICB0aGlzLmRhdGEubG9hZChkYXRhLmRhdGEpO1xuICAgIHRoaXMuZGF0YS5VcGRhdGVVSSgpO1xuICAgIHRoaXMubm9kZXMgPSAoZGF0YS5ub2RlcyA/PyBbXSkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiAobmV3IE5vZGVGbG93KHRoaXMsIFwiXCIpKS5sb2FkKGl0ZW0pO1xuICAgIH0pO1xuICAgIChkYXRhLm5vZGVzID8/IFtdKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIChpdGVtLmxpbmUgPz8gW10pLmZvckVhY2goKGxpbmU6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZnJvbU5vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUuZnJvbU5vZGUpO1xuICAgICAgICBsZXQgdG9Ob2RlID0gdGhpcy5nZXROb2RlQnlJZChsaW5lLnRvTm9kZSk7XG4gICAgICAgIGxldCBvdXB1dEluZGV4ID0gbGluZS5vdXB1dEluZGV4ID8/IDA7XG4gICAgICAgIGlmIChmcm9tTm9kZSAmJiB0b05vZGUpIHtcbiAgICAgICAgICB0aGlzLkFkZExpbmUoZnJvbU5vZGUsIHRvTm9kZSwgb3VwdXRJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSk7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIFJlc2V0KCkge1xuICAgIHRoaXMubm9kZXMuZm9yRWFjaCgoaXRlbSkgPT4gaXRlbS5kZWxldGUoZmFsc2UpKTtcbiAgICB0aGlzLm5vZGVzID0gW107XG4gICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuY2FudmFzX3gua2V5LCAwKTtcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy5jYW52YXNfeS5rZXksIDApO1xuICAgIHRoaXMudXBkYXRlVmlldygpO1xuICB9XG4gIHB1YmxpYyBnZXROb2RlQnlJZChub2RlSWQ6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLm5vZGVzPy5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uSWQgPT0gbm9kZUlkKVswXTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVmlldygpIHtcbiAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgdGhpcy5nZXRYKCkgKyBcInB4LCBcIiArIHRoaXMuZ2V0WSgpICsgXCJweCkgc2NhbGUoXCIgKyB0aGlzLmdldFpvb20oKSArIFwiKVwiO1xuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC51cGRhdGVWaWV3LCB7IHg6IHRoaXMuZ2V0WCgpLCB5OiB0aGlzLmdldFkoKSwgem9vbTogdGhpcy5nZXRab29tKCkgfSk7XG4gIH1cbiAgcHJpdmF0ZSBDYWxjWChudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRXaWR0aCAvICh0aGlzLmVsTm9kZT8uY2xpZW50V2lkdGggKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHByaXZhdGUgQ2FsY1kobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxOb2RlPy5jbGllbnRIZWlnaHQgKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHByaXZhdGUgZHJhZ292ZXIoZTogYW55KSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG4gIHB1YmxpYyBVblNlbGVjdExpbmUoKSB7XG4gICAgdGhpcy5TZWxlY3RMaW5lKG51bGwpO1xuICB9XG4gIHB1YmxpYyBVblNlbGVjdERvdCgpIHtcbiAgICB0aGlzLlNlbGVjdERvdChudWxsKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3ROb2RlKCkge1xuICAgIHRoaXMuU2VsZWN0Tm9kZShudWxsKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3QoKSB7XG4gICAgdGhpcy5VblNlbGVjdExpbmUoKTtcbiAgICB0aGlzLlVuU2VsZWN0Tm9kZSgpO1xuICAgIHRoaXMuVW5TZWxlY3REb3QoKTtcbiAgfVxuICBwdWJsaWMgU2VsZWN0TGluZShub2RlOiBMaW5lRmxvdyB8IG51bGwpIHtcbiAgICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZWxQYXRoPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG5vZGU7XG4gICAgICB0aGlzLmxpbmVTZWxlY3RlZC5lbFBhdGguY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfVxuXG4gIH1cbiAgcHJpdmF0ZSBmbGdTZWxlY3ROb2RlID0gZmFsc2U7XG4gIHB1YmxpYyBTZWxlY3ROb2RlKG5vZGU6IE5vZGVGbG93IHwgbnVsbCkge1xuICAgIGlmIChub2RlID09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCkge1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuZmxnU2VsZWN0Tm9kZSlcbiAgICAgICAgdGhpcy5wYXJlbnQuUHJvcGVydHlJbmZvKHRoaXMuZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZmxnU2VsZWN0Tm9kZSA9IHRydWU7XG4gICAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZCA9IG5vZGU7XG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5wYXJlbnQuUHJvcGVydHlJbmZvKHRoaXMubm9kZVNlbGVjdGVkLmRhdGEpO1xuICAgICAgdGhpcy5mbGdTZWxlY3ROb2RlID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBTZWxlY3REb3Qobm9kZTogTm9kZUZsb3cgfCBudWxsKSB7XG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuZG90U2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5VblNlbGVjdCgpO1xuICAgICAgdGhpcy5kb3RTZWxlY3RlZCA9IG5vZGU7XG4gICAgICB0aGlzLmRvdFNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBSZW1vdmVOb2RlKG5vZGU6IE5vZGVGbG93KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlKG9wdGlvbjogYW55ID0gbnVsbCk6IE5vZGVGbG93IHtcbiAgICBsZXQgbm9kZSA9IG5ldyBOb2RlRmxvdyh0aGlzLCBvcHRpb24pO1xuICAgIHRoaXMubm9kZXMgPSBbLi4udGhpcy5ub2Rlcywgbm9kZV07XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbiAgcHVibGljIEFkZExpbmUoZnJvbU5vZGU6IE5vZGVGbG93LCB0b05vZGU6IE5vZGVGbG93LCBvdXRwdXRJbmRleDogbnVtYmVyID0gMCkge1xuICAgIGlmIChmcm9tTm9kZSA9PSB0b05vZGUpIHJldHVybjtcbiAgICBpZiAoZnJvbU5vZGUuYXJyTGluZS5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgIHJldHVybiBpdGVtLnRvTm9kZSA9PT0gdG9Ob2RlICYmIGl0ZW0ub3V0cHV0SW5kZXggPT0gb3V0cHV0SW5kZXggJiYgaXRlbSAhPSB0aGlzLnRlbXBMaW5lO1xuICAgIH0pLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBMaW5lRmxvdyh0aGlzLCBmcm9tTm9kZSwgdG9Ob2RlLCBvdXRwdXRJbmRleCk7XG4gIH1cbiAgcHVibGljIGFkZEV2ZW50KCkge1xuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuICAgIC8qIENvbnRleHQgTWVudSAqL1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMuZHJvcEVuZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCB0aGlzLmRyYWdvdmVyLmJpbmQodGhpcykpO1xuICAgIC8qIFpvb20gTW91c2UgKi9cbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLnpvb21fZW50ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogRGVsZXRlICovXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWRvd24uYmluZCh0aGlzKSk7XG4gIH1cbiAgcHVibGljIGtleWRvd24oZTogYW55KSB7XG4gICAgaWYgKGUua2V5ID09PSAnRGVsZXRlJyB8fCAoZS5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGUubWV0YUtleSkpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgaWYgKHRoaXMubm9kZVNlbGVjdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQuZGVsZXRlKCk7XG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmxpbmVTZWxlY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkLmRlbGV0ZSgpO1xuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX2VudGVyKGV2ZW50OiBhbnkpIHtcbiAgICBpZiAoZXZlbnQuY3RybEtleSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgaWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcbiAgICAgICAgLy8gWm9vbSBPdXRcbiAgICAgICAgdGhpcy56b29tX291dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gWm9vbSBJblxuICAgICAgICB0aGlzLnpvb21faW4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21fcmVmcmVzaCgpIHtcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy5jYW52YXNfeC5rZXksICh0aGlzLmdldFgoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRoaXMuZ2V0Wm9vbSgpKTtcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy5jYW52YXNfeS5rZXksICh0aGlzLmdldFkoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRoaXMuZ2V0Wm9vbSgpKTtcbiAgICB0aGlzLnpvb21fbGFzdF92YWx1ZSA9IHRoaXMuZ2V0Wm9vbSgpO1xuICAgIHRoaXMudXBkYXRlVmlldygpO1xuICB9XG4gIHB1YmxpYyB6b29tX2luKCkge1xuICAgIGlmICh0aGlzLmdldFpvb20oKSA8IHRoaXMuem9vbV9tYXgpIHtcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnpvb20ua2V5LCAodGhpcy5nZXRab29tKCkgKyB0aGlzLnpvb21fdmFsdWUpKTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX291dCgpIHtcbiAgICBpZiAodGhpcy5nZXRab29tKCkgPiB0aGlzLnpvb21fbWluKSB7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSwgKHRoaXMuZ2V0Wm9vbSgpIC0gdGhpcy56b29tX3ZhbHVlKSk7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICBpZiAodGhpcy5nZXRab29tKCkgIT0gMSkge1xuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuem9vbS5rZXksIHRoaXMucHJvcGVydGllcy56b29tLmRlZmF1bHQpO1xuICAgICAgdGhpcy56b29tX3JlZnJlc2goKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgU3RhcnRNb3ZlKGU6IGFueSkge1xuICAgIGlmICh0aGlzLnRhZ0luZ29yZS5pbmNsdWRlcyhlLnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudGltZUZhc3RDbGljayA9IHRoaXMucGFyZW50LmdldFRpbWUoKTtcbiAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtYWluLXBhdGgnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5Ob25lKSB7XG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgJiYgdGhpcy5wYXJlbnQuY2hlY2tQYXJlbnQoZS50YXJnZXQsIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZSkpIHtcbiAgICAgICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnZG90JykpIHtcbiAgICAgICAgICBpZiAodGhpcy5wYXJlbnQuY2hlY2tQYXJlbnQoZS50YXJnZXQsIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZUlucHV0cykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkxpbmU7XG4gICAgICAgICAgdGhpcy50ZW1wTGluZSA9IG5ldyBMaW5lRmxvdyh0aGlzLCB0aGlzLm5vZGVTZWxlY3RlZCwgbnVsbCk7XG4gICAgICAgICAgdGhpcy50ZW1wTGluZS5vdXRwdXRJbmRleCA9ICsoZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob2RlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuQ2FudmFzO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wb3NfeCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBvc194ID0gZS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGUuY2xpZW50WTtcbiAgICB9XG4gICAgdGhpcy5mbGdEcmFwID0gdHJ1ZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwdWJsaWMgTW92ZShlOiBhbnkpIHtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubW92ZVR5cGUpIHtcbiAgICAgIGNhc2UgTW92ZVR5cGUuQ2FudmFzOlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHggPSB0aGlzLmdldFgoKSArIHRoaXMuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLmdldFkoKSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHggKyBcInB4LCBcIiArIHkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuZ2V0Wm9vbSgpICsgXCIpXCI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5DYWxjWCh0aGlzLnBvc194IC0gZV9wb3NfeCk7XG4gICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcbiAgICAgICAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICAgICAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZD8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMuQ2FsY1kodGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnVwZGF0ZVRvKHRoaXMuZWxDYW52YXMub2Zmc2V0TGVmdCAtIHgsIHRoaXMuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnRvTm9kZSA9IHRoaXMubm9kZU92ZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcbiAgICAgIHRoaXMubW91c2VfeSA9IGVfcG9zX3k7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBFbmRNb3ZlKGU6IGFueSkge1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgLy9maXggRmFzdCBDbGlja1xuICAgIGlmICgoKHRoaXMucGFyZW50LmdldFRpbWUoKSAtIHRoaXMudGltZUZhc3RDbGljaykgPCAzMDApIHx8ICF0aGlzLmZsZ01vdmUpIHtcbiAgICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMgJiYgdGhpcy5mbGdEcmFwKVxuICAgICAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnRlbXBMaW5lICYmIHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTGluZSkge1xuICAgICAgaWYgKHRoaXMudGVtcExpbmUudG9Ob2RlICYmIHRoaXMudGVtcExpbmUudG9Ob2RlLmNoZWNrSW5wdXQoKSkge1xuICAgICAgICB0aGlzLkFkZExpbmUodGhpcy50ZW1wTGluZS5mcm9tTm9kZSwgdGhpcy50ZW1wTGluZS50b05vZGUsIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXgpO1xuICAgICAgfVxuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSBudWxsO1xuICAgIH1cbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy5jYW52YXNfeC5rZXksIHRoaXMuZ2V0WCgpICsgdGhpcy5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSkpO1xuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuY2FudmFzX3kua2V5LCB0aGlzLmdldFkoKSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpKTtcbiAgICB9XG4gICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIGNvbnRleHRtZW51KGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRmxvd0NvcmUgfSBmcm9tIFwiLi9jb21wb25lbnRzL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBDb250cm9sRmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvQ29udHJvbEZsb3dcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgUHJvcGVydHlGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9Qcm9wZXJ0eUZsb3dcIjtcbmltcG9ydCB7IFRhYkZsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL1RhYkZsb3dcIjtcbmltcG9ydCB7IFZpZXdGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9WaWV3Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgV29ya2VyRmxvdyBleHRlbmRzIEZsb3dDb3JlIHtcblxuICBwdWJsaWMgVmlldzogVmlld0Zsb3cgfCBudWxsO1xuICBwdWJsaWMgQ29udHJvbDogQ29udHJvbEZsb3cgfCBudWxsO1xuICBwdWJsaWMgUHJvcGVydHk6IFByb3BlcnR5RmxvdyB8IG51bGw7XG4gIHB1YmxpYyBUYWI6IFRhYkZsb3cgfCBudWxsO1xuICBwdWJsaWMgbW9kdWxlczogYW55ID0ge307XG4gIHB1YmxpYyBkYXRhTm9kZVNlbGVjdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBvcHRpb246IGFueTtcblxuICBwdWJsaWMgY2hlY2tQYXJlbnQobm9kZTogYW55LCBub2RlQ2hlY2s6IGFueSkge1xuICAgIGlmIChub2RlICYmIG5vZGVDaGVjaykge1xuICAgICAgaWYgKG5vZGUgPT0gbm9kZUNoZWNrKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGxldCBwYXJlbnQ6IGFueSA9IG5vZGU7XG4gICAgICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50KSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChub2RlQ2hlY2sgPT0gcGFyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZWxOb2RlID0gY29udGFpbmVyO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93XCIpO1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uIHx8IHtcbiAgICAgIGNvbnRyb2w6IHt9XG4gICAgfTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbFwiPlxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sX19oZWFkZXJcIj5Ob2RlIENvbnRyb2w8L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbF9fbGlzdFwiPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctZGVzZ2luXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1pdGVtc1wiPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy12aWV3XCI+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1wcm9wZXJ0eVwiPlxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1wcm9wZXJ0eV9faGVhZGVyXCI+UHJvcGVydGllczwvaDI+XG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1wcm9wZXJ0eV9fbGlzdFwiPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgYDtcbiAgICB0aGlzLlZpZXcgPSBuZXcgVmlld0Zsb3codGhpcyk7XG4gICAgdGhpcy5UYWIgPSBuZXcgVGFiRmxvdyh0aGlzKTtcbiAgICB0aGlzLkNvbnRyb2wgPSBuZXcgQ29udHJvbEZsb3codGhpcyk7XG4gICAgdGhpcy5Qcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eUZsb3codGhpcyk7XG4gIH1cbiAgcHVibGljIG5ldygpIHtcbiAgICB0aGlzLlRhYj8uTmV3UHJvamVjdCgpO1xuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuVGFiPy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuXG4gIHB1YmxpYyBQcm9wZXJ0eUluZm8oZGF0YTogRGF0YUZsb3cpIHtcbiAgICB0aGlzLlByb3BlcnR5Py5Qcm9wZXJ0eUluZm8oZGF0YSk7XG4gIH1cbiAgcHVibGljIGdldE9wdGlvbihrZXlOb2RlOiBhbnkpIHtcbiAgICBpZiAoIWtleU5vZGUpIHJldHVybjtcbiAgICBsZXQgY29udHJvbCA9IHRoaXMub3B0aW9uLmNvbnRyb2xba2V5Tm9kZV07XG4gICAgaWYgKCFjb250cm9sKSB7XG4gICAgICBjb250cm9sID0gT2JqZWN0LnZhbHVlcyh0aGlzLm9wdGlvbi5jb250cm9sKVswXTtcbiAgICB9XG4gICAgY29udHJvbC5ub2RlID0ga2V5Tm9kZTtcbiAgICByZXR1cm4gY29udHJvbDtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIHJldHVybiB0aGlzLlZpZXc/LnRvSnNvbigpO1xuICB9XG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gIH1cbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcbiAgICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICAgIGxldCBzOiBhbnkgPSBbXTtcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XG4gICAgfVxuICAgIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7ICAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICAgIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICAgIHJldHVybiB1dWlkO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7VUFFYSxRQUFRLENBQUE7SUFPTyxJQUFBLElBQUEsQ0FBQTtRQU5sQixJQUFJLEdBQVEsRUFBRSxDQUFDO1FBQ2hCLEtBQUssR0FBZSxFQUFFLENBQUM7SUFDZCxJQUFBLEtBQUssR0FBRztJQUN0QixR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
