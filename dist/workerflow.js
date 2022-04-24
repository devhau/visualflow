
  /**
   * @license
   * author: Nguyen Van Hau
   * workerflow.js v0.0.1
   * Released under the MIT license.
   */

var workerflow = (function () {
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

    return WorkerFlow;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvcmUvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29yZS9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0NvbnRyb2xGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvUHJvcGVydHlGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVGFiRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0xpbmVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvTm9kZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9WaWV3Rmxvdy50cyIsIi4uL3NyYy9Xb3JrZXJGbG93LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZsb3dDb3JlIH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFdmVudEZsb3cge1xyXG4gIHByaXZhdGUgZXZlbnRzOiBhbnkgPSB7fTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gIH1cclxuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHRoaXMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgLyogRXZlbnRzICovXHJcbiAgcHVibGljIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xyXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcclxuICAgICAgICBsaXN0ZW5lcnM6IFtdXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXHJcblxyXG4gICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZVxyXG5cclxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcclxuICAgIGNvbnN0IGxpc3RlbmVySW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcclxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXHJcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIGNvbnNvbGUuZXJyb3IoYFRoaXMgZXZlbnQ6ICR7ZXZlbnR9IGRvZXMgbm90IGV4aXN0YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xyXG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBGbG93Q29yZSB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcclxuICBwcml2YXRlIGRhdGE6IGFueSA9IHt9O1xyXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XHJcbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcclxuICB9XHJcbiAgcHVibGljIHJlYWRvbmx5IEV2ZW50ID0ge1xyXG4gICAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXHJcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXHJcbiAgICBkaXNwb3NlOiBcImRpc3Bvc2VcIlxyXG4gIH1cclxuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIG5vZGU6IEZsb3dDb3JlKSB7XHJcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcclxuICB9XHJcbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XHJcbiAgICBpZiAocHJvcGVydGllcyAhPT0gLTEpIHtcclxuICAgICAgdGhpcy5ub2RlLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xyXG4gICAgfVxyXG4gICAgdGhpcy5sb2FkKGRhdGEpO1xyXG4gICAgdGhpcy5CaW5kRXZlbnQodGhpcy5ub2RlKTtcclxuICB9XHJcbiAgcHVibGljIEJpbmRFdmVudChub2RlOiBGbG93Q29yZSkge1xyXG4gIH1cclxuICBwdWJsaWMgU2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwpIHtcclxuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XHJcbiAgICB0aGlzLmRpc3BhdGNoKGAke3RoaXMuRXZlbnQuZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xyXG4gICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgIH0pO1xyXG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmRhdGFDaGFuZ2UsIHtcclxuICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICB9KTtcclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHtcclxuICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcHVibGljIEdldChrZXk6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xyXG4gIH1cclxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcclxuICAgIHRoaXMuZGF0YSA9IHt9O1xyXG5cclxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcclxuICAgICAgdGhpcy5kYXRhW2tleV0gPSAoZGF0YT8uW2tleV0gPz8gKHRoaXMubm9kZS5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQgPz8gXCJcIikpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgdG9Kc29uKCkge1xyXG4gICAgbGV0IHJzOiBhbnkgPSB7fTtcclxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcclxuICAgICAgcnNba2V5XSA9IHRoaXMuR2V0KGtleSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcnM7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRmxvd0NvcmUge1xyXG4gIHB1YmxpYyBJZDogYW55O1xyXG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcclxuICBwdWJsaWMgZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3codGhpcyk7XHJcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xyXG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XHJcbiAgfVxyXG4gIEJpbmREYXRhRXZlbnQoKSB7XHJcbiAgICB0aGlzLmRhdGEub24odGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChgJHt0aGlzLmRhdGEuRXZlbnQuZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaCh0aGlzLmRhdGEuRXZlbnQuZGF0YUNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIHRoaXMuZGF0YS5vbih0aGlzLmRhdGEuRXZlbnQuY2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5kYXRhLkV2ZW50LmNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xyXG5cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlRmxvdzxUUGFyZW50IGV4dGVuZHMgRmxvd0NvcmU+IGV4dGVuZHMgRmxvd0NvcmUge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyZW50OiBUUGFyZW50KSB7XHJcbiAgICBzdXBlcigpO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcclxuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbnRyb2xGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4gIHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctY29udHJvbF9fbGlzdCcpIHx8IHRoaXMuZWxOb2RlO1xyXG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IFwiXCI7XHJcbiAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGFyZW50Lm9wdGlvbi5jb250cm9sKTtcclxuICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgbGV0IE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcclxuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywga2V5KTtcclxuICAgICAgICBOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIik7XHJcbiAgICAgICAgTm9kZS5pbm5lckhUTUwgPSBwYXJlbnQub3B0aW9uLmNvbnRyb2xba2V5XS5uYW1lO1xyXG4gICAgICAgIE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcclxuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcclxuICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChOb2RlKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBkcmFnZW5kKGU6IGFueSkge1xyXG4gICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGRyYWdTdGFydChlOiBhbnkpIHtcclxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XHJcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuY2xvc2VzdChcIi53b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcclxuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xyXG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eUZsb3cgZXh0ZW5kcyBCYXNlRmxvdzxXb3JrZXJGbG93PiB7XHJcbiAgcHJpdmF0ZSBsYXN0RGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogV29ya2VyRmxvdykge1xyXG4gICAgc3VwZXIocGFyZW50KTtcclxuICAgIHRoaXMuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XHJcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1wcm9wZXJ0eV9fbGlzdCcpIHx8IHRoaXMuZWxOb2RlO1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcclxuICB9XHJcbiAgcHVibGljIFByb3BlcnR5SW5mbyhkYXRhOiBEYXRhRmxvdykge1xyXG4gICAgaWYgKHRoaXMubGFzdERhdGEgJiYgdGhpcy5sYXN0RGF0YSA9PT0gZGF0YSkgcmV0dXJuO1xyXG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XHJcbiAgICB0aGlzLlJlbmRlclVJKCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgUmVuZGVyVUkoKSB7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBcIlwiO1xyXG4gICAgaWYgKHRoaXMubGFzdERhdGEpIHtcclxuICAgICAgZm9yIChsZXQgaXRlbSBvZiBPYmplY3Qua2V5cyh0aGlzLmxhc3REYXRhLm5vZGUucHJvcGVydGllcykpIHtcclxuICAgICAgICBsZXQgcHJvcGVydHlJbmZvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgcHJvcGVydHlJbmZvLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctcHJvcGVydHlfX2l0ZW0nKTtcclxuICAgICAgICBsZXQgZWxMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBlbExhYmVsLmlubmVySFRNTCA9IGl0ZW07XHJcbiAgICAgICAgbGV0IGVsSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgZWxJdGVtLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIGl0ZW0pO1xyXG4gICAgICAgIHByb3BlcnR5SW5mby5hcHBlbmRDaGlsZChlbExhYmVsKTtcclxuICAgICAgICBwcm9wZXJ0eUluZm8uYXBwZW5kQ2hpbGQoZWxJdGVtKTtcclxuICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChwcm9wZXJ0eUluZm8pO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMubGFzdERhdGE/LkJpbmRFdmVudCh0aGlzKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XHJcbmltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuZXhwb3J0IGNsYXNzIFRhYkl0ZW1GbG93IGV4dGVuZHMgQmFzZUZsb3c8VGFiRmxvdz57XHJcbiAgcHVibGljIEl0ZW1JZDogYW55O1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFRhYkZsb3csIHByaXZhdGUgZGF0YUl0ZW06IGFueSkge1xyXG4gICAgc3VwZXIocGFyZW50KTtcclxuICAgIHRoaXMuSWQgPSB0aGlzLnBhcmVudC5wYXJlbnQuZ2V0VXVpZCgpO1xyXG4gICAgdGhpcy5JdGVtSWQgPSBkYXRhSXRlbS5JZDtcclxuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1pdGVtXCIpO1xyXG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnLCB0aGlzLkl0ZW1JZCk7XHJcbiAgICBsZXQgbm9kZU5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBub2RlTmFtZS5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCAnbmFtZScpO1xyXG4gICAgbm9kZU5hbWUuaW5uZXJIVE1MID0gZGF0YUl0ZW0ubmFtZTtcclxuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG5vZGVOYW1lKTtcclxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuQ2xpY2tUYWIuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgQ2xpY2tUYWIoZTogYW55KSB7XHJcbiAgICB0aGlzLnBhcmVudC5Mb2FkUHJvamVjdEJ5SWQodGhpcy5JdGVtSWQpO1xyXG4gIH1cclxuICBwdWJsaWMgU2V0RGF0YShkYXRhSXRlbTogYW55KSB7XHJcbiAgICB0aGlzLmRhdGFJdGVtID0gZGF0YUl0ZW07XHJcbiAgfVxyXG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBib29sZWFuID0gdHJ1ZSkge1xyXG4gICAgaWYgKGZsZykge1xyXG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgdGhpcy5wYXJlbnQucGFyZW50LlZpZXc/LmxvYWQodGhpcy5kYXRhSXRlbSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcbmV4cG9ydCBjbGFzcyBUYWJGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4gIHtcclxuICBwdWJsaWMgdGFiczogVGFiSXRlbUZsb3dbXSA9IFtdO1xyXG4gIHByaXZhdGUgdGFiQWN0aXZlOiBUYWJJdGVtRmxvdyB8IHVuZGVmaW5lZDtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctaXRlbXMnKSB8fCB0aGlzLmVsTm9kZTtcclxuICAgIGlmICh0aGlzLmVsTm9kZSkge1xyXG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBMb2FkUHJvamVjdEJ5SWQocHJvamVjdElkOiBhbnkpIHtcclxuICAgIGlmICghcHJvamVjdElkKSByZXR1cm47XHJcbiAgICBsZXQgUHJvamVjdE5leHQgPSB0aGlzLnRhYnM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5JdGVtSWQgPT0gcHJvamVjdElkKT8uWzBdO1xyXG4gICAgbGV0IGRhdGFOZXh0OiBhbnkgPSB0aGlzLnBhcmVudC5tb2R1bGVzW3Byb2plY3RJZF07XHJcbiAgICBpZiAoIWRhdGFOZXh0KSByZXR1cm47XHJcbiAgICBpZiAoIVByb2plY3ROZXh0KSB7XHJcbiAgICAgIFByb2plY3ROZXh0ID0gbmV3IFRhYkl0ZW1GbG93KHRoaXMsIGRhdGFOZXh0KTtcclxuICAgICAgdGhpcy50YWJzID0gWy4uLnRoaXMudGFicywgUHJvamVjdE5leHRdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChQcm9qZWN0TmV4dCAmJiB0aGlzLnRhYkFjdGl2ZSkge1xyXG4gICAgICBpZiAodGhpcy50YWJBY3RpdmUgPT0gUHJvamVjdE5leHQpIHJldHVybjtcclxuICAgICAgdGhpcy5VcGRhdGVEYXRhKCk7XHJcbiAgICAgIHRoaXMudGFiQWN0aXZlLkFjdGl2ZShmYWxzZSk7XHJcbiAgICAgIHRoaXMudGFiQWN0aXZlID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgdGhpcy50YWJBY3RpdmUgPSBQcm9qZWN0TmV4dDtcclxuICAgIHRoaXMudGFiQWN0aXZlLlNldERhdGEoZGF0YU5leHQpO1xyXG4gICAgdGhpcy50YWJBY3RpdmUuQWN0aXZlKHRydWUpO1xyXG4gIH1cclxuICBwdWJsaWMgVXBkYXRlRGF0YSgpIHtcclxuICAgIGlmICh0aGlzLnRhYkFjdGl2ZSkge1xyXG4gICAgICB0aGlzLnBhcmVudC5tb2R1bGVzW3RoaXMudGFiQWN0aXZlLkl0ZW1JZF0gPSB0aGlzLnBhcmVudC5WaWV3Py50b0pzb24oKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIE5ld1Byb2plY3QoKSB7XHJcbiAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICBJZDogdGhpcy5wYXJlbnQuZ2V0VXVpZCgpLFxyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgbmFtZTogYHByb2plY3QtJHt0aGlzLnBhcmVudC5nZXRUaW1lKCl9YCxcclxuICAgICAgICB4OiAwLFxyXG4gICAgICAgIHk6IDAsXHJcbiAgICAgICAgem9vbTogMSxcclxuICAgICAgfSxcclxuICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcbiAgICB0aGlzLkxvYWRQcm9qZWN0KGRhdGEpO1xyXG4gIH1cclxuICBwdWJsaWMgTG9hZFByb2plY3QoZGF0YTogYW55KSB7XHJcbiAgICB0aGlzLnBhcmVudC5tb2R1bGVzW2RhdGEuSWRdID0gZGF0YTtcclxuICAgIHRoaXMuTG9hZFByb2plY3RCeUlkKGRhdGEuSWQpO1xyXG4gIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9WaWV3Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgTGluZUZsb3cge1xuICBwdWJsaWMgZWxDb25uZWN0aW9uOiBTVkdFbGVtZW50IHwgbnVsbDtcbiAgcHVibGljIGVsUGF0aDogU1ZHUGF0aEVsZW1lbnQ7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVmlld0Zsb3csIHB1YmxpYyBmcm9tTm9kZTogTm9kZUZsb3csIHB1YmxpYyB0b05vZGU6IE5vZGVGbG93IHwgbnVsbCA9IG51bGwsIHB1YmxpYyBvdXRwdXRJbmRleDogbnVtYmVyID0gMCkge1xuICAgIHRoaXMuZWxDb25uZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwic3ZnXCIpO1xuICAgIHRoaXMuZWxQYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKFwibWFpbi1wYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgJycpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uLmNsYXNzTGlzdC5hZGQoXCJjb25uZWN0aW9uXCIpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uLmFwcGVuZENoaWxkKHRoaXMuZWxQYXRoKTtcbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcz8uYXBwZW5kQ2hpbGQodGhpcy5lbENvbm5lY3Rpb24pO1xuICAgIHRoaXMuZnJvbU5vZGUuQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnRvTm9kZT8uQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LlNlbGVjdExpbmUodGhpcyk7XG4gIH1cbiAgcHJpdmF0ZSBjcmVhdGVDdXJ2YXR1cmUoc3RhcnRfcG9zX3g6IG51bWJlciwgc3RhcnRfcG9zX3k6IG51bWJlciwgZW5kX3Bvc194OiBudW1iZXIsIGVuZF9wb3NfeTogbnVtYmVyLCBjdXJ2YXR1cmVfdmFsdWU6IG51bWJlciwgdHlwZTogc3RyaW5nKSB7XG4gICAgbGV0IGxpbmVfeCA9IHN0YXJ0X3Bvc194O1xuICAgIGxldCBsaW5lX3kgPSBzdGFydF9wb3NfeTtcbiAgICBsZXQgeCA9IGVuZF9wb3NfeDtcbiAgICBsZXQgeSA9IGVuZF9wb3NfeTtcbiAgICBsZXQgY3VydmF0dXJlID0gY3VydmF0dXJlX3ZhbHVlO1xuICAgIC8vdHlwZSBvcGVuY2xvc2Ugb3BlbiBjbG9zZSBvdGhlclxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ290aGVyJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuXG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGRlbGV0ZShub2RlVGhpczogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKHRoaXMuZnJvbU5vZGUgIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLmZyb21Ob2RlLlJlbW92ZUxpbmUodGhpcyk7XG4gICAgaWYgKHRoaXMudG9Ob2RlICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50b05vZGU/LlJlbW92ZUxpbmUodGhpcyk7XG4gICAgdGhpcy5lbENvbm5lY3Rpb24/LnJlbW92ZSgpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uID0gbnVsbDtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVG8odG9feDogbnVtYmVyLCB0b195OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5mcm9tTm9kZS5lbE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xuICAgIGxldCB7IHg6IGZyb21feCwgeTogZnJvbV95IH06IGFueSA9IHRoaXMuZnJvbU5vZGUuZ2V0RG90T3V0cHV0KHRoaXMub3V0cHV0SW5kZXgpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZSgpIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG9Ob2RlICYmIHRoaXMudG9Ob2RlLmVsTm9kZSkge1xuICAgICAgbGV0IHRvX3ggPSB0aGlzLnRvTm9kZS5nZXRYKCkgLSA1O1xuICAgICAgbGV0IHRvX3kgPSB0aGlzLnRvTm9kZS5nZXRZKCkgKyB0aGlzLnRvTm9kZS5lbE5vZGUuY2xpZW50SGVpZ2h0IC8gMjtcbiAgICAgIHRoaXMudXBkYXRlVG8odG9feCwgdG9feSk7XG4gICAgfVxuXG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xyXG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XHJcbmNvbnN0IGdldmFsID0gZXZhbDtcclxuZXhwb3J0IGNsYXNzIE5vZGVGbG93IGV4dGVuZHMgQmFzZUZsb3c8Vmlld0Zsb3c+IHtcclxuICBwdWJsaWMgZWxOb2RlSW5wdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHB1YmxpYyBlbE5vZGVPdXRwdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHB1YmxpYyBlbE5vZGVDb250ZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHB1YmxpYyBnZXRZKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXRYKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXREb3RJbnB1dChpbmRleDogbnVtYmVyID0gMSkge1xyXG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZU91dHB1dHM/LnF1ZXJ5U2VsZWN0b3IoYC5kb3Rbbm9kZT1cIiR7aW5kZXh9XCJdYCk7XHJcbiAgICBpZiAoZWxEb3QpIHtcclxuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xyXG4gICAgICBsZXQgeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0ICsgZWxEb3Qub2Zmc2V0TGVmdCAtIDEwKTtcclxuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuICBwdWJsaWMgZ2V0RG90T3V0cHV0KGluZGV4OiBudW1iZXIgPSAwKSB7XHJcbiAgICBsZXQgZWxEb3Q6IGFueSA9IHRoaXMuZWxOb2RlT3V0cHV0cz8ucXVlcnlTZWxlY3RvcihgLmRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcclxuICAgIGlmIChlbERvdCkge1xyXG4gICAgICBsZXQgeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgKyBlbERvdC5vZmZzZXRUb3AgKyAxMCk7XHJcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0ICsgMTApO1xyXG5cclxuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxuICBwdWJsaWMgYXJyTGluZTogTGluZUZsb3dbXSA9IFtdO1xyXG4gIHByaXZhdGUgb3B0aW9uOiBhbnk7XHJcbiAgcHJpdmF0ZSBub2RlOiBhbnk7XHJcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVEZWZhdWx0ID0ge1xyXG4gICAgeDoge1xyXG4gICAgICBrZXk6IFwieFwiLFxyXG4gICAgICBkZWZhdWx0OiAwXHJcbiAgICB9LFxyXG4gICAgeToge1xyXG4gICAgICBrZXk6IFwieVwiLFxyXG4gICAgICBkZWZhdWx0OiAwXHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fVxyXG4gIHByaXZhdGUgZmxnU2NyaXB0OiBib29sZWFuID0gZmFsc2U7XHJcbiAgcHVibGljIHJlYWRvbmx5IEV2ZW50ID0ge1xyXG4gICAgUmVVSTogXCJSZVVJXCIsXHJcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXHJcbiAgICB1cGRhdGVQb3NpdGlvbjogXCJ1cGRhdGVQb3NpdGlvblwiLFxyXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcclxuICAgIGRhdGFDaGFuZ2U6IFwiZGF0YUNoYW5nZVwiXHJcbiAgfTtcclxuICBwdWJsaWMgc2V0T3B0aW9uKG9wdGlvbjogYW55ID0gbnVsbCwgZGF0YTogYW55ID0ge30pIHtcclxuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uIHx8IHt9O1xyXG4gICAgaWYgKCF0aGlzLm9wdGlvbi5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgIHRoaXMub3B0aW9uLnByb3BlcnRpZXMgPSB7fTtcclxuICAgIH1cclxuICAgIHRoaXMubm9kZSA9IHRoaXMub3B0aW9uLm5vZGU7XHJcbiAgICB0aGlzLklkID0gZGF0YT8uSWQgPz8gdGhpcy5wYXJlbnQucGFyZW50LmdldFV1aWQoKTtcclxuICAgIHRoaXMucHJvcGVydGllcyA9IHsgLi4udGhpcy5wcm9wZXJ0aWVEZWZhdWx0LCAuLi50aGlzLm9wdGlvbi5wcm9wZXJ0aWVzIH07XHJcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoZGF0YT8uZGF0YSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFZpZXdGbG93LCBvcHRpb246IGFueSA9IG51bGwpIHtcclxuICAgIHN1cGVyKHBhcmVudCk7XHJcbiAgICB0aGlzLnNldE9wdGlvbihvcHRpb24sIHt9KTtcclxuICAgIGlmIChvcHRpb24pIHtcclxuICAgICAgdGhpcy5SZVVJKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLm9uKHRoaXMuRXZlbnQuY2hhbmdlLCAoZTogYW55LCBzZW5kZXI6IGFueSkgPT4ge1xyXG4gICAgICB0aGlzLnBhcmVudC5kaXNwYXRjaCh0aGlzLnBhcmVudC5FdmVudC5jaGFuZ2UsIHtcclxuICAgICAgICAuLi5lLFxyXG4gICAgICAgIHRhcmdldE5vZGU6IHNlbmRlclxyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgfVxyXG4gIHB1YmxpYyB0b0pzb24oKSB7XHJcbiAgICBsZXQgTGluZUpzb24gPSB0aGlzLmFyckxpbmUuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmZyb21Ob2RlID09PSB0aGlzKS5tYXAoKGl0ZW0pID0+ICh7XHJcbiAgICAgIGZyb21Ob2RlOiBpdGVtLmZyb21Ob2RlLklkLFxyXG4gICAgICB0b05vZGU6IGl0ZW0udG9Ob2RlPy5JZCxcclxuICAgICAgb3VwdXRJbmRleDogaXRlbS5vdXRwdXRJbmRleFxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgSWQ6IHRoaXMuSWQsXHJcbiAgICAgIG5vZGU6IHRoaXMubm9kZSxcclxuICAgICAgbGluZTogTGluZUpzb24sXHJcbiAgICAgIGRhdGE6IHRoaXMuZGF0YS50b0pzb24oKSxcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XHJcbiAgICBsZXQgb3B0aW9uID0gdGhpcy5wYXJlbnQuZ2V0T3B0aW9uKGRhdGE/Lm5vZGUpO1xyXG4gICAgdGhpcy5zZXRPcHRpb24ob3B0aW9uLCBkYXRhKTtcclxuICAgIHRoaXMuUmVVSSgpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBvdXRwdXQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xyXG4gIH1cclxuICBwdWJsaWMgZGVsZXRlKGlzUmVtb3ZlUGFyZW50ID0gdHJ1ZSkge1xyXG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcclxuICAgIHRoaXMuZGF0YS5kaXNwYXRjaCh0aGlzLmRhdGEuRXZlbnQuY2hhbmdlLCB7fSk7XHJcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlKCk7XHJcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcclxuICAgIGlmIChpc1JlbW92ZVBhcmVudClcclxuICAgICAgdGhpcy5wYXJlbnQuUmVtb3ZlTm9kZSh0aGlzKTtcclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcclxuICB9XHJcbiAgcHVibGljIEFkZExpbmUobGluZTogTGluZUZsb3cpIHtcclxuICAgIHRoaXMuYXJyTGluZSA9IFsuLi50aGlzLmFyckxpbmUsIGxpbmVdO1xyXG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xyXG4gIH1cclxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lRmxvdykge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcclxuICAgIHJldHVybiB0aGlzLmFyckxpbmU7XHJcbiAgfVxyXG4gIHB1YmxpYyBSZVVJKCkge1xyXG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XHJcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLk5vZGVMZWF2ZS5iaW5kKHRoaXMpKTtcclxuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcclxuICAgIH1cclxuICAgIHRoaXMuZWxOb2RlSW5wdXRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfaW5wdXRzJyk7XHJcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImlucHV0cyBkb3RcIj48L2Rpdj5gO1xyXG4gICAgdGhpcy5lbE5vZGVDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZUNvbnRlbnQuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX2NvbnRlbnQnKTtcclxuICAgIHRoaXMuZWxOb2RlT3V0cHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9vdXRwdXRzJyk7XHJcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJvdXRwdXRzIGRvdFwiIG5vZGU9XCIwXCI+PC9kaXY+YDtcclxuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1ub2RlXCIpO1xyXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb24uY2xhc3MpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5lbE5vZGUuaWQgPSBgbm9kZS0ke3RoaXMuSWR9YDtcclxuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgdGhpcy5JZCk7XHJcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcclxuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVJbnB1dHMpO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVDb250ZW50KTtcclxuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlT3V0cHV0cyk7XHJcblxyXG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcclxuICAgIGlmICh0aGlzLmRhdGEpIHtcclxuICAgICAgbGV0IGRhdGFUZW1wID0gdGhpcy5kYXRhLnRvSnNvbigpO1xyXG4gICAgICB0aGlzLmRhdGEubG9hZChkYXRhVGVtcCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmluaXRPcHRpb24oKTtcclxuICAgIHRoaXMub24odGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsICgpID0+IHtcclxuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuUmVVSSwge30pO1xyXG4gIH1cclxuICBwdWJsaWMgY2hlY2tJbnB1dCgpIHtcclxuICAgIHJldHVybiAhKHRoaXMub3B0aW9uPy5pbnB1dCA9PT0gMCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgaW5pdE9wdGlvbigpIHtcclxuICAgIGlmICh0aGlzLmVsTm9kZUNvbnRlbnQgJiYgdGhpcy5vcHRpb24gJiYgdGhpcy5lbE5vZGVPdXRwdXRzKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlQ29udGVudC5pbm5lckhUTUwgPSB0aGlzLm9wdGlvbi5odG1sO1xyXG4gICAgICBpZiAodGhpcy5vcHRpb24ub3V0cHV0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgZm9yIChsZXQgaW5kZXg6IG51bWJlciA9IDA7IGluZGV4IDwgdGhpcy5vcHRpb24ub3V0cHV0OyBpbmRleCsrKSB7XHJcbiAgICAgICAgICBsZXQgb3V0cHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICBvdXRwdXQuc2V0QXR0cmlidXRlKCdub2RlJywgKDMwMCArIGluZGV4KS50b1N0cmluZygpKTtcclxuICAgICAgICAgIG91dHB1dC5jbGFzc0xpc3QuYWRkKFwiZG90XCIpO1xyXG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJvdXRwdXRfXCIgKyAoaW5kZXgpKTtcclxuICAgICAgICAgIHRoaXMuZWxOb2RlT3V0cHV0cz8uYXBwZW5kQ2hpbGQob3V0cHV0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbi5pbnB1dCA9PT0gMCAmJiB0aGlzLmVsTm9kZUlucHV0cykge1xyXG4gICAgICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIHNlbGYuUnVuU2NyaXB0KHNlbGYsIHNlbGYuZWxOb2RlKTtcclxuICAgIH0sIDEwMCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBSdW5TY3JpcHQoc2VsZk5vZGU6IE5vZGVGbG93LCBlbDogSFRNTEVsZW1lbnQgfCBudWxsKSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24uc2NyaXB0ICYmICF0aGlzLmZsZ1NjcmlwdCkge1xyXG4gICAgICB0aGlzLmZsZ1NjcmlwdCA9IHRydWU7XHJcbiAgICAgIGdldmFsKCcobm9kZSxlbCk9PnsnICsgdGhpcy5vcHRpb24uc2NyaXB0LnRvU3RyaW5nKCkgKyAnfScpKHNlbGZOb2RlLCBlbCk7XHJcbiAgICAgIHRoaXMuZmxnU2NyaXB0ID0gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGNoZWNrTm9kZShub2RlOiBhbnkpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbiAmJiB0aGlzLm9wdGlvbi5ub2RlID09IG5vZGU7XHJcbiAgfVxyXG4gIHB1YmxpYyBOb2RlT3ZlcihlOiBhbnkpIHtcclxuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gdGhpcztcclxuICB9XHJcbiAgcHVibGljIE5vZGVMZWF2ZShlOiBhbnkpIHtcclxuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gbnVsbDtcclxuICB9XHJcbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XHJcbiAgICB0aGlzLnBhcmVudC5TZWxlY3ROb2RlKHRoaXMpO1xyXG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnNlbGVjdGVkLCB7fSk7XHJcbiAgfVxyXG4gIHB1YmxpYyB1cGRhdGVQb3NpdGlvbih4OiBhbnksIHk6IGFueSwgaUNoZWNrID0gZmFsc2UpIHtcclxuICAgIGlmICh0aGlzLmVsTm9kZSkge1xyXG4gICAgICBpZiAoaUNoZWNrKSB7XHJcbiAgICAgICAgaWYgKHggIT09IHRoaXMuZ2V0WCgpKSB7XHJcbiAgICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSwgeCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh5ICE9PSB0aGlzLmdldFkoKSkge1xyXG4gICAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueS5rZXksIHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSwgKHRoaXMuZWxOb2RlLm9mZnNldFRvcCAtIHkpKTtcclxuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSwgKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC51cGRhdGVQb3NpdGlvbiwgeyB4OiB0aGlzLmdldFgoKSwgeTogdGhpcy5nZXRZKCkgfSk7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcclxuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XHJcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcclxuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgIGl0ZW0udXBkYXRlKCk7XHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcclxuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xyXG5pbXBvcnQgeyBMaW5lRmxvdyB9IGZyb20gXCIuL0xpbmVGbG93XCI7XHJcbmltcG9ydCB7IE5vZGVGbG93IH0gZnJvbSBcIi4vTm9kZUZsb3dcIjtcclxuXHJcbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcclxuICBOb25lID0gMCxcclxuICBOb2RlID0gMSxcclxuICBDYW52YXMgPSAyLFxyXG4gIExpbmUgPSAzLFxyXG59XHJcbmV4cG9ydCBjbGFzcyBWaWV3RmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+IHtcclxuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50O1xyXG4gIHB1YmxpYyBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XHJcbiAgcHVibGljIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XHJcbiAgcHJpdmF0ZSB6b29tX21heDogbnVtYmVyID0gMS42O1xyXG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcclxuICBwcml2YXRlIHpvb21fdmFsdWU6IG51bWJlciA9IDAuMTtcclxuICBwcml2YXRlIHpvb21fbGFzdF92YWx1ZTogbnVtYmVyID0gMTtcclxuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xyXG4gIHByaXZhdGUgcG9zX3k6IG51bWJlciA9IDA7XHJcbiAgcHJpdmF0ZSBtb3VzZV94OiBudW1iZXIgPSAwO1xyXG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcclxuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XHJcbiAgcHJpdmF0ZSBsaW5lU2VsZWN0ZWQ6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSBub2RlU2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XHJcbiAgcHVibGljIG5vZGVPdmVyOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgZG90U2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSB0ZW1wTGluZTogTGluZUZsb3cgfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIHRpbWVGYXN0Q2xpY2s6IG51bWJlciA9IDA7XHJcbiAgcHJpdmF0ZSB0YWdJbmdvcmUgPSBbJ2lucHV0JywgJ2J1dHRvbicsICdhJywgJ3RleHRhcmVhJ107XHJcbiAgcHJpdmF0ZSBnZXRYKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy54LmtleSlcclxuICB9XHJcbiAgcHJpdmF0ZSBnZXRZKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy55LmtleSlcclxuICB9XHJcbiAgcHJpdmF0ZSBnZXRab29tKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBwcm9wZXJ0aWVzID0ge1xyXG4gICAgbmFtZToge1xyXG4gICAgICBrZXk6IFwibmFtZVwiLFxyXG4gICAgfSxcclxuICAgIHpvb206IHtcclxuICAgICAga2V5OiBcInpvb21cIixcclxuICAgICAgZGVmYXVsdDogMSxcclxuICAgICAgdHlwZTogXCJudW1iZXJcIlxyXG4gICAgfSxcclxuICAgIHg6IHtcclxuICAgICAga2V5OiBcInhcIixcclxuICAgICAgZGVmYXVsdDogMCxcclxuICAgICAgdHlwZTogXCJudW1iZXJcIlxyXG4gICAgfSxcclxuICAgIHk6IHtcclxuICAgICAga2V5OiBcInlcIixcclxuICAgICAgZGVmYXVsdDogMCxcclxuICAgICAgdHlwZTogXCJudW1iZXJcIlxyXG4gICAgfVxyXG4gIH07XHJcbiAgcHVibGljIHJlYWRvbmx5IEV2ZW50ID0ge1xyXG4gICAgY2hhbmdlOiBcImNoYW5nZVwiLFxyXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcclxuICAgIHVwZGF0ZVZpZXc6IFwidXBkYXRlVmlld1wiXHJcbiAgfTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XHJcbiAgICBzdXBlcihwYXJlbnQpO1xyXG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctZGVzZ2luIC53b3JrZXJmbG93LXZpZXcnKSB8fCB0aGlzLmVsTm9kZTtcclxuICAgIHRoaXMuZWxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctY2FudmFzXCIpO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XHJcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XHJcbiAgICB0aGlzLmFkZEV2ZW50KCk7XHJcbiAgICB0aGlzLlJlc2V0KCk7XHJcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEobnVsbCwgdGhpcy5wcm9wZXJ0aWVzKTtcclxuICAgIHRoaXMub24odGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsIChpdGVtOiBhbnkpID0+IHtcclxuICAgICAgdGhpcy51cGRhdGVWaWV3KCk7XHJcbiAgICB9KTtcclxuICAgIHRoaXMudXBkYXRlVmlldygpO1xyXG4gIH1cclxuICBwdWJsaWMgZ2V0T3B0aW9uKGtleU5vZGU6IGFueSkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50LmdldE9wdGlvbihrZXlOb2RlKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBkcm9wRW5kKGV2OiBhbnkpIHtcclxuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBpZiAoT2JqZWN0LmtleXModGhpcy5wYXJlbnQubW9kdWxlcykubGVuZ3RoID09IDApIHtcclxuICAgICAgdGhpcy5wYXJlbnQubmV3KCk7XHJcbiAgICB9XHJcbiAgICBsZXQga2V5Tm9kZTogc3RyaW5nIHwgbnVsbCA9ICcnO1xyXG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xyXG4gICAgICBrZXlOb2RlID0gdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3Q7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xyXG4gICAgfVxyXG4gICAgbGV0IG9wdGlvbiA9IHRoaXMuZ2V0T3B0aW9uKGtleU5vZGUpO1xyXG4gICAgaWYgKG9wdGlvbiAmJiBvcHRpb24ub25seU5vZGUpIHtcclxuICAgICAgaWYgKHRoaXMubm9kZXMuZmlsdGVyKChpdGVtKSA9PiBpdGVtLmNoZWNrTm9kZShrZXlOb2RlKSkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgbGV0IG5vZGUgPSB0aGlzLkFkZE5vZGUob3B0aW9uKTtcclxuXHJcbiAgICBsZXQgZV9wb3NfeCA9IDA7XHJcbiAgICBsZXQgZV9wb3NfeSA9IDA7XHJcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xyXG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xyXG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XHJcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xyXG4gICAgfVxyXG4gICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xyXG4gICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xyXG5cclxuICAgIG5vZGUudXBkYXRlUG9zaXRpb24oeCwgeSk7XHJcblxyXG4gIH1cclxuICBwdWJsaWMgdG9Kc29uKCkge1xyXG4gICAgbGV0IG5vZGVzID0gdGhpcy5ub2Rlcy5tYXAoKGl0ZW0pID0+IGl0ZW0udG9Kc29uKCkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgSWQ6IHRoaXMuSWQsXHJcbiAgICAgIGRhdGE6IHRoaXMuZGF0YS50b0pzb24oKSxcclxuICAgICAgbm9kZXNcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XHJcbiAgICB0aGlzLlJlc2V0KCk7XHJcbiAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgZGF0YSA9IHt9O1xyXG4gICAgfVxyXG4gICAgaWYgKCFkYXRhLklkKSB7XHJcbiAgICAgIGRhdGEuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIWRhdGEuZGF0YSkge1xyXG4gICAgICBkYXRhLmRhdGEgPSB7fTtcclxuICAgIH1cclxuICAgIGlmICghZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0pIHtcclxuICAgICAgZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0gPSBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gO1xyXG4gICAgfVxyXG4gICAgdGhpcy5JZCA9IGRhdGEuSWQ7XHJcbiAgICB0aGlzLmRhdGEubG9hZChkYXRhLmRhdGEpO1xyXG4gICAgdGhpcy5ub2RlcyA9IChkYXRhLm5vZGVzID8/IFtdKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICByZXR1cm4gKG5ldyBOb2RlRmxvdyh0aGlzLCBcIlwiKSkubG9hZChpdGVtKTtcclxuICAgIH0pO1xyXG4gICAgKGRhdGEubm9kZXMgPz8gW10pLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAoaXRlbS5saW5lID8/IFtdKS5mb3JFYWNoKChsaW5lOiBhbnkpID0+IHtcclxuICAgICAgICBsZXQgZnJvbU5vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUuZnJvbU5vZGUpO1xyXG4gICAgICAgIGxldCB0b05vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUudG9Ob2RlKTtcclxuICAgICAgICBsZXQgb3VwdXRJbmRleCA9IGxpbmUub3VwdXRJbmRleCA/PyAwO1xyXG4gICAgICAgIGlmIChmcm9tTm9kZSAmJiB0b05vZGUpIHtcclxuICAgICAgICAgIHRoaXMuQWRkTGluZShmcm9tTm9kZSwgdG9Ob2RlLCBvdXB1dEluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICAgIHRoaXMudXBkYXRlVmlldygpO1xyXG4gIH1cclxuICBwdWJsaWMgUmVzZXQoKSB7XHJcbiAgICB0aGlzLm5vZGVzLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy54LmtleSwgMCk7XHJcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy55LmtleSwgMCk7XHJcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcclxuICB9XHJcbiAgcHVibGljIGdldE5vZGVCeUlkKG5vZGVJZDogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLklkID09IG5vZGVJZClbMF07XHJcbiAgfVxyXG4gIHB1YmxpYyB1cGRhdGVWaWV3KCkge1xyXG4gICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHRoaXMuZ2V0WCgpICsgXCJweCwgXCIgKyB0aGlzLmdldFkoKSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy5nZXRab29tKCkgKyBcIilcIjtcclxuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC51cGRhdGVWaWV3LCB7IHg6IHRoaXMuZ2V0WCgpLCB5OiB0aGlzLmdldFkoKSwgem9vbTogdGhpcy5nZXRab29tKCkgfSk7XHJcbiAgfVxyXG4gIHByaXZhdGUgQ2FsY1gobnVtYmVyOiBhbnkpIHtcclxuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRXaWR0aCAvICh0aGlzLmVsTm9kZT8uY2xpZW50V2lkdGggKiB0aGlzLmdldFpvb20oKSkpO1xyXG4gIH1cclxuICBwcml2YXRlIENhbGNZKG51bWJlcjogYW55KSB7XHJcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxOb2RlPy5jbGllbnRIZWlnaHQgKiB0aGlzLmdldFpvb20oKSkpO1xyXG4gIH1cclxuICBwcml2YXRlIGRyYWdvdmVyKGU6IGFueSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH1cclxuICBwdWJsaWMgVW5TZWxlY3RMaW5lKCkge1xyXG4gICAgdGhpcy5TZWxlY3RMaW5lKG51bGwpO1xyXG4gIH1cclxuICBwdWJsaWMgVW5TZWxlY3REb3QoKSB7XHJcbiAgICB0aGlzLlNlbGVjdERvdChudWxsKTtcclxuICB9XHJcbiAgcHVibGljIFVuU2VsZWN0Tm9kZSgpIHtcclxuICAgIHRoaXMuU2VsZWN0Tm9kZShudWxsKTtcclxuICB9XHJcbiAgcHVibGljIFVuU2VsZWN0KCkge1xyXG4gICAgdGhpcy5VblNlbGVjdExpbmUoKTtcclxuICAgIHRoaXMuVW5TZWxlY3ROb2RlKCk7XHJcbiAgICB0aGlzLlVuU2VsZWN0RG90KCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBTZWxlY3RMaW5lKG5vZGU6IExpbmVGbG93IHwgbnVsbCkge1xyXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQpIHtcclxuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZC5lbFBhdGg/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5VblNlbGVjdCgpO1xyXG4gICAgICB0aGlzLmxpbmVTZWxlY3RlZCA9IG5vZGU7XHJcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4gIHByaXZhdGUgZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xyXG4gIHB1YmxpYyBTZWxlY3ROb2RlKG5vZGU6IE5vZGVGbG93IHwgbnVsbCkge1xyXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQpIHtcclxuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIXRoaXMuZmxnU2VsZWN0Tm9kZSlcclxuICAgICAgICB0aGlzLnBhcmVudC5Qcm9wZXJ0eUluZm8odGhpcy5kYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZmxnU2VsZWN0Tm9kZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuVW5TZWxlY3QoKTtcclxuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBub2RlO1xyXG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgICB0aGlzLnBhcmVudC5Qcm9wZXJ0eUluZm8odGhpcy5ub2RlU2VsZWN0ZWQuZGF0YSk7XHJcbiAgICAgIHRoaXMuZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgU2VsZWN0RG90KG5vZGU6IE5vZGVGbG93IHwgbnVsbCkge1xyXG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xyXG4gICAgICBpZiAodGhpcy5kb3RTZWxlY3RlZCkge1xyXG4gICAgICAgIHRoaXMuZG90U2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuICAgICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5VblNlbGVjdCgpO1xyXG4gICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbm9kZTtcclxuICAgICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlRmxvdykge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMubm9kZXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBBZGROb2RlKG9wdGlvbjogYW55ID0gbnVsbCk6IE5vZGVGbG93IHtcclxuICAgIGxldCBub2RlID0gbmV3IE5vZGVGbG93KHRoaXMsIG9wdGlvbik7XHJcbiAgICB0aGlzLm5vZGVzID0gWy4uLnRoaXMubm9kZXMsIG5vZGVdO1xyXG4gICAgcmV0dXJuIG5vZGU7XHJcbiAgfVxyXG4gIHB1YmxpYyBBZGRMaW5lKGZyb21Ob2RlOiBOb2RlRmxvdywgdG9Ob2RlOiBOb2RlRmxvdywgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcclxuICAgIGlmIChmcm9tTm9kZSA9PSB0b05vZGUpIHJldHVybjtcclxuICAgIGlmIChmcm9tTm9kZS5hcnJMaW5lLmZpbHRlcigoaXRlbSkgPT4ge1xyXG4gICAgICByZXR1cm4gaXRlbS50b05vZGUgPT09IHRvTm9kZSAmJiBpdGVtLm91dHB1dEluZGV4ID09IG91dHB1dEluZGV4ICYmIGl0ZW0gIT0gdGhpcy50ZW1wTGluZTtcclxuICAgIH0pLmxlbmd0aCA+IDApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBMaW5lRmxvdyh0aGlzLCBmcm9tTm9kZSwgdG9Ob2RlLCBvdXRwdXRJbmRleCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBhZGRFdmVudCgpIHtcclxuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXHJcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIC8qIENvbnRleHQgTWVudSAqL1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvKiBEcm9wIERyYXAgKi9cclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5kcm9wRW5kLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5kcmFnb3Zlci5iaW5kKHRoaXMpKTtcclxuICAgIC8qIFpvb20gTW91c2UgKi9cclxuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuem9vbV9lbnRlci5iaW5kKHRoaXMpKTtcclxuICAgIC8qIERlbGV0ZSAqL1xyXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWRvd24uYmluZCh0aGlzKSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBrZXlkb3duKGU6IGFueSkge1xyXG4gICAgaWYgKGUua2V5ID09PSAnRGVsZXRlJyB8fCAoZS5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGUubWV0YUtleSkpIHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQuZGVsZXRlKCk7XHJcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLmxpbmVTZWxlY3RlZCAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZGVsZXRlKCk7XHJcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyB6b29tX2VudGVyKGV2ZW50OiBhbnkpIHtcclxuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuICAgICAgaWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcclxuICAgICAgICAvLyBab29tIE91dFxyXG4gICAgICAgIHRoaXMuem9vbV9vdXQoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBab29tIEluXHJcbiAgICAgICAgdGhpcy56b29tX2luKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIHpvb21fcmVmcmVzaCgpIHtcclxuICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLngua2V5LCAodGhpcy5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0aGlzLmdldFpvb20oKSk7XHJcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy55LmtleSwgKHRoaXMuZ2V0WSgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGhpcy5nZXRab29tKCkpO1xyXG4gICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0aGlzLmdldFpvb20oKTtcclxuICAgIHRoaXMudXBkYXRlVmlldygpO1xyXG4gIH1cclxuICBwdWJsaWMgem9vbV9pbigpIHtcclxuICAgIGlmICh0aGlzLmdldFpvb20oKSA8IHRoaXMuem9vbV9tYXgpIHtcclxuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuem9vbS5rZXksICh0aGlzLmdldFpvb20oKSArIHRoaXMuem9vbV92YWx1ZSkpO1xyXG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgem9vbV9vdXQoKSB7XHJcbiAgICBpZiAodGhpcy5nZXRab29tKCkgPiB0aGlzLnpvb21fbWluKSB7XHJcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnpvb20ua2V5LCAodGhpcy5nZXRab29tKCkgLSB0aGlzLnpvb21fdmFsdWUpKTtcclxuICAgICAgdGhpcy56b29tX3JlZnJlc2goKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIHpvb21fcmVzZXQoKSB7XHJcbiAgICBpZiAodGhpcy5nZXRab29tKCkgIT0gMSkge1xyXG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSwgdGhpcy5wcm9wZXJ0aWVzLnpvb20uZGVmYXVsdCk7XHJcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgU3RhcnRNb3ZlKGU6IGFueSkge1xyXG4gICAgaWYgKHRoaXMudGFnSW5nb3JlLmluY2x1ZGVzKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gdGhpcy5wYXJlbnQuZ2V0VGltZSgpO1xyXG4gICAgaWYgKGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWFpbi1wYXRoJykpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTm9uZSkge1xyXG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgJiYgdGhpcy5wYXJlbnQuY2hlY2tQYXJlbnQoZS50YXJnZXQsIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZSkpIHtcclxuICAgICAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdkb3QnKSkge1xyXG4gICAgICAgICAgaWYgKHRoaXMucGFyZW50LmNoZWNrUGFyZW50KGUudGFyZ2V0LCB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGVJbnB1dHMpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xyXG4gICAgICAgICAgdGhpcy50ZW1wTGluZSA9IG5ldyBMaW5lRmxvdyh0aGlzLCB0aGlzLm5vZGVTZWxlY3RlZCwgbnVsbCk7XHJcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lLm91dHB1dEluZGV4ID0gKyhlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuQ2FudmFzO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xyXG4gICAgICB0aGlzLnBvc194ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XHJcbiAgICAgIHRoaXMucG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMucG9zX3ggPSBlLmNsaWVudFg7XHJcbiAgICAgIHRoaXMucG9zX3kgPSBlLmNsaWVudFk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xyXG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XHJcbiAgfVxyXG4gIHB1YmxpYyBNb3ZlKGU6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcclxuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XHJcbiAgICBsZXQgZV9wb3NfeCA9IDA7XHJcbiAgICBsZXQgZV9wb3NfeSA9IDA7XHJcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XHJcbiAgICAgIGVfcG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcclxuICAgICAgZV9wb3NfeSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcclxuICAgICAgZV9wb3NfeSA9IGUuY2xpZW50WTtcclxuICAgIH1cclxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xyXG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcclxuICAgICAgICB7XHJcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuZ2V0WCgpICsgdGhpcy5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcclxuICAgICAgICAgIGxldCB5ID0gdGhpcy5nZXRZKCkgKyB0aGlzLkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxyXG4gICAgICAgICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHggKyBcInB4LCBcIiArIHkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuZ2V0Wm9vbSgpICsgXCIpXCI7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcclxuICAgICAgICB7XHJcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xyXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcclxuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xyXG4gICAgICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XHJcbiAgICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZD8udXBkYXRlUG9zaXRpb24oeCwgeSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xyXG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XHJcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcclxuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLmVsQ2FudmFzLm9mZnNldExlZnQgLSB4LCB0aGlzLmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xyXG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnRvTm9kZSA9IHRoaXMubm9kZU92ZXI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xyXG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xyXG4gICAgICB0aGlzLm1vdXNlX3kgPSBlX3Bvc195O1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgRW5kTW92ZShlOiBhbnkpIHtcclxuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XHJcbiAgICAvL2ZpeCBGYXN0IENsaWNrXHJcbiAgICBpZiAoKCh0aGlzLnBhcmVudC5nZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMzAwKSB8fCAhdGhpcy5mbGdNb3ZlKSB7XHJcbiAgICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMgJiYgdGhpcy5mbGdEcmFwKVxyXG4gICAgICAgIHRoaXMuVW5TZWxlY3QoKTtcclxuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XHJcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xyXG4gICAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMudGVtcExpbmUgJiYgdGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5MaW5lKSB7XHJcbiAgICAgIGlmICh0aGlzLnRlbXBMaW5lLnRvTm9kZSAmJiB0aGlzLnRlbXBMaW5lLnRvTm9kZS5jaGVja0lucHV0KCkpIHtcclxuICAgICAgICB0aGlzLkFkZExpbmUodGhpcy50ZW1wTGluZS5mcm9tTm9kZSwgdGhpcy50ZW1wTGluZS50b05vZGUsIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXgpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMudGVtcExpbmUuZGVsZXRlKCk7XHJcbiAgICAgIHRoaXMudGVtcExpbmUgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xyXG4gICAgbGV0IGVfcG9zX3kgPSAwO1xyXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XHJcbiAgICAgIGVfcG9zX3ggPSB0aGlzLm1vdXNlX3g7XHJcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlX3Bvc194ID0gZS5jbGllbnRYO1xyXG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT09IE1vdmVUeXBlLkNhbnZhcykge1xyXG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy54LmtleSwgdGhpcy5nZXRYKCkgKyB0aGlzLkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKSk7XHJcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnkua2V5LCB0aGlzLmdldFkoKSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpKTtcclxuICAgIH1cclxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xyXG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XHJcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcclxuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xyXG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb250ZXh0bWVudShlOiBhbnkpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRmxvd0NvcmUgfSBmcm9tIFwiLi9jb3JlL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IENvbnRyb2xGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9Db250cm9sRmxvd1wiO1xyXG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL2NvcmUvRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgUHJvcGVydHlGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9Qcm9wZXJ0eUZsb3dcIjtcclxuaW1wb3J0IHsgVGFiRmxvdywgVGFiSXRlbUZsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL1RhYkZsb3dcIjtcclxuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL1ZpZXdGbG93XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgV29ya2VyRmxvdyBleHRlbmRzIEZsb3dDb3JlIHtcclxuXHJcbiAgcHVibGljIFZpZXc6IFZpZXdGbG93IHwgbnVsbDtcclxuICBwdWJsaWMgQ29udHJvbDogQ29udHJvbEZsb3cgfCBudWxsO1xyXG4gIHB1YmxpYyBQcm9wZXJ0eTogUHJvcGVydHlGbG93IHwgbnVsbDtcclxuICBwdWJsaWMgVGFiOiBUYWJGbG93IHwgbnVsbDtcclxuICBwdWJsaWMgbW9kdWxlczogYW55ID0ge307XHJcbiAgcHVibGljIGRhdGFOb2RlU2VsZWN0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICBwdWJsaWMgb3B0aW9uOiBhbnk7XHJcblxyXG4gIHB1YmxpYyBjaGVja1BhcmVudChub2RlOiBhbnksIG5vZGVDaGVjazogYW55KSB7XHJcbiAgICBpZiAobm9kZSAmJiBub2RlQ2hlY2spIHtcclxuICAgICAgaWYgKG5vZGUgPT0gbm9kZUNoZWNrKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgbGV0IHBhcmVudDogYW55ID0gbm9kZTtcclxuICAgICAgd2hpbGUgKChwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudCkgIT0gbnVsbCkge1xyXG4gICAgICAgIGlmIChub2RlQ2hlY2sgPT0gcGFyZW50KSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG9wdGlvbjogYW55ID0gbnVsbCkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMuZWxOb2RlID0gY29udGFpbmVyO1xyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3dcIik7XHJcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbiB8fCB7XHJcbiAgICAgIGNvbnRyb2w6IHt9XHJcbiAgICB9O1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxyXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbFwiPlxyXG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2hlYWRlclwiPk5vZGUgQ29udHJvbDwvaDI+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2xpc3RcIj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWRlc2dpblwiPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1pdGVtc1wiPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctdmlld1wiPlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctcHJvcGVydHlcIj5cclxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1wcm9wZXJ0eV9faGVhZGVyXCI+UHJvcGVydGllczwvaDI+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXByb3BlcnR5X19saXN0XCI+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8aDIgY2xhc3M9XCJ3b3JrZXJmbG93LXByb3BlcnR5X19oZWFkZXJcIj5Qcm9qZWN0PC9oMj5cclxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctcHJvcGVydHlfX2xpc3RcIj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICAgIGA7XHJcbiAgICB0aGlzLlZpZXcgPSBuZXcgVmlld0Zsb3codGhpcyk7XHJcbiAgICB0aGlzLlRhYiA9IG5ldyBUYWJGbG93KHRoaXMpO1xyXG4gICAgdGhpcy5Db250cm9sID0gbmV3IENvbnRyb2xGbG93KHRoaXMpO1xyXG4gICAgdGhpcy5Qcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eUZsb3codGhpcyk7XHJcbiAgfVxyXG4gIHB1YmxpYyBuZXcoKSB7XHJcbiAgICB0aGlzLlRhYj8uTmV3UHJvamVjdCgpO1xyXG4gIH1cclxuICBwdWJsaWMgb3BlblByb2plY3QobW9kdWVsczogYW55KSB7XHJcbiAgICB0aGlzLm1vZHVsZXMgPSBtb2R1ZWxzO1xyXG4gICAgbGV0IGtleSA9IE9iamVjdC5rZXlzKHRoaXMubW9kdWxlcylbMF07XHJcbiAgICBpZiAoa2V5KSB7XHJcbiAgICAgIHRoaXMubG9hZCh0aGlzLm1vZHVsZXNba2V5XSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcclxuICAgIHRoaXMuVGFiPy5Mb2FkUHJvamVjdChkYXRhKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBQcm9wZXJ0eUluZm8oZGF0YTogRGF0YUZsb3cpIHtcclxuICAgIHRoaXMuUHJvcGVydHk/LlByb3BlcnR5SW5mbyhkYXRhKTtcclxuICB9XHJcbiAgcHVibGljIGdldE9wdGlvbihrZXlOb2RlOiBhbnkpIHtcclxuICAgIGlmICgha2V5Tm9kZSkgcmV0dXJuO1xyXG4gICAgbGV0IGNvbnRyb2wgPSB0aGlzLm9wdGlvbi5jb250cm9sW2tleU5vZGVdO1xyXG4gICAgaWYgKCFjb250cm9sKSB7XHJcbiAgICAgIGNvbnRyb2wgPSBPYmplY3QudmFsdWVzKHRoaXMub3B0aW9uLmNvbnRyb2wpWzBdO1xyXG4gICAgfVxyXG4gICAgY29udHJvbC5ub2RlID0ga2V5Tm9kZTtcclxuICAgIHJldHVybiBjb250cm9sO1xyXG4gIH1cclxuICBwdWJsaWMgdG9Kc29uKCkge1xyXG4gICAgdGhpcy5UYWI/LlVwZGF0ZURhdGEoKTtcclxuICAgIHJldHVybiB0aGlzLm1vZHVsZXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICB9XHJcbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcclxuICAgIC8vIGh0dHA6Ly93d3cuaWV0Zi5vcmcvcmZjL3JmYzQxMjIudHh0XHJcbiAgICBsZXQgczogYW55ID0gW107XHJcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM2OyBpKyspIHtcclxuICAgICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xyXG4gICAgfVxyXG4gICAgc1sxNF0gPSBcIjRcIjsgIC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxyXG4gICAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcclxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcclxuXHJcbiAgICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcclxuICAgIHJldHVybiB1dWlkO1xyXG4gIH1cclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7VUFFYSxTQUFTLENBQUE7UUFDWixNQUFNLEdBQVEsRUFBRSxDQUFDO0lBQ3pCLElBQUEsV0FBQSxHQUFBO1NBRUM7UUFDTSxNQUFNLENBQUMsS0FBYSxFQUFFLFFBQWEsRUFBQTtJQUN4QyxRQUFBLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3JDLFFBQUEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDMUI7O1FBRU0sRUFBRSxDQUFDLEtBQWEsRUFBRSxRQUFhLEVBQUE7O0lBRXBDLFFBQUEsSUFBSSxPQUFPLFFBQVEsS0FBSyxVQUFVLEVBQUU7Z0JBQ2xDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQSw0REFBQSxFQUErRCxPQUFPLFFBQVEsQ0FBQSxDQUFFLENBQUMsQ0FBQztJQUNoRyxZQUFBLE9BQU8sS0FBSyxDQUFDO0lBQ2QsU0FBQTs7SUFFRCxRQUFBLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO2dCQUM3QixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUEsbURBQUEsRUFBc0QsT0FBTyxLQUFLLENBQUEsQ0FBRSxDQUFDLENBQUM7SUFDcEYsWUFBQSxPQUFPLEtBQUssQ0FBQztJQUNkLFNBQUE7O1lBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLFNBQVMsRUFBRTtJQUNwQyxZQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUc7SUFDbkIsZ0JBQUEsU0FBUyxFQUFFLEVBQUU7aUJBQ2QsQ0FBQTtJQUNGLFNBQUE7SUFDRCxRQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FB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
