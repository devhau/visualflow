
  /**
   * @license
   * author: Nguyen Van Hau
   * visualflow.js v0.0.1-beta
   * Released under the MIT license.
   */

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

const LOG = (message, ...optionalParams) => console.log(message, optionalParams);
const getDate = () => (new Date());
const getTime = () => getDate().getTime();

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
        LOG('changeData: ? ? ?', key, value, sender);
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

class Line {
    from;
    fromIndex;
    to;
    toIndex;
    elNode = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    elPath = document.createElementNS('http://www.w3.org/2000/svg', "path");
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
        if (this.from != nodeThis)
            this.from.RemoveLine(this);
        if (this.to != nodeThis)
            this.to?.RemoveLine(this);
        this.elNode?.remove();
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
        // this.parent.elNode.addEventListener('keydown', this.keydown.bind(this));
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
        }
        this.pos_x = e_pos_x;
        this.pos_y = e_pos_y;
        this.moveType = MoveType.None;
        this.flgDrap = false;
        this.flgMove = false;
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
}

class DesginerView extends FlowCore {
    main;
    /**
     * GET SET for Data
     */
    getZoom() {
        return this.data.Get('zoom');
    }
    setZoom(value) {
        return this.data.Set('zoom', value, this);
    }
    getY() {
        return this.data.Get('y');
    }
    setY(value) {
        return this.data.Set('y', value, this);
    }
    getX() {
        return this.data.Get('x');
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

module.exports = VisualFlow;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5janMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL0NvbnN0YW50LnRzIiwiLi4vc3JjL2RvY2svRG9ja0Jhc2UudHMiLCIuLi9zcmMvZG9jay9Db250cm9sRG9jay50cyIsIi4uL3NyYy9jb3JlL1V0aWxzLnRzIiwiLi4vc3JjL2NvcmUvRWRpdG9yLnRzIiwiLi4vc3JjL2RvY2svUHJvcGVydHlEb2NrLnRzIiwiLi4vc3JjL2NvcmUvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvcmUvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29yZS9CYXNlRmxvdy50cyIsIi4uL3NyYy9kZXNnaW5lci9MaW5lLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld19FdmVudC50cyIsIi4uL3NyYy9kZXNnaW5lci9Ob2RlLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlldy50cyIsIi4uL3NyYy9kb2NrL1ZpZXdEb2NrLnRzIiwiLi4vc3JjL2RvY2svRG9ja01hbmFnZXIudHMiLCIuLi9zcmMvVmlzdWFsRmxvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgRXZlbnRFbnVtID0ge1xuICBpbml0OiBcImluaXRcIixcbiAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXG4gIHNob3dQcm9wZXJ0eTogXCJzaG93UHJvcGVydHlcIixcbiAgY2hhbmdlOiBcImNoYW5nZVwiLFxuICBkaXNwb3NlOiBcImRpc3Bvc2VcIlxufVxuXG5leHBvcnQgY29uc3QgRG9ja0VudW0gPSB7XG4gIGxlZnQ6IFwidnMtbGVmdFwiLFxuICB0b3A6IFwidnMtdG9wXCIsXG4gIHZpZXc6IFwidnMtdmlld1wiLFxuICBib3R0b206IFwidnMtYm90dG9tXCIsXG4gIHJpZ2h0OiBcInZzLXJpZ2h0XCIsXG59XG5cbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCJcbn07XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICdEb2NrQmFzZSc7XG4gIH1cbiAgcHVibGljIEJveEluZm8odGl0bGU6IHN0cmluZywgJGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd2cy1ib3hpbmZvJyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtYm94aW5mbycpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwidnMtYm94aW5mb190aXRsZVwiPiR7dGl0bGV9PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInZzLWJveGluZm9fY29udGVudFwiPjwvZGl2PmA7XG4gICAgaWYgKCRjYWxsYmFjaykge1xuICAgICAgJGNhbGxiYWNrKHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2NvbnRlbnQnKSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sRG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtY29udHJvbCcpO1xuICAgIHRoaXMuQm94SW5mbygnQ29udHJvbCcsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbGV0IGNvbnRyb2xzID0gdGhpcy5tYWluLmdldENvbnRyb2xBbGwoKTtcbiAgICAgIE9iamVjdC5rZXlzKGNvbnRyb2xzKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ25vZGUtaXRlbScpO1xuICAgICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgaXRlbSk7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGNvbnRyb2xzW2l0ZW1dLm5hbWU7XG4gICAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuZHJhZ1N0YXJ0LmJpbmQodGhpcykpXG4gICAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlIGRyYWdlbmQoZTogYW55KSB7XG4gICAgdGhpcy5tYWluLnNldENvbnRyb2xDaG9vc2UobnVsbCk7XG4gIH1cblxuICBwcml2YXRlIGRyYWdTdGFydChlOiBhbnkpIHtcbiAgICBsZXQga2V5ID0gZS50YXJnZXQuY2xvc2VzdChcIi5ub2RlLWl0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShrZXkpO1xuICAgIGlmIChlLnR5cGUgIT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKFwibm9kZVwiLCBrZXkpO1xuICAgIH1cbiAgfVxufVxuIiwiZXhwb3J0IGNvbnN0IExPRyA9IChtZXNzYWdlPzogYW55LCAuLi5vcHRpb25hbFBhcmFtczogYW55W10pID0+IGNvbnNvbGUubG9nKG1lc3NhZ2UsIG9wdGlvbmFsUGFyYW1zKTtcbmV4cG9ydCBjb25zdCBnZXREYXRlID0gKCkgPT4gKG5ldyBEYXRlKCkpO1xuZXhwb3J0IGNvbnN0IGdldFRpbWUgPSAoKSA9PiBnZXREYXRlKCkuZ2V0VGltZSgpO1xuZXhwb3J0IGNvbnN0IGdldFV1aWQgPSAoKSA9PiB7XG4gIC8vIGh0dHA6Ly93d3cuaWV0Zi5vcmcvcmZjL3JmYzQxMjIudHh0XG4gIGxldCBzOiBhbnkgPSBbXTtcbiAgbGV0IGhleERpZ2l0cyA9IFwiMDEyMzQ1Njc4OWFiY2RlZlwiO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDM2OyBpKyspIHtcbiAgICBzW2ldID0gaGV4RGlnaXRzLnN1YnN0cihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwKSwgMSk7XG4gIH1cbiAgc1sxNF0gPSBcIjRcIjsgIC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxuICBzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoKHNbMTldICYgMHgzKSB8IDB4OCwgMSk7ICAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuICBzWzhdID0gc1sxM10gPSBzWzE4XSA9IHNbMjNdID0gXCItXCI7XG5cbiAgbGV0IHV1aWQgPSBzLmpvaW4oXCJcIik7XG4gIHJldHVybiB1dWlkO1xufVxuIiwiaW1wb3J0IHsgQmFzZUZsb3csIEZsb3dDb3JlIH0gZnJvbSBcIi4vQmFzZUZsb3dcIlxuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcbmltcG9ydCB7IExPRyB9IGZyb20gXCIuL1V0aWxzXCI7XG5leHBvcnQgZW51bSBFZGl0b3JUeXBlIHtcbiAgTGFiZWwsXG4gIFRleHQsXG4gIElubGluZVxufVxuZXhwb3J0IGNsYXNzIEVkaXRvciB7XG4gIHByaXZhdGUgaXNFZGl0OiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgZWxJbnB1dDogSFRNTERhdGFFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZWxMYWJlbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZGF0YTogRGF0YUZsb3csIHByaXZhdGUga2V5OiBzdHJpbmcsIGVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsLCBwcml2YXRlIHR5cGU6IEVkaXRvclR5cGUgPSBFZGl0b3JUeXBlLkxhYmVsLCBjaGFnbmU6IGJvb2xlYW4gPSBmYWxzZSkge1xuXG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLmRhdGEub25TYWZlKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB0aGlzLmNoYW5nZURhdGEuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5kYXRhLm9uU2FmZShFdmVudEVudW0uZGlzcG9zZSwgdGhpcy5kaXNwb3NlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuaXNFZGl0ID0gdHlwZSA9PT0gRWRpdG9yVHlwZS5UZXh0O1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ25vZGUtZWRpdG9yJyk7XG4gICAgaWYgKGNoYWduZSAmJiBlbCkge1xuICAgICAgZWwucGFyZW50RWxlbWVudD8uaW5zZXJ0QmVmb3JlKHRoaXMuZWxOb2RlLCBlbCk7XG4gICAgICBlbC5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZChlbCk7XG4gICAgICBlbD8ucmVtb3ZlKCk7XG4gICAgfSBlbHNlIGlmIChlbCkge1xuICAgICAgZWwuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgbGV0IGRhdGEgPSB0aGlzLmRhdGEuR2V0KHRoaXMua2V5KTtcblxuICAgIGlmICh0aGlzLmlzRWRpdCkge1xuICAgICAgaWYgKHRoaXMuZWxMYWJlbCkge1xuICAgICAgICB0aGlzLmVsTGFiZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLnN3aXRjaE1vZGVFZGl0LmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmVsTGFiZWwucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuZWxMYWJlbCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5lbElucHV0KSB7XG4gICAgICAgIHRoaXMuZWxJbnB1dC52YWx1ZSA9IGRhdGE7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICB0aGlzLmVsSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaW5wdXREYXRhLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbElucHV0LnZhbHVlID0gZGF0YTtcbiAgICAgIHRoaXMuZWxJbnB1dC5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCB0aGlzLmtleSk7XG4gICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsSW5wdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5lbElucHV0KSB7XG4gICAgICAgIHRoaXMuZWxJbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuaW5wdXREYXRhLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmVsSW5wdXQucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuZWxJbnB1dCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5lbExhYmVsKSB7XG4gICAgICAgIHRoaXMuZWxMYWJlbC5pbm5lckhUTUwgPSBkYXRhO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmVsTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBpZiAodGhpcy50eXBlID09IEVkaXRvclR5cGUuSW5saW5lKSB7XG4gICAgICAgIHRoaXMuZWxMYWJlbC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuc3dpdGNoTW9kZUVkaXQuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgICB0aGlzLmVsTGFiZWwuc2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJywgdGhpcy5rZXkpO1xuICAgICAgdGhpcy5lbExhYmVsLmlubmVySFRNTCA9IGRhdGE7XG4gICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTGFiZWwpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgc3dpdGNoTW9kZUVkaXQoKSB7XG4gICAgdGhpcy5pc0VkaXQgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIGlucHV0RGF0YShlOiBhbnkpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5rZXksIGUudGFyZ2V0LnZhbHVlLCB0aGlzKTtcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBjaGFuZ2VEYXRhKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgTE9HKCdjaGFuZ2VEYXRhOiA/ID8gPycsIGtleSwgdmFsdWUsIHNlbmRlcik7XG4gIH1cbiAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5lbElucHV0Py5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5pbnB1dERhdGEuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbExhYmVsPy5yZW1vdmVFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuc3dpdGNoTW9kZUVkaXQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke3RoaXMua2V5fWAsIHRoaXMuY2hhbmdlRGF0YS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmRpc3Bvc2UsIHRoaXMuZGlzcG9zZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi4vY29yZS9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgRWRpdG9yLCBFZGl0b3JUeXBlIH0gZnJvbSBcIi4uL2NvcmUvRWRpdG9yXCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHByaXZhdGUgbGFzdERhdGE6IERhdGFGbG93IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGxhYmVsS2V5czogc3RyaW5nW10gPSBbJ2lkJywgJ2tleSddO1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcblxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb3BlcnR5Jyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdQcm9wZXJ0eScsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbWFpbi5vbihFdmVudEVudW0uc2hvd1Byb3BlcnR5LCAoZGV0YWlsOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXJVSShub2RlLCBkZXRhaWwuZGF0YSk7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgcmVuZGVyVUkobm9kZTogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGFGbG93KSB7XG4gICAgaWYgKHRoaXMubGFzdERhdGEgPT0gZGF0YSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmxhc3REYXRhID0gZGF0YTtcbiAgICBub2RlLmlubmVySFRNTCA9ICcnO1xuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSBkYXRhLmdldFByb3BlcnRpZXMoKVxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgcHJvcGVydHlJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHByb3BlcnR5TGFiZWwuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktbGFiZWwnKTtcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0ga2V5O1xuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHByb3BlcnR5VmFsdWUuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktdmFsdWUnKTtcbiAgICAgIGlmICh0aGlzLmxhYmVsS2V5cy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIG5ldyBFZGl0b3IoZGF0YSwga2V5LCBwcm9wZXJ0eVZhbHVlLCBFZGl0b3JUeXBlLkxhYmVsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ldyBFZGl0b3IoZGF0YSwga2V5LCBwcm9wZXJ0eVZhbHVlLCBFZGl0b3JUeXBlLlRleHQpO1xuICAgICAgfVxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5VmFsdWUpO1xuICAgICAgbm9kZS5hcHBlbmRDaGlsZChwcm9wZXJ0eUl0ZW0pO1xuICAgIH0pXG4gIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBFdmVudEZsb3cge1xuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHsgfVxuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gICAgdGhpcy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSVByb3BlcnR5IH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcbiAgcHJpdmF0ZSBkYXRhOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVzOiBhbnkgPSBudWxsO1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBwdWJsaWMgZ2V0UHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXM7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcblxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwcm9wZXJ0eTogSVByb3BlcnR5IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBkYXRhOiBhbnkgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5sb2FkKGRhdGEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgSW5pdERhdGEoZGF0YTogYW55ID0gbnVsbCwgcHJvcGVydGllczogYW55ID0gLTEpIHtcbiAgICBpZiAocHJvcGVydGllcyAhPT0gLTEpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubG9hZChkYXRhKTtcbiAgfVxuICBwcml2YXRlIGV2ZW50RGF0YUNoYW5nZShrZXk6IHN0cmluZywga2V5Q2hpbGQ6IHN0cmluZywgdmFsdWVDaGlsZDogYW55LCBzZW5kZXJDaGlsZDogYW55LCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGluZGV4KSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fV8ke2tleUNoaWxkfWAsIHtcbiAgICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVFdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHB1YmxpYyBPbkV2ZW50RGF0YShpdGVtOiBEYXRhRmxvdywga2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcbiAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfWAsICh7IGtleToga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkIH06IGFueSkgPT4gdGhpcy5ldmVudERhdGFDaGFuZ2Uoa2V5LCBrZXlDaGlsZCwgdmFsdWVDaGlsZCwgc2VuZGVyQ2hpbGQsIGluZGV4KSk7XG4gIH1cbiAgcHJpdmF0ZSBCaW5kRXZlbnQodmFsdWU6IGFueSwga2V5OiBzdHJpbmcpIHtcbiAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHRoaXMuT25FdmVudERhdGEodmFsdWUgYXMgRGF0YUZsb3csIGtleSk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAodmFsdWUgYXMgW10pLmxlbmd0aCA+IDAgJiYgdmFsdWVbMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgKHZhbHVlIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLk9uRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsKSB7XG4gICAgaWYgKHRoaXMuZGF0YVtrZXldICE9IHZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5kYXRhW2tleV0pIHtcbiAgICAgICAgaWYgKHRoaXMuZGF0YVtrZXldIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgICB0aGlzLlJlbW92ZUV2ZW50RGF0YSgodGhpcy5kYXRhW2tleV0gYXMgRGF0YUZsb3cpLCBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGF0YVtrZXldKSAmJiAodGhpcy5kYXRhW2tleV0gYXMgW10pLmxlbmd0aCA+IDAgJiYgdGhpcy5kYXRhW2tleV1bMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICAgICh0aGlzLmRhdGFba2V5XSBhcyBEYXRhRmxvd1tdKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdywgaW5kZXg6IG51bWJlcikgPT4gdGhpcy5SZW1vdmVFdmVudERhdGEoaXRlbSwga2V5LCBpbmRleCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLkJpbmRFdmVudCh2YWx1ZSwga2V5KTtcbiAgICB9XG4gICAgdGhpcy5kYXRhW2tleV0gPSB2YWx1ZTtcbiAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICB9KTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICB9KTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBHZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2tleV07XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5kYXRhID0ge307XG4gICAgaWYgKCF0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMucHJvcGVydHk/LmdldFByb3BlcnR5QnlLZXkoZGF0YS5rZXkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5wcm9wZXJ0aWVzKSkge1xuICAgICAgICB0aGlzLmRhdGFba2V5XSA9IChkYXRhPy5ba2V5XSA/PyAoKHR5cGVvZiB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCA9PT0gXCJmdW5jdGlvblwiID8gdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQoKSA6IHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0KSA/PyBcIlwiKSk7XG4gICAgICAgIHRoaXMuQmluZEV2ZW50KHRoaXMuZGF0YVtrZXldLCBrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudG9Kc29uKCkpO1xuICB9XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgbGV0IHJzOiBhbnkgPSB7fTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5wcm9wZXJ0aWVzKSkge1xuICAgICAgcnNba2V5XSA9IHRoaXMuR2V0KGtleSk7XG4gICAgICBpZiAocnNba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgIHJzW2tleV0gPSByc1trZXldLnRvSnNvbigpO1xuICAgICAgfVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocnNba2V5XSkgJiYgKHJzW2tleV0gYXMgW10pLmxlbmd0aCA+IDAgJiYgcnNba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgIHJzW2tleV0gPSByc1trZXldLm1hcCgoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0udG9Kc29uKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnM7XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJUHJvcGVydHkge1xuICBnZXRQcm9wZXJ0eUJ5S2V5KGtleTogc3RyaW5nKTogYW55O1xufVxuZXhwb3J0IGludGVyZmFjZSBJQ29udHJvbE5vZGUgZXh0ZW5kcyBJUHJvcGVydHkge1xuICBnZXRDb250cm9sTm9kZUJ5S2V5KGtleTogc3RyaW5nKTogYW55O1xufVxuZXhwb3J0IGludGVyZmFjZSBJRXZlbnQge1xuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSk6IHZvaWQ7XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpOiB2b2lkO1xuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KTogdm9pZDtcbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KTogdm9pZDtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSU1haW4gZXh0ZW5kcyBJQ29udHJvbE5vZGUsIElFdmVudCB7XG4gIGdldENvbnRyb2xBbGwoKTogYW55W107XG4gIHNldENvbnRyb2xDaG9vc2Uoa2V5OiBzdHJpbmcgfCBudWxsKTogdm9pZDtcbiAgZ2V0Q29udHJvbENob29zZSgpOiBzdHJpbmcgfCBudWxsO1xuICBnZXRDb250cm9sQnlLZXkoa2V5OiBzdHJpbmcpOiBhbnk7XG59XG5leHBvcnQgY2xhc3MgRmxvd0NvcmUgaW1wbGVtZW50cyBJRXZlbnQge1xuICBwdWJsaWMgR2V0SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2lkJyk7XG4gIH1cbiAgcHVibGljIFNldElkKGlkOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgnaWQnLCBpZCk7XG4gIH1cbiAgcHVibGljIHByb3BlcnRpZXM6IGFueSA9IHt9O1xuICBwdWJsaWMgZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3coKTtcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIENoZWNrRWxlbWVudENoaWxkKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHJldHVybiB0aGlzLmVsTm9kZSA9PSBlbCB8fCB0aGlzLmVsTm9kZS5jb250YWlucyhlbCk7XG4gIH1cbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgcHVibGljIHNldERhdGEoZGF0YTogRGF0YUZsb3cpIHtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIHRoaXMuQmluZERhdGFFdmVudCgpO1xuICAgIHRoaXMuZGlzcGF0Y2goYGJpbmRfZGF0YV9ldmVudGAsIHsgZGF0YSwgc2VuZGVyOiB0aGlzIH0pO1xuICB9XG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICB9XG4gIEJpbmREYXRhRXZlbnQoKSB7XG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSlcbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG4gICAgdGhpcy5CaW5kRGF0YUV2ZW50KCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEJhc2VGbG93PFRQYXJlbnQgZXh0ZW5kcyBGbG93Q29yZT4gZXh0ZW5kcyBGbG93Q29yZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyZW50OiBUUGFyZW50KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuL05vZGVcIjtcblxuZXhwb3J0IGNsYXNzIExpbmUge1xuICBwdWJsaWMgZWxOb2RlOiBTVkdFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwic3ZnXCIpO1xuICBwdWJsaWMgZWxQYXRoOiBTVkdQYXRoRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInBhdGhcIik7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZnJvbTogTm9kZSwgcHVibGljIGZyb21JbmRleDogbnVtYmVyID0gMCwgcHVibGljIHRvOiBOb2RlIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBwdWJsaWMgdG9JbmRleDogbnVtYmVyID0gMCkge1xuICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoXCJtYWluLXBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCAnJyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcImNvbm5lY3Rpb25cIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbFBhdGgpO1xuICAgIHRoaXMuZnJvbS5wYXJlbnQuZWxDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMuZnJvbS5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudG8/LkFkZExpbmUodGhpcyk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVRvKHRvX3g6IG51bWJlciwgdG9feTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmZyb20gfHwgdGhpcy5mcm9tLmVsTm9kZSA9PSBudWxsKSByZXR1cm47XG4gICAgbGV0IHsgeDogZnJvbV94LCB5OiBmcm9tX3kgfTogYW55ID0gdGhpcy5mcm9tLmdldFBvc3Rpc2lvbkRvdCh0aGlzLmZyb21JbmRleCk7XG4gICAgdmFyIGxpbmVDdXJ2ZSA9IHRoaXMuY3JlYXRlQ3VydmF0dXJlKGZyb21feCwgZnJvbV95LCB0b194LCB0b195LCB0aGlzLmN1cnZhdHVyZSwgJ29wZW5jbG9zZScpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgbGluZUN1cnZlKTtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKTogTGluZSB7XG4gICAgLy9Qb3N0aW9uIG91dHB1dFxuICAgIGlmICh0aGlzLnRvICYmIHRoaXMudG8uZWxOb2RlKSB7XG4gICAgICBsZXQgeyB4OiB0b194LCB5OiB0b195IH06IGFueSA9IHRoaXMudG8uZ2V0UG9zdGlzaW9uRG90KHRoaXMudG9JbmRleCk7XG4gICAgICB0aGlzLnVwZGF0ZVRvKHRvX3gsIHRvX3kpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBwdWJsaWMgQWN0aXZlKGZsZzogYW55ID0gdHJ1ZSkge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBjcmVhdGVDdXJ2YXR1cmUoc3RhcnRfcG9zX3g6IG51bWJlciwgc3RhcnRfcG9zX3k6IG51bWJlciwgZW5kX3Bvc194OiBudW1iZXIsIGVuZF9wb3NfeTogbnVtYmVyLCBjdXJ2YXR1cmVfdmFsdWU6IG51bWJlciwgdHlwZTogc3RyaW5nKSB7XG4gICAgbGV0IGxpbmVfeCA9IHN0YXJ0X3Bvc194O1xuICAgIGxldCBsaW5lX3kgPSBzdGFydF9wb3NfeTtcbiAgICBsZXQgeCA9IGVuZF9wb3NfeDtcbiAgICBsZXQgeSA9IGVuZF9wb3NfeTtcbiAgICBsZXQgY3VydmF0dXJlID0gY3VydmF0dXJlX3ZhbHVlO1xuICAgIC8vdHlwZSBvcGVuY2xvc2Ugb3BlbiBjbG9zZSBvdGhlclxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAnb3Blbic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjbG9zZSc6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ290aGVyJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG5cbiAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuXG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGRlbGV0ZShub2RlVGhpczogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKHRoaXMuZnJvbSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50bz8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsTm9kZT8ucmVtb3ZlKCk7XG4gIH1cbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XG4gICAgdGhpcy5mcm9tLnBhcmVudC5zZXRMaW5lQ2hvb3NlKHRoaXMpXG4gIH1cbiAgcHVibGljIHNldE5vZGVUbyhub2RlOiBOb2RlIHwgdW5kZWZpbmVkLCB0b0luZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLnRvID0gbm9kZTtcbiAgICB0aGlzLnRvSW5kZXggPSB0b0luZGV4O1xuICB9XG4gIHB1YmxpYyBDbG9uZSgpIHtcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvSW5kZXgpIHtcbiAgICAgIHJldHVybiBuZXcgTGluZSh0aGlzLmZyb20sIHRoaXMuZnJvbUluZGV4LCB0aGlzLnRvLCB0aGlzLnRvSW5kZXgpLlVwZGF0ZVVJKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBnZXRUaW1lIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcbmltcG9ydCB7IE5vZGUgfSBmcm9tIFwiLi9Ob2RlXCI7XG5cbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcbiAgTm9uZSA9IDAsXG4gIE5vZGUgPSAxLFxuICBDYW52YXMgPSAyLFxuICBMaW5lID0gMyxcbn1cbmV4cG9ydCBjb25zdCBab29tID0ge1xuICBtYXg6IDEuNixcbiAgbWluOiAwLjYsXG4gIHZhbHVlOiAwLjEsXG4gIGRlZmF1bHQ6IDFcbn1cbmV4cG9ydCBjbGFzcyBEZXNnaW5lclZpZXdfRXZlbnQge1xuICBwcml2YXRlIHpvb21fbGFzdF92YWx1ZTogYW55ID0gMTtcblxuICBwcml2YXRlIHRpbWVGYXN0Q2xpY2s6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgdGFnSW5nb3JlID0gWydpbnB1dCcsICdidXR0b24nLCAnYScsICd0ZXh0YXJlYSddO1xuXG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgcHJpdmF0ZSBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgZmxnTW92ZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgYXZfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBhdl95OiBudW1iZXIgPSAwO1xuXG4gIHByaXZhdGUgcG9zX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgcG9zX3k6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb3VzZV95OiBudW1iZXIgPSAwO1xuXG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmUgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogRGVzZ2luZXJWaWV3KSB7XG4gICAgLyogTW91c2UgYW5kIFRvdWNoIEFjdGlvbnMgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG4gICAgLyogQ29udGV4dCBNZW51ICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcblxuICAgIC8qIERyb3AgRHJhcCAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5ub2RlX2Ryb3BFbmQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5ub2RlX2RyYWdvdmVyLmJpbmQodGhpcykpO1xuICAgIC8qIFpvb20gTW91c2UgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLnpvb21fZW50ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogRGVsZXRlICovXG4gICAgLy8gdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWRvd24uYmluZCh0aGlzKSk7XG4gIH1cblxuICBwcml2YXRlIGNvbnRleHRtZW51KGV2OiBhbnkpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfVxuICBwcml2YXRlIG5vZGVfZHJhZ292ZXIoZXY6IGFueSkgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gIHByaXZhdGUgbm9kZV9kcm9wRW5kKGV2OiBhbnkpIHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGxldCBrZXlOb2RlOiBhbnkgPSB0aGlzLnBhcmVudC5tYWluLmdldENvbnRyb2xDaG9vc2UoKTtcbiAgICBpZiAoIWtleU5vZGUgJiYgZXYudHlwZSAhPT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xuICAgIH1cbiAgICBpZiAoIWtleU5vZGUpIHJldHVybjtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgbGV0IHkgPSB0aGlzLnBhcmVudC5DYWxjWSh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG5cbiAgICBpZiAodGhpcy5wYXJlbnQuY2hlY2tPbmx5Tm9kZShrZXlOb2RlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgbm9kZUl0ZW0gPSB0aGlzLnBhcmVudC5BZGROb2RlKGtleU5vZGUpO1xuICAgIG5vZGVJdGVtLnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICB9XG4gIHB1YmxpYyB6b29tX2VudGVyKGV2ZW50OiBhbnkpIHtcbiAgICBpZiAoZXZlbnQuY3RybEtleSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgaWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcbiAgICAgICAgLy8gWm9vbSBPdXRcbiAgICAgICAgdGhpcy56b29tX291dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gWm9vbSBJblxuICAgICAgICB0aGlzLnpvb21faW4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21fcmVmcmVzaChmbGc6IGFueSA9IDApIHtcbiAgICBsZXQgdGVtcF96b29tID0gZmxnID09IDAgPyBab29tLmRlZmF1bHQgOiAodGhpcy5wYXJlbnQuZ2V0Wm9vbSgpICsgWm9vbS52YWx1ZSAqIGZsZyk7XG4gICAgaWYgKFpvb20ubWF4ID49IHRlbXBfem9vbSAmJiB0ZW1wX3pvb20gPj0gWm9vbS5taW4pIHtcbiAgICAgIHRoaXMucGFyZW50LnNldFgoKHRoaXMucGFyZW50LmdldFgoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XG4gICAgICB0aGlzLnBhcmVudC5zZXRZKCh0aGlzLnBhcmVudC5nZXRZKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0ZW1wX3pvb20pO1xuICAgICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0ZW1wX3pvb207XG4gICAgICB0aGlzLnBhcmVudC5zZXRab29tKHRoaXMuem9vbV9sYXN0X3ZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21faW4oKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMSk7XG4gIH1cbiAgcHVibGljIHpvb21fb3V0KCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKC0xKTtcbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgwKTtcbiAgfVxuICBwcml2YXRlIFN0YXJ0TW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMudGFnSW5nb3JlLmluY2x1ZGVzKGV2LnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudGltZUZhc3RDbGljayA9IGdldFRpbWUoKTtcbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWFpbi1wYXRoJykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkNhbnZhcztcbiAgICBsZXQgbm9kZUNob29zZSA9IHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKTtcbiAgICBpZiAobm9kZUNob29zZSAmJiBub2RlQ2hvb3NlLkNoZWNrRWxlbWVudENoaWxkKGV2LnRhcmdldCkpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIGlmIChub2RlQ2hvb3NlICYmIHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTm9kZSAmJiBldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibm9kZS1kb3RcIikpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xuICAgICAgbGV0IGZyb21JbmRleCA9IGV2LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSBuZXcgTGluZShub2RlQ2hvb3NlLCBmcm9tSW5kZXgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIHRoaXMuYXZfeCA9IHRoaXMucGFyZW50LmdldFgoKTtcbiAgICAgIHRoaXMuYXZfeSA9IHRoaXMucGFyZW50LmdldFkoKTtcbiAgICB9XG4gICAgdGhpcy5mbGdEcmFwID0gdHJ1ZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwdWJsaWMgTW92ZShldjogYW55KSB7XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICB0aGlzLmZsZ01vdmUgPSB0cnVlO1xuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubW92ZVR5cGUpIHtcbiAgICAgIGNhc2UgTW92ZVR5cGUuQ2FudmFzOlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcbiAgICAgICAgICBsZXQgeSA9IHRoaXMuYXZfeSArIHRoaXMucGFyZW50LkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgICAgIHRoaXMucGFyZW50LnNldFgoeCk7XG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgY2FzZSBNb3ZlVHlwZS5Ob2RlOlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBvc194IC0gZV9wb3NfeCk7XG4gICAgICAgICAgbGV0IHkgPSB0aGlzLnBhcmVudC5DYWxjWSh0aGlzLnBvc195IC0gZV9wb3NfeSk7XG4gICAgICAgICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgICAgICAgdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpPy51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgY2FzZSBNb3ZlVHlwZS5MaW5lOlxuICAgICAgICB7XG4gICAgICAgICAgaWYgKHRoaXMudGVtcExpbmUpIHtcbiAgICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgICAgICAgICAgbGV0IHkgPSB0aGlzLnBhcmVudC5DYWxjWSh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnVwZGF0ZVRvKHRoaXMucGFyZW50LmVsQ2FudmFzLm9mZnNldExlZnQgLSB4LCB0aGlzLnBhcmVudC5lbENhbnZhcy5vZmZzZXRUb3AgLSB5KTtcbiAgICAgICAgICAgIGxldCBub2RlRWwgPSBldi50YXJnZXQuY2xvc2VzdCgnW25vZGUtaWRdJyk7XG4gICAgICAgICAgICBsZXQgbm9kZUlkID0gbm9kZUVsPy5nZXRBdHRyaWJ1dGUoJ25vZGUtaWQnKTtcbiAgICAgICAgICAgIGxldCBub2RlVG8gPSBub2RlSWQgPyB0aGlzLnBhcmVudC5HZXROb2RlQnlJZChub2RlSWQpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKG5vZGVUbyAmJiBldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibm9kZS1kb3RcIikpIHtcbiAgICAgICAgICAgICAgbGV0IHRvSW5kZXggPSBldi50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICAgICAgICAgIHRoaXMudGVtcExpbmUuc2V0Tm9kZVRvKG5vZGVUbywgdG9JbmRleCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgdG9JbmRleCA9IG5vZGVFbD8ucXVlcnlTZWxlY3RvcignLm5vZGUtZG90Jyk/LlswXT8uZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICAgICAgICAgIHRoaXMudGVtcExpbmUuc2V0Tm9kZVRvKG5vZGVUbywgdG9JbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIHRoaXMubW91c2VfeCA9IGVfcG9zX3g7XG4gICAgICB0aGlzLm1vdXNlX3kgPSBlX3Bvc195O1xuICAgIH1cbiAgfVxuICBwcml2YXRlIEVuZE1vdmUoZXY6IGFueSkge1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgLy9maXggRmFzdCBDbGlja1xuICAgIGlmICgoKGdldFRpbWUoKSAtIHRoaXMudGltZUZhc3RDbGljaykgPCAxMDApIHx8ICF0aGlzLmZsZ01vdmUpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGVfcG9zX3ggPSB0aGlzLm1vdXNlX3g7XG4gICAgICBlX3Bvc195ID0gdGhpcy5tb3VzZV95O1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICBsZXQgeCA9IHRoaXMuYXZfeCArIHRoaXMucGFyZW50LkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgbGV0IHkgPSB0aGlzLmF2X3kgKyB0aGlzLnBhcmVudC5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcbiAgICAgIHRoaXMucGFyZW50LnNldFgoeCk7XG4gICAgICB0aGlzLnBhcmVudC5zZXRZKHkpO1xuICAgICAgdGhpcy5hdl94ID0gMDtcbiAgICAgIHRoaXMuYXZfeSA9IDA7XG4gICAgfVxuICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICB0aGlzLnRlbXBMaW5lLkNsb25lKCk7XG4gICAgICB0aGlzLnRlbXBMaW5lLmRlbGV0ZSgpO1xuICAgIH1cbiAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgZ2V0VXVpZCB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuXG5jb25zdCBnZXZhbCA9IGV2YWw7XG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIEJhc2VGbG93PERlc2dpbmVyVmlldz4ge1xuICAvKipcbiAgICogR0VUIFNFVCBmb3IgRGF0YVxuICAgKi9cbiAgcHVibGljIGdldFkoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd5Jyk7XG4gIH1cbiAgcHVibGljIHNldFkodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd5JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRYKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneCcpO1xuICB9XG4gIHB1YmxpYyBzZXRYKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgQ2hlY2tLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgna2V5JykgPT0ga2V5O1xuICB9XG4gIHB1YmxpYyBlbENvbnRlbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgYXJyTGluZTogTGluZVtdID0gW107XG4gIHByaXZhdGUgb3B0aW9uOiBhbnkgPSB7fTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBEZXNnaW5lclZpZXcsIHByaXZhdGUga2V5Tm9kZTogYW55LCBkYXRhOiBhbnkgPSB7fSkge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5vcHRpb24gPSB0aGlzLnBhcmVudC5tYWluLmdldENvbnRyb2xOb2RlQnlLZXkoa2V5Tm9kZSk7XG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5vcHRpb24/LnByb3BlcnRpZXM7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKGRhdGEsIHRoaXMucHJvcGVydGllcyk7XG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLnJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLW5vZGUnKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbi5jbGFzcykge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbi5jbGFzcyk7XG4gICAgfVxuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ25vZGUtaWQnLCB0aGlzLkdldElkKCkpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMucmVuZGVyVUkoKTtcbiAgfVxuICBwcml2YXRlIHJlbmRlclVJKCkge1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjQwMDBcIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXRvcFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCIxMDAwXCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50XCI+JHt0aGlzLm9wdGlvbi5odG1sfTwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3R0b21cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiMjAwMFwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtcmlnaHRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtZG90XCIgIG5vZGU9XCIzMDAwXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuICAgIHRoaXMuZWxDb250ZW50ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLm5vZGUtY29udGVudCcpO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlUG9zaXRpb24oeDogYW55LCB5OiBhbnksIGlDaGVjayA9IGZhbHNlKSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICBpZiAoaUNoZWNrKSB7XG4gICAgICAgIGlmICh4ICE9PSB0aGlzLmdldFgoKSkge1xuICAgICAgICAgIHRoaXMuc2V0WCh4KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeSAhPT0gdGhpcy5nZXRZKCkpIHtcbiAgICAgICAgICB0aGlzLnNldFgoeSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0WSgodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSkpO1xuICAgICAgICB0aGlzLnNldFgoKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcnJMaW5lO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmUpIHtcbiAgICB0aGlzLmFyckxpbmUgPSBbLi4udGhpcy5hcnJMaW5lLCBsaW5lXTtcbiAgfVxuICBwdWJsaWMgZ2V0UG9zdGlzaW9uRG90KGluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZT8ucXVlcnlTZWxlY3RvcihgLm5vZGUtZG90W25vZGU9XCIke2luZGV4fVwiXWApO1xuICAgIGlmIChlbERvdCkge1xuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xuICAgICAgbGV0IHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCArIGVsRG90Lm9mZnNldExlZnQgKyAxMCk7XG4gICAgICByZXR1cm4geyB4LCB5IH07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XG4gICAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLlVwZGF0ZVVJKCk7XG4gICAgICB9KVxuICB9XG59XG4iLCJpbXBvcnQgeyBGbG93Q29yZSwgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtLCBQcm9wZXJ0eUVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3X0V2ZW50IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3X0V2ZW50XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuL05vZGVcIjtcblxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlldyBleHRlbmRzIEZsb3dDb3JlIHtcbiAgLyoqXG4gICAqIEdFVCBTRVQgZm9yIERhdGFcbiAgICovXG4gIHB1YmxpYyBnZXRab29tKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCd6b29tJyk7XG4gIH1cbiAgcHVibGljIHNldFpvb20odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd6b29tJywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCd5Jyk7XG4gIH1cbiAgcHVibGljIHNldFkodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd5JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRYKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd4JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHByaXZhdGUgcmVhZG9ubHkgdmlld19ldmVudDogRGVzZ2luZXJWaWV3X0V2ZW50IHwgdW5kZWZpbmVkO1xuXG4gIHByaXZhdGUgbGluZUNob29zZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldExpbmVDaG9vc2Uobm9kZTogTGluZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHRoaXMubGluZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubGluZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkge1xuICAgICAgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRMaW5lQ2hvb3NlKCk6IExpbmUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmxpbmVDaG9vc2U7XG4gIH1cbiAgcHJpdmF0ZSBub2RlczogTm9kZVtdID0gW107XG4gIHByaXZhdGUgbm9kZUNob29zZTogTm9kZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldE5vZGVDaG9vc2Uobm9kZTogTm9kZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHRoaXMubm9kZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubm9kZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkge1xuICAgICAgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXRMaW5lQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5ub2RlQ2hvb3NlLmRhdGEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLmRhdGEgfSk7XG4gICAgfVxuXG4gIH1cbiAgcHVibGljIGdldE5vZGVDaG9vc2UoKTogTm9kZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubm9kZUNob29zZTtcbiAgfVxuICBwdWJsaWMgQWRkTm9kZShrZXlOb2RlOiBzdHJpbmcsIGRhdGE6IGFueSA9IHt9KTogTm9kZSB7XG4gICAgcmV0dXJuIHRoaXMuSW5zZXJ0Tm9kZShuZXcgTm9kZSh0aGlzLCBrZXlOb2RlLCBkYXRhKSk7XG4gIH1cbiAgcHVibGljIEluc2VydE5vZGUobm9kZTogTm9kZSk6IE5vZGUge1xuICAgIHRoaXMubm9kZXMgPSBbLi4udGhpcy5ub2Rlcywgbm9kZV07XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbiAgLyoqXG4gICAqIFZhcmlidXRlXG4gICovXG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5lbE5vZGUgPSBlbE5vZGU7XG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5tYWluKTtcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoe30sIHByb3BlcnRpZXMpO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgdGhpcy5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5SZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnZpZXdfZXZlbnQgPSBuZXcgRGVzZ2luZXJWaWV3X0V2ZW50KHRoaXMpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVWaWV3KHg6IGFueSwgeTogYW55LCB6b29tOiBhbnkpIHtcbiAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt4fXB4LCAke3l9cHgpIHNjYWxlKCR7em9vbX0pYDtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZVZpZXcodGhpcy5nZXRYKCksIHRoaXMuZ2V0WSgpLCB0aGlzLmdldFpvb20oKSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIFJlbmRlclVJKCkge1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICcnO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2Rlc2dpbmVyLXZpZXcnKVxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LnJlbW92ZShcImRlc2dpbmVyLWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdkZXNnaW5lci12aWV3JylcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5hZGQoXCJkZXNnaW5lci1jYW52YXNcIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XG4gICAgdGhpcy5lbE5vZGUudGFiSW5kZXggPSAwO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgfVxuICBwdWJsaWMgQ2FsY1gobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50V2lkdGggLyAodGhpcy5lbE5vZGU/LmNsaWVudFdpZHRoICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwdWJsaWMgQ2FsY1kobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxOb2RlPy5jbGllbnRIZWlnaHQgKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHB1YmxpYyBHZXRBbGxOb2RlKCk6IE5vZGVbXSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZXMgfHwgW107XG4gIH1cbiAgcHVibGljIEdldE5vZGVCeUlkKGlkOiBzdHJpbmcpOiBOb2RlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5HZXRBbGxOb2RlKCkuZmlsdGVyKG5vZGUgPT4gbm9kZS5HZXRJZCgpID09IGlkKT8uWzBdO1xuICB9XG5cbiAgY2hlY2tPbmx5Tm9kZShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiAodGhpcy5tYWluLmdldENvbnRyb2xCeUtleShrZXkpLm9ubHlOb2RlKSAmJiB0aGlzLm5vZGVzLmZpbHRlcihpdGVtID0+IGl0ZW0uQ2hlY2tLZXkoa2V5KSkubGVuZ3RoID4gMDtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSUNvbnRyb2xOb2RlLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVmlld0RvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIG5ldyBEZXNnaW5lclZpZXcodGhpcy5lbE5vZGUsIG1haW4pLm9uKEV2ZW50RW51bS5zaG93UHJvcGVydHksIChkYXRhOiBhbnkpID0+IG1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgZGF0YSkpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBEb2NrRW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBDb250cm9sRG9jayB9IGZyb20gXCIuL0NvbnRyb2xEb2NrXCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5pbXBvcnQgeyBQcm9wZXJ0eURvY2sgfSBmcm9tIFwiLi9Qcm9wZXJ0eURvY2tcIjtcbmltcG9ydCB7IFZpZXdEb2NrIH0gZnJvbSBcIi4vVmlld0RvY2tcIjtcblxuZXhwb3J0IGNsYXNzIERvY2tNYW5hZ2VyIHtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHt9XG4gIHB1YmxpYyByZXNldCgpIHtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IHt9O1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5sZWZ0LCBDb250cm9sRG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnJpZ2h0LCBQcm9wZXJ0eURvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS52aWV3LCBWaWV3RG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnRvcCwgRG9ja0Jhc2UpO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5ib3R0b20sIERvY2tCYXNlKTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gIH1cbiAgcHVibGljIGFkZERvY2soJGtleTogc3RyaW5nLCAkdmlldzogYW55KSB7XG4gICAgaWYgKCF0aGlzLiRkb2NrTWFuYWdlclska2V5XSlcbiAgICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gW107XG4gICAgdGhpcy4kZG9ja01hbmFnZXJbJGtleV0gPSBbLi4udGhpcy4kZG9ja01hbmFnZXJbJGtleV0sICR2aWV3XTtcbiAgfVxuXG4gIHB1YmxpYyBSZW5kZXJVSSgpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwidnMtbGVmdCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidnMtY29udGVudFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwidnMtdG9wIHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXZpZXcgdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwidnMtYm90dG9tIHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZzLXJpZ2h0IHZzLWRvY2tcIj48L2Rpdj5cbiAgICBgO1xuICAgIE9iamVjdC5rZXlzKHRoaXMuJGRvY2tNYW5hZ2VyKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IHF1ZXJ5U2VsZWN0b3IgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAuJHtrZXl9YCk7XG4gICAgICBpZiAocXVlcnlTZWxlY3Rvcikge1xuICAgICAgICB0aGlzLiRkb2NrTWFuYWdlcltrZXldLmZvckVhY2goKCRpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICBuZXcgJGl0ZW0ocXVlcnlTZWxlY3RvciwgdGhpcy5tYWluKTtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tICcuL2NvcmUvQmFzZUZsb3cnO1xuaW1wb3J0IHsgRG9ja01hbmFnZXIgfSBmcm9tICcuL2RvY2svRG9ja01hbmFnZXInO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSAnLi9jb3JlL0V2ZW50Rmxvdyc7XG5pbXBvcnQgeyBQcm9wZXJ0eUVudW0gfSBmcm9tICcuL2NvcmUvQ29uc3RhbnQnO1xuaW1wb3J0IHsgZ2V0VGltZSB9IGZyb20gJy4vY29yZS9VdGlscyc7XG5leHBvcnQgY2xhc3MgVmlzdWFsRmxvdyBpbXBsZW1lbnRzIElNYWluIHtcbiAgcHJpdmF0ZSAkcHJvcGVydGllczogYW55ID0ge307XG4gIHByaXZhdGUgJGNvbnRyb2w6IGFueSA9IHt9O1xuICBwcml2YXRlICRjb250cm9sQ2hvb3NlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IERvY2tNYW5hZ2VyO1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBwdWJsaWMgZ2V0RG9ja01hbmFnZXIoKTogRG9ja01hbmFnZXIge1xuICAgIHJldHVybiB0aGlzLiRkb2NrTWFuYWdlcjtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBnZXRDb250cm9sQWxsKCkge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sID8/IHt9O1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG9wdGlvbjogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5tYWluXSA9IHtcbiAgICAgIC4uLihvcHRpb24/LnByb3BlcnRpZXMgfHwge30pLFxuICAgICAgaWQ6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiBcIlwiXG4gICAgICB9LFxuICAgICAgeDoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgeToge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgem9vbToge1xuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyBzZXQgY29udHJvbFxuICAgIHRoaXMuJGNvbnRyb2wgPSBvcHRpb24/LmNvbnRyb2wgfHwge307XG4gICAgT2JqZWN0LmtleXModGhpcy4kY29udHJvbCkuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMuJHByb3BlcnRpZXNbYG5vZGVfJHtrZXl9YF0gPSB7XG4gICAgICAgIC4uLih0aGlzLiRjb250cm9sW2tleV0ucHJvcGVydGllcyB8fCB7fSksXG4gICAgICAgIGlkOiB7XG4gICAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICAgIH0sXG4gICAgICAgIGtleToge1xuICAgICAgICAgIGRlZmF1bHQ6IGtleVxuICAgICAgICB9LFxuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgZGVmYXVsdDogXCJcIlxuICAgICAgICB9LFxuICAgICAgICB4OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9KTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IG5ldyBEb2NrTWFuYWdlcih0aGlzLmNvbnRhaW5lciwgdGhpcyk7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIucmVzZXQoKTtcbiAgfVxuICBzZXRDb250cm9sQ2hvb3NlKGtleTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuJGNvbnRyb2xDaG9vc2UgPSBrZXk7XG4gIH1cbiAgZ2V0Q29udHJvbENob29zZSgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbENob29zZTtcbiAgfVxuICBnZXRDb250cm9sQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbFtrZXldIHx8IHt9O1xuICB9XG4gIGdldENvbnRyb2xOb2RlQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy5nZXRDb250cm9sQnlLZXkoa2V5KSxcbiAgICAgIHByb3BlcnRpZXM6IHRoaXMuZ2V0UHJvcGVydHlCeUtleShgbm9kZV8ke2tleX1gKVxuICAgIH1cbiAgfVxuICBnZXRQcm9wZXJ0eUJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuJHByb3BlcnRpZXNba2V5XTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBTyxNQUFNLFNBQVMsR0FBRztBQUN2QixJQUFBLElBQUksRUFBRSxNQUFNO0FBQ1osSUFBQSxVQUFVLEVBQUUsWUFBWTtBQUN4QixJQUFBLFlBQVksRUFBRSxjQUFjO0FBQzVCLElBQUEsTUFBTSxFQUFFLFFBQVE7QUFDaEIsSUFBQSxPQUFPLEVBQUUsU0FBUztDQUNuQixDQUFBO0FBRU0sTUFBTSxRQUFRLEdBQUc7QUFDdEIsSUFBQSxJQUFJLEVBQUUsU0FBUztBQUNmLElBQUEsR0FBRyxFQUFFLFFBQVE7QUFDYixJQUFBLElBQUksRUFBRSxTQUFTO0FBQ2YsSUFBQSxNQUFNLEVBQUUsV0FBVztBQUNuQixJQUFBLEtBQUssRUFBRSxVQUFVO0NBQ2xCLENBQUE7QUFFTSxNQUFNLFlBQVksR0FBRztBQUMxQixJQUFBLElBQUksRUFBRSxjQUFjO0NBQ3JCOztNQ2hCWSxRQUFRLENBQUE7QUFFa0MsSUFBQSxJQUFBLENBQUE7QUFEOUMsSUFBQSxNQUFNLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0QsV0FBbUIsQ0FBQSxTQUFzQixFQUFZLElBQVcsRUFBQTtRQUFYLElBQUksQ0FBQSxJQUFBLEdBQUosSUFBSSxDQUFPO0FBQzlELFFBQUEsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbkMsUUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUM7S0FDcEM7SUFDTSxPQUFPLENBQUMsS0FBYSxFQUFFLFNBQWMsRUFBQTtRQUMxQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENB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
