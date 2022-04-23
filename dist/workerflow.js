
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

    return WorkerFlow;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbXBvbmVudHMvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0NvbnRyb2xGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvUHJvcGVydHlGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVGFiRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0xpbmVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvTm9kZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9WaWV3Rmxvdy50cyIsIi4uL3NyYy9Xb3JrZXJGbG93LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZsb3dDb3JlIH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcbiAgcHJpdmF0ZSBkYXRhOiBhbnkgPSB7fTtcbiAgcHVibGljIG5vZGVzOiBGbG93Q29yZVtdID0gW107XG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCJcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIG5vZGU6IEZsb3dDb3JlKSB7XG4gIH1cbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IC0xKSB7XG4gICAgICB0aGlzLm5vZGUucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubm9kZXMgPSBbdGhpcy5ub2RlXTtcbiAgICB0aGlzLmxvYWQoZGF0YSk7XG4gICAgdGhpcy5CaW5kRXZlbnQodGhpcy5ub2RlKTtcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gIH1cbiAgcHVibGljIFJlbW92ZUV2ZW50QWxsKCkge1xuICAgIGZvciAobGV0IG5vZGUgb2YgdGhpcy5ub2Rlcykge1xuICAgICAgbm9kZS5lbE5vZGUucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsXWApLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgaXRlbS5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuY2hhbmdlSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVFdmVudChub2RlOiBGbG93Q29yZSkge1xuICAgIGxldCBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5ub2Rlc1tpbmRleF0uZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbF1gKS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGl0ZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmNoYW5nZUlucHV0LmJpbmQodGhpcykpO1xuICAgICAgfSk7XG4gICAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5jaGFuZ2VJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgQmluZEV2ZW50KG5vZGU6IEZsb3dDb3JlKSB7XG4gICAgdGhpcy5SZW1vdmVFdmVudChub2RlKTtcbiAgICB0aGlzLm5vZGVzID0gWy4uLnRoaXMubm9kZXMsIG5vZGVdO1xuICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbF1gKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGlmIChpdGVtLnRhZ05hbWUgPT0gJ1NQQU4nIHx8IGl0ZW0udGFnTmFtZSA9PSAnRElWJykge1xuICAgICAgICBpdGVtLmlubmVySFRNTCA9IGAke3RoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbS52YWx1ZSA9IHRoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuY2hhbmdlSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgfSk7XG4gIH1cbiAgcHJpdmF0ZSBTZXRWYWx1ZShrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgZWxVcGRhdGUgPSBudWxsKSB7XG4gICAgaWYgKHRoaXMubm9kZXMuaW5kZXhPZih0aGlzLm5vZGUpID09IC0xKSB7XG4gICAgICB0aGlzLm5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbD1cIiR7a2V5fVwiXWApLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICBpZiAoaXRlbSAhPSBlbFVwZGF0ZSkge1xuICAgICAgICAgIGlmIChpdGVtLnRhZ05hbWUgPT0gJ1NQQU4nIHx8IGl0ZW0udGFnTmFtZSA9PSAnRElWJykge1xuICAgICAgICAgICAgaXRlbS5pbm5lckhUTUwgPSBgJHt2YWx1ZX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpdGVtLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMubm9kZS5kaXNwYXRjaCh0aGlzLkV2ZW50LmRhdGFDaGFuZ2UsIHsga2V5LCB2YWx1ZSwgZWxVcGRhdGUgfSk7XG4gICAgICB0aGlzLm5vZGUuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHsga2V5LCB2YWx1ZSwgZWxVcGRhdGUgfSk7XG4gICAgfVxuICAgIGZvciAobGV0IG5vZGUgb2YgdGhpcy5ub2Rlcykge1xuICAgICAgbm9kZS5lbE5vZGUucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsPVwiJHtrZXl9XCJdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGlmIChpdGVtICE9IGVsVXBkYXRlKSB7XG4gICAgICAgICAgaWYgKGl0ZW0udGFnTmFtZSA9PSAnU1BBTicgfHwgaXRlbS50YWdOYW1lID09ICdESVYnKSB7XG4gICAgICAgICAgICBpdGVtLmlubmVySFRNTCA9IGAke3ZhbHVlfWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGl0ZW0udmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbm9kZS5kaXNwYXRjaCh0aGlzLkV2ZW50LmRhdGFDaGFuZ2UsIHsga2V5LCB2YWx1ZSwgZWxVcGRhdGUgfSk7XG4gICAgICBub2RlLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7IGtleSwgdmFsdWUsIGVsVXBkYXRlIH0pO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgU2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55LCBlbFVwZGF0ZSA9IG51bGwpIHtcbiAgICB0aGlzLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5TZXRWYWx1ZShrZXksIHZhbHVlLCBlbFVwZGF0ZSk7XG4gICAgfSwgMTAwKTtcbiAgfVxuICBwdWJsaWMgR2V0KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xuICB9XG4gIHB1YmxpYyBjaGFuZ2VJbnB1dChlOiBhbnkpIHtcbiAgICB0aGlzLlNldChlLnRhcmdldC5nZXRBdHRyaWJ1dGUoYG5vZGU6bW9kZWxgKSwgZS50YXJnZXQudmFsdWUsIGUudGFyZ2V0KTtcbiAgfVxuXG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGZvciAobGV0IG5vZGUgb2YgdGhpcy5ub2Rlcykge1xuICAgICAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGl0ZW0udGFnTmFtZSA9PSAnU1BBTicgfHwgaXRlbS50YWdOYW1lID09ICdESVYnKSB7XG4gICAgICAgICAgICBpdGVtLmlubmVySFRNTCA9IGAke3RoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpdGVtLnZhbHVlID0gdGhpcy5kYXRhW2l0ZW0uZ2V0QXR0cmlidXRlKGBub2RlOm1vZGVsYCldO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSwgMTAwKTtcbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEgPSB7fTtcblxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcbiAgICAgIHRoaXMuZGF0YVtrZXldID0gKGRhdGE/LltrZXldID8/ICh0aGlzLm5vZGUucHJvcGVydGllc1trZXldPy5kZWZhdWx0ID8/IFwiXCIpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgcnM6IGFueSA9IHt9O1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcbiAgICAgIHJzW2tleV0gPSB0aGlzLkdldChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gcnM7XG4gIH1cbn1cbiIsImltcG9ydCB7IEZsb3dDb3JlIH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50RmxvdyB7XG4gIHByaXZhdGUgZXZlbnRzOiBhbnkgPSB7fTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBGbG93Q29yZSkge1xuXG4gIH1cbiAgLyogRXZlbnRzICovXG4gIHB1YmxpYyBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcbiAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xuICAgICAgICBsaXN0ZW5lcnM6IFtdXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuXG4gICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZVxuXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVyc1xuICAgIGNvbnN0IGxpc3RlbmVySW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcbiAgICBjb25zdCBoYXNMaXN0ZW5lciA9IGxpc3RlbmVySW5kZXggPiAtMVxuICAgIGlmIChoYXNMaXN0ZW5lcikgbGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKVxuICB9XG5cbiAgcHVibGljIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIGxldCBzZWxmID0gdGhpcy5wYXJlbnQ7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBjb25zb2xlLmVycm9yKGBUaGlzIGV2ZW50OiAke2V2ZW50fSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMsIHNlbGYpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIEZsb3dDb3JlIHtcbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgcHVibGljIElkOiBhbnk7XG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KHRoaXMpO1xuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50Rmxvdyh0aGlzKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQmFzZUZsb3c8VFBhcmVudD4gZXh0ZW5kcyBGbG93Q29yZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyZW50OiBUUGFyZW50KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sRmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+ICB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFdvcmtlckZsb3cpIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMuZWxOb2RlID0gdGhpcy5wYXJlbnQuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWNvbnRyb2xfX2xpc3QnKSB8fCB0aGlzLmVsTm9kZTtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHBhcmVudC5vcHRpb24uY29udHJvbCk7XG4gICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgbGV0IE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgTm9kZS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICAgIE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBrZXkpO1xuICAgICAgICBOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIik7XG4gICAgICAgIE5vZGUuaW5uZXJIVE1MID0gcGFyZW50Lm9wdGlvbi5jb250cm9sW2tleV0ubmFtZTtcbiAgICAgICAgTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLmRyYWdTdGFydC5iaW5kKHRoaXMpKVxuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoTm9kZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGRyYWdlbmQoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBudWxsO1xuICB9XG5cbiAgcHVibGljIGRyYWdTdGFydChlOiBhbnkpIHtcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBlLnRhcmdldC5jbG9zZXN0KFwiLndvcmtlcmZsb3ctY29udHJvbF9faXRlbVwiKS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJyk7XG4gICAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKFwibm9kZVwiLCBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgUHJvcGVydHlGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4ge1xuICBwcml2YXRlIGxhc3REYXRhOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogV29ya2VyRmxvdykge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5JZCA9IHRoaXMucGFyZW50LmdldFV1aWQoKTtcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1wcm9wZXJ0eV9fbGlzdCcpIHx8IHRoaXMuZWxOb2RlO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gIH1cbiAgcHVibGljIFByb3BlcnR5SW5mbyhkYXRhOiBEYXRhRmxvdykge1xuICAgIGlmICh0aGlzLmxhc3REYXRhICYmIHRoaXMubGFzdERhdGEgPT09IGRhdGEpIHJldHVybjtcbiAgICBpZiAodGhpcy5sYXN0RGF0YSkge1xuICAgICAgdGhpcy5sYXN0RGF0YS5SZW1vdmVFdmVudCh0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHByaXZhdGUgUmVuZGVyVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBpZiAodGhpcy5sYXN0RGF0YSkge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBPYmplY3Qua2V5cyh0aGlzLmxhc3REYXRhLm5vZGUucHJvcGVydGllcykpIHtcbiAgICAgICAgbGV0IHByb3BlcnR5SW5mbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBwcm9wZXJ0eUluZm8uY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1wcm9wZXJ0eV9faXRlbScpO1xuICAgICAgICBsZXQgZWxMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgZWxMYWJlbC5pbm5lckhUTUwgPSBpdGVtO1xuICAgICAgICBsZXQgZWxJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgZWxJdGVtLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIGl0ZW0pO1xuICAgICAgICBwcm9wZXJ0eUluZm8uYXBwZW5kQ2hpbGQoZWxMYWJlbCk7XG4gICAgICAgIHByb3BlcnR5SW5mby5hcHBlbmRDaGlsZChlbEl0ZW0pO1xuICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChwcm9wZXJ0eUluZm8pO1xuICAgICAgfVxuICAgICAgdGhpcy5sYXN0RGF0YT8uQmluZEV2ZW50KHRoaXMpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5leHBvcnQgY2xhc3MgVGFiSXRlbUZsb3cgZXh0ZW5kcyBCYXNlRmxvdzxUYWJGbG93PntcbiAgcHVibGljIEl0ZW1JZDogYW55O1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBUYWJGbG93LCBwcml2YXRlIGRhdGFJdGVtOiBhbnkpIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMuSWQgPSB0aGlzLnBhcmVudC5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIHRoaXMuSXRlbUlkID0gZGF0YUl0ZW0uSWQ7XG4gICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1pdGVtXCIpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0JywgdGhpcy5JdGVtSWQpO1xuICAgIGxldCBub2RlTmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBub2RlTmFtZS5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCAnbmFtZScpO1xuICAgIG5vZGVOYW1lLmlubmVySFRNTCA9IGRhdGFJdGVtLm5hbWU7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQobm9kZU5hbWUpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLkNsaWNrVGFiLmJpbmQodGhpcykpO1xuICB9XG4gIHByaXZhdGUgQ2xpY2tUYWIoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQuTG9hZFByb2plY3RCeUlkKHRoaXMuSXRlbUlkKTtcbiAgfVxuICBwdWJsaWMgU2V0RGF0YShkYXRhSXRlbTogYW55KSB7XG4gICAgdGhpcy5kYXRhSXRlbSA9IGRhdGFJdGVtO1xuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5wYXJlbnQucGFyZW50LlZpZXc/LmxvYWQodGhpcy5kYXRhSXRlbSk7XG4gICAgICB0aGlzLnBhcmVudC5wYXJlbnQuVmlldz8uZGF0YS5CaW5kRXZlbnQodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgdGhpcy5wYXJlbnQucGFyZW50LlZpZXc/LmRhdGEuUmVtb3ZlRXZlbnQodGhpcyk7XG4gICAgfVxuICB9XG5cbn1cbmV4cG9ydCBjbGFzcyBUYWJGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4gIHtcbiAgcHVibGljIHRhYnM6IFRhYkl0ZW1GbG93W10gPSBbXTtcbiAgcHJpdmF0ZSB0YWJBY3RpdmU6IFRhYkl0ZW1GbG93IHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1pdGVtcycpIHx8IHRoaXMuZWxOb2RlO1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIExvYWRQcm9qZWN0QnlJZChwcm9qZWN0SWQ6IGFueSkge1xuICAgIGlmICghcHJvamVjdElkKSByZXR1cm47XG4gICAgbGV0IFByb2plY3ROZXh0ID0gdGhpcy50YWJzPy5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uSXRlbUlkID09IHByb2plY3RJZCk/LlswXTtcbiAgICBsZXQgZGF0YU5leHQ6IGFueSA9IHRoaXMucGFyZW50Lm1vZHVsZXNbcHJvamVjdElkXTtcbiAgICBpZiAoIWRhdGFOZXh0KSByZXR1cm47XG4gICAgaWYgKCFQcm9qZWN0TmV4dCkge1xuICAgICAgUHJvamVjdE5leHQgPSBuZXcgVGFiSXRlbUZsb3codGhpcywgZGF0YU5leHQpO1xuICAgICAgdGhpcy50YWJzID0gWy4uLnRoaXMudGFicywgUHJvamVjdE5leHRdO1xuICAgIH1cblxuICAgIGlmIChQcm9qZWN0TmV4dCAmJiB0aGlzLnRhYkFjdGl2ZSkge1xuICAgICAgaWYgKHRoaXMudGFiQWN0aXZlID09IFByb2plY3ROZXh0KSByZXR1cm47XG4gICAgICB0aGlzLlVwZGF0ZURhdGEoKTtcbiAgICAgIHRoaXMudGFiQWN0aXZlLkFjdGl2ZShmYWxzZSk7XG4gICAgICB0aGlzLnRhYkFjdGl2ZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy50YWJBY3RpdmUgPSBQcm9qZWN0TmV4dDtcbiAgICB0aGlzLnRhYkFjdGl2ZS5TZXREYXRhKGRhdGFOZXh0KTtcbiAgICB0aGlzLnRhYkFjdGl2ZS5BY3RpdmUodHJ1ZSk7XG4gIH1cbiAgcHVibGljIFVwZGF0ZURhdGEoKSB7XG4gICAgaWYgKHRoaXMudGFiQWN0aXZlKSB7XG4gICAgICB0aGlzLnBhcmVudC5tb2R1bGVzW3RoaXMudGFiQWN0aXZlLkl0ZW1JZF0gPSB0aGlzLnBhcmVudC5WaWV3Py50b0pzb24oKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIE5ld1Byb2plY3QoKSB7XG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgIElkOiB0aGlzLnBhcmVudC5nZXRVdWlkKCksXG4gICAgICBkYXRhOiB7XG4gICAgICAgIG5hbWU6IGBwcm9qZWN0LSR7dGhpcy5wYXJlbnQuZ2V0VGltZSgpfWAsXG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDAsXG4gICAgICAgIHpvb206IDEsXG4gICAgICB9LFxuICAgICAgbm9kZXM6IFtdXG4gICAgfVxuICAgIHRoaXMuTG9hZFByb2plY3QoZGF0YSk7XG4gIH1cbiAgcHVibGljIExvYWRQcm9qZWN0KGRhdGE6IGFueSkge1xuICAgIHRoaXMucGFyZW50Lm1vZHVsZXNbZGF0YS5JZF0gPSBkYXRhO1xuICAgIHRoaXMuTG9hZFByb2plY3RCeUlkKGRhdGEuSWQpO1xuICB9XG5cbn1cbiIsImltcG9ydCB7IE5vZGVGbG93IH0gZnJvbSBcIi4vTm9kZUZsb3dcIjtcbmltcG9ydCB7IFZpZXdGbG93IH0gZnJvbSBcIi4vVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIExpbmVGbG93IHtcbiAgcHVibGljIGVsQ29ubmVjdGlvbjogU1ZHRWxlbWVudCB8IG51bGw7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50O1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFZpZXdGbG93LCBwdWJsaWMgZnJvbU5vZGU6IE5vZGVGbG93LCBwdWJsaWMgdG9Ob2RlOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsLCBwdWJsaWMgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgICB0aGlzLmVsUGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxDb25uZWN0aW9uKTtcbiAgICB0aGlzLmZyb21Ob2RlLkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy50b05vZGU/LkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5TZWxlY3RMaW5lKHRoaXMpO1xuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIGlmICh0aGlzLmZyb21Ob2RlICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy5mcm9tTm9kZS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvTm9kZSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMudG9Ob2RlPy5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uPy5yZW1vdmUoKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IG51bGw7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVRvKHRvX3g6IG51bWJlciwgdG9feTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuZnJvbU5vZGUuZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgeyB4OiBmcm9tX3gsIHk6IGZyb21feSB9OiBhbnkgPSB0aGlzLmZyb21Ob2RlLmdldERvdE91dHB1dCh0aGlzLm91dHB1dEluZGV4KTtcbiAgICB2YXIgbGluZUN1cnZlID0gdGhpcy5jcmVhdGVDdXJ2YXR1cmUoZnJvbV94LCBmcm9tX3ksIHRvX3gsIHRvX3ksIHRoaXMuY3VydmF0dXJlLCAnb3BlbmNsb3NlJyk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCBsaW5lQ3VydmUpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGUoKSB7XG4gICAgLy9Qb3N0aW9uIG91dHB1dFxuICAgIGlmICh0aGlzLnRvTm9kZSAmJiB0aGlzLnRvTm9kZS5lbE5vZGUpIHtcbiAgICAgIGxldCB0b194ID0gdGhpcy50b05vZGUuZ2V0WCgpIC0gNTtcbiAgICAgIGxldCB0b195ID0gdGhpcy50b05vZGUuZ2V0WSgpICsgdGhpcy50b05vZGUuZWxOb2RlLmNsaWVudEhlaWdodCAvIDI7XG4gICAgICB0aGlzLnVwZGF0ZVRvKHRvX3gsIHRvX3kpO1xuICAgIH1cblxuICB9XG59XG4iLCJpbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBMaW5lRmxvdyB9IGZyb20gXCIuL0xpbmVGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XG5jb25zdCBnZXZhbCA9IGV2YWw7XG5leHBvcnQgY2xhc3MgTm9kZUZsb3cgZXh0ZW5kcyBCYXNlRmxvdzxWaWV3Rmxvdz4ge1xuICBwdWJsaWMgZWxOb2RlSW5wdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZWxOb2RlT3V0cHV0czogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGVsTm9kZUNvbnRlbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueS5rZXkpO1xuICB9XG4gIHB1YmxpYyBnZXRYKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueC5rZXkpO1xuICB9XG4gIHB1YmxpYyBnZXREb3RJbnB1dChpbmRleDogbnVtYmVyID0gMSkge1xuICAgIGxldCBlbERvdDogYW55ID0gdGhpcy5lbE5vZGVPdXRwdXRzPy5xdWVyeVNlbGVjdG9yKGAuZG90W25vZGU9XCIke2luZGV4fVwiXWApO1xuICAgIGlmIChlbERvdCkge1xuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xuICAgICAgbGV0IHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCArIGVsRG90Lm9mZnNldExlZnQgLSAxMCk7XG4gICAgICByZXR1cm4geyB4LCB5IH07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuICBwdWJsaWMgZ2V0RG90T3V0cHV0KGluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZU91dHB1dHM/LnF1ZXJ5U2VsZWN0b3IoYC5kb3Rbbm9kZT1cIiR7aW5kZXh9XCJdYCk7XG4gICAgaWYgKGVsRG90KSB7XG4gICAgICBsZXQgeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgKyBlbERvdC5vZmZzZXRUb3AgKyAxMCk7XG4gICAgICBsZXQgeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0ICsgZWxEb3Qub2Zmc2V0TGVmdCArIDEwKTtcblxuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cbiAgcHVibGljIGFyckxpbmU6IExpbmVGbG93W10gPSBbXTtcbiAgcHJpdmF0ZSBvcHRpb246IGFueTtcbiAgcHJpdmF0ZSBub2RlOiBhbnk7XG4gIHByaXZhdGUgcHJvcGVydGllRGVmYXVsdCA9IHtcbiAgICB4OiB7XG4gICAgICBrZXk6IFwieFwiLFxuICAgICAgZGVmYXVsdDogMFxuICAgIH0sXG4gICAgeToge1xuICAgICAga2V5OiBcInlcIixcbiAgICAgIGRlZmF1bHQ6IDBcbiAgICB9XG4gIH1cbiAgcHVibGljIHByb3BlcnRpZXM6IGFueSA9IHt9XG4gIHByaXZhdGUgZmxnU2NyaXB0OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBSZVVJOiBcIlJlVUlcIixcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXG4gICAgdXBkYXRlUG9zaXRpb246IFwidXBkYXRlUG9zaXRpb25cIixcbiAgICBzZWxlY3RlZDogXCJTZWxlY3RlZFwiLFxuICAgIGRhdGFDaGFuZ2U6IFwiZGF0YUNoYW5nZVwiXG4gIH07XG4gIHB1YmxpYyBzZXRPcHRpb24ob3B0aW9uOiBhbnkgPSBudWxsLCBkYXRhOiBhbnkgPSB7fSkge1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uIHx8IHt9O1xuICAgIGlmICghdGhpcy5vcHRpb24ucHJvcGVydGllcykge1xuICAgICAgdGhpcy5vcHRpb24ucHJvcGVydGllcyA9IHt9O1xuICAgIH1cbiAgICB0aGlzLm5vZGUgPSB0aGlzLm9wdGlvbi5ub2RlO1xuICAgIHRoaXMuSWQgPSBkYXRhPy5JZCA/PyB0aGlzLnBhcmVudC5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIHRoaXMucHJvcGVydGllcyA9IHsgLi4udGhpcy5wcm9wZXJ0aWVEZWZhdWx0LCAuLi50aGlzLm9wdGlvbi5wcm9wZXJ0aWVzIH07XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKGRhdGE/LmRhdGEpO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFZpZXdGbG93LCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMuc2V0T3B0aW9uKG9wdGlvbiwge30pO1xuICAgIGlmIChvcHRpb24pIHtcbiAgICAgIHRoaXMuUmVVSSgpO1xuICAgIH1cbiAgICB0aGlzLm9uKHRoaXMuRXZlbnQuY2hhbmdlLCAoZTogYW55LCBzZW5kZXI6IGFueSkgPT4ge1xuICAgICAgdGhpcy5wYXJlbnQuZGlzcGF0Y2godGhpcy5wYXJlbnQuRXZlbnQuY2hhbmdlLCB7XG4gICAgICAgIC4uLmUsXG4gICAgICAgIHRhcmdldE5vZGU6IHNlbmRlclxuICAgICAgfSk7XG4gICAgfSlcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCBMaW5lSnNvbiA9IHRoaXMuYXJyTGluZS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uZnJvbU5vZGUgPT09IHRoaXMpLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAgIGZyb21Ob2RlOiBpdGVtLmZyb21Ob2RlLklkLFxuICAgICAgdG9Ob2RlOiBpdGVtLnRvTm9kZT8uSWQsXG4gICAgICBvdXB1dEluZGV4OiBpdGVtLm91dHB1dEluZGV4XG4gICAgfSkpO1xuICAgIHJldHVybiB7XG4gICAgICBJZDogdGhpcy5JZCxcbiAgICAgIG5vZGU6IHRoaXMubm9kZSxcbiAgICAgIGxpbmU6IExpbmVKc29uLFxuICAgICAgZGF0YTogdGhpcy5kYXRhLnRvSnNvbigpLFxuICAgIH1cbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEuUmVtb3ZlRXZlbnRBbGwoKTtcbiAgICBsZXQgb3B0aW9uID0gdGhpcy5wYXJlbnQuZ2V0T3B0aW9uKGRhdGE/Lm5vZGUpO1xuICAgIHRoaXMuc2V0T3B0aW9uKG9wdGlvbiwgZGF0YSk7XG4gICAgdGhpcy5SZVVJKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIG91dHB1dCgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNSZW1vdmVQYXJlbnQgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcbiAgICB0aGlzLmRhdGEuUmVtb3ZlRXZlbnQodGhpcyk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLk5vZGVMZWF2ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmUoKTtcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcbiAgICBpZiAoaXNSZW1vdmVQYXJlbnQpXG4gICAgICB0aGlzLnBhcmVudC5SZW1vdmVOb2RlKHRoaXMpO1xuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShsaW5lOiBMaW5lRmxvdykge1xuICAgIHRoaXMuYXJyTGluZSA9IFsuLi50aGlzLmFyckxpbmUsIGxpbmVdO1xuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lRmxvdykge1xuICAgIHZhciBpbmRleCA9IHRoaXMuYXJyTGluZS5pbmRleE9mKGxpbmUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICAgIHJldHVybiB0aGlzLmFyckxpbmU7XG4gIH1cbiAgcHVibGljIFJlVUkoKSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICB0aGlzLmRhdGEuUmVtb3ZlRXZlbnQodGhpcyk7XG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLk5vZGVPdmVyLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuTm9kZUxlYXZlLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLmVsTm9kZUlucHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlSW5wdXRzLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9pbnB1dHMnKTtcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImlucHV0cyBkb3RcIj48L2Rpdj5gO1xuICAgIHRoaXMuZWxOb2RlQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlQ29udGVudC5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfY29udGVudCcpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfb3V0cHV0cycpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIm91dHB1dHMgZG90XCIgbm9kZT1cIjBcIj48L2Rpdj5gO1xuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctbm9kZVwiKTtcbiAgICB0aGlzLmVsTm9kZS5pZCA9IGBub2RlLSR7dGhpcy5JZH1gO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgdGhpcy5JZCk7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5Ob2RlTGVhdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVJbnB1dHMpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlQ29udGVudCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVPdXRwdXRzKTtcblxuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzPy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgaWYgKHRoaXMuZGF0YSkge1xuICAgICAgbGV0IGRhdGFUZW1wID0gdGhpcy5kYXRhLnRvSnNvbigpO1xuICAgICAgdGhpcy5kYXRhLmxvYWQoZGF0YVRlbXApO1xuICAgICAgdGhpcy5kYXRhLlVwZGF0ZVVJKCk7XG4gICAgfVxuICAgIHRoaXMuaW5pdE9wdGlvbigpO1xuICAgIHRoaXMub24odGhpcy5kYXRhLkV2ZW50LmRhdGFDaGFuZ2UsICgpID0+IHtcbiAgICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICB9KTtcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuUmVVSSwge30pO1xuICB9XG4gIHB1YmxpYyBjaGVja0lucHV0KCkge1xuICAgIHJldHVybiAhKHRoaXMub3B0aW9uPy5pbnB1dCA9PT0gMCk7XG4gIH1cbiAgcHJpdmF0ZSBpbml0T3B0aW9uKCkge1xuICAgIGlmICh0aGlzLmVsTm9kZUNvbnRlbnQgJiYgdGhpcy5vcHRpb24gJiYgdGhpcy5lbE5vZGVPdXRwdXRzKSB7XG4gICAgICB0aGlzLmVsTm9kZUNvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb24uaHRtbDtcbiAgICAgIGlmICh0aGlzLm9wdGlvbi5vdXRwdXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGZvciAobGV0IGluZGV4OiBudW1iZXIgPSAwOyBpbmRleCA8IHRoaXMub3B0aW9uLm91dHB1dDsgaW5kZXgrKykge1xuICAgICAgICAgIGxldCBvdXRwdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICBvdXRwdXQuc2V0QXR0cmlidXRlKCdub2RlJywgKDMwMCArIGluZGV4KS50b1N0cmluZygpKTtcbiAgICAgICAgICBvdXRwdXQuY2xhc3NMaXN0LmFkZChcImRvdFwiKTtcbiAgICAgICAgICBvdXRwdXQuY2xhc3NMaXN0LmFkZChcIm91dHB1dF9cIiArIChpbmRleCkpO1xuICAgICAgICAgIHRoaXMuZWxOb2RlT3V0cHV0cz8uYXBwZW5kQ2hpbGQob3V0cHV0KTtcbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vcHRpb24uaW5wdXQgPT09IDAgJiYgdGhpcy5lbE5vZGVJbnB1dHMpIHtcbiAgICAgICAgdGhpcy5lbE5vZGVJbnB1dHMuaW5uZXJIVE1MID0gJyc7XG4gICAgICB9XG5cbiAgICB9XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgc2VsZi5SdW5TY3JpcHQoc2VsZiwgc2VsZi5lbE5vZGUpO1xuICAgIH0sIDEwMCk7XG4gIH1cbiAgcHVibGljIFJ1blNjcmlwdChzZWxmTm9kZTogTm9kZUZsb3csIGVsOiBIVE1MRWxlbWVudCB8IG51bGwpIHtcbiAgICBpZiAodGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24uc2NyaXB0ICYmICF0aGlzLmZsZ1NjcmlwdCkge1xuICAgICAgdGhpcy5mbGdTY3JpcHQgPSB0cnVlO1xuICAgICAgZ2V2YWwoJyhub2RlLGVsKT0+eycgKyB0aGlzLm9wdGlvbi5zY3JpcHQudG9TdHJpbmcoKSArICd9Jykoc2VsZk5vZGUsIGVsKTtcbiAgICAgIHRoaXMuZmxnU2NyaXB0ID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGNoZWNrTm9kZShub2RlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24ubm9kZSA9PSBub2RlO1xuICB9XG4gIHB1YmxpYyBOb2RlT3ZlcihlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5ub2RlT3ZlciA9IHRoaXM7XG4gIH1cbiAgcHVibGljIE5vZGVMZWF2ZShlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5ub2RlT3ZlciA9IG51bGw7XG4gIH1cbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQuU2VsZWN0Tm9kZSh0aGlzKTtcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuc2VsZWN0ZWQsIHt9KTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlUG9zaXRpb24oeDogYW55LCB5OiBhbnksIGlDaGVjayA9IGZhbHNlKSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICBpZiAoaUNoZWNrKSB7XG4gICAgICAgIGlmICh4ICE9PSB0aGlzLmdldFgoKSkge1xuICAgICAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVEZWZhdWx0Lngua2V5LCB4KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeSAhPT0gdGhpcy5nZXRZKCkpIHtcbiAgICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC55LmtleSwgeSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVEZWZhdWx0Lnkua2V5LCAodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSkpO1xuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllRGVmYXVsdC54LmtleSwgKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC51cGRhdGVQb3NpdGlvbiwgeyB4OiB0aGlzLmdldFgoKSwgeTogdGhpcy5nZXRZKCkgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7fSk7XG4gICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcbiAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS51cGRhdGUoKTtcbiAgICB9KVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcbmltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcbmltcG9ydCB7IExpbmVGbG93IH0gZnJvbSBcIi4vTGluZUZsb3dcIjtcbmltcG9ydCB7IE5vZGVGbG93IH0gZnJvbSBcIi4vTm9kZUZsb3dcIjtcblxuZXhwb3J0IGVudW0gTW92ZVR5cGUge1xuICBOb25lID0gMCxcbiAgTm9kZSA9IDEsXG4gIENhbnZhcyA9IDIsXG4gIExpbmUgPSAzLFxufVxuZXhwb3J0IGNsYXNzIFZpZXdGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4ge1xuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50O1xuICBwdWJsaWMgZmxnRHJhcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgZmxnTW92ZTogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gIHByaXZhdGUgem9vbV9tYXg6IG51bWJlciA9IDEuNjtcbiAgcHJpdmF0ZSB6b29tX21pbjogbnVtYmVyID0gMC41O1xuICBwcml2YXRlIHpvb21fdmFsdWU6IG51bWJlciA9IDAuMTtcbiAgcHJpdmF0ZSB6b29tX2xhc3RfdmFsdWU6IG51bWJlciA9IDE7XG4gIHByaXZhdGUgcG9zX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgcG9zX3k6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb3VzZV95OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XG4gIHByaXZhdGUgbGluZVNlbGVjdGVkOiBMaW5lRmxvdyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIG5vZGVTZWxlY3RlZDogTm9kZUZsb3cgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIG5vZGVPdmVyOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRvdFNlbGVjdGVkOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHRlbXBMaW5lOiBMaW5lRmxvdyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHRpbWVGYXN0Q2xpY2s6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgdGFnSW5nb3JlID0gWydpbnB1dCcsICdidXR0b24nLCAnYScsICd0ZXh0YXJlYSddO1xuICBwcml2YXRlIGdldFgoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy54LmtleSlcbiAgfVxuICBwcml2YXRlIGdldFkoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy55LmtleSlcbiAgfVxuICBwcml2YXRlIGdldFpvb20oKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSk7XG4gIH1cbiAgcHVibGljIHByb3BlcnRpZXMgPSB7XG4gICAgbmFtZToge1xuICAgICAga2V5OiBcIm5hbWVcIixcbiAgICB9LFxuICAgIHpvb206IHtcbiAgICAgIGtleTogXCJ6b29tXCIsXG4gICAgICBkZWZhdWx0OiAxLFxuICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgIH0sXG4gICAgeDoge1xuICAgICAga2V5OiBcInhcIixcbiAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICB0eXBlOiBcIm51bWJlclwiXG4gICAgfSxcbiAgICB5OiB7XG4gICAgICBrZXk6IFwieVwiLFxuICAgICAgZGVmYXVsdDogMCxcbiAgICAgIHR5cGU6IFwibnVtYmVyXCJcbiAgICB9XG4gIH07XG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcbiAgICB1cGRhdGVWaWV3OiBcInVwZGF0ZVZpZXdcIlxuICB9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLmVsTm9kZSA9IHRoaXMucGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1kZXNnaW4gLndvcmtlcmZsb3ctdmlldycpIHx8IHRoaXMuZWxOb2RlO1xuICAgIHRoaXMuZWxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsQ2FudmFzKTtcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XG4gICAgdGhpcy5hZGRFdmVudCgpO1xuICAgIHRoaXMuUmVzZXQoKTtcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEobnVsbCwgdGhpcy5wcm9wZXJ0aWVzKTtcbiAgICB0aGlzLm9uKHRoaXMuZGF0YS5FdmVudC5kYXRhQ2hhbmdlLCAoaXRlbTogYW55KSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgICB9KTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgfVxuICBwdWJsaWMgZ2V0T3B0aW9uKGtleU5vZGU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXRPcHRpb24oa2V5Tm9kZSk7XG4gIH1cbiAgcHJpdmF0ZSBkcm9wRW5kKGV2OiBhbnkpIHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLnBhcmVudC5tb2R1bGVzKS5sZW5ndGggPT0gMCkge1xuICAgICAgdGhpcy5wYXJlbnQubmV3KCk7XG4gICAgfVxuICAgIGxldCBrZXlOb2RlOiBzdHJpbmcgfCBudWxsID0gJyc7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAga2V5Tm9kZSA9IHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0O1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xuICAgIH1cbiAgICBsZXQgb3B0aW9uID0gdGhpcy5nZXRPcHRpb24oa2V5Tm9kZSk7XG4gICAgaWYgKG9wdGlvbiAmJiBvcHRpb24ub25seU5vZGUpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVzLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5jaGVja05vZGUoa2V5Tm9kZSkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgbm9kZSA9IHRoaXMuQWRkTm9kZShvcHRpb24pO1xuXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGxldCB4ID0gdGhpcy5DYWxjWCh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICBsZXQgeSA9IHRoaXMuQ2FsY1kodGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG5cbiAgICBub2RlLnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuXG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgbm9kZXMgPSB0aGlzLm5vZGVzLm1hcCgoaXRlbSkgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIElkOiB0aGlzLklkLFxuICAgICAgZGF0YTogdGhpcy5kYXRhLnRvSnNvbigpLFxuICAgICAgbm9kZXNcbiAgICB9XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5SZXNldCgpO1xuICAgIGlmICghZGF0YSkge1xuICAgICAgZGF0YSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIWRhdGEuSWQpIHtcbiAgICAgIGRhdGEuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XG4gICAgfVxuICAgIGlmICghZGF0YS5kYXRhKSB7XG4gICAgICBkYXRhLmRhdGEgPSB7fTtcbiAgICB9XG4gICAgaWYgKCFkYXRhLmRhdGFbdGhpcy5wcm9wZXJ0aWVzLm5hbWUua2V5XSkge1xuICAgICAgZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0gPSBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gO1xuICAgIH1cbiAgICB0aGlzLklkID0gZGF0YS5JZDtcbiAgICB0aGlzLmRhdGEubG9hZChkYXRhLmRhdGEpO1xuICAgIHRoaXMuZGF0YS5VcGRhdGVVSSgpO1xuICAgIHRoaXMubm9kZXMgPSAoZGF0YS5ub2RlcyA/PyBbXSkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiAobmV3IE5vZGVGbG93KHRoaXMsIFwiXCIpKS5sb2FkKGl0ZW0pO1xuICAgIH0pO1xuICAgIChkYXRhLm5vZGVzID8/IFtdKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIChpdGVtLmxpbmUgPz8gW10pLmZvckVhY2goKGxpbmU6IGFueSkgPT4ge1xuICAgICAgICBsZXQgZnJvbU5vZGUgPSB0aGlzLmdldE5vZGVCeUlkKGxpbmUuZnJvbU5vZGUpO1xuICAgICAgICBsZXQgdG9Ob2RlID0gdGhpcy5nZXROb2RlQnlJZChsaW5lLnRvTm9kZSk7XG4gICAgICAgIGxldCBvdXB1dEluZGV4ID0gbGluZS5vdXB1dEluZGV4ID8/IDA7XG4gICAgICAgIGlmIChmcm9tTm9kZSAmJiB0b05vZGUpIHtcbiAgICAgICAgICB0aGlzLkFkZExpbmUoZnJvbU5vZGUsIHRvTm9kZSwgb3VwdXRJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSk7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIFJlc2V0KCkge1xuICAgIHRoaXMubm9kZXMuZm9yRWFjaCgoaXRlbSkgPT4gaXRlbS5kZWxldGUoZmFsc2UpKTtcbiAgICB0aGlzLm5vZGVzID0gW107XG4gICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMueC5rZXksIDApO1xuICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnkua2V5LCAwKTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUJ5SWQobm9kZUlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5ub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLklkID09IG5vZGVJZClbMF07XG4gIH1cbiAgcHVibGljIHVwZGF0ZVZpZXcoKSB7XG4gICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHRoaXMuZ2V0WCgpICsgXCJweCwgXCIgKyB0aGlzLmdldFkoKSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy5nZXRab29tKCkgKyBcIilcIjtcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQudXBkYXRlVmlldywgeyB4OiB0aGlzLmdldFgoKSwgeTogdGhpcy5nZXRZKCksIHpvb206IHRoaXMuZ2V0Wm9vbSgpIH0pO1xuICB9XG4gIHByaXZhdGUgQ2FsY1gobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50V2lkdGggLyAodGhpcy5lbE5vZGU/LmNsaWVudFdpZHRoICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwcml2YXRlIENhbGNZKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudEhlaWdodCAvICh0aGlzLmVsTm9kZT8uY2xpZW50SGVpZ2h0ICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwcml2YXRlIGRyYWdvdmVyKGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3RMaW5lKCkge1xuICAgIHRoaXMuU2VsZWN0TGluZShudWxsKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3REb3QoKSB7XG4gICAgdGhpcy5TZWxlY3REb3QobnVsbCk7XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0Tm9kZSgpIHtcbiAgICB0aGlzLlNlbGVjdE5vZGUobnVsbCk7XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0KCkge1xuICAgIHRoaXMuVW5TZWxlY3RMaW5lKCk7XG4gICAgdGhpcy5VblNlbGVjdE5vZGUoKTtcbiAgICB0aGlzLlVuU2VsZWN0RG90KCk7XG4gIH1cbiAgcHVibGljIFNlbGVjdExpbmUobm9kZTogTGluZUZsb3cgfCBudWxsKSB7XG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMubGluZVNlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkLmVsUGF0aD8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5VblNlbGVjdCgpO1xuICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBub2RlO1xuICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZWxQYXRoLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH1cblxuICB9XG4gIHByaXZhdGUgZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xuICBwdWJsaWMgU2VsZWN0Tm9kZShub2RlOiBOb2RlRmxvdyB8IG51bGwpIHtcbiAgICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmZsZ1NlbGVjdE5vZGUpXG4gICAgICAgIHRoaXMucGFyZW50LlByb3BlcnR5SW5mbyh0aGlzLmRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmZsZ1NlbGVjdE5vZGUgPSB0cnVlO1xuICAgICAgdGhpcy5VblNlbGVjdCgpO1xuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBub2RlO1xuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIHRoaXMucGFyZW50LlByb3BlcnR5SW5mbyh0aGlzLm5vZGVTZWxlY3RlZC5kYXRhKTtcbiAgICAgIHRoaXMuZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgU2VsZWN0RG90KG5vZGU6IE5vZGVGbG93IHwgbnVsbCkge1xuICAgIGlmIChub2RlID09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLmRvdFNlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMuZG90U2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5kb3RTZWxlY3RlZCA9IG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICAgIHRoaXMuZG90U2VsZWN0ZWQgPSBub2RlO1xuICAgICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlRmxvdykge1xuICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ub2RlcztcbiAgfVxuICBwdWJsaWMgQWRkTm9kZShvcHRpb246IGFueSA9IG51bGwpOiBOb2RlRmxvdyB7XG4gICAgbGV0IG5vZGUgPSBuZXcgTm9kZUZsb3codGhpcywgb3B0aW9uKTtcbiAgICB0aGlzLm5vZGVzID0gWy4uLnRoaXMubm9kZXMsIG5vZGVdO1xuICAgIHJldHVybiBub2RlO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGZyb21Ob2RlOiBOb2RlRmxvdywgdG9Ob2RlOiBOb2RlRmxvdywgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcbiAgICBpZiAoZnJvbU5vZGUgPT0gdG9Ob2RlKSByZXR1cm47XG4gICAgaWYgKGZyb21Ob2RlLmFyckxpbmUuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICByZXR1cm4gaXRlbS50b05vZGUgPT09IHRvTm9kZSAmJiBpdGVtLm91dHB1dEluZGV4ID09IG91dHB1dEluZGV4ICYmIGl0ZW0gIT0gdGhpcy50ZW1wTGluZTtcbiAgICB9KS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBuZXcgTGluZUZsb3codGhpcywgZnJvbU5vZGUsIHRvTm9kZSwgb3V0cHV0SW5kZXgpO1xuICB9XG4gIHB1YmxpYyBhZGRFdmVudCgpIHtcbiAgICAvKiBNb3VzZSBhbmQgVG91Y2ggQWN0aW9ucyAqL1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcbiAgICAvKiBDb250ZXh0IE1lbnUgKi9cbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLmNvbnRleHRtZW51LmJpbmQodGhpcykpO1xuXG4gICAgLyogRHJvcCBEcmFwICovXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLmRyb3BFbmQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy56b29tX2VudGVyLmJpbmQodGhpcykpO1xuICAgIC8qIERlbGV0ZSAqL1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG4gIHB1YmxpYyBrZXlkb3duKGU6IGFueSkge1xuICAgIGlmIChlLmtleSA9PT0gJ0RlbGV0ZScgfHwgKGUua2V5ID09PSAnQmFja3NwYWNlJyAmJiBlLm1ldGFLZXkpKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkLmRlbGV0ZSgpO1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZC5kZWxldGUoKTtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMuem9vbV9vdXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFpvb20gSW5cbiAgICAgICAgdGhpcy56b29tX2luKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX3JlZnJlc2goKSB7XG4gICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMueC5rZXksICh0aGlzLmdldFgoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRoaXMuZ2V0Wm9vbSgpKTtcbiAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy55LmtleSwgKHRoaXMuZ2V0WSgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGhpcy5nZXRab29tKCkpO1xuICAgIHRoaXMuem9vbV9sYXN0X3ZhbHVlID0gdGhpcy5nZXRab29tKCk7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIHpvb21faW4oKSB7XG4gICAgaWYgKHRoaXMuZ2V0Wm9vbSgpIDwgdGhpcy56b29tX21heCkge1xuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuem9vbS5rZXksICh0aGlzLmdldFpvb20oKSArIHRoaXMuem9vbV92YWx1ZSkpO1xuICAgICAgdGhpcy56b29tX3JlZnJlc2goKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21fb3V0KCkge1xuICAgIGlmICh0aGlzLmdldFpvb20oKSA+IHRoaXMuem9vbV9taW4pIHtcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnpvb20ua2V5LCAodGhpcy5nZXRab29tKCkgLSB0aGlzLnpvb21fdmFsdWUpKTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX3Jlc2V0KCkge1xuICAgIGlmICh0aGlzLmdldFpvb20oKSAhPSAxKSB7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSwgdGhpcy5wcm9wZXJ0aWVzLnpvb20uZGVmYXVsdCk7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBTdGFydE1vdmUoZTogYW55KSB7XG4gICAgaWYgKHRoaXMudGFnSW5nb3JlLmluY2x1ZGVzKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gdGhpcy5wYXJlbnQuZ2V0VGltZSgpO1xuICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21haW4tcGF0aCcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vbmUpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAmJiB0aGlzLnBhcmVudC5jaGVja1BhcmVudChlLnRhcmdldCwgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlKSkge1xuICAgICAgICBpZiAoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdkb3QnKSkge1xuICAgICAgICAgIGlmICh0aGlzLnBhcmVudC5jaGVja1BhcmVudChlLnRhcmdldCwgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlSW5wdXRzKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmVGbG93KHRoaXMsIHRoaXMubm9kZVNlbGVjdGVkLCBudWxsKTtcbiAgICAgICAgICB0aGlzLnRlbXBMaW5lLm91dHB1dEluZGV4ID0gKyhlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vZGU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBvc194ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBNb3ZlKGU6IGFueSkge1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgdGhpcy5mbGdNb3ZlID0gdHJ1ZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuZ2V0WCgpICsgdGhpcy5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcbiAgICAgICAgICBsZXQgeSA9IHRoaXMuZ2V0WSgpICsgdGhpcy5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcbiAgICAgICAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgeCArIFwicHgsIFwiICsgeSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy5nZXRab29tKCkgKyBcIilcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgY2FzZSBNb3ZlVHlwZS5Ob2RlOlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMucG9zX3ggLSBlX3Bvc194KTtcbiAgICAgICAgICBsZXQgeSA9IHRoaXMuQ2FsY1kodGhpcy5wb3NfeSAtIGVfcG9zX3kpO1xuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgICAgICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgICAgICAgIHRoaXMubm9kZVNlbGVjdGVkPy51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgY2FzZSBNb3ZlVHlwZS5MaW5lOlxuICAgICAgICB7XG4gICAgICAgICAgaWYgKHRoaXMudGVtcExpbmUpIHtcbiAgICAgICAgICAgIGxldCB4ID0gdGhpcy5DYWxjWCh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcbiAgICAgICAgICAgIHRoaXMudGVtcExpbmUudXBkYXRlVG8odGhpcy5lbENhbnZhcy5vZmZzZXRMZWZ0IC0geCwgdGhpcy5lbENhbnZhcy5vZmZzZXRUb3AgLSB5KTtcbiAgICAgICAgICAgIHRoaXMudGVtcExpbmUudG9Ob2RlID0gdGhpcy5ub2RlT3ZlcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xuICAgICAgdGhpcy5tb3VzZV95ID0gZV9wb3NfeTtcbiAgICB9XG4gIH1cbiAgcHVibGljIEVuZE1vdmUoZTogYW55KSB7XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgodGhpcy5wYXJlbnQuZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDMwMCkgfHwgIXRoaXMuZmxnTW92ZSkge1xuICAgICAgaWYgKHRoaXMubW92ZVR5cGUgPT09IE1vdmVUeXBlLkNhbnZhcyAmJiB0aGlzLmZsZ0RyYXApXG4gICAgICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMudGVtcExpbmUgJiYgdGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5MaW5lKSB7XG4gICAgICBpZiAodGhpcy50ZW1wTGluZS50b05vZGUgJiYgdGhpcy50ZW1wTGluZS50b05vZGUuY2hlY2tJbnB1dCgpKSB7XG4gICAgICAgIHRoaXMuQWRkTGluZSh0aGlzLnRlbXBMaW5lLmZyb21Ob2RlLCB0aGlzLnRlbXBMaW5lLnRvTm9kZSwgdGhpcy50ZW1wTGluZS5vdXRwdXRJbmRleCk7XG4gICAgICB9XG4gICAgICB0aGlzLnRlbXBMaW5lLmRlbGV0ZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZSA9IG51bGw7XG4gICAgfVxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBlX3Bvc194ID0gdGhpcy5tb3VzZV94O1xuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLngua2V5LCB0aGlzLmdldFgoKSArIHRoaXMuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpKTtcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnkua2V5LCB0aGlzLmdldFkoKSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpKTtcbiAgICB9XG4gICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIGNvbnRleHRtZW51KGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRmxvd0NvcmUgfSBmcm9tIFwiLi9jb21wb25lbnRzL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBDb250cm9sRmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvQ29udHJvbEZsb3dcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgUHJvcGVydHlGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9Qcm9wZXJ0eUZsb3dcIjtcbmltcG9ydCB7IFRhYkZsb3csIFRhYkl0ZW1GbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9UYWJGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlckZsb3cgZXh0ZW5kcyBGbG93Q29yZSB7XG5cbiAgcHVibGljIFZpZXc6IFZpZXdGbG93IHwgbnVsbDtcbiAgcHVibGljIENvbnRyb2w6IENvbnRyb2xGbG93IHwgbnVsbDtcbiAgcHVibGljIFByb3BlcnR5OiBQcm9wZXJ0eUZsb3cgfCBudWxsO1xuICBwdWJsaWMgVGFiOiBUYWJGbG93IHwgbnVsbDtcbiAgcHVibGljIG1vZHVsZXM6IGFueSA9IHt9O1xuICBwdWJsaWMgZGF0YU5vZGVTZWxlY3Q6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgb3B0aW9uOiBhbnk7XG5cbiAgcHVibGljIGNoZWNrUGFyZW50KG5vZGU6IGFueSwgbm9kZUNoZWNrOiBhbnkpIHtcbiAgICBpZiAobm9kZSAmJiBub2RlQ2hlY2spIHtcbiAgICAgIGlmIChub2RlID09IG5vZGVDaGVjaykgcmV0dXJuIHRydWU7XG4gICAgICBsZXQgcGFyZW50OiBhbnkgPSBub2RlO1xuICAgICAgd2hpbGUgKChwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudCkgIT0gbnVsbCkge1xuICAgICAgICBpZiAobm9kZUNoZWNrID09IHBhcmVudCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgb3B0aW9uOiBhbnkgPSBudWxsKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmVsTm9kZSA9IGNvbnRhaW5lcjtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvd1wiKTtcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbiB8fCB7XG4gICAgICBjb250cm9sOiB7fVxuICAgIH07XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xcIj5cbiAgICAgIDxoMiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbF9faGVhZGVyXCI+Tm9kZSBDb250cm9sPC9oMj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWNvbnRyb2xfX2xpc3RcIj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWRlc2dpblwiPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctaXRlbXNcIj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctdmlld1wiPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctcHJvcGVydHlcIj5cbiAgICAgIDxoMiBjbGFzcz1cIndvcmtlcmZsb3ctcHJvcGVydHlfX2hlYWRlclwiPlByb3BlcnRpZXM8L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctcHJvcGVydHlfX2xpc3RcIj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGA7XG4gICAgdGhpcy5WaWV3ID0gbmV3IFZpZXdGbG93KHRoaXMpO1xuICAgIHRoaXMuVGFiID0gbmV3IFRhYkZsb3codGhpcyk7XG4gICAgdGhpcy5Db250cm9sID0gbmV3IENvbnRyb2xGbG93KHRoaXMpO1xuICAgIHRoaXMuUHJvcGVydHkgPSBuZXcgUHJvcGVydHlGbG93KHRoaXMpO1xuICB9XG4gIHB1YmxpYyBuZXcoKSB7XG4gICAgdGhpcy5UYWI/Lk5ld1Byb2plY3QoKTtcbiAgfVxuICBwdWJsaWMgb3BlblByb2plY3QobW9kdWVsczogYW55KSB7XG4gICAgdGhpcy5tb2R1bGVzID0gbW9kdWVscztcbiAgICBsZXQga2V5ID0gT2JqZWN0LmtleXModGhpcy5tb2R1bGVzKVswXTtcbiAgICBpZiAoa2V5KSB7XG4gICAgICB0aGlzLmxvYWQodGhpcy5tb2R1bGVzW2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuVGFiPy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuXG4gIHB1YmxpYyBQcm9wZXJ0eUluZm8oZGF0YTogRGF0YUZsb3cpIHtcbiAgICB0aGlzLlByb3BlcnR5Py5Qcm9wZXJ0eUluZm8oZGF0YSk7XG4gIH1cbiAgcHVibGljIGdldE9wdGlvbihrZXlOb2RlOiBhbnkpIHtcbiAgICBpZiAoIWtleU5vZGUpIHJldHVybjtcbiAgICBsZXQgY29udHJvbCA9IHRoaXMub3B0aW9uLmNvbnRyb2xba2V5Tm9kZV07XG4gICAgaWYgKCFjb250cm9sKSB7XG4gICAgICBjb250cm9sID0gT2JqZWN0LnZhbHVlcyh0aGlzLm9wdGlvbi5jb250cm9sKVswXTtcbiAgICB9XG4gICAgY29udHJvbC5ub2RlID0ga2V5Tm9kZTtcbiAgICByZXR1cm4gY29udHJvbDtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIHRoaXMuVGFiPy5VcGRhdGVEYXRhKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlcztcbiAgfVxuICBwdWJsaWMgZ2V0VGltZSgpOiBudW1iZXIge1xuICAgIHJldHVybiAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICB9XG4gIHB1YmxpYyBnZXRVdWlkKCk6IHN0cmluZyB7XG4gICAgLy8gaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvcmZjNDEyMi50eHRcbiAgICBsZXQgczogYW55ID0gW107XG4gICAgbGV0IGhleERpZ2l0cyA9IFwiMDEyMzQ1Njc4OWFiY2RlZlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzY7IGkrKykge1xuICAgICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xuICAgIH1cbiAgICBzWzE0XSA9IFwiNFwiOyAgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG4gICAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcbiAgICBzWzhdID0gc1sxM10gPSBzWzE4XSA9IHNbMjNdID0gXCItXCI7XG5cbiAgICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcbiAgICByZXR1cm4gdXVpZDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O1VBRWEsUUFBUSxDQUFBO0lBT08sSUFBQSxJQUFBLENBQUE7UUFObEIsSUFBSSxHQUFRLEVBQUUsQ0FBQztRQUNoQixLQUFLLEdBQWUsRUFBRSxDQUFDO0lBQ2QsSUFBQSxLQUFLLEdBQUc7SUFDdEIsUUFBQSxVQUFVLEVBQUUsWUFBWTtJQUN4QixRQUFBLE1BQU0sRUFBRSxRQUFRO1NBQ2pCLENBQUE7SUFDRCxJQUFBLFdBQUEsQ0FBMEIsSUFBYyxFQUFBO1lBQWQsSUFBSSxDQUFBLElBQUEsR0FBSixJQUFJLENBQVU7U0FDdkM7SUFDTSxJQUFBLFFBQVEsQ0FBQyxJQUFZLEdBQUEsSUFBSSxFQUFFLFVBQUEsR0FBa0IsQ0FBQyxDQUFDLEVBQUE7SUFDcEQsUUFBQSxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsRUFBRTtJQUNyQixZQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUNuQyxTQUFBO1lBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QixRQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEIsUUFBQSxJ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
