
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
                node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
                    item.removeEventListener('keyup', this.changeInput.bind(this));
                });
                this.nodes.slice(index, 1);
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
            setTimeout(() => {
                node.elNode.querySelectorAll(`[node\\:model]`).forEach((item) => {
                    item.addEventListener('keyup', this.changeInput.bind(this));
                }, 300);
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
            });
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
            }, 300);
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

    class TabFlow extends BaseFlow {
        modules;
        constructor(parent, modules = {}) {
            super(parent);
            this.modules = modules;
            this.elNode = this.parent.elNode.querySelector('.workerflow-items') || this.elNode;
            if (this.elNode) {
                this.elNode.innerHTML = '';
            }
            this.elNode.addEventListener('mousedown', this.ClickTab.bind(this));
        }
        ClickTab(e) {
            if (e.target.classList.contains('workerflow-item')) {
                let projectId = e.target.getAttribute('data-project');
                this.LoadProjectById(projectId);
            }
        }
        LoadProjectById(projectId) {
            this.elNode.querySelectorAll('.active').forEach((item) => {
                this.modules[item.getAttribute('data-project')?.toString() || ''] = this.parent.View?.toJson();
                item.classList.remove('active');
            });
            this.elNode.querySelector(`[data-project="${projectId}"]`)?.classList.add('active');
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
            this.elNode.querySelectorAll('.active').forEach((item) => {
                this.modules[item.getAttribute('data-project')?.toString() || ''] = this.parent.View?.toJson();
                item.classList.remove('active');
            });
            if (this.elNode.querySelector(`[data-project="${data.id}"]`)) {
                this.elNode.querySelector(`[data-project="${data.id}"]`)?.classList.add('active');
            }
            else {
                let item = document.createElement('div');
                item.classList.add("workerflow-item");
                item.classList.add('active');
                item.innerHTML = data.name;
                item.setAttribute('data-project', data.id);
                this.elNode.appendChild(item);
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
            let { x: from_x, y: from_y } = this.fromNode.getDotOutput(this.outputIndex);
            console.log({ from_x, from_y });
            /*let from_x = this.fromNode.getX() + this.fromNode.elNode.clientWidth + 5;
            let from_y = this.fromNode.getY() + (this.fromNode.output() > 1 ? (((this.outputIndex - 1) * 21) + 15) : (2 + this.fromNode.elNode.clientHeight / 2));
           */ var lineCurve = this.createCurvature(from_x, from_y, to_x, to_y, this.curvature, 'openclose');
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
            let elDot = this.elNodeInputs?.querySelectorAll(`.dot`)[index];
            if (elDot) {
                let y = (this.elNode.offsetTop + elDot.offsetTop + 10);
                let x = (this.elNode.offsetLeft + elDot.offsetLeft - 10);
                return { x, y };
            }
            return {};
        }
        getDotOutput(index = 0) {
            let elDot = this.elNodeOutputs?.querySelectorAll(`.dot`)[index];
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
        toJson() {
            let LineJson = this.arrLine.filter((item) => item.fromNode === this).map((item) => ({
                fromNode: item.fromNode.Id,
                toNode: item.toNode?.Id,
                ouputIndex: item.outputIndex
            }));
            return {
                id: this.Id,
                line: LineJson,
                data: this.data.toJson(),
            };
        }
        load(data) {
            this.data.RemoveEventAll();
            this.data.BindEvent(this);
            this.Id = data?.id ?? this.parent.parent.getUuid();
            this.node = data?.node;
            this.option = this.parent.getOption(this.node);
            console.log(this.properties);
            this.data.load(data?.data);
            this.initOption();
            this.UpdateUI();
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
        constructor(parent, option = null) {
            super(parent);
            this.option = option;
            if (!this.option.properties) {
                this.option.properties = {};
            }
            this.properties = { ...this.propertieDefault, ...this.option.properties };
            this.on(this.Event.change, (e, sender) => {
                this.parent.dispatch(this.parent.Event.change, {
                    ...e,
                    targetNode: sender
                });
            });
            this.ReUI();
            this.data.InitData({}, this.properties);
            this.on(this.data.Event.dataChange, () => {
                //this.ReUI();
                this.UpdateUI();
            });
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
                        output.setAttribute('node', (index).toString());
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
            let keyNode = '';
            if (ev.type === "touchend") {
                keyNode = this.parent.dataNodeSelect;
            }
            else {
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
                id: this.Id,
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
                data.data[this.properties.name.key] = `project-${data.Id}`;
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
            //fix Fast Click
            if (((this.parent.getTime() - this.timeFastClick) < 300) || !this.flgDrap && !this.flgMove) {
                if (this.moveType != MoveType.Node && this.flgDrap)
                    this.UnSelect();
                this.moveType = MoveType.None;
                this.flgDrap = false;
                this.flgMove = false;
                return;
            }
            //  this.UnSelect();
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
            if (Object.keys(this.modules).length == 0) {
                this.new();
            }
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
            control.key = keyNode;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbXBvbmVudHMvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0NvbnRyb2xGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvUHJvcGVydHlGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVGFiRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL0xpbmVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvTm9kZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9WaWV3Rmxvdy50cyIsIi4uL3NyYy9Xb3JrZXJGbG93LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZsb3dDb3JlIH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcbiAgcHJpdmF0ZSBkYXRhOiBhbnkgPSB7fTtcbiAgcHVibGljIG5vZGVzOiBGbG93Q29yZVtdID0gW107XG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCJcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIG5vZGU6IEZsb3dDb3JlKSB7XG4gIH1cbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IC0xKSB7XG4gICAgICB0aGlzLm5vZGUucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICB0aGlzLkJpbmRFdmVudCh0aGlzLm5vZGUpO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlRXZlbnRBbGwoKSB7XG4gICAgZm9yIChsZXQgbm9kZSBvZiB0aGlzLm5vZGVzKSB7XG4gICAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5jaGFuZ2VJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLm5vZGVzID0gW107XG4gIH1cbiAgcHVibGljIFJlbW92ZUV2ZW50KG5vZGU6IEZsb3dDb3JlKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5jaGFuZ2VJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5ub2Rlcy5zbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBCaW5kRXZlbnQobm9kZTogRmxvd0NvcmUpIHtcbiAgICB0aGlzLlJlbW92ZUV2ZW50KG5vZGUpO1xuICAgIHRoaXMubm9kZXMgPSBbLi4uIHRoaXMubm9kZXMsIG5vZGVdO1xuICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbF1gKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGlmIChpdGVtLnRhZ05hbWUgPT0gJ1NQQU4nIHx8IGl0ZW0udGFnTmFtZSA9PSAnRElWJykge1xuICAgICAgICBpdGVtLmlubmVySFRNTCA9IGAke3RoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbS52YWx1ZSA9IHRoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbF1gKS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmNoYW5nZUlucHV0LmJpbmQodGhpcykpO1xuICAgICAgfSwgMzAwKTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlIFNldFZhbHVlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55LCBlbFVwZGF0ZSA9IG51bGwpIHtcbiAgICBmb3IgKGxldCBub2RlIG9mIHRoaXMubm9kZXMpIHtcbiAgICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoYFtub2RlXFxcXDptb2RlbD1cIiR7a2V5fVwiXWApLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICBpZiAoaXRlbSAhPSBlbFVwZGF0ZSkge1xuICAgICAgICAgIGlmIChpdGVtLnRhZ05hbWUgPT0gJ1NQQU4nIHx8IGl0ZW0udGFnTmFtZSA9PSAnRElWJykge1xuICAgICAgICAgICAgaXRlbS5pbm5lckhUTUwgPSBgJHt2YWx1ZX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpdGVtLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG5vZGUuZGlzcGF0Y2godGhpcy5FdmVudC5kYXRhQ2hhbmdlLCB7IGtleSwgdmFsdWUsIGVsVXBkYXRlIH0pO1xuICAgICAgbm9kZS5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwgeyBrZXksIHZhbHVlLCBlbFVwZGF0ZSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgZWxVcGRhdGUgPSBudWxsKSB7XG4gICAgdGhpcy5kYXRhW2tleV0gPSB2YWx1ZTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuU2V0VmFsdWUoa2V5LCB2YWx1ZSwgZWxVcGRhdGUpO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBHZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2tleV07XG4gIH1cbiAgcHVibGljIGNoYW5nZUlucHV0KGU6IGFueSkge1xuICAgIHRoaXMuU2V0KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApLCBlLnRhcmdldC52YWx1ZSwgZS50YXJnZXQpO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGZvciAobGV0IG5vZGUgb2YgdGhpcy5ub2Rlcykge1xuICAgICAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGl0ZW0udGFnTmFtZSA9PSAnU1BBTicgfHwgaXRlbS50YWdOYW1lID09ICdESVYnKSB7XG4gICAgICAgICAgICBpdGVtLmlubmVySFRNTCA9IGAke3RoaXMuZGF0YVtpdGVtLmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApXX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpdGVtLnZhbHVlID0gdGhpcy5kYXRhW2l0ZW0uZ2V0QXR0cmlidXRlKGBub2RlOm1vZGVsYCldO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSwgMzAwKTtcbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEgPSB7fTtcblxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcbiAgICAgIHRoaXMuZGF0YVtrZXldID0gKGRhdGE/LltrZXldID8/ICh0aGlzLm5vZGUucHJvcGVydGllc1trZXldPy5kZWZhdWx0ID8/IFwiXCIpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgcnM6IGFueSA9IHt9O1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLm5vZGUucHJvcGVydGllcykpIHtcbiAgICAgIHJzW2tleV0gPSB0aGlzLkdldChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gcnM7XG4gIH1cbn1cbiIsImltcG9ydCB7IEZsb3dDb3JlIH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50RmxvdyB7XG4gIHByaXZhdGUgZXZlbnRzOiBhbnkgPSB7fTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBGbG93Q29yZSkge1xuXG4gIH1cbiAgLyogRXZlbnRzICovXG4gIHB1YmxpYyBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcbiAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xuICAgICAgICBsaXN0ZW5lcnM6IFtdXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xuXG4gICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZVxuXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVyc1xuICAgIGNvbnN0IGxpc3RlbmVySW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcbiAgICBjb25zdCBoYXNMaXN0ZW5lciA9IGxpc3RlbmVySW5kZXggPiAtMVxuICAgIGlmIChoYXNMaXN0ZW5lcikgbGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKVxuICB9XG5cbiAgcHVibGljIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIGxldCBzZWxmID0gdGhpcy5wYXJlbnQ7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBjb25zb2xlLmVycm9yKGBUaGlzIGV2ZW50OiAke2V2ZW50fSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMsIHNlbGYpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIEZsb3dDb3JlIHtcbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgcHVibGljIElkOiBhbnk7XG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KHRoaXMpO1xuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50Rmxvdyh0aGlzKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQmFzZUZsb3c8VFBhcmVudD4gZXh0ZW5kcyBGbG93Q29yZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyZW50OiBUUGFyZW50KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5pbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sRmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+ICB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFdvcmtlckZsb3cpIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMuZWxOb2RlID0gdGhpcy5wYXJlbnQuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWNvbnRyb2xfX2xpc3QnKSB8fCB0aGlzLmVsTm9kZTtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHBhcmVudC5vcHRpb24uY29udHJvbCk7XG4gICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgbGV0IE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgTm9kZS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICAgIE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBrZXkpO1xuICAgICAgICBOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIik7XG4gICAgICAgIE5vZGUuaW5uZXJIVE1MID0gcGFyZW50Lm9wdGlvbi5jb250cm9sW2tleV0ubmFtZTtcbiAgICAgICAgTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLmRyYWdTdGFydC5iaW5kKHRoaXMpKVxuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoTm9kZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGRyYWdlbmQoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBudWxsO1xuICB9XG5cbiAgcHVibGljIGRyYWdTdGFydChlOiBhbnkpIHtcbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBlLnRhcmdldC5jbG9zZXN0KFwiLndvcmtlcmZsb3ctY29udHJvbF9faXRlbVwiKS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdCA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJyk7XG4gICAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKFwibm9kZVwiLCBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgUHJvcGVydHlGbG93IGV4dGVuZHMgQmFzZUZsb3c8V29ya2VyRmxvdz4ge1xuICBwcml2YXRlIGxhc3REYXRhOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogV29ya2VyRmxvdykge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctcHJvcGVydHlfX2xpc3QnKSB8fCB0aGlzLmVsTm9kZTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICB9XG4gIHB1YmxpYyBQcm9wZXJ0eUluZm8oZGF0YTogRGF0YUZsb3cpIHtcbiAgICBpZiAodGhpcy5sYXN0RGF0YSAmJiB0aGlzLmxhc3REYXRhID09PSBkYXRhKSByZXR1cm47XG4gICAgaWYgKHRoaXMubGFzdERhdGEpIHtcbiAgICAgIHRoaXMubGFzdERhdGEuUmVtb3ZlRXZlbnQodGhpcyk7XG4gICAgfVxuICAgIHRoaXMubGFzdERhdGEgPSBkYXRhO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgfVxuICBwcml2YXRlIFJlbmRlclVJKCkge1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gICAgaWYgKHRoaXMubGFzdERhdGEpIHtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgT2JqZWN0LmtleXModGhpcy5sYXN0RGF0YS5ub2RlLnByb3BlcnRpZXMpKSB7XG4gICAgICAgIGxldCBlbEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICBlbEl0ZW0uc2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJywgaXRlbSk7XG4gICAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGVsSXRlbSk7XG4gICAgICB9XG4gICAgICB0aGlzLmxhc3REYXRhLkJpbmRFdmVudCh0aGlzKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgVGFiRmxvdyBleHRlbmRzIEJhc2VGbG93PFdvcmtlckZsb3c+ICB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFdvcmtlckZsb3csIHByaXZhdGUgbW9kdWxlczogYW55ID0ge30pIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMuZWxOb2RlID0gdGhpcy5wYXJlbnQuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWl0ZW1zJykgfHwgdGhpcy5lbE5vZGU7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICB9XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5DbGlja1RhYi5iaW5kKHRoaXMpKTtcbiAgfVxuICBwcml2YXRlIENsaWNrVGFiKGU6IGFueSkge1xuICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3dvcmtlcmZsb3ctaXRlbScpKSB7XG4gICAgICBsZXQgcHJvamVjdElkID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnKTtcbiAgICAgIHRoaXMuTG9hZFByb2plY3RCeUlkKHByb2plY3RJZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBMb2FkUHJvamVjdEJ5SWQocHJvamVjdElkOiBhbnkpIHtcbiAgICB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yQWxsKCcuYWN0aXZlJykuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgdGhpcy5tb2R1bGVzW2l0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnKT8udG9TdHJpbmcoKSB8fCAnJ10gPSB0aGlzLnBhcmVudC5WaWV3Py50b0pzb24oKTtcbiAgICAgIGl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfSlcbiAgICB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm9qZWN0PVwiJHtwcm9qZWN0SWR9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIHRoaXMucGFyZW50LlZpZXc/LmxvYWQodGhpcy5tb2R1bGVzW3Byb2plY3RJZF0pO1xuICB9XG4gIHB1YmxpYyBOZXdQcm9qZWN0KCkge1xuICAgIGxldCBkYXRhID0ge1xuICAgICAgaWQ6IHRoaXMucGFyZW50LmdldFV1aWQoKSxcbiAgICAgIG5hbWU6IGBwcm9qZWN0LSR7dGhpcy5wYXJlbnQuZ2V0VGltZSgpfWAsXG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICAgIHpvb206IDEsXG4gICAgICBub2RlczogW11cbiAgICB9XG4gICAgdGhpcy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuICBwdWJsaWMgTG9hZFByb2plY3QoZGF0YTogYW55KSB7XG4gICAgdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvckFsbCgnLmFjdGl2ZScpLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIHRoaXMubW9kdWxlc1tpdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0Jyk/LnRvU3RyaW5nKCkgfHwgJyddID0gdGhpcy5wYXJlbnQuVmlldz8udG9Kc29uKCk7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH0pXG4gICAgaWYgKHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3Q9XCIke2RhdGEuaWR9XCJdYCkpIHtcbiAgICAgIHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3Q9XCIke2RhdGEuaWR9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1pdGVtXCIpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIGl0ZW0uaW5uZXJIVE1MID0gZGF0YS5uYW1lO1xuICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdCcsIGRhdGEuaWQpO1xuICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfVxuICAgIHRoaXMubW9kdWxlc1tkYXRhLmlkXSA9IGRhdGE7XG4gICAgdGhpcy5wYXJlbnQuVmlldz8ubG9hZCh0aGlzLm1vZHVsZXNbZGF0YS5pZF0pO1xuICB9XG5cbn1cbiIsImltcG9ydCB7IE5vZGVGbG93IH0gZnJvbSBcIi4vTm9kZUZsb3dcIjtcbmltcG9ydCB7IFZpZXdGbG93IH0gZnJvbSBcIi4vVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIExpbmVGbG93IHtcbiAgcHVibGljIGVsQ29ubmVjdGlvbjogU1ZHRWxlbWVudCB8IG51bGw7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50O1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFZpZXdGbG93LCBwdWJsaWMgZnJvbU5vZGU6IE5vZGVGbG93LCBwdWJsaWMgdG9Ob2RlOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsLCBwdWJsaWMgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgICB0aGlzLmVsUGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxDb25uZWN0aW9uKTtcbiAgICB0aGlzLmZyb21Ob2RlLkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy50b05vZGU/LkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5TZWxlY3RMaW5lKHRoaXMpO1xuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIGlmICh0aGlzLmZyb21Ob2RlICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy5mcm9tTm9kZS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvTm9kZSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMudG9Ob2RlPy5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uPy5yZW1vdmUoKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IG51bGw7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVRvKHRvX3g6IG51bWJlciwgdG9feTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuZnJvbU5vZGUuZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgeyB4OiBmcm9tX3gsIHk6IGZyb21feSB9OiBhbnkgPSB0aGlzLmZyb21Ob2RlLmdldERvdE91dHB1dCh0aGlzLm91dHB1dEluZGV4KTtcbiAgICBjb25zb2xlLmxvZyh7IGZyb21feCwgZnJvbV95IH0pO1xuICAgIC8qbGV0IGZyb21feCA9IHRoaXMuZnJvbU5vZGUuZ2V0WCgpICsgdGhpcy5mcm9tTm9kZS5lbE5vZGUuY2xpZW50V2lkdGggKyA1O1xuICAgIGxldCBmcm9tX3kgPSB0aGlzLmZyb21Ob2RlLmdldFkoKSArICh0aGlzLmZyb21Ob2RlLm91dHB1dCgpID4gMSA/ICgoKHRoaXMub3V0cHV0SW5kZXggLSAxKSAqIDIxKSArIDE1KSA6ICgyICsgdGhpcy5mcm9tTm9kZS5lbE5vZGUuY2xpZW50SGVpZ2h0IC8gMikpO1xuICAgKi8gdmFyIGxpbmVDdXJ2ZSA9IHRoaXMuY3JlYXRlQ3VydmF0dXJlKGZyb21feCwgZnJvbV95LCB0b194LCB0b195LCB0aGlzLmN1cnZhdHVyZSwgJ29wZW5jbG9zZScpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgbGluZUN1cnZlKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlKCkge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50b05vZGUgJiYgdGhpcy50b05vZGUuZWxOb2RlKSB7XG4gICAgICBsZXQgdG9feCA9IHRoaXMudG9Ob2RlLmdldFgoKSAtIDU7XG4gICAgICBsZXQgdG9feSA9IHRoaXMudG9Ob2RlLmdldFkoKSArIHRoaXMudG9Ob2RlLmVsTm9kZS5jbGllbnRIZWlnaHQgLyAyO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG5cbiAgfVxufVxuIiwiaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9WaWV3Rmxvd1wiO1xuY29uc3QgZ2V2YWwgPSBldmFsO1xuZXhwb3J0IGNsYXNzIE5vZGVGbG93IGV4dGVuZHMgQmFzZUZsb3c8Vmlld0Zsb3c+IHtcbiAgcHVibGljIGVsTm9kZUlucHV0czogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGVsTm9kZU91dHB1dHM6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVDb250ZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQodGhpcy5wcm9wZXJ0aWVEZWZhdWx0Lnkua2V5KTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQodGhpcy5wcm9wZXJ0aWVEZWZhdWx0Lngua2V5KTtcbiAgfVxuICBwdWJsaWMgZ2V0RG90SW5wdXQoaW5kZXg6IG51bWJlciA9IDEpIHtcbiAgICBsZXQgZWxEb3Q6IGFueSA9IHRoaXMuZWxOb2RlSW5wdXRzPy5xdWVyeVNlbGVjdG9yQWxsKGAuZG90YClbaW5kZXhdO1xuICAgIGlmIChlbERvdCkge1xuXG4gICAgICBsZXQgeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgKyBlbERvdC5vZmZzZXRUb3AgKyAxMCk7XG4gICAgICBsZXQgeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0ICsgZWxEb3Qub2Zmc2V0TGVmdCAtIDEwKTtcbiAgICAgIHJldHVybiB7IHgsIHkgfTtcbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIHB1YmxpYyBnZXREb3RPdXRwdXQoaW5kZXg6IG51bWJlciA9IDApIHtcbiAgICBsZXQgZWxEb3Q6IGFueSA9IHRoaXMuZWxOb2RlT3V0cHV0cz8ucXVlcnlTZWxlY3RvckFsbChgLmRvdGApW2luZGV4XTtcbiAgICBpZiAoZWxEb3QpIHtcblxuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xuICAgICAgbGV0IHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCArIGVsRG90Lm9mZnNldExlZnQgKyAxMCk7XG5cbiAgICAgIHJldHVybiB7IHgsIHkgfTtcbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIHB1YmxpYyBhcnJMaW5lOiBMaW5lRmxvd1tdID0gW107XG4gIHByaXZhdGUgb3B0aW9uOiBhbnk7XG4gIHByaXZhdGUgbm9kZTogYW55O1xuICBwcml2YXRlIHByb3BlcnRpZURlZmF1bHQgPSB7XG4gICAgeDoge1xuICAgICAga2V5OiBcInhcIixcbiAgICAgIGRlZmF1bHQ6IDBcbiAgICB9LFxuICAgIHk6IHtcbiAgICAgIGtleTogXCJ5XCIsXG4gICAgICBkZWZhdWx0OiAwXG4gICAgfVxuICB9XG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fVxuICBwcml2YXRlIGZsZ1NjcmlwdDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgcmVhZG9ubHkgRXZlbnQgPSB7XG4gICAgUmVVSTogXCJSZVVJXCIsXG4gICAgY2hhbmdlOiBcImNoYW5nZVwiLFxuICAgIHVwZGF0ZVBvc2l0aW9uOiBcInVwZGF0ZVBvc2l0aW9uXCIsXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcbiAgICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIlxuICB9O1xuXG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgbGV0IExpbmVKc29uID0gdGhpcy5hcnJMaW5lLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5mcm9tTm9kZSA9PT0gdGhpcykubWFwKChpdGVtKSA9PiAoe1xuICAgICAgZnJvbU5vZGU6IGl0ZW0uZnJvbU5vZGUuSWQsXG4gICAgICB0b05vZGU6IGl0ZW0udG9Ob2RlPy5JZCxcbiAgICAgIG91cHV0SW5kZXg6IGl0ZW0ub3V0cHV0SW5kZXhcbiAgICB9KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLklkLFxuICAgICAgbGluZTogTGluZUpzb24sXG4gICAgICBkYXRhOiB0aGlzLmRhdGEudG9Kc29uKCksXG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuZGF0YS5SZW1vdmVFdmVudEFsbCgpO1xuICAgIHRoaXMuZGF0YS5CaW5kRXZlbnQodGhpcyk7XG5cbiAgICB0aGlzLklkID0gZGF0YT8uaWQgPz8gdGhpcy5wYXJlbnQucGFyZW50LmdldFV1aWQoKTtcbiAgICB0aGlzLm5vZGUgPSBkYXRhPy5ub2RlO1xuICAgIHRoaXMub3B0aW9uID0gdGhpcy5wYXJlbnQuZ2V0T3B0aW9uKHRoaXMubm9kZSk7XG4gICAgY29uc29sZS5sb2codGhpcy5wcm9wZXJ0aWVzKTtcbiAgICB0aGlzLmRhdGEubG9hZChkYXRhPy5kYXRhKTtcbiAgICB0aGlzLmluaXRPcHRpb24oKTtcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIG91dHB1dCgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNSZW1vdmVQYXJlbnQgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuTm9kZUxlYXZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZSgpO1xuICAgIHRoaXMuYXJyTGluZSA9IFtdO1xuICAgIGlmIChpc1JlbW92ZVBhcmVudClcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7fSk7XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBWaWV3Rmxvdywgb3B0aW9uOiBhbnkgPSBudWxsKSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbjtcbiAgICBpZiAoIXRoaXMub3B0aW9uLnByb3BlcnRpZXMpIHtcbiAgICAgIHRoaXMub3B0aW9uLnByb3BlcnRpZXMgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5wcm9wZXJ0aWVzID0geyAuLi50aGlzLnByb3BlcnRpZURlZmF1bHQsIC4uLnRoaXMub3B0aW9uLnByb3BlcnRpZXMgfTtcbiAgICB0aGlzLm9uKHRoaXMuRXZlbnQuY2hhbmdlLCAoZTogYW55LCBzZW5kZXI6IGFueSkgPT4ge1xuICAgICAgdGhpcy5wYXJlbnQuZGlzcGF0Y2godGhpcy5wYXJlbnQuRXZlbnQuY2hhbmdlLCB7XG4gICAgICAgIC4uLmUsXG4gICAgICAgIHRhcmdldE5vZGU6IHNlbmRlclxuICAgICAgfSk7XG4gICAgfSlcbiAgICB0aGlzLlJlVUkoKTtcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoe30sIHRoaXMucHJvcGVydGllcyk7XG4gICAgdGhpcy5vbih0aGlzLmRhdGEuRXZlbnQuZGF0YUNoYW5nZSwgKCkgPT4ge1xuICAgICAgLy90aGlzLlJlVUkoKTtcbiAgICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBSZVVJKCkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkgdGhpcy5lbE5vZGUucmVtb3ZlKCk7XG4gICAgdGhpcy5kYXRhLlJlbW92ZUV2ZW50KHRoaXMpO1xuICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIndvcmtlcmZsb3ctbm9kZVwiKTtcbiAgICB0aGlzLmVsTm9kZS5pZCA9IGBub2RlLSR7dGhpcy5JZH1gO1xuICAgIHRoaXMuZWxOb2RlSW5wdXRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX2lucHV0cycpO1xuICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiaW5wdXRzIGRvdFwiPjwvZGl2PmA7XG4gICAgdGhpcy5lbE5vZGVDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGVDb250ZW50LmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9jb250ZW50Jyk7XG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzLmNsYXNzTGlzdC5hZGQoJ3dvcmtlcmZsb3ctbm9kZV9vdXRwdXRzJyk7XG4gICAgdGhpcy5lbE5vZGVPdXRwdXRzLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwib3V0cHV0cyBkb3RcIiBub2RlPVwiMFwiPjwvZGl2PmA7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCB0aGlzLklkKTtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLk5vZGVPdmVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLk5vZGVMZWF2ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZUlucHV0cyk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGVDb250ZW50KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZU91dHB1dHMpO1xuXG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICBpZiAodGhpcy5kYXRhKSB7XG4gICAgICBsZXQgZGF0YVRlbXAgPSB0aGlzLmRhdGEudG9Kc29uKCk7XG4gICAgICB0aGlzLmRhdGEubG9hZChkYXRhVGVtcCk7XG4gICAgICB0aGlzLmRhdGEuVXBkYXRlVUkoKTtcbiAgICB9XG4gICAgdGhpcy5pbml0T3B0aW9uKCk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LlJlVUksIHt9KTtcbiAgfVxuICBwdWJsaWMgY2hlY2tJbnB1dCgpIHtcbiAgICByZXR1cm4gISh0aGlzLm9wdGlvbj8uaW5wdXQgPT09IDApO1xuICB9XG4gIHByaXZhdGUgaW5pdE9wdGlvbigpIHtcblxuICAgIGlmICh0aGlzLmVsTm9kZUNvbnRlbnQgJiYgdGhpcy5vcHRpb24gJiYgdGhpcy5lbE5vZGVPdXRwdXRzKSB7XG4gICAgICB0aGlzLmVsTm9kZUNvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb24uaHRtbDtcbiAgICAgIGlmICh0aGlzLm9wdGlvbi5vdXRwdXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGZvciAobGV0IGluZGV4OiBudW1iZXIgPSAwOyBpbmRleCA8IHRoaXMub3B0aW9uLm91dHB1dDsgaW5kZXgrKykge1xuICAgICAgICAgIGxldCBvdXRwdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICBvdXRwdXQuc2V0QXR0cmlidXRlKCdub2RlJywgKGluZGV4KS50b1N0cmluZygpKTtcbiAgICAgICAgICBvdXRwdXQuY2xhc3NMaXN0LmFkZChcImRvdFwiKTtcbiAgICAgICAgICBvdXRwdXQuY2xhc3NMaXN0LmFkZChcIm91dHB1dF9cIiArIChpbmRleCkpO1xuICAgICAgICAgIHRoaXMuZWxOb2RlT3V0cHV0cz8uYXBwZW5kQ2hpbGQob3V0cHV0KTtcbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5vcHRpb24uaW5wdXQgPT09IDAgJiYgdGhpcy5lbE5vZGVJbnB1dHMpIHtcbiAgICAgICAgdGhpcy5lbE5vZGVJbnB1dHMuaW5uZXJIVE1MID0gJyc7XG4gICAgICB9XG5cbiAgICB9XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgc2VsZi5SdW5TY3JpcHQoc2VsZiwgc2VsZi5lbE5vZGUpO1xuICAgIH0sIDEwMCk7XG4gIH1cbiAgcHVibGljIFJ1blNjcmlwdChzZWxmTm9kZTogTm9kZUZsb3csIGVsOiBIVE1MRWxlbWVudCB8IG51bGwpIHtcbiAgICBpZiAodGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24uc2NyaXB0ICYmICF0aGlzLmZsZ1NjcmlwdCkge1xuICAgICAgdGhpcy5mbGdTY3JpcHQgPSB0cnVlO1xuICAgICAgZ2V2YWwoJyhub2RlLGVsKT0+eycgKyB0aGlzLm9wdGlvbi5zY3JpcHQudG9TdHJpbmcoKSArICd9Jykoc2VsZk5vZGUsIGVsKTtcbiAgICAgIHRoaXMuZmxnU2NyaXB0ID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGNoZWNrS2V5KGtleTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uICYmIHRoaXMub3B0aW9uLmtleSA9PSBrZXk7XG4gIH1cbiAgcHVibGljIE5vZGVPdmVyKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gdGhpcztcbiAgfVxuICBwdWJsaWMgTm9kZUxlYXZlKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50Lm5vZGVPdmVyID0gbnVsbDtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5TZWxlY3ROb2RlKHRoaXMpO1xuICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5zZWxlY3RlZCwge30pO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVQb3NpdGlvbih4OiBhbnksIHk6IGFueSwgaUNoZWNrID0gZmFsc2UpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGlmIChpQ2hlY2spIHtcbiAgICAgICAgaWYgKHggIT09IHRoaXMuZ2V0WCgpKSB7XG4gICAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueC5rZXksIHgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh5ICE9PSB0aGlzLmdldFkoKSkge1xuICAgICAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVEZWZhdWx0Lnkua2V5LCB5KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZURlZmF1bHQueS5rZXksICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgLSB5KSk7XG4gICAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVEZWZhdWx0Lngua2V5LCAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCAtIHgpKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnVwZGF0ZVBvc2l0aW9uLCB7IHg6IHRoaXMuZ2V0WCgpLCB5OiB0aGlzLmdldFkoKSB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2godGhpcy5FdmVudC5jaGFuZ2UsIHt9KTtcbiAgICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCkge1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMuZ2V0WSgpfXB4OyBsZWZ0OiAke3RoaXMuZ2V0WCgpfXB4O2ApO1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLnVwZGF0ZSgpO1xuICAgIH0pXG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuXG5leHBvcnQgZW51bSBNb3ZlVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb2RlID0gMSxcbiAgQ2FudmFzID0gMixcbiAgTGluZSA9IDMsXG59XG5leHBvcnQgY2xhc3MgVmlld0Zsb3cgZXh0ZW5kcyBCYXNlRmxvdzxXb3JrZXJGbG93PiB7XG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQ7XG4gIHB1YmxpYyBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBmbGdNb3ZlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgcHJpdmF0ZSB6b29tX21heDogbnVtYmVyID0gMS42O1xuICBwcml2YXRlIHpvb21fbWluOiBudW1iZXIgPSAwLjU7XG4gIHByaXZhdGUgem9vbV92YWx1ZTogbnVtYmVyID0gMC4xO1xuICBwcml2YXRlIHpvb21fbGFzdF92YWx1ZTogbnVtYmVyID0gMTtcbiAgcHJpdmF0ZSBwb3NfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwb3NfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb3VzZV94OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3k6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbm9kZXM6IE5vZGVGbG93W10gPSBbXTtcbiAgcHJpdmF0ZSBsaW5lU2VsZWN0ZWQ6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbm9kZVNlbGVjdGVkOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgbm9kZU92ZXI6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZG90U2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGltZUZhc3RDbGljazogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSB0YWdJbmdvcmUgPSBbJ2lucHV0JywgJ2J1dHRvbicsICdhJywgJ3RleHRhcmVhJ107XG4gIHByaXZhdGUgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQodGhpcy5wcm9wZXJ0aWVzLmNhbnZhc194LmtleSlcbiAgfVxuICBwcml2YXRlIGdldFkoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy5jYW52YXNfeS5rZXkpXG4gIH1cbiAgcHJpdmF0ZSBnZXRab29tKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSk7XG4gIH1cbiAgcHVibGljIHByb3BlcnRpZXMgPSB7XG4gICAgbmFtZToge1xuICAgICAga2V5OiBcIm5hbWVcIixcbiAgICB9LFxuICAgIHpvb206IHtcbiAgICAgIGtleTogXCJ6b29tXCIsXG4gICAgICBkZWZhdWx0OiAxLFxuICAgICAgdHlwZTogXCJudW1iZXJcIlxuICAgIH0sXG4gICAgY2FudmFzX3g6IHtcbiAgICAgIGtleTogXCJjYW52YXNfeFwiLFxuICAgICAgZGVmYXVsdDogMCxcbiAgICAgIHR5cGU6IFwibnVtYmVyXCJcbiAgICB9LFxuICAgIGNhbnZhc195OiB7XG4gICAgICBrZXk6IFwiY2FudmFzX3lcIixcbiAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICB0eXBlOiBcIm51bWJlclwiXG4gICAgfVxuICB9O1xuICBwdWJsaWMgcmVhZG9ubHkgRXZlbnQgPSB7XG4gICAgY2hhbmdlOiBcImNoYW5nZVwiLFxuICAgIHNlbGVjdGVkOiBcIlNlbGVjdGVkXCIsXG4gICAgdXBkYXRlVmlldzogXCJ1cGRhdGVWaWV3XCJcbiAgfTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogV29ya2VyRmxvdykge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5lbE5vZGUgPSB0aGlzLnBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctZGVzZ2luIC53b3JrZXJmbG93LXZpZXcnKSB8fCB0aGlzLmVsTm9kZTtcbiAgICB0aGlzLmVsQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1jYW52YXNcIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XG4gICAgdGhpcy5lbE5vZGUudGFiSW5kZXggPSAwO1xuICAgIHRoaXMuYWRkRXZlbnQoKTtcbiAgICB0aGlzLlJlc2V0KCk7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKG51bGwsIHRoaXMucHJvcGVydGllcyk7XG4gICAgdGhpcy5vbih0aGlzLmRhdGEuRXZlbnQuZGF0YUNoYW5nZSwgKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gICAgfSk7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIGdldE9wdGlvbihrZXlOb2RlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0T3B0aW9uKGtleU5vZGUpO1xuICB9XG4gIHByaXZhdGUgZHJvcEVuZChldjogYW55KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQga2V5Tm9kZTogc3RyaW5nIHwgbnVsbCA9ICcnO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGtleU5vZGUgPSB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5Tm9kZSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwibm9kZVwiKTtcbiAgICB9XG4gICAgbGV0IG9wdGlvbiA9IHRoaXMuZ2V0T3B0aW9uKGtleU5vZGUpO1xuICAgIGlmIChvcHRpb24gJiYgb3B0aW9uLm9ubHlOb2RlKSB7XG4gICAgICBpZiAodGhpcy5ub2Rlcy5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uY2hlY2tLZXkoa2V5Tm9kZSkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgbm9kZSA9IHRoaXMuQWRkTm9kZShvcHRpb24pO1xuXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGxldCB4ID0gdGhpcy5DYWxjWCh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICBsZXQgeSA9IHRoaXMuQ2FsY1kodGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG5cbiAgICBub2RlLnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuXG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgbm9kZXMgPSB0aGlzLm5vZGVzLm1hcCgoaXRlbSkgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLklkLFxuICAgICAgZGF0YTogdGhpcy5kYXRhLnRvSnNvbigpLFxuICAgICAgbm9kZXNcbiAgICB9XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5SZXNldCgpO1xuICAgIGlmICghZGF0YSkge1xuICAgICAgZGF0YSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIWRhdGEuSWQpIHtcbiAgICAgIGRhdGEuSWQgPSB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XG4gICAgfVxuICAgIGlmICghZGF0YS5kYXRhKSB7XG4gICAgICBkYXRhLmRhdGEgPSB7fTtcbiAgICB9XG4gICAgaWYgKCFkYXRhLmRhdGFbdGhpcy5wcm9wZXJ0aWVzLm5hbWUua2V5XSkge1xuICAgICAgZGF0YS5kYXRhW3RoaXMucHJvcGVydGllcy5uYW1lLmtleV0gPSBgcHJvamVjdC0ke2RhdGEuSWR9YDtcbiAgICB9XG4gICAgdGhpcy5JZCA9IGRhdGEuSWQ7XG4gICAgdGhpcy5kYXRhLmxvYWQoZGF0YS5kYXRhKTtcbiAgICB0aGlzLmRhdGEuVXBkYXRlVUkoKTtcbiAgICB0aGlzLm5vZGVzID0gKGRhdGEubm9kZXMgPz8gW10pLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICByZXR1cm4gKG5ldyBOb2RlRmxvdyh0aGlzLCBcIlwiKSkubG9hZChpdGVtKTtcbiAgICB9KTtcbiAgICAoZGF0YS5ub2RlcyA/PyBbXSkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAoaXRlbS5saW5lID8/IFtdKS5mb3JFYWNoKChsaW5lOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IGZyb21Ob2RlID0gdGhpcy5nZXROb2RlQnlJZChsaW5lLmZyb21Ob2RlKTtcbiAgICAgICAgbGV0IHRvTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQobGluZS50b05vZGUpO1xuICAgICAgICBsZXQgb3VwdXRJbmRleCA9IGxpbmUub3VwdXRJbmRleCA/PyAwO1xuICAgICAgICBpZiAoZnJvbU5vZGUgJiYgdG9Ob2RlKSB7XG4gICAgICAgICAgdGhpcy5BZGRMaW5lKGZyb21Ob2RlLCB0b05vZGUsIG91cHV0SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pO1xuICAgIHRoaXMudXBkYXRlVmlldygpO1xuICB9XG4gIHB1YmxpYyBSZXNldCgpIHtcbiAgICB0aGlzLm5vZGVzLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLmNhbnZhc194LmtleSwgMCk7XG4gICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuY2FudmFzX3kua2V5LCAwKTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUJ5SWQobm9kZUlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5ub2Rlcz8uZmlsdGVyKChpdGVtKSA9PiBpdGVtLklkID09IG5vZGVJZClbMF07XG4gIH1cbiAgcHVibGljIHVwZGF0ZVZpZXcoKSB7XG4gICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHRoaXMuZ2V0WCgpICsgXCJweCwgXCIgKyB0aGlzLmdldFkoKSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy5nZXRab29tKCkgKyBcIilcIjtcbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQudXBkYXRlVmlldywgeyB4OiB0aGlzLmdldFgoKSwgeTogdGhpcy5nZXRZKCksIHpvb206IHRoaXMuZ2V0Wm9vbSgpIH0pO1xuICB9XG4gIHByaXZhdGUgQ2FsY1gobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50V2lkdGggLyAodGhpcy5lbE5vZGU/LmNsaWVudFdpZHRoICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwcml2YXRlIENhbGNZKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudEhlaWdodCAvICh0aGlzLmVsTm9kZT8uY2xpZW50SGVpZ2h0ICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwcml2YXRlIGRyYWdvdmVyKGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3RMaW5lKCkge1xuICAgIHRoaXMuU2VsZWN0TGluZShudWxsKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3REb3QoKSB7XG4gICAgdGhpcy5TZWxlY3REb3QobnVsbCk7XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0Tm9kZSgpIHtcbiAgICB0aGlzLlNlbGVjdE5vZGUobnVsbCk7XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0KCkge1xuICAgIHRoaXMuVW5TZWxlY3RMaW5lKCk7XG4gICAgdGhpcy5VblNlbGVjdE5vZGUoKTtcbiAgICB0aGlzLlVuU2VsZWN0RG90KCk7XG4gIH1cbiAgcHVibGljIFNlbGVjdExpbmUobm9kZTogTGluZUZsb3cgfCBudWxsKSB7XG4gICAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMubGluZVNlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkLmVsUGF0aD8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5VblNlbGVjdCgpO1xuICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBub2RlO1xuICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZWxQYXRoLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH1cblxuICB9XG4gIHByaXZhdGUgZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xuICBwdWJsaWMgU2VsZWN0Tm9kZShub2RlOiBOb2RlRmxvdyB8IG51bGwpIHtcbiAgICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmZsZ1NlbGVjdE5vZGUpXG4gICAgICAgIHRoaXMucGFyZW50LlByb3BlcnR5SW5mbyh0aGlzLmRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmZsZ1NlbGVjdE5vZGUgPSB0cnVlO1xuICAgICAgdGhpcy5VblNlbGVjdCgpO1xuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBub2RlO1xuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIHRoaXMucGFyZW50LlByb3BlcnR5SW5mbyh0aGlzLm5vZGVTZWxlY3RlZC5kYXRhKTtcbiAgICAgIHRoaXMuZmxnU2VsZWN0Tm9kZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgU2VsZWN0RG90KG5vZGU6IE5vZGVGbG93IHwgbnVsbCkge1xuICAgIGlmIChub2RlID09IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLmRvdFNlbGVjdGVkKSB7XG4gICAgICAgIHRoaXMuZG90U2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5kb3RTZWxlY3RlZCA9IG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICAgIHRoaXMuZG90U2VsZWN0ZWQgPSBub2RlO1xuICAgICAgdGhpcy5kb3RTZWxlY3RlZC5lbE5vZGU/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlRmxvdykge1xuICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ub2RlcztcbiAgfVxuICBwdWJsaWMgQWRkTm9kZShvcHRpb246IGFueSA9IG51bGwpOiBOb2RlRmxvdyB7XG4gICAgbGV0IG5vZGUgPSBuZXcgTm9kZUZsb3codGhpcywgb3B0aW9uKTtcbiAgICB0aGlzLm5vZGVzID0gWy4uLnRoaXMubm9kZXMsIG5vZGVdO1xuICAgIHJldHVybiBub2RlO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGZyb21Ob2RlOiBOb2RlRmxvdywgdG9Ob2RlOiBOb2RlRmxvdywgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcbiAgICBpZiAoZnJvbU5vZGUgPT0gdG9Ob2RlKSByZXR1cm47XG4gICAgaWYgKGZyb21Ob2RlLmFyckxpbmUuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICByZXR1cm4gaXRlbS50b05vZGUgPT09IHRvTm9kZSAmJiBpdGVtLm91dHB1dEluZGV4ID09IG91dHB1dEluZGV4ICYmIGl0ZW0gIT0gdGhpcy50ZW1wTGluZTtcbiAgICB9KS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBuZXcgTGluZUZsb3codGhpcywgZnJvbU5vZGUsIHRvTm9kZSwgb3V0cHV0SW5kZXgpO1xuICB9XG4gIHB1YmxpYyBhZGRFdmVudCgpIHtcbiAgICAvKiBNb3VzZSBhbmQgVG91Y2ggQWN0aW9ucyAqL1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcbiAgICAvKiBDb250ZXh0IE1lbnUgKi9cbiAgICB0aGlzLmVsTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLmNvbnRleHRtZW51LmJpbmQodGhpcykpO1xuXG4gICAgLyogRHJvcCBEcmFwICovXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLmRyb3BFbmQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5lbE5vZGU/LmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy56b29tX2VudGVyLmJpbmQodGhpcykpO1xuICAgIC8qIERlbGV0ZSAqL1xuICAgIHRoaXMuZWxOb2RlPy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG4gIHB1YmxpYyBrZXlkb3duKGU6IGFueSkge1xuICAgIGlmIChlLmtleSA9PT0gJ0RlbGV0ZScgfHwgKGUua2V5ID09PSAnQmFja3NwYWNlJyAmJiBlLm1ldGFLZXkpKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkLmRlbGV0ZSgpO1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZC5kZWxldGUoKTtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMuem9vbV9vdXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFpvb20gSW5cbiAgICAgICAgdGhpcy56b29tX2luKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX3JlZnJlc2goKSB7XG4gICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuY2FudmFzX3gua2V5LCAodGhpcy5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0aGlzLmdldFpvb20oKSk7XG4gICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuY2FudmFzX3kua2V5LCAodGhpcy5nZXRZKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0aGlzLmdldFpvb20oKSk7XG4gICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0aGlzLmdldFpvb20oKTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgfVxuICBwdWJsaWMgem9vbV9pbigpIHtcbiAgICBpZiAodGhpcy5nZXRab29tKCkgPCB0aGlzLnpvb21fbWF4KSB7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy56b29tLmtleSwgKHRoaXMuZ2V0Wm9vbSgpICsgdGhpcy56b29tX3ZhbHVlKSk7XG4gICAgICB0aGlzLnpvb21fcmVmcmVzaCgpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9vdXQoKSB7XG4gICAgaWYgKHRoaXMuZ2V0Wm9vbSgpID4gdGhpcy56b29tX21pbikge1xuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuem9vbS5rZXksICh0aGlzLmdldFpvb20oKSAtIHRoaXMuem9vbV92YWx1ZSkpO1xuICAgICAgdGhpcy56b29tX3JlZnJlc2goKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21fcmVzZXQoKSB7XG4gICAgaWYgKHRoaXMuZ2V0Wm9vbSgpICE9IDEpIHtcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5wcm9wZXJ0aWVzLnpvb20ua2V5LCB0aGlzLnByb3BlcnRpZXMuem9vbS5kZWZhdWx0KTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIFN0YXJ0TW92ZShlOiBhbnkpIHtcbiAgICBpZiAodGhpcy50YWdJbmdvcmUuaW5jbHVkZXMoZS50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSB0aGlzLnBhcmVudC5nZXRUaW1lKCk7XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTm9uZSkge1xuICAgICAgaWYgKHRoaXMubm9kZVNlbGVjdGVkICYmIHRoaXMucGFyZW50LmNoZWNrUGFyZW50KGUudGFyZ2V0LCB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGUpKSB7XG4gICAgICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2RvdCcpKSB7XG4gICAgICAgICAgaWYgKHRoaXMucGFyZW50LmNoZWNrUGFyZW50KGUudGFyZ2V0LCB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGVJbnB1dHMpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xuICAgICAgICAgIHRoaXMudGVtcExpbmUgPSBuZXcgTGluZUZsb3codGhpcywgdGhpcy5ub2RlU2VsZWN0ZWQsIG51bGwpO1xuICAgICAgICAgIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXggPSArKGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9kZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkNhbnZhcztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIHRoaXMuZmxnRHJhcCA9IHRydWU7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIE1vdmUoZTogYW55KSB7XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICB0aGlzLmZsZ01vdmUgPSB0cnVlO1xuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGUuY2xpZW50WTtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLm1vdmVUeXBlKSB7XG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5nZXRYKCkgKyB0aGlzLkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgICAgIGxldCB5ID0gdGhpcy5nZXRZKCkgKyB0aGlzLkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyB4ICsgXCJweCwgXCIgKyB5ICsgXCJweCkgc2NhbGUoXCIgKyB0aGlzLmdldFpvb20oKSArIFwiKVwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLk5vZGU6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLnBvc195IC0gZV9wb3NfeSk7XG4gICAgICAgICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQ/LnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLkxpbmU6XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgICAgICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLmVsQ2FudmFzLm9mZnNldExlZnQgLSB4LCB0aGlzLmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS50b05vZGUgPSB0aGlzLm5vZGVPdmVyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIHRoaXMubW91c2VfeCA9IGVfcG9zX3g7XG4gICAgICB0aGlzLm1vdXNlX3kgPSBlX3Bvc195O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgRW5kTW92ZShlOiBhbnkpIHtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgodGhpcy5wYXJlbnQuZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDMwMCkgfHwgIXRoaXMuZmxnRHJhcCAmJiAhdGhpcy5mbGdNb3ZlKSB7XG4gICAgICBpZiAodGhpcy5tb3ZlVHlwZSAhPSBNb3ZlVHlwZS5Ob2RlICYmIHRoaXMuZmxnRHJhcClcbiAgICAgICAgdGhpcy5VblNlbGVjdCgpO1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyAgdGhpcy5VblNlbGVjdCgpO1xuICAgIGlmICh0aGlzLnRlbXBMaW5lICYmIHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTGluZSkge1xuICAgICAgaWYgKHRoaXMudGVtcExpbmUudG9Ob2RlICYmIHRoaXMudGVtcExpbmUudG9Ob2RlLmNoZWNrSW5wdXQoKSkge1xuICAgICAgICB0aGlzLkFkZExpbmUodGhpcy50ZW1wTGluZS5mcm9tTm9kZSwgdGhpcy50ZW1wTGluZS50b05vZGUsIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXgpO1xuICAgICAgfVxuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSBudWxsO1xuICAgIH1cbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMucHJvcGVydGllcy5jYW52YXNfeC5rZXksIHRoaXMuZ2V0WCgpICsgdGhpcy5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSkpO1xuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLnByb3BlcnRpZXMuY2FudmFzX3kua2V5LCB0aGlzLmdldFkoKSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpKTtcbiAgICB9XG4gICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIGNvbnRleHRtZW51KGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRmxvd0NvcmUgfSBmcm9tIFwiLi9jb21wb25lbnRzL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBDb250cm9sRmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvQ29udHJvbEZsb3dcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgUHJvcGVydHlGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9Qcm9wZXJ0eUZsb3dcIjtcbmltcG9ydCB7IFRhYkZsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL1RhYkZsb3dcIjtcbmltcG9ydCB7IFZpZXdGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9WaWV3Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgV29ya2VyRmxvdyBleHRlbmRzIEZsb3dDb3JlIHtcblxuICBwdWJsaWMgVmlldzogVmlld0Zsb3cgfCBudWxsO1xuICBwdWJsaWMgQ29udHJvbDogQ29udHJvbEZsb3cgfCBudWxsO1xuICBwdWJsaWMgUHJvcGVydHk6IFByb3BlcnR5RmxvdyB8IG51bGw7XG4gIHB1YmxpYyBUYWI6IFRhYkZsb3cgfCBudWxsO1xuICBwdWJsaWMgbW9kdWxlczogYW55ID0ge307XG4gIHB1YmxpYyBkYXRhTm9kZVNlbGVjdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBvcHRpb246IGFueTtcblxuICBwdWJsaWMgY2hlY2tQYXJlbnQobm9kZTogYW55LCBub2RlQ2hlY2s6IGFueSkge1xuICAgIGlmIChub2RlICYmIG5vZGVDaGVjaykge1xuICAgICAgaWYgKG5vZGUgPT0gbm9kZUNoZWNrKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGxldCBwYXJlbnQ6IGFueSA9IG5vZGU7XG4gICAgICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50KSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChub2RlQ2hlY2sgPT0gcGFyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZWxOb2RlID0gY29udGFpbmVyO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93XCIpO1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uIHx8IHtcbiAgICAgIGNvbnRyb2w6IHt9XG4gICAgfTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbFwiPlxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sX19oZWFkZXJcIj5Ob2RlIENvbnRyb2w8L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbF9fbGlzdFwiPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctZGVzZ2luXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1pdGVtc1wiPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy12aWV3XCI+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1wcm9wZXJ0eVwiPlxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1wcm9wZXJ0eV9faGVhZGVyXCI+UHJvcGVydGllczwvaDI+XG4gICAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1wcm9wZXJ0eV9fbGlzdFwiPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgYDtcbiAgICB0aGlzLlZpZXcgPSBuZXcgVmlld0Zsb3codGhpcyk7XG4gICAgdGhpcy5UYWIgPSBuZXcgVGFiRmxvdyh0aGlzKTtcbiAgICB0aGlzLkNvbnRyb2wgPSBuZXcgQ29udHJvbEZsb3codGhpcyk7XG4gICAgdGhpcy5Qcm9wZXJ0eSA9IG5ldyBQcm9wZXJ0eUZsb3codGhpcyk7XG4gICAgaWYgKE9iamVjdC5rZXlzKHRoaXMubW9kdWxlcykubGVuZ3RoID09IDApIHtcbiAgICAgIHRoaXMubmV3KCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBuZXcoKSB7XG4gICAgdGhpcy5UYWI/Lk5ld1Byb2plY3QoKTtcbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLlRhYj8uTG9hZFByb2plY3QoZGF0YSk7XG4gIH1cblxuICBwdWJsaWMgUHJvcGVydHlJbmZvKGRhdGE6IERhdGFGbG93KSB7XG4gICAgdGhpcy5Qcm9wZXJ0eT8uUHJvcGVydHlJbmZvKGRhdGEpO1xuICB9XG4gIHB1YmxpYyBnZXRPcHRpb24oa2V5Tm9kZTogYW55KSB7XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGNvbnRyb2wgPSB0aGlzLm9wdGlvbi5jb250cm9sW2tleU5vZGVdO1xuICAgIGlmICghY29udHJvbCkge1xuICAgICAgY29udHJvbCA9IE9iamVjdC52YWx1ZXModGhpcy5vcHRpb24uY29udHJvbClbMF07XG4gICAgfVxuICAgIGNvbnRyb2wua2V5ID0ga2V5Tm9kZTtcbiAgICByZXR1cm4gY29udHJvbDtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIHJldHVybiB0aGlzLlZpZXc/LnRvSnNvbigpO1xuICB9XG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gIH1cbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcbiAgICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICAgIGxldCBzOiBhbnkgPSBbXTtcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XG4gICAgfVxuICAgIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7ICAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICAgIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICAgIHJldHVybiB1dWlkO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7VUFFYSxRQUFRLENBQUE7SUFPTyxJ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
