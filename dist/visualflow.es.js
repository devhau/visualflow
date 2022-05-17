
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow.js v0.0.5
   * Released under the MIT license.
   */

const EventEnum = {
    init: "init",
    dataChange: "dataChange",
    showProperty: "showProperty",
    openProject: "openProject",
    newProject: "newProject",
    changeVariable: "changeVariable",
    change: "change",
    dispose: "dispose",
    groupChange: "groupChange",
};
const DockEnum = {
    left: "vs-left",
    top: "vs-top",
    view: "vs-view",
    bottom: "vs-bottom",
    right: "vs-right",
};
const PropertyEnum = {
    main: "main_project",
    solution: 'main_solution',
    line: 'main_line',
    variable: 'main_variable',
    groupCavas: "main_groupCavas",
};

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
    Set(key, value, sender = null, isDispatch = true) {
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
        if (isDispatch) {
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
    }
    SetData(data, sender = null, isClearData = false) {
        if (isClearData)
            this.data = {};
        if (data instanceof DataFlow) {
            let $data = data;
            if (!this.property && $data.property)
                this.property = $data.property;
            if (this.properties) {
                for (let key of Object.keys(this.properties)) {
                    this.Set(key, $data.Get(key), sender, false);
                }
            }
            else {
                for (let key of Object.keys($data.getProperties())) {
                    this.Set(key, $data.Get(key), sender, false);
                }
            }
        }
        else {
            Object.keys(data).forEach(key => {
                this.Set(key, data[key], sender, false);
            });
        }
        this.dispatch(EventEnum.change, {
            data
        });
    }
    Get(key) {
        return this.data[key];
    }
    Append(key, value) {
        if (!this.data[key])
            this.data[key] = [];
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
                if (!(this.data[key] instanceof DataFlow) && this.data[key].key) {
                    this.data[key] = new DataFlow(this.property, this.data[key]);
                }
                if (Array.isArray(this.data[key]) && this.property && !(this.data[key][0] instanceof DataFlow)) {
                    this.data[key] = this.data[key].map((item) => {
                        if (!(item instanceof DataFlow) && item.key) {
                            return new DataFlow(this.property, item);
                        }
                        else {
                            return item;
                        }
                    });
                }
                this.BindEvent(this.data[key], key);
            }
        }
    }
    toString() {
        return JSON.stringify(this.toJson());
    }
    toJson() {
        let rs = {};
        if (!this.properties) {
            this.properties = this.property?.getPropertyByKey(this.data.key);
        }
        for (let key of Object.keys(this.properties)) {
            rs[key] = this.Get(key);
            if (rs[key] instanceof DataFlow) {
                rs[key] = rs[key].toJson();
            }
            else if (Array.isArray(rs[key]) && rs[key].length > 0 && rs[key][0] instanceof DataFlow) {
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
    SetData(data, sender = null) {
        this.data.SetData(data, sender);
    }
    SetDataFlow(data) {
        this.data.SetData(data, this, true);
        this.dispatch(`bind_data_event`, { data, sender: this });
        this.dispatch(EventEnum.change, { data, sender: this });
    }
    onSafe(event, callback) {
        this.events.onSafe(event, callback);
        return this;
    }
    on(event, callback) {
        this.events.on(event, callback);
        return this;
    }
    removeListener(event, callback) {
        this.events.removeListener(event, callback);
    }
    dispatch(event, details) {
        this.events.dispatch(event, details);
    }
    RemoveDataEvent() {
        this.data.removeListener(EventEnum.dataChange, ({ key, value, sender }) => {
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
        this.data.removeListener(EventEnum.change, ({ key, value, sender }) => {
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
    }
}
class BaseFlow extends FlowCore {
    parent;
    constructor(parent) {
        super();
        this.parent = parent;
    }
}

const LOG = (message, ...optionalParams) => console.log(message, optionalParams);
const getDate = () => (new Date());
const getTime = () => getDate().getTime();
const getUuid = () => {
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
};
const compareSort = (a, b) => {
    if (a.sort < b.sort) {
        return -1;
    }
    if (a.sort > b.sort) {
        return 1;
    }
    return 0;
};
const isFunction = (fn) => {
    return fn && fn instanceof Function;
};
const downloadObjectAsJson = (exportObj, exportName) => {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};
const readFileLocal = (callback) => {
    var inputEl = document.createElement('input');
    inputEl.setAttribute('type', 'file');
    inputEl.addEventListener('change', function () {
        var fr = new FileReader();
        fr.onload = function () {
            callback?.(fr.result);
        };
        if (inputEl && inputEl.files)
            fr.readAsText(inputEl.files[0]);
    });
    document.body.appendChild(inputEl);
    inputEl.click();
    inputEl.remove();
};

const TagView = ['SPAN', 'DIV', 'P', 'TEXTAREA'];
class DataView {
    el;
    data;
    main;
    keyName;
    elNode;
    property;
    constructor(el, data, main, keyName = null) {
        this.el = el;
        this.data = data;
        this.main = main;
        this.keyName = keyName;
        if (this.keyName) {
            if (!el.getAttribute('node:model')) {
                this.property = this.main.getPropertyByKey(this.data.Get('key'))?.[this.keyName];
                this.el.classList.add('node-editor');
                if (this.property.edit) {
                    if (this.property.select) {
                        this.elNode = document.createElement('select');
                    }
                    else {
                        this.elNode = document.createElement('input');
                    }
                    this.elNode.classList.add("node-form-control");
                }
                else {
                    this.elNode = document.createElement('span');
                }
                this.elNode.setAttribute('node:model', this.keyName);
                this.el.appendChild(this.elNode);
            }
        }
        else {
            this.keyName = el?.getAttribute('node:model');
            if (this.keyName) {
                this.property = this.main.getPropertyByKey(this.data.Get('key'))?.[this.keyName];
                this.elNode = this.el;
                let nodeEditor = document.createElement('span');
                nodeEditor.classList.add('node-editor');
                el.parentElement?.insertBefore(nodeEditor, el);
                el.parentElement?.removeChild(el);
                nodeEditor.appendChild(this.elNode);
            }
        }
        if (this.keyName)
            this.bindData();
    }
    bindData() {
        if (this.keyName && this.elNode) {
            this.data.on(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
            this.elNode.addEventListener('change', this.bindEvent.bind(this));
            this.elNode.addEventListener('keydown', this.bindEvent.bind(this));
            if (this.property && this.property.select && isFunction(this.property.dataSelect)) {
                const options = this.property.dataSelect({ elNode: this.elNode, main: this.main, key: this.keyName }).map(({ value, text }) => {
                    let option = document.createElement('option');
                    option.value = value;
                    option.text = text;
                    return option;
                });
                for (let option of options) {
                    this.elNode.appendChild(option);
                }
            }
            if (this.property && isFunction(this.property.script)) {
                this.property.script({ elNode: this.elNode, main: this.main, key: this.keyName });
            }
            this.setNodeValue(this.data.Get(this.keyName));
        }
    }
    setNodeValue(value) {
        if (this.elNode) {
            if (TagView.includes(this.elNode.tagName)) {
                this.elNode.innerText = `${value}`;
            }
            else {
                this.elNode.value = value;
            }
        }
    }
    bindInput({ value, sender }) {
        if (sender !== this && this.elNode && sender.elNode !== this.elNode) {
            this.setNodeValue(value);
        }
    }
    bindEvent() {
        setTimeout(() => {
            if (this.keyName && this.elNode) {
                this.data.Set(this.keyName, this.elNode.value, this);
            }
        });
    }
    Delete() {
        if (this.keyName && this.elNode) {
            this.data.removeListener(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
            this.elNode.removeEventListener('change', this.bindEvent.bind(this));
            this.elNode.removeEventListener('keydown', this.bindEvent.bind(this));
        }
    }
    static BindElement(el, data, main, key = null) {
        if (el.childElementCount == 0 || el.getAttribute('node:model')) {
            return [new DataView(el, data, main, key)];
        }
        return Array.from(el.querySelectorAll('[node\\:model]')).map((item) => {
            return new DataView(item, data, main);
        });
    }
}

const ScopeRoot = "root";
class VariableNode extends EventFlow {
    name = '';
    value;
    type = '';
    initalValue;
    scope = ScopeRoot;
}

var Core = /*#__PURE__*/Object.freeze({
    __proto__: null,
    FlowCore: FlowCore,
    BaseFlow: BaseFlow,
    DockEnum: DockEnum,
    EventEnum: EventEnum,
    PropertyEnum: PropertyEnum,
    DataFlow: DataFlow,
    DataView: DataView,
    EventFlow: EventFlow,
    compareSort: compareSort,
    getUuid: getUuid,
    getTime: getTime,
    LOG: LOG,
    getDate: getDate,
    isFunction: isFunction,
    VariableNode: VariableNode,
    ScopeRoot: ScopeRoot
});

class Line {
    from;
    fromIndex;
    to;
    toIndex;
    elNode = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    elPath = document.createElementNS('http://www.w3.org/2000/svg', "path");
    data = new DataFlow();
    curvature = 0.5;
    temp = false;
    constructor(from, fromIndex = 0, to = undefined, toIndex = 0, data = null) {
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
        if (data) {
            this.data = data;
            return;
        }
        this.data.InitData({
            from: this.from.GetId(),
            fromIndex: this.fromIndex,
            to: this.to?.GetId(),
            toIndex: this.toIndex
        }, {
            ...this.from.parent.main.getPropertyByKey(PropertyEnum.line) || {}
        });
        this.from.data.Append('lines', this.data);
    }
    updateTo(to_x, to_y) {
        if (!this.from || this.from.elNode == null)
            return;
        let { x: from_x, y: from_y } = this.from.getPostisionDot(this.fromIndex);
        var lineCurve = this.createCurvature(from_x, from_y, to_x, to_y, this.curvature, 'other');
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
    delete(nodeThis = null, isClearData = true) {
        this.elPath?.removeEventListener('mousedown', this.StartSelected.bind(this));
        this.elPath?.removeEventListener('touchstart', this.StartSelected.bind(this));
        if (isClearData)
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
        if (this.to && this.toIndex && this.from != this.to && !this.from.checkLineExists(this.fromIndex, this.to, this.toIndex)) {
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
class DesginerView_Event {
    parent;
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
        if (this.parent.$lock)
            return;
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
        let nodeItem = this.parent.AddNode(keyNode, {
            group: this.parent.CurrentGroup()
        });
        nodeItem.updatePosition(x, y);
    }
    zoom_enter(event) {
        if (this.parent.$lock)
            return;
        if (event.ctrlKey) {
            event.preventDefault();
            if (event.deltaY > 0) {
                // Zoom Out
                this.parent.zoom_out();
            }
            else {
                // Zoom In
                this.parent.zoom_in();
            }
        }
    }
    StartMove(ev) {
        if (this.parent.$lock)
            return;
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
            this.tempLine.temp = true;
        }
        if (this.moveType == MoveType.Canvas) {
            this.av_x = this.parent.getX();
            this.av_y = this.parent.getY();
        }
        this.flgDrap = true;
        this.flgMove = false;
    }
    Move(ev) {
        if (this.parent.$lock)
            return;
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
        if (this.parent.$lock)
            return;
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
        if (this.parent.$lock)
            return;
        if (ev.key === 'Delete' || (ev.key === 'Backspace' && ev.metaKey)) {
            ev.preventDefault();
            this.parent.getNodeChoose()?.delete();
            this.parent.getLineChoose()?.delete();
        }
        if (ev.key === 'F2') {
            ev.preventDefault();
        }
    }
}

class DesginerView_Toolbar {
    parent;
    elNode;
    elPathGroup = document.createElement('div');
    btnBack = document.createElement('button');
    constructor(parent) {
        this.parent = parent;
        this.elNode = parent.elToolbar;
        this.elPathGroup.classList.add('toolbar-group');
        this.renderUI();
        this.renderPathGroup();
    }
    renderPathGroup() {
        this.btnBack.setAttribute('style', `display:none;`);
        this.elPathGroup.innerHTML = ``;
        let groups = this.parent.GetGroupName();
        let len = groups.length - 1;
        if (len < 0)
            return;
        let text = document.createElement('span');
        text.innerHTML = `Root`;
        text.addEventListener('click', (ev) => this.parent.BackGroup('Root'));
        this.elPathGroup.appendChild(text);
        this.btnBack.removeAttribute('style');
        for (let index = len; index >= 0; index--) {
            let text = document.createElement('span');
            text.innerHTML = `>>${groups[index].text}`;
            text.setAttribute('group', groups[index].id);
            text.addEventListener('click', (ev) => this.parent.BackGroup(groups[index].id));
            this.elPathGroup.appendChild(text);
        }
    }
    renderUI() {
        if (!this.elNode)
            return;
        this.elNode.innerHTML = ``;
        this.btnBack.addEventListener('click', () => this.parent.BackGroup());
        this.btnBack.innerHTML = `Back`;
        let btnZoomIn = document.createElement('button');
        btnZoomIn.addEventListener('click', () => this.parent.zoom_in());
        btnZoomIn.innerHTML = `+`;
        let btnZoomOut = document.createElement('button');
        btnZoomOut.addEventListener('click', () => this.parent.zoom_out());
        btnZoomOut.innerHTML = `-`;
        let btnZoomReset = document.createElement('button');
        btnZoomReset.addEventListener('click', () => this.parent.zoom_reset());
        btnZoomReset.innerHTML = `*`;
        let buttonGroup = document.createElement('div');
        buttonGroup.classList.add('toolbar-button');
        buttonGroup.appendChild(this.btnBack);
        buttonGroup.appendChild(btnZoomIn);
        buttonGroup.appendChild(btnZoomOut);
        buttonGroup.appendChild(btnZoomReset);
        this.elNode.appendChild(this.elPathGroup);
        this.elNode.appendChild(buttonGroup);
    }
}

class NodeItem extends BaseFlow {
    keyNode;
    /**
     * GET SET for Data
     */
    getName() {
        return this.data.Get('name');
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
    CheckKey(key) {
        return this.data.Get('key') == key;
    }
    getDataLine() {
        return this.data.Get('lines') ?? [];
    }
    checkLineExists(fromIndex, to, toIndex) {
        return this.arrLine.filter((item) => {
            if (!item.temp && item.to == to && item.toIndex == toIndex && item.fromIndex == fromIndex) {
                return true;
            }
            if (!item.temp && item.from == to && item.fromIndex == toIndex && item.toIndex == fromIndex) {
                return true;
            }
            return false;
        }).length > 0;
    }
    elContent;
    arrLine = [];
    option = {};
    arrDataView = [];
    constructor(parent, keyNode, data = {}) {
        super(parent);
        this.keyNode = keyNode;
        this.option = this.parent.main.getControlNodeByKey(keyNode);
        this.properties = this.option?.properties;
        if (data instanceof DataFlow) {
            this.data = data;
        }
        else {
            this.data.InitData({ ...data, name: this.option.name }, this.properties);
            this.parent.data.Append('nodes', this.data);
        }
        this.data.on(EventEnum.dataChange, this.renderUI.bind(this));
        this.elNode.classList.add('vs-node');
        if (this.option.class) {
            this.elNode.classList.add(this.option.class);
        }
        this.elNode.setAttribute('node-id', this.GetId());
        this.elNode.setAttribute('style', 'display:none');
        this.elNode.addEventListener('mousedown', () => this.parent.setNodeChoose(this));
        this.elNode.addEventListener('touchstart', () => this.parent.setNodeChoose(this));
        this.parent.elCanvas.appendChild(this.elNode);
        this.renderUI();
    }
    getOption() {
        return this.option;
    }
    renderUI(detail = null) {
        if ((detail && ['x', 'y'].includes(detail.key))) {
            setTimeout(() => {
                this.UpdateUI();
            });
            return;
        }
        if (this.elNode.contains(document.activeElement))
            return;
        this.elNode.setAttribute('style', `display:none;`);
        if (this.getOption()?.hideTitle === true) {
            this.elNode.innerHTML = `
      <div class="node-left"></div>
      <div class="node-container">
        <div class="node-top"></div>
        <div class="node-content">
          <div class="body"></div>
        </div>
        <div class="node-bottom"></div>
      </div>
      <div class="node-right"></div>
    `;
        }
        else {
            this.elNode.innerHTML = `
      <div class="node-left"></div>
      <div class="node-container">
        <div class="node-top"></div>
        <div class="node-content">
          <div class="title">${this.option.icon} ${this.getName()}</div>
          <div class="body"></div>
        </div>
        <div class="node-bottom"></div>
      </div>
      <div class="node-right"></div>
    `;
        }
        const addNodeDot = (num, start, query) => {
            if (num) {
                let nodeQuery = this.elNode.querySelector(query);
                if (nodeQuery) {
                    nodeQuery.innerHTML = '';
                    for (let i = 0; i < num; i++) {
                        let nodeDot = document.createElement('div');
                        nodeDot.classList.add('node-dot');
                        nodeDot.setAttribute('node', `${start + i}`);
                        nodeQuery.appendChild(nodeDot);
                    }
                }
            }
        };
        addNodeDot(this.option?.dot?.left, 1000, '.node-left');
        addNodeDot(this.option?.dot?.top, 2000, '.node-top');
        addNodeDot(this.option?.dot?.bottom, 3000, '.node-bottom');
        addNodeDot(this.option?.dot?.right, 4000, '.node-right');
        this.elContent = this.elNode.querySelector('.node-content .body') || document.createElement('div');
        this.parent.main.renderHtml(this, this.elContent);
        this.UpdateUI();
        this.arrDataView.forEach((item) => item.Delete());
        if (isFunction(this.option.script)) {
            this.option.script({ node: this, elNode: this.elNode, main: this.parent.main });
        }
        if (this.elContent)
            this.arrDataView = DataView.BindElement(this.elContent, this.data, this.parent.main);
    }
    openGroup() {
        if (this.CheckKey('node_group')) {
            this.parent.openGroup(this.GetId());
        }
    }
    updatePosition(x, y, iCheck = false) {
        if (this.elNode) {
            let tempx = x;
            let tempy = y;
            if (!iCheck) {
                tempy = (this.elNode.offsetTop - y);
                tempx = (this.elNode.offsetLeft - x);
            }
            if (tempx !== this.getX()) {
                this.setX(tempx);
            }
            if (tempy !== this.getY()) {
                this.setY(tempy);
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
    delete(isClearData = true) {
        this.arrLine.forEach((item) => item.delete(this, isClearData));
        if (isClearData)
            this.data.delete();
        else {
            this.data.removeListener(EventEnum.dataChange, this.renderUI.bind(this));
            this.RemoveDataEvent();
        }
        this.elNode.removeEventListener('mousedown', () => this.parent.setNodeChoose(this));
        this.elNode.removeEventListener('touchstart', () => this.parent.setNodeChoose(this));
        this.elNode.remove();
        this.arrLine = [];
        if (isClearData)
            this.parent.RemoveNode(this);
        this.dispatch(EventEnum.change, {});
    }
    RenderLine() {
        this.getDataLine().forEach((item) => {
            let nodeFrom = this;
            let nodeTo = this.parent.GetNodeById(item.Get('to'));
            let toIndex = item.Get('toIndex');
            let fromIndex = item.Get('fromIndex');
            new Line(nodeFrom, fromIndex, nodeTo, toIndex, item).UpdateUI();
        });
    }
}

const Zoom = {
    max: 1.6,
    min: 0.6,
    value: 0.1,
    default: 1
};
class DesginerView extends FlowCore {
    main;
    /**
     * GET SET for Data
     */
    getZoom() {
        return +this.getDataGroup().Get('zoom');
    }
    setZoom(value) {
        return this.getDataGroup().Set('zoom', value, this);
    }
    getY() {
        return +this.getDataGroup().Get('y');
    }
    setY(value) {
        return this.getDataGroup().Set('y', value, this);
    }
    getX() {
        return +this.getDataGroup().Get('x');
    }
    setX(value) {
        return this.getDataGroup().Set('x', value, this);
    }
    groupData;
    lastGroupName = "";
    getDataGroup() {
        if (this.$lock)
            return this.data;
        // cache groupData
        if (this.lastGroupName === this.CurrentGroup())
            return this.groupData ?? this.data;
        this.lastGroupName = this.CurrentGroup();
        let groups = this.data.Get('groups');
        this.groupData = groups?.filter((item) => item.Get('group') == this.lastGroupName)?.[0];
        if (!this.groupData) {
            this.groupData = new DataFlow(this.main, {
                key: PropertyEnum.groupCavas,
                group: this.lastGroupName
            });
            this.data.Append('groups', this.groupData);
        }
        let dataGroup = this.GetDataById(this.lastGroupName);
        if (dataGroup) {
            dataGroup.onSafe(EventEnum.dataChange, () => {
                this.UpdateUI.bind(this);
                this.toolbar.renderPathGroup();
                this.changeGroup();
            });
        }
        return this.groupData;
    }
    group = [];
    GetGroupName() {
        return this.group.map((item) => ({ id: item, text: this.GetDataById(item)?.Get('name') }));
    }
    BackGroup(id = null) {
        let index = 1;
        if (id) {
            index = this.group.indexOf(id);
            if (index < 0)
                index = 0;
        }
        if (index)
            this.group.splice(0, index);
        else
            this.group = [];
        this.RenderUI();
        this.changeGroup();
    }
    CurrentGroup() {
        let name = this.group?.[0];
        if (name && name != '') {
            return name;
        }
        return 'root';
    }
    CurrentGroupData() {
        return this.GetDataById(this.CurrentGroup()) ?? this.data;
    }
    changeGroup() {
        setTimeout(() => {
            this.main.dispatch(EventEnum.groupChange, {
                group: this.GetGroupName()
            });
        });
    }
    openGroup(id) {
        this.group = [id, ...this.group];
        this.toolbar.renderPathGroup();
        this.RenderUI();
        this.changeGroup();
    }
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
            this.dispatch(EventEnum.showProperty, { data: this.CurrentGroupData() });
        }
    }
    getNodeChoose() {
        return this.nodeChoose;
    }
    AddNodeItem(data) {
        return this.AddNode(data.Get('key'), data);
    }
    AddNode(keyNode, data = {}) {
        return this.InsertNode(new NodeItem(this, keyNode, data));
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
    ClearNode() {
        this.nodes?.forEach(item => item.delete(false));
        this.nodes = [];
    }
    GetDataAllNode() {
        return (this.data?.Get('nodes') ?? []);
    }
    GetDataNode() {
        return this.GetDataAllNode().filter((item) => item.Get("group") === this.CurrentGroup());
    }
    /**
     * Varibute
    */
    elCanvas = document.createElement('div');
    elToolbar = document.createElement('div');
    toolbar;
    $lock = true;
    zoom_last_value = 1;
    constructor(elNode, main) {
        super();
        this.main = main;
        this.elNode = elNode;
        let properties = this.main.getPropertyByKey(PropertyEnum.main);
        this.data.InitData({}, properties);
        this.elNode.innerHTML = '';
        this.elNode.classList.remove('desginer-view');
        this.elCanvas.classList.remove("desginer-canvas");
        this.elNode.classList.add('desginer-view');
        this.elCanvas.classList.add("desginer-canvas");
        this.elToolbar.classList.add("desginer-toolbar");
        this.elNode.appendChild(this.elCanvas);
        this.elNode.appendChild(this.elToolbar);
        this.elNode.tabIndex = 0;
        new DesginerView_Event(this);
        this.toolbar = new DesginerView_Toolbar(this);
        this.on(EventEnum.dataChange, this.RenderUI.bind(this));
        this.on(EventEnum.showProperty, (data) => { main.dispatch(EventEnum.showProperty, data); });
        this.main.on(EventEnum.openProject, (item) => {
            this.Open(item.data);
        });
    }
    updateView(x, y, zoom) {
        this.elCanvas.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    }
    UpdateUI() {
        this.updateView(this.getX(), this.getY(), this.getZoom());
    }
    RenderUI(detail = {}) {
        if (detail.sender && detail.sender instanceof NodeItem)
            return;
        if (detail.sender && detail.sender instanceof DesginerView) {
            this.UpdateUI();
            return;
        }
        this.ClearNode();
        this.GetDataNode().forEach((item) => {
            this.AddNodeItem(item);
        });
        this.GetAllNode().forEach((item) => {
            item.RenderLine();
        });
        this.UpdateUI();
        this.toolbar.renderPathGroup();
    }
    Open($data) {
        if ($data == this.data) {
            this.toolbar.renderPathGroup();
            this.RenderUI();
            return;
        }
        this.data?.dispatch(EventEnum.dataChange, (detail) => this.dispatch(EventEnum.dataChange, detail));
        this.data = $data;
        this.data.on(EventEnum.dataChange, (detail) => this.dispatch(EventEnum.dataChange, detail));
        this.$lock = false;
        this.lastGroupName = '';
        this.groupData = undefined;
        this.group = [];
        this.RenderUI();
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
    GetDataById(id) {
        return this.GetDataAllNode().filter((item) => item.Get('id') === id)?.[0];
    }
    checkOnlyNode(key) {
        return (this.main.getControlByKey(key).onlyNodeItem) && this.nodes.filter(item => item.CheckKey(key)).length > 0;
    }
    zoom_refresh(flg = 0) {
        let temp_zoom = flg == 0 ? Zoom.default : (this.getZoom() + Zoom.value * flg);
        if (Zoom.max >= temp_zoom && temp_zoom >= Zoom.min) {
            this.setX((this.getX() / this.zoom_last_value) * temp_zoom);
            this.setY((this.getY() / this.zoom_last_value) * temp_zoom);
            this.zoom_last_value = temp_zoom;
            this.setZoom(this.zoom_last_value);
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
}

class VariableView {
    elNode;
    main;
    variables;
    constructor(elNode, main) {
        this.elNode = elNode;
        this.main = main;
        this.elNode.classList.add('vs-variable');
        this.main.on(EventEnum.changeVariable, ({ group }) => {
            this.Render(group);
        });
        this.main.on(EventEnum.openProject, ({ group }) => {
            this.Render(group);
        });
        this.main.on(EventEnum.groupChange, ({ group }) => {
            this.Render(group);
        });
        this.Render();
    }
    Render(group = null) {
        this.variables = this.main.getVariable();
        this.elNode.innerHTML = `
      <table border="1">
        <thead>
          <tr>
            <td class="variable-name">Name</td>
            <td class="variable-type">Type</td>
            <td class="variable-scope">Scope</td>
            <td class="variable-default">Default</td>
            <td class="variable-button"></td>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    `;
        console.log(this.variables);
        if (this.variables) {
            if (!group)
                group = [ScopeRoot];
            if (!group.includes(ScopeRoot))
                group = [...group, ScopeRoot];
            for (let item of this.variables.filter((item) => group.includes(item.scope))) {
                new VariableItem(item, this).RenderScope(group);
            }
        }
    }
    changeData() {
        this.main.updateVariable(this.variables ?? []);
    }
}
class VariableItem {
    variable;
    parent;
    elNode = document.createElement('tr');
    nameInput = document.createElement('input');
    typeInput = document.createElement('select');
    scopeInput = document.createElement('select');
    valueDefaultInput = document.createElement('input');
    constructor(variable, parent) {
        this.variable = variable;
        this.parent = parent;
        this.nameInput.value = this.variable.name;
        this.valueDefaultInput.value = this.variable.initalValue ?? '';
        this.typeInput.value = this.variable.type ?? '';
        for (let item of ['text', 'number', 'date', 'object']) {
            let option = document.createElement('option');
            option.text = item;
            option.value = item;
            this.typeInput.appendChild(option);
        }
        let nameColumn = document.createElement('td');
        nameColumn.appendChild(this.nameInput);
        this.elNode.appendChild(nameColumn);
        this.nameInput.addEventListener('keydown', (e) => {
            this.variable.name = e.target.value;
            this.change();
        });
        this.nameInput.addEventListener('change', (e) => {
            this.variable.name = e.target.value;
            this.change();
        });
        let typeColumn = document.createElement('td');
        typeColumn.appendChild(this.typeInput);
        this.elNode.appendChild(typeColumn);
        this.typeInput.addEventListener('change', (e) => {
            this.variable.type = e.target.value;
            this.change();
        });
        let scopeColumn = document.createElement('td');
        scopeColumn.appendChild(this.scopeInput);
        this.elNode.appendChild(scopeColumn);
        let valueDefaultColumn = document.createElement('td');
        valueDefaultColumn.appendChild(this.valueDefaultInput);
        this.elNode.appendChild(valueDefaultColumn);
        this.valueDefaultInput.addEventListener('change', (e) => {
            this.variable.initalValue = e.target.value;
            this.change();
        });
        this.valueDefaultInput.addEventListener('keydown', (e) => {
            this.variable.initalValue = e.target.value;
            this.change();
        });
        let buttonRemove = document.createElement('button');
        buttonRemove.innerHTML = `-`;
        buttonRemove.addEventListener('click', () => {
            parent.main.removeVariable(variable);
        });
        let buttonRemoveColumn = document.createElement('td');
        buttonRemoveColumn.appendChild(buttonRemove);
        this.elNode.appendChild(buttonRemoveColumn);
        parent.elNode.querySelector('table tbody')?.appendChild(this.elNode);
    }
    change() {
        this.parent.changeData();
    }
    RenderScope(group = null) {
        this.scopeInput.innerHTML = '';
        if (group) {
            for (let item of group) {
                if (item === ScopeRoot)
                    continue;
                let option = document.createElement('option');
                option.text = item.text;
                option.value = item.id;
                this.scopeInput.prepend(option);
            }
        }
        let option = document.createElement('option');
        option.text = ScopeRoot;
        option.value = ScopeRoot;
        this.scopeInput.prepend(option);
        this.scopeInput.value = this.variable.scope;
        this.scopeInput.addEventListener('change', (e) => {
            this.variable.scope = e.target.value;
            this.change();
        });
    }
}

class ToolboxView {
    elNode;
    main;
    constructor(elNode, main) {
        this.elNode = elNode;
        this.main = main;
        this.elNode.classList.add('vs-toolboxf');
        this.Render();
    }
    Render() {
        let controls = this.main.getControlAll();
        Object.keys(controls).forEach((item) => {
            let nodeItem = document.createElement('div');
            nodeItem.classList.add('node-item');
            nodeItem.setAttribute('draggable', 'true');
            nodeItem.setAttribute('data-node', item);
            nodeItem.innerHTML = `${controls[item].icon} <span>${controls[item].name}</span`;
            nodeItem.addEventListener('dragstart', this.dragStart.bind(this));
            nodeItem.addEventListener('dragend', this.dragend.bind(this));
            this.elNode.appendChild(nodeItem);
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

class ProjectView {
    elNode;
    main;
    constructor(elNode, main) {
        this.elNode = elNode;
        this.main = main;
        this.elNode.classList.add('vs-project');
        this.main.on(EventEnum.changeVariable, this.Render.bind(this));
        this.main.on(EventEnum.openProject, this.Render.bind(this));
    }
    Render() {
        this.elNode.innerHTML = ``;
        let projects = this.main.getProjectAll();
        projects.forEach((item) => {
            let nodeItem = document.createElement('div');
            nodeItem.classList.add('node-item');
            nodeItem.innerHTML = `${item.Get('name')}`;
            nodeItem.setAttribute('data-project-id', item.Get('id'));
            item.removeListener(`${EventEnum.dataChange}_name`, () => {
                nodeItem.innerHTML = `${item.Get('name')}`;
            });
            item.on(`${EventEnum.dataChange}_name`, () => {
                nodeItem.innerHTML = `${item.Get('name')}`;
            });
            if (this.main.checkProjectOpen(item)) {
                nodeItem.classList.add('active');
            }
            nodeItem.addEventListener('click', () => {
                this.main.setProjectOpen(item);
            });
            this.elNode?.appendChild(nodeItem);
        });
    }
}

var Desginer = /*#__PURE__*/Object.freeze({
    __proto__: null,
    DesginerView: DesginerView,
    Line: Line,
    NodeItem: NodeItem,
    VariableView: VariableView,
    ToolboxView: ToolboxView,
    ProjectView: ProjectView
});

class DockBase {
    main;
    elNode = document.createElement('div');
    elContent;
    constructor(container, main) {
        this.main = main;
        container.appendChild(this.elNode);
        this.elNode.innerHTML = 'DockBase';
    }
    BoxInfo(title, $callback) {
        this.elNode.classList.remove('vs-boxinfo');
        this.elNode.classList.add('vs-boxinfo');
        this.elNode.innerHTML = `<div class="vs-boxinfo_header"><span class="vs-boxinfo_title">${title}</span><span class="vs-boxinfo_button"></span></div>
    <div class="vs-boxinfo_content"></div>`;
        this.elContent = this.elNode.querySelector('.vs-boxinfo_content');
        if ($callback) {
            $callback(this.elContent);
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
            new ToolboxView(node, this.main);
        });
    }
}

class VariableDock extends DockBase {
    main;
    constructor(container, main) {
        super(container, main);
        this.main = main;
        this.elNode.classList.add('vs-variable');
        this.BoxInfo('Variable', (node) => {
            new VariableView(node, main);
        });
        let $nodeRight = this.elNode.querySelector('.vs-boxinfo_header .vs-boxinfo_button');
        if ($nodeRight) {
            $nodeRight.innerHTML = ``;
            let buttonNew = document.createElement('button');
            $nodeRight?.appendChild(buttonNew);
            buttonNew.innerHTML = `New Variable`;
            buttonNew.addEventListener('click', () => {
                this.main.newVariable().name = `var${getTime()}`;
            });
        }
    }
}

class ProjectDock extends DockBase {
    main;
    constructor(container, main) {
        super(container, main);
        this.main = main;
        this.elNode.classList.add('vs-project');
        this.BoxInfo('Project', (elContent) => {
            new ProjectView(elContent, main);
        });
        let $nodeRight = this.elNode.querySelector('.vs-boxinfo_header .vs-boxinfo_button');
        if ($nodeRight) {
            $nodeRight.innerHTML = ``;
            let buttonNew = document.createElement('button');
            buttonNew.innerHTML = `New`;
            buttonNew.addEventListener('click', () => this.main.newProject(''));
            $nodeRight?.appendChild(buttonNew);
            let buttonExport = document.createElement('button');
            buttonExport.innerHTML = `Export`;
            buttonExport.addEventListener('click', () => downloadObjectAsJson(this.main.exportJson(), `vs-solution-${getTime()}`));
            $nodeRight?.appendChild(buttonExport);
            let buttonImport = document.createElement('button');
            buttonImport.innerHTML = `Import`;
            buttonImport.addEventListener('click', () => {
                readFileLocal((rs) => {
                    if (rs) {
                        this.main.importJson(JSON.parse(rs));
                    }
                });
            });
            $nodeRight?.appendChild(buttonImport);
        }
    }
}

class PropertyDock extends DockBase {
    main;
    lastData;
    hideKeys = ['lines', 'nodes', 'groups', 'variable', 'x', 'y', 'zoom'];
    sortKeys = ['id', 'key', 'name', 'group'];
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
        this.sortKeys.forEach((key) => {
            if (this.hideKeys.includes(key) || !properties[key])
                return;
            let propertyItem = document.createElement('div');
            propertyItem.classList.add('property-item');
            let propertyLabel = document.createElement('div');
            propertyLabel.classList.add('property-label');
            propertyLabel.innerHTML = key;
            let propertyValue = document.createElement('div');
            propertyValue.classList.add('property-value');
            DataView.BindElement(propertyValue, data, this.main, key);
            propertyItem.appendChild(propertyLabel);
            propertyItem.appendChild(propertyValue);
            node.appendChild(propertyItem);
        });
        Object.keys(properties).forEach((key) => {
            if (this.hideKeys.includes(key) || this.sortKeys.includes(key))
                return;
            let propertyItem = document.createElement('div');
            propertyItem.classList.add('property-item');
            let propertyLabel = document.createElement('div');
            propertyLabel.classList.add('property-label');
            propertyLabel.innerHTML = key;
            let propertyValue = document.createElement('div');
            propertyValue.classList.add('property-value');
            DataView.BindElement(propertyValue, data, this.main, key);
            propertyItem.appendChild(propertyLabel);
            propertyItem.appendChild(propertyValue);
            node.appendChild(propertyItem);
        });
    }
}

class ViewDock extends DockBase {
    main;
    view;
    constructor(container, main) {
        super(container, main);
        this.main = main;
        this.view = new DesginerView(this.elNode, main);
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
        this.addDock(DockEnum.left, ProjectDock);
        this.addDock(DockEnum.right, PropertyDock);
        this.addDock(DockEnum.view, ViewDock);
        //  this.addDock(DockEnum.top, TabDock);
        this.addDock(DockEnum.bottom, VariableDock);
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

const Control = {
    node_begin: {
        icon: '<i class="fas fa-play"></i>',
        sort: 0,
        name: 'Begin',
        group: 'common',
        class: '',
        html: '',
        dot: {
            top: 0,
            right: 0,
            left: 0,
            bottom: 1,
        },
        onlyNode: true
    },
    node_end: {
        icon: '<i class="fas fa-stop"></i>',
        sort: 0,
        name: 'End',
        group: 'common',
        html: '',
        dot: {
            left: 0,
            top: 1,
            right: 0,
            bottom: 0,
        },
        onlyNode: true
    },
    node_if: {
        icon: '<i class="fas fa-equals"></i>',
        sort: 0,
        name: 'If',
        group: 'common',
        html: '<div>condition:<br/><input class="node-form-control" node:model="condition"/></div>',
        script: ``,
        properties: {
            condition: {
                key: "condition",
                edit: true,
                default: ''
            }
        },
        output: 2
    },
    node_group: {
        icon: '<i class="fas fa-object-group"></i>',
        sort: 0,
        name: 'Group',
        group: 'common',
        html: '<div class="text-center p3"><button class="btnGoGroup node-form-control">Go</button></div>',
        script: ({ elNode, main, node }) => {
            elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => { node.openGroup(); });
        },
        properties: {},
        output: 2
    },
    node_option: {
        icon: '<i class="fas fa-object-group"></i>',
        sort: 0,
        name: 'Option',
        dot: {
            top: 1,
            right: 0,
            left: 1,
            bottom: 0,
        },
        group: 'common',
        html: `
    <div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50001"></span></span></div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50002"></span></span></div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50003"></span></span></div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50004"></span></span></div>
      <div class="node-content-row"><span>Họ tên :</span><span><span class="node-dot" node="50005"></span></span></div>
    </div>
    `,
        script: ({ elNode, main, node }) => {
            elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => { node.openGroup(); });
        },
        properties: {},
        output: 2
    },
    node_project: {
        icon: '<i class="fas fa-object-group"></i>',
        sort: 0,
        name: 'Project',
        group: 'common',
        html: '<div class="text-center p3"><select class="node-form-control" node:model="project"></select></div>',
        script: ({ elNode, main, node }) => {
        },
        properties: {
            project: {
                key: "project",
                edit: true,
                select: true,
                dataSelect: ({ elNode, main, node }) => {
                    return main.getProjectAll().map((item) => {
                        return {
                            value: item.Get('id'),
                            text: item.Get('name')
                        };
                    });
                },
                script: ({ elNode, main, node }) => {
                },
                default: ''
            }
        },
    },
};

class SystemBase$1 {
    $data = new DataFlow(this);
    $projectOpen;
    $properties = {};
    $control = {};
    events = new EventFlow();
    $controlChoose = null;
    $checkOption = false;
    constructor() {
        //set project
        this.$properties[PropertyEnum.solution] = {
            id: {
                default: () => getTime()
            },
            key: {
                default: () => PropertyEnum.solution
            },
            name: {
                default: () => `solution-${getTime()}`,
                edit: true,
            },
            projects: {
                default: []
            }
        };
        this.$properties[PropertyEnum.line] = {
            key: {
                default: PropertyEnum.line
            },
            from: {
                default: 0
            },
            fromIndex: {
                default: 0
            },
            to: {
                default: 0
            },
            toIndex: {
                default: 0
            }
        };
        //set project
        this.$properties[PropertyEnum.main] = {
            id: {
                default: () => getTime()
            },
            name: {
                default: () => `Flow-${getTime()}`,
                edit: true,
            },
            key: {
                default: PropertyEnum.main
            },
            variable: {
                default: []
            },
            groups: {
                default: []
            },
            nodes: {
                default: []
            }
        };
        this.$properties[PropertyEnum.groupCavas] = {
            key: {
                default: PropertyEnum.groupCavas
            },
            group: {
                default: ''
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
        };
    }
    newSolution($name = '') {
        this.openSolution({ name: $name });
    }
    openSolution($data) {
        this.$data.InitData($data, this.getPropertyByKey(PropertyEnum.solution));
        this.openProject(this.$data.Get('projects')?.[0] ?? {});
    }
    removeVariable(varibale) {
        this.$projectOpen?.Remove('variable', varibale);
        this.dispatch(EventEnum.changeVariable, { data: varibale });
    }
    addVariable() {
        let varibale = new VariableNode();
        this.$projectOpen?.Append('variable', varibale);
        return varibale;
    }
    newVariable() {
        let varibale = this.addVariable();
        this.dispatch(EventEnum.changeVariable, { data: varibale });
        return varibale;
    }
    getVariable() {
        let arr = [];
        if (this.$projectOpen) {
            arr = this.$projectOpen.Get("variable");
            if (!arr) {
                arr = [];
                this.$projectOpen.Set('variable', arr);
            }
        }
        return arr;
    }
    updateVariable(vars) {
        this.$projectOpen?.Set('variable', vars);
    }
    exportJson() {
        return this.$data.toJson();
    }
    checkInitOption() {
        return this.$checkOption;
    }
    initOption(option, isDefault = true) {
        this.$checkOption = true;
        // set control
        this.$control = isDefault ? { ...option?.control || {}, ...Control } : { ...option?.control || {} };
        let controlTemp = {};
        Object.keys(this.$control).map((key) => ({ ...this.$control[key], key, sort: (this.$control[key].sort === undefined ? 99999 : this.$control[key].sort) })).sort(compareSort).forEach((item) => {
            controlTemp[item.key] = {
                dot: {
                    left: 1,
                    top: 1,
                    right: 1,
                    bottom: 1,
                },
                ...item
            };
            this.$properties[`${item.key}`] = {
                ...(item.properties || {}),
                id: {
                    default: () => getTime()
                },
                key: {
                    default: item.key
                },
                name: {
                    default: item.key,
                    edit: true,
                },
                x: {
                    default: 0
                },
                y: {
                    default: 0
                },
                group: {
                    default: ''
                },
                lines: {
                    default: []
                }
            };
        });
        this.$control = controlTemp;
    }
    renderHtml(node, elParent) {
        elParent.innerHTML = node.getOption()?.html;
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
        setTimeout(() => {
            this.events.dispatch(event, details);
        });
    }
    getControlAll() {
        return this.$control ?? {};
    }
    getProjectAll() {
        return this.$data.Get('projects') ?? [];
    }
    importJson(data) {
        this.openSolution(data);
    }
    setProjectOpen($data) {
        if (this.$projectOpen != $data) {
            this.$projectOpen = $data;
            this.dispatch(EventEnum.change, {
                data: $data
            });
            this.dispatch(EventEnum.showProperty, {
                data: $data
            });
            this.dispatch(EventEnum.openProject, {
                data: $data
            });
        }
    }
    checkProjectOpen($data) {
        return this.$projectOpen == $data;
    }
    newProject() {
        this.openProject({});
        this.dispatch(EventEnum.newProject, {});
    }
    openProject($data) {
        let $project = null;
        if ($data instanceof DataFlow) {
            $project = this.getProjectById($data.Get('id'));
            if (!$project) {
                $project = $data;
                this.$data.Append('projects', $project);
            }
        }
        else {
            $project = new DataFlow(this);
            $project.InitData($data, this.getPropertyByKey(PropertyEnum.main));
            this.$data.Append('projects', $project);
        }
        this.setProjectOpen($project);
    }
    getProjectById($id) {
        return this.$data.Get('projects').filter((item) => item.Get('id') === $id)?.[0];
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
            properties: this.getPropertyByKey(`${key}`)
        };
    }
    getPropertyByKey(key) {
        return this.$properties[key];
    }
}

class VisualFlow {
    container;
    main;
    $dockManager;
    getDockManager() {
        return this.$dockManager;
    }
    setOption(data, isDefault = true) {
        this.main?.initOption(data, isDefault);
        this.$dockManager.reset();
    }
    constructor(container, main = undefined) {
        this.container = container;
        this.main = main ?? new SystemBase$1();
        this.container.classList.remove('vs-container');
        this.container.classList.add('vs-container');
        this.$dockManager = new DockManager(this.container, this.main);
        this.$dockManager.reset();
    }
    onSafe(event, callback) {
        this.main?.onSafe(event, callback);
    }
    on(event, callback) {
        this.main?.on(event, callback);
    }
    removeListener(event, callback) {
        this.main?.removeListener(event, callback);
    }
    dispatch(event, details) {
        this.main?.dispatch(event, details);
    }
    getMain() {
        return this.main;
    }
    newSolution($name) {
        this.getMain()?.newSolution($name);
    }
    openSolution($data) {
        this.getMain()?.openSolution($data);
    }
    newProject($name) {
        this.getMain()?.newProject($name);
    }
    openProject($name) {
        this.getMain()?.openProject($name);
    }
    getProjectAll() {
        return this.getMain()?.getProjectAll();
    }
    setProjectOpen($data) {
        this.getMain()?.setProjectOpen($data);
    }
    importJson(data) {
        this.getMain()?.importJson(data);
    }
    exportJson() {
        return this.getMain()?.exportJson();
    }
}

class SystemVue extends SystemBase$1 {
    render;
    constructor(render) {
        super();
        this.render = render;
    }
    renderHtml(node, elParent) {
        if (parseInt(this.render.version) === 3) {
            //Vue 3
            let wrapper = this.render.h(node.getOption()?.html, { ...(node.getOption()?.props ?? {}), node }, (node.getOption()?.options ?? {}));
            wrapper.appContext = elParent;
            this.render.render(wrapper, elParent);
        }
        else {
            // Vue 2
            let wrapper = new this.render({
                parent: elParent,
                render: (h) => h(node.getOption()?.html, { props: { ...(node.getOption()?.props ?? {}), node } }),
                ...(node.getOption()?.options ?? {})
            }).$mount();
            //
            elParent.appendChild(wrapper.$el);
        }
    }
}

var SystemBase = /*#__PURE__*/Object.freeze({
    __proto__: null,
    SystemBase: SystemBase$1,
    SystemVue: SystemVue
});

class TabDock extends DockBase {
    main;
    constructor(container, main) {
        super(container, main);
        this.main = main;
        this.elNode.innerHTML = ``;
        this.elNode.classList.add('vs-tab');
        this.main.on(EventEnum.openProject, (detail) => {
            this.elNode?.querySelectorAll('.active').forEach((_node) => {
                _node.classList.remove('active');
            });
            if (this.elNode && detail?.data?.Get('id')) {
                this.elNode.querySelector(`[data-project-id="${detail?.data?.Get('id')}"]`)?.classList.add('active');
            }
        });
        this.main.on(EventEnum.newProject, this.render.bind(this));
    }
    render() {
        this.elNode.innerHTML = ``;
        let projects = this.main.getProjectAll();
        projects.forEach((item) => {
            let nodeItem = document.createElement('div');
            nodeItem.classList.add('node-item');
            nodeItem.innerHTML = `${item.Get('name')}`;
            nodeItem.setAttribute('data-project-id', item.Get('id'));
            item.removeListener(`${EventEnum.dataChange}_name`, () => {
                nodeItem.innerHTML = `${item.Get('name')}`;
            });
            item.on(`${EventEnum.dataChange}_name`, () => {
                nodeItem.innerHTML = `${item.Get('name')}`;
            });
            if (this.main.checkProjectOpen(item)) {
                nodeItem.classList.add('active');
            }
            nodeItem.addEventListener('click', () => {
                this.main.dispatch(EventEnum.openProject, { data: item });
                this.main.dispatch(EventEnum.showProperty, { data: item });
            });
            this.elNode?.appendChild(nodeItem);
        });
    }
}

var Dock = /*#__PURE__*/Object.freeze({
    __proto__: null,
    DockEnum: DockEnum,
    ControlDock: ControlDock,
    DockBase: DockBase,
    ProjectDock: ProjectDock,
    PropertyDock: PropertyDock,
    TabDock: TabDock,
    ViewDock: ViewDock,
    VariableDock: VariableDock,
    DockManager: DockManager
});

var index = {
    VisualFlow,
    ...SystemBase,
    ...Core,
    ...Dock,
    ...Desginer
};

export { index as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5lcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvQ29uc3RhbnQudHMiLCIuLi9zcmMvY29yZS9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29yZS9EYXRhRmxvdy50cyIsIi4uL3NyYy9jb3JlL0Jhc2VGbG93LnRzIiwiLi4vc3JjL2NvcmUvVXRpbHMudHMiLCIuLi9zcmMvY29yZS9EYXRhVmlldy50cyIsIi4uL3NyYy9jb3JlL1ZhcmlhYmxlTm9kZS50cyIsIi4uL3NyYy9kZXNnaW5lci9MaW5lLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld19FdmVudC50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXdfVG9vbGJhci50cyIsIi4uL3NyYy9kZXNnaW5lci9Ob2RlSXRlbS50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXcudHMiLCIuLi9zcmMvZGVzZ2luZXIvVmFyaWFibGVWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1Rvb2xib3hWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1Byb2plY3RWaWV3LnRzIiwiLi4vc3JjL2RvY2svRG9ja0Jhc2UudHMiLCIuLi9zcmMvZG9jay9Db250cm9sRG9jay50cyIsIi4uL3NyYy9kb2NrL1ZhcmlhYmxlRG9jay50cyIsIi4uL3NyYy9kb2NrL1Byb2plY3REb2NrLnRzIiwiLi4vc3JjL2RvY2svUHJvcGVydHlEb2NrLnRzIiwiLi4vc3JjL2RvY2svVmlld0RvY2sudHMiLCIuLi9zcmMvZG9jay9Eb2NrTWFuYWdlci50cyIsIi4uL3NyYy9zeXN0ZW1zL2NvbnRyb2wudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1CYXNlLnRzIiwiLi4vc3JjL1Zpc3VhbEZsb3cudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1WdWUudHMiLCIuLi9zcmMvZG9jay9UYWJEb2NrLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBFdmVudEVudW0gPSB7XHJcbiAgaW5pdDogXCJpbml0XCIsXHJcbiAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXHJcbiAgc2hvd1Byb3BlcnR5OiBcInNob3dQcm9wZXJ0eVwiLFxyXG4gIG9wZW5Qcm9qZWN0OiBcIm9wZW5Qcm9qZWN0XCIsXHJcbiAgbmV3UHJvamVjdDogXCJuZXdQcm9qZWN0XCIsXHJcbiAgY2hhbmdlVmFyaWFibGU6IFwiY2hhbmdlVmFyaWFibGVcIixcclxuICBjaGFuZ2U6IFwiY2hhbmdlXCIsXHJcbiAgZGlzcG9zZTogXCJkaXNwb3NlXCIsXHJcbiAgZ3JvdXBDaGFuZ2U6IFwiZ3JvdXBDaGFuZ2VcIixcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IERvY2tFbnVtID0ge1xyXG4gIGxlZnQ6IFwidnMtbGVmdFwiLFxyXG4gIHRvcDogXCJ2cy10b3BcIixcclxuICB2aWV3OiBcInZzLXZpZXdcIixcclxuICBib3R0b206IFwidnMtYm90dG9tXCIsXHJcbiAgcmlnaHQ6IFwidnMtcmlnaHRcIixcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IFByb3BlcnR5RW51bSA9IHtcclxuICBtYWluOiBcIm1haW5fcHJvamVjdFwiLFxyXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXHJcbiAgbGluZTogJ21haW5fbGluZScsXHJcbiAgdmFyaWFibGU6ICdtYWluX3ZhcmlhYmxlJyxcclxuICBncm91cENhdmFzOiBcIm1haW5fZ3JvdXBDYXZhc1wiLFxyXG59O1xyXG4iLCJpbXBvcnQgeyBJRXZlbnQgfSBmcm9tIFwiLi9JRmxvd1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEV2ZW50RmxvdyBpbXBsZW1lbnRzIElFdmVudCB7XHJcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICB9XHJcbiAgcHVibGljIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICB0aGlzLm9uKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIC8qIEV2ZW50cyAqL1xyXG4gIHB1YmxpYyBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcclxuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XHJcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG5cclxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcclxuXHJcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXHJcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXHJcbiAgICBjb25zdCBoYXNMaXN0ZW5lciA9IGxpc3RlbmVySW5kZXggPiAtMVxyXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcclxuICAgICAgbGlzdGVuZXIoZGV0YWlscyk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSVByb3BlcnR5IH0gZnJvbSBcIi4vSUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcbiAgcHJpdmF0ZSBkYXRhOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVzOiBhbnkgPSBudWxsO1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBwdWJsaWMgZ2V0UHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXM7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvcGVydHk6IElQcm9wZXJ0eSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCwgZGF0YTogYW55ID0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IC0xKSB7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIH1cbiAgICB0aGlzLmxvYWQoZGF0YSk7XG4gIH1cbiAgcHJpdmF0ZSBldmVudERhdGFDaGFuZ2Uoa2V5OiBzdHJpbmcsIGtleUNoaWxkOiBzdHJpbmcsIHZhbHVlQ2hpbGQ6IGFueSwgc2VuZGVyQ2hpbGQ6IGFueSwgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmIChpbmRleCkge1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9XyR7a2V5Q2hpbGR9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xuICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlRXZlbnREYXRhKGl0ZW06IERhdGFGbG93LCBrZXk6IHN0cmluZywgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmICghaXRlbSkgcmV0dXJuO1xuICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9YCwgKHsga2V5OiBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGQgfTogYW55KSA9PiB0aGlzLmV2ZW50RGF0YUNoYW5nZShrZXksIGtleUNoaWxkLCB2YWx1ZUNoaWxkLCBzZW5kZXJDaGlsZCwgaW5kZXgpKTtcbiAgfVxuICBwdWJsaWMgT25FdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHByaXZhdGUgQmluZEV2ZW50KHZhbHVlOiBhbnksIGtleTogc3RyaW5nKSB7XG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICB0aGlzLk9uRXZlbnREYXRhKHZhbHVlIGFzIERhdGFGbG93LCBrZXkpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgKHZhbHVlIGFzIFtdKS5sZW5ndGggPiAwICYmIHZhbHVlWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICh2YWx1ZSBhcyBEYXRhRmxvd1tdKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdywgaW5kZXg6IG51bWJlcikgPT4gdGhpcy5PbkV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCwgaXNEaXNwYXRjaDogYm9vbGVhbiA9IHRydWUpIHtcbiAgICBpZiAodGhpcy5kYXRhW2tleV0gIT0gdmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmRhdGFba2V5XSkge1xuICAgICAgICBpZiAodGhpcy5kYXRhW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICAgIHRoaXMuUmVtb3ZlRXZlbnREYXRhKCh0aGlzLmRhdGFba2V5XSBhcyBEYXRhRmxvdyksIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhW2tleV0pICYmICh0aGlzLmRhdGFba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiB0aGlzLmRhdGFba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLlJlbW92ZUV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuQmluZEV2ZW50KHZhbHVlLCBrZXkpO1xuICAgIH1cbiAgICB0aGlzLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgIGlmIChpc0Rpc3BhdGNoKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICB9XG5cbiAgfVxuICBwdWJsaWMgU2V0RGF0YShkYXRhOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCwgaXNDbGVhckRhdGEgPSBmYWxzZSkge1xuXG4gICAgaWYgKGlzQ2xlYXJEYXRhKSB0aGlzLmRhdGEgPSB7fTtcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICBsZXQgJGRhdGE6IERhdGFGbG93ID0gZGF0YSBhcyBEYXRhRmxvdztcbiAgICAgIGlmICghdGhpcy5wcm9wZXJ0eSAmJiAkZGF0YS5wcm9wZXJ0eSkgdGhpcy5wcm9wZXJ0eSA9ICRkYXRhLnByb3BlcnR5O1xuICAgICAgaWYgKHRoaXMucHJvcGVydGllcykge1xuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5wcm9wZXJ0aWVzKSkge1xuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoJGRhdGEuZ2V0UHJvcGVydGllcygpKSkge1xuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICB0aGlzLlNldChrZXksIGRhdGFba2V5XSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgIGRhdGFcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgR2V0KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xuICB9XG4gIHB1YmxpYyBBcHBlbmQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBpZiAoIXRoaXMuZGF0YVtrZXldKSB0aGlzLmRhdGFba2V5XSA9IFtdO1xuICAgIHRoaXMuZGF0YVtrZXldID0gWy4uLnRoaXMuZGF0YVtrZXldLCB2YWx1ZV07XG4gICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gIH1cbiAgcHVibGljIFJlbW92ZShrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xuICAgIHZhciBpbmRleCA9IHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLlJlbW92ZUV2ZW50RGF0YSh0aGlzLmRhdGFba2V5XVtpbmRleF0sIGtleSk7XG4gICAgICB0aGlzLmRhdGFba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEgPSB7fTtcbiAgICBpZiAoIXRoaXMucHJvcGVydGllcykge1xuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0eT8uZ2V0UHJvcGVydHlCeUtleShkYXRhLmtleSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgIHRoaXMuZGF0YVtrZXldID0gKGRhdGE/LltrZXldID8/ICgodHlwZW9mIHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0ID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCgpIDogdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQpID8/IFwiXCIpKTtcbiAgICAgICAgaWYgKCEodGhpcy5kYXRhW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykgJiYgdGhpcy5kYXRhW2tleV0ua2V5KSB7XG4gICAgICAgICAgdGhpcy5kYXRhW2tleV0gPSBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgdGhpcy5kYXRhW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGF0YVtrZXldKSAmJiB0aGlzLnByb3BlcnR5ICYmICEodGhpcy5kYXRhW2tleV1bMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykpIHtcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IHRoaXMuZGF0YVtrZXldLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoIShpdGVtIGluc3RhbmNlb2YgRGF0YUZsb3cpICYmIGl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgaXRlbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLkJpbmRFdmVudCh0aGlzLmRhdGFba2V5XSwga2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnRvSnNvbigpKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCByczogYW55ID0ge307XG4gICAgaWYgKCF0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMucHJvcGVydHk/LmdldFByb3BlcnR5QnlLZXkodGhpcy5kYXRhLmtleSk7XG4gICAgfVxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICByc1trZXldID0gdGhpcy5HZXQoa2V5KTtcbiAgICAgIGlmIChyc1trZXldIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0udG9Kc29uKCk7XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocnNba2V5XSkgJiYgKHJzW2tleV0gYXMgW10pLmxlbmd0aCA+IDAgJiYgcnNba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgIHJzW2tleV0gPSByc1trZXldLm1hcCgoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0udG9Kc29uKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnM7XG4gIH1cbiAgcHVibGljIGRlbGV0ZSgpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICB0aGlzLmRhdGEgPSB7fTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xyXG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xyXG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcclxuaW1wb3J0IHsgSUV2ZW50IH0gZnJvbSBcIi4vSUZsb3dcIjtcclxuZXhwb3J0IGNsYXNzIEZsb3dDb3JlIGltcGxlbWVudHMgSUV2ZW50IHtcclxuICBwdWJsaWMgR2V0SWQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnaWQnKTtcclxuICB9XHJcbiAgcHVibGljIFNldElkKGlkOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCdpZCcsIGlkKTtcclxuICB9XHJcbiAgcHVibGljIHByb3BlcnRpZXM6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xyXG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblxyXG4gIHB1YmxpYyBDaGVja0VsZW1lbnRDaGlsZChlbDogSFRNTEVsZW1lbnQpIHtcclxuICAgIHJldHVybiB0aGlzLmVsTm9kZSA9PSBlbCB8fCB0aGlzLmVsTm9kZS5jb250YWlucyhlbCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XHJcbiAgcHVibGljIFNldERhdGEoZGF0YTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwpIHtcclxuICAgIHRoaXMuZGF0YS5TZXREYXRhKGRhdGEsIHNlbmRlcik7XHJcbiAgfVxyXG4gIHB1YmxpYyBTZXREYXRhRmxvdyhkYXRhOiBEYXRhRmxvdykge1xyXG4gICAgdGhpcy5kYXRhLlNldERhdGEoZGF0YSwgdGhpcywgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5kaXNwYXRjaChgYmluZF9kYXRhX2V2ZW50YCwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XHJcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHsgZGF0YSwgc2VuZGVyOiB0aGlzIH0pO1xyXG4gIH1cclxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcclxuICB9XHJcbiAgUmVtb3ZlRGF0YUV2ZW50KCkge1xyXG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlRmxvdzxUUGFyZW50IGV4dGVuZHMgRmxvd0NvcmU+IGV4dGVuZHMgRmxvd0NvcmUge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyZW50OiBUUGFyZW50KSB7XHJcbiAgICBzdXBlcigpO1xyXG4gIH1cclxufVxyXG4iLCJleHBvcnQgY29uc3QgTE9HID0gKG1lc3NhZ2U/OiBhbnksIC4uLm9wdGlvbmFsUGFyYW1zOiBhbnlbXSkgPT4gY29uc29sZS5sb2cobWVzc2FnZSwgb3B0aW9uYWxQYXJhbXMpO1xuZXhwb3J0IGNvbnN0IGdldERhdGUgPSAoKSA9PiAobmV3IERhdGUoKSk7XG5leHBvcnQgY29uc3QgZ2V0VGltZSA9ICgpID0+IGdldERhdGUoKS5nZXRUaW1lKCk7XG5leHBvcnQgY29uc3QgZ2V0VXVpZCA9ICgpID0+IHtcbiAgLy8gaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvcmZjNDEyMi50eHRcbiAgbGV0IHM6IGFueSA9IFtdO1xuICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzY7IGkrKykge1xuICAgIHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApLCAxKTtcbiAgfVxuICBzWzE0XSA9IFwiNFwiOyAgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG4gIHNbMTldID0gaGV4RGlnaXRzLnN1YnN0cigoc1sxOV0gJiAweDMpIHwgMHg4LCAxKTsgIC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG4gIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcbiAgcmV0dXJuIHV1aWQ7XG59XG5cbmV4cG9ydCBjb25zdCBjb21wYXJlU29ydCA9IChhOiBhbnksIGI6IGFueSkgPT4ge1xuICBpZiAoYS5zb3J0IDwgYi5zb3J0KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmIChhLnNvcnQgPiBiLnNvcnQpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmV4cG9ydCBjb25zdCBpc0Z1bmN0aW9uID0gKGZuOiBhbnkpID0+IHtcbiAgcmV0dXJuIGZuICYmIGZuIGluc3RhbmNlb2YgRnVuY3Rpb247XG59XG5leHBvcnQgY29uc3QgZG93bmxvYWRPYmplY3RBc0pzb24gPSAoZXhwb3J0T2JqOiBhbnksIGV4cG9ydE5hbWU6IHN0cmluZykgPT4ge1xuICB2YXIgZGF0YVN0ciA9IFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShleHBvcnRPYmopKTtcbiAgdmFyIGRvd25sb2FkQW5jaG9yTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgZGF0YVN0cik7XG4gIGRvd25sb2FkQW5jaG9yTm9kZS5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBleHBvcnROYW1lICsgXCIuanNvblwiKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb3dubG9hZEFuY2hvck5vZGUpOyAvLyByZXF1aXJlZCBmb3IgZmlyZWZveFxuICBkb3dubG9hZEFuY2hvck5vZGUuY2xpY2soKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnJlbW92ZSgpO1xufVxuZXhwb3J0IGNvbnN0IHJlYWRGaWxlTG9jYWwgPSAoY2FsbGJhY2s6IGFueSkgPT4ge1xuICB2YXIgaW5wdXRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0RWwuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2ZpbGUnKTtcbiAgaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjaz8uKGZyLnJlc3VsdCk7XG4gICAgfVxuICAgIGlmIChpbnB1dEVsICYmIGlucHV0RWwuZmlsZXMpXG4gICAgICBmci5yZWFkQXNUZXh0KGlucHV0RWwuZmlsZXNbMF0pO1xuICB9KTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpbnB1dEVsKTtcbiAgaW5wdXRFbC5jbGljaygpO1xuICBpbnB1dEVsLnJlbW92ZSgpO1xufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi9JRmxvd1wiO1xyXG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xyXG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XHJcbmltcG9ydCB7IGlzRnVuY3Rpb24gfSBmcm9tIFwiLi9VdGlsc1wiO1xyXG5cclxuZXhwb3J0IGNvbnN0IFRhZ1ZpZXcgPSBbJ1NQQU4nLCAnRElWJywgJ1AnLCAnVEVYVEFSRUEnXTtcclxuZXhwb3J0IGNsYXNzIERhdGFWaWV3IHtcclxuICBwcml2YXRlIGVsTm9kZTogRWxlbWVudCB8IHVuZGVmaW5lZDtcclxuICBwcml2YXRlIHByb3BlcnR5OiBhbnk7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgZWw6IEVsZW1lbnQsIHByaXZhdGUgZGF0YTogRGF0YUZsb3csIHByaXZhdGUgbWFpbjogSU1haW4sIHByaXZhdGUga2V5TmFtZTogc3RyaW5nIHwgbnVsbCA9IG51bGwpIHtcclxuICAgIGlmICh0aGlzLmtleU5hbWUpIHtcclxuICAgICAgaWYgKCFlbC5nZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnKSkge1xyXG4gICAgICAgIHRoaXMucHJvcGVydHkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleSh0aGlzLmRhdGEuR2V0KCdrZXknKSk/Llt0aGlzLmtleU5hbWVdO1xyXG4gICAgICAgIHRoaXMuZWwuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3InKTtcclxuICAgICAgICBpZiAodGhpcy5wcm9wZXJ0eS5lZGl0KSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0eS5zZWxlY3QpIHtcclxuICAgICAgICAgICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJub2RlLWZvcm0tY29udHJvbFwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIHRoaXMua2V5TmFtZSk7XHJcbiAgICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMua2V5TmFtZSA9IGVsPy5nZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnKTtcclxuICAgICAgaWYgKHRoaXMua2V5TmFtZSkge1xyXG4gICAgICAgIHRoaXMucHJvcGVydHkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleSh0aGlzLmRhdGEuR2V0KCdrZXknKSk/Llt0aGlzLmtleU5hbWVdO1xyXG4gICAgICAgIHRoaXMuZWxOb2RlID0gdGhpcy5lbDtcclxuICAgICAgICBsZXQgbm9kZUVkaXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBub2RlRWRpdG9yLmNsYXNzTGlzdC5hZGQoJ25vZGUtZWRpdG9yJyk7XHJcbiAgICAgICAgZWwucGFyZW50RWxlbWVudD8uaW5zZXJ0QmVmb3JlKG5vZGVFZGl0b3IsIGVsKTtcclxuICAgICAgICBlbC5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZChlbCk7XHJcbiAgICAgICAgbm9kZUVkaXRvci5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0aGlzLmtleU5hbWUpXHJcbiAgICAgIHRoaXMuYmluZERhdGEoKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBiaW5kRGF0YSgpIHtcclxuICAgIGlmICh0aGlzLmtleU5hbWUgJiYgdGhpcy5lbE5vZGUpIHtcclxuICAgICAgdGhpcy5kYXRhLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke3RoaXMua2V5TmFtZX1gLCB0aGlzLmJpbmRJbnB1dC5iaW5kKHRoaXMpKTtcclxuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5iaW5kRXZlbnQuYmluZCh0aGlzKSk7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcclxuICAgICAgaWYgKHRoaXMucHJvcGVydHkgJiYgdGhpcy5wcm9wZXJ0eS5zZWxlY3QgJiYgaXNGdW5jdGlvbih0aGlzLnByb3BlcnR5LmRhdGFTZWxlY3QpKSB7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMucHJvcGVydHkuZGF0YVNlbGVjdCh7IGVsTm9kZTogdGhpcy5lbE5vZGUsIG1haW46IHRoaXMubWFpbiwga2V5OiB0aGlzLmtleU5hbWUgfSkubWFwKCh7IHZhbHVlLCB0ZXh0IH06IGFueSkgPT4ge1xyXG4gICAgICAgICAgbGV0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgICAgICAgb3B0aW9uLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICBvcHRpb24udGV4dCA9IHRleHQ7XHJcbiAgICAgICAgICByZXR1cm4gb3B0aW9uO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGZvciAobGV0IG9wdGlvbiBvZiBvcHRpb25zKSB7XHJcbiAgICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChvcHRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMucHJvcGVydHkgJiYgaXNGdW5jdGlvbih0aGlzLnByb3BlcnR5LnNjcmlwdCkpIHtcclxuICAgICAgICB0aGlzLnByb3BlcnR5LnNjcmlwdCh7IGVsTm9kZTogdGhpcy5lbE5vZGUsIG1haW46IHRoaXMubWFpbiwga2V5OiB0aGlzLmtleU5hbWUgfSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5zZXROb2RlVmFsdWUodGhpcy5kYXRhLkdldCh0aGlzLmtleU5hbWUpKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHJpdmF0ZSBzZXROb2RlVmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIGlmIChUYWdWaWV3LmluY2x1ZGVzKHRoaXMuZWxOb2RlLnRhZ05hbWUpKSB7XHJcbiAgICAgICAgKHRoaXMuZWxOb2RlIGFzIGFueSkuaW5uZXJUZXh0ID0gYCR7dmFsdWV9YDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAodGhpcy5lbE5vZGUgYXMgYW55KS52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuICBwcml2YXRlIGJpbmRJbnB1dCh7IHZhbHVlLCBzZW5kZXIgfTogYW55KSB7XHJcbiAgICBpZiAoc2VuZGVyICE9PSB0aGlzICYmIHRoaXMuZWxOb2RlICYmIHNlbmRlci5lbE5vZGUgIT09IHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIHRoaXMuc2V0Tm9kZVZhbHVlKHZhbHVlKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHJpdmF0ZSBiaW5kRXZlbnQoKSB7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgaWYgKHRoaXMua2V5TmFtZSAmJiB0aGlzLmVsTm9kZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5rZXlOYW1lLCAodGhpcy5lbE5vZGUgYXMgYW55KS52YWx1ZSwgdGhpcyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuICBwdWJsaWMgRGVsZXRlKCkge1xyXG4gICAgaWYgKHRoaXMua2V5TmFtZSAmJiB0aGlzLmVsTm9kZSkge1xyXG4gICAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7dGhpcy5rZXlOYW1lfWAsIHRoaXMuYmluZElucHV0LmJpbmQodGhpcykpO1xyXG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcclxuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgc3RhdGljIEJpbmRFbGVtZW50KGVsOiBFbGVtZW50LCBkYXRhOiBEYXRhRmxvdywgbWFpbjogSU1haW4sIGtleTogc3RyaW5nIHwgbnVsbCA9IG51bGwpOiBEYXRhVmlld1tdIHtcclxuICAgIGlmIChlbC5jaGlsZEVsZW1lbnRDb3VudCA9PSAwIHx8IGVsLmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpKSB7XHJcbiAgICAgIHJldHVybiBbbmV3IERhdGFWaWV3KGVsLCBkYXRhLCBtYWluLCBrZXkpXTtcclxuICAgIH1cclxuICAgIHJldHVybiBBcnJheS5mcm9tKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tub2RlXFxcXDptb2RlbF0nKSkubWFwKChpdGVtOiBFbGVtZW50KSA9PiB7XHJcbiAgICAgIHJldHVybiBuZXcgRGF0YVZpZXcoaXRlbSwgZGF0YSwgbWFpbik7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xuXG5leHBvcnQgY29uc3QgU2NvcGVSb290ID0gXCJyb290XCI7XG5leHBvcnQgY2xhc3MgVmFyaWFibGVOb2RlIGV4dGVuZHMgRXZlbnRGbG93IHtcbiAgbmFtZTogc3RyaW5nID0gJyc7XG4gIHZhbHVlOiBhbnk7XG4gIHR5cGU6IHN0cmluZyA9ICcnO1xuICBpbml0YWxWYWx1ZTogYW55O1xuICBzY29wZTogc3RyaW5nID0gU2NvcGVSb290O1xufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBOb2RlSXRlbSB9IGZyb20gXCIuL05vZGVJdGVtXCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lIHtcbiAgcHVibGljIGVsTm9kZTogU1ZHRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgcHVibGljIGVsUGF0aDogU1ZHUGF0aEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJwYXRoXCIpO1xuICBwcml2YXRlIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyB0ZW1wOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZnJvbTogTm9kZUl0ZW0sIHB1YmxpYyBmcm9tSW5kZXg6IG51bWJlciA9IDAsIHB1YmxpYyB0bzogTm9kZUl0ZW0gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsIHB1YmxpYyB0b0luZGV4OiBudW1iZXIgPSAwLCBkYXRhOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5mcm9tLnBhcmVudC5lbENhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG5cbiAgICB0aGlzLmZyb20uQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnRvPy5BZGRMaW5lKHRoaXMpO1xuICAgIGlmIChkYXRhKSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoXG4gICAgICB7XG4gICAgICAgIGZyb206IHRoaXMuZnJvbS5HZXRJZCgpLFxuICAgICAgICBmcm9tSW5kZXg6IHRoaXMuZnJvbUluZGV4LFxuICAgICAgICB0bzogdGhpcy50bz8uR2V0SWQoKSxcbiAgICAgICAgdG9JbmRleDogdGhpcy50b0luZGV4XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAuLi4gdGhpcy5mcm9tLnBhcmVudC5tYWluLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLmxpbmUpIHx8IHt9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmZyb20uZGF0YS5BcHBlbmQoJ2xpbmVzJywgdGhpcy5kYXRhKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVG8odG9feDogbnVtYmVyLCB0b195OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuZnJvbSB8fCB0aGlzLmZyb20uZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgeyB4OiBmcm9tX3gsIHk6IGZyb21feSB9OiBhbnkgPSB0aGlzLmZyb20uZ2V0UG9zdGlzaW9uRG90KHRoaXMuZnJvbUluZGV4KTtcbiAgICB2YXIgbGluZUN1cnZlID0gdGhpcy5jcmVhdGVDdXJ2YXR1cmUoZnJvbV94LCBmcm9tX3ksIHRvX3gsIHRvX3ksIHRoaXMuY3VydmF0dXJlLCAnb3RoZXInKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCk6IExpbmUge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvLmVsTm9kZSkge1xuICAgICAgbGV0IHsgeDogdG9feCwgeTogdG9feSB9OiBhbnkgPSB0aGlzLnRvLmdldFBvc3Rpc2lvbkRvdCh0aGlzLnRvSW5kZXgpO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIEFjdGl2ZShmbGc6IGFueSA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwsIGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5mcm9tLmRhdGEuUmVtb3ZlKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gICAgaWYgKHRoaXMuZnJvbSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50bz8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsUGF0aC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLmZyb20ucGFyZW50LnNldExpbmVDaG9vc2UodGhpcylcbiAgfVxuICBwdWJsaWMgc2V0Tm9kZVRvKG5vZGU6IE5vZGVJdGVtIHwgdW5kZWZpbmVkLCB0b0luZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLnRvID0gbm9kZTtcbiAgICB0aGlzLnRvSW5kZXggPSB0b0luZGV4O1xuICB9XG4gIHB1YmxpYyBDbG9uZSgpIHtcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvSW5kZXggJiYgdGhpcy5mcm9tICE9IHRoaXMudG8gJiYgIXRoaXMuZnJvbS5jaGVja0xpbmVFeGlzdHModGhpcy5mcm9tSW5kZXgsIHRoaXMudG8sIHRoaXMudG9JbmRleCkpIHtcbiAgICAgIHJldHVybiBuZXcgTGluZSh0aGlzLmZyb20sIHRoaXMuZnJvbUluZGV4LCB0aGlzLnRvLCB0aGlzLnRvSW5kZXgpLlVwZGF0ZVVJKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBnZXRUaW1lIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcblxuZXhwb3J0IGVudW0gTW92ZVR5cGUge1xuICBOb25lID0gMCxcbiAgTm9kZSA9IDEsXG4gIENhbnZhcyA9IDIsXG4gIExpbmUgPSAzLFxufVxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlld19FdmVudCB7XG5cbiAgcHJpdmF0ZSB0aW1lRmFzdENsaWNrOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHRhZ0luZ29yZSA9IFsnaW5wdXQnLCAnYnV0dG9uJywgJ2EnLCAndGV4dGFyZWEnXTtcblxuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gIHByaXZhdGUgZmxnRHJhcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIGF2X3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgYXZfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHRlbXBMaW5lOiBMaW5lIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IERlc2dpbmVyVmlldykge1xuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuICAgIC8qIENvbnRleHQgTWVudSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMubm9kZV9kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMubm9kZV9kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy56b29tX2VudGVyLmJpbmQodGhpcykpO1xuICAgIC8qIERlbGV0ZSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb250ZXh0bWVudShldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cbiAgcHJpdmF0ZSBub2RlX2RyYWdvdmVyKGV2OiBhbnkpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfVxuICBwcml2YXRlIG5vZGVfZHJvcEVuZChldjogYW55KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBsZXQga2V5Tm9kZTogYW55ID0gdGhpcy5wYXJlbnQubWFpbi5nZXRDb250cm9sQ2hvb3NlKCk7XG4gICAgaWYgKCFrZXlOb2RlICYmIGV2LnR5cGUgIT09IFwidG91Y2hlbmRcIikge1xuICAgICAga2V5Tm9kZSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwibm9kZVwiKTtcbiAgICB9XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuXG4gICAgaWYgKHRoaXMucGFyZW50LmNoZWNrT25seU5vZGUoa2V5Tm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IG5vZGVJdGVtID0gdGhpcy5wYXJlbnQuQWRkTm9kZShrZXlOb2RlLCB7XG4gICAgICBncm91cDogdGhpcy5wYXJlbnQuQ3VycmVudEdyb3VwKClcbiAgICB9KTtcbiAgICBub2RlSXRlbS51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21fb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBab29tIEluXG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21faW4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBTdGFydE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmICh0aGlzLnRhZ0luZ29yZS5pbmNsdWRlcyhldi50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSBnZXRUaW1lKCk7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21haW4tcGF0aCcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgbGV0IG5vZGVDaG9vc2UgPSB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk7XG4gICAgaWYgKG5vZGVDaG9vc2UgJiYgbm9kZUNob29zZS5DaGVja0VsZW1lbnRDaGlsZChldi50YXJnZXQpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh1bmRlZmluZWQpO1xuICAgIH1cbiAgICBpZiAobm9kZUNob29zZSAmJiB0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vZGUgJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBldi50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmUobm9kZUNob29zZSwgZnJvbUluZGV4KTtcbiAgICAgIHRoaXMudGVtcExpbmUudGVtcCA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgdGhpcy5hdl94ID0gdGhpcy5wYXJlbnQuZ2V0WCgpO1xuICAgICAgdGhpcy5hdl95ID0gdGhpcy5wYXJlbnQuZ2V0WSgpO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuYXZfeCArIHRoaXMucGFyZW50LkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRZKHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLk5vZGU6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucG9zX3ggLSBlX3Bvc194KTtcbiAgICAgICAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcbiAgICAgICAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICAgICAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk/LnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLkxpbmU6XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgICAgICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcbiAgICAgICAgICAgIHRoaXMudGVtcExpbmUudXBkYXRlVG8odGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0TGVmdCAtIHgsIHRoaXMucGFyZW50LmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICAgICAgbGV0IG5vZGVFbCA9IGV2LnRhcmdldC5jbG9zZXN0KCdbbm9kZS1pZF0nKTtcbiAgICAgICAgICAgIGxldCBub2RlSWQgPSBub2RlRWw/LmdldEF0dHJpYnV0ZSgnbm9kZS1pZCcpO1xuICAgICAgICAgICAgbGV0IG5vZGVUbyA9IG5vZGVJZCA/IHRoaXMucGFyZW50LkdldE5vZGVCeUlkKG5vZGVJZCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAobm9kZVRvICYmIGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJub2RlLWRvdFwiKSkge1xuICAgICAgICAgICAgICBsZXQgdG9JbmRleCA9IGV2LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gbm9kZUVsPy5xdWVyeVNlbGVjdG9yKCcubm9kZS1kb3QnKT8uWzBdPy5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcbiAgICAgIHRoaXMubW91c2VfeSA9IGVfcG9zX3k7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgRW5kTW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgoZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDEwMCkgfHwgIXRoaXMuZmxnTW92ZSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIGxldCB4ID0gdGhpcy5hdl94ICsgdGhpcy5wYXJlbnQuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICBsZXQgeSA9IHRoaXMuYXZfeSArIHRoaXMucGFyZW50LkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgIHRoaXMucGFyZW50LnNldFkoeSk7XG4gICAgICB0aGlzLmF2X3ggPSAwO1xuICAgICAgdGhpcy5hdl95ID0gMDtcbiAgICB9XG4gICAgaWYgKHRoaXMudGVtcExpbmUpIHtcbiAgICAgIHRoaXMudGVtcExpbmUuQ2xvbmUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUuZGVsZXRlKCk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwcml2YXRlIGtleWRvd24oZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmIChldi5rZXkgPT09ICdEZWxldGUnIHx8IChldi5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGV2Lm1ldGFLZXkpKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgICB0aGlzLnBhcmVudC5nZXRMaW5lQ2hvb3NlKCk/LmRlbGV0ZSgpO1xuICAgIH1cbiAgICBpZiAoZXYua2V5ID09PSAnRjInKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlld19Ub29sYmFyIHtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGVsUGF0aEdyb3VwOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwcml2YXRlIGJ0bkJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBEZXNnaW5lclZpZXcpIHtcbiAgICB0aGlzLmVsTm9kZSA9IHBhcmVudC5lbFRvb2xiYXI7XG4gICAgdGhpcy5lbFBhdGhHcm91cC5jbGFzc0xpc3QuYWRkKCd0b29sYmFyLWdyb3VwJyk7XG4gICAgdGhpcy5yZW5kZXJVSSgpO1xuICAgIHRoaXMucmVuZGVyUGF0aEdyb3VwKCk7XG4gIH1cbiAgcHVibGljIHJlbmRlclBhdGhHcm91cCgpIHtcbiAgICB0aGlzLmJ0bkJhY2suc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgdGhpcy5lbFBhdGhHcm91cC5pbm5lckhUTUwgPSBgYDtcbiAgICBsZXQgZ3JvdXBzID0gdGhpcy5wYXJlbnQuR2V0R3JvdXBOYW1lKCk7XG4gICAgbGV0IGxlbiA9IGdyb3Vwcy5sZW5ndGggLSAxO1xuICAgIGlmIChsZW4gPCAwKSByZXR1cm47XG4gICAgbGV0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdGV4dC5pbm5lckhUTUwgPSBgUm9vdGA7XG4gICAgdGV4dC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4gdGhpcy5wYXJlbnQuQmFja0dyb3VwKCdSb290JykpO1xuICAgIHRoaXMuZWxQYXRoR3JvdXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgdGhpcy5idG5CYWNrLnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcbiAgICBmb3IgKGxldCBpbmRleCA9IGxlbjsgaW5kZXggPj0gMDsgaW5kZXgtLSkge1xuICAgICAgbGV0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICB0ZXh0LmlubmVySFRNTCA9IGA+PiR7Z3JvdXBzW2luZGV4XS50ZXh0fWA7XG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZSgnZ3JvdXAnLCBncm91cHNbaW5kZXhdLmlkKTtcbiAgICAgIHRleHQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHRoaXMucGFyZW50LkJhY2tHcm91cChncm91cHNbaW5kZXhdLmlkKSk7XG4gICAgICB0aGlzLmVsUGF0aEdyb3VwLmFwcGVuZENoaWxkKHRleHQpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgcmVuZGVyVUkoKSB7XG4gICAgaWYgKCF0aGlzLmVsTm9kZSkgcmV0dXJuO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBgO1xuICAgIHRoaXMuYnRuQmFjay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucGFyZW50LkJhY2tHcm91cCgpKTtcbiAgICB0aGlzLmJ0bkJhY2suaW5uZXJIVE1MID0gYEJhY2tgO1xuICAgIGxldCBidG5ab29tSW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBidG5ab29tSW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnBhcmVudC56b29tX2luKCkpO1xuICAgIGJ0blpvb21Jbi5pbm5lckhUTUwgPSBgK2A7XG4gICAgbGV0IGJ0blpvb21PdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBidG5ab29tT3V0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuem9vbV9vdXQoKSk7XG4gICAgYnRuWm9vbU91dC5pbm5lckhUTUwgPSBgLWA7XG4gICAgbGV0IGJ0blpvb21SZXNldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21SZXNldC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucGFyZW50Lnpvb21fcmVzZXQoKSk7XG4gICAgYnRuWm9vbVJlc2V0LmlubmVySFRNTCA9IGAqYDtcbiAgICBsZXQgYnV0dG9uR3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBidXR0b25Hcm91cC5jbGFzc0xpc3QuYWRkKCd0b29sYmFyLWJ1dHRvbicpXG4gICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5idG5CYWNrKTtcbiAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZChidG5ab29tSW4pO1xuICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKGJ0blpvb21PdXQpO1xuICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKGJ0blpvb21SZXNldCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbFBhdGhHcm91cCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoYnV0dG9uR3JvdXApO1xuICB9XG59XG4iLCJpbXBvcnQgeyBCYXNlRmxvdywgRXZlbnRFbnVtLCBEYXRhRmxvdywgRGF0YVZpZXcgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgaXNGdW5jdGlvbiB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5leHBvcnQgY2xhc3MgTm9kZUl0ZW0gZXh0ZW5kcyBCYXNlRmxvdzxEZXNnaW5lclZpZXc+IHtcbiAgLyoqXG4gICAqIEdFVCBTRVQgZm9yIERhdGFcbiAgICovXG4gIHB1YmxpYyBnZXROYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCduYW1lJyk7XG4gIH1cbiAgcHVibGljIGdldFkoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd5Jyk7XG4gIH1cbiAgcHVibGljIHNldFkodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd5JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRYKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneCcpO1xuICB9XG4gIHB1YmxpYyBzZXRYKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgQ2hlY2tLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgna2V5JykgPT0ga2V5O1xuICB9XG4gIHB1YmxpYyBnZXREYXRhTGluZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnbGluZXMnKSA/PyBbXTtcbiAgfVxuICBwdWJsaWMgY2hlY2tMaW5lRXhpc3RzKGZyb21JbmRleDogbnVtYmVyLCB0bzogTm9kZUl0ZW0sIHRvSW5kZXg6IE51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmFyckxpbmUuZmlsdGVyKChpdGVtOiBMaW5lKSA9PiB7XG4gICAgICBpZiAoIWl0ZW0udGVtcCAmJiBpdGVtLnRvID09IHRvICYmIGl0ZW0udG9JbmRleCA9PSB0b0luZGV4ICYmIGl0ZW0uZnJvbUluZGV4ID09IGZyb21JbmRleCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghaXRlbS50ZW1wICYmIGl0ZW0uZnJvbSA9PSB0byAmJiBpdGVtLmZyb21JbmRleCA9PSB0b0luZGV4ICYmIGl0ZW0udG9JbmRleCA9PSBmcm9tSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9KS5sZW5ndGggPiAwO1xuICB9XG4gIHB1YmxpYyBlbENvbnRlbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgYXJyTGluZTogTGluZVtdID0gW107XG4gIHByaXZhdGUgb3B0aW9uOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBhcnJEYXRhVmlldzogRGF0YVZpZXdbXSA9IFtdO1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBEZXNnaW5lclZpZXcsIHByaXZhdGUga2V5Tm9kZTogYW55LCBkYXRhOiBhbnkgPSB7fSkge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5vcHRpb24gPSB0aGlzLnBhcmVudC5tYWluLmdldENvbnRyb2xOb2RlQnlLZXkoa2V5Tm9kZSk7XG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5vcHRpb24/LnByb3BlcnRpZXM7XG4gICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kYXRhLkluaXREYXRhKHsgLi4uZGF0YSwgbmFtZTogdGhpcy5vcHRpb24ubmFtZSB9LCB0aGlzLnByb3BlcnRpZXMpO1xuICAgICAgdGhpcy5wYXJlbnQuZGF0YS5BcHBlbmQoJ25vZGVzJywgdGhpcy5kYXRhKTtcbiAgICB9XG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLnJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLW5vZGUnKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbi5jbGFzcykge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbi5jbGFzcyk7XG4gICAgfVxuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnbm9kZS1pZCcsIHRoaXMuR2V0SWQoKSk7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5Om5vbmUnKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMucmVuZGVyVUkoKTtcbiAgfVxuICBwdWJsaWMgZ2V0T3B0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbjtcbiAgfVxuICBwcml2YXRlIHJlbmRlclVJKGRldGFpbDogYW55ID0gbnVsbCkge1xuICAgIGlmICgoZGV0YWlsICYmIFsneCcsICd5J10uaW5jbHVkZXMoZGV0YWlsLmtleSkpKSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLmVsTm9kZS5jb250YWlucyhkb2N1bWVudC5hY3RpdmVFbGVtZW50KSkgcmV0dXJuO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApO1xuICAgIGlmICh0aGlzLmdldE9wdGlvbigpPy5oaWRlVGl0bGUgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS10b3BcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3R0b21cIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtcmlnaHRcIj48L2Rpdj5cbiAgICBgO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1sZWZ0XCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtdG9wXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj4ke3RoaXMub3B0aW9uLmljb259ICR7dGhpcy5nZXROYW1lKCl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWJvdHRvbVwiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1yaWdodFwiPjwvZGl2PlxuICAgIGA7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkTm9kZURvdCA9IChudW06IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQsIHN0YXJ0OiBudW1iZXIsIHF1ZXJ5OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChudW0pIHtcbiAgICAgICAgbGV0IG5vZGVRdWVyeSA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IocXVlcnkpO1xuICAgICAgICBpZiAobm9kZVF1ZXJ5KSB7XG4gICAgICAgICAgbm9kZVF1ZXJ5LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICAgICAgbGV0IG5vZGVEb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIG5vZGVEb3QuY2xhc3NMaXN0LmFkZCgnbm9kZS1kb3QnKTtcbiAgICAgICAgICAgIG5vZGVEb3Quc2V0QXR0cmlidXRlKCdub2RlJywgYCR7c3RhcnQgKyBpfWApO1xuICAgICAgICAgICAgbm9kZVF1ZXJ5LmFwcGVuZENoaWxkKG5vZGVEb3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LmxlZnQsIDEwMDAsICcubm9kZS1sZWZ0Jyk7XG4gICAgYWRkTm9kZURvdCh0aGlzLm9wdGlvbj8uZG90Py50b3AsIDIwMDAsICcubm9kZS10b3AnKTtcbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LmJvdHRvbSwgMzAwMCwgJy5ub2RlLWJvdHRvbScpO1xuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8ucmlnaHQsIDQwMDAsICcubm9kZS1yaWdodCcpO1xuXG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcubm9kZS1jb250ZW50IC5ib2R5JykgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5wYXJlbnQubWFpbi5yZW5kZXJIdG1sKHRoaXMsIHRoaXMuZWxDb250ZW50KTtcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgdGhpcy5hcnJEYXRhVmlldy5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLkRlbGV0ZSgpKTtcbiAgICBpZiAoaXNGdW5jdGlvbih0aGlzLm9wdGlvbi5zY3JpcHQpKSB7XG4gICAgICB0aGlzLm9wdGlvbi5zY3JpcHQoeyBub2RlOiB0aGlzLCBlbE5vZGU6IHRoaXMuZWxOb2RlLCBtYWluOiB0aGlzLnBhcmVudC5tYWluIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5lbENvbnRlbnQpXG4gICAgICB0aGlzLmFyckRhdGFWaWV3ID0gRGF0YVZpZXcuQmluZEVsZW1lbnQodGhpcy5lbENvbnRlbnQsIHRoaXMuZGF0YSwgdGhpcy5wYXJlbnQubWFpbik7XG4gIH1cbiAgcHVibGljIG9wZW5Hcm91cCgpIHtcbiAgICBpZiAodGhpcy5DaGVja0tleSgnbm9kZV9ncm91cCcpKSB7XG4gICAgICB0aGlzLnBhcmVudC5vcGVuR3JvdXAodGhpcy5HZXRJZCgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgbGV0IHRlbXB4ID0geDtcbiAgICAgIGxldCB0ZW1weSA9IHk7XG4gICAgICBpZiAoIWlDaGVjaykge1xuICAgICAgICB0ZW1weSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgLSB5KTtcbiAgICAgICAgdGVtcHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCAtIHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB4ICE9PSB0aGlzLmdldFgoKSkge1xuICAgICAgICB0aGlzLnNldFgodGVtcHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB5ICE9PSB0aGlzLmdldFkoKSkge1xuICAgICAgICB0aGlzLnNldFkodGVtcHkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgQWN0aXZlKGZsZzogYW55ID0gdHJ1ZSkge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFJlbW92ZUxpbmUobGluZTogTGluZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuYXJyTGluZS5pbmRleE9mKGxpbmUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gIH1cbiAgcHVibGljIGdldFBvc3Rpc2lvbkRvdChpbmRleDogbnVtYmVyID0gMCkge1xuICAgIGxldCBlbERvdDogYW55ID0gdGhpcy5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3IoYC5ub2RlLWRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcbiAgICBpZiAoZWxEb3QpIHtcbiAgICAgIGxldCB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCArIGVsRG90Lm9mZnNldFRvcCArIDEwKTtcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0ICsgMTApO1xuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCkge1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMuZ2V0WSgpfXB4OyBsZWZ0OiAke3RoaXMuZ2V0WCgpfXB4O2ApO1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLlVwZGF0ZVVJKCk7XG4gICAgfSlcbiAgfVxuICBwdWJsaWMgZGVsZXRlKGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLmRlbGV0ZSh0aGlzLCBpc0NsZWFyRGF0YSkpO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMuZGF0YS5kZWxldGUoKTtcbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuUmVtb3ZlRGF0YUV2ZW50KCk7XG4gICAgfVxuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcbiAgICBpZiAoaXNDbGVhckRhdGEpXG4gICAgICB0aGlzLnBhcmVudC5SZW1vdmVOb2RlKHRoaXMpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBSZW5kZXJMaW5lKCkge1xuICAgIHRoaXMuZ2V0RGF0YUxpbmUoKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVGcm9tID0gdGhpcztcbiAgICAgIGxldCBub2RlVG8gPSB0aGlzLnBhcmVudC5HZXROb2RlQnlJZChpdGVtLkdldCgndG8nKSk7XG4gICAgICBsZXQgdG9JbmRleCA9IGl0ZW0uR2V0KCd0b0luZGV4Jyk7XG4gICAgICBsZXQgZnJvbUluZGV4ID0gaXRlbS5HZXQoJ2Zyb21JbmRleCcpO1xuICAgICAgbmV3IExpbmUobm9kZUZyb20sIGZyb21JbmRleCwgbm9kZVRvLCB0b0luZGV4LCBpdGVtKS5VcGRhdGVVSSgpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgRmxvd0NvcmUsIElNYWluLCBFdmVudEVudW0sIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfRXZlbnQgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdfRXZlbnRcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlld19Ub29sYmFyIH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3X1Rvb2xiYXJcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5pbXBvcnQgeyBOb2RlSXRlbSB9IGZyb20gXCIuL05vZGVJdGVtXCI7XG5cbmV4cG9ydCBjb25zdCBab29tID0ge1xuICBtYXg6IDEuNixcbiAgbWluOiAwLjYsXG4gIHZhbHVlOiAwLjEsXG4gIGRlZmF1bHQ6IDFcbn1cbmV4cG9ydCBjbGFzcyBEZXNnaW5lclZpZXcgZXh0ZW5kcyBGbG93Q29yZSB7XG5cbiAgLyoqXG4gICAqIEdFVCBTRVQgZm9yIERhdGFcbiAgICovXG4gIHB1YmxpYyBnZXRab29tKCkge1xuICAgIHJldHVybiArdGhpcy5nZXREYXRhR3JvdXAoKS5HZXQoJ3pvb20nKTtcbiAgfVxuICBwdWJsaWMgc2V0Wm9vbSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF0YUdyb3VwKCkuU2V0KCd6b29tJywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5nZXREYXRhR3JvdXAoKS5HZXQoJ3knKTtcbiAgfVxuICBwdWJsaWMgc2V0WSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF0YUdyb3VwKCkuU2V0KCd5JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRYKCkge1xuICAgIHJldHVybiArdGhpcy5nZXREYXRhR3JvdXAoKS5HZXQoJ3gnKTtcbiAgfVxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF0YUdyb3VwKCkuU2V0KCd4JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHByaXZhdGUgZ3JvdXBEYXRhOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBsYXN0R3JvdXBOYW1lOiBzdHJpbmcgPSBcIlwiO1xuICBwcml2YXRlIGdldERhdGFHcm91cCgpOiBEYXRhRmxvdyB7XG4gICAgaWYgKHRoaXMuJGxvY2spIHJldHVybiB0aGlzLmRhdGE7XG4gICAgLy8gY2FjaGUgZ3JvdXBEYXRhXG4gICAgaWYgKHRoaXMubGFzdEdyb3VwTmFtZSA9PT0gdGhpcy5DdXJyZW50R3JvdXAoKSkgcmV0dXJuIHRoaXMuZ3JvdXBEYXRhID8/IHRoaXMuZGF0YTtcbiAgICB0aGlzLmxhc3RHcm91cE5hbWUgPSB0aGlzLkN1cnJlbnRHcm91cCgpO1xuICAgIGxldCBncm91cHMgPSB0aGlzLmRhdGEuR2V0KCdncm91cHMnKTtcbiAgICB0aGlzLmdyb3VwRGF0YSA9IGdyb3Vwcz8uZmlsdGVyKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS5HZXQoJ2dyb3VwJykgPT0gdGhpcy5sYXN0R3JvdXBOYW1lKT8uWzBdO1xuICAgIGlmICghdGhpcy5ncm91cERhdGEpIHtcbiAgICAgIHRoaXMuZ3JvdXBEYXRhID0gbmV3IERhdGFGbG93KHRoaXMubWFpbiwge1xuICAgICAgICBrZXk6IFByb3BlcnR5RW51bS5ncm91cENhdmFzLFxuICAgICAgICBncm91cDogdGhpcy5sYXN0R3JvdXBOYW1lXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGF0YS5BcHBlbmQoJ2dyb3VwcycsIHRoaXMuZ3JvdXBEYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgICBsZXQgZGF0YUdyb3VwID0gdGhpcy5HZXREYXRhQnlJZCh0aGlzLmxhc3RHcm91cE5hbWUpO1xuICAgIGlmIChkYXRhR3JvdXApIHtcbiAgICAgIGRhdGFHcm91cC5vblNhZmUoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsICgpID0+IHtcbiAgICAgICAgdGhpcy5VcGRhdGVVSS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnRvb2xiYXIucmVuZGVyUGF0aEdyb3VwKCk7XG4gICAgICAgIHRoaXMuY2hhbmdlR3JvdXAoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdyb3VwRGF0YTtcbiAgfVxuICBwcml2YXRlIGdyb3VwOiBhbnlbXSA9IFtdO1xuICBwdWJsaWMgR2V0R3JvdXBOYW1lKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5ncm91cC5tYXAoKGl0ZW0pID0+ICh7IGlkOiBpdGVtLCB0ZXh0OiB0aGlzLkdldERhdGFCeUlkKGl0ZW0pPy5HZXQoJ25hbWUnKSB9KSk7XG4gIH1cbiAgcHVibGljIEJhY2tHcm91cChpZDogYW55ID0gbnVsbCkge1xuICAgIGxldCBpbmRleCA9IDE7XG4gICAgaWYgKGlkKSB7XG4gICAgICBpbmRleCA9IHRoaXMuZ3JvdXAuaW5kZXhPZihpZCk7XG4gICAgICBpZiAoaW5kZXggPCAwKSBpbmRleCA9IDA7XG4gICAgfVxuICAgIGlmIChpbmRleClcbiAgICAgIHRoaXMuZ3JvdXAuc3BsaWNlKDAsIGluZGV4KTtcbiAgICBlbHNlIHRoaXMuZ3JvdXAgPSBbXTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICB9XG4gIHB1YmxpYyBDdXJyZW50R3JvdXAoKSB7XG4gICAgbGV0IG5hbWUgPSB0aGlzLmdyb3VwPy5bMF07XG4gICAgaWYgKG5hbWUgJiYgbmFtZSAhPSAnJykge1xuICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuICAgIHJldHVybiAncm9vdCc7XG4gIH1cblxuICBwdWJsaWMgQ3VycmVudEdyb3VwRGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQnlJZCh0aGlzLkN1cnJlbnRHcm91cCgpKSA/PyB0aGlzLmRhdGE7XG4gIH1cbiAgcHVibGljIGNoYW5nZUdyb3VwKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5ncm91cENoYW5nZSwge1xuICAgICAgICBncm91cDogdGhpcy5HZXRHcm91cE5hbWUoKVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIG9wZW5Hcm91cChpZDogYW55KSB7XG4gICAgdGhpcy5ncm91cCA9IFtpZCwgLi4udGhpcy5ncm91cF07XG4gICAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLmNoYW5nZUdyb3VwKCk7O1xuICB9XG4gIHByaXZhdGUgbGluZUNob29zZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldExpbmVDaG9vc2Uobm9kZTogTGluZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHRoaXMubGluZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubGluZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkge1xuICAgICAgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRMaW5lQ2hvb3NlKCk6IExpbmUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmxpbmVDaG9vc2U7XG4gIH1cbiAgcHJpdmF0ZSBub2RlczogTm9kZUl0ZW1bXSA9IFtdO1xuICBwcml2YXRlIG5vZGVDaG9vc2U6IE5vZGVJdGVtIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgc2V0Tm9kZUNob29zZShub2RlOiBOb2RlSXRlbSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHRoaXMubm9kZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubm9kZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkge1xuICAgICAgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXRMaW5lQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5ub2RlQ2hvb3NlLmRhdGEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLkN1cnJlbnRHcm91cERhdGEoKSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldE5vZGVDaG9vc2UoKTogTm9kZUl0ZW0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm5vZGVDaG9vc2U7XG4gIH1cbiAgcHVibGljIEFkZE5vZGVJdGVtKGRhdGE6IGFueSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5BZGROb2RlKGRhdGEuR2V0KCdrZXknKSwgZGF0YSk7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUoa2V5Tm9kZTogc3RyaW5nLCBkYXRhOiBhbnkgPSB7fSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5JbnNlcnROb2RlKG5ldyBOb2RlSXRlbSh0aGlzLCBrZXlOb2RlLCBkYXRhKSk7XG4gIH1cbiAgcHVibGljIEluc2VydE5vZGUobm9kZTogTm9kZUl0ZW0pOiBOb2RlSXRlbSB7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlSXRlbSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICB0aGlzLmRhdGEuUmVtb3ZlKCdub2RlcycsIG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBDbGVhck5vZGUoKSB7XG4gICAgdGhpcy5ub2Rlcz8uZm9yRWFjaChpdGVtID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICB9XG4gIHB1YmxpYyBHZXREYXRhQWxsTm9kZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuICh0aGlzLmRhdGE/LkdldCgnbm9kZXMnKSA/PyBbXSk7XG4gIH1cbiAgcHVibGljIEdldERhdGFOb2RlKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQWxsTm9kZSgpLmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KFwiZ3JvdXBcIikgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpO1xuICB9XG4gIC8qKlxuICAgKiBWYXJpYnV0ZVxuICAqL1xuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyBlbFRvb2xiYXI6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyB0b29sYmFyOiBEZXNnaW5lclZpZXdfVG9vbGJhcjtcbiAgcHVibGljICRsb2NrOiBib29sZWFuID0gdHJ1ZTtcbiAgcHJpdmF0ZSB6b29tX2xhc3RfdmFsdWU6IGFueSA9IDE7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZWxOb2RlID0gZWxOb2RlO1xuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubWFpbik7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKHt9LCBwcm9wZXJ0aWVzKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdkZXNnaW5lci12aWV3JylcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5yZW1vdmUoXCJkZXNnaW5lci1jYW52YXNcIik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnZGVzZ2luZXItdmlldycpXG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QuYWRkKFwiZGVzZ2luZXItY2FudmFzXCIpO1xuICAgIHRoaXMuZWxUb29sYmFyLmNsYXNzTGlzdC5hZGQoXCJkZXNnaW5lci10b29sYmFyXCIpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxDYW52YXMpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxUb29sYmFyKTtcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XG4gICAgbmV3IERlc2dpbmVyVmlld19FdmVudCh0aGlzKTtcbiAgICB0aGlzLnRvb2xiYXIgPSBuZXcgRGVzZ2luZXJWaWV3X1Rvb2xiYXIodGhpcyk7XG4gICAgdGhpcy5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5SZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm9uKEV2ZW50RW51bS5zaG93UHJvcGVydHksIChkYXRhOiBhbnkpID0+IHsgbWFpbi5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCBkYXRhKTsgfSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy5PcGVuKGl0ZW0uZGF0YSk7XG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVWaWV3KHg6IGFueSwgeTogYW55LCB6b29tOiBhbnkpIHtcbiAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt4fXB4LCAke3l9cHgpIHNjYWxlKCR7em9vbX0pYDtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy51cGRhdGVWaWV3KHRoaXMuZ2V0WCgpLCB0aGlzLmdldFkoKSwgdGhpcy5nZXRab29tKCkpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXJVSShkZXRhaWw6IGFueSA9IHt9KSB7XG4gICAgaWYgKGRldGFpbC5zZW5kZXIgJiYgZGV0YWlsLnNlbmRlciBpbnN0YW5jZW9mIE5vZGVJdGVtKSByZXR1cm47XG4gICAgaWYgKGRldGFpbC5zZW5kZXIgJiYgZGV0YWlsLnNlbmRlciBpbnN0YW5jZW9mIERlc2dpbmVyVmlldykge1xuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLkNsZWFyTm9kZSgpO1xuICAgIHRoaXMuR2V0RGF0YU5vZGUoKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHRoaXMuQWRkTm9kZUl0ZW0oaXRlbSk7XG4gICAgfSk7XG4gICAgdGhpcy5HZXRBbGxOb2RlKCkuZm9yRWFjaCgoaXRlbTogTm9kZUl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uUmVuZGVyTGluZSgpO1xuICAgIH0pXG4gICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgIHRoaXMudG9vbGJhci5yZW5kZXJQYXRoR3JvdXAoKTtcbiAgfVxuICBwdWJsaWMgT3BlbigkZGF0YTogRGF0YUZsb3cpIHtcbiAgICBpZiAoJGRhdGEgPT0gdGhpcy5kYXRhKSB7XG4gICAgICB0aGlzLnRvb2xiYXIucmVuZGVyUGF0aEdyb3VwKCk7XG4gICAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZGF0YT8uZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIChkZXRhaWw6IGFueSkgPT4gdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwgZGV0YWlsKSk7XG4gICAgdGhpcy5kYXRhID0gJGRhdGE7XG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoZGV0YWlsOiBhbnkpID0+IHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIGRldGFpbCkpO1xuICAgIHRoaXMuJGxvY2sgPSBmYWxzZTtcbiAgICB0aGlzLmxhc3RHcm91cE5hbWUgPSAnJztcbiAgICB0aGlzLmdyb3VwRGF0YSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmdyb3VwID0gW107XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBDYWxjWChudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRXaWR0aCAvICh0aGlzLmVsTm9kZT8uY2xpZW50V2lkdGggKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHB1YmxpYyBDYWxjWShudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRIZWlnaHQgLyAodGhpcy5lbE5vZGU/LmNsaWVudEhlaWdodCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHVibGljIEdldEFsbE5vZGUoKTogTm9kZUl0ZW1bXSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZXMgfHwgW107XG4gIH1cbiAgcHVibGljIEdldE5vZGVCeUlkKGlkOiBzdHJpbmcpOiBOb2RlSXRlbSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuR2V0QWxsTm9kZSgpLmZpbHRlcihub2RlID0+IG5vZGUuR2V0SWQoKSA9PSBpZCk/LlswXTtcbiAgfVxuXG4gIHB1YmxpYyBHZXREYXRhQnlJZChpZDogc3RyaW5nKTogRGF0YUZsb3cgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQWxsTm9kZSgpLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5HZXQoJ2lkJykgPT09IGlkKT8uWzBdO1xuICB9XG4gIGNoZWNrT25seU5vZGUoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gKHRoaXMubWFpbi5nZXRDb250cm9sQnlLZXkoa2V5KS5vbmx5Tm9kZUl0ZW0pICYmIHRoaXMubm9kZXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5DaGVja0tleShrZXkpKS5sZW5ndGggPiAwO1xuICB9XG4gIHB1YmxpYyB6b29tX3JlZnJlc2goZmxnOiBhbnkgPSAwKSB7XG4gICAgbGV0IHRlbXBfem9vbSA9IGZsZyA9PSAwID8gWm9vbS5kZWZhdWx0IDogKHRoaXMuZ2V0Wm9vbSgpICsgWm9vbS52YWx1ZSAqIGZsZyk7XG4gICAgaWYgKFpvb20ubWF4ID49IHRlbXBfem9vbSAmJiB0ZW1wX3pvb20gPj0gWm9vbS5taW4pIHtcbiAgICAgIHRoaXMuc2V0WCgodGhpcy5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0ZW1wX3pvb20pO1xuICAgICAgdGhpcy5zZXRZKCh0aGlzLmdldFkoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XG4gICAgICB0aGlzLnpvb21fbGFzdF92YWx1ZSA9IHRlbXBfem9vbTtcbiAgICAgIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb21fbGFzdF92YWx1ZSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX2luKCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKDEpO1xuICB9XG4gIHB1YmxpYyB6b29tX291dCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgtMSk7XG4gIH1cbiAgcHVibGljIHpvb21fcmVzZXQoKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEV2ZW50RW51bSwgSU1haW4sIFZhcmlhYmxlTm9kZSwgU2NvcGVSb290IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIFZhcmlhYmxlVmlldyB7XG4gIHByaXZhdGUgdmFyaWFibGVzOiBWYXJpYWJsZU5vZGVbXSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy12YXJpYWJsZScpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsICh7IGdyb3VwIH06IGFueSkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoZ3JvdXApO1xuICAgIH0pO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsICh7IGdyb3VwIH06IGFueSkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoZ3JvdXApO1xuICAgIH0pO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uZ3JvdXBDaGFuZ2UsICh7IGdyb3VwIH06IGFueSkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoZ3JvdXApO1xuICAgIH0pXG4gICAgdGhpcy5SZW5kZXIoKTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyKGdyb3VwOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy52YXJpYWJsZXMgPSB0aGlzLm1haW4uZ2V0VmFyaWFibGUoKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgICA8dGFibGUgYm9yZGVyPVwiMVwiPlxuICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgPHRyPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtbmFtZVwiPk5hbWU8L3RkPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtdHlwZVwiPlR5cGU8L3RkPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtc2NvcGVcIj5TY29wZTwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1kZWZhdWx0XCI+RGVmYXVsdDwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1idXR0b25cIj48L3RkPlxuICAgICAgICAgIDwvdHI+XG4gICAgICAgIDwvdGhlYWQ+XG4gICAgICAgIDx0Ym9keT5cbiAgICAgICAgPC90Ym9keT5cbiAgICAgIDwvdGFibGU+XG4gICAgYDtcbiAgICBjb25zb2xlLmxvZyh0aGlzLnZhcmlhYmxlcyk7XG4gICAgaWYgKHRoaXMudmFyaWFibGVzKSB7XG4gICAgICBpZiAoIWdyb3VwKSBncm91cCA9IFtTY29wZVJvb3RdO1xuICAgICAgaWYgKCFncm91cC5pbmNsdWRlcyhTY29wZVJvb3QpKSBncm91cCA9IFsuLi5ncm91cCwgU2NvcGVSb290XVxuICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnZhcmlhYmxlcy5maWx0ZXIoKGl0ZW0pID0+IGdyb3VwLmluY2x1ZGVzKGl0ZW0uc2NvcGUpKSkge1xuICAgICAgICBuZXcgVmFyaWFibGVJdGVtKGl0ZW0sIHRoaXMpLlJlbmRlclNjb3BlKGdyb3VwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIGNoYW5nZURhdGEoKSB7XG4gICAgdGhpcy5tYWluLnVwZGF0ZVZhcmlhYmxlKHRoaXMudmFyaWFibGVzID8/IFtdKTtcbiAgfVxufVxuY2xhc3MgVmFyaWFibGVJdGVtIHtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcbiAgcHJpdmF0ZSBuYW1lSW5wdXQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgcHJpdmF0ZSB0eXBlSW5wdXQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gIHByaXZhdGUgc2NvcGVJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgcHJpdmF0ZSB2YWx1ZURlZmF1bHRJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSB2YXJpYWJsZTogVmFyaWFibGVOb2RlLCBwcml2YXRlIHBhcmVudDogVmFyaWFibGVWaWV3KSB7XG4gICAgKHRoaXMubmFtZUlucHV0IGFzIGFueSkudmFsdWUgPSB0aGlzLnZhcmlhYmxlLm5hbWU7XG4gICAgKHRoaXMudmFsdWVEZWZhdWx0SW5wdXQgYXMgYW55KS52YWx1ZSA9IHRoaXMudmFyaWFibGUuaW5pdGFsVmFsdWUgPz8gJyc7XG4gICAgKHRoaXMudHlwZUlucHV0IGFzIGFueSkudmFsdWUgPSB0aGlzLnZhcmlhYmxlLnR5cGUgPz8gJyc7XG4gICAgZm9yIChsZXQgaXRlbSBvZiBbJ3RleHQnLCAnbnVtYmVyJywgJ2RhdGUnLCAnb2JqZWN0J10pIHtcbiAgICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgIG9wdGlvbi50ZXh0ID0gaXRlbTtcbiAgICAgIG9wdGlvbi52YWx1ZSA9IGl0ZW07XG4gICAgICB0aGlzLnR5cGVJbnB1dC5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgIH1cbiAgICBsZXQgbmFtZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgbmFtZUNvbHVtbi5hcHBlbmRDaGlsZCh0aGlzLm5hbWVJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQobmFtZUNvbHVtbik7XG4gICAgdGhpcy5uYW1lSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmFyaWFibGUubmFtZSA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgdGhpcy5jaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLm5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLm5hbWUgPSBlLnRhcmdldC52YWx1ZTtcbiAgICAgIHRoaXMuY2hhbmdlKCk7XG4gICAgfSk7XG5cbiAgICBsZXQgdHlwZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgdHlwZUNvbHVtbi5hcHBlbmRDaGlsZCh0aGlzLnR5cGVJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodHlwZUNvbHVtbik7XG4gICAgdGhpcy50eXBlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IGFueSkgPT4ge1xuICAgICAgdGhpcy52YXJpYWJsZS50eXBlID0gZS50YXJnZXQudmFsdWU7XG4gICAgICB0aGlzLmNoYW5nZSgpO1xuICAgIH0pO1xuICAgIGxldCBzY29wZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgc2NvcGVDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy5zY29wZUlucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChzY29wZUNvbHVtbik7XG5cblxuICAgIGxldCB2YWx1ZURlZmF1bHRDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIHZhbHVlRGVmYXVsdENvbHVtbi5hcHBlbmRDaGlsZCh0aGlzLnZhbHVlRGVmYXVsdElucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh2YWx1ZURlZmF1bHRDb2x1bW4pO1xuICAgIHRoaXMudmFsdWVEZWZhdWx0SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IGFueSkgPT4ge1xuICAgICAgdGhpcy52YXJpYWJsZS5pbml0YWxWYWx1ZSA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgdGhpcy5jaGFuZ2UoKTtcbiAgICB9KTtcbiAgICB0aGlzLnZhbHVlRGVmYXVsdElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLmluaXRhbFZhbHVlID0gZS50YXJnZXQudmFsdWU7XG4gICAgICB0aGlzLmNoYW5nZSgpO1xuICAgIH0pO1xuXG4gICAgbGV0IGJ1dHRvblJlbW92ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ1dHRvblJlbW92ZS5pbm5lckhUTUwgPSBgLWA7XG4gICAgYnV0dG9uUmVtb3ZlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgcGFyZW50Lm1haW4ucmVtb3ZlVmFyaWFibGUodmFyaWFibGUpO1xuICAgIH0pO1xuICAgIGxldCBidXR0b25SZW1vdmVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIGJ1dHRvblJlbW92ZUNvbHVtbi5hcHBlbmRDaGlsZChidXR0b25SZW1vdmUpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGJ1dHRvblJlbW92ZUNvbHVtbik7XG5cbiAgICBwYXJlbnQuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJ3RhYmxlIHRib2R5Jyk/LmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcblxuICB9XG4gIGNoYW5nZSgpIHtcbiAgICB0aGlzLnBhcmVudC5jaGFuZ2VEYXRhKCk7XG4gIH1cbiAgUmVuZGVyU2NvcGUoZ3JvdXA6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLnNjb3BlSW5wdXQuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIGdyb3VwKSB7XG4gICAgICAgIGlmIChpdGVtID09PSBTY29wZVJvb3QpIGNvbnRpbnVlO1xuICAgICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICAgIG9wdGlvbi50ZXh0ID0gaXRlbS50ZXh0O1xuICAgICAgICBvcHRpb24udmFsdWUgPSBpdGVtLmlkO1xuICAgICAgICB0aGlzLnNjb3BlSW5wdXQucHJlcGVuZChvcHRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgb3B0aW9uLnRleHQgPSBTY29wZVJvb3Q7XG4gICAgb3B0aW9uLnZhbHVlID0gU2NvcGVSb290O1xuICAgIHRoaXMuc2NvcGVJbnB1dC5wcmVwZW5kKG9wdGlvbik7XG4gICAgKHRoaXMuc2NvcGVJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5zY29wZTtcbiAgICB0aGlzLnNjb3BlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IGFueSkgPT4ge1xuICAgICAgdGhpcy52YXJpYWJsZS5zY29wZSA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgdGhpcy5jaGFuZ2UoKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuXG5leHBvcnQgY2xhc3MgVG9vbGJveFZpZXcge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXRvb2xib3hmJyk7XG4gICAgdGhpcy5SZW5kZXIoKTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyKCkge1xuICAgIGxldCBjb250cm9scyA9IHRoaXMubWFpbi5nZXRDb250cm9sQWxsKCk7XG4gICAgT2JqZWN0LmtleXMoY29udHJvbHMpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcbiAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcbiAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgaXRlbSk7XG4gICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtjb250cm9sc1tpdGVtXS5pY29ufSA8c3Bhbj4ke2NvbnRyb2xzW2l0ZW1dLm5hbWV9PC9zcGFuYDtcbiAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuZHJhZ1N0YXJ0LmJpbmQodGhpcykpXG4gICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW5kJywgdGhpcy5kcmFnZW5kLmJpbmQodGhpcykpXG4gICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgfSk7XG4gIH1cbiAgcHJpdmF0ZSBkcmFnZW5kKGU6IGFueSkge1xuICAgIHRoaXMubWFpbi5zZXRDb250cm9sQ2hvb3NlKG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBkcmFnU3RhcnQoZTogYW55KSB7XG4gICAgbGV0IGtleSA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIubm9kZS1pdGVtXCIpLmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJyk7XG4gICAgdGhpcy5tYWluLnNldENvbnRyb2xDaG9vc2Uoa2V5KTtcbiAgICBpZiAoZS50eXBlICE9PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwga2V5KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IEV2ZW50RW51bSwgSU1haW4sIERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIFByb2plY3RWaWV3IHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1wcm9qZWN0Jyk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5jaGFuZ2VWYXJpYWJsZSwgdGhpcy5SZW5kZXIuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgdGhpcy5SZW5kZXIuYmluZCh0aGlzKSk7XG4gIH1cbiAgcHVibGljIFJlbmRlcigpIHtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcbiAgICBsZXQgcHJvamVjdHMgPSB0aGlzLm1haW4uZ2V0UHJvamVjdEFsbCgpO1xuICAgIHByb2plY3RzLmZvckVhY2goKGl0ZW06IERhdGFGbG93KSA9PiB7XG4gICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ25vZGUtaXRlbScpO1xuICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QtaWQnLCBpdGVtLkdldCgnaWQnKSk7XG4gICAgICBpdGVtLnJlbW92ZUxpc3RlbmVyKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV9uYW1lYCwgKCkgPT4ge1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICB9KTtcbiAgICAgIGl0ZW0ub24oYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMubWFpbi5jaGVja1Byb2plY3RPcGVuKGl0ZW0pKSB7XG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubWFpbi5zZXRQcm9qZWN0T3BlbihpdGVtKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbE5vZGU/LmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERvY2tCYXNlIHtcclxuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHByb3RlY3RlZCBlbENvbnRlbnQ6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnRG9ja0Jhc2UnO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIEJveEluZm8odGl0bGU6IHN0cmluZywgJGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ3ZzLWJveGluZm8nKTtcclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLWJveGluZm8nKTtcclxuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwidnMtYm94aW5mb19oZWFkZXJcIj48c3BhbiBjbGFzcz1cInZzLWJveGluZm9fdGl0bGVcIj4ke3RpdGxlfTwvc3Bhbj48c3BhbiBjbGFzcz1cInZzLWJveGluZm9fYnV0dG9uXCI+PC9zcGFuPjwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cInZzLWJveGluZm9fY29udGVudFwiPjwvZGl2PmA7XHJcbiAgICB0aGlzLmVsQ29udGVudCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2NvbnRlbnQnKTtcclxuICAgIGlmICgkY2FsbGJhY2spIHtcclxuICAgICAgJGNhbGxiYWNrKHRoaXMuZWxDb250ZW50KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgVG9vbGJveFZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1jb250cm9sJyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdDb250cm9sJywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBuZXcgVG9vbGJveFZpZXcobm9kZSwgdGhpcy5tYWluKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4sIGdldFRpbWUgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgVmFyaWFibGVWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXJpYWJsZURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXZhcmlhYmxlJyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdWYXJpYWJsZScsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbmV3IFZhcmlhYmxlVmlldyhub2RlLCBtYWluKTtcbiAgICB9KTtcbiAgICBsZXQgJG5vZGVSaWdodDogSFRNTEVsZW1lbnQgfCBudWxsID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnZzLWJveGluZm9faGVhZGVyIC52cy1ib3hpbmZvX2J1dHRvbicpO1xuICAgIGlmICgkbm9kZVJpZ2h0KSB7XG4gICAgICAkbm9kZVJpZ2h0LmlubmVySFRNTCA9IGBgO1xuICAgICAgbGV0IGJ1dHRvbk5ldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uTmV3KTtcbiAgICAgIGJ1dHRvbk5ldy5pbm5lckhUTUwgPSBgTmV3IFZhcmlhYmxlYDtcbiAgICAgIGJ1dHRvbk5ldy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgdGhpcy5tYWluLm5ld1ZhcmlhYmxlKCkubmFtZSA9IGB2YXIke2dldFRpbWUoKX1gO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBkb3dubG9hZE9iamVjdEFzSnNvbiwgZ2V0VGltZSwgcmVhZEZpbGVMb2NhbCB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5pbXBvcnQgeyBQcm9qZWN0VmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9Qcm9qZWN0Vmlld1wiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgUHJvamVjdERvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb2plY3QnKTtcbiAgICB0aGlzLkJveEluZm8oJ1Byb2plY3QnLCAoZWxDb250ZW50OiBhbnkpID0+IHtcbiAgICAgIG5ldyBQcm9qZWN0VmlldyhlbENvbnRlbnQsIG1haW4pO1xuICAgIH0pO1xuICAgIGxldCAkbm9kZVJpZ2h0OiBIVE1MRWxlbWVudCB8IG51bGwgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19oZWFkZXIgLnZzLWJveGluZm9fYnV0dG9uJyk7XG4gICAgaWYgKCRub2RlUmlnaHQpIHtcbiAgICAgICRub2RlUmlnaHQuaW5uZXJIVE1MID0gYGA7XG4gICAgICBsZXQgYnV0dG9uTmV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidXR0b25OZXcuaW5uZXJIVE1MID0gYE5ld2A7XG4gICAgICBidXR0b25OZXcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLm1haW4ubmV3UHJvamVjdCgnJykpO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uTmV3KTtcblxuICAgICAgbGV0IGJ1dHRvbkV4cG9ydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uRXhwb3J0LmlubmVySFRNTCA9IGBFeHBvcnRgO1xuICAgICAgYnV0dG9uRXhwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gZG93bmxvYWRPYmplY3RBc0pzb24odGhpcy5tYWluLmV4cG9ydEpzb24oKSwgYHZzLXNvbHV0aW9uLSR7Z2V0VGltZSgpfWApKTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbkV4cG9ydCk7XG5cbiAgICAgIGxldCBidXR0b25JbXBvcnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ1dHRvbkltcG9ydC5pbm5lckhUTUwgPSBgSW1wb3J0YDtcbiAgICAgIGJ1dHRvbkltcG9ydC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgcmVhZEZpbGVMb2NhbCgocnM6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChycykge1xuICAgICAgICAgICAgdGhpcy5tYWluLmltcG9ydEpzb24oSlNPTi5wYXJzZShycykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbkltcG9ydCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhVmlldywgRGF0YUZsb3csIEV2ZW50RW51bSwgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xyXG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUHJvcGVydHlEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xyXG4gIHByaXZhdGUgbGFzdERhdGE6IERhdGFGbG93IHwgdW5kZWZpbmVkO1xyXG4gIHByaXZhdGUgaGlkZUtleXM6IHN0cmluZ1tdID0gWydsaW5lcycsICdub2RlcycsICdncm91cHMnLCAndmFyaWFibGUnLCAneCcsICd5JywgJ3pvb20nXTtcclxuICBwcml2YXRlIHNvcnRLZXlzOiBzdHJpbmdbXSA9IFsnaWQnLCAna2V5JywgJ25hbWUnLCAnZ3JvdXAnXTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xyXG5cclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb3BlcnR5Jyk7XHJcbiAgICB0aGlzLkJveEluZm8oJ1Byb3BlcnR5JywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XHJcbiAgICAgIG1haW4ub24oRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgKGRldGFpbDogYW55KSA9PiB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJVSShub2RlLCBkZXRhaWwuZGF0YSk7XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyVUkobm9kZTogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGFGbG93KSB7XHJcbiAgICBpZiAodGhpcy5sYXN0RGF0YSA9PSBkYXRhKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMubGFzdERhdGEgPSBkYXRhO1xyXG4gICAgbm9kZS5pbm5lckhUTUwgPSAnJztcclxuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSBkYXRhLmdldFByb3BlcnRpZXMoKTtcclxuICAgIHRoaXMuc29ydEtleXMuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKHRoaXMuaGlkZUtleXMuaW5jbHVkZXMoa2V5KSB8fCAhcHJvcGVydGllc1trZXldKSByZXR1cm47XHJcbiAgICAgIGxldCBwcm9wZXJ0eUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWl0ZW0nKTtcclxuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlMYWJlbC5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS1sYWJlbCcpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmlubmVySFRNTCA9IGtleTtcclxuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlWYWx1ZS5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS12YWx1ZScpO1xyXG4gICAgICBEYXRhVmlldy5CaW5kRWxlbWVudChwcm9wZXJ0eVZhbHVlLCBkYXRhLCB0aGlzLm1haW4sIGtleSk7XHJcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eUxhYmVsKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5VmFsdWUpO1xyXG4gICAgICBub2RlLmFwcGVuZENoaWxkKHByb3BlcnR5SXRlbSk7XHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmhpZGVLZXlzLmluY2x1ZGVzKGtleSkgfHwgdGhpcy5zb3J0S2V5cy5pbmNsdWRlcyhrZXkpKSByZXR1cm47XHJcbiAgICAgIGxldCBwcm9wZXJ0eUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWl0ZW0nKTtcclxuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlMYWJlbC5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS1sYWJlbCcpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmlubmVySFRNTCA9IGtleTtcclxuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlWYWx1ZS5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS12YWx1ZScpO1xyXG4gICAgICBEYXRhVmlldy5CaW5kRWxlbWVudChwcm9wZXJ0eVZhbHVlLCBkYXRhLCB0aGlzLm1haW4sIGtleSk7XHJcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eUxhYmVsKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5VmFsdWUpO1xyXG4gICAgICBub2RlLmFwcGVuZENoaWxkKHByb3BlcnR5SXRlbSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFZpZXdEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwcml2YXRlIHZpZXc6IERlc2dpbmVyVmlldyB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG5cbiAgICB0aGlzLnZpZXcgPSBuZXcgRGVzZ2luZXJWaWV3KHRoaXMuZWxOb2RlLCBtYWluKTtcblxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiwgRG9ja0VudW0gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xyXG5pbXBvcnQgeyBDb250cm9sRG9jayB9IGZyb20gXCIuL0NvbnRyb2xEb2NrXCI7XHJcbmltcG9ydCB7IFZhcmlhYmxlRG9jayB9IGZyb20gXCIuL1ZhcmlhYmxlRG9ja1wiO1xyXG5pbXBvcnQgeyBQcm9qZWN0RG9jayB9IGZyb20gXCIuL1Byb2plY3REb2NrXCI7XHJcbmltcG9ydCB7IFByb3BlcnR5RG9jayB9IGZyb20gXCIuL1Byb3BlcnR5RG9ja1wiO1xyXG5pbXBvcnQgeyBWaWV3RG9jayB9IGZyb20gXCIuL1ZpZXdEb2NrXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRG9ja01hbmFnZXIge1xyXG4gIHByaXZhdGUgJGRvY2tNYW5hZ2VyOiBhbnkgPSB7fTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHsgfVxyXG4gIHB1YmxpYyByZXNldCgpIHtcclxuICAgIHRoaXMuJGRvY2tNYW5hZ2VyID0ge307XHJcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgQ29udHJvbERvY2spO1xyXG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLmxlZnQsIFByb2plY3REb2NrKTtcclxuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5yaWdodCwgUHJvcGVydHlEb2NrKTtcclxuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS52aWV3LCBWaWV3RG9jayk7XHJcbiAgICAvLyAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnRvcCwgVGFiRG9jayk7XHJcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0uYm90dG9tLCBWYXJpYWJsZURvY2spO1xyXG4gICAgdGhpcy5SZW5kZXJVSSgpO1xyXG4gIH1cclxuICBwdWJsaWMgYWRkRG9jaygka2V5OiBzdHJpbmcsICR2aWV3OiBhbnkpIHtcclxuICAgIGlmICghdGhpcy4kZG9ja01hbmFnZXJbJGtleV0pXHJcbiAgICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gW107XHJcbiAgICB0aGlzLiRkb2NrTWFuYWdlclska2V5XSA9IFsuLi50aGlzLiRkb2NrTWFuYWdlclska2V5XSwgJHZpZXddO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIFJlbmRlclVJKCkge1xyXG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gYFxyXG4gICAgICA8ZGl2IGNsYXNzPVwidnMtbGVmdCB2cy1kb2NrXCI+PC9kaXY+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1jb250ZW50XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXRvcCB2cy1kb2NrXCI+PC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXZpZXcgdnMtZG9ja1wiPjwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy1ib3R0b20gdnMtZG9ja1wiPjwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cInZzLXJpZ2h0IHZzLWRvY2tcIj48L2Rpdj5cclxuICAgIGA7XHJcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRkb2NrTWFuYWdlcikuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgbGV0IHF1ZXJ5U2VsZWN0b3IgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAuJHtrZXl9YCk7XHJcbiAgICAgIGlmIChxdWVyeVNlbGVjdG9yKSB7XHJcbiAgICAgICAgdGhpcy4kZG9ja01hbmFnZXJba2V5XS5mb3JFYWNoKCgkaXRlbTogYW55KSA9PiB7XHJcbiAgICAgICAgICBuZXcgJGl0ZW0ocXVlcnlTZWxlY3RvciwgdGhpcy5tYWluKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiZXhwb3J0IGNvbnN0IENvbnRyb2wgPSB7XG4gIG5vZGVfYmVnaW46IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtcGxheVwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ0JlZ2luJyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgY2xhc3M6ICcnLFxuICAgIGh0bWw6ICcnLFxuICAgIGRvdDoge1xuICAgICAgdG9wOiAwLFxuICAgICAgcmlnaHQ6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgYm90dG9tOiAxLFxuICAgIH0sXG4gICAgb25seU5vZGU6IHRydWVcbiAgfSxcbiAgbm9kZV9lbmQ6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtc3RvcFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ0VuZCcsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6ICcnLFxuICAgIGRvdDoge1xuICAgICAgbGVmdDogMCxcbiAgICAgIHRvcDogMSxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgYm90dG9tOiAwLFxuICAgIH0sXG4gICAgb25seU5vZGU6IHRydWVcbiAgfSxcbiAgbm9kZV9pZjoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1lcXVhbHNcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdJZicsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6ICc8ZGl2PmNvbmRpdGlvbjo8YnIvPjxpbnB1dCBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNvbmRpdGlvblwiLz48L2Rpdj4nLFxuICAgIHNjcmlwdDogYGAsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH1cbiAgICB9LFxuICAgIG91dHB1dDogMlxuICB9LFxuICBub2RlX2dyb3VwOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ0dyb3VwJyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwIG5vZGUtZm9ybS1jb250cm9sXCI+R288L2J1dHRvbj48L2Rpdj4nLFxuICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4geyBub2RlLm9wZW5Hcm91cCgpIH0pO1xuICAgIH0sXG4gICAgcHJvcGVydGllczoge30sXG4gICAgb3V0cHV0OiAyXG4gIH0sXG4gIG5vZGVfb3B0aW9uOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ09wdGlvbicsXG4gICAgZG90OiB7XG4gICAgICB0b3A6IDEsXG4gICAgICByaWdodDogMCxcbiAgICAgIGxlZnQ6IDEsXG4gICAgICBib3R0b206IDAsXG4gICAgfSxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogYFxuICAgIDxkaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDFcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAyXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwM1wiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDRcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDA1XCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICBgLFxuICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4geyBub2RlLm9wZW5Hcm91cCgpIH0pO1xuICAgIH0sXG4gICAgcHJvcGVydGllczoge30sXG4gICAgb3V0cHV0OiAyXG4gIH0sXG4gIG5vZGVfcHJvamVjdDoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdQcm9qZWN0JyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxzZWxlY3QgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJwcm9qZWN0XCI+PC9zZWxlY3Q+PC9kaXY+JyxcbiAgICBzY3JpcHQ6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcblxuICAgIH0sXG4gICAgcHJvcGVydGllczoge1xuICAgICAgcHJvamVjdDoge1xuICAgICAgICBrZXk6IFwicHJvamVjdFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIGRhdGFTZWxlY3Q6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgICAgICByZXR1cm4gbWFpbi5nZXRQcm9qZWN0QWxsKCkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBpdGVtLkdldCgnaWQnKSxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS5HZXQoJ25hbWUnKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICBzY3JpcHQ6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcblxuICAgICAgICB9LFxuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfVxuICAgIH0sXG4gIH0sXG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgSU1haW4sIGNvbXBhcmVTb3J0LCBFdmVudEVudW0sIFByb3BlcnR5RW51bSwgRXZlbnRGbG93LCBnZXRUaW1lLCBWYXJpYWJsZU5vZGUgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IENvbnRyb2wgfSBmcm9tIFwiLi9jb250cm9sXCI7XG5cbmV4cG9ydCBjbGFzcyBTeXN0ZW1CYXNlIGltcGxlbWVudHMgSU1haW4ge1xuICBwcml2YXRlICRkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgcHJpdmF0ZSAkcHJvamVjdE9wZW46IERhdGFGbG93IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlICRwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSAkY29udHJvbDogYW55ID0ge307XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3cgPSBuZXcgRXZlbnRGbG93KCk7XG4gIHByaXZhdGUgJGNvbnRyb2xDaG9vc2U6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlICRjaGVja09wdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XG4gICAgLy9zZXQgcHJvamVjdFxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLnNvbHV0aW9uXSA9IHtcbiAgICAgIGlkOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgfSxcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBQcm9wZXJ0eUVudW0uc29sdXRpb25cbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGBzb2x1dGlvbi0ke2dldFRpbWUoKX1gLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHByb2plY3RzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5saW5lXSA9IHtcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubGluZVxuICAgICAgfSxcbiAgICAgIGZyb206IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIGZyb21JbmRleDoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgdG86IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHRvSW5kZXg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfVxuICAgIH07XG4gICAgLy9zZXQgcHJvamVjdFxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLm1haW5dID0ge1xuICAgICAgaWQ6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBgRmxvdy0ke2dldFRpbWUoKX1gLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubWFpblxuICAgICAgfSxcbiAgICAgIHZhcmlhYmxlOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgZ3JvdXBzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgbm9kZXM6IHtcbiAgICAgICAgZGVmYXVsdDogW11cbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLmdyb3VwQ2F2YXNdID0ge1xuICAgICAga2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFByb3BlcnR5RW51bS5ncm91cENhdmFzXG4gICAgICB9LFxuICAgICAgZ3JvdXA6IHtcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgICB4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB5OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB6b29tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgfVxuICB9XG4gIG5ld1NvbHV0aW9uKCRuYW1lOiBzdHJpbmcgPSAnJyk6IHZvaWQge1xuICAgIHRoaXMub3BlblNvbHV0aW9uKHsgbmFtZTogJG5hbWUgfSk7XG4gIH1cbiAgb3BlblNvbHV0aW9uKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLiRkYXRhLkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLnNvbHV0aW9uKSk7XG4gICAgdGhpcy5vcGVuUHJvamVjdCh0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKT8uWzBdID8/IHt9KTtcbiAgfVxuICByZW1vdmVWYXJpYWJsZSh2YXJpYmFsZTogVmFyaWFibGVOb2RlKTogdm9pZCB7XG4gICAgdGhpcy4kcHJvamVjdE9wZW4/LlJlbW92ZSgndmFyaWFibGUnLCB2YXJpYmFsZSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHsgZGF0YTogdmFyaWJhbGUgfSk7XG4gIH1cbiAgYWRkVmFyaWFibGUoKTogVmFyaWFibGVOb2RlIHtcbiAgICBsZXQgdmFyaWJhbGUgPSBuZXcgVmFyaWFibGVOb2RlKCk7XG4gICAgdGhpcy4kcHJvamVjdE9wZW4/LkFwcGVuZCgndmFyaWFibGUnLCB2YXJpYmFsZSk7XG4gICAgcmV0dXJuIHZhcmliYWxlO1xuICB9XG4gIG5ld1ZhcmlhYmxlKCk6IFZhcmlhYmxlTm9kZSB7XG4gICAgbGV0IHZhcmliYWxlID0gdGhpcy5hZGRWYXJpYWJsZSgpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCB7IGRhdGE6IHZhcmliYWxlIH0pO1xuICAgIHJldHVybiB2YXJpYmFsZTtcbiAgfVxuICBnZXRWYXJpYWJsZSgpOiBWYXJpYWJsZU5vZGVbXSB7XG4gICAgbGV0IGFycjogYW55ID0gW107XG4gICAgaWYgKHRoaXMuJHByb2plY3RPcGVuKSB7XG4gICAgICBhcnIgPSB0aGlzLiRwcm9qZWN0T3Blbi5HZXQoXCJ2YXJpYWJsZVwiKTtcbiAgICAgIGlmICghYXJyKSB7XG4gICAgICAgIGFyciA9IFtdO1xuICAgICAgICB0aGlzLiRwcm9qZWN0T3Blbi5TZXQoJ3ZhcmlhYmxlJywgYXJyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFycjtcbiAgfVxuICB1cGRhdGVWYXJpYWJsZSh2YXJzOiBWYXJpYWJsZU5vZGVbXSk6IHZvaWQge1xuICAgIHRoaXMuJHByb2plY3RPcGVuPy5TZXQoJ3ZhcmlhYmxlJywgdmFycyk7XG4gIH1cbiAgZXhwb3J0SnNvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS50b0pzb24oKTtcbiAgfVxuICBwdWJsaWMgY2hlY2tJbml0T3B0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLiRjaGVja09wdGlvbjtcbiAgfVxuICBpbml0T3B0aW9uKG9wdGlvbjogYW55LCBpc0RlZmF1bHQ6IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgdGhpcy4kY2hlY2tPcHRpb24gPSB0cnVlO1xuICAgIC8vIHNldCBjb250cm9sXG4gICAgdGhpcy4kY29udHJvbCA9IGlzRGVmYXVsdCA/IHsgLi4ub3B0aW9uPy5jb250cm9sIHx8IHt9LCAuLi5Db250cm9sIH0gOiB7IC4uLm9wdGlvbj8uY29udHJvbCB8fCB7fSB9O1xuICAgIGxldCBjb250cm9sVGVtcDogYW55ID0ge307XG4gICAgT2JqZWN0LmtleXModGhpcy4kY29udHJvbCkubWFwKChrZXkpID0+ICh7IC4uLnRoaXMuJGNvbnRyb2xba2V5XSwga2V5LCBzb3J0OiAodGhpcy4kY29udHJvbFtrZXldLnNvcnQgPT09IHVuZGVmaW5lZCA/IDk5OTk5IDogdGhpcy4kY29udHJvbFtrZXldLnNvcnQpIH0pKS5zb3J0KGNvbXBhcmVTb3J0KS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGNvbnRyb2xUZW1wW2l0ZW0ua2V5XSA9IHtcbiAgICAgICAgZG90OiB7XG4gICAgICAgICAgbGVmdDogMSxcbiAgICAgICAgICB0b3A6IDEsXG4gICAgICAgICAgcmlnaHQ6IDEsXG4gICAgICAgICAgYm90dG9tOiAxLFxuICAgICAgICB9LFxuICAgICAgICAuLi5pdGVtXG4gICAgICB9O1xuICAgICAgdGhpcy4kcHJvcGVydGllc1tgJHtpdGVtLmtleX1gXSA9IHtcbiAgICAgICAgLi4uKGl0ZW0ucHJvcGVydGllcyB8fCB7fSksXG4gICAgICAgIGlkOiB7XG4gICAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICAgIH0sXG4gICAgICAgIGtleToge1xuICAgICAgICAgIGRlZmF1bHQ6IGl0ZW0ua2V5XG4gICAgICAgIH0sXG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICBkZWZhdWx0OiBpdGVtLmtleSxcbiAgICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB4OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgICBncm91cDoge1xuICAgICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICAgIH0sXG4gICAgICAgIGxpbmVzOiB7XG4gICAgICAgICAgZGVmYXVsdDogW11cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHRoaXMuJGNvbnRyb2wgPSBjb250cm9sVGVtcDtcbiAgfVxuICByZW5kZXJIdG1sKG5vZGU6IE5vZGVJdGVtLCBlbFBhcmVudDogRWxlbWVudCkge1xuICAgIGVsUGFyZW50LmlubmVySFRNTCA9IG5vZGUuZ2V0T3B0aW9uKCk/Lmh0bWw7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldENvbnRyb2xBbGwoKSB7XG4gICAgcmV0dXJuIHRoaXMuJGNvbnRyb2wgPz8ge307XG4gIH1cbiAgZ2V0UHJvamVjdEFsbCgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEuR2V0KCdwcm9qZWN0cycpID8/IFtdO1xuICB9XG4gIGltcG9ydEpzb24oZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5vcGVuU29sdXRpb24oZGF0YSk7XG4gIH1cbiAgc2V0UHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIGlmICh0aGlzLiRwcm9qZWN0T3BlbiAhPSAkZGF0YSkge1xuICAgICAgdGhpcy4kcHJvamVjdE9wZW4gPSAkZGF0YTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgICBkYXRhOiAkZGF0YVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHtcbiAgICAgICAgZGF0YTogJGRhdGFcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsIHtcbiAgICAgICAgZGF0YTogJGRhdGFcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBjaGVja1Byb2plY3RPcGVuKCRkYXRhOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvamVjdE9wZW4gPT0gJGRhdGE7XG4gIH1cbiAgbmV3UHJvamVjdCgpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Qcm9qZWN0KHt9KTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5uZXdQcm9qZWN0LCB7fSk7XG4gIH1cbiAgb3BlblByb2plY3QoJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIGxldCAkcHJvamVjdDogYW55ID0gbnVsbDtcbiAgICBpZiAoJGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgJHByb2plY3QgPSB0aGlzLmdldFByb2plY3RCeUlkKCRkYXRhLkdldCgnaWQnKSk7XG4gICAgICBpZiAoISRwcm9qZWN0KSB7XG4gICAgICAgICRwcm9qZWN0ID0gJGRhdGE7XG4gICAgICAgIHRoaXMuJGRhdGEuQXBwZW5kKCdwcm9qZWN0cycsICRwcm9qZWN0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgJHByb2plY3QgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gICAgICAkcHJvamVjdC5Jbml0RGF0YSgkZGF0YSwgdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5tYWluKSk7XG4gICAgICB0aGlzLiRkYXRhLkFwcGVuZCgncHJvamVjdHMnLCAkcHJvamVjdCk7XG4gICAgfVxuICAgIHRoaXMuc2V0UHJvamVjdE9wZW4oJHByb2plY3QpO1xuICB9XG4gIHB1YmxpYyBnZXRQcm9qZWN0QnlJZCgkaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKS5maWx0ZXIoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLkdldCgnaWQnKSA9PT0gJGlkKT8uWzBdO1xuICB9XG4gIHNldENvbnRyb2xDaG9vc2Uoa2V5OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy4kY29udHJvbENob29zZSA9IGtleTtcbiAgfVxuICBnZXRDb250cm9sQ2hvb3NlKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sQ2hvb3NlO1xuICB9XG4gIGdldENvbnRyb2xCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sW2tleV0gfHwge307XG4gIH1cbiAgZ2V0Q29udHJvbE5vZGVCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLmdldENvbnRyb2xCeUtleShrZXkpLFxuICAgICAgcHJvcGVydGllczogdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KGAke2tleX1gKVxuICAgIH1cbiAgfVxuICBnZXRQcm9wZXJ0eUJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuJHByb3BlcnRpZXNba2V5XTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tICcuL2NvcmUvaW5kZXgnO1xuaW1wb3J0IHsgRG9ja01hbmFnZXIgfSBmcm9tICcuL2RvY2svRG9ja01hbmFnZXInO1xuaW1wb3J0IHsgU3lzdGVtQmFzZSB9IGZyb20gJy4vc3lzdGVtcy9TeXN0ZW1CYXNlJztcbmV4cG9ydCBjbGFzcyBWaXN1YWxGbG93IHtcbiAgcHJpdmF0ZSBtYWluOiBJTWFpbiB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IERvY2tNYW5hZ2VyO1xuICBwdWJsaWMgZ2V0RG9ja01hbmFnZXIoKTogRG9ja01hbmFnZXIge1xuICAgIHJldHVybiB0aGlzLiRkb2NrTWFuYWdlcjtcbiAgfVxuICBwdWJsaWMgc2V0T3B0aW9uKGRhdGE6IGFueSwgaXNEZWZhdWx0OiBib29sZWFuID0gdHJ1ZSkge1xuICAgIHRoaXMubWFpbj8uaW5pdE9wdGlvbihkYXRhLCBpc0RlZmF1bHQpO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyLnJlc2V0KCk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgY29udGFpbmVyOiBIVE1MRWxlbWVudCwgbWFpbjogSU1haW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLm1haW4gPSBtYWluID8/IG5ldyBTeXN0ZW1CYXNlKCk7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgndnMtY29udGFpbmVyJyk7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCgndnMtY29udGFpbmVyJyk7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIgPSBuZXcgRG9ja01hbmFnZXIodGhpcy5jb250YWluZXIsIHRoaXMubWFpbik7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIucmVzZXQoKTtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMubWFpbj8ub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMubWFpbj8ub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5tYWluPy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMubWFpbj8uZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICB9XG4gIHB1YmxpYyBnZXRNYWluKCk6IElNYWluIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5tYWluO1xuICB9XG4gIG5ld1NvbHV0aW9uKCRuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ubmV3U29sdXRpb24oJG5hbWUpO1xuICB9XG4gIG9wZW5Tb2x1dGlvbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm9wZW5Tb2x1dGlvbigkZGF0YSk7XG4gIH1cbiAgbmV3UHJvamVjdCgkbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm5ld1Byb2plY3QoJG5hbWUpO1xuICB9XG4gIG9wZW5Qcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ub3BlblByb2plY3QoJG5hbWUpO1xuICB9XG4gIGdldFByb2plY3RBbGwoKTogYW55W10gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdldE1haW4oKT8uZ2V0UHJvamVjdEFsbCgpO1xuICB9XG4gIHNldFByb2plY3RPcGVuKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8uc2V0UHJvamVjdE9wZW4oJGRhdGEpO1xuICB9XG4gIGltcG9ydEpzb24oZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/LmltcG9ydEpzb24oZGF0YSk7XG4gIH1cbiAgZXhwb3J0SnNvbigpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmdldE1haW4oKT8uZXhwb3J0SnNvbigpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlSXRlbSB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgU3lzdGVtQmFzZSB9IGZyb20gXCIuL1N5c3RlbUJhc2VcIjtcbmV4cG9ydCBjbGFzcyBTeXN0ZW1WdWUgZXh0ZW5kcyBTeXN0ZW1CYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVuZGVyOiBhbnkpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHJlbmRlckh0bWwobm9kZTogTm9kZUl0ZW0sIGVsUGFyZW50OiBFbGVtZW50KSB7XG4gICAgaWYgKHBhcnNlSW50KHRoaXMucmVuZGVyLnZlcnNpb24pID09PSAzKSB7XG4gICAgICAvL1Z1ZSAzXG4gICAgICBsZXQgd3JhcHBlciA9IHRoaXMucmVuZGVyLmgobm9kZS5nZXRPcHRpb24oKT8uaHRtbCwgeyAuLi4obm9kZS5nZXRPcHRpb24oKT8ucHJvcHMgPz8ge30pLCBub2RlIH0sIChub2RlLmdldE9wdGlvbigpPy5vcHRpb25zID8/IHt9KSk7XG4gICAgICB3cmFwcGVyLmFwcENvbnRleHQgPSBlbFBhcmVudDtcbiAgICAgIHRoaXMucmVuZGVyLnJlbmRlcih3cmFwcGVyLCBlbFBhcmVudCk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVnVlIDJcbiAgICAgIGxldCB3cmFwcGVyID0gbmV3IHRoaXMucmVuZGVyKHtcbiAgICAgICAgcGFyZW50OiBlbFBhcmVudCxcbiAgICAgICAgcmVuZGVyOiAoaDogYW55KSA9PiBoKG5vZGUuZ2V0T3B0aW9uKCk/Lmh0bWwsIHsgcHJvcHM6IHsgLi4uKG5vZGUuZ2V0T3B0aW9uKCk/LnByb3BzID8/IHt9KSwgbm9kZSB9IH0pLFxuICAgICAgICAuLi4obm9kZS5nZXRPcHRpb24oKT8ub3B0aW9ucyA/PyB7fSlcbiAgICAgIH0pLiRtb3VudCgpXG4gICAgICAvL1xuICAgICAgZWxQYXJlbnQuYXBwZW5kQ2hpbGQod3JhcHBlci4kZWwpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4sIEV2ZW50RW51bSwgRGF0YUZsb3cgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xyXG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVGFiRG9jayBleHRlbmRzIERvY2tCYXNlIHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy10YWInKTtcclxuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIChkZXRhaWw6IGFueSkgPT4ge1xyXG4gICAgICB0aGlzLmVsTm9kZT8ucXVlcnlTZWxlY3RvckFsbCgnLmFjdGl2ZScpLmZvckVhY2goKF9ub2RlKSA9PiB7XHJcbiAgICAgICAgX25vZGUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAodGhpcy5lbE5vZGUgJiYgZGV0YWlsPy5kYXRhPy5HZXQoJ2lkJykpIHtcclxuICAgICAgICB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm9qZWN0LWlkPVwiJHtkZXRhaWw/LmRhdGE/LkdldCgnaWQnKX1cIl1gKT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5uZXdQcm9qZWN0LCB0aGlzLnJlbmRlci5iaW5kKHRoaXMpKTtcclxuICB9XHJcblxyXG4gIHJlbmRlcigpIHtcclxuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBgO1xyXG4gICAgbGV0IHByb2plY3RzID0gdGhpcy5tYWluLmdldFByb2plY3RBbGwoKTtcclxuICAgIHByb2plY3RzLmZvckVhY2goKGl0ZW06IERhdGFGbG93KSA9PiB7XHJcbiAgICAgIGxldCBub2RlSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcclxuICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xyXG4gICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdC1pZCcsIGl0ZW0uR2V0KCdpZCcpKTtcclxuICAgICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcclxuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV9uYW1lYCwgKCkgPT4ge1xyXG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcclxuICAgICAgfSk7XHJcbiAgICAgIGlmICh0aGlzLm1haW4uY2hlY2tQcm9qZWN0T3BlbihpdGVtKSkge1xyXG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgICB9XHJcbiAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMubWFpbi5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsIHsgZGF0YTogaXRlbSB9KTtcclxuICAgICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiBpdGVtIH0pO1xyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5lbE5vZGU/LmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBWaXN1YWxGbG93IH0gZnJvbSBcIi4vVmlzdWFsRmxvd1wiO1xuaW1wb3J0ICogYXMgU3lzdGVtQmFzZSBmcm9tIFwiLi9zeXN0ZW1zL2luZGV4XCI7XG5pbXBvcnQgKiBhcyBDb3JlIGZyb20gJy4vY29yZS9pbmRleCc7XG5pbXBvcnQgKiBhcyBEZXNnaW5lciBmcm9tIFwiLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0ICogYXMgRG9jayBmcm9tICcuL2RvY2svaW5kZXgnO1xuZXhwb3J0IGRlZmF1bHQge1xuICBWaXN1YWxGbG93LFxuICAuLi5TeXN0ZW1CYXNlLFxuICAuLi5Db3JlLFxuICAuLi5Eb2NrLFxuICAuLi5EZXNnaW5lclxufTtcblxuIl0sIm5hbWVzIjpbIlN5c3RlbUJhc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQU8sTUFBTSxTQUFTLEdBQUc7QUFDdkIsSUFBQSxJQUFJLEVBQUUsTUFBTTtBQUNaLElBQUEsVUFBVSxFQUFFLFlBQVk7QUFDeEIsSUFBQSxZQUFZLEVBQUUsY0FBYztBQUM1QixJQUFBLFdBQVcsRUFBRSxhQUFhO0FBQzFCLElBQUEsVUFBVSxFQUFFLFlBQVk7QUFDeEIsSUFBQSxjQUFjLEVBQUUsZ0JBQWdCO0FBQ2hD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
