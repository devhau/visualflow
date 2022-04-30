
  /**
   * @license
   * author: Nguyen Van Hau
   * visualflow.js v0.0.1-beta2
   * Released under the MIT license.
   */

var visualflow = (function () {
    'use strict';

    const EventEnum = {
        init: "init",
        dataChange: "dataChange",
        showProperty: "showProperty",
        change: "change",
        dispose: "dispose"
    };
    const DockEnum = {
        left: "vs-left",
        top: "vs-top",
        view: "vs-view",
        bottom: "vs-bottom",
        right: "vs-right",
    };
    const PropertyEnum = {
        main: "main_project"
    };

    class DockBase {
        main;
        elNode = document.createElement('div');
        constructor(container, main) {
            this.main = main;
            container.appendChild(this.elNode);
            this.elNode.innerHTML = 'DockBase';
        }
        BoxInfo(title, $callback) {
            this.elNode.classList.remove('vs-boxinfo');
            this.elNode.classList.add('vs-boxinfo');
            this.elNode.innerHTML = `<div class="vs-boxinfo_title">${title}</div>
    <div class="vs-boxinfo_content"></div>`;
            if ($callback) {
                $callback(this.elNode.querySelector('.vs-boxinfo_content'));
            }
        }
    }

    class ControlDock extends DockBase {
        main;
        constructor(container, main) {
            super(container, main);
            this.main = main;
            this.elNode.classList.add('vs-control');
            this.BoxInfo('Control', (node) => {
                let controls = this.main.getControlAll();
                Object.keys(controls).forEach((item) => {
                    let nodeItem = document.createElement('div');
                    nodeItem.classList.add('node-item');
                    nodeItem.setAttribute('draggable', 'true');
                    nodeItem.setAttribute('data-node', item);
                    nodeItem.innerHTML = controls[item].name;
                    nodeItem.addEventListener('dragstart', this.dragStart.bind(this));
                    nodeItem.addEventListener('dragend', this.dragend.bind(this));
                    node.appendChild(nodeItem);
                });
            });
        }
        dragend(e) {
            this.main.setControlChoose(null);
        }
        dragStart(e) {
            let key = e.target.closest(".node-item").getAttribute('data-node');
            this.main.setControlChoose(key);
            if (e.type !== "touchstart") {
                e.dataTransfer.setData("node", key);
            }
        }
    }

    var EditorType;
    (function (EditorType) {
        EditorType[EditorType["Label"] = 0] = "Label";
        EditorType[EditorType["Text"] = 1] = "Text";
        EditorType[EditorType["Inline"] = 2] = "Inline";
    })(EditorType || (EditorType = {}));
    class Editor {
        data;
        key;
        type;
        isEdit = false;
        elInput = null;
        elLabel = null;
        elNode = document.createElement('div');
        constructor(data, key, el = null, type = EditorType.Label, chagne = false) {
            this.data = data;
            this.key = key;
            this.type = type;
            this.data = data;
            this.data.onSafe(`${EventEnum.dataChange}_${key}`, this.changeData.bind(this));
            this.data.onSafe(EventEnum.dispose, this.dispose.bind(this));
            this.isEdit = type === EditorType.Text;
            this.elNode.classList.add('node-editor');
            if (chagne && el) {
                el.parentElement?.insertBefore(this.elNode, el);
                el.parentElement?.removeChild(el);
                el?.remove();
            }
            else if (el) {
                el.appendChild(this.elNode);
            }
            this.render();
        }
        render() {
            let data = this.data.Get(this.key);
            if (this.isEdit) {
                if (this.elLabel) {
                    this.elLabel.removeEventListener('dblclick', this.switchModeEdit.bind(this));
                    this.elLabel.remove();
                    this.elLabel = null;
                }
                if (this.elInput) {
                    this.elInput.value = data;
                    return;
                }
                this.elInput = document.createElement('input');
                this.elInput.classList.add('node-form-control');
                this.elInput.addEventListener('keydown', this.inputData.bind(this));
                this.elInput.value = data;
                this.elInput.setAttribute('node:model', this.key);
                this.elNode.appendChild(this.elInput);
            }
            else {
                if (this.elInput) {
                    this.elInput.removeEventListener('keyup', this.inputData.bind(this));
                    this.elInput.remove();
                    this.elInput = null;
                }
                if (this.elLabel) {
                    this.elLabel.innerHTML = data;
                    return;
                }
                this.elLabel = document.createElement('span');
                if (this.type == EditorType.Inline) {
                    this.elLabel.addEventListener('dblclick', this.switchModeEdit.bind(this));
                }
                this.elLabel.setAttribute('node:model', this.key);
                this.elLabel.innerHTML = data;
                this.elNode.appendChild(this.elLabel);
            }
        }
        switchModeEdit() {
            this.isEdit = true;
            this.render();
        }
        inputData(e) {
            setTimeout(() => {
                this.data.Set(this.key, e.target.value, this);
            });
        }
        changeData({ key, value, sender }) {
            this.render();
        }
        dispose() {
            this.elInput?.removeEventListener('keydown', this.inputData.bind(this));
            this.elLabel?.removeEventListener('dblclick', this.switchModeEdit.bind(this));
            this.data.removeListener(`${EventEnum.dataChange}_${this.key}`, this.changeData.bind(this));
            this.data.removeListener(EventEnum.dispose, this.dispose.bind(this));
        }
    }

    class PropertyDock extends DockBase {
        main;
        lastData;
        labelKeys = ['id', 'key'];
        dataJson = document.createElement('textarea');
        constructor(container, main) {
            super(container, main);
            this.main = main;
            this.elNode.classList.add('vs-property');
            this.BoxInfo('Property', (node) => {
                main.on(EventEnum.showProperty, (detail) => {
                    this.renderUI(node, detail.data);
                });
            });
        }
        renderUI(node, data) {
            if (this.lastData == data) {
                return;
            }
            this.lastData = data;
            node.innerHTML = '';
            let properties = data.getProperties();
            Object.keys(properties).forEach((key) => {
                let propertyItem = document.createElement('div');
                propertyItem.classList.add('property-item');
                let propertyLabel = document.createElement('div');
                propertyLabel.classList.add('property-label');
                propertyLabel.innerHTML = key;
                let propertyValue = document.createElement('div');
                propertyValue.classList.add('property-value');
                if (this.labelKeys.includes(key)) {
                    new Editor(data, key, propertyValue, EditorType.Label);
                }
                else {
                    new Editor(data, key, propertyValue, EditorType.Text);
                }
                propertyItem.appendChild(propertyLabel);
                propertyItem.appendChild(propertyValue);
                node.appendChild(propertyItem);
            });
            node.appendChild(this.dataJson);
            this.dataJson.value = data.toString();
            this.dataJson.classList.add('node-form-control');
            data.on(EventEnum.dataChange, () => this.dataJson.value = data.toString());
        }
    }

    class EventFlow {
        events = {};
        constructor() { }
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
                return false;
            }
            this.events[event].listeners.forEach((listener) => {
                listener(details);
            });
        }
    }

    class DataFlow {
        property;
        data = {};
        properties = null;
        events;
        getProperties() {
            return this.properties;
        }
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
        constructor(property = undefined, data = undefined) {
            this.property = property;
            this.events = new EventFlow();
            if (data) {
                this.load(data);
            }
        }
        InitData(data = null, properties = -1) {
            if (properties !== -1) {
                this.properties = properties;
            }
            this.load(data);
        }
        eventDataChange(key, keyChild, valueChild, senderChild, index = undefined) {
            if (index) {
                this.dispatch(`${EventEnum.dataChange}_${key}_${index}_${keyChild}`, {
                    key, keyChild, value: valueChild, sender: senderChild, index
                });
                this.dispatch(`${EventEnum.dataChange}_${key}_${index}`, {
                    key, keyChild, value: valueChild, sender: senderChild, index
                });
            }
            else {
                this.dispatch(`${EventEnum.dataChange}_${key}_${keyChild}`, {
                    key, keyChild, value: valueChild, sender: senderChild
                });
            }
            this.dispatch(`${EventEnum.dataChange}_${key}`, {
                key, keyChild, value: valueChild, sender: senderChild
            });
        }
        RemoveEventData(item, key, index = undefined) {
            if (!item)
                return;
            item.removeListener(`${EventEnum.dataChange}`, ({ key: keyChild, value: valueChild, sender: senderChild }) => this.eventDataChange(key, keyChild, valueChild, senderChild, index));
        }
        OnEventData(item, key, index = undefined) {
            if (!item)
                return;
            item.on(`${EventEnum.dataChange}`, ({ key: keyChild, value: valueChild, sender: senderChild }) => this.eventDataChange(key, keyChild, valueChild, senderChild, index));
        }
        BindEvent(value, key) {
            if (!value)
                return;
            if (value instanceof DataFlow) {
                this.OnEventData(value, key);
            }
            if (Array.isArray(value) && value.length > 0 && value[0] instanceof DataFlow) {
                value.forEach((item, index) => this.OnEventData(item, key, index));
            }
        }
        Set(key, value, sender = null) {
            if (this.data[key] != value) {
                if (this.data[key]) {
                    if (this.data[key] instanceof DataFlow) {
                        this.RemoveEventData(this.data[key], key);
                    }
                    if (Array.isArray(this.data[key]) && this.data[key].length > 0 && this.data[key][0] instanceof DataFlow) {
                        this.data[key].forEach((item, index) => this.RemoveEventData(item, key, index));
                    }
                }
                this.BindEvent(value, key);
            }
            this.data[key] = value;
            this.dispatch(`${EventEnum.dataChange}_${key}`, {
                key, value, sender
            });
            this.dispatch(EventEnum.dataChange, {
                key, value, sender
            });
            this.dispatch(EventEnum.change, {
                key, value, sender
            });
        }
        Get(key) {
            return this.data[key];
        }
        Append(key, value) {
            this.data[key] = [...this.data[key], value];
            this.BindEvent(value, key);
        }
        Remove(key, value) {
            this.data[key].indexOf(value);
            var index = this.data[key].indexOf(value);
            if (index > -1) {
                this.RemoveEventData(this.data[key][index], key);
                this.data[key].splice(index, 1);
            }
        }
        load(data) {
            this.data = {};
            if (!this.properties) {
                this.properties = this.property?.getPropertyByKey(data.key);
            }
            if (this.properties) {
                for (let key of Object.keys(this.properties)) {
                    this.data[key] = (data?.[key] ?? ((typeof this.properties[key]?.default === "function" ? this.properties[key]?.default() : this.properties[key]?.default) ?? ""));
                    this.BindEvent(this.data[key], key);
                }
            }
        }
        toString() {
            return JSON.stringify(this.toJson());
        }
        toJson() {
            let rs = {};
            for (let key of Object.keys(this.properties)) {
                rs[key] = this.Get(key);
                if (rs[key] instanceof DataFlow) {
                    rs[key] = rs[key].toJson();
                }
                if (Array.isArray(rs[key]) && rs[key].length > 0 && rs[key][0] instanceof DataFlow) {
                    rs[key] = rs[key].map((item) => item.toJson());
                }
            }
            return rs;
        }
        delete() {
            this.events = new EventFlow();
            this.data = {};
        }
    }

    class FlowCore {
        GetId() {
            return this.data.Get('id');
        }
        SetId(id) {
            return this.data.Set('id', id);
        }
        properties = {};
        data = new DataFlow();
        elNode = document.createElement('div');
        CheckElementChild(el) {
            return this.elNode == el || this.elNode.contains(el);
        }
        events;
        setData(data) {
            this.data = data;
            this.BindDataEvent();
            this.dispatch(`bind_data_event`, { data, sender: this });
        }
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
            this.data.on(EventEnum.dataChange, ({ key, value, sender }) => {
                setTimeout(() => {
                    this.dispatch(`${EventEnum.dataChange}_${key}`, {
                        type: 'data',
                        key, value, sender
                    });
                    this.dispatch(EventEnum.dataChange, {
                        type: 'data',
                        key, value, sender
                    });
                });
            });
            this.data.on(EventEnum.change, ({ key, value, sender }) => {
                setTimeout(() => {
                    this.dispatch(EventEnum.change, {
                        type: 'data',
                        key, value, sender
                    });
                });
            });
        }
        constructor() {
            this.events = new EventFlow();
            this.BindDataEvent();
        }
    }
    class BaseFlow extends FlowCore {
        parent;
        constructor(parent) {
            super();
            this.parent = parent;
        }
    }

    const getDate = () => (new Date());
    const getTime = () => getDate().getTime();

    class Line {
        from;
        fromIndex;
        to;
        toIndex;
        elNode = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        elPath = document.createElementNS('http://www.w3.org/2000/svg', "path");
        data = new DataFlow();
        curvature = 0.5;
        constructor(from, fromIndex = 0, to = undefined, toIndex = 0) {
            this.from = from;
            this.fromIndex = fromIndex;
            this.to = to;
            this.toIndex = toIndex;
            this.elPath.classList.add("main-path");
            this.elPath.addEventListener('mousedown', this.StartSelected.bind(this));
            this.elPath.addEventListener('touchstart', this.StartSelected.bind(this));
            this.elPath.setAttributeNS(null, 'd', '');
            this.elNode.classList.add("connection");
            this.elNode.appendChild(this.elPath);
            this.from.parent.elCanvas.appendChild(this.elNode);
            this.from.AddLine(this);
            this.to?.AddLine(this);
            this.data.InitData({}, {
                from: {
                    default: this.from.GetId()
                },
                fromIndex: {
                    default: this.fromIndex
                },
                to: {
                    default: this.to?.GetId()
                },
                toIndex: {
                    default: this.toIndex
                }
            });
            this.from.data.Append('lines', this.data);
        }
        updateTo(to_x, to_y) {
            if (!this.from || this.from.elNode == null)
                return;
            let { x: from_x, y: from_y } = this.from.getPostisionDot(this.fromIndex);
            var lineCurve = this.createCurvature(from_x, from_y, to_x, to_y, this.curvature, 'openclose');
            this.elPath.setAttributeNS(null, 'd', lineCurve);
        }
        UpdateUI() {
            //Postion output
            if (this.to && this.to.elNode) {
                let { x: to_x, y: to_y } = this.to.getPostisionDot(this.toIndex);
                this.updateTo(to_x, to_y);
            }
            return this;
        }
        Active(flg = true) {
            if (flg) {
                this.elPath.classList.add('active');
            }
            else {
                this.elPath.classList.remove('active');
            }
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
            this.from.data.Remove('lines', this.data);
            if (this.from != nodeThis)
                this.from.RemoveLine(this);
            if (this.to != nodeThis)
                this.to?.RemoveLine(this);
            this.elPath.remove();
            this.elNode.remove();
        }
        StartSelected(e) {
            this.from.parent.setLineChoose(this);
        }
        setNodeTo(node, toIndex) {
            this.to = node;
            this.toIndex = toIndex;
        }
        Clone() {
            if (this.to && this.toIndex) {
                return new Line(this.from, this.fromIndex, this.to, this.toIndex).UpdateUI();
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
    const Zoom = {
        max: 1.6,
        min: 0.6,
        value: 0.1,
        default: 1
    };
    class DesginerView_Event {
        parent;
        zoom_last_value = 1;
        timeFastClick = 0;
        tagIngore = ['input', 'button', 'a', 'textarea'];
        moveType = MoveType.None;
        flgDrap = false;
        flgMove = false;
        av_x = 0;
        av_y = 0;
        pos_x = 0;
        pos_y = 0;
        mouse_x = 0;
        mouse_y = 0;
        tempLine;
        constructor(parent) {
            this.parent = parent;
            /* Mouse and Touch Actions */
            this.parent.elNode.addEventListener('mouseup', this.EndMove.bind(this));
            this.parent.elNode.addEventListener('mouseleave', this.EndMove.bind(this));
            this.parent.elNode.addEventListener('mousemove', this.Move.bind(this));
            this.parent.elNode.addEventListener('mousedown', this.StartMove.bind(this));
            this.parent.elNode.addEventListener('touchend', this.EndMove.bind(this));
            this.parent.elNode.addEventListener('touchmove', this.Move.bind(this));
            this.parent.elNode.addEventListener('touchstart', this.StartMove.bind(this));
            /* Context Menu */
            this.parent.elNode.addEventListener('contextmenu', this.contextmenu.bind(this));
            /* Drop Drap */
            this.parent.elNode.addEventListener('drop', this.node_dropEnd.bind(this));
            this.parent.elNode.addEventListener('dragover', this.node_dragover.bind(this));
            /* Zoom Mouse */
            this.parent.elNode.addEventListener('wheel', this.zoom_enter.bind(this));
            /* Delete */
            this.parent.elNode.addEventListener('keydown', this.keydown.bind(this));
        }
        contextmenu(ev) { ev.preventDefault(); }
        node_dragover(ev) { ev.preventDefault(); }
        node_dropEnd(ev) {
            ev.preventDefault();
            let keyNode = this.parent.main.getControlChoose();
            if (!keyNode && ev.type !== "touchend") {
                keyNode = ev.dataTransfer.getData("node");
            }
            if (!keyNode)
                return;
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
            let x = this.parent.CalcX(this.parent.elCanvas.getBoundingClientRect().x - e_pos_x);
            let y = this.parent.CalcY(this.parent.elCanvas.getBoundingClientRect().y - e_pos_y);
            if (this.parent.checkOnlyNode(keyNode)) {
                return;
            }
            let nodeItem = this.parent.AddNode(keyNode);
            nodeItem.updatePosition(x, y);
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
        zoom_refresh(flg = 0) {
            let temp_zoom = flg == 0 ? Zoom.default : (this.parent.getZoom() + Zoom.value * flg);
            if (Zoom.max >= temp_zoom && temp_zoom >= Zoom.min) {
                this.parent.setX((this.parent.getX() / this.zoom_last_value) * temp_zoom);
                this.parent.setY((this.parent.getY() / this.zoom_last_value) * temp_zoom);
                this.zoom_last_value = temp_zoom;
                this.parent.setZoom(this.zoom_last_value);
            }
        }
        zoom_in() {
            this.zoom_refresh(1);
        }
        zoom_out() {
            this.zoom_refresh(-1);
        }
        zoom_reset() {
            this.zoom_refresh(0);
        }
        StartMove(ev) {
            if (this.tagIngore.includes(ev.target.tagName.toLowerCase())) {
                return;
            }
            this.timeFastClick = getTime();
            if (ev.target.classList.contains('main-path')) {
                return;
            }
            if (ev.type === "touchstart") {
                this.pos_x = ev.touches[0].clientX;
                this.pos_y = ev.touches[0].clientY;
            }
            else {
                this.pos_x = ev.clientX;
                this.pos_y = ev.clientY;
            }
            this.moveType = MoveType.Canvas;
            let nodeChoose = this.parent.getNodeChoose();
            if (nodeChoose && nodeChoose.CheckElementChild(ev.target)) {
                this.moveType = MoveType.Node;
            }
            else {
                this.parent.setNodeChoose(undefined);
            }
            if (nodeChoose && this.moveType == MoveType.Node && ev.target.classList.contains("node-dot")) {
                this.moveType = MoveType.Line;
                let fromIndex = ev.target.getAttribute('node');
                this.tempLine = new Line(nodeChoose, fromIndex);
            }
            if (this.moveType == MoveType.Canvas) {
                this.av_x = this.parent.getX();
                this.av_y = this.parent.getY();
            }
            this.flgDrap = true;
            this.flgMove = false;
        }
        Move(ev) {
            if (!this.flgDrap)
                return;
            this.flgMove = true;
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
            switch (this.moveType) {
                case MoveType.Canvas:
                    {
                        let x = this.av_x + this.parent.CalcX(-(this.pos_x - e_pos_x));
                        let y = this.av_y + this.parent.CalcY(-(this.pos_y - e_pos_y));
                        this.parent.setX(x);
                        this.parent.setY(y);
                        break;
                    }
                case MoveType.Node:
                    {
                        let x = this.parent.CalcX(this.pos_x - e_pos_x);
                        let y = this.parent.CalcY(this.pos_y - e_pos_y);
                        this.pos_x = e_pos_x;
                        this.pos_y = e_pos_y;
                        this.parent.getNodeChoose()?.updatePosition(x, y);
                        break;
                    }
                case MoveType.Line:
                    {
                        if (this.tempLine) {
                            let x = this.parent.CalcX(this.parent.elCanvas.getBoundingClientRect().x - e_pos_x);
                            let y = this.parent.CalcY(this.parent.elCanvas.getBoundingClientRect().y - e_pos_y);
                            this.tempLine.updateTo(this.parent.elCanvas.offsetLeft - x, this.parent.elCanvas.offsetTop - y);
                            let nodeEl = ev.target.closest('[node-id]');
                            let nodeId = nodeEl?.getAttribute('node-id');
                            let nodeTo = nodeId ? this.parent.GetNodeById(nodeId) : undefined;
                            if (nodeTo && ev.target.classList.contains("node-dot")) {
                                let toIndex = ev.target.getAttribute('node');
                                this.tempLine.setNodeTo(nodeTo, toIndex);
                            }
                            else {
                                let toIndex = nodeEl?.querySelector('.node-dot')?.[0]?.getAttribute('node');
                                this.tempLine.setNodeTo(nodeTo, toIndex);
                            }
                        }
                        break;
                    }
            }
            if (ev.type === "touchmove") {
                this.mouse_x = e_pos_x;
                this.mouse_y = e_pos_y;
            }
        }
        EndMove(ev) {
            if (!this.flgDrap)
                return;
            //fix Fast Click
            if (((getTime() - this.timeFastClick) < 100) || !this.flgMove) {
                this.moveType = MoveType.None;
                this.flgDrap = false;
                this.flgMove = false;
                return;
            }
            let e_pos_x = 0;
            let e_pos_y = 0;
            if (ev.type === "touchend") {
                e_pos_x = this.mouse_x;
                e_pos_y = this.mouse_y;
            }
            else {
                e_pos_x = ev.clientX;
                e_pos_y = ev.clientY;
            }
            if (this.moveType === MoveType.Canvas) {
                let x = this.av_x + this.parent.CalcX(-(this.pos_x - e_pos_x));
                let y = this.av_y + this.parent.CalcY(-(this.pos_y - e_pos_y));
                this.parent.setX(x);
                this.parent.setY(y);
                this.av_x = 0;
                this.av_y = 0;
            }
            if (this.tempLine) {
                this.tempLine.Clone();
                this.tempLine.delete();
                this.tempLine = undefined;
            }
            this.pos_x = e_pos_x;
            this.pos_y = e_pos_y;
            this.moveType = MoveType.None;
            this.flgDrap = false;
            this.flgMove = false;
        }
        keydown(ev) {
            if (ev.key === 'Delete' || (ev.key === 'Backspace' && ev.metaKey)) {
                ev.preventDefault();
                this.parent.getNodeChoose()?.delete();
                this.parent.getLineChoose()?.delete();
            }
            if (ev.key === 'F2') {
                ev.preventDefault();
                console.log(this.parent.data.toJson());
            }
        }
    }

    class Node extends BaseFlow {
        keyNode;
        /**
         * GET SET for Data
         */
        getY() {
            return +this.data.Get('y');
        }
        setY(value) {
            return this.data.Set('y', value, this);
        }
        getX() {
            return +this.data.Get('x');
        }
        setX(value) {
            return this.data.Set('x', value, this);
        }
        CheckKey(key) {
            return this.data.Get('key') == key;
        }
        elContent;
        arrLine = [];
        option = {};
        constructor(parent, keyNode, data = {}) {
            super(parent);
            this.keyNode = keyNode;
            this.option = this.parent.main.getControlNodeByKey(keyNode);
            this.properties = this.option?.properties;
            this.data.InitData(data, this.properties);
            this.data.on(EventEnum.dataChange, this.renderUI.bind(this));
            this.elNode.classList.add('vs-node');
            if (this.option.class) {
                this.elNode.classList.add(this.option.class);
            }
            this.parent.elCanvas.appendChild(this.elNode);
            this.elNode.setAttribute('node-id', this.GetId());
            this.elNode.addEventListener('mousedown', () => this.parent.setNodeChoose(this));
            this.elNode.addEventListener('touchstart', () => this.parent.setNodeChoose(this));
            this.parent.data.Append('nodes', this.data);
            this.renderUI();
        }
        renderUI() {
            this.elNode.setAttribute('style', `display:none;`);
            this.elNode.innerHTML = `
      <div class="node-left">
        <div class="node-dot" node="4000"></div>
      </div>
      <div class="node-container">
        <div class="node-top">
          <div class="node-dot" node="1000"></div>
        </div>
        <div class="node-content">${this.option.html}</div>
        <div class="node-bottom">
          <div class="node-dot" node="2000"></div>
        </div>
      </div>
      <div class="node-right">
        <div class="node-dot"  node="3000"></div>
      </div>
    `;
            this.elContent = this.elNode.querySelector('.node-content');
            this.UpdateUI();
        }
        updatePosition(x, y, iCheck = false) {
            if (this.elNode) {
                if (iCheck) {
                    if (x !== this.getX()) {
                        this.setX(x);
                    }
                    if (y !== this.getY()) {
                        this.setX(y);
                    }
                }
                else {
                    this.setY((this.elNode.offsetTop - y));
                    this.setX((this.elNode.offsetLeft - x));
                }
            }
        }
        Active(flg = true) {
            if (flg) {
                this.elNode.classList.add('active');
            }
            else {
                this.elNode.classList.remove('active');
            }
        }
        RemoveLine(line) {
            var index = this.arrLine.indexOf(line);
            if (index > -1) {
                this.arrLine.splice(index, 1);
            }
            return this.arrLine;
        }
        AddLine(line) {
            this.arrLine = [...this.arrLine, line];
        }
        getPostisionDot(index = 0) {
            let elDot = this.elNode?.querySelector(`.node-dot[node="${index}"]`);
            if (elDot) {
                let y = (this.elNode.offsetTop + elDot.offsetTop + 10);
                let x = (this.elNode.offsetLeft + elDot.offsetLeft + 10);
                return { x, y };
            }
            return {};
        }
        UpdateUI() {
            this.elNode.setAttribute('style', `top: ${this.getY()}px; left: ${this.getX()}px;`);
            this.arrLine.forEach((item) => {
                item.UpdateUI();
            });
        }
        delete(isRemoveParent = true) {
            this.arrLine.forEach((item) => item.delete(this));
            this.data.delete();
            this.elNode.removeEventListener('mousedown', () => this.parent.setNodeChoose(this));
            this.elNode.removeEventListener('touchstart', () => this.parent.setNodeChoose(this));
            this.elNode.remove();
            this.arrLine = [];
            if (isRemoveParent)
                this.parent.RemoveNode(this);
            this.dispatch(EventEnum.change, {});
        }
    }

    class DesginerView extends FlowCore {
        main;
        /**
         * GET SET for Data
         */
        getZoom() {
            return +this.data.Get('zoom');
        }
        setZoom(value) {
            return this.data.Set('zoom', value, this);
        }
        getY() {
            return +this.data.Get('y');
        }
        setY(value) {
            return this.data.Set('y', value, this);
        }
        getX() {
            return +this.data.Get('x');
        }
        setX(value) {
            return this.data.Set('x', value, this);
        }
        view_event;
        lineChoose;
        setLineChoose(node) {
            if (this.lineChoose)
                this.lineChoose.Active(false);
            this.lineChoose = node;
            if (this.lineChoose) {
                this.lineChoose.Active();
                this.setNodeChoose(undefined);
            }
        }
        getLineChoose() {
            return this.lineChoose;
        }
        nodes = [];
        nodeChoose;
        setNodeChoose(node) {
            if (this.nodeChoose)
                this.nodeChoose.Active(false);
            this.nodeChoose = node;
            if (this.nodeChoose) {
                this.nodeChoose.Active();
                this.setLineChoose(undefined);
                this.dispatch(EventEnum.showProperty, { data: this.nodeChoose.data });
            }
            else {
                this.dispatch(EventEnum.showProperty, { data: this.data });
            }
        }
        getNodeChoose() {
            return this.nodeChoose;
        }
        AddNode(keyNode, data = {}) {
            return this.InsertNode(new Node(this, keyNode, data));
        }
        InsertNode(node) {
            this.nodes = [...this.nodes, node];
            return node;
        }
        RemoveNode(node) {
            var index = this.nodes.indexOf(node);
            this.data.Remove('nodes', node);
            if (index > -1) {
                this.nodes.splice(index, 1);
            }
            return this.nodes;
        }
        /**
         * Varibute
        */
        elCanvas = document.createElement('div');
        constructor(elNode, main) {
            super();
            this.main = main;
            this.elNode = elNode;
            let properties = this.main.getPropertyByKey(PropertyEnum.main);
            this.data.InitData({}, properties);
            this.RenderUI();
            this.UpdateUI();
            this.on(EventEnum.dataChange, this.RenderUI.bind(this));
            this.view_event = new DesginerView_Event(this);
        }
        updateView(x, y, zoom) {
            this.elCanvas.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
        }
        UpdateUI() {
            setTimeout(() => {
                this.updateView(this.getX(), this.getY(), this.getZoom());
            });
        }
        RenderUI() {
            this.elNode.innerHTML = '';
            this.elNode.classList.remove('desginer-view');
            this.elCanvas.classList.remove("desginer-canvas");
            this.elNode.classList.add('desginer-view');
            this.elCanvas.classList.add("desginer-canvas");
            this.elNode.appendChild(this.elCanvas);
            this.elNode.tabIndex = 0;
            this.UpdateUI();
        }
        CalcX(number) {
            return number * (this.elCanvas.clientWidth / (this.elNode?.clientWidth * this.getZoom()));
        }
        CalcY(number) {
            return number * (this.elCanvas.clientHeight / (this.elNode?.clientHeight * this.getZoom()));
        }
        GetAllNode() {
            return this.nodes || [];
        }
        GetNodeById(id) {
            return this.GetAllNode().filter(node => node.GetId() == id)?.[0];
        }
        checkOnlyNode(key) {
            return (this.main.getControlByKey(key).onlyNode) && this.nodes.filter(item => item.CheckKey(key)).length > 0;
        }
    }

    class ViewDock extends DockBase {
        main;
        constructor(container, main) {
            super(container, main);
            this.main = main;
            new DesginerView(this.elNode, main).on(EventEnum.showProperty, (data) => main.dispatch(EventEnum.showProperty, data));
        }
    }

    class DockManager {
        container;
        main;
        $dockManager = {};
        constructor(container, main) {
            this.container = container;
            this.main = main;
        }
        reset() {
            this.$dockManager = {};
            this.addDock(DockEnum.left, ControlDock);
            this.addDock(DockEnum.right, PropertyDock);
            this.addDock(DockEnum.view, ViewDock);
            this.addDock(DockEnum.top, DockBase);
            this.addDock(DockEnum.bottom, DockBase);
            this.RenderUI();
        }
        addDock($key, $view) {
            if (!this.$dockManager[$key])
                this.$dockManager[$key] = [];
            this.$dockManager[$key] = [...this.$dockManager[$key], $view];
        }
        RenderUI() {
            this.container.innerHTML = `
      <div class="vs-left vs-dock"></div>
      <div class="vs-content">
        <div class="vs-top vs-dock"></div>
        <div class="vs-view vs-dock"></div>
        <div class="vs-bottom vs-dock"></div>
      </div>
      <div class="vs-right vs-dock"></div>
    `;
            Object.keys(this.$dockManager).forEach((key) => {
                let querySelector = this.container.querySelector(`.${key}`);
                if (querySelector) {
                    this.$dockManager[key].forEach(($item) => {
                        new $item(querySelector, this.main);
                    });
                }
            });
        }
    }

    class VisualFlow {
        container;
        $properties = {};
        $control = {};
        $controlChoose = null;
        $dockManager;
        events;
        getDockManager() {
            return this.$dockManager;
        }
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
        getControlAll() {
            return this.$control ?? {};
        }
        constructor(container, option = null) {
            this.container = container;
            this.events = new EventFlow();
            //set project
            this.$properties[PropertyEnum.main] = {
                ...(option?.properties || {}),
                id: {
                    default: () => getTime()
                },
                name: {
                    default: ""
                },
                x: {
                    default: 0
                },
                y: {
                    default: 0
                },
                zoom: {
                    default: 1
                },
                nodes: {
                    default: []
                }
            };
            // set control
            this.$control = option?.control || {};
            Object.keys(this.$control).forEach((key) => {
                this.$properties[`node_${key}`] = {
                    ...(this.$control[key].properties || {}),
                    id: {
                        default: () => getTime()
                    },
                    key: {
                        default: key
                    },
                    name: {
                        default: ""
                    },
                    x: {
                        default: 0
                    },
                    y: {
                        default: 0
                    },
                    lines: {
                        default: []
                    }
                };
            });
            this.container.classList.remove('vs-container');
            this.container.classList.add('vs-container');
            this.$dockManager = new DockManager(this.container, this);
            this.$dockManager.reset();
        }
        setControlChoose(key) {
            this.$controlChoose = key;
        }
        getControlChoose() {
            return this.$controlChoose;
        }
        getControlByKey(key) {
            return this.$control[key] || {};
        }
        getControlNodeByKey(key) {
            return {
                ...this.getControlByKey(key),
                properties: this.getPropertyByKey(`node_${key}`)
            };
        }
        getPropertyByKey(key) {
            return this.$properties[key];
        }
    }

    return VisualFlow;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvQ29uc3RhbnQudHMiLCIuLi9zcmMvZG9jay9Eb2NrQmFzZS50cyIsIi4uL3NyYy9kb2NrL0NvbnRyb2xEb2NrLnRzIiwiLi4vc3JjL2NvcmUvRWRpdG9yLnRzIiwiLi4vc3JjL2RvY2svUHJvcGVydHlEb2NrLnRzIiwiLi4vc3JjL2NvcmUvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvcmUvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29yZS9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb3JlL1V0aWxzLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0xpbmUudHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3X0V2ZW50LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL05vZGUudHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3LnRzIiwiLi4vc3JjL2RvY2svVmlld0RvY2sudHMiLCIuLi9zcmMvZG9jay9Eb2NrTWFuYWdlci50cyIsIi4uL3NyYy9WaXN1YWxGbG93LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBFdmVudEVudW0gPSB7XG4gIGluaXQ6IFwiaW5pdFwiLFxuICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcbiAgc2hvd1Byb3BlcnR5OiBcInNob3dQcm9wZXJ0eVwiLFxuICBjaGFuZ2U6IFwiY2hhbmdlXCIsXG4gIGRpc3Bvc2U6IFwiZGlzcG9zZVwiXG59XG5cbmV4cG9ydCBjb25zdCBEb2NrRW51bSA9IHtcbiAgbGVmdDogXCJ2cy1sZWZ0XCIsXG4gIHRvcDogXCJ2cy10b3BcIixcbiAgdmlldzogXCJ2cy12aWV3XCIsXG4gIGJvdHRvbTogXCJ2cy1ib3R0b21cIixcbiAgcmlnaHQ6IFwidnMtcmlnaHRcIixcbn1cblxuZXhwb3J0IGNvbnN0IFByb3BlcnR5RW51bSA9IHtcbiAgbWFpbjogXCJtYWluX3Byb2plY3RcIlxufTtcbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIERvY2tCYXNlIHtcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJ0RvY2tCYXNlJztcbiAgfVxuICBwdWJsaWMgQm94SW5mbyh0aXRsZTogc3RyaW5nLCAkY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ3ZzLWJveGluZm8nKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ib3hpbmZvJyk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJ2cy1ib3hpbmZvX3RpdGxlXCI+JHt0aXRsZX08L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwidnMtYm94aW5mb19jb250ZW50XCI+PC9kaXY+YDtcbiAgICBpZiAoJGNhbGxiYWNrKSB7XG4gICAgICAkY2FsbGJhY2sodGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnZzLWJveGluZm9fY29udGVudCcpKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1jb250cm9sJyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdDb250cm9sJywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBsZXQgY29udHJvbHMgPSB0aGlzLm1haW4uZ2V0Q29udHJvbEFsbCgpO1xuICAgICAgT2JqZWN0LmtleXMoY29udHJvbHMpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XG4gICAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcbiAgICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBpdGVtKTtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gY29udHJvbHNbaXRlbV0ubmFtZTtcbiAgICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcbiAgICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsIHRoaXMuZHJhZ2VuZC5iaW5kKHRoaXMpKVxuICAgICAgICBub2RlLmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgZHJhZ2VuZChlOiBhbnkpIHtcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgZHJhZ1N0YXJ0KGU6IGFueSkge1xuICAgIGxldCBrZXkgPSBlLnRhcmdldC5jbG9zZXN0KFwiLm5vZGUtaXRlbVwiKS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgIHRoaXMubWFpbi5zZXRDb250cm9sQ2hvb3NlKGtleSk7XG4gICAgaWYgKGUudHlwZSAhPT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJub2RlXCIsIGtleSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBCYXNlRmxvdywgRmxvd0NvcmUgfSBmcm9tIFwiLi9CYXNlRmxvd1wiXG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgTE9HIH0gZnJvbSBcIi4vVXRpbHNcIjtcbmV4cG9ydCBlbnVtIEVkaXRvclR5cGUge1xuICBMYWJlbCxcbiAgVGV4dCxcbiAgSW5saW5lXG59XG5leHBvcnQgY2xhc3MgRWRpdG9yIHtcbiAgcHJpdmF0ZSBpc0VkaXQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBlbElucHV0OiBIVE1MRGF0YUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBlbExhYmVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBkYXRhOiBEYXRhRmxvdywgcHJpdmF0ZSBrZXk6IHN0cmluZywgZWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGwsIHByaXZhdGUgdHlwZTogRWRpdG9yVHlwZSA9IEVkaXRvclR5cGUuTGFiZWwsIGNoYWduZTogYm9vbGVhbiA9IGZhbHNlKSB7XG5cbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIHRoaXMuZGF0YS5vblNhZmUoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHRoaXMuY2hhbmdlRGF0YS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmRhdGEub25TYWZlKEV2ZW50RW51bS5kaXNwb3NlLCB0aGlzLmRpc3Bvc2UuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5pc0VkaXQgPSB0eXBlID09PSBFZGl0b3JUeXBlLlRleHQ7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3InKTtcbiAgICBpZiAoY2hhZ25lICYmIGVsKSB7XG4gICAgICBlbC5wYXJlbnRFbGVtZW50Py5pbnNlcnRCZWZvcmUodGhpcy5lbE5vZGUsIGVsKTtcbiAgICAgIGVsLnBhcmVudEVsZW1lbnQ/LnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgIGVsPy5yZW1vdmUoKTtcbiAgICB9IGVsc2UgaWYgKGVsKSB7XG4gICAgICBlbC5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgfVxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIHJlbmRlcigpIHtcbiAgICBsZXQgZGF0YSA9IHRoaXMuZGF0YS5HZXQodGhpcy5rZXkpO1xuXG4gICAgaWYgKHRoaXMuaXNFZGl0KSB7XG4gICAgICBpZiAodGhpcy5lbExhYmVsKSB7XG4gICAgICAgIHRoaXMuZWxMYWJlbC5yZW1vdmVFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuc3dpdGNoTW9kZUVkaXQuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZWxMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5lbExhYmVsID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmVsSW5wdXQpIHtcbiAgICAgICAgdGhpcy5lbElucHV0LnZhbHVlID0gZGF0YTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5lbElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgIHRoaXMuZWxJbnB1dC5jbGFzc0xpc3QuYWRkKCdub2RlLWZvcm0tY29udHJvbCcpO1xuICAgICAgdGhpcy5lbElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmlucHV0RGF0YS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxJbnB1dC52YWx1ZSA9IGRhdGE7XG4gICAgICB0aGlzLmVsSW5wdXQuc2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJywgdGhpcy5rZXkpO1xuICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbElucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuZWxJbnB1dCkge1xuICAgICAgICB0aGlzLmVsSW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmlucHV0RGF0YS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5lbElucHV0LnJlbW92ZSgpO1xuICAgICAgICB0aGlzLmVsSW5wdXQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZWxMYWJlbCkge1xuICAgICAgICB0aGlzLmVsTGFiZWwuaW5uZXJIVE1MID0gZGF0YTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5lbExhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgaWYgKHRoaXMudHlwZSA9PSBFZGl0b3JUeXBlLklubGluZSkge1xuICAgICAgICB0aGlzLmVsTGFiZWwuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLnN3aXRjaE1vZGVFZGl0LmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgICAgdGhpcy5lbExhYmVsLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIHRoaXMua2V5KTtcbiAgICAgIHRoaXMuZWxMYWJlbC5pbm5lckhUTUwgPSBkYXRhO1xuICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbExhYmVsKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHN3aXRjaE1vZGVFZGl0KCkge1xuICAgIHRoaXMuaXNFZGl0ID0gdHJ1ZTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyBpbnB1dERhdGEoZTogYW55KSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMua2V5LCBlLnRhcmdldC52YWx1ZSwgdGhpcyk7XG4gICAgfSlcbiAgfVxuICBwdWJsaWMgY2hhbmdlRGF0YSh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyBkaXNwb3NlKCkge1xuICAgIHRoaXMuZWxJbnB1dD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaW5wdXREYXRhLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxMYWJlbD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLnN3aXRjaE1vZGVFZGl0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHt0aGlzLmtleX1gLCB0aGlzLmNoYW5nZURhdGEuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kaXNwb3NlLCB0aGlzLmRpc3Bvc2UuYmluZCh0aGlzKSk7XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcbmltcG9ydCB7IEVkaXRvciwgRWRpdG9yVHlwZSB9IGZyb20gXCIuLi9jb3JlL0VkaXRvclwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgUHJvcGVydHlEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwcml2YXRlIGxhc3REYXRhOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBsYWJlbEtleXM6IHN0cmluZ1tdID0gWydpZCcsICdrZXknXTtcbiAgcHJpdmF0ZSBkYXRhSnNvbjogSFRNTFRleHRBcmVhRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvcGVydHknKTtcbiAgICB0aGlzLkJveEluZm8oJ1Byb3BlcnR5JywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBtYWluLm9uKEV2ZW50RW51bS5zaG93UHJvcGVydHksIChkZXRhaWw6IGFueSkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlclVJKG5vZGUsIGRldGFpbC5kYXRhKTtcbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cbiAgcHJpdmF0ZSByZW5kZXJVSShub2RlOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YUZsb3cpIHtcbiAgICBpZiAodGhpcy5sYXN0RGF0YSA9PSBkYXRhKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubGFzdERhdGEgPSBkYXRhO1xuICAgIG5vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IGRhdGEuZ2V0UHJvcGVydGllcygpXG4gICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBwcm9wZXJ0eUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHByb3BlcnR5SXRlbS5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS1pdGVtJyk7XG4gICAgICBsZXQgcHJvcGVydHlMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgcHJvcGVydHlMYWJlbC5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS1sYWJlbCcpO1xuICAgICAgcHJvcGVydHlMYWJlbC5pbm5lckhUTUwgPSBrZXk7XG4gICAgICBsZXQgcHJvcGVydHlWYWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgcHJvcGVydHlWYWx1ZS5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS12YWx1ZScpO1xuICAgICAgaWYgKHRoaXMubGFiZWxLZXlzLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgbmV3IEVkaXRvcihkYXRhLCBrZXksIHByb3BlcnR5VmFsdWUsIEVkaXRvclR5cGUuTGFiZWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3IEVkaXRvcihkYXRhLCBrZXksIHByb3BlcnR5VmFsdWUsIEVkaXRvclR5cGUuVGV4dCk7XG4gICAgICB9XG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlMYWJlbCk7XG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlWYWx1ZSk7XG4gICAgICBub2RlLmFwcGVuZENoaWxkKHByb3BlcnR5SXRlbSk7XG4gICAgfSk7XG4gICAgbm9kZS5hcHBlbmRDaGlsZCh0aGlzLmRhdGFKc29uKTtcbiAgICB0aGlzLmRhdGFKc29uLnZhbHVlID0gZGF0YS50b1N0cmluZygpO1xuICAgIHRoaXMuZGF0YUpzb24uY2xhc3NMaXN0LmFkZCgnbm9kZS1mb3JtLWNvbnRyb2wnKTtcbiAgICBkYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoKSA9PiB0aGlzLmRhdGFKc29uLnZhbHVlID0gZGF0YS50b1N0cmluZygpKVxuICB9XG59XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRGbG93IHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7IH1cbiAgcHVibGljIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgIHRoaXMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICAvKiBFdmVudHMgKi9cbiAgcHVibGljIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgZXZlbnQgbmFtZSBtdXN0IGJlIGEgc3RyaW5nLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBldmVudH1gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XG4gICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG5cbiAgICBpZiAoIXRoaXMuZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXG4gICAgY29uc3QgbGlzdGVuZXJJbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKVxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXG4gIH1cblxuICBwdWJsaWMgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xuICAgICAgbGlzdGVuZXIoZGV0YWlscyk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElQcm9wZXJ0eSB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBEYXRhRmxvdyB7XG4gIHByaXZhdGUgZGF0YTogYW55ID0ge307XG4gIHByaXZhdGUgcHJvcGVydGllczogYW55ID0gbnVsbDtcbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgcHVibGljIGdldFByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzO1xuICB9XG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG5cbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvcGVydHk6IElQcm9wZXJ0eSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCwgZGF0YTogYW55ID0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IC0xKSB7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIH1cbiAgICB0aGlzLmxvYWQoZGF0YSk7XG4gIH1cbiAgcHJpdmF0ZSBldmVudERhdGFDaGFuZ2Uoa2V5OiBzdHJpbmcsIGtleUNoaWxkOiBzdHJpbmcsIHZhbHVlQ2hpbGQ6IGFueSwgc2VuZGVyQ2hpbGQ6IGFueSwgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmIChpbmRleCkge1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9XyR7a2V5Q2hpbGR9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xuICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlRXZlbnREYXRhKGl0ZW06IERhdGFGbG93LCBrZXk6IHN0cmluZywgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmICghaXRlbSkgcmV0dXJuO1xuICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9YCwgKHsga2V5OiBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGQgfTogYW55KSA9PiB0aGlzLmV2ZW50RGF0YUNoYW5nZShrZXksIGtleUNoaWxkLCB2YWx1ZUNoaWxkLCBzZW5kZXJDaGlsZCwgaW5kZXgpKTtcbiAgfVxuICBwdWJsaWMgT25FdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHByaXZhdGUgQmluZEV2ZW50KHZhbHVlOiBhbnksIGtleTogc3RyaW5nKSB7XG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICB0aGlzLk9uRXZlbnREYXRhKHZhbHVlIGFzIERhdGFGbG93LCBrZXkpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgKHZhbHVlIGFzIFtdKS5sZW5ndGggPiAwICYmIHZhbHVlWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICh2YWx1ZSBhcyBEYXRhRmxvd1tdKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdywgaW5kZXg6IG51bWJlcikgPT4gdGhpcy5PbkV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCkge1xuICAgIGlmICh0aGlzLmRhdGFba2V5XSAhPSB2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZGF0YVtrZXldKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgdGhpcy5SZW1vdmVFdmVudERhdGEoKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93KSwga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFba2V5XSkgJiYgKHRoaXMuZGF0YVtrZXldIGFzIFtdKS5sZW5ndGggPiAwICYmIHRoaXMuZGF0YVtrZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgICAodGhpcy5kYXRhW2tleV0gYXMgRGF0YUZsb3dbXSkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3csIGluZGV4OiBudW1iZXIpID0+IHRoaXMuUmVtb3ZlRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gICAgfVxuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xuICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgfSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwge1xuICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgfSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XG4gICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgR2V0KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xuICB9XG4gIHB1YmxpYyBBcHBlbmQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICB0aGlzLmRhdGFba2V5XSA9IFsuLi50aGlzLmRhdGFba2V5XSwgdmFsdWVdO1xuICAgIHRoaXMuQmluZEV2ZW50KHZhbHVlLCBrZXkpO1xuICB9XG4gIHB1YmxpYyBSZW1vdmUoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICB0aGlzLmRhdGFba2V5XS5pbmRleE9mKHZhbHVlKTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmRhdGFba2V5XS5pbmRleE9mKHZhbHVlKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5SZW1vdmVFdmVudERhdGEodGhpcy5kYXRhW2tleV1baW5kZXhdLCBrZXkpO1xuICAgICAgdGhpcy5kYXRhW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEgPSB7fTtcbiAgICBpZiAoIXRoaXMucHJvcGVydGllcykge1xuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0eT8uZ2V0UHJvcGVydHlCeUtleShkYXRhLmtleSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgIHRoaXMuZGF0YVtrZXldID0gKGRhdGE/LltrZXldID8/ICgodHlwZW9mIHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0ID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCgpIDogdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQpID8/IFwiXCIpKTtcbiAgICAgICAgdGhpcy5CaW5kRXZlbnQodGhpcy5kYXRhW2tleV0sIGtleSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy50b0pzb24oKSk7XG4gIH1cbiAgcHVibGljIHRvSnNvbigpIHtcbiAgICBsZXQgcnM6IGFueSA9IHt9O1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICByc1trZXldID0gdGhpcy5HZXQoa2V5KTtcbiAgICAgIGlmIChyc1trZXldIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0udG9Kc29uKCk7XG4gICAgICB9XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyc1trZXldKSAmJiAocnNba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiByc1trZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0ubWFwKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBycztcbiAgfVxuICBwdWJsaWMgZGVsZXRlKCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVByb3BlcnR5IHtcbiAgZ2V0UHJvcGVydHlCeUtleShrZXk6IHN0cmluZyk6IGFueTtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbnRyb2xOb2RlIGV4dGVuZHMgSVByb3BlcnR5IHtcbiAgZ2V0Q29udHJvbE5vZGVCeUtleShrZXk6IHN0cmluZyk6IGFueTtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSUV2ZW50IHtcbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpOiB2b2lkO1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KTogdm9pZDtcbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSk6IHZvaWQ7XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSk6IHZvaWQ7XG59XG5leHBvcnQgaW50ZXJmYWNlIElNYWluIGV4dGVuZHMgSUNvbnRyb2xOb2RlLCBJRXZlbnQge1xuICBnZXRDb250cm9sQWxsKCk6IGFueVtdO1xuICBzZXRDb250cm9sQ2hvb3NlKGtleTogc3RyaW5nIHwgbnVsbCk6IHZvaWQ7XG4gIGdldENvbnRyb2xDaG9vc2UoKTogc3RyaW5nIHwgbnVsbDtcbiAgZ2V0Q29udHJvbEJ5S2V5KGtleTogc3RyaW5nKTogYW55O1xufVxuZXhwb3J0IGNsYXNzIEZsb3dDb3JlIGltcGxlbWVudHMgSUV2ZW50IHtcbiAgcHVibGljIEdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdpZCcpO1xuICB9XG4gIHB1YmxpYyBTZXRJZChpZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ2lkJywgaWQpO1xuICB9XG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcbiAgcHVibGljIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyBDaGVja0VsZW1lbnRDaGlsZChlbDogSFRNTEVsZW1lbnQpIHtcbiAgICByZXR1cm4gdGhpcy5lbE5vZGUgPT0gZWwgfHwgdGhpcy5lbE5vZGUuY29udGFpbnMoZWwpO1xuICB9XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIHB1YmxpYyBzZXREYXRhKGRhdGE6IERhdGFGbG93KSB7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLkJpbmREYXRhRXZlbnQoKTtcbiAgICB0aGlzLmRpc3BhdGNoKGBiaW5kX2RhdGFfZXZlbnRgLCB7IGRhdGEsIHNlbmRlcjogdGhpcyB9KTtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBCaW5kRGF0YUV2ZW50KCkge1xuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5jaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIHRoaXMuQmluZERhdGFFdmVudCgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCYXNlRmxvdzxUUGFyZW50IGV4dGVuZHMgRmxvd0NvcmU+IGV4dGVuZHMgRmxvd0NvcmUge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIHBhcmVudDogVFBhcmVudCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbn1cbiIsImV4cG9ydCBjb25zdCBMT0cgPSAobWVzc2FnZT86IGFueSwgLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiBjb25zb2xlLmxvZyhtZXNzYWdlLCBvcHRpb25hbFBhcmFtcyk7XG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IChuZXcgRGF0ZSgpKTtcbmV4cG9ydCBjb25zdCBnZXRUaW1lID0gKCkgPT4gZ2V0RGF0ZSgpLmdldFRpbWUoKTtcbmV4cG9ydCBjb25zdCBnZXRVdWlkID0gKCkgPT4ge1xuICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICBsZXQgczogYW55ID0gW107XG4gIGxldCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xuICB9XG4gIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcbiAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXG4gIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICByZXR1cm4gdXVpZDtcbn1cbiIsImltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcbmltcG9ydCB7IE5vZGUgfSBmcm9tIFwiLi9Ob2RlXCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lIHtcbiAgcHVibGljIGVsTm9kZTogU1ZHRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgcHVibGljIGVsUGF0aDogU1ZHUGF0aEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJwYXRoXCIpO1xuICBwcml2YXRlIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZnJvbTogTm9kZSwgcHVibGljIGZyb21JbmRleDogbnVtYmVyID0gMCwgcHVibGljIHRvOiBOb2RlIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBwdWJsaWMgdG9JbmRleDogbnVtYmVyID0gMCkge1xuICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoXCJtYWluLXBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCAnJyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcImNvbm5lY3Rpb25cIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbFBhdGgpO1xuICAgIHRoaXMuZnJvbS5wYXJlbnQuZWxDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMuZnJvbS5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudG8/LkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKHt9LCB7XG4gICAgICBmcm9tOiB7XG4gICAgICAgIGRlZmF1bHQ6IHRoaXMuZnJvbS5HZXRJZCgpXG4gICAgICB9LFxuICAgICAgZnJvbUluZGV4OiB7XG4gICAgICAgIGRlZmF1bHQ6IHRoaXMuZnJvbUluZGV4XG4gICAgICB9LFxuICAgICAgdG86IHtcbiAgICAgICAgZGVmYXVsdDogdGhpcy50bz8uR2V0SWQoKVxuICAgICAgfSxcbiAgICAgIHRvSW5kZXg6IHtcbiAgICAgICAgZGVmYXVsdDogdGhpcy50b0luZGV4XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5mcm9tLmRhdGEuQXBwZW5kKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVRvKHRvX3g6IG51bWJlciwgdG9feTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmZyb20gfHwgdGhpcy5mcm9tLmVsTm9kZSA9PSBudWxsKSByZXR1cm47XG4gICAgbGV0IHsgeDogZnJvbV94LCB5OiBmcm9tX3kgfTogYW55ID0gdGhpcy5mcm9tLmdldFBvc3Rpc2lvbkRvdCh0aGlzLmZyb21JbmRleCk7XG4gICAgdmFyIGxpbmVDdXJ2ZSA9IHRoaXMuY3JlYXRlQ3VydmF0dXJlKGZyb21feCwgZnJvbV95LCB0b194LCB0b195LCB0aGlzLmN1cnZhdHVyZSwgJ29wZW5jbG9zZScpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgbGluZUN1cnZlKTtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKTogTGluZSB7XG4gICAgLy9Qb3N0aW9uIG91dHB1dFxuICAgIGlmICh0aGlzLnRvICYmIHRoaXMudG8uZWxOb2RlKSB7XG4gICAgICBsZXQgeyB4OiB0b194LCB5OiB0b195IH06IGFueSA9IHRoaXMudG8uZ2V0UG9zdGlzaW9uRG90KHRoaXMudG9JbmRleCk7XG4gICAgICB0aGlzLnVwZGF0ZVRvKHRvX3gsIHRvX3kpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBwdWJsaWMgQWN0aXZlKGZsZzogYW55ID0gdHJ1ZSkge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBjcmVhdGVDdXJ2YXR1cmUoc3RhcnRfcG9zX3g6IG51bWJlciwgc3RhcnRfcG9zX3k6IG51bWJlciwgZW5kX3Bvc194OiBudW1iZXIsIGVuZF9wb3NfeTogbnVtYmVyLCBjdXJ2YXR1cmVfdmFsdWU6IG51bWJlciwgdHlwZTogc3RyaW5nKSB7XG4gICAgbGV0IGxpbmVfeCA9IHN0YXJ0X3Bvc194O1xuICAgIGxldCBsaW5lX3kgPSBzdGFydF9wb3NfeTtcbiAgICBsZXQgeCA9IGVuZF9wb3NfeDtcbiAgICBsZXQgeSA9IGVuZF9wb3NfeTtcbiAgICBsZXQgY3VydmF0dXJlID0gY3VydmF0dXJlX3ZhbHVlO1xuICAgIC8vdHlwZSBvcGVuY2xvc2Ugb3BlbiBjbG9zZSBvdGhlclxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ290aGVyJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuXG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGRlbGV0ZShub2RlVGhpczogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLmZyb20uZGF0YS5SZW1vdmUoJ2xpbmVzJywgdGhpcy5kYXRhKTtcbiAgICBpZiAodGhpcy5mcm9tICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy5mcm9tLlJlbW92ZUxpbmUodGhpcyk7XG4gICAgaWYgKHRoaXMudG8gIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLnRvPy5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIHRoaXMuZWxQYXRoLnJlbW92ZSgpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZSgpO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMuZnJvbS5wYXJlbnQuc2V0TGluZUNob29zZSh0aGlzKVxuICB9XG4gIHB1YmxpYyBzZXROb2RlVG8obm9kZTogTm9kZSB8IHVuZGVmaW5lZCwgdG9JbmRleDogbnVtYmVyKSB7XG4gICAgdGhpcy50byA9IG5vZGU7XG4gICAgdGhpcy50b0luZGV4ID0gdG9JbmRleDtcbiAgfVxuICBwdWJsaWMgQ2xvbmUoKSB7XG4gICAgaWYgKHRoaXMudG8gJiYgdGhpcy50b0luZGV4KSB7XG4gICAgICByZXR1cm4gbmV3IExpbmUodGhpcy5mcm9tLCB0aGlzLmZyb21JbmRleCwgdGhpcy50bywgdGhpcy50b0luZGV4KS5VcGRhdGVVSSgpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgZ2V0VGltZSB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4vTm9kZVwiO1xuXG5leHBvcnQgZW51bSBNb3ZlVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb2RlID0gMSxcbiAgQ2FudmFzID0gMixcbiAgTGluZSA9IDMsXG59XG5leHBvcnQgY29uc3QgWm9vbSA9IHtcbiAgbWF4OiAxLjYsXG4gIG1pbjogMC42LFxuICB2YWx1ZTogMC4xLFxuICBkZWZhdWx0OiAxXG59XG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3X0V2ZW50IHtcbiAgcHJpdmF0ZSB6b29tX2xhc3RfdmFsdWU6IGFueSA9IDE7XG5cbiAgcHJpdmF0ZSB0aW1lRmFzdENsaWNrOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHRhZ0luZ29yZSA9IFsnaW5wdXQnLCAnYnV0dG9uJywgJ2EnLCAndGV4dGFyZWEnXTtcblxuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gIHByaXZhdGUgZmxnRHJhcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIGF2X3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgYXZfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHRlbXBMaW5lOiBMaW5lIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IERlc2dpbmVyVmlldykge1xuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuICAgIC8qIENvbnRleHQgTWVudSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMubm9kZV9kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMubm9kZV9kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy56b29tX2VudGVyLmJpbmQodGhpcykpO1xuICAgIC8qIERlbGV0ZSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb250ZXh0bWVudShldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cbiAgcHJpdmF0ZSBub2RlX2RyYWdvdmVyKGV2OiBhbnkpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfVxuICBwcml2YXRlIG5vZGVfZHJvcEVuZChldjogYW55KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQga2V5Tm9kZTogYW55ID0gdGhpcy5wYXJlbnQubWFpbi5nZXRDb250cm9sQ2hvb3NlKCk7XG4gICAgaWYgKCFrZXlOb2RlICYmIGV2LnR5cGUgIT09IFwidG91Y2hlbmRcIikge1xuICAgICAga2V5Tm9kZSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwibm9kZVwiKTtcbiAgICB9XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuXG4gICAgaWYgKHRoaXMucGFyZW50LmNoZWNrT25seU5vZGUoa2V5Tm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IG5vZGVJdGVtID0gdGhpcy5wYXJlbnQuQWRkTm9kZShrZXlOb2RlKTtcbiAgICBub2RlSXRlbS51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMuem9vbV9vdXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFpvb20gSW5cbiAgICAgICAgdGhpcy56b29tX2luKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX3JlZnJlc2goZmxnOiBhbnkgPSAwKSB7XG4gICAgbGV0IHRlbXBfem9vbSA9IGZsZyA9PSAwID8gWm9vbS5kZWZhdWx0IDogKHRoaXMucGFyZW50LmdldFpvb20oKSArIFpvb20udmFsdWUgKiBmbGcpO1xuICAgIGlmIChab29tLm1heCA+PSB0ZW1wX3pvb20gJiYgdGVtcF96b29tID49IFpvb20ubWluKSB7XG4gICAgICB0aGlzLnBhcmVudC5zZXRYKCh0aGlzLnBhcmVudC5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0ZW1wX3pvb20pO1xuICAgICAgdGhpcy5wYXJlbnQuc2V0WSgodGhpcy5wYXJlbnQuZ2V0WSgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGVtcF96b29tKTtcbiAgICAgIHRoaXMuem9vbV9sYXN0X3ZhbHVlID0gdGVtcF96b29tO1xuICAgICAgdGhpcy5wYXJlbnQuc2V0Wm9vbSh0aGlzLnpvb21fbGFzdF92YWx1ZSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX2luKCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKDEpO1xuICB9XG4gIHB1YmxpYyB6b29tX291dCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgtMSk7XG4gIH1cbiAgcHVibGljIHpvb21fcmVzZXQoKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMCk7XG4gIH1cbiAgcHJpdmF0ZSBTdGFydE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnRhZ0luZ29yZS5pbmNsdWRlcyhldi50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSBnZXRUaW1lKCk7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21haW4tcGF0aCcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgbGV0IG5vZGVDaG9vc2UgPSB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk7XG4gICAgaWYgKG5vZGVDaG9vc2UgJiYgbm9kZUNob29zZS5DaGVja0VsZW1lbnRDaGlsZChldi50YXJnZXQpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh1bmRlZmluZWQpO1xuICAgIH1cbiAgICBpZiAobm9kZUNob29zZSAmJiB0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vZGUgJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBldi50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmUobm9kZUNob29zZSwgZnJvbUluZGV4KTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICB0aGlzLmF2X3ggPSB0aGlzLnBhcmVudC5nZXRYKCk7XG4gICAgICB0aGlzLmF2X3kgPSB0aGlzLnBhcmVudC5nZXRZKCk7XG4gICAgfVxuICAgIHRoaXMuZmxnRHJhcCA9IHRydWU7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIE1vdmUoZXY6IGFueSkge1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgdGhpcy5mbGdNb3ZlID0gdHJ1ZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLm1vdmVUeXBlKSB7XG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5hdl94ICsgdGhpcy5wYXJlbnQuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLmF2X3kgKyB0aGlzLnBhcmVudC5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xuICAgICAgICAgIHRoaXMucGFyZW50LnNldFkoeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wb3NfeSAtIGVfcG9zX3kpO1xuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgICAgICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgICAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLnBhcmVudC5lbENhbnZhcy5vZmZzZXRMZWZ0IC0geCwgdGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgICAgICBsZXQgbm9kZUVsID0gZXYudGFyZ2V0LmNsb3Nlc3QoJ1tub2RlLWlkXScpO1xuICAgICAgICAgICAgbGV0IG5vZGVJZCA9IG5vZGVFbD8uZ2V0QXR0cmlidXRlKCdub2RlLWlkJyk7XG4gICAgICAgICAgICBsZXQgbm9kZVRvID0gbm9kZUlkID8gdGhpcy5wYXJlbnQuR2V0Tm9kZUJ5SWQobm9kZUlkKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChub2RlVG8gJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IHRvSW5kZXggPSBub2RlRWw/LnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWRvdCcpPy5bMF0/LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xuICAgICAgdGhpcy5tb3VzZV95ID0gZV9wb3NfeTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBFbmRNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIC8vZml4IEZhc3QgQ2xpY2tcbiAgICBpZiAoKChnZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMTAwKSB8fCAhdGhpcy5mbGdNb3ZlKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBlX3Bvc194ID0gdGhpcy5tb3VzZV94O1xuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcbiAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xuICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcbiAgICAgIHRoaXMuYXZfeCA9IDA7XG4gICAgICB0aGlzLmF2X3kgPSAwO1xuICAgIH1cbiAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgdGhpcy50ZW1wTGluZS5DbG9uZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHByaXZhdGUga2V5ZG93bihldjogYW55KSB7XG4gICAgaWYgKGV2LmtleSA9PT0gJ0RlbGV0ZScgfHwgKGV2LmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgZXYubWV0YUtleSkpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpPy5kZWxldGUoKTtcbiAgICAgIHRoaXMucGFyZW50LmdldExpbmVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgfVxuICAgIGlmIChldi5rZXkgPT09ICdGMicpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMucGFyZW50LmRhdGEudG9Kc29uKCkpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgZ2V0VXVpZCB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuXG5jb25zdCBnZXZhbCA9IGV2YWw7XG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIEJhc2VGbG93PERlc2dpbmVyVmlldz4ge1xuICAvKipcbiAgICogR0VUIFNFVCBmb3IgRGF0YVxuICAgKi9cbiAgcHVibGljIGdldFkoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd5Jyk7XG4gIH1cbiAgcHVibGljIHNldFkodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd5JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRYKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneCcpO1xuICB9XG4gIHB1YmxpYyBzZXRYKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgQ2hlY2tLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgna2V5JykgPT0ga2V5O1xuICB9XG4gIHB1YmxpYyBlbENvbnRlbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgYXJyTGluZTogTGluZVtdID0gW107XG4gIHByaXZhdGUgb3B0aW9uOiBhbnkgPSB7fTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBEZXNnaW5lclZpZXcsIHByaXZhdGUga2V5Tm9kZTogYW55LCBkYXRhOiBhbnkgPSB7fSkge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5vcHRpb24gPSB0aGlzLnBhcmVudC5tYWluLmdldENvbnRyb2xOb2RlQnlLZXkoa2V5Tm9kZSk7XG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5vcHRpb24/LnByb3BlcnRpZXM7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKGRhdGEsIHRoaXMucHJvcGVydGllcyk7XG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLnJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLW5vZGUnKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbi5jbGFzcykge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbi5jbGFzcyk7XG4gICAgfVxuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ25vZGUtaWQnLCB0aGlzLkdldElkKCkpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5kYXRhLkFwcGVuZCgnbm9kZXMnLCB0aGlzLmRhdGEpO1xuICAgIHRoaXMucmVuZGVyVUkoKTtcbiAgfVxuICBwcml2YXRlIHJlbmRlclVJKCkge1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjQwMDBcIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXRvcFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCIxMDAwXCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50XCI+JHt0aGlzLm9wdGlvbi5odG1sfTwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3R0b21cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiMjAwMFwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtcmlnaHRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtZG90XCIgIG5vZGU9XCIzMDAwXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuICAgIHRoaXMuZWxDb250ZW50ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLm5vZGUtY29udGVudCcpO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlUG9zaXRpb24oeDogYW55LCB5OiBhbnksIGlDaGVjayA9IGZhbHNlKSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICBpZiAoaUNoZWNrKSB7XG4gICAgICAgIGlmICh4ICE9PSB0aGlzLmdldFgoKSkge1xuICAgICAgICAgIHRoaXMuc2V0WCh4KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeSAhPT0gdGhpcy5nZXRZKCkpIHtcbiAgICAgICAgICB0aGlzLnNldFgoeSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0WSgodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSkpO1xuICAgICAgICB0aGlzLnNldFgoKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcnJMaW5lO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmUpIHtcbiAgICB0aGlzLmFyckxpbmUgPSBbLi4udGhpcy5hcnJMaW5lLCBsaW5lXTtcbiAgfVxuICBwdWJsaWMgZ2V0UG9zdGlzaW9uRG90KGluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZT8ucXVlcnlTZWxlY3RvcihgLm5vZGUtZG90W25vZGU9XCIke2luZGV4fVwiXWApO1xuICAgIGlmIChlbERvdCkge1xuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xuICAgICAgbGV0IHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCArIGVsRG90Lm9mZnNldExlZnQgKyAxMCk7XG4gICAgICByZXR1cm4geyB4LCB5IH07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uVXBkYXRlVUkoKTtcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNSZW1vdmVQYXJlbnQgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMpKTtcbiAgICB0aGlzLmRhdGEuZGVsZXRlKCk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZSgpO1xuICAgIHRoaXMuYXJyTGluZSA9IFtdO1xuICAgIGlmIChpc1JlbW92ZVBhcmVudClcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7fSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEZsb3dDb3JlLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0sIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfRXZlbnQgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdfRXZlbnRcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4vTm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3IGV4dGVuZHMgRmxvd0NvcmUge1xuICAvKipcbiAgICogR0VUIFNFVCBmb3IgRGF0YVxuICAgKi9cbiAgcHVibGljIGdldFpvb20oKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd6b29tJyk7XG4gIH1cbiAgcHVibGljIHNldFpvb20odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd6b29tJywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneScpO1xuICB9XG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3gnKTtcbiAgfVxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3gnLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHJpdmF0ZSByZWFkb25seSB2aWV3X2V2ZW50OiBEZXNnaW5lclZpZXdfRXZlbnQgfCB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBsaW5lQ2hvb3NlOiBMaW5lIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgc2V0TGluZUNob29zZShub2RlOiBMaW5lIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZShmYWxzZSk7XG4gICAgdGhpcy5saW5lQ2hvb3NlID0gbm9kZTtcbiAgICBpZiAodGhpcy5saW5lQ2hvb3NlKSB7XG4gICAgICB0aGlzLmxpbmVDaG9vc2UuQWN0aXZlKCk7XG4gICAgICB0aGlzLnNldE5vZGVDaG9vc2UodW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldExpbmVDaG9vc2UoKTogTGluZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubGluZUNob29zZTtcbiAgfVxuICBwcml2YXRlIG5vZGVzOiBOb2RlW10gPSBbXTtcbiAgcHJpdmF0ZSBub2RlQ2hvb3NlOiBOb2RlIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgc2V0Tm9kZUNob29zZShub2RlOiBOb2RlIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZShmYWxzZSk7XG4gICAgdGhpcy5ub2RlQ2hvb3NlID0gbm9kZTtcbiAgICBpZiAodGhpcy5ub2RlQ2hvb3NlKSB7XG4gICAgICB0aGlzLm5vZGVDaG9vc2UuQWN0aXZlKCk7XG4gICAgICB0aGlzLnNldExpbmVDaG9vc2UodW5kZWZpbmVkKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLm5vZGVDaG9vc2UuZGF0YSB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCB7IGRhdGE6IHRoaXMuZGF0YSB9KTtcbiAgICB9XG5cbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUNob29zZSgpOiBOb2RlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlQ2hvb3NlO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlKGtleU5vZGU6IHN0cmluZywgZGF0YTogYW55ID0ge30pOiBOb2RlIHtcbiAgICByZXR1cm4gdGhpcy5JbnNlcnROb2RlKG5ldyBOb2RlKHRoaXMsIGtleU5vZGUsIGRhdGEpKTtcbiAgfVxuICBwdWJsaWMgSW5zZXJ0Tm9kZShub2RlOiBOb2RlKTogTm9kZSB7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIHRoaXMuZGF0YS5SZW1vdmUoJ25vZGVzJywgbm9kZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubm9kZXM7XG4gIH1cbiAgLyoqXG4gICAqIFZhcmlidXRlXG4gICovXG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5lbE5vZGUgPSBlbE5vZGU7XG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5tYWluKTtcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoe30sIHByb3BlcnRpZXMpO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgdGhpcy5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5SZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnZpZXdfZXZlbnQgPSBuZXcgRGVzZ2luZXJWaWV3X0V2ZW50KHRoaXMpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVWaWV3KHg6IGFueSwgeTogYW55LCB6b29tOiBhbnkpIHtcbiAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt4fXB4LCAke3l9cHgpIHNjYWxlKCR7em9vbX0pYDtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZVZpZXcodGhpcy5nZXRYKCksIHRoaXMuZ2V0WSgpLCB0aGlzLmdldFpvb20oKSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIFJlbmRlclVJKCkge1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICcnO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2Rlc2dpbmVyLXZpZXcnKVxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LnJlbW92ZShcImRlc2dpbmVyLWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdkZXNnaW5lci12aWV3JylcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5hZGQoXCJkZXNnaW5lci1jYW52YXNcIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XG4gICAgdGhpcy5lbE5vZGUudGFiSW5kZXggPSAwO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgfVxuICBwdWJsaWMgQ2FsY1gobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50V2lkdGggLyAodGhpcy5lbE5vZGU/LmNsaWVudFdpZHRoICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwdWJsaWMgQ2FsY1kobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxOb2RlPy5jbGllbnRIZWlnaHQgKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHB1YmxpYyBHZXRBbGxOb2RlKCk6IE5vZGVbXSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZXMgfHwgW107XG4gIH1cbiAgcHVibGljIEdldE5vZGVCeUlkKGlkOiBzdHJpbmcpOiBOb2RlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5HZXRBbGxOb2RlKCkuZmlsdGVyKG5vZGUgPT4gbm9kZS5HZXRJZCgpID09IGlkKT8uWzBdO1xuICB9XG5cbiAgY2hlY2tPbmx5Tm9kZShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiAodGhpcy5tYWluLmdldENvbnRyb2xCeUtleShrZXkpLm9ubHlOb2RlKSAmJiB0aGlzLm5vZGVzLmZpbHRlcihpdGVtID0+IGl0ZW0uQ2hlY2tLZXkoa2V5KSkubGVuZ3RoID4gMDtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSUNvbnRyb2xOb2RlLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVmlld0RvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIG5ldyBEZXNnaW5lclZpZXcodGhpcy5lbE5vZGUsIG1haW4pLm9uKEV2ZW50RW51bS5zaG93UHJvcGVydHksIChkYXRhOiBhbnkpID0+IG1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgZGF0YSkpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBEb2NrRW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBDb250cm9sRG9jayB9IGZyb20gXCIuL0NvbnRyb2xEb2NrXCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5pbXBvcnQgeyBQcm9wZXJ0eURvY2sgfSBmcm9tIFwiLi9Qcm9wZXJ0eURvY2tcIjtcbmltcG9ydCB7IFZpZXdEb2NrIH0gZnJvbSBcIi4vVmlld0RvY2tcIjtcblxuZXhwb3J0IGNsYXNzIERvY2tNYW5hZ2VyIHtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHt9XG4gIHB1YmxpYyByZXNldCgpIHtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IHt9O1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5sZWZ0LCBDb250cm9sRG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnJpZ2h0LCBQcm9wZXJ0eURvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS52aWV3LCBWaWV3RG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnRvcCwgRG9ja0Jhc2UpO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5ib3R0b20sIERvY2tCYXNlKTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gIH1cbiAgcHVibGljIGFkZERvY2soJGtleTogc3RyaW5nLCAkdmlldzogYW55KSB7XG4gICAgaWYgKCF0aGlzLiRkb2NrTWFuYWdlclska2V5XSlcbiAgICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gW107XG4gICAgdGhpcy4kZG9ja01hbmFnZXJbJGtleV0gPSBbLi4udGhpcy4kZG9ja01hbmFnZXJbJGtleV0sICR2aWV3XTtcbiAgfVxuXG4gIHB1YmxpYyBSZW5kZXJVSSgpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwidnMtbGVmdCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidnMtY29udGVudFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwidnMtdG9wIHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXZpZXcgdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwidnMtYm90dG9tIHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZzLXJpZ2h0IHZzLWRvY2tcIj48L2Rpdj5cbiAgICBgO1xuICAgIE9iamVjdC5rZXlzKHRoaXMuJGRvY2tNYW5hZ2VyKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IHF1ZXJ5U2VsZWN0b3IgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAuJHtrZXl9YCk7XG4gICAgICBpZiAocXVlcnlTZWxlY3Rvcikge1xuICAgICAgICB0aGlzLiRkb2NrTWFuYWdlcltrZXldLmZvckVhY2goKCRpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICBuZXcgJGl0ZW0ocXVlcnlTZWxlY3RvciwgdGhpcy5tYWluKTtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tICcuL2NvcmUvQmFzZUZsb3cnO1xuaW1wb3J0IHsgRG9ja01hbmFnZXIgfSBmcm9tICcuL2RvY2svRG9ja01hbmFnZXInO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSAnLi9jb3JlL0V2ZW50Rmxvdyc7XG5pbXBvcnQgeyBQcm9wZXJ0eUVudW0gfSBmcm9tICcuL2NvcmUvQ29uc3RhbnQnO1xuaW1wb3J0IHsgZ2V0VGltZSB9IGZyb20gJy4vY29yZS9VdGlscyc7XG5leHBvcnQgY2xhc3MgVmlzdWFsRmxvdyBpbXBsZW1lbnRzIElNYWluIHtcbiAgcHJpdmF0ZSAkcHJvcGVydGllczogYW55ID0ge307XG4gIHByaXZhdGUgJGNvbnRyb2w6IGFueSA9IHt9O1xuICBwcml2YXRlICRjb250cm9sQ2hvb3NlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IERvY2tNYW5hZ2VyO1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBwdWJsaWMgZ2V0RG9ja01hbmFnZXIoKTogRG9ja01hbmFnZXIge1xuICAgIHJldHVybiB0aGlzLiRkb2NrTWFuYWdlcjtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBnZXRDb250cm9sQWxsKCkge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sID8/IHt9O1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG9wdGlvbjogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5tYWluXSA9IHtcbiAgICAgIC4uLihvcHRpb24/LnByb3BlcnRpZXMgfHwge30pLFxuICAgICAgaWQ6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9LFxuICAgICAgeDoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgeToge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgem9vbToge1xuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgICAgbm9kZXM6IHtcbiAgICAgICAgZGVmYXVsdDogW11cbiAgICAgIH1cbiAgICB9O1xuICAgIC8vIHNldCBjb250cm9sXG4gICAgdGhpcy4kY29udHJvbCA9IG9wdGlvbj8uY29udHJvbCB8fCB7fTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRjb250cm9sKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy4kcHJvcGVydGllc1tgbm9kZV8ke2tleX1gXSA9IHtcbiAgICAgICAgLi4uKHRoaXMuJGNvbnRyb2xba2V5XS5wcm9wZXJ0aWVzIHx8IHt9KSxcbiAgICAgICAgaWQ6IHtcbiAgICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgICAgfSxcbiAgICAgICAga2V5OiB7XG4gICAgICAgICAgZGVmYXVsdDoga2V5XG4gICAgICAgIH0sXG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICAgIH0sXG4gICAgICAgIHg6IHtcbiAgICAgICAgICBkZWZhdWx0OiAwXG4gICAgICAgIH0sXG4gICAgICAgIHk6IHtcbiAgICAgICAgICBkZWZhdWx0OiAwXG4gICAgICAgIH0sXG4gICAgICAgIGxpbmVzOiB7XG4gICAgICAgICAgZGVmYXVsdDogW11cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IG5ldyBEb2NrTWFuYWdlcih0aGlzLmNvbnRhaW5lciwgdGhpcyk7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIucmVzZXQoKTtcbiAgfVxuICBzZXRDb250cm9sQ2hvb3NlKGtleTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuJGNvbnRyb2xDaG9vc2UgPSBrZXk7XG4gIH1cbiAgZ2V0Q29udHJvbENob29zZSgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbENob29zZTtcbiAgfVxuICBnZXRDb250cm9sQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbFtrZXldIHx8IHt9O1xuICB9XG4gIGdldENvbnRyb2xOb2RlQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy5nZXRDb250cm9sQnlLZXkoa2V5KSxcbiAgICAgIHByb3BlcnRpZXM6IHRoaXMuZ2V0UHJvcGVydHlCeUtleShgbm9kZV8ke2tleX1gKVxuICAgIH1cbiAgfVxuICBnZXRQcm9wZXJ0eUJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuJHByb3BlcnRpZXNba2V5XTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3Mi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
