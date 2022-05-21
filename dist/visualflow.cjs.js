
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
                        this.tempLine.updateTo(this.parent.elCanvas.offsetLeft - x, this.parent.elCanvas.offsetTop - y - 20);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5janMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL0NvbnN0YW50LnRzIiwiLi4vc3JjL2NvcmUvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvcmUvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29yZS9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb3JlL1V0aWxzLnRzIiwiLi4vc3JjL2NvcmUvRGF0YVZpZXcudHMiLCIuLi9zcmMvZGVzZ2luZXIvTGluZS50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXdfRXZlbnQudHMiLCIuLi9zcmMvZGVzZ2luZXIvTm9kZUl0ZW0udHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1ZhcmlhYmxlVmlldy50cyIsIi4uL3NyYy9kZXNnaW5lci9Ub29sYm94Vmlldy50cyIsIi4uL3NyYy9kZXNnaW5lci9Qcm9qZWN0Vmlldy50cyIsIi4uL3NyYy9kZXNnaW5lci9UYWJQcm9qZWN0Vmlldy50cyIsIi4uL3NyYy9kb2NrL0RvY2tCYXNlLnRzIiwiLi4vc3JjL2RvY2svQ29udHJvbERvY2sudHMiLCIuLi9zcmMvZG9jay9WYXJpYWJsZURvY2sudHMiLCIuLi9zcmMvZG9jay9Qcm9wZXJ0eURvY2sudHMiLCIuLi9zcmMvZG9jay9WaWV3RG9jay50cyIsIi4uL3NyYy9kb2NrL1RhYkRvY2sudHMiLCIuLi9zcmMvZG9jay9Eb2NrTWFuYWdlci50cyIsIi4uL3NyYy9zeXN0ZW1zL2NvbnRyb2wudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1CYXNlLnRzIiwiLi4vc3JjL1Zpc3VhbEZsb3cudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1WdWUudHMiLCIuLi9zcmMvZG9jay9Qcm9qZWN0RG9jay50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgRXZlbnRFbnVtID0ge1xuICBpbml0OiBcImluaXRcIixcbiAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXG4gIHNob3dQcm9wZXJ0eTogXCJzaG93UHJvcGVydHlcIixcbiAgb3BlblByb2plY3Q6IFwib3BlblByb2plY3RcIixcbiAgbmV3UHJvamVjdDogXCJuZXdQcm9qZWN0XCIsXG4gIGNoYW5nZVZhcmlhYmxlOiBcImNoYW5nZVZhcmlhYmxlXCIsXG4gIGNoYW5nZTogXCJjaGFuZ2VcIixcbiAgZGlzcG9zZTogXCJkaXNwb3NlXCIsXG4gIGdyb3VwQ2hhbmdlOiBcImdyb3VwQ2hhbmdlXCIsXG59XG5cbmV4cG9ydCBjb25zdCBEb2NrRW51bSA9IHtcbiAgbGVmdDogXCJ2cy1sZWZ0XCIsXG4gIHRvcDogXCJ2cy10b3BcIixcbiAgdmlldzogXCJ2cy12aWV3XCIsXG4gIGJvdHRvbTogXCJ2cy1ib3R0b21cIixcbiAgcmlnaHQ6IFwidnMtcmlnaHRcIixcbn1cblxuZXhwb3J0IGNvbnN0IFByb3BlcnR5RW51bSA9IHtcbiAgbWFpbjogXCJtYWluX3Byb2plY3RcIixcbiAgc29sdXRpb246ICdtYWluX3NvbHV0aW9uJyxcbiAgbGluZTogJ21haW5fbGluZScsXG4gIHZhcmlhYmxlOiAnbWFpbl92YXJpYWJsZScsXG4gIGdyb3VwQ2F2YXM6IFwibWFpbl9ncm91cENhdmFzXCIsXG59O1xuXG5leHBvcnQgY29uc3QgU2NvcGVSb290ID0gXCJyb290XCI7XG4iLCJpbXBvcnQgeyBJRXZlbnQgfSBmcm9tIFwiLi9JRmxvd1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEV2ZW50RmxvdyBpbXBsZW1lbnRzIElFdmVudCB7XHJcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICB9XHJcbiAgcHVibGljIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICB0aGlzLm9uKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIC8qIEV2ZW50cyAqL1xyXG4gIHB1YmxpYyBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcclxuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XHJcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG5cclxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcclxuXHJcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXHJcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXHJcbiAgICBjb25zdCBoYXNMaXN0ZW5lciA9IGxpc3RlbmVySW5kZXggPiAtMVxyXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcclxuICAgICAgbGlzdGVuZXIoZGV0YWlscyk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSVByb3BlcnR5IH0gZnJvbSBcIi4vSUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcbiAgcHJpdmF0ZSBkYXRhOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVzOiBhbnkgPSBudWxsO1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBwdWJsaWMgZ2V0UHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXM7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvcGVydHk6IElQcm9wZXJ0eSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCwgZGF0YTogYW55ID0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IC0xKSB7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIH1cbiAgICB0aGlzLmxvYWQoZGF0YSk7XG4gIH1cbiAgcHJpdmF0ZSBldmVudERhdGFDaGFuZ2Uoa2V5OiBzdHJpbmcsIGtleUNoaWxkOiBzdHJpbmcsIHZhbHVlQ2hpbGQ6IGFueSwgc2VuZGVyQ2hpbGQ6IGFueSwgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmIChpbmRleCkge1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9XyR7a2V5Q2hpbGR9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xuICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlRXZlbnREYXRhKGl0ZW06IERhdGFGbG93LCBrZXk6IHN0cmluZywgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmICghaXRlbSkgcmV0dXJuO1xuICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9YCwgKHsga2V5OiBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGQgfTogYW55KSA9PiB0aGlzLmV2ZW50RGF0YUNoYW5nZShrZXksIGtleUNoaWxkLCB2YWx1ZUNoaWxkLCBzZW5kZXJDaGlsZCwgaW5kZXgpKTtcbiAgfVxuICBwdWJsaWMgT25FdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHByaXZhdGUgQmluZEV2ZW50KHZhbHVlOiBhbnksIGtleTogc3RyaW5nKSB7XG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICB0aGlzLk9uRXZlbnREYXRhKHZhbHVlIGFzIERhdGFGbG93LCBrZXkpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgKHZhbHVlIGFzIFtdKS5sZW5ndGggPiAwICYmIHZhbHVlWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICh2YWx1ZSBhcyBEYXRhRmxvd1tdKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdywgaW5kZXg6IG51bWJlcikgPT4gdGhpcy5PbkV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCwgaXNEaXNwYXRjaDogYm9vbGVhbiA9IHRydWUpIHtcbiAgICBpZiAodGhpcy5kYXRhW2tleV0gIT0gdmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmRhdGFba2V5XSkge1xuICAgICAgICBpZiAodGhpcy5kYXRhW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICAgIHRoaXMuUmVtb3ZlRXZlbnREYXRhKCh0aGlzLmRhdGFba2V5XSBhcyBEYXRhRmxvdyksIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhW2tleV0pICYmICh0aGlzLmRhdGFba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiB0aGlzLmRhdGFba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLlJlbW92ZUV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuQmluZEV2ZW50KHZhbHVlLCBrZXkpO1xuICAgIH1cbiAgICB0aGlzLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgIGlmIChpc0Rpc3BhdGNoKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICB9XG5cbiAgfVxuICBwdWJsaWMgU2V0RGF0YShkYXRhOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCwgaXNDbGVhckRhdGEgPSBmYWxzZSkge1xuXG4gICAgaWYgKGlzQ2xlYXJEYXRhKSB0aGlzLmRhdGEgPSB7fTtcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICBsZXQgJGRhdGE6IERhdGFGbG93ID0gZGF0YSBhcyBEYXRhRmxvdztcbiAgICAgIGlmICghdGhpcy5wcm9wZXJ0eSAmJiAkZGF0YS5wcm9wZXJ0eSkgdGhpcy5wcm9wZXJ0eSA9ICRkYXRhLnByb3BlcnR5O1xuICAgICAgaWYgKHRoaXMucHJvcGVydGllcykge1xuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5wcm9wZXJ0aWVzKSkge1xuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoJGRhdGEuZ2V0UHJvcGVydGllcygpKSkge1xuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICB0aGlzLlNldChrZXksIGRhdGFba2V5XSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgIGRhdGFcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgR2V0KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xuICB9XG4gIHB1YmxpYyBBcHBlbmQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBpZiAoIXRoaXMuZGF0YVtrZXldKSB0aGlzLmRhdGFba2V5XSA9IFtdO1xuICAgIHRoaXMuZGF0YVtrZXldID0gWy4uLnRoaXMuZGF0YVtrZXldLCB2YWx1ZV07XG4gICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gIH1cbiAgcHVibGljIFJlbW92ZShrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xuICAgIHZhciBpbmRleCA9IHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLlJlbW92ZUV2ZW50RGF0YSh0aGlzLmRhdGFba2V5XVtpbmRleF0sIGtleSk7XG4gICAgICB0aGlzLmRhdGFba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEgPSB7fTtcbiAgICBpZiAoIXRoaXMucHJvcGVydGllcykge1xuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0eT8uZ2V0UHJvcGVydHlCeUtleShkYXRhLmtleSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgIHRoaXMuZGF0YVtrZXldID0gKGRhdGE/LltrZXldID8/ICgodHlwZW9mIHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0ID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCgpIDogdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQpID8/IFwiXCIpKTtcbiAgICAgICAgaWYgKCEodGhpcy5kYXRhW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykgJiYgdGhpcy5kYXRhW2tleV0ua2V5KSB7XG4gICAgICAgICAgdGhpcy5kYXRhW2tleV0gPSBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgdGhpcy5kYXRhW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGF0YVtrZXldKSAmJiB0aGlzLnByb3BlcnR5ICYmICEodGhpcy5kYXRhW2tleV1bMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykpIHtcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IHRoaXMuZGF0YVtrZXldLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoIShpdGVtIGluc3RhbmNlb2YgRGF0YUZsb3cpICYmIGl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgaXRlbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLkJpbmRFdmVudCh0aGlzLmRhdGFba2V5XSwga2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnRvSnNvbigpKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCByczogYW55ID0ge307XG4gICAgaWYgKCF0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMucHJvcGVydHk/LmdldFByb3BlcnR5QnlLZXkodGhpcy5kYXRhLmtleSk7XG4gICAgfVxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICByc1trZXldID0gdGhpcy5HZXQoa2V5KTtcbiAgICAgIGlmIChyc1trZXldIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0udG9Kc29uKCk7XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocnNba2V5XSkgJiYgKHJzW2tleV0gYXMgW10pLmxlbmd0aCA+IDAgJiYgcnNba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgIHJzW2tleV0gPSByc1trZXldLm1hcCgoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0udG9Kc29uKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcnM7XG4gIH1cbiAgcHVibGljIGRlbGV0ZSgpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICB0aGlzLmRhdGEgPSB7fTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xyXG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xyXG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcclxuaW1wb3J0IHsgSUV2ZW50IH0gZnJvbSBcIi4vSUZsb3dcIjtcclxuZXhwb3J0IGNsYXNzIEZsb3dDb3JlIGltcGxlbWVudHMgSUV2ZW50IHtcclxuICBwdWJsaWMgR2V0SWQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnaWQnKTtcclxuICB9XHJcbiAgcHVibGljIFNldElkKGlkOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCdpZCcsIGlkKTtcclxuICB9XHJcbiAgcHVibGljIHByb3BlcnRpZXM6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xyXG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblxyXG4gIHB1YmxpYyBDaGVja0VsZW1lbnRDaGlsZChlbDogSFRNTEVsZW1lbnQpIHtcclxuICAgIHJldHVybiB0aGlzLmVsTm9kZSA9PSBlbCB8fCB0aGlzLmVsTm9kZS5jb250YWlucyhlbCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XHJcbiAgcHVibGljIFNldERhdGEoZGF0YTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwpIHtcclxuICAgIHRoaXMuZGF0YS5TZXREYXRhKGRhdGEsIHNlbmRlcik7XHJcbiAgfVxyXG4gIHB1YmxpYyBTZXREYXRhRmxvdyhkYXRhOiBEYXRhRmxvdykge1xyXG4gICAgdGhpcy5kYXRhLlNldERhdGEoZGF0YSwgdGhpcywgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5kaXNwYXRjaChgYmluZF9kYXRhX2V2ZW50YCwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XHJcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHsgZGF0YSwgc2VuZGVyOiB0aGlzIH0pO1xyXG4gIH1cclxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcclxuICB9XHJcbiAgUmVtb3ZlRGF0YUV2ZW50KCkge1xyXG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlRmxvdzxUUGFyZW50IGV4dGVuZHMgRmxvd0NvcmU+IGV4dGVuZHMgRmxvd0NvcmUge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyZW50OiBUUGFyZW50KSB7XHJcbiAgICBzdXBlcigpO1xyXG4gIH1cclxufVxyXG4iLCJleHBvcnQgY29uc3QgTE9HID0gKG1lc3NhZ2U/OiBhbnksIC4uLm9wdGlvbmFsUGFyYW1zOiBhbnlbXSkgPT4gY29uc29sZS5sb2cobWVzc2FnZSwgb3B0aW9uYWxQYXJhbXMpO1xuZXhwb3J0IGNvbnN0IGdldERhdGUgPSAoKSA9PiAobmV3IERhdGUoKSk7XG5leHBvcnQgY29uc3QgZ2V0VGltZSA9ICgpID0+IGdldERhdGUoKS5nZXRUaW1lKCk7XG5leHBvcnQgY29uc3QgZ2V0VXVpZCA9ICgpID0+IHtcbiAgLy8gaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvcmZjNDEyMi50eHRcbiAgbGV0IHM6IGFueSA9IFtdO1xuICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzY7IGkrKykge1xuICAgIHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApLCAxKTtcbiAgfVxuICBzWzE0XSA9IFwiNFwiOyAgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG4gIHNbMTldID0gaGV4RGlnaXRzLnN1YnN0cigoc1sxOV0gJiAweDMpIHwgMHg4LCAxKTsgIC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG4gIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcbiAgcmV0dXJuIHV1aWQ7XG59XG5cbmV4cG9ydCBjb25zdCBjb21wYXJlU29ydCA9IChhOiBhbnksIGI6IGFueSkgPT4ge1xuICBpZiAoYS5zb3J0IDwgYi5zb3J0KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmIChhLnNvcnQgPiBiLnNvcnQpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmV4cG9ydCBjb25zdCBpc0Z1bmN0aW9uID0gKGZuOiBhbnkpID0+IHtcbiAgcmV0dXJuIGZuICYmIGZuIGluc3RhbmNlb2YgRnVuY3Rpb247XG59XG5leHBvcnQgY29uc3QgZG93bmxvYWRPYmplY3RBc0pzb24gPSAoZXhwb3J0T2JqOiBhbnksIGV4cG9ydE5hbWU6IHN0cmluZykgPT4ge1xuICB2YXIgZGF0YVN0ciA9IFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShleHBvcnRPYmopKTtcbiAgdmFyIGRvd25sb2FkQW5jaG9yTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgZGF0YVN0cik7XG4gIGRvd25sb2FkQW5jaG9yTm9kZS5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBleHBvcnROYW1lICsgXCIuanNvblwiKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb3dubG9hZEFuY2hvck5vZGUpOyAvLyByZXF1aXJlZCBmb3IgZmlyZWZveFxuICBkb3dubG9hZEFuY2hvck5vZGUuY2xpY2soKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnJlbW92ZSgpO1xufVxuZXhwb3J0IGNvbnN0IHJlYWRGaWxlTG9jYWwgPSAoY2FsbGJhY2s6IGFueSkgPT4ge1xuICB2YXIgaW5wdXRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0RWwuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2ZpbGUnKTtcbiAgaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjaz8uKGZyLnJlc3VsdCk7XG4gICAgfVxuICAgIGlmIChpbnB1dEVsICYmIGlucHV0RWwuZmlsZXMpXG4gICAgICBmci5yZWFkQXNUZXh0KGlucHV0RWwuZmlsZXNbMF0pO1xuICB9KTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpbnB1dEVsKTtcbiAgaW5wdXRFbC5jbGljaygpO1xuICBpbnB1dEVsLnJlbW92ZSgpO1xufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi9JRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcbmltcG9ydCB7IGlzRnVuY3Rpb24gfSBmcm9tIFwiLi9VdGlsc1wiO1xuXG5leHBvcnQgY29uc3QgVGFnVmlldyA9IFsnU1BBTicsICdESVYnLCAnUCcsICdURVhUQVJFQSddO1xuZXhwb3J0IGNsYXNzIERhdGFWaWV3IHtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIHByb3BlcnR5OiBhbnk7XG4gIHByaXZhdGUgZWxTdWdnZXN0aW9uczogRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBlbFN1Z2dlc3Rpb25zQ29udGVudDogRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBub2RlRWRpdG9yOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgZWw6IEVsZW1lbnQsIHByaXZhdGUgZGF0YTogRGF0YUZsb3csIHByaXZhdGUgbWFpbjogSU1haW4sIHByaXZhdGUga2V5TmFtZTogc3RyaW5nIHwgbnVsbCA9IG51bGwpIHtcbiAgICBpZiAodGhpcy5rZXlOYW1lKSB7XG4gICAgICBpZiAoIWVsLmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleSh0aGlzLmRhdGEuR2V0KCdrZXknKSk/Llt0aGlzLmtleU5hbWVdO1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IgPSBlbCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgdGhpcy5ub2RlRWRpdG9yLmNsYXNzTGlzdC5hZGQoJ25vZGUtZWRpdG9yJyk7XG4gICAgICAgIGlmICh0aGlzLnByb3BlcnR5LmVkaXQpIHtcbiAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0eS5zZWxlY3QpIHtcbiAgICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIm5vZGUtZm9ybS1jb250cm9sXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIHRoaXMua2V5TmFtZSk7XG5cbiAgICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5TmFtZSA9IGVsPy5nZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnKTtcbiAgICAgIGlmICh0aGlzLmtleU5hbWUpIHtcbiAgICAgICAgdGhpcy5wcm9wZXJ0eSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KHRoaXMuZGF0YS5HZXQoJ2tleScpKT8uW3RoaXMua2V5TmFtZV07XG4gICAgICAgIHRoaXMuZWxOb2RlID0gdGhpcy5lbCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgdGhpcy5ub2RlRWRpdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3InKTtcbiAgICAgICAgZWwucGFyZW50RWxlbWVudD8uaW5zZXJ0QmVmb3JlKHRoaXMubm9kZUVkaXRvciwgZWwpO1xuICAgICAgICBlbC5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZChlbCk7XG4gICAgICAgIHRoaXMubm9kZUVkaXRvci5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZWxTdWdnZXN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxTdWdnZXN0aW9ucy5jbGFzc0xpc3QuYWRkKCdub2RlLWVkaXRvcl9zdWdnZXN0aW9ucycpO1xuICAgIHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsU3VnZ2VzdGlvbnNDb250ZW50LmNsYXNzTGlzdC5hZGQoJ3N1Z2dlc3Rpb25zX2NvbnRlbnQnKTtcbiAgICB0aGlzLmVsU3VnZ2VzdGlvbnMuYXBwZW5kQ2hpbGQodGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudCk7XG4gICAgdGhpcy5zaG93U3VnZ2VzdGlvbnMoZmFsc2UpO1xuICAgIGlmICh0aGlzLmtleU5hbWUpXG4gICAgICB0aGlzLmJpbmREYXRhKCk7XG4gIH1cbiAgcHJpdmF0ZSBjaGVja1Nob3dTdWdnZXN0aW9ucygpIHtcbiAgICBpZiAodGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudCkge1xuICAgICAgdGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudC5pbm5lckhUTUwgPSAnJztcbiAgICAgIHZhciBhcnIgPSB0aGlzLm1haW4uZ2V0VmFyaWFibGUoKTtcbiAgICAgIGlmICghYXJyIHx8IGFyci5sZW5ndGggPT0gMCkge1xuICAgICAgICB0aGlzLnNob3dTdWdnZXN0aW9ucyhmYWxzZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCBlbFVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgYXJyKSB7XG4gICAgICAgIGxldCBlbExpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgbGV0IGVsTGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgZWxMaS5hcHBlbmRDaGlsZChlbExpbmspO1xuICAgICAgICBlbExpbmsuaW5uZXJIVE1MID0gaXRlbS5HZXQoJ25hbWUnKTtcbiAgICAgICAgZWxMaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgIGFsZXJ0KGVsTGluay5pbm5lckhUTUwpO1xuICAgICAgICB9KTtcbiAgICAgICAgZWxVbC5hcHBlbmRDaGlsZChlbExpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQuYXBwZW5kQ2hpbGQoZWxVbCk7XG4gICAgfVxuICAgIGxldCB0eHQ6IGFueSA9ICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlO1xuICAgIGxldCBzZWxlY3Rpb25TdGFydCA9ICh0aGlzLmVsTm9kZSBhcyBhbnkpLnNlbGVjdGlvblN0YXJ0O1xuICAgIGlmICh0eHQpIHtcbiAgICAgIGxldCBzdGFydEluZGV4ID0gdHh0Lmxhc3RJbmRleE9mKFwiJHtcIiwgc2VsZWN0aW9uU3RhcnQpO1xuICAgICAgbGV0IGVuZEluZGV4ID0gdHh0Lmxhc3RJbmRleE9mKFwifVwiLCBzZWxlY3Rpb25TdGFydCk7XG4gICAgICBpZiAoZW5kSW5kZXggPCBzdGFydEluZGV4KVxuICAgICAgICB0aGlzLnNob3dTdWdnZXN0aW9ucyh0cnVlKTtcbiAgICAgIGVsc2VcbiAgICAgICAgdGhpcy5zaG93U3VnZ2VzdGlvbnMoZmFsc2UpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIHNob3dTdWdnZXN0aW9ucyhmbGc6IGJvb2xlYW4gPSB0cnVlKSB7XG4gICAgaWYgKCF0aGlzLmVsU3VnZ2VzdGlvbnMpIHJldHVybjtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsU3VnZ2VzdGlvbnMucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsU3VnZ2VzdGlvbnMuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgYmluZERhdGEoKSB7XG4gICAgaWYgKHRoaXMua2V5TmFtZSAmJiB0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5kYXRhLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke3RoaXMua2V5TmFtZX1gLCB0aGlzLmJpbmRJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnMpXG4gICAgICAgICAgdGhpcy5lbE5vZGU/LnBhcmVudEVsZW1lbnQ/LmFwcGVuZENoaWxkKHRoaXMuZWxTdWdnZXN0aW9ucyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCAoKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnMpXG4gICAgICAgICAgICB0aGlzLmVsTm9kZT8ucGFyZW50RWxlbWVudD8ucmVtb3ZlQ2hpbGQodGhpcy5lbFN1Z2dlc3Rpb25zKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJzZWxlY3RcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmNoZWNrU2hvd1N1Z2dlc3Rpb25zKCk7XG4gICAgICB9KVxuICAgICAgaWYgKHRoaXMucHJvcGVydHkgJiYgdGhpcy5wcm9wZXJ0eS5zZWxlY3QgJiYgaXNGdW5jdGlvbih0aGlzLnByb3BlcnR5LmRhdGFTZWxlY3QpKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLnByb3BlcnR5LmRhdGFTZWxlY3QoeyBlbE5vZGU6IHRoaXMuZWxOb2RlLCBtYWluOiB0aGlzLm1haW4sIGtleTogdGhpcy5rZXlOYW1lIH0pLm1hcCgoeyB2YWx1ZSwgdGV4dCB9OiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICAgICAgb3B0aW9uLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgb3B0aW9uLnRleHQgPSB0ZXh0O1xuICAgICAgICAgIHJldHVybiBvcHRpb247XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGxldCBvcHRpb24gb2Ygb3B0aW9ucykge1xuICAgICAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnByb3BlcnR5ICYmIGlzRnVuY3Rpb24odGhpcy5wcm9wZXJ0eS5zY3JpcHQpKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHkuc2NyaXB0KHsgZWxOb2RlOiB0aGlzLmVsTm9kZSwgbWFpbjogdGhpcy5tYWluLCBrZXk6IHRoaXMua2V5TmFtZSB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0Tm9kZVZhbHVlKHRoaXMuZGF0YS5HZXQodGhpcy5rZXlOYW1lKSk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgc2V0Tm9kZVZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGlmIChUYWdWaWV3LmluY2x1ZGVzKHRoaXMuZWxOb2RlLnRhZ05hbWUpKSB7XG4gICAgICAgICh0aGlzLmVsTm9kZSBhcyBhbnkpLmlubmVyVGV4dCA9IGAke3ZhbHVlfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAodGhpcy5lbE5vZGUgYXMgYW55KS52YWx1ZSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwcml2YXRlIGJpbmRJbnB1dCh7IHZhbHVlLCBzZW5kZXIgfTogYW55KSB7XG4gICAgaWYgKHNlbmRlciAhPT0gdGhpcyAmJiB0aGlzLmVsTm9kZSAmJiBzZW5kZXIuZWxOb2RlICE9PSB0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5zZXROb2RlVmFsdWUodmFsdWUpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGJpbmRFdmVudCgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmtleU5hbWUgJiYgdGhpcy5lbE5vZGUpIHtcbiAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLmtleU5hbWUsICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlLCB0aGlzKTtcblxuXG4gICAgICAgIHRoaXMuY2hlY2tTaG93U3VnZ2VzdGlvbnMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgRGVsZXRlKCkge1xuICAgIGlmICh0aGlzLmtleU5hbWUgJiYgdGhpcy5lbE5vZGUpIHtcbiAgICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHt0aGlzLmtleU5hbWV9YCwgdGhpcy5iaW5kSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHN0YXRpYyBCaW5kRWxlbWVudChlbDogRWxlbWVudCwgZGF0YTogRGF0YUZsb3csIG1haW46IElNYWluLCBrZXk6IHN0cmluZyB8IG51bGwgPSBudWxsKTogRGF0YVZpZXdbXSB7XG4gICAgaWYgKGVsLmNoaWxkRWxlbWVudENvdW50ID09IDAgfHwgZWwuZ2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJykpIHtcbiAgICAgIHJldHVybiBbbmV3IERhdGFWaWV3KGVsLCBkYXRhLCBtYWluLCBrZXkpXTtcbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnW25vZGVcXFxcOm1vZGVsXScpKS5tYXAoKGl0ZW06IEVsZW1lbnQpID0+IHtcbiAgICAgIHJldHVybiBuZXcgRGF0YVZpZXcoaXRlbSwgZGF0YSwgbWFpbik7XG4gICAgfSk7XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBOb2RlSXRlbSB9IGZyb20gXCIuL05vZGVJdGVtXCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lIHtcbiAgcHVibGljIGVsTm9kZTogU1ZHRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcbiAgcHVibGljIGVsUGF0aDogU1ZHUGF0aEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJwYXRoXCIpO1xuICBwcml2YXRlIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XG4gIHB1YmxpYyB0ZW1wOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZnJvbTogTm9kZUl0ZW0sIHB1YmxpYyBmcm9tSW5kZXg6IG51bWJlciA9IDAsIHB1YmxpYyB0bzogTm9kZUl0ZW0gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsIHB1YmxpYyB0b0luZGV4OiBudW1iZXIgPSAwLCBkYXRhOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5mcm9tLnBhcmVudC5lbENhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG5cbiAgICB0aGlzLmZyb20uQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnRvPy5BZGRMaW5lKHRoaXMpO1xuICAgIGlmIChkYXRhKSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoXG4gICAgICB7XG4gICAgICAgIGZyb206IHRoaXMuZnJvbS5HZXRJZCgpLFxuICAgICAgICBmcm9tSW5kZXg6IHRoaXMuZnJvbUluZGV4LFxuICAgICAgICB0bzogdGhpcy50bz8uR2V0SWQoKSxcbiAgICAgICAgdG9JbmRleDogdGhpcy50b0luZGV4XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAuLi4gdGhpcy5mcm9tLnBhcmVudC5tYWluLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLmxpbmUpIHx8IHt9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmZyb20uZGF0YS5BcHBlbmQoJ2xpbmVzJywgdGhpcy5kYXRhKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVG8odG9feDogbnVtYmVyLCB0b195OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuZnJvbSB8fCB0aGlzLmZyb20uZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgeyB4OiBmcm9tX3gsIHk6IGZyb21feSB9OiBhbnkgPSB0aGlzLmZyb20uZ2V0UG9zdGlzaW9uRG90KHRoaXMuZnJvbUluZGV4KTtcbiAgICB2YXIgbGluZUN1cnZlID0gdGhpcy5jcmVhdGVDdXJ2YXR1cmUoZnJvbV94LCBmcm9tX3ksIHRvX3gsIHRvX3ksIHRoaXMuY3VydmF0dXJlLCAnb3RoZXInKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCk6IExpbmUge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvLmVsTm9kZSkge1xuICAgICAgbGV0IHsgeDogdG9feCwgeTogdG9feSB9OiBhbnkgPSB0aGlzLnRvLmdldFBvc3Rpc2lvbkRvdCh0aGlzLnRvSW5kZXgpO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIEFjdGl2ZShmbGc6IGFueSA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwsIGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5mcm9tLmRhdGEuUmVtb3ZlKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gICAgaWYgKHRoaXMuZnJvbSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50bz8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsUGF0aC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLmZyb20ucGFyZW50LnNldExpbmVDaG9vc2UodGhpcylcbiAgfVxuICBwdWJsaWMgc2V0Tm9kZVRvKG5vZGU6IE5vZGVJdGVtIHwgdW5kZWZpbmVkLCB0b0luZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLnRvID0gbm9kZTtcbiAgICB0aGlzLnRvSW5kZXggPSB0b0luZGV4O1xuICB9XG4gIHB1YmxpYyBDbG9uZSgpIHtcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvSW5kZXggJiYgdGhpcy5mcm9tICE9IHRoaXMudG8gJiYgIXRoaXMuZnJvbS5jaGVja0xpbmVFeGlzdHModGhpcy5mcm9tSW5kZXgsIHRoaXMudG8sIHRoaXMudG9JbmRleCkpIHtcbiAgICAgIHJldHVybiBuZXcgTGluZSh0aGlzLmZyb20sIHRoaXMuZnJvbUluZGV4LCB0aGlzLnRvLCB0aGlzLnRvSW5kZXgpLlVwZGF0ZVVJKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBnZXRUaW1lIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcblxuZXhwb3J0IGVudW0gTW92ZVR5cGUge1xuICBOb25lID0gMCxcbiAgTm9kZSA9IDEsXG4gIENhbnZhcyA9IDIsXG4gIExpbmUgPSAzLFxufVxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlld19FdmVudCB7XG5cbiAgcHJpdmF0ZSB0aW1lRmFzdENsaWNrOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHRhZ0luZ29yZSA9IFsnaW5wdXQnLCAnYnV0dG9uJywgJ2EnLCAndGV4dGFyZWEnXTtcblxuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gIHByaXZhdGUgZmxnRHJhcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIGF2X3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgYXZfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHRlbXBMaW5lOiBMaW5lIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IERlc2dpbmVyVmlldykge1xuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuICAgIC8qIENvbnRleHQgTWVudSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMubm9kZV9kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMubm9kZV9kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy56b29tX2VudGVyLmJpbmQodGhpcykpO1xuICAgIC8qIERlbGV0ZSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb250ZXh0bWVudShldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cbiAgcHJpdmF0ZSBub2RlX2RyYWdvdmVyKGV2OiBhbnkpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfVxuICBwcml2YXRlIG5vZGVfZHJvcEVuZChldjogYW55KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBsZXQga2V5Tm9kZTogYW55ID0gdGhpcy5wYXJlbnQubWFpbi5nZXRDb250cm9sQ2hvb3NlKCk7XG4gICAgaWYgKCFrZXlOb2RlICYmIGV2LnR5cGUgIT09IFwidG91Y2hlbmRcIikge1xuICAgICAga2V5Tm9kZSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwibm9kZVwiKTtcbiAgICB9XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuXG4gICAgaWYgKHRoaXMucGFyZW50LmNoZWNrT25seU5vZGUoa2V5Tm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IG5vZGVJdGVtID0gdGhpcy5wYXJlbnQuQWRkTm9kZShrZXlOb2RlLCB7XG4gICAgICBncm91cDogdGhpcy5wYXJlbnQuQ3VycmVudEdyb3VwKClcbiAgICB9KTtcbiAgICBub2RlSXRlbS51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21fb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBab29tIEluXG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21faW4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBTdGFydE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmICh0aGlzLnRhZ0luZ29yZS5pbmNsdWRlcyhldi50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSBnZXRUaW1lKCk7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21haW4tcGF0aCcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgbGV0IG5vZGVDaG9vc2UgPSB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk7XG4gICAgaWYgKG5vZGVDaG9vc2UgJiYgbm9kZUNob29zZS5DaGVja0VsZW1lbnRDaGlsZChldi50YXJnZXQpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh1bmRlZmluZWQpO1xuICAgIH1cbiAgICBpZiAobm9kZUNob29zZSAmJiB0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vZGUgJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBldi50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmUobm9kZUNob29zZSwgZnJvbUluZGV4KTtcbiAgICAgIHRoaXMudGVtcExpbmUudGVtcCA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgdGhpcy5hdl94ID0gdGhpcy5wYXJlbnQuZ2V0WCgpO1xuICAgICAgdGhpcy5hdl95ID0gdGhpcy5wYXJlbnQuZ2V0WSgpO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuYXZfeCArIHRoaXMucGFyZW50LkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRZKHkpO1xuICAgICAgICAgIHRoaXMucGFyZW50LlVwZGF0ZVVJKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wb3NfeSAtIGVfcG9zX3kpO1xuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgICAgICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgICAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLnBhcmVudC5lbENhbnZhcy5vZmZzZXRMZWZ0IC0geCwgdGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0VG9wIC0geSAtIDIwKTtcbiAgICAgICAgICAgIGxldCBub2RlRWwgPSBldi50YXJnZXQuY2xvc2VzdCgnW25vZGUtaWRdJyk7XG4gICAgICAgICAgICBsZXQgbm9kZUlkID0gbm9kZUVsPy5nZXRBdHRyaWJ1dGUoJ25vZGUtaWQnKTtcbiAgICAgICAgICAgIGxldCBub2RlVG8gPSBub2RlSWQgPyB0aGlzLnBhcmVudC5HZXROb2RlQnlJZChub2RlSWQpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKG5vZGVUbyAmJiBldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibm9kZS1kb3RcIikpIHtcbiAgICAgICAgICAgICAgbGV0IHRvSW5kZXggPSBldi50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICAgICAgICAgIHRoaXMudGVtcExpbmUuc2V0Tm9kZVRvKG5vZGVUbywgdG9JbmRleCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgdG9JbmRleCA9IG5vZGVFbD8ucXVlcnlTZWxlY3RvcignLm5vZGUtZG90Jyk/LlswXT8uZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICAgICAgICAgIHRoaXMudGVtcExpbmUuc2V0Tm9kZVRvKG5vZGVUbywgdG9JbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIHRoaXMubW91c2VfeCA9IGVfcG9zX3g7XG4gICAgICB0aGlzLm1vdXNlX3kgPSBlX3Bvc195O1xuICAgIH1cbiAgfVxuICBwcml2YXRlIEVuZE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgLy9maXggRmFzdCBDbGlja1xuICAgIGlmICgoKGdldFRpbWUoKSAtIHRoaXMudGltZUZhc3RDbGljaykgPCAxMDApIHx8ICF0aGlzLmZsZ01vdmUpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGVfcG9zX3ggPSB0aGlzLm1vdXNlX3g7XG4gICAgICBlX3Bvc195ID0gdGhpcy5tb3VzZV95O1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICBsZXQgeCA9IHRoaXMuYXZfeCArIHRoaXMucGFyZW50LkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgbGV0IHkgPSB0aGlzLmF2X3kgKyB0aGlzLnBhcmVudC5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcbiAgICAgIHRoaXMucGFyZW50LnNldFgoeCk7XG4gICAgICB0aGlzLnBhcmVudC5zZXRZKHkpO1xuICAgICAgdGhpcy5hdl94ID0gMDtcbiAgICAgIHRoaXMuYXZfeSA9IDA7XG4gICAgfVxuICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICB0aGlzLnRlbXBMaW5lLkNsb25lKCk7XG4gICAgICB0aGlzLnRlbXBMaW5lLmRlbGV0ZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgdGhpcy5mbGdEcmFwID0gZmFsc2U7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHJpdmF0ZSBrZXlkb3duKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoZXYua2V5ID09PSAnRGVsZXRlJyB8fCAoZXYua2V5ID09PSAnQmFja3NwYWNlJyAmJiBldi5tZXRhS2V5KSkge1xuICAgICAgZXYucHJldmVudERlZmF1bHQoKVxuXG4gICAgICB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk/LmRlbGV0ZSgpO1xuICAgICAgdGhpcy5wYXJlbnQuZ2V0TGluZUNob29zZSgpPy5kZWxldGUoKTtcbiAgICB9XG4gICAgaWYgKGV2LmtleSA9PT0gJ0YyJykge1xuICAgICAgZXYucHJldmVudERlZmF1bHQoKVxuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgQmFzZUZsb3csIEV2ZW50RW51bSwgRGF0YUZsb3csIERhdGFWaWV3IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcbmltcG9ydCB7IGlzRnVuY3Rpb24gfSBmcm9tIFwiLi4vY29yZS9VdGlsc1wiO1xuZXhwb3J0IGNsYXNzIE5vZGVJdGVtIGV4dGVuZHMgQmFzZUZsb3c8RGVzZ2luZXJWaWV3PiB7XG4gIC8qKlxuICAgKiBHRVQgU0VUIGZvciBEYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0TmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnbmFtZScpO1xuICB9XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneScpO1xuICB9XG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3gnKTtcbiAgfVxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3gnLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIENoZWNrS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2tleScpID09IGtleTtcbiAgfVxuICBwdWJsaWMgZ2V0RGF0YUxpbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2xpbmVzJykgPz8gW107XG4gIH1cbiAgcHVibGljIGNoZWNrTGluZUV4aXN0cyhmcm9tSW5kZXg6IG51bWJlciwgdG86IE5vZGVJdGVtLCB0b0luZGV4OiBOdW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5hcnJMaW5lLmZpbHRlcigoaXRlbTogTGluZSkgPT4ge1xuICAgICAgaWYgKCFpdGVtLnRlbXAgJiYgaXRlbS50byA9PSB0byAmJiBpdGVtLnRvSW5kZXggPT0gdG9JbmRleCAmJiBpdGVtLmZyb21JbmRleCA9PSBmcm9tSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoIWl0ZW0udGVtcCAmJiBpdGVtLmZyb20gPT0gdG8gJiYgaXRlbS5mcm9tSW5kZXggPT0gdG9JbmRleCAmJiBpdGVtLnRvSW5kZXggPT0gZnJvbUluZGV4KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSkubGVuZ3RoID4gMDtcbiAgfVxuICBwdWJsaWMgZWxDb250ZW50OiBFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGFyckxpbmU6IExpbmVbXSA9IFtdO1xuICBwcml2YXRlIG9wdGlvbjogYW55ID0ge307XG4gIHByaXZhdGUgYXJyRGF0YVZpZXc6IERhdGFWaWV3W10gPSBbXTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogRGVzZ2luZXJWaWV3LCBwcml2YXRlIGtleU5vZGU6IGFueSwgZGF0YTogYW55ID0ge30pIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMub3B0aW9uID0gdGhpcy5wYXJlbnQubWFpbi5nZXRDb250cm9sTm9kZUJ5S2V5KGtleU5vZGUpO1xuICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMub3B0aW9uPy5wcm9wZXJ0aWVzO1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5Jbml0RGF0YSh7IC4uLmRhdGEsIG5hbWU6IHRoaXMub3B0aW9uLm5hbWUgfSwgdGhpcy5wcm9wZXJ0aWVzKTtcbiAgICAgIHRoaXMucGFyZW50LmRhdGEuQXBwZW5kKCdub2RlcycsIHRoaXMuZGF0YSk7XG4gICAgfVxuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ub2RlJyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb24uY2xhc3MpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb24uY2xhc3MpO1xuICAgIH1cbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ25vZGUtaWQnLCB0aGlzLkdldElkKCkpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTpub25lJyk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICB0aGlzLnJlbmRlclVJKCk7XG4gIH1cbiAgcHVibGljIGdldE9wdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb247XG4gIH1cbiAgcHJpdmF0ZSByZW5kZXJVSShkZXRhaWw6IGFueSA9IG51bGwpIHtcbiAgICBpZiAoKGRldGFpbCAmJiBbJ3gnLCAneSddLmluY2x1ZGVzKGRldGFpbC5rZXkpKSkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5lbE5vZGUuY29udGFpbnMoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkpIHJldHVybjtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYGRpc3BsYXk6bm9uZTtgKTtcbiAgICBpZiAodGhpcy5nZXRPcHRpb24oKT8uaGlkZVRpdGxlID09PSB0cnVlKSB7XG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1sZWZ0XCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtdG9wXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYm9keVwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtYm90dG9tXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXJpZ2h0XCI+PC9kaXY+XG4gICAgYDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtbGVmdFwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXRvcFwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInRpdGxlXCI+JHt0aGlzLm9wdGlvbi5pY29ufSAke3RoaXMuZ2V0TmFtZSgpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3R0b21cIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtcmlnaHRcIj48L2Rpdj5cbiAgICBgO1xuICAgIH1cblxuICAgIGNvbnN0IGFkZE5vZGVEb3QgPSAobnVtOiBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkLCBzdGFydDogbnVtYmVyLCBxdWVyeTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAobnVtKSB7XG4gICAgICAgIGxldCBub2RlUXVlcnkgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKHF1ZXJ5KTtcbiAgICAgICAgaWYgKG5vZGVRdWVyeSkge1xuICAgICAgICAgIG5vZGVRdWVyeS5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBub2RlRG90ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBub2RlRG90LmNsYXNzTGlzdC5hZGQoJ25vZGUtZG90Jyk7XG4gICAgICAgICAgICBub2RlRG90LnNldEF0dHJpYnV0ZSgnbm9kZScsIGAke3N0YXJ0ICsgaX1gKTtcbiAgICAgICAgICAgIG5vZGVRdWVyeS5hcHBlbmRDaGlsZChub2RlRG90KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgYWRkTm9kZURvdCh0aGlzLm9wdGlvbj8uZG90Py5sZWZ0LCAxMDAwLCAnLm5vZGUtbGVmdCcpO1xuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8udG9wLCAyMDAwLCAnLm5vZGUtdG9wJyk7XG4gICAgYWRkTm9kZURvdCh0aGlzLm9wdGlvbj8uZG90Py5ib3R0b20sIDMwMDAsICcubm9kZS1ib3R0b20nKTtcbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LnJpZ2h0LCA0MDAwLCAnLm5vZGUtcmlnaHQnKTtcblxuICAgIHRoaXMuZWxDb250ZW50ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLm5vZGUtY29udGVudCAuYm9keScpIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMucGFyZW50Lm1haW4ucmVuZGVySHRtbCh0aGlzLCB0aGlzLmVsQ29udGVudCk7XG4gICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgIHRoaXMuYXJyRGF0YVZpZXcuZm9yRWFjaCgoaXRlbSkgPT4gaXRlbS5EZWxldGUoKSk7XG4gICAgaWYgKGlzRnVuY3Rpb24odGhpcy5vcHRpb24uc2NyaXB0KSkge1xuICAgICAgdGhpcy5vcHRpb24uc2NyaXB0KHsgbm9kZTogdGhpcywgZWxOb2RlOiB0aGlzLmVsTm9kZSwgbWFpbjogdGhpcy5wYXJlbnQubWFpbiB9KTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZWxDb250ZW50KVxuICAgICAgdGhpcy5hcnJEYXRhVmlldyA9IERhdGFWaWV3LkJpbmRFbGVtZW50KHRoaXMuZWxDb250ZW50LCB0aGlzLmRhdGEsIHRoaXMucGFyZW50Lm1haW4pO1xuICB9XG4gIHB1YmxpYyBvcGVuR3JvdXAoKSB7XG4gICAgaWYgKHRoaXMuQ2hlY2tLZXkoJ25vZGVfZ3JvdXAnKSkge1xuICAgICAgdGhpcy5wYXJlbnQub3Blbkdyb3VwKHRoaXMuR2V0SWQoKSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB1cGRhdGVQb3NpdGlvbih4OiBhbnksIHk6IGFueSwgaUNoZWNrID0gZmFsc2UpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGxldCB0ZW1weCA9IHg7XG4gICAgICBsZXQgdGVtcHkgPSB5O1xuICAgICAgaWYgKCFpQ2hlY2spIHtcbiAgICAgICAgdGVtcHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgIHRlbXB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KTtcbiAgICAgIH1cbiAgICAgIGlmICh0ZW1weCAhPT0gdGhpcy5nZXRYKCkpIHtcbiAgICAgICAgdGhpcy5zZXRYKHRlbXB4KTtcbiAgICAgIH1cbiAgICAgIGlmICh0ZW1weSAhPT0gdGhpcy5nZXRZKCkpIHtcbiAgICAgICAgdGhpcy5zZXRZKHRlbXB5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIEFjdGl2ZShmbGc6IGFueSA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBSZW1vdmVMaW5lKGxpbmU6IExpbmUpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmFyckxpbmUuaW5kZXhPZihsaW5lKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5hcnJMaW5lLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFyckxpbmU7XG4gIH1cbiAgcHVibGljIEFkZExpbmUobGluZTogTGluZSkge1xuICAgIHRoaXMuYXJyTGluZSA9IFsuLi50aGlzLmFyckxpbmUsIGxpbmVdO1xuICB9XG4gIHB1YmxpYyBnZXRQb3N0aXNpb25Eb3QoaW5kZXg6IG51bWJlciA9IDApIHtcbiAgICBsZXQgZWxEb3Q6IGFueSA9IHRoaXMuZWxOb2RlPy5xdWVyeVNlbGVjdG9yKGAubm9kZS1kb3Rbbm9kZT1cIiR7aW5kZXh9XCJdYCk7XG4gICAgaWYgKGVsRG90KSB7XG4gICAgICBsZXQgeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgKyBlbERvdC5vZmZzZXRUb3AgKyAxMCk7XG4gICAgICBsZXQgeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0ICsgZWxEb3Qub2Zmc2V0TGVmdCArIDEwKTtcbiAgICAgIHJldHVybiB7IHgsIHkgfTtcbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcbiAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5VcGRhdGVVSSgpO1xuICAgIH0pXG4gIH1cbiAgcHVibGljIGRlbGV0ZShpc0NsZWFyRGF0YSA9IHRydWUpIHtcbiAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4gaXRlbS5kZWxldGUodGhpcywgaXNDbGVhckRhdGEpKTtcbiAgICBpZiAoaXNDbGVhckRhdGEpXG4gICAgICB0aGlzLmRhdGEuZGVsZXRlKCk7XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLlJlbW92ZURhdGFFdmVudCgpO1xuICAgIH1cbiAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlKCk7XG4gICAgdGhpcy5hcnJMaW5lID0gW107XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5wYXJlbnQuUmVtb3ZlTm9kZSh0aGlzKTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHt9KTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyTGluZSgpIHtcbiAgICB0aGlzLmdldERhdGFMaW5lKCkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3cpID0+IHtcbiAgICAgIGxldCBub2RlRnJvbSA9IHRoaXM7XG4gICAgICBsZXQgbm9kZVRvID0gdGhpcy5wYXJlbnQuR2V0Tm9kZUJ5SWQoaXRlbS5HZXQoJ3RvJykpO1xuICAgICAgbGV0IHRvSW5kZXggPSBpdGVtLkdldCgndG9JbmRleCcpO1xuICAgICAgbGV0IGZyb21JbmRleCA9IGl0ZW0uR2V0KCdmcm9tSW5kZXgnKTtcbiAgICAgIG5ldyBMaW5lKG5vZGVGcm9tLCBmcm9tSW5kZXgsIG5vZGVUbywgdG9JbmRleCwgaXRlbSkuVXBkYXRlVUkoKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIEZsb3dDb3JlLCBJTWFpbiwgRXZlbnRFbnVtLCBQcm9wZXJ0eUVudW0sIFNjb3BlUm9vdCB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfRXZlbnQgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdfRXZlbnRcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlld19Ub29sYmFyIH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3X1Rvb2xiYXJcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5pbXBvcnQgeyBOb2RlSXRlbSB9IGZyb20gXCIuL05vZGVJdGVtXCI7XG5cbmV4cG9ydCBjb25zdCBab29tID0ge1xuICBtYXg6IDEuNixcbiAgbWluOiAwLjYsXG4gIHZhbHVlOiAwLjEsXG4gIGRlZmF1bHQ6IDFcbn1cbmV4cG9ydCBjbGFzcyBEZXNnaW5lclZpZXcgZXh0ZW5kcyBGbG93Q29yZSB7XG5cbiAgLyoqXG4gICAqIEdFVCBTRVQgZm9yIERhdGFcbiAgICovXG4gIHB1YmxpYyBnZXRab29tKCkge1xuICAgIHJldHVybiArdGhpcy5nZXREYXRhR3JvdXAoKS5HZXQoJ3pvb20nKTtcbiAgfVxuICBwdWJsaWMgc2V0Wm9vbSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF0YUdyb3VwKCkuU2V0KCd6b29tJywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5nZXREYXRhR3JvdXAoKS5HZXQoJ3knKTtcbiAgfVxuICBwdWJsaWMgc2V0WSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF0YUdyb3VwKCkuU2V0KCd5JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRYKCkge1xuICAgIHJldHVybiArdGhpcy5nZXREYXRhR3JvdXAoKS5HZXQoJ3gnKTtcbiAgfVxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF0YUdyb3VwKCkuU2V0KCd4JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHByaXZhdGUgZ3JvdXBEYXRhOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBsYXN0R3JvdXBOYW1lOiBzdHJpbmcgPSBcIlwiO1xuICBwcml2YXRlIGdldERhdGFHcm91cCgpOiBEYXRhRmxvdyB7XG4gICAgaWYgKHRoaXMuJGxvY2spIHJldHVybiB0aGlzLmRhdGE7XG4gICAgLy8gY2FjaGUgZ3JvdXBEYXRhXG4gICAgaWYgKHRoaXMubGFzdEdyb3VwTmFtZSA9PT0gdGhpcy5DdXJyZW50R3JvdXAoKSkgcmV0dXJuIHRoaXMuZ3JvdXBEYXRhID8/IHRoaXMuZGF0YTtcbiAgICB0aGlzLmxhc3RHcm91cE5hbWUgPSB0aGlzLkN1cnJlbnRHcm91cCgpO1xuICAgIGxldCBncm91cHMgPSB0aGlzLmRhdGEuR2V0KCdncm91cHMnKTtcbiAgICB0aGlzLmdyb3VwRGF0YSA9IGdyb3Vwcz8uZmlsdGVyKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS5HZXQoJ2dyb3VwJykgPT0gdGhpcy5sYXN0R3JvdXBOYW1lKT8uWzBdO1xuICAgIGlmICghdGhpcy5ncm91cERhdGEpIHtcbiAgICAgIHRoaXMuZ3JvdXBEYXRhID0gbmV3IERhdGFGbG93KHRoaXMubWFpbiwge1xuICAgICAgICBrZXk6IFByb3BlcnR5RW51bS5ncm91cENhdmFzLFxuICAgICAgICBncm91cDogdGhpcy5sYXN0R3JvdXBOYW1lXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGF0YS5BcHBlbmQoJ2dyb3VwcycsIHRoaXMuZ3JvdXBEYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgIH1cbiAgICBsZXQgZGF0YUdyb3VwID0gdGhpcy5HZXREYXRhQnlJZCh0aGlzLmxhc3RHcm91cE5hbWUpO1xuICAgIGlmIChkYXRhR3JvdXApIHtcbiAgICAgIGRhdGFHcm91cC5vblNhZmUoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsICgpID0+IHtcbiAgICAgICAgdGhpcy5VcGRhdGVVSS5iaW5kKHRoaXMpO1xuICAgICAgICAvLyAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICAgICAgICB0aGlzLmNoYW5nZUdyb3VwKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ncm91cERhdGE7XG4gIH1cbiAgcHJpdmF0ZSBncm91cDogYW55W10gPSBbXTtcbiAgcHVibGljIEdldEdyb3VwTmFtZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLmdyb3VwLm1hcCgoaXRlbSkgPT4gKHsgaWQ6IGl0ZW0sIHRleHQ6IHRoaXMuR2V0RGF0YUJ5SWQoaXRlbSk/LkdldCgnbmFtZScpIH0pKSwgeyBpZDogU2NvcGVSb290LCB0ZXh0OiBTY29wZVJvb3QgfV07XG4gIH1cbiAgcHVibGljIEJhY2tHcm91cChpZDogYW55ID0gbnVsbCkge1xuICAgIGxldCBpbmRleCA9IDE7XG4gICAgaWYgKGlkKSB7XG4gICAgICBpbmRleCA9IHRoaXMuZ3JvdXAuaW5kZXhPZihpZCk7XG4gICAgICBpZiAoaW5kZXggPCAwKSBpbmRleCA9IDA7XG4gICAgfVxuICAgIGlmIChpbmRleClcbiAgICAgIHRoaXMuZ3JvdXAuc3BsaWNlKDAsIGluZGV4KTtcbiAgICBlbHNlIHRoaXMuZ3JvdXAgPSBbXTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICB9XG4gIHB1YmxpYyBDdXJyZW50R3JvdXAoKSB7XG4gICAgbGV0IG5hbWUgPSB0aGlzLmdyb3VwPy5bMF07XG4gICAgaWYgKG5hbWUgJiYgbmFtZSAhPSAnJykge1xuICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuICAgIHJldHVybiAncm9vdCc7XG4gIH1cblxuICBwdWJsaWMgQ3VycmVudEdyb3VwRGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQnlJZCh0aGlzLkN1cnJlbnRHcm91cCgpKSA/PyB0aGlzLmRhdGE7XG4gIH1cbiAgcHVibGljIGNoYW5nZUdyb3VwKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5ncm91cENoYW5nZSwge1xuICAgICAgICBncm91cDogdGhpcy5HZXRHcm91cE5hbWUoKVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgLy8gdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICB9XG4gIHB1YmxpYyBvcGVuR3JvdXAoaWQ6IGFueSkge1xuICAgIHRoaXMuZ3JvdXAgPSBbaWQsIC4uLnRoaXMuZ3JvdXBdO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLmNoYW5nZUdyb3VwKCk7O1xuICB9XG4gIHByaXZhdGUgbGluZUNob29zZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldExpbmVDaG9vc2Uobm9kZTogTGluZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHRoaXMubGluZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubGluZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkge1xuICAgICAgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRMaW5lQ2hvb3NlKCk6IExpbmUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmxpbmVDaG9vc2U7XG4gIH1cbiAgcHJpdmF0ZSBub2RlczogTm9kZUl0ZW1bXSA9IFtdO1xuICBwcml2YXRlIG5vZGVDaG9vc2U6IE5vZGVJdGVtIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgc2V0Tm9kZUNob29zZShub2RlOiBOb2RlSXRlbSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHRoaXMubm9kZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubm9kZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkge1xuICAgICAgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXRMaW5lQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5ub2RlQ2hvb3NlLmRhdGEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLkN1cnJlbnRHcm91cERhdGEoKSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldE5vZGVDaG9vc2UoKTogTm9kZUl0ZW0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm5vZGVDaG9vc2U7XG4gIH1cbiAgcHVibGljIEFkZE5vZGVJdGVtKGRhdGE6IGFueSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5BZGROb2RlKGRhdGEuR2V0KCdrZXknKSwgZGF0YSk7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUoa2V5Tm9kZTogc3RyaW5nLCBkYXRhOiBhbnkgPSB7fSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5JbnNlcnROb2RlKG5ldyBOb2RlSXRlbSh0aGlzLCBrZXlOb2RlLCBkYXRhKSk7XG4gIH1cbiAgcHVibGljIEluc2VydE5vZGUobm9kZTogTm9kZUl0ZW0pOiBOb2RlSXRlbSB7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlSXRlbSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICB0aGlzLmRhdGEuUmVtb3ZlKCdub2RlcycsIG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBDbGVhck5vZGUoKSB7XG4gICAgdGhpcy5ub2Rlcz8uZm9yRWFjaChpdGVtID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICB9XG4gIHB1YmxpYyBHZXREYXRhQWxsTm9kZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuICh0aGlzLmRhdGE/LkdldCgnbm9kZXMnKSA/PyBbXSk7XG4gIH1cbiAgcHVibGljIEdldERhdGFOb2RlKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQWxsTm9kZSgpLmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KFwiZ3JvdXBcIikgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpO1xuICB9XG4gIC8qKlxuICAgKiBWYXJpYnV0ZVxuICAqL1xuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIC8vICBwdWJsaWMgZWxUb29sYmFyOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAvL3B1YmxpYyB0b29sYmFyOiBEZXNnaW5lclZpZXdfVG9vbGJhcjtcbiAgcHVibGljICRsb2NrOiBib29sZWFuID0gdHJ1ZTtcbiAgcHJpdmF0ZSB6b29tX2xhc3RfdmFsdWU6IGFueSA9IDE7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZWxOb2RlID0gZWxOb2RlO1xuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubWFpbik7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKHt9LCBwcm9wZXJ0aWVzKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdkZXNnaW5lci12aWV3JylcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5yZW1vdmUoXCJkZXNnaW5lci1jYW52YXNcIik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnZGVzZ2luZXItdmlldycpXG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QuYWRkKFwiZGVzZ2luZXItY2FudmFzXCIpO1xuICAgIC8vIHRoaXMuZWxUb29sYmFyLmNsYXNzTGlzdC5hZGQoXCJkZXNnaW5lci10b29sYmFyXCIpO1xuICAgIC8vIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxUb29sYmFyKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsQ2FudmFzKTtcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XG4gICAgbmV3IERlc2dpbmVyVmlld19FdmVudCh0aGlzKTtcbiAgICAvLyB0aGlzLnRvb2xiYXIgPSBuZXcgRGVzZ2luZXJWaWV3X1Rvb2xiYXIodGhpcyk7XG4gICAgdGhpcy5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5SZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm9uKEV2ZW50RW51bS5zaG93UHJvcGVydHksIChkYXRhOiBhbnkpID0+IHsgbWFpbi5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCBkYXRhKTsgfSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy5PcGVuKGl0ZW0uZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZVZpZXcoeDogYW55LCB5OiBhbnksIHpvb206IGFueSkge1xuICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3h9cHgsICR7eX1weCkgc2NhbGUoJHt6b29tfSlgO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICB0aGlzLnVwZGF0ZVZpZXcodGhpcy5nZXRYKCksIHRoaXMuZ2V0WSgpLCB0aGlzLmdldFpvb20oKSk7XG4gIH1cbiAgcHVibGljIFJlbmRlclVJKGRldGFpbDogYW55ID0ge30pIHtcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgTm9kZUl0ZW0pIHJldHVybjtcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgRGVzZ2luZXJWaWV3KSB7XG4gICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuQ2xlYXJOb2RlKCk7XG4gICAgdGhpcy5HZXREYXRhTm9kZSgpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy5BZGROb2RlSXRlbShpdGVtKTtcbiAgICB9KTtcbiAgICB0aGlzLkdldEFsbE5vZGUoKS5mb3JFYWNoKChpdGVtOiBOb2RlSXRlbSkgPT4ge1xuICAgICAgaXRlbS5SZW5kZXJMaW5lKCk7XG4gICAgfSlcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gIH1cbiAgcHVibGljIE9wZW4oJGRhdGE6IERhdGFGbG93KSB7XG4gICAgaWYgKCRkYXRhID09IHRoaXMuZGF0YSkge1xuICAgICAgdGhpcy5SZW5kZXJVSSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRhdGE/LmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoZGV0YWlsOiBhbnkpID0+IHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIGRldGFpbCkpO1xuICAgIHRoaXMuZGF0YSA9ICRkYXRhO1xuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgKGRldGFpbDogYW55KSA9PiB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCBkZXRhaWwpKTtcbiAgICB0aGlzLiRsb2NrID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0R3JvdXBOYW1lID0gJyc7XG4gICAgdGhpcy5ncm91cERhdGEgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5ncm91cCA9IFtdO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLmNoYW5nZUdyb3VwKCk7XG4gIH1cbiAgcHVibGljIENhbGNYKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudFdpZHRoIC8gKHRoaXMuZWxOb2RlPy5jbGllbnRXaWR0aCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHVibGljIENhbGNZKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudEhlaWdodCAvICh0aGlzLmVsTm9kZT8uY2xpZW50SGVpZ2h0ICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwdWJsaWMgR2V0QWxsTm9kZSgpOiBOb2RlSXRlbVtdIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlcyB8fCBbXTtcbiAgfVxuICBwdWJsaWMgR2V0Tm9kZUJ5SWQoaWQ6IHN0cmluZyk6IE5vZGVJdGVtIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5HZXRBbGxOb2RlKCkuZmlsdGVyKG5vZGUgPT4gbm9kZS5HZXRJZCgpID09IGlkKT8uWzBdO1xuICB9XG5cbiAgcHVibGljIEdldERhdGFCeUlkKGlkOiBzdHJpbmcpOiBEYXRhRmxvdyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLkdldERhdGFBbGxOb2RlKCkuZmlsdGVyKChpdGVtKSA9PiBpdGVtLkdldCgnaWQnKSA9PT0gaWQpPy5bMF07XG4gIH1cbiAgY2hlY2tPbmx5Tm9kZShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiAodGhpcy5tYWluLmdldENvbnRyb2xCeUtleShrZXkpLm9ubHlOb2RlKSAmJiB0aGlzLm5vZGVzLmZpbHRlcihpdGVtID0+IGl0ZW0uQ2hlY2tLZXkoa2V5KSkubGVuZ3RoID4gMDtcbiAgfVxuICBwdWJsaWMgem9vbV9yZWZyZXNoKGZsZzogYW55ID0gMCkge1xuICAgIGxldCB0ZW1wX3pvb20gPSBmbGcgPT0gMCA/IFpvb20uZGVmYXVsdCA6ICh0aGlzLmdldFpvb20oKSArIFpvb20udmFsdWUgKiBmbGcpO1xuICAgIGlmIChab29tLm1heCA+PSB0ZW1wX3pvb20gJiYgdGVtcF96b29tID49IFpvb20ubWluKSB7XG4gICAgICB0aGlzLnNldFgoKHRoaXMuZ2V0WCgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGVtcF96b29tKTtcbiAgICAgIHRoaXMuc2V0WSgodGhpcy5nZXRZKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0ZW1wX3pvb20pO1xuICAgICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0ZW1wX3pvb207XG4gICAgICB0aGlzLnNldFpvb20odGhpcy56b29tX2xhc3RfdmFsdWUpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9pbigpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgxKTtcbiAgfVxuICBwdWJsaWMgem9vbV9vdXQoKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goLTEpO1xuICB9XG4gIHB1YmxpYyB6b29tX3Jlc2V0KCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKDApO1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgRXZlbnRFbnVtLCBJTWFpbiwgU2NvcGVSb290IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIFZhcmlhYmxlVmlldyB7XG4gIHByaXZhdGUgdmFyaWFibGVzOiBEYXRhRmxvd1tdIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXZhcmlhYmxlJyk7XG4gICAgdGhpcy5tYWluLm9uU2FmZShFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsICh7IGRhdGEgfTogYW55KSA9PiB7XG4gICAgICB0aGlzLlJlbmRlcigpO1xuICAgIH0pO1xuICAgIHRoaXMubWFpbi5vblNhZmUoRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCAoKSA9PiB7XG4gICAgICB0aGlzLlJlbmRlcigpO1xuICAgIH0pO1xuICAgIHRoaXMubWFpbi5vblNhZmUoRXZlbnRFbnVtLmdyb3VwQ2hhbmdlLCAoKSA9PiB7XG4gICAgICB0aGlzLlJlbmRlcigpO1xuICAgIH0pXG4gICAgdGhpcy5SZW5kZXIoKTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyKCkge1xuICAgIHRoaXMudmFyaWFibGVzID0gdGhpcy5tYWluLmdldFZhcmlhYmxlKCk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgPHRhYmxlIGJvcmRlcj1cIjFcIj5cbiAgICAgICAgPHRoZWFkPlxuICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgIDx0ZCBjbGFzcz1cInZhcmlhYmxlLW5hbWVcIj5OYW1lPC90ZD5cbiAgICAgICAgICAgIDx0ZCBjbGFzcz1cInZhcmlhYmxlLXR5cGVcIj5UeXBlPC90ZD5cbiAgICAgICAgICAgIDx0ZCBjbGFzcz1cInZhcmlhYmxlLXNjb3BlXCI+U2NvcGU8L3RkPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtZGVmYXVsdFwiPkRlZmF1bHQ8L3RkPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtYnV0dG9uXCI+PC90ZD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICA8L3RoZWFkPlxuICAgICAgICA8dGJvZHk+XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuICAgIGA7XG4gICAgaWYgKHRoaXMudmFyaWFibGVzKSB7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIHRoaXMudmFyaWFibGVzKSB7XG4gICAgICAgIG5ldyBWYXJpYWJsZUl0ZW0oaXRlbSwgdGhpcykuUmVuZGVyU2NvcGUodGhpcy5tYWluLmdldEdyb3VwQ3VycmVudCgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmNsYXNzIFZhcmlhYmxlSXRlbSB7XG4gIHByaXZhdGUgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG4gIHByaXZhdGUgbmFtZUlucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHByaXZhdGUgdHlwZUlucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuICBwcml2YXRlIHNjb3BlSW5wdXQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gIHByaXZhdGUgdmFsdWVEZWZhdWx0SW5wdXQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgdmFyaWFibGU6IERhdGFGbG93LCBwcml2YXRlIHBhcmVudDogVmFyaWFibGVWaWV3KSB7XG4gICAgKHRoaXMubmFtZUlucHV0IGFzIGFueSkudmFsdWUgPSB0aGlzLnZhcmlhYmxlLkdldCgnbmFtZScpO1xuICAgICh0aGlzLnZhbHVlRGVmYXVsdElucHV0IGFzIGFueSkudmFsdWUgPSB0aGlzLnZhcmlhYmxlLkdldCgnaW5pdGFsVmFsdWUnKSA/PyAnJztcbiAgICAodGhpcy50eXBlSW5wdXQgYXMgYW55KS52YWx1ZSA9IHRoaXMudmFyaWFibGUuR2V0KCd0eXBlJykgPz8gJyc7XG4gICAgZm9yIChsZXQgaXRlbSBvZiBbJ3RleHQnLCAnbnVtYmVyJywgJ2RhdGUnLCAnb2JqZWN0J10pIHtcbiAgICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgIG9wdGlvbi50ZXh0ID0gaXRlbTtcbiAgICAgIG9wdGlvbi52YWx1ZSA9IGl0ZW07XG4gICAgICB0aGlzLnR5cGVJbnB1dC5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgIH1cbiAgICBsZXQgbmFtZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgbmFtZUNvbHVtbi5hcHBlbmRDaGlsZCh0aGlzLm5hbWVJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQobmFtZUNvbHVtbik7XG4gICAgdGhpcy5uYW1lSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmFyaWFibGUuU2V0KCduYW1lJywgZS50YXJnZXQudmFsdWUpO1xuICAgIH0pO1xuICAgIHRoaXMubmFtZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmFyaWFibGUuU2V0KCduYW1lJywgZS50YXJnZXQudmFsdWUpO1xuICAgIH0pO1xuXG4gICAgbGV0IHR5cGVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIHR5cGVDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy50eXBlSW5wdXQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHR5cGVDb2x1bW4pO1xuICAgIHRoaXMudHlwZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmFyaWFibGUuU2V0KCd0eXBlJywgZS50YXJnZXQudmFsdWUpO1xuICAgIH0pO1xuICAgIGxldCBzY29wZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgc2NvcGVDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy5zY29wZUlucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChzY29wZUNvbHVtbik7XG5cblxuICAgIGxldCB2YWx1ZURlZmF1bHRDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIHZhbHVlRGVmYXVsdENvbHVtbi5hcHBlbmRDaGlsZCh0aGlzLnZhbHVlRGVmYXVsdElucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh2YWx1ZURlZmF1bHRDb2x1bW4pO1xuICAgIHRoaXMudmFsdWVEZWZhdWx0SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IGFueSkgPT4ge1xuICAgICAgdGhpcy52YXJpYWJsZS5TZXQoJ2luaXRhbFZhbHVlJywgZS50YXJnZXQudmFsdWUpO1xuICAgIH0pO1xuICAgIHRoaXMudmFsdWVEZWZhdWx0SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmFyaWFibGUuU2V0KCdpbml0YWxWYWx1ZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcblxuICAgIGxldCBidXR0b25SZW1vdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBidXR0b25SZW1vdmUuaW5uZXJIVE1MID0gYC1gO1xuICAgIGJ1dHRvblJlbW92ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIHBhcmVudC5tYWluLnJlbW92ZVZhcmlhYmxlKHZhcmlhYmxlKTtcbiAgICB9KTtcbiAgICBsZXQgYnV0dG9uUmVtb3ZlQ29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICBidXR0b25SZW1vdmVDb2x1bW4uYXBwZW5kQ2hpbGQoYnV0dG9uUmVtb3ZlKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChidXR0b25SZW1vdmVDb2x1bW4pO1xuXG4gICAgcGFyZW50LmVsTm9kZS5xdWVyeVNlbGVjdG9yKCd0YWJsZSB0Ym9keScpPy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG5cbiAgfVxuICBSZW5kZXJTY29wZShncm91cDogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuc2NvcGVJbnB1dC5pbm5lckhUTUwgPSAnJztcbiAgICBpZiAoZ3JvdXApIHtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgZ3JvdXApIHtcbiAgICAgICAgbGV0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgICBvcHRpb24udGV4dCA9IGl0ZW0udGV4dDtcbiAgICAgICAgb3B0aW9uLnZhbHVlID0gaXRlbS5pZDtcbiAgICAgICAgdGhpcy5zY29wZUlucHV0LnByZXBlbmQob3B0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgKHRoaXMuc2NvcGVJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5HZXQoJ3Njb3BlJyk7XG4gICAgdGhpcy5zY29wZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmFyaWFibGUuU2V0KCdzY29wZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuXG5leHBvcnQgY2xhc3MgVG9vbGJveFZpZXcge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXRvb2xib3gnKTtcbiAgICB0aGlzLlJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXIoKSB7XG4gICAgbGV0IGNvbnRyb2xzID0gdGhpcy5tYWluLmdldENvbnRyb2xBbGwoKTtcbiAgICBsZXQgZ3JvdXA6IGFueSA9IHt9O1xuXG4gICAgT2JqZWN0LmtleXMoY29udHJvbHMpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgbGV0IGdyb3VwTmFtZSA9IGNvbnRyb2xzW2l0ZW1dLmdyb3VwID8/IFwib3RoZXJcIjtcbiAgICAgIGlmIChncm91cFtncm91cE5hbWVdID09PSB1bmRlZmluZWQpIGdyb3VwW2dyb3VwTmFtZV0gPSBbXTtcbiAgICAgIGdyb3VwW2dyb3VwTmFtZV0gPSBbXG4gICAgICAgIC4uLmdyb3VwW2dyb3VwTmFtZV0sXG4gICAgICAgIGNvbnRyb2xzW2l0ZW1dXG4gICAgICBdO1xuICAgIH0pO1xuICAgIE9iamVjdC5rZXlzKGdyb3VwKS5mb3JFYWNoKChpdGVtOiBhbnksIGluZGV4KSA9PiB7XG4gICAgICBsZXQgaXRlbUJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgaXRlbUJveC5jbGFzc0xpc3QuYWRkKCdub2RlLWJveCcpO1xuICAgICAgaXRlbUJveC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIGl0ZW1Cb3guaW5uZXJIVE1MID0gYFxuICAgICAgICA8cCBjbGFzcz1cIm5vZGUtYm94X3RpdGxlXCI+JHtpdGVtfTwvcD5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtYm94X2JvYnlcIj48L2Rpdj5cbiAgICAgIGA7XG4gICAgICBpdGVtQm94LnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWJveF90aXRsZScpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgaWYgKGl0ZW1Cb3guY2xhc3NMaXN0LmNvbnRhaW5zKCdhY3RpdmUnKSkge1xuICAgICAgICAgIGl0ZW1Cb3guY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtQm94LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZm9yIChsZXQgX2l0ZW0gb2YgZ3JvdXBbaXRlbV0pIHtcbiAgICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ25vZGUtaXRlbScpO1xuICAgICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgX2l0ZW0ua2V5KTtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7X2l0ZW0uaWNvbn0gPHNwYW4+JHtfaXRlbS5uYW1lfTwvc3BhbmA7XG4gICAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuZHJhZ1N0YXJ0LmJpbmQodGhpcykpXG4gICAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgaXRlbUJveC5xdWVyeVNlbGVjdG9yKCcubm9kZS1ib3hfYm9ieScpPy5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgICB9XG4gICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChpdGVtQm94KTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlIGRyYWdlbmQoZTogYW55KSB7XG4gICAgdGhpcy5tYWluLnNldENvbnRyb2xDaG9vc2UobnVsbCk7XG4gIH1cblxuICBwcml2YXRlIGRyYWdTdGFydChlOiBhbnkpIHtcbiAgICBsZXQga2V5ID0gZS50YXJnZXQuY2xvc2VzdChcIi5ub2RlLWl0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShrZXkpO1xuICAgIGlmIChlLnR5cGUgIT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKFwibm9kZVwiLCBrZXkpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgRXZlbnRFbnVtLCBJTWFpbiwgRGF0YUZsb3cgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuXG5leHBvcnQgY2xhc3MgUHJvamVjdFZpZXcge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb2plY3QnKTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCB0aGlzLlJlbmRlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB0aGlzLlJlbmRlci5iaW5kKHRoaXMpKTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyKCkge1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBgO1xuICAgIGxldCBwcm9qZWN0cyA9IHRoaXMubWFpbi5nZXRQcm9qZWN0QWxsKCk7XG4gICAgcHJvamVjdHMuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3cpID0+IHtcbiAgICAgIGxldCBub2RlSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XG4gICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdC1pZCcsIGl0ZW0uR2V0KCdpZCcpKTtcbiAgICAgIGl0ZW0ub25TYWZlKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV9uYW1lYCwgKCkgPT4ge1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLm1haW4uY2hlY2tQcm9qZWN0T3BlbihpdGVtKSkge1xuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1haW4uc2V0UHJvamVjdE9wZW4oaXRlbSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlPy5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0lGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBUYWJQcm9qZWN0VmlldyB7XG4gIHByaXZhdGUgJGVsQm9ieTogRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHByaXZhdGUgJGVsV2FycDogRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHByaXZhdGUgJGJ0bk5leHQ6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwcml2YXRlICRidG5CYWNrOiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHJpdmF0ZSAkYnRuQWRkOiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy10YWItcHJvamVjdCcpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMuUmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIFJlbmRlcigpIHtcbiAgICBsZXQgc2Nyb2xsTGVmdENhY2hlID0gdGhpcy4kZWxXYXJwPy5zY3JvbGxMZWZ0ID8/IDA7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9fc2VhcmNoXCI+PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInRhYi1wcm9qZWN0X19saXN0XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3RfYnV0dG9uXCI+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4tYmFja1wiPjxpIGNsYXNzPVwiZmFzIGZhLWFuZ2xlLWxlZnRcIj48L2k+PC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF93YXJwXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9fYm9keVwiPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRhYi1wcm9qZWN0X2J1dHRvblwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuLW5leHRcIj48aSBjbGFzcz1cImZhcyBmYS1hbmdsZS1yaWdodFwiPjwvaT48L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRhYi1wcm9qZWN0X2J1dHRvblwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuLWFkZFwiPjxpIGNsYXNzPVwiZmFzIGZhLXBsdXNcIj48L2k+PC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICBgO1xuICAgIHRoaXMuJGVsV2FycCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy50YWItcHJvamVjdF93YXJwJyk7XG4gICAgdGhpcy4kZWxCb2J5ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnRhYi1wcm9qZWN0X19ib2R5Jyk7XG4gICAgdGhpcy4kYnRuQmFjayA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG4tYmFjaycpO1xuICAgIHRoaXMuJGJ0bk5leHQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuLW5leHQnKTtcbiAgICB0aGlzLiRidG5BZGQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuLWFkZCcpO1xuICAgIGNvbnN0IGZuVXBkYXRlU2Nyb2xsID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuJGVsV2FycCkge1xuICAgICAgICAvLyBsZXQgc2Nyb2xsTGVmdCA9IHRoaXMuJGVsV2FycC5zY3JvbGxMZWZ0O1xuICAgICAgICAvLyB2YXIgbWF4U2Nyb2xsTGVmdCA9IHRoaXMuJGVsV2FycC5zY3JvbGxXaWR0aCAtIHRoaXMuJGVsV2FycC5jbGllbnRXaWR0aDtcbiAgICAgICAgLy8gY29uc29sZS5sb2coc2Nyb2xsTGVmdCk7XG4gICAgICAgIC8vIGlmICh0aGlzLiRidG5CYWNrICYmIHNjcm9sbExlZnQgPD0gMCkge1xuICAgICAgICAvLyAgIHRoaXMuJGJ0bkJhY2suc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YClcbiAgICAgICAgLy8gfSBlbHNlIGlmICh0aGlzLiRidG5CYWNrICYmIHNjcm9sbExlZnQgPiAwKSB7XG4gICAgICAgIC8vICAgdGhpcy4kYnRuQmFjay5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gaWYgKHRoaXMuJGJ0bk5leHQgJiYgc2Nyb2xsTGVmdCA+PSBtYXhTY3JvbGxMZWZ0KSB7XG4gICAgICAgIC8vICAgdGhpcy4kYnRuTmV4dC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYGRpc3BsYXk6bm9uZTtgKVxuICAgICAgICAvLyB9IGVsc2UgaWYgKHRoaXMuJGJ0bk5leHQgJiYgc2Nyb2xsTGVmdCA8PSAwKSB7XG4gICAgICAgIC8vICAgdGhpcy4kYnRuTmV4dC5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XG4gICAgICAgIC8vIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy4kZWxXYXJwPy5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIGV2ZW50ID0+IHtcbiAgICAgIGZuVXBkYXRlU2Nyb2xsKCk7XG4gICAgfSwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuICAgIGZuVXBkYXRlU2Nyb2xsKCk7XG4gICAgdGhpcy4kYnRuQmFjaz8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy4kZWxXYXJwKSB7XG4gICAgICAgIHRoaXMuJGVsV2FycC5zY3JvbGxMZWZ0IC09IDEwMDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiRidG5OZXh0Py5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLiRlbFdhcnApIHtcbiAgICAgICAgdGhpcy4kZWxXYXJwLnNjcm9sbExlZnQgKz0gMTAwO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJGJ0bkFkZD8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICB0aGlzLm1haW4ubmV3UHJvamVjdChcIlwiKTtcbiAgICB9KTtcbiAgICBsZXQgcHJvamVjdHMgPSB0aGlzLm1haW4uZ2V0UHJvamVjdEFsbCgpO1xuICAgIGxldCBpdGVtQWN0aXZlOiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgcHJvamVjdCBvZiBwcm9qZWN0cykge1xuICAgICAgbGV0IHByb2plY3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBsZXQgcHJvamVjdE5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBsZXQgcHJvamVjdEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbGV0IHByb2plY3RCdXR0b25SZW1vdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIHByb2plY3RJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0LWlkJywgcHJvamVjdC5HZXQoJ2lkJykpO1xuICAgICAgcHJvamVjdE5hbWUuaW5uZXJIVE1MID0gcHJvamVjdC5HZXQoJ25hbWUnKTtcbiAgICAgIHByb2plY3ROYW1lLmNsYXNzTGlzdC5hZGQoJ3Byby1uYW1lJyk7XG4gICAgICBwcm9qZWN0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3Byby1idXR0b24nKTtcbiAgICAgIHByb2plY3RCdXR0b25SZW1vdmUuaW5uZXJIVE1MID0gYDxpIGNsYXNzPVwiZmFzIGZhLW1pbnVzXCI+PC9pPmA7XG4gICAgICBwcm9qZWN0QnV0dG9uLmFwcGVuZENoaWxkKHByb2plY3RCdXR0b25SZW1vdmUpO1xuICAgICAgcHJvamVjdEl0ZW0uYXBwZW5kQ2hpbGQocHJvamVjdE5hbWUpO1xuICAgICAgcHJvamVjdEl0ZW0uYXBwZW5kQ2hpbGQocHJvamVjdEJ1dHRvbik7XG5cbiAgICAgIHByb2plY3RJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb2plY3QtaXRlbScpO1xuICAgICAgaWYgKHRoaXMubWFpbi5jaGVja1Byb2plY3RPcGVuKHByb2plY3QpKSB7XG4gICAgICAgIHByb2plY3RJdGVtLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICBpdGVtQWN0aXZlID0gcHJvamVjdEl0ZW07XG4gICAgICB9XG4gICAgICBwcm9qZWN0SXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIGlmICghcHJvamVjdEJ1dHRvblJlbW92ZS5jb250YWlucyhlLnRhcmdldCBhcyBOb2RlKSAmJiBlLnRhcmdldCAhPSBwcm9qZWN0QnV0dG9uUmVtb3ZlKSB7XG4gICAgICAgICAgdGhpcy5tYWluLnNldFByb2plY3RPcGVuKHByb2plY3QpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHByb2plY3RCdXR0b25SZW1vdmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLm1haW4ucmVtb3ZlUHJvamVjdChwcm9qZWN0KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy4kZWxCb2J5Py5hcHBlbmRDaGlsZChwcm9qZWN0SXRlbSk7XG4gICAgICBwcm9qZWN0Lm9uU2FmZShFdmVudEVudW0uZGF0YUNoYW5nZSArICdfbmFtZScsICgpID0+IHtcbiAgICAgICAgcHJvamVjdE5hbWUuaW5uZXJIVE1MID0gcHJvamVjdC5HZXQoJ25hbWUnKTtcbiAgICAgIH0pXG4gICAgfVxuICAgIGlmICh0aGlzLiRlbFdhcnApIHtcbiAgICAgIGlmIChpdGVtQWN0aXZlICE9IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLiRlbFdhcnAuc2Nyb2xsTGVmdCA9IGl0ZW1BY3RpdmUub2Zmc2V0TGVmdCAtIDIwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kZWxXYXJwLnNjcm9sbExlZnQgPSBzY3JvbGxMZWZ0Q2FjaGU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5cbmV4cG9ydCBjbGFzcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHByb3RlY3RlZCBlbENvbnRlbnQ6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnRG9ja0Jhc2UnO1xuICB9XG5cbiAgcHVibGljIEJveEluZm8odGl0bGU6IHN0cmluZywgJGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd2cy1ib3hpbmZvJyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtYm94aW5mbycpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwidnMtYm94aW5mb19oZWFkZXJcIj48c3BhbiBjbGFzcz1cInZzLWJveGluZm9fdGl0bGVcIj4ke3RpdGxlfTwvc3Bhbj48c3BhbiBjbGFzcz1cInZzLWJveGluZm9fYnV0dG9uXCI+PC9zcGFuPjwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJ2cy1ib3hpbmZvX3dhcnBcIj48ZGl2IGNsYXNzPVwidnMtYm94aW5mb19jb250ZW50XCI+PC9kaXY+PC9kaXY+YDtcbiAgICB0aGlzLmVsQ29udGVudCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2NvbnRlbnQnKTtcbiAgICBpZiAoJGNhbGxiYWNrKSB7XG4gICAgICAkY2FsbGJhY2sodGhpcy5lbENvbnRlbnQpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgVG9vbGJveFZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1jb250cm9sJyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdDb250cm9sJywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBuZXcgVG9vbGJveFZpZXcobm9kZSwgdGhpcy5tYWluKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4sIGdldFRpbWUgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgVmFyaWFibGVWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXJpYWJsZURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXZhcmlhYmxlJyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdWYXJpYWJsZScsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbmV3IFZhcmlhYmxlVmlldyhub2RlLCBtYWluKTtcbiAgICB9KTtcbiAgICBsZXQgJG5vZGVSaWdodDogSFRNTEVsZW1lbnQgfCBudWxsID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnZzLWJveGluZm9faGVhZGVyIC52cy1ib3hpbmZvX2J1dHRvbicpO1xuICAgIGlmICgkbm9kZVJpZ2h0KSB7XG4gICAgICAkbm9kZVJpZ2h0LmlubmVySFRNTCA9IGBgO1xuICAgICAgbGV0IGJ1dHRvbk5ldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uTmV3KTtcbiAgICAgIGJ1dHRvbk5ldy5pbm5lckhUTUwgPSBgTmV3IFZhcmlhYmxlYDtcbiAgICAgIGJ1dHRvbk5ldy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgdGhpcy5tYWluLm5ld1ZhcmlhYmxlKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFWaWV3LCBEYXRhRmxvdywgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XHJcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XHJcbiAgcHJpdmF0ZSBsYXN0RGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XHJcbiAgcHJpdmF0ZSBoaWRlS2V5czogc3RyaW5nW10gPSBbJ2xpbmVzJywgJ25vZGVzJywgJ2dyb3VwcycsICd2YXJpYWJsZScsICd4JywgJ3knLCAnem9vbSddO1xyXG4gIHByaXZhdGUgc29ydEtleXM6IHN0cmluZ1tdID0gWydpZCcsICdrZXknLCAnbmFtZScsICdncm91cCddO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcclxuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XHJcblxyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvcGVydHknKTtcclxuICAgIHRoaXMuQm94SW5mbygnUHJvcGVydHknLCAobm9kZTogSFRNTEVsZW1lbnQpID0+IHtcclxuICAgICAgbWFpbi5vbihFdmVudEVudW0uc2hvd1Byb3BlcnR5LCAoZGV0YWlsOiBhbnkpID0+IHtcclxuICAgICAgICB0aGlzLnJlbmRlclVJKG5vZGUsIGRldGFpbC5kYXRhKTtcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJVSShub2RlOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YUZsb3cpIHtcclxuICAgIGlmICh0aGlzLmxhc3REYXRhID09IGRhdGEpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XHJcbiAgICBub2RlLmlubmVySFRNTCA9ICcnO1xyXG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IGRhdGEuZ2V0UHJvcGVydGllcygpO1xyXG4gICAgdGhpcy5zb3J0S2V5cy5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAodGhpcy5oaWRlS2V5cy5pbmNsdWRlcyhrZXkpIHx8ICFwcm9wZXJ0aWVzW2tleV0pIHJldHVybjtcclxuICAgICAgbGV0IHByb3BlcnR5SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xyXG4gICAgICBsZXQgcHJvcGVydHlMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWxhYmVsJyk7XHJcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0ga2V5O1xyXG4gICAgICBsZXQgcHJvcGVydHlWYWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eVZhbHVlLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LXZhbHVlJyk7XHJcbiAgICAgIERhdGFWaWV3LkJpbmRFbGVtZW50KHByb3BlcnR5VmFsdWUsIGRhdGEsIHRoaXMubWFpbiwga2V5KTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlWYWx1ZSk7XHJcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJdGVtKTtcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKHRoaXMuaGlkZUtleXMuaW5jbHVkZXMoa2V5KSB8fCB0aGlzLnNvcnRLZXlzLmluY2x1ZGVzKGtleSkpIHJldHVybjtcclxuICAgICAgbGV0IHByb3BlcnR5SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xyXG4gICAgICBsZXQgcHJvcGVydHlMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWxhYmVsJyk7XHJcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0ga2V5O1xyXG4gICAgICBsZXQgcHJvcGVydHlWYWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eVZhbHVlLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LXZhbHVlJyk7XHJcbiAgICAgIERhdGFWaWV3LkJpbmRFbGVtZW50KHByb3BlcnR5VmFsdWUsIGRhdGEsIHRoaXMubWFpbiwga2V5KTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlWYWx1ZSk7XHJcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJdGVtKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBFdmVudEVudW0sIElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVmlld0RvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHByaXZhdGUgdmlldzogRGVzZ2luZXJWaWV3IHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcblxuICAgIHRoaXMudmlldyA9IG5ldyBEZXNnaW5lclZpZXcodGhpcy5lbE5vZGUsIG1haW4pO1xuXG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluLCB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBUYWJQcm9qZWN0VmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVGFiRG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgbmV3IFRhYlByb2plY3RWaWV3KHRoaXMuZWxOb2RlLCBtYWluKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4sIERvY2tFbnVtIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IENvbnRyb2xEb2NrIH0gZnJvbSBcIi4vQ29udHJvbERvY2tcIjtcbmltcG9ydCB7IFZhcmlhYmxlRG9jayB9IGZyb20gXCIuL1ZhcmlhYmxlRG9ja1wiO1xuaW1wb3J0IHsgUHJvamVjdERvY2sgfSBmcm9tIFwiLi9Qcm9qZWN0RG9ja1wiO1xuaW1wb3J0IHsgUHJvcGVydHlEb2NrIH0gZnJvbSBcIi4vUHJvcGVydHlEb2NrXCI7XG5pbXBvcnQgeyBWaWV3RG9jayB9IGZyb20gXCIuL1ZpZXdEb2NrXCI7XG5pbXBvcnQgeyBUYWJEb2NrIH0gZnJvbSBcIi4vVGFiRG9ja1wiO1xuXG5leHBvcnQgY2xhc3MgRG9ja01hbmFnZXIge1xuICBwcml2YXRlICRkb2NrTWFuYWdlcjogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikgeyB9XG4gIHB1YmxpYyByZXNldCgpIHtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IHt9O1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5sZWZ0LCBDb250cm9sRG9jayk7XG4gICAgLy90aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgUHJvamVjdERvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5yaWdodCwgUHJvcGVydHlEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0udmlldywgVmlld0RvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS50b3AsIFRhYkRvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5ib3R0b20sIFZhcmlhYmxlRG9jayk7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBhZGREb2NrKCRrZXk6IHN0cmluZywgJHZpZXc6IGFueSkge1xuICAgIGlmICghdGhpcy4kZG9ja01hbmFnZXJbJGtleV0pXG4gICAgICB0aGlzLiRkb2NrTWFuYWdlclska2V5XSA9IFtdO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gWy4uLnRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldLCAkdmlld107XG4gIH1cblxuICBwdWJsaWMgUmVuZGVyVUkoKSB7XG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInZzLWxlZnQgdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZzLWNvbnRlbnRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXRvcCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy12aWV3IHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLWJvdHRvbSB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1yaWdodCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgYDtcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRkb2NrTWFuYWdlcikuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBxdWVyeVNlbGVjdG9yID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLiR7a2V5fWApO1xuICAgICAgaWYgKHF1ZXJ5U2VsZWN0b3IpIHtcbiAgICAgICAgdGhpcy4kZG9ja01hbmFnZXJba2V5XS5mb3JFYWNoKCgkaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgbmV3ICRpdGVtKHF1ZXJ5U2VsZWN0b3IsIHRoaXMubWFpbik7XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsImV4cG9ydCBjb25zdCBDb250cm9sID0ge1xuICBub2RlX2JlZ2luOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXBsYXlcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdCZWdpbicsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGNsYXNzOiAnJyxcbiAgICBodG1sOiAnJyxcbiAgICBkb3Q6IHtcbiAgICAgIHRvcDogMCxcbiAgICAgIHJpZ2h0OiAxLFxuICAgICAgbGVmdDogMCxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIG9ubHlOb2RlOiB0cnVlXG4gIH0sXG4gIG5vZGVfZW5kOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3BcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdFbmQnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnJyxcbiAgICBkb3Q6IHtcbiAgICAgIGxlZnQ6IDEsXG4gICAgICB0b3A6IDAsXG4gICAgICByaWdodDogMCxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIG9ubHlOb2RlOiB0cnVlXG4gIH0sXG4gIG5vZGVfaWY6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtZXF1YWxzXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnSWYnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiBgPGRpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3BhbiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIj5UaGVuPC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDFcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiPkVsc2U8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMlwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgIGAsXG4gICAgc2NyaXB0OiBgYCxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBjb25kaXRpb246IHtcbiAgICAgICAga2V5OiBcImNvbmRpdGlvblwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfVxuICAgIH0sXG4gICAgZG90OiB7XG4gICAgICBsZWZ0OiAxLFxuICAgICAgdG9wOiAwLFxuICAgICAgcmlnaHQ6IDAsXG4gICAgICBib3R0b206IDAsXG4gICAgfSxcbiAgfSxcbiAgbm9kZV9ncm91cDoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdHcm91cCcsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48YnV0dG9uIGNsYXNzPVwiYnRuR29Hcm91cCBub2RlLWZvcm0tY29udHJvbFwiPkdvPC9idXR0b24+PC9kaXY+JyxcbiAgICBzY3JpcHQ6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsgbm9kZS5vcGVuR3JvdXAoKSB9KTtcbiAgICB9LFxuICAgIHByb3BlcnRpZXM6IHt9LFxuICAgIG91dHB1dDogMlxuICB9LFxuICBub2RlX29wdGlvbjoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdPcHRpb24nLFxuICAgIGRvdDoge1xuICAgICAgdG9wOiAxLFxuICAgICAgcmlnaHQ6IDAsXG4gICAgICBsZWZ0OiAxLFxuICAgICAgYm90dG9tOiAwLFxuICAgIH0sXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6IGBcbiAgICA8ZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAxXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMlwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDNcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDA0XCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwNVwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgPC9kaXY+XG4gICAgYCxcbiAgICBzY3JpcHQ6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsgbm9kZS5vcGVuR3JvdXAoKSB9KTtcbiAgICB9LFxuICAgIHByb3BlcnRpZXM6IHt9LFxuICAgIG91dHB1dDogMlxuICB9LFxuICBub2RlX3Byb2plY3Q6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnUHJvamVjdCcsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48c2VsZWN0IGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwicHJvamVjdFwiPjwvc2VsZWN0PjwvZGl2PicsXG4gICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG5cbiAgICB9LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHByb2plY3Q6IHtcbiAgICAgICAga2V5OiBcInByb2plY3RcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc2VsZWN0OiB0cnVlLFxuICAgICAgICBkYXRhU2VsZWN0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG1haW4uZ2V0UHJvamVjdEFsbCgpLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5HZXQoJ2lkJyksXG4gICAgICAgICAgICAgIHRleHQ6IGl0ZW0uR2V0KCduYW1lJylcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG5cbiAgICAgICAgfSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH1cbiAgICB9LFxuICB9LFxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIElNYWluLCBjb21wYXJlU29ydCwgRXZlbnRFbnVtLCBQcm9wZXJ0eUVudW0sIEV2ZW50RmxvdywgZ2V0VGltZSwgU2NvcGVSb290IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IE5vZGVJdGVtIH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBDb250cm9sIH0gZnJvbSBcIi4vY29udHJvbFwiO1xuXG5leHBvcnQgY2xhc3MgU3lzdGVtQmFzZSBpbXBsZW1lbnRzIElNYWluIHtcbiAgcHJpdmF0ZSAkZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gIHByaXZhdGUgJHByb2plY3RPcGVuOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSAkcHJvcGVydGllczogYW55ID0ge307XG4gIHByaXZhdGUgJGNvbnRyb2w6IGFueSA9IHt9O1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93ID0gbmV3IEV2ZW50RmxvdygpO1xuICBwcml2YXRlICRjb250cm9sQ2hvb3NlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSAkY2hlY2tPcHRpb246IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSAkZ3JvdXA6IGFueTtcbiAgcHJpdmF0ZSAkaW5kZXhQcm9qZWN0OiBudW1iZXIgPSAtMTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5zb2x1dGlvbl0gPSB7XG4gICAgICBpZDoge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgIH0sXG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gUHJvcGVydHlFbnVtLnNvbHV0aW9uXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBgc29sdXRpb24tJHtnZXRUaW1lKCl9YCxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0czoge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0ubGluZV0gPSB7XG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLmxpbmVcbiAgICAgIH0sXG4gICAgICBmcm9tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICBmcm9tSW5kZXg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHRvOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB0b0luZGV4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5tYWluXSA9IHtcbiAgICAgIGlkOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgfSxcbiAgICAgIG5hbWU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gYEZsb3cgJHt0aGlzLiRpbmRleFByb2plY3QrK31gLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubWFpblxuICAgICAgfSxcbiAgICAgIHZhcmlhYmxlOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgZ3JvdXBzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgbm9kZXM6IHtcbiAgICAgICAgZGVmYXVsdDogW11cbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLmdyb3VwQ2F2YXNdID0ge1xuICAgICAga2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFByb3BlcnR5RW51bS5ncm91cENhdmFzXG4gICAgICB9LFxuICAgICAgZ3JvdXA6IHtcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgICB4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB5OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB6b29tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgfVxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLnZhcmlhYmxlXSA9IHtcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0udmFyaWFibGVcbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGB2YXIke2dldFRpbWUoKX1gXG4gICAgICB9LFxuICAgICAgdHlwZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiAndGV4dCdcbiAgICAgIH0sXG4gICAgICBzY29wZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBTY29wZVJvb3RcbiAgICAgIH0sXG4gICAgICBpbml0YWxWYWx1ZToge1xuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfSxcbiAgICB9XG4gICAgdGhpcy5vblNhZmUoRXZlbnRFbnVtLmdyb3VwQ2hhbmdlLCAoeyBncm91cCB9OiBhbnkpID0+IHtcbiAgICAgIHRoaXMuJGdyb3VwID0gZ3JvdXA7XG4gICAgfSlcbiAgfVxuICBuZXdTb2x1dGlvbigkbmFtZTogc3RyaW5nID0gJycpOiB2b2lkIHtcbiAgICB0aGlzLiRpbmRleFByb2plY3QgPSAxO1xuICAgIHRoaXMub3BlblNvbHV0aW9uKHsgbmFtZTogJG5hbWUgfSk7XG4gIH1cbiAgb3BlblNvbHV0aW9uKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLiRkYXRhLkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLnNvbHV0aW9uKSk7XG4gICAgdGhpcy5vcGVuUHJvamVjdCh0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKT8uWzBdID8/IHt9KTtcbiAgfVxuICByZW1vdmVWYXJpYWJsZSh2YXJpYmFsZTogRGF0YUZsb3cpOiB2b2lkIHtcbiAgICB0aGlzLiRwcm9qZWN0T3Blbj8uUmVtb3ZlKCd2YXJpYWJsZScsIHZhcmliYWxlKTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2VWYXJpYWJsZSwgeyBkYXRhOiB2YXJpYmFsZSB9KTtcbiAgfVxuICBhZGRWYXJpYWJsZSgpOiBEYXRhRmxvdyB7XG4gICAgbGV0IHZhcmliYWxlID0gbmV3IERhdGFGbG93KHRoaXMsIHsga2V5OiBQcm9wZXJ0eUVudW0udmFyaWFibGUsIHNjb3BlOiB0aGlzLmdldEdyb3VwQ3VycmVudCgpPy5bMF0/LmlkIH0pO1xuICAgIHRoaXMuJHByb2plY3RPcGVuPy5BcHBlbmQoJ3ZhcmlhYmxlJywgdmFyaWJhbGUpO1xuICAgIHJldHVybiB2YXJpYmFsZTtcbiAgfVxuICBuZXdWYXJpYWJsZSgpOiBEYXRhRmxvdyB7XG4gICAgbGV0IHZhcmliYWxlID0gdGhpcy5hZGRWYXJpYWJsZSgpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCB7IGRhdGE6IHZhcmliYWxlIH0pO1xuICAgIHJldHVybiB2YXJpYmFsZTtcbiAgfVxuICBnZXRWYXJpYWJsZSgpOiBEYXRhRmxvd1tdIHtcbiAgICBsZXQgYXJyOiBhbnkgPSBbXTtcbiAgICBpZiAodGhpcy4kcHJvamVjdE9wZW4pIHtcbiAgICAgIGFyciA9IHRoaXMuJHByb2plY3RPcGVuLkdldChcInZhcmlhYmxlXCIpO1xuICAgICAgaWYgKCFhcnIpIHtcbiAgICAgICAgYXJyID0gW107XG4gICAgICAgIHRoaXMuJHByb2plY3RPcGVuLlNldCgndmFyaWFibGUnLCBhcnIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyLmZpbHRlcigoaXRlbTogYW55KSA9PiB0aGlzLmdldEdyb3VwQ3VycmVudCgpLmZpbmRJbmRleCgoX2dyb3VwOiBhbnkpID0+IF9ncm91cC5pZCA9PSBpdGVtLkdldCgnc2NvcGUnKSkgPiAtMSk7XG4gIH1cbiAgZ2V0R3JvdXBDdXJyZW50KCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuJGdyb3VwID8/IFtdO1xuICB9XG4gIGV4cG9ydEpzb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEudG9Kc29uKCk7XG4gIH1cbiAgcHVibGljIGNoZWNrSW5pdE9wdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kY2hlY2tPcHRpb247XG4gIH1cbiAgaW5pdE9wdGlvbihvcHRpb246IGFueSwgaXNEZWZhdWx0OiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuJGNoZWNrT3B0aW9uID0gdHJ1ZTtcbiAgICAvLyBzZXQgY29udHJvbFxuICAgIHRoaXMuJGNvbnRyb2wgPSBpc0RlZmF1bHQgPyB7IC4uLm9wdGlvbj8uY29udHJvbCB8fCB7fSwgLi4uQ29udHJvbCB9IDogeyAuLi5vcHRpb24/LmNvbnRyb2wgfHwge30gfTtcbiAgICBsZXQgY29udHJvbFRlbXA6IGFueSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMuJGNvbnRyb2wpLm1hcCgoa2V5KSA9PiAoeyAuLi50aGlzLiRjb250cm9sW2tleV0sIGtleSwgc29ydDogKHRoaXMuJGNvbnRyb2xba2V5XS5zb3J0ID09PSB1bmRlZmluZWQgPyA5OTk5OSA6IHRoaXMuJGNvbnRyb2xba2V5XS5zb3J0KSB9KSkuc29ydChjb21wYXJlU29ydCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICBjb250cm9sVGVtcFtpdGVtLmtleV0gPSB7XG4gICAgICAgIC4uLml0ZW0sXG4gICAgICAgIGRvdDoge1xuICAgICAgICAgIGxlZnQ6IDEsXG4gICAgICAgICAgdG9wOiAxLFxuICAgICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICAgIGJvdHRvbTogMSxcbiAgICAgICAgICAuLi5pdGVtPy5kb3RcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHRoaXMuJHByb3BlcnRpZXNbYCR7aXRlbS5rZXl9YF0gPSB7XG4gICAgICAgIC4uLihpdGVtLnByb3BlcnRpZXMgfHwge30pLFxuICAgICAgICBpZDoge1xuICAgICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgICB9LFxuICAgICAgICBrZXk6IHtcbiAgICAgICAgICBkZWZhdWx0OiBpdGVtLmtleVxuICAgICAgICB9LFxuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgZGVmYXVsdDogaXRlbS5rZXksXG4gICAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgeDoge1xuICAgICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgICAgfSxcbiAgICAgICAgeToge1xuICAgICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgICAgfSxcbiAgICAgICAgZ3JvdXA6IHtcbiAgICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgICB9LFxuICAgICAgICBsaW5lczoge1xuICAgICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG4gICAgdGhpcy4kY29udHJvbCA9IGNvbnRyb2xUZW1wO1xuICB9XG4gIHJlbmRlckh0bWwobm9kZTogTm9kZUl0ZW0sIGVsUGFyZW50OiBFbGVtZW50KSB7XG4gICAgZWxQYXJlbnQuaW5uZXJIVE1MID0gbm9kZS5nZXRPcHRpb24oKT8uaHRtbDtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29udHJvbEFsbCgpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbCA/PyB7fTtcbiAgfVxuICBnZXRQcm9qZWN0QWxsKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJykgPz8gW107XG4gIH1cbiAgaW1wb3J0SnNvbihkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Tb2x1dGlvbihkYXRhKTtcbiAgfVxuICBzZXRQcm9qZWN0T3BlbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuJHByb2plY3RPcGVuICE9ICRkYXRhKSB7XG4gICAgICB0aGlzLiRwcm9qZWN0T3BlbiA9ICRkYXRhO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XG4gICAgICAgIGRhdGE6ICRkYXRhXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwge1xuICAgICAgICBkYXRhOiAkZGF0YVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5vcGVuUHJvamVjdCwge1xuICAgICAgICBkYXRhOiAkZGF0YVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGNoZWNrUHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRwcm9qZWN0T3BlbiA9PSAkZGF0YTtcbiAgfVxuICBuZXdQcm9qZWN0KCk6IHZvaWQge1xuICAgIHRoaXMub3BlblByb2plY3Qoe30pO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLm5ld1Byb2plY3QsIHt9KTtcbiAgfVxuICBvcGVuUHJvamVjdCgkZGF0YTogYW55KTogdm9pZCB7XG4gICAgbGV0ICRwcm9qZWN0OiBhbnkgPSBudWxsO1xuICAgIGlmICgkZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAkcHJvamVjdCA9IHRoaXMuZ2V0UHJvamVjdEJ5SWQoJGRhdGEuR2V0KCdpZCcpKTtcbiAgICAgIGlmICghJHByb2plY3QpIHtcbiAgICAgICAgJHByb2plY3QgPSAkZGF0YTtcbiAgICAgICAgdGhpcy4kZGF0YS5BcHBlbmQoJ3Byb2plY3RzJywgJHByb2plY3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAkcHJvamVjdCA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgICAgICRwcm9qZWN0LkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLm1haW4pKTtcbiAgICAgIHRoaXMuJGRhdGEuQXBwZW5kKCdwcm9qZWN0cycsICRwcm9qZWN0KTtcbiAgICB9XG4gICAgdGhpcy5zZXRQcm9qZWN0T3BlbigkcHJvamVjdCk7XG4gIH1cbiAgcHVibGljIHJlbW92ZVByb2plY3QoJGRhdGE6IGFueSkge1xuICAgIGxldCBwcm9qZWN0RGF0YSA9ICRkYXRhO1xuICAgIGlmICgkZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICBwcm9qZWN0RGF0YSA9IHRoaXMuZ2V0UHJvamVjdEJ5SWQoJGRhdGEuR2V0KCdpZCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvamVjdERhdGEgPSB0aGlzLmdldFByb2plY3RCeUlkKCRkYXRhLkdldCgnaWQnKSk7XG4gICAgfVxuICAgIHRoaXMuJGRhdGEuUmVtb3ZlKCdwcm9qZWN0cycsIHByb2plY3REYXRhKTtcbiAgICBpZiAodGhpcy5jaGVja1Byb2plY3RPcGVuKHByb2plY3REYXRhKSkge1xuICAgICAgdGhpcy4kcHJvamVjdE9wZW4gPSB0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKT8uWzBdO1xuICAgICAgaWYgKCF0aGlzLiRwcm9qZWN0T3Blbikge1xuICAgICAgICB0aGlzLm5ld1Byb2plY3QoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgIGRhdGE6IHRoaXMuJHByb2plY3RPcGVuXG4gICAgfSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCB7XG4gICAgICBkYXRhOiB0aGlzLiRwcm9qZWN0T3BlblxuICAgIH0pO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB7XG4gICAgICBkYXRhOiB0aGlzLiRwcm9qZWN0T3BlblxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBnZXRQcm9qZWN0QnlJZCgkaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKS5maWx0ZXIoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLkdldCgnaWQnKSA9PT0gJGlkKT8uWzBdO1xuICB9XG4gIHNldENvbnRyb2xDaG9vc2Uoa2V5OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy4kY29udHJvbENob29zZSA9IGtleTtcbiAgfVxuICBnZXRDb250cm9sQ2hvb3NlKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sQ2hvb3NlO1xuICB9XG4gIGdldENvbnRyb2xCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sW2tleV0gfHwge307XG4gIH1cbiAgZ2V0Q29udHJvbE5vZGVCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLmdldENvbnRyb2xCeUtleShrZXkpLFxuICAgICAgcHJvcGVydGllczogdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KGAke2tleX1gKVxuICAgIH1cbiAgfVxuICBnZXRQcm9wZXJ0eUJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuJHByb3BlcnRpZXNba2V5XTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tICcuL2NvcmUvaW5kZXgnO1xuaW1wb3J0IHsgRG9ja01hbmFnZXIgfSBmcm9tICcuL2RvY2svRG9ja01hbmFnZXInO1xuaW1wb3J0IHsgU3lzdGVtQmFzZSB9IGZyb20gJy4vc3lzdGVtcy9TeXN0ZW1CYXNlJztcbmV4cG9ydCBjbGFzcyBWaXN1YWxGbG93IHtcbiAgcHJpdmF0ZSBtYWluOiBJTWFpbiB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IERvY2tNYW5hZ2VyO1xuICBwdWJsaWMgZ2V0RG9ja01hbmFnZXIoKTogRG9ja01hbmFnZXIge1xuICAgIHJldHVybiB0aGlzLiRkb2NrTWFuYWdlcjtcbiAgfVxuICBwdWJsaWMgc2V0T3B0aW9uKGRhdGE6IGFueSwgaXNEZWZhdWx0OiBib29sZWFuID0gdHJ1ZSkge1xuICAgIHRoaXMubWFpbj8uaW5pdE9wdGlvbihkYXRhLCBpc0RlZmF1bHQpO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyLnJlc2V0KCk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgY29udGFpbmVyOiBIVE1MRWxlbWVudCwgbWFpbjogSU1haW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLm1haW4gPSBtYWluID8/IG5ldyBTeXN0ZW1CYXNlKCk7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgndnMtY29udGFpbmVyJyk7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCgndnMtY29udGFpbmVyJyk7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIgPSBuZXcgRG9ja01hbmFnZXIodGhpcy5jb250YWluZXIsIHRoaXMubWFpbik7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIucmVzZXQoKTtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMubWFpbj8ub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMubWFpbj8ub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5tYWluPy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMubWFpbj8uZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICB9XG4gIHB1YmxpYyBnZXRNYWluKCk6IElNYWluIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5tYWluO1xuICB9XG4gIG5ld1NvbHV0aW9uKCRuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ubmV3U29sdXRpb24oJG5hbWUpO1xuICB9XG4gIG9wZW5Tb2x1dGlvbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm9wZW5Tb2x1dGlvbigkZGF0YSk7XG4gIH1cbiAgbmV3UHJvamVjdCgkbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm5ld1Byb2plY3QoJG5hbWUpO1xuICB9XG4gIG9wZW5Qcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ub3BlblByb2plY3QoJG5hbWUpO1xuICB9XG4gIGdldFByb2plY3RBbGwoKTogYW55W10gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdldE1haW4oKT8uZ2V0UHJvamVjdEFsbCgpO1xuICB9XG4gIHNldFByb2plY3RPcGVuKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8uc2V0UHJvamVjdE9wZW4oJGRhdGEpO1xuICB9XG4gIGltcG9ydEpzb24oZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/LmltcG9ydEpzb24oZGF0YSk7XG4gIH1cbiAgZXhwb3J0SnNvbigpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmdldE1haW4oKT8uZXhwb3J0SnNvbigpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBOb2RlSXRlbSB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgU3lzdGVtQmFzZSB9IGZyb20gXCIuL1N5c3RlbUJhc2VcIjtcbmV4cG9ydCBjbGFzcyBTeXN0ZW1WdWUgZXh0ZW5kcyBTeXN0ZW1CYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVuZGVyOiBhbnkpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHJlbmRlckh0bWwobm9kZTogTm9kZUl0ZW0sIGVsUGFyZW50OiBFbGVtZW50KSB7XG4gICAgaWYgKHBhcnNlSW50KHRoaXMucmVuZGVyLnZlcnNpb24pID09PSAzKSB7XG4gICAgICAvL1Z1ZSAzXG4gICAgICBsZXQgd3JhcHBlciA9IHRoaXMucmVuZGVyLmgobm9kZS5nZXRPcHRpb24oKT8uaHRtbCwgeyAuLi4obm9kZS5nZXRPcHRpb24oKT8ucHJvcHMgPz8ge30pLCBub2RlIH0sIChub2RlLmdldE9wdGlvbigpPy5vcHRpb25zID8/IHt9KSk7XG4gICAgICB3cmFwcGVyLmFwcENvbnRleHQgPSBlbFBhcmVudDtcbiAgICAgIHRoaXMucmVuZGVyLnJlbmRlcih3cmFwcGVyLCBlbFBhcmVudCk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVnVlIDJcbiAgICAgIGxldCB3cmFwcGVyID0gbmV3IHRoaXMucmVuZGVyKHtcbiAgICAgICAgcGFyZW50OiBlbFBhcmVudCxcbiAgICAgICAgcmVuZGVyOiAoaDogYW55KSA9PiBoKG5vZGUuZ2V0T3B0aW9uKCk/Lmh0bWwsIHsgcHJvcHM6IHsgLi4uKG5vZGUuZ2V0T3B0aW9uKCk/LnByb3BzID8/IHt9KSwgbm9kZSB9IH0pLFxuICAgICAgICAuLi4obm9kZS5nZXRPcHRpb24oKT8ub3B0aW9ucyA/PyB7fSlcbiAgICAgIH0pLiRtb3VudCgpXG4gICAgICAvL1xuICAgICAgZWxQYXJlbnQuYXBwZW5kQ2hpbGQod3JhcHBlci4kZWwpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIEV2ZW50RW51bSwgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgZG93bmxvYWRPYmplY3RBc0pzb24sIGdldFRpbWUsIHJlYWRGaWxlTG9jYWwgfSBmcm9tIFwiLi4vY29yZS9VdGlsc1wiO1xuaW1wb3J0IHsgUHJvamVjdFZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvUHJvamVjdFZpZXdcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFByb2plY3REb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1wcm9qZWN0Jyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdQcm9qZWN0JywgKGVsQ29udGVudDogYW55KSA9PiB7XG4gICAgICBuZXcgUHJvamVjdFZpZXcoZWxDb250ZW50LCBtYWluKTtcbiAgICB9KTtcbiAgICBsZXQgJG5vZGVSaWdodDogSFRNTEVsZW1lbnQgfCBudWxsID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnZzLWJveGluZm9faGVhZGVyIC52cy1ib3hpbmZvX2J1dHRvbicpO1xuICAgIGlmICgkbm9kZVJpZ2h0KSB7XG4gICAgICAkbm9kZVJpZ2h0LmlubmVySFRNTCA9IGBgO1xuICAgICAgbGV0IGJ1dHRvbk5ldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uTmV3LmlubmVySFRNTCA9IGBOZXdgO1xuICAgICAgYnV0dG9uTmV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5tYWluLm5ld1Byb2plY3QoJycpKTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbk5ldyk7XG5cbiAgICAgIGxldCBidXR0b25FeHBvcnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ1dHRvbkV4cG9ydC5pbm5lckhUTUwgPSBgRXhwb3J0YDtcbiAgICAgIGJ1dHRvbkV4cG9ydC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IGRvd25sb2FkT2JqZWN0QXNKc29uKHRoaXMubWFpbi5leHBvcnRKc29uKCksIGB2cy1zb2x1dGlvbi0ke2dldFRpbWUoKX1gKSk7XG4gICAgICAkbm9kZVJpZ2h0Py5hcHBlbmRDaGlsZChidXR0b25FeHBvcnQpO1xuXG4gICAgICBsZXQgYnV0dG9uSW1wb3J0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidXR0b25JbXBvcnQuaW5uZXJIVE1MID0gYEltcG9ydGA7XG4gICAgICBidXR0b25JbXBvcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHJlYWRGaWxlTG9jYWwoKHJzOiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAocnMpIHtcbiAgICAgICAgICAgIHRoaXMubWFpbi5pbXBvcnRKc29uKEpTT04ucGFyc2UocnMpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICAkbm9kZVJpZ2h0Py5hcHBlbmRDaGlsZChidXR0b25JbXBvcnQpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgVmlzdWFsRmxvdyB9IGZyb20gXCIuL1Zpc3VhbEZsb3dcIjtcbmltcG9ydCAqIGFzIFN5c3RlbUJhc2UgZnJvbSBcIi4vc3lzdGVtcy9pbmRleFwiO1xuaW1wb3J0ICogYXMgQ29yZSBmcm9tICcuL2NvcmUvaW5kZXgnO1xuaW1wb3J0ICogYXMgRGVzZ2luZXIgZnJvbSBcIi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCAqIGFzIERvY2sgZnJvbSAnLi9kb2NrL2luZGV4JztcbmV4cG9ydCBkZWZhdWx0IHtcbiAgVmlzdWFsRmxvdyxcbiAgLi4uU3lzdGVtQmFzZSxcbiAgLi4uQ29yZSxcbiAgLi4uRG9jayxcbiAgLi4uRGVzZ2luZXJcbn07XG5cbiJdLCJuYW1lcyI6WyJTeXN0ZW1CYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQU8sTUFBTSxTQUFTLEdBQUc7QUFDdkIsSUFBQSxJQUFJLEVBQUUsTUFBTTtBQUNaLElBQUEsVUFBVSxFQUFFLFlBQVk7QUFDeEIsSUFBQSxZQUFZLEVBQUUsY0FBYztBQUM1QixJQUFBLFdBQVcsRUFBRSxhQUFhO0FBQzFCLElBQUEsVUFBVSxFQUFFLFlBQVk7QUFDeEIsSUFBQSxjQUFjLEVBQUUsZ0JBQWdCO0FBQ2hDLElBQUEsTUFBTSxFQUFFLFFBQVE7QUFDaEIsSUFBQSxPQUFPLEVBQUUsU0FBUztBQUNsQixJQUFBLFdBQVcsRUFBRSxhQUFhO0NBQzNCLENBQUE7QUFFTSxNQUFNLFFBQVEsR0FBRztBQUN0QixJQUFBLElBQUksRUFBRSxTQUFTO0FBQ2YsSUFBQSxHQUFHLEVBQUUsUUFBUTtBQUNiLElBQUEsSUFBSSxFQUFFLFNBQVM7QUFDZixJQUFBLE1BQU0sRUFBRSxXQUFXO0FBQ25CLElBQUEsS0FBSyxFQUFFLFVBQVU7Q0FDbEIsQ0FBQTtBQUVNLE1BQU0sWUFBWSxHQUFHO0FBQzFCLElBQUEsSUFBSSxFQUFFLGNBQWM7QUFDcEIsSUFBQSxRQUFRLEVBQUUsZUFBZTtBQUN6QixJQUFBLElBQUksRUFBRSxXQUFXO0FBQ2pCLElBQUEsUUFBUSxFQUFFLGVBQWU7QUFDekIsSUFBQSxVQUFVLEVBQUUsaUJBQWlCO0NBQzlCLENBQUM7QUFFSyxNQUFNLFNBQVMsR0FBRyxNQUFNOztNQzFCbEIsU0FBUyxDQUFBO0lBQ1osTUFBTSxHQUFRLEVBQUUsQ0FBQztBQUN6QixJQUFBLFdBQUEsR0FBQTtLQUNDO0lBQ00sTUFBTSxDQUFDLEtBQWEsRUFBRSxRQUFhLEVBQUE7QUFDeEMsUUFBQSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNyQyxRQUFBLElBQUks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
