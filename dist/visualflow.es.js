
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
const ScopeRoot = "root";

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
    elSuggestions;
    elSuggestionsContent;
    nodeEditor;
    constructor(el, data, main, keyName = null) {
        this.el = el;
        this.data = data;
        this.main = main;
        this.keyName = keyName;
        if (this.keyName) {
            if (!el.getAttribute('node:model')) {
                this.property = this.main.getPropertyByKey(this.data.Get('key'))?.[this.keyName];
                this.nodeEditor = el;
                this.nodeEditor.classList.add('node-editor');
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
                this.nodeEditor = document.createElement('span');
                this.nodeEditor.classList.add('node-editor');
                el.parentElement?.insertBefore(this.nodeEditor, el);
                el.parentElement?.removeChild(el);
                this.nodeEditor.appendChild(this.elNode);
            }
        }
        this.elSuggestions = document.createElement('div');
        this.elSuggestions.classList.add('node-editor_suggestions');
        this.elSuggestionsContent = document.createElement('div');
        this.elSuggestionsContent.classList.add('suggestions_content');
        this.elSuggestions.appendChild(this.elSuggestionsContent);
        this.showSuggestions(false);
        if (this.keyName)
            this.bindData();
    }
    checkShowSuggestions() {
        if (this.elSuggestionsContent) {
            this.elSuggestionsContent.innerHTML = '';
            var arr = this.main.getVariable();
            if (!arr || arr.length == 0) {
                this.showSuggestions(false);
                return;
            }
            let elUl = document.createElement('ul');
            for (let item of arr) {
                let elLi = document.createElement('li');
                elLi.innerHTML = item.Get('name');
                elUl.appendChild(elLi);
            }
            this.elSuggestionsContent.appendChild(elUl);
        }
        let txt = this.elNode.value;
        let selectionStart = this.elNode.selectionStart;
        if (txt) {
            let startIndex = txt.lastIndexOf("${", selectionStart);
            let endIndex = txt.lastIndexOf("}", selectionStart);
            if (endIndex < startIndex)
                this.showSuggestions(true);
            else
                this.showSuggestions(false);
        }
    }
    showSuggestions(flg = true) {
        if (!this.elSuggestions)
            return;
        if (flg) {
            this.elSuggestions.removeAttribute('style');
        }
        else {
            this.elSuggestions.setAttribute('style', `display:none;`);
        }
    }
    bindData() {
        if (this.keyName && this.elNode) {
            this.data.on(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
            this.elNode.addEventListener('change', this.bindEvent.bind(this));
            this.elNode.addEventListener('keydown', this.bindEvent.bind(this));
            this.elNode.addEventListener('focus', () => {
                if (this.elSuggestions)
                    this.elNode?.parentElement?.appendChild(this.elSuggestions);
            });
            this.elNode.addEventListener('blur', () => {
                if (this.elSuggestions)
                    this.elNode?.parentElement?.removeChild(this.elSuggestions);
            });
            this.elNode.addEventListener("select", () => {
                this.checkShowSuggestions();
            });
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
                this.checkShowSuggestions();
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

var Core = /*#__PURE__*/Object.freeze({
    __proto__: null,
    FlowCore: FlowCore,
    BaseFlow: BaseFlow,
    DockEnum: DockEnum,
    EventEnum: EventEnum,
    PropertyEnum: PropertyEnum,
    ScopeRoot: ScopeRoot,
    DataFlow: DataFlow,
    DataView: DataView,
    EventFlow: EventFlow,
    compareSort: compareSort,
    getUuid: getUuid,
    getTime: getTime,
    LOG: LOG,
    getDate: getDate,
    isFunction: isFunction
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
        for (let index = len; index >= 0; index--) {
            let text = document.createElement('span');
            if (index == 0) {
                text.innerHTML = `${groups[index].text}`;
            }
            else {
                text.innerHTML = `${groups[index].text} >> `;
            }
            text.setAttribute('group', groups[index].id);
            text.addEventListener('click', (ev) => this.parent.BackGroup(groups[index].id));
            this.elPathGroup.appendChild(text);
        }
        if (len > 1)
            this.btnBack.removeAttribute('style');
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
        return [...this.group.map((item) => ({ id: item, text: this.GetDataById(item)?.Get('name') })), { id: ScopeRoot, text: ScopeRoot }];
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
        this.toolbar.renderPathGroup();
    }
    openGroup(id) {
        this.group = [id, ...this.group];
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
        this.changeGroup();
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
    }
    Open($data) {
        if ($data == this.data) {
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
        this.changeGroup();
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
        this.main.onSafe(EventEnum.changeVariable, ({ data }) => {
            this.Render();
        });
        this.main.onSafe(EventEnum.openProject, () => {
            this.Render();
        });
        this.main.onSafe(EventEnum.groupChange, () => {
            this.Render();
        });
        this.Render();
    }
    Render() {
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
        if (this.variables) {
            for (let item of this.variables) {
                new VariableItem(item, this).RenderScope(this.main.getGroupCurrent());
            }
        }
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
        this.nameInput.value = this.variable.Get('name');
        this.valueDefaultInput.value = this.variable.Get('initalValue') ?? '';
        this.typeInput.value = this.variable.Get('type') ?? '';
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
            this.variable.Set('name', e.target.value);
        });
        this.nameInput.addEventListener('change', (e) => {
            this.variable.Set('name', e.target.value);
        });
        let typeColumn = document.createElement('td');
        typeColumn.appendChild(this.typeInput);
        this.elNode.appendChild(typeColumn);
        this.typeInput.addEventListener('change', (e) => {
            this.variable.Set('type', e.target.value);
        });
        let scopeColumn = document.createElement('td');
        scopeColumn.appendChild(this.scopeInput);
        this.elNode.appendChild(scopeColumn);
        let valueDefaultColumn = document.createElement('td');
        valueDefaultColumn.appendChild(this.valueDefaultInput);
        this.elNode.appendChild(valueDefaultColumn);
        this.valueDefaultInput.addEventListener('change', (e) => {
            this.variable.Set('initalValue', e.target.value);
        });
        this.valueDefaultInput.addEventListener('keydown', (e) => {
            this.variable.Set('initalValue', e.target.value);
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
    RenderScope(group = null) {
        this.scopeInput.innerHTML = '';
        if (group) {
            for (let item of group) {
                let option = document.createElement('option');
                option.text = item.text;
                option.value = item.id;
                this.scopeInput.prepend(option);
            }
        }
        this.scopeInput.value = this.variable.Get('scope');
        this.scopeInput.addEventListener('change', (e) => {
            this.variable.Set('scope', e.target.value);
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
                this.main.newVariable();
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
    $group;
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
        this.$properties[PropertyEnum.variable] = {
            key: {
                default: PropertyEnum.variable
            },
            name: {
                default: () => `var${getTime()}`
            },
            type: {
                default: () => 'text'
            },
            scope: {
                default: () => ScopeRoot
            },
            initalValue: {
                default: ''
            },
        };
        this.onSafe(EventEnum.groupChange, ({ group }) => {
            this.$group = group;
        });
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
        let varibale = new DataFlow(this, { key: PropertyEnum.variable });
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
        return arr.filter((item) => this.getGroupCurrent().findIndex((_group) => _group.id == item.Get('scope')) > -1);
    }
    getGroupCurrent() {
        return this.$group ?? [];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5lcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvQ29uc3RhbnQudHMiLCIuLi9zcmMvY29yZS9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29yZS9EYXRhRmxvdy50cyIsIi4uL3NyYy9jb3JlL0Jhc2VGbG93LnRzIiwiLi4vc3JjL2NvcmUvVXRpbHMudHMiLCIuLi9zcmMvY29yZS9EYXRhVmlldy50cyIsIi4uL3NyYy9kZXNnaW5lci9MaW5lLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld19FdmVudC50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXdfVG9vbGJhci50cyIsIi4uL3NyYy9kZXNnaW5lci9Ob2RlSXRlbS50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXcudHMiLCIuLi9zcmMvZGVzZ2luZXIvVmFyaWFibGVWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1Rvb2xib3hWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1Byb2plY3RWaWV3LnRzIiwiLi4vc3JjL2RvY2svRG9ja0Jhc2UudHMiLCIuLi9zcmMvZG9jay9Db250cm9sRG9jay50cyIsIi4uL3NyYy9kb2NrL1ZhcmlhYmxlRG9jay50cyIsIi4uL3NyYy9kb2NrL1Byb2plY3REb2NrLnRzIiwiLi4vc3JjL2RvY2svUHJvcGVydHlEb2NrLnRzIiwiLi4vc3JjL2RvY2svVmlld0RvY2sudHMiLCIuLi9zcmMvZG9jay9Eb2NrTWFuYWdlci50cyIsIi4uL3NyYy9zeXN0ZW1zL2NvbnRyb2wudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1CYXNlLnRzIiwiLi4vc3JjL1Zpc3VhbEZsb3cudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1WdWUudHMiLCIuLi9zcmMvZG9jay9UYWJEb2NrLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBFdmVudEVudW0gPSB7XG4gIGluaXQ6IFwiaW5pdFwiLFxuICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcbiAgc2hvd1Byb3BlcnR5OiBcInNob3dQcm9wZXJ0eVwiLFxuICBvcGVuUHJvamVjdDogXCJvcGVuUHJvamVjdFwiLFxuICBuZXdQcm9qZWN0OiBcIm5ld1Byb2plY3RcIixcbiAgY2hhbmdlVmFyaWFibGU6IFwiY2hhbmdlVmFyaWFibGVcIixcbiAgY2hhbmdlOiBcImNoYW5nZVwiLFxuICBkaXNwb3NlOiBcImRpc3Bvc2VcIixcbiAgZ3JvdXBDaGFuZ2U6IFwiZ3JvdXBDaGFuZ2VcIixcbn1cblxuZXhwb3J0IGNvbnN0IERvY2tFbnVtID0ge1xuICBsZWZ0OiBcInZzLWxlZnRcIixcbiAgdG9wOiBcInZzLXRvcFwiLFxuICB2aWV3OiBcInZzLXZpZXdcIixcbiAgYm90dG9tOiBcInZzLWJvdHRvbVwiLFxuICByaWdodDogXCJ2cy1yaWdodFwiLFxufVxuXG5leHBvcnQgY29uc3QgUHJvcGVydHlFbnVtID0ge1xuICBtYWluOiBcIm1haW5fcHJvamVjdFwiLFxuICBzb2x1dGlvbjogJ21haW5fc29sdXRpb24nLFxuICBsaW5lOiAnbWFpbl9saW5lJyxcbiAgdmFyaWFibGU6ICdtYWluX3ZhcmlhYmxlJyxcbiAgZ3JvdXBDYXZhczogXCJtYWluX2dyb3VwQ2F2YXNcIixcbn07XG5cbmV4cG9ydCBjb25zdCBTY29wZVJvb3QgPSBcInJvb3RcIjtcbiIsImltcG9ydCB7IElFdmVudCB9IGZyb20gXCIuL0lGbG93XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRGbG93IGltcGxlbWVudHMgSUV2ZW50IHtcclxuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gIH1cclxuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHRoaXMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgLyogRXZlbnRzICovXHJcbiAgcHVibGljIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xyXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcclxuICAgICAgICBsaXN0ZW5lcnM6IFtdXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXHJcblxyXG4gICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZVxyXG5cclxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcclxuICAgIGNvbnN0IGxpc3RlbmVySW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcclxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXHJcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xyXG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBJUHJvcGVydHkgfSBmcm9tIFwiLi9JRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgRGF0YUZsb3cge1xuICBwcml2YXRlIGRhdGE6IGFueSA9IHt9O1xuICBwcml2YXRlIHByb3BlcnRpZXM6IGFueSA9IG51bGw7XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIHB1YmxpYyBnZXRQcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcGVydGllcztcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwcm9wZXJ0eTogSVByb3BlcnR5IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBkYXRhOiBhbnkgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5sb2FkKGRhdGEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgSW5pdERhdGEoZGF0YTogYW55ID0gbnVsbCwgcHJvcGVydGllczogYW55ID0gLTEpIHtcbiAgICBpZiAocHJvcGVydGllcyAhPT0gLTEpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubG9hZChkYXRhKTtcbiAgfVxuICBwcml2YXRlIGV2ZW50RGF0YUNoYW5nZShrZXk6IHN0cmluZywga2V5Q2hpbGQ6IHN0cmluZywgdmFsdWVDaGlsZDogYW55LCBzZW5kZXJDaGlsZDogYW55LCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGluZGV4KSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fV8ke2tleUNoaWxkfWAsIHtcbiAgICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVFdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHB1YmxpYyBPbkV2ZW50RGF0YShpdGVtOiBEYXRhRmxvdywga2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcbiAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfWAsICh7IGtleToga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkIH06IGFueSkgPT4gdGhpcy5ldmVudERhdGFDaGFuZ2Uoa2V5LCBrZXlDaGlsZCwgdmFsdWVDaGlsZCwgc2VuZGVyQ2hpbGQsIGluZGV4KSk7XG4gIH1cbiAgcHJpdmF0ZSBCaW5kRXZlbnQodmFsdWU6IGFueSwga2V5OiBzdHJpbmcpIHtcbiAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHRoaXMuT25FdmVudERhdGEodmFsdWUgYXMgRGF0YUZsb3csIGtleSk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAodmFsdWUgYXMgW10pLmxlbmd0aCA+IDAgJiYgdmFsdWVbMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgKHZhbHVlIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLk9uRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0Rpc3BhdGNoOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICh0aGlzLmRhdGFba2V5XSAhPSB2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZGF0YVtrZXldKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgdGhpcy5SZW1vdmVFdmVudERhdGEoKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93KSwga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFba2V5XSkgJiYgKHRoaXMuZGF0YVtrZXldIGFzIFtdKS5sZW5ndGggPiAwICYmIHRoaXMuZGF0YVtrZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgICAodGhpcy5kYXRhW2tleV0gYXMgRGF0YUZsb3dbXSkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3csIGluZGV4OiBudW1iZXIpID0+IHRoaXMuUmVtb3ZlRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gICAgfVxuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgaWYgKGlzRGlzcGF0Y2gpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgIH0pO1xuICAgIH1cblxuICB9XG4gIHB1YmxpYyBTZXREYXRhKGRhdGE6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IGZhbHNlKSB7XG5cbiAgICBpZiAoaXNDbGVhckRhdGEpIHRoaXMuZGF0YSA9IHt9O1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIGxldCAkZGF0YTogRGF0YUZsb3cgPSBkYXRhIGFzIERhdGFGbG93O1xuICAgICAgaWYgKCF0aGlzLnByb3BlcnR5ICYmICRkYXRhLnByb3BlcnR5KSB0aGlzLnByb3BlcnR5ID0gJGRhdGEucHJvcGVydHk7XG4gICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cygkZGF0YS5nZXRQcm9wZXJ0aWVzKCkpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIHRoaXMuU2V0KGtleSwgZGF0YVtrZXldLCBzZW5kZXIsIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgZGF0YVxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBHZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2tleV07XG4gIH1cbiAgcHVibGljIEFwcGVuZChrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGlmICghdGhpcy5kYXRhW2tleV0pIHRoaXMuZGF0YVtrZXldID0gW107XG4gICAgdGhpcy5kYXRhW2tleV0gPSBbLi4udGhpcy5kYXRhW2tleV0sIHZhbHVlXTtcbiAgICB0aGlzLkJpbmRFdmVudCh2YWx1ZSwga2V5KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgdGhpcy5kYXRhW2tleV0uaW5kZXhPZih2YWx1ZSk7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5kYXRhW2tleV0uaW5kZXhPZih2YWx1ZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuUmVtb3ZlRXZlbnREYXRhKHRoaXMuZGF0YVtrZXldW2luZGV4XSwga2V5KTtcbiAgICAgIHRoaXMuZGF0YVtrZXldLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIGlmICghdGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnR5Py5nZXRQcm9wZXJ0eUJ5S2V5KGRhdGEua2V5KTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcGVydGllcykge1xuICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcbiAgICAgICAgdGhpcy5kYXRhW2tleV0gPSAoZGF0YT8uW2tleV0gPz8gKCh0eXBlb2YgdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0KCkgOiB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCkgPz8gXCJcIikpO1xuICAgICAgICBpZiAoISh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSAmJiB0aGlzLmRhdGFba2V5XS5rZXkpIHtcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCB0aGlzLmRhdGFba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhW2tleV0pICYmIHRoaXMucHJvcGVydHkgJiYgISh0aGlzLmRhdGFba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSkge1xuICAgICAgICAgIHRoaXMuZGF0YVtrZXldID0gdGhpcy5kYXRhW2tleV0ubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICghKGl0ZW0gaW5zdGFuY2VvZiBEYXRhRmxvdykgJiYgaXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCBpdGVtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuQmluZEV2ZW50KHRoaXMuZGF0YVtrZXldLCBrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudG9Kc29uKCkpO1xuICB9XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgbGV0IHJzOiBhbnkgPSB7fTtcbiAgICBpZiAoIXRoaXMucHJvcGVydGllcykge1xuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0eT8uZ2V0UHJvcGVydHlCeUtleSh0aGlzLmRhdGEua2V5KTtcbiAgICB9XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcbiAgICAgIHJzW2tleV0gPSB0aGlzLkdldChrZXkpO1xuICAgICAgaWYgKHJzW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICByc1trZXldID0gcnNba2V5XS50b0pzb24oKTtcbiAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyc1trZXldKSAmJiAocnNba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiByc1trZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0ubWFwKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBycztcbiAgfVxuICBwdWJsaWMgZGVsZXRlKCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XHJcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XHJcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xyXG5pbXBvcnQgeyBJRXZlbnQgfSBmcm9tIFwiLi9JRmxvd1wiO1xyXG5leHBvcnQgY2xhc3MgRmxvd0NvcmUgaW1wbGVtZW50cyBJRXZlbnQge1xyXG4gIHB1YmxpYyBHZXRJZCgpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdpZCcpO1xyXG4gIH1cclxuICBwdWJsaWMgU2V0SWQoaWQ6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ2lkJywgaWQpO1xyXG4gIH1cclxuICBwdWJsaWMgcHJvcGVydGllczogYW55ID0ge307XHJcbiAgcHVibGljIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XHJcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHJcbiAgcHVibGljIENoZWNrRWxlbWVudENoaWxkKGVsOiBIVE1MRWxlbWVudCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxOb2RlID09IGVsIHx8IHRoaXMuZWxOb2RlLmNvbnRhaW5zKGVsKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcclxuICBwdWJsaWMgU2V0RGF0YShkYXRhOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCkge1xyXG4gICAgdGhpcy5kYXRhLlNldERhdGEoZGF0YSwgc2VuZGVyKTtcclxuICB9XHJcbiAgcHVibGljIFNldERhdGFGbG93KGRhdGE6IERhdGFGbG93KSB7XHJcbiAgICB0aGlzLmRhdGEuU2V0RGF0YShkYXRhLCB0aGlzLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLmRpc3BhdGNoKGBiaW5kX2RhdGFfZXZlbnRgLCB7IGRhdGEsIHNlbmRlcjogdGhpcyB9KTtcclxuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XHJcbiAgfVxyXG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xyXG4gIH1cclxuICBSZW1vdmVEYXRhRXZlbnQoKSB7XHJcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uY2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJhc2VGbG93PFRQYXJlbnQgZXh0ZW5kcyBGbG93Q29yZT4gZXh0ZW5kcyBGbG93Q29yZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJlbnQ6IFRQYXJlbnQpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgfVxyXG59XHJcbiIsImV4cG9ydCBjb25zdCBMT0cgPSAobWVzc2FnZT86IGFueSwgLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiBjb25zb2xlLmxvZyhtZXNzYWdlLCBvcHRpb25hbFBhcmFtcyk7XG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IChuZXcgRGF0ZSgpKTtcbmV4cG9ydCBjb25zdCBnZXRUaW1lID0gKCkgPT4gZ2V0RGF0ZSgpLmdldFRpbWUoKTtcbmV4cG9ydCBjb25zdCBnZXRVdWlkID0gKCkgPT4ge1xuICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICBsZXQgczogYW55ID0gW107XG4gIGxldCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xuICB9XG4gIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcbiAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXG4gIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICByZXR1cm4gdXVpZDtcbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBhcmVTb3J0ID0gKGE6IGFueSwgYjogYW55KSA9PiB7XG4gIGlmIChhLnNvcnQgPCBiLnNvcnQpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKGEuc29ydCA+IGIuc29ydCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuZXhwb3J0IGNvbnN0IGlzRnVuY3Rpb24gPSAoZm46IGFueSkgPT4ge1xuICByZXR1cm4gZm4gJiYgZm4gaW5zdGFuY2VvZiBGdW5jdGlvbjtcbn1cbmV4cG9ydCBjb25zdCBkb3dubG9hZE9iamVjdEFzSnNvbiA9IChleHBvcnRPYmo6IGFueSwgZXhwb3J0TmFtZTogc3RyaW5nKSA9PiB7XG4gIHZhciBkYXRhU3RyID0gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGV4cG9ydE9iaikpO1xuICB2YXIgZG93bmxvYWRBbmNob3JOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBkb3dubG9hZEFuY2hvck5vZGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBkYXRhU3RyKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnNldEF0dHJpYnV0ZShcImRvd25sb2FkXCIsIGV4cG9ydE5hbWUgKyBcIi5qc29uXCIpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRvd25sb2FkQW5jaG9yTm9kZSk7IC8vIHJlcXVpcmVkIGZvciBmaXJlZm94XG4gIGRvd25sb2FkQW5jaG9yTm9kZS5jbGljaygpO1xuICBkb3dubG9hZEFuY2hvck5vZGUucmVtb3ZlKCk7XG59XG5leHBvcnQgY29uc3QgcmVhZEZpbGVMb2NhbCA9IChjYWxsYmFjazogYW55KSA9PiB7XG4gIHZhciBpbnB1dEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnZmlsZScpO1xuICBpbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrPy4oZnIucmVzdWx0KTtcbiAgICB9XG4gICAgaWYgKGlucHV0RWwgJiYgaW5wdXRFbC5maWxlcylcbiAgICAgIGZyLnJlYWRBc1RleHQoaW5wdXRFbC5maWxlc1swXSk7XG4gIH0pO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlucHV0RWwpO1xuICBpbnB1dEVsLmNsaWNrKCk7XG4gIGlucHV0RWwucmVtb3ZlKCk7XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuL0lGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgaXNGdW5jdGlvbiB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbmV4cG9ydCBjb25zdCBUYWdWaWV3ID0gWydTUEFOJywgJ0RJVicsICdQJywgJ1RFWFRBUkVBJ107XG5leHBvcnQgY2xhc3MgRGF0YVZpZXcge1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgcHJvcGVydHk6IGFueTtcbiAgcHJpdmF0ZSBlbFN1Z2dlc3Rpb25zOiBFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGVsU3VnZ2VzdGlvbnNDb250ZW50OiBFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIG5vZGVFZGl0b3I6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBlbDogRWxlbWVudCwgcHJpdmF0ZSBkYXRhOiBEYXRhRmxvdywgcHJpdmF0ZSBtYWluOiBJTWFpbiwgcHJpdmF0ZSBrZXlOYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbCkge1xuICAgIGlmICh0aGlzLmtleU5hbWUpIHtcbiAgICAgIGlmICghZWwuZ2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJykpIHtcbiAgICAgICAgdGhpcy5wcm9wZXJ0eSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KHRoaXMuZGF0YS5HZXQoJ2tleScpKT8uW3RoaXMua2V5TmFtZV07XG4gICAgICAgIHRoaXMubm9kZUVkaXRvciA9IGVsO1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3InKTtcblxuICAgICAgICBpZiAodGhpcy5wcm9wZXJ0eS5lZGl0KSB7XG4gICAgICAgICAgaWYgKHRoaXMucHJvcGVydHkuc2VsZWN0KSB7XG4gICAgICAgICAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJub2RlLWZvcm0tY29udHJvbFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCB0aGlzLmtleU5hbWUpO1xuXG4gICAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleU5hbWUgPSBlbD8uZ2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJyk7XG4gICAgICBpZiAodGhpcy5rZXlOYW1lKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleSh0aGlzLmRhdGEuR2V0KCdrZXknKSk/Llt0aGlzLmtleU5hbWVdO1xuICAgICAgICB0aGlzLmVsTm9kZSA9IHRoaXMuZWwgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIHRoaXMubm9kZUVkaXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdGhpcy5ub2RlRWRpdG9yLmNsYXNzTGlzdC5hZGQoJ25vZGUtZWRpdG9yJyk7XG4gICAgICAgIGVsLnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZSh0aGlzLm5vZGVFZGl0b3IsIGVsKTtcbiAgICAgICAgZWwucGFyZW50RWxlbWVudD8ucmVtb3ZlQ2hpbGQoZWwpO1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmVsU3VnZ2VzdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsU3VnZ2VzdGlvbnMuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3Jfc3VnZ2VzdGlvbnMnKTtcbiAgICB0aGlzLmVsU3VnZ2VzdGlvbnNDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudC5jbGFzc0xpc3QuYWRkKCdzdWdnZXN0aW9uc19jb250ZW50Jyk7XG4gICAgdGhpcy5lbFN1Z2dlc3Rpb25zLmFwcGVuZENoaWxkKHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQpO1xuICAgIHRoaXMuc2hvd1N1Z2dlc3Rpb25zKGZhbHNlKTtcbiAgICBpZiAodGhpcy5rZXlOYW1lKVxuICAgICAgdGhpcy5iaW5kRGF0YSgpO1xuICB9XG4gIHByaXZhdGUgY2hlY2tTaG93U3VnZ2VzdGlvbnMoKSB7XG4gICAgaWYgKHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQpIHtcbiAgICAgIHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICB2YXIgYXJyID0gdGhpcy5tYWluLmdldFZhcmlhYmxlKCk7XG4gICAgICBpZiAoIWFyciB8fCBhcnIubGVuZ3RoID09IDApIHtcbiAgICAgICAgdGhpcy5zaG93U3VnZ2VzdGlvbnMoZmFsc2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsZXQgZWxVbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIGFycikge1xuICAgICAgICBsZXQgZWxMaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIGVsTGkuaW5uZXJIVE1MID0gaXRlbS5HZXQoJ25hbWUnKTtcbiAgICAgICAgZWxVbC5hcHBlbmRDaGlsZChlbExpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQuYXBwZW5kQ2hpbGQoZWxVbCk7XG4gICAgfVxuICAgIGxldCB0eHQ6IGFueSA9ICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlO1xuICAgIGxldCBzZWxlY3Rpb25TdGFydCA9ICh0aGlzLmVsTm9kZSBhcyBhbnkpLnNlbGVjdGlvblN0YXJ0O1xuICAgIGlmICh0eHQpIHtcbiAgICAgIGxldCBzdGFydEluZGV4ID0gdHh0Lmxhc3RJbmRleE9mKFwiJHtcIiwgc2VsZWN0aW9uU3RhcnQpO1xuICAgICAgbGV0IGVuZEluZGV4ID0gdHh0Lmxhc3RJbmRleE9mKFwifVwiLCBzZWxlY3Rpb25TdGFydCk7XG4gICAgICBpZiAoZW5kSW5kZXggPCBzdGFydEluZGV4KVxuICAgICAgICB0aGlzLnNob3dTdWdnZXN0aW9ucyh0cnVlKTtcbiAgICAgIGVsc2VcbiAgICAgICAgdGhpcy5zaG93U3VnZ2VzdGlvbnMoZmFsc2UpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIHNob3dTdWdnZXN0aW9ucyhmbGc6IGJvb2xlYW4gPSB0cnVlKSB7XG4gICAgaWYgKCF0aGlzLmVsU3VnZ2VzdGlvbnMpIHJldHVybjtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsU3VnZ2VzdGlvbnMucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsU3VnZ2VzdGlvbnMuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgYmluZERhdGEoKSB7XG4gICAgaWYgKHRoaXMua2V5TmFtZSAmJiB0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5kYXRhLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke3RoaXMua2V5TmFtZX1gLCB0aGlzLmJpbmRJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnMpXG4gICAgICAgICAgdGhpcy5lbE5vZGU/LnBhcmVudEVsZW1lbnQ/LmFwcGVuZENoaWxkKHRoaXMuZWxTdWdnZXN0aW9ucyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnMpXG4gICAgICAgICAgdGhpcy5lbE5vZGU/LnBhcmVudEVsZW1lbnQ/LnJlbW92ZUNoaWxkKHRoaXMuZWxTdWdnZXN0aW9ucyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJzZWxlY3RcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmNoZWNrU2hvd1N1Z2dlc3Rpb25zKCk7XG4gICAgICB9KVxuICAgICAgaWYgKHRoaXMucHJvcGVydHkgJiYgdGhpcy5wcm9wZXJ0eS5zZWxlY3QgJiYgaXNGdW5jdGlvbih0aGlzLnByb3BlcnR5LmRhdGFTZWxlY3QpKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLnByb3BlcnR5LmRhdGFTZWxlY3QoeyBlbE5vZGU6IHRoaXMuZWxOb2RlLCBtYWluOiB0aGlzLm1haW4sIGtleTogdGhpcy5rZXlOYW1lIH0pLm1hcCgoeyB2YWx1ZSwgdGV4dCB9OiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICAgICAgb3B0aW9uLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgb3B0aW9uLnRleHQgPSB0ZXh0O1xuICAgICAgICAgIHJldHVybiBvcHRpb247XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGxldCBvcHRpb24gb2Ygb3B0aW9ucykge1xuICAgICAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnByb3BlcnR5ICYmIGlzRnVuY3Rpb24odGhpcy5wcm9wZXJ0eS5zY3JpcHQpKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHkuc2NyaXB0KHsgZWxOb2RlOiB0aGlzLmVsTm9kZSwgbWFpbjogdGhpcy5tYWluLCBrZXk6IHRoaXMua2V5TmFtZSB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0Tm9kZVZhbHVlKHRoaXMuZGF0YS5HZXQodGhpcy5rZXlOYW1lKSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgc2V0Tm9kZVZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGlmIChUYWdWaWV3LmluY2x1ZGVzKHRoaXMuZWxOb2RlLnRhZ05hbWUpKSB7XG4gICAgICAgICh0aGlzLmVsTm9kZSBhcyBhbnkpLmlubmVyVGV4dCA9IGAke3ZhbHVlfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAodGhpcy5lbE5vZGUgYXMgYW55KS52YWx1ZSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwcml2YXRlIGJpbmRJbnB1dCh7IHZhbHVlLCBzZW5kZXIgfTogYW55KSB7XG4gICAgaWYgKHNlbmRlciAhPT0gdGhpcyAmJiB0aGlzLmVsTm9kZSAmJiBzZW5kZXIuZWxOb2RlICE9PSB0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5zZXROb2RlVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGJpbmRFdmVudCgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmtleU5hbWUgJiYgdGhpcy5lbE5vZGUpIHtcbiAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLmtleU5hbWUsICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlLCB0aGlzKTtcblxuXG4gICAgICAgIHRoaXMuY2hlY2tTaG93U3VnZ2VzdGlvbnMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgRGVsZXRlKCkge1xuICAgIGlmICh0aGlzLmtleU5hbWUgJiYgdGhpcy5lbE5vZGUpIHtcbiAgICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHt0aGlzLmtleU5hbWV9YCwgdGhpcy5iaW5kSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHN0YXRpYyBCaW5kRWxlbWVudChlbDogRWxlbWVudCwgZGF0YTogRGF0YUZsb3csIG1haW46IElNYWluLCBrZXk6IHN0cmluZyB8IG51bGwgPSBudWxsKTogRGF0YVZpZXdbXSB7XG4gICAgaWYgKGVsLmNoaWxkRWxlbWVudENvdW50ID09IDAgfHwgZWwuZ2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJykpIHtcbiAgICAgIHJldHVybiBbbmV3IERhdGFWaWV3KGVsLCBkYXRhLCBtYWluLCBrZXkpXTtcbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnW25vZGVcXFxcOm1vZGVsXScpKS5tYXAoKGl0ZW06IEVsZW1lbnQpID0+IHtcbiAgICAgIHJldHVybiBuZXcgRGF0YVZpZXcoaXRlbSwgZGF0YSwgbWFpbik7XG4gICAgfSk7XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBOb2RlSXRlbSB9IGZyb20gXCIuL05vZGVJdGVtXCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lIHtcbiAgcHVibGljIGVsTm9kZTogU1ZHRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgcHVibGljIGVsUGF0aDogU1ZHUGF0aEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJwYXRoXCIpO1xuICBwcml2YXRlIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyB0ZW1wOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZnJvbTogTm9kZUl0ZW0sIHB1YmxpYyBmcm9tSW5kZXg6IG51bWJlciA9IDAsIHB1YmxpYyB0bzogTm9kZUl0ZW0gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsIHB1YmxpYyB0b0luZGV4OiBudW1iZXIgPSAwLCBkYXRhOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5mcm9tLnBhcmVudC5lbENhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG5cbiAgICB0aGlzLmZyb20uQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnRvPy5BZGRMaW5lKHRoaXMpO1xuICAgIGlmIChkYXRhKSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoXG4gICAgICB7XG4gICAgICAgIGZyb206IHRoaXMuZnJvbS5HZXRJZCgpLFxuICAgICAgICBmcm9tSW5kZXg6IHRoaXMuZnJvbUluZGV4LFxuICAgICAgICB0bzogdGhpcy50bz8uR2V0SWQoKSxcbiAgICAgICAgdG9JbmRleDogdGhpcy50b0luZGV4XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAuLi4gdGhpcy5mcm9tLnBhcmVudC5tYWluLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLmxpbmUpIHx8IHt9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmZyb20uZGF0YS5BcHBlbmQoJ2xpbmVzJywgdGhpcy5kYXRhKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVG8odG9feDogbnVtYmVyLCB0b195OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuZnJvbSB8fCB0aGlzLmZyb20uZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgeyB4OiBmcm9tX3gsIHk6IGZyb21feSB9OiBhbnkgPSB0aGlzLmZyb20uZ2V0UG9zdGlzaW9uRG90KHRoaXMuZnJvbUluZGV4KTtcbiAgICB2YXIgbGluZUN1cnZlID0gdGhpcy5jcmVhdGVDdXJ2YXR1cmUoZnJvbV94LCBmcm9tX3ksIHRvX3gsIHRvX3ksIHRoaXMuY3VydmF0dXJlLCAnb3RoZXInKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCk6IExpbmUge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvLmVsTm9kZSkge1xuICAgICAgbGV0IHsgeDogdG9feCwgeTogdG9feSB9OiBhbnkgPSB0aGlzLnRvLmdldFBvc3Rpc2lvbkRvdCh0aGlzLnRvSW5kZXgpO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIEFjdGl2ZShmbGc6IGFueSA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwsIGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5mcm9tLmRhdGEuUmVtb3ZlKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gICAgaWYgKHRoaXMuZnJvbSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50bz8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsUGF0aC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLmZyb20ucGFyZW50LnNldExpbmVDaG9vc2UodGhpcylcbiAgfVxuICBwdWJsaWMgc2V0Tm9kZVRvKG5vZGU6IE5vZGVJdGVtIHwgdW5kZWZpbmVkLCB0b0luZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLnRvID0gbm9kZTtcbiAgICB0aGlzLnRvSW5kZXggPSB0b0luZGV4O1xuICB9XG4gIHB1YmxpYyBDbG9uZSgpIHtcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvSW5kZXggJiYgdGhpcy5mcm9tICE9IHRoaXMudG8gJiYgIXRoaXMuZnJvbS5jaGVja0xpbmVFeGlzdHModGhpcy5mcm9tSW5kZXgsIHRoaXMudG8sIHRoaXMudG9JbmRleCkpIHtcbiAgICAgIHJldHVybiBuZXcgTGluZSh0aGlzLmZyb20sIHRoaXMuZnJvbUluZGV4LCB0aGlzLnRvLCB0aGlzLnRvSW5kZXgpLlVwZGF0ZVVJKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBnZXRUaW1lIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcblxuZXhwb3J0IGVudW0gTW92ZVR5cGUge1xuICBOb25lID0gMCxcbiAgTm9kZSA9IDEsXG4gIENhbnZhcyA9IDIsXG4gIExpbmUgPSAzLFxufVxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlld19FdmVudCB7XG5cbiAgcHJpdmF0ZSB0aW1lRmFzdENsaWNrOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHRhZ0luZ29yZSA9IFsnaW5wdXQnLCAnYnV0dG9uJywgJ2EnLCAndGV4dGFyZWEnXTtcblxuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gIHByaXZhdGUgZmxnRHJhcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIGF2X3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgYXZfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHRlbXBMaW5lOiBMaW5lIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IERlc2dpbmVyVmlldykge1xuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuICAgIC8qIENvbnRleHQgTWVudSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMubm9kZV9kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMubm9kZV9kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy56b29tX2VudGVyLmJpbmQodGhpcykpO1xuICAgIC8qIERlbGV0ZSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb250ZXh0bWVudShldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cbiAgcHJpdmF0ZSBub2RlX2RyYWdvdmVyKGV2OiBhbnkpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfVxuICBwcml2YXRlIG5vZGVfZHJvcEVuZChldjogYW55KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBsZXQga2V5Tm9kZTogYW55ID0gdGhpcy5wYXJlbnQubWFpbi5nZXRDb250cm9sQ2hvb3NlKCk7XG4gICAgaWYgKCFrZXlOb2RlICYmIGV2LnR5cGUgIT09IFwidG91Y2hlbmRcIikge1xuICAgICAga2V5Tm9kZSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwibm9kZVwiKTtcbiAgICB9XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuXG4gICAgaWYgKHRoaXMucGFyZW50LmNoZWNrT25seU5vZGUoa2V5Tm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IG5vZGVJdGVtID0gdGhpcy5wYXJlbnQuQWRkTm9kZShrZXlOb2RlLCB7XG4gICAgICBncm91cDogdGhpcy5wYXJlbnQuQ3VycmVudEdyb3VwKClcbiAgICB9KTtcbiAgICBub2RlSXRlbS51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21fb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBab29tIEluXG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21faW4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBTdGFydE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmICh0aGlzLnRhZ0luZ29yZS5pbmNsdWRlcyhldi50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSBnZXRUaW1lKCk7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21haW4tcGF0aCcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgbGV0IG5vZGVDaG9vc2UgPSB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk7XG4gICAgaWYgKG5vZGVDaG9vc2UgJiYgbm9kZUNob29zZS5DaGVja0VsZW1lbnRDaGlsZChldi50YXJnZXQpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh1bmRlZmluZWQpO1xuICAgIH1cbiAgICBpZiAobm9kZUNob29zZSAmJiB0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vZGUgJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBldi50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmUobm9kZUNob29zZSwgZnJvbUluZGV4KTtcbiAgICAgIHRoaXMudGVtcExpbmUudGVtcCA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgdGhpcy5hdl94ID0gdGhpcy5wYXJlbnQuZ2V0WCgpO1xuICAgICAgdGhpcy5hdl95ID0gdGhpcy5wYXJlbnQuZ2V0WSgpO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuYXZfeCArIHRoaXMucGFyZW50LkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRZKHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLk5vZGU6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucG9zX3ggLSBlX3Bvc194KTtcbiAgICAgICAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcbiAgICAgICAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICAgICAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk/LnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLkxpbmU6XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgICAgICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcbiAgICAgICAgICAgIHRoaXMudGVtcExpbmUudXBkYXRlVG8odGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0TGVmdCAtIHgsIHRoaXMucGFyZW50LmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICAgICAgbGV0IG5vZGVFbCA9IGV2LnRhcmdldC5jbG9zZXN0KCdbbm9kZS1pZF0nKTtcbiAgICAgICAgICAgIGxldCBub2RlSWQgPSBub2RlRWw/LmdldEF0dHJpYnV0ZSgnbm9kZS1pZCcpO1xuICAgICAgICAgICAgbGV0IG5vZGVUbyA9IG5vZGVJZCA/IHRoaXMucGFyZW50LkdldE5vZGVCeUlkKG5vZGVJZCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAobm9kZVRvICYmIGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJub2RlLWRvdFwiKSkge1xuICAgICAgICAgICAgICBsZXQgdG9JbmRleCA9IGV2LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gbm9kZUVsPy5xdWVyeVNlbGVjdG9yKCcubm9kZS1kb3QnKT8uWzBdPy5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcbiAgICAgIHRoaXMubW91c2VfeSA9IGVfcG9zX3k7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgRW5kTW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgoZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDEwMCkgfHwgIXRoaXMuZmxnTW92ZSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIGxldCB4ID0gdGhpcy5hdl94ICsgdGhpcy5wYXJlbnQuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICBsZXQgeSA9IHRoaXMuYXZfeSArIHRoaXMucGFyZW50LkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgIHRoaXMucGFyZW50LnNldFkoeSk7XG4gICAgICB0aGlzLmF2X3ggPSAwO1xuICAgICAgdGhpcy5hdl95ID0gMDtcbiAgICB9XG4gICAgaWYgKHRoaXMudGVtcExpbmUpIHtcbiAgICAgIHRoaXMudGVtcExpbmUuQ2xvbmUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUuZGVsZXRlKCk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwcml2YXRlIGtleWRvd24oZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmIChldi5rZXkgPT09ICdEZWxldGUnIHx8IChldi5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGV2Lm1ldGFLZXkpKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgICB0aGlzLnBhcmVudC5nZXRMaW5lQ2hvb3NlKCk/LmRlbGV0ZSgpO1xuICAgIH1cbiAgICBpZiAoZXYua2V5ID09PSAnRjInKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlld19Ub29sYmFyIHtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGVsUGF0aEdyb3VwOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwcml2YXRlIGJ0bkJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBEZXNnaW5lclZpZXcpIHtcbiAgICB0aGlzLmVsTm9kZSA9IHBhcmVudC5lbFRvb2xiYXI7XG4gICAgdGhpcy5lbFBhdGhHcm91cC5jbGFzc0xpc3QuYWRkKCd0b29sYmFyLWdyb3VwJyk7XG4gICAgdGhpcy5yZW5kZXJVSSgpO1xuICAgIHRoaXMucmVuZGVyUGF0aEdyb3VwKCk7XG4gIH1cbiAgcHVibGljIHJlbmRlclBhdGhHcm91cCgpIHtcbiAgICB0aGlzLmJ0bkJhY2suc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgdGhpcy5lbFBhdGhHcm91cC5pbm5lckhUTUwgPSBgYDtcbiAgICBsZXQgZ3JvdXBzID0gdGhpcy5wYXJlbnQuR2V0R3JvdXBOYW1lKCk7XG4gICAgbGV0IGxlbiA9IGdyb3Vwcy5sZW5ndGggLSAxO1xuICAgIGlmIChsZW4gPCAwKSByZXR1cm47XG4gICAgZm9yIChsZXQgaW5kZXggPSBsZW47IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgIGxldCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgaWYgKGluZGV4ID09IDApIHtcbiAgICAgICAgdGV4dC5pbm5lckhUTUwgPSBgJHtncm91cHNbaW5kZXhdLnRleHR9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRleHQuaW5uZXJIVE1MID0gYCR7Z3JvdXBzW2luZGV4XS50ZXh0fSA+PiBgO1xuICAgICAgfVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoJ2dyb3VwJywgZ3JvdXBzW2luZGV4XS5pZCk7XG4gICAgICB0ZXh0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB0aGlzLnBhcmVudC5CYWNrR3JvdXAoZ3JvdXBzW2luZGV4XS5pZCkpO1xuICAgICAgdGhpcy5lbFBhdGhHcm91cC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICB9XG4gICAgaWYgKGxlbiA+IDEpXG4gICAgICB0aGlzLmJ0bkJhY2sucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICB9XG4gIHB1YmxpYyByZW5kZXJVSSgpIHtcbiAgICBpZiAoIXRoaXMuZWxOb2RlKSByZXR1cm47XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgdGhpcy5idG5CYWNrLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuQmFja0dyb3VwKCkpO1xuICAgIHRoaXMuYnRuQmFjay5pbm5lckhUTUwgPSBgQmFja2A7XG4gICAgbGV0IGJ0blpvb21JbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21Jbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucGFyZW50Lnpvb21faW4oKSk7XG4gICAgYnRuWm9vbUluLmlubmVySFRNTCA9IGArYDtcbiAgICBsZXQgYnRuWm9vbU91dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21PdXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnBhcmVudC56b29tX291dCgpKTtcbiAgICBidG5ab29tT3V0LmlubmVySFRNTCA9IGAtYDtcbiAgICBsZXQgYnRuWm9vbVJlc2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYnRuWm9vbVJlc2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuem9vbV9yZXNldCgpKTtcbiAgICBidG5ab29tUmVzZXQuaW5uZXJIVE1MID0gYCpgO1xuICAgIGxldCBidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGJ1dHRvbkdyb3VwLmNsYXNzTGlzdC5hZGQoJ3Rvb2xiYXItYnV0dG9uJylcbiAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLmJ0bkJhY2spO1xuICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKGJ0blpvb21Jbik7XG4gICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuWm9vbU91dCk7XG4gICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuWm9vbVJlc2V0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aEdyb3VwKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChidXR0b25Hcm91cCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93LCBFdmVudEVudW0sIERhdGFGbG93LCBEYXRhVmlldyB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBpc0Z1bmN0aW9uIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmV4cG9ydCBjbGFzcyBOb2RlSXRlbSBleHRlbmRzIEJhc2VGbG93PERlc2dpbmVyVmlldz4ge1xuICAvKipcbiAgICogR0VUIFNFVCBmb3IgRGF0YVxuICAgKi9cbiAgcHVibGljIGdldE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ25hbWUnKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3knKTtcbiAgfVxuICBwdWJsaWMgc2V0WSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3knLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIGdldFgoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd4JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBDaGVja0tleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdrZXknKSA9PSBrZXk7XG4gIH1cbiAgcHVibGljIGdldERhdGFMaW5lKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdsaW5lcycpID8/IFtdO1xuICB9XG4gIHB1YmxpYyBjaGVja0xpbmVFeGlzdHMoZnJvbUluZGV4OiBudW1iZXIsIHRvOiBOb2RlSXRlbSwgdG9JbmRleDogTnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZS5maWx0ZXIoKGl0ZW06IExpbmUpID0+IHtcbiAgICAgIGlmICghaXRlbS50ZW1wICYmIGl0ZW0udG8gPT0gdG8gJiYgaXRlbS50b0luZGV4ID09IHRvSW5kZXggJiYgaXRlbS5mcm9tSW5kZXggPT0gZnJvbUluZGV4KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKCFpdGVtLnRlbXAgJiYgaXRlbS5mcm9tID09IHRvICYmIGl0ZW0uZnJvbUluZGV4ID09IHRvSW5kZXggJiYgaXRlbS50b0luZGV4ID09IGZyb21JbmRleCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0pLmxlbmd0aCA+IDA7XG4gIH1cbiAgcHVibGljIGVsQ29udGVudDogRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBhcnJMaW5lOiBMaW5lW10gPSBbXTtcbiAgcHJpdmF0ZSBvcHRpb246IGFueSA9IHt9O1xuICBwcml2YXRlIGFyckRhdGFWaWV3OiBEYXRhVmlld1tdID0gW107XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IERlc2dpbmVyVmlldywgcHJpdmF0ZSBrZXlOb2RlOiBhbnksIGRhdGE6IGFueSA9IHt9KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLm9wdGlvbiA9IHRoaXMucGFyZW50Lm1haW4uZ2V0Q29udHJvbE5vZGVCeUtleShrZXlOb2RlKTtcbiAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLm9wdGlvbj8ucHJvcGVydGllcztcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRhdGEuSW5pdERhdGEoeyAuLi5kYXRhLCBuYW1lOiB0aGlzLm9wdGlvbi5uYW1lIH0sIHRoaXMucHJvcGVydGllcyk7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhLkFwcGVuZCgnbm9kZXMnLCB0aGlzLmRhdGEpO1xuICAgIH1cbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtbm9kZScpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9uLmNsYXNzKTtcbiAgICB9XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdub2RlLWlkJywgdGhpcy5HZXRJZCgpKTtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6bm9uZScpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5yZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBnZXRPcHRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uO1xuICB9XG4gIHByaXZhdGUgcmVuZGVyVUkoZGV0YWlsOiBhbnkgPSBudWxsKSB7XG4gICAgaWYgKChkZXRhaWwgJiYgWyd4JywgJ3knXS5pbmNsdWRlcyhkZXRhaWwua2V5KSkpIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuZWxOb2RlLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpKSByZXR1cm47XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgaWYgKHRoaXMuZ2V0T3B0aW9uKCk/LmhpZGVUaXRsZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtbGVmdFwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXRvcFwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWJvdHRvbVwiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1yaWdodFwiPjwvZGl2PlxuICAgIGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS10b3BcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPiR7dGhpcy5vcHRpb24uaWNvbn0gJHt0aGlzLmdldE5hbWUoKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYm9keVwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtYm90dG9tXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXJpZ2h0XCI+PC9kaXY+XG4gICAgYDtcbiAgICB9XG5cbiAgICBjb25zdCBhZGROb2RlRG90ID0gKG51bTogbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZCwgc3RhcnQ6IG51bWJlciwgcXVlcnk6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKG51bSkge1xuICAgICAgICBsZXQgbm9kZVF1ZXJ5ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcihxdWVyeSk7XG4gICAgICAgIGlmIChub2RlUXVlcnkpIHtcbiAgICAgICAgICBub2RlUXVlcnkuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgbm9kZURvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgbm9kZURvdC5jbGFzc0xpc3QuYWRkKCdub2RlLWRvdCcpO1xuICAgICAgICAgICAgbm9kZURvdC5zZXRBdHRyaWJ1dGUoJ25vZGUnLCBgJHtzdGFydCArIGl9YCk7XG4gICAgICAgICAgICBub2RlUXVlcnkuYXBwZW5kQ2hpbGQobm9kZURvdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8ubGVmdCwgMTAwMCwgJy5ub2RlLWxlZnQnKTtcbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LnRvcCwgMjAwMCwgJy5ub2RlLXRvcCcpO1xuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8uYm90dG9tLCAzMDAwLCAnLm5vZGUtYm90dG9tJyk7XG4gICAgYWRkTm9kZURvdCh0aGlzLm9wdGlvbj8uZG90Py5yaWdodCwgNDAwMCwgJy5ub2RlLXJpZ2h0Jyk7XG5cbiAgICB0aGlzLmVsQ29udGVudCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWNvbnRlbnQgLmJvZHknKSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLnBhcmVudC5tYWluLnJlbmRlckh0bWwodGhpcywgdGhpcy5lbENvbnRlbnQpO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICB0aGlzLmFyckRhdGFWaWV3LmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uRGVsZXRlKCkpO1xuICAgIGlmIChpc0Z1bmN0aW9uKHRoaXMub3B0aW9uLnNjcmlwdCkpIHtcbiAgICAgIHRoaXMub3B0aW9uLnNjcmlwdCh7IG5vZGU6IHRoaXMsIGVsTm9kZTogdGhpcy5lbE5vZGUsIG1haW46IHRoaXMucGFyZW50Lm1haW4gfSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmVsQ29udGVudClcbiAgICAgIHRoaXMuYXJyRGF0YVZpZXcgPSBEYXRhVmlldy5CaW5kRWxlbWVudCh0aGlzLmVsQ29udGVudCwgdGhpcy5kYXRhLCB0aGlzLnBhcmVudC5tYWluKTtcbiAgfVxuICBwdWJsaWMgb3Blbkdyb3VwKCkge1xuICAgIGlmICh0aGlzLkNoZWNrS2V5KCdub2RlX2dyb3VwJykpIHtcbiAgICAgIHRoaXMucGFyZW50Lm9wZW5Hcm91cCh0aGlzLkdldElkKCkpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgdXBkYXRlUG9zaXRpb24oeDogYW55LCB5OiBhbnksIGlDaGVjayA9IGZhbHNlKSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICBsZXQgdGVtcHggPSB4O1xuICAgICAgbGV0IHRlbXB5ID0geTtcbiAgICAgIGlmICghaUNoZWNrKSB7XG4gICAgICAgIHRlbXB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICB0ZW1weCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0IC0geCk7XG4gICAgICB9XG4gICAgICBpZiAodGVtcHggIT09IHRoaXMuZ2V0WCgpKSB7XG4gICAgICAgIHRoaXMuc2V0WCh0ZW1weCk7XG4gICAgICB9XG4gICAgICBpZiAodGVtcHkgIT09IHRoaXMuZ2V0WSgpKSB7XG4gICAgICAgIHRoaXMuc2V0WSh0ZW1weSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcnJMaW5lO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmUpIHtcbiAgICB0aGlzLmFyckxpbmUgPSBbLi4udGhpcy5hcnJMaW5lLCBsaW5lXTtcbiAgfVxuICBwdWJsaWMgZ2V0UG9zdGlzaW9uRG90KGluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZT8ucXVlcnlTZWxlY3RvcihgLm5vZGUtZG90W25vZGU9XCIke2luZGV4fVwiXWApO1xuICAgIGlmIChlbERvdCkge1xuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xuICAgICAgbGV0IHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCArIGVsRG90Lm9mZnNldExlZnQgKyAxMCk7XG4gICAgICByZXR1cm4geyB4LCB5IH07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uVXBkYXRlVUkoKTtcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNDbGVhckRhdGEgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMsIGlzQ2xlYXJEYXRhKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5kYXRhLmRlbGV0ZSgpO1xuICAgIGVsc2Uge1xuICAgICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLnJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5SZW1vdmVEYXRhRXZlbnQoKTtcbiAgICB9XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZSgpO1xuICAgIHRoaXMuYXJyTGluZSA9IFtdO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7fSk7XG4gIH1cbiAgcHVibGljIFJlbmRlckxpbmUoKSB7XG4gICAgdGhpcy5nZXREYXRhTGluZSgpLmZvckVhY2goKGl0ZW06IERhdGFGbG93KSA9PiB7XG4gICAgICBsZXQgbm9kZUZyb20gPSB0aGlzO1xuICAgICAgbGV0IG5vZGVUbyA9IHRoaXMucGFyZW50LkdldE5vZGVCeUlkKGl0ZW0uR2V0KCd0bycpKTtcbiAgICAgIGxldCB0b0luZGV4ID0gaXRlbS5HZXQoJ3RvSW5kZXgnKTtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBpdGVtLkdldCgnZnJvbUluZGV4Jyk7XG4gICAgICBuZXcgTGluZShub2RlRnJvbSwgZnJvbUluZGV4LCBub2RlVG8sIHRvSW5kZXgsIGl0ZW0pLlVwZGF0ZVVJKCk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBGbG93Q29yZSwgSU1haW4sIEV2ZW50RW51bSwgUHJvcGVydHlFbnVtLCBTY29wZVJvb3QgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3X0V2ZW50IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3X0V2ZW50XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfVG9vbGJhciB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld19Ub29sYmFyXCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi9Ob2RlSXRlbVwiO1xuXG5leHBvcnQgY29uc3QgWm9vbSA9IHtcbiAgbWF4OiAxLjYsXG4gIG1pbjogMC42LFxuICB2YWx1ZTogMC4xLFxuICBkZWZhdWx0OiAxXG59XG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3IGV4dGVuZHMgRmxvd0NvcmUge1xuXG4gIC8qKlxuICAgKiBHRVQgU0VUIGZvciBEYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0Wm9vbSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd6b29tJyk7XG4gIH1cbiAgcHVibGljIHNldFpvb20odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgnem9vbScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd5Jyk7XG4gIH1cbiAgcHVibGljIHNldFkodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwcml2YXRlIGdyb3VwRGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgbGFzdEdyb3VwTmFtZTogc3RyaW5nID0gXCJcIjtcbiAgcHJpdmF0ZSBnZXREYXRhR3JvdXAoKTogRGF0YUZsb3cge1xuICAgIGlmICh0aGlzLiRsb2NrKSByZXR1cm4gdGhpcy5kYXRhO1xuICAgIC8vIGNhY2hlIGdyb3VwRGF0YVxuICAgIGlmICh0aGlzLmxhc3RHcm91cE5hbWUgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpIHJldHVybiB0aGlzLmdyb3VwRGF0YSA/PyB0aGlzLmRhdGE7XG4gICAgdGhpcy5sYXN0R3JvdXBOYW1lID0gdGhpcy5DdXJyZW50R3JvdXAoKTtcbiAgICBsZXQgZ3JvdXBzID0gdGhpcy5kYXRhLkdldCgnZ3JvdXBzJyk7XG4gICAgdGhpcy5ncm91cERhdGEgPSBncm91cHM/LmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KCdncm91cCcpID09IHRoaXMubGFzdEdyb3VwTmFtZSk/LlswXTtcbiAgICBpZiAoIXRoaXMuZ3JvdXBEYXRhKSB7XG4gICAgICB0aGlzLmdyb3VwRGF0YSA9IG5ldyBEYXRhRmxvdyh0aGlzLm1haW4sIHtcbiAgICAgICAga2V5OiBQcm9wZXJ0eUVudW0uZ3JvdXBDYXZhcyxcbiAgICAgICAgZ3JvdXA6IHRoaXMubGFzdEdyb3VwTmFtZVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRhdGEuQXBwZW5kKCdncm91cHMnLCB0aGlzLmdyb3VwRGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICB9XG4gICAgbGV0IGRhdGFHcm91cCA9IHRoaXMuR2V0RGF0YUJ5SWQodGhpcy5sYXN0R3JvdXBOYW1lKTtcbiAgICBpZiAoZGF0YUdyb3VwKSB7XG4gICAgICBkYXRhR3JvdXAub25TYWZlKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuVXBkYXRlVUkuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICAgICAgICB0aGlzLmNoYW5nZUdyb3VwKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ncm91cERhdGE7XG4gIH1cbiAgcHJpdmF0ZSBncm91cDogYW55W10gPSBbXTtcbiAgcHVibGljIEdldEdyb3VwTmFtZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLmdyb3VwLm1hcCgoaXRlbSkgPT4gKHsgaWQ6IGl0ZW0sIHRleHQ6IHRoaXMuR2V0RGF0YUJ5SWQoaXRlbSk/LkdldCgnbmFtZScpIH0pKSwgeyBpZDogU2NvcGVSb290LCB0ZXh0OiBTY29wZVJvb3QgfV07XG4gIH1cbiAgcHVibGljIEJhY2tHcm91cChpZDogYW55ID0gbnVsbCkge1xuICAgIGxldCBpbmRleCA9IDE7XG4gICAgaWYgKGlkKSB7XG4gICAgICBpbmRleCA9IHRoaXMuZ3JvdXAuaW5kZXhPZihpZCk7XG4gICAgICBpZiAoaW5kZXggPCAwKSBpbmRleCA9IDA7XG4gICAgfVxuICAgIGlmIChpbmRleClcbiAgICAgIHRoaXMuZ3JvdXAuc3BsaWNlKDAsIGluZGV4KTtcbiAgICBlbHNlIHRoaXMuZ3JvdXAgPSBbXTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICB9XG4gIHB1YmxpYyBDdXJyZW50R3JvdXAoKSB7XG4gICAgbGV0IG5hbWUgPSB0aGlzLmdyb3VwPy5bMF07XG4gICAgaWYgKG5hbWUgJiYgbmFtZSAhPSAnJykge1xuICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuICAgIHJldHVybiAncm9vdCc7XG4gIH1cblxuICBwdWJsaWMgQ3VycmVudEdyb3VwRGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQnlJZCh0aGlzLkN1cnJlbnRHcm91cCgpKSA/PyB0aGlzLmRhdGE7XG4gIH1cbiAgcHVibGljIGNoYW5nZUdyb3VwKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5ncm91cENoYW5nZSwge1xuICAgICAgICBncm91cDogdGhpcy5HZXRHcm91cE5hbWUoKVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICB9XG4gIHB1YmxpYyBvcGVuR3JvdXAoaWQ6IGFueSkge1xuICAgIHRoaXMuZ3JvdXAgPSBbaWQsIC4uLnRoaXMuZ3JvdXBdO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLmNoYW5nZUdyb3VwKCk7O1xuICB9XG4gIHByaXZhdGUgbGluZUNob29zZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldExpbmVDaG9vc2Uobm9kZTogTGluZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHRoaXMubGluZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubGluZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkge1xuICAgICAgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRMaW5lQ2hvb3NlKCk6IExpbmUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmxpbmVDaG9vc2U7XG4gIH1cbiAgcHJpdmF0ZSBub2RlczogTm9kZUl0ZW1bXSA9IFtdO1xuICBwcml2YXRlIG5vZGVDaG9vc2U6IE5vZGVJdGVtIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgc2V0Tm9kZUNob29zZShub2RlOiBOb2RlSXRlbSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHRoaXMubm9kZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubm9kZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkge1xuICAgICAgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXRMaW5lQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5ub2RlQ2hvb3NlLmRhdGEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLkN1cnJlbnRHcm91cERhdGEoKSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldE5vZGVDaG9vc2UoKTogTm9kZUl0ZW0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm5vZGVDaG9vc2U7XG4gIH1cbiAgcHVibGljIEFkZE5vZGVJdGVtKGRhdGE6IGFueSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5BZGROb2RlKGRhdGEuR2V0KCdrZXknKSwgZGF0YSk7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUoa2V5Tm9kZTogc3RyaW5nLCBkYXRhOiBhbnkgPSB7fSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5JbnNlcnROb2RlKG5ldyBOb2RlSXRlbSh0aGlzLCBrZXlOb2RlLCBkYXRhKSk7XG4gIH1cbiAgcHVibGljIEluc2VydE5vZGUobm9kZTogTm9kZUl0ZW0pOiBOb2RlSXRlbSB7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlSXRlbSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICB0aGlzLmRhdGEuUmVtb3ZlKCdub2RlcycsIG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBDbGVhck5vZGUoKSB7XG4gICAgdGhpcy5ub2Rlcz8uZm9yRWFjaChpdGVtID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICB9XG4gIHB1YmxpYyBHZXREYXRhQWxsTm9kZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuICh0aGlzLmRhdGE/LkdldCgnbm9kZXMnKSA/PyBbXSk7XG4gIH1cbiAgcHVibGljIEdldERhdGFOb2RlKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQWxsTm9kZSgpLmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KFwiZ3JvdXBcIikgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpO1xuICB9XG4gIC8qKlxuICAgKiBWYXJpYnV0ZVxuICAqL1xuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyBlbFRvb2xiYXI6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyB0b29sYmFyOiBEZXNnaW5lclZpZXdfVG9vbGJhcjtcbiAgcHVibGljICRsb2NrOiBib29sZWFuID0gdHJ1ZTtcbiAgcHJpdmF0ZSB6b29tX2xhc3RfdmFsdWU6IGFueSA9IDE7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZWxOb2RlID0gZWxOb2RlO1xuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubWFpbik7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKHt9LCBwcm9wZXJ0aWVzKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdkZXNnaW5lci12aWV3JylcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5yZW1vdmUoXCJkZXNnaW5lci1jYW52YXNcIik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnZGVzZ2luZXItdmlldycpXG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QuYWRkKFwiZGVzZ2luZXItY2FudmFzXCIpO1xuICAgIHRoaXMuZWxUb29sYmFyLmNsYXNzTGlzdC5hZGQoXCJkZXNnaW5lci10b29sYmFyXCIpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxDYW52YXMpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxUb29sYmFyKTtcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XG4gICAgbmV3IERlc2dpbmVyVmlld19FdmVudCh0aGlzKTtcbiAgICB0aGlzLnRvb2xiYXIgPSBuZXcgRGVzZ2luZXJWaWV3X1Rvb2xiYXIodGhpcyk7XG4gICAgdGhpcy5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5SZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm9uKEV2ZW50RW51bS5zaG93UHJvcGVydHksIChkYXRhOiBhbnkpID0+IHsgbWFpbi5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCBkYXRhKTsgfSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy5PcGVuKGl0ZW0uZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZVZpZXcoeDogYW55LCB5OiBhbnksIHpvb206IGFueSkge1xuICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3h9cHgsICR7eX1weCkgc2NhbGUoJHt6b29tfSlgO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICB0aGlzLnVwZGF0ZVZpZXcodGhpcy5nZXRYKCksIHRoaXMuZ2V0WSgpLCB0aGlzLmdldFpvb20oKSk7XG4gIH1cbiAgcHVibGljIFJlbmRlclVJKGRldGFpbDogYW55ID0ge30pIHtcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgTm9kZUl0ZW0pIHJldHVybjtcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgRGVzZ2luZXJWaWV3KSB7XG4gICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuQ2xlYXJOb2RlKCk7XG4gICAgdGhpcy5HZXREYXRhTm9kZSgpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy5BZGROb2RlSXRlbShpdGVtKTtcbiAgICB9KTtcbiAgICB0aGlzLkdldEFsbE5vZGUoKS5mb3JFYWNoKChpdGVtOiBOb2RlSXRlbSkgPT4ge1xuICAgICAgaXRlbS5SZW5kZXJMaW5lKCk7XG4gICAgfSlcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gIH1cbiAgcHVibGljIE9wZW4oJGRhdGE6IERhdGFGbG93KSB7XG4gICAgaWYgKCRkYXRhID09IHRoaXMuZGF0YSkge1xuICAgICAgdGhpcy5SZW5kZXJVSSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRhdGE/LmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoZGV0YWlsOiBhbnkpID0+IHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIGRldGFpbCkpO1xuICAgIHRoaXMuZGF0YSA9ICRkYXRhO1xuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgKGRldGFpbDogYW55KSA9PiB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCBkZXRhaWwpKTtcbiAgICB0aGlzLiRsb2NrID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0R3JvdXBOYW1lID0gJyc7XG4gICAgdGhpcy5ncm91cERhdGEgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5ncm91cCA9IFtdO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLmNoYW5nZUdyb3VwKCk7XG4gIH1cbiAgcHVibGljIENhbGNYKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudFdpZHRoIC8gKHRoaXMuZWxOb2RlPy5jbGllbnRXaWR0aCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHVibGljIENhbGNZKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudEhlaWdodCAvICh0aGlzLmVsTm9kZT8uY2xpZW50SGVpZ2h0ICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwdWJsaWMgR2V0QWxsTm9kZSgpOiBOb2RlSXRlbVtdIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlcyB8fCBbXTtcbiAgfVxuICBwdWJsaWMgR2V0Tm9kZUJ5SWQoaWQ6IHN0cmluZyk6IE5vZGVJdGVtIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5HZXRBbGxOb2RlKCkuZmlsdGVyKG5vZGUgPT4gbm9kZS5HZXRJZCgpID09IGlkKT8uWzBdO1xuICB9XG5cbiAgcHVibGljIEdldERhdGFCeUlkKGlkOiBzdHJpbmcpOiBEYXRhRmxvdyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLkdldERhdGFBbGxOb2RlKCkuZmlsdGVyKChpdGVtKSA9PiBpdGVtLkdldCgnaWQnKSA9PT0gaWQpPy5bMF07XG4gIH1cbiAgY2hlY2tPbmx5Tm9kZShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiAodGhpcy5tYWluLmdldENvbnRyb2xCeUtleShrZXkpLm9ubHlOb2RlSXRlbSkgJiYgdGhpcy5ub2Rlcy5maWx0ZXIoaXRlbSA9PiBpdGVtLkNoZWNrS2V5KGtleSkpLmxlbmd0aCA+IDA7XG4gIH1cbiAgcHVibGljIHpvb21fcmVmcmVzaChmbGc6IGFueSA9IDApIHtcbiAgICBsZXQgdGVtcF96b29tID0gZmxnID09IDAgPyBab29tLmRlZmF1bHQgOiAodGhpcy5nZXRab29tKCkgKyBab29tLnZhbHVlICogZmxnKTtcbiAgICBpZiAoWm9vbS5tYXggPj0gdGVtcF96b29tICYmIHRlbXBfem9vbSA+PSBab29tLm1pbikge1xuICAgICAgdGhpcy5zZXRYKCh0aGlzLmdldFgoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XG4gICAgICB0aGlzLnNldFkoKHRoaXMuZ2V0WSgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGVtcF96b29tKTtcbiAgICAgIHRoaXMuem9vbV9sYXN0X3ZhbHVlID0gdGVtcF96b29tO1xuICAgICAgdGhpcy5zZXRab29tKHRoaXMuem9vbV9sYXN0X3ZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21faW4oKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMSk7XG4gIH1cbiAgcHVibGljIHpvb21fb3V0KCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKC0xKTtcbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgwKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIEV2ZW50RW51bSwgSU1haW4sIFNjb3BlUm9vdCB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5cbmV4cG9ydCBjbGFzcyBWYXJpYWJsZVZpZXcge1xuICBwcml2YXRlIHZhcmlhYmxlczogRGF0YUZsb3dbXSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy12YXJpYWJsZScpO1xuICAgIHRoaXMubWFpbi5vblNhZmUoRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCAoeyBkYXRhIH06IGFueSkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoKTtcbiAgICB9KTtcbiAgICB0aGlzLm1haW4ub25TYWZlKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKCkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoKTtcbiAgICB9KTtcbiAgICB0aGlzLm1haW4ub25TYWZlKEV2ZW50RW51bS5ncm91cENoYW5nZSwgKCkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoKTtcbiAgICB9KVxuICAgIHRoaXMuUmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIFJlbmRlcigpIHtcbiAgICB0aGlzLnZhcmlhYmxlcyA9IHRoaXMubWFpbi5nZXRWYXJpYWJsZSgpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDx0YWJsZSBib3JkZXI9XCIxXCI+XG4gICAgICAgIDx0aGVhZD5cbiAgICAgICAgICA8dHI+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1uYW1lXCI+TmFtZTwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS10eXBlXCI+VHlwZTwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1zY29wZVwiPlNjb3BlPC90ZD5cbiAgICAgICAgICAgIDx0ZCBjbGFzcz1cInZhcmlhYmxlLWRlZmF1bHRcIj5EZWZhdWx0PC90ZD5cbiAgICAgICAgICAgIDx0ZCBjbGFzcz1cInZhcmlhYmxlLWJ1dHRvblwiPjwvdGQ+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90aGVhZD5cbiAgICAgICAgPHRib2R5PlxuICAgICAgICA8L3Rib2R5PlxuICAgICAgPC90YWJsZT5cbiAgICBgO1xuICAgIGlmICh0aGlzLnZhcmlhYmxlcykge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnZhcmlhYmxlcykge1xuICAgICAgICBuZXcgVmFyaWFibGVJdGVtKGl0ZW0sIHRoaXMpLlJlbmRlclNjb3BlKHRoaXMubWFpbi5nZXRHcm91cEN1cnJlbnQoKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5jbGFzcyBWYXJpYWJsZUl0ZW0ge1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuICBwcml2YXRlIG5hbWVJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICBwcml2YXRlIHR5cGVJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgcHJpdmF0ZSBzY29wZUlucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuICBwcml2YXRlIHZhbHVlRGVmYXVsdElucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHZhcmlhYmxlOiBEYXRhRmxvdywgcHJpdmF0ZSBwYXJlbnQ6IFZhcmlhYmxlVmlldykge1xuICAgICh0aGlzLm5hbWVJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5HZXQoJ25hbWUnKTtcbiAgICAodGhpcy52YWx1ZURlZmF1bHRJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5HZXQoJ2luaXRhbFZhbHVlJykgPz8gJyc7XG4gICAgKHRoaXMudHlwZUlucHV0IGFzIGFueSkudmFsdWUgPSB0aGlzLnZhcmlhYmxlLkdldCgndHlwZScpID8/ICcnO1xuICAgIGZvciAobGV0IGl0ZW0gb2YgWyd0ZXh0JywgJ251bWJlcicsICdkYXRlJywgJ29iamVjdCddKSB7XG4gICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICBvcHRpb24udGV4dCA9IGl0ZW07XG4gICAgICBvcHRpb24udmFsdWUgPSBpdGVtO1xuICAgICAgdGhpcy50eXBlSW5wdXQuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgICB9XG4gICAgbGV0IG5hbWVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIG5hbWVDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy5uYW1lSW5wdXQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG5hbWVDb2x1bW4pO1xuICAgIHRoaXMubmFtZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnbmFtZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLm5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnbmFtZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcblxuICAgIGxldCB0eXBlQ29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICB0eXBlQ29sdW1uLmFwcGVuZENoaWxkKHRoaXMudHlwZUlucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0eXBlQ29sdW1uKTtcbiAgICB0aGlzLnR5cGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgndHlwZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgICBsZXQgc2NvcGVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIHNjb3BlQ29sdW1uLmFwcGVuZENoaWxkKHRoaXMuc2NvcGVJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoc2NvcGVDb2x1bW4pO1xuXG5cbiAgICBsZXQgdmFsdWVEZWZhdWx0Q29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICB2YWx1ZURlZmF1bHRDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy52YWx1ZURlZmF1bHRJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodmFsdWVEZWZhdWx0Q29sdW1uKTtcbiAgICB0aGlzLnZhbHVlRGVmYXVsdElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmFyaWFibGUuU2V0KCdpbml0YWxWYWx1ZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLnZhbHVlRGVmYXVsdElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnaW5pdGFsVmFsdWUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBsZXQgYnV0dG9uUmVtb3ZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYnV0dG9uUmVtb3ZlLmlubmVySFRNTCA9IGAtYDtcbiAgICBidXR0b25SZW1vdmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBwYXJlbnQubWFpbi5yZW1vdmVWYXJpYWJsZSh2YXJpYWJsZSk7XG4gICAgfSk7XG4gICAgbGV0IGJ1dHRvblJlbW92ZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgYnV0dG9uUmVtb3ZlQ29sdW1uLmFwcGVuZENoaWxkKGJ1dHRvblJlbW92ZSk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoYnV0dG9uUmVtb3ZlQ29sdW1uKTtcblxuICAgIHBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcigndGFibGUgdGJvZHknKT8uYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuXG4gIH1cbiAgUmVuZGVyU2NvcGUoZ3JvdXA6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLnNjb3BlSW5wdXQuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIGdyb3VwKSB7XG4gICAgICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgICAgb3B0aW9uLnRleHQgPSBpdGVtLnRleHQ7XG4gICAgICAgIG9wdGlvbi52YWx1ZSA9IGl0ZW0uaWQ7XG4gICAgICAgIHRoaXMuc2NvcGVJbnB1dC5wcmVwZW5kKG9wdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgICh0aGlzLnNjb3BlSW5wdXQgYXMgYW55KS52YWx1ZSA9IHRoaXMudmFyaWFibGUuR2V0KCdzY29wZScpO1xuICAgIHRoaXMuc2NvcGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnc2NvcGUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIFRvb2xib3hWaWV3IHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy10b29sYm94ZicpO1xuICAgIHRoaXMuUmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIFJlbmRlcigpIHtcbiAgICBsZXQgY29udHJvbHMgPSB0aGlzLm1haW4uZ2V0Q29udHJvbEFsbCgpO1xuICAgIE9iamVjdC5rZXlzKGNvbnRyb2xzKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGxldCBub2RlSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XG4gICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScsIGl0ZW0pO1xuICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7Y29udHJvbHNbaXRlbV0uaWNvbn0gPHNwYW4+JHtjb250cm9sc1tpdGVtXS5uYW1lfTwvc3BhbmA7XG4gICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLmRyYWdTdGFydC5iaW5kKHRoaXMpKVxuICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsIHRoaXMuZHJhZ2VuZC5iaW5kKHRoaXMpKVxuICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQobm9kZUl0ZW0pO1xuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgZHJhZ2VuZChlOiBhbnkpIHtcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgZHJhZ1N0YXJ0KGU6IGFueSkge1xuICAgIGxldCBrZXkgPSBlLnRhcmdldC5jbG9zZXN0KFwiLm5vZGUtaXRlbVwiKS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgIHRoaXMubWFpbi5zZXRDb250cm9sQ2hvb3NlKGtleSk7XG4gICAgaWYgKGUudHlwZSAhPT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJub2RlXCIsIGtleSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBFdmVudEVudW0sIElNYWluLCBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9qZWN0VmlldyB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvamVjdCcpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXIoKSB7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgbGV0IHByb2plY3RzID0gdGhpcy5tYWluLmdldFByb2plY3RBbGwoKTtcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0LWlkJywgaXRlbS5HZXQoJ2lkJykpO1xuICAgICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgfSk7XG4gICAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV9uYW1lYCwgKCkgPT4ge1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLm1haW4uY2hlY2tQcm9qZWN0T3BlbihpdGVtKSkge1xuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1haW4uc2V0UHJvamVjdE9wZW4oaXRlbSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlPy5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEb2NrQmFzZSB7XHJcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBwcm90ZWN0ZWQgZWxDb250ZW50OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJ0RvY2tCYXNlJztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBCb3hJbmZvKHRpdGxlOiBzdHJpbmcsICRjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd2cy1ib3hpbmZvJyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ib3hpbmZvJyk7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInZzLWJveGluZm9faGVhZGVyXCI+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX3RpdGxlXCI+JHt0aXRsZX08L3NwYW4+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX2J1dHRvblwiPjwvc3Bhbj48L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJ2cy1ib3hpbmZvX2NvbnRlbnRcIj48L2Rpdj5gO1xyXG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19jb250ZW50Jyk7XHJcbiAgICBpZiAoJGNhbGxiYWNrKSB7XHJcbiAgICAgICRjYWxsYmFjayh0aGlzLmVsQ29udGVudCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IFRvb2xib3hWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sRG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtY29udHJvbCcpO1xuICAgIHRoaXMuQm94SW5mbygnQ29udHJvbCcsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbmV3IFRvb2xib3hWaWV3KG5vZGUsIHRoaXMubWFpbik7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluLCBnZXRUaW1lIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IFZhcmlhYmxlVmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVmFyaWFibGVEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy12YXJpYWJsZScpO1xuICAgIHRoaXMuQm94SW5mbygnVmFyaWFibGUnLCAobm9kZTogSFRNTEVsZW1lbnQpID0+IHtcbiAgICAgIG5ldyBWYXJpYWJsZVZpZXcobm9kZSwgbWFpbik7XG4gICAgfSk7XG4gICAgbGV0ICRub2RlUmlnaHQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2hlYWRlciAudnMtYm94aW5mb19idXR0b24nKTtcbiAgICBpZiAoJG5vZGVSaWdodCkge1xuICAgICAgJG5vZGVSaWdodC5pbm5lckhUTUwgPSBgYDtcbiAgICAgIGxldCBidXR0b25OZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbk5ldyk7XG4gICAgICBidXR0b25OZXcuaW5uZXJIVE1MID0gYE5ldyBWYXJpYWJsZWA7XG4gICAgICBidXR0b25OZXcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubWFpbi5uZXdWYXJpYWJsZSgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBkb3dubG9hZE9iamVjdEFzSnNvbiwgZ2V0VGltZSwgcmVhZEZpbGVMb2NhbCB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5pbXBvcnQgeyBQcm9qZWN0VmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9Qcm9qZWN0Vmlld1wiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgUHJvamVjdERvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb2plY3QnKTtcbiAgICB0aGlzLkJveEluZm8oJ1Byb2plY3QnLCAoZWxDb250ZW50OiBhbnkpID0+IHtcbiAgICAgIG5ldyBQcm9qZWN0VmlldyhlbENvbnRlbnQsIG1haW4pO1xuICAgIH0pO1xuICAgIGxldCAkbm9kZVJpZ2h0OiBIVE1MRWxlbWVudCB8IG51bGwgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19oZWFkZXIgLnZzLWJveGluZm9fYnV0dG9uJyk7XG4gICAgaWYgKCRub2RlUmlnaHQpIHtcbiAgICAgICRub2RlUmlnaHQuaW5uZXJIVE1MID0gYGA7XG4gICAgICBsZXQgYnV0dG9uTmV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidXR0b25OZXcuaW5uZXJIVE1MID0gYE5ld2A7XG4gICAgICBidXR0b25OZXcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLm1haW4ubmV3UHJvamVjdCgnJykpO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uTmV3KTtcblxuICAgICAgbGV0IGJ1dHRvbkV4cG9ydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uRXhwb3J0LmlubmVySFRNTCA9IGBFeHBvcnRgO1xuICAgICAgYnV0dG9uRXhwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gZG93bmxvYWRPYmplY3RBc0pzb24odGhpcy5tYWluLmV4cG9ydEpzb24oKSwgYHZzLXNvbHV0aW9uLSR7Z2V0VGltZSgpfWApKTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbkV4cG9ydCk7XG5cbiAgICAgIGxldCBidXR0b25JbXBvcnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ1dHRvbkltcG9ydC5pbm5lckhUTUwgPSBgSW1wb3J0YDtcbiAgICAgIGJ1dHRvbkltcG9ydC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgcmVhZEZpbGVMb2NhbCgocnM6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChycykge1xuICAgICAgICAgICAgdGhpcy5tYWluLmltcG9ydEpzb24oSlNPTi5wYXJzZShycykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbkltcG9ydCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhVmlldywgRGF0YUZsb3csIEV2ZW50RW51bSwgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xyXG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUHJvcGVydHlEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xyXG4gIHByaXZhdGUgbGFzdERhdGE6IERhdGFGbG93IHwgdW5kZWZpbmVkO1xyXG4gIHByaXZhdGUgaGlkZUtleXM6IHN0cmluZ1tdID0gWydsaW5lcycsICdub2RlcycsICdncm91cHMnLCAndmFyaWFibGUnLCAneCcsICd5JywgJ3pvb20nXTtcclxuICBwcml2YXRlIHNvcnRLZXlzOiBzdHJpbmdbXSA9IFsnaWQnLCAna2V5JywgJ25hbWUnLCAnZ3JvdXAnXTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xyXG5cclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb3BlcnR5Jyk7XHJcbiAgICB0aGlzLkJveEluZm8oJ1Byb3BlcnR5JywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XHJcbiAgICAgIG1haW4ub24oRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgKGRldGFpbDogYW55KSA9PiB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJVSShub2RlLCBkZXRhaWwuZGF0YSk7XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyVUkobm9kZTogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGFGbG93KSB7XHJcbiAgICBpZiAodGhpcy5sYXN0RGF0YSA9PSBkYXRhKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMubGFzdERhdGEgPSBkYXRhO1xyXG4gICAgbm9kZS5pbm5lckhUTUwgPSAnJztcclxuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSBkYXRhLmdldFByb3BlcnRpZXMoKTtcclxuICAgIHRoaXMuc29ydEtleXMuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKHRoaXMuaGlkZUtleXMuaW5jbHVkZXMoa2V5KSB8fCAhcHJvcGVydGllc1trZXldKSByZXR1cm47XHJcbiAgICAgIGxldCBwcm9wZXJ0eUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWl0ZW0nKTtcclxuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlMYWJlbC5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS1sYWJlbCcpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmlubmVySFRNTCA9IGtleTtcclxuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlWYWx1ZS5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS12YWx1ZScpO1xyXG4gICAgICBEYXRhVmlldy5CaW5kRWxlbWVudChwcm9wZXJ0eVZhbHVlLCBkYXRhLCB0aGlzLm1haW4sIGtleSk7XHJcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eUxhYmVsKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5VmFsdWUpO1xyXG4gICAgICBub2RlLmFwcGVuZENoaWxkKHByb3BlcnR5SXRlbSk7XHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmhpZGVLZXlzLmluY2x1ZGVzKGtleSkgfHwgdGhpcy5zb3J0S2V5cy5pbmNsdWRlcyhrZXkpKSByZXR1cm47XHJcbiAgICAgIGxldCBwcm9wZXJ0eUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWl0ZW0nKTtcclxuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlMYWJlbC5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS1sYWJlbCcpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmlubmVySFRNTCA9IGtleTtcclxuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlWYWx1ZS5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS12YWx1ZScpO1xyXG4gICAgICBEYXRhVmlldy5CaW5kRWxlbWVudChwcm9wZXJ0eVZhbHVlLCBkYXRhLCB0aGlzLm1haW4sIGtleSk7XHJcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eUxhYmVsKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5VmFsdWUpO1xyXG4gICAgICBub2RlLmFwcGVuZENoaWxkKHByb3BlcnR5SXRlbSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFZpZXdEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwcml2YXRlIHZpZXc6IERlc2dpbmVyVmlldyB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG5cbiAgICB0aGlzLnZpZXcgPSBuZXcgRGVzZ2luZXJWaWV3KHRoaXMuZWxOb2RlLCBtYWluKTtcblxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiwgRG9ja0VudW0gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xyXG5pbXBvcnQgeyBDb250cm9sRG9jayB9IGZyb20gXCIuL0NvbnRyb2xEb2NrXCI7XHJcbmltcG9ydCB7IFZhcmlhYmxlRG9jayB9IGZyb20gXCIuL1ZhcmlhYmxlRG9ja1wiO1xyXG5pbXBvcnQgeyBQcm9qZWN0RG9jayB9IGZyb20gXCIuL1Byb2plY3REb2NrXCI7XHJcbmltcG9ydCB7IFByb3BlcnR5RG9jayB9IGZyb20gXCIuL1Byb3BlcnR5RG9ja1wiO1xyXG5pbXBvcnQgeyBWaWV3RG9jayB9IGZyb20gXCIuL1ZpZXdEb2NrXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRG9ja01hbmFnZXIge1xyXG4gIHByaXZhdGUgJGRvY2tNYW5hZ2VyOiBhbnkgPSB7fTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHsgfVxyXG4gIHB1YmxpYyByZXNldCgpIHtcclxuICAgIHRoaXMuJGRvY2tNYW5hZ2VyID0ge307XHJcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgQ29udHJvbERvY2spO1xyXG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLmxlZnQsIFByb2plY3REb2NrKTtcclxuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5yaWdodCwgUHJvcGVydHlEb2NrKTtcclxuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS52aWV3LCBWaWV3RG9jayk7XHJcbiAgICAvLyAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnRvcCwgVGFiRG9jayk7XHJcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0uYm90dG9tLCBWYXJpYWJsZURvY2spO1xyXG4gICAgdGhpcy5SZW5kZXJVSSgpO1xyXG4gIH1cclxuICBwdWJsaWMgYWRkRG9jaygka2V5OiBzdHJpbmcsICR2aWV3OiBhbnkpIHtcclxuICAgIGlmICghdGhpcy4kZG9ja01hbmFnZXJbJGtleV0pXHJcbiAgICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gW107XHJcbiAgICB0aGlzLiRkb2NrTWFuYWdlclska2V5XSA9IFsuLi50aGlzLiRkb2NrTWFuYWdlclska2V5XSwgJHZpZXddO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIFJlbmRlclVJKCkge1xyXG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gYFxyXG4gICAgICA8ZGl2IGNsYXNzPVwidnMtbGVmdCB2cy1kb2NrXCI+PC9kaXY+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1jb250ZW50XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXRvcCB2cy1kb2NrXCI+PC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXZpZXcgdnMtZG9ja1wiPjwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy1ib3R0b20gdnMtZG9ja1wiPjwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cInZzLXJpZ2h0IHZzLWRvY2tcIj48L2Rpdj5cclxuICAgIGA7XHJcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRkb2NrTWFuYWdlcikuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgbGV0IHF1ZXJ5U2VsZWN0b3IgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAuJHtrZXl9YCk7XHJcbiAgICAgIGlmIChxdWVyeVNlbGVjdG9yKSB7XHJcbiAgICAgICAgdGhpcy4kZG9ja01hbmFnZXJba2V5XS5mb3JFYWNoKCgkaXRlbTogYW55KSA9PiB7XHJcbiAgICAgICAgICBuZXcgJGl0ZW0ocXVlcnlTZWxlY3RvciwgdGhpcy5tYWluKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiZXhwb3J0IGNvbnN0IENvbnRyb2wgPSB7XG4gIG5vZGVfYmVnaW46IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtcGxheVwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ0JlZ2luJyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgY2xhc3M6ICcnLFxuICAgIGh0bWw6ICcnLFxuICAgIGRvdDoge1xuICAgICAgdG9wOiAwLFxuICAgICAgcmlnaHQ6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgYm90dG9tOiAxLFxuICAgIH0sXG4gICAgb25seU5vZGU6IHRydWVcbiAgfSxcbiAgbm9kZV9lbmQ6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtc3RvcFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ0VuZCcsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6ICcnLFxuICAgIGRvdDoge1xuICAgICAgbGVmdDogMCxcbiAgICAgIHRvcDogMSxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgYm90dG9tOiAwLFxuICAgIH0sXG4gICAgb25seU5vZGU6IHRydWVcbiAgfSxcbiAgbm9kZV9pZjoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1lcXVhbHNcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdJZicsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6ICc8ZGl2PmNvbmRpdGlvbjo8YnIvPjxpbnB1dCBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cImNvbmRpdGlvblwiLz48L2Rpdj4nLFxuICAgIHNjcmlwdDogYGAsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH1cbiAgICB9LFxuICAgIG91dHB1dDogMlxuICB9LFxuICBub2RlX2dyb3VwOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ0dyb3VwJyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwIG5vZGUtZm9ybS1jb250cm9sXCI+R288L2J1dHRvbj48L2Rpdj4nLFxuICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4geyBub2RlLm9wZW5Hcm91cCgpIH0pO1xuICAgIH0sXG4gICAgcHJvcGVydGllczoge30sXG4gICAgb3V0cHV0OiAyXG4gIH0sXG4gIG5vZGVfb3B0aW9uOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ09wdGlvbicsXG4gICAgZG90OiB7XG4gICAgICB0b3A6IDEsXG4gICAgICByaWdodDogMCxcbiAgICAgIGxlZnQ6IDEsXG4gICAgICBib3R0b206IDAsXG4gICAgfSxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogYFxuICAgIDxkaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDFcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAyXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwM1wiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDRcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDA1XCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICBgLFxuICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4geyBub2RlLm9wZW5Hcm91cCgpIH0pO1xuICAgIH0sXG4gICAgcHJvcGVydGllczoge30sXG4gICAgb3V0cHV0OiAyXG4gIH0sXG4gIG5vZGVfcHJvamVjdDoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdQcm9qZWN0JyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxzZWxlY3QgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJwcm9qZWN0XCI+PC9zZWxlY3Q+PC9kaXY+JyxcbiAgICBzY3JpcHQ6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcblxuICAgIH0sXG4gICAgcHJvcGVydGllczoge1xuICAgICAgcHJvamVjdDoge1xuICAgICAgICBrZXk6IFwicHJvamVjdFwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBzZWxlY3Q6IHRydWUsXG4gICAgICAgIGRhdGFTZWxlY3Q6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgICAgICByZXR1cm4gbWFpbi5nZXRQcm9qZWN0QWxsKCkubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHZhbHVlOiBpdGVtLkdldCgnaWQnKSxcbiAgICAgICAgICAgICAgdGV4dDogaXRlbS5HZXQoJ25hbWUnKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICBzY3JpcHQ6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcblxuICAgICAgICB9LFxuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfVxuICAgIH0sXG4gIH0sXG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgSU1haW4sIGNvbXBhcmVTb3J0LCBFdmVudEVudW0sIFByb3BlcnR5RW51bSwgRXZlbnRGbG93LCBnZXRUaW1lLCBTY29wZVJvb3QgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IENvbnRyb2wgfSBmcm9tIFwiLi9jb250cm9sXCI7XG5cbmV4cG9ydCBjbGFzcyBTeXN0ZW1CYXNlIGltcGxlbWVudHMgSU1haW4ge1xuICBwcml2YXRlICRkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgcHJpdmF0ZSAkcHJvamVjdE9wZW46IERhdGFGbG93IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlICRwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSAkY29udHJvbDogYW55ID0ge307XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3cgPSBuZXcgRXZlbnRGbG93KCk7XG4gIHByaXZhdGUgJGNvbnRyb2xDaG9vc2U6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlICRjaGVja09wdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlICRncm91cDogYW55O1xuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XG4gICAgLy9zZXQgcHJvamVjdFxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLnNvbHV0aW9uXSA9IHtcbiAgICAgIGlkOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgfSxcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBQcm9wZXJ0eUVudW0uc29sdXRpb25cbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGBzb2x1dGlvbi0ke2dldFRpbWUoKX1gLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHByb2plY3RzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5saW5lXSA9IHtcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubGluZVxuICAgICAgfSxcbiAgICAgIGZyb206IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIGZyb21JbmRleDoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgdG86IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHRvSW5kZXg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfVxuICAgIH07XG4gICAgLy9zZXQgcHJvamVjdFxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLm1haW5dID0ge1xuICAgICAgaWQ6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBgRmxvdy0ke2dldFRpbWUoKX1gLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubWFpblxuICAgICAgfSxcbiAgICAgIHZhcmlhYmxlOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgZ3JvdXBzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgbm9kZXM6IHtcbiAgICAgICAgZGVmYXVsdDogW11cbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLmdyb3VwQ2F2YXNdID0ge1xuICAgICAga2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFByb3BlcnR5RW51bS5ncm91cENhdmFzXG4gICAgICB9LFxuICAgICAgZ3JvdXA6IHtcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgICB4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB5OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB6b29tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgfVxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLnZhcmlhYmxlXSA9IHtcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0udmFyaWFibGVcbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGB2YXIke2dldFRpbWUoKX1gXG4gICAgICB9LFxuICAgICAgdHlwZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiAndGV4dCdcbiAgICAgIH0sXG4gICAgICBzY29wZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBTY29wZVJvb3RcbiAgICAgIH0sXG4gICAgICBpbml0YWxWYWx1ZToge1xuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfSxcbiAgICB9XG4gICAgdGhpcy5vblNhZmUoRXZlbnRFbnVtLmdyb3VwQ2hhbmdlLCAoeyBncm91cCB9OiBhbnkpID0+IHtcbiAgICAgIHRoaXMuJGdyb3VwID0gZ3JvdXA7XG4gICAgfSlcbiAgfVxuICBuZXdTb2x1dGlvbigkbmFtZTogc3RyaW5nID0gJycpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Tb2x1dGlvbih7IG5hbWU6ICRuYW1lIH0pO1xuICB9XG4gIG9wZW5Tb2x1dGlvbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy4kZGF0YS5Jbml0RGF0YSgkZGF0YSwgdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5zb2x1dGlvbikpO1xuICAgIHRoaXMub3BlblByb2plY3QodGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJyk/LlswXSA/PyB7fSk7XG4gIH1cbiAgcmVtb3ZlVmFyaWFibGUodmFyaWJhbGU6IERhdGFGbG93KTogdm9pZCB7XG4gICAgdGhpcy4kcHJvamVjdE9wZW4/LlJlbW92ZSgndmFyaWFibGUnLCB2YXJpYmFsZSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHsgZGF0YTogdmFyaWJhbGUgfSk7XG4gIH1cbiAgYWRkVmFyaWFibGUoKTogRGF0YUZsb3cge1xuICAgIGxldCB2YXJpYmFsZSA9IG5ldyBEYXRhRmxvdyh0aGlzLCB7IGtleTogUHJvcGVydHlFbnVtLnZhcmlhYmxlIH0pO1xuICAgIHRoaXMuJHByb2plY3RPcGVuPy5BcHBlbmQoJ3ZhcmlhYmxlJywgdmFyaWJhbGUpO1xuICAgIHJldHVybiB2YXJpYmFsZTtcbiAgfVxuICBuZXdWYXJpYWJsZSgpOiBEYXRhRmxvdyB7XG4gICAgbGV0IHZhcmliYWxlID0gdGhpcy5hZGRWYXJpYWJsZSgpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCB7IGRhdGE6IHZhcmliYWxlIH0pO1xuICAgIHJldHVybiB2YXJpYmFsZTtcbiAgfVxuICBnZXRWYXJpYWJsZSgpOiBEYXRhRmxvd1tdIHtcbiAgICBsZXQgYXJyOiBhbnkgPSBbXTtcbiAgICBpZiAodGhpcy4kcHJvamVjdE9wZW4pIHtcbiAgICAgIGFyciA9IHRoaXMuJHByb2plY3RPcGVuLkdldChcInZhcmlhYmxlXCIpO1xuICAgICAgaWYgKCFhcnIpIHtcbiAgICAgICAgYXJyID0gW107XG4gICAgICAgIHRoaXMuJHByb2plY3RPcGVuLlNldCgndmFyaWFibGUnLCBhcnIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyLmZpbHRlcigoaXRlbTogYW55KSA9PiB0aGlzLmdldEdyb3VwQ3VycmVudCgpLmZpbmRJbmRleCgoX2dyb3VwOiBhbnkpID0+IF9ncm91cC5pZCA9PSBpdGVtLkdldCgnc2NvcGUnKSkgPiAtMSk7XG4gIH1cbiAgZ2V0R3JvdXBDdXJyZW50KCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuJGdyb3VwID8/IFtdO1xuICB9XG4gIGV4cG9ydEpzb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEudG9Kc29uKCk7XG4gIH1cbiAgcHVibGljIGNoZWNrSW5pdE9wdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kY2hlY2tPcHRpb247XG4gIH1cbiAgaW5pdE9wdGlvbihvcHRpb246IGFueSwgaXNEZWZhdWx0OiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuJGNoZWNrT3B0aW9uID0gdHJ1ZTtcbiAgICAvLyBzZXQgY29udHJvbFxuICAgIHRoaXMuJGNvbnRyb2wgPSBpc0RlZmF1bHQgPyB7IC4uLm9wdGlvbj8uY29udHJvbCB8fCB7fSwgLi4uQ29udHJvbCB9IDogeyAuLi5vcHRpb24/LmNvbnRyb2wgfHwge30gfTtcbiAgICBsZXQgY29udHJvbFRlbXA6IGFueSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMuJGNvbnRyb2wpLm1hcCgoa2V5KSA9PiAoeyAuLi50aGlzLiRjb250cm9sW2tleV0sIGtleSwgc29ydDogKHRoaXMuJGNvbnRyb2xba2V5XS5zb3J0ID09PSB1bmRlZmluZWQgPyA5OTk5OSA6IHRoaXMuJGNvbnRyb2xba2V5XS5zb3J0KSB9KSkuc29ydChjb21wYXJlU29ydCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICBjb250cm9sVGVtcFtpdGVtLmtleV0gPSB7XG4gICAgICAgIGRvdDoge1xuICAgICAgICAgIGxlZnQ6IDEsXG4gICAgICAgICAgdG9wOiAxLFxuICAgICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICAgIGJvdHRvbTogMSxcbiAgICAgICAgfSxcbiAgICAgICAgLi4uaXRlbVxuICAgICAgfTtcbiAgICAgIHRoaXMuJHByb3BlcnRpZXNbYCR7aXRlbS5rZXl9YF0gPSB7XG4gICAgICAgIC4uLihpdGVtLnByb3BlcnRpZXMgfHwge30pLFxuICAgICAgICBpZDoge1xuICAgICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgICB9LFxuICAgICAgICBrZXk6IHtcbiAgICAgICAgICBkZWZhdWx0OiBpdGVtLmtleVxuICAgICAgICB9LFxuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgZGVmYXVsdDogaXRlbS5rZXksXG4gICAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgeDoge1xuICAgICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgICAgfSxcbiAgICAgICAgeToge1xuICAgICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgICAgfSxcbiAgICAgICAgZ3JvdXA6IHtcbiAgICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgICB9LFxuICAgICAgICBsaW5lczoge1xuICAgICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICB0aGlzLiRjb250cm9sID0gY29udHJvbFRlbXA7XG4gIH1cbiAgcmVuZGVySHRtbChub2RlOiBOb2RlSXRlbSwgZWxQYXJlbnQ6IEVsZW1lbnQpIHtcbiAgICBlbFBhcmVudC5pbm5lckhUTUwgPSBub2RlLmdldE9wdGlvbigpPy5odG1sO1xuICB9XG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb250cm9sQWxsKCkge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sID8/IHt9O1xuICB9XG4gIGdldFByb2plY3RBbGwoKTogYW55W10ge1xuICAgIHJldHVybiB0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKSA/PyBbXTtcbiAgfVxuICBpbXBvcnRKc29uKGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMub3BlblNvbHV0aW9uKGRhdGEpO1xuICB9XG4gIHNldFByb2plY3RPcGVuKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAodGhpcy4kcHJvamVjdE9wZW4gIT0gJGRhdGEpIHtcbiAgICAgIHRoaXMuJHByb2plY3RPcGVuID0gJGRhdGE7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAgZGF0YTogJGRhdGFcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCB7XG4gICAgICAgIGRhdGE6ICRkYXRhXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB7XG4gICAgICAgIGRhdGE6ICRkYXRhXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgY2hlY2tQcm9qZWN0T3BlbigkZGF0YTogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuJHByb2plY3RPcGVuID09ICRkYXRhO1xuICB9XG4gIG5ld1Byb2plY3QoKTogdm9pZCB7XG4gICAgdGhpcy5vcGVuUHJvamVjdCh7fSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0ubmV3UHJvamVjdCwge30pO1xuICB9XG4gIG9wZW5Qcm9qZWN0KCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICBsZXQgJHByb2plY3Q6IGFueSA9IG51bGw7XG4gICAgaWYgKCRkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICRwcm9qZWN0ID0gdGhpcy5nZXRQcm9qZWN0QnlJZCgkZGF0YS5HZXQoJ2lkJykpO1xuICAgICAgaWYgKCEkcHJvamVjdCkge1xuICAgICAgICAkcHJvamVjdCA9ICRkYXRhO1xuICAgICAgICB0aGlzLiRkYXRhLkFwcGVuZCgncHJvamVjdHMnLCAkcHJvamVjdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICRwcm9qZWN0ID0gbmV3IERhdGFGbG93KHRoaXMpO1xuICAgICAgJHByb2plY3QuSW5pdERhdGEoJGRhdGEsIHRoaXMuZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubWFpbikpO1xuICAgICAgdGhpcy4kZGF0YS5BcHBlbmQoJ3Byb2plY3RzJywgJHByb2plY3QpO1xuICAgIH1cbiAgICB0aGlzLnNldFByb2plY3RPcGVuKCRwcm9qZWN0KTtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdEJ5SWQoJGlkOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJykuZmlsdGVyKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS5HZXQoJ2lkJykgPT09ICRpZCk/LlswXTtcbiAgfVxuICBzZXRDb250cm9sQ2hvb3NlKGtleTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuJGNvbnRyb2xDaG9vc2UgPSBrZXk7XG4gIH1cbiAgZ2V0Q29udHJvbENob29zZSgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbENob29zZTtcbiAgfVxuICBnZXRDb250cm9sQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbFtrZXldIHx8IHt9O1xuICB9XG4gIGdldENvbnRyb2xOb2RlQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy5nZXRDb250cm9sQnlLZXkoa2V5KSxcbiAgICAgIHByb3BlcnRpZXM6IHRoaXMuZ2V0UHJvcGVydHlCeUtleShgJHtrZXl9YClcbiAgICB9XG4gIH1cbiAgZ2V0UHJvcGVydHlCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLiRwcm9wZXJ0aWVzW2tleV07XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSAnLi9jb3JlL2luZGV4JztcbmltcG9ydCB7IERvY2tNYW5hZ2VyIH0gZnJvbSAnLi9kb2NrL0RvY2tNYW5hZ2VyJztcbmltcG9ydCB7IFN5c3RlbUJhc2UgfSBmcm9tICcuL3N5c3RlbXMvU3lzdGVtQmFzZSc7XG5leHBvcnQgY2xhc3MgVmlzdWFsRmxvdyB7XG4gIHByaXZhdGUgbWFpbjogSU1haW4gfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgJGRvY2tNYW5hZ2VyOiBEb2NrTWFuYWdlcjtcbiAgcHVibGljIGdldERvY2tNYW5hZ2VyKCk6IERvY2tNYW5hZ2VyIHtcbiAgICByZXR1cm4gdGhpcy4kZG9ja01hbmFnZXI7XG4gIH1cbiAgcHVibGljIHNldE9wdGlvbihkYXRhOiBhbnksIGlzRGVmYXVsdDogYm9vbGVhbiA9IHRydWUpIHtcbiAgICB0aGlzLm1haW4/LmluaXRPcHRpb24oZGF0YSwgaXNEZWZhdWx0KTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlci5yZXNldCgpO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG1haW46IElNYWluIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5tYWluID0gbWFpbiA/PyBuZXcgU3lzdGVtQmFzZSgpO1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ3ZzLWNvbnRhaW5lcicpO1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ3ZzLWNvbnRhaW5lcicpO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyID0gbmV3IERvY2tNYW5hZ2VyKHRoaXMuY29udGFpbmVyLCB0aGlzLm1haW4pO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyLnJlc2V0KCk7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/Lm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/Lm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMubWFpbj8ucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/LmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgZ2V0TWFpbigpOiBJTWFpbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubWFpbjtcbiAgfVxuICBuZXdTb2x1dGlvbigkbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm5ld1NvbHV0aW9uKCRuYW1lKTtcbiAgfVxuICBvcGVuU29sdXRpb24oJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5vcGVuU29sdXRpb24oJGRhdGEpO1xuICB9XG4gIG5ld1Byb2plY3QoJG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5uZXdQcm9qZWN0KCRuYW1lKTtcbiAgfVxuICBvcGVuUHJvamVjdCgkbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm9wZW5Qcm9qZWN0KCRuYW1lKTtcbiAgfVxuICBnZXRQcm9qZWN0QWxsKCk6IGFueVtdIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRNYWluKCk/LmdldFByb2plY3RBbGwoKTtcbiAgfVxuICBzZXRQcm9qZWN0T3BlbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/LnNldFByb2plY3RPcGVuKCRkYXRhKTtcbiAgfVxuICBpbXBvcnRKc29uKGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5pbXBvcnRKc29uKGRhdGEpO1xuICB9XG4gIGV4cG9ydEpzb24oKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5nZXRNYWluKCk/LmV4cG9ydEpzb24oKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IFN5c3RlbUJhc2UgfSBmcm9tIFwiLi9TeXN0ZW1CYXNlXCI7XG5leHBvcnQgY2xhc3MgU3lzdGVtVnVlIGV4dGVuZHMgU3lzdGVtQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlbmRlcjogYW55KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICByZW5kZXJIdG1sKG5vZGU6IE5vZGVJdGVtLCBlbFBhcmVudDogRWxlbWVudCkge1xuICAgIGlmIChwYXJzZUludCh0aGlzLnJlbmRlci52ZXJzaW9uKSA9PT0gMykge1xuICAgICAgLy9WdWUgM1xuICAgICAgbGV0IHdyYXBwZXIgPSB0aGlzLnJlbmRlci5oKG5vZGUuZ2V0T3B0aW9uKCk/Lmh0bWwsIHsgLi4uKG5vZGUuZ2V0T3B0aW9uKCk/LnByb3BzID8/IHt9KSwgbm9kZSB9LCAobm9kZS5nZXRPcHRpb24oKT8ub3B0aW9ucyA/PyB7fSkpO1xuICAgICAgd3JhcHBlci5hcHBDb250ZXh0ID0gZWxQYXJlbnQ7XG4gICAgICB0aGlzLnJlbmRlci5yZW5kZXIod3JhcHBlciwgZWxQYXJlbnQpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFZ1ZSAyXG4gICAgICBsZXQgd3JhcHBlciA9IG5ldyB0aGlzLnJlbmRlcih7XG4gICAgICAgIHBhcmVudDogZWxQYXJlbnQsXG4gICAgICAgIHJlbmRlcjogKGg6IGFueSkgPT4gaChub2RlLmdldE9wdGlvbigpPy5odG1sLCB7IHByb3BzOiB7IC4uLihub2RlLmdldE9wdGlvbigpPy5wcm9wcyA/PyB7fSksIG5vZGUgfSB9KSxcbiAgICAgICAgLi4uKG5vZGUuZ2V0T3B0aW9uKCk/Lm9wdGlvbnMgPz8ge30pXG4gICAgICB9KS4kbW91bnQoKVxuICAgICAgLy9cbiAgICAgIGVsUGFyZW50LmFwcGVuZENoaWxkKHdyYXBwZXIuJGVsKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluLCBFdmVudEVudW0sIERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcclxuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFRhYkRvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xyXG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcclxuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBgO1xyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtdGFiJyk7XHJcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCAoZGV0YWlsOiBhbnkpID0+IHtcclxuICAgICAgdGhpcy5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY3RpdmUnKS5mb3JFYWNoKChfbm9kZSkgPT4ge1xyXG4gICAgICAgIF9ub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYgKHRoaXMuZWxOb2RlICYmIGRldGFpbD8uZGF0YT8uR2V0KCdpZCcpKSB7XHJcbiAgICAgICAgdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcihgW2RhdGEtcHJvamVjdC1pZD1cIiR7ZGV0YWlsPy5kYXRhPy5HZXQoJ2lkJyl9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ubmV3UHJvamVjdCwgdGhpcy5yZW5kZXIuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG5cclxuICByZW5kZXIoKSB7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcclxuICAgIGxldCBwcm9qZWN0cyA9IHRoaXMubWFpbi5nZXRQcm9qZWN0QWxsKCk7XHJcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xyXG4gICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XHJcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcclxuICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QtaWQnLCBpdGVtLkdldCgnaWQnKSk7XHJcbiAgICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XHJcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xyXG4gICAgICB9KTtcclxuICAgICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcclxuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAodGhpcy5tYWluLmNoZWNrUHJvamVjdE9wZW4oaXRlbSkpIHtcclxuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgfVxyXG4gICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB7IGRhdGE6IGl0ZW0gfSk7XHJcbiAgICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogaXRlbSB9KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuZWxOb2RlPy5hcHBlbmRDaGlsZChub2RlSXRlbSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgVmlzdWFsRmxvdyB9IGZyb20gXCIuL1Zpc3VhbEZsb3dcIjtcbmltcG9ydCAqIGFzIFN5c3RlbUJhc2UgZnJvbSBcIi4vc3lzdGVtcy9pbmRleFwiO1xuaW1wb3J0ICogYXMgQ29yZSBmcm9tICcuL2NvcmUvaW5kZXgnO1xuaW1wb3J0ICogYXMgRGVzZ2luZXIgZnJvbSBcIi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCAqIGFzIERvY2sgZnJvbSAnLi9kb2NrL2luZGV4JztcbmV4cG9ydCBkZWZhdWx0IHtcbiAgVmlzdWFsRmxvdyxcbiAgLi4uU3lzdGVtQmFzZSxcbiAgLi4uQ29yZSxcbiAgLi4uRG9jayxcbiAgLi4uRGVzZ2luZXJcbn07XG5cbiJdLCJuYW1lcyI6WyJTeXN0ZW1CYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFPLE1BQU0sU0FBUyxHQUFHO0FBQ3ZCLElBQUEsSUFBSSxFQUFFLE1BQU07QUFDWixJQUFBLFVBQVUsRUFBRSxZQUFZO0FBQ3hCLElBQUEsWUFBWSxFQUFFLGNBQWM7QUFDNUIsSUFBQSxXQUFXLEVBQUUsYUFBYTtBQUMxQixJQUFBLFVBQVUsRUFBRSxZQUFZO0FBQ3hCLElBQUEsY0FBYyxFQUFFLGdCQUFnQjtBQUNoQyxJQUFBLE1BQU0sRUFBRSxRQUFRO0FBQ2hCLElBQUEsT0FBTyxFQUFFLFNBQVM7QUFDbEIsSUFBQSxXQUFXLEVBQUUsYUFBYTtDQUMzQixDQUFBO0FBRU0sTUFBTSxRQUFRLEdBQUc7QUFDdEIsSUFBQSxJQUFJLEVBQUUsU0FBUztBQUNmLElBQUEsR0FBRyxFQUFFLFFBQVE7QUFDYixJQUFBLElBQUksRUFBRSxTQUFTO0FBQ2YsSUFB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
