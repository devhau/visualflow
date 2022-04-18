
  /**
   * @license
   * author: Nguyen Van Hau
   * workerflow.js v0.0.1
   * Released under the MIT license.
   */

var workerflow = (function () {
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
        Set(key, value, obj = null) {
            this.data[key] = value;
            setTimeout(() => {
                this.node.elNode?.querySelectorAll(`[node\\:model="${key}"]`).forEach((item) => {
                    if (item != obj)
                        item.value = value;
                });
                this.node.dispatch(this.node.Event.dataChange, { key, value, obj });
                this.node.dispatch(this.node.Event.change, { key, value, obj });
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
        Event = {
            ReUI: "ReUI",
            change: "change",
            updatePosition: "updatePosition",
            selected: "Selected",
            dataChange: "dataChange"
        };
        events;
        on(event, callback) {
            console.log(event);
            this.events.on(event, callback);
        }
        removeListener(event, callback) {
            this.events.removeListener(event, callback);
        }
        dispatch(event, details) {
            this.events.dispatch(event, details);
        }
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
        constructor(parent, id, option = null) {
            this.events = new EventFlow(this);
            this.option = option;
            this.parent = parent;
            this.nodeId = id;
            this.on(this.Event.change, (e, sender) => {
                this.parent.dispatch(this.parent.Event.change, {
                    ...e,
                    targetNode: sender
                });
            });
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
            if (this.data) {
                this.data.load(this.data.toJson());
            }
            else {
                this.data = new DataFlow(this);
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
            this.dispatch(this.Event.selected, {});
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
                this.dispatch(this.Event.updatePosition, { x: this.pos_x, y: this.pos_y });
                this.dispatch(this.Event.change, {});
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
        Event = {
            change: "change",
            selected: "Selected",
            updateView: "updateView"
        };
        events;
        on(event, callback) {
            this.events.on(event, callback);
        }
        removeListener(event, callback) {
            this.events.removeListener(event, callback);
        }
        dispatch(event, details) {
            this.events.dispatch(event, details);
        }
        constructor(parent) {
            this.parent = parent;
            this.events = new EventFlow(this);
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
            this.dispatch(this.Event.updateView, { x: this.canvas_x, y: this.canvas_y, zoom: this.zoom });
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
        option;
        events;
        on(event, callback) {
            this.events.on(event, callback);
        }
        removeListener(event, callback) {
            this.events.removeListener(event, callback);
        }
        dispatch(event, details) {
            this.events.dispatch(event, details);
        }
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
            this.events = new EventFlow(this);
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
    }

    return WorkerFlow;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbXBvbmVudHMvQ29udHJvbEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9UYWJGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvTGluZUZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9EYXRhRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL05vZGVGbG93LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvVmlld0Zsb3cudHMiLCIuLi9zcmMvV29ya2VyRmxvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xGbG93IHtcbiAgcHJpdmF0ZSBlbENvbnRyb2w6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBwYXJlbnQ6IFdvcmtlckZsb3c7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IFdvcmtlckZsb3cpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLmVsQ29udHJvbCA9IHBhcmVudC5jb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWNvbnRyb2xfX2xpc3QnKTtcbiAgICBpZiAodGhpcy5lbENvbnRyb2wpIHtcbiAgICAgIHRoaXMuZWxDb250cm9sLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHBhcmVudC5vcHRpb24uY29udHJvbCk7XG4gICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgbGV0IE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgTm9kZS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICAgIE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBrZXkpO1xuICAgICAgICBOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIik7XG4gICAgICAgIE5vZGUuaW5uZXJIVE1MID0gcGFyZW50Lm9wdGlvbi5jb250cm9sW2tleV0ubmFtZTtcbiAgICAgICAgTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLmRyYWdTdGFydC5iaW5kKHRoaXMpKVxuICAgICAgICBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgdGhpcy5lbENvbnRyb2w/LmFwcGVuZENoaWxkKE5vZGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkcmFnZW5kKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBkcmFnU3RhcnQoZTogYW55KSB7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuY2xvc2VzdChcIi53b3JrZXJmbG93LWNvbnRyb2xfX2l0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3QgPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwgZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKSk7XG4gICAgfVxuICB9XG59XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRGbG93IHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IGFueSkge1xuXG4gIH1cbiAgLyogRXZlbnRzICovXG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgZXZlbnQgbmFtZSBtdXN0IGJlIGEgc3RyaW5nLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBldmVudH1gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XG4gICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIGxldCBzZWxmID0gdGhpcy5wYXJlbnQ7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBjb25zb2xlLmVycm9yKGBUaGlzIGV2ZW50OiAke2V2ZW50fSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMsIHNlbGYpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFRhYkZsb3cge1xuICBwcml2YXRlIGVsVGFiOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogV29ya2VyRmxvdywgcHJpdmF0ZSBtb2R1bGVzOiBhbnkgPSB7fSkge1xuICAgIGlmICghdGhpcy5tb2R1bGVzKSB0aGlzLm1vZHVsZXMgPSB7fTtcbiAgICB0aGlzLmVsVGFiID0gcGFyZW50LmNvbnRhaW5lcj8ucXVlcnlTZWxlY3RvcignLndvcmtlcmZsb3ctaXRlbXMnKTtcbiAgICBpZiAodGhpcy5lbFRhYikge1xuICAgICAgdGhpcy5lbFRhYi5pbm5lckhUTUwgPSAnJztcbiAgICB9XG4gICAgdGhpcy5lbFRhYj8uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5DbGlja1RhYi5iaW5kKHRoaXMpKTtcbiAgfVxuICBwcml2YXRlIENsaWNrVGFiKGU6IGFueSkge1xuICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3dvcmtlcmZsb3ctaXRlbScpKSB7XG4gICAgICBsZXQgcHJvamVjdElkID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnKTtcbiAgICAgIHRoaXMuTG9hZFByb2plY3RCeUlkKHByb2plY3RJZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBMb2FkUHJvamVjdEJ5SWQocHJvamVjdElkOiBhbnkpIHtcbiAgICB0aGlzLmVsVGFiPy5xdWVyeVNlbGVjdG9yQWxsKCcuYWN0aXZlJykuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgdGhpcy5tb2R1bGVzW2l0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QnKT8udG9TdHJpbmcoKSB8fCAnJ10gPSB0aGlzLnBhcmVudC5WaWV3Py50b0pzb24oKTtcbiAgICAgIGl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfSlcbiAgICB0aGlzLmVsVGFiPy5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm9qZWN0PVwiJHtwcm9qZWN0SWR9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIHRoaXMucGFyZW50LlZpZXc/LmxvYWQodGhpcy5tb2R1bGVzW3Byb2plY3RJZF0pO1xuICB9XG4gIHB1YmxpYyBOZXdQcm9qZWN0KCkge1xuICAgIGxldCBkYXRhID0ge1xuICAgICAgaWQ6IHRoaXMucGFyZW50LmdldFV1aWQoKSxcbiAgICAgIG5hbWU6IGBwcm9qZWN0LSR7dGhpcy5wYXJlbnQuZ2V0VGltZSgpfWAsXG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICAgIHpvb206IDEsXG4gICAgICBub2RlczogW11cbiAgICB9XG4gICAgdGhpcy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuICBwdWJsaWMgTG9hZFByb2plY3QoZGF0YTogYW55KSB7XG4gICAgdGhpcy5lbFRhYj8ucXVlcnlTZWxlY3RvckFsbCgnLmFjdGl2ZScpLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIHRoaXMubW9kdWxlc1tpdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0Jyk/LnRvU3RyaW5nKCkgfHwgJyddID0gdGhpcy5wYXJlbnQuVmlldz8udG9Kc29uKCk7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH0pXG4gICAgaWYgKHRoaXMuZWxUYWI/LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3Q9XCIke2RhdGEuaWR9XCJdYCkpIHtcbiAgICAgIHRoaXMuZWxUYWI/LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3Q9XCIke2RhdGEuaWR9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1pdGVtXCIpO1xuICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIGl0ZW0uaW5uZXJIVE1MID0gZGF0YS5uYW1lO1xuICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdCcsIGRhdGEuaWQpO1xuICAgICAgdGhpcy5lbFRhYj8uYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfVxuICAgIHRoaXMubW9kdWxlc1tkYXRhLmlkXSA9IGRhdGE7XG4gICAgdGhpcy5wYXJlbnQuVmlldz8ubG9hZCh0aGlzLm1vZHVsZXNbZGF0YS5pZF0pO1xuICB9XG5cbn1cbiIsImltcG9ydCB7IE5vZGVGbG93IH0gZnJvbSBcIi4vTm9kZUZsb3dcIjtcbmltcG9ydCB7IFZpZXdGbG93IH0gZnJvbSBcIi4vVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIExpbmVGbG93IHtcbiAgcHVibGljIGVsQ29ubmVjdGlvbjogU1ZHRWxlbWVudCB8IG51bGw7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50O1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFZpZXdGbG93LCBwdWJsaWMgZnJvbU5vZGU6IE5vZGVGbG93LCBwdWJsaWMgdG9Ob2RlOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsLCBwdWJsaWMgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgICB0aGlzLmVsUGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbi5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXM/LmFwcGVuZENoaWxkKHRoaXMuZWxDb25uZWN0aW9uKTtcbiAgICB0aGlzLmZyb21Ob2RlLkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy50b05vZGU/LkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5TZWxlY3RMaW5lKHRoaXMpO1xuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIGlmICh0aGlzLmZyb21Ob2RlICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy5mcm9tTm9kZS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvTm9kZSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMudG9Ob2RlPy5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIHRoaXMuZWxDb25uZWN0aW9uPy5yZW1vdmUoKTtcbiAgICB0aGlzLmVsQ29ubmVjdGlvbiA9IG51bGw7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVRvKHRvX3g6IG51bWJlciwgdG9feTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuZnJvbU5vZGUuZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgZnJvbV94ID0gdGhpcy5mcm9tTm9kZS5wb3NfeCArIHRoaXMuZnJvbU5vZGUuZWxOb2RlLmNsaWVudFdpZHRoICsgNTtcbiAgICBsZXQgZnJvbV95ID0gdGhpcy5mcm9tTm9kZS5wb3NfeSArICh0aGlzLmZyb21Ob2RlLm91dHB1dCgpID4gMSA/ICgoKHRoaXMub3V0cHV0SW5kZXggLSAxKSAqIDIxKSArIDE1KSA6ICgyICsgdGhpcy5mcm9tTm9kZS5lbE5vZGUuY2xpZW50SGVpZ2h0IC8gMikpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZSgpIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG9Ob2RlICYmIHRoaXMudG9Ob2RlLmVsTm9kZSkge1xuICAgICAgbGV0IHRvX3ggPSB0aGlzLnRvTm9kZS5wb3NfeCAtIDU7XG4gICAgICBsZXQgdG9feSA9IHRoaXMudG9Ob2RlLnBvc195ICsgdGhpcy50b05vZGUuZWxOb2RlLmNsaWVudEhlaWdodCAvIDI7XG4gICAgICB0aGlzLnVwZGF0ZVRvKHRvX3gsIHRvX3kpO1xuICAgIH1cblxuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlRmxvdyB9IGZyb20gXCIuL05vZGVGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBEYXRhRmxvdyB7XG4gIHByaXZhdGUgZGF0YTogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIG5vZGU6IE5vZGVGbG93KSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLm5vZGUuZWxOb2RlPy5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5jaGFuZ2VJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIG9iaiA9IG51bGwpIHtcbiAgICB0aGlzLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5ub2RlLmVsTm9kZT8ucXVlcnlTZWxlY3RvckFsbChgW25vZGVcXFxcOm1vZGVsPVwiJHtrZXl9XCJdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGlmIChpdGVtICE9IG9iailcbiAgICAgICAgICBpdGVtLnZhbHVlID0gdmFsdWU7XG4gICAgICB9KTtcbiAgICAgIHRoaXMubm9kZS5kaXNwYXRjaCh0aGlzLm5vZGUuRXZlbnQuZGF0YUNoYW5nZSwgeyBrZXksIHZhbHVlLCBvYmogfSk7XG4gICAgICB0aGlzLm5vZGUuZGlzcGF0Y2godGhpcy5ub2RlLkV2ZW50LmNoYW5nZSwgeyBrZXksIHZhbHVlLCBvYmogfSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIGNoYW5nZUlucHV0KGU6IGFueSkge1xuICAgIHRoaXMuU2V0KGUudGFyZ2V0LmdldEF0dHJpYnV0ZShgbm9kZTptb2RlbGApLCBlLnRhcmdldC52YWx1ZSwgZS50YXJnZXQpO1xuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwge307XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLm5vZGUuZWxOb2RlPy5xdWVyeVNlbGVjdG9yQWxsKGBbbm9kZVxcXFw6bW9kZWxdYCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGl0ZW0udmFsdWUgPSB0aGlzLmRhdGFbaXRlbS5nZXRBdHRyaWJ1dGUoYG5vZGU6bW9kZWxgKV0gPz8gbnVsbDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XG5pbXBvcnQgeyBMaW5lRmxvdyB9IGZyb20gXCIuL0xpbmVGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL1ZpZXdGbG93XCI7XG5jb25zdCBnZXZhbCA9IGV2YWw7XG5leHBvcnQgY2xhc3MgTm9kZUZsb3cge1xuICBwcml2YXRlIHBhcmVudDogVmlld0Zsb3c7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVJbnB1dHM6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVPdXRwdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgZWxOb2RlQ29udGVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIG5vZGVJZDogc3RyaW5nO1xuICBwdWJsaWMgcG9zX3g6IG51bWJlciA9IDA7XG4gIHB1YmxpYyBwb3NfeTogbnVtYmVyID0gMDtcbiAgcHVibGljIGFyckxpbmU6IExpbmVGbG93W10gPSBbXTtcbiAgcHJpdmF0ZSBvcHRpb246IGFueTtcbiAgcHVibGljIGRhdGE6IERhdGFGbG93IHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBSZVVJOiBcIlJlVUlcIixcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXG4gICAgdXBkYXRlUG9zaXRpb246IFwidXBkYXRlUG9zaXRpb25cIixcbiAgICBzZWxlY3RlZDogXCJTZWxlY3RlZFwiLFxuICAgIGRhdGFDaGFuZ2U6IFwiZGF0YUNoYW5nZVwiXG4gIH07XG5cbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCBMaW5lSnNvbiA9IHRoaXMuYXJyTGluZS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uZnJvbU5vZGUgPT09IHRoaXMpLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAgIGZyb21Ob2RlOiBpdGVtLmZyb21Ob2RlLm5vZGVJZCxcbiAgICAgIHRvTm9kZTogaXRlbS50b05vZGU/Lm5vZGVJZCxcbiAgICAgIG91cHV0SW5kZXg6IGl0ZW0ub3V0cHV0SW5kZXhcbiAgICB9KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLm5vZGVJZCxcbiAgICAgIG5vZGU6IHRoaXMub3B0aW9uLmtleSxcbiAgICAgIGxpbmU6IExpbmVKc29uLFxuICAgICAgZGF0YTogdGhpcy5kYXRhPy50b0pzb24oKSxcbiAgICAgIHg6IHRoaXMucG9zX3gsXG4gICAgICB5OiB0aGlzLnBvc195XG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMubm9kZUlkID0gZGF0YT8uaWQgPz8gdGhpcy5ub2RlSWQ7XG4gICAgdGhpcy5vcHRpb24gPSB0aGlzLnBhcmVudC5nZXRPcHRpb24oZGF0YT8ubm9kZSk7XG4gICAgdGhpcy5kYXRhPy5sb2FkKGRhdGE/LmRhdGEpO1xuICAgIHRoaXMudXBkYXRlUG9zaXRpb24oZGF0YT8ueCwgZGF0YT8ueSwgdHJ1ZSk7XG4gICAgdGhpcy5pbml0T3B0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIG91dHB1dCgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24/Lm91dHB1dCA/PyAwO1xuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNSZW1vdmVQYXJlbnQgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5Ob2RlT3Zlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuTm9kZUxlYXZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGU/LnJlbW92ZSgpO1xuICAgIHRoaXMuYXJyTGluZSA9IFtdO1xuICAgIGlmIChpc1JlbW92ZVBhcmVudClcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVMaW5lKGxpbmU6IExpbmVGbG93KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7fSk7XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBWaWV3RmxvdywgaWQ6IHN0cmluZywgb3B0aW9uOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KHRoaXMpO1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMubm9kZUlkID0gaWQ7XG4gICAgdGhpcy5vbih0aGlzLkV2ZW50LmNoYW5nZSwgKGU6IGFueSwgc2VuZGVyOiBhbnkpID0+IHtcbiAgICAgIHRoaXMucGFyZW50LmRpc3BhdGNoKHRoaXMucGFyZW50LkV2ZW50LmNoYW5nZSwge1xuICAgICAgICAuLi5lLFxuICAgICAgICB0YXJnZXROb2RlOiBzZW5kZXJcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgdGhpcy5SZVVJKCk7XG4gIH1cbiAgcHVibGljIFJlVUkoKSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LW5vZGVcIik7XG4gICAgdGhpcy5lbE5vZGUuaWQgPSBgbm9kZS0ke3RoaXMubm9kZUlkfWA7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfaW5wdXRzJyk7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJpbnB1dHMgZG90XCI+PC9kaXY+YDtcbiAgICB0aGlzLmVsTm9kZUNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZUNvbnRlbnQuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX2NvbnRlbnQnKTtcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMuY2xhc3NMaXN0LmFkZCgnd29ya2VyZmxvdy1ub2RlX291dHB1dHMnKTtcbiAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJvdXRwdXRzIGRvdFwiPjwvZGl2PmA7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCB0aGlzLm5vZGVJZCk7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5wb3NfeX1weDsgbGVmdDogJHt0aGlzLnBvc194fXB4O2ApO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMuTm9kZU92ZXIuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuTm9kZUxlYXZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlSW5wdXRzKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZUNvbnRlbnQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlT3V0cHV0cyk7XG5cbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcz8uYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIGlmICh0aGlzLmRhdGEpIHtcbiAgICAgIHRoaXMuZGF0YS5sb2FkKHRoaXMuZGF0YS50b0pzb24oKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YSA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5pbml0T3B0aW9uKCk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LlJlVUksIHt9KTtcbiAgfVxuICBwdWJsaWMgY2hlY2tJbnB1dCgpIHtcbiAgICByZXR1cm4gISh0aGlzLm9wdGlvbj8uaW5wdXQgPT09IDApO1xuICB9XG4gIHByaXZhdGUgaW5pdE9wdGlvbigpIHtcblxuICAgIGlmICh0aGlzLmVsTm9kZUNvbnRlbnQgJiYgdGhpcy5vcHRpb24gJiYgdGhpcy5lbE5vZGVPdXRwdXRzKSB7XG4gICAgICB0aGlzLmVsTm9kZUNvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb24uaHRtbDtcbiAgICAgIGlmICh0aGlzLm9wdGlvbi5vdXRwdXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHMuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGZvciAobGV0IGluZGV4OiBudW1iZXIgPSAxOyBpbmRleCA8PSB0aGlzLm9wdGlvbi5vdXRwdXQ7IGluZGV4KyspIHtcbiAgICAgICAgICBsZXQgb3V0cHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgb3V0cHV0LnNldEF0dHJpYnV0ZSgnbm9kZScsIChpbmRleCkudG9TdHJpbmcoKSk7XG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJkb3RcIik7XG4gICAgICAgICAgb3V0cHV0LmNsYXNzTGlzdC5hZGQoXCJvdXRwdXRfXCIgKyAoaW5kZXgpKTtcbiAgICAgICAgICB0aGlzLmVsTm9kZU91dHB1dHMuYXBwZW5kQ2hpbGQob3V0cHV0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9uLmlucHV0ID09PSAwICYmIHRoaXMuZWxOb2RlSW5wdXRzKSB7XG4gICAgICAgIHRoaXMuZWxOb2RlSW5wdXRzLmlubmVySFRNTCA9ICcnO1xuICAgICAgfVxuXG4gICAgfVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5SdW5TY3JpcHQodGhpcywgdGhpcy5lbE5vZGUpO1xuICAgIH0sIDEwMCk7XG4gIH1cbiAgcHVibGljIFJ1blNjcmlwdChzZWxmTm9kZTogTm9kZUZsb3csIGVsOiBIVE1MRWxlbWVudCB8IG51bGwpIHtcbiAgICBpZiAodGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24uc2NyaXB0KSB7XG4gICAgICBnZXZhbCgnKG5vZGUsZWwpPT57JyArIHRoaXMub3B0aW9uLnNjcmlwdC50b1N0cmluZygpICsgJ30nKShzZWxmTm9kZSwgZWwpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgY2hlY2tLZXkoa2V5OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb24gJiYgdGhpcy5vcHRpb24ua2V5ID09IGtleTtcbiAgfVxuICBwdWJsaWMgTm9kZU92ZXIoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQubm9kZU92ZXIgPSB0aGlzO1xuICB9XG4gIHB1YmxpYyBOb2RlTGVhdmUoZTogYW55KSB7XG4gICAgdGhpcy5wYXJlbnQubm9kZU92ZXIgPSBudWxsO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LlNlbGVjdE5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnNlbGVjdGVkLCB7fSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgaWYgKGlDaGVjaykge1xuICAgICAgICB0aGlzLnBvc194ID0geDtcbiAgICAgICAgdGhpcy5wb3NfeSA9IHk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBvc194ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KTtcbiAgICAgICAgdGhpcy5wb3NfeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgLSB5KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMucG9zX3l9cHg7IGxlZnQ6ICR7dGhpcy5wb3NfeH1weDtgKTtcbiAgICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIGl0ZW0udXBkYXRlKCk7XG4gICAgICB9KVxuICAgICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnVwZGF0ZVBvc2l0aW9uLCB7IHg6IHRoaXMucG9zX3gsIHk6IHRoaXMucG9zX3kgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKHRoaXMuRXZlbnQuY2hhbmdlLCB7fSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBXb3JrZXJGbG93IH0gZnJvbSBcIi4uL1dvcmtlckZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuXG5leHBvcnQgZW51bSBNb3ZlVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb2RlID0gMSxcbiAgQ2FudmFzID0gMixcbiAgTGluZSA9IDMsXG59XG5leHBvcnQgY2xhc3MgVmlld0Zsb3cge1xuICBwcml2YXRlIGVsVmlldzogSFRNTEVsZW1lbnQ7XG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcGFyZW50OiBXb3JrZXJGbG93O1xuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XG4gIHB1YmxpYyBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBmbGdNb3ZlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgcHJpdmF0ZSB6b29tOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIHpvb21fbWF4OiBudW1iZXIgPSAxLjY7XG4gIHByaXZhdGUgem9vbV9taW46IG51bWJlciA9IDAuNTtcbiAgcHJpdmF0ZSB6b29tX3ZhbHVlOiBudW1iZXIgPSAwLjE7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIGNhbnZhc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGNhbnZhc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBsaW5lU2VsZWN0ZWQ6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbm9kZVNlbGVjdGVkOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgbm9kZU92ZXI6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZG90U2VsZWN0ZWQ6IE5vZGVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmVGbG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdGltZUZhc3RDbGljazogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwcm9qZWN0SWQ6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgcHJvamVjdE5hbWU6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgdGFnSW5nb3JlID0gWydpbnB1dCcsICdidXR0b24nLCAnYScsICd0ZXh0YXJlYSddO1xuXG4gIHB1YmxpYyByZWFkb25seSBFdmVudCA9IHtcbiAgICBjaGFuZ2U6IFwiY2hhbmdlXCIsXG4gICAgc2VsZWN0ZWQ6IFwiU2VsZWN0ZWRcIixcbiAgICB1cGRhdGVWaWV3OiBcInVwZGF0ZVZpZXdcIlxuICB9O1xuXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KHRoaXMpO1xuICAgIHRoaXMuZWxWaWV3ID0gdGhpcy5wYXJlbnQuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1kZXNnaW4gLndvcmtlcmZsb3ctdmlldycpIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsVmlldy5hcHBlbmRDaGlsZCh0aGlzLmVsQ2FudmFzKTtcbiAgICB0aGlzLmVsVmlldy50YWJJbmRleCA9IDA7XG4gICAgdGhpcy5hZGRFdmVudCgpO1xuICAgIHRoaXMuUmVzZXQoKTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcblxuICB9XG4gIHB1YmxpYyBnZXRPcHRpb24oa2V5Tm9kZTogYW55KSB7XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGNvbnRyb2wgPSB0aGlzLnBhcmVudC5vcHRpb24uY29udHJvbFtrZXlOb2RlXTtcbiAgICBpZiAoIWNvbnRyb2wpIHtcbiAgICAgIGNvbnRyb2wgPSBPYmplY3QudmFsdWVzKHRoaXMucGFyZW50Lm9wdGlvbi5jb250cm9sKVswXTtcbiAgICB9XG4gICAgY29udHJvbC5rZXkgPSBrZXlOb2RlO1xuICAgIHJldHVybiBjb250cm9sO1xuICB9XG4gIHByaXZhdGUgZHJvcEVuZChldjogYW55KSB7XG4gICAgbGV0IGtleU5vZGU6IHN0cmluZyB8IG51bGwgPSAnJztcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBrZXlOb2RlID0gdGhpcy5wYXJlbnQuZGF0YU5vZGVTZWxlY3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xuICAgIH1cbiAgICBsZXQgb3B0aW9uID0gdGhpcy5nZXRPcHRpb24oa2V5Tm9kZSk7XG4gICAgaWYgKG9wdGlvbiAmJiBvcHRpb24ub25seU5vZGUpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVzLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5jaGVja0tleShrZXlOb2RlKSkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBub2RlID0gdGhpcy5BZGROb2RlKG9wdGlvbik7XG5cbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgbGV0IHggPSB0aGlzLkNhbGNYKHRoaXMuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgIGxldCB5ID0gdGhpcy5DYWxjWSh0aGlzLmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcblxuICAgIG5vZGUudXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgbm9kZXMgPSB0aGlzLm5vZGVzLm1hcCgoaXRlbSkgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLnByb2plY3RJZCxcbiAgICAgIG5hbWU6IHRoaXMucHJvamVjdE5hbWUsXG4gICAgICB4OiB0aGlzLmNhbnZhc194LFxuICAgICAgeTogdGhpcy5jYW52YXNfeSxcbiAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgIG5vZGVzXG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuUmVzZXQoKTtcbiAgICB0aGlzLnByb2plY3RJZCA9IGRhdGE/LmlkID8/IHRoaXMucGFyZW50LmdldFV1aWQoKTtcbiAgICB0aGlzLnByb2plY3ROYW1lID0gZGF0YT8ubmFtZSA/PyBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gO1xuICAgIHRoaXMuY2FudmFzX3ggPSBkYXRhPy54ID8/IDA7XG4gICAgdGhpcy5jYW52YXNfeSA9IGRhdGE/LnkgPz8gMDtcbiAgICB0aGlzLnpvb20gPSBkYXRhPy56b29tID8/IDE7XG4gICAgdGhpcy5ub2RlcyA9IChkYXRhPy5ub2RlcyA/PyBbXSkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiAobmV3IE5vZGVGbG93KHRoaXMsIFwiXCIpKS5sb2FkKGl0ZW0pO1xuICAgIH0pO1xuICAgIChkYXRhPy5ub2RlcyA/PyBbXSkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAoaXRlbS5saW5lID8/IFtdKS5mb3JFYWNoKChsaW5lOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IGZyb21Ob2RlID0gdGhpcy5nZXROb2RlQnlJZChsaW5lLmZyb21Ob2RlKTtcbiAgICAgICAgbGV0IHRvTm9kZSA9IHRoaXMuZ2V0Tm9kZUJ5SWQobGluZS50b05vZGUpO1xuICAgICAgICBsZXQgb3VwdXRJbmRleCA9IGxpbmUub3VwdXRJbmRleCA/PyAwO1xuICAgICAgICBpZiAoZnJvbU5vZGUgJiYgdG9Ob2RlKSB7XG4gICAgICAgICAgdGhpcy5BZGRMaW5lKGZyb21Ob2RlLCB0b05vZGUsIG91cHV0SW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pO1xuICAgIHRoaXMudXBkYXRlVmlldygpO1xuICB9XG4gIHB1YmxpYyBSZXNldCgpIHtcbiAgICB0aGlzLm5vZGVzLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIHRoaXMucHJvamVjdElkID0gdGhpcy5wYXJlbnQuZ2V0VXVpZCgpO1xuICAgIHRoaXMucHJvamVjdE5hbWUgPSBgcHJvamVjdC0ke3RoaXMucGFyZW50LmdldFRpbWUoKX1gO1xuICAgIHRoaXMuY2FudmFzX3ggPSAwO1xuICAgIHRoaXMuY2FudmFzX3kgPSAwO1xuICAgIHRoaXMuem9vbSA9IDE7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG4gIH1cbiAgcHVibGljIGdldE5vZGVCeUlkKG5vZGVJZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZXM/LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5ub2RlSWQgPT0gbm9kZUlkKVswXTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVmlldygpIHtcbiAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgdGhpcy5jYW52YXNfeCArIFwicHgsIFwiICsgdGhpcy5jYW52YXNfeSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy56b29tICsgXCIpXCI7XG4gICAgdGhpcy5kaXNwYXRjaCh0aGlzLkV2ZW50LnVwZGF0ZVZpZXcsIHsgeDogdGhpcy5jYW52YXNfeCwgeTogdGhpcy5jYW52YXNfeSwgem9vbTogdGhpcy56b29tIH0pO1xuICB9XG4gIHByaXZhdGUgQ2FsY1gobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50V2lkdGggLyAodGhpcy5lbFZpZXcuY2xpZW50V2lkdGggKiB0aGlzLnpvb20pKTtcbiAgfVxuICBwcml2YXRlIENhbGNZKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudEhlaWdodCAvICh0aGlzLmVsVmlldy5jbGllbnRIZWlnaHQgKiB0aGlzLnpvb20pKTtcbiAgfVxuICBwcml2YXRlIGRyYWdvdmVyKGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3RMaW5lKCkge1xuICAgIGlmICh0aGlzLmxpbmVTZWxlY3RlZCkge1xuICAgICAgdGhpcy5saW5lU2VsZWN0ZWQuZWxQYXRoPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgIHRoaXMubGluZVNlbGVjdGVkID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0RG90KCkge1xuICAgIGlmICh0aGlzLmRvdFNlbGVjdGVkKSB7XG4gICAgICB0aGlzLmRvdFNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB0aGlzLmRvdFNlbGVjdGVkID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgcHVibGljIFVuU2VsZWN0Tm9kZSgpIHtcbiAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZCA9IG51bGw7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBVblNlbGVjdCgpIHtcbiAgICB0aGlzLlVuU2VsZWN0TGluZSgpO1xuICAgIHRoaXMuVW5TZWxlY3ROb2RlKCk7XG4gICAgdGhpcy5VblNlbGVjdERvdCgpO1xuICB9XG4gIHB1YmxpYyBTZWxlY3RMaW5lKG5vZGU6IExpbmVGbG93KSB7XG4gICAgdGhpcy5VblNlbGVjdCgpO1xuICAgIHRoaXMubGluZVNlbGVjdGVkID0gbm9kZTtcbiAgICB0aGlzLmxpbmVTZWxlY3RlZC5lbFBhdGguY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIH1cbiAgcHVibGljIFNlbGVjdE5vZGUobm9kZTogTm9kZUZsb3cpIHtcbiAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBub2RlO1xuICAgIHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIH1cbiAgcHVibGljIFNlbGVjdERvdChub2RlOiBOb2RlRmxvdykge1xuICAgIHRoaXMuVW5TZWxlY3QoKTtcbiAgICB0aGlzLmRvdFNlbGVjdGVkID0gbm9kZTtcbiAgICB0aGlzLmRvdFNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIH1cbiAgcHVibGljIFJlbW92ZU5vZGUobm9kZTogTm9kZUZsb3cpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yobm9kZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubm9kZXM7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUob3B0aW9uOiBhbnkgPSBudWxsKTogTm9kZUZsb3cge1xuICAgIGxldCBOb2RlSWQgPSBvcHRpb24gPyBvcHRpb24uaWQgOiB0aGlzLnBhcmVudC5nZXRVdWlkKCk7XG4gICAgbGV0IG5vZGUgPSBuZXcgTm9kZUZsb3codGhpcywgTm9kZUlkID8/IHRoaXMucGFyZW50LmdldFV1aWQoKSwgb3B0aW9uKTtcbiAgICB0aGlzLm5vZGVzID0gWy4uLnRoaXMubm9kZXMsIG5vZGVdO1xuICAgIHJldHVybiBub2RlO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGZyb21Ob2RlOiBOb2RlRmxvdywgdG9Ob2RlOiBOb2RlRmxvdywgb3V0cHV0SW5kZXg6IG51bWJlciA9IDApIHtcbiAgICBpZiAoZnJvbU5vZGUgPT0gdG9Ob2RlKSByZXR1cm47XG4gICAgaWYgKGZyb21Ob2RlLmFyckxpbmUuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICByZXR1cm4gaXRlbS50b05vZGUgPT09IHRvTm9kZSAmJiBpdGVtLm91dHB1dEluZGV4ID09IG91dHB1dEluZGV4ICYmIGl0ZW0gIT0gdGhpcy50ZW1wTGluZTtcbiAgICB9KS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBuZXcgTGluZUZsb3codGhpcywgZnJvbU5vZGUsIHRvTm9kZSwgb3V0cHV0SW5kZXgpO1xuICB9XG4gIHB1YmxpYyBhZGRFdmVudCgpIHtcbiAgICAvKiBNb3VzZSBhbmQgVG91Y2ggQWN0aW9ucyAqL1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuICAgIC8qIENvbnRleHQgTWVudSAqL1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcblxuICAgIC8qIERyb3AgRHJhcCAqL1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLmRyb3BFbmQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCB0aGlzLmRyYWdvdmVyLmJpbmQodGhpcykpO1xuICAgIC8qIFpvb20gTW91c2UgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuem9vbV9lbnRlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBEZWxldGUgKi9cbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG4gIHB1YmxpYyBrZXlkb3duKGU6IGFueSkge1xuICAgIGlmIChlLmtleSA9PT0gJ0RlbGV0ZScgfHwgKGUua2V5ID09PSAnQmFja3NwYWNlJyAmJiBlLm1ldGFLZXkpKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMubm9kZVNlbGVjdGVkLmRlbGV0ZSgpO1xuICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5saW5lU2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLmxpbmVTZWxlY3RlZC5kZWxldGUoKTtcbiAgICAgICAgdGhpcy5saW5lU2VsZWN0ZWQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMuem9vbV9vdXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFpvb20gSW5cbiAgICAgICAgdGhpcy56b29tX2luKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX3JlZnJlc2goKSB7XG4gICAgdGhpcy5jYW52YXNfeCA9ICh0aGlzLmNhbnZhc194IC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGhpcy56b29tO1xuICAgIHRoaXMuY2FudmFzX3kgPSAodGhpcy5jYW52YXNfeSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRoaXMuem9vbTtcbiAgICB0aGlzLnpvb21fbGFzdF92YWx1ZSA9IHRoaXMuem9vbTtcbiAgICB0aGlzLnVwZGF0ZVZpZXcoKTtcbiAgfVxuICBwdWJsaWMgem9vbV9pbigpIHtcbiAgICBpZiAodGhpcy56b29tIDwgdGhpcy56b29tX21heCkge1xuICAgICAgdGhpcy56b29tICs9IHRoaXMuem9vbV92YWx1ZTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX291dCgpIHtcbiAgICBpZiAodGhpcy56b29tID4gdGhpcy56b29tX21pbikge1xuICAgICAgdGhpcy56b29tIC09IHRoaXMuem9vbV92YWx1ZTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX3Jlc2V0KCkge1xuICAgIGlmICh0aGlzLnpvb20gIT0gMSkge1xuICAgICAgdGhpcy56b29tID0gMTtcbiAgICAgIHRoaXMuem9vbV9yZWZyZXNoKCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIFN0YXJ0TW92ZShlOiBhbnkpIHtcbiAgICBpZiAodGhpcy50YWdJbmdvcmUuaW5jbHVkZXMoZS50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSB0aGlzLnBhcmVudC5nZXRUaW1lKCk7XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTm9uZSkge1xuICAgICAgaWYgKHRoaXMubm9kZVNlbGVjdGVkICYmIHRoaXMucGFyZW50LmNoZWNrUGFyZW50KGUudGFyZ2V0LCB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGUpKSB7XG4gICAgICAgIGlmIChlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2RvdCcpKSB7XG4gICAgICAgICAgaWYgKHRoaXMucGFyZW50LmNoZWNrUGFyZW50KGUudGFyZ2V0LCB0aGlzLm5vZGVTZWxlY3RlZC5lbE5vZGVJbnB1dHMpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xuICAgICAgICAgIHRoaXMudGVtcExpbmUgPSBuZXcgTGluZUZsb3codGhpcywgdGhpcy5ub2RlU2VsZWN0ZWQsIG51bGwpO1xuICAgICAgICAgIHRoaXMudGVtcExpbmUub3V0cHV0SW5kZXggPSArKGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9kZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkNhbnZhcztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIHRoaXMuZmxnRHJhcCA9IHRydWU7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIE1vdmUoZTogYW55KSB7XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICB0aGlzLmZsZ01vdmUgPSB0cnVlO1xuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGUuY2xpZW50WTtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLm1vdmVUeXBlKSB7XG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5jYW52YXNfeCArIHRoaXMuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLmNhbnZhc195ICsgdGhpcy5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcbiAgICAgICAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgeCArIFwicHgsIFwiICsgeSArIFwicHgpIHNjYWxlKFwiICsgdGhpcy56b29tICsgXCIpXCI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5DYWxjWCh0aGlzLnBvc194IC0gZV9wb3NfeCk7XG4gICAgICAgICAgbGV0IHkgPSB0aGlzLkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcbiAgICAgICAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICAgICAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICAgICAgICB0aGlzLm5vZGVTZWxlY3RlZD8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuQ2FsY1godGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMuQ2FsY1kodGhpcy5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnVwZGF0ZVRvKHRoaXMuZWxDYW52YXMub2Zmc2V0TGVmdCAtIHgsIHRoaXMuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnRvTm9kZSA9IHRoaXMubm9kZU92ZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcbiAgICAgIHRoaXMubW91c2VfeSA9IGVfcG9zX3k7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBFbmRNb3ZlKGU6IGFueSkge1xuICAgIC8vZml4IEZhc3QgQ2xpY2tcbiAgICBpZiAoKCh0aGlzLnBhcmVudC5nZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMzAwKSB8fCAhdGhpcy5mbGdEcmFwICYmICF0aGlzLmZsZ01vdmUpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLlVuU2VsZWN0KCk7XG4gICAgaWYgKHRoaXMudGVtcExpbmUgJiYgdGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5MaW5lKSB7XG4gICAgICBpZiAodGhpcy50ZW1wTGluZS50b05vZGUgJiYgdGhpcy50ZW1wTGluZS50b05vZGUuY2hlY2tJbnB1dCgpKSB7XG4gICAgICAgIHRoaXMuQWRkTGluZSh0aGlzLnRlbXBMaW5lLmZyb21Ob2RlLCB0aGlzLnRlbXBMaW5lLnRvTm9kZSwgdGhpcy50ZW1wTGluZS5vdXRwdXRJbmRleCk7XG4gICAgICB9XG4gICAgICB0aGlzLnRlbXBMaW5lLmRlbGV0ZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZSA9IG51bGw7XG4gICAgfVxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBlX3Bvc194ID0gdGhpcy5tb3VzZV94O1xuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIHRoaXMuY2FudmFzX3ggPSB0aGlzLmNhbnZhc194ICsgdGhpcy5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSk7XG4gICAgICB0aGlzLmNhbnZhc195ID0gdGhpcy5jYW52YXNfeSArIHRoaXMuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpO1xuICAgIH1cbiAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwdWJsaWMgY29udGV4dG1lbnUoZTogYW55KSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBDb250cm9sRmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvQ29udHJvbEZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvRXZlbnRGbG93XCI7XG5pbXBvcnQgeyBUYWJGbG93IH0gZnJvbSBcIi4vY29tcG9uZW50cy9UYWJGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlckZsb3cge1xuXG4gIHB1YmxpYyBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgcHVibGljIFZpZXc6IFZpZXdGbG93IHwgbnVsbDtcbiAgcHVibGljIENvbnRyb2w6IENvbnRyb2xGbG93IHwgbnVsbDtcbiAgcHVibGljIHRhYjogVGFiRmxvdyB8IG51bGw7XG4gIHB1YmxpYyBkYXRhTm9kZVNlbGVjdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyBvcHRpb246IGFueTtcblxuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cblxuICBwdWJsaWMgY2hlY2tQYXJlbnQobm9kZTogYW55LCBub2RlQ2hlY2s6IGFueSkge1xuICAgIGlmIChub2RlICYmIG5vZGVDaGVjaykge1xuICAgICAgaWYgKG5vZGUgPT0gbm9kZUNoZWNrKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGxldCBwYXJlbnQ6IGFueSA9IG5vZGU7XG4gICAgICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50KSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChub2RlQ2hlY2sgPT0gcGFyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvd1wiKTtcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbiB8fCB7XG4gICAgICBjb250cm9sOiB7XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbFwiPlxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sX19oZWFkZXJcIj5Ob2RlIENvbnRyb2w8L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbF9fbGlzdFwiPlxuICAgICAgPGRpdiBkcmFnZ2FibGU9XCJ0cnVlXCI+Tm9kZSAxPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1kZXNnaW5cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1zXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1cIj5UaMO0bmcgdGluIG3hu5tpPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1cIj5UaMO0bmcgdGluIG3hu5tpMTIzPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXZpZXdcIj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGA7XG4gICAgdGhpcy5WaWV3ID0gbmV3IFZpZXdGbG93KHRoaXMpO1xuICAgIHRoaXMudGFiID0gbmV3IFRhYkZsb3codGhpcywgW10pO1xuICAgIHRoaXMuQ29udHJvbCA9IG5ldyBDb250cm9sRmxvdyh0aGlzKTtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3codGhpcyk7XG4gIH1cbiAgcHVibGljIG5ldygpIHtcbiAgICB0aGlzLnRhYj8uTmV3UHJvamVjdCgpO1xuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMudGFiPy5Mb2FkUHJvamVjdChkYXRhKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIHJldHVybiB0aGlzLlZpZXc/LnRvSnNvbigpO1xuICB9XG4gIHB1YmxpYyBnZXRUaW1lKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gIH1cbiAgcHVibGljIGdldFV1aWQoKTogc3RyaW5nIHtcbiAgICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICAgIGxldCBzOiBhbnkgPSBbXTtcbiAgICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XG4gICAgfVxuICAgIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7ICAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuICAgIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICAgIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICAgIHJldHVybiB1dWlkO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7VUFFYSxXQUFXLENBQUE7SUFDZCxJQUFBLFNBQVMsQ0FBaUM7SUFDMUMsSUFBQSxNQUFNLENBQWE7SUFDM0IsSUFBQSxXQUFBLENBQW1CLE1BQWtCLEVBQUE7SUFDbkMsUUFBQSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDOUUsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO0lBQ2xC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QUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlELFNBQUE7SUFDRCxRQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDWixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUM7WUFFbkMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0QixRQUFBLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDRjs7Ozs7Ozs7In0=
