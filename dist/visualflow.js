
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow.js v0.0.7
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
        setGroup: "setGroup",
        zoom: "zoom",
        runProject: "runProject",
        stopProject: "stopProject",
        statusBot: "statusBot",
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

    const LOG = (message, ...optionalParams) => console.log(message, optionalParams);
    const getDate = () => (new Date());
    const getTime = () => getDate().getTime();
    const getNameTime = (name) => `${name}${getDate().getTime().toString().substring(5)}`;
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
        Increase(key, max = undefined) {
            if (!max || (max > this.data[key]))
                this.Set(key, ++this.data[key]);
        }
        Decrease(key, min = undefined) {
            if (!min || (min < this.data[key]))
                this.Set(key, --this.data[key]);
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
                const funcSetValue = (key, value) => {
                    let valueSet = value;
                    if (isFunction(value)) {
                        valueSet = value();
                    }
                    if (Array.isArray(valueSet)) {
                        valueSet = valueSet.map((item) => {
                            if (item.key) {
                                return new DataFlow(this.property, item);
                            }
                            return item;
                        });
                    }
                    else if (valueSet?.key) {
                        valueSet = new DataFlow(this.property, valueSet);
                    }
                    this.data[key] = valueSet;
                    this.BindEvent(this.data[key], key);
                };
                for (let key of Object.keys(this.properties)) {
                    const property = this.properties[key];
                    if (property.sub && data) {
                        for (let field of Object.keys(data)) {
                            if (field.startsWith(key)) {
                                funcSetValue(field, data?.[field] ?? this.properties[key]?.default);
                            }
                        }
                    }
                    else {
                        funcSetValue(key, data?.[key] ?? this.properties[key]?.default);
                    }
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
            const setRS = (key) => {
                let valueRS = this.Get(key);
                if (valueRS instanceof DataFlow) {
                    rs[key] = valueRS.toJson();
                }
                else if (Array.isArray(valueRS)) {
                    rs[key] = valueRS.map((item) => {
                        if (item instanceof DataFlow) {
                            return item.toJson();
                        }
                        return item;
                    });
                }
                else {
                    rs[key] = valueRS;
                }
            };
            for (let key of Object.keys(this.properties)) {
                const property = this.properties[key];
                if (property.sub) {
                    for (let field of Object.keys(this.data)) {
                        if (field.startsWith(key)) {
                            setRS(field);
                        }
                    }
                }
                else {
                    setRS(key);
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
            if (this.nodeEditor) {
                this.nodeEditor.addEventListener('click', (e) => {
                    if (e.target.classList.contains('sug-variable-item')) {
                        this.setVar(e.target.innerText);
                    }
                });
            }
            if (this.keyName)
                this.bindData();
        }
        setVar(name) {
            let selectionStart = this.elNode.selectionStart;
            if (this.property?.var) {
                this.setNodeValue(name);
            }
            else {
                let txt = this.elNode.value;
                let startIndex = txt.lastIndexOf("${", selectionStart);
                this.setNodeValue(`${txt.substring(0, startIndex)}\${${name}}${txt.substring(selectionStart, txt.length)}`);
            }
            setTimeout(() => {
                this.elNode?.focus();
                this.showSuggestions(false);
                this.elNode.selectionStart = selectionStart + name.length;
                this.bindEvent();
            });
        }
        checkShowSuggestions() {
            var arr = this.main.getVariable();
            if (!arr || arr.length == 0) {
                this.showSuggestions(false);
                return;
            }
            let txt = this.elNode.value;
            let selectionStart = this.elNode.selectionStart;
            let subTxt = "";
            let startIndex = 0;
            if (txt) {
                if (this.property?.var) {
                    subTxt = txt;
                    this.showSuggestions(true);
                }
                else {
                    startIndex = txt.lastIndexOf("${", selectionStart);
                    let endIndex = txt.lastIndexOf("}", selectionStart);
                    if (endIndex < startIndex) {
                        subTxt = txt.substring(startIndex + 2, selectionStart);
                        this.showSuggestions(true);
                    }
                    else {
                        this.showSuggestions(false);
                        return;
                    }
                }
            }
            if (this.elSuggestionsContent) {
                let elList = document.createElement('div');
                let flg = false;
                console.log(subTxt);
                for (let item of arr) {
                    const name = item.Get('name');
                    if (subTxt && !name.startsWith(subTxt))
                        continue;
                    let elItem = document.createElement('button');
                    elItem.innerHTML = name;
                    elItem.classList.add('sug-variable-item');
                    elList.appendChild(elItem);
                    flg = true;
                }
                this.elSuggestionsContent.appendChild(elList);
                if (!flg) {
                    this.showSuggestions(false);
                    return;
                }
                this.suggestionIndex = 0;
                this.setSuggestionIndex(0);
            }
        }
        showSuggestions(flg = true) {
            if (!this.elSuggestions)
                return;
            if (this.elSuggestionsContent)
                this.elSuggestionsContent.innerHTML = '';
            if (flg) {
                this.elSuggestions.removeAttribute('style');
            }
            else {
                this.elSuggestions.setAttribute('style', 'display:none;');
            }
        }
        elFocus = false;
        regexValidate = null;
        suggestionIndex = 0;
        setSuggestionIndex(index) {
            if (!this.elSuggestions)
                return;
            let temp = (this.suggestionIndex + index);
            if (0 > temp || temp >= this.elSuggestions.querySelectorAll('.sug-variable-item').length - 1)
                return;
            this.suggestionIndex = temp;
            this.elSuggestions.querySelectorAll('.sug-variable-item').forEach((item, itemIndex) => {
                item.classList.remove('active');
                if (itemIndex == this.suggestionIndex) {
                    item.classList.add('active');
                }
            });
        }
        bindData() {
            if (this.keyName && this.elNode) {
                if (this.property?.validate) {
                    this.regexValidate = new RegExp(this.property.validate, 'i');
                }
                this.data.on(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
                // this.elNode.addEventListener('change', this.bindEvent.bind(this));
                this.elNode.addEventListener('keydown', (e) => {
                    var charCode = (e.which) ? e.which : e.keyCode;
                    if (charCode == 13 && this.suggestionIndex > -1) {
                        let nameVar = this.elSuggestions?.querySelector('.active')?.innerHTML;
                        if (nameVar) {
                            this.setVar(nameVar);
                        }
                        e.preventDefault();
                        e.returnValue = false;
                        e.cancelBubble = true;
                        return false;
                    }
                    if (charCode == 38) { // Up
                        this.setSuggestionIndex(-1);
                        e.preventDefault();
                        e.returnValue = false;
                        e.cancelBubble = true;
                        return false;
                    }
                    if (charCode == 40) { // Down
                        this.setSuggestionIndex(1);
                        e.preventDefault();
                        e.returnValue = false;
                        e.cancelBubble = true;
                        return false;
                    }
                    this.bindEvent();
                });
                this.elNode.addEventListener('paste', (e) => {
                    if (this.regexValidate && !this.regexValidate.test(e.clipboardData.getData('Text'))) {
                        e.preventDefault();
                        e.returnValue = false;
                        e.cancelBubble = true;
                        return false;
                    }
                });
                this.elNode.addEventListener('keypress', (e) => {
                    var charCode = (e.which) ? e.which : e.keyCode;
                    if (this.regexValidate && !this.regexValidate.test(String.fromCharCode(charCode))) {
                        e.stopPropagation();
                        e.preventDefault();
                        e.returnValue = false;
                        e.cancelBubble = true;
                        return false;
                    }
                });
                this.elNode.addEventListener('focus', () => {
                    this.elFocus = true;
                    this.suggestionIndex = 0;
                    if (this.elSuggestions)
                        this.elNode?.parentElement?.appendChild(this.elSuggestions);
                });
                this.elNode.setAttribute('autocomplete', 'off');
                this.elNode.addEventListener('blur', () => {
                    this.elFocus = false;
                    setTimeout(() => {
                        if (this.elSuggestions && !this.elFocus) {
                            this.elNode?.parentElement?.removeChild?.(this.elSuggestions);
                            this.suggestionIndex = -1;
                        }
                    }, 500);
                });
                this.elNode.addEventListener("select", () => {
                    this.checkShowSuggestions();
                });
                if (this.elNode && this.property && this.property.select && isFunction(this.property.dataSelect)) {
                    if (this.property.selectNone) {
                        let option = document.createElement('option');
                        option.value = '';
                        option.text = this.property.selectNone;
                        this.elNode?.appendChild(option);
                        this.elNode.value = '';
                    }
                    this.property.dataSelect({ elNode: this.elNode, main: this.main, key: this.keyName }).forEach((item) => {
                        let option = document.createElement('option');
                        option.value = item.value;
                        option.text = item.text;
                        this.elNode?.appendChild(option);
                    });
                }
                if (this.property && isFunction(this.property.script)) {
                    this.property.script({ elNode: this.elNode, main: this.main, key: this.keyName });
                }
                this.setNodeValue(this.data.Get(this.keyName) ?? '');
            }
        }
        setNodeValue(value) {
            if (this.elNode) {
                if (TagView.includes(this.elNode.tagName)) {
                    this.elNode.innerText = `${value ?? ""}`;
                }
                else {
                    this.elNode.value = value;
                }
            }
        }
        bindInput({ value, sender }) {
            if (sender !== this && this.elNode && sender?.elNode !== this.elNode) {
                this.setNodeValue(value ?? "");
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
        IncreaseValue(name, max = undefined) {
            return this.data.Increase(name, max);
        }
        DecreaseValue(name, min = undefined) {
            return this.data.Decrease(name, min);
        }
        getDataValue(name) {
            return this.data.Get(name);
        }
        setDataValue(name, value) {
            return this.data.Set(name, value, this);
        }
        getName() {
            return this.getDataValue('name');
        }
        getY() {
            return +this.getDataValue('y');
        }
        setY(value) {
            return this.setDataValue('y', value);
        }
        getX() {
            return +this.getDataValue('x');
        }
        setX(value) {
            return this.setDataValue('x', value);
        }
        CheckKey(key) {
            return this.getDataValue('key') == key;
        }
        getDataLine() {
            return this.getDataValue('lines') ?? [];
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
        temp = new DataFlow();
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
            if (document.activeElement && this.elNode.contains(document.activeElement) && !['BUTTON', 'A'].includes(document.activeElement.tagName))
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
            this.parent.main.renderHtml({ node: this, elNode: this.elContent, main: this.parent.main });
            this.UpdateUI();
            this.arrDataView.forEach((item) => item.Delete());
            if (isFunction(this.option.script)) {
                this.option.script({ node: this, elNode: this.elContent, main: this.parent.main });
            }
            if (this.elContent)
                this.arrDataView = DataView.BindElement(this.elContent, this.data, this.parent.main);
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
                dataGroup.onSafe(`${EventEnum.dataChange}_name`, () => {
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
            this.elNode.appendChild(this.elCanvas);
            this.elNode.tabIndex = 0;
            new DesginerView_Event(this);
            this.on(EventEnum.dataChange, this.RenderUI.bind(this));
            this.on(EventEnum.showProperty, (data) => { main.dispatch(EventEnum.showProperty, data); });
            this.main.on(EventEnum.openProject, (item) => {
                this.Open(item.data);
            });
            this.main.on(EventEnum.zoom, ({ zoom }) => {
                if (zoom == 0) {
                    this.zoom_reset();
                }
                else if (zoom == 1) {
                    this.zoom_out();
                }
                else if (zoom == -1) {
                    this.zoom_in();
                }
                this.UpdateUI();
            });
            this.main.on(EventEnum.setGroup, ({ groupId }) => {
                this.BackGroup(groupId);
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
        $btnZoomIn;
        $btnZoomOut;
        $btnZoomReset;
        $btnRunProject;
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
      <div class="tab-project_button">
        <button class="btn-run-project"><i class="fas fa-play"></i> Run</button>
      </div>
      <div class="tab-project_button">
        <button class="btn-zoom-in"><i class="fas fa-search-plus"></i></button>
      </div>
      <div class="tab-project_button">
        <button class="btn-zoom-out"><i class="fas fa-search-minus"></i></button>
      </div>
      <div class="tab-project_button">
        <button class="btn-zoom-reset"><i class="fas fa-redo"></i></button>
      </div>
    </div>
    `;
            this.$elWarp = this.elNode.querySelector('.tab-project_warp');
            this.$elBoby = this.elNode.querySelector('.tab-project__body');
            this.$btnBack = this.elNode.querySelector('.btn-back');
            this.$btnNext = this.elNode.querySelector('.btn-next');
            this.$btnAdd = this.elNode.querySelector('.btn-add');
            this.$btnZoomIn = this.elNode.querySelector('.btn-zoom-in');
            this.$btnZoomOut = this.elNode.querySelector('.btn-zoom-out');
            this.$btnZoomReset = this.elNode.querySelector('.btn-zoom-reset');
            this.$btnRunProject = this.elNode.querySelector('.btn-run-project');
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
            this.$btnZoomIn?.addEventListener('click', () => {
                this.main.dispatch(EventEnum.zoom, { zoom: -1 });
            });
            this.$btnZoomOut?.addEventListener('click', () => {
                this.main.dispatch(EventEnum.zoom, { zoom: 1 });
            });
            this.$btnZoomReset?.addEventListener('click', () => {
                this.main.dispatch(EventEnum.zoom, { zoom: 0 });
            });
            this.main.on(EventEnum.statusBot, (flg) => {
                if (this.$btnRunProject) {
                    if (flg) {
                        this.$btnRunProject.innerHTML = `<i class="fas fa-stop"></i> Stop`;
                    }
                    else {
                        this.$btnRunProject.innerHTML = `<i class="fas fa-play"></i> Run`;
                    }
                }
            });
            this.$btnRunProject?.addEventListener('click', () => {
                if (this.main.running()) {
                    console.log('stop');
                    this.main.stopProject();
                }
                else {
                    console.log('run');
                    this.main.runProject();
                }
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

    class BreadcrumbGroupView {
        elNode;
        main;
        constructor(elNode, main) {
            this.elNode = elNode;
            this.main = main;
            this.elNode.classList.add('vs-breadcrumb-group');
            this.main.on(EventEnum.groupChange, ({ group }) => {
                this.render(group);
            });
            this.elNode.innerHTML = '';
        }
        render(group) {
            this.elNode.innerHTML = '';
            if (!this.elNode || !group)
                return;
            let elUL = document.createElement('ul');
            let isFirst = true;
            group.forEach((item) => {
                if (!isFirst) {
                    let elLI2 = document.createElement('li');
                    elLI2.innerHTML = ">";
                    elUL.prepend(elLI2);
                }
                let elLI = document.createElement('li');
                elLI.innerHTML = item.text;
                elLI.addEventListener('click', () => this.setGroupId(item.id));
                elLI.classList.add('group-item');
                elUL.prepend(elLI);
                isFirst = false;
            });
            let elWarp = document.createElement('div');
            elWarp.classList.add('group-warp');
            let elBody = document.createElement('div');
            elBody.classList.add('group-body');
            elWarp.appendChild(elBody);
            elBody.appendChild(elUL);
            if (group.length > 1) {
                let elButtunDiv = document.createElement('div');
                elButtunDiv.classList.add('group-button');
                elButtunDiv.innerHTML = `<button><i class="fas fa-redo"></i></button>`;
                elButtunDiv.addEventListener('click', () => this.setGroupId(group[1].id));
                this.elNode.appendChild(elButtunDiv);
            }
            this.elNode.appendChild(elWarp);
        }
        setGroupId(groupId) {
            this.main.dispatch(EventEnum.setGroup, { groupId });
        }
    }

    class PropertyView {
        elNode;
        main;
        lastData;
        hideKeys = ['lines', 'nodes', 'groups', 'variable', 'x', 'y', 'zoom'];
        sortKeys = ['id', 'key', 'name', 'group'];
        constructor(elNode, main) {
            this.elNode = elNode;
            this.main = main;
            this.elNode.classList.add('vs-property-view');
            this.main.on(EventEnum.showProperty, (detail) => {
                this.Render(detail.data);
            });
        }
        Render(data) {
            if (this.lastData == data) {
                return;
            }
            this.lastData = data;
            this.elNode.innerHTML = '';
            let properties = data.getProperties();
            this.sortKeys.forEach((key) => {
                if (this.hideKeys.includes(key) || !properties[key] || properties[key].hide)
                    return;
                let propertyItem = document.createElement('div');
                propertyItem.classList.add('property-item');
                let propertyLabel = document.createElement('div');
                propertyLabel.classList.add('property-label');
                propertyLabel.innerHTML = properties[key].text ?? key;
                let propertyValue = document.createElement('div');
                propertyValue.classList.add('property-value');
                DataView.BindElement(propertyValue, data, this.main, key);
                propertyItem.appendChild(propertyLabel);
                propertyItem.appendChild(propertyValue);
                this.elNode.appendChild(propertyItem);
            });
            Object.keys(properties).forEach((key) => {
                if (this.hideKeys.includes(key) || this.sortKeys.includes(key) || !properties[key] || properties[key].hide)
                    return;
                let propertyItem = document.createElement('div');
                propertyItem.classList.add('property-item');
                let propertyLabel = document.createElement('div');
                propertyLabel.classList.add('property-label');
                propertyLabel.innerHTML = properties[key].text ?? key;
                let propertyValue = document.createElement('div');
                propertyValue.classList.add('property-value');
                DataView.BindElement(propertyValue, data, this.main, key);
                propertyItem.appendChild(propertyLabel);
                propertyItem.appendChild(propertyValue);
                this.elNode.appendChild(propertyItem);
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
        ProjectView: ProjectView,
        TabProjectView: TabProjectView,
        BreadcrumbGroupView: BreadcrumbGroupView,
        PropertyView: PropertyView
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
                    this.main.newVariable(undefined, undefined, undefined);
                });
            }
        }
    }

    class PropertyDock extends DockBase {
        main;
        constructor(container, main) {
            super(container, main);
            this.main = main;
            this.elNode.classList.add('vs-property');
            this.BoxInfo('Property', (node) => {
                new PropertyView(node, main);
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

    class BreadcrumbGroupDock extends DockBase {
        main;
        constructor(container, main) {
            super(container, main);
            this.main = main;
            new BreadcrumbGroupView(this.elNode, main);
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
            this.addDock(DockEnum.top, TabDock);
            this.addDock(DockEnum.bottom, BreadcrumbGroupDock);
            this.addDock(DockEnum.bottom, VariableDock);
            this.addDock(DockEnum.view, ViewDock);
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
            class: 'vs-content-flex',
            html: `<div>
              <div class="node-content-row"><span style="text-align:right">Then</span><span><span class="node-dot" node="50001"></span></span></div>
              <div class="node-content-row"><span style="text-align:right">Then</span><span><span class="node-dot" node="50002"></span></span></div>
              <div class="node-content-row"><span style="text-align:right">Then</span><span><span class="node-dot" node="50003"></span></span></div>
              <div class="node-content-row"><span style="text-align:right">Then</span><span><span class="node-dot" node="50004"></span></span></div>
              <div class="node-content-row"><span style="text-align:right">Then</span><span><span class="node-dot" node="50005"></span></span></div>
              <div class="node-content-row"><span style="text-align:right">Then</span><span><span class="node-dot" node="50006"></span></span></div>
              <div class="node-content-row"><span style="text-align:right">Then</span><span><span class="node-dot" node="50007"></span></span></div>
              <div class="node-content-row"><span style="text-align:right">Else</span><span><span class="node-dot" node="50008"></span></span></div>
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
        temp = new DataFlow();
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
                    default: () => getNameTime('solution-'),
                    edit: true,
                },
                project: {
                    default: () => ``,
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
                    default: () => getNameTime('var')
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
        addVariable(name = undefined, scope = null, initalValue = null) {
            let varibale = new DataFlow(this, { name, initalValue, key: PropertyEnum.variable, scope: scope ?? this.getGroupCurrent()?.[0]?.id });
            this.$projectOpen?.Append('variable', varibale);
            return varibale;
        }
        newVariable(name = undefined, scope = null, initalValue = null) {
            let varibale = this.addVariable(name, scope, initalValue);
            this.dispatch(EventEnum.changeVariable, { data: varibale });
            return varibale;
        }
        changeVariableName(old_name, new_name, scope) {
            let variable = this.$projectOpen?.Get('variable');
            if (variable) {
                for (let item of variable) {
                    if (item.Get('name') == old_name && item.Get('scope') == scope) {
                        item.Set('name', new_name);
                        this.dispatch(EventEnum.changeVariable, { data: item });
                    }
                }
            }
        }
        tempVariable(env_name, name, nodeId) {
            const temp_env_name = `temp_${nodeId}_${env_name}`;
            const temp_value = this.temp.Get(temp_env_name);
            if (!temp_value) {
                this.temp.Set(temp_env_name, name);
                this.newVariable(name, nodeId);
            }
            else if (name != temp_value) {
                this.changeVariableName(temp_value, name, nodeId);
                this.temp.Set(temp_env_name, name);
            }
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
        renderHtml({ elNode, main, node }) {
            if (isFunction(node.getOption()?.html)) {
                elNode.innerHTML = node.getOption()?.html?.({ elNode, main, node });
            }
            else {
                elNode.innerHTML = node.getOption()?.html;
            }
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
                this.$data.Set('project', this.$projectOpen?.Get('id'));
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
        $running = false;
        running() {
            return this.$running;
        }
        setRunning(flg) {
            this.$running = flg;
            this.dispatch(EventEnum.statusBot, flg);
        }
        callbackRunProject(callbackRun) {
            this.on(EventEnum.runProject, ({ data }) => {
                callbackRun?.(data);
            });
        }
        callbackStopProject(callbackRun) {
            this.on(EventEnum.stopProject, () => {
                callbackRun();
            });
        }
        runProject() {
            this.setRunning(true);
            this.dispatch(EventEnum.runProject, { data: this.exportJson() });
        }
        stopProject() {
            this.dispatch(EventEnum.stopProject, {});
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
        callbackRunProject(callbackRun) {
            this.getMain()?.callbackRunProject(callbackRun);
        }
        callbackStopProject(callbackRun) {
            this.getMain()?.callbackStopProject(callbackRun);
        }
        setRunning(flg) {
            this.getMain()?.setRunning(flg);
        }
    }

    class SystemVue extends SystemBase$1 {
        render;
        constructor(render) {
            super();
            this.render = render;
        }
        renderHtml({ elNode, main, node }) {
            if (parseInt(this.render.version) === 3) {
                //Vue 3
                let wrapper = this.render.h(node.getOption()?.html, { ...(node.getOption()?.props ?? {}), node }, (node.getOption()?.options ?? {}));
                wrapper.appContext = elNode;
                this.render.render(wrapper, elNode);
            }
            else {
                // Vue 2
                let wrapper = new this.render({
                    parent: elNode,
                    render: (h) => h(node.getOption()?.html, { props: { ...(node.getOption()?.props ?? {}), node } }),
                    ...(node.getOption()?.options ?? {})
                }).$mount();
                //
                elNode.appendChild(wrapper.$el);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvQ29uc3RhbnQudHMiLCIuLi9zcmMvY29yZS9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29yZS9VdGlscy50cyIsIi4uL3NyYy9jb3JlL0RhdGFGbG93LnRzIiwiLi4vc3JjL2NvcmUvQmFzZUZsb3cudHMiLCIuLi9zcmMvY29yZS9EYXRhVmlldy50cyIsIi4uL3NyYy9kZXNnaW5lci9MaW5lLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld19FdmVudC50cyIsIi4uL3NyYy9kZXNnaW5lci9Ob2RlSXRlbS50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXcudHMiLCIuLi9zcmMvZGVzZ2luZXIvVmFyaWFibGVWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1Rvb2xib3hWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1Byb2plY3RWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1RhYlByb2plY3RWaWV3LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0JyZWFkY3J1bWJHcm91cFZpZXcudHMiLCIuLi9zcmMvZGVzZ2luZXIvUHJvcGVydHlWaWV3LnRzIiwiLi4vc3JjL2RvY2svRG9ja0Jhc2UudHMiLCIuLi9zcmMvZG9jay9Db250cm9sRG9jay50cyIsIi4uL3NyYy9kb2NrL1ZhcmlhYmxlRG9jay50cyIsIi4uL3NyYy9kb2NrL1Byb3BlcnR5RG9jay50cyIsIi4uL3NyYy9kb2NrL1ZpZXdEb2NrLnRzIiwiLi4vc3JjL2RvY2svVGFiRG9jay50cyIsIi4uL3NyYy9kb2NrL0JyZWFkY3J1bWJHcm91cERvY2sudHMiLCIuLi9zcmMvZG9jay9Eb2NrTWFuYWdlci50cyIsIi4uL3NyYy9zeXN0ZW1zL2NvbnRyb2wudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1CYXNlLnRzIiwiLi4vc3JjL1Zpc3VhbEZsb3cudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1WdWUudHMiLCIuLi9zcmMvZG9jay9Qcm9qZWN0RG9jay50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgRXZlbnRFbnVtID0ge1xuICBpbml0OiBcImluaXRcIixcbiAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXG4gIHNob3dQcm9wZXJ0eTogXCJzaG93UHJvcGVydHlcIixcbiAgb3BlblByb2plY3Q6IFwib3BlblByb2plY3RcIixcbiAgbmV3UHJvamVjdDogXCJuZXdQcm9qZWN0XCIsXG4gIGNoYW5nZVZhcmlhYmxlOiBcImNoYW5nZVZhcmlhYmxlXCIsXG4gIGNoYW5nZTogXCJjaGFuZ2VcIixcbiAgZGlzcG9zZTogXCJkaXNwb3NlXCIsXG4gIGdyb3VwQ2hhbmdlOiBcImdyb3VwQ2hhbmdlXCIsXG4gIHNldEdyb3VwOiBcInNldEdyb3VwXCIsXG4gIHpvb206IFwiem9vbVwiLFxuICBydW5Qcm9qZWN0OiBcInJ1blByb2plY3RcIixcbiAgc3RvcFByb2plY3Q6IFwic3RvcFByb2plY3RcIixcbiAgc3RhdHVzQm90OiBcInN0YXR1c0JvdFwiLFxufVxuXG5leHBvcnQgY29uc3QgRG9ja0VudW0gPSB7XG4gIGxlZnQ6IFwidnMtbGVmdFwiLFxuICB0b3A6IFwidnMtdG9wXCIsXG4gIHZpZXc6IFwidnMtdmlld1wiLFxuICBib3R0b206IFwidnMtYm90dG9tXCIsXG4gIHJpZ2h0OiBcInZzLXJpZ2h0XCIsXG59XG5cbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnLFxuICBncm91cENhdmFzOiBcIm1haW5fZ3JvdXBDYXZhc1wiLFxufTtcblxuZXhwb3J0IGNvbnN0IFNjb3BlUm9vdCA9IFwicm9vdFwiO1xuIiwiaW1wb3J0IHsgSUV2ZW50IH0gZnJvbSBcIi4vSUZsb3dcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFdmVudEZsb3cgaW1wbGVtZW50cyBJRXZlbnQge1xyXG4gIHByaXZhdGUgZXZlbnRzOiBhbnkgPSB7fTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgfVxyXG4gIHB1YmxpYyBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgdGhpcy5vbihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICAvKiBFdmVudHMgKi9cclxuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uXHJcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXHJcbiAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgZXZlbnQgbmFtZSBtdXN0IGJlIGEgc3RyaW5nLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBldmVudH1gKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXHJcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xyXG4gICAgICAgIGxpc3RlbmVyczogW11cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuXHJcbiAgICBpZiAoIXRoaXMuZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlXHJcblxyXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVyc1xyXG4gICAgY29uc3QgbGlzdGVuZXJJbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKVxyXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcclxuICAgIGlmIChoYXNMaXN0ZW5lcikgbGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXHJcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XHJcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiIsImV4cG9ydCBjb25zdCBMT0cgPSAobWVzc2FnZT86IGFueSwgLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiBjb25zb2xlLmxvZyhtZXNzYWdlLCBvcHRpb25hbFBhcmFtcyk7XG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IChuZXcgRGF0ZSgpKTtcbmV4cG9ydCBjb25zdCBnZXRUaW1lID0gKCkgPT4gZ2V0RGF0ZSgpLmdldFRpbWUoKTtcbmV4cG9ydCBjb25zdCBnZXROYW1lVGltZSA9IChuYW1lOiBzdHJpbmcpID0+IGAke25hbWV9JHtnZXREYXRlKCkuZ2V0VGltZSgpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDUpfWA7XG5leHBvcnQgY29uc3QgZ2V0VXVpZCA9ICgpID0+IHtcbiAgLy8gaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvcmZjNDEyMi50eHRcbiAgbGV0IHM6IGFueSA9IFtdO1xuICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzY7IGkrKykge1xuICAgIHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApLCAxKTtcbiAgfVxuICBzWzE0XSA9IFwiNFwiOyAgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG4gIHNbMTldID0gaGV4RGlnaXRzLnN1YnN0cigoc1sxOV0gJiAweDMpIHwgMHg4LCAxKTsgIC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG4gIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcbiAgcmV0dXJuIHV1aWQ7XG59XG5cbmV4cG9ydCBjb25zdCBjb21wYXJlU29ydCA9IChhOiBhbnksIGI6IGFueSkgPT4ge1xuICBpZiAoYS5zb3J0IDwgYi5zb3J0KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmIChhLnNvcnQgPiBiLnNvcnQpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmV4cG9ydCBjb25zdCBpc0Z1bmN0aW9uID0gKGZuOiBhbnkpID0+IHtcbiAgcmV0dXJuIGZuICYmIGZuIGluc3RhbmNlb2YgRnVuY3Rpb247XG59XG5leHBvcnQgY29uc3QgZG93bmxvYWRPYmplY3RBc0pzb24gPSAoZXhwb3J0T2JqOiBhbnksIGV4cG9ydE5hbWU6IHN0cmluZykgPT4ge1xuICB2YXIgZGF0YVN0ciA9IFwiZGF0YTp0ZXh0L2pzb247Y2hhcnNldD11dGYtOCxcIiArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShleHBvcnRPYmopKTtcbiAgdmFyIGRvd25sb2FkQW5jaG9yTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgZGF0YVN0cik7XG4gIGRvd25sb2FkQW5jaG9yTm9kZS5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBleHBvcnROYW1lICsgXCIuanNvblwiKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb3dubG9hZEFuY2hvck5vZGUpOyAvLyByZXF1aXJlZCBmb3IgZmlyZWZveFxuICBkb3dubG9hZEFuY2hvck5vZGUuY2xpY2soKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnJlbW92ZSgpO1xufVxuZXhwb3J0IGNvbnN0IHJlYWRGaWxlTG9jYWwgPSAoY2FsbGJhY2s6IGFueSkgPT4ge1xuICB2YXIgaW5wdXRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0RWwuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2ZpbGUnKTtcbiAgaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjaz8uKGZyLnJlc3VsdCk7XG4gICAgfVxuICAgIGlmIChpbnB1dEVsICYmIGlucHV0RWwuZmlsZXMpXG4gICAgICBmci5yZWFkQXNUZXh0KGlucHV0RWwuZmlsZXNbMF0pO1xuICB9KTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpbnB1dEVsKTtcbiAgaW5wdXRFbC5jbGljaygpO1xuICBpbnB1dEVsLnJlbW92ZSgpO1xufVxuIiwiaW1wb3J0IHsgSVByb3BlcnR5IH0gZnJvbSBcIi4vSUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcbmltcG9ydCB7IGlzRnVuY3Rpb24gfSBmcm9tIFwiLi9VdGlsc1wiO1xuXG5leHBvcnQgY2xhc3MgRGF0YUZsb3cge1xuICBwcml2YXRlIGRhdGE6IGFueSA9IHt9O1xuICBwcml2YXRlIHByb3BlcnRpZXM6IGFueSA9IG51bGw7XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIHB1YmxpYyBnZXRQcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcGVydGllcztcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwcm9wZXJ0eTogSVByb3BlcnR5IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBkYXRhOiBhbnkgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5sb2FkKGRhdGEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgSW5pdERhdGEoZGF0YTogYW55ID0gbnVsbCwgcHJvcGVydGllczogYW55ID0gLTEpIHtcbiAgICBpZiAocHJvcGVydGllcyAhPT0gLTEpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubG9hZChkYXRhKTtcbiAgfVxuICBwcml2YXRlIGV2ZW50RGF0YUNoYW5nZShrZXk6IHN0cmluZywga2V5Q2hpbGQ6IHN0cmluZywgdmFsdWVDaGlsZDogYW55LCBzZW5kZXJDaGlsZDogYW55LCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGluZGV4KSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fV8ke2tleUNoaWxkfWAsIHtcbiAgICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVFdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHB1YmxpYyBPbkV2ZW50RGF0YShpdGVtOiBEYXRhRmxvdywga2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcbiAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfWAsICh7IGtleToga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkIH06IGFueSkgPT4gdGhpcy5ldmVudERhdGFDaGFuZ2Uoa2V5LCBrZXlDaGlsZCwgdmFsdWVDaGlsZCwgc2VuZGVyQ2hpbGQsIGluZGV4KSk7XG4gIH1cbiAgcHJpdmF0ZSBCaW5kRXZlbnQodmFsdWU6IGFueSwga2V5OiBzdHJpbmcpIHtcbiAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHRoaXMuT25FdmVudERhdGEodmFsdWUgYXMgRGF0YUZsb3csIGtleSk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAodmFsdWUgYXMgW10pLmxlbmd0aCA+IDAgJiYgdmFsdWVbMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgKHZhbHVlIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLk9uRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0Rpc3BhdGNoOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICh0aGlzLmRhdGFba2V5XSAhPSB2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZGF0YVtrZXldKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgdGhpcy5SZW1vdmVFdmVudERhdGEoKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93KSwga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFba2V5XSkgJiYgKHRoaXMuZGF0YVtrZXldIGFzIFtdKS5sZW5ndGggPiAwICYmIHRoaXMuZGF0YVtrZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgICAodGhpcy5kYXRhW2tleV0gYXMgRGF0YUZsb3dbXSkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3csIGluZGV4OiBudW1iZXIpID0+IHRoaXMuUmVtb3ZlRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gICAgfVxuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgaWYgKGlzRGlzcGF0Y2gpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgIH0pO1xuICAgIH1cblxuICB9XG4gIHB1YmxpYyBTZXREYXRhKGRhdGE6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IGZhbHNlKSB7XG5cbiAgICBpZiAoaXNDbGVhckRhdGEpIHRoaXMuZGF0YSA9IHt9O1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIGxldCAkZGF0YTogRGF0YUZsb3cgPSBkYXRhIGFzIERhdGFGbG93O1xuICAgICAgaWYgKCF0aGlzLnByb3BlcnR5ICYmICRkYXRhLnByb3BlcnR5KSB0aGlzLnByb3BlcnR5ID0gJGRhdGEucHJvcGVydHk7XG4gICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cygkZGF0YS5nZXRQcm9wZXJ0aWVzKCkpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIHRoaXMuU2V0KGtleSwgZGF0YVtrZXldLCBzZW5kZXIsIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgZGF0YVxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBHZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2tleV07XG4gIH1cbiAgcHVibGljIEluY3JlYXNlKGtleTogc3RyaW5nLCBtYXg6IGFueSA9IHVuZGVmaW5lZCkge1xuICAgIGlmICghbWF4IHx8IChtYXggPiB0aGlzLmRhdGFba2V5XSkpXG4gICAgICB0aGlzLlNldChrZXksICsrdGhpcy5kYXRhW2tleV0pO1xuICB9XG4gIHB1YmxpYyBEZWNyZWFzZShrZXk6IHN0cmluZywgbWluOiBhbnkgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIW1pbiB8fCAobWluIDwgdGhpcy5kYXRhW2tleV0pKVxuICAgICAgdGhpcy5TZXQoa2V5LCAtLXRoaXMuZGF0YVtrZXldKTtcbiAgfVxuICBwdWJsaWMgQXBwZW5kKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgaWYgKCF0aGlzLmRhdGFba2V5XSkgdGhpcy5kYXRhW2tleV0gPSBbXTtcbiAgICB0aGlzLmRhdGFba2V5XSA9IFsuLi50aGlzLmRhdGFba2V5XSwgdmFsdWVdO1xuICAgIHRoaXMuQmluZEV2ZW50KHZhbHVlLCBrZXkpO1xuICB9XG4gIHB1YmxpYyBSZW1vdmUoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICB0aGlzLmRhdGFba2V5XS5pbmRleE9mKHZhbHVlKTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmRhdGFba2V5XS5pbmRleE9mKHZhbHVlKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5SZW1vdmVFdmVudERhdGEodGhpcy5kYXRhW2tleV1baW5kZXhdLCBrZXkpO1xuICAgICAgdGhpcy5kYXRhW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGxvYWQoZGF0YTogYW55KSB7XG4gICAgdGhpcy5kYXRhID0ge307XG4gICAgaWYgKCF0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMucHJvcGVydHk/LmdldFByb3BlcnR5QnlLZXkoZGF0YS5rZXkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICBjb25zdCBmdW5jU2V0VmFsdWUgPSAoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IHZhbHVlU2V0ID0gdmFsdWU7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgIHZhbHVlU2V0ID0gdmFsdWUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZVNldCkpIHtcbiAgICAgICAgICB2YWx1ZVNldCA9IHZhbHVlU2V0Lm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoaXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCBpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlU2V0Py5rZXkpIHtcbiAgICAgICAgICB2YWx1ZVNldCA9IG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCB2YWx1ZVNldCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kYXRhW2tleV0gPSB2YWx1ZVNldDtcbiAgICAgICAgdGhpcy5CaW5kRXZlbnQodGhpcy5kYXRhW2tleV0sIGtleSk7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5wcm9wZXJ0aWVzKSkge1xuICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IHRoaXMucHJvcGVydGllc1trZXldO1xuICAgICAgICBpZiAocHJvcGVydHkuc3ViICYmIGRhdGEpIHtcbiAgICAgICAgICBmb3IgKGxldCBmaWVsZCBvZiBPYmplY3Qua2V5cyhkYXRhKSkge1xuICAgICAgICAgICAgaWYgKGZpZWxkLnN0YXJ0c1dpdGgoa2V5KSkge1xuICAgICAgICAgICAgICBmdW5jU2V0VmFsdWUoZmllbGQsIGRhdGE/LltmaWVsZF0gPz8gdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmdW5jU2V0VmFsdWUoa2V5LCBkYXRhPy5ba2V5XSA/PyB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnRvSnNvbigpKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCByczogYW55ID0ge307XG4gICAgaWYgKCF0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMucHJvcGVydHk/LmdldFByb3BlcnR5QnlLZXkodGhpcy5kYXRhLmtleSk7XG4gICAgfVxuICAgIGNvbnN0IHNldFJTID0gKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgdmFsdWVSUyA9IHRoaXMuR2V0KGtleSk7XG4gICAgICBpZiAodmFsdWVSUyBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgIHJzW2tleV0gPSB2YWx1ZVJTLnRvSnNvbigpO1xuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlUlMpKSB7XG4gICAgICAgIHJzW2tleV0gPSB2YWx1ZVJTLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGl0ZW0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udG9Kc29uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcnNba2V5XSA9IHZhbHVlUlM7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICBjb25zdCBwcm9wZXJ0eSA9IHRoaXMucHJvcGVydGllc1trZXldO1xuICAgICAgaWYgKHByb3BlcnR5LnN1Yikge1xuICAgICAgICBmb3IgKGxldCBmaWVsZCBvZiBPYmplY3Qua2V5cyh0aGlzLmRhdGEpKSB7XG4gICAgICAgICAgaWYgKGZpZWxkLnN0YXJ0c1dpdGgoa2V5KSkge1xuICAgICAgICAgICAgc2V0UlMoZmllbGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0UlMoa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJzO1xuICB9XG4gIHB1YmxpYyBkZWxldGUoKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG4gICAgdGhpcy5kYXRhID0ge307XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcclxuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XHJcbmltcG9ydCB7IElFdmVudCB9IGZyb20gXCIuL0lGbG93XCI7XHJcbmV4cG9ydCBjbGFzcyBGbG93Q29yZSBpbXBsZW1lbnRzIElFdmVudCB7XHJcbiAgcHVibGljIEdldElkKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2lkJyk7XHJcbiAgfVxyXG4gIHB1YmxpYyBTZXRJZChpZDogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgnaWQnLCBpZCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcclxuICBwdWJsaWMgZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3coKTtcclxuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cclxuICBwdWJsaWMgQ2hlY2tFbGVtZW50Q2hpbGQoZWw6IEhUTUxFbGVtZW50KSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbE5vZGUgPT0gZWwgfHwgdGhpcy5lbE5vZGUuY29udGFpbnMoZWwpO1xyXG4gIH1cclxuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xyXG4gIHB1YmxpYyBTZXREYXRhKGRhdGE6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsKSB7XHJcbiAgICB0aGlzLmRhdGEuU2V0RGF0YShkYXRhLCBzZW5kZXIpO1xyXG4gIH1cclxuICBwdWJsaWMgU2V0RGF0YUZsb3coZGF0YTogRGF0YUZsb3cpIHtcclxuICAgIHRoaXMuZGF0YS5TZXREYXRhKGRhdGEsIHRoaXMsIHRydWUpO1xyXG5cclxuICAgIHRoaXMuZGlzcGF0Y2goYGJpbmRfZGF0YV9ldmVudGAsIHsgZGF0YSwgc2VuZGVyOiB0aGlzIH0pO1xyXG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7IGRhdGEsIHNlbmRlcjogdGhpcyB9KTtcclxuICB9XHJcbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XHJcbiAgfVxyXG4gIFJlbW92ZURhdGFFdmVudCgpIHtcclxuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uZGF0YUNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5jaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQmFzZUZsb3c8VFBhcmVudCBleHRlbmRzIEZsb3dDb3JlPiBleHRlbmRzIEZsb3dDb3JlIHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIHBhcmVudDogVFBhcmVudCkge1xyXG4gICAgc3VwZXIoKTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi9JRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcbmltcG9ydCB7IGlzRnVuY3Rpb24gfSBmcm9tIFwiLi9VdGlsc1wiO1xuXG5leHBvcnQgY29uc3QgVGFnVmlldyA9IFsnU1BBTicsICdESVYnLCAnUCcsICdURVhUQVJFQSddO1xuZXhwb3J0IGNsYXNzIERhdGFWaWV3IHtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIHByb3BlcnR5OiBhbnk7XG4gIHByaXZhdGUgZWxTdWdnZXN0aW9uczogRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBlbFN1Z2dlc3Rpb25zQ29udGVudDogRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBub2RlRWRpdG9yOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgZWw6IEVsZW1lbnQsIHByaXZhdGUgZGF0YTogRGF0YUZsb3csIHByaXZhdGUgbWFpbjogSU1haW4sIHByaXZhdGUga2V5TmFtZTogc3RyaW5nIHwgbnVsbCA9IG51bGwpIHtcbiAgICBpZiAodGhpcy5rZXlOYW1lKSB7XG4gICAgICBpZiAoIWVsLmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleSh0aGlzLmRhdGEuR2V0KCdrZXknKSk/Llt0aGlzLmtleU5hbWVdO1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IgPSBlbCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgdGhpcy5ub2RlRWRpdG9yLmNsYXNzTGlzdC5hZGQoJ25vZGUtZWRpdG9yJyk7XG4gICAgICAgIGlmICh0aGlzLnByb3BlcnR5LmVkaXQpIHtcbiAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0eS5zZWxlY3QpIHtcbiAgICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIm5vZGUtZm9ybS1jb250cm9sXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZWxOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIHRoaXMua2V5TmFtZSk7XG5cbiAgICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5TmFtZSA9IGVsPy5nZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnKTtcbiAgICAgIGlmICh0aGlzLmtleU5hbWUpIHtcbiAgICAgICAgdGhpcy5wcm9wZXJ0eSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KHRoaXMuZGF0YS5HZXQoJ2tleScpKT8uW3RoaXMua2V5TmFtZV07XG4gICAgICAgIHRoaXMuZWxOb2RlID0gdGhpcy5lbCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgdGhpcy5ub2RlRWRpdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB0aGlzLm5vZGVFZGl0b3IuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3InKTtcbiAgICAgICAgZWwucGFyZW50RWxlbWVudD8uaW5zZXJ0QmVmb3JlKHRoaXMubm9kZUVkaXRvciwgZWwpO1xuICAgICAgICBlbC5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZChlbCk7XG4gICAgICAgIHRoaXMubm9kZUVkaXRvci5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZWxTdWdnZXN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxTdWdnZXN0aW9ucy5jbGFzc0xpc3QuYWRkKCdub2RlLWVkaXRvcl9zdWdnZXN0aW9ucycpO1xuICAgIHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsU3VnZ2VzdGlvbnNDb250ZW50LmNsYXNzTGlzdC5hZGQoJ3N1Z2dlc3Rpb25zX2NvbnRlbnQnKTtcbiAgICB0aGlzLmVsU3VnZ2VzdGlvbnMuYXBwZW5kQ2hpbGQodGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudCk7XG4gICAgdGhpcy5zaG93U3VnZ2VzdGlvbnMoZmFsc2UpO1xuICAgIGlmICh0aGlzLm5vZGVFZGl0b3IpIHtcbiAgICAgIHRoaXMubm9kZUVkaXRvci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIGlmICgoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsYXNzTGlzdC5jb250YWlucygnc3VnLXZhcmlhYmxlLWl0ZW0nKSkge1xuICAgICAgICAgIHRoaXMuc2V0VmFyKChlLnRhcmdldCBhcyBhbnkpLmlubmVyVGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5rZXlOYW1lKVxuICAgICAgdGhpcy5iaW5kRGF0YSgpO1xuICB9XG5cbiAgcHVibGljIHNldFZhcihuYW1lOiBhbnkpIHtcbiAgICBsZXQgc2VsZWN0aW9uU3RhcnQgPSAodGhpcy5lbE5vZGUgYXMgYW55KS5zZWxlY3Rpb25TdGFydDtcbiAgICBpZiAodGhpcy5wcm9wZXJ0eT8udmFyKSB7XG4gICAgICB0aGlzLnNldE5vZGVWYWx1ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHR4dDogc3RyaW5nID0gKHRoaXMuZWxOb2RlIGFzIGFueSkudmFsdWU7XG5cbiAgICAgIGxldCBzdGFydEluZGV4ID0gdHh0Lmxhc3RJbmRleE9mKFwiJHtcIiwgc2VsZWN0aW9uU3RhcnQpO1xuICAgICAgdGhpcy5zZXROb2RlVmFsdWUoYCR7dHh0LnN1YnN0cmluZygwLCBzdGFydEluZGV4KX1cXCR7JHtuYW1lfX0ke3R4dC5zdWJzdHJpbmcoc2VsZWN0aW9uU3RhcnQsIHR4dC5sZW5ndGgpfWApO1xuXG4gICAgfVxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5lbE5vZGU/LmZvY3VzKCk7XG4gICAgICB0aGlzLnNob3dTdWdnZXN0aW9ucyhmYWxzZSk7XG4gICAgICAodGhpcy5lbE5vZGUgYXMgYW55KS5zZWxlY3Rpb25TdGFydCA9IHNlbGVjdGlvblN0YXJ0ICsgbmFtZS5sZW5ndGg7XG4gICAgICB0aGlzLmJpbmRFdmVudCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjaGVja1Nob3dTdWdnZXN0aW9ucygpIHtcbiAgICB2YXIgYXJyID0gdGhpcy5tYWluLmdldFZhcmlhYmxlKCk7XG4gICAgaWYgKCFhcnIgfHwgYXJyLmxlbmd0aCA9PSAwKSB7XG4gICAgICB0aGlzLnNob3dTdWdnZXN0aW9ucyhmYWxzZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCB0eHQ6IGFueSA9ICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlO1xuICAgIGxldCBzZWxlY3Rpb25TdGFydCA9ICh0aGlzLmVsTm9kZSBhcyBhbnkpLnNlbGVjdGlvblN0YXJ0O1xuICAgIGxldCBzdWJUeHQ6IGFueSA9IFwiXCI7XG4gICAgbGV0IHN0YXJ0SW5kZXg6IG51bWJlciA9IDA7XG4gICAgaWYgKHR4dCkge1xuICAgICAgaWYgKHRoaXMucHJvcGVydHk/LnZhcikge1xuICAgICAgICBzdWJUeHQgPSB0eHQ7XG4gICAgICAgIHRoaXMuc2hvd1N1Z2dlc3Rpb25zKHRydWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhcnRJbmRleCA9IHR4dC5sYXN0SW5kZXhPZihcIiR7XCIsIHNlbGVjdGlvblN0YXJ0KTtcbiAgICAgICAgbGV0IGVuZEluZGV4ID0gdHh0Lmxhc3RJbmRleE9mKFwifVwiLCBzZWxlY3Rpb25TdGFydCk7XG4gICAgICAgIGlmIChlbmRJbmRleCA8IHN0YXJ0SW5kZXgpIHtcbiAgICAgICAgICBzdWJUeHQgPSB0eHQuc3Vic3RyaW5nKHN0YXJ0SW5kZXggKyAyLCBzZWxlY3Rpb25TdGFydCk7XG4gICAgICAgICAgdGhpcy5zaG93U3VnZ2VzdGlvbnModHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdGhpcy5zaG93U3VnZ2VzdGlvbnMoZmFsc2UpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfVxuICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnNDb250ZW50KSB7XG4gICAgICBsZXQgZWxMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBsZXQgZmxnID0gZmFsc2U7XG4gICAgICBjb25zb2xlLmxvZyhzdWJUeHQpO1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBhcnIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGl0ZW0uR2V0KCduYW1lJyk7XG4gICAgICAgIGlmIChzdWJUeHQgJiYgIW5hbWUuc3RhcnRzV2l0aChzdWJUeHQpKSBjb250aW51ZTtcbiAgICAgICAgbGV0IGVsSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgICBlbEl0ZW0uaW5uZXJIVE1MID0gbmFtZTtcbiAgICAgICAgZWxJdGVtLmNsYXNzTGlzdC5hZGQoJ3N1Zy12YXJpYWJsZS1pdGVtJyk7XG4gICAgICAgIGVsTGlzdC5hcHBlbmRDaGlsZChlbEl0ZW0pO1xuICAgICAgICBmbGcgPSB0cnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5lbFN1Z2dlc3Rpb25zQ29udGVudC5hcHBlbmRDaGlsZChlbExpc3QpO1xuICAgICAgaWYgKCFmbGcpIHtcbiAgICAgICAgdGhpcy5zaG93U3VnZ2VzdGlvbnMoZmFsc2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnN1Z2dlc3Rpb25JbmRleCA9IDA7XG4gICAgICB0aGlzLnNldFN1Z2dlc3Rpb25JbmRleCgwKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBzaG93U3VnZ2VzdGlvbnMoZmxnOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICghdGhpcy5lbFN1Z2dlc3Rpb25zKSByZXR1cm47XG4gICAgaWYgKHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQpIHRoaXMuZWxTdWdnZXN0aW9uc0NvbnRlbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbFN1Z2dlc3Rpb25zLnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbFN1Z2dlc3Rpb25zLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTpub25lOycpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGVsRm9jdXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWdleFZhbGlkYXRlOiBhbnkgPSBudWxsO1xuICBwcml2YXRlIHN1Z2dlc3Rpb25JbmRleDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBzZXRTdWdnZXN0aW9uSW5kZXgoaW5kZXg6IGFueSkge1xuICAgIGlmICghdGhpcy5lbFN1Z2dlc3Rpb25zKSByZXR1cm47XG4gICAgbGV0IHRlbXAgPSAodGhpcy5zdWdnZXN0aW9uSW5kZXggKyBpbmRleCk7XG4gICAgaWYgKDAgPiB0ZW1wIHx8IHRlbXAgPj0gdGhpcy5lbFN1Z2dlc3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdWctdmFyaWFibGUtaXRlbScpLmxlbmd0aCAtIDEpIHJldHVybjtcbiAgICB0aGlzLnN1Z2dlc3Rpb25JbmRleCA9IHRlbXA7XG4gICAgdGhpcy5lbFN1Z2dlc3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdWctdmFyaWFibGUtaXRlbScpLmZvckVhY2goKGl0ZW0sIGl0ZW1JbmRleCkgPT4ge1xuICAgICAgaXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgIGlmIChpdGVtSW5kZXggPT0gdGhpcy5zdWdnZXN0aW9uSW5kZXgpIHtcbiAgICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIHByaXZhdGUgYmluZERhdGEoKSB7XG4gICAgaWYgKHRoaXMua2V5TmFtZSAmJiB0aGlzLmVsTm9kZSkge1xuICAgICAgaWYgKHRoaXMucHJvcGVydHk/LnZhbGlkYXRlKSB7XG4gICAgICAgIHRoaXMucmVnZXhWYWxpZGF0ZSA9IG5ldyBSZWdFeHAodGhpcy5wcm9wZXJ0eS52YWxpZGF0ZSwgJ2knKVxuICAgICAgfVxuICAgICAgdGhpcy5kYXRhLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke3RoaXMua2V5TmFtZX1gLCB0aGlzLmJpbmRJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIC8vIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlOiBhbnkpID0+IHtcbiAgICAgICAgdmFyIGNoYXJDb2RlID0gKGUud2hpY2gpID8gZS53aGljaCA6IGUua2V5Q29kZTtcbiAgICAgICAgaWYgKGNoYXJDb2RlID09IDEzICYmIHRoaXMuc3VnZ2VzdGlvbkluZGV4ID4gLTEpIHtcbiAgICAgICAgICBsZXQgbmFtZVZhciA9IHRoaXMuZWxTdWdnZXN0aW9ucz8ucXVlcnlTZWxlY3RvcignLmFjdGl2ZScpPy5pbm5lckhUTUw7XG4gICAgICAgICAgaWYgKG5hbWVWYXIpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0VmFyKG5hbWVWYXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgIGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYXJDb2RlID09IDM4KSB7IC8vIFVwXG4gICAgICAgICAgdGhpcy5zZXRTdWdnZXN0aW9uSW5kZXgoLTEpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgZS5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDApIHsgLy8gRG93blxuICAgICAgICAgIHRoaXMuc2V0U3VnZ2VzdGlvbkluZGV4KDEpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgZS5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJpbmRFdmVudCgpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIChlOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHRoaXMucmVnZXhWYWxpZGF0ZSAmJiAhdGhpcy5yZWdleFZhbGlkYXRlLnRlc3QoZS5jbGlwYm9hcmREYXRhLmdldERhdGEoJ1RleHQnKSkpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgIGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5cHJlc3MnLCAoZTogYW55KSA9PiB7XG4gICAgICAgIHZhciBjaGFyQ29kZSA9IChlLndoaWNoKSA/IGUud2hpY2ggOiBlLmtleUNvZGU7XG4gICAgICAgIGlmICh0aGlzLnJlZ2V4VmFsaWRhdGUgJiYgIXRoaXMucmVnZXhWYWxpZGF0ZS50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUpKSkge1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4ge1xuICAgICAgICB0aGlzLmVsRm9jdXMgPSB0cnVlOyB0aGlzLnN1Z2dlc3Rpb25JbmRleCA9IDA7XG4gICAgICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnMpXG4gICAgICAgICAgdGhpcy5lbE5vZGU/LnBhcmVudEVsZW1lbnQ/LmFwcGVuZENoaWxkKHRoaXMuZWxTdWdnZXN0aW9ucyk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgJ29mZicpO1xuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsICgpID0+IHtcbiAgICAgICAgdGhpcy5lbEZvY3VzID0gZmFsc2U7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmVsU3VnZ2VzdGlvbnMgJiYgIXRoaXMuZWxGb2N1cykge1xuICAgICAgICAgICAgdGhpcy5lbE5vZGU/LnBhcmVudEVsZW1lbnQ/LnJlbW92ZUNoaWxkPy4odGhpcy5lbFN1Z2dlc3Rpb25zKTtcbiAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbkluZGV4ID0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICB9LCA1MDApO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKFwic2VsZWN0XCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jaGVja1Nob3dTdWdnZXN0aW9ucygpO1xuICAgICAgfSlcbiAgICAgIGlmICh0aGlzLmVsTm9kZSAmJiB0aGlzLnByb3BlcnR5ICYmIHRoaXMucHJvcGVydHkuc2VsZWN0ICYmIGlzRnVuY3Rpb24odGhpcy5wcm9wZXJ0eS5kYXRhU2VsZWN0KSkge1xuICAgICAgICBpZiAodGhpcy5wcm9wZXJ0eS5zZWxlY3ROb25lKSB7XG4gICAgICAgICAgbGV0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgICAgIG9wdGlvbi52YWx1ZSA9ICcnO1xuICAgICAgICAgIG9wdGlvbi50ZXh0ID0gdGhpcy5wcm9wZXJ0eS5zZWxlY3ROb25lO1xuICAgICAgICAgIHRoaXMuZWxOb2RlPy5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgICAgICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnByb3BlcnR5LmRhdGFTZWxlY3QoeyBlbE5vZGU6IHRoaXMuZWxOb2RlLCBtYWluOiB0aGlzLm1haW4sIGtleTogdGhpcy5rZXlOYW1lIH0pLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgICAgICBvcHRpb24udmFsdWUgPSBpdGVtLnZhbHVlO1xuICAgICAgICAgIG9wdGlvbi50ZXh0ID0gaXRlbS50ZXh0O1xuICAgICAgICAgIHRoaXMuZWxOb2RlPy5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnByb3BlcnR5ICYmIGlzRnVuY3Rpb24odGhpcy5wcm9wZXJ0eS5zY3JpcHQpKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHkuc2NyaXB0KHsgZWxOb2RlOiB0aGlzLmVsTm9kZSwgbWFpbjogdGhpcy5tYWluLCBrZXk6IHRoaXMua2V5TmFtZSB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0Tm9kZVZhbHVlKHRoaXMuZGF0YS5HZXQodGhpcy5rZXlOYW1lKSA/PyAnJyk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgc2V0Tm9kZVZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGlmIChUYWdWaWV3LmluY2x1ZGVzKHRoaXMuZWxOb2RlLnRhZ05hbWUpKSB7XG4gICAgICAgICh0aGlzLmVsTm9kZSBhcyBhbnkpLmlubmVyVGV4dCA9IGAke3ZhbHVlID8/IFwiXCJ9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHByaXZhdGUgYmluZElucHV0KHsgdmFsdWUsIHNlbmRlciB9OiBhbnkpIHtcbiAgICBpZiAoc2VuZGVyICE9PSB0aGlzICYmIHRoaXMuZWxOb2RlICYmIHNlbmRlcj8uZWxOb2RlICE9PSB0aGlzLmVsTm9kZSkge1xuICAgICAgdGhpcy5zZXROb2RlVmFsdWUodmFsdWUgPz8gXCJcIik7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgYmluZEV2ZW50KCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMua2V5TmFtZSAmJiB0aGlzLmVsTm9kZSkge1xuICAgICAgICB0aGlzLmRhdGEuU2V0KHRoaXMua2V5TmFtZSwgKHRoaXMuZWxOb2RlIGFzIGFueSkudmFsdWUsIHRoaXMpO1xuICAgICAgICB0aGlzLmNoZWNrU2hvd1N1Z2dlc3Rpb25zKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIERlbGV0ZSgpIHtcbiAgICBpZiAodGhpcy5rZXlOYW1lICYmIHRoaXMuZWxOb2RlKSB7XG4gICAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7dGhpcy5rZXlOYW1lfWAsIHRoaXMuYmluZElucHV0LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbE5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5iaW5kRXZlbnQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5iaW5kRXZlbnQuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBzdGF0aWMgQmluZEVsZW1lbnQoZWw6IEVsZW1lbnQsIGRhdGE6IERhdGFGbG93LCBtYWluOiBJTWFpbiwga2V5OiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IERhdGFWaWV3W10ge1xuICAgIGlmIChlbC5jaGlsZEVsZW1lbnRDb3VudCA9PSAwIHx8IGVsLmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpKSB7XG4gICAgICByZXR1cm4gW25ldyBEYXRhVmlldyhlbCwgZGF0YSwgbWFpbiwga2V5KV07XG4gICAgfVxuICAgIHJldHVybiBBcnJheS5mcm9tKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tub2RlXFxcXDptb2RlbF0nKSkubWFwKChpdGVtOiBFbGVtZW50KSA9PiB7XG4gICAgICByZXR1cm4gbmV3IERhdGFWaWV3KGl0ZW0sIGRhdGEsIG1haW4pO1xuICAgIH0pO1xuICB9XG5cbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBQcm9wZXJ0eUVudW0gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi9Ob2RlSXRlbVwiO1xuXG5leHBvcnQgY2xhc3MgTGluZSB7XG4gIHB1YmxpYyBlbE5vZGU6IFNWR0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJzdmdcIik7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcbiAgcHJpdmF0ZSBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgdGVtcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGZyb206IE5vZGVJdGVtLCBwdWJsaWMgZnJvbUluZGV4OiBudW1iZXIgPSAwLCBwdWJsaWMgdG86IE5vZGVJdGVtIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBwdWJsaWMgdG9JbmRleDogbnVtYmVyID0gMCwgZGF0YTogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoXCJtYWluLXBhdGhcIik7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCAnJyk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcImNvbm5lY3Rpb25cIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbFBhdGgpO1xuICAgIHRoaXMuZnJvbS5wYXJlbnQuZWxDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuXG4gICAgdGhpcy5mcm9tLkFkZExpbmUodGhpcyk7XG4gICAgdGhpcy50bz8uQWRkTGluZSh0aGlzKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKFxuICAgICAge1xuICAgICAgICBmcm9tOiB0aGlzLmZyb20uR2V0SWQoKSxcbiAgICAgICAgZnJvbUluZGV4OiB0aGlzLmZyb21JbmRleCxcbiAgICAgICAgdG86IHRoaXMudG8/LkdldElkKCksXG4gICAgICAgIHRvSW5kZXg6IHRoaXMudG9JbmRleFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgLi4uIHRoaXMuZnJvbS5wYXJlbnQubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5saW5lKSB8fCB7fVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5mcm9tLmRhdGEuQXBwZW5kKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVRvKHRvX3g6IG51bWJlciwgdG9feTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmZyb20gfHwgdGhpcy5mcm9tLmVsTm9kZSA9PSBudWxsKSByZXR1cm47XG4gICAgbGV0IHsgeDogZnJvbV94LCB5OiBmcm9tX3kgfTogYW55ID0gdGhpcy5mcm9tLmdldFBvc3Rpc2lvbkRvdCh0aGlzLmZyb21JbmRleCk7XG4gICAgdmFyIGxpbmVDdXJ2ZSA9IHRoaXMuY3JlYXRlQ3VydmF0dXJlKGZyb21feCwgZnJvbV95LCB0b194LCB0b195LCB0aGlzLmN1cnZhdHVyZSwgJ290aGVyJyk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCBsaW5lQ3VydmUpO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpOiBMaW5lIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG8gJiYgdGhpcy50by5lbE5vZGUpIHtcbiAgICAgIGxldCB7IHg6IHRvX3gsIHk6IHRvX3kgfTogYW55ID0gdGhpcy50by5nZXRQb3N0aXNpb25Eb3QodGhpcy50b0luZGV4KTtcbiAgICAgIHRoaXMudXBkYXRlVG8odG9feCwgdG9feSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGNyZWF0ZUN1cnZhdHVyZShzdGFydF9wb3NfeDogbnVtYmVyLCBzdGFydF9wb3NfeTogbnVtYmVyLCBlbmRfcG9zX3g6IG51bWJlciwgZW5kX3Bvc195OiBudW1iZXIsIGN1cnZhdHVyZV92YWx1ZTogbnVtYmVyLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBsZXQgbGluZV94ID0gc3RhcnRfcG9zX3g7XG4gICAgbGV0IGxpbmVfeSA9IHN0YXJ0X3Bvc195O1xuICAgIGxldCB4ID0gZW5kX3Bvc194O1xuICAgIGxldCB5ID0gZW5kX3Bvc195O1xuICAgIGxldCBjdXJ2YXR1cmUgPSBjdXJ2YXR1cmVfdmFsdWU7XG4gICAgLy90eXBlIG9wZW5jbG9zZSBvcGVuIGNsb3NlIG90aGVyXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG5cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb3RoZXInOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcblxuICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG5cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZGVsZXRlKG5vZGVUaGlzOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IHRydWUpIHtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMuZnJvbS5kYXRhLlJlbW92ZSgnbGluZXMnLCB0aGlzLmRhdGEpO1xuICAgIGlmICh0aGlzLmZyb20gIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLmZyb20uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICBpZiAodGhpcy50byAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMudG8/LlJlbW92ZUxpbmUodGhpcyk7XG4gICAgdGhpcy5lbFBhdGgucmVtb3ZlKCk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlKCk7XG4gIH1cbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XG4gICAgdGhpcy5mcm9tLnBhcmVudC5zZXRMaW5lQ2hvb3NlKHRoaXMpXG4gIH1cbiAgcHVibGljIHNldE5vZGVUbyhub2RlOiBOb2RlSXRlbSB8IHVuZGVmaW5lZCwgdG9JbmRleDogbnVtYmVyKSB7XG4gICAgdGhpcy50byA9IG5vZGU7XG4gICAgdGhpcy50b0luZGV4ID0gdG9JbmRleDtcbiAgfVxuICBwdWJsaWMgQ2xvbmUoKSB7XG4gICAgaWYgKHRoaXMudG8gJiYgdGhpcy50b0luZGV4ICYmIHRoaXMuZnJvbSAhPSB0aGlzLnRvICYmICF0aGlzLmZyb20uY2hlY2tMaW5lRXhpc3RzKHRoaXMuZnJvbUluZGV4LCB0aGlzLnRvLCB0aGlzLnRvSW5kZXgpKSB7XG4gICAgICByZXR1cm4gbmV3IExpbmUodGhpcy5mcm9tLCB0aGlzLmZyb21JbmRleCwgdGhpcy50bywgdGhpcy50b0luZGV4KS5VcGRhdGVVSSgpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgZ2V0VGltZSB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5cbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcbiAgTm9uZSA9IDAsXG4gIE5vZGUgPSAxLFxuICBDYW52YXMgPSAyLFxuICBMaW5lID0gMyxcbn1cbmV4cG9ydCBjbGFzcyBEZXNnaW5lclZpZXdfRXZlbnQge1xuXG4gIHByaXZhdGUgdGltZUZhc3RDbGljazogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSB0YWdJbmdvcmUgPSBbJ2lucHV0JywgJ2J1dHRvbicsICdhJywgJ3RleHRhcmVhJ107XG5cbiAgcHJpdmF0ZSBtb3ZlVHlwZTogTW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICBwcml2YXRlIGZsZ0RyYXA6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBmbGdNb3ZlOiBib29sZWFuID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBhdl94OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGF2X3k6IG51bWJlciA9IDA7XG5cbiAgcHJpdmF0ZSBwb3NfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwb3NfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb3VzZV94OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3k6IG51bWJlciA9IDA7XG5cbiAgcHJpdmF0ZSB0ZW1wTGluZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBEZXNnaW5lclZpZXcpIHtcbiAgICAvKiBNb3VzZSBhbmQgVG91Y2ggQWN0aW9ucyAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcbiAgICAvKiBDb250ZXh0IE1lbnUgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLmNvbnRleHRtZW51LmJpbmQodGhpcykpO1xuXG4gICAgLyogRHJvcCBEcmFwICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLm5vZGVfZHJvcEVuZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCB0aGlzLm5vZGVfZHJhZ292ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogWm9vbSBNb3VzZSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuem9vbV9lbnRlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBEZWxldGUgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5ZG93bi5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHByaXZhdGUgY29udGV4dG1lbnUoZXY6IGFueSkgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gIHByaXZhdGUgbm9kZV9kcmFnb3ZlcihldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cbiAgcHJpdmF0ZSBub2RlX2Ryb3BFbmQoZXY6IGFueSkge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgbGV0IGtleU5vZGU6IGFueSA9IHRoaXMucGFyZW50Lm1haW4uZ2V0Q29udHJvbENob29zZSgpO1xuICAgIGlmICgha2V5Tm9kZSAmJiBldi50eXBlICE9PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGtleU5vZGUgPSBldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcIm5vZGVcIik7XG4gICAgfVxuICAgIGlmICgha2V5Tm9kZSkgcmV0dXJuO1xuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcblxuICAgIGlmICh0aGlzLnBhcmVudC5jaGVja09ubHlOb2RlKGtleU5vZGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBub2RlSXRlbSA9IHRoaXMucGFyZW50LkFkZE5vZGUoa2V5Tm9kZSwge1xuICAgICAgZ3JvdXA6IHRoaXMucGFyZW50LkN1cnJlbnRHcm91cCgpXG4gICAgfSk7XG4gICAgbm9kZUl0ZW0udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gIH1cbiAgcHVibGljIHpvb21fZW50ZXIoZXZlbnQ6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAoZXZlbnQuZGVsdGFZID4gMCkge1xuICAgICAgICAvLyBab29tIE91dFxuICAgICAgICB0aGlzLnBhcmVudC56b29tX291dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gWm9vbSBJblxuICAgICAgICB0aGlzLnBhcmVudC56b29tX2luKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHByaXZhdGUgU3RhcnRNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAodGhpcy50YWdJbmdvcmUuaW5jbHVkZXMoZXYudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gZ2V0VGltZSgpO1xuICAgIGlmIChldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtYWluLXBhdGgnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuQ2FudmFzO1xuICAgIGxldCBub2RlQ2hvb3NlID0gdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpO1xuICAgIGlmIChub2RlQ2hvb3NlICYmIG5vZGVDaG9vc2UuQ2hlY2tFbGVtZW50Q2hpbGQoZXYudGFyZ2V0KSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodW5kZWZpbmVkKTtcbiAgICB9XG4gICAgaWYgKG5vZGVDaG9vc2UgJiYgdGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5Ob2RlICYmIGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJub2RlLWRvdFwiKSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkxpbmU7XG4gICAgICBsZXQgZnJvbUluZGV4ID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgdGhpcy50ZW1wTGluZSA9IG5ldyBMaW5lKG5vZGVDaG9vc2UsIGZyb21JbmRleCk7XG4gICAgICB0aGlzLnRlbXBMaW5lLnRlbXAgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIHRoaXMuYXZfeCA9IHRoaXMucGFyZW50LmdldFgoKTtcbiAgICAgIHRoaXMuYXZfeSA9IHRoaXMucGFyZW50LmdldFkoKTtcbiAgICB9XG4gICAgdGhpcy5mbGdEcmFwID0gdHJ1ZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwdWJsaWMgTW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICB0aGlzLmZsZ01vdmUgPSB0cnVlO1xuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubW92ZVR5cGUpIHtcbiAgICAgIGNhc2UgTW92ZVR5cGUuQ2FudmFzOlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcbiAgICAgICAgICBsZXQgeSA9IHRoaXMuYXZfeSArIHRoaXMucGFyZW50LkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgICAgIHRoaXMucGFyZW50LnNldFgoeCk7XG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5VcGRhdGVVSSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLk5vZGU6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucG9zX3ggLSBlX3Bvc194KTtcbiAgICAgICAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcbiAgICAgICAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICAgICAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk/LnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLkxpbmU6XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgICAgICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcbiAgICAgICAgICAgIHRoaXMudGVtcExpbmUudXBkYXRlVG8odGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0TGVmdCAtIHgsIHRoaXMucGFyZW50LmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICAgICAgbGV0IG5vZGVFbCA9IGV2LnRhcmdldC5jbG9zZXN0KCdbbm9kZS1pZF0nKTtcbiAgICAgICAgICAgIGxldCBub2RlSWQgPSBub2RlRWw/LmdldEF0dHJpYnV0ZSgnbm9kZS1pZCcpO1xuICAgICAgICAgICAgbGV0IG5vZGVUbyA9IG5vZGVJZCA/IHRoaXMucGFyZW50LkdldE5vZGVCeUlkKG5vZGVJZCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAobm9kZVRvICYmIGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJub2RlLWRvdFwiKSkge1xuICAgICAgICAgICAgICBsZXQgdG9JbmRleCA9IGV2LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gbm9kZUVsPy5xdWVyeVNlbGVjdG9yKCcubm9kZS1kb3QnKT8uWzBdPy5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcbiAgICAgIHRoaXMubW91c2VfeSA9IGVfcG9zX3k7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgRW5kTW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgoZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDEwMCkgfHwgIXRoaXMuZmxnTW92ZSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIGxldCB4ID0gdGhpcy5hdl94ICsgdGhpcy5wYXJlbnQuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICBsZXQgeSA9IHRoaXMuYXZfeSArIHRoaXMucGFyZW50LkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgIHRoaXMucGFyZW50LnNldFkoeSk7XG4gICAgICB0aGlzLmF2X3ggPSAwO1xuICAgICAgdGhpcy5hdl95ID0gMDtcbiAgICB9XG4gICAgaWYgKHRoaXMudGVtcExpbmUpIHtcbiAgICAgIHRoaXMudGVtcExpbmUuQ2xvbmUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUuZGVsZXRlKCk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwcml2YXRlIGtleWRvd24oZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmIChldi5rZXkgPT09ICdEZWxldGUnIHx8IChldi5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGV2Lm1ldGFLZXkpKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgICB0aGlzLnBhcmVudC5nZXRMaW5lQ2hvb3NlKCk/LmRlbGV0ZSgpO1xuICAgIH1cbiAgICBpZiAoZXYua2V5ID09PSAnRjInKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBCYXNlRmxvdywgRXZlbnRFbnVtLCBEYXRhRmxvdywgRGF0YVZpZXcgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgaXNGdW5jdGlvbiB9IGZyb20gXCIuLi9jb3JlL1V0aWxzXCI7XG5leHBvcnQgY2xhc3MgTm9kZUl0ZW0gZXh0ZW5kcyBCYXNlRmxvdzxEZXNnaW5lclZpZXc+IHtcbiAgLyoqXG4gICAqIEdFVCBTRVQgZm9yIERhdGFcbiAgICovXG5cbiAgcHVibGljIEluY3JlYXNlVmFsdWUobmFtZTogc3RyaW5nLCBtYXg6IGFueSA9IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuSW5jcmVhc2UobmFtZSwgbWF4KTtcbiAgfVxuICBwdWJsaWMgRGVjcmVhc2VWYWx1ZShuYW1lOiBzdHJpbmcsIG1pbjogYW55ID0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5EZWNyZWFzZShuYW1lLCBtaW4pO1xuICB9XG4gIHB1YmxpYyBnZXREYXRhVmFsdWUobmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQobmFtZSk7XG4gIH1cbiAgcHVibGljIHNldERhdGFWYWx1ZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldChuYW1lLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIGdldE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF0YVZhbHVlKCduYW1lJyk7XG4gIH1cbiAgcHVibGljIGdldFkoKSB7XG4gICAgcmV0dXJuICt0aGlzLmdldERhdGFWYWx1ZSgneScpO1xuICB9XG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5zZXREYXRhVmFsdWUoJ3knLCB2YWx1ZSk7XG4gIH1cbiAgcHVibGljIGdldFgoKSB7XG4gICAgcmV0dXJuICt0aGlzLmdldERhdGFWYWx1ZSgneCcpO1xuICB9XG4gIHB1YmxpYyBzZXRYKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5zZXREYXRhVmFsdWUoJ3gnLCB2YWx1ZSk7XG4gIH1cbiAgcHVibGljIENoZWNrS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF0YVZhbHVlKCdrZXknKSA9PSBrZXk7XG4gIH1cbiAgcHVibGljIGdldERhdGFMaW5lKCkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFWYWx1ZSgnbGluZXMnKSA/PyBbXTtcbiAgfVxuICBwdWJsaWMgY2hlY2tMaW5lRXhpc3RzKGZyb21JbmRleDogbnVtYmVyLCB0bzogTm9kZUl0ZW0sIHRvSW5kZXg6IE51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmFyckxpbmUuZmlsdGVyKChpdGVtOiBMaW5lKSA9PiB7XG4gICAgICBpZiAoIWl0ZW0udGVtcCAmJiBpdGVtLnRvID09IHRvICYmIGl0ZW0udG9JbmRleCA9PSB0b0luZGV4ICYmIGl0ZW0uZnJvbUluZGV4ID09IGZyb21JbmRleCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghaXRlbS50ZW1wICYmIGl0ZW0uZnJvbSA9PSB0byAmJiBpdGVtLmZyb21JbmRleCA9PSB0b0luZGV4ICYmIGl0ZW0udG9JbmRleCA9PSBmcm9tSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9KS5sZW5ndGggPiAwO1xuICB9XG4gIHB1YmxpYyBlbENvbnRlbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgdGVtcDogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3coKTtcbiAgcHVibGljIGFyckxpbmU6IExpbmVbXSA9IFtdO1xuICBwcml2YXRlIG9wdGlvbjogYW55ID0ge307XG4gIHByaXZhdGUgYXJyRGF0YVZpZXc6IERhdGFWaWV3W10gPSBbXTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogRGVzZ2luZXJWaWV3LCBwcml2YXRlIGtleU5vZGU6IGFueSwgZGF0YTogYW55ID0ge30pIHtcbiAgICBzdXBlcihwYXJlbnQpO1xuICAgIHRoaXMub3B0aW9uID0gdGhpcy5wYXJlbnQubWFpbi5nZXRDb250cm9sTm9kZUJ5S2V5KGtleU5vZGUpO1xuICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMub3B0aW9uPy5wcm9wZXJ0aWVzO1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5Jbml0RGF0YSh7IC4uLmRhdGEsIG5hbWU6IHRoaXMub3B0aW9uLm5hbWUgfSwgdGhpcy5wcm9wZXJ0aWVzKTtcbiAgICAgIHRoaXMucGFyZW50LmRhdGEuQXBwZW5kKCdub2RlcycsIHRoaXMuZGF0YSk7XG4gICAgfVxuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ub2RlJyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb24uY2xhc3MpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb24uY2xhc3MpO1xuICAgIH1cbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ25vZGUtaWQnLCB0aGlzLkdldElkKCkpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTpub25lJyk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsQ2FudmFzLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICB0aGlzLnJlbmRlclVJKCk7XG4gIH1cbiAgcHVibGljIGdldE9wdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb247XG4gIH1cbiAgcHJpdmF0ZSByZW5kZXJVSShkZXRhaWw6IGFueSA9IG51bGwpIHtcbiAgICBpZiAoKGRldGFpbCAmJiBbJ3gnLCAneSddLmluY2x1ZGVzKGRldGFpbC5rZXkpKSkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiB0aGlzLmVsTm9kZS5jb250YWlucyhkb2N1bWVudC5hY3RpdmVFbGVtZW50KSAmJiAhWydCVVRUT04nLCAnQSddLmluY2x1ZGVzKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQudGFnTmFtZSkpIHJldHVybjtcblxuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApO1xuICAgIGlmICh0aGlzLmdldE9wdGlvbigpPy5oaWRlVGl0bGUgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS10b3BcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3R0b21cIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtcmlnaHRcIj48L2Rpdj5cbiAgICBgO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1sZWZ0XCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtdG9wXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj4ke3RoaXMub3B0aW9uLmljb259ICR7dGhpcy5nZXROYW1lKCl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWJvdHRvbVwiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1yaWdodFwiPjwvZGl2PlxuICAgIGA7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkTm9kZURvdCA9IChudW06IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQsIHN0YXJ0OiBudW1iZXIsIHF1ZXJ5OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChudW0pIHtcbiAgICAgICAgbGV0IG5vZGVRdWVyeSA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IocXVlcnkpO1xuICAgICAgICBpZiAobm9kZVF1ZXJ5KSB7XG4gICAgICAgICAgbm9kZVF1ZXJ5LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICAgICAgbGV0IG5vZGVEb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIG5vZGVEb3QuY2xhc3NMaXN0LmFkZCgnbm9kZS1kb3QnKTtcbiAgICAgICAgICAgIG5vZGVEb3Quc2V0QXR0cmlidXRlKCdub2RlJywgYCR7c3RhcnQgKyBpfWApO1xuICAgICAgICAgICAgbm9kZVF1ZXJ5LmFwcGVuZENoaWxkKG5vZGVEb3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LmxlZnQsIDEwMDAsICcubm9kZS1sZWZ0Jyk7XG4gICAgYWRkTm9kZURvdCh0aGlzLm9wdGlvbj8uZG90Py50b3AsIDIwMDAsICcubm9kZS10b3AnKTtcbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LmJvdHRvbSwgMzAwMCwgJy5ub2RlLWJvdHRvbScpO1xuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8ucmlnaHQsIDQwMDAsICcubm9kZS1yaWdodCcpO1xuXG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcubm9kZS1jb250ZW50IC5ib2R5JykgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5wYXJlbnQubWFpbi5yZW5kZXJIdG1sKHsgbm9kZTogdGhpcywgZWxOb2RlOiB0aGlzLmVsQ29udGVudCwgbWFpbjogdGhpcy5wYXJlbnQubWFpbiB9KTtcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgdGhpcy5hcnJEYXRhVmlldy5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLkRlbGV0ZSgpKTtcbiAgICBpZiAoaXNGdW5jdGlvbih0aGlzLm9wdGlvbi5zY3JpcHQpKSB7XG4gICAgICB0aGlzLm9wdGlvbi5zY3JpcHQoeyBub2RlOiB0aGlzLCBlbE5vZGU6IHRoaXMuZWxDb250ZW50LCBtYWluOiB0aGlzLnBhcmVudC5tYWluIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5lbENvbnRlbnQpXG4gICAgICB0aGlzLmFyckRhdGFWaWV3ID0gRGF0YVZpZXcuQmluZEVsZW1lbnQodGhpcy5lbENvbnRlbnQsIHRoaXMuZGF0YSwgdGhpcy5wYXJlbnQubWFpbik7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgbGV0IHRlbXB4ID0geDtcbiAgICAgIGxldCB0ZW1weSA9IHk7XG4gICAgICBpZiAoIWlDaGVjaykge1xuICAgICAgICB0ZW1weSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgLSB5KTtcbiAgICAgICAgdGVtcHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCAtIHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB4ICE9PSB0aGlzLmdldFgoKSkge1xuICAgICAgICB0aGlzLnNldFgodGVtcHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB5ICE9PSB0aGlzLmdldFkoKSkge1xuICAgICAgICB0aGlzLnNldFkodGVtcHkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgQWN0aXZlKGZsZzogYW55ID0gdHJ1ZSkge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFJlbW92ZUxpbmUobGluZTogTGluZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuYXJyTGluZS5pbmRleE9mKGxpbmUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gIH1cbiAgcHVibGljIGdldFBvc3Rpc2lvbkRvdChpbmRleDogbnVtYmVyID0gMCkge1xuICAgIGxldCBlbERvdDogYW55ID0gdGhpcy5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3IoYC5ub2RlLWRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcbiAgICBpZiAoZWxEb3QpIHtcbiAgICAgIGxldCB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCArIGVsRG90Lm9mZnNldFRvcCArIDEwKTtcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0ICsgMTApO1xuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCkge1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMuZ2V0WSgpfXB4OyBsZWZ0OiAke3RoaXMuZ2V0WCgpfXB4O2ApO1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLlVwZGF0ZVVJKCk7XG4gICAgfSlcbiAgfVxuICBwdWJsaWMgZGVsZXRlKGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLmRlbGV0ZSh0aGlzLCBpc0NsZWFyRGF0YSkpO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMuZGF0YS5kZWxldGUoKTtcbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuUmVtb3ZlRGF0YUV2ZW50KCk7XG4gICAgfVxuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcbiAgICBpZiAoaXNDbGVhckRhdGEpXG4gICAgICB0aGlzLnBhcmVudC5SZW1vdmVOb2RlKHRoaXMpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBSZW5kZXJMaW5lKCkge1xuICAgIHRoaXMuZ2V0RGF0YUxpbmUoKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVGcm9tID0gdGhpcztcbiAgICAgIGxldCBub2RlVG8gPSB0aGlzLnBhcmVudC5HZXROb2RlQnlJZChpdGVtLkdldCgndG8nKSk7XG4gICAgICBsZXQgdG9JbmRleCA9IGl0ZW0uR2V0KCd0b0luZGV4Jyk7XG4gICAgICBsZXQgZnJvbUluZGV4ID0gaXRlbS5HZXQoJ2Zyb21JbmRleCcpO1xuICAgICAgbmV3IExpbmUobm9kZUZyb20sIGZyb21JbmRleCwgbm9kZVRvLCB0b0luZGV4LCBpdGVtKS5VcGRhdGVVSSgpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgRmxvd0NvcmUsIElNYWluLCBFdmVudEVudW0sIFByb3BlcnR5RW51bSwgU2NvcGVSb290IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlld19FdmVudCB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld19FdmVudFwiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcbmltcG9ydCB7IE5vZGVJdGVtIH0gZnJvbSBcIi4vTm9kZUl0ZW1cIjtcblxuZXhwb3J0IGNvbnN0IFpvb20gPSB7XG4gIG1heDogMS42LFxuICBtaW46IDAuNixcbiAgdmFsdWU6IDAuMSxcbiAgZGVmYXVsdDogMVxufVxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlldyBleHRlbmRzIEZsb3dDb3JlIHtcblxuICAvKipcbiAgICogR0VUIFNFVCBmb3IgRGF0YVxuICAgKi9cbiAgcHVibGljIGdldFpvb20oKSB7XG4gICAgcmV0dXJuICt0aGlzLmdldERhdGFHcm91cCgpLkdldCgnem9vbScpO1xuICB9XG4gIHB1YmxpYyBzZXRab29tKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5nZXREYXRhR3JvdXAoKS5TZXQoJ3pvb20nLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIGdldFkoKSB7XG4gICAgcmV0dXJuICt0aGlzLmdldERhdGFHcm91cCgpLkdldCgneScpO1xuICB9XG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5nZXREYXRhR3JvdXAoKS5TZXQoJ3knLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIGdldFgoKSB7XG4gICAgcmV0dXJuICt0aGlzLmdldERhdGFHcm91cCgpLkdldCgneCcpO1xuICB9XG4gIHB1YmxpYyBzZXRYKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5nZXREYXRhR3JvdXAoKS5TZXQoJ3gnLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHJpdmF0ZSBncm91cERhdGE6IERhdGFGbG93IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGxhc3RHcm91cE5hbWU6IHN0cmluZyA9IFwiXCI7XG4gIHByaXZhdGUgZ2V0RGF0YUdyb3VwKCk6IERhdGFGbG93IHtcbiAgICBpZiAodGhpcy4kbG9jaykgcmV0dXJuIHRoaXMuZGF0YTtcbiAgICAvLyBjYWNoZSBncm91cERhdGFcbiAgICBpZiAodGhpcy5sYXN0R3JvdXBOYW1lID09PSB0aGlzLkN1cnJlbnRHcm91cCgpKSByZXR1cm4gdGhpcy5ncm91cERhdGEgPz8gdGhpcy5kYXRhO1xuICAgIHRoaXMubGFzdEdyb3VwTmFtZSA9IHRoaXMuQ3VycmVudEdyb3VwKCk7XG4gICAgbGV0IGdyb3VwcyA9IHRoaXMuZGF0YS5HZXQoJ2dyb3VwcycpO1xuICAgIHRoaXMuZ3JvdXBEYXRhID0gZ3JvdXBzPy5maWx0ZXIoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLkdldCgnZ3JvdXAnKSA9PSB0aGlzLmxhc3RHcm91cE5hbWUpPy5bMF07XG4gICAgaWYgKCF0aGlzLmdyb3VwRGF0YSkge1xuICAgICAgdGhpcy5ncm91cERhdGEgPSBuZXcgRGF0YUZsb3codGhpcy5tYWluLCB7XG4gICAgICAgIGtleTogUHJvcGVydHlFbnVtLmdyb3VwQ2F2YXMsXG4gICAgICAgIGdyb3VwOiB0aGlzLmxhc3RHcm91cE5hbWVcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kYXRhLkFwcGVuZCgnZ3JvdXBzJywgdGhpcy5ncm91cERhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgfVxuICAgIGxldCBkYXRhR3JvdXAgPSB0aGlzLkdldERhdGFCeUlkKHRoaXMubGFzdEdyb3VwTmFtZSk7XG4gICAgaWYgKGRhdGFHcm91cCkge1xuICAgICAgZGF0YUdyb3VwLm9uU2FmZShgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcbiAgICAgICAgdGhpcy5jaGFuZ2VHcm91cCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ3JvdXBEYXRhO1xuICB9XG4gIHByaXZhdGUgZ3JvdXA6IGFueVtdID0gW107XG4gIHB1YmxpYyBHZXRHcm91cE5hbWUoKTogYW55W10ge1xuICAgIHJldHVybiBbLi4udGhpcy5ncm91cC5tYXAoKGl0ZW0pID0+ICh7IGlkOiBpdGVtLCB0ZXh0OiB0aGlzLkdldERhdGFCeUlkKGl0ZW0pPy5HZXQoJ25hbWUnKSB9KSksIHsgaWQ6IFNjb3BlUm9vdCwgdGV4dDogU2NvcGVSb290IH1dO1xuICB9XG4gIHB1YmxpYyBCYWNrR3JvdXAoaWQ6IGFueSA9IG51bGwpIHtcbiAgICBsZXQgaW5kZXggPSAxO1xuICAgIGlmIChpZCkge1xuICAgICAgaW5kZXggPSB0aGlzLmdyb3VwLmluZGV4T2YoaWQpO1xuICAgICAgaWYgKGluZGV4IDwgMCkgaW5kZXggPSAwO1xuICAgIH1cbiAgICBpZiAoaW5kZXgpXG4gICAgICB0aGlzLmdyb3VwLnNwbGljZSgwLCBpbmRleCk7XG4gICAgZWxzZSB0aGlzLmdyb3VwID0gW107XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICAgIHRoaXMuY2hhbmdlR3JvdXAoKTtcbiAgfVxuICBwdWJsaWMgQ3VycmVudEdyb3VwKCkge1xuICAgIGxldCBuYW1lID0gdGhpcy5ncm91cD8uWzBdO1xuICAgIGlmIChuYW1lICYmIG5hbWUgIT0gJycpIHtcbiAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbiAgICByZXR1cm4gJ3Jvb3QnO1xuICB9XG5cbiAgcHVibGljIEN1cnJlbnRHcm91cERhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuR2V0RGF0YUJ5SWQodGhpcy5DdXJyZW50R3JvdXAoKSkgPz8gdGhpcy5kYXRhO1xuICB9XG4gIHB1YmxpYyBjaGFuZ2VHcm91cCgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMubWFpbi5kaXNwYXRjaChFdmVudEVudW0uZ3JvdXBDaGFuZ2UsIHtcbiAgICAgICAgZ3JvdXA6IHRoaXMuR2V0R3JvdXBOYW1lKClcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBvcGVuR3JvdXAoaWQ6IGFueSkge1xuICAgIHRoaXMuZ3JvdXAgPSBbaWQsIC4uLnRoaXMuZ3JvdXBdO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLmNoYW5nZUdyb3VwKCk7O1xuICB9XG4gIHByaXZhdGUgbGluZUNob29zZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldExpbmVDaG9vc2Uobm9kZTogTGluZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHRoaXMubGluZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubGluZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkge1xuICAgICAgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRMaW5lQ2hvb3NlKCk6IExpbmUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmxpbmVDaG9vc2U7XG4gIH1cbiAgcHJpdmF0ZSBub2RlczogTm9kZUl0ZW1bXSA9IFtdO1xuICBwcml2YXRlIG5vZGVDaG9vc2U6IE5vZGVJdGVtIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgc2V0Tm9kZUNob29zZShub2RlOiBOb2RlSXRlbSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHRoaXMubm9kZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubm9kZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkge1xuICAgICAgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXRMaW5lQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5ub2RlQ2hvb3NlLmRhdGEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLkN1cnJlbnRHcm91cERhdGEoKSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldE5vZGVDaG9vc2UoKTogTm9kZUl0ZW0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm5vZGVDaG9vc2U7XG4gIH1cbiAgcHVibGljIEFkZE5vZGVJdGVtKGRhdGE6IGFueSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5BZGROb2RlKGRhdGEuR2V0KCdrZXknKSwgZGF0YSk7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUoa2V5Tm9kZTogc3RyaW5nLCBkYXRhOiBhbnkgPSB7fSk6IE5vZGVJdGVtIHtcbiAgICByZXR1cm4gdGhpcy5JbnNlcnROb2RlKG5ldyBOb2RlSXRlbSh0aGlzLCBrZXlOb2RlLCBkYXRhKSk7XG4gIH1cbiAgcHVibGljIEluc2VydE5vZGUobm9kZTogTm9kZUl0ZW0pOiBOb2RlSXRlbSB7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlSXRlbSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICB0aGlzLmRhdGEuUmVtb3ZlKCdub2RlcycsIG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBDbGVhck5vZGUoKSB7XG4gICAgdGhpcy5ub2Rlcz8uZm9yRWFjaChpdGVtID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICB9XG4gIHB1YmxpYyBHZXREYXRhQWxsTm9kZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuICh0aGlzLmRhdGE/LkdldCgnbm9kZXMnKSA/PyBbXSk7XG4gIH1cbiAgcHVibGljIEdldERhdGFOb2RlKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQWxsTm9kZSgpLmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KFwiZ3JvdXBcIikgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpO1xuICB9XG4gIC8qKlxuICAgKiBWYXJpYnV0ZVxuICAqL1xuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyAkbG9jazogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBhbnkgPSAxO1xuICBwdWJsaWMgY29uc3RydWN0b3IoZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmVsTm9kZSA9IGVsTm9kZTtcbiAgICBsZXQgcHJvcGVydGllczogYW55ID0gdGhpcy5tYWluLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLm1haW4pO1xuICAgIHRoaXMuZGF0YS5Jbml0RGF0YSh7fSwgcHJvcGVydGllcyk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnZGVzZ2luZXItdmlldycpXG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QucmVtb3ZlKFwiZGVzZ2luZXItY2FudmFzXCIpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2Rlc2dpbmVyLXZpZXcnKVxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LmFkZChcImRlc2dpbmVyLWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsQ2FudmFzKTtcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XG4gICAgbmV3IERlc2dpbmVyVmlld19FdmVudCh0aGlzKTtcbiAgICB0aGlzLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLlJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgIHRoaXMub24oRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgKGRhdGE6IGFueSkgPT4geyBtYWluLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIGRhdGEpOyB9KTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCAoaXRlbTogYW55KSA9PiB7XG4gICAgICB0aGlzLk9wZW4oaXRlbS5kYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLnpvb20sICh7IHpvb20gfTogYW55KSA9PiB7XG4gICAgICBpZiAoem9vbSA9PSAwKSB7XG4gICAgICAgIHRoaXMuem9vbV9yZXNldCgpO1xuICAgICAgfSBlbHNlIGlmICh6b29tID09IDEpIHtcbiAgICAgICAgdGhpcy56b29tX291dCgpO1xuICAgICAgfSBlbHNlIGlmICh6b29tID09IC0xKSB7XG4gICAgICAgIHRoaXMuem9vbV9pbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgIH0pO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uc2V0R3JvdXAsICh7IGdyb3VwSWQgfTogYW55KSA9PiB7XG4gICAgICB0aGlzLkJhY2tHcm91cChncm91cElkKTtcbiAgICB9KTtcbiAgICB0aGlzLmNoYW5nZUdyb3VwKCk7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlVmlldyh4OiBhbnksIHk6IGFueSwgem9vbTogYW55KSB7XG4gICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7eH1weCwgJHt5fXB4KSBzY2FsZSgke3pvb219KWA7XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCkge1xuICAgIHRoaXMudXBkYXRlVmlldyh0aGlzLmdldFgoKSwgdGhpcy5nZXRZKCksIHRoaXMuZ2V0Wm9vbSgpKTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyVUkoZGV0YWlsOiBhbnkgPSB7fSkge1xuICAgIGlmIChkZXRhaWwuc2VuZGVyICYmIGRldGFpbC5zZW5kZXIgaW5zdGFuY2VvZiBOb2RlSXRlbSkgcmV0dXJuO1xuICAgIGlmIChkZXRhaWwuc2VuZGVyICYmIGRldGFpbC5zZW5kZXIgaW5zdGFuY2VvZiBEZXNnaW5lclZpZXcpIHtcbiAgICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5DbGVhck5vZGUoKTtcbiAgICB0aGlzLkdldERhdGFOb2RlKCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICB0aGlzLkFkZE5vZGVJdGVtKGl0ZW0pO1xuICAgIH0pO1xuICAgIHRoaXMuR2V0QWxsTm9kZSgpLmZvckVhY2goKGl0ZW06IE5vZGVJdGVtKSA9PiB7XG4gICAgICBpdGVtLlJlbmRlckxpbmUoKTtcbiAgICB9KVxuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgfVxuICBwdWJsaWMgT3BlbigkZGF0YTogRGF0YUZsb3cpIHtcbiAgICBpZiAoJGRhdGEgPT0gdGhpcy5kYXRhKSB7XG4gICAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZGF0YT8uZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIChkZXRhaWw6IGFueSkgPT4gdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwgZGV0YWlsKSk7XG4gICAgdGhpcy5kYXRhID0gJGRhdGE7XG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoZGV0YWlsOiBhbnkpID0+IHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIGRldGFpbCkpO1xuICAgIHRoaXMuJGxvY2sgPSBmYWxzZTtcbiAgICB0aGlzLmxhc3RHcm91cE5hbWUgPSAnJztcbiAgICB0aGlzLmdyb3VwRGF0YSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmdyb3VwID0gW107XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICAgIHRoaXMuY2hhbmdlR3JvdXAoKTtcbiAgfVxuICBwdWJsaWMgQ2FsY1gobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50V2lkdGggLyAodGhpcy5lbE5vZGU/LmNsaWVudFdpZHRoICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwdWJsaWMgQ2FsY1kobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxOb2RlPy5jbGllbnRIZWlnaHQgKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHB1YmxpYyBHZXRBbGxOb2RlKCk6IE5vZGVJdGVtW10ge1xuICAgIHJldHVybiB0aGlzLm5vZGVzIHx8IFtdO1xuICB9XG4gIHB1YmxpYyBHZXROb2RlQnlJZChpZDogc3RyaW5nKTogTm9kZUl0ZW0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLkdldEFsbE5vZGUoKS5maWx0ZXIobm9kZSA9PiBub2RlLkdldElkKCkgPT0gaWQpPy5bMF07XG4gIH1cblxuICBwdWJsaWMgR2V0RGF0YUJ5SWQoaWQ6IHN0cmluZyk6IERhdGFGbG93IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuR2V0RGF0YUFsbE5vZGUoKS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uR2V0KCdpZCcpID09PSBpZCk/LlswXTtcbiAgfVxuICBjaGVja09ubHlOb2RlKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuICh0aGlzLm1haW4uZ2V0Q29udHJvbEJ5S2V5KGtleSkub25seU5vZGUpICYmIHRoaXMubm9kZXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5DaGVja0tleShrZXkpKS5sZW5ndGggPiAwO1xuICB9XG4gIHB1YmxpYyB6b29tX3JlZnJlc2goZmxnOiBhbnkgPSAwKSB7XG4gICAgbGV0IHRlbXBfem9vbSA9IGZsZyA9PSAwID8gWm9vbS5kZWZhdWx0IDogKHRoaXMuZ2V0Wm9vbSgpICsgWm9vbS52YWx1ZSAqIGZsZyk7XG4gICAgaWYgKFpvb20ubWF4ID49IHRlbXBfem9vbSAmJiB0ZW1wX3pvb20gPj0gWm9vbS5taW4pIHtcbiAgICAgIHRoaXMuc2V0WCgodGhpcy5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0ZW1wX3pvb20pO1xuICAgICAgdGhpcy5zZXRZKCh0aGlzLmdldFkoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XG4gICAgICB0aGlzLnpvb21fbGFzdF92YWx1ZSA9IHRlbXBfem9vbTtcbiAgICAgIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb21fbGFzdF92YWx1ZSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX2luKCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKDEpO1xuICB9XG4gIHB1YmxpYyB6b29tX291dCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgtMSk7XG4gIH1cbiAgcHVibGljIHpvb21fcmVzZXQoKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBFdmVudEVudW0sIElNYWluLCBTY29wZVJvb3QgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuXG5leHBvcnQgY2xhc3MgVmFyaWFibGVWaWV3IHtcbiAgcHJpdmF0ZSB2YXJpYWJsZXM6IERhdGFGbG93W10gfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtdmFyaWFibGUnKTtcbiAgICB0aGlzLm1haW4ub25TYWZlKEV2ZW50RW51bS5jaGFuZ2VWYXJpYWJsZSwgKHsgZGF0YSB9OiBhbnkpID0+IHtcbiAgICAgIHRoaXMuUmVuZGVyKCk7XG4gICAgfSk7XG4gICAgdGhpcy5tYWluLm9uU2FmZShFdmVudEVudW0ub3BlblByb2plY3QsICgpID0+IHtcbiAgICAgIHRoaXMuUmVuZGVyKCk7XG4gICAgfSk7XG4gICAgdGhpcy5tYWluLm9uU2FmZShFdmVudEVudW0uZ3JvdXBDaGFuZ2UsICgpID0+IHtcbiAgICAgIHRoaXMuUmVuZGVyKCk7XG4gICAgfSlcbiAgICB0aGlzLlJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXIoKSB7XG4gICAgdGhpcy52YXJpYWJsZXMgPSB0aGlzLm1haW4uZ2V0VmFyaWFibGUoKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgICA8dGFibGUgYm9yZGVyPVwiMVwiPlxuICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgPHRyPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtbmFtZVwiPk5hbWU8L3RkPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtdHlwZVwiPlR5cGU8L3RkPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtc2NvcGVcIj5TY29wZTwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1kZWZhdWx0XCI+RGVmYXVsdDwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1idXR0b25cIj48L3RkPlxuICAgICAgICAgIDwvdHI+XG4gICAgICAgIDwvdGhlYWQ+XG4gICAgICAgIDx0Ym9keT5cbiAgICAgICAgPC90Ym9keT5cbiAgICAgIDwvdGFibGU+XG4gICAgYDtcbiAgICBpZiAodGhpcy52YXJpYWJsZXMpIHtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy52YXJpYWJsZXMpIHtcbiAgICAgICAgbmV3IFZhcmlhYmxlSXRlbShpdGVtLCB0aGlzKS5SZW5kZXJTY29wZSh0aGlzLm1haW4uZ2V0R3JvdXBDdXJyZW50KCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuY2xhc3MgVmFyaWFibGVJdGVtIHtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcbiAgcHJpdmF0ZSBuYW1lSW5wdXQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgcHJpdmF0ZSB0eXBlSW5wdXQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gIHByaXZhdGUgc2NvcGVJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgcHJpdmF0ZSB2YWx1ZURlZmF1bHRJbnB1dDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSB2YXJpYWJsZTogRGF0YUZsb3csIHByaXZhdGUgcGFyZW50OiBWYXJpYWJsZVZpZXcpIHtcbiAgICAodGhpcy5uYW1lSW5wdXQgYXMgYW55KS52YWx1ZSA9IHRoaXMudmFyaWFibGUuR2V0KCduYW1lJyk7XG4gICAgKHRoaXMudmFsdWVEZWZhdWx0SW5wdXQgYXMgYW55KS52YWx1ZSA9IHRoaXMudmFyaWFibGUuR2V0KCdpbml0YWxWYWx1ZScpID8/ICcnO1xuICAgICh0aGlzLnR5cGVJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5HZXQoJ3R5cGUnKSA/PyAnJztcbiAgICBmb3IgKGxldCBpdGVtIG9mIFsndGV4dCcsICdudW1iZXInLCAnZGF0ZScsICdvYmplY3QnXSkge1xuICAgICAgbGV0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgb3B0aW9uLnRleHQgPSBpdGVtO1xuICAgICAgb3B0aW9uLnZhbHVlID0gaXRlbTtcbiAgICAgIHRoaXMudHlwZUlucHV0LmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgfVxuICAgIGxldCBuYW1lQ29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICBuYW1lQ29sdW1uLmFwcGVuZENoaWxkKHRoaXMubmFtZUlucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChuYW1lQ29sdW1uKTtcbiAgICB0aGlzLm5hbWVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGU6IGFueSkgPT4ge1xuICAgICAgdGhpcy52YXJpYWJsZS5TZXQoJ25hbWUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG4gICAgdGhpcy5uYW1lSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IGFueSkgPT4ge1xuICAgICAgdGhpcy52YXJpYWJsZS5TZXQoJ25hbWUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBsZXQgdHlwZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgdHlwZUNvbHVtbi5hcHBlbmRDaGlsZCh0aGlzLnR5cGVJbnB1dCk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodHlwZUNvbHVtbik7XG4gICAgdGhpcy50eXBlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IGFueSkgPT4ge1xuICAgICAgdGhpcy52YXJpYWJsZS5TZXQoJ3R5cGUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG4gICAgbGV0IHNjb3BlQ29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICBzY29wZUNvbHVtbi5hcHBlbmRDaGlsZCh0aGlzLnNjb3BlSW5wdXQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHNjb3BlQ29sdW1uKTtcblxuXG4gICAgbGV0IHZhbHVlRGVmYXVsdENvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgdmFsdWVEZWZhdWx0Q29sdW1uLmFwcGVuZENoaWxkKHRoaXMudmFsdWVEZWZhdWx0SW5wdXQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHZhbHVlRGVmYXVsdENvbHVtbik7XG4gICAgdGhpcy52YWx1ZURlZmF1bHRJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZhcmlhYmxlLlNldCgnaW5pdGFsVmFsdWUnLCBlLnRhcmdldC52YWx1ZSk7XG4gICAgfSk7XG4gICAgdGhpcy52YWx1ZURlZmF1bHRJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGU6IGFueSkgPT4ge1xuICAgICAgdGhpcy52YXJpYWJsZS5TZXQoJ2luaXRhbFZhbHVlJywgZS50YXJnZXQudmFsdWUpO1xuICAgIH0pO1xuXG4gICAgbGV0IGJ1dHRvblJlbW92ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ1dHRvblJlbW92ZS5pbm5lckhUTUwgPSBgLWA7XG4gICAgYnV0dG9uUmVtb3ZlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgcGFyZW50Lm1haW4ucmVtb3ZlVmFyaWFibGUodmFyaWFibGUpO1xuICAgIH0pO1xuICAgIGxldCBidXR0b25SZW1vdmVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIGJ1dHRvblJlbW92ZUNvbHVtbi5hcHBlbmRDaGlsZChidXR0b25SZW1vdmUpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGJ1dHRvblJlbW92ZUNvbHVtbik7XG5cbiAgICBwYXJlbnQuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJ3RhYmxlIHRib2R5Jyk/LmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcblxuICB9XG4gIFJlbmRlclNjb3BlKGdyb3VwOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5zY29wZUlucHV0LmlubmVySFRNTCA9ICcnO1xuICAgIGlmIChncm91cCkge1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBncm91cCkge1xuICAgICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICAgIG9wdGlvbi50ZXh0ID0gaXRlbS50ZXh0O1xuICAgICAgICBvcHRpb24udmFsdWUgPSBpdGVtLmlkO1xuICAgICAgICB0aGlzLnNjb3BlSW5wdXQucHJlcGVuZChvcHRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICAodGhpcy5zY29wZUlucHV0IGFzIGFueSkudmFsdWUgPSB0aGlzLnZhcmlhYmxlLkdldCgnc2NvcGUnKTtcbiAgICB0aGlzLnNjb3BlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IGFueSkgPT4ge1xuICAgICAgdGhpcy52YXJpYWJsZS5TZXQoJ3Njb3BlJywgZS50YXJnZXQudmFsdWUpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5cbmV4cG9ydCBjbGFzcyBUb29sYm94VmlldyB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtdG9vbGJveCcpO1xuICAgIHRoaXMuUmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIFJlbmRlcigpIHtcbiAgICBsZXQgY29udHJvbHMgPSB0aGlzLm1haW4uZ2V0Q29udHJvbEFsbCgpO1xuICAgIGxldCBncm91cDogYW55ID0ge307XG5cbiAgICBPYmplY3Qua2V5cyhjb250cm9scykuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICBsZXQgZ3JvdXBOYW1lID0gY29udHJvbHNbaXRlbV0uZ3JvdXAgPz8gXCJvdGhlclwiO1xuICAgICAgaWYgKGdyb3VwW2dyb3VwTmFtZV0gPT09IHVuZGVmaW5lZCkgZ3JvdXBbZ3JvdXBOYW1lXSA9IFtdO1xuICAgICAgZ3JvdXBbZ3JvdXBOYW1lXSA9IFtcbiAgICAgICAgLi4uZ3JvdXBbZ3JvdXBOYW1lXSxcbiAgICAgICAgY29udHJvbHNbaXRlbV1cbiAgICAgIF07XG4gICAgfSk7XG4gICAgT2JqZWN0LmtleXMoZ3JvdXApLmZvckVhY2goKGl0ZW06IGFueSwgaW5kZXgpID0+IHtcbiAgICAgIGxldCBpdGVtQm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBpdGVtQm94LmNsYXNzTGlzdC5hZGQoJ25vZGUtYm94Jyk7XG4gICAgICBpdGVtQm94LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgaXRlbUJveC5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxwIGNsYXNzPVwibm9kZS1ib3hfdGl0bGVcIj4ke2l0ZW19PC9wPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3hfYm9ieVwiPjwvZGl2PlxuICAgICAgYDtcbiAgICAgIGl0ZW1Cb3gucXVlcnlTZWxlY3RvcignLm5vZGUtYm94X3RpdGxlJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBpZiAoaXRlbUJveC5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKSB7XG4gICAgICAgICAgaXRlbUJveC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGl0ZW1Cb3guY2xhc3NMaXN0LmFkZCgnYWN0aXZlJylcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmb3IgKGxldCBfaXRlbSBvZiBncm91cFtpdGVtXSkge1xuICAgICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XG4gICAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcbiAgICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBfaXRlbS5rZXkpO1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtfaXRlbS5pY29ufSA8c3Bhbj4ke19pdGVtLm5hbWV9PC9zcGFuYDtcbiAgICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcbiAgICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsIHRoaXMuZHJhZ2VuZC5iaW5kKHRoaXMpKVxuICAgICAgICBpdGVtQm94LnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWJveF9ib2J5Jyk/LmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGl0ZW1Cb3gpO1xuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgZHJhZ2VuZChlOiBhbnkpIHtcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgZHJhZ1N0YXJ0KGU6IGFueSkge1xuICAgIGxldCBrZXkgPSBlLnRhcmdldC5jbG9zZXN0KFwiLm5vZGUtaXRlbVwiKS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgIHRoaXMubWFpbi5zZXRDb250cm9sQ2hvb3NlKGtleSk7XG4gICAgaWYgKGUudHlwZSAhPT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJub2RlXCIsIGtleSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBFdmVudEVudW0sIElNYWluLCBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9qZWN0VmlldyB7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvamVjdCcpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXIoKSB7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgbGV0IHByb2plY3RzID0gdGhpcy5tYWluLmdldFByb2plY3RBbGwoKTtcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0LWlkJywgaXRlbS5HZXQoJ2lkJykpO1xuICAgICAgaXRlbS5vblNhZmUoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMubWFpbi5jaGVja1Byb2plY3RPcGVuKGl0ZW0pKSB7XG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubWFpbi5zZXRQcm9qZWN0T3BlbihpdGVtKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbE5vZGU/LmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvSUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFRhYlByb2plY3RWaWV3IHtcbiAgcHJpdmF0ZSAkZWxCb2J5OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHJpdmF0ZSAkZWxXYXJwOiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHJpdmF0ZSAkYnRuTmV4dDogRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHByaXZhdGUgJGJ0bkJhY2s6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwcml2YXRlICRidG5BZGQ6IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwcml2YXRlICRidG5ab29tSW46IEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwcml2YXRlICRidG5ab29tT3V0OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHJpdmF0ZSAkYnRuWm9vbVJlc2V0OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHJpdmF0ZSAkYnRuUnVuUHJvamVjdDogRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtdGFiLXByb2plY3QnKTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB0aGlzLlJlbmRlci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLlJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXIoKSB7XG4gICAgbGV0IHNjcm9sbExlZnRDYWNoZSA9IHRoaXMuJGVsV2FycD8uc2Nyb2xsTGVmdCA/PyAwO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3RfX3NlYXJjaFwiPjwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9fbGlzdFwiPlxuICAgICAgPGRpdiBjbGFzcz1cInRhYi1wcm9qZWN0X2J1dHRvblwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuLWJhY2tcIj48aSBjbGFzcz1cImZhcyBmYS1hbmdsZS1sZWZ0XCI+PC9pPjwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3Rfd2FycFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3RfX2JvZHlcIj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9idXR0b25cIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1uZXh0XCI+PGkgY2xhc3M9XCJmYXMgZmEtYW5nbGUtcmlnaHRcIj48L2k+PC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0YWItcHJvamVjdF9idXR0b25cIj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1hZGRcIj48aSBjbGFzcz1cImZhcyBmYS1wbHVzXCI+PC9pPjwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3RfYnV0dG9uXCI+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4tcnVuLXByb2plY3RcIj48aSBjbGFzcz1cImZhcyBmYS1wbGF5XCI+PC9pPiBSdW48L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRhYi1wcm9qZWN0X2J1dHRvblwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuLXpvb20taW5cIj48aSBjbGFzcz1cImZhcyBmYS1zZWFyY2gtcGx1c1wiPjwvaT48L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRhYi1wcm9qZWN0X2J1dHRvblwiPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYnRuLXpvb20tb3V0XCI+PGkgY2xhc3M9XCJmYXMgZmEtc2VhcmNoLW1pbnVzXCI+PC9pPjwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFiLXByb2plY3RfYnV0dG9uXCI+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4tem9vbS1yZXNldFwiPjxpIGNsYXNzPVwiZmFzIGZhLXJlZG9cIj48L2k+PC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICBgO1xuICAgIHRoaXMuJGVsV2FycCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy50YWItcHJvamVjdF93YXJwJyk7XG4gICAgdGhpcy4kZWxCb2J5ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnRhYi1wcm9qZWN0X19ib2R5Jyk7XG4gICAgdGhpcy4kYnRuQmFjayA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG4tYmFjaycpO1xuICAgIHRoaXMuJGJ0bk5leHQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuLW5leHQnKTtcbiAgICB0aGlzLiRidG5BZGQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuLWFkZCcpO1xuICAgIHRoaXMuJGJ0blpvb21JbiA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG4tem9vbS1pbicpO1xuICAgIHRoaXMuJGJ0blpvb21PdXQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuLXpvb20tb3V0Jyk7XG4gICAgdGhpcy4kYnRuWm9vbVJlc2V0ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bi16b29tLXJlc2V0Jyk7XG4gICAgdGhpcy4kYnRuUnVuUHJvamVjdCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG4tcnVuLXByb2plY3QnKTtcbiAgICBjb25zdCBmblVwZGF0ZVNjcm9sbCA9ICgpID0+IHtcbiAgICAgIGlmICh0aGlzLiRlbFdhcnApIHtcbiAgICAgICAgLy8gbGV0IHNjcm9sbExlZnQgPSB0aGlzLiRlbFdhcnAuc2Nyb2xsTGVmdDtcbiAgICAgICAgLy8gdmFyIG1heFNjcm9sbExlZnQgPSB0aGlzLiRlbFdhcnAuc2Nyb2xsV2lkdGggLSB0aGlzLiRlbFdhcnAuY2xpZW50V2lkdGg7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHNjcm9sbExlZnQpO1xuICAgICAgICAvLyBpZiAodGhpcy4kYnRuQmFjayAmJiBzY3JvbGxMZWZ0IDw9IDApIHtcbiAgICAgICAgLy8gICB0aGlzLiRidG5CYWNrLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApXG4gICAgICAgIC8vIH0gZWxzZSBpZiAodGhpcy4kYnRuQmFjayAmJiBzY3JvbGxMZWZ0ID4gMCkge1xuICAgICAgICAvLyAgIHRoaXMuJGJ0bkJhY2sucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGlmICh0aGlzLiRidG5OZXh0ICYmIHNjcm9sbExlZnQgPj0gbWF4U2Nyb2xsTGVmdCkge1xuICAgICAgICAvLyAgIHRoaXMuJGJ0bk5leHQuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YClcbiAgICAgICAgLy8gfSBlbHNlIGlmICh0aGlzLiRidG5OZXh0ICYmIHNjcm9sbExlZnQgPD0gMCkge1xuICAgICAgICAvLyAgIHRoaXMuJGJ0bk5leHQucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICAgICAgICAvLyB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuJGVsV2FycD8uYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBldmVudCA9PiB7XG4gICAgICBmblVwZGF0ZVNjcm9sbCgpO1xuICAgIH0sIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgICBmblVwZGF0ZVNjcm9sbCgpO1xuICAgIHRoaXMuJGJ0bkJhY2s/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuJGVsV2FycCkge1xuICAgICAgICB0aGlzLiRlbFdhcnAuc2Nyb2xsTGVmdCAtPSAxMDA7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy4kYnRuTmV4dD8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy4kZWxXYXJwKSB7XG4gICAgICAgIHRoaXMuJGVsV2FycC5zY3JvbGxMZWZ0ICs9IDEwMDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLiRidG5BZGQ/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgdGhpcy5tYWluLm5ld1Byb2plY3QoXCJcIik7XG4gICAgfSk7XG4gICAgdGhpcy4kYnRuWm9vbUluPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIHRoaXMubWFpbi5kaXNwYXRjaChFdmVudEVudW0uem9vbSwgeyB6b29tOiAtMSB9KTtcbiAgICB9KTtcbiAgICB0aGlzLiRidG5ab29tT3V0Py5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIHRoaXMubWFpbi5kaXNwYXRjaChFdmVudEVudW0uem9vbSwgeyB6b29tOiAxIH0pO1xuICAgIH0pO1xuICAgIHRoaXMuJGJ0blpvb21SZXNldD8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnpvb20sIHsgem9vbTogMCB9KTtcbiAgICB9KTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLnN0YXR1c0JvdCwgKGZsZzogYW55KSA9PiB7XG4gICAgICBpZiAodGhpcy4kYnRuUnVuUHJvamVjdCkge1xuICAgICAgICBpZiAoZmxnKSB7XG4gICAgICAgICAgdGhpcy4kYnRuUnVuUHJvamVjdC5pbm5lckhUTUwgPSBgPGkgY2xhc3M9XCJmYXMgZmEtc3RvcFwiPjwvaT4gU3RvcGA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4kYnRuUnVuUHJvamVjdC5pbm5lckhUTUwgPSBgPGkgY2xhc3M9XCJmYXMgZmEtcGxheVwiPjwvaT4gUnVuYDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuJGJ0blJ1blByb2plY3Q/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMubWFpbi5ydW5uaW5nKCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3N0b3AnKTtcbiAgICAgICAgdGhpcy5tYWluLnN0b3BQcm9qZWN0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygncnVuJyk7XG4gICAgICAgIHRoaXMubWFpbi5ydW5Qcm9qZWN0KCk7XG4gICAgICB9XG4gICAgfSlcbiAgICBsZXQgcHJvamVjdHMgPSB0aGlzLm1haW4uZ2V0UHJvamVjdEFsbCgpO1xuICAgIGxldCBpdGVtQWN0aXZlOiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgcHJvamVjdCBvZiBwcm9qZWN0cykge1xuICAgICAgbGV0IHByb2plY3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBsZXQgcHJvamVjdE5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBsZXQgcHJvamVjdEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbGV0IHByb2plY3RCdXR0b25SZW1vdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIHByb2plY3RJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0LWlkJywgcHJvamVjdC5HZXQoJ2lkJykpO1xuICAgICAgcHJvamVjdE5hbWUuaW5uZXJIVE1MID0gcHJvamVjdC5HZXQoJ25hbWUnKTtcbiAgICAgIHByb2plY3ROYW1lLmNsYXNzTGlzdC5hZGQoJ3Byby1uYW1lJyk7XG4gICAgICBwcm9qZWN0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3Byby1idXR0b24nKTtcbiAgICAgIHByb2plY3RCdXR0b25SZW1vdmUuaW5uZXJIVE1MID0gYDxpIGNsYXNzPVwiZmFzIGZhLW1pbnVzXCI+PC9pPmA7XG4gICAgICBwcm9qZWN0QnV0dG9uLmFwcGVuZENoaWxkKHByb2plY3RCdXR0b25SZW1vdmUpO1xuICAgICAgcHJvamVjdEl0ZW0uYXBwZW5kQ2hpbGQocHJvamVjdE5hbWUpO1xuICAgICAgcHJvamVjdEl0ZW0uYXBwZW5kQ2hpbGQocHJvamVjdEJ1dHRvbik7XG5cbiAgICAgIHByb2plY3RJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb2plY3QtaXRlbScpO1xuICAgICAgaWYgKHRoaXMubWFpbi5jaGVja1Byb2plY3RPcGVuKHByb2plY3QpKSB7XG4gICAgICAgIHByb2plY3RJdGVtLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICBpdGVtQWN0aXZlID0gcHJvamVjdEl0ZW07XG4gICAgICB9XG4gICAgICBwcm9qZWN0SXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgIGlmICghcHJvamVjdEJ1dHRvblJlbW92ZS5jb250YWlucyhlLnRhcmdldCBhcyBOb2RlKSAmJiBlLnRhcmdldCAhPSBwcm9qZWN0QnV0dG9uUmVtb3ZlKSB7XG4gICAgICAgICAgdGhpcy5tYWluLnNldFByb2plY3RPcGVuKHByb2plY3QpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHByb2plY3RCdXR0b25SZW1vdmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICB0aGlzLm1haW4ucmVtb3ZlUHJvamVjdChwcm9qZWN0KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy4kZWxCb2J5Py5hcHBlbmRDaGlsZChwcm9qZWN0SXRlbSk7XG4gICAgICBwcm9qZWN0Lm9uU2FmZShFdmVudEVudW0uZGF0YUNoYW5nZSArICdfbmFtZScsICgpID0+IHtcbiAgICAgICAgcHJvamVjdE5hbWUuaW5uZXJIVE1MID0gcHJvamVjdC5HZXQoJ25hbWUnKTtcbiAgICAgIH0pXG4gICAgfVxuICAgIGlmICh0aGlzLiRlbFdhcnApIHtcbiAgICAgIGlmIChpdGVtQWN0aXZlICE9IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLiRlbFdhcnAuc2Nyb2xsTGVmdCA9IGl0ZW1BY3RpdmUub2Zmc2V0TGVmdCAtIDIwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kZWxXYXJwLnNjcm9sbExlZnQgPSBzY3JvbGxMZWZ0Q2FjaGU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBFdmVudEVudW0sIElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIEJyZWFkY3J1bWJHcm91cFZpZXcge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLWJyZWFkY3J1bWItZ3JvdXAnKTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLmdyb3VwQ2hhbmdlLCAoeyBncm91cCB9OiBhbnkpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyKGdyb3VwKVxuICAgIH0pO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICcnO1xuICB9XG4gIHB1YmxpYyByZW5kZXIoZ3JvdXA6IGFueSkge1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICcnO1xuICAgIGlmICghdGhpcy5lbE5vZGUgfHwgIWdyb3VwKSByZXR1cm47XG5cblxuICAgIGxldCBlbFVMID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICBsZXQgaXNGaXJzdCA9IHRydWU7XG4gICAgZ3JvdXAuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICBpZiAoIWlzRmlyc3QpIHtcbiAgICAgICAgbGV0IGVsTEkyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgZWxMSTIuaW5uZXJIVE1MID0gXCI+XCI7XG4gICAgICAgIGVsVUwucHJlcGVuZChlbExJMik7XG4gICAgICB9XG4gICAgICBsZXQgZWxMSSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICBlbExJLmlubmVySFRNTCA9IGl0ZW0udGV4dDtcbiAgICAgIGVsTEkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnNldEdyb3VwSWQoaXRlbS5pZCkpO1xuICAgICAgZWxMSS5jbGFzc0xpc3QuYWRkKCdncm91cC1pdGVtJyk7XG4gICAgICBlbFVMLnByZXBlbmQoZWxMSSk7XG4gICAgICBpc0ZpcnN0ID0gZmFsc2U7XG4gICAgfSk7XG4gICAgbGV0IGVsV2FycCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsV2FycC5jbGFzc0xpc3QuYWRkKCdncm91cC13YXJwJyk7XG4gICAgbGV0IGVsQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsQm9keS5jbGFzc0xpc3QuYWRkKCdncm91cC1ib2R5Jyk7XG4gICAgZWxXYXJwLmFwcGVuZENoaWxkKGVsQm9keSk7XG4gICAgZWxCb2R5LmFwcGVuZENoaWxkKGVsVUwpO1xuXG4gICAgaWYgKGdyb3VwLmxlbmd0aCA+IDEpIHtcbiAgICAgIGxldCBlbEJ1dHR1bkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZWxCdXR0dW5EaXYuY2xhc3NMaXN0LmFkZCgnZ3JvdXAtYnV0dG9uJyk7XG4gICAgICBlbEJ1dHR1bkRpdi5pbm5lckhUTUwgPSBgPGJ1dHRvbj48aSBjbGFzcz1cImZhcyBmYS1yZWRvXCI+PC9pPjwvYnV0dG9uPmA7XG4gICAgICBlbEJ1dHR1bkRpdi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuc2V0R3JvdXBJZChncm91cFsxXS5pZCkpO1xuICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoZWxCdXR0dW5EaXYpO1xuICAgIH1cbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChlbFdhcnApO1xuICB9XG4gIHByaXZhdGUgc2V0R3JvdXBJZChncm91cElkOiBhbnkpIHtcbiAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnNldEdyb3VwLCB7IGdyb3VwSWQgfSk7XG4gIH1cbn1cbiIsIlxuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcbmltcG9ydCB7IERhdGFWaWV3IH0gZnJvbSBcIi4uL2NvcmUvRGF0YVZpZXdcIjtcbmltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvSUZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFByb3BlcnR5VmlldyB7XG4gIHByaXZhdGUgbGFzdERhdGE6IERhdGFGbG93IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGhpZGVLZXlzOiBzdHJpbmdbXSA9IFsnbGluZXMnLCAnbm9kZXMnLCAnZ3JvdXBzJywgJ3ZhcmlhYmxlJywgJ3gnLCAneScsICd6b29tJ107XG4gIHByaXZhdGUgc29ydEtleXM6IHN0cmluZ1tdID0gWydpZCcsICdrZXknLCAnbmFtZScsICdncm91cCddO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb3BlcnR5LXZpZXcnKTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgKGRldGFpbDogYW55KSA9PiB7XG4gICAgICB0aGlzLlJlbmRlcihkZXRhaWwuZGF0YSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIFJlbmRlcihkYXRhOiBEYXRhRmxvdykge1xuICAgIGlmICh0aGlzLmxhc3REYXRhID09IGRhdGEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IGRhdGEuZ2V0UHJvcGVydGllcygpO1xuICAgIHRoaXMuc29ydEtleXMuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICh0aGlzLmhpZGVLZXlzLmluY2x1ZGVzKGtleSkgfHwgIXByb3BlcnRpZXNba2V5XSB8fCBwcm9wZXJ0aWVzW2tleV0uaGlkZSkgcmV0dXJuO1xuICAgICAgbGV0IHByb3BlcnR5SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgcHJvcGVydHlJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWl0ZW0nKTtcbiAgICAgIGxldCBwcm9wZXJ0eUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eUxhYmVsLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWxhYmVsJyk7XG4gICAgICBwcm9wZXJ0eUxhYmVsLmlubmVySFRNTCA9IHByb3BlcnRpZXNba2V5XS50ZXh0ID8/IGtleTtcbiAgICAgIGxldCBwcm9wZXJ0eVZhbHVlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eVZhbHVlLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LXZhbHVlJyk7XG4gICAgICBEYXRhVmlldy5CaW5kRWxlbWVudChwcm9wZXJ0eVZhbHVlLCBkYXRhLCB0aGlzLm1haW4sIGtleSk7XG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlMYWJlbCk7XG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlWYWx1ZSk7XG4gICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChwcm9wZXJ0eUl0ZW0pO1xuICAgIH0pO1xuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAodGhpcy5oaWRlS2V5cy5pbmNsdWRlcyhrZXkpIHx8IHRoaXMuc29ydEtleXMuaW5jbHVkZXMoa2V5KSB8fCAhcHJvcGVydGllc1trZXldIHx8IHByb3BlcnRpZXNba2V5XS5oaWRlKSByZXR1cm47XG4gICAgICBsZXQgcHJvcGVydHlJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHByb3BlcnR5TGFiZWwuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktbGFiZWwnKTtcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0gcHJvcGVydGllc1trZXldLnRleHQgPz8ga2V5O1xuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHByb3BlcnR5VmFsdWUuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktdmFsdWUnKTtcbiAgICAgIERhdGFWaWV3LkJpbmRFbGVtZW50KHByb3BlcnR5VmFsdWUsIGRhdGEsIHRoaXMubWFpbiwga2V5KTtcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eUxhYmVsKTtcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eVZhbHVlKTtcbiAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHByb3BlcnR5SXRlbSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIERvY2tCYXNlIHtcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHJvdGVjdGVkIGVsQ29udGVudDogRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICdEb2NrQmFzZSc7XG4gIH1cblxuICBwdWJsaWMgQm94SW5mbyh0aXRsZTogc3RyaW5nLCAkY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ3ZzLWJveGluZm8nKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ib3hpbmZvJyk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJ2cy1ib3hpbmZvX2hlYWRlclwiPjxzcGFuIGNsYXNzPVwidnMtYm94aW5mb190aXRsZVwiPiR7dGl0bGV9PC9zcGFuPjxzcGFuIGNsYXNzPVwidnMtYm94aW5mb19idXR0b25cIj48L3NwYW4+PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInZzLWJveGluZm9fd2FycFwiPjxkaXYgY2xhc3M9XCJ2cy1ib3hpbmZvX2NvbnRlbnRcIj48L2Rpdj48L2Rpdj5gO1xuICAgIHRoaXMuZWxDb250ZW50ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnZzLWJveGluZm9fY29udGVudCcpO1xuICAgIGlmICgkY2FsbGJhY2spIHtcbiAgICAgICRjYWxsYmFjayh0aGlzLmVsQ29udGVudCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBUb29sYm94VmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29udHJvbERvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLWNvbnRyb2wnKTtcbiAgICB0aGlzLkJveEluZm8oJ0NvbnRyb2wnLCAobm9kZTogSFRNTEVsZW1lbnQpID0+IHtcbiAgICAgIG5ldyBUb29sYm94Vmlldyhub2RlLCB0aGlzLm1haW4pO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiwgZ2V0VGltZSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBWYXJpYWJsZVZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFZhcmlhYmxlRG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtdmFyaWFibGUnKTtcbiAgICB0aGlzLkJveEluZm8oJ1ZhcmlhYmxlJywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBuZXcgVmFyaWFibGVWaWV3KG5vZGUsIG1haW4pO1xuICAgIH0pO1xuICAgIGxldCAkbm9kZVJpZ2h0OiBIVE1MRWxlbWVudCB8IG51bGwgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19oZWFkZXIgLnZzLWJveGluZm9fYnV0dG9uJyk7XG4gICAgaWYgKCRub2RlUmlnaHQpIHtcbiAgICAgICRub2RlUmlnaHQuaW5uZXJIVE1MID0gYGA7XG4gICAgICBsZXQgYnV0dG9uTmV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAkbm9kZVJpZ2h0Py5hcHBlbmRDaGlsZChidXR0b25OZXcpO1xuICAgICAgYnV0dG9uTmV3LmlubmVySFRNTCA9IGBOZXcgVmFyaWFibGVgO1xuICAgICAgYnV0dG9uTmV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1haW4ubmV3VmFyaWFibGUodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFWaWV3LCBEYXRhRmxvdywgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBQcm9wZXJ0eVZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvUHJvcGVydHlWaWV3XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb3BlcnR5Jyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdQcm9wZXJ0eScsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbmV3IFByb3BlcnR5Vmlldyhub2RlLCBtYWluKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFZpZXdEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwcml2YXRlIHZpZXc6IERlc2dpbmVyVmlldyB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG5cbiAgICB0aGlzLnZpZXcgPSBuZXcgRGVzZ2luZXJWaWV3KHRoaXMuZWxOb2RlLCBtYWluKTtcblxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiwgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgVGFiUHJvamVjdFZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFRhYkRvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIG5ldyBUYWJQcm9qZWN0Vmlldyh0aGlzLmVsTm9kZSwgbWFpbik7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluLCBnZXRUaW1lIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IEJyZWFkY3J1bWJHcm91cFZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIEJyZWFkY3J1bWJHcm91cERvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIG5ldyBCcmVhZGNydW1iR3JvdXBWaWV3KHRoaXMuZWxOb2RlLCBtYWluKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4sIERvY2tFbnVtIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IENvbnRyb2xEb2NrIH0gZnJvbSBcIi4vQ29udHJvbERvY2tcIjtcbmltcG9ydCB7IFZhcmlhYmxlRG9jayB9IGZyb20gXCIuL1ZhcmlhYmxlRG9ja1wiO1xuaW1wb3J0IHsgUHJvamVjdERvY2sgfSBmcm9tIFwiLi9Qcm9qZWN0RG9ja1wiO1xuaW1wb3J0IHsgUHJvcGVydHlEb2NrIH0gZnJvbSBcIi4vUHJvcGVydHlEb2NrXCI7XG5pbXBvcnQgeyBWaWV3RG9jayB9IGZyb20gXCIuL1ZpZXdEb2NrXCI7XG5pbXBvcnQgeyBUYWJEb2NrIH0gZnJvbSBcIi4vVGFiRG9ja1wiO1xuaW1wb3J0IHsgQnJlYWRjcnVtYkdyb3VwRG9jayB9IGZyb20gXCIuL0JyZWFkY3J1bWJHcm91cERvY2tcIjtcblxuZXhwb3J0IGNsYXNzIERvY2tNYW5hZ2VyIHtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHsgfVxuICBwdWJsaWMgcmVzZXQoKSB7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIgPSB7fTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgQ29udHJvbERvY2spO1xuICAgIC8vdGhpcy5hZGREb2NrKERvY2tFbnVtLmxlZnQsIFByb2plY3REb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ucmlnaHQsIFByb3BlcnR5RG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnRvcCwgVGFiRG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLmJvdHRvbSwgQnJlYWRjcnVtYkdyb3VwRG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLmJvdHRvbSwgVmFyaWFibGVEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0udmlldywgVmlld0RvY2spO1xuXG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBhZGREb2NrKCRrZXk6IHN0cmluZywgJHZpZXc6IGFueSkge1xuICAgIGlmICghdGhpcy4kZG9ja01hbmFnZXJbJGtleV0pXG4gICAgICB0aGlzLiRkb2NrTWFuYWdlclska2V5XSA9IFtdO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gWy4uLnRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldLCAkdmlld107XG4gIH1cblxuICBwdWJsaWMgUmVuZGVyVUkoKSB7XG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInZzLWxlZnQgdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZzLWNvbnRlbnRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXRvcCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy12aWV3IHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLWJvdHRvbSB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1yaWdodCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgYDtcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRkb2NrTWFuYWdlcikuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBxdWVyeVNlbGVjdG9yID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLiR7a2V5fWApO1xuICAgICAgaWYgKHF1ZXJ5U2VsZWN0b3IpIHtcbiAgICAgICAgdGhpcy4kZG9ja01hbmFnZXJba2V5XS5mb3JFYWNoKCgkaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgbmV3ICRpdGVtKHF1ZXJ5U2VsZWN0b3IsIHRoaXMubWFpbik7XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsImV4cG9ydCBjb25zdCBDb250cm9sID0ge1xuICBub2RlX2JlZ2luOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXBsYXlcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdCZWdpbicsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGNsYXNzOiAnJyxcbiAgICBodG1sOiAnJyxcbiAgICBkb3Q6IHtcbiAgICAgIHRvcDogMCxcbiAgICAgIHJpZ2h0OiAxLFxuICAgICAgbGVmdDogMCxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIG9ubHlOb2RlOiB0cnVlXG4gIH0sXG4gIG5vZGVfZW5kOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3BcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdFbmQnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnJyxcbiAgICBkb3Q6IHtcbiAgICAgIGxlZnQ6IDEsXG4gICAgICB0b3A6IDAsXG4gICAgICByaWdodDogMCxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIG9ubHlOb2RlOiB0cnVlXG4gIH0sXG4gIG5vZGVfaWY6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtZXF1YWxzXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnSWYnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBjbGFzczogJ3ZzLWNvbnRlbnQtZmxleCcsXG4gICAgaHRtbDogYDxkaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4gc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCI+VGhlbjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAxXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3BhbiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIj5UaGVuPC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDJcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiPlRoZW48L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwM1wiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4gc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCI+VGhlbjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDA0XCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3BhbiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIj5UaGVuPC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDVcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodFwiPlRoZW48L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwNlwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4gc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0XCI+VGhlbjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDA3XCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3BhbiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHRcIj5FbHNlPC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDhcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICBgLFxuICAgIHNjcmlwdDogYGAsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH1cbiAgICB9LFxuICAgIGRvdDoge1xuICAgICAgbGVmdDogMSxcbiAgICAgIHRvcDogMCxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgYm90dG9tOiAwLFxuICAgIH0sXG4gIH0sXG4gIG5vZGVfZ3JvdXA6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnR3JvdXAnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+PGJ1dHRvbiBjbGFzcz1cImJ0bkdvR3JvdXAgbm9kZS1mb3JtLWNvbnRyb2xcIj5HbzwvYnV0dG9uPjwvZGl2PicsXG4gICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7IG5vZGUub3Blbkdyb3VwKCkgfSk7XG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICBvdXRwdXQ6IDJcbiAgfSxcbiAgbm9kZV9vcHRpb246IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnT3B0aW9uJyxcbiAgICBkb3Q6IHtcbiAgICAgIHRvcDogMSxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgbGVmdDogMSxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiBgXG4gICAgPGRpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMVwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDJcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAzXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwNFwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDVcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGAsXG4gICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7IG5vZGUub3Blbkdyb3VwKCkgfSk7XG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICBvdXRwdXQ6IDJcbiAgfSxcbiAgbm9kZV9wcm9qZWN0OiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ1Byb2plY3QnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+PHNlbGVjdCBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cInByb2plY3RcIj48L3NlbGVjdD48L2Rpdj4nLFxuICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuXG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBwcm9qZWN0OiB7XG4gICAgICAgIGtleTogXCJwcm9qZWN0XCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHNlbGVjdDogdHJ1ZSxcbiAgICAgICAgZGF0YVNlbGVjdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtYWluLmdldFByb2plY3RBbGwoKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdmFsdWU6IGl0ZW0uR2V0KCdpZCcpLFxuICAgICAgICAgICAgICB0ZXh0OiBpdGVtLkdldCgnbmFtZScpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuXG4gICAgICAgIH0sXG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9XG4gICAgfSxcbiAgfSxcbn1cbiIsImltcG9ydCB7IGdldE5hbWVUaW1lIH0gZnJvbSBcInNyYy9jb3JlL1V0aWxzXCI7XG5pbXBvcnQgeyBEYXRhRmxvdywgSU1haW4sIGNvbXBhcmVTb3J0LCBFdmVudEVudW0sIFByb3BlcnR5RW51bSwgRXZlbnRGbG93LCBnZXRUaW1lLCBTY29wZVJvb3QsIGlzRnVuY3Rpb24gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgTm9kZUl0ZW0gfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IENvbnRyb2wgfSBmcm9tIFwiLi9jb250cm9sXCI7XG5cbmV4cG9ydCBjbGFzcyBTeXN0ZW1CYXNlIGltcGxlbWVudHMgSU1haW4ge1xuICBwcml2YXRlICRkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgcHVibGljIHRlbXA6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XG4gIHByaXZhdGUgJHByb2plY3RPcGVuOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSAkcHJvcGVydGllczogYW55ID0ge307XG4gIHByaXZhdGUgJGNvbnRyb2w6IGFueSA9IHt9O1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93ID0gbmV3IEV2ZW50RmxvdygpO1xuICBwcml2YXRlICRjb250cm9sQ2hvb3NlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSAkY2hlY2tPcHRpb246IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSAkZ3JvdXA6IGFueTtcbiAgcHJpdmF0ZSAkaW5kZXhQcm9qZWN0OiBudW1iZXIgPSAtMTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5zb2x1dGlvbl0gPSB7XG4gICAgICBpZDoge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgIH0sXG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gUHJvcGVydHlFbnVtLnNvbHV0aW9uXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXROYW1lVGltZSgnc29sdXRpb24tJyksXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICB9LFxuICAgICAgcHJvamVjdDoge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBgYCxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0czoge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0ubGluZV0gPSB7XG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLmxpbmVcbiAgICAgIH0sXG4gICAgICBmcm9tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICBmcm9tSW5kZXg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHRvOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB0b0luZGV4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5tYWluXSA9IHtcbiAgICAgIGlkOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgfSxcbiAgICAgIG5hbWU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gYEZsb3cgJHt0aGlzLiRpbmRleFByb2plY3QrK31gLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubWFpblxuICAgICAgfSxcbiAgICAgIHZhcmlhYmxlOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgZ3JvdXBzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9LFxuICAgICAgbm9kZXM6IHtcbiAgICAgICAgZGVmYXVsdDogW11cbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLmdyb3VwQ2F2YXNdID0ge1xuICAgICAga2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFByb3BlcnR5RW51bS5ncm91cENhdmFzXG4gICAgICB9LFxuICAgICAgZ3JvdXA6IHtcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgICB4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB5OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB6b29tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgfVxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLnZhcmlhYmxlXSA9IHtcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0udmFyaWFibGVcbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldE5hbWVUaW1lKCd2YXInKVxuICAgICAgfSxcbiAgICAgIHR5cGU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gJ3RleHQnXG4gICAgICB9LFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gU2NvcGVSb290XG4gICAgICB9LFxuICAgICAgaW5pdGFsVmFsdWU6IHtcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH0sXG4gICAgfVxuICAgIHRoaXMub25TYWZlKEV2ZW50RW51bS5ncm91cENoYW5nZSwgKHsgZ3JvdXAgfTogYW55KSA9PiB7XG4gICAgICB0aGlzLiRncm91cCA9IGdyb3VwO1xuICAgIH0pXG4gIH1cbiAgbmV3U29sdXRpb24oJG5hbWU6IHN0cmluZyA9ICcnKTogdm9pZCB7XG4gICAgdGhpcy4kaW5kZXhQcm9qZWN0ID0gMTtcbiAgICB0aGlzLm9wZW5Tb2x1dGlvbih7IG5hbWU6ICRuYW1lIH0pO1xuICB9XG4gIG9wZW5Tb2x1dGlvbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy4kZGF0YS5Jbml0RGF0YSgkZGF0YSwgdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5zb2x1dGlvbikpO1xuICAgIHRoaXMub3BlblByb2plY3QodGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJyk/LlswXSA/PyB7fSk7XG4gIH1cbiAgcmVtb3ZlVmFyaWFibGUodmFyaWJhbGU6IERhdGFGbG93KTogdm9pZCB7XG4gICAgdGhpcy4kcHJvamVjdE9wZW4/LlJlbW92ZSgndmFyaWFibGUnLCB2YXJpYmFsZSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHsgZGF0YTogdmFyaWJhbGUgfSk7XG4gIH1cbiAgYWRkVmFyaWFibGUobmFtZTogYW55ID0gdW5kZWZpbmVkLCBzY29wZTogYW55ID0gbnVsbCwgaW5pdGFsVmFsdWU6IGFueSA9IG51bGwpOiBEYXRhRmxvdyB7XG4gICAgbGV0IHZhcmliYWxlID0gbmV3IERhdGFGbG93KHRoaXMsIHsgbmFtZSwgaW5pdGFsVmFsdWUsIGtleTogUHJvcGVydHlFbnVtLnZhcmlhYmxlLCBzY29wZTogc2NvcGUgPz8gdGhpcy5nZXRHcm91cEN1cnJlbnQoKT8uWzBdPy5pZCB9KTtcbiAgICB0aGlzLiRwcm9qZWN0T3Blbj8uQXBwZW5kKCd2YXJpYWJsZScsIHZhcmliYWxlKTtcbiAgICByZXR1cm4gdmFyaWJhbGU7XG4gIH1cbiAgbmV3VmFyaWFibGUobmFtZTogYW55ID0gdW5kZWZpbmVkLCBzY29wZTogYW55ID0gbnVsbCwgaW5pdGFsVmFsdWU6IGFueSA9IG51bGwpOiBEYXRhRmxvdyB7XG4gICAgbGV0IHZhcmliYWxlID0gdGhpcy5hZGRWYXJpYWJsZShuYW1lLCBzY29wZSwgaW5pdGFsVmFsdWUpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCB7IGRhdGE6IHZhcmliYWxlIH0pO1xuICAgIHJldHVybiB2YXJpYmFsZTtcbiAgfVxuICBjaGFuZ2VWYXJpYWJsZU5hbWUob2xkX25hbWU6IGFueSwgbmV3X25hbWU6IGFueSwgc2NvcGU6IGFueSk6IHZvaWQge1xuICAgIGxldCB2YXJpYWJsZSA9IHRoaXMuJHByb2plY3RPcGVuPy5HZXQoJ3ZhcmlhYmxlJyk7XG4gICAgaWYgKHZhcmlhYmxlKSB7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIHZhcmlhYmxlKSB7XG4gICAgICAgIGlmIChpdGVtLkdldCgnbmFtZScpID09IG9sZF9uYW1lICYmIGl0ZW0uR2V0KCdzY29wZScpID09IHNjb3BlKSB7XG4gICAgICAgICAgaXRlbS5TZXQoJ25hbWUnLCBuZXdfbmFtZSk7XG4gICAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHsgZGF0YTogaXRlbSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICB0ZW1wVmFyaWFibGUoZW52X25hbWU6IHN0cmluZywgbmFtZTogc3RyaW5nLCBub2RlSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IHRlbXBfZW52X25hbWUgPSBgdGVtcF8ke25vZGVJZH1fJHtlbnZfbmFtZX1gO1xuICAgIGNvbnN0IHRlbXBfdmFsdWUgPSB0aGlzLnRlbXAuR2V0KHRlbXBfZW52X25hbWUpO1xuICAgIGlmICghdGVtcF92YWx1ZSkge1xuICAgICAgdGhpcy50ZW1wLlNldCh0ZW1wX2Vudl9uYW1lLCBuYW1lKTtcbiAgICAgIHRoaXMubmV3VmFyaWFibGUobmFtZSwgbm9kZUlkKTtcbiAgICB9IGVsc2UgaWYgKG5hbWUgIT0gdGVtcF92YWx1ZSkge1xuICAgICAgdGhpcy5jaGFuZ2VWYXJpYWJsZU5hbWUodGVtcF92YWx1ZSwgbmFtZSwgbm9kZUlkKTtcbiAgICAgIHRoaXMudGVtcC5TZXQodGVtcF9lbnZfbmFtZSwgbmFtZSk7XG4gICAgfVxuICB9XG4gIGdldFZhcmlhYmxlKCk6IERhdGFGbG93W10ge1xuICAgIGxldCBhcnI6IGFueSA9IFtdO1xuICAgIGlmICh0aGlzLiRwcm9qZWN0T3Blbikge1xuICAgICAgYXJyID0gdGhpcy4kcHJvamVjdE9wZW4uR2V0KFwidmFyaWFibGVcIik7XG4gICAgICBpZiAoIWFycikge1xuICAgICAgICBhcnIgPSBbXTtcbiAgICAgICAgdGhpcy4kcHJvamVjdE9wZW4uU2V0KCd2YXJpYWJsZScsIGFycik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnIuZmlsdGVyKChpdGVtOiBhbnkpID0+IHRoaXMuZ2V0R3JvdXBDdXJyZW50KCkuZmluZEluZGV4KChfZ3JvdXA6IGFueSkgPT4gX2dyb3VwLmlkID09IGl0ZW0uR2V0KCdzY29wZScpKSA+IC0xKTtcbiAgfVxuICBnZXRHcm91cEN1cnJlbnQoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy4kZ3JvdXAgPz8gW107XG4gIH1cbiAgZXhwb3J0SnNvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS50b0pzb24oKTtcbiAgfVxuICBwdWJsaWMgY2hlY2tJbml0T3B0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLiRjaGVja09wdGlvbjtcbiAgfVxuICBpbml0T3B0aW9uKG9wdGlvbjogYW55LCBpc0RlZmF1bHQ6IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgdGhpcy4kY2hlY2tPcHRpb24gPSB0cnVlO1xuICAgIC8vIHNldCBjb250cm9sXG4gICAgdGhpcy4kY29udHJvbCA9IGlzRGVmYXVsdCA/IHsgLi4ub3B0aW9uPy5jb250cm9sIHx8IHt9LCAuLi5Db250cm9sIH0gOiB7IC4uLm9wdGlvbj8uY29udHJvbCB8fCB7fSB9O1xuICAgIGxldCBjb250cm9sVGVtcDogYW55ID0ge307XG4gICAgT2JqZWN0LmtleXModGhpcy4kY29udHJvbCkubWFwKChrZXkpID0+ICh7IC4uLnRoaXMuJGNvbnRyb2xba2V5XSwga2V5LCBzb3J0OiAodGhpcy4kY29udHJvbFtrZXldLnNvcnQgPT09IHVuZGVmaW5lZCA/IDk5OTk5IDogdGhpcy4kY29udHJvbFtrZXldLnNvcnQpIH0pKS5zb3J0KGNvbXBhcmVTb3J0KS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGNvbnRyb2xUZW1wW2l0ZW0ua2V5XSA9IHtcbiAgICAgICAgLi4uaXRlbSxcbiAgICAgICAgZG90OiB7XG4gICAgICAgICAgbGVmdDogMSxcbiAgICAgICAgICB0b3A6IDEsXG4gICAgICAgICAgcmlnaHQ6IDEsXG4gICAgICAgICAgYm90dG9tOiAxLFxuICAgICAgICAgIC4uLml0ZW0/LmRvdFxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdGhpcy4kcHJvcGVydGllc1tgJHtpdGVtLmtleX1gXSA9IHtcbiAgICAgICAgLi4uKGl0ZW0ucHJvcGVydGllcyB8fCB7fSksXG4gICAgICAgIGlkOiB7XG4gICAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICAgIH0sXG4gICAgICAgIGtleToge1xuICAgICAgICAgIGRlZmF1bHQ6IGl0ZW0ua2V5XG4gICAgICAgIH0sXG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICBkZWZhdWx0OiBpdGVtLmtleSxcbiAgICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB4OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgICBncm91cDoge1xuICAgICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICAgIH0sXG4gICAgICAgIGxpbmVzOiB7XG4gICAgICAgICAgZGVmYXVsdDogW11cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgICB0aGlzLiRjb250cm9sID0gY29udHJvbFRlbXA7XG4gIH1cbiAgcmVuZGVySHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpIHtcbiAgICBpZiAoaXNGdW5jdGlvbihub2RlLmdldE9wdGlvbigpPy5odG1sKSkge1xuICAgICAgZWxOb2RlLmlubmVySFRNTCA9IG5vZGUuZ2V0T3B0aW9uKCk/Lmh0bWw/Lih7IGVsTm9kZSwgbWFpbiwgbm9kZSB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxOb2RlLmlubmVySFRNTCA9IG5vZGUuZ2V0T3B0aW9uKCk/Lmh0bWxcbiAgICB9XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldENvbnRyb2xBbGwoKSB7XG4gICAgcmV0dXJuIHRoaXMuJGNvbnRyb2wgPz8ge307XG4gIH1cbiAgZ2V0UHJvamVjdEFsbCgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEuR2V0KCdwcm9qZWN0cycpID8/IFtdO1xuICB9XG4gIGltcG9ydEpzb24oZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5vcGVuU29sdXRpb24oZGF0YSk7XG4gIH1cbiAgc2V0UHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIGlmICh0aGlzLiRwcm9qZWN0T3BlbiAhPSAkZGF0YSkge1xuICAgICAgdGhpcy4kcHJvamVjdE9wZW4gPSAkZGF0YTtcbiAgICAgIHRoaXMuJGRhdGEuU2V0KCdwcm9qZWN0JywgdGhpcy4kcHJvamVjdE9wZW4/LkdldCgnaWQnKSlcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgICBkYXRhOiAkZGF0YVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHtcbiAgICAgICAgZGF0YTogJGRhdGFcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsIHtcbiAgICAgICAgZGF0YTogJGRhdGFcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBjaGVja1Byb2plY3RPcGVuKCRkYXRhOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvamVjdE9wZW4gPT0gJGRhdGE7XG4gIH1cbiAgbmV3UHJvamVjdCgpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Qcm9qZWN0KHt9KTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5uZXdQcm9qZWN0LCB7fSk7XG4gIH1cbiAgb3BlblByb2plY3QoJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIGxldCAkcHJvamVjdDogYW55ID0gbnVsbDtcbiAgICBpZiAoJGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgJHByb2plY3QgPSB0aGlzLmdldFByb2plY3RCeUlkKCRkYXRhLkdldCgnaWQnKSk7XG4gICAgICBpZiAoISRwcm9qZWN0KSB7XG4gICAgICAgICRwcm9qZWN0ID0gJGRhdGE7XG4gICAgICAgIHRoaXMuJGRhdGEuQXBwZW5kKCdwcm9qZWN0cycsICRwcm9qZWN0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgJHByb2plY3QgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gICAgICAkcHJvamVjdC5Jbml0RGF0YSgkZGF0YSwgdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5tYWluKSk7XG4gICAgICB0aGlzLiRkYXRhLkFwcGVuZCgncHJvamVjdHMnLCAkcHJvamVjdCk7XG4gICAgfVxuICAgIHRoaXMuc2V0UHJvamVjdE9wZW4oJHByb2plY3QpO1xuICB9XG4gIHB1YmxpYyByZW1vdmVQcm9qZWN0KCRkYXRhOiBhbnkpIHtcbiAgICBsZXQgcHJvamVjdERhdGEgPSAkZGF0YTtcbiAgICBpZiAoJGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgcHJvamVjdERhdGEgPSB0aGlzLmdldFByb2plY3RCeUlkKCRkYXRhLkdldCgnaWQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2plY3REYXRhID0gdGhpcy5nZXRQcm9qZWN0QnlJZCgkZGF0YS5HZXQoJ2lkJykpO1xuICAgIH1cbiAgICB0aGlzLiRkYXRhLlJlbW92ZSgncHJvamVjdHMnLCBwcm9qZWN0RGF0YSk7XG4gICAgaWYgKHRoaXMuY2hlY2tQcm9qZWN0T3Blbihwcm9qZWN0RGF0YSkpIHtcbiAgICAgIHRoaXMuJHByb2plY3RPcGVuID0gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJyk/LlswXTtcbiAgICAgIGlmICghdGhpcy4kcHJvamVjdE9wZW4pIHtcbiAgICAgICAgdGhpcy5uZXdQcm9qZWN0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XG4gICAgICBkYXRhOiB0aGlzLiRwcm9qZWN0T3BlblxuICAgIH0pO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwge1xuICAgICAgZGF0YTogdGhpcy4kcHJvamVjdE9wZW5cbiAgICB9KTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5vcGVuUHJvamVjdCwge1xuICAgICAgZGF0YTogdGhpcy4kcHJvamVjdE9wZW5cbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgZ2V0UHJvamVjdEJ5SWQoJGlkOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJykuZmlsdGVyKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS5HZXQoJ2lkJykgPT09ICRpZCk/LlswXTtcbiAgfVxuICBzZXRDb250cm9sQ2hvb3NlKGtleTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuJGNvbnRyb2xDaG9vc2UgPSBrZXk7XG4gIH1cbiAgZ2V0Q29udHJvbENob29zZSgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbENob29zZTtcbiAgfVxuICBnZXRDb250cm9sQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbFtrZXldIHx8IHt9O1xuICB9XG4gIGdldENvbnRyb2xOb2RlQnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgLi4udGhpcy5nZXRDb250cm9sQnlLZXkoa2V5KSxcbiAgICAgIHByb3BlcnRpZXM6IHRoaXMuZ2V0UHJvcGVydHlCeUtleShgJHtrZXl9YClcbiAgICB9XG4gIH1cbiAgZ2V0UHJvcGVydHlCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLiRwcm9wZXJ0aWVzW2tleV07XG4gIH1cbiAgcHJpdmF0ZSAkcnVubmluZyA9IGZhbHNlO1xuICBydW5uaW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRydW5uaW5nO1xuICB9XG4gIHNldFJ1bm5pbmcoZmxnOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLiRydW5uaW5nID0gZmxnO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnN0YXR1c0JvdCwgZmxnKTtcbiAgfVxuICBjYWxsYmFja1J1blByb2plY3QoY2FsbGJhY2tSdW46IGFueSkge1xuICAgIHRoaXMub24oRXZlbnRFbnVtLnJ1blByb2plY3QsICh7IGRhdGEgfTogYW55KSA9PiB7XG4gICAgICBjYWxsYmFja1J1bj8uKGRhdGEpO1xuICAgIH0pO1xuICB9XG4gIGNhbGxiYWNrU3RvcFByb2plY3QoY2FsbGJhY2tSdW46IGFueSkge1xuICAgIHRoaXMub24oRXZlbnRFbnVtLnN0b3BQcm9qZWN0LCAoKSA9PiB7XG4gICAgICBjYWxsYmFja1J1bigpO1xuICAgIH0pO1xuICB9XG4gIHJ1blByb2plY3QoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRSdW5uaW5nKHRydWUpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnJ1blByb2plY3QsIHsgZGF0YTogdGhpcy5leHBvcnRKc29uKCkgfSk7XG4gIH1cbiAgc3RvcFByb2plY3QoKTogdm9pZCB7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uc3RvcFByb2plY3QsIHt9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tICcuL2NvcmUvaW5kZXgnO1xuaW1wb3J0IHsgRG9ja01hbmFnZXIgfSBmcm9tICcuL2RvY2svRG9ja01hbmFnZXInO1xuaW1wb3J0IHsgU3lzdGVtQmFzZSB9IGZyb20gJy4vc3lzdGVtcy9TeXN0ZW1CYXNlJztcbmV4cG9ydCBjbGFzcyBWaXN1YWxGbG93IHtcbiAgcHJpdmF0ZSBtYWluOiBJTWFpbiB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IERvY2tNYW5hZ2VyO1xuICBwdWJsaWMgZ2V0RG9ja01hbmFnZXIoKTogRG9ja01hbmFnZXIge1xuICAgIHJldHVybiB0aGlzLiRkb2NrTWFuYWdlcjtcbiAgfVxuICBwdWJsaWMgc2V0T3B0aW9uKGRhdGE6IGFueSwgaXNEZWZhdWx0OiBib29sZWFuID0gdHJ1ZSkge1xuICAgIHRoaXMubWFpbj8uaW5pdE9wdGlvbihkYXRhLCBpc0RlZmF1bHQpO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyLnJlc2V0KCk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgY29udGFpbmVyOiBIVE1MRWxlbWVudCwgbWFpbjogSU1haW4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLm1haW4gPSBtYWluID8/IG5ldyBTeXN0ZW1CYXNlKCk7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgndnMtY29udGFpbmVyJyk7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCgndnMtY29udGFpbmVyJyk7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIgPSBuZXcgRG9ja01hbmFnZXIodGhpcy5jb250YWluZXIsIHRoaXMubWFpbik7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIucmVzZXQoKTtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMubWFpbj8ub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMubWFpbj8ub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5tYWluPy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMubWFpbj8uZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICB9XG4gIHB1YmxpYyBnZXRNYWluKCk6IElNYWluIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5tYWluO1xuICB9XG4gIG5ld1NvbHV0aW9uKCRuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ubmV3U29sdXRpb24oJG5hbWUpO1xuICB9XG4gIG9wZW5Tb2x1dGlvbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm9wZW5Tb2x1dGlvbigkZGF0YSk7XG4gIH1cbiAgbmV3UHJvamVjdCgkbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/Lm5ld1Byb2plY3QoJG5hbWUpO1xuICB9XG4gIG9wZW5Qcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ub3BlblByb2plY3QoJG5hbWUpO1xuICB9XG4gIGdldFByb2plY3RBbGwoKTogYW55W10gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmdldE1haW4oKT8uZ2V0UHJvamVjdEFsbCgpO1xuICB9XG4gIHNldFByb2plY3RPcGVuKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8uc2V0UHJvamVjdE9wZW4oJGRhdGEpO1xuICB9XG4gIGltcG9ydEpzb24oZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy5nZXRNYWluKCk/LmltcG9ydEpzb24oZGF0YSk7XG4gIH1cbiAgZXhwb3J0SnNvbigpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmdldE1haW4oKT8uZXhwb3J0SnNvbigpO1xuICB9XG4gIGNhbGxiYWNrUnVuUHJvamVjdChjYWxsYmFja1J1bjogYW55KSB7XG4gICAgdGhpcy5nZXRNYWluKCk/LmNhbGxiYWNrUnVuUHJvamVjdChjYWxsYmFja1J1bik7XG4gIH1cbiAgY2FsbGJhY2tTdG9wUHJvamVjdChjYWxsYmFja1J1bjogYW55KSB7XG4gICAgdGhpcy5nZXRNYWluKCk/LmNhbGxiYWNrU3RvcFByb2plY3QoY2FsbGJhY2tSdW4pO1xuICB9XG4gIHNldFJ1bm5pbmcoZmxnOiBhbnkpe1xuICAgIHRoaXMuZ2V0TWFpbigpPy5zZXRSdW5uaW5nKGZsZyk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE5vZGVJdGVtIH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBTeXN0ZW1CYXNlIH0gZnJvbSBcIi4vU3lzdGVtQmFzZVwiO1xuZXhwb3J0IGNsYXNzIFN5c3RlbVZ1ZSBleHRlbmRzIFN5c3RlbUJhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSByZW5kZXI6IGFueSkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcmVuZGVySHRtbCh7IGVsTm9kZSwgbWFpbiwgbm9kZSB9OiBhbnkpIHtcbiAgICBpZiAocGFyc2VJbnQodGhpcy5yZW5kZXIudmVyc2lvbikgPT09IDMpIHtcbiAgICAgIC8vVnVlIDNcbiAgICAgIGxldCB3cmFwcGVyID0gdGhpcy5yZW5kZXIuaChub2RlLmdldE9wdGlvbigpPy5odG1sLCB7IC4uLihub2RlLmdldE9wdGlvbigpPy5wcm9wcyA/PyB7fSksIG5vZGUgfSwgKG5vZGUuZ2V0T3B0aW9uKCk/Lm9wdGlvbnMgPz8ge30pKTtcbiAgICAgIHdyYXBwZXIuYXBwQ29udGV4dCA9IGVsTm9kZTtcbiAgICAgIHRoaXMucmVuZGVyLnJlbmRlcih3cmFwcGVyLCBlbE5vZGUpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFZ1ZSAyXG4gICAgICBsZXQgd3JhcHBlciA9IG5ldyB0aGlzLnJlbmRlcih7XG4gICAgICAgIHBhcmVudDogZWxOb2RlLFxuICAgICAgICByZW5kZXI6IChoOiBhbnkpID0+IGgobm9kZS5nZXRPcHRpb24oKT8uaHRtbCwgeyBwcm9wczogeyAuLi4obm9kZS5nZXRPcHRpb24oKT8ucHJvcHMgPz8ge30pLCBub2RlIH0gfSksXG4gICAgICAgIC4uLihub2RlLmdldE9wdGlvbigpPy5vcHRpb25zID8/IHt9KVxuICAgICAgfSkuJG1vdW50KClcbiAgICAgIC8vXG4gICAgICBlbE5vZGUuYXBwZW5kQ2hpbGQod3JhcHBlci4kZWwpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIEV2ZW50RW51bSwgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgZG93bmxvYWRPYmplY3RBc0pzb24sIGdldFRpbWUsIHJlYWRGaWxlTG9jYWwgfSBmcm9tIFwiLi4vY29yZS9VdGlsc1wiO1xuaW1wb3J0IHsgUHJvamVjdFZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvUHJvamVjdFZpZXdcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFByb2plY3REb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1wcm9qZWN0Jyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdQcm9qZWN0JywgKGVsQ29udGVudDogYW55KSA9PiB7XG4gICAgICBuZXcgUHJvamVjdFZpZXcoZWxDb250ZW50LCBtYWluKTtcbiAgICB9KTtcbiAgICBsZXQgJG5vZGVSaWdodDogSFRNTEVsZW1lbnQgfCBudWxsID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnZzLWJveGluZm9faGVhZGVyIC52cy1ib3hpbmZvX2J1dHRvbicpO1xuICAgIGlmICgkbm9kZVJpZ2h0KSB7XG4gICAgICAkbm9kZVJpZ2h0LmlubmVySFRNTCA9IGBgO1xuICAgICAgbGV0IGJ1dHRvbk5ldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uTmV3LmlubmVySFRNTCA9IGBOZXdgO1xuICAgICAgYnV0dG9uTmV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5tYWluLm5ld1Byb2plY3QoJycpKTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbk5ldyk7XG5cbiAgICAgIGxldCBidXR0b25FeHBvcnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ1dHRvbkV4cG9ydC5pbm5lckhUTUwgPSBgRXhwb3J0YDtcbiAgICAgIGJ1dHRvbkV4cG9ydC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IGRvd25sb2FkT2JqZWN0QXNKc29uKHRoaXMubWFpbi5leHBvcnRKc29uKCksIGB2cy1zb2x1dGlvbi0ke2dldFRpbWUoKX1gKSk7XG4gICAgICAkbm9kZVJpZ2h0Py5hcHBlbmRDaGlsZChidXR0b25FeHBvcnQpO1xuXG4gICAgICBsZXQgYnV0dG9uSW1wb3J0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidXR0b25JbXBvcnQuaW5uZXJIVE1MID0gYEltcG9ydGA7XG4gICAgICBidXR0b25JbXBvcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHJlYWRGaWxlTG9jYWwoKHJzOiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAocnMpIHtcbiAgICAgICAgICAgIHRoaXMubWFpbi5pbXBvcnRKc29uKEpTT04ucGFyc2UocnMpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICAkbm9kZVJpZ2h0Py5hcHBlbmRDaGlsZChidXR0b25JbXBvcnQpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgVmlzdWFsRmxvdyB9IGZyb20gXCIuL1Zpc3VhbEZsb3dcIjtcbmltcG9ydCAqIGFzIFN5c3RlbUJhc2UgZnJvbSBcIi4vc3lzdGVtcy9pbmRleFwiO1xuaW1wb3J0ICogYXMgQ29yZSBmcm9tICcuL2NvcmUvaW5kZXgnO1xuaW1wb3J0ICogYXMgRGVzZ2luZXIgZnJvbSBcIi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCAqIGFzIERvY2sgZnJvbSAnLi9kb2NrL2luZGV4JztcbmV4cG9ydCBkZWZhdWx0IHtcbiAgVmlzdWFsRmxvdyxcbiAgLi4uU3lzdGVtQmFzZSxcbiAgLi4uQ29yZSxcbiAgLi4uRG9jayxcbiAgLi4uRGVzZ2luZXJcbn07XG5cbiJdLCJuYW1lcyI6WyJTeXN0ZW1CYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztJQUFPLE1BQU0sU0FBUyxHQUFHO0lBQ3ZCLElBQUEsSUFBSSxFQUFFLE1BQU07SUFDWixJQUFBLFVBQVUsRUFBRSxZQUFZO0lBQ3hCLElBQUEsWUFBWSxFQUFFLGNBQWM7SUFDNUIsSUFBQSxXQUFXLEVBQUUsYUFBYTtJQUMxQixJQUFBLFVBQVUsRUFBRSxZQUFZO0lBQ3hCLElBQUEsY0FBYyxFQUFFLGdCQUFnQjtJQUNoQyxJQUFBLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLElBQUEsT0FBTyxFQUFFLFNBQVM7SUFDbEIsSUFBQSxXQUFXLEVBQUUsYUFBYTtJQUMxQixJQUFBLFFBQVEsRUFBRSxVQUFVO0lBQ3BCLElBQUEsSUFBSSxFQUFFLE1BQU07SUFDWixJQUFBLFVBQVUsRUFBRSxZQUFZO0lBQ3hCLElBQUEsV0FBVyxFQUFFLGFBQWE7SUFDMUIsSUFBQSxTQUFTLEVBQUUsV0FBVztLQUN2QixDQUFBO0lBRU0sTUFBTSxRQUFRLEdBQUc7SUFDdEIsSUFBQSxJQUFJLEVBQUUsU0FBUztJQUNmLElBQUEsR0FBRyxFQUFFLFFBQVE7SUFDYixJQUFBLElBQUksRUFBRSxTQUFTO0lBQ2YsSUFBQSxN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
