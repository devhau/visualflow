
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow.js v0.0.4
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
                let controls = this.main.getControlAll();
                Object.keys(controls).forEach((item) => {
                    let nodeItem = document.createElement('div');
                    nodeItem.classList.add('node-item');
                    nodeItem.setAttribute('draggable', 'true');
                    nodeItem.setAttribute('data-node', item);
                    nodeItem.innerHTML = `${controls[item].icon} <span>${controls[item].name}</span`;
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

    class Node extends BaseFlow {
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
                this.data.InitData(data, this.properties);
                this.parent.data.Append('nodes', this.data);
            }
            this.data.on(EventEnum.dataChange, this.renderUI.bind(this));
            this.elNode.classList.add('vs-node');
            if (this.option.class) {
                this.elNode.classList.add(this.option.class);
            }
            this.parent.elCanvas.appendChild(this.elNode);
            this.elNode.setAttribute('node-id', this.GetId());
            this.elNode.addEventListener('mousedown', () => this.parent.setNodeChoose(this));
            this.elNode.addEventListener('touchstart', () => this.parent.setNodeChoose(this));
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
                this.groupData.onSafe(EventEnum.dataChange, this.UpdateUI.bind(this));
            }
            else {
                this.groupData.onSafe(EventEnum.dataChange, this.UpdateUI.bind(this));
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
            this.main.dispatch(EventEnum.groupChange, {
                group: this.GetGroupName()
            });
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
        openGroup(id) {
            this.group = [id, ...this.group];
            this.toolbar.renderPathGroup();
            this.RenderUI();
            this.main.dispatch(EventEnum.groupChange, {
                group: this.GetGroupName()
            });
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
            if (detail.sender && detail.sender instanceof Node)
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
            this.main.on(EventEnum.changeVariable, this.Render.bind(this));
            this.main.on(EventEnum.openProject, this.Render.bind(this));
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
                    new VariableItem(item, this);
                }
            }
        }
    }
    class VariableItem {
        variable;
        elNode = document.createElement('tr');
        nameInput = document.createElement('input');
        typeInput = document.createElement('select');
        scopeInput = document.createElement('select');
        valueDefaultInput = document.createElement('input');
        constructor(variable, parent) {
            this.variable = variable;
            this.nameInput.value = this.variable.name;
            this.valueDefaultInput.value = this.variable.initalValue ?? '';
            for (let item of ['text', 'number', 'date', 'object']) {
                let option = document.createElement('option');
                option.text = item;
                option.value = item;
                this.typeInput.appendChild(option);
            }
            let nameColumn = document.createElement('td');
            nameColumn.appendChild(this.nameInput);
            this.elNode.appendChild(nameColumn);
            let typeColumn = document.createElement('td');
            typeColumn.appendChild(this.typeInput);
            this.elNode.appendChild(typeColumn);
            let scopeColumn = document.createElement('td');
            scopeColumn.appendChild(this.scopeInput);
            this.elNode.appendChild(scopeColumn);
            let valueDefaultColumn = document.createElement('td');
            valueDefaultColumn.appendChild(this.valueDefaultInput);
            this.elNode.appendChild(valueDefaultColumn);
            let buttonRemove = document.createElement('button');
            buttonRemove.innerHTML = `-`;
            buttonRemove.addEventListener('click', () => {
                parent.main.removeVariable(variable);
            });
            let buttonRemoveColumn = document.createElement('td');
            buttonRemoveColumn.appendChild(buttonRemove);
            this.elNode.appendChild(buttonRemoveColumn);
            parent.elNode.querySelector('table tbody')?.appendChild(this.elNode);
            parent.main.on(EventEnum.groupChange, ({ group }) => {
                this.RenderScope(group);
            });
            this.RenderScope();
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
            let option = document.createElement('option');
            option.text = ScopeRoot;
            option.value = ScopeRoot;
            this.scopeInput.prepend(option);
            this.scopeInput.value = this.variable.scope;
        }
    }

    var Desginer = /*#__PURE__*/Object.freeze({
        __proto__: null,
        DesginerView: DesginerView,
        Line: Line,
        Node: Node,
        VariableView: VariableView
    });

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

    class ProjectView {
        elNode;
        main;
        constructor(elNode, main) {
            this.elNode = elNode;
            this.main = main;
            this.elNode.classList.add('vs-variable');
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
            class: 'node-test',
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

    class SystemBase {
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
            this.main = main ?? new SystemBase();
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
        SystemBase,
        ...Core,
        ...Dock,
        ...Desginer
    };

    return index;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvQ29uc3RhbnQudHMiLCIuLi9zcmMvY29yZS9FdmVudEZsb3cudHMiLCIuLi9zcmMvY29yZS9EYXRhRmxvdy50cyIsIi4uL3NyYy9jb3JlL0Jhc2VGbG93LnRzIiwiLi4vc3JjL2NvcmUvVXRpbHMudHMiLCIuLi9zcmMvY29yZS9EYXRhVmlldy50cyIsIi4uL3NyYy9jb3JlL1ZhcmlhYmxlTm9kZS50cyIsIi4uL3NyYy9kb2NrL0RvY2tCYXNlLnRzIiwiLi4vc3JjL2RvY2svQ29udHJvbERvY2sudHMiLCIuLi9zcmMvZGVzZ2luZXIvTGluZS50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXdfRXZlbnQudHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3X1Rvb2xiYXIudHMiLCIuLi9zcmMvZGVzZ2luZXIvTm9kZS50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXcudHMiLCIuLi9zcmMvZGVzZ2luZXIvVmFyaWFibGVWaWV3LnRzIiwiLi4vc3JjL2RvY2svVmFyaWFibGVEb2NrLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL1Byb2plY3RWaWV3LnRzIiwiLi4vc3JjL2RvY2svUHJvamVjdERvY2sudHMiLCIuLi9zcmMvZG9jay9Qcm9wZXJ0eURvY2sudHMiLCIuLi9zcmMvZG9jay9WaWV3RG9jay50cyIsIi4uL3NyYy9kb2NrL0RvY2tNYW5hZ2VyLnRzIiwiLi4vc3JjL3N5c3RlbXMvY29udHJvbC50cyIsIi4uL3NyYy9zeXN0ZW1zL1N5c3RlbUJhc2UudHMiLCIuLi9zcmMvVmlzdWFsRmxvdy50cyIsIi4uL3NyYy9kb2NrL1RhYkRvY2sudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IEV2ZW50RW51bSA9IHtcclxuICBpbml0OiBcImluaXRcIixcclxuICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcclxuICBzaG93UHJvcGVydHk6IFwic2hvd1Byb3BlcnR5XCIsXHJcbiAgb3BlblByb2plY3Q6IFwib3BlblByb2plY3RcIixcclxuICBuZXdQcm9qZWN0OiBcIm5ld1Byb2plY3RcIixcclxuICBjaGFuZ2VWYXJpYWJsZTogXCJjaGFuZ2VWYXJpYWJsZVwiLFxyXG4gIGNoYW5nZTogXCJjaGFuZ2VcIixcclxuICBkaXNwb3NlOiBcImRpc3Bvc2VcIixcclxuICBncm91cENoYW5nZTogXCJncm91cENoYW5nZVwiLFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgRG9ja0VudW0gPSB7XHJcbiAgbGVmdDogXCJ2cy1sZWZ0XCIsXHJcbiAgdG9wOiBcInZzLXRvcFwiLFxyXG4gIHZpZXc6IFwidnMtdmlld1wiLFxyXG4gIGJvdHRvbTogXCJ2cy1ib3R0b21cIixcclxuICByaWdodDogXCJ2cy1yaWdodFwiLFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgUHJvcGVydHlFbnVtID0ge1xyXG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXHJcbiAgc29sdXRpb246ICdtYWluX3NvbHV0aW9uJyxcclxuICBsaW5lOiAnbWFpbl9saW5lJyxcclxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnLFxyXG4gIGdyb3VwQ2F2YXM6IFwibWFpbl9ncm91cENhdmFzXCIsXHJcbn07XHJcbiIsImltcG9ydCB7IElFdmVudCB9IGZyb20gXCIuL0lGbG93XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRGbG93IGltcGxlbWVudHMgSUV2ZW50IHtcclxuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG4gIH1cclxuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHRoaXMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgLyogRXZlbnRzICovXHJcbiAgcHVibGljIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xyXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGV2ZW50IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgZXZlbnR9YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcclxuICAgICAgICBsaXN0ZW5lcnM6IFtdXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXHJcblxyXG4gICAgaWYgKCF0aGlzLmV2ZW50c1tldmVudF0pIHJldHVybiBmYWxzZVxyXG5cclxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcclxuICAgIGNvbnN0IGxpc3RlbmVySW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcclxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXHJcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xyXG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBJUHJvcGVydHkgfSBmcm9tIFwiLi9JRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgRGF0YUZsb3cge1xuICBwcml2YXRlIGRhdGE6IGFueSA9IHt9O1xuICBwcml2YXRlIHByb3BlcnRpZXM6IGFueSA9IG51bGw7XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIHB1YmxpYyBnZXRQcm9wZXJ0aWVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcGVydGllcztcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwcm9wZXJ0eTogSVByb3BlcnR5IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBkYXRhOiBhbnkgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5sb2FkKGRhdGEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgSW5pdERhdGEoZGF0YTogYW55ID0gbnVsbCwgcHJvcGVydGllczogYW55ID0gLTEpIHtcbiAgICBpZiAocHJvcGVydGllcyAhPT0gLTEpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubG9hZChkYXRhKTtcbiAgfVxuICBwcml2YXRlIGV2ZW50RGF0YUNoYW5nZShrZXk6IHN0cmluZywga2V5Q2hpbGQ6IHN0cmluZywgdmFsdWVDaGlsZDogYW55LCBzZW5kZXJDaGlsZDogYW55LCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGluZGV4KSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fV8ke2tleUNoaWxkfWAsIHtcbiAgICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVFdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHB1YmxpYyBPbkV2ZW50RGF0YShpdGVtOiBEYXRhRmxvdywga2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcbiAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfWAsICh7IGtleToga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkIH06IGFueSkgPT4gdGhpcy5ldmVudERhdGFDaGFuZ2Uoa2V5LCBrZXlDaGlsZCwgdmFsdWVDaGlsZCwgc2VuZGVyQ2hpbGQsIGluZGV4KSk7XG4gIH1cbiAgcHJpdmF0ZSBCaW5kRXZlbnQodmFsdWU6IGFueSwga2V5OiBzdHJpbmcpIHtcbiAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHRoaXMuT25FdmVudERhdGEodmFsdWUgYXMgRGF0YUZsb3csIGtleSk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAodmFsdWUgYXMgW10pLmxlbmd0aCA+IDAgJiYgdmFsdWVbMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgKHZhbHVlIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLk9uRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0Rpc3BhdGNoOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICh0aGlzLmRhdGFba2V5XSAhPSB2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZGF0YVtrZXldKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgdGhpcy5SZW1vdmVFdmVudERhdGEoKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93KSwga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFba2V5XSkgJiYgKHRoaXMuZGF0YVtrZXldIGFzIFtdKS5sZW5ndGggPiAwICYmIHRoaXMuZGF0YVtrZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgICAodGhpcy5kYXRhW2tleV0gYXMgRGF0YUZsb3dbXSkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3csIGluZGV4OiBudW1iZXIpID0+IHRoaXMuUmVtb3ZlRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gICAgfVxuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgaWYgKGlzRGlzcGF0Y2gpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgIH0pO1xuICAgIH1cblxuICB9XG4gIHB1YmxpYyBTZXREYXRhKGRhdGE6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IGZhbHNlKSB7XG5cbiAgICBpZiAoaXNDbGVhckRhdGEpIHRoaXMuZGF0YSA9IHt9O1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIGxldCAkZGF0YTogRGF0YUZsb3cgPSBkYXRhIGFzIERhdGFGbG93O1xuICAgICAgaWYgKCF0aGlzLnByb3BlcnR5ICYmICRkYXRhLnByb3BlcnR5KSB0aGlzLnByb3BlcnR5ID0gJGRhdGEucHJvcGVydHk7XG4gICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cygkZGF0YS5nZXRQcm9wZXJ0aWVzKCkpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIHRoaXMuU2V0KGtleSwgZGF0YVtrZXldLCBzZW5kZXIsIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgZGF0YVxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBHZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2tleV07XG4gIH1cbiAgcHVibGljIEFwcGVuZChrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGlmICghdGhpcy5kYXRhW2tleV0pIHRoaXMuZGF0YVtrZXldID0gW107XG4gICAgdGhpcy5kYXRhW2tleV0gPSBbLi4udGhpcy5kYXRhW2tleV0sIHZhbHVlXTtcbiAgICB0aGlzLkJpbmRFdmVudCh2YWx1ZSwga2V5KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgdGhpcy5kYXRhW2tleV0uaW5kZXhPZih2YWx1ZSk7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5kYXRhW2tleV0uaW5kZXhPZih2YWx1ZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuUmVtb3ZlRXZlbnREYXRhKHRoaXMuZGF0YVtrZXldW2luZGV4XSwga2V5KTtcbiAgICAgIHRoaXMuZGF0YVtrZXldLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIGlmICghdGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnR5Py5nZXRQcm9wZXJ0eUJ5S2V5KGRhdGEua2V5KTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcGVydGllcykge1xuICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcbiAgICAgICAgdGhpcy5kYXRhW2tleV0gPSAoZGF0YT8uW2tleV0gPz8gKCh0eXBlb2YgdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0KCkgOiB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCkgPz8gXCJcIikpO1xuICAgICAgICBpZiAoISh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSAmJiB0aGlzLmRhdGFba2V5XS5rZXkpIHtcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCB0aGlzLmRhdGFba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhW2tleV0pICYmIHRoaXMucHJvcGVydHkgJiYgISh0aGlzLmRhdGFba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSkge1xuICAgICAgICAgIHRoaXMuZGF0YVtrZXldID0gdGhpcy5kYXRhW2tleV0ubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICghKGl0ZW0gaW5zdGFuY2VvZiBEYXRhRmxvdykgJiYgaXRlbS5rZXkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCBpdGVtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuQmluZEV2ZW50KHRoaXMuZGF0YVtrZXldLCBrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudG9Kc29uKCkpO1xuICB9XG4gIHB1YmxpYyB0b0pzb24oKSB7XG4gICAgbGV0IHJzOiBhbnkgPSB7fTtcbiAgICBpZiAoIXRoaXMucHJvcGVydGllcykge1xuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0eT8uZ2V0UHJvcGVydHlCeUtleSh0aGlzLmRhdGEua2V5KTtcbiAgICB9XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcbiAgICAgIHJzW2tleV0gPSB0aGlzLkdldChrZXkpO1xuICAgICAgaWYgKHJzW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICByc1trZXldID0gcnNba2V5XS50b0pzb24oKTtcbiAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyc1trZXldKSAmJiAocnNba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiByc1trZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0ubWFwKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS50b0pzb24oKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBycztcbiAgfVxuICBwdWJsaWMgZGVsZXRlKCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XHJcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XHJcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xyXG5pbXBvcnQgeyBJRXZlbnQgfSBmcm9tIFwiLi9JRmxvd1wiO1xyXG5leHBvcnQgY2xhc3MgRmxvd0NvcmUgaW1wbGVtZW50cyBJRXZlbnQge1xyXG4gIHB1YmxpYyBHZXRJZCgpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdpZCcpO1xyXG4gIH1cclxuICBwdWJsaWMgU2V0SWQoaWQ6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ2lkJywgaWQpO1xyXG4gIH1cclxuICBwdWJsaWMgcHJvcGVydGllczogYW55ID0ge307XHJcbiAgcHVibGljIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XHJcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHJcbiAgcHVibGljIENoZWNrRWxlbWVudENoaWxkKGVsOiBIVE1MRWxlbWVudCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxOb2RlID09IGVsIHx8IHRoaXMuZWxOb2RlLmNvbnRhaW5zKGVsKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcclxuICBwdWJsaWMgU2V0RGF0YShkYXRhOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCkge1xyXG4gICAgdGhpcy5kYXRhLlNldERhdGEoZGF0YSwgc2VuZGVyKTtcclxuICB9XHJcbiAgcHVibGljIFNldERhdGFGbG93KGRhdGE6IERhdGFGbG93KSB7XHJcbiAgICB0aGlzLmRhdGEuU2V0RGF0YShkYXRhLCB0aGlzLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLmRpc3BhdGNoKGBiaW5kX2RhdGFfZXZlbnRgLCB7IGRhdGEsIHNlbmRlcjogdGhpcyB9KTtcclxuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XHJcbiAgfVxyXG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xyXG4gIH1cclxuICBSZW1vdmVEYXRhRXZlbnQoKSB7XHJcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uY2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xyXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJhc2VGbG93PFRQYXJlbnQgZXh0ZW5kcyBGbG93Q29yZT4gZXh0ZW5kcyBGbG93Q29yZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJlbnQ6IFRQYXJlbnQpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgfVxyXG59XHJcbiIsImV4cG9ydCBjb25zdCBMT0cgPSAobWVzc2FnZT86IGFueSwgLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiBjb25zb2xlLmxvZyhtZXNzYWdlLCBvcHRpb25hbFBhcmFtcyk7XG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IChuZXcgRGF0ZSgpKTtcbmV4cG9ydCBjb25zdCBnZXRUaW1lID0gKCkgPT4gZ2V0RGF0ZSgpLmdldFRpbWUoKTtcbmV4cG9ydCBjb25zdCBnZXRVdWlkID0gKCkgPT4ge1xuICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICBsZXQgczogYW55ID0gW107XG4gIGxldCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xuICB9XG4gIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcbiAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXG4gIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICByZXR1cm4gdXVpZDtcbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBhcmVTb3J0ID0gKGE6IGFueSwgYjogYW55KSA9PiB7XG4gIGlmIChhLnNvcnQgPCBiLnNvcnQpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKGEuc29ydCA+IGIuc29ydCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuZXhwb3J0IGNvbnN0IGlzRnVuY3Rpb24gPSAoZm46IGFueSkgPT4ge1xuICByZXR1cm4gZm4gJiYgZm4gaW5zdGFuY2VvZiBGdW5jdGlvbjtcbn1cbmV4cG9ydCBjb25zdCBkb3dubG9hZE9iamVjdEFzSnNvbiA9IChleHBvcnRPYmo6IGFueSwgZXhwb3J0TmFtZTogc3RyaW5nKSA9PiB7XG4gIHZhciBkYXRhU3RyID0gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGV4cG9ydE9iaikpO1xuICB2YXIgZG93bmxvYWRBbmNob3JOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBkb3dubG9hZEFuY2hvck5vZGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBkYXRhU3RyKTtcbiAgZG93bmxvYWRBbmNob3JOb2RlLnNldEF0dHJpYnV0ZShcImRvd25sb2FkXCIsIGV4cG9ydE5hbWUgKyBcIi5qc29uXCIpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRvd25sb2FkQW5jaG9yTm9kZSk7IC8vIHJlcXVpcmVkIGZvciBmaXJlZm94XG4gIGRvd25sb2FkQW5jaG9yTm9kZS5jbGljaygpO1xuICBkb3dubG9hZEFuY2hvck5vZGUucmVtb3ZlKCk7XG59XG5leHBvcnQgY29uc3QgcmVhZEZpbGVMb2NhbCA9IChjYWxsYmFjazogYW55KSA9PiB7XG4gIHZhciBpbnB1dEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnZmlsZScpO1xuICBpbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrPy4oZnIucmVzdWx0KTtcbiAgICB9XG4gICAgaWYgKGlucHV0RWwgJiYgaW5wdXRFbC5maWxlcylcbiAgICAgIGZyLnJlYWRBc1RleHQoaW5wdXRFbC5maWxlc1swXSk7XG4gIH0pO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlucHV0RWwpO1xuICBpbnB1dEVsLmNsaWNrKCk7XG4gIGlucHV0RWwucmVtb3ZlKCk7XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuL0lGbG93XCI7XHJcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XHJcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgaXNGdW5jdGlvbiB9IGZyb20gXCIuL1V0aWxzXCI7XHJcblxyXG5leHBvcnQgY29uc3QgVGFnVmlldyA9IFsnU1BBTicsICdESVYnLCAnUCcsICdURVhUQVJFQSddO1xyXG5leHBvcnQgY2xhc3MgRGF0YVZpZXcge1xyXG4gIHByaXZhdGUgZWxOb2RlOiBFbGVtZW50IHwgdW5kZWZpbmVkO1xyXG4gIHByaXZhdGUgcHJvcGVydHk6IGFueTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBlbDogRWxlbWVudCwgcHJpdmF0ZSBkYXRhOiBEYXRhRmxvdywgcHJpdmF0ZSBtYWluOiBJTWFpbiwgcHJpdmF0ZSBrZXlOYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbCkge1xyXG4gICAgaWYgKHRoaXMua2V5TmFtZSkge1xyXG4gICAgICBpZiAoIWVsLmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpKSB7XHJcbiAgICAgICAgdGhpcy5wcm9wZXJ0eSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KHRoaXMuZGF0YS5HZXQoJ2tleScpKT8uW3RoaXMua2V5TmFtZV07XHJcbiAgICAgICAgdGhpcy5lbC5jbGFzc0xpc3QuYWRkKCdub2RlLWVkaXRvcicpO1xyXG4gICAgICAgIGlmICh0aGlzLnByb3BlcnR5LmVkaXQpIHtcclxuICAgICAgICAgIGlmICh0aGlzLnByb3BlcnR5LnNlbGVjdCkge1xyXG4gICAgICAgICAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcIm5vZGUtZm9ybS1jb250cm9sXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJywgdGhpcy5rZXlOYW1lKTtcclxuICAgICAgICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5rZXlOYW1lID0gZWw/LmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpO1xyXG4gICAgICBpZiAodGhpcy5rZXlOYW1lKSB7XHJcbiAgICAgICAgdGhpcy5wcm9wZXJ0eSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KHRoaXMuZGF0YS5HZXQoJ2tleScpKT8uW3RoaXMua2V5TmFtZV07XHJcbiAgICAgICAgdGhpcy5lbE5vZGUgPSB0aGlzLmVsO1xyXG4gICAgICAgIGxldCBub2RlRWRpdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIG5vZGVFZGl0b3IuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3InKTtcclxuICAgICAgICBlbC5wYXJlbnRFbGVtZW50Py5pbnNlcnRCZWZvcmUobm9kZUVkaXRvciwgZWwpO1xyXG4gICAgICAgIGVsLnBhcmVudEVsZW1lbnQ/LnJlbW92ZUNoaWxkKGVsKTtcclxuICAgICAgICBub2RlRWRpdG9yLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMua2V5TmFtZSlcclxuICAgICAgdGhpcy5iaW5kRGF0YSgpO1xyXG4gIH1cclxuICBwcml2YXRlIGJpbmREYXRhKCkge1xyXG4gICAgaWYgKHRoaXMua2V5TmFtZSAmJiB0aGlzLmVsTm9kZSkge1xyXG4gICAgICB0aGlzLmRhdGEub24oYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7dGhpcy5rZXlOYW1lfWAsIHRoaXMuYmluZElucHV0LmJpbmQodGhpcykpO1xyXG4gICAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcclxuICAgICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xyXG4gICAgICBpZiAodGhpcy5wcm9wZXJ0eSAmJiB0aGlzLnByb3BlcnR5LnNlbGVjdCAmJiBpc0Z1bmN0aW9uKHRoaXMucHJvcGVydHkuZGF0YVNlbGVjdCkpIHtcclxuICAgICAgICBjb25zdCBvcHRpb25zID0gdGhpcy5wcm9wZXJ0eS5kYXRhU2VsZWN0KHsgZWxOb2RlOiB0aGlzLmVsTm9kZSwgbWFpbjogdGhpcy5tYWluLCBrZXk6IHRoaXMua2V5TmFtZSB9KS5tYXAoKHsgdmFsdWUsIHRleHQgfTogYW55KSA9PiB7XHJcbiAgICAgICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XHJcbiAgICAgICAgICBvcHRpb24udmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgIG9wdGlvbi50ZXh0ID0gdGV4dDtcclxuICAgICAgICAgIHJldHVybiBvcHRpb247XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZm9yIChsZXQgb3B0aW9uIG9mIG9wdGlvbnMpIHtcclxuICAgICAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKG9wdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5wcm9wZXJ0eSAmJiBpc0Z1bmN0aW9uKHRoaXMucHJvcGVydHkuc2NyaXB0KSkge1xyXG4gICAgICAgIHRoaXMucHJvcGVydHkuc2NyaXB0KHsgZWxOb2RlOiB0aGlzLmVsTm9kZSwgbWFpbjogdGhpcy5tYWluLCBrZXk6IHRoaXMua2V5TmFtZSB9KTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnNldE5vZGVWYWx1ZSh0aGlzLmRhdGEuR2V0KHRoaXMua2V5TmFtZSkpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwcml2YXRlIHNldE5vZGVWYWx1ZSh2YWx1ZTogYW55KSB7XHJcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcclxuICAgICAgaWYgKFRhZ1ZpZXcuaW5jbHVkZXModGhpcy5lbE5vZGUudGFnTmFtZSkpIHtcclxuICAgICAgICAodGhpcy5lbE5vZGUgYXMgYW55KS5pbm5lclRleHQgPSBgJHt2YWx1ZX1gO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfVxyXG4gIHByaXZhdGUgYmluZElucHV0KHsgdmFsdWUsIHNlbmRlciB9OiBhbnkpIHtcclxuICAgIGlmIChzZW5kZXIgIT09IHRoaXMgJiYgdGhpcy5lbE5vZGUgJiYgc2VuZGVyLmVsTm9kZSAhPT0gdGhpcy5lbE5vZGUpIHtcclxuICAgICAgdGhpcy5zZXROb2RlVmFsdWUodmFsdWUpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwcml2YXRlIGJpbmRFdmVudCgpIHtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5rZXlOYW1lICYmIHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLmtleU5hbWUsICh0aGlzLmVsTm9kZSBhcyBhbnkpLnZhbHVlLCB0aGlzKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBEZWxldGUoKSB7XHJcbiAgICBpZiAodGhpcy5rZXlOYW1lICYmIHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHt0aGlzLmtleU5hbWV9YCwgdGhpcy5iaW5kSW5wdXQuYmluZCh0aGlzKSk7XHJcbiAgICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xyXG4gICAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5iaW5kRXZlbnQuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBzdGF0aWMgQmluZEVsZW1lbnQoZWw6IEVsZW1lbnQsIGRhdGE6IERhdGFGbG93LCBtYWluOiBJTWFpbiwga2V5OiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IERhdGFWaWV3W10ge1xyXG4gICAgaWYgKGVsLmNoaWxkRWxlbWVudENvdW50ID09IDAgfHwgZWwuZ2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJykpIHtcclxuICAgICAgcmV0dXJuIFtuZXcgRGF0YVZpZXcoZWwsIGRhdGEsIG1haW4sIGtleSldO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnW25vZGVcXFxcOm1vZGVsXScpKS5tYXAoKGl0ZW06IEVsZW1lbnQpID0+IHtcclxuICAgICAgcmV0dXJuIG5ldyBEYXRhVmlldyhpdGVtLCBkYXRhLCBtYWluKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XG5cbmV4cG9ydCBjb25zdCBTY29wZVJvb3QgPSBcInJvb3RcIjtcbmV4cG9ydCBjbGFzcyBWYXJpYWJsZU5vZGUgZXh0ZW5kcyBFdmVudEZsb3cge1xuICBuYW1lOiBzdHJpbmcgPSAnJztcbiAgdmFsdWU6IGFueTtcbiAgaW5pdGFsVmFsdWU6IGFueTtcbiAgc2NvcGU6IHN0cmluZyA9IFNjb3BlUm9vdDtcbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEb2NrQmFzZSB7XHJcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBwcm90ZWN0ZWQgZWxDb250ZW50OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJ0RvY2tCYXNlJztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBCb3hJbmZvKHRpdGxlOiBzdHJpbmcsICRjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd2cy1ib3hpbmZvJyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ib3hpbmZvJyk7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInZzLWJveGluZm9faGVhZGVyXCI+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX3RpdGxlXCI+JHt0aXRsZX08L3NwYW4+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX2J1dHRvblwiPjwvc3Bhbj48L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJ2cy1ib3hpbmZvX2NvbnRlbnRcIj48L2Rpdj5gO1xyXG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19jb250ZW50Jyk7XHJcbiAgICBpZiAoJGNhbGxiYWNrKSB7XHJcbiAgICAgICRjYWxsYmFjayh0aGlzLmVsQ29udGVudCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1jb250cm9sJyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdDb250cm9sJywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBsZXQgY29udHJvbHMgPSB0aGlzLm1haW4uZ2V0Q29udHJvbEFsbCgpO1xuICAgICAgT2JqZWN0LmtleXMoY29udHJvbHMpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XG4gICAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcbiAgICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBpdGVtKTtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7Y29udHJvbHNbaXRlbV0uaWNvbn0gPHNwYW4+JHtjb250cm9sc1tpdGVtXS5uYW1lfTwvc3BhbmA7XG4gICAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuZHJhZ1N0YXJ0LmJpbmQodGhpcykpXG4gICAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlIGRyYWdlbmQoZTogYW55KSB7XG4gICAgdGhpcy5tYWluLnNldENvbnRyb2xDaG9vc2UobnVsbCk7XG4gIH1cblxuICBwcml2YXRlIGRyYWdTdGFydChlOiBhbnkpIHtcbiAgICBsZXQga2V5ID0gZS50YXJnZXQuY2xvc2VzdChcIi5ub2RlLWl0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShrZXkpO1xuICAgIGlmIChlLnR5cGUgIT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKFwibm9kZVwiLCBrZXkpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4vTm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgTGluZSB7XG4gIHB1YmxpYyBlbE5vZGU6IFNWR0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJzdmdcIik7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcbiAgcHJpdmF0ZSBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgdGVtcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGZyb206IE5vZGUsIHB1YmxpYyBmcm9tSW5kZXg6IG51bWJlciA9IDAsIHB1YmxpYyB0bzogTm9kZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCwgcHVibGljIHRvSW5kZXg6IG51bWJlciA9IDAsIGRhdGE6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKFwibWFpbi1wYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgJycpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJjb25uZWN0aW9uXCIpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxQYXRoKTtcbiAgICB0aGlzLmZyb20ucGFyZW50LmVsQ2FudmFzLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcblxuICAgIHRoaXMuZnJvbS5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudG8/LkFkZExpbmUodGhpcyk7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZGF0YS5Jbml0RGF0YShcbiAgICAgIHtcbiAgICAgICAgZnJvbTogdGhpcy5mcm9tLkdldElkKCksXG4gICAgICAgIGZyb21JbmRleDogdGhpcy5mcm9tSW5kZXgsXG4gICAgICAgIHRvOiB0aGlzLnRvPy5HZXRJZCgpLFxuICAgICAgICB0b0luZGV4OiB0aGlzLnRvSW5kZXhcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIC4uLiB0aGlzLmZyb20ucGFyZW50Lm1haW4uZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubGluZSkgfHwge31cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuZnJvbS5kYXRhLkFwcGVuZCgnbGluZXMnLCB0aGlzLmRhdGEpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVUbyh0b194OiBudW1iZXIsIHRvX3k6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5mcm9tIHx8IHRoaXMuZnJvbS5lbE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xuICAgIGxldCB7IHg6IGZyb21feCwgeTogZnJvbV95IH06IGFueSA9IHRoaXMuZnJvbS5nZXRQb3N0aXNpb25Eb3QodGhpcy5mcm9tSW5kZXgpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCk6IExpbmUge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvLmVsTm9kZSkge1xuICAgICAgbGV0IHsgeDogdG9feCwgeTogdG9feSB9OiBhbnkgPSB0aGlzLnRvLmdldFBvc3Rpc2lvbkRvdCh0aGlzLnRvSW5kZXgpO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIEFjdGl2ZShmbGc6IGFueSA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwsIGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5mcm9tLmRhdGEuUmVtb3ZlKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gICAgaWYgKHRoaXMuZnJvbSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50bz8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsUGF0aC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLmZyb20ucGFyZW50LnNldExpbmVDaG9vc2UodGhpcylcbiAgfVxuICBwdWJsaWMgc2V0Tm9kZVRvKG5vZGU6IE5vZGUgfCB1bmRlZmluZWQsIHRvSW5kZXg6IG51bWJlcikge1xuICAgIHRoaXMudG8gPSBub2RlO1xuICAgIHRoaXMudG9JbmRleCA9IHRvSW5kZXg7XG4gIH1cbiAgcHVibGljIENsb25lKCkge1xuICAgIGlmICh0aGlzLnRvICYmIHRoaXMudG9JbmRleCAmJiB0aGlzLmZyb20gIT0gdGhpcy50byAmJiAhdGhpcy5mcm9tLmNoZWNrTGluZUV4aXN0cyh0aGlzLmZyb21JbmRleCwgdGhpcy50bywgdGhpcy50b0luZGV4KSkge1xuICAgICAgcmV0dXJuIG5ldyBMaW5lKHRoaXMuZnJvbSwgdGhpcy5mcm9tSW5kZXgsIHRoaXMudG8sIHRoaXMudG9JbmRleCkuVXBkYXRlVUkoKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IGdldFRpbWUgfSBmcm9tIFwiLi4vY29yZS9VdGlsc1wiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuXG5leHBvcnQgZW51bSBNb3ZlVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb2RlID0gMSxcbiAgQ2FudmFzID0gMixcbiAgTGluZSA9IDMsXG59XG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3X0V2ZW50IHtcblxuICBwcml2YXRlIHRpbWVGYXN0Q2xpY2s6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgdGFnSW5nb3JlID0gWydpbnB1dCcsICdidXR0b24nLCAnYScsICd0ZXh0YXJlYSddO1xuXG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgcHJpdmF0ZSBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgZmxnTW92ZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgYXZfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBhdl95OiBudW1iZXIgPSAwO1xuXG4gIHByaXZhdGUgcG9zX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgcG9zX3k6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb3VzZV95OiBudW1iZXIgPSAwO1xuXG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmUgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogRGVzZ2luZXJWaWV3KSB7XG4gICAgLyogTW91c2UgYW5kIFRvdWNoIEFjdGlvbnMgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG4gICAgLyogQ29udGV4dCBNZW51ICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcblxuICAgIC8qIERyb3AgRHJhcCAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5ub2RlX2Ryb3BFbmQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5ub2RlX2RyYWdvdmVyLmJpbmQodGhpcykpO1xuICAgIC8qIFpvb20gTW91c2UgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLnpvb21fZW50ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogRGVsZXRlICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWRvd24uYmluZCh0aGlzKSk7XG4gIH1cblxuICBwcml2YXRlIGNvbnRleHRtZW51KGV2OiBhbnkpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfVxuICBwcml2YXRlIG5vZGVfZHJhZ292ZXIoZXY6IGFueSkgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gIHByaXZhdGUgbm9kZV9kcm9wRW5kKGV2OiBhbnkpIHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGxldCBrZXlOb2RlOiBhbnkgPSB0aGlzLnBhcmVudC5tYWluLmdldENvbnRyb2xDaG9vc2UoKTtcbiAgICBpZiAoIWtleU5vZGUgJiYgZXYudHlwZSAhPT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xuICAgIH1cbiAgICBpZiAoIWtleU5vZGUpIHJldHVybjtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgbGV0IHkgPSB0aGlzLnBhcmVudC5DYWxjWSh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG5cbiAgICBpZiAodGhpcy5wYXJlbnQuY2hlY2tPbmx5Tm9kZShrZXlOb2RlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgbm9kZUl0ZW0gPSB0aGlzLnBhcmVudC5BZGROb2RlKGtleU5vZGUsIHtcbiAgICAgIGdyb3VwOiB0aGlzLnBhcmVudC5DdXJyZW50R3JvdXAoKVxuICAgIH0pO1xuICAgIG5vZGVJdGVtLnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICB9XG4gIHB1YmxpYyB6b29tX2VudGVyKGV2ZW50OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoZXZlbnQuY3RybEtleSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgaWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcbiAgICAgICAgLy8gWm9vbSBPdXRcbiAgICAgICAgdGhpcy5wYXJlbnQuem9vbV9vdXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFpvb20gSW5cbiAgICAgICAgdGhpcy5wYXJlbnQuem9vbV9pbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwcml2YXRlIFN0YXJ0TW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKHRoaXMudGFnSW5nb3JlLmluY2x1ZGVzKGV2LnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudGltZUZhc3RDbGljayA9IGdldFRpbWUoKTtcbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWFpbi1wYXRoJykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkNhbnZhcztcbiAgICBsZXQgbm9kZUNob29zZSA9IHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKTtcbiAgICBpZiAobm9kZUNob29zZSAmJiBub2RlQ2hvb3NlLkNoZWNrRWxlbWVudENoaWxkKGV2LnRhcmdldCkpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIGlmIChub2RlQ2hvb3NlICYmIHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTm9kZSAmJiBldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibm9kZS1kb3RcIikpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xuICAgICAgbGV0IGZyb21JbmRleCA9IGV2LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSBuZXcgTGluZShub2RlQ2hvb3NlLCBmcm9tSW5kZXgpO1xuICAgICAgdGhpcy50ZW1wTGluZS50ZW1wID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICB0aGlzLmF2X3ggPSB0aGlzLnBhcmVudC5nZXRYKCk7XG4gICAgICB0aGlzLmF2X3kgPSB0aGlzLnBhcmVudC5nZXRZKCk7XG4gICAgfVxuICAgIHRoaXMuZmxnRHJhcCA9IHRydWU7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgdGhpcy5mbGdNb3ZlID0gdHJ1ZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLm1vdmVUeXBlKSB7XG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5hdl94ICsgdGhpcy5wYXJlbnQuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLmF2X3kgKyB0aGlzLnBhcmVudC5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xuICAgICAgICAgIHRoaXMucGFyZW50LnNldFkoeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wb3NfeSAtIGVfcG9zX3kpO1xuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgICAgICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgICAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLnBhcmVudC5lbENhbnZhcy5vZmZzZXRMZWZ0IC0geCwgdGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgICAgICBsZXQgbm9kZUVsID0gZXYudGFyZ2V0LmNsb3Nlc3QoJ1tub2RlLWlkXScpO1xuICAgICAgICAgICAgbGV0IG5vZGVJZCA9IG5vZGVFbD8uZ2V0QXR0cmlidXRlKCdub2RlLWlkJyk7XG4gICAgICAgICAgICBsZXQgbm9kZVRvID0gbm9kZUlkID8gdGhpcy5wYXJlbnQuR2V0Tm9kZUJ5SWQobm9kZUlkKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChub2RlVG8gJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IHRvSW5kZXggPSBub2RlRWw/LnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWRvdCcpPy5bMF0/LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xuICAgICAgdGhpcy5tb3VzZV95ID0gZV9wb3NfeTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBFbmRNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIC8vZml4IEZhc3QgQ2xpY2tcbiAgICBpZiAoKChnZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMTAwKSB8fCAhdGhpcy5mbGdNb3ZlKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBlX3Bvc194ID0gdGhpcy5tb3VzZV94O1xuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcbiAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xuICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcbiAgICAgIHRoaXMuYXZfeCA9IDA7XG4gICAgICB0aGlzLmF2X3kgPSAwO1xuICAgIH1cbiAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgdGhpcy50ZW1wTGluZS5DbG9uZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHByaXZhdGUga2V5ZG93bihldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKGV2LmtleSA9PT0gJ0RlbGV0ZScgfHwgKGV2LmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgZXYubWV0YUtleSkpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpPy5kZWxldGUoKTtcbiAgICAgIHRoaXMucGFyZW50LmdldExpbmVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgfVxuICAgIGlmIChldi5rZXkgPT09ICdGMicpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuXG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3X1Rvb2xiYXIge1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgZWxQYXRoR3JvdXA6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHByaXZhdGUgYnRuQmFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IERlc2dpbmVyVmlldykge1xuICAgIHRoaXMuZWxOb2RlID0gcGFyZW50LmVsVG9vbGJhcjtcbiAgICB0aGlzLmVsUGF0aEdyb3VwLmNsYXNzTGlzdC5hZGQoJ3Rvb2xiYXItZ3JvdXAnKTtcbiAgICB0aGlzLnJlbmRlclVJKCk7XG4gICAgdGhpcy5yZW5kZXJQYXRoR3JvdXAoKTtcbiAgfVxuICBwdWJsaWMgcmVuZGVyUGF0aEdyb3VwKCkge1xuICAgIHRoaXMuYnRuQmFjay5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYGRpc3BsYXk6bm9uZTtgKTtcbiAgICB0aGlzLmVsUGF0aEdyb3VwLmlubmVySFRNTCA9IGBgO1xuICAgIGxldCBncm91cHMgPSB0aGlzLnBhcmVudC5HZXRHcm91cE5hbWUoKTtcbiAgICBsZXQgbGVuID0gZ3JvdXBzLmxlbmd0aCAtIDE7XG4gICAgaWYgKGxlbiA8IDApIHJldHVybjtcbiAgICBsZXQgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB0ZXh0LmlubmVySFRNTCA9IGBSb290YDtcbiAgICB0ZXh0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB0aGlzLnBhcmVudC5CYWNrR3JvdXAoJ1Jvb3QnKSk7XG4gICAgdGhpcy5lbFBhdGhHcm91cC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICB0aGlzLmJ0bkJhY2sucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICAgIGZvciAobGV0IGluZGV4ID0gbGVuOyBpbmRleCA+PSAwOyBpbmRleC0tKSB7XG4gICAgICBsZXQgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgIHRleHQuaW5uZXJIVE1MID0gYD4+JHtncm91cHNbaW5kZXhdLnRleHR9YDtcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKCdncm91cCcsIGdyb3Vwc1tpbmRleF0uaWQpO1xuICAgICAgdGV4dC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4gdGhpcy5wYXJlbnQuQmFja0dyb3VwKGdyb3Vwc1tpbmRleF0uaWQpKTtcbiAgICAgIHRoaXMuZWxQYXRoR3JvdXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyByZW5kZXJVSSgpIHtcbiAgICBpZiAoIXRoaXMuZWxOb2RlKSByZXR1cm47XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgdGhpcy5idG5CYWNrLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuQmFja0dyb3VwKCkpO1xuICAgIHRoaXMuYnRuQmFjay5pbm5lckhUTUwgPSBgQmFja2A7XG4gICAgbGV0IGJ0blpvb21JbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21Jbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucGFyZW50Lnpvb21faW4oKSk7XG4gICAgYnRuWm9vbUluLmlubmVySFRNTCA9IGArYDtcbiAgICBsZXQgYnRuWm9vbU91dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21PdXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnBhcmVudC56b29tX291dCgpKTtcbiAgICBidG5ab29tT3V0LmlubmVySFRNTCA9IGAtYDtcbiAgICBsZXQgYnRuWm9vbVJlc2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYnRuWm9vbVJlc2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuem9vbV9yZXNldCgpKTtcbiAgICBidG5ab29tUmVzZXQuaW5uZXJIVE1MID0gYCpgO1xuICAgIGxldCBidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGJ1dHRvbkdyb3VwLmNsYXNzTGlzdC5hZGQoJ3Rvb2xiYXItYnV0dG9uJylcbiAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLmJ0bkJhY2spO1xuICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKGJ0blpvb21Jbik7XG4gICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuWm9vbU91dCk7XG4gICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuWm9vbVJlc2V0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aEdyb3VwKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChidXR0b25Hcm91cCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93LCBFdmVudEVudW0sIERhdGFGbG93LCBEYXRhVmlldyB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBpc0Z1bmN0aW9uIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmV4cG9ydCBjbGFzcyBOb2RlIGV4dGVuZHMgQmFzZUZsb3c8RGVzZ2luZXJWaWV3PiB7XG4gIC8qKlxuICAgKiBHRVQgU0VUIGZvciBEYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0TmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnbmFtZScpO1xuICB9XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneScpO1xuICB9XG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3gnKTtcbiAgfVxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3gnLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIENoZWNrS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2tleScpID09IGtleTtcbiAgfVxuICBwdWJsaWMgZ2V0RGF0YUxpbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2xpbmVzJykgPz8gW107XG4gIH1cbiAgcHVibGljIGNoZWNrTGluZUV4aXN0cyhmcm9tSW5kZXg6IG51bWJlciwgdG86IE5vZGUsIHRvSW5kZXg6IE51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmFyckxpbmUuZmlsdGVyKChpdGVtOiBMaW5lKSA9PiB7XG4gICAgICBpZiAoIWl0ZW0udGVtcCAmJiBpdGVtLnRvID09IHRvICYmIGl0ZW0udG9JbmRleCA9PSB0b0luZGV4ICYmIGl0ZW0uZnJvbUluZGV4ID09IGZyb21JbmRleCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghaXRlbS50ZW1wICYmIGl0ZW0uZnJvbSA9PSB0byAmJiBpdGVtLmZyb21JbmRleCA9PSB0b0luZGV4ICYmIGl0ZW0udG9JbmRleCA9PSBmcm9tSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9KS5sZW5ndGggPiAwO1xuICB9XG4gIHB1YmxpYyBlbENvbnRlbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgYXJyTGluZTogTGluZVtdID0gW107XG4gIHByaXZhdGUgb3B0aW9uOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBhcnJEYXRhVmlldzogRGF0YVZpZXdbXSA9IFtdO1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBEZXNnaW5lclZpZXcsIHByaXZhdGUga2V5Tm9kZTogYW55LCBkYXRhOiBhbnkgPSB7fSkge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5vcHRpb24gPSB0aGlzLnBhcmVudC5tYWluLmdldENvbnRyb2xOb2RlQnlLZXkoa2V5Tm9kZSk7XG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5vcHRpb24/LnByb3BlcnRpZXM7XG4gICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kYXRhLkluaXREYXRhKGRhdGEsIHRoaXMucHJvcGVydGllcyk7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhLkFwcGVuZCgnbm9kZXMnLCB0aGlzLmRhdGEpO1xuICAgIH1cbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtbm9kZScpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9uLmNsYXNzKTtcbiAgICB9XG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnbm9kZS1pZCcsIHRoaXMuR2V0SWQoKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMucmVuZGVyVUkoKTtcbiAgfVxuICBwdWJsaWMgZ2V0T3B0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbjtcbiAgfVxuICBwcml2YXRlIHJlbmRlclVJKGRldGFpbDogYW55ID0gbnVsbCkge1xuICAgIGlmICgoZGV0YWlsICYmIFsneCcsICd5J10uaW5jbHVkZXMoZGV0YWlsLmtleSkpKSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLmVsTm9kZS5jb250YWlucyhkb2N1bWVudC5hY3RpdmVFbGVtZW50KSkgcmV0dXJuO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApO1xuICAgIGlmICh0aGlzLmdldE9wdGlvbigpPy5oaWRlVGl0bGUgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS10b3BcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3R0b21cIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtcmlnaHRcIj48L2Rpdj5cbiAgICBgO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1sZWZ0XCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtdG9wXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj4ke3RoaXMub3B0aW9uLmljb259ICR7dGhpcy5nZXROYW1lKCl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWJvdHRvbVwiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1yaWdodFwiPjwvZGl2PlxuICAgIGA7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkTm9kZURvdCA9IChudW06IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQsIHN0YXJ0OiBudW1iZXIsIHF1ZXJ5OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChudW0pIHtcbiAgICAgICAgbGV0IG5vZGVRdWVyeSA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IocXVlcnkpO1xuICAgICAgICBpZiAobm9kZVF1ZXJ5KSB7XG4gICAgICAgICAgbm9kZVF1ZXJ5LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICAgICAgbGV0IG5vZGVEb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIG5vZGVEb3QuY2xhc3NMaXN0LmFkZCgnbm9kZS1kb3QnKTtcbiAgICAgICAgICAgIG5vZGVEb3Quc2V0QXR0cmlidXRlKCdub2RlJywgYCR7c3RhcnQgKyBpfWApO1xuICAgICAgICAgICAgbm9kZVF1ZXJ5LmFwcGVuZENoaWxkKG5vZGVEb3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LmxlZnQsIDEwMDAsICcubm9kZS1sZWZ0Jyk7XG4gICAgYWRkTm9kZURvdCh0aGlzLm9wdGlvbj8uZG90Py50b3AsIDIwMDAsICcubm9kZS10b3AnKTtcbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LmJvdHRvbSwgMzAwMCwgJy5ub2RlLWJvdHRvbScpO1xuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8ucmlnaHQsIDQwMDAsICcubm9kZS1yaWdodCcpO1xuXG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcubm9kZS1jb250ZW50IC5ib2R5JykgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5wYXJlbnQubWFpbi5yZW5kZXJIdG1sKHRoaXMsIHRoaXMuZWxDb250ZW50KTtcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgdGhpcy5hcnJEYXRhVmlldy5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLkRlbGV0ZSgpKTtcbiAgICBpZiAoaXNGdW5jdGlvbih0aGlzLm9wdGlvbi5zY3JpcHQpKSB7XG4gICAgICB0aGlzLm9wdGlvbi5zY3JpcHQoeyBub2RlOiB0aGlzLCBlbE5vZGU6IHRoaXMuZWxOb2RlLCBtYWluOiB0aGlzLnBhcmVudC5tYWluIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5lbENvbnRlbnQpXG4gICAgICB0aGlzLmFyckRhdGFWaWV3ID0gRGF0YVZpZXcuQmluZEVsZW1lbnQodGhpcy5lbENvbnRlbnQsIHRoaXMuZGF0YSwgdGhpcy5wYXJlbnQubWFpbik7XG4gIH1cbiAgcHVibGljIG9wZW5Hcm91cCgpIHtcbiAgICBpZiAodGhpcy5DaGVja0tleSgnbm9kZV9ncm91cCcpKSB7XG4gICAgICB0aGlzLnBhcmVudC5vcGVuR3JvdXAodGhpcy5HZXRJZCgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgbGV0IHRlbXB4ID0geDtcbiAgICAgIGxldCB0ZW1weSA9IHk7XG4gICAgICBpZiAoIWlDaGVjaykge1xuICAgICAgICB0ZW1weSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgLSB5KTtcbiAgICAgICAgdGVtcHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCAtIHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB4ICE9PSB0aGlzLmdldFgoKSkge1xuICAgICAgICB0aGlzLnNldFgodGVtcHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB5ICE9PSB0aGlzLmdldFkoKSkge1xuICAgICAgICB0aGlzLnNldFkodGVtcHkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgQWN0aXZlKGZsZzogYW55ID0gdHJ1ZSkge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFJlbW92ZUxpbmUobGluZTogTGluZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuYXJyTGluZS5pbmRleE9mKGxpbmUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gIH1cbiAgcHVibGljIGdldFBvc3Rpc2lvbkRvdChpbmRleDogbnVtYmVyID0gMCkge1xuICAgIGxldCBlbERvdDogYW55ID0gdGhpcy5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3IoYC5ub2RlLWRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcbiAgICBpZiAoZWxEb3QpIHtcbiAgICAgIGxldCB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCArIGVsRG90Lm9mZnNldFRvcCArIDEwKTtcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0ICsgMTApO1xuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCkge1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMuZ2V0WSgpfXB4OyBsZWZ0OiAke3RoaXMuZ2V0WCgpfXB4O2ApO1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLlVwZGF0ZVVJKCk7XG4gICAgfSlcbiAgfVxuICBwdWJsaWMgZGVsZXRlKGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLmRlbGV0ZSh0aGlzLCBpc0NsZWFyRGF0YSkpO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMuZGF0YS5kZWxldGUoKTtcbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuUmVtb3ZlRGF0YUV2ZW50KCk7XG4gICAgfVxuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcbiAgICBpZiAoaXNDbGVhckRhdGEpXG4gICAgICB0aGlzLnBhcmVudC5SZW1vdmVOb2RlKHRoaXMpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBSZW5kZXJMaW5lKCkge1xuICAgIHRoaXMuZ2V0RGF0YUxpbmUoKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVGcm9tID0gdGhpcztcbiAgICAgIGxldCBub2RlVG8gPSB0aGlzLnBhcmVudC5HZXROb2RlQnlJZChpdGVtLkdldCgndG8nKSk7XG4gICAgICBsZXQgdG9JbmRleCA9IGl0ZW0uR2V0KCd0b0luZGV4Jyk7XG4gICAgICBsZXQgZnJvbUluZGV4ID0gaXRlbS5HZXQoJ2Zyb21JbmRleCcpO1xuICAgICAgbmV3IExpbmUobm9kZUZyb20sIGZyb21JbmRleCwgbm9kZVRvLCB0b0luZGV4LCBpdGVtKS5VcGRhdGVVSSgpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgRmxvd0NvcmUsIElNYWluLCBFdmVudEVudW0sIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfRXZlbnQgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdfRXZlbnRcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlld19Ub29sYmFyIH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3X1Rvb2xiYXJcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4vTm9kZVwiO1xuXG5leHBvcnQgY29uc3QgWm9vbSA9IHtcbiAgbWF4OiAxLjYsXG4gIG1pbjogMC42LFxuICB2YWx1ZTogMC4xLFxuICBkZWZhdWx0OiAxXG59XG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3IGV4dGVuZHMgRmxvd0NvcmUge1xuXG4gIC8qKlxuICAgKiBHRVQgU0VUIGZvciBEYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0Wm9vbSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd6b29tJyk7XG4gIH1cbiAgcHVibGljIHNldFpvb20odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgnem9vbScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd5Jyk7XG4gIH1cbiAgcHVibGljIHNldFkodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwcml2YXRlIGdyb3VwRGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgbGFzdEdyb3VwTmFtZTogc3RyaW5nID0gXCJcIjtcbiAgcHJpdmF0ZSBnZXREYXRhR3JvdXAoKTogRGF0YUZsb3cge1xuICAgIGlmICh0aGlzLiRsb2NrKSByZXR1cm4gdGhpcy5kYXRhO1xuICAgIC8vIGNhY2hlIGdyb3VwRGF0YVxuICAgIGlmICh0aGlzLmxhc3RHcm91cE5hbWUgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpIHJldHVybiB0aGlzLmdyb3VwRGF0YSA/PyB0aGlzLmRhdGE7XG4gICAgdGhpcy5sYXN0R3JvdXBOYW1lID0gdGhpcy5DdXJyZW50R3JvdXAoKTtcbiAgICBsZXQgZ3JvdXBzID0gdGhpcy5kYXRhLkdldCgnZ3JvdXBzJyk7XG4gICAgdGhpcy5ncm91cERhdGEgPSBncm91cHM/LmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KCdncm91cCcpID09IHRoaXMubGFzdEdyb3VwTmFtZSk/LlswXTtcbiAgICBpZiAoIXRoaXMuZ3JvdXBEYXRhKSB7XG4gICAgICB0aGlzLmdyb3VwRGF0YSA9IG5ldyBEYXRhRmxvdyh0aGlzLm1haW4sIHtcbiAgICAgICAga2V5OiBQcm9wZXJ0eUVudW0uZ3JvdXBDYXZhcyxcbiAgICAgICAgZ3JvdXA6IHRoaXMubGFzdEdyb3VwTmFtZVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRhdGEuQXBwZW5kKCdncm91cHMnLCB0aGlzLmdyb3VwRGF0YSk7XG4gICAgICB0aGlzLmdyb3VwRGF0YS5vblNhZmUoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMuVXBkYXRlVUkuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ3JvdXBEYXRhLm9uU2FmZShFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5VcGRhdGVVSS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ3JvdXBEYXRhO1xuICB9XG4gIHByaXZhdGUgZ3JvdXA6IGFueVtdID0gW107XG4gIHB1YmxpYyBHZXRHcm91cE5hbWUoKTogYW55W10ge1xuICAgIHJldHVybiB0aGlzLmdyb3VwLm1hcCgoaXRlbSkgPT4gKHsgaWQ6IGl0ZW0sIHRleHQ6IHRoaXMuR2V0RGF0YUJ5SWQoaXRlbSk/LkdldCgnbmFtZScpIH0pKTtcbiAgfVxuICBwdWJsaWMgQmFja0dyb3VwKGlkOiBhbnkgPSBudWxsKSB7XG4gICAgbGV0IGluZGV4ID0gMTtcbiAgICBpZiAoaWQpIHtcbiAgICAgIGluZGV4ID0gdGhpcy5ncm91cC5pbmRleE9mKGlkKTtcbiAgICAgIGlmIChpbmRleCA8IDApIGluZGV4ID0gMDtcbiAgICB9XG4gICAgaWYgKGluZGV4KVxuICAgICAgdGhpcy5ncm91cC5zcGxpY2UoMCwgaW5kZXgpO1xuICAgIGVsc2UgdGhpcy5ncm91cCA9IFtdO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLmdyb3VwQ2hhbmdlLCB7XG4gICAgICBncm91cDogdGhpcy5HZXRHcm91cE5hbWUoKVxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBDdXJyZW50R3JvdXAoKSB7XG4gICAgbGV0IG5hbWUgPSB0aGlzLmdyb3VwPy5bMF07XG4gICAgaWYgKG5hbWUgJiYgbmFtZSAhPSAnJykge1xuICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuICAgIHJldHVybiAncm9vdCc7XG4gIH1cblxuICBwdWJsaWMgQ3VycmVudEdyb3VwRGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQnlJZCh0aGlzLkN1cnJlbnRHcm91cCgpKSA/PyB0aGlzLmRhdGE7XG4gIH1cbiAgcHVibGljIG9wZW5Hcm91cChpZDogYW55KSB7XG4gICAgdGhpcy5ncm91cCA9IFtpZCwgLi4udGhpcy5ncm91cF07XG4gICAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLmdyb3VwQ2hhbmdlLCB7XG4gICAgICBncm91cDogdGhpcy5HZXRHcm91cE5hbWUoKVxuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgbGluZUNob29zZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldExpbmVDaG9vc2Uobm9kZTogTGluZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHRoaXMubGluZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubGluZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkge1xuICAgICAgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRMaW5lQ2hvb3NlKCk6IExpbmUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmxpbmVDaG9vc2U7XG4gIH1cbiAgcHJpdmF0ZSBub2RlczogTm9kZVtdID0gW107XG4gIHByaXZhdGUgbm9kZUNob29zZTogTm9kZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldE5vZGVDaG9vc2Uobm9kZTogTm9kZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHRoaXMubm9kZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubm9kZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkge1xuICAgICAgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXRMaW5lQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5ub2RlQ2hvb3NlLmRhdGEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLkN1cnJlbnRHcm91cERhdGEoKSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldE5vZGVDaG9vc2UoKTogTm9kZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubm9kZUNob29zZTtcbiAgfVxuICBwdWJsaWMgQWRkTm9kZUl0ZW0oZGF0YTogYW55KTogTm9kZSB7XG4gICAgcmV0dXJuIHRoaXMuQWRkTm9kZShkYXRhLkdldCgna2V5JyksIGRhdGEpO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlKGtleU5vZGU6IHN0cmluZywgZGF0YTogYW55ID0ge30pOiBOb2RlIHtcbiAgICByZXR1cm4gdGhpcy5JbnNlcnROb2RlKG5ldyBOb2RlKHRoaXMsIGtleU5vZGUsIGRhdGEpKTtcbiAgfVxuICBwdWJsaWMgSW5zZXJ0Tm9kZShub2RlOiBOb2RlKTogTm9kZSB7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIHRoaXMuZGF0YS5SZW1vdmUoJ25vZGVzJywgbm9kZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubm9kZXM7XG4gIH1cbiAgcHVibGljIENsZWFyTm9kZSgpIHtcbiAgICB0aGlzLm5vZGVzPy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5kZWxldGUoZmFsc2UpKTtcbiAgICB0aGlzLm5vZGVzID0gW107XG4gIH1cbiAgcHVibGljIEdldERhdGFBbGxOb2RlKCk6IGFueVtdIHtcbiAgICByZXR1cm4gKHRoaXMuZGF0YT8uR2V0KCdub2RlcycpID8/IFtdKTtcbiAgfVxuICBwdWJsaWMgR2V0RGF0YU5vZGUoKTogYW55W10ge1xuICAgIHJldHVybiB0aGlzLkdldERhdGFBbGxOb2RlKCkuZmlsdGVyKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS5HZXQoXCJncm91cFwiKSA9PT0gdGhpcy5DdXJyZW50R3JvdXAoKSk7XG4gIH1cbiAgLyoqXG4gICAqIFZhcmlidXRlXG4gICovXG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIGVsVG9vbGJhcjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIHRvb2xiYXI6IERlc2dpbmVyVmlld19Ub29sYmFyO1xuICBwdWJsaWMgJGxvY2s6IGJvb2xlYW4gPSB0cnVlO1xuICBwcml2YXRlIHpvb21fbGFzdF92YWx1ZTogYW55ID0gMTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5lbE5vZGUgPSBlbE5vZGU7XG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5tYWluKTtcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoe30sIHByb3BlcnRpZXMpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICcnO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2Rlc2dpbmVyLXZpZXcnKVxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LnJlbW92ZShcImRlc2dpbmVyLWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdkZXNnaW5lci12aWV3JylcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5hZGQoXCJkZXNnaW5lci1jYW52YXNcIik7XG4gICAgdGhpcy5lbFRvb2xiYXIuY2xhc3NMaXN0LmFkZChcImRlc2dpbmVyLXRvb2xiYXJcIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbFRvb2xiYXIpO1xuICAgIHRoaXMuZWxOb2RlLnRhYkluZGV4ID0gMDtcbiAgICBuZXcgRGVzZ2luZXJWaWV3X0V2ZW50KHRoaXMpO1xuICAgIHRoaXMudG9vbGJhciA9IG5ldyBEZXNnaW5lclZpZXdfVG9vbGJhcih0aGlzKTtcbiAgICB0aGlzLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLlJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgIHRoaXMub24oRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgKGRhdGE6IGFueSkgPT4geyBtYWluLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIGRhdGEpOyB9KTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCAoaXRlbTogYW55KSA9PiB7XG4gICAgICB0aGlzLk9wZW4oaXRlbS5kYXRhKTtcbiAgICB9KVxuICB9XG5cbiAgcHVibGljIHVwZGF0ZVZpZXcoeDogYW55LCB5OiBhbnksIHpvb206IGFueSkge1xuICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3h9cHgsICR7eX1weCkgc2NhbGUoJHt6b29tfSlgO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICB0aGlzLnVwZGF0ZVZpZXcodGhpcy5nZXRYKCksIHRoaXMuZ2V0WSgpLCB0aGlzLmdldFpvb20oKSk7XG4gIH1cbiAgcHVibGljIFJlbmRlclVJKGRldGFpbDogYW55ID0ge30pIHtcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgTm9kZSkgcmV0dXJuO1xuICAgIGlmIChkZXRhaWwuc2VuZGVyICYmIGRldGFpbC5zZW5kZXIgaW5zdGFuY2VvZiBEZXNnaW5lclZpZXcpIHtcbiAgICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5DbGVhck5vZGUoKTtcbiAgICB0aGlzLkdldERhdGFOb2RlKCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICB0aGlzLkFkZE5vZGVJdGVtKGl0ZW0pO1xuICAgIH0pO1xuICAgIHRoaXMuR2V0QWxsTm9kZSgpLmZvckVhY2goKGl0ZW06IE5vZGUpID0+IHtcbiAgICAgIGl0ZW0uUmVuZGVyTGluZSgpO1xuICAgIH0pXG4gICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgIHRoaXMudG9vbGJhci5yZW5kZXJQYXRoR3JvdXAoKTtcbiAgfVxuICBwdWJsaWMgT3BlbigkZGF0YTogRGF0YUZsb3cpIHtcbiAgICBpZiAoJGRhdGEgPT0gdGhpcy5kYXRhKSB7XG4gICAgICB0aGlzLnRvb2xiYXIucmVuZGVyUGF0aEdyb3VwKCk7XG4gICAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZGF0YT8uZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIChkZXRhaWw6IGFueSkgPT4gdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwgZGV0YWlsKSk7XG4gICAgdGhpcy5kYXRhID0gJGRhdGE7XG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoZGV0YWlsOiBhbnkpID0+IHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIGRldGFpbCkpO1xuICAgIHRoaXMuJGxvY2sgPSBmYWxzZTtcbiAgICB0aGlzLmxhc3RHcm91cE5hbWUgPSAnJztcbiAgICB0aGlzLmdyb3VwRGF0YSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmdyb3VwID0gW107XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBDYWxjWChudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRXaWR0aCAvICh0aGlzLmVsTm9kZT8uY2xpZW50V2lkdGggKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHB1YmxpYyBDYWxjWShudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRIZWlnaHQgLyAodGhpcy5lbE5vZGU/LmNsaWVudEhlaWdodCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHVibGljIEdldEFsbE5vZGUoKTogTm9kZVtdIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlcyB8fCBbXTtcbiAgfVxuICBwdWJsaWMgR2V0Tm9kZUJ5SWQoaWQ6IHN0cmluZyk6IE5vZGUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLkdldEFsbE5vZGUoKS5maWx0ZXIobm9kZSA9PiBub2RlLkdldElkKCkgPT0gaWQpPy5bMF07XG4gIH1cblxuICBwdWJsaWMgR2V0RGF0YUJ5SWQoaWQ6IHN0cmluZyk6IERhdGFGbG93IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuR2V0RGF0YUFsbE5vZGUoKS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uR2V0KCdpZCcpID09PSBpZCk/LlswXTtcbiAgfVxuICBjaGVja09ubHlOb2RlKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuICh0aGlzLm1haW4uZ2V0Q29udHJvbEJ5S2V5KGtleSkub25seU5vZGUpICYmIHRoaXMubm9kZXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5DaGVja0tleShrZXkpKS5sZW5ndGggPiAwO1xuICB9XG4gIHB1YmxpYyB6b29tX3JlZnJlc2goZmxnOiBhbnkgPSAwKSB7XG4gICAgbGV0IHRlbXBfem9vbSA9IGZsZyA9PSAwID8gWm9vbS5kZWZhdWx0IDogKHRoaXMuZ2V0Wm9vbSgpICsgWm9vbS52YWx1ZSAqIGZsZyk7XG4gICAgaWYgKFpvb20ubWF4ID49IHRlbXBfem9vbSAmJiB0ZW1wX3pvb20gPj0gWm9vbS5taW4pIHtcbiAgICAgIHRoaXMuc2V0WCgodGhpcy5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0ZW1wX3pvb20pO1xuICAgICAgdGhpcy5zZXRZKCh0aGlzLmdldFkoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XG4gICAgICB0aGlzLnpvb21fbGFzdF92YWx1ZSA9IHRlbXBfem9vbTtcbiAgICAgIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb21fbGFzdF92YWx1ZSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX2luKCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKDEpO1xuICB9XG4gIHB1YmxpYyB6b29tX291dCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgtMSk7XG4gIH1cbiAgcHVibGljIHpvb21fcmVzZXQoKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEV2ZW50RW51bSwgSU1haW4sIFZhcmlhYmxlTm9kZSwgU2NvcGVSb290IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIFZhcmlhYmxlVmlldyB7XG4gIHByaXZhdGUgdmFyaWFibGVzOiBWYXJpYWJsZU5vZGVbXSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy12YXJpYWJsZScpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXIoKSB7XG4gICAgdGhpcy52YXJpYWJsZXMgPSB0aGlzLm1haW4uZ2V0VmFyaWFibGUoKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgICA8dGFibGUgYm9yZGVyPVwiMVwiPlxuICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgPHRyPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtbmFtZVwiPk5hbWU8L3RkPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtdHlwZVwiPlR5cGU8L3RkPlxuICAgICAgICAgICAgPHRkIGNsYXNzPVwidmFyaWFibGUtc2NvcGVcIj5TY29wZTwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1kZWZhdWx0XCI+RGVmYXVsdDwvdGQ+XG4gICAgICAgICAgICA8dGQgY2xhc3M9XCJ2YXJpYWJsZS1idXR0b25cIj48L3RkPlxuICAgICAgICAgIDwvdHI+XG4gICAgICAgIDwvdGhlYWQ+XG4gICAgICAgIDx0Ym9keT5cbiAgICAgICAgPC90Ym9keT5cbiAgICAgIDwvdGFibGU+XG4gICAgYDtcbiAgICBpZiAodGhpcy52YXJpYWJsZXMpIHtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2YgdGhpcy52YXJpYWJsZXMpIHtcbiAgICAgICAgbmV3IFZhcmlhYmxlSXRlbShpdGVtLCB0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmNsYXNzIFZhcmlhYmxlSXRlbSB7XG4gIHByaXZhdGUgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG4gIHByaXZhdGUgbmFtZUlucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHByaXZhdGUgdHlwZUlucHV0OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuICBwcml2YXRlIHNjb3BlSW5wdXQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gIHByaXZhdGUgdmFsdWVEZWZhdWx0SW5wdXQ6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgdmFyaWFibGU6IFZhcmlhYmxlTm9kZSwgcGFyZW50OiBWYXJpYWJsZVZpZXcpIHtcbiAgICAodGhpcy5uYW1lSW5wdXQgYXMgYW55KS52YWx1ZSA9IHRoaXMudmFyaWFibGUubmFtZTtcbiAgICAodGhpcy52YWx1ZURlZmF1bHRJbnB1dCBhcyBhbnkpLnZhbHVlID0gdGhpcy52YXJpYWJsZS5pbml0YWxWYWx1ZSA/PyAnJztcbiAgICBmb3IgKGxldCBpdGVtIG9mIFsndGV4dCcsICdudW1iZXInLCAnZGF0ZScsICdvYmplY3QnXSkge1xuICAgICAgbGV0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgb3B0aW9uLnRleHQgPSBpdGVtO1xuICAgICAgb3B0aW9uLnZhbHVlID0gaXRlbTtcbiAgICAgIHRoaXMudHlwZUlucHV0LmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgfVxuICAgIGxldCBuYW1lQ29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICBuYW1lQ29sdW1uLmFwcGVuZENoaWxkKHRoaXMubmFtZUlucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChuYW1lQ29sdW1uKTtcblxuICAgIGxldCB0eXBlQ29sdW1uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKTtcbiAgICB0eXBlQ29sdW1uLmFwcGVuZENoaWxkKHRoaXMudHlwZUlucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0eXBlQ29sdW1uKTtcblxuICAgIGxldCBzY29wZUNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgc2NvcGVDb2x1bW4uYXBwZW5kQ2hpbGQodGhpcy5zY29wZUlucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChzY29wZUNvbHVtbik7XG5cblxuICAgIGxldCB2YWx1ZURlZmF1bHRDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIHZhbHVlRGVmYXVsdENvbHVtbi5hcHBlbmRDaGlsZCh0aGlzLnZhbHVlRGVmYXVsdElucHV0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh2YWx1ZURlZmF1bHRDb2x1bW4pO1xuXG4gICAgbGV0IGJ1dHRvblJlbW92ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ1dHRvblJlbW92ZS5pbm5lckhUTUwgPSBgLWA7XG4gICAgYnV0dG9uUmVtb3ZlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgcGFyZW50Lm1haW4ucmVtb3ZlVmFyaWFibGUodmFyaWFibGUpO1xuICAgIH0pO1xuICAgIGxldCBidXR0b25SZW1vdmVDb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZCcpO1xuICAgIGJ1dHRvblJlbW92ZUNvbHVtbi5hcHBlbmRDaGlsZChidXR0b25SZW1vdmUpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGJ1dHRvblJlbW92ZUNvbHVtbik7XG5cbiAgICBwYXJlbnQuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJ3RhYmxlIHRib2R5Jyk/LmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICBwYXJlbnQubWFpbi5vbihFdmVudEVudW0uZ3JvdXBDaGFuZ2UsICh7IGdyb3VwIH06IGFueSkgPT4ge1xuICAgICAgdGhpcy5SZW5kZXJTY29wZShncm91cCk7XG4gICAgfSlcbiAgICB0aGlzLlJlbmRlclNjb3BlKCk7XG4gIH1cbiAgUmVuZGVyU2NvcGUoZ3JvdXA6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLnNjb3BlSW5wdXQuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGdyb3VwKSB7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIGdyb3VwKSB7XG4gICAgICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgICAgb3B0aW9uLnRleHQgPSBpdGVtLnRleHQ7XG4gICAgICAgIG9wdGlvbi52YWx1ZSA9IGl0ZW0uaWQ7XG4gICAgICAgIHRoaXMuc2NvcGVJbnB1dC5wcmVwZW5kKG9wdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICBvcHRpb24udGV4dCA9IFNjb3BlUm9vdDtcbiAgICBvcHRpb24udmFsdWUgPSBTY29wZVJvb3Q7XG4gICAgdGhpcy5zY29wZUlucHV0LnByZXBlbmQob3B0aW9uKTtcbiAgICAodGhpcy5zY29wZUlucHV0IGFzIGFueSkudmFsdWUgPSB0aGlzLnZhcmlhYmxlLnNjb3BlO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiwgZ2V0VGltZSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBWYXJpYWJsZVZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvaW5kZXhcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFZhcmlhYmxlRG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtdmFyaWFibGUnKTtcbiAgICB0aGlzLkJveEluZm8oJ1ZhcmlhYmxlJywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBuZXcgVmFyaWFibGVWaWV3KG5vZGUsIG1haW4pO1xuICAgIH0pO1xuICAgIGxldCAkbm9kZVJpZ2h0OiBIVE1MRWxlbWVudCB8IG51bGwgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19oZWFkZXIgLnZzLWJveGluZm9fYnV0dG9uJyk7XG4gICAgaWYgKCRub2RlUmlnaHQpIHtcbiAgICAgICRub2RlUmlnaHQuaW5uZXJIVE1MID0gYGA7XG4gICAgICBsZXQgYnV0dG9uTmV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAkbm9kZVJpZ2h0Py5hcHBlbmRDaGlsZChidXR0b25OZXcpO1xuICAgICAgYnV0dG9uTmV3LmlubmVySFRNTCA9IGBOZXcgVmFyaWFibGVgO1xuICAgICAgYnV0dG9uTmV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1haW4ubmV3VmFyaWFibGUoKS5uYW1lID0gYHZhciR7Z2V0VGltZSgpfWA7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IEV2ZW50RW51bSwgSU1haW4sIERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcblxuZXhwb3J0IGNsYXNzIFByb2plY3RWaWV3IHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy12YXJpYWJsZScpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uY2hhbmdlVmFyaWFibGUsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIHRoaXMuUmVuZGVyLmJpbmQodGhpcykpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXIoKSB7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgbGV0IHByb2plY3RzID0gdGhpcy5tYWluLmdldFByb2plY3RBbGwoKTtcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0LWlkJywgaXRlbS5HZXQoJ2lkJykpO1xuICAgICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgfSk7XG4gICAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV9uYW1lYCwgKCkgPT4ge1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLm1haW4uY2hlY2tQcm9qZWN0T3BlbihpdGVtKSkge1xuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1haW4uc2V0UHJvamVjdE9wZW4oaXRlbSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlPy5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBFdmVudEVudW0sIElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IGRvd25sb2FkT2JqZWN0QXNKc29uLCBnZXRUaW1lLCByZWFkRmlsZUxvY2FsIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmltcG9ydCB7IFByb2plY3RWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL1Byb2plY3RWaWV3XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9qZWN0RG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvamVjdCcpO1xuICAgIHRoaXMuQm94SW5mbygnUHJvamVjdCcsIChlbENvbnRlbnQ6IGFueSkgPT4ge1xuICAgICAgbmV3IFByb2plY3RWaWV3KGVsQ29udGVudCwgbWFpbik7XG4gICAgfSk7XG4gICAgbGV0ICRub2RlUmlnaHQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2hlYWRlciAudnMtYm94aW5mb19idXR0b24nKTtcbiAgICBpZiAoJG5vZGVSaWdodCkge1xuICAgICAgJG5vZGVSaWdodC5pbm5lckhUTUwgPSBgYDtcbiAgICAgIGxldCBidXR0b25OZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ1dHRvbk5ldy5pbm5lckhUTUwgPSBgTmV3YDtcbiAgICAgIGJ1dHRvbk5ldy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMubWFpbi5uZXdQcm9qZWN0KCcnKSk7XG4gICAgICAkbm9kZVJpZ2h0Py5hcHBlbmRDaGlsZChidXR0b25OZXcpO1xuXG4gICAgICBsZXQgYnV0dG9uRXhwb3J0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidXR0b25FeHBvcnQuaW5uZXJIVE1MID0gYEV4cG9ydGA7XG4gICAgICBidXR0b25FeHBvcnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBkb3dubG9hZE9iamVjdEFzSnNvbih0aGlzLm1haW4uZXhwb3J0SnNvbigpLCBgdnMtc29sdXRpb24tJHtnZXRUaW1lKCl9YCkpO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uRXhwb3J0KTtcblxuICAgICAgbGV0IGJ1dHRvbkltcG9ydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnV0dG9uSW1wb3J0LmlubmVySFRNTCA9IGBJbXBvcnRgO1xuICAgICAgYnV0dG9uSW1wb3J0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICByZWFkRmlsZUxvY2FsKChyczogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKHJzKSB7XG4gICAgICAgICAgICB0aGlzLm1haW4uaW1wb3J0SnNvbihKU09OLnBhcnNlKHJzKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uSW1wb3J0KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFWaWV3LCBEYXRhRmxvdywgRXZlbnRFbnVtLCBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XHJcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XHJcbiAgcHJpdmF0ZSBsYXN0RGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XHJcbiAgcHJpdmF0ZSBoaWRlS2V5czogc3RyaW5nW10gPSBbJ2xpbmVzJywgJ25vZGVzJywgJ2dyb3VwcycsICd2YXJpYWJsZScsICd4JywgJ3knLCAnem9vbSddO1xyXG4gIHByaXZhdGUgc29ydEtleXM6IHN0cmluZ1tdID0gWydpZCcsICdrZXknLCAnbmFtZScsICdncm91cCddO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcclxuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XHJcblxyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvcGVydHknKTtcclxuICAgIHRoaXMuQm94SW5mbygnUHJvcGVydHknLCAobm9kZTogSFRNTEVsZW1lbnQpID0+IHtcclxuICAgICAgbWFpbi5vbihFdmVudEVudW0uc2hvd1Byb3BlcnR5LCAoZGV0YWlsOiBhbnkpID0+IHtcclxuICAgICAgICB0aGlzLnJlbmRlclVJKG5vZGUsIGRldGFpbC5kYXRhKTtcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZW5kZXJVSShub2RlOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YUZsb3cpIHtcclxuICAgIGlmICh0aGlzLmxhc3REYXRhID09IGRhdGEpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XHJcbiAgICBub2RlLmlubmVySFRNTCA9ICcnO1xyXG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IGRhdGEuZ2V0UHJvcGVydGllcygpO1xyXG4gICAgdGhpcy5zb3J0S2V5cy5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAodGhpcy5oaWRlS2V5cy5pbmNsdWRlcyhrZXkpIHx8ICFwcm9wZXJ0aWVzW2tleV0pIHJldHVybjtcclxuICAgICAgbGV0IHByb3BlcnR5SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xyXG4gICAgICBsZXQgcHJvcGVydHlMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWxhYmVsJyk7XHJcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0ga2V5O1xyXG4gICAgICBsZXQgcHJvcGVydHlWYWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eVZhbHVlLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LXZhbHVlJyk7XHJcbiAgICAgIERhdGFWaWV3LkJpbmRFbGVtZW50KHByb3BlcnR5VmFsdWUsIGRhdGEsIHRoaXMubWFpbiwga2V5KTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlWYWx1ZSk7XHJcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJdGVtKTtcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKHRoaXMuaGlkZUtleXMuaW5jbHVkZXMoa2V5KSB8fCB0aGlzLnNvcnRLZXlzLmluY2x1ZGVzKGtleSkpIHJldHVybjtcclxuICAgICAgbGV0IHByb3BlcnR5SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xyXG4gICAgICBsZXQgcHJvcGVydHlMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eUxhYmVsLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWxhYmVsJyk7XHJcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0ga2V5O1xyXG4gICAgICBsZXQgcHJvcGVydHlWYWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBwcm9wZXJ0eVZhbHVlLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LXZhbHVlJyk7XHJcbiAgICAgIERhdGFWaWV3LkJpbmRFbGVtZW50KHByb3BlcnR5VmFsdWUsIGRhdGEsIHRoaXMubWFpbiwga2V5KTtcclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlWYWx1ZSk7XHJcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJdGVtKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBFdmVudEVudW0sIElNYWluIH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVmlld0RvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHByaXZhdGUgdmlldzogRGVzZ2luZXJWaWV3IHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcblxuICAgIHRoaXMudmlldyA9IG5ldyBEZXNnaW5lclZpZXcodGhpcy5lbE5vZGUsIG1haW4pO1xuXG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluLCBEb2NrRW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XHJcbmltcG9ydCB7IENvbnRyb2xEb2NrIH0gZnJvbSBcIi4vQ29udHJvbERvY2tcIjtcclxuaW1wb3J0IHsgVmFyaWFibGVEb2NrIH0gZnJvbSBcIi4vVmFyaWFibGVEb2NrXCI7XHJcbmltcG9ydCB7IFByb2plY3REb2NrIH0gZnJvbSBcIi4vUHJvamVjdERvY2tcIjtcclxuaW1wb3J0IHsgUHJvcGVydHlEb2NrIH0gZnJvbSBcIi4vUHJvcGVydHlEb2NrXCI7XHJcbmltcG9ydCB7IFZpZXdEb2NrIH0gZnJvbSBcIi4vVmlld0RvY2tcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEb2NrTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikgeyB9XHJcbiAgcHVibGljIHJlc2V0KCkge1xyXG4gICAgdGhpcy4kZG9ja01hbmFnZXIgPSB7fTtcclxuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5sZWZ0LCBDb250cm9sRG9jayk7XHJcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgUHJvamVjdERvY2spO1xyXG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnJpZ2h0LCBQcm9wZXJ0eURvY2spO1xyXG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnZpZXcsIFZpZXdEb2NrKTtcclxuICAgIC8vICB0aGlzLmFkZERvY2soRG9ja0VudW0udG9wLCBUYWJEb2NrKTtcclxuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5ib3R0b20sIFZhcmlhYmxlRG9jayk7XHJcbiAgICB0aGlzLlJlbmRlclVJKCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBhZGREb2NrKCRrZXk6IHN0cmluZywgJHZpZXc6IGFueSkge1xyXG4gICAgaWYgKCF0aGlzLiRkb2NrTWFuYWdlclska2V5XSlcclxuICAgICAgdGhpcy4kZG9ja01hbmFnZXJbJGtleV0gPSBbXTtcclxuICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gWy4uLnRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldLCAkdmlld107XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgUmVuZGVyVUkoKSB7XHJcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBgXHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1sZWZ0IHZzLWRvY2tcIj48L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cInZzLWNvbnRlbnRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwidnMtdG9wIHZzLWRvY2tcIj48L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwidnMtdmlldyB2cy1kb2NrXCI+PC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLWJvdHRvbSB2cy1kb2NrXCI+PC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzPVwidnMtcmlnaHQgdnMtZG9ja1wiPjwvZGl2PlxyXG4gICAgYDtcclxuICAgIE9iamVjdC5rZXlzKHRoaXMuJGRvY2tNYW5hZ2VyKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICBsZXQgcXVlcnlTZWxlY3RvciA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoYC4ke2tleX1gKTtcclxuICAgICAgaWYgKHF1ZXJ5U2VsZWN0b3IpIHtcclxuICAgICAgICB0aGlzLiRkb2NrTWFuYWdlcltrZXldLmZvckVhY2goKCRpdGVtOiBhbnkpID0+IHtcclxuICAgICAgICAgIG5ldyAkaXRlbShxdWVyeVNlbGVjdG9yLCB0aGlzLm1haW4pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iLCJleHBvcnQgY29uc3QgQ29udHJvbCA9IHtcbiAgbm9kZV9iZWdpbjoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1wbGF5XCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnQmVnaW4nLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBjbGFzczogJ25vZGUtdGVzdCcsXG4gICAgaHRtbDogJycsXG4gICAgZG90OiB7XG4gICAgICB0b3A6IDAsXG4gICAgICByaWdodDogMCxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICBib3R0b206IDEsXG4gICAgfSxcbiAgICBvbmx5Tm9kZTogdHJ1ZVxuICB9LFxuICBub2RlX2VuZDoge1xuICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1zdG9wXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnRW5kJyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogJycsXG4gICAgZG90OiB7XG4gICAgICBsZWZ0OiAwLFxuICAgICAgdG9wOiAxLFxuICAgICAgcmlnaHQ6IDAsXG4gICAgICBib3R0b206IDAsXG4gICAgfSxcbiAgICBvbmx5Tm9kZTogdHJ1ZVxuICB9LFxuICBub2RlX2lmOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLWVxdWFsc1wiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ0lmJyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogJzxkaXY+Y29uZGl0aW9uOjxici8+PGlucHV0IGNsYXNzPVwibm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwiY29uZGl0aW9uXCIvPjwvZGl2PicsXG4gICAgc2NyaXB0OiBgYCxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBjb25kaXRpb246IHtcbiAgICAgICAga2V5OiBcImNvbmRpdGlvblwiLFxuICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfVxuICAgIH0sXG4gICAgb3V0cHV0OiAyXG4gIH0sXG4gIG5vZGVfZ3JvdXA6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnR3JvdXAnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+PGJ1dHRvbiBjbGFzcz1cImJ0bkdvR3JvdXAgbm9kZS1mb3JtLWNvbnRyb2xcIj5HbzwvYnV0dG9uPjwvZGl2PicsXG4gICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7IG5vZGUub3Blbkdyb3VwKCkgfSk7XG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICBvdXRwdXQ6IDJcbiAgfSxcbiAgbm9kZV9vcHRpb246IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnT3B0aW9uJyxcbiAgICBkb3Q6IHtcbiAgICAgIHRvcDogMSxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgbGVmdDogMSxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiBgXG4gICAgPGRpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMVwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDJcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAzXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwNFwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDVcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGAsXG4gICAgc2NyaXB0OiAoeyBlbE5vZGUsIG1haW4sIG5vZGUgfTogYW55KSA9PiB7XG4gICAgICBlbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7IG5vZGUub3Blbkdyb3VwKCkgfSk7XG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICBvdXRwdXQ6IDJcbiAgfSxcbiAgbm9kZV9wcm9qZWN0OiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ1Byb2plY3QnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnPGRpdiBjbGFzcz1cInRleHQtY2VudGVyIHAzXCI+PHNlbGVjdCBjbGFzcz1cIm5vZGUtZm9ybS1jb250cm9sXCIgbm9kZTptb2RlbD1cInByb2plY3RcIj48L3NlbGVjdD48L2Rpdj4nLFxuICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuXG4gICAgfSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBwcm9qZWN0OiB7XG4gICAgICAgIGtleTogXCJwcm9qZWN0XCIsXG4gICAgICAgIGVkaXQ6IHRydWUsXG4gICAgICAgIHNlbGVjdDogdHJ1ZSxcbiAgICAgICAgZGF0YVNlbGVjdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuICAgICAgICAgIHJldHVybiBtYWluLmdldFByb2plY3RBbGwoKS5tYXAoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdmFsdWU6IGl0ZW0uR2V0KCdpZCcpLFxuICAgICAgICAgICAgICB0ZXh0OiBpdGVtLkdldCgnbmFtZScpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIHNjcmlwdDogKHsgZWxOb2RlLCBtYWluLCBub2RlIH06IGFueSkgPT4ge1xuXG4gICAgICAgIH0sXG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9XG4gICAgfSxcbiAgfSxcbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBJTWFpbiwgY29tcGFyZVNvcnQsIEV2ZW50RW51bSwgUHJvcGVydHlFbnVtLCBFdmVudEZsb3csIGdldFRpbWUsIFZhcmlhYmxlTm9kZSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4uL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgeyBDb250cm9sIH0gZnJvbSBcIi4vY29udHJvbFwiO1xuXG5leHBvcnQgY2xhc3MgU3lzdGVtQmFzZSBpbXBsZW1lbnRzIElNYWluIHtcbiAgcHJpdmF0ZSAkZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gIHByaXZhdGUgJHByb2plY3RPcGVuOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSAkcHJvcGVydGllczogYW55ID0ge307XG4gIHByaXZhdGUgJGNvbnRyb2w6IGFueSA9IHt9O1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93ID0gbmV3IEV2ZW50RmxvdygpO1xuICBwcml2YXRlICRjb250cm9sQ2hvb3NlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSAkY2hlY2tPcHRpb246IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5zb2x1dGlvbl0gPSB7XG4gICAgICBpZDoge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgIH0sXG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gUHJvcGVydHlFbnVtLnNvbHV0aW9uXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBgc29sdXRpb24tJHtnZXRUaW1lKCl9YCxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0czoge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0ubGluZV0gPSB7XG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLmxpbmVcbiAgICAgIH0sXG4gICAgICBmcm9tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICBmcm9tSW5kZXg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHRvOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB0b0luZGV4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5tYWluXSA9IHtcbiAgICAgIGlkOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgfSxcbiAgICAgIG5hbWU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gYEZsb3ctJHtnZXRUaW1lKCl9YCxcbiAgICAgICAgZWRpdDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLm1haW5cbiAgICAgIH0sXG4gICAgICB2YXJpYWJsZToge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfSxcbiAgICAgIGdyb3Vwczoge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfSxcbiAgICAgIG5vZGVzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5ncm91cENhdmFzXSA9IHtcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0uZ3JvdXBDYXZhc1xuICAgICAgfSxcbiAgICAgIGdyb3VwOiB7XG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9LFxuICAgICAgeDoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgeToge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgem9vbToge1xuICAgICAgICBkZWZhdWx0OiAxXG4gICAgICB9LFxuICAgIH1cbiAgfVxuICBuZXdTb2x1dGlvbigkbmFtZTogc3RyaW5nID0gJycpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Tb2x1dGlvbih7IG5hbWU6ICRuYW1lIH0pO1xuICB9XG4gIG9wZW5Tb2x1dGlvbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy4kZGF0YS5Jbml0RGF0YSgkZGF0YSwgdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5zb2x1dGlvbikpO1xuICAgIHRoaXMub3BlblByb2plY3QodGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJyk/LlswXSA/PyB7fSk7XG4gIH1cbiAgcmVtb3ZlVmFyaWFibGUodmFyaWJhbGU6IFZhcmlhYmxlTm9kZSk6IHZvaWQge1xuICAgIHRoaXMuJHByb2plY3RPcGVuPy5SZW1vdmUoJ3ZhcmlhYmxlJywgdmFyaWJhbGUpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZVZhcmlhYmxlLCB7IGRhdGE6IHZhcmliYWxlIH0pO1xuICB9XG4gIGFkZFZhcmlhYmxlKCk6IFZhcmlhYmxlTm9kZSB7XG4gICAgbGV0IHZhcmliYWxlID0gbmV3IFZhcmlhYmxlTm9kZSgpO1xuICAgIHRoaXMuJHByb2plY3RPcGVuPy5BcHBlbmQoJ3ZhcmlhYmxlJywgdmFyaWJhbGUpO1xuICAgIHJldHVybiB2YXJpYmFsZTtcbiAgfVxuICBuZXdWYXJpYWJsZSgpOiBWYXJpYWJsZU5vZGUge1xuICAgIGxldCB2YXJpYmFsZSA9IHRoaXMuYWRkVmFyaWFibGUoKTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2VWYXJpYWJsZSwgeyBkYXRhOiB2YXJpYmFsZSB9KTtcbiAgICByZXR1cm4gdmFyaWJhbGU7XG4gIH1cbiAgZ2V0VmFyaWFibGUoKTogVmFyaWFibGVOb2RlW10ge1xuICAgIGxldCBhcnI6IGFueSA9IFtdO1xuICAgIGlmICh0aGlzLiRwcm9qZWN0T3Blbikge1xuICAgICAgYXJyID0gdGhpcy4kcHJvamVjdE9wZW4uR2V0KFwidmFyaWFibGVcIik7XG4gICAgICBpZiAoIWFycikge1xuICAgICAgICBhcnIgPSBbXTtcbiAgICAgICAgdGhpcy4kcHJvamVjdE9wZW4uU2V0KCd2YXJpYWJsZScsIGFycik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnI7XG4gIH1cbiAgZXhwb3J0SnNvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS50b0pzb24oKTtcbiAgfVxuICBwdWJsaWMgY2hlY2tJbml0T3B0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLiRjaGVja09wdGlvbjtcbiAgfVxuICBpbml0T3B0aW9uKG9wdGlvbjogYW55LCBpc0RlZmF1bHQ6IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgdGhpcy4kY2hlY2tPcHRpb24gPSB0cnVlO1xuICAgIC8vIHNldCBjb250cm9sXG4gICAgdGhpcy4kY29udHJvbCA9IGlzRGVmYXVsdCA/IHsgLi4ub3B0aW9uPy5jb250cm9sIHx8IHt9LCAuLi5Db250cm9sIH0gOiB7IC4uLm9wdGlvbj8uY29udHJvbCB8fCB7fSB9O1xuICAgIGxldCBjb250cm9sVGVtcDogYW55ID0ge307XG4gICAgT2JqZWN0LmtleXModGhpcy4kY29udHJvbCkubWFwKChrZXkpID0+ICh7IC4uLnRoaXMuJGNvbnRyb2xba2V5XSwga2V5LCBzb3J0OiAodGhpcy4kY29udHJvbFtrZXldLnNvcnQgPT09IHVuZGVmaW5lZCA/IDk5OTk5IDogdGhpcy4kY29udHJvbFtrZXldLnNvcnQpIH0pKS5zb3J0KGNvbXBhcmVTb3J0KS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGNvbnRyb2xUZW1wW2l0ZW0ua2V5XSA9IHtcbiAgICAgICAgZG90OiB7XG4gICAgICAgICAgbGVmdDogMSxcbiAgICAgICAgICB0b3A6IDEsXG4gICAgICAgICAgcmlnaHQ6IDEsXG4gICAgICAgICAgYm90dG9tOiAxLFxuICAgICAgICB9LFxuICAgICAgICAuLi5pdGVtXG4gICAgICB9O1xuICAgICAgdGhpcy4kcHJvcGVydGllc1tgJHtpdGVtLmtleX1gXSA9IHtcbiAgICAgICAgLi4uKGl0ZW0ucHJvcGVydGllcyB8fCB7fSksXG4gICAgICAgIGlkOiB7XG4gICAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICAgIH0sXG4gICAgICAgIGtleToge1xuICAgICAgICAgIGRlZmF1bHQ6IGl0ZW0ua2V5XG4gICAgICAgIH0sXG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICBkZWZhdWx0OiBpdGVtLmtleSxcbiAgICAgICAgICBlZGl0OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB4OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgICBncm91cDoge1xuICAgICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICAgIH0sXG4gICAgICAgIGxpbmVzOiB7XG4gICAgICAgICAgZGVmYXVsdDogW11cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHRoaXMuJGNvbnRyb2wgPSBjb250cm9sVGVtcDtcbiAgfVxuICByZW5kZXJIdG1sKG5vZGU6IE5vZGUsIGVsUGFyZW50OiBFbGVtZW50KSB7XG4gICAgZWxQYXJlbnQuaW5uZXJIVE1MID0gbm9kZS5nZXRPcHRpb24oKT8uaHRtbDtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29udHJvbEFsbCgpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbCA/PyB7fTtcbiAgfVxuICBnZXRQcm9qZWN0QWxsKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJykgPz8gW107XG4gIH1cbiAgaW1wb3J0SnNvbihkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Tb2x1dGlvbihkYXRhKTtcbiAgfVxuICBzZXRQcm9qZWN0T3BlbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuJHByb2plY3RPcGVuICE9ICRkYXRhKSB7XG4gICAgICB0aGlzLiRwcm9qZWN0T3BlbiA9ICRkYXRhO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XG4gICAgICAgIGRhdGE6ICRkYXRhXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwge1xuICAgICAgICBkYXRhOiAkZGF0YVxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5vcGVuUHJvamVjdCwge1xuICAgICAgICBkYXRhOiAkZGF0YVxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGNoZWNrUHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRwcm9qZWN0T3BlbiA9PSAkZGF0YTtcbiAgfVxuICBuZXdQcm9qZWN0KCk6IHZvaWQge1xuICAgIHRoaXMub3BlblByb2plY3Qoe30pO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLm5ld1Byb2plY3QsIHt9KTtcbiAgfVxuICBvcGVuUHJvamVjdCgkZGF0YTogYW55KTogdm9pZCB7XG4gICAgbGV0ICRwcm9qZWN0OiBhbnkgPSBudWxsO1xuICAgIGlmICgkZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAkcHJvamVjdCA9IHRoaXMuZ2V0UHJvamVjdEJ5SWQoJGRhdGEuR2V0KCdpZCcpKTtcbiAgICAgIGlmICghJHByb2plY3QpIHtcbiAgICAgICAgJHByb2plY3QgPSAkZGF0YTtcbiAgICAgICAgdGhpcy4kZGF0YS5BcHBlbmQoJ3Byb2plY3RzJywgJHByb2plY3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAkcHJvamVjdCA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgICAgICRwcm9qZWN0LkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLm1haW4pKTtcbiAgICAgIHRoaXMuJGRhdGEuQXBwZW5kKCdwcm9qZWN0cycsICRwcm9qZWN0KTtcbiAgICB9XG4gICAgdGhpcy5zZXRQcm9qZWN0T3BlbigkcHJvamVjdCk7XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RCeUlkKCRpZDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEuR2V0KCdwcm9qZWN0cycpLmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KCdpZCcpID09PSAkaWQpPy5bMF07XG4gIH1cbiAgc2V0Q29udHJvbENob29zZShrZXk6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLiRjb250cm9sQ2hvb3NlID0ga2V5O1xuICB9XG4gIGdldENvbnRyb2xDaG9vc2UoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuJGNvbnRyb2xDaG9vc2U7XG4gIH1cbiAgZ2V0Q29udHJvbEJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuJGNvbnRyb2xba2V5XSB8fCB7fTtcbiAgfVxuICBnZXRDb250cm9sTm9kZUJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRoaXMuZ2V0Q29udHJvbEJ5S2V5KGtleSksXG4gICAgICBwcm9wZXJ0aWVzOiB0aGlzLmdldFByb3BlcnR5QnlLZXkoYCR7a2V5fWApXG4gICAgfVxuICB9XG4gIGdldFByb3BlcnR5QnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvcGVydGllc1trZXldO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gJy4vY29yZS9pbmRleCc7XG5pbXBvcnQgeyBEb2NrTWFuYWdlciB9IGZyb20gJy4vZG9jay9Eb2NrTWFuYWdlcic7XG5pbXBvcnQgeyBTeXN0ZW1CYXNlIH0gZnJvbSAnLi9zeXN0ZW1zL1N5c3RlbUJhc2UnO1xuZXhwb3J0IGNsYXNzIFZpc3VhbEZsb3cge1xuICBwcml2YXRlIG1haW46IElNYWluIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlICRkb2NrTWFuYWdlcjogRG9ja01hbmFnZXI7XG4gIHB1YmxpYyBnZXREb2NrTWFuYWdlcigpOiBEb2NrTWFuYWdlciB7XG4gICAgcmV0dXJuIHRoaXMuJGRvY2tNYW5hZ2VyO1xuICB9XG4gIHB1YmxpYyBzZXRPcHRpb24oZGF0YTogYW55LCBpc0RlZmF1bHQ6IGJvb2xlYW4gPSB0cnVlKSB7XG4gICAgdGhpcy5tYWluPy5pbml0T3B0aW9uKGRhdGEsIGlzRGVmYXVsdCk7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIucmVzZXQoKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBtYWluOiBJTWFpbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIHRoaXMubWFpbiA9IG1haW4gPz8gbmV3IFN5c3RlbUJhc2UoKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IG5ldyBEb2NrTWFuYWdlcih0aGlzLmNvbnRhaW5lciwgdGhpcy5tYWluKTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlci5yZXNldCgpO1xuICB9XG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5tYWluPy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5tYWluPy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/LnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgdGhpcy5tYWluPy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgcHVibGljIGdldE1haW4oKTogSU1haW4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm1haW47XG4gIH1cbiAgbmV3U29sdXRpb24oJG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5uZXdTb2x1dGlvbigkbmFtZSk7XG4gIH1cbiAgb3BlblNvbHV0aW9uKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ub3BlblNvbHV0aW9uKCRkYXRhKTtcbiAgfVxuICBuZXdQcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ubmV3UHJvamVjdCgkbmFtZSk7XG4gIH1cbiAgb3BlblByb2plY3QoJG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5vcGVuUHJvamVjdCgkbmFtZSk7XG4gIH1cbiAgZ2V0UHJvamVjdEFsbCgpOiBhbnlbXSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TWFpbigpPy5nZXRQcm9qZWN0QWxsKCk7XG4gIH1cbiAgc2V0UHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5zZXRQcm9qZWN0T3BlbigkZGF0YSk7XG4gIH1cbiAgaW1wb3J0SnNvbihkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8uaW1wb3J0SnNvbihkYXRhKTtcbiAgfVxuICBleHBvcnRKc29uKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TWFpbigpPy5leHBvcnRKc29uKCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluLCBFdmVudEVudW0sIERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvaW5kZXhcIjtcclxuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFRhYkRvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xyXG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcclxuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBgO1xyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtdGFiJyk7XHJcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCAoZGV0YWlsOiBhbnkpID0+IHtcclxuICAgICAgdGhpcy5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY3RpdmUnKS5mb3JFYWNoKChfbm9kZSkgPT4ge1xyXG4gICAgICAgIF9ub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYgKHRoaXMuZWxOb2RlICYmIGRldGFpbD8uZGF0YT8uR2V0KCdpZCcpKSB7XHJcbiAgICAgICAgdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcihgW2RhdGEtcHJvamVjdC1pZD1cIiR7ZGV0YWlsPy5kYXRhPy5HZXQoJ2lkJyl9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ubmV3UHJvamVjdCwgdGhpcy5yZW5kZXIuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG5cclxuICByZW5kZXIoKSB7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcclxuICAgIGxldCBwcm9qZWN0cyA9IHRoaXMubWFpbi5nZXRQcm9qZWN0QWxsKCk7XHJcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xyXG4gICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XHJcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcclxuICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QtaWQnLCBpdGVtLkdldCgnaWQnKSk7XHJcbiAgICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XHJcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xyXG4gICAgICB9KTtcclxuICAgICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcclxuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAodGhpcy5tYWluLmNoZWNrUHJvamVjdE9wZW4oaXRlbSkpIHtcclxuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgfVxyXG4gICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB7IGRhdGE6IGl0ZW0gfSk7XHJcbiAgICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogaXRlbSB9KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuZWxOb2RlPy5hcHBlbmRDaGlsZChub2RlSXRlbSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgVmlzdWFsRmxvdyB9IGZyb20gXCIuL1Zpc3VhbEZsb3dcIjtcbmltcG9ydCB7IFN5c3RlbUJhc2UgfSBmcm9tIFwiLi9zeXN0ZW1zL1N5c3RlbUJhc2VcIjtcbmltcG9ydCAqIGFzIENvcmUgZnJvbSAnLi9jb3JlL2luZGV4JztcbmltcG9ydCAqIGFzIERlc2dpbmVyIGZyb20gXCIuL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgKiBhcyBEb2NrIGZyb20gJy4vZG9jay9pbmRleCc7XG5leHBvcnQgZGVmYXVsdCB7XG4gIFZpc3VhbEZsb3csXG4gIFN5c3RlbUJhc2UsXG4gIC4uLkNvcmUsXG4gIC4uLkRvY2ssXG4gIC4uLkRlc2dpbmVyXG59O1xuXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBTyxNQUFNLFNBQVMsR0FBRztJQUN2QixJQUFBLElBQUksRUFBRSxNQUFNO0lBQ1osSUFBQSxVQUFVLEVBQUUsWUFBWTtJQUN4QixJQUFBLFlBQVksRUFBRSxjQUFjO0lBQzVCLElBQUEsV0FBVyxFQUFFLGFBQWE7SUFDMUIsSUFBQSxVQUFVLEVBQUUsWUFBWTtJQUN4QixJQUFBLGNBQWMsRUFBRSxnQkFBZ0I7SUFDaEMsSUFBQSxNQUFNLEVBQUUsUUFBUTtJQUNoQixJQUFBLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLElBQUEsV0FBVyxFQUFFLGFBQWE7S0FDM0IsQ0FBQTtJQUVNLE1BQU0sUUFBUSxHQUFHO0lBQ3RCLElBQUEsSUFBSSxFQUFFLFNBQVM7SUFDZixJQUFBLEdBQUcsRUFBRSxRQUFRO0lBQ2IsSUFBQSxJQUFJLEVBQUUsU0FBUztJQUNmLElBQUEsTUFBTSxFQUFFLFdBQVc7SUFDbkIsSUFBQSxLQUFLLEVBQUUsVUFBVTtLQUNsQixDQUFBO0lBRU0sTUFBTSxZQUFZLEdBQUc7SUFDMUIsSUFBQSxJQUFJLEVBQUUsY0FBYztJQUNwQixJQUFBLFFBQVEsRUFBRSxlQUFlO0lBQ3pCLElBQUEsSUFBSSxFQUFFLFdBQVc7SUFDakIsSUFBQSxRQUFRLEVBQUUsZUFBZTtJQUN6QixJQUFBLFVBQVUsRUFBRSxpQkFBaUI7S0FDOUI7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
