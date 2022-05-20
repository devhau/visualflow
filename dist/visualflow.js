
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow.js v0.0.5
   * Released under the MIT license.
   */

var visualflow = (function () {
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
            this.elNode.appendChild(this.elToolbar);
            this.elNode.appendChild(this.elCanvas);
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
            Object.keys(group).forEach((item) => {
                let itemBox = document.createElement('div');
                itemBox.classList.add('node-box');
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
            this.elNode.innerHTML = `
    <div class="tab-project__search"></div>
    <div class="tab-project__list">
      <div class="tab-project_button">
        <button class="btn-back"><<</button>
      </div>
      <div class="tab-project_warp">
        <div class="tab-project__body">
        </div>
      </div>
      <div class="tab-project_button">
        <button class="btn-next">>></button>
      </div>
      <div class="tab-project_button">
        <button class="btn-add">+</button>
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
            for (let project of projects) {
                let projectItem = document.createElement('div');
                project.onSafe(EventEnum.dataChange + '_name', () => {
                    projectItem.innerHTML = project.Get('name');
                });
                projectItem.setAttribute('data-project-id', project.Get('id'));
                projectItem.innerHTML = project.Get('name');
                projectItem.classList.add('project-item');
                if (this.main.checkProjectOpen(project)) {
                    projectItem.classList.add('active');
                }
                projectItem.addEventListener('click', () => {
                    this.main.setProjectOpen(project);
                });
                this.$elBoby?.appendChild(projectItem);
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

    return index;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvQ29uc3RhbnQudHMiLCIuLi9zcmMvY29yZS9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29yZS9EYXRhRmxvdy50cyIsIi4uL3NyYy9jb3JlL0Jhc2VGbG93LnRzIiwiLi4vc3JjL2NvcmUvVXRpbHMudHMiLCIuLi9zcmMvY29yZS9EYXRhVmlldy50cyIsIi4uL3NyYy9kZXNnaW5lci9MaW5lLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld19FdmVudC50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXdfVG9vbGJhci50cyIsIi4uL3NyYy9kZXNnaW5lci9Ob2RlSXRlbS50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXcudHMiLCIuLi9zcmMvZGVzZ2luZXIvVmFyaWFibGVWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1Rvb2xib3hWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1Byb2plY3RWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1RhYlByb2plY3RWaWV3LnRzIiwiLi4vc3JjL2RvY2svRG9ja0Jhc2UudHMiLCIuLi9zcmMvZG9jay9Db250cm9sRG9jay50cyIsIi4uL3NyYy9kb2NrL1ZhcmlhYmxlRG9jay50cyIsIi4uL3NyYy9kb2NrL1Byb3BlcnR5RG9jay50cyIsIi4uL3NyYy9kb2NrL1ZpZXdEb2NrLnRzIiwiLi4vc3JjL2RvY2svVGFiRG9jay50cyIsIi4uL3NyYy9kb2NrL0RvY2tNYW5hZ2VyLnRzIiwiLi4vc3JjL3N5c3RlbXMvY29udHJvbC50cyIsIi4uL3NyYy9zeXN0ZW1zL1N5c3RlbUJhc2UudHMiLCIuLi9zcmMvVmlzdWFsRmxvdy50cyIsIi4uL3NyYy9zeXN0ZW1zL1N5c3RlbVZ1ZS50cyIsIi4uL3NyYy9kb2NrL1Byb2plY3REb2NrLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBFdmVudEVudW0gPSB7XG4gIGluaXQ6IFwiaW5pdFwiLFxuICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcbiAgc2hvd1Byb3BlcnR5OiBcInNob3dQcm9wZXJ0eVwiLFxuICBvcGVuUHJvamVjdDogXCJvcGVuUHJvamVjdFwiLFxuICBuZXdQcm9qZWN0OiBcIm5ld1Byb2plY3RcIixcbiAgY2hhbmdlVmFyaWFibGU6IFwiY2hhbmdlVmFyaWFibGVcIixcbiAgY2hhbmdlOiBcImNoYW5nZVwiLFxuICBkaXNwb3NlOiBcImRpc3Bvc2VcIixcbiAgZ3JvdXBDaGFuZ2U6IFwiZ3JvdXBDaGFuZ2VcIixcbn1cblxuZXhwb3J0IGNvbnN0IERvY2tFbnVtID0ge1xuICBsZWZ0OiBcInZzLWxlZnRcIixcbiAgdG9wOiBcInZzLXRvcFwiLFxuICB2aWV3OiBcInZzLXZpZXdcIixcbiAgYm90dG9tOiBcInZzLWJvdHRvbVwiLFxuICByaWdodDogXCJ2cy1yaWdodFwiLFxufVxuXG5leHBvcnQgY29uc3QgUHJvcGVydHlFbnVtID0ge1xuICBtYWluOiBcIm1haW5fcHJvamVjdFwiLFxuICBzb2x1dGlvbjogJ21haW5fc29sdXRpb24nLFxuICBsaW5lOiAnbWFpbl9saW5lJyxcbiAgdmFyaWFibGU6ICdtYWluX3ZhcmlhYmxlJyxcbiAgZ3JvdXBDYXZhczogXCJtYWluX2dyb3VwQ2F2YXNcIixcbn07XG5cbmV4cG9ydCBjb25zdCBTY29wZVJvb3QgPSBcInJvb3RcIjtcbiIsImltcG9ydCB7IElFdmVudCB9IGZyb20gXCIuL0lGbG93XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRGbG93IGltcGxlbWVudHMgSUV2ZW50IHtcclxuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gIH1cclxuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHRoaXMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgLyogRXZlbnRzICovXHJcbiAgcHVibGljIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xyXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcclxuICAgICAgICBsaXN0ZW5lcnM6IFtdXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXHJcblxyXG4gICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZVxyXG5cclxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcclxuICAgIGNvbnN0IGxpc3RlbmVySW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcclxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXHJcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xyXG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBJUHJvcGVydHkgfSBmcm9tIFwiLi9JRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgRGF0YUZsb3cge1xuICBwcml2YXRlIGRhdGE6IGFueSA9IHt9O1xuICBwcml2YXRlIHByb3BlcnRpZXM6IGFueSA9IG51bGw7XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIHB1YmxpYyBnZXRQcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcGVydGllcztcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwcm9wZXJ0eTogSVByb3BlcnR5IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBkYXRhOiBhbnkgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5sb2FkKGRhdGEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgSW5pdERhdGEoZGF0YTogYW55ID0gbnVsbCwgcHJvcGVydGllczogYW55ID0gLTEpIHtcbiAgICBpZiAocHJvcGVydGllcyAhPT0gLTEpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubG9hZChkYXRhKTtcbiAgfVxuICBwcml2YXRlIGV2ZW50RGF0YUNoYW5nZShrZXk6IHN0cmluZywga2V5Q2hpbGQ6IHN0cmluZywgdmFsdWVDaGlsZDogYW55LCBzZW5kZXJDaGlsZDogYW55LCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGluZGV4KSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fV8ke2tleUNoaWxkfWAsIHtcbiAgICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVFdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHB1YmxpYyBPbkV2ZW50RGF0YShpdGVtOiBEYXRhRmxvdywga2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcbiAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfWAsICh7IGtleToga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkIH06IGFueSkgPT4gdGhpcy5ldmVudERhdGFDaGFuZ2Uoa2V5LCBrZXlDaGlsZCwgdmFsdWVDaGlsZCwgc2VuZGVyQ2hpbGQsIGluZGV4KSk7XG4gIH1cbiAgcHJpdmF0ZSBCaW5kRXZlbnQodmFsdWU6IGFueSwga2V5OiBzdHJpbmcpIHtcbiAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHRoaXMuT25FdmVudERhdGEodmFsdWUgYXMgRGF0YUZsb3csIGtleSk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAodmFsdWUgYXMgW10pLmxlbmd0aCA+IDAgJiYgdmFsdWVbMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgKHZhbHVlIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLk9uRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0Rpc3BhdGNoOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICh0aGlzLmRhdGFba2V5XSAhPSB2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZGF0YVtrZXldKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgdGhpcy5SZW1vdmVFdmVudERhdGEoKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93KSwga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFba2V5XSkgJiYgKHRoaXMuZGF0YVtrZXldIGFzIFtdKS5sZW5ndGggPiAwICYmIHRoaXMuZGF0YVtrZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgICAodGhpcy5kYXRhW2tleV0gYXMgRGF0YUZsb3dbXSkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3csIGluZGV4OiBudW1iZXIpID0+IHRoaXMuUmVtb3ZlRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gICAgfVxuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgaWYgKGlzRGlzcGF0Y2gpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgIH0pO1xuICAgIH1cblxuICB9XG4gIHB1YmxpYyBTZXREYXRhKGRhdGE6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IGZhbHNlKSB7XG5cbiAgICBpZiAoaXNDbGVhckRhdGEpIHRoaXMuZGF0YSA9IHt9O1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIGxldCAkZGF0YTogRGF0YUZsb3cgPSBkYXRhIGFzIERhdGFGbG93O1xuICAgICAgaWYgKCF0aGlzLnByb3BlcnR5ICYmICRkYXRhLnByb3BlcnR5KSB0aGlzLnByb3BlcnR5ID0gJGRhdGEucHJvcGVydHk7XG4gICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cygkZGF0YS5nZXRQcm9wZXJ0aWVzKCkpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIHRoaXMuU2V0KGtleSwgZGF0YVtrZXldLCBzZW5kZXIsIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgZGF0YVxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBHZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2tleV07XG4gIH1cbiAgcHVibGljIEFwcGVuZChrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGlmICghdGhpcy5kYXRhW2tleV0pIHRoaXMuZGF0YVtrZXldID0gW107XG4gICAgdGhpcy5kYXRhW2tleV0gPSBbLi4udGhpcy5kYXRhW2tleV0sIHZhbHVlXTtcbiAgICB0aGlzLkJpbmRFdmVudCh2YWx1ZSwga2V5KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgdGhpcy5kYXRhW2tleV0uaW5kZXhPZih2YWx1ZSk7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5kYXRhW2tleV0uaW5kZXhPZih2YWx1ZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuUmVtb3ZlRXZlbnREYXRhKHRoaXMuZGF0YVtrZXldW2luZGV4XSwga2V5KTtcbiAgICAgIHRoaXMuZGF0YVtrZXldLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIGlmICghdGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnR5Py5nZXRQcm9wZXJ0eUJ5S2V5KGRhdGEua2V5KTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcGVydGllcykge1xuICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcbiAgICAgICAgdGhpcy5kYXRhW2tleV0gPSAoZGF0YT8uW2tleV0gPz8gKCh0eXBlb2YgdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0KCkgOiB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCkgPz8gXCJcIikpO1xuICAgICAgICBpZiAoISh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSAmJiB0aGlzLmRhdGFba2V5XS5rZXkpIHtcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCB0aGlzLmRhdGFba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhW2tleV0pICYmIHRoaXMucHJvcGVydHkgJiYgISh0aGlzLmRhdGFba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSkge1xuICAgICAgICAgIHRoaXMuZGF0YVtrZXldID0gdGhpcy5kYXRhW2tleV0ubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICghKGl0ZW0gaW5zdGFuY2VvZiBEYXRhRmxvdykgJiYgaXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCBpdGVtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuQmluZEV2ZW50KHRoaXMuZGF0YVtrZXldLCBrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudG9Kc29uKCkpO1xuICB9XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgbGV0IHJzOiBhbnkgPSB7fTtcbiAgICBpZiAoIXRoaXMucHJvcGVydGllcykge1xuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0eT8uZ2V0UHJvcGVydHlCeUtleSh0aGlzLmRhdGEua2V5KTtcbiAgICB9XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcbiAgICAgIHJzW2tleV0gPSB0aGlzLkdldChrZXkpO1xuICAgICAgaWYgKHJzW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICByc1trZXldID0gcnNba2V5XS50b0pzb24oKTtcbiAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyc1trZXldKSAmJiAocnNba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiByc1trZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0ubWFwKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBycztcbiAgfVxuICBwdWJsaWMgZGVsZXRlKCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XHJcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XHJcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xyXG5pbXBvcnQgeyBJRXZlbnQgfSBmcm9tIFwiLi9JRmxvd1wiO1xyXG5leHBvcnQgY2xhc3MgRmxvd0NvcmUgaW1wbGVtZW50cyBJRXZlbnQge1xyXG4gIHB1YmxpYyBHZXRJZCgpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdpZCcpO1xyXG4gIH1cclxuICBwdWJsaWMgU2V0SWQoaWQ6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ2lkJywgaWQpO1xyXG4gIH1cclxuICBwdWJsaWMgcHJvcGVydGllczogYW55ID0ge307XHJcbiAgcHVibGljIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XHJcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHJcbiAgcHVibGljIENoZWNrRWxlbWVudENoaWxkKGVsOiBIVE1MRWxlbWVudCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxOb2RlID09IGVsIHx8IHRoaXMuZWxOb2RlLmNvbnRhaW5zKGVsKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcclxuICBwdWJsaWMgU2V0RGF0YShkYXRhOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCkge1xyXG4gICAgdGhpcy5kYXRhLlNldERhdGEoZGF0YSwgc2VuZGVyKTtcclxuICB9XHJcbiAgcHVibGljIFNldERhdGFGbG93KGRhdGE6IERhdGFGbG93KSB7XHJcbiAgICB0aGlzLmRhdGEuU2V0RGF0YShkYXRhLCB0aGlzLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLmRpc3BhdGNoKGBiaW5kX2RhdGFfZXZlbnRgLCB7IGRhdGEsIHNlbmRlcjogdGhpcyB9KTtcclxuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XHJcbiAgfVxyXG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xyXG4gIH1cclxuICBSZW1vdmVEYXRhRXZlbnQoKSB7XHJcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uY2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJhc2VGbG93PFRQYXJlbnQgZXh0ZW5kcyBGbG93Q29yZT4gZXh0ZW5kcyBGbG93Q29yZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJlbnQ6IFRQYXJlbnQpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgfVxyXG59XHJcbiIsImV4cG9ydCBjb25zdCBMT0cgPSAobWVzc2FnZT86IGFueSwgLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiBjb25zb2xlLmxvZyhtZXNzYWdlLCBvcHRpb25hbFBhcmFtcyk7XG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IChuZXcgRGF0ZSgpKTtcbmV4cG9ydCBjb25zdCBnZXRUaW1lID0gKCkgPT4gZ2V0RGF0ZSgpLmdldFRpbWUoKTtcbmV4cG9ydCBjb25zdCBnZXRVdWlkID0gKCkgPT4ge1xuICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICBsZXQgczogYW55ID0gW107XG4gIGxldCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xuICB9XG4gIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcbiAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXG4gIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICByZXR1cm4gdXVpZDtcbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBhcmVTb3J0ID0gKGE6IGFueSwgYjogYW55KSA9PiB7XG4gIGlmIChhLnNvcnQgPCBiLnNvcnQpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKGEuc29ydCA+IGIuc29ydCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuZXhwb3J0IGNvbnN0IGlzRnVuY3Rpb24gPSAoZm46IGFueSkgPT4ge1xuICByZXR1cm4gZm4gJiYgZm4gaW5zdGFuY2VvZiBGdW5jdGlvbjtcbn1cbmV4cG9ydCBjb25zdCBkb3dubG9hZE9iamVjdEFzSnNvbiA9IChleHBvcnRPYmo6IGFueSwgZXhwb3J0TmFtZTogc3RyaW5nKSA9PiB7XG4gIHZhciBkYXRhU3RyID0gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGV4cG9ydE9iaikpO1xuICB2YXIgZG93bmxvYWRBbmNob3JOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBkb3dubG9hZEFuY2hvck5vZGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBkYXRhU3RyKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnNldEF0dHJpYnV0ZShcImRvd25sb2FkXCIsIGV4cG9ydE5hbWUgKyBcIi5qc29uXCIpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRvd25sb2FkQW5jaG9yTm9kZSk7IC8vIHJlcXVpcmVkIGZvciBmaXJlZm94XG4gIGRvd25sb2FkQW5jaG9yTm9kZS5jbGljaygpO1xuICBkb3dubG9hZEFuY2hvck5vZGUucmVtb3ZlKCk7XG59XG5leHBvcnQgY29uc3QgcmVhZEZpbGVMb2NhbCA9IChjYWxsYmFjazogYW55KSA9PiB7XG4gIHZhciBpbnB1dEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnZmlsZScpO1xuICBpbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrPy4oZnIucmVzdWx0KTtcbiAgICB9XG4gICAgaWYgKGlucHV0RWwgJiYgaW5wdXRFbC5maWxlcylcbiAgICAgIGZyLnJlYWRBc1RleHQoaW5wdXRFbC5maWxlc1swXSk7XG4gIH0pO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlucHV0RWwpO1xuICBpbnB1dEVsLmNsaWNrKCk7XG4gIGlucHV0RWwucmVtb3ZlKCk7XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuL0lGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgaXNGdW5jdGlvbiB9IGZyb20gXCIuL1V0aWxzXCI7XG5cbmV4cG9ydCBjb25zdCBUYWdWaWV3ID0gWydTUEFOJywgJ0RJVicsICdQJywgJ1RFWFRBUkVBJ107XG5leHBvcnQgY2xhc3MgRGF0YVZpZXcge1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgcHJvcGVydHk6IGFueTtcbiAgcHJpdmF0ZSBlbFN1Z2dlc3Rpb25zOiBFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGVsU3VnZ2VzdGlvbnNDb250ZW50OiBFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIG5vZGVFZGl0b3I6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBlbDogRWxlbWVudCwgcHJpdmF0ZSBkYXRhOiBEYXRhRmxvdywgcHJpdmF0ZSBtYWluOiBJTWFpbiwgcHJpdmF0ZSBrZXlOYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbCkge1xuICAgIGlmICh0aGlzLmtleU5hbWUpIHtcbiAgICAgIGlmICghZWwuZ2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJykpIHtcbiAgICAgICAgdGhpcy5wcm9wZXJ0eSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KHRoaXMuZGF0YS5HZXQoJ2tleScpKT8uW3RoaXMua2V5TmFtZV07XG4gICAgICAgIHRoaXMubm9kZUVkaXRvciA9IGVsIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3InKTtcbiAgICAgICAgaWYgKHRoaXMucHJvcGVydHkuZWRpdCkge1xuICAgICAgICAgIGlmICh0aGlzLnByb3BlcnR5LnNlbGVjdCkge1xuICAgICAgICAgICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwibm9kZS1mb3JtLWNvbnRyb2xcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJywgdGhpcy5rZXlOYW1lKTtcblxuICAgICAgICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5rZXlOYW1lID0gZWw/LmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpO1xuICAgICAgaWYgKHRoaXMua2V5TmFtZSkge1xuICAgICAgICB0aGlzLnByb3BlcnR5ID0gdGhpcy5tYWluLmdldFByb3BlcnR5QnlLZXkodGhpcy5kYXRhLkdldCgna2V5JykpPy5bdGhpcy5rZXlOYW1lXTtcbiAgICAgICAgdGhpcy5lbE5vZGUgPSB0aGlzLmVsIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHRoaXMubm9kZUVkaXRvci5jbGFzc0xpc3QuYWRkKCdub2RlLWVkaXRvcicpO1xuICAgICAgICBlbC5wYXJlbnRFbGVtZW50Py5pbnNlcnRCZWZvcmUodGhpcy5ub2RlRWRpdG9yLCBlbCk7XG4gICAgICAgIGVsLnBhcmVudEVsZW1lbnQ/LnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgICAgdGhpcy5ub2RlRWRpdG9yLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5lbFN1Z2dlc3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbFN1Z2dlc3Rpb25zLmNsYXNzTGlzdC5hZGQoJ25vZGUtZWRpdG9yX3N1Z2dlc3Rpb25zJyk7XG4gICAgdGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQuY2xhc3NMaXN0LmFkZCgnc3VnZ2VzdGlvbnNfY29udGVudCcpO1xuICAgIHRoaXMuZWxTdWdnZXN0aW9ucy5hcHBlbmRDaGlsZCh0aGlzLmVsU3VnZ2VzdGlvbnNDb250ZW50KTtcbiAgICB0aGlzLnNob3dTdWdnZXN0aW9ucyhmYWxzZSk7XG4gICAgaWYgKHRoaXMua2V5TmFtZSlcbiAgICAgIHRoaXMuYmluZERhdGEoKTtcbiAgfVxuICBwcml2YXRlIGNoZWNrU2hvd1N1Z2dlc3Rpb25zKCkge1xuICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnNDb250ZW50KSB7XG4gICAgICB0aGlzLmVsU3VnZ2VzdGlvbnNDb250ZW50LmlubmVySFRNTCA9ICcnO1xuICAgICAgdmFyIGFyciA9IHRoaXMubWFpbi5nZXRWYXJpYWJsZSgpO1xuICAgICAgaWYgKCFhcnIgfHwgYXJyLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIHRoaXMuc2hvd1N1Z2dlc3Rpb25zKGZhbHNlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbGV0IGVsVWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBhcnIpIHtcbiAgICAgICAgbGV0IGVsTGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICBlbExpLmlubmVySFRNTCA9IGl0ZW0uR2V0KCduYW1lJyk7XG4gICAgICAgIGVsVWwuYXBwZW5kQ2hpbGQoZWxMaSk7XG4gICAgICB9XG4gICAgICB0aGlzLmVsU3VnZ2VzdGlvbnNDb250ZW50LmFwcGVuZENoaWxkKGVsVWwpO1xuICAgIH1cbiAgICBsZXQgdHh0OiBhbnkgPSAodGhpcy5lbE5vZGUgYXMgYW55KS52YWx1ZTtcbiAgICBsZXQgc2VsZWN0aW9uU3RhcnQgPSAodGhpcy5lbE5vZGUgYXMgYW55KS5zZWxlY3Rpb25TdGFydDtcbiAgICBpZiAodHh0KSB7XG4gICAgICBsZXQgc3RhcnRJbmRleCA9IHR4dC5sYXN0SW5kZXhPZihcIiR7XCIsIHNlbGVjdGlvblN0YXJ0KTtcbiAgICAgIGxldCBlbmRJbmRleCA9IHR4dC5sYXN0SW5kZXhPZihcIn1cIiwgc2VsZWN0aW9uU3RhcnQpO1xuICAgICAgaWYgKGVuZEluZGV4IDwgc3RhcnRJbmRleClcbiAgICAgICAgdGhpcy5zaG93U3VnZ2VzdGlvbnModHJ1ZSk7XG4gICAgICBlbHNlXG4gICAgICAgIHRoaXMuc2hvd1N1Z2dlc3Rpb25zKGZhbHNlKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBzaG93U3VnZ2VzdGlvbnMoZmxnOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICghdGhpcy5lbFN1Z2dlc3Rpb25zKSByZXR1cm47XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbFN1Z2dlc3Rpb25zLnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbFN1Z2dlc3Rpb25zLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGJpbmREYXRhKCkge1xuICAgIGlmICh0aGlzLmtleU5hbWUgJiYgdGhpcy5lbE5vZGUpIHtcbiAgICAgIHRoaXMuZGF0YS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHt0aGlzLmtleU5hbWV9YCwgdGhpcy5iaW5kSW5wdXQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5lbFN1Z2dlc3Rpb25zKVxuICAgICAgICAgIHRoaXMuZWxOb2RlPy5wYXJlbnRFbGVtZW50Py5hcHBlbmRDaGlsZCh0aGlzLmVsU3VnZ2VzdGlvbnMpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5lbFN1Z2dlc3Rpb25zKVxuICAgICAgICAgIHRoaXMuZWxOb2RlPy5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZCh0aGlzLmVsU3VnZ2VzdGlvbnMpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKFwic2VsZWN0XCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jaGVja1Nob3dTdWdnZXN0aW9ucygpO1xuICAgICAgfSlcbiAgICAgIGlmICh0aGlzLnByb3BlcnR5ICYmIHRoaXMucHJvcGVydHkuc2VsZWN0ICYmIGlzRnVuY3Rpb24odGhpcy5wcm9wZXJ0eS5kYXRhU2VsZWN0KSkge1xuICAgICAgICBjb25zdCBvcHRpb25zID0gdGhpcy5wcm9wZXJ0eS5kYXRhU2VsZWN0KHsgZWxOb2RlOiB0aGlzLmVsTm9kZSwgbWFpbjogdGhpcy5tYWluLCBrZXk6IHRoaXMua2V5TmFtZSB9KS5tYXAoKHsgdmFsdWUsIHRleHQgfTogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgICAgIG9wdGlvbi52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgIG9wdGlvbi50ZXh0ID0gdGV4dDtcbiAgICAgICAgICByZXR1cm4gb3B0aW9uO1xuICAgICAgICB9KTtcbiAgICAgICAgZm9yIChsZXQgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICAgICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5wcm9wZXJ0eSAmJiBpc0Z1bmN0aW9uKHRoaXMucHJvcGVydHkuc2NyaXB0KSkge1xuICAgICAgICB0aGlzLnByb3BlcnR5LnNjcmlwdCh7IGVsTm9kZTogdGhpcy5lbE5vZGUsIG1haW46IHRoaXMubWFpbiwga2V5OiB0aGlzLmtleU5hbWUgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldE5vZGVWYWx1ZSh0aGlzLmRhdGEuR2V0KHRoaXMua2V5TmFtZSkpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIHNldE5vZGVWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICBpZiAoVGFnVmlldy5pbmNsdWRlcyh0aGlzLmVsTm9kZS50YWdOYW1lKSkge1xuICAgICAgICAodGhpcy5lbE5vZGUgYXMgYW55KS5pbm5lclRleHQgPSBgJHt2YWx1ZX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKHRoaXMuZWxOb2RlIGFzIGFueSkudmFsdWUgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBiaW5kSW5wdXQoeyB2YWx1ZSwgc2VuZGVyIH06IGFueSkge1xuICAgIGlmIChzZW5kZXIgIT09IHRoaXMgJiYgdGhpcy5lbE5vZGUgJiYgc2VuZGVyLmVsTm9kZSAhPT0gdGhpcy5lbE5vZGUpIHtcbiAgICAgIHRoaXMuc2V0Tm9kZVZhbHVlKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBiaW5kRXZlbnQoKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5rZXlOYW1lICYmIHRoaXMuZWxOb2RlKSB7XG4gICAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5rZXlOYW1lLCAodGhpcy5lbE5vZGUgYXMgYW55KS52YWx1ZSwgdGhpcyk7XG5cblxuICAgICAgICB0aGlzLmNoZWNrU2hvd1N1Z2dlc3Rpb25zKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIERlbGV0ZSgpIHtcbiAgICBpZiAodGhpcy5rZXlOYW1lICYmIHRoaXMuZWxOb2RlKSB7XG4gICAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7dGhpcy5rZXlOYW1lfWAsIHRoaXMuYmluZElucHV0LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5iaW5kRXZlbnQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5iaW5kRXZlbnQuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBzdGF0aWMgQmluZEVsZW1lbnQoZWw6IEVsZW1lbnQsIGRhdGE6IERhdGFGbG93LCBtYWluOiBJTWFpbiwga2V5OiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IERhdGFWaWV3W10ge1xuICAgIGlmIChlbC5jaGlsZEVsZW1lbnRDb3VudCA9PSAwIHx8IGVsLmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpKSB7XG4gICAgICByZXR1cm4gW25ldyBEYXRhVmlldyhlbCwgZGF0YSwgbWFpbiwga2V5KV07XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tub2RlXFxcXDptb2RlbF0nKSkubWFwKChpdGVtOiBFbGVtZW50KSA9PiB7XG4gICAgICByZXR1cm4gbmV3IERhdGFWaWV3KGl0ZW0sIGRhdGEsIG1haW4pO1xuICAgIH0pO1xuICB9XG5cbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBQcm9wZXJ0eUVudW0gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi9Ob2RlSXRlbVwiO1xuXG5leHBvcnQgY2xhc3MgTGluZSB7XG4gIHB1YmxpYyBlbE5vZGU6IFNWR0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJzdmdcIik7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcbiAgcHJpdmF0ZSBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgdGVtcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGZyb206IE5vZGVJdGVtLCBwdWJsaWMgZnJvbUluZGV4OiBudW1iZXIgPSAwLCBwdWJsaWMgdG86IE5vZGVJdGVtIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBwdWJsaWMgdG9JbmRleDogbnVtYmVyID0gMCwgZGF0YTogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoXCJtYWluLXBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCAnJyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcImNvbm5lY3Rpb25cIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbFBhdGgpO1xuICAgIHRoaXMuZnJvbS5wYXJlbnQuZWxDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuXG4gICAgdGhpcy5mcm9tLkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy50bz8uQWRkTGluZSh0aGlzKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKFxuICAgICAge1xuICAgICAgICBmcm9tOiB0aGlzLmZyb20uR2V0SWQoKSxcbiAgICAgICAgZnJvbUluZGV4OiB0aGlzLmZyb21JbmRleCxcbiAgICAgICAgdG86IHRoaXMudG8/LkdldElkKCksXG4gICAgICAgIHRvSW5kZXg6IHRoaXMudG9JbmRleFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgLi4uIHRoaXMuZnJvbS5wYXJlbnQubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5saW5lKSB8fCB7fVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5mcm9tLmRhdGEuQXBwZW5kKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVRvKHRvX3g6IG51bWJlciwgdG9feTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmZyb20gfHwgdGhpcy5mcm9tLmVsTm9kZSA9PSBudWxsKSByZXR1cm47XG4gICAgbGV0IHsgeDogZnJvbV94LCB5OiBmcm9tX3kgfTogYW55ID0gdGhpcy5mcm9tLmdldFBvc3Rpc2lvbkRvdCh0aGlzLmZyb21JbmRleCk7XG4gICAgdmFyIGxpbmVDdXJ2ZSA9IHRoaXMuY3JlYXRlQ3VydmF0dXJlKGZyb21feCwgZnJvbV95LCB0b194LCB0b195LCB0aGlzLmN1cnZhdHVyZSwgJ290aGVyJyk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCBsaW5lQ3VydmUpO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpOiBMaW5lIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG8gJiYgdGhpcy50by5lbE5vZGUpIHtcbiAgICAgIGxldCB7IHg6IHRvX3gsIHk6IHRvX3kgfTogYW55ID0gdGhpcy50by5nZXRQb3N0aXNpb25Eb3QodGhpcy50b0luZGV4KTtcbiAgICAgIHRoaXMudXBkYXRlVG8odG9feCwgdG9feSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGNyZWF0ZUN1cnZhdHVyZShzdGFydF9wb3NfeDogbnVtYmVyLCBzdGFydF9wb3NfeTogbnVtYmVyLCBlbmRfcG9zX3g6IG51bWJlciwgZW5kX3Bvc195OiBudW1iZXIsIGN1cnZhdHVyZV92YWx1ZTogbnVtYmVyLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBsZXQgbGluZV94ID0gc3RhcnRfcG9zX3g7XG4gICAgbGV0IGxpbmVfeSA9IHN0YXJ0X3Bvc195O1xuICAgIGxldCB4ID0gZW5kX3Bvc194O1xuICAgIGxldCB5ID0gZW5kX3Bvc195O1xuICAgIGxldCBjdXJ2YXR1cmUgPSBjdXJ2YXR1cmVfdmFsdWU7XG4gICAgLy90eXBlIG9wZW5jbG9zZSBvcGVuIGNsb3NlIG90aGVyXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG5cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb3RoZXInOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcblxuICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG5cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZGVsZXRlKG5vZGVUaGlzOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IHRydWUpIHtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMuZnJvbS5kYXRhLlJlbW92ZSgnbGluZXMnLCB0aGlzLmRhdGEpO1xuICAgIGlmICh0aGlzLmZyb20gIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLmZyb20uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICBpZiAodGhpcy50byAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMudG8/LlJlbW92ZUxpbmUodGhpcyk7XG4gICAgdGhpcy5lbFBhdGgucmVtb3ZlKCk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlKCk7XG4gIH1cbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XG4gICAgdGhpcy5mcm9tLnBhcmVudC5zZXRMaW5lQ2hvb3NlKHRoaXMpXG4gIH1cbiAgcHVibGljIHNldE5vZGVUbyhub2RlOiBOb2RlSXRlbSB8IHVuZGVmaW5lZCwgdG9JbmRleDogbnVtYmVyKSB7XG4gICAgdGhpcy50byA9IG5vZGU7XG4gICAgdGhpcy50b0luZGV4ID0gdG9JbmRleDtcbiAgfVxuICBwdWJsaWMgQ2xvbmUoKSB7XG4gICAgaWYgKHRoaXMudG8gJiYgdGhpcy50b0luZGV4ICYmIHRoaXMuZnJvbSAhPSB0aGlzLnRvICYmICF0aGlzLmZyb20uY2hlY2tMaW5lRXhpc3RzKHRoaXMuZnJvbUluZGV4LCB0aGlzLnRvLCB0aGlzLnRvSW5kZXgpKSB7XG4gICAgICByZXR1cm4gbmV3IExpbmUodGhpcy5mcm9tLCB0aGlzLmZyb21JbmRleCwgdGhpcy50bywgdGhpcy50b0luZGV4KS5VcGRhdGVVSSgpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgZ2V0VGltZSB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5cbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcbiAgTm9uZSA9IDAsXG4gIE5vZGUgPSAxLFxuICBDYW52YXMgPSAyLFxuICBMaW5lID0gMyxcbn1cbmV4cG9ydCBjbGFzcyBEZXNnaW5lclZpZXdfRXZlbnQge1xuXG4gIHByaXZhdGUgdGltZUZhc3RDbGljazogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSB0YWdJbmdvcmUgPSBbJ2lucHV0JywgJ2J1dHRvbicsICdhJywgJ3RleHRhcmVhJ107XG5cbiAgcHJpdmF0ZSBtb3ZlVHlwZTogTW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICBwcml2YXRlIGZsZ0RyYXA6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBmbGdNb3ZlOiBib29sZWFuID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBhdl94OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGF2X3k6IG51bWJlciA9IDA7XG5cbiAgcHJpdmF0ZSBwb3NfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwb3NfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb3VzZV94OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3k6IG51bWJlciA9IDA7XG5cbiAgcHJpdmF0ZSB0ZW1wTGluZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBEZXNnaW5lclZpZXcpIHtcbiAgICAvKiBNb3VzZSBhbmQgVG91Y2ggQWN0aW9ucyAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcbiAgICAvKiBDb250ZXh0IE1lbnUgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLmNvbnRleHRtZW51LmJpbmQodGhpcykpO1xuXG4gICAgLyogRHJvcCBEcmFwICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLm5vZGVfZHJvcEVuZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCB0aGlzLm5vZGVfZHJhZ292ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogWm9vbSBNb3VzZSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuem9vbV9lbnRlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBEZWxldGUgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5ZG93bi5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHByaXZhdGUgY29udGV4dG1lbnUoZXY6IGFueSkgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gIHByaXZhdGUgbm9kZV9kcmFnb3ZlcihldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cbiAgcHJpdmF0ZSBub2RlX2Ryb3BFbmQoZXY6IGFueSkge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgbGV0IGtleU5vZGU6IGFueSA9IHRoaXMucGFyZW50Lm1haW4uZ2V0Q29udHJvbENob29zZSgpO1xuICAgIGlmICgha2V5Tm9kZSAmJiBldi50eXBlICE9PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGtleU5vZGUgPSBldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcIm5vZGVcIik7XG4gICAgfVxuICAgIGlmICgha2V5Tm9kZSkgcmV0dXJuO1xuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcblxuICAgIGlmICh0aGlzLnBhcmVudC5jaGVja09ubHlOb2RlKGtleU5vZGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBub2RlSXRlbSA9IHRoaXMucGFyZW50LkFkZE5vZGUoa2V5Tm9kZSwge1xuICAgICAgZ3JvdXA6IHRoaXMucGFyZW50LkN1cnJlbnRHcm91cCgpXG4gICAgfSk7XG4gICAgbm9kZUl0ZW0udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gIH1cbiAgcHVibGljIHpvb21fZW50ZXIoZXZlbnQ6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAoZXZlbnQuZGVsdGFZID4gMCkge1xuICAgICAgICAvLyBab29tIE91dFxuICAgICAgICB0aGlzLnBhcmVudC56b29tX291dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gWm9vbSBJblxuICAgICAgICB0aGlzLnBhcmVudC56b29tX2luKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHByaXZhdGUgU3RhcnRNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAodGhpcy50YWdJbmdvcmUuaW5jbHVkZXMoZXYudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gZ2V0VGltZSgpO1xuICAgIGlmIChldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtYWluLXBhdGgnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuQ2FudmFzO1xuICAgIGxldCBub2RlQ2hvb3NlID0gdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpO1xuICAgIGlmIChub2RlQ2hvb3NlICYmIG5vZGVDaG9vc2UuQ2hlY2tFbGVtZW50Q2hpbGQoZXYudGFyZ2V0KSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodW5kZWZpbmVkKTtcbiAgICB9XG4gICAgaWYgKG5vZGVDaG9vc2UgJiYgdGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5Ob2RlICYmIGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJub2RlLWRvdFwiKSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkxpbmU7XG4gICAgICBsZXQgZnJvbUluZGV4ID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgdGhpcy50ZW1wTGluZSA9IG5ldyBMaW5lKG5vZGVDaG9vc2UsIGZyb21JbmRleCk7XG4gICAgICB0aGlzLnRlbXBMaW5lLnRlbXAgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIHRoaXMuYXZfeCA9IHRoaXMucGFyZW50LmdldFgoKTtcbiAgICAgIHRoaXMuYXZfeSA9IHRoaXMucGFyZW50LmdldFkoKTtcbiAgICB9XG4gICAgdGhpcy5mbGdEcmFwID0gdHJ1ZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwdWJsaWMgTW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICB0aGlzLmZsZ01vdmUgPSB0cnVlO1xuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubW92ZVR5cGUpIHtcbiAgICAgIGNhc2UgTW92ZVR5cGUuQ2FudmFzOlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcbiAgICAgICAgICBsZXQgeSA9IHRoaXMuYXZfeSArIHRoaXMucGFyZW50LkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgICAgIHRoaXMucGFyZW50LnNldFgoeCk7XG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgY2FzZSBNb3ZlVHlwZS5Ob2RlOlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBvc194IC0gZV9wb3NfeCk7XG4gICAgICAgICAgbGV0IHkgPSB0aGlzLnBhcmVudC5DYWxjWSh0aGlzLnBvc195IC0gZV9wb3NfeSk7XG4gICAgICAgICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgICAgICAgdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpPy51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgY2FzZSBNb3ZlVHlwZS5MaW5lOlxuICAgICAgICB7XG4gICAgICAgICAgaWYgKHRoaXMudGVtcExpbmUpIHtcbiAgICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgICAgICAgICAgbGV0IHkgPSB0aGlzLnBhcmVudC5DYWxjWSh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnVwZGF0ZVRvKHRoaXMucGFyZW50LmVsQ2FudmFzLm9mZnNldExlZnQgLSB4LCB0aGlzLnBhcmVudC5lbENhbnZhcy5vZmZzZXRUb3AgLSB5IC0gMjApO1xuICAgICAgICAgICAgbGV0IG5vZGVFbCA9IGV2LnRhcmdldC5jbG9zZXN0KCdbbm9kZS1pZF0nKTtcbiAgICAgICAgICAgIGxldCBub2RlSWQgPSBub2RlRWw/LmdldEF0dHJpYnV0ZSgnbm9kZS1pZCcpO1xuICAgICAgICAgICAgbGV0IG5vZGVUbyA9IG5vZGVJZCA/IHRoaXMucGFyZW50LkdldE5vZGVCeUlkKG5vZGVJZCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAobm9kZVRvICYmIGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJub2RlLWRvdFwiKSkge1xuICAgICAgICAgICAgICBsZXQgdG9JbmRleCA9IGV2LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gbm9kZUVsPy5xdWVyeVNlbGVjdG9yKCcubm9kZS1kb3QnKT8uWzBdPy5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcbiAgICAgIHRoaXMubW91c2VfeSA9IGVfcG9zX3k7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgRW5kTW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgoZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDEwMCkgfHwgIXRoaXMuZmxnTW92ZSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIGxldCB4ID0gdGhpcy5hdl94ICsgdGhpcy5wYXJlbnQuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICBsZXQgeSA9IHRoaXMuYXZfeSArIHRoaXMucGFyZW50LkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgIHRoaXMucGFyZW50LnNldFkoeSk7XG4gICAgICB0aGlzLmF2X3ggPSAwO1xuICAgICAgdGhpcy5hdl95ID0gMDtcbiAgICB9XG4gICAgaWYgKHRoaXMudGVtcExpbmUpIHtcbiAgICAgIHRoaXMudGVtcExpbmUuQ2xvbmUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUuZGVsZXRlKCk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwcml2YXRlIGtleWRvd24oZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmIChldi5rZXkgPT09ICdEZWxldGUnIHx8IChldi5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGV2Lm1ldGFLZXkpKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgICB0aGlzLnBhcmVudC5nZXRMaW5lQ2hvb3NlKCk/LmRlbGV0ZSgpO1xuICAgIH1cbiAgICBpZiAoZXYua2V5ID09PSAnRjInKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlld19Ub29sYmFyIHtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGVsUGF0aEdyb3VwOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwcml2YXRlIGJ0bkJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBEZXNnaW5lclZpZXcpIHtcbiAgICB0aGlzLmVsTm9kZSA9IHBhcmVudC5lbFRvb2xiYXI7XG4gICAgdGhpcy5lbFBhdGhHcm91cC5jbGFzc0xpc3QuYWRkKCd0b29sYmFyLWdyb3VwJyk7XG4gICAgdGhpcy5yZW5kZXJVSSgpO1xuICAgIHRoaXMucmVuZGVyUGF0aEdyb3VwKCk7XG4gIH1cbiAgcHVibGljIHJlbmRlclBhdGhHcm91cCgpIHtcbiAgICB0aGlzLmJ0bkJhY2suc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgdGhpcy5lbFBhdGhHcm91cC5pbm5lckhUTUwgPSBgYDtcbiAgICBsZXQgZ3JvdXBzID0gdGhpcy5wYXJlbnQuR2V0R3JvdXBOYW1lKCk7XG4gICAgbGV0IGxlbiA9IGdyb3Vwcy5sZW5ndGggLSAxO1xuICAgIGlmIChsZW4gPCAwKSByZXR1cm47XG4gICAgZm9yIChsZXQgaW5kZXggPSBsZW47IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgIGxldCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgaWYgKGluZGV4ID09IDApIHtcbiAgICAgICAgdGV4dC5pbm5lckhUTUwgPSBgJHtncm91cHNbaW5kZXhdLnRleHR9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRleHQuaW5uZXJIVE1MID0gYCR7Z3JvdXBzW2luZGV4XS50ZXh0fSA+PiBgO1xuICAgICAgfVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoJ2dyb3VwJywgZ3JvdXBzW2luZGV4XS5pZCk7XG4gICAgICB0ZXh0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB0aGlzLnBhcmVudC5CYWNrR3JvdXAoZ3JvdXBzW2luZGV4XS5pZCkpO1xuICAgICAgdGhpcy5lbFBhdGhHcm91cC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICB9XG4gICAgaWYgKGxlbiA+IDEpXG4gICAgICB0aGlzLmJ0bkJhY2sucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICB9XG4gIHB1YmxpYyByZW5kZXJVSSgpIHtcbiAgICBpZiAoIXRoaXMuZWxOb2RlKSByZXR1cm47XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgdGhpcy5idG5CYWNrLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuQmFja0dyb3VwKCkpO1xuICAgIHRoaXMuYnRuQmFjay5pbm5lckhUTUwgPSBgQmFja2A7XG4gICAgbGV0IGJ0blpvb21JbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21Jbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucGFyZW50Lnpvb21faW4oKSk7XG4gICAgYnRuWm9vbUluLmlubmVySFRNTCA9IGArYDtcbiAgICBsZXQgYnRuWm9vbU91dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21PdXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnBhcmVudC56b29tX291dCgpKTtcbiAgICBidG5ab29tT3V0LmlubmVySFRNTCA9IGAtYDtcbiAgICBsZXQgYnRuWm9vbVJlc2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYnRuWm9vbVJlc2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuem9vbV9yZXNldCgpKTtcbiAgICBidG5ab29tUmVzZXQuaW5uZXJIVE1MID0gYCpgO1xuICAgIGxldCBidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGJ1dHRvbkdyb3VwLmNsYXNzTGlzdC5hZGQoJ3Rvb2xiYXItYnV0dG9uJylcbiAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLmJ0bkJhY2spO1xuICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKGJ0blpvb21Jbik7XG4gICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuWm9vbU91dCk7XG4gICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuWm9vbVJlc2V0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aEdyb3VwKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChidXR0b25Hcm91cCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93LCBFdmVudEVudW0sIERhdGFGbG93LCBEYXRhVmlldyB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBpc0Z1bmN0aW9uIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmV4cG9ydCBjbGFzcyBOb2RlSXRlbSBleHRlbmRzIEJhc2VGbG93PERlc2dpbmVyVmlldz4ge1xuICAvKipcbiAgICogR0VUIFNFVCBmb3IgRGF0YVxuICAgKi9cbiAgcHVibGljIGdldE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ25hbWUnKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3knKTtcbiAgfVxuICBwdWJsaWMgc2V0WSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3knLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIGdldFgoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd4JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBDaGVja0tleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdrZXknKSA9PSBrZXk7XG4gIH1cbiAgcHVibGljIGdldERhdGFMaW5lKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdsaW5lcycpID8/IFtdO1xuICB9XG4gIHB1YmxpYyBjaGVja0xpbmVFeGlzdHMoZnJvbUluZGV4OiBudW1iZXIsIHRvOiBOb2RlSXRlbSwgdG9JbmRleDogTnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZS5maWx0ZXIoKGl0ZW06IExpbmUpID0+IHtcbiAgICAgIGlmICghaXRlbS50ZW1wICYmIGl0ZW0udG8gPT0gdG8gJiYgaXRlbS50b0luZGV4ID09IHRvSW5kZXggJiYgaXRlbS5mcm9tSW5kZXggPT0gZnJvbUluZGV4KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKCFpdGVtLnRlbXAgJiYgaXRlbS5mcm9tID09IHRvICYmIGl0ZW0uZnJvbUluZGV4ID09IHRvSW5kZXggJiYgaXRlbS50b0luZGV4ID09IGZyb21JbmRleCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0pLmxlbmd0aCA+IDA7XG4gIH1cbiAgcHVibGljIGVsQ29udGVudDogRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBhcnJMaW5lOiBMaW5lW10gPSBbXTtcbiAgcHJpdmF0ZSBvcHRpb246IGFueSA9IHt9O1xuICBwcml2YXRlIGFyckRhdGFWaWV3OiBEYXRhVmlld1tdID0gW107XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IERlc2dpbmVyVmlldywgcHJpdmF0ZSBrZXlOb2RlOiBhbnksIGRhdGE6IGFueSA9IHt9KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLm9wdGlvbiA9IHRoaXMucGFyZW50Lm1haW4uZ2V0Q29udHJvbE5vZGVCeUtleShrZXlOb2RlKTtcbiAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLm9wdGlvbj8ucHJvcGVydGllcztcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRhdGEuSW5pdERhdGEoeyAuLi5kYXRhLCBuYW1lOiB0aGlzLm9wdGlvbi5uYW1lIH0sIHRoaXMucHJvcGVydGllcyk7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhLkFwcGVuZCgnbm9kZXMnLCB0aGlzLmRhdGEpO1xuICAgIH1cbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtbm9kZScpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9uLmNsYXNzKTtcbiAgICB9XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdub2RlLWlkJywgdGhpcy5HZXRJZCgpKTtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6bm9uZScpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5yZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBnZXRPcHRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9uO1xuICB9XG4gIHByaXZhdGUgcmVuZGVyVUkoZGV0YWlsOiBhbnkgPSBudWxsKSB7XG4gICAgaWYgKChkZXRhaWwgJiYgWyd4JywgJ3knXS5pbmNsdWRlcyhkZXRhaWwua2V5KSkpIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuZWxOb2RlLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpKSByZXR1cm47XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgaWYgKHRoaXMuZ2V0T3B0aW9uKCk/LmhpZGVUaXRsZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtbGVmdFwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXRvcFwiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50XCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWJvdHRvbVwiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1yaWdodFwiPjwvZGl2PlxuICAgIGA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS10b3BcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPiR7dGhpcy5vcHRpb24uaWNvbn0gJHt0aGlzLmdldE5hbWUoKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYm9keVwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtYm90dG9tXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXJpZ2h0XCI+PC9kaXY+XG4gICAgYDtcbiAgICB9XG5cbiAgICBjb25zdCBhZGROb2RlRG90ID0gKG51bTogbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZCwgc3RhcnQ6IG51bWJlciwgcXVlcnk6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKG51bSkge1xuICAgICAgICBsZXQgbm9kZVF1ZXJ5ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcihxdWVyeSk7XG4gICAgICAgIGlmIChub2RlUXVlcnkpIHtcbiAgICAgICAgICBub2RlUXVlcnkuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgbm9kZURvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgbm9kZURvdC5jbGFzc0xpc3QuYWRkKCdub2RlLWRvdCcpO1xuICAgICAgICAgICAgbm9kZURvdC5zZXRBdHRyaWJ1dGUoJ25vZGUnLCBgJHtzdGFydCArIGl9YCk7XG4gICAgICAgICAgICBub2RlUXVlcnkuYXBwZW5kQ2hpbGQobm9kZURvdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8ubGVmdCwgMTAwMCwgJy5ub2RlLWxlZnQnKTtcbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LnRvcCwgMjAwMCwgJy5ub2RlLXRvcCcpO1xuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8uYm90dG9tLCAzMDAwLCAnLm5vZGUtYm90dG9tJyk7XG4gICAgYWRkTm9kZURvdCh0aGlzLm9wdGlvbj8uZG90Py5yaWdodCwgNDAwMCwgJy5ub2RlLXJpZ2h0Jyk7XG5cbiAgICB0aGlzLmVsQ29udGVudCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWNvbnRlbnQgLmJvZHknKSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLnBhcmVudC5tYWluLnJlbmRlckh0bWwodGhpcywgdGhpcy5lbENvbnRlbnQpO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICB0aGlzLmFyckRhdGFWaWV3LmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uRGVsZXRlKCkpO1xuICAgIGlmIChpc0Z1bmN0aW9uKHRoaXMub3B0aW9uLnNjcmlwdCkpIHtcbiAgICAgIHRoaXMub3B0aW9uLnNjcmlwdCh7IG5vZGU6IHRoaXMsIGVsTm9kZTogdGhpcy5lbE5vZGUsIG1haW46IHRoaXMucGFyZW50Lm1haW4gfSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmVsQ29udGVudClcbiAgICAgIHRoaXMuYXJyRGF0YVZpZXcgPSBEYXRhVmlldy5CaW5kRWxlbWVudCh0aGlzLmVsQ29udGVudCwgdGhpcy5kYXRhLCB0aGlzLnBhcmVudC5tYWluKTtcbiAgfVxuICBwdWJsaWMgb3Blbkdyb3VwKCkge1xuICAgIGlmICh0aGlzLkNoZWNrS2V5KCdub2RlX2dyb3VwJykpIHtcbiAgICAgIHRoaXMucGFyZW50Lm9wZW5Hcm91cCh0aGlzLkdldElkKCkpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgdXBkYXRlUG9zaXRpb24oeDogYW55LCB5OiBhbnksIGlDaGVjayA9IGZhbHNlKSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICBsZXQgdGVtcHggPSB4O1xuICAgICAgbGV0IHRlbXB5ID0geTtcbiAgICAgIGlmICghaUNoZWNrKSB7XG4gICAgICAgIHRlbXB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICB0ZW1weCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0IC0geCk7XG4gICAgICB9XG4gICAgICBpZiAodGVtcHggIT09IHRoaXMuZ2V0WCgpKSB7XG4gICAgICAgIHRoaXMuc2V0WCh0ZW1weCk7XG4gICAgICB9XG4gICAgICBpZiAodGVtcHkgIT09IHRoaXMuZ2V0WSgpKSB7XG4gICAgICAgIHRoaXMuc2V0WSh0ZW1weSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgUmVtb3ZlTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5hcnJMaW5lLmluZGV4T2YobGluZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuYXJyTGluZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hcnJMaW5lO1xuICB9XG4gIHB1YmxpYyBBZGRMaW5lKGxpbmU6IExpbmUpIHtcbiAgICB0aGlzLmFyckxpbmUgPSBbLi4udGhpcy5hcnJMaW5lLCBsaW5lXTtcbiAgfVxuICBwdWJsaWMgZ2V0UG9zdGlzaW9uRG90KGluZGV4OiBudW1iZXIgPSAwKSB7XG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZT8ucXVlcnlTZWxlY3RvcihgLm5vZGUtZG90W25vZGU9XCIke2luZGV4fVwiXWApO1xuICAgIGlmIChlbERvdCkge1xuICAgICAgbGV0IHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wICsgZWxEb3Qub2Zmc2V0VG9wICsgMTApO1xuICAgICAgbGV0IHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCArIGVsRG90Lm9mZnNldExlZnQgKyAxMCk7XG4gICAgICByZXR1cm4geyB4LCB5IH07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgIGl0ZW0uVXBkYXRlVUkoKTtcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBkZWxldGUoaXNDbGVhckRhdGEgPSB0cnVlKSB7XG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMsIGlzQ2xlYXJEYXRhKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5kYXRhLmRlbGV0ZSgpO1xuICAgIGVsc2Uge1xuICAgICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLnJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5SZW1vdmVEYXRhRXZlbnQoKTtcbiAgICB9XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZSgpO1xuICAgIHRoaXMuYXJyTGluZSA9IFtdO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7fSk7XG4gIH1cbiAgcHVibGljIFJlbmRlckxpbmUoKSB7XG4gICAgdGhpcy5nZXREYXRhTGluZSgpLmZvckVhY2goKGl0ZW06IERhdGFGbG93KSA9PiB7XG4gICAgICBsZXQgbm9kZUZyb20gPSB0aGlzO1xuICAgICAgbGV0IG5vZGVUbyA9IHRoaXMucGFyZW50LkdldE5vZGVCeUlkKGl0ZW0uR2V0KCd0bycpKTtcbiAgICAgIGxldCB0b0luZGV4ID0gaXRlbS5HZXQoJ3RvSW5kZXgnKTtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBpdGVtLkdldCgnZnJvbUluZGV4Jyk7XG4gICAgICBuZXcgTGluZShub2RlRnJvbSwgZnJvbUluZGV4LCBub2RlVG8sIHRvSW5kZXgsIGl0ZW0pLlVwZGF0ZVVJKCk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBGbG93Q29yZSwgSU1haW4sIEV2ZW50RW51bSwgUHJvcGVydHlFbnVtLCBTY29wZVJvb3QgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3X0V2ZW50IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3X0V2ZW50XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfVG9vbGJhciB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld19Ub29sYmFyXCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi9Ob2RlSXRlbVwiO1xuXG5leHBvcnQgY29uc3QgWm9vbSA9IHtcbiAgbWF4OiAxLjYsXG4gIG1pbjogMC42LFxuICB2YWx1ZTogMC4xLFxuICBkZWZhdWx0OiAxXG59XG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3IGV4dGVuZHMgRmxvd0NvcmUge1xuXG4gIC8qKlxuICAgKiBHRVQgU0VUIGZvciBEYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0Wm9vbSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd6b29tJyk7XG4gIH1cbiAgcHVibGljIHNldFpvb20odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgnem9vbScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd5Jyk7XG4gIH1cbiAgcHVibGljIHNldFkodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwcml2YXRlIGdyb3VwRGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgbGFzdEdyb3VwTmFtZTogc3RyaW5nID0gXCJcIjtcbiAgcHJpdmF0ZSBnZXREYXRhR3JvdXAoKTogRGF0YUZsb3cge1xuICAgIGlmICh0aGlzLiRsb2NrKSByZXR1cm4gdGhpcy5kYXRhO1xuICAgIC8vIGNhY2hlIGdyb3VwRGF0YVxuICAgIGlmICh0aGlzLmxhc3RHcm91cE5hbWUgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpIHJldHVybiB0aGlzLmdyb3VwRGF0YSA/PyB0aGlzLmRhdGE7XG4gICAgdGhpcy5sYXN0R3JvdXBOYW1lID0gdGhpcy5DdXJyZW50R3JvdXAoKTtcbiAgICBsZXQgZ3JvdXBzID0gdGhpcy5kYXRhLkdldCgnZ3JvdXBzJyk7XG4gICAgdGhpcy5ncm91cERhdGEgPSBncm91cHM/LmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KCdncm91cCcpID09IHRoaXMubGFzdEdyb3VwTmFtZSk/LlswXTtcbiAgICBpZiAoIXRoaXMuZ3JvdXBEYXRhKSB7XG4gICAgICB0aGlzLmdyb3VwRGF0YSA9IG5ldyBEYXRhRmxvdyh0aGlzLm1haW4sIHtcbiAgICAgICAga2V5OiBQcm9wZXJ0eUVudW0uZ3JvdXBDYXZhcyxcbiAgICAgICAgZ3JvdXA6IHRoaXMubGFzdEdyb3VwTmFtZVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRhdGEuQXBwZW5kKCdncm91cHMnLCB0aGlzLmdyb3VwRGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICB9XG4gICAgbGV0IGRhdGFHcm91cCA9IHRoaXMuR2V0RGF0YUJ5SWQodGhpcy5sYXN0R3JvdXBOYW1lKTtcbiAgICBpZiAoZGF0YUdyb3VwKSB7XG4gICAgICBkYXRhR3JvdXAub25TYWZlKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuVXBkYXRlVUkuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICAgICAgICB0aGlzLmNoYW5nZUdyb3VwKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ncm91cERhdGE7XG4gIH1cbiAgcHJpdmF0ZSBncm91cDogYW55W10gPSBbXTtcbiAgcHVibGljIEdldEdyb3VwTmFtZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLmdyb3VwLm1hcCgoaXRlbSkgPT4gKHsgaWQ6IGl0ZW0sIHRleHQ6IHRoaXMuR2V0RGF0YUJ5SWQoaXRlbSk/LkdldCgnbmFtZScpIH0pKSwgeyBpZDogU2NvcGVSb290LCB0ZXh0OiBTY29wZVJvb3QgfV07XG4gIH1cbiAgcHVibGljIEJhY2tHcm91cChpZDogYW55ID0gbnVsbCkge1xuICAgIGxldCBpbmRleCA9IDE7XG4gICAgaWYgKGlkKSB7XG4gICAgICBpbmRleCA9IHRoaXMuZ3JvdXAuaW5kZXhPZihpZCk7XG4gICAgICBpZiAoaW5kZXggPCAwKSBpbmRleCA9IDA7XG4gICAgfVxuICAgIGlmIChpbmRleClcbiAgICAgIHRoaXMuZ3JvdXAuc3BsaWNlKDAsIGluZGV4KTtcbiAgICBlbHNlIHRoaXMuZ3JvdXAgPSBbXTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICB9XG4gIHB1YmxpYyBDdXJyZW50R3JvdXAoKSB7XG4gICAgbGV0IG5hbWUgPSB0aGlzLmdyb3VwPy5bMF07XG4gICAgaWYgKG5hbWUgJiYgbmFtZSAhPSAnJykge1xuICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuICAgIHJldHVybiAncm9vdCc7XG4gIH1cblxuICBwdWJsaWMgQ3VycmVudEdyb3VwRGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQnlJZCh0aGlzLkN1cnJlbnRHcm91cCgpKSA/PyB0aGlzLmRhdGE7XG4gIH1cbiAgcHVibGljIGNoYW5nZUdyb3VwKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5ncm91cENoYW5nZSwge1xuICAgICAgICBncm91cDogdGhpcy5HZXRHcm91cE5hbWUoKVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICB9XG4gIHB1YmxpYyBvcGVuR3JvdXAoaWQ6IGFueSkge1xuICAgIHRoaXMuZ3JvdXAgPSBbaWQsIC4uLnRoaXMuZ3JvdXBdO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLmNoYW5nZUdyb3VwKCk7O1xuICB9XG4gIHByaXZhdGUgbGluZUNob29zZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldExpbmVDaG9vc2Uobm9kZTogTGluZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHRoaXMubGluZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubGluZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkge1xuICAgICAgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRMaW5lQ2hvb3NlKCk6IExpbmUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmxpbmVDaG9vc2U7XG4gIH1cbiAgcHJpdmF0ZSBub2RlczogTm9kZUl0ZW1bXSA9IFtdO1xuICBwcml2YXRlIG5vZGVDaG9vc2U6IE5vZGVJdGVtIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgc2V0Tm9kZUNob29zZShub2RlOiBOb2RlSXRlbSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHRoaXMubm9kZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubm9kZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkge1xuICAgICAgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXRMaW5lQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5ub2RlQ2hvb3NlLmRhdGEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLkN1cnJlbnRHcm91cERhdGEoKSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldE5vZGVDaG9vc2UoKTogTm9kZUl0ZW0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm5vZGVDaG9vc2U7XG4gIH1cbiAgcHVibGljIEFkZE5vZGVJdGVtKGRhdGE6IGFueSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5BZGROb2RlKGRhdGEuR2V0KCdrZXknKSwgZGF0YSk7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUoa2V5Tm9kZTogc3RyaW5nLCBkYXRhOiBhbnkgPSB7fSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5JbnNlcnROb2RlKG5ldyBOb2RlSXRlbSh0aGlzLCBrZXlOb2RlLCBkYXRhKSk7XG4gIH1cbiAgcHVibGljIEluc2VydE5vZGUobm9kZTogTm9kZUl0ZW0pOiBOb2RlSXRlbSB7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlSXRlbSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICB0aGlzLmRhdGEuUmVtb3ZlKCdub2RlcycsIG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBDbGVhck5vZGUoKSB7XG4gICAgdGhpcy5ub2Rlcz8uZm9yRWFjaChpdGVtID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICB9XG4gIHB1YmxpYyBHZXREYXRhQWxsTm9kZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuICh0aGlzLmRhdGE/LkdldCgnbm9kZXMnKSA/PyBbXSk7XG4gIH1cbiAgcHVibGljIEdldERhdGFOb2RlKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQWxsTm9kZSgpLmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KFwiZ3JvdXBcIikgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpO1xuICB9XG4gIC8qKlxuICAgKiBWYXJpYnV0ZVxuICAqL1xuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyBlbFRvb2xiYXI6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyB0b29sYmFyOiBEZXNnaW5lclZpZXdfVG9vbGJhcjtcbiAgcHVibGljICRsb2NrOiBib29sZWFuID0gdHJ1ZTtcbiAgcHJpdmF0ZSB6b29tX2xhc3RfdmFsdWU6IGFueSA9IDE7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZWxOb2RlID0gZWxOb2RlO1xuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubWFpbik7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKHt9LCBwcm9wZXJ0aWVzKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdkZXNnaW5lci12aWV3JylcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5yZW1vdmUoXCJkZXNnaW5lci1jYW52YXNcIik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnZGVzZ2luZXItdmlldycpXG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QuYWRkKFwiZGVzZ2luZXItY2FudmFzXCIpO1xuICAgdGhpcy5lbFRvb2xiYXIuY2xhc3NMaXN0LmFkZChcImRlc2dpbmVyLXRvb2xiYXJcIik7XG4gICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsVG9vbGJhcik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XG4gICAgdGhpcy5lbE5vZGUudGFiSW5kZXggPSAwO1xuICAgIG5ldyBEZXNnaW5lclZpZXdfRXZlbnQodGhpcyk7XG4gICB0aGlzLnRvb2xiYXIgPSBuZXcgRGVzZ2luZXJWaWV3X1Rvb2xiYXIodGhpcyk7XG4gICAgdGhpcy5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5SZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm9uKEV2ZW50RW51bS5zaG93UHJvcGVydHksIChkYXRhOiBhbnkpID0+IHsgbWFpbi5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCBkYXRhKTsgfSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy5PcGVuKGl0ZW0uZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZVZpZXcoeDogYW55LCB5OiBhbnksIHpvb206IGFueSkge1xuICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3h9cHgsICR7eX1weCkgc2NhbGUoJHt6b29tfSlgO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICB0aGlzLnVwZGF0ZVZpZXcodGhpcy5nZXRYKCksIHRoaXMuZ2V0WSgpLCB0aGlzLmdldFpvb20oKSk7XG4gIH1cbiAgcHVibGljIFJlbmRlclVJKGRldGFpbDogYW55ID0ge30pIHtcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgTm9kZUl0ZW0pIHJldHVybjtcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgRGVzZ2luZXJWaWV3KSB7XG4gICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuQ2xlYXJOb2RlKCk7XG4gICAgdGhpcy5HZXREYXRhTm9kZSgpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy5BZGROb2RlSXRlbShpdGVtKTtcbiAgICB9KTtcbiAgICB0aGlzLkdldEFsbE5vZGUoKS5mb3JFYWNoKChpdGVtOiBOb2RlSXRlbSkgPT4ge1xuICAgICAgaXRlbS5SZW5kZXJMaW5lKCk7XG4gICAgfSlcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gIH1cbiAgcHVibGljIE9wZW4oJGRhdGE6IERhdGFGbG93KSB7XG4gICAgaWYgKCRkYXRhID09IHRoaXMuZGF0YSkge1xuICAgICAgdGhpcy5SZW5kZXJVSSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRhdGE/LmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoZGV0YWlsOiBhbnkpID0+IHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIGRldGFpbCkpO1xuICAgIHRoaXMuZGF0YSA9ICRkYXRhO1xuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgKGRldGFpbDogYW55KSA9PiB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCBkZXRhaWwpKTtcbiAgICB0aGlzLiRsb2NrID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0R3JvdXBOYW1lID0gJyc7XG4gICAgdGhpcy5ncm91cERhdGEgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5ncm91cCA9IFtdO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLmNoYW5nZUdyb3VwKCk7XG4gIH1cbiAgcHVibGljIENhbGNYKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudFdpZHRoIC8gKHRoaXMuZWxOb2RlPy5jbGllbnRXaWR0aCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHVibGljIENhbGNZKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudEhlaWdodCAvICh0aGlzLmVsTm9kZT8uY2xpZW50SGVpZ2h0ICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwdWJsaWMgR2V0QWxsTm9kZSgpOiBOb2RlSXRlbVtdIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlcyB8fCBbXTtcbiAgfVxuICBwdWJsaWMgR2V0Tm9kZUJ5SWQoaWQ6IHN0cmluZyk6IE5vZGVJdGVtIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5HZXRBbGxOb2RlKCkuZmlsdGVyKG5vZGUgPT4gbm9kZS5HZXRJZCgpID09IGlkKT8uWzBdO1xuICB9XG5cbiAgcHVibGljIEdldERhdGFCeUlkKGlkOiBzdHJpbmcpOiBEYXRhRmxvdyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLkdldERhdGFBbGxOb2RlKCkuZmlsdGVyKChpdGVtKSA9PiBpdGVtLkdldCgnaWQnKSA9PT0gaWQpPy5bMF07XG4gIH1cbiAgY2hlY2tPbmx5Tm9kZShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiAodGhpcy5tYWluLmdldENvbnRyb2xCeUtleShrZXkpLm9ubHlOb2RlSXRlbSkgJiYgdGhpcy5ub2Rlcy5maWx0ZXIoaXRlbSA9PiBpdGVtLkNoZWNrS2V5KGtleSkpLmxlbmd0aCA+IDA7XG4gIH1cbiAgcHVibGljIHpvb21fcmVmcmVzaChmbGc6IGFueSA9IDApIHtcbiAgICBsZXQgdGVtcF96b29tID0gZmxnID09IDAgPyBab29tLmRlZmF1bHQgOiAodGhpcy5nZXRab29tKCkgKyBab29tLnZhbHVlICogZmxnKTtcbiAgICBpZiAoWm9vbS5tYXggPj0gdGVtcF96b29tICYmIHRlbXBfem9vbSA+PSBab29tLm1pbikge1xuICAgICAgdGhpcy5zZXRYKCh0aGlzLmdldFgoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XG4gICAgICB0aGlzLnNldFkoKHRoaXMuZ2V0WSgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGVtcF96b29tKTtcbiAgICAgIHRoaXMuem9vbV9sYXN0X3ZhbHVlID0gdGVtcF96b29tO1xuICAgICAgdGhpcy5zZXRab29tKHRoaXMuem9vbV9sYXN0X3ZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21faW4oKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMSk7XG4gIH1cbiAgcHVibGljIHpvb21fb3V0KCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKC0xKTtcbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgwKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIEV2ZW50RW51bSwgSU1haW4sIFNjb3BlUm9vdCB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5cbmV4cG9ydCBjbGFzcyBWYXJpYWJsZVZpZXcge1xuICBwcml2YXRlIHZhcmlhYmxlczogRGF0YUZsb3dbXSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy12YXJpYWJsZScpO1xuICAgIHRoaXMubWFpbi5vblNhZmUoRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCAoeyBkYXRhIH06IGFueSkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoKTtcbiAgICB9KTtcbiAgICB0aGlzLm1haW4ub25TYWZlKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKCkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoKTtcbiAgICB9KTtcbiAgICB0aGlzLm1haW4ub25TYWZlKEV2ZW50RW51bS5ncm91cENoYW5nZSwgKCkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXIoKTtcbiAgICB9KVxuICAgIHRoaXMuUmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIFJlbmRlcigpIHtcbiAgICB0aGlzLnZhcmlhYmxlcyA9IHRoaXMubWFpbi5nZXRWYXJpYWJsZSgpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDx0YWJsZSBib3JkZXI9XCIxXCI+XG4gICAgICAgIDx0aGVhZD5cbiAgICAgICAgICA8dHI+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1uYW1lXCI+TmFtZTwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS10eXBlXCI+VHlwZTwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1zY29wZVwiPlNjb3BlPC90ZD5cbiAgICAgICAgICAgIDx0ZCBjbGFzcz1cInZhcmlhYmxlLWRlZmF1bHRcIj5EZWZhdWx0PC90ZD5cbiAgICAgICAgICAgIDx0ZCBjbGFzcz1cInZhcmlhYmxlLWJ1dHRvblwiPjwvdGQ+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90aGVhZD5cbiAgICAgICAgPHRib2R5PlxuICAgICAgICA8L3Rib2R5PlxuICAgICAgPC90YWJsZT5cbiAgICBgO1xuICAgIGlmICh0aGlzLnZhcmlhYmxlcykge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLnZhcmlhYmxlcykge1xuICAgICAgICBuZXcgVmFyaWFibGVJdGVtKGl0ZW0sIHRoaXMpLlJlbmRlclNjb3BlKHRoaXMubWFpbi5nZXRHcm91cEN1cnJlbnQoKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5jbGFzcyBWYXJpYWJsZUl0ZW0ge1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuICBwcml2YXRlIG5hbWVJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICBwcml2YXRlIHR5cGVJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgcHJpdmF0ZSBzY29wZUlucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuICBwcml2YXRlIHZhbHVlRGVmYXVsdElucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHZhcmlhYmxlOiBEYXRhRmxvdywgcHJpdmF0ZSBwYXJlbnQ6IFZhcmlhYmxlVmlldykge1xuICAgICh0aGlzLm5hbWVJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5HZXQoJ25hbWUnKTtcbiAgICAodGhpcy52YWx1ZURlZmF1bHRJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5HZXQoJ2luaXRhbFZhbHVlJykgPz8gJyc7XG4gICAgKHRoaXMudHlwZUlucHV0IGFzIGFueSkudmFsdWUgPSB0aGlzLnZhcmlhYmxlLkdldCgndHlwZScpID8/ICcnO1xuICAgIGZvciAobGV0IGl0ZW0gb2YgWyd0ZXh0JywgJ251bWJlcicsICdkYXRlJywgJ29iamVjdCddKSB7XG4gICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICBvcHRpb24udGV4dCA9IGl0ZW07XG4gICAgICBvcHRpb24udmFsdWUgPSBpdGVtO1xuICAgICAgdGhpcy50eXBlSW5wdXQuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgICB9XG4gICAgbGV0IG5hbWVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIG5hbWVDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy5uYW1lSW5wdXQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG5hbWVDb2x1bW4pO1xuICAgIHRoaXMubmFtZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnbmFtZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLm5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnbmFtZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcblxuICAgIGxldCB0eXBlQ29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICB0eXBlQ29sdW1uLmFwcGVuZENoaWxkKHRoaXMudHlwZUlucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0eXBlQ29sdW1uKTtcbiAgICB0aGlzLnR5cGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgndHlwZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgICBsZXQgc2NvcGVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIHNjb3BlQ29sdW1uLmFwcGVuZENoaWxkKHRoaXMuc2NvcGVJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoc2NvcGVDb2x1bW4pO1xuXG5cbiAgICBsZXQgdmFsdWVEZWZhdWx0Q29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICB2YWx1ZURlZmF1bHRDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy52YWx1ZURlZmF1bHRJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodmFsdWVEZWZhdWx0Q29sdW1uKTtcbiAgICB0aGlzLnZhbHVlRGVmYXVsdElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmFyaWFibGUuU2V0KCdpbml0YWxWYWx1ZScsIGUudGFyZ2V0LnZhbHVlKTtcbiAgICB9KTtcbiAgICB0aGlzLnZhbHVlRGVmYXVsdElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnaW5pdGFsVmFsdWUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBsZXQgYnV0dG9uUmVtb3ZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYnV0dG9uUmVtb3ZlLmlubmVySFRNTCA9IGAtYDtcbiAgICBidXR0b25SZW1vdmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBwYXJlbnQubWFpbi5yZW1vdmVWYXJpYWJsZSh2YXJpYWJsZSk7XG4gICAgfSk7XG4gICAgbGV0IGJ1dHRvblJlbW92ZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgYnV0dG9uUmVtb3ZlQ29sdW1uLmFwcGVuZENoaWxkKGJ1dHRvblJlbW92ZSk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoYnV0dG9uUmVtb3ZlQ29sdW1uKTtcblxuICAgIHBhcmVudC5lbE5vZGUucXVlcnlTZWxlY3RvcigndGFibGUgdGJvZHknKT8uYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuXG4gIH1cbiAgUmVuZGVyU2NvcGUoZ3JvdXA6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLnNjb3BlSW5wdXQuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIGdyb3VwKSB7XG4gICAgICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgICAgb3B0aW9uLnRleHQgPSBpdGVtLnRleHQ7XG4gICAgICAgIG9wdGlvbi52YWx1ZSA9IGl0ZW0uaWQ7XG4gICAgICAgIHRoaXMuc2NvcGVJbnB1dC5wcmVwZW5kKG9wdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgICh0aGlzLnNjb3BlSW5wdXQgYXMgYW55KS52YWx1ZSA9IHRoaXMudmFyaWFibGUuR2V0KCdzY29wZScpO1xuICAgIHRoaXMuc2NvcGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnc2NvcGUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIFRvb2xib3hWaWV3IHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy10b29sYm94Jyk7XG4gICAgdGhpcy5SZW5kZXIoKTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyKCkge1xuICAgIGxldCBjb250cm9scyA9IHRoaXMubWFpbi5nZXRDb250cm9sQWxsKCk7XG4gICAgbGV0IGdyb3VwOiBhbnkgPSB7fTtcblxuICAgIE9iamVjdC5rZXlzKGNvbnRyb2xzKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGxldCBncm91cE5hbWUgPSBjb250cm9sc1tpdGVtXS5ncm91cCA/PyBcIm90aGVyXCI7XG4gICAgICBpZiAoZ3JvdXBbZ3JvdXBOYW1lXSA9PT0gdW5kZWZpbmVkKSBncm91cFtncm91cE5hbWVdID0gW107XG4gICAgICBncm91cFtncm91cE5hbWVdID0gW1xuICAgICAgICAuLi5ncm91cFtncm91cE5hbWVdLFxuICAgICAgICBjb250cm9sc1tpdGVtXVxuICAgICAgXTtcbiAgICB9KTtcbiAgICBPYmplY3Qua2V5cyhncm91cCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICBsZXQgaXRlbUJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgaXRlbUJveC5jbGFzc0xpc3QuYWRkKCdub2RlLWJveCcpO1xuICAgICAgaXRlbUJveC5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxwIGNsYXNzPVwibm9kZS1ib3hfdGl0bGVcIj4ke2l0ZW19PC9wPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3hfYm9ieVwiPjwvZGl2PlxuICAgICAgYDtcbiAgICAgIGl0ZW1Cb3gucXVlcnlTZWxlY3RvcignLm5vZGUtYm94X3RpdGxlJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBpZiAoaXRlbUJveC5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKSB7XG4gICAgICAgICAgaXRlbUJveC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGl0ZW1Cb3guY2xhc3NMaXN0LmFkZCgnYWN0aXZlJylcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmb3IgKGxldCBfaXRlbSBvZiBncm91cFtpdGVtXSkge1xuICAgICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XG4gICAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcbiAgICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBfaXRlbS5rZXkpO1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtfaXRlbS5pY29ufSA8c3Bhbj4ke19pdGVtLm5hbWV9PC9zcGFuYDtcbiAgICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcbiAgICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsIHRoaXMuZHJhZ2VuZC5iaW5kKHRoaXMpKVxuICAgICAgICBpdGVtQm94LnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWJveF9ib2J5Jyk/LmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGl0ZW1Cb3gpO1xuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgZHJhZ2VuZChlOiBhbnkpIHtcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgZHJhZ1N0YXJ0KGU6IGFueSkge1xuICAgIGxldCBrZXkgPSBlLnRhcmdldC5jbG9zZXN0KFwiLm5vZGUtaXRlbVwiKS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgIHRoaXMubWFpbi5zZXRDb250cm9sQ2hvb3NlKGtleSk7XG4gICAgaWYgKGUudHlwZSAhPT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJub2RlXCIsIGtleSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBFdmVudEVudW0sIElNYWluLCBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9qZWN0VmlldyB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvamVjdCcpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXIoKSB7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgbGV0IHByb2plY3RzID0gdGhpcy5tYWluLmdldFByb2plY3RBbGwoKTtcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0LWlkJywgaXRlbS5HZXQoJ2lkJykpO1xuICAgICAgaXRlbS5vblNhZmUoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMubWFpbi5jaGVja1Byb2plY3RPcGVuKGl0ZW0pKSB7XG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubWFpbi5zZXRQcm9qZWN0T3BlbihpdGVtKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbE5vZGU/LmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvSUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFRhYlByb2plY3RWaWV3IHtcbiAgcHJpdmF0ZSAkZWxCb2J5OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHJpdmF0ZSAkZWxXYXJwOiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHJpdmF0ZSAkYnRuTmV4dDogRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHByaXZhdGUgJGJ0bkJhY2s6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwcml2YXRlICRidG5BZGQ6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXRhYi1wcm9qZWN0Jyk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgdGhpcy5SZW5kZXIuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5SZW5kZXIoKTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyKCkge1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3RfX3NlYXJjaFwiPjwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9fbGlzdFwiPlxuICAgICAgPGRpdiBjbGFzcz1cInRhYi1wcm9qZWN0X2J1dHRvblwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuLWJhY2tcIj48PDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3Rfd2FycFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3RfX2JvZHlcIj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9idXR0b25cIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1uZXh0XCI+Pj48L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRhYi1wcm9qZWN0X2J1dHRvblwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuLWFkZFwiPis8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGA7XG4gICAgdGhpcy4kZWxXYXJwID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnRhYi1wcm9qZWN0X3dhcnAnKTtcbiAgICB0aGlzLiRlbEJvYnkgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudGFiLXByb2plY3RfX2JvZHknKTtcbiAgICB0aGlzLiRidG5CYWNrID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bi1iYWNrJyk7XG4gICAgdGhpcy4kYnRuTmV4dCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG4tbmV4dCcpO1xuICAgIHRoaXMuJGJ0bkFkZCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG4tYWRkJyk7XG4gICAgY29uc3QgZm5VcGRhdGVTY3JvbGwgPSAoKSA9PiB7XG4gICAgICBpZiAodGhpcy4kZWxXYXJwKSB7XG4gICAgICAgIC8vIGxldCBzY3JvbGxMZWZ0ID0gdGhpcy4kZWxXYXJwLnNjcm9sbExlZnQ7XG4gICAgICAgIC8vIHZhciBtYXhTY3JvbGxMZWZ0ID0gdGhpcy4kZWxXYXJwLnNjcm9sbFdpZHRoIC0gdGhpcy4kZWxXYXJwLmNsaWVudFdpZHRoO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhzY3JvbGxMZWZ0KTtcbiAgICAgICAgLy8gaWYgKHRoaXMuJGJ0bkJhY2sgJiYgc2Nyb2xsTGVmdCA8PSAwKSB7XG4gICAgICAgIC8vICAgdGhpcy4kYnRuQmFjay5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYGRpc3BsYXk6bm9uZTtgKVxuICAgICAgICAvLyB9IGVsc2UgaWYgKHRoaXMuJGJ0bkJhY2sgJiYgc2Nyb2xsTGVmdCA+IDApIHtcbiAgICAgICAgLy8gICB0aGlzLiRidG5CYWNrLnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBpZiAodGhpcy4kYnRuTmV4dCAmJiBzY3JvbGxMZWZ0ID49IG1heFNjcm9sbExlZnQpIHtcbiAgICAgICAgLy8gICB0aGlzLiRidG5OZXh0LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApXG4gICAgICAgIC8vIH0gZWxzZSBpZiAodGhpcy4kYnRuTmV4dCAmJiBzY3JvbGxMZWZ0IDw9IDApIHtcbiAgICAgICAgLy8gICB0aGlzLiRidG5OZXh0LnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcbiAgICAgICAgLy8gfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLiRlbFdhcnA/LmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgZXZlbnQgPT4ge1xuICAgICAgZm5VcGRhdGVTY3JvbGwoKTtcbiAgICB9LCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gICAgZm5VcGRhdGVTY3JvbGwoKTtcbiAgICB0aGlzLiRidG5CYWNrPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLiRlbFdhcnApIHtcbiAgICAgICAgdGhpcy4kZWxXYXJwLnNjcm9sbExlZnQgLT0gMTAwO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJGJ0bk5leHQ/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuJGVsV2FycCkge1xuICAgICAgICB0aGlzLiRlbFdhcnAuc2Nyb2xsTGVmdCArPSAxMDA7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kYnRuQWRkPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIHRoaXMubWFpbi5uZXdQcm9qZWN0KFwiXCIpO1xuICAgIH0pO1xuICAgIGxldCBwcm9qZWN0cyA9IHRoaXMubWFpbi5nZXRQcm9qZWN0QWxsKCk7XG4gICAgZm9yIChsZXQgcHJvamVjdCBvZiBwcm9qZWN0cykge1xuICAgICAgbGV0IHByb2plY3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9qZWN0Lm9uU2FmZShFdmVudEVudW0uZGF0YUNoYW5nZSArICdfbmFtZScsICgpID0+IHtcbiAgICAgICAgcHJvamVjdEl0ZW0uaW5uZXJIVE1MID0gcHJvamVjdC5HZXQoJ25hbWUnKTtcbiAgICAgIH0pXG4gICAgICBwcm9qZWN0SXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdC1pZCcsIHByb2plY3QuR2V0KCdpZCcpKTtcbiAgICAgIHByb2plY3RJdGVtLmlubmVySFRNTCA9IHByb2plY3QuR2V0KCduYW1lJyk7XG4gICAgICBwcm9qZWN0SXRlbS5jbGFzc0xpc3QuYWRkKCdwcm9qZWN0LWl0ZW0nKTtcbiAgICAgIGlmICh0aGlzLm1haW4uY2hlY2tQcm9qZWN0T3Blbihwcm9qZWN0KSkge1xuICAgICAgICBwcm9qZWN0SXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICAgIHByb2plY3RJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1haW4uc2V0UHJvamVjdE9wZW4ocHJvamVjdCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuJGVsQm9ieT8uYXBwZW5kQ2hpbGQocHJvamVjdEl0ZW0pO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERvY2tCYXNlIHtcclxuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHByb3RlY3RlZCBlbENvbnRlbnQ6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcclxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnRG9ja0Jhc2UnO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIEJveEluZm8odGl0bGU6IHN0cmluZywgJGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ3ZzLWJveGluZm8nKTtcclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLWJveGluZm8nKTtcclxuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwidnMtYm94aW5mb19oZWFkZXJcIj48c3BhbiBjbGFzcz1cInZzLWJveGluZm9fdGl0bGVcIj4ke3RpdGxlfTwvc3Bhbj48c3BhbiBjbGFzcz1cInZzLWJveGluZm9fYnV0dG9uXCI+PC9zcGFuPjwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cInZzLWJveGluZm9fY29udGVudFwiPjwvZGl2PmA7XHJcbiAgICB0aGlzLmVsQ29udGVudCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2NvbnRlbnQnKTtcclxuICAgIGlmICgkY2FsbGJhY2spIHtcclxuICAgICAgJGNhbGxiYWNrKHRoaXMuZWxDb250ZW50KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgVG9vbGJveFZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1jb250cm9sJyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdDb250cm9sJywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBuZXcgVG9vbGJveFZpZXcobm9kZSwgdGhpcy5tYWluKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4sIGdldFRpbWUgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgVmFyaWFibGVWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBWYXJpYWJsZURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXZhcmlhYmxlJyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdWYXJpYWJsZScsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbmV3IFZhcmlhYmxlVmlldyhub2RlLCBtYWluKTtcbiAgICB9KTtcbiAgICBsZXQgJG5vZGVSaWdodDogSFRNTEVsZW1lbnQgfCBudWxsID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnZzLWJveGluZm9faGVhZGVyIC52cy1ib3hpbmZvX2J1dHRvbicpO1xuICAgIGlmICgkbm9kZVJpZ2h0KSB7XG4gICAgICAkbm9kZVJpZ2h0LmlubmVySFRNTCA9IGBgO1xuICAgICAgbGV0IGJ1dHRvbk5ldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uTmV3KTtcbiAgICAgIGJ1dHRvbk5ldy5pbm5lckhUTUwgPSBgTmV3IFZhcmlhYmxlYDtcbiAgICAgIGJ1dHRvbk5ldy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgdGhpcy5tYWluLm5ld1ZhcmlhYmxlKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFWaWV3LCBEYXRhRmxvdywgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XHJcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XHJcbiAgcHJpdmF0ZSBsYXN0RGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XHJcbiAgcHJpdmF0ZSBoaWRlS2V5czogc3RyaW5nW10gPSBbJ2xpbmVzJywgJ25vZGVzJywgJ2dyb3VwcycsICd2YXJpYWJsZScsICd4JywgJ3knLCAnem9vbSddO1xyXG4gIHByaXZhdGUgc29ydEtleXM6IHN0cmluZ1tdID0gWydpZCcsICdrZXknLCAnbmFtZScsICdncm91cCddO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcclxuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XHJcblxyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvcGVydHknKTtcclxuICAgIHRoaXMuQm94SW5mbygnUHJvcGVydHknLCAobm9kZTogSFRNTEVsZW1lbnQpID0+IHtcclxuICAgICAgbWFpbi5vbihFdmVudEVudW0uc2hvd1Byb3BlcnR5LCAoZGV0YWlsOiBhbnkpID0+IHtcclxuICAgICAgICB0aGlzLnJlbmRlclVJKG5vZGUsIGRldGFpbC5kYXRhKTtcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJVSShub2RlOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YUZsb3cpIHtcclxuICAgIGlmICh0aGlzLmxhc3REYXRhID09IGRhdGEpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XHJcbiAgICBub2RlLmlubmVySFRNTCA9ICcnO1xyXG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IGRhdGEuZ2V0UHJvcGVydGllcygpO1xyXG4gICAgdGhpcy5zb3J0S2V5cy5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAodGhpcy5oaWRlS2V5cy5pbmNsdWRlcyhrZXkpIHx8ICFwcm9wZXJ0aWVzW2tleV0pIHJldHVybjtcclxuICAgICAgbGV0IHByb3BlcnR5SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xyXG4gICAgICBsZXQgcHJvcGVydHlMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWxhYmVsJyk7XHJcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0ga2V5O1xyXG4gICAgICBsZXQgcHJvcGVydHlWYWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eVZhbHVlLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LXZhbHVlJyk7XHJcbiAgICAgIERhdGFWaWV3LkJpbmRFbGVtZW50KHByb3BlcnR5VmFsdWUsIGRhdGEsIHRoaXMubWFpbiwga2V5KTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlWYWx1ZSk7XHJcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJdGVtKTtcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKHRoaXMuaGlkZUtleXMuaW5jbHVkZXMoa2V5KSB8fCB0aGlzLnNvcnRLZXlzLmluY2x1ZGVzKGtleSkpIHJldHVybjtcclxuICAgICAgbGV0IHByb3BlcnR5SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xyXG4gICAgICBsZXQgcHJvcGVydHlMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWxhYmVsJyk7XHJcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0ga2V5O1xyXG4gICAgICBsZXQgcHJvcGVydHlWYWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eVZhbHVlLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LXZhbHVlJyk7XHJcbiAgICAgIERhdGFWaWV3LkJpbmRFbGVtZW50KHByb3BlcnR5VmFsdWUsIGRhdGEsIHRoaXMubWFpbiwga2V5KTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlWYWx1ZSk7XHJcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJdGVtKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBFdmVudEVudW0sIElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVmlld0RvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHByaXZhdGUgdmlldzogRGVzZ2luZXJWaWV3IHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcblxuICAgIHRoaXMudmlldyA9IG5ldyBEZXNnaW5lclZpZXcodGhpcy5lbE5vZGUsIG1haW4pO1xuXG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluLCB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBUYWJQcm9qZWN0VmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVGFiRG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgbmV3IFRhYlByb2plY3RWaWV3KHRoaXMuZWxOb2RlLCBtYWluKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4sIERvY2tFbnVtIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IENvbnRyb2xEb2NrIH0gZnJvbSBcIi4vQ29udHJvbERvY2tcIjtcbmltcG9ydCB7IFZhcmlhYmxlRG9jayB9IGZyb20gXCIuL1ZhcmlhYmxlRG9ja1wiO1xuaW1wb3J0IHsgUHJvamVjdERvY2sgfSBmcm9tIFwiLi9Qcm9qZWN0RG9ja1wiO1xuaW1wb3J0IHsgUHJvcGVydHlEb2NrIH0gZnJvbSBcIi4vUHJvcGVydHlEb2NrXCI7XG5pbXBvcnQgeyBWaWV3RG9jayB9IGZyb20gXCIuL1ZpZXdEb2NrXCI7XG5pbXBvcnQgeyBUYWJEb2NrIH0gZnJvbSBcIi4vVGFiRG9ja1wiO1xuXG5leHBvcnQgY2xhc3MgRG9ja01hbmFnZXIge1xuICBwcml2YXRlICRkb2NrTWFuYWdlcjogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikgeyB9XG4gIHB1YmxpYyByZXNldCgpIHtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IHt9O1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5sZWZ0LCBDb250cm9sRG9jayk7XG4gICAgLy90aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgUHJvamVjdERvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5yaWdodCwgUHJvcGVydHlEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0udmlldywgVmlld0RvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS50b3AsIFRhYkRvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5ib3R0b20sIFZhcmlhYmxlRG9jayk7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBhZGREb2NrKCRrZXk6IHN0cmluZywgJHZpZXc6IGFueSkge1xuICAgIGlmICghdGhpcy4kZG9ja01hbmFnZXJbJGtleV0pXG4gICAgICB0aGlzLiRkb2NrTWFuYWdlclska2V5XSA9IFtdO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gWy4uLnRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldLCAkdmlld107XG4gIH1cblxuICBwdWJsaWMgUmVuZGVyVUkoKSB7XG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInZzLWxlZnQgdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZzLWNvbnRlbnRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXRvcCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy12aWV3IHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLWJvdHRvbSB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1yaWdodCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgYDtcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRkb2NrTWFuYWdlcikuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBxdWVyeVNlbGVjdG9yID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLiR7a2V5fWApO1xuICAgICAgaWYgKHF1ZXJ5U2VsZWN0b3IpIHtcbiAgICAgICAgdGhpcy4kZG9ja01hbmFnZXJba2V5XS5mb3JFYWNoKCgkaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgbmV3ICRpdGVtKHF1ZXJ5U2VsZWN0b3IsIHRoaXMubWFpbik7XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsImV4cG9ydCBjb25zdCBDb250cm9sID0ge1xuICBub2RlX2JlZ2luOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXBsYXlcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdCZWdpbicsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGNsYXNzOiAnJyxcbiAgICBodG1sOiAnJyxcbiAgICBkb3Q6IHtcbiAgICAgIHRvcDogMCxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgbGVmdDogMCxcbiAgICAgIGJvdHRvbTogMSxcbiAgICB9LFxuICAgIG9ubHlOb2RlOiB0cnVlXG4gIH0sXG4gIG5vZGVfZW5kOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3BcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdFbmQnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnJyxcbiAgICBkb3Q6IHtcbiAgICAgIGxlZnQ6IDAsXG4gICAgICB0b3A6IDEsXG4gICAgICByaWdodDogMCxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIG9ubHlOb2RlOiB0cnVlXG4gIH0sXG4gIG5vZGVfaWY6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtZXF1YWxzXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnSWYnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnPGRpdj5jb25kaXRpb246PGJyLz48aW5wdXQgY2xhc3M9XCJub2RlLWZvcm0tY29udHJvbFwiIG5vZGU6bW9kZWw9XCJjb25kaXRpb25cIi8+PC9kaXY+JyxcbiAgICBzY3JpcHQ6IGBgLFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIGNvbmRpdGlvbjoge1xuICAgICAgICBrZXk6IFwiY29uZGl0aW9uXCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9XG4gICAgfSxcbiAgICBvdXRwdXQ6IDJcbiAgfSxcbiAgbm9kZV9ncm91cDoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdHcm91cCcsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48YnV0dG9uIGNsYXNzPVwiYnRuR29Hcm91cCBub2RlLWZvcm0tY29udHJvbFwiPkdvPC9idXR0b24+PC9kaXY+JyxcbiAgICBzY3JpcHQ6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsgbm9kZS5vcGVuR3JvdXAoKSB9KTtcbiAgICB9LFxuICAgIHByb3BlcnRpZXM6IHt9LFxuICAgIG91dHB1dDogMlxuICB9LFxuICBub2RlX29wdGlvbjoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdPcHRpb24nLFxuICAgIGRvdDoge1xuICAgICAgdG9wOiAxLFxuICAgICAgcmlnaHQ6IDAsXG4gICAgICBsZWZ0OiAxLFxuICAgICAgYm90dG9tOiAwLFxuICAgIH0sXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6IGBcbiAgICA8ZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAxXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMlwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDNcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDA0XCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwNVwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgPC9kaXY+XG4gICAgYCxcbiAgICBzY3JpcHQ6ICh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpID0+IHtcbiAgICAgIGVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsgbm9kZS5vcGVuR3JvdXAoKSB9KTtcbiAgICB9LFxuICAgIHByb3BlcnRpZXM6IHt9LFxuICAgIG91dHB1dDogMlxuICB9LFxuICBub2RlX3Byb2plY3Q6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnUHJvamVjdCcsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48c2VsZWN0IGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwicHJvamVjdFwiPjwvc2VsZWN0PjwvZGl2PicsXG4gICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG5cbiAgICB9LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHByb2plY3Q6IHtcbiAgICAgICAga2V5OiBcInByb2plY3RcIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgc2VsZWN0OiB0cnVlLFxuICAgICAgICBkYXRhU2VsZWN0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG1haW4uZ2V0UHJvamVjdEFsbCgpLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5HZXQoJ2lkJyksXG4gICAgICAgICAgICAgIHRleHQ6IGl0ZW0uR2V0KCduYW1lJylcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG5cbiAgICAgICAgfSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH1cbiAgICB9LFxuICB9LFxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIElNYWluLCBjb21wYXJlU29ydCwgRXZlbnRFbnVtLCBQcm9wZXJ0eUVudW0sIEV2ZW50RmxvdywgZ2V0VGltZSwgU2NvcGVSb290IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IE5vZGVJdGVtIH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBDb250cm9sIH0gZnJvbSBcIi4vY29udHJvbFwiO1xuXG5leHBvcnQgY2xhc3MgU3lzdGVtQmFzZSBpbXBsZW1lbnRzIElNYWluIHtcbiAgcHJpdmF0ZSAkZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gIHByaXZhdGUgJHByb2plY3RPcGVuOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSAkcHJvcGVydGllczogYW55ID0ge307XG4gIHByaXZhdGUgJGNvbnRyb2w6IGFueSA9IHt9O1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93ID0gbmV3IEV2ZW50RmxvdygpO1xuICBwcml2YXRlICRjb250cm9sQ2hvb3NlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSAkY2hlY2tPcHRpb246IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSAkZ3JvdXA6IGFueTtcbiAgcHJpdmF0ZSAkaW5kZXhQcm9qZWN0OiBudW1iZXIgPSAtMTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5zb2x1dGlvbl0gPSB7XG4gICAgICBpZDoge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgIH0sXG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gUHJvcGVydHlFbnVtLnNvbHV0aW9uXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBgc29sdXRpb24tJHtnZXRUaW1lKCl9YCxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0czoge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0ubGluZV0gPSB7XG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLmxpbmVcbiAgICAgIH0sXG4gICAgICBmcm9tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICBmcm9tSW5kZXg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHRvOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB0b0luZGV4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5tYWluXSA9IHtcbiAgICAgIGlkOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgfSxcbiAgICAgIG5hbWU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gYEZsb3cgJHt0aGlzLiRpbmRleFByb2plY3QrK31gLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubWFpblxuICAgICAgfSxcbiAgICAgIHZhcmlhYmxlOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgZ3JvdXBzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgbm9kZXM6IHtcbiAgICAgICAgZGVmYXVsdDogW11cbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLmdyb3VwQ2F2YXNdID0ge1xuICAgICAga2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFByb3BlcnR5RW51bS5ncm91cENhdmFzXG4gICAgICB9LFxuICAgICAgZ3JvdXA6IHtcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgICB4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB5OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB6b29tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgfVxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLnZhcmlhYmxlXSA9IHtcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0udmFyaWFibGVcbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGB2YXIke2dldFRpbWUoKX1gXG4gICAgICB9LFxuICAgICAgdHlwZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiAndGV4dCdcbiAgICAgIH0sXG4gICAgICBzY29wZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBTY29wZVJvb3RcbiAgICAgIH0sXG4gICAgICBpbml0YWxWYWx1ZToge1xuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfSxcbiAgICB9XG4gICAgdGhpcy5vblNhZmUoRXZlbnRFbnVtLmdyb3VwQ2hhbmdlLCAoeyBncm91cCB9OiBhbnkpID0+IHtcbiAgICAgIHRoaXMuJGdyb3VwID0gZ3JvdXA7XG4gICAgfSlcbiAgfVxuICBuZXdTb2x1dGlvbigkbmFtZTogc3RyaW5nID0gJycpOiB2b2lkIHtcbiAgICB0aGlzLiRpbmRleFByb2plY3QgPSAxO1xuICAgIHRoaXMub3BlblNvbHV0aW9uKHsgbmFtZTogJG5hbWUgfSk7XG4gIH1cbiAgb3BlblNvbHV0aW9uKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLiRkYXRhLkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLnNvbHV0aW9uKSk7XG4gICAgdGhpcy5vcGVuUHJvamVjdCh0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKT8uWzBdID8/IHt9KTtcbiAgfVxuICByZW1vdmVWYXJpYWJsZSh2YXJpYmFsZTogRGF0YUZsb3cpOiB2b2lkIHtcbiAgICB0aGlzLiRwcm9qZWN0T3Blbj8uUmVtb3ZlKCd2YXJpYWJsZScsIHZhcmliYWxlKTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2VWYXJpYWJsZSwgeyBkYXRhOiB2YXJpYmFsZSB9KTtcbiAgfVxuICBhZGRWYXJpYWJsZSgpOiBEYXRhRmxvdyB7XG4gICAgbGV0IHZhcmliYWxlID0gbmV3IERhdGFGbG93KHRoaXMsIHsga2V5OiBQcm9wZXJ0eUVudW0udmFyaWFibGUsIHNjb3BlOiB0aGlzLmdldEdyb3VwQ3VycmVudCgpPy5bMF0/LmlkIH0pO1xuICAgIHRoaXMuJHByb2plY3RPcGVuPy5BcHBlbmQoJ3ZhcmlhYmxlJywgdmFyaWJhbGUpO1xuICAgIHJldHVybiB2YXJpYmFsZTtcbiAgfVxuICBuZXdWYXJpYWJsZSgpOiBEYXRhRmxvdyB7XG4gICAgbGV0IHZhcmliYWxlID0gdGhpcy5hZGRWYXJpYWJsZSgpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCB7IGRhdGE6IHZhcmliYWxlIH0pO1xuICAgIHJldHVybiB2YXJpYmFsZTtcbiAgfVxuICBnZXRWYXJpYWJsZSgpOiBEYXRhRmxvd1tdIHtcbiAgICBsZXQgYXJyOiBhbnkgPSBbXTtcbiAgICBpZiAodGhpcy4kcHJvamVjdE9wZW4pIHtcbiAgICAgIGFyciA9IHRoaXMuJHByb2plY3RPcGVuLkdldChcInZhcmlhYmxlXCIpO1xuICAgICAgaWYgKCFhcnIpIHtcbiAgICAgICAgYXJyID0gW107XG4gICAgICAgIHRoaXMuJHByb2plY3RPcGVuLlNldCgndmFyaWFibGUnLCBhcnIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyLmZpbHRlcigoaXRlbTogYW55KSA9PiB0aGlzLmdldEdyb3VwQ3VycmVudCgpLmZpbmRJbmRleCgoX2dyb3VwOiBhbnkpID0+IF9ncm91cC5pZCA9PSBpdGVtLkdldCgnc2NvcGUnKSkgPiAtMSk7XG4gIH1cbiAgZ2V0R3JvdXBDdXJyZW50KCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuJGdyb3VwID8/IFtdO1xuICB9XG4gIGV4cG9ydEpzb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEudG9Kc29uKCk7XG4gIH1cbiAgcHVibGljIGNoZWNrSW5pdE9wdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kY2hlY2tPcHRpb247XG4gIH1cbiAgaW5pdE9wdGlvbihvcHRpb246IGFueSwgaXNEZWZhdWx0OiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuJGNoZWNrT3B0aW9uID0gdHJ1ZTtcbiAgICAvLyBzZXQgY29udHJvbFxuICAgIHRoaXMuJGNvbnRyb2wgPSBpc0RlZmF1bHQgPyB7IC4uLm9wdGlvbj8uY29udHJvbCB8fCB7fSwgLi4uQ29udHJvbCB9IDogeyAuLi5vcHRpb24/LmNvbnRyb2wgfHwge30gfTtcbiAgICBsZXQgY29udHJvbFRlbXA6IGFueSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMuJGNvbnRyb2wpLm1hcCgoa2V5KSA9PiAoeyAuLi50aGlzLiRjb250cm9sW2tleV0sIGtleSwgc29ydDogKHRoaXMuJGNvbnRyb2xba2V5XS5zb3J0ID09PSB1bmRlZmluZWQgPyA5OTk5OSA6IHRoaXMuJGNvbnRyb2xba2V5XS5zb3J0KSB9KSkuc29ydChjb21wYXJlU29ydCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICBjb250cm9sVGVtcFtpdGVtLmtleV0gPSB7XG4gICAgICAgIC4uLml0ZW0sXG4gICAgICAgIGRvdDoge1xuICAgICAgICAgIGxlZnQ6IDEsXG4gICAgICAgICAgdG9wOiAxLFxuICAgICAgICAgIHJpZ2h0OiAxLFxuICAgICAgICAgIGJvdHRvbTogMSxcbiAgICAgICAgICAuLi5pdGVtPy5kb3RcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHRoaXMuJHByb3BlcnRpZXNbYCR7aXRlbS5rZXl9YF0gPSB7XG4gICAgICAgIC4uLihpdGVtLnByb3BlcnRpZXMgfHwge30pLFxuICAgICAgICBpZDoge1xuICAgICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgICB9LFxuICAgICAgICBrZXk6IHtcbiAgICAgICAgICBkZWZhdWx0OiBpdGVtLmtleVxuICAgICAgICB9LFxuICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgZGVmYXVsdDogaXRlbS5rZXksXG4gICAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgeDoge1xuICAgICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgICAgfSxcbiAgICAgICAgeToge1xuICAgICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgICAgfSxcbiAgICAgICAgZ3JvdXA6IHtcbiAgICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgICB9LFxuICAgICAgICBsaW5lczoge1xuICAgICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSk7XG4gICAgdGhpcy4kY29udHJvbCA9IGNvbnRyb2xUZW1wO1xuICB9XG4gIHJlbmRlckh0bWwobm9kZTogTm9kZUl0ZW0sIGVsUGFyZW50OiBFbGVtZW50KSB7XG4gICAgZWxQYXJlbnQuaW5uZXJIVE1MID0gbm9kZS5nZXRPcHRpb24oKT8uaHRtbDtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29udHJvbEFsbCgpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbCA/PyB7fTtcbiAgfVxuICBnZXRQcm9qZWN0QWxsKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJykgPz8gW107XG4gIH1cbiAgaW1wb3J0SnNvbihkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Tb2x1dGlvbihkYXRhKTtcbiAgfVxuICBzZXRQcm9qZWN0T3BlbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuJHByb2plY3RPcGVuICE9ICRkYXRhKSB7XG4gICAgICB0aGlzLiRwcm9qZWN0T3BlbiA9ICRkYXRhO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XG4gICAgICAgIGRhdGE6ICRkYXRhXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwge1xuICAgICAgICBkYXRhOiAkZGF0YVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5vcGVuUHJvamVjdCwge1xuICAgICAgICBkYXRhOiAkZGF0YVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGNoZWNrUHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRwcm9qZWN0T3BlbiA9PSAkZGF0YTtcbiAgfVxuICBuZXdQcm9qZWN0KCk6IHZvaWQge1xuICAgIHRoaXMub3BlblByb2plY3Qoe30pO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLm5ld1Byb2plY3QsIHt9KTtcbiAgfVxuICBvcGVuUHJvamVjdCgkZGF0YTogYW55KTogdm9pZCB7XG4gICAgbGV0ICRwcm9qZWN0OiBhbnkgPSBudWxsO1xuICAgIGlmICgkZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAkcHJvamVjdCA9IHRoaXMuZ2V0UHJvamVjdEJ5SWQoJGRhdGEuR2V0KCdpZCcpKTtcbiAgICAgIGlmICghJHByb2plY3QpIHtcbiAgICAgICAgJHByb2plY3QgPSAkZGF0YTtcbiAgICAgICAgdGhpcy4kZGF0YS5BcHBlbmQoJ3Byb2plY3RzJywgJHByb2plY3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAkcHJvamVjdCA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgICAgICRwcm9qZWN0LkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLm1haW4pKTtcbiAgICAgIHRoaXMuJGRhdGEuQXBwZW5kKCdwcm9qZWN0cycsICRwcm9qZWN0KTtcbiAgICB9XG4gICAgdGhpcy5zZXRQcm9qZWN0T3BlbigkcHJvamVjdCk7XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RCeUlkKCRpZDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEuR2V0KCdwcm9qZWN0cycpLmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KCdpZCcpID09PSAkaWQpPy5bMF07XG4gIH1cbiAgc2V0Q29udHJvbENob29zZShrZXk6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLiRjb250cm9sQ2hvb3NlID0ga2V5O1xuICB9XG4gIGdldENvbnRyb2xDaG9vc2UoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuJGNvbnRyb2xDaG9vc2U7XG4gIH1cbiAgZ2V0Q29udHJvbEJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuJGNvbnRyb2xba2V5XSB8fCB7fTtcbiAgfVxuICBnZXRDb250cm9sTm9kZUJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRoaXMuZ2V0Q29udHJvbEJ5S2V5KGtleSksXG4gICAgICBwcm9wZXJ0aWVzOiB0aGlzLmdldFByb3BlcnR5QnlLZXkoYCR7a2V5fWApXG4gICAgfVxuICB9XG4gIGdldFByb3BlcnR5QnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvcGVydGllc1trZXldO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gJy4vY29yZS9pbmRleCc7XG5pbXBvcnQgeyBEb2NrTWFuYWdlciB9IGZyb20gJy4vZG9jay9Eb2NrTWFuYWdlcic7XG5pbXBvcnQgeyBTeXN0ZW1CYXNlIH0gZnJvbSAnLi9zeXN0ZW1zL1N5c3RlbUJhc2UnO1xuZXhwb3J0IGNsYXNzIFZpc3VhbEZsb3cge1xuICBwcml2YXRlIG1haW46IElNYWluIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlICRkb2NrTWFuYWdlcjogRG9ja01hbmFnZXI7XG4gIHB1YmxpYyBnZXREb2NrTWFuYWdlcigpOiBEb2NrTWFuYWdlciB7XG4gICAgcmV0dXJuIHRoaXMuJGRvY2tNYW5hZ2VyO1xuICB9XG4gIHB1YmxpYyBzZXRPcHRpb24oZGF0YTogYW55LCBpc0RlZmF1bHQ6IGJvb2xlYW4gPSB0cnVlKSB7XG4gICAgdGhpcy5tYWluPy5pbml0T3B0aW9uKGRhdGEsIGlzRGVmYXVsdCk7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIucmVzZXQoKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBtYWluOiBJTWFpbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIHRoaXMubWFpbiA9IG1haW4gPz8gbmV3IFN5c3RlbUJhc2UoKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IG5ldyBEb2NrTWFuYWdlcih0aGlzLmNvbnRhaW5lciwgdGhpcy5tYWluKTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlci5yZXNldCgpO1xuICB9XG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5tYWluPy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5tYWluPy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/LnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgdGhpcy5tYWluPy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgcHVibGljIGdldE1haW4oKTogSU1haW4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm1haW47XG4gIH1cbiAgbmV3U29sdXRpb24oJG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5uZXdTb2x1dGlvbigkbmFtZSk7XG4gIH1cbiAgb3BlblNvbHV0aW9uKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ub3BlblNvbHV0aW9uKCRkYXRhKTtcbiAgfVxuICBuZXdQcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ubmV3UHJvamVjdCgkbmFtZSk7XG4gIH1cbiAgb3BlblByb2plY3QoJG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5vcGVuUHJvamVjdCgkbmFtZSk7XG4gIH1cbiAgZ2V0UHJvamVjdEFsbCgpOiBhbnlbXSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TWFpbigpPy5nZXRQcm9qZWN0QWxsKCk7XG4gIH1cbiAgc2V0UHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5zZXRQcm9qZWN0T3BlbigkZGF0YSk7XG4gIH1cbiAgaW1wb3J0SnNvbihkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8uaW1wb3J0SnNvbihkYXRhKTtcbiAgfVxuICBleHBvcnRKc29uKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TWFpbigpPy5leHBvcnRKc29uKCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE5vZGVJdGVtIH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBTeXN0ZW1CYXNlIH0gZnJvbSBcIi4vU3lzdGVtQmFzZVwiO1xuZXhwb3J0IGNsYXNzIFN5c3RlbVZ1ZSBleHRlbmRzIFN5c3RlbUJhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSByZW5kZXI6IGFueSkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcmVuZGVySHRtbChub2RlOiBOb2RlSXRlbSwgZWxQYXJlbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAocGFyc2VJbnQodGhpcy5yZW5kZXIudmVyc2lvbikgPT09IDMpIHtcbiAgICAgIC8vVnVlIDNcbiAgICAgIGxldCB3cmFwcGVyID0gdGhpcy5yZW5kZXIuaChub2RlLmdldE9wdGlvbigpPy5odG1sLCB7IC4uLihub2RlLmdldE9wdGlvbigpPy5wcm9wcyA/PyB7fSksIG5vZGUgfSwgKG5vZGUuZ2V0T3B0aW9uKCk/Lm9wdGlvbnMgPz8ge30pKTtcbiAgICAgIHdyYXBwZXIuYXBwQ29udGV4dCA9IGVsUGFyZW50O1xuICAgICAgdGhpcy5yZW5kZXIucmVuZGVyKHdyYXBwZXIsIGVsUGFyZW50KTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBWdWUgMlxuICAgICAgbGV0IHdyYXBwZXIgPSBuZXcgdGhpcy5yZW5kZXIoe1xuICAgICAgICBwYXJlbnQ6IGVsUGFyZW50LFxuICAgICAgICByZW5kZXI6IChoOiBhbnkpID0+IGgobm9kZS5nZXRPcHRpb24oKT8uaHRtbCwgeyBwcm9wczogeyAuLi4obm9kZS5nZXRPcHRpb24oKT8ucHJvcHMgPz8ge30pLCBub2RlIH0gfSksXG4gICAgICAgIC4uLihub2RlLmdldE9wdGlvbigpPy5vcHRpb25zID8/IHt9KVxuICAgICAgfSkuJG1vdW50KClcbiAgICAgIC8vXG4gICAgICBlbFBhcmVudC5hcHBlbmRDaGlsZCh3cmFwcGVyLiRlbCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBkb3dubG9hZE9iamVjdEFzSnNvbiwgZ2V0VGltZSwgcmVhZEZpbGVMb2NhbCB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5pbXBvcnQgeyBQcm9qZWN0VmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9Qcm9qZWN0Vmlld1wiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgUHJvamVjdERvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb2plY3QnKTtcbiAgICB0aGlzLkJveEluZm8oJ1Byb2plY3QnLCAoZWxDb250ZW50OiBhbnkpID0+IHtcbiAgICAgIG5ldyBQcm9qZWN0VmlldyhlbENvbnRlbnQsIG1haW4pO1xuICAgIH0pO1xuICAgIGxldCAkbm9kZVJpZ2h0OiBIVE1MRWxlbWVudCB8IG51bGwgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19oZWFkZXIgLnZzLWJveGluZm9fYnV0dG9uJyk7XG4gICAgaWYgKCRub2RlUmlnaHQpIHtcbiAgICAgICRub2RlUmlnaHQuaW5uZXJIVE1MID0gYGA7XG4gICAgICBsZXQgYnV0dG9uTmV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidXR0b25OZXcuaW5uZXJIVE1MID0gYE5ld2A7XG4gICAgICBidXR0b25OZXcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLm1haW4ubmV3UHJvamVjdCgnJykpO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uTmV3KTtcblxuICAgICAgbGV0IGJ1dHRvbkV4cG9ydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uRXhwb3J0LmlubmVySFRNTCA9IGBFeHBvcnRgO1xuICAgICAgYnV0dG9uRXhwb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gZG93bmxvYWRPYmplY3RBc0pzb24odGhpcy5tYWluLmV4cG9ydEpzb24oKSwgYHZzLXNvbHV0aW9uLSR7Z2V0VGltZSgpfWApKTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbkV4cG9ydCk7XG5cbiAgICAgIGxldCBidXR0b25JbXBvcnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ1dHRvbkltcG9ydC5pbm5lckhUTUwgPSBgSW1wb3J0YDtcbiAgICAgIGJ1dHRvbkltcG9ydC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgcmVhZEZpbGVMb2NhbCgocnM6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChycykge1xuICAgICAgICAgICAgdGhpcy5tYWluLmltcG9ydEpzb24oSlNPTi5wYXJzZShycykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbkltcG9ydCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBWaXN1YWxGbG93IH0gZnJvbSBcIi4vVmlzdWFsRmxvd1wiO1xuaW1wb3J0ICogYXMgU3lzdGVtQmFzZSBmcm9tIFwiLi9zeXN0ZW1zL2luZGV4XCI7XG5pbXBvcnQgKiBhcyBDb3JlIGZyb20gJy4vY29yZS9pbmRleCc7XG5pbXBvcnQgKiBhcyBEZXNnaW5lciBmcm9tIFwiLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0ICogYXMgRG9jayBmcm9tICcuL2RvY2svaW5kZXgnO1xuZXhwb3J0IGRlZmF1bHQge1xuICBWaXN1YWxGbG93LFxuICAuLi5TeXN0ZW1CYXNlLFxuICAuLi5Db3JlLFxuICAuLi5Eb2NrLFxuICAuLi5EZXNnaW5lclxufTtcblxuIl0sIm5hbWVzIjpbIlN5c3RlbUJhc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0lBQU8sTUFBTSxTQUFTLEdBQUc7SUFDdkIsSUFBQSxJQUFJLEVBQUUsTUFBTTtJQUNaLElBQUEsVUFBVSxFQUFFLFlBQVk7SUFDeEIsSUFBQSxZQUFZLEVBQUUsY0FBYztJQUM1QixJQUFBLFdBQVcsRUFBRSxhQUFhO0lBQzFCLElBQUEsVUFBVSxFQUFFLFlBQVk7SUFD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
