
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow.js v0.0.5
   * Released under the MIT license.
   */

'use strict';

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
                let elLink = document.createElement('a');
                elLi.appendChild(elLink);
                elLink.innerHTML = item.Get('name');
                elLink.addEventListener('click', () => {
                    alert(elLink.innerHTML);
                });
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
                setTimeout(() => {
                    if (this.elSuggestions)
                        this.elNode?.parentElement?.removeChild(this.elSuggestions);
                });
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
                    this.parent.UpdateUI();
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
                //  this.toolbar.renderPathGroup();
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
        // this.toolbar.renderPathGroup();
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
    //  public elToolbar: HTMLElement = document.createElement('div');
    //public toolbar: DesginerView_Toolbar;
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
        // this.elToolbar.classList.add("desginer-toolbar");
        // this.elNode.appendChild(this.elToolbar);
        this.elNode.appendChild(this.elCanvas);
        this.elNode.tabIndex = 0;
        new DesginerView_Event(this);
        // this.toolbar = new DesginerView_Toolbar(this);
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
        return (this.main.getControlByKey(key).onlyNode) && this.nodes.filter(item => item.CheckKey(key)).length > 0;
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
        this.elNode.classList.add('vs-toolbox');
        this.Render();
    }
    Render() {
        let controls = this.main.getControlAll();
        let group = {};
        Object.keys(controls).forEach((item) => {
            let groupName = controls[item].group ?? "other";
            if (group[groupName] === undefined)
                group[groupName] = [];
            group[groupName] = [
                ...group[groupName],
                controls[item]
            ];
        });
        Object.keys(group).forEach((item, index) => {
            let itemBox = document.createElement('div');
            itemBox.classList.add('node-box');
            itemBox.classList.add('active');
            itemBox.innerHTML = `
        <p class="node-box_title">${item}</p>
        <div class="node-box_boby"></div>
      `;
            itemBox.querySelector('.node-box_title')?.addEventListener('click', () => {
                if (itemBox.classList.contains('active')) {
                    itemBox.classList.remove('active');
                }
                else {
                    itemBox.classList.add('active');
                }
            });
            for (let _item of group[item]) {
                let nodeItem = document.createElement('div');
                nodeItem.classList.add('node-item');
                nodeItem.setAttribute('draggable', 'true');
                nodeItem.setAttribute('data-node', _item.key);
                nodeItem.innerHTML = `${_item.icon} <span>${_item.name}</span`;
                nodeItem.addEventListener('dragstart', this.dragStart.bind(this));
                nodeItem.addEventListener('dragend', this.dragend.bind(this));
                itemBox.querySelector('.node-box_boby')?.appendChild(nodeItem);
            }
            this.elNode.appendChild(itemBox);
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
            item.onSafe(`${EventEnum.dataChange}_name`, () => {
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

class TabProjectView {
    elNode;
    main;
    $elBoby;
    $elWarp;
    $btnNext;
    $btnBack;
    $btnAdd;
    constructor(elNode, main) {
        this.elNode = elNode;
        this.main = main;
        this.elNode.classList.add('vs-tab-project');
        this.main.on(EventEnum.openProject, this.Render.bind(this));
        this.Render();
    }
    Render() {
        let scrollLeftCache = this.$elWarp?.scrollLeft ?? 0;
        this.elNode.innerHTML = `
    <div class="tab-project__search"></div>
    <div class="tab-project__list">
      <div class="tab-project_button">
        <button class="btn-back"><i class="fas fa-angle-left"></i></button>
      </div>
      <div class="tab-project_warp">
        <div class="tab-project__body">
        </div>
      </div>
      <div class="tab-project_button">
        <button class="btn-next"><i class="fas fa-angle-right"></i></button>
      </div>
      <div class="tab-project_button">
        <button class="btn-add"><i class="fas fa-plus"></i></button>
      </div>
    </div>
    `;
        this.$elWarp = this.elNode.querySelector('.tab-project_warp');
        this.$elBoby = this.elNode.querySelector('.tab-project__body');
        this.$btnBack = this.elNode.querySelector('.btn-back');
        this.$btnNext = this.elNode.querySelector('.btn-next');
        this.$btnAdd = this.elNode.querySelector('.btn-add');
        const fnUpdateScroll = () => {
            if (this.$elWarp) ;
        };
        this.$elWarp?.addEventListener("scroll", event => {
            fnUpdateScroll();
        }, { passive: true });
        fnUpdateScroll();
        this.$btnBack?.addEventListener('click', () => {
            if (this.$elWarp) {
                this.$elWarp.scrollLeft -= 100;
            }
        });
        this.$btnNext?.addEventListener('click', () => {
            if (this.$elWarp) {
                this.$elWarp.scrollLeft += 100;
            }
        });
        this.$btnAdd?.addEventListener('click', () => {
            this.main.newProject("");
        });
        let projects = this.main.getProjectAll();
        let itemActive = undefined;
        for (let project of projects) {
            let projectItem = document.createElement('div');
            let projectName = document.createElement('span');
            let projectButton = document.createElement('div');
            let projectButtonRemove = document.createElement('button');
            projectItem.setAttribute('data-project-id', project.Get('id'));
            projectName.innerHTML = project.Get('name');
            projectName.classList.add('pro-name');
            projectButton.classList.add('pro-button');
            projectButtonRemove.innerHTML = `<i class="fas fa-minus"></i>`;
            projectButton.appendChild(projectButtonRemove);
            projectItem.appendChild(projectName);
            projectItem.appendChild(projectButton);
            projectItem.classList.add('project-item');
            if (this.main.checkProjectOpen(project)) {
                projectItem.classList.add('active');
                itemActive = projectItem;
            }
            projectItem.addEventListener('click', (e) => {
                if (!projectButtonRemove.contains(e.target) && e.target != projectButtonRemove) {
                    this.main.setProjectOpen(project);
                }
            });
            projectButtonRemove.addEventListener('click', (e) => {
                this.main.removeProject(project);
            });
            this.$elBoby?.appendChild(projectItem);
            project.onSafe(EventEnum.dataChange + '_name', () => {
                projectName.innerHTML = project.Get('name');
            });
        }
        if (this.$elWarp) {
            if (itemActive != undefined) {
                this.$elWarp.scrollLeft = itemActive.offsetLeft - 20;
            }
            else {
                this.$elWarp.scrollLeft = scrollLeftCache;
            }
        }
    }
}

var Desginer = /*#__PURE__*/Object.freeze({
    __proto__: null,
    DesginerView: DesginerView,
    Line: Line,
    NodeItem: NodeItem,
    VariableView: VariableView,
    ToolboxView: ToolboxView,
    ProjectView: ProjectView,
    TabProjectView: TabProjectView
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
    <div class="vs-boxinfo_warp"><div class="vs-boxinfo_content"></div></div>`;
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

class TabDock extends DockBase {
    main;
    constructor(container, main) {
        super(container, main);
        this.main = main;
        new TabProjectView(this.elNode, main);
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
        //this.addDock(DockEnum.left, ProjectDock);
        this.addDock(DockEnum.right, PropertyDock);
        this.addDock(DockEnum.view, ViewDock);
        this.addDock(DockEnum.top, TabDock);
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
            right: 1,
            left: 0,
            bottom: 0,
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
            left: 1,
            top: 0,
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
        html: `<div>
              <div class="node-content-row"><span style="text-align:right">Then</span><span><span class="node-dot" node="50001"></span></span></div>
              <div class="node-content-row"><span style="text-align:right">Else</span><span><span class="node-dot" node="50002"></span></span></div>
            </div>
      `,
        script: ``,
        properties: {
            condition: {
                key: "condition",
                edit: true,
                default: ''
            }
        },
        dot: {
            left: 1,
            top: 0,
            right: 0,
            bottom: 0,
        },
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
    $indexProject = -1;
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
                default: () => `Flow ${this.$indexProject++}`,
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
        this.$indexProject = 1;
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
        let varibale = new DataFlow(this, { key: PropertyEnum.variable, scope: this.getGroupCurrent()?.[0]?.id });
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
                ...item,
                dot: {
                    left: 1,
                    top: 1,
                    right: 1,
                    bottom: 1,
                    ...item?.dot
                }
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
    removeProject($data) {
        let projectData = $data;
        if ($data instanceof DataFlow) {
            projectData = this.getProjectById($data.Get('id'));
        }
        else {
            projectData = this.getProjectById($data.Get('id'));
        }
        this.$data.Remove('projects', projectData);
        if (this.checkProjectOpen(projectData)) {
            this.$projectOpen = this.$data.Get('projects')?.[0];
            if (!this.$projectOpen) {
                this.newProject();
                return;
            }
        }
        this.dispatch(EventEnum.change, {
            data: this.$projectOpen
        });
        this.dispatch(EventEnum.showProperty, {
            data: this.$projectOpen
        });
        this.dispatch(EventEnum.openProject, {
            data: this.$projectOpen
        });
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

module.exports = index;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5janMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL0NvbnN0YW50LnRzIiwiLi4vc3JjL2NvcmUvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvcmUvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29yZS9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb3JlL1V0aWxzLnRzIiwiLi4vc3JjL2NvcmUvRGF0YVZpZXcudHMiLCIuLi9zcmMvZGVzZ2luZXIvTGluZS50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXdfRXZlbnQudHMiLCIuLi9zcmMvZGVzZ2luZXIvTm9kZUl0ZW0udHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1ZhcmlhYmxlVmlldy50cyIsIi4uL3NyYy9kZXNnaW5lci9Ub29sYm94Vmlldy50cyIsIi4uL3NyYy9kZXNnaW5lci9Qcm9qZWN0Vmlldy50cyIsIi4uL3NyYy9kZXNnaW5lci9UYWJQcm9qZWN0Vmlldy50cyIsIi4uL3NyYy9kb2NrL0RvY2tCYXNlLnRzIiwiLi4vc3JjL2RvY2svQ29udHJvbERvY2sudHMiLCIuLi9zcmMvZG9jay9WYXJpYWJsZURvY2sudHMiLCIuLi9zcmMvZG9jay9Qcm9wZXJ0eURvY2sudHMiLCIuLi9zcmMvZG9jay9WaWV3RG9jay50cyIsIi4uL3NyYy9kb2NrL1RhYkRvY2sudHMiLCIuLi9zcmMvZG9jay9Eb2NrTWFuYWdlci50cyIsIi4uL3NyYy9zeXN0ZW1zL2NvbnRyb2wudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1CYXNlLnRzIiwiLi4vc3JjL1Zpc3VhbEZsb3cudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1WdWUudHMiLCIuLi9zcmMvZG9jay9Qcm9qZWN0RG9jay50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgRXZlbnRFbnVtID0ge1xuICBpbml0OiBcImluaXRcIixcbiAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXG4gIHNob3dQcm9wZXJ0eTogXCJzaG93UHJvcGVydHlcIixcbiAgb3BlblByb2plY3Q6IFwib3BlblByb2plY3RcIixcbiAgbmV3UHJvamVjdDogXCJuZXdQcm9qZWN0XCIsXG4gIGNoYW5nZVZhcmlhYmxlOiBcImNoYW5nZVZhcmlhYmxlXCIsXG4gIGNoYW5nZTogXCJjaGFuZ2VcIixcbiAgZGlzcG9zZTogXCJkaXNwb3NlXCIsXG4gIGdyb3VwQ2hhbmdlOiBcImdyb3VwQ2hhbmdlXCIsXG59XG5cbmV4cG9ydCBjb25zdCBEb2NrRW51bSA9IHtcbiAgbGVmdDogXCJ2cy1sZWZ0XCIsXG4gIHRvcDogXCJ2cy10b3BcIixcbiAgdmlldzogXCJ2cy12aWV3XCIsXG4gIGJvdHRvbTogXCJ2cy1ib3R0b21cIixcbiAgcmlnaHQ6IFwidnMtcmlnaHRcIixcbn1cblxuZXhwb3J0IGNvbnN0IFByb3BlcnR5RW51bSA9IHtcbiAgbWFpbjogXCJtYWluX3Byb2plY3RcIixcbiAgc29sdXRpb246ICdtYWluX3NvbHV0aW9uJyxcbiAgbGluZTogJ21haW5fbGluZScsXG4gIHZhcmlhYmxlOiAnbWFpbl92YXJpYWJsZScsXG4gIGdyb3VwQ2F2YXM6IFwibWFpbl9ncm91cENhdmFzXCIsXG59O1xuXG5leHBvcnQgY29uc3QgU2NvcGVSb290ID0gXCJyb290XCI7XG4iLCJpbXBvcnQgeyBJRXZlbnQgfSBmcm9tIFwiLi9JRmxvd1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEV2ZW50RmxvdyBpbXBsZW1lbnRzIElFdmVudCB7XHJcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICB9XHJcbiAgcHVibGljIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICB0aGlzLm9uKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIC8qIEV2ZW50cyAqL1xyXG4gIHB1YmxpYyBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcclxuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XHJcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG5cclxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcclxuXHJcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXHJcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXHJcbiAgICBjb25zdCBoYXNMaXN0ZW5lciA9IGxpc3RlbmVySW5kZXggPiAtMVxyXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcclxuICAgICAgbGlzdGVuZXIoZGV0YWlscyk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSVByb3BlcnR5IH0gZnJvbSBcIi4vSUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcbiAgcHJpdmF0ZSBkYXRhOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVzOiBhbnkgPSBudWxsO1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBwdWJsaWMgZ2V0UHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXM7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvcGVydHk6IElQcm9wZXJ0eSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCwgZGF0YTogYW55ID0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IC0xKSB7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIH1cbiAgICB0aGlzLmxvYWQoZGF0YSk7XG4gIH1cbiAgcHJpdmF0ZSBldmVudERhdGFDaGFuZ2Uoa2V5OiBzdHJpbmcsIGtleUNoaWxkOiBzdHJpbmcsIHZhbHVlQ2hpbGQ6IGFueSwgc2VuZGVyQ2hpbGQ6IGFueSwgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmIChpbmRleCkge1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9XyR7a2V5Q2hpbGR9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xuICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlRXZlbnREYXRhKGl0ZW06IERhdGFGbG93LCBrZXk6IHN0cmluZywgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmICghaXRlbSkgcmV0dXJuO1xuICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9YCwgKHsga2V5OiBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGQgfTogYW55KSA9PiB0aGlzLmV2ZW50RGF0YUNoYW5nZShrZXksIGtleUNoaWxkLCB2YWx1ZUNoaWxkLCBzZW5kZXJDaGlsZCwgaW5kZXgpKTtcbiAgfVxuICBwdWJsaWMgT25FdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHByaXZhdGUgQmluZEV2ZW50KHZhbHVlOiBhbnksIGtleTogc3RyaW5nKSB7XG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICB0aGlzLk9uRXZlbnREYXRhKHZhbHVlIGFzIERhdGFGbG93LCBrZXkpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgKHZhbHVlIGFzIFtdKS5sZW5ndGggPiAwICYmIHZhbHVlWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICh2YWx1ZSBhcyBEYXRhRmxvd1tdKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdywgaW5kZXg6IG51bWJlcikgPT4gdGhpcy5PbkV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCwgaXNEaXNwYXRjaDogYm9vbGVhbiA9IHRydWUpIHtcbiAgICBpZiAodGhpcy5kYXRhW2tleV0gIT0gdmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmRhdGFba2V5XSkge1xuICAgICAgICBpZiAodGhpcy5kYXRhW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICAgIHRoaXMuUmVtb3ZlRXZlbnREYXRhKCh0aGlzLmRhdGFba2V5XSBhcyBEYXRhRmxvdyksIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhW2tleV0pICYmICh0aGlzLmRhdGFba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiB0aGlzLmRhdGFba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLlJlbW92ZUV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuQmluZEV2ZW50KHZhbHVlLCBrZXkpO1xuICAgIH1cbiAgICB0aGlzLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgIGlmIChpc0Rpc3BhdGNoKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICB9XG5cbiAgfVxuICBwdWJsaWMgU2V0RGF0YShkYXRhOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCwgaXNDbGVhckRhdGEgPSBmYWxzZSkge1xuXG4gICAgaWYgKGlzQ2xlYXJEYXRhKSB0aGlzLmRhdGEgPSB7fTtcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICBsZXQgJGRhdGE6IERhdGFGbG93ID0gZGF0YSBhcyBEYXRhRmxvdztcbiAgICAgIGlmICghdGhpcy5wcm9wZXJ0eSAmJiAkZGF0YS5wcm9wZXJ0eSkgdGhpcy5wcm9wZXJ0eSA9ICRkYXRhLnByb3BlcnR5O1xuICAgICAgaWYgKHRoaXMucHJvcGVydGllcykge1xuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5wcm9wZXJ0aWVzKSkge1xuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoJGRhdGEuZ2V0UHJvcGVydGllcygpKSkge1xuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICB0aGlzLlNldChrZXksIGRhdGFba2V5XSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgIGRhdGFcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgR2V0KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xuICB9XG4gIHB1YmxpYyBBcHBlbmQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBpZiAoIXRoaXMuZGF0YVtrZXldKSB0aGlzLmRhdGFba2V5XSA9IFtdO1xuICAgIHRoaXMuZGF0YVtrZXldID0gWy4uLnRoaXMuZGF0YVtrZXldLCB2YWx1ZV07XG4gICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gIH1cbiAgcHVibGljIFJlbW92ZShrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xuICAgIHZhciBpbmRleCA9IHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLlJlbW92ZUV2ZW50RGF0YSh0aGlzLmRhdGFba2V5XVtpbmRleF0sIGtleSk7XG4gICAgICB0aGlzLmRhdGFba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEgPSB7fTtcbiAgICBpZiAoIXRoaXMucHJvcGVydGllcykge1xuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0eT8uZ2V0UHJvcGVydHlCeUtleShkYXRhLmtleSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgIHRoaXMuZGF0YVtrZXldID0gKGRhdGE/LltrZXldID8/ICgodHlwZW9mIHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0ID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCgpIDogdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQpID8/IFwiXCIpKTtcbiAgICAgICAgaWYgKCEodGhpcy5kYXRhW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykgJiYgdGhpcy5kYXRhW2tleV0ua2V5KSB7XG4gICAgICAgICAgdGhpcy5kYXRhW2tleV0gPSBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgdGhpcy5kYXRhW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGF0YVtrZXldKSAmJiB0aGlzLnByb3BlcnR5ICYmICEodGhpcy5kYXRhW2tleV1bMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykpIHtcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IHRoaXMuZGF0YVtrZXldLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoIShpdGVtIGluc3RhbmNlb2YgRGF0YUZsb3cpICYmIGl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgaXRlbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLkJpbmRFdmVudCh0aGlzLmRhdGFba2V5XSwga2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnRvSnNvbigpKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCByczogYW55ID0ge307XG4gICAgaWYgKCF0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMucHJvcGVydHk/LmdldFByb3BlcnR5QnlLZXkodGhpcy5kYXRhLmtleSk7XG4gICAgfVxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICByc1trZXldID0gdGhpcy5HZXQoa2V5KTtcbiAgICAgIGlmIChyc1trZXldIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0udG9Kc29uKCk7XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocnNba2V5XSkgJiYgKHJzW2tleV0gYXMgW10pLmxlbmd0aCA+IDAgJiYgcnNba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgIHJzW2tleV0gPSByc1trZXldLm1hcCgoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0udG9Kc29uKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnM7XG4gIH1cbiAgcHVibGljIGRlbGV0ZSgpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICB0aGlzLmRhdGEgPSB7fTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xyXG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xyXG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcclxuaW1wb3J0IHsgSUV2ZW50IH0gZnJvbSBcIi4vSUZsb3dcIjtcclxuZXhwb3J0IGNsYXNzIEZsb3dDb3JlIGltcGxlbWVudHMgSUV2ZW50IHtcclxuICBwdWJsaWMgR2V0SWQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnaWQnKTtcclxuICB9XHJcbiAgcHVibGljIFNldElkKGlkOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCdpZCcsIGlkKTtcclxuICB9XHJcbiAgcHVibGljIHByb3BlcnRpZXM6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xyXG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblxyXG4gIHB1YmxpYyBDaGVja0VsZW1lbnRDaGlsZChlbDogSFRNTEVsZW1lbnQpIHtcclxuICAgIHJldHVybiB0aGlzLmVsTm9kZSA9PSBlbCB8fCB0aGlzLmVsTm9kZS5jb250YWlucyhlbCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XHJcbiAgcHVibGljIFNldERhdGEoZGF0YTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwpIHtcclxuICAgIHRoaXMuZGF0YS5TZXREYXRhKGRhdGEsIHNlbmRlcik7XHJcbiAgfVxyXG4gIHB1YmxpYyBTZXREYXRhRmxvdyhkYXRhOiBEYXRhRmxvdykge1xyXG4gICAgdGhpcy5kYXRhLlNldERhdGEoZGF0YSwgdGhpcywgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5kaXNwYXRjaChgYmluZF9kYXRhX2V2ZW50YCwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XHJcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHsgZGF0YSwgc2VuZGVyOiB0aGlzIH0pO1xyXG4gIH1cclxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcclxuICB9XHJcbiAgUmVtb3ZlRGF0YUV2ZW50KCkge1xyXG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlRmxvdzxUUGFyZW50IGV4dGVuZHMgRmxvd0NvcmU+IGV4dGVuZHMgRmxvd0NvcmUge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyZW50OiBUUGFyZW50KSB7XHJcbiAgICBzdXBlcigpO1xyXG4gIH1cclxufVxyXG4iLCJleHBvcnQgY29uc3QgTE9HID0gKG1lc3NhZ2U/OiBhbnksIC4uLm9wdGlvbmFsUGFyYW1zOiBhbnlbXSkgPT4gY29uc29sZS5sb2cobWVzc2FnZSwgb3B0aW9uYWxQYXJhbXMpO1xuZXhwb3J0IGNvbnN0IGdldERhdGUgPSAoKSA9PiAobmV3IERhdGUoKSk7XG5leHBvcnQgY29uc3QgZ2V0VGltZSA9ICgpID0+IGdldERhdGUoKS5nZXRUaW1lKCk7XG5leHBvcnQgY29uc3QgZ2V0VXVpZCA9ICgpID0+IHtcbiAgLy8gaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvcmZjNDEyMi50eHRcbiAgbGV0IHM6IGFueSA9IFtdO1xuICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzY7IGkrKykge1xuICAgIHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApLCAxKTtcbiAgfVxuICBzWzE0XSA9IFwiNFwiOyAgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG4gIHNbMTldID0gaGV4RGlnaXRzLnN1YnN0cigoc1sxOV0gJiAweDMpIHwgMHg4LCAxKTsgIC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG4gIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcbiAgcmV0dXJuIHV1aWQ7XG59XG5cbmV4cG9ydCBjb25zdCBjb21wYXJlU29ydCA9IChhOiBhbnksIGI6IGFueSkgPT4ge1xuICBpZiAoYS5zb3J0IDwgYi5zb3J0KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmIChhLnNvcnQgPiBiLnNvcnQpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmV4cG9ydCBjb25zdCBpc0Z1bmN0aW9uID0gKGZuOiBhbnkpID0+IHtcbiAgcmV0dXJuIGZuICYmIGZuIGluc3RhbmNlb2YgRnVuY3Rpb247XG59XG5leHBvcnQgY29uc3QgZG93bmxvYWRPYmplY3RBc0pzb24gPSAoZXhwb3J0T2JqOiBhbnksIGV4cG9ydE5hbWU6IHN0cmluZykgPT4ge1xuICB2YXIgZGF0YVN0ciA9IFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShleHBvcnRPYmopKTtcbiAgdmFyIGRvd25sb2FkQW5jaG9yTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgZGF0YVN0cik7XG4gIGRvd25sb2FkQW5jaG9yTm9kZS5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBleHBvcnROYW1lICsgXCIuanNvblwiKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb3dubG9hZEFuY2hvck5vZGUpOyAvLyByZXF1aXJlZCBmb3IgZmlyZWZveFxuICBkb3dubG9hZEFuY2hvck5vZGUuY2xpY2soKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnJlbW92ZSgpO1xufVxuZXhwb3J0IGNvbnN0IHJlYWRGaWxlTG9jYWwgPSAoY2FsbGJhY2s6IGFueSkgPT4ge1xuICB2YXIgaW5wdXRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0RWwuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2ZpbGUnKTtcbiAgaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjaz8uKGZyLnJlc3VsdCk7XG4gICAgfVxuICAgIGlmIChpbnB1dEVsICYmIGlucHV0RWwuZmlsZXMpXG4gICAgICBmci5yZWFkQXNUZXh0KGlucHV0RWwuZmlsZXNbMF0pO1xuICB9KTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpbnB1dEVsKTtcbiAgaW5wdXRFbC5jbGljaygpO1xuICBpbnB1dEVsLnJlbW92ZSgpO1xufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi9JRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcbmltcG9ydCB7IGlzRnVuY3Rpb24gfSBmcm9tIFwiLi9VdGlsc1wiO1xuXG5leHBvcnQgY29uc3QgVGFnVmlldyA9IFsnU1BBTicsICdESVYnLCAnUCcsICdURVhUQVJFQSddO1xuZXhwb3J0IGNsYXNzIERhdGFWaWV3IHtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIHByb3BlcnR5OiBhbnk7XG4gIHByaXZhdGUgZWxTdWdnZXN0aW9uczogRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBlbFN1Z2dlc3Rpb25zQ29udGVudDogRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBub2RlRWRpdG9yOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgZWw6IEVsZW1lbnQsIHByaXZhdGUgZGF0YTogRGF0YUZsb3csIHByaXZhdGUgbWFpbjogSU1haW4sIHByaXZhdGUga2V5TmFtZTogc3RyaW5nIHwgbnVsbCA9IG51bGwpIHtcbiAgICBpZiAodGhpcy5rZXlOYW1lKSB7XG4gICAgICBpZiAoIWVsLmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleSh0aGlzLmRhdGEuR2V0KCdrZXknKSk/Llt0aGlzLmtleU5hbWVdO1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IgPSBlbCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgdGhpcy5ub2RlRWRpdG9yLmNsYXNzTGlzdC5hZGQoJ25vZGUtZWRpdG9yJyk7XG4gICAgICAgIGlmICh0aGlzLnByb3BlcnR5LmVkaXQpIHtcbiAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0eS5zZWxlY3QpIHtcbiAgICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIm5vZGUtZm9ybS1jb250cm9sXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIHRoaXMua2V5TmFtZSk7XG5cbiAgICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5TmFtZSA9IGVsPy5nZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnKTtcbiAgICAgIGlmICh0aGlzLmtleU5hbWUpIHtcbiAgICAgICAgdGhpcy5wcm9wZXJ0eSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KHRoaXMuZGF0YS5HZXQoJ2tleScpKT8uW3RoaXMua2V5TmFtZV07XG4gICAgICAgIHRoaXMuZWxOb2RlID0gdGhpcy5lbCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgdGhpcy5ub2RlRWRpdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3InKTtcbiAgICAgICAgZWwucGFyZW50RWxlbWVudD8uaW5zZXJ0QmVmb3JlKHRoaXMubm9kZUVkaXRvciwgZWwpO1xuICAgICAgICBlbC5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZChlbCk7XG4gICAgICAgIHRoaXMubm9kZUVkaXRvci5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZWxTdWdnZXN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxTdWdnZXN0aW9ucy5jbGFzc0xpc3QuYWRkKCdub2RlLWVkaXRvcl9zdWdnZXN0aW9ucycpO1xuICAgIHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsU3VnZ2VzdGlvbnNDb250ZW50LmNsYXNzTGlzdC5hZGQoJ3N1Z2dlc3Rpb25zX2NvbnRlbnQnKTtcbiAgICB0aGlzLmVsU3VnZ2VzdGlvbnMuYXBwZW5kQ2hpbGQodGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudCk7XG4gICAgdGhpcy5zaG93U3VnZ2VzdGlvbnMoZmFsc2UpO1xuICAgIGlmICh0aGlzLmtleU5hbWUpXG4gICAgICB0aGlzLmJpbmREYXRhKCk7XG4gIH1cbiAgcHJpdmF0ZSBjaGVja1Nob3dTdWdnZXN0aW9ucygpIHtcbiAgICBpZiAodGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudCkge1xuICAgICAgdGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudC5pbm5lckhUTUwgPSAnJztcbiAgICAgIHZhciBhcnIgPSB0aGlzLm1haW4uZ2V0VmFyaWFibGUoKTtcbiAgICAgIGlmICghYXJyIHx8IGFyci5sZW5ndGggPT0gMCkge1xuICAgICAgICB0aGlzLnNob3dTdWdnZXN0aW9ucyhmYWxzZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCBlbFVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgYXJyKSB7XG4gICAgICAgIGxldCBlbExpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgbGV0IGVsTGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgZWxMaS5hcHBlbmRDaGlsZChlbExpbmspO1xuICAgICAgICBlbExpbmsuaW5uZXJIVE1MID0gaXRlbS5HZXQoJ25hbWUnKTtcbiAgICAgICAgZWxMaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgIGFsZXJ0KGVsTGluay5pbm5lckhUTUwpO1xuICAgICAgICB9KTtcbiAgICAgICAgZWxVbC5hcHBlbmRDaGlsZChlbExpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQuYXBwZW5kQ2hpbGQoZWxVbCk7XG4gICAgfVxuICAgIGxldCB0eHQ6IGFueSA9ICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlO1xuICAgIGxldCBzZWxlY3Rpb25TdGFydCA9ICh0aGlzLmVsTm9kZSBhcyBhbnkpLnNlbGVjdGlvblN0YXJ0O1xuICAgIGlmICh0eHQpIHtcbiAgICAgIGxldCBzdGFydEluZGV4ID0gdHh0Lmxhc3RJbmRleE9mKFwiJHtcIiwgc2VsZWN0aW9uU3RhcnQpO1xuICAgICAgbGV0IGVuZEluZGV4ID0gdHh0Lmxhc3RJbmRleE9mKFwifVwiLCBzZWxlY3Rpb25TdGFydCk7XG4gICAgICBpZiAoZW5kSW5kZXggPCBzdGFydEluZGV4KVxuICAgICAgICB0aGlzLnNob3dTdWdnZXN0aW9ucyh0cnVlKTtcbiAgICAgIGVsc2VcbiAgICAgICAgdGhpcy5zaG93U3VnZ2VzdGlvbnMoZmFsc2UpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIHNob3dTdWdnZXN0aW9ucyhmbGc6IGJvb2xlYW4gPSB0cnVlKSB7XG4gICAgaWYgKCF0aGlzLmVsU3VnZ2VzdGlvbnMpIHJldHVybjtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsU3VnZ2VzdGlvbnMucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsU3VnZ2VzdGlvbnMuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgYmluZERhdGEoKSB7XG4gICAgaWYgKHRoaXMua2V5TmFtZSAmJiB0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5kYXRhLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke3RoaXMua2V5TmFtZX1gLCB0aGlzLmJpbmRJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnMpXG4gICAgICAgICAgdGhpcy5lbE5vZGU/LnBhcmVudEVsZW1lbnQ/LmFwcGVuZENoaWxkKHRoaXMuZWxTdWdnZXN0aW9ucyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCAoKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnMpXG4gICAgICAgICAgICB0aGlzLmVsTm9kZT8ucGFyZW50RWxlbWVudD8ucmVtb3ZlQ2hpbGQodGhpcy5lbFN1Z2dlc3Rpb25zKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJzZWxlY3RcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmNoZWNrU2hvd1N1Z2dlc3Rpb25zKCk7XG4gICAgICB9KVxuICAgICAgaWYgKHRoaXMucHJvcGVydHkgJiYgdGhpcy5wcm9wZXJ0eS5zZWxlY3QgJiYgaXNGdW5jdGlvbih0aGlzLnByb3BlcnR5LmRhdGFTZWxlY3QpKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLnByb3BlcnR5LmRhdGFTZWxlY3QoeyBlbE5vZGU6IHRoaXMuZWxOb2RlLCBtYWluOiB0aGlzLm1haW4sIGtleTogdGhpcy5rZXlOYW1lIH0pLm1hcCgoeyB2YWx1ZSwgdGV4dCB9OiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICAgICAgb3B0aW9uLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgb3B0aW9uLnRleHQgPSB0ZXh0O1xuICAgICAgICAgIHJldHVybiBvcHRpb247XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGxldCBvcHRpb24gb2Ygb3B0aW9ucykge1xuICAgICAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnByb3BlcnR5ICYmIGlzRnVuY3Rpb24odGhpcy5wcm9wZXJ0eS5zY3JpcHQpKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHkuc2NyaXB0KHsgZWxOb2RlOiB0aGlzLmVsTm9kZSwgbWFpbjogdGhpcy5tYWluLCBrZXk6IHRoaXMua2V5TmFtZSB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0Tm9kZVZhbHVlKHRoaXMuZGF0YS5HZXQodGhpcy5rZXlOYW1lKSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgc2V0Tm9kZVZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGlmIChUYWdWaWV3LmluY2x1ZGVzKHRoaXMuZWxOb2RlLnRhZ05hbWUpKSB7XG4gICAgICAgICh0aGlzLmVsTm9kZSBhcyBhbnkpLmlubmVyVGV4dCA9IGAke3ZhbHVlfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAodGhpcy5lbE5vZGUgYXMgYW55KS52YWx1ZSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwcml2YXRlIGJpbmRJbnB1dCh7IHZhbHVlLCBzZW5kZXIgfTogYW55KSB7XG4gICAgaWYgKHNlbmRlciAhPT0gdGhpcyAmJiB0aGlzLmVsTm9kZSAmJiBzZW5kZXIuZWxOb2RlICE9PSB0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5zZXROb2RlVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGJpbmRFdmVudCgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmtleU5hbWUgJiYgdGhpcy5lbE5vZGUpIHtcbiAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLmtleU5hbWUsICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlLCB0aGlzKTtcblxuXG4gICAgICAgIHRoaXMuY2hlY2tTaG93U3VnZ2VzdGlvbnMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgRGVsZXRlKCkge1xuICAgIGlmICh0aGlzLmtleU5hbWUgJiYgdGhpcy5lbE5vZGUpIHtcbiAgICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHt0aGlzLmtleU5hbWV9YCwgdGhpcy5iaW5kSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHN0YXRpYyBCaW5kRWxlbWVudChlbDogRWxlbWVudCwgZGF0YTogRGF0YUZsb3csIG1haW46IElNYWluLCBrZXk6IHN0cmluZyB8IG51bGwgPSBudWxsKTogRGF0YVZpZXdbXSB7XG4gICAgaWYgKGVsLmNoaWxkRWxlbWVudENvdW50ID09IDAgfHwgZWwuZ2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJykpIHtcbiAgICAgIHJldHVybiBbbmV3IERhdGFWaWV3KGVsLCBkYXRhLCBtYWluLCBrZXkpXTtcbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnW25vZGVcXFxcOm1vZGVsXScpKS5tYXAoKGl0ZW06IEVsZW1lbnQpID0+IHtcbiAgICAgIHJldHVybiBuZXcgRGF0YVZpZXcoaXRlbSwgZGF0YSwgbWFpbik7XG4gICAgfSk7XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBOb2RlSXRlbSB9IGZyb20gXCIuL05vZGVJdGVtXCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lIHtcbiAgcHVibGljIGVsTm9kZTogU1ZHRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgcHVibGljIGVsUGF0aDogU1ZHUGF0aEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJwYXRoXCIpO1xuICBwcml2YXRlIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyB0ZW1wOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZnJvbTogTm9kZUl0ZW0sIHB1YmxpYyBmcm9tSW5kZXg6IG51bWJlciA9IDAsIHB1YmxpYyB0bzogTm9kZUl0ZW0gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsIHB1YmxpYyB0b0luZGV4OiBudW1iZXIgPSAwLCBkYXRhOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5mcm9tLnBhcmVudC5lbENhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG5cbiAgICB0aGlzLmZyb20uQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnRvPy5BZGRMaW5lKHRoaXMpO1xuICAgIGlmIChkYXRhKSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoXG4gICAgICB7XG4gICAgICAgIGZyb206IHRoaXMuZnJvbS5HZXRJZCgpLFxuICAgICAgICBmcm9tSW5kZXg6IHRoaXMuZnJvbUluZGV4LFxuICAgICAgICB0bzogdGhpcy50bz8uR2V0SWQoKSxcbiAgICAgICAgdG9JbmRleDogdGhpcy50b0luZGV4XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAuLi4gdGhpcy5mcm9tLnBhcmVudC5tYWluLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLmxpbmUpIHx8IHt9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmZyb20uZGF0YS5BcHBlbmQoJ2xpbmVzJywgdGhpcy5kYXRhKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVG8odG9feDogbnVtYmVyLCB0b195OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuZnJvbSB8fCB0aGlzLmZyb20uZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgeyB4OiBmcm9tX3gsIHk6IGZyb21feSB9OiBhbnkgPSB0aGlzLmZyb20uZ2V0UG9zdGlzaW9uRG90KHRoaXMuZnJvbUluZGV4KTtcbiAgICB2YXIgbGluZUN1cnZlID0gdGhpcy5jcmVhdGVDdXJ2YXR1cmUoZnJvbV94LCBmcm9tX3ksIHRvX3gsIHRvX3ksIHRoaXMuY3VydmF0dXJlLCAnb3RoZXInKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCk6IExpbmUge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvLmVsTm9kZSkge1xuICAgICAgbGV0IHsgeDogdG9feCwgeTogdG9feSB9OiBhbnkgPSB0aGlzLnRvLmdldFBvc3Rpc2lvbkRvdCh0aGlzLnRvSW5kZXgpO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIEFjdGl2ZShmbGc6IGFueSA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwsIGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5mcm9tLmRhdGEuUmVtb3ZlKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gICAgaWYgKHRoaXMuZnJvbSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50bz8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsUGF0aC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLmZyb20ucGFyZW50LnNldExpbmVDaG9vc2UodGhpcylcbiAgfVxuICBwdWJsaWMgc2V0Tm9kZVRvKG5vZGU6IE5vZGVJdGVtIHwgdW5kZWZpbmVkLCB0b0luZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLnRvID0gbm9kZTtcbiAgICB0aGlzLnRvSW5kZXggPSB0b0luZGV4O1xuICB9XG4gIHB1YmxpYyBDbG9uZSgpIHtcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvSW5kZXggJiYgdGhpcy5mcm9tICE9IHRoaXMudG8gJiYgIXRoaXMuZnJvbS5jaGVja0xpbmVFeGlzdHModGhpcy5mcm9tSW5kZXgsIHRoaXMudG8sIHRoaXMudG9JbmRleCkpIHtcbiAgICAgIHJldHVybiBuZXcgTGluZSh0aGlzLmZyb20sIHRoaXMuZnJvbUluZGV4LCB0aGlzLnRvLCB0aGlzLnRvSW5kZXgpLlVwZGF0ZVVJKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBnZXRUaW1lIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcblxuZXhwb3J0IGVudW0gTW92ZVR5cGUge1xuICBOb25lID0gMCxcbiAgTm9kZSA9IDEsXG4gIENhbnZhcyA9IDIsXG4gIExpbmUgPSAzLFxufVxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlld19FdmVudCB7XG5cbiAgcHJpdmF0ZSB0aW1lRmFzdENsaWNrOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHRhZ0luZ29yZSA9IFsnaW5wdXQnLCAnYnV0dG9uJywgJ2EnLCAndGV4dGFyZWEnXTtcblxuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gIHByaXZhdGUgZmxnRHJhcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIGF2X3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgYXZfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHRlbXBMaW5lOiBMaW5lIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IERlc2dpbmVyVmlldykge1xuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuICAgIC8qIENvbnRleHQgTWVudSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMubm9kZV9kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMubm9kZV9kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy56b29tX2VudGVyLmJpbmQodGhpcykpO1xuICAgIC8qIERlbGV0ZSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb250ZXh0bWVudShldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cbiAgcHJpdmF0ZSBub2RlX2RyYWdvdmVyKGV2OiBhbnkpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfVxuICBwcml2YXRlIG5vZGVfZHJvcEVuZChldjogYW55KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBsZXQga2V5Tm9kZTogYW55ID0gdGhpcy5wYXJlbnQubWFpbi5nZXRDb250cm9sQ2hvb3NlKCk7XG4gICAgaWYgKCFrZXlOb2RlICYmIGV2LnR5cGUgIT09IFwidG91Y2hlbmRcIikge1xuICAgICAga2V5Tm9kZSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwibm9kZVwiKTtcbiAgICB9XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuXG4gICAgaWYgKHRoaXMucGFyZW50LmNoZWNrT25seU5vZGUoa2V5Tm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IG5vZGVJdGVtID0gdGhpcy5wYXJlbnQuQWRkTm9kZShrZXlOb2RlLCB7XG4gICAgICBncm91cDogdGhpcy5wYXJlbnQuQ3VycmVudEdyb3VwKClcbiAgICB9KTtcbiAgICBub2RlSXRlbS51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21fb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBab29tIEluXG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21faW4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBTdGFydE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmICh0aGlzLnRhZ0luZ29yZS5pbmNsdWRlcyhldi50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSBnZXRUaW1lKCk7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21haW4tcGF0aCcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgbGV0IG5vZGVDaG9vc2UgPSB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk7XG4gICAgaWYgKG5vZGVDaG9vc2UgJiYgbm9kZUNob29zZS5DaGVja0VsZW1lbnRDaGlsZChldi50YXJnZXQpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh1bmRlZmluZWQpO1xuICAgIH1cbiAgICBpZiAobm9kZUNob29zZSAmJiB0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vZGUgJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBldi50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmUobm9kZUNob29zZSwgZnJvbUluZGV4KTtcbiAgICAgIHRoaXMudGVtcExpbmUudGVtcCA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgdGhpcy5hdl94ID0gdGhpcy5wYXJlbnQuZ2V0WCgpO1xuICAgICAgdGhpcy5hdl95ID0gdGhpcy5wYXJlbnQuZ2V0WSgpO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuYXZfeCArIHRoaXMucGFyZW50LkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRZKHkpO1xuICAgICAgICAgIHRoaXMucGFyZW50LlVwZGF0ZVVJKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wb3NfeSAtIGVfcG9zX3kpO1xuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgICAgICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgICAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLnBhcmVudC5lbENhbnZhcy5vZmZzZXRMZWZ0IC0geCwgdGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgICAgICBsZXQgbm9kZUVsID0gZXYudGFyZ2V0LmNsb3Nlc3QoJ1tub2RlLWlkXScpO1xuICAgICAgICAgICAgbGV0IG5vZGVJZCA9IG5vZGVFbD8uZ2V0QXR0cmlidXRlKCdub2RlLWlkJyk7XG4gICAgICAgICAgICBsZXQgbm9kZVRvID0gbm9kZUlkID8gdGhpcy5wYXJlbnQuR2V0Tm9kZUJ5SWQobm9kZUlkKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChub2RlVG8gJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IHRvSW5kZXggPSBub2RlRWw/LnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWRvdCcpPy5bMF0/LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xuICAgICAgdGhpcy5tb3VzZV95ID0gZV9wb3NfeTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBFbmRNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIC8vZml4IEZhc3QgQ2xpY2tcbiAgICBpZiAoKChnZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMTAwKSB8fCAhdGhpcy5mbGdNb3ZlKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBlX3Bvc194ID0gdGhpcy5tb3VzZV94O1xuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcbiAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xuICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcbiAgICAgIHRoaXMuYXZfeCA9IDA7XG4gICAgICB0aGlzLmF2X3kgPSAwO1xuICAgIH1cbiAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgdGhpcy50ZW1wTGluZS5DbG9uZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHByaXZhdGUga2V5ZG93bihldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKGV2LmtleSA9PT0gJ0RlbGV0ZScgfHwgKGV2LmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgZXYubWV0YUtleSkpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpPy5kZWxldGUoKTtcbiAgICAgIHRoaXMucGFyZW50LmdldExpbmVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgfVxuICAgIGlmIChldi5rZXkgPT09ICdGMicpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93LCBFdmVudEVudW0sIERhdGFGbG93LCBEYXRhVmlldyB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBpc0Z1bmN0aW9uIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmV4cG9ydCBjbGFzcyBOb2RlSXRlbSBleHRlbmRzIEJhc2VGbG93PERlc2dpbmVyVmlldz4ge1xuICAvKipcbiAgICogR0VUIFNFVCBmb3IgRGF0YVxuICAgKi9cbiAgcHVibGljIGdldE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ25hbWUnKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3knKTtcbiAgfVxuICBwdWJsaWMgc2V0WSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3knLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIGdldFgoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd4JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBDaGVja0tleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdrZXknKSA9PSBrZXk7XG4gIH1cbiAgcHVibGljIGdldERhdGFMaW5lKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdsaW5lcycpID8/IFtdO1xuICB9XG4gIHB1YmxpYyBjaGVja0xpbmVFeGlzdHMoZnJvbUluZGV4OiBudW1iZXIsIHRvOiBOb2RlSXRlbSwgdG9JbmRleDogTnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZS5maWx0ZXIoKGl0ZW06IExpbmUpID0+IHtcbiAgICAgIGlmICghaXRlbS50ZW1wICYmIGl0ZW0udG8gPT0gdG8gJiYgaXRlbS50b0luZGV4ID09IHRvSW5kZXggJiYgaXRlbS5mcm9tSW5kZXggPT0gZnJvbUluZGV4KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKCFpdGVtLnRlbXAgJiYgaXRlbS5mcm9tID09IHRvICYmIGl0ZW0uZnJvbUluZGV4ID09IHRvSW5kZXggJiYgaXRlbS50b0luZGV4ID09IGZyb21JbmRleCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0pLmxlbmd0aCA+IDA7XG4gIH1cbiAgcHVibGljIGVsQ29udGVudDogRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBhcnJMaW5lOiBMaW5lW10gPSBbXTtcbiAgcHJpdmF0ZSBvcHRpb246IGFueSA9IHt9O1xuICBwcml2YXRlIGFyckRhdGFWaWV3OiBEYXRhVmlld1tdID0gW107XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IERlc2dpbmVyVmlldywgcHJpdmF0ZSBrZXlOb2RlOiBhbnksIGRhdGE6IGFueSA9IHt9KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLm9wdGlvbiA9IHRoaXMucGFyZW50Lm1haW4uZ2V0Q29udHJvbE5vZGVCeUtleShrZXlOb2RlKTtcbiAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLm9wdGlvbj8ucHJvcGVydGllcztcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRhdGEuSW5pdERhdGEoeyAuLi5kYXRhLCBuYW1lOiB0aGlzLm9wdGlvbi5uYW1lIH0sIHRoaXMucHJvcGVydGllcyk7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhLkFwcGVuZCgnbm9kZXMnLCB0aGlzLmRhdGEpO1xuICAgIH1cbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtbm9kZScpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9uLmNsYXNzKTtcbiAgICB9XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdub2RlLWlkJywgdGhpcy5HZXRJZCgpKTtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6bm9uZScpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5yZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBnZXRPcHRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uO1xuICB9XG4gIHByaXZhdGUgcmVuZGVyVUkoZGV0YWlsOiBhbnkgPSBudWxsKSB7XG4gICAgaWYgKChkZXRhaWwgJiYgWyd4JywgJ3knXS5pbmNsdWRlcyhkZXRhaWwua2V5KSkpIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuZWxOb2RlLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpKSByZXR1cm47XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgaWYgKHRoaXMuZ2V0T3B0aW9uKCk/LmhpZGVUaXRsZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtbGVmdFwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXRvcFwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWJvdHRvbVwiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1yaWdodFwiPjwvZGl2PlxuICAgIGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS10b3BcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPiR7dGhpcy5vcHRpb24uaWNvbn0gJHt0aGlzLmdldE5hbWUoKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYm9keVwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtYm90dG9tXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXJpZ2h0XCI+PC9kaXY+XG4gICAgYDtcbiAgICB9XG5cbiAgICBjb25zdCBhZGROb2RlRG90ID0gKG51bTogbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZCwgc3RhcnQ6IG51bWJlciwgcXVlcnk6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKG51bSkge1xuICAgICAgICBsZXQgbm9kZVF1ZXJ5ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcihxdWVyeSk7XG4gICAgICAgIGlmIChub2RlUXVlcnkpIHtcbiAgICAgICAgICBub2RlUXVlcnkuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgbm9kZURvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgbm9kZURvdC5jbGFzc0xpc3QuYWRkKCdub2RlLWRvdCcpO1xuICAgICAgICAgICAgbm9kZURvdC5zZXRBdHRyaWJ1dGUoJ25vZGUnLCBgJHtzdGFydCArIGl9YCk7XG4gICAgICAgICAgICBub2RlUXVlcnkuYXBwZW5kQ2hpbGQobm9kZURvdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8ubGVmdCwgMTAwMCwgJy5ub2RlLWxlZnQnKTtcbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LnRvcCwgMjAwMCwgJy5ub2RlLXRvcCcpO1xuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8uYm90dG9tLCAzMDAwLCAnLm5vZGUtYm90dG9tJyk7XG4gICAgYWRkTm9kZURvdCh0aGlzLm9wdGlvbj8uZG90Py5yaWdodCwgNDAwMCwgJy5ub2RlLXJpZ2h0Jyk7XG5cbiAgICB0aGlzLmVsQ29udGVudCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWNvbnRlbnQgLmJvZHknKSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLnBhcmVudC5tYWluLnJlbmRlckh0bWwodGhpcywgdGhpcy5lbENvbnRlbnQpO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICB0aGlzLmFyckRhdGFWaWV3LmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uRGVsZXRlKCkpO1xuICAgIGlmIChpc0Z1bmN0aW9uKHRoaXMub3B0aW9uLnNjcmlwdCkpIHtcbiAgICAgIHRoaXMub3B0aW9uLnNjcmlwdCh7IG5vZGU6IHRoaXMsIGVsTm9kZTogdGhpcy5lbE5vZGUsIG1haW46IHRoaXMucGFyZW50Lm1haW4gfSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmVsQ29udGVudClcbiAgICAgIHRoaXMuYXJyRGF0YVZpZXcgPSBEYXRhVmlldy5CaW5kRWxlbWVudCh0aGlzLmVsQ29udGVudCwgdGhpcy5kYXRhLCB0aGlzLnBhcmVudC5tYWluKTtcbiAgfVxuICBwdWJsaWMgb3Blbkdyb3VwKCkge1xuICAgIGlmICh0aGlzLkNoZWNrS2V5KCdub2RlX2dyb3VwJykpIHtcbiAgICAgIHRoaXMucGFyZW50Lm9wZW5Hcm91cCh0aGlzLkdldElkKCkpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgdXBkYXRlUG9zaXRpb24oeDogYW55LCB5OiBhbnksIGlDaGVjayA9IGZhbHNlKSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICBsZXQgdGVtcHggPSB4O1xuICAgICAgbGV0IHRlbXB5ID0geTtcbiAgICAgIGlmICghaUNoZWNrKSB7XG4gICAgICAgIHRlbXB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICB0ZW1weCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0IC0geCk7XG4gICAgICB9XG4gICAgICBpZiAodGVtcHggIT09IHRoaXMuZ2V0WCgpKSB7XG4gICAgICAgIHRoaXMuc2V0WCh0ZW1weCk7XG4gICAgICB9XG4gICAgICBpZiAodGVtcHkgIT09IHRoaXMuZ2V0WSgpKSB7XG4gICAgICAgIHRoaXMuc2V0WSh0ZW1weSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcnJMaW5lO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmUpIHtcbiAgICB0aGlzLmFyckxpbmUgPSBbLi4udGhpcy5hcnJMaW5lLCBsaW5lXTtcbiAgfVxuICBwdWJsaWMgZ2V0UG9zdGlzaW9uRG90KGluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZT8ucXVlcnlTZWxlY3RvcihgLm5vZGUtZG90W25vZGU9XCIke2luZGV4fVwiXWApO1xuICAgIGlmIChlbERvdCkge1xuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xuICAgICAgbGV0IHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCArIGVsRG90Lm9mZnNldExlZnQgKyAxMCk7XG4gICAgICByZXR1cm4geyB4LCB5IH07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uVXBkYXRlVUkoKTtcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNDbGVhckRhdGEgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMsIGlzQ2xlYXJEYXRhKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5kYXRhLmRlbGV0ZSgpO1xuICAgIGVsc2Uge1xuICAgICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLnJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5SZW1vdmVEYXRhRXZlbnQoKTtcbiAgICB9XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZSgpO1xuICAgIHRoaXMuYXJyTGluZSA9IFtdO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7fSk7XG4gIH1cbiAgcHVibGljIFJlbmRlckxpbmUoKSB7XG4gICAgdGhpcy5nZXREYXRhTGluZSgpLmZvckVhY2goKGl0ZW06IERhdGFGbG93KSA9PiB7XG4gICAgICBsZXQgbm9kZUZyb20gPSB0aGlzO1xuICAgICAgbGV0IG5vZGVUbyA9IHRoaXMucGFyZW50LkdldE5vZGVCeUlkKGl0ZW0uR2V0KCd0bycpKTtcbiAgICAgIGxldCB0b0luZGV4ID0gaXRlbS5HZXQoJ3RvSW5kZXgnKTtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBpdGVtLkdldCgnZnJvbUluZGV4Jyk7XG4gICAgICBuZXcgTGluZShub2RlRnJvbSwgZnJvbUluZGV4LCBub2RlVG8sIHRvSW5kZXgsIGl0ZW0pLlVwZGF0ZVVJKCk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBGbG93Q29yZSwgSU1haW4sIEV2ZW50RW51bSwgUHJvcGVydHlFbnVtLCBTY29wZVJvb3QgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3X0V2ZW50IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3X0V2ZW50XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfVG9vbGJhciB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld19Ub29sYmFyXCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi9Ob2RlSXRlbVwiO1xuXG5leHBvcnQgY29uc3QgWm9vbSA9IHtcbiAgbWF4OiAxLjYsXG4gIG1pbjogMC42LFxuICB2YWx1ZTogMC4xLFxuICBkZWZhdWx0OiAxXG59XG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3IGV4dGVuZHMgRmxvd0NvcmUge1xuXG4gIC8qKlxuICAgKiBHRVQgU0VUIGZvciBEYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0Wm9vbSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd6b29tJyk7XG4gIH1cbiAgcHVibGljIHNldFpvb20odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgnem9vbScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd5Jyk7XG4gIH1cbiAgcHVibGljIHNldFkodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwcml2YXRlIGdyb3VwRGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgbGFzdEdyb3VwTmFtZTogc3RyaW5nID0gXCJcIjtcbiAgcHJpdmF0ZSBnZXREYXRhR3JvdXAoKTogRGF0YUZsb3cge1xuICAgIGlmICh0aGlzLiRsb2NrKSByZXR1cm4gdGhpcy5kYXRhO1xuICAgIC8vIGNhY2hlIGdyb3VwRGF0YVxuICAgIGlmICh0aGlzLmxhc3RHcm91cE5hbWUgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpIHJldHVybiB0aGlzLmdyb3VwRGF0YSA/PyB0aGlzLmRhdGE7XG4gICAgdGhpcy5sYXN0R3JvdXBOYW1lID0gdGhpcy5DdXJyZW50R3JvdXAoKTtcbiAgICBsZXQgZ3JvdXBzID0gdGhpcy5kYXRhLkdldCgnZ3JvdXBzJyk7XG4gICAgdGhpcy5ncm91cERhdGEgPSBncm91cHM/LmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KCdncm91cCcpID09IHRoaXMubGFzdEdyb3VwTmFtZSk/LlswXTtcbiAgICBpZiAoIXRoaXMuZ3JvdXBEYXRhKSB7XG4gICAgICB0aGlzLmdyb3VwRGF0YSA9IG5ldyBEYXRhRmxvdyh0aGlzLm1haW4sIHtcbiAgICAgICAga2V5OiBQcm9wZXJ0eUVudW0uZ3JvdXBDYXZhcyxcbiAgICAgICAgZ3JvdXA6IHRoaXMubGFzdEdyb3VwTmFtZVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRhdGEuQXBwZW5kKCdncm91cHMnLCB0aGlzLmdyb3VwRGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICB9XG4gICAgbGV0IGRhdGFHcm91cCA9IHRoaXMuR2V0RGF0YUJ5SWQodGhpcy5sYXN0R3JvdXBOYW1lKTtcbiAgICBpZiAoZGF0YUdyb3VwKSB7XG4gICAgICBkYXRhR3JvdXAub25TYWZlKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuVXBkYXRlVUkuYmluZCh0aGlzKTtcbiAgICAgICAgLy8gIHRoaXMudG9vbGJhci5yZW5kZXJQYXRoR3JvdXAoKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ3JvdXBEYXRhO1xuICB9XG4gIHByaXZhdGUgZ3JvdXA6IGFueVtdID0gW107XG4gIHB1YmxpYyBHZXRHcm91cE5hbWUoKTogYW55W10ge1xuICAgIHJldHVybiBbLi4udGhpcy5ncm91cC5tYXAoKGl0ZW0pID0+ICh7IGlkOiBpdGVtLCB0ZXh0OiB0aGlzLkdldERhdGFCeUlkKGl0ZW0pPy5HZXQoJ25hbWUnKSB9KSksIHsgaWQ6IFNjb3BlUm9vdCwgdGV4dDogU2NvcGVSb290IH1dO1xuICB9XG4gIHB1YmxpYyBCYWNrR3JvdXAoaWQ6IGFueSA9IG51bGwpIHtcbiAgICBsZXQgaW5kZXggPSAxO1xuICAgIGlmIChpZCkge1xuICAgICAgaW5kZXggPSB0aGlzLmdyb3VwLmluZGV4T2YoaWQpO1xuICAgICAgaWYgKGluZGV4IDwgMCkgaW5kZXggPSAwO1xuICAgIH1cbiAgICBpZiAoaW5kZXgpXG4gICAgICB0aGlzLmdyb3VwLnNwbGljZSgwLCBpbmRleCk7XG4gICAgZWxzZSB0aGlzLmdyb3VwID0gW107XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICAgIHRoaXMuY2hhbmdlR3JvdXAoKTtcbiAgfVxuICBwdWJsaWMgQ3VycmVudEdyb3VwKCkge1xuICAgIGxldCBuYW1lID0gdGhpcy5ncm91cD8uWzBdO1xuICAgIGlmIChuYW1lICYmIG5hbWUgIT0gJycpIHtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbiAgICByZXR1cm4gJ3Jvb3QnO1xuICB9XG5cbiAgcHVibGljIEN1cnJlbnRHcm91cERhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuR2V0RGF0YUJ5SWQodGhpcy5DdXJyZW50R3JvdXAoKSkgPz8gdGhpcy5kYXRhO1xuICB9XG4gIHB1YmxpYyBjaGFuZ2VHcm91cCgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMubWFpbi5kaXNwYXRjaChFdmVudEVudW0uZ3JvdXBDaGFuZ2UsIHtcbiAgICAgICAgZ3JvdXA6IHRoaXMuR2V0R3JvdXBOYW1lKClcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8vIHRoaXMudG9vbGJhci5yZW5kZXJQYXRoR3JvdXAoKTtcbiAgfVxuICBwdWJsaWMgb3Blbkdyb3VwKGlkOiBhbnkpIHtcbiAgICB0aGlzLmdyb3VwID0gW2lkLCAuLi50aGlzLmdyb3VwXTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgdGhpcy5jaGFuZ2VHcm91cCgpOztcbiAgfVxuICBwcml2YXRlIGxpbmVDaG9vc2U6IExpbmUgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBzZXRMaW5lQ2hvb3NlKG5vZGU6IExpbmUgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5saW5lQ2hvb3NlKSB0aGlzLmxpbmVDaG9vc2UuQWN0aXZlKGZhbHNlKTtcbiAgICB0aGlzLmxpbmVDaG9vc2UgPSBub2RlO1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHtcbiAgICAgIHRoaXMubGluZUNob29zZS5BY3RpdmUoKTtcbiAgICAgIHRoaXMuc2V0Tm9kZUNob29zZSh1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZ2V0TGluZUNob29zZSgpOiBMaW5lIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5saW5lQ2hvb3NlO1xuICB9XG4gIHByaXZhdGUgbm9kZXM6IE5vZGVJdGVtW10gPSBbXTtcbiAgcHJpdmF0ZSBub2RlQ2hvb3NlOiBOb2RlSXRlbSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldE5vZGVDaG9vc2Uobm9kZTogTm9kZUl0ZW0gfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5ub2RlQ2hvb3NlKSB0aGlzLm5vZGVDaG9vc2UuQWN0aXZlKGZhbHNlKTtcbiAgICB0aGlzLm5vZGVDaG9vc2UgPSBub2RlO1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHtcbiAgICAgIHRoaXMubm9kZUNob29zZS5BY3RpdmUoKTtcbiAgICAgIHRoaXMuc2V0TGluZUNob29zZSh1bmRlZmluZWQpO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCB7IGRhdGE6IHRoaXMubm9kZUNob29zZS5kYXRhIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5DdXJyZW50R3JvdXBEYXRhKCkgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXROb2RlQ2hvb3NlKCk6IE5vZGVJdGVtIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlQ2hvb3NlO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlSXRlbShkYXRhOiBhbnkpOiBOb2RlSXRlbSB7XG4gICAgcmV0dXJuIHRoaXMuQWRkTm9kZShkYXRhLkdldCgna2V5JyksIGRhdGEpO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlKGtleU5vZGU6IHN0cmluZywgZGF0YTogYW55ID0ge30pOiBOb2RlSXRlbSB7XG4gICAgcmV0dXJuIHRoaXMuSW5zZXJ0Tm9kZShuZXcgTm9kZUl0ZW0odGhpcywga2V5Tm9kZSwgZGF0YSkpO1xuICB9XG4gIHB1YmxpYyBJbnNlcnROb2RlKG5vZGU6IE5vZGVJdGVtKTogTm9kZUl0ZW0ge1xuICAgIHRoaXMubm9kZXMgPSBbLi4udGhpcy5ub2Rlcywgbm9kZV07XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbiAgcHVibGljIFJlbW92ZU5vZGUobm9kZTogTm9kZUl0ZW0pIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yobm9kZSk7XG4gICAgdGhpcy5kYXRhLlJlbW92ZSgnbm9kZXMnLCBub2RlKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ub2RlcztcbiAgfVxuICBwdWJsaWMgQ2xlYXJOb2RlKCkge1xuICAgIHRoaXMubm9kZXM/LmZvckVhY2goaXRlbSA9PiBpdGVtLmRlbGV0ZShmYWxzZSkpO1xuICAgIHRoaXMubm9kZXMgPSBbXTtcbiAgfVxuICBwdWJsaWMgR2V0RGF0YUFsbE5vZGUoKTogYW55W10ge1xuICAgIHJldHVybiAodGhpcy5kYXRhPy5HZXQoJ25vZGVzJykgPz8gW10pO1xuICB9XG4gIHB1YmxpYyBHZXREYXRhTm9kZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuR2V0RGF0YUFsbE5vZGUoKS5maWx0ZXIoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLkdldChcImdyb3VwXCIpID09PSB0aGlzLkN1cnJlbnRHcm91cCgpKTtcbiAgfVxuICAvKipcbiAgICogVmFyaWJ1dGVcbiAgKi9cbiAgcHVibGljIGVsQ2FudmFzOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAvLyAgcHVibGljIGVsVG9vbGJhcjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgLy9wdWJsaWMgdG9vbGJhcjogRGVzZ2luZXJWaWV3X1Rvb2xiYXI7XG4gIHB1YmxpYyAkbG9jazogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBhbnkgPSAxO1xuICBwdWJsaWMgY29uc3RydWN0b3IoZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmVsTm9kZSA9IGVsTm9kZTtcbiAgICBsZXQgcHJvcGVydGllczogYW55ID0gdGhpcy5tYWluLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLm1haW4pO1xuICAgIHRoaXMuZGF0YS5Jbml0RGF0YSh7fSwgcHJvcGVydGllcyk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnZGVzZ2luZXItdmlldycpXG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QucmVtb3ZlKFwiZGVzZ2luZXItY2FudmFzXCIpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2Rlc2dpbmVyLXZpZXcnKVxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LmFkZChcImRlc2dpbmVyLWNhbnZhc1wiKTtcbiAgICAvLyB0aGlzLmVsVG9vbGJhci5jbGFzc0xpc3QuYWRkKFwiZGVzZ2luZXItdG9vbGJhclwiKTtcbiAgICAvLyB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsVG9vbGJhcik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XG4gICAgdGhpcy5lbE5vZGUudGFiSW5kZXggPSAwO1xuICAgIG5ldyBEZXNnaW5lclZpZXdfRXZlbnQodGhpcyk7XG4gICAgLy8gdGhpcy50b29sYmFyID0gbmV3IERlc2dpbmVyVmlld19Ub29sYmFyKHRoaXMpO1xuICAgIHRoaXMub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMuUmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5vbihFdmVudEVudW0uc2hvd1Byb3BlcnR5LCAoZGF0YTogYW55KSA9PiB7IG1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgZGF0YSk7IH0pO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHRoaXMuT3BlbihpdGVtLmRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMuY2hhbmdlR3JvdXAoKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVWaWV3KHg6IGFueSwgeTogYW55LCB6b29tOiBhbnkpIHtcbiAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt4fXB4LCAke3l9cHgpIHNjYWxlKCR7em9vbX0pYDtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy51cGRhdGVWaWV3KHRoaXMuZ2V0WCgpLCB0aGlzLmdldFkoKSwgdGhpcy5nZXRab29tKCkpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXJVSShkZXRhaWw6IGFueSA9IHt9KSB7XG4gICAgaWYgKGRldGFpbC5zZW5kZXIgJiYgZGV0YWlsLnNlbmRlciBpbnN0YW5jZW9mIE5vZGVJdGVtKSByZXR1cm47XG4gICAgaWYgKGRldGFpbC5zZW5kZXIgJiYgZGV0YWlsLnNlbmRlciBpbnN0YW5jZW9mIERlc2dpbmVyVmlldykge1xuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLkNsZWFyTm9kZSgpO1xuICAgIHRoaXMuR2V0RGF0YU5vZGUoKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHRoaXMuQWRkTm9kZUl0ZW0oaXRlbSk7XG4gICAgfSk7XG4gICAgdGhpcy5HZXRBbGxOb2RlKCkuZm9yRWFjaCgoaXRlbTogTm9kZUl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uUmVuZGVyTGluZSgpO1xuICAgIH0pXG4gICAgdGhpcy5VcGRhdGVVSSgpO1xuICB9XG4gIHB1YmxpYyBPcGVuKCRkYXRhOiBEYXRhRmxvdykge1xuICAgIGlmICgkZGF0YSA9PSB0aGlzLmRhdGEpIHtcbiAgICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5kYXRhPy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwgKGRldGFpbDogYW55KSA9PiB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCBkZXRhaWwpKTtcbiAgICB0aGlzLmRhdGEgPSAkZGF0YTtcbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIChkZXRhaWw6IGFueSkgPT4gdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwgZGV0YWlsKSk7XG4gICAgdGhpcy4kbG9jayA9IGZhbHNlO1xuICAgIHRoaXMubGFzdEdyb3VwTmFtZSA9ICcnO1xuICAgIHRoaXMuZ3JvdXBEYXRhID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZ3JvdXAgPSBbXTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICB9XG4gIHB1YmxpYyBDYWxjWChudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRXaWR0aCAvICh0aGlzLmVsTm9kZT8uY2xpZW50V2lkdGggKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHB1YmxpYyBDYWxjWShudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRIZWlnaHQgLyAodGhpcy5lbE5vZGU/LmNsaWVudEhlaWdodCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHVibGljIEdldEFsbE5vZGUoKTogTm9kZUl0ZW1bXSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZXMgfHwgW107XG4gIH1cbiAgcHVibGljIEdldE5vZGVCeUlkKGlkOiBzdHJpbmcpOiBOb2RlSXRlbSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuR2V0QWxsTm9kZSgpLmZpbHRlcihub2RlID0+IG5vZGUuR2V0SWQoKSA9PSBpZCk/LlswXTtcbiAgfVxuXG4gIHB1YmxpYyBHZXREYXRhQnlJZChpZDogc3RyaW5nKTogRGF0YUZsb3cgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQWxsTm9kZSgpLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5HZXQoJ2lkJykgPT09IGlkKT8uWzBdO1xuICB9XG4gIGNoZWNrT25seU5vZGUoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gKHRoaXMubWFpbi5nZXRDb250cm9sQnlLZXkoa2V5KS5vbmx5Tm9kZSkgJiYgdGhpcy5ub2Rlcy5maWx0ZXIoaXRlbSA9PiBpdGVtLkNoZWNrS2V5KGtleSkpLmxlbmd0aCA+IDA7XG4gIH1cbiAgcHVibGljIHpvb21fcmVmcmVzaChmbGc6IGFueSA9IDApIHtcbiAgICBsZXQgdGVtcF96b29tID0gZmxnID09IDAgPyBab29tLmRlZmF1bHQgOiAodGhpcy5nZXRab29tKCkgKyBab29tLnZhbHVlICogZmxnKTtcbiAgICBpZiAoWm9vbS5tYXggPj0gdGVtcF96b29tICYmIHRlbXBfem9vbSA+PSBab29tLm1pbikge1xuICAgICAgdGhpcy5zZXRYKCh0aGlzLmdldFgoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XG4gICAgICB0aGlzLnNldFkoKHRoaXMuZ2V0WSgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGVtcF96b29tKTtcbiAgICAgIHRoaXMuem9vbV9sYXN0X3ZhbHVlID0gdGVtcF96b29tO1xuICAgICAgdGhpcy5zZXRab29tKHRoaXMuem9vbV9sYXN0X3ZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21faW4oKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMSk7XG4gIH1cbiAgcHVibGljIHpvb21fb3V0KCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKC0xKTtcbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgwKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIEV2ZW50RW51bSwgSU1haW4sIFNjb3BlUm9vdCB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5cbmV4cG9ydCBjbGFzcyBWYXJpYWJsZVZpZXcge1xuICBwcml2YXRlIHZhcmlhYmxlczogRGF0YUZsb3dbXSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy12YXJpYWJsZScpO1xuICAgIHRoaXMubWFpbi5vblNhZmUoRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCAoeyBkYXRhIH06IGFueSkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoKTtcbiAgICB9KTtcbiAgICB0aGlzLm1haW4ub25TYWZlKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKCkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoKTtcbiAgICB9KTtcbiAgICB0aGlzLm1haW4ub25TYWZlKEV2ZW50RW51bS5ncm91cENoYW5nZSwgKCkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoKTtcbiAgICB9KVxuICAgIHRoaXMuUmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIFJlbmRlcigpIHtcbiAgICB0aGlzLnZhcmlhYmxlcyA9IHRoaXMubWFpbi5nZXRWYXJpYWJsZSgpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDx0YWJsZSBib3JkZXI9XCIxXCI+XG4gICAgICAgIDx0aGVhZD5cbiAgICAgICAgICA8dHI+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1uYW1lXCI+TmFtZTwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS10eXBlXCI+VHlwZTwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1zY29wZVwiPlNjb3BlPC90ZD5cbiAgICAgICAgICAgIDx0ZCBjbGFzcz1cInZhcmlhYmxlLWRlZmF1bHRcIj5EZWZhdWx0PC90ZD5cbiAgICAgICAgICAgIDx0ZCBjbGFzcz1cInZhcmlhYmxlLWJ1dHRvblwiPjwvdGQ+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90aGVhZD5cbiAgICAgICAgPHRib2R5PlxuICAgICAgICA8L3Rib2R5PlxuICAgICAgPC90YWJsZT5cbiAgICBgO1xuICAgIGlmICh0aGlzLnZhcmlhYmxlcykge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnZhcmlhYmxlcykge1xuICAgICAgICBuZXcgVmFyaWFibGVJdGVtKGl0ZW0sIHRoaXMpLlJlbmRlclNjb3BlKHRoaXMubWFpbi5nZXRHcm91cEN1cnJlbnQoKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5jbGFzcyBWYXJpYWJsZUl0ZW0ge1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuICBwcml2YXRlIG5hbWVJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICBwcml2YXRlIHR5cGVJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgcHJpdmF0ZSBzY29wZUlucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuICBwcml2YXRlIHZhbHVlRGVmYXVsdElucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHZhcmlhYmxlOiBEYXRhRmxvdywgcHJpdmF0ZSBwYXJlbnQ6IFZhcmlhYmxlVmlldykge1xuICAgICh0aGlzLm5hbWVJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5HZXQoJ25hbWUnKTtcbiAgICAodGhpcy52YWx1ZURlZmF1bHRJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5HZXQoJ2luaXRhbFZhbHVlJykgPz8gJyc7XG4gICAgKHRoaXMudHlwZUlucHV0IGFzIGFueSkudmFsdWUgPSB0aGlzLnZhcmlhYmxlLkdldCgndHlwZScpID8/ICcnO1xuICAgIGZvciAobGV0IGl0ZW0gb2YgWyd0ZXh0JywgJ251bWJlcicsICdkYXRlJywgJ29iamVjdCddKSB7XG4gICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICBvcHRpb24udGV4dCA9IGl0ZW07XG4gICAgICBvcHRpb24udmFsdWUgPSBpdGVtO1xuICAgICAgdGhpcy50eXBlSW5wdXQuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgICB9XG4gICAgbGV0IG5hbWVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIG5hbWVDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy5uYW1lSW5wdXQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG5hbWVDb2x1bW4pO1xuICAgIHRoaXMubmFtZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnbmFtZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLm5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnbmFtZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcblxuICAgIGxldCB0eXBlQ29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICB0eXBlQ29sdW1uLmFwcGVuZENoaWxkKHRoaXMudHlwZUlucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0eXBlQ29sdW1uKTtcbiAgICB0aGlzLnR5cGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgndHlwZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgICBsZXQgc2NvcGVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIHNjb3BlQ29sdW1uLmFwcGVuZENoaWxkKHRoaXMuc2NvcGVJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoc2NvcGVDb2x1bW4pO1xuXG5cbiAgICBsZXQgdmFsdWVEZWZhdWx0Q29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICB2YWx1ZURlZmF1bHRDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy52YWx1ZURlZmF1bHRJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodmFsdWVEZWZhdWx0Q29sdW1uKTtcbiAgICB0aGlzLnZhbHVlRGVmYXVsdElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmFyaWFibGUuU2V0KCdpbml0YWxWYWx1ZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLnZhbHVlRGVmYXVsdElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnaW5pdGFsVmFsdWUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBsZXQgYnV0dG9uUmVtb3ZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYnV0dG9uUmVtb3ZlLmlubmVySFRNTCA9IGAtYDtcbiAgICBidXR0b25SZW1vdmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBwYXJlbnQubWFpbi5yZW1vdmVWYXJpYWJsZSh2YXJpYWJsZSk7XG4gICAgfSk7XG4gICAgbGV0IGJ1dHRvblJlbW92ZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgYnV0dG9uUmVtb3ZlQ29sdW1uLmFwcGVuZENoaWxkKGJ1dHRvblJlbW92ZSk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoYnV0dG9uUmVtb3ZlQ29sdW1uKTtcblxuICAgIHBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcigndGFibGUgdGJvZHknKT8uYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuXG4gIH1cbiAgUmVuZGVyU2NvcGUoZ3JvdXA6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLnNjb3BlSW5wdXQuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIGdyb3VwKSB7XG4gICAgICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgICAgb3B0aW9uLnRleHQgPSBpdGVtLnRleHQ7XG4gICAgICAgIG9wdGlvbi52YWx1ZSA9IGl0ZW0uaWQ7XG4gICAgICAgIHRoaXMuc2NvcGVJbnB1dC5wcmVwZW5kKG9wdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgICh0aGlzLnNjb3BlSW5wdXQgYXMgYW55KS52YWx1ZSA9IHRoaXMudmFyaWFibGUuR2V0KCdzY29wZScpO1xuICAgIHRoaXMuc2NvcGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnc2NvcGUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIFRvb2xib3hWaWV3IHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy10b29sYm94Jyk7XG4gICAgdGhpcy5SZW5kZXIoKTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyKCkge1xuICAgIGxldCBjb250cm9scyA9IHRoaXMubWFpbi5nZXRDb250cm9sQWxsKCk7XG4gICAgbGV0IGdyb3VwOiBhbnkgPSB7fTtcblxuICAgIE9iamVjdC5rZXlzKGNvbnRyb2xzKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGxldCBncm91cE5hbWUgPSBjb250cm9sc1tpdGVtXS5ncm91cCA/PyBcIm90aGVyXCI7XG4gICAgICBpZiAoZ3JvdXBbZ3JvdXBOYW1lXSA9PT0gdW5kZWZpbmVkKSBncm91cFtncm91cE5hbWVdID0gW107XG4gICAgICBncm91cFtncm91cE5hbWVdID0gW1xuICAgICAgICAuLi5ncm91cFtncm91cE5hbWVdLFxuICAgICAgICBjb250cm9sc1tpdGVtXVxuICAgICAgXTtcbiAgICB9KTtcbiAgICBPYmplY3Qua2V5cyhncm91cCkuZm9yRWFjaCgoaXRlbTogYW55LCBpbmRleCkgPT4ge1xuICAgICAgbGV0IGl0ZW1Cb3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGl0ZW1Cb3guY2xhc3NMaXN0LmFkZCgnbm9kZS1ib3gnKTtcbiAgICAgIGl0ZW1Cb3guY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICBpdGVtQm94LmlubmVySFRNTCA9IGBcbiAgICAgICAgPHAgY2xhc3M9XCJub2RlLWJveF90aXRsZVwiPiR7aXRlbX08L3A+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWJveF9ib2J5XCI+PC9kaXY+XG4gICAgICBgO1xuICAgICAgaXRlbUJveC5xdWVyeVNlbGVjdG9yKCcubm9kZS1ib3hfdGl0bGUnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGlmIChpdGVtQm94LmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykpIHtcbiAgICAgICAgICBpdGVtQm94LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXRlbUJveC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGZvciAobGV0IF9pdGVtIG9mIGdyb3VwW2l0ZW1dKSB7XG4gICAgICAgIGxldCBub2RlSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcbiAgICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkcmFnZ2FibGUnLCAndHJ1ZScpO1xuICAgICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScsIF9pdGVtLmtleSk7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke19pdGVtLmljb259IDxzcGFuPiR7X2l0ZW0ubmFtZX08L3NwYW5gO1xuICAgICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLmRyYWdTdGFydC5iaW5kKHRoaXMpKVxuICAgICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW5kJywgdGhpcy5kcmFnZW5kLmJpbmQodGhpcykpXG4gICAgICAgIGl0ZW1Cb3gucXVlcnlTZWxlY3RvcignLm5vZGUtYm94X2JvYnknKT8uYXBwZW5kQ2hpbGQobm9kZUl0ZW0pO1xuICAgICAgfVxuICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoaXRlbUJveCk7XG4gICAgfSk7XG4gIH1cbiAgcHJpdmF0ZSBkcmFnZW5kKGU6IGFueSkge1xuICAgIHRoaXMubWFpbi5zZXRDb250cm9sQ2hvb3NlKG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBkcmFnU3RhcnQoZTogYW55KSB7XG4gICAgbGV0IGtleSA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIubm9kZS1pdGVtXCIpLmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJyk7XG4gICAgdGhpcy5tYWluLnNldENvbnRyb2xDaG9vc2Uoa2V5KTtcbiAgICBpZiAoZS50eXBlICE9PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwga2V5KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IEV2ZW50RW51bSwgSU1haW4sIERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIFByb2plY3RWaWV3IHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1wcm9qZWN0Jyk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5jaGFuZ2VWYXJpYWJsZSwgdGhpcy5SZW5kZXIuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgdGhpcy5SZW5kZXIuYmluZCh0aGlzKSk7XG4gIH1cbiAgcHVibGljIFJlbmRlcigpIHtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcbiAgICBsZXQgcHJvamVjdHMgPSB0aGlzLm1haW4uZ2V0UHJvamVjdEFsbCgpO1xuICAgIHByb2plY3RzLmZvckVhY2goKGl0ZW06IERhdGFGbG93KSA9PiB7XG4gICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ25vZGUtaXRlbScpO1xuICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QtaWQnLCBpdGVtLkdldCgnaWQnKSk7XG4gICAgICBpdGVtLm9uU2FmZShgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5tYWluLmNoZWNrUHJvamVjdE9wZW4oaXRlbSkpIHtcbiAgICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICB9XG4gICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgdGhpcy5tYWluLnNldFByb2plY3RPcGVuKGl0ZW0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmVsTm9kZT8uYXBwZW5kQ2hpbGQobm9kZUl0ZW0pO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9JRmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgVGFiUHJvamVjdFZpZXcge1xuICBwcml2YXRlICRlbEJvYnk6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwcml2YXRlICRlbFdhcnA6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwcml2YXRlICRidG5OZXh0OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHJpdmF0ZSAkYnRuQmFjazogRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHByaXZhdGUgJGJ0bkFkZDogRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtdGFiLXByb2plY3QnKTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB0aGlzLlJlbmRlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLlJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXIoKSB7XG4gICAgbGV0IHNjcm9sbExlZnRDYWNoZSA9IHRoaXMuJGVsV2FycD8uc2Nyb2xsTGVmdCA/PyAwO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3RfX3NlYXJjaFwiPjwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9fbGlzdFwiPlxuICAgICAgPGRpdiBjbGFzcz1cInRhYi1wcm9qZWN0X2J1dHRvblwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuLWJhY2tcIj48aSBjbGFzcz1cImZhcyBmYS1hbmdsZS1sZWZ0XCI+PC9pPjwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3Rfd2FycFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3RfX2JvZHlcIj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9idXR0b25cIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1uZXh0XCI+PGkgY2xhc3M9XCJmYXMgZmEtYW5nbGUtcmlnaHRcIj48L2k+PC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9idXR0b25cIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1hZGRcIj48aSBjbGFzcz1cImZhcyBmYS1wbHVzXCI+PC9pPjwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgYDtcbiAgICB0aGlzLiRlbFdhcnAgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudGFiLXByb2plY3Rfd2FycCcpO1xuICAgIHRoaXMuJGVsQm9ieSA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy50YWItcHJvamVjdF9fYm9keScpO1xuICAgIHRoaXMuJGJ0bkJhY2sgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuLWJhY2snKTtcbiAgICB0aGlzLiRidG5OZXh0ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bi1uZXh0Jyk7XG4gICAgdGhpcy4kYnRuQWRkID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bi1hZGQnKTtcbiAgICBjb25zdCBmblVwZGF0ZVNjcm9sbCA9ICgpID0+IHtcbiAgICAgIGlmICh0aGlzLiRlbFdhcnApIHtcbiAgICAgICAgLy8gbGV0IHNjcm9sbExlZnQgPSB0aGlzLiRlbFdhcnAuc2Nyb2xsTGVmdDtcbiAgICAgICAgLy8gdmFyIG1heFNjcm9sbExlZnQgPSB0aGlzLiRlbFdhcnAuc2Nyb2xsV2lkdGggLSB0aGlzLiRlbFdhcnAuY2xpZW50V2lkdGg7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHNjcm9sbExlZnQpO1xuICAgICAgICAvLyBpZiAodGhpcy4kYnRuQmFjayAmJiBzY3JvbGxMZWZ0IDw9IDApIHtcbiAgICAgICAgLy8gICB0aGlzLiRidG5CYWNrLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApXG4gICAgICAgIC8vIH0gZWxzZSBpZiAodGhpcy4kYnRuQmFjayAmJiBzY3JvbGxMZWZ0ID4gMCkge1xuICAgICAgICAvLyAgIHRoaXMuJGJ0bkJhY2sucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGlmICh0aGlzLiRidG5OZXh0ICYmIHNjcm9sbExlZnQgPj0gbWF4U2Nyb2xsTGVmdCkge1xuICAgICAgICAvLyAgIHRoaXMuJGJ0bk5leHQuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YClcbiAgICAgICAgLy8gfSBlbHNlIGlmICh0aGlzLiRidG5OZXh0ICYmIHNjcm9sbExlZnQgPD0gMCkge1xuICAgICAgICAvLyAgIHRoaXMuJGJ0bk5leHQucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICAgICAgICAvLyB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuJGVsV2FycD8uYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBldmVudCA9PiB7XG4gICAgICBmblVwZGF0ZVNjcm9sbCgpO1xuICAgIH0sIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgICBmblVwZGF0ZVNjcm9sbCgpO1xuICAgIHRoaXMuJGJ0bkJhY2s/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuJGVsV2FycCkge1xuICAgICAgICB0aGlzLiRlbFdhcnAuc2Nyb2xsTGVmdCAtPSAxMDA7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kYnRuTmV4dD8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy4kZWxXYXJwKSB7XG4gICAgICAgIHRoaXMuJGVsV2FycC5zY3JvbGxMZWZ0ICs9IDEwMDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiRidG5BZGQ/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgdGhpcy5tYWluLm5ld1Byb2plY3QoXCJcIik7XG4gICAgfSk7XG4gICAgbGV0IHByb2plY3RzID0gdGhpcy5tYWluLmdldFByb2plY3RBbGwoKTtcbiAgICBsZXQgaXRlbUFjdGl2ZTogYW55ID0gdW5kZWZpbmVkO1xuICAgIGZvciAobGV0IHByb2plY3Qgb2YgcHJvamVjdHMpIHtcbiAgICAgIGxldCBwcm9qZWN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbGV0IHByb2plY3ROYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgbGV0IHByb2plY3RCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGxldCBwcm9qZWN0QnV0dG9uUmVtb3ZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBwcm9qZWN0SXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdC1pZCcsIHByb2plY3QuR2V0KCdpZCcpKTtcbiAgICAgIHByb2plY3ROYW1lLmlubmVySFRNTCA9IHByb2plY3QuR2V0KCduYW1lJyk7XG4gICAgICBwcm9qZWN0TmFtZS5jbGFzc0xpc3QuYWRkKCdwcm8tbmFtZScpO1xuICAgICAgcHJvamVjdEJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdwcm8tYnV0dG9uJyk7XG4gICAgICBwcm9qZWN0QnV0dG9uUmVtb3ZlLmlubmVySFRNTCA9IGA8aSBjbGFzcz1cImZhcyBmYS1taW51c1wiPjwvaT5gO1xuICAgICAgcHJvamVjdEJ1dHRvbi5hcHBlbmRDaGlsZChwcm9qZWN0QnV0dG9uUmVtb3ZlKTtcbiAgICAgIHByb2plY3RJdGVtLmFwcGVuZENoaWxkKHByb2plY3ROYW1lKTtcbiAgICAgIHByb2plY3RJdGVtLmFwcGVuZENoaWxkKHByb2plY3RCdXR0b24pO1xuXG4gICAgICBwcm9qZWN0SXRlbS5jbGFzc0xpc3QuYWRkKCdwcm9qZWN0LWl0ZW0nKTtcbiAgICAgIGlmICh0aGlzLm1haW4uY2hlY2tQcm9qZWN0T3Blbihwcm9qZWN0KSkge1xuICAgICAgICBwcm9qZWN0SXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgaXRlbUFjdGl2ZSA9IHByb2plY3RJdGVtO1xuICAgICAgfVxuICAgICAgcHJvamVjdEl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBpZiAoIXByb2plY3RCdXR0b25SZW1vdmUuY29udGFpbnMoZS50YXJnZXQgYXMgTm9kZSkgJiYgZS50YXJnZXQgIT0gcHJvamVjdEJ1dHRvblJlbW92ZSkge1xuICAgICAgICAgIHRoaXMubWFpbi5zZXRQcm9qZWN0T3Blbihwcm9qZWN0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBwcm9qZWN0QnV0dG9uUmVtb3ZlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgdGhpcy5tYWluLnJlbW92ZVByb2plY3QocHJvamVjdCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuJGVsQm9ieT8uYXBwZW5kQ2hpbGQocHJvamVjdEl0ZW0pO1xuICAgICAgcHJvamVjdC5vblNhZmUoRXZlbnRFbnVtLmRhdGFDaGFuZ2UgKyAnX25hbWUnLCAoKSA9PiB7XG4gICAgICAgIHByb2plY3ROYW1lLmlubmVySFRNTCA9IHByb2plY3QuR2V0KCduYW1lJyk7XG4gICAgICB9KVxuICAgIH1cbiAgICBpZiAodGhpcy4kZWxXYXJwKSB7XG4gICAgICBpZiAoaXRlbUFjdGl2ZSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy4kZWxXYXJwLnNjcm9sbExlZnQgPSBpdGVtQWN0aXZlLm9mZnNldExlZnQgLSAyMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJGVsV2FycC5zY3JvbGxMZWZ0ID0gc2Nyb2xsTGVmdENhY2hlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuXG5leHBvcnQgY2xhc3MgRG9ja0Jhc2Uge1xuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwcm90ZWN0ZWQgZWxDb250ZW50OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJ0RvY2tCYXNlJztcbiAgfVxuXG4gIHB1YmxpYyBCb3hJbmZvKHRpdGxlOiBzdHJpbmcsICRjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgndnMtYm94aW5mbycpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLWJveGluZm8nKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInZzLWJveGluZm9faGVhZGVyXCI+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX3RpdGxlXCI+JHt0aXRsZX08L3NwYW4+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX2J1dHRvblwiPjwvc3Bhbj48L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwidnMtYm94aW5mb193YXJwXCI+PGRpdiBjbGFzcz1cInZzLWJveGluZm9fY29udGVudFwiPjwvZGl2PjwvZGl2PmA7XG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19jb250ZW50Jyk7XG4gICAgaWYgKCRjYWxsYmFjaykge1xuICAgICAgJGNhbGxiYWNrKHRoaXMuZWxDb250ZW50KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IFRvb2xib3hWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sRG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtY29udHJvbCcpO1xuICAgIHRoaXMuQm94SW5mbygnQ29udHJvbCcsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbmV3IFRvb2xib3hWaWV3KG5vZGUsIHRoaXMubWFpbik7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluLCBnZXRUaW1lIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IFZhcmlhYmxlVmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVmFyaWFibGVEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy12YXJpYWJsZScpO1xuICAgIHRoaXMuQm94SW5mbygnVmFyaWFibGUnLCAobm9kZTogSFRNTEVsZW1lbnQpID0+IHtcbiAgICAgIG5ldyBWYXJpYWJsZVZpZXcobm9kZSwgbWFpbik7XG4gICAgfSk7XG4gICAgbGV0ICRub2RlUmlnaHQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2hlYWRlciAudnMtYm94aW5mb19idXR0b24nKTtcbiAgICBpZiAoJG5vZGVSaWdodCkge1xuICAgICAgJG5vZGVSaWdodC5pbm5lckhUTUwgPSBgYDtcbiAgICAgIGxldCBidXR0b25OZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbk5ldyk7XG4gICAgICBidXR0b25OZXcuaW5uZXJIVE1MID0gYE5ldyBWYXJpYWJsZWA7XG4gICAgICBidXR0b25OZXcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubWFpbi5uZXdWYXJpYWJsZSgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhVmlldywgRGF0YUZsb3csIEV2ZW50RW51bSwgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xyXG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUHJvcGVydHlEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xyXG4gIHByaXZhdGUgbGFzdERhdGE6IERhdGFGbG93IHwgdW5kZWZpbmVkO1xyXG4gIHByaXZhdGUgaGlkZUtleXM6IHN0cmluZ1tdID0gWydsaW5lcycsICdub2RlcycsICdncm91cHMnLCAndmFyaWFibGUnLCAneCcsICd5JywgJ3pvb20nXTtcclxuICBwcml2YXRlIHNvcnRLZXlzOiBzdHJpbmdbXSA9IFsnaWQnLCAna2V5JywgJ25hbWUnLCAnZ3JvdXAnXTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xyXG5cclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb3BlcnR5Jyk7XHJcbiAgICB0aGlzLkJveEluZm8oJ1Byb3BlcnR5JywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XHJcbiAgICAgIG1haW4ub24oRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgKGRldGFpbDogYW55KSA9PiB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJVSShub2RlLCBkZXRhaWwuZGF0YSk7XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcmVuZGVyVUkobm9kZTogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGFGbG93KSB7XHJcbiAgICBpZiAodGhpcy5sYXN0RGF0YSA9PSBkYXRhKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMubGFzdERhdGEgPSBkYXRhO1xyXG4gICAgbm9kZS5pbm5lckhUTUwgPSAnJztcclxuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSBkYXRhLmdldFByb3BlcnRpZXMoKTtcclxuICAgIHRoaXMuc29ydEtleXMuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKHRoaXMuaGlkZUtleXMuaW5jbHVkZXMoa2V5KSB8fCAhcHJvcGVydGllc1trZXldKSByZXR1cm47XHJcbiAgICAgIGxldCBwcm9wZXJ0eUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWl0ZW0nKTtcclxuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlMYWJlbC5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS1sYWJlbCcpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmlubmVySFRNTCA9IGtleTtcclxuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlWYWx1ZS5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS12YWx1ZScpO1xyXG4gICAgICBEYXRhVmlldy5CaW5kRWxlbWVudChwcm9wZXJ0eVZhbHVlLCBkYXRhLCB0aGlzLm1haW4sIGtleSk7XHJcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eUxhYmVsKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5VmFsdWUpO1xyXG4gICAgICBub2RlLmFwcGVuZENoaWxkKHByb3BlcnR5SXRlbSk7XHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmhpZGVLZXlzLmluY2x1ZGVzKGtleSkgfHwgdGhpcy5zb3J0S2V5cy5pbmNsdWRlcyhrZXkpKSByZXR1cm47XHJcbiAgICAgIGxldCBwcm9wZXJ0eUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWl0ZW0nKTtcclxuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlMYWJlbC5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS1sYWJlbCcpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmlubmVySFRNTCA9IGtleTtcclxuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgcHJvcGVydHlWYWx1ZS5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS12YWx1ZScpO1xyXG4gICAgICBEYXRhVmlldy5CaW5kRWxlbWVudChwcm9wZXJ0eVZhbHVlLCBkYXRhLCB0aGlzLm1haW4sIGtleSk7XHJcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eUxhYmVsKTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5VmFsdWUpO1xyXG4gICAgICBub2RlLmFwcGVuZENoaWxkKHByb3BlcnR5SXRlbSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFZpZXdEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwcml2YXRlIHZpZXc6IERlc2dpbmVyVmlldyB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG5cbiAgICB0aGlzLnZpZXcgPSBuZXcgRGVzZ2luZXJWaWV3KHRoaXMuZWxOb2RlLCBtYWluKTtcblxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiwgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgVGFiUHJvamVjdFZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFRhYkRvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIG5ldyBUYWJQcm9qZWN0Vmlldyh0aGlzLmVsTm9kZSwgbWFpbik7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluLCBEb2NrRW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBDb250cm9sRG9jayB9IGZyb20gXCIuL0NvbnRyb2xEb2NrXCI7XG5pbXBvcnQgeyBWYXJpYWJsZURvY2sgfSBmcm9tIFwiLi9WYXJpYWJsZURvY2tcIjtcbmltcG9ydCB7IFByb2plY3REb2NrIH0gZnJvbSBcIi4vUHJvamVjdERvY2tcIjtcbmltcG9ydCB7IFByb3BlcnR5RG9jayB9IGZyb20gXCIuL1Byb3BlcnR5RG9ja1wiO1xuaW1wb3J0IHsgVmlld0RvY2sgfSBmcm9tIFwiLi9WaWV3RG9ja1wiO1xuaW1wb3J0IHsgVGFiRG9jayB9IGZyb20gXCIuL1RhYkRvY2tcIjtcblxuZXhwb3J0IGNsYXNzIERvY2tNYW5hZ2VyIHtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHsgfVxuICBwdWJsaWMgcmVzZXQoKSB7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIgPSB7fTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgQ29udHJvbERvY2spO1xuICAgIC8vdGhpcy5hZGREb2NrKERvY2tFbnVtLmxlZnQsIFByb2plY3REb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ucmlnaHQsIFByb3BlcnR5RG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnZpZXcsIFZpZXdEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0udG9wLCBUYWJEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0uYm90dG9tLCBWYXJpYWJsZURvY2spO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgfVxuICBwdWJsaWMgYWRkRG9jaygka2V5OiBzdHJpbmcsICR2aWV3OiBhbnkpIHtcbiAgICBpZiAoIXRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldKVxuICAgICAgdGhpcy4kZG9ja01hbmFnZXJbJGtleV0gPSBbXTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlclska2V5XSA9IFsuLi50aGlzLiRkb2NrTWFuYWdlclska2V5XSwgJHZpZXddO1xuICB9XG5cbiAgcHVibGljIFJlbmRlclVJKCkge1xuICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1sZWZ0IHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1jb250ZW50XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy10b3AgdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwidnMtdmlldyB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy1ib3R0b20gdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidnMtcmlnaHQgdnMtZG9ja1wiPjwvZGl2PlxuICAgIGA7XG4gICAgT2JqZWN0LmtleXModGhpcy4kZG9ja01hbmFnZXIpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgcXVlcnlTZWxlY3RvciA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoYC4ke2tleX1gKTtcbiAgICAgIGlmIChxdWVyeVNlbGVjdG9yKSB7XG4gICAgICAgIHRoaXMuJGRvY2tNYW5hZ2VyW2tleV0uZm9yRWFjaCgoJGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgIG5ldyAkaXRlbShxdWVyeVNlbGVjdG9yLCB0aGlzLm1haW4pO1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iLCJleHBvcnQgY29uc3QgQ29udHJvbCA9IHtcbiAgbm9kZV9iZWdpbjoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1wbGF5XCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnQmVnaW4nLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBjbGFzczogJycsXG4gICAgaHRtbDogJycsXG4gICAgZG90OiB7XG4gICAgICB0b3A6IDAsXG4gICAgICByaWdodDogMSxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICBib3R0b206IDAsXG4gICAgfSxcbiAgICBvbmx5Tm9kZTogdHJ1ZVxuICB9LFxuICBub2RlX2VuZDoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1zdG9wXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnRW5kJyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogJycsXG4gICAgZG90OiB7XG4gICAgICBsZWZ0OiAxLFxuICAgICAgdG9wOiAwLFxuICAgICAgcmlnaHQ6IDAsXG4gICAgICBib3R0b206IDAsXG4gICAgfSxcbiAgICBvbmx5Tm9kZTogdHJ1ZVxuICB9LFxuICBub2RlX2lmOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLWVxdWFsc1wiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ0lmJyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogYDxkaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4gc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCI+VGhlbjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAxXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3BhbiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIj5FbHNlPC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDJcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICBgLFxuICAgIHNjcmlwdDogYGAsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH1cbiAgICB9LFxuICAgIGRvdDoge1xuICAgICAgbGVmdDogMSxcbiAgICAgIHRvcDogMCxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgYm90dG9tOiAwLFxuICAgIH0sXG4gIH0sXG4gIG5vZGVfZ3JvdXA6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnR3JvdXAnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+PGJ1dHRvbiBjbGFzcz1cImJ0bkdvR3JvdXAgbm9kZS1mb3JtLWNvbnRyb2xcIj5HbzwvYnV0dG9uPjwvZGl2PicsXG4gICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7IG5vZGUub3Blbkdyb3VwKCkgfSk7XG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICBvdXRwdXQ6IDJcbiAgfSxcbiAgbm9kZV9vcHRpb246IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnT3B0aW9uJyxcbiAgICBkb3Q6IHtcbiAgICAgIHRvcDogMSxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgbGVmdDogMSxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiBgXG4gICAgPGRpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMVwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDJcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAzXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwNFwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDVcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGAsXG4gICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7IG5vZGUub3Blbkdyb3VwKCkgfSk7XG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICBvdXRwdXQ6IDJcbiAgfSxcbiAgbm9kZV9wcm9qZWN0OiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ1Byb2plY3QnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+PHNlbGVjdCBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cInByb2plY3RcIj48L3NlbGVjdD48L2Rpdj4nLFxuICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuXG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBwcm9qZWN0OiB7XG4gICAgICAgIGtleTogXCJwcm9qZWN0XCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHNlbGVjdDogdHJ1ZSxcbiAgICAgICAgZGF0YVNlbGVjdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtYWluLmdldFByb2plY3RBbGwoKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdmFsdWU6IGl0ZW0uR2V0KCdpZCcpLFxuICAgICAgICAgICAgICB0ZXh0OiBpdGVtLkdldCgnbmFtZScpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuXG4gICAgICAgIH0sXG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9XG4gICAgfSxcbiAgfSxcbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBJTWFpbiwgY29tcGFyZVNvcnQsIEV2ZW50RW51bSwgUHJvcGVydHlFbnVtLCBFdmVudEZsb3csIGdldFRpbWUsIFNjb3BlUm9vdCB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBOb2RlSXRlbSB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgQ29udHJvbCB9IGZyb20gXCIuL2NvbnRyb2xcIjtcblxuZXhwb3J0IGNsYXNzIFN5c3RlbUJhc2UgaW1wbGVtZW50cyBJTWFpbiB7XG4gIHByaXZhdGUgJGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KHRoaXMpO1xuICBwcml2YXRlICRwcm9qZWN0T3BlbjogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgJHByb3BlcnRpZXM6IGFueSA9IHt9O1xuICBwcml2YXRlICRjb250cm9sOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdyA9IG5ldyBFdmVudEZsb3coKTtcbiAgcHJpdmF0ZSAkY29udHJvbENob29zZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgJGNoZWNrT3B0aW9uOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgJGdyb3VwOiBhbnk7XG4gIHByaXZhdGUgJGluZGV4UHJvamVjdDogbnVtYmVyID0gLTE7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICAvL3NldCBwcm9qZWN0XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0uc29sdXRpb25dID0ge1xuICAgICAgaWQ6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICB9LFxuICAgICAga2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IFByb3BlcnR5RW51bS5zb2x1dGlvblxuICAgICAgfSxcbiAgICAgIG5hbWU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gYHNvbHV0aW9uLSR7Z2V0VGltZSgpfWAsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICB9LFxuICAgICAgcHJvamVjdHM6IHtcbiAgICAgICAgZGVmYXVsdDogW11cbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLmxpbmVdID0ge1xuICAgICAga2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFByb3BlcnR5RW51bS5saW5lXG4gICAgICB9LFxuICAgICAgZnJvbToge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgZnJvbUluZGV4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB0bzoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgdG9JbmRleDoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9XG4gICAgfTtcbiAgICAvL3NldCBwcm9qZWN0XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0ubWFpbl0gPSB7XG4gICAgICBpZDoge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGBGbG93ICR7dGhpcy4kaW5kZXhQcm9qZWN0Kyt9YCxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLm1haW5cbiAgICAgIH0sXG4gICAgICB2YXJpYWJsZToge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfSxcbiAgICAgIGdyb3Vwczoge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfSxcbiAgICAgIG5vZGVzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5ncm91cENhdmFzXSA9IHtcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0uZ3JvdXBDYXZhc1xuICAgICAgfSxcbiAgICAgIGdyb3VwOiB7XG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9LFxuICAgICAgeDoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgeToge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgem9vbToge1xuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgIH1cbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS52YXJpYWJsZV0gPSB7XG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLnZhcmlhYmxlXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBgdmFyJHtnZXRUaW1lKCl9YFxuICAgICAgfSxcbiAgICAgIHR5cGU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gJ3RleHQnXG4gICAgICB9LFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gU2NvcGVSb290XG4gICAgICB9LFxuICAgICAgaW5pdGFsVmFsdWU6IHtcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgfVxuICAgIHRoaXMub25TYWZlKEV2ZW50RW51bS5ncm91cENoYW5nZSwgKHsgZ3JvdXAgfTogYW55KSA9PiB7XG4gICAgICB0aGlzLiRncm91cCA9IGdyb3VwO1xuICAgIH0pXG4gIH1cbiAgbmV3U29sdXRpb24oJG5hbWU6IHN0cmluZyA9ICcnKTogdm9pZCB7XG4gICAgdGhpcy4kaW5kZXhQcm9qZWN0ID0gMTtcbiAgICB0aGlzLm9wZW5Tb2x1dGlvbih7IG5hbWU6ICRuYW1lIH0pO1xuICB9XG4gIG9wZW5Tb2x1dGlvbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy4kZGF0YS5Jbml0RGF0YSgkZGF0YSwgdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5zb2x1dGlvbikpO1xuICAgIHRoaXMub3BlblByb2plY3QodGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJyk/LlswXSA/PyB7fSk7XG4gIH1cbiAgcmVtb3ZlVmFyaWFibGUodmFyaWJhbGU6IERhdGFGbG93KTogdm9pZCB7XG4gICAgdGhpcy4kcHJvamVjdE9wZW4/LlJlbW92ZSgndmFyaWFibGUnLCB2YXJpYmFsZSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHsgZGF0YTogdmFyaWJhbGUgfSk7XG4gIH1cbiAgYWRkVmFyaWFibGUoKTogRGF0YUZsb3cge1xuICAgIGxldCB2YXJpYmFsZSA9IG5ldyBEYXRhRmxvdyh0aGlzLCB7IGtleTogUHJvcGVydHlFbnVtLnZhcmlhYmxlLCBzY29wZTogdGhpcy5nZXRHcm91cEN1cnJlbnQoKT8uWzBdPy5pZCB9KTtcbiAgICB0aGlzLiRwcm9qZWN0T3Blbj8uQXBwZW5kKCd2YXJpYWJsZScsIHZhcmliYWxlKTtcbiAgICByZXR1cm4gdmFyaWJhbGU7XG4gIH1cbiAgbmV3VmFyaWFibGUoKTogRGF0YUZsb3cge1xuICAgIGxldCB2YXJpYmFsZSA9IHRoaXMuYWRkVmFyaWFibGUoKTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2VWYXJpYWJsZSwgeyBkYXRhOiB2YXJpYmFsZSB9KTtcbiAgICByZXR1cm4gdmFyaWJhbGU7XG4gIH1cbiAgZ2V0VmFyaWFibGUoKTogRGF0YUZsb3dbXSB7XG4gICAgbGV0IGFycjogYW55ID0gW107XG4gICAgaWYgKHRoaXMuJHByb2plY3RPcGVuKSB7XG4gICAgICBhcnIgPSB0aGlzLiRwcm9qZWN0T3Blbi5HZXQoXCJ2YXJpYWJsZVwiKTtcbiAgICAgIGlmICghYXJyKSB7XG4gICAgICAgIGFyciA9IFtdO1xuICAgICAgICB0aGlzLiRwcm9qZWN0T3Blbi5TZXQoJ3ZhcmlhYmxlJywgYXJyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFyci5maWx0ZXIoKGl0ZW06IGFueSkgPT4gdGhpcy5nZXRHcm91cEN1cnJlbnQoKS5maW5kSW5kZXgoKF9ncm91cDogYW55KSA9PiBfZ3JvdXAuaWQgPT0gaXRlbS5HZXQoJ3Njb3BlJykpID4gLTEpO1xuICB9XG4gIGdldEdyb3VwQ3VycmVudCgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLiRncm91cCA/PyBbXTtcbiAgfVxuICBleHBvcnRKc29uKCkge1xuICAgIHJldHVybiB0aGlzLiRkYXRhLnRvSnNvbigpO1xuICB9XG4gIHB1YmxpYyBjaGVja0luaXRPcHRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuJGNoZWNrT3B0aW9uO1xuICB9XG4gIGluaXRPcHRpb24ob3B0aW9uOiBhbnksIGlzRGVmYXVsdDogYm9vbGVhbiA9IHRydWUpOiB2b2lkIHtcbiAgICB0aGlzLiRjaGVja09wdGlvbiA9IHRydWU7XG4gICAgLy8gc2V0IGNvbnRyb2xcbiAgICB0aGlzLiRjb250cm9sID0gaXNEZWZhdWx0ID8geyAuLi5vcHRpb24/LmNvbnRyb2wgfHwge30sIC4uLkNvbnRyb2wgfSA6IHsgLi4ub3B0aW9uPy5jb250cm9sIHx8IHt9IH07XG4gICAgbGV0IGNvbnRyb2xUZW1wOiBhbnkgPSB7fTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRjb250cm9sKS5tYXAoKGtleSkgPT4gKHsgLi4udGhpcy4kY29udHJvbFtrZXldLCBrZXksIHNvcnQ6ICh0aGlzLiRjb250cm9sW2tleV0uc29ydCA9PT0gdW5kZWZpbmVkID8gOTk5OTkgOiB0aGlzLiRjb250cm9sW2tleV0uc29ydCkgfSkpLnNvcnQoY29tcGFyZVNvcnQpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgY29udHJvbFRlbXBbaXRlbS5rZXldID0ge1xuICAgICAgICAuLi5pdGVtLFxuICAgICAgICBkb3Q6IHtcbiAgICAgICAgICBsZWZ0OiAxLFxuICAgICAgICAgIHRvcDogMSxcbiAgICAgICAgICByaWdodDogMSxcbiAgICAgICAgICBib3R0b206IDEsXG4gICAgICAgICAgLi4uaXRlbT8uZG90XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB0aGlzLiRwcm9wZXJ0aWVzW2Ake2l0ZW0ua2V5fWBdID0ge1xuICAgICAgICAuLi4oaXRlbS5wcm9wZXJ0aWVzIHx8IHt9KSxcbiAgICAgICAgaWQ6IHtcbiAgICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgICAgfSxcbiAgICAgICAga2V5OiB7XG4gICAgICAgICAgZGVmYXVsdDogaXRlbS5rZXlcbiAgICAgICAgfSxcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgIGRlZmF1bHQ6IGl0ZW0ua2V5LFxuICAgICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHg6IHtcbiAgICAgICAgICBkZWZhdWx0OiAwXG4gICAgICAgIH0sXG4gICAgICAgIHk6IHtcbiAgICAgICAgICBkZWZhdWx0OiAwXG4gICAgICAgIH0sXG4gICAgICAgIGdyb3VwOiB7XG4gICAgICAgICAgZGVmYXVsdDogJydcbiAgICAgICAgfSxcbiAgICAgICAgbGluZXM6IHtcbiAgICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuICAgIHRoaXMuJGNvbnRyb2wgPSBjb250cm9sVGVtcDtcbiAgfVxuICByZW5kZXJIdG1sKG5vZGU6IE5vZGVJdGVtLCBlbFBhcmVudDogRWxlbWVudCkge1xuICAgIGVsUGFyZW50LmlubmVySFRNTCA9IG5vZGUuZ2V0T3B0aW9uKCk/Lmh0bWw7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldENvbnRyb2xBbGwoKSB7XG4gICAgcmV0dXJuIHRoaXMuJGNvbnRyb2wgPz8ge307XG4gIH1cbiAgZ2V0UHJvamVjdEFsbCgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEuR2V0KCdwcm9qZWN0cycpID8/IFtdO1xuICB9XG4gIGltcG9ydEpzb24oZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5vcGVuU29sdXRpb24oZGF0YSk7XG4gIH1cbiAgc2V0UHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIGlmICh0aGlzLiRwcm9qZWN0T3BlbiAhPSAkZGF0YSkge1xuICAgICAgdGhpcy4kcHJvamVjdE9wZW4gPSAkZGF0YTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgICBkYXRhOiAkZGF0YVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHtcbiAgICAgICAgZGF0YTogJGRhdGFcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsIHtcbiAgICAgICAgZGF0YTogJGRhdGFcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBjaGVja1Byb2plY3RPcGVuKCRkYXRhOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvamVjdE9wZW4gPT0gJGRhdGE7XG4gIH1cbiAgbmV3UHJvamVjdCgpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Qcm9qZWN0KHt9KTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5uZXdQcm9qZWN0LCB7fSk7XG4gIH1cbiAgb3BlblByb2plY3QoJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIGxldCAkcHJvamVjdDogYW55ID0gbnVsbDtcbiAgICBpZiAoJGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgJHByb2plY3QgPSB0aGlzLmdldFByb2plY3RCeUlkKCRkYXRhLkdldCgnaWQnKSk7XG4gICAgICBpZiAoISRwcm9qZWN0KSB7XG4gICAgICAgICRwcm9qZWN0ID0gJGRhdGE7XG4gICAgICAgIHRoaXMuJGRhdGEuQXBwZW5kKCdwcm9qZWN0cycsICRwcm9qZWN0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgJHByb2plY3QgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gICAgICAkcHJvamVjdC5Jbml0RGF0YSgkZGF0YSwgdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5tYWluKSk7XG4gICAgICB0aGlzLiRkYXRhLkFwcGVuZCgncHJvamVjdHMnLCAkcHJvamVjdCk7XG4gICAgfVxuICAgIHRoaXMuc2V0UHJvamVjdE9wZW4oJHByb2plY3QpO1xuICB9XG4gIHB1YmxpYyByZW1vdmVQcm9qZWN0KCRkYXRhOiBhbnkpIHtcbiAgICBsZXQgcHJvamVjdERhdGEgPSAkZGF0YTtcbiAgICBpZiAoJGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgcHJvamVjdERhdGEgPSB0aGlzLmdldFByb2plY3RCeUlkKCRkYXRhLkdldCgnaWQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2plY3REYXRhID0gdGhpcy5nZXRQcm9qZWN0QnlJZCgkZGF0YS5HZXQoJ2lkJykpO1xuICAgIH1cbiAgICB0aGlzLiRkYXRhLlJlbW92ZSgncHJvamVjdHMnLCBwcm9qZWN0RGF0YSk7XG4gICAgaWYgKHRoaXMuY2hlY2tQcm9qZWN0T3Blbihwcm9qZWN0RGF0YSkpIHtcbiAgICAgIHRoaXMuJHByb2plY3RPcGVuID0gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJyk/LlswXTtcbiAgICAgIGlmICghdGhpcy4kcHJvamVjdE9wZW4pIHtcbiAgICAgICAgdGhpcy5uZXdQcm9qZWN0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XG4gICAgICBkYXRhOiB0aGlzLiRwcm9qZWN0T3BlblxuICAgIH0pO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwge1xuICAgICAgZGF0YTogdGhpcy4kcHJvamVjdE9wZW5cbiAgICB9KTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5vcGVuUHJvamVjdCwge1xuICAgICAgZGF0YTogdGhpcy4kcHJvamVjdE9wZW5cbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdEJ5SWQoJGlkOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJykuZmlsdGVyKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS5HZXQoJ2lkJykgPT09ICRpZCk/LlswXTtcbiAgfVxuICBzZXRDb250cm9sQ2hvb3NlKGtleTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuJGNvbnRyb2xDaG9vc2UgPSBrZXk7XG4gIH1cbiAgZ2V0Q29udHJvbENob29zZSgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbENob29zZTtcbiAgfVxuICBnZXRDb250cm9sQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbFtrZXldIHx8IHt9O1xuICB9XG4gIGdldENvbnRyb2xOb2RlQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy5nZXRDb250cm9sQnlLZXkoa2V5KSxcbiAgICAgIHByb3BlcnRpZXM6IHRoaXMuZ2V0UHJvcGVydHlCeUtleShgJHtrZXl9YClcbiAgICB9XG4gIH1cbiAgZ2V0UHJvcGVydHlCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLiRwcm9wZXJ0aWVzW2tleV07XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSAnLi9jb3JlL2luZGV4JztcbmltcG9ydCB7IERvY2tNYW5hZ2VyIH0gZnJvbSAnLi9kb2NrL0RvY2tNYW5hZ2VyJztcbmltcG9ydCB7IFN5c3RlbUJhc2UgfSBmcm9tICcuL3N5c3RlbXMvU3lzdGVtQmFzZSc7XG5leHBvcnQgY2xhc3MgVmlzdWFsRmxvdyB7XG4gIHByaXZhdGUgbWFpbjogSU1haW4gfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgJGRvY2tNYW5hZ2VyOiBEb2NrTWFuYWdlcjtcbiAgcHVibGljIGdldERvY2tNYW5hZ2VyKCk6IERvY2tNYW5hZ2VyIHtcbiAgICByZXR1cm4gdGhpcy4kZG9ja01hbmFnZXI7XG4gIH1cbiAgcHVibGljIHNldE9wdGlvbihkYXRhOiBhbnksIGlzRGVmYXVsdDogYm9vbGVhbiA9IHRydWUpIHtcbiAgICB0aGlzLm1haW4/LmluaXRPcHRpb24oZGF0YSwgaXNEZWZhdWx0KTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlci5yZXNldCgpO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG1haW46IElNYWluIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5tYWluID0gbWFpbiA/PyBuZXcgU3lzdGVtQmFzZSgpO1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ3ZzLWNvbnRhaW5lcicpO1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ3ZzLWNvbnRhaW5lcicpO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyID0gbmV3IERvY2tNYW5hZ2VyKHRoaXMuY29udGFpbmVyLCB0aGlzLm1haW4pO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyLnJlc2V0KCk7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/Lm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/Lm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMubWFpbj8ucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/LmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgZ2V0TWFpbigpOiBJTWFpbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubWFpbjtcbiAgfVxuICBuZXdTb2x1dGlvbigkbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm5ld1NvbHV0aW9uKCRuYW1lKTtcbiAgfVxuICBvcGVuU29sdXRpb24oJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5vcGVuU29sdXRpb24oJGRhdGEpO1xuICB9XG4gIG5ld1Byb2plY3QoJG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5uZXdQcm9qZWN0KCRuYW1lKTtcbiAgfVxuICBvcGVuUHJvamVjdCgkbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm9wZW5Qcm9qZWN0KCRuYW1lKTtcbiAgfVxuICBnZXRQcm9qZWN0QWxsKCk6IGFueVtdIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRNYWluKCk/LmdldFByb2plY3RBbGwoKTtcbiAgfVxuICBzZXRQcm9qZWN0T3BlbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/LnNldFByb2plY3RPcGVuKCRkYXRhKTtcbiAgfVxuICBpbXBvcnRKc29uKGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5pbXBvcnRKc29uKGRhdGEpO1xuICB9XG4gIGV4cG9ydEpzb24oKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5nZXRNYWluKCk/LmV4cG9ydEpzb24oKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IFN5c3RlbUJhc2UgfSBmcm9tIFwiLi9TeXN0ZW1CYXNlXCI7XG5leHBvcnQgY2xhc3MgU3lzdGVtVnVlIGV4dGVuZHMgU3lzdGVtQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlbmRlcjogYW55KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICByZW5kZXJIdG1sKG5vZGU6IE5vZGVJdGVtLCBlbFBhcmVudDogRWxlbWVudCkge1xuICAgIGlmIChwYXJzZUludCh0aGlzLnJlbmRlci52ZXJzaW9uKSA9PT0gMykge1xuICAgICAgLy9WdWUgM1xuICAgICAgbGV0IHdyYXBwZXIgPSB0aGlzLnJlbmRlci5oKG5vZGUuZ2V0T3B0aW9uKCk/Lmh0bWwsIHsgLi4uKG5vZGUuZ2V0T3B0aW9uKCk/LnByb3BzID8/IHt9KSwgbm9kZSB9LCAobm9kZS5nZXRPcHRpb24oKT8ub3B0aW9ucyA/PyB7fSkpO1xuICAgICAgd3JhcHBlci5hcHBDb250ZXh0ID0gZWxQYXJlbnQ7XG4gICAgICB0aGlzLnJlbmRlci5yZW5kZXIod3JhcHBlciwgZWxQYXJlbnQpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFZ1ZSAyXG4gICAgICBsZXQgd3JhcHBlciA9IG5ldyB0aGlzLnJlbmRlcih7XG4gICAgICAgIHBhcmVudDogZWxQYXJlbnQsXG4gICAgICAgIHJlbmRlcjogKGg6IGFueSkgPT4gaChub2RlLmdldE9wdGlvbigpPy5odG1sLCB7IHByb3BzOiB7IC4uLihub2RlLmdldE9wdGlvbigpPy5wcm9wcyA/PyB7fSksIG5vZGUgfSB9KSxcbiAgICAgICAgLi4uKG5vZGUuZ2V0T3B0aW9uKCk/Lm9wdGlvbnMgPz8ge30pXG4gICAgICB9KS4kbW91bnQoKVxuICAgICAgLy9cbiAgICAgIGVsUGFyZW50LmFwcGVuZENoaWxkKHdyYXBwZXIuJGVsKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBFdmVudEVudW0sIElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IGRvd25sb2FkT2JqZWN0QXNKc29uLCBnZXRUaW1lLCByZWFkRmlsZUxvY2FsIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmltcG9ydCB7IFByb2plY3RWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL1Byb2plY3RWaWV3XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9qZWN0RG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvamVjdCcpO1xuICAgIHRoaXMuQm94SW5mbygnUHJvamVjdCcsIChlbENvbnRlbnQ6IGFueSkgPT4ge1xuICAgICAgbmV3IFByb2plY3RWaWV3KGVsQ29udGVudCwgbWFpbik7XG4gICAgfSk7XG4gICAgbGV0ICRub2RlUmlnaHQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2hlYWRlciAudnMtYm94aW5mb19idXR0b24nKTtcbiAgICBpZiAoJG5vZGVSaWdodCkge1xuICAgICAgJG5vZGVSaWdodC5pbm5lckhUTUwgPSBgYDtcbiAgICAgIGxldCBidXR0b25OZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ1dHRvbk5ldy5pbm5lckhUTUwgPSBgTmV3YDtcbiAgICAgIGJ1dHRvbk5ldy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMubWFpbi5uZXdQcm9qZWN0KCcnKSk7XG4gICAgICAkbm9kZVJpZ2h0Py5hcHBlbmRDaGlsZChidXR0b25OZXcpO1xuXG4gICAgICBsZXQgYnV0dG9uRXhwb3J0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidXR0b25FeHBvcnQuaW5uZXJIVE1MID0gYEV4cG9ydGA7XG4gICAgICBidXR0b25FeHBvcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBkb3dubG9hZE9iamVjdEFzSnNvbih0aGlzLm1haW4uZXhwb3J0SnNvbigpLCBgdnMtc29sdXRpb24tJHtnZXRUaW1lKCl9YCkpO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uRXhwb3J0KTtcblxuICAgICAgbGV0IGJ1dHRvbkltcG9ydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uSW1wb3J0LmlubmVySFRNTCA9IGBJbXBvcnRgO1xuICAgICAgYnV0dG9uSW1wb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICByZWFkRmlsZUxvY2FsKChyczogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKHJzKSB7XG4gICAgICAgICAgICB0aGlzLm1haW4uaW1wb3J0SnNvbihKU09OLnBhcnNlKHJzKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uSW1wb3J0KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFZpc3VhbEZsb3cgfSBmcm9tIFwiLi9WaXN1YWxGbG93XCI7XG5pbXBvcnQgKiBhcyBTeXN0ZW1CYXNlIGZyb20gXCIuL3N5c3RlbXMvaW5kZXhcIjtcbmltcG9ydCAqIGFzIENvcmUgZnJvbSAnLi9jb3JlL2luZGV4JztcbmltcG9ydCAqIGFzIERlc2dpbmVyIGZyb20gXCIuL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgKiBhcyBEb2NrIGZyb20gJy4vZG9jay9pbmRleCc7XG5leHBvcnQgZGVmYXVsdCB7XG4gIFZpc3VhbEZsb3csXG4gIC4uLlN5c3RlbUJhc2UsXG4gIC4uLkNvcmUsXG4gIC4uLkRvY2ssXG4gIC4uLkRlc2dpbmVyXG59O1xuXG4iXSwibmFtZXMiOlsiU3lzdGVtQmFzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFPLE1BQU0sU0FBUyxHQUFHO0FBQ3ZCLElBQUEsSUFBSSxFQUFFLE1BQU07QUFDWixJQUFBLFVBQVUsRUFBRSxZQUFZO0FBQ3hCLElBQUEsWUFBWSxFQUFFLGNBQWM7QUFDNUIsSUFBQSxXQUFXLEVBQUUsYUFBYTtBQUMxQixJQUFBLFVBQVUsRUFBRSxZQUFZO0FBQ3hCLElBQUEsY0FBYyxFQUFFLGdCQUFnQjtBQUNoQyxJQUFBLE1BQU0sRUFBRSxRQUFRO0FBQ2hCLElBQUEsT0FBTyxFQUFFLFNBQVM7QUFDbEIsSUFBQSxXQUFXLEVBQUUsYUFBYTtDQUMzQixDQUFBO0FBRU0sTUFBTSxRQUFRLEdBQUc7QUFDdEIsSUFBQSxJQUFJLEVBQUUsU0FBUztBQUNmLElBQUEsR0FBRyxFQUFFLFFBQVE7QUFDYixJQUFBLElBQUksRUFBRSxTQUFTO0FBQ2YsSUFBQSxNQUFNLEVBQUUsV0FBVztBQUNuQixJQUFBLEtBQUssRUFBRSxVQUFVO0NBQ2xCLENBQUE7QUFFTSxNQUFNLFlBQVksR0FBRztBQUMxQixJQUFBLElBQUksRUFBRSxjQUFjO0FBQ3BCLElBQUEsUUFBUSxFQUFFLGVBQWU7QUFDekIsSUFBQSxJQUFJLEVBQUUsV0FBVztBQUNqQixJQUFBLFFBQVEsRUFBRSxlQUFlO0FBQ3pCLElBQUEsVUFBVSxFQUFFLGlCQUFpQjtDQUM5QixDQUFDO0FBRUssTUFBTSxTQUFTLEdBQUcsTUFBTTs7TUMxQmxCLFNBQVMsQ0FBQTtJQUNaLE1BQU0sR0FBUSxFQUFFLENBQUM7QUFDekIsSUFBQSxXQUFBLEdBQUE7S0FDQztJQUNNLE1BQU0sQ0FBQyxLQUFhLEVBQUUsUUFBYSxFQUFBO0FBQ3hDLFFBQUEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDckMsUUFBQSxJQUFJLENBQUMs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
