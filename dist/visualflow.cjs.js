
  /**
   * @license
   * author:nguyenvanhaudev@gmail.com (Nguyen Van Hau)
   * visualflow.js v0.0.2
   * Released under the MIT license.
   */

'use strict';

const EventEnum = {
    init: "init",
    dataChange: "dataChange",
    showProperty: "showProperty",
    openProject: "openProject",
    newProject: "newProject",
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
    main: "main_project",
    solution: 'main_solution',
    line: 'main_line',
    variable: 'main_variable',
    groupCavas: "main_groupCavas",
};

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
            console.log(controls);
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

class ProjectDock extends DockBase {
    main;
    constructor(container, main) {
        super(container, main);
        this.main = main;
        this.elNode.classList.add('vs-project');
        this.BoxInfo('Project', this.renderUI.bind(this));
        this.main.on(EventEnum.change, this.renderUI.bind(this));
        this.main.on(EventEnum.openProject, (detail) => {
            this.elContent?.querySelectorAll('.active').forEach((_node) => {
                _node.classList.remove('active');
            });
            if (this.elContent && detail?.data?.Get('id')) {
                this.elContent.querySelector(`[data-project-id="${detail?.data?.Get('id')}"]`)?.classList.add('active');
            }
        });
    }
    renderUI() {
        let $nodeRight = this.elNode.querySelector('.vs-boxinfo_header .vs-boxinfo_button');
        if (!this.elContent)
            return;
        this.elContent.innerHTML = ``;
        if ($nodeRight) {
            $nodeRight.innerHTML = ``;
            let buttonNew = document.createElement('button');
            $nodeRight?.appendChild(buttonNew);
            buttonNew.innerHTML = `New`;
            buttonNew.addEventListener('click', () => this.main.newProject(''));
        }
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
            this.elContent?.appendChild(nodeItem);
        });
    }
}

var EditorType;
(function (EditorType) {
    EditorType[EditorType["Label"] = 0] = "Label";
    EditorType[EditorType["Text"] = 1] = "Text";
    EditorType[EditorType["Inline"] = 2] = "Inline";
})(EditorType || (EditorType = {}));
const TagView = ['SPAN', 'DIV', 'P', 'TEXTAREA'];
class DataView {
    data;
    el;
    keyName = "";
    constructor(data, el = null) {
        this.data = data;
        this.el = el;
        this.keyName = el?.getAttribute('node:model');
        this.bindData();
    }
    bindData() {
        if (this.keyName && this.el) {
            this.data.on(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
            this.el.addEventListener('change', this.bindEvent.bind(this));
            this.el.addEventListener('keydown', this.bindEvent.bind(this));
        }
    }
    unBindData() {
        if (this.keyName && this.el) {
            this.data.removeListener(`${EventEnum.dataChange}_${this.keyName}`, this.bindInput.bind(this));
            this.el.removeEventListener('change', this.bindEvent.bind(this));
            this.el.removeEventListener('keydown', this.bindEvent.bind(this));
        }
    }
    bindInput({ value, sender }) {
        if (sender !== this && this.el && sender.el !== this.el) {
            console.log(this.el.tagName);
            console.log(sender);
            if (TagView.includes(this.el.tagName)) {
                this.el.innerText = `${value}`;
            }
            else {
                this.el.value = value;
            }
        }
    }
    bindEvent() {
        if (this.keyName && this.el) {
            console.log(this.keyName);
            this.data.Set(this.keyName, this.el.value, this);
        }
    }
    static BindView(data, root) {
        if (root) {
            return Array.from(root.querySelectorAll('[node\\:model]')).map((el) => {
                return new DataView(data, el);
            });
        }
        return [];
    }
}
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
    labelKeys = ['id', 'key', 'group', 'lines', 'nodes', 'project', 'x', 'y'];
    hideKeys = ['lines', 'nodes', 'groups'];
    sortKeys = ['id', 'key', 'name', 'group'];
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
        // node.appendChild(this.dataJson);
        // this.dataJson.value = data.toString();
        // this.dataJson.classList.add('node-form-control');
        //data.on(EventEnum.dataChange, () => this.dataJson.value = data.toString())
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

var Core = /*#__PURE__*/Object.freeze({
    __proto__: null,
    FlowCore: FlowCore,
    BaseFlow: BaseFlow,
    DockEnum: DockEnum,
    EventEnum: EventEnum,
    PropertyEnum: PropertyEnum,
    DataFlow: DataFlow,
    Editor: Editor,
    get EditorType () { return EditorType; },
    DataView: DataView,
    EventFlow: EventFlow,
    compareSort: compareSort,
    getUuid: getUuid,
    getTime: getTime,
    LOG: LOG,
    getDate: getDate
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
        this.elPathGroup.appendChild(text);
        this.btnBack.removeAttribute('style');
        for (let index = len; index >= 0; index--) {
            let text = document.createElement('span');
            text.innerHTML = `>>${groups[index]}`;
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

const geval = eval;
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
    renderUI() {
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
        geval(`(node,view)=>{${this.option.script}}`)(this, this.parent);
        this.arrDataView.forEach((item) => item.unBindData());
        if (this.elContent)
            this.arrDataView = DataView.BindView(this.data, this.elContent);
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
        return this.group.map((item) => this.GetDataById(item)?.Get('name'));
    }
    BackGroup() {
        this.group.splice(0, 1);
        this.toolbar.renderPathGroup();
        this.RenderUI();
    }
    CurrentGroup() {
        let name = this.group?.[0];
        if (name && name != '') {
            return name;
        }
        return 'root';
    }
    openGroup(id) {
        this.group = [id, ...this.group];
        this.toolbar.renderPathGroup();
        this.RenderUI();
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
            this.dispatch(EventEnum.showProperty, { data: this.data });
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
        return (this.data.Get('nodes') ?? []);
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
        this.RenderUI();
        this.on(EventEnum.dataChange, this.RenderUI.bind(this));
        new DesginerView_Event(this);
        this.toolbar = new DesginerView_Toolbar(this);
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
    }
    Open($data) {
        this.data = $data;
        this.$lock = false;
        this.lastGroupName = '';
        this.groupData = undefined;
        this.group = [];
        this.toolbar.renderPathGroup();
        this.BindDataEvent();
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

class ViewDock extends DockBase {
    main;
    view;
    constructor(container, main) {
        super(container, main);
        this.main = main;
        this.view = new DesginerView(this.elNode, main);
        this.view.on(EventEnum.showProperty, (data) => { main.dispatch(EventEnum.showProperty, data); });
        this.main.on(EventEnum.openProject, (item) => {
            this.view?.Open(item.data);
            this.main.setProjectOpen(item.data);
        });
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
        html: '<div>condition:<br/><input node:model="condition"/></div>',
        script: ``,
        properties: {
            condition: {
                key: "condition",
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
        script: `node.elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {node.openGroup()});`,
        properties: {
            condition: {
                key: "condition",
                default: ''
            }
        },
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
        script: `node.elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {node.openGroup()});`,
        properties: {
            condition: {
                key: "condition",
                default: ''
            }
        },
        output: 2
    },
    node_project: {
        icon: '<i class="fas fa-object-group"></i>',
        sort: 0,
        name: 'Project',
        group: 'common',
        html: '<div class="text-center p3"><select class="listProject node-form-control" node:model="project"></select></div>',
        script: `
    const reloadProject = ()=>{
      node.elNode.querySelector('.listProject').innerHtml='';
      let option = document.createElement('option');
      option.text='none';
      option.value='';
      node.elNode.querySelector('.listProject').appendChild(option);
      node.parent.main.getProjectAll().forEach((item)=>{
        let option = document.createElement('option');
        option.text=item.Get('name');
        option.value=item.Get('id');
        node.elNode.querySelector('.listProject').appendChild(option);
      });
      node.elNode.querySelector('.listProject').value= node.data.Get('project')
    }
    reloadProject();

   ;`,
        properties: {
            project: {
                key: "project",
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
                default: PropertyEnum.solution
            },
            name: {
                default: () => `solution-${getTime()}`
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
                default: () => `Flow-${getTime()}`
            },
            key: {
                default: PropertyEnum.main
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
            this.$properties[`node_${item.key}`] = {
                ...(item.properties || {}),
                id: {
                    default: () => getTime()
                },
                key: {
                    default: item.key
                },
                name: {
                    default: item.key
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
        this.events.dispatch(event, details);
    }
    getControlAll() {
        return this.$control ?? {};
    }
    getProjectAll() {
        return this.$data.Get('projects') ?? [];
    }
    importJson(data) {
        this.$data.InitData(data, this.getPropertyByKey(PropertyEnum.solution));
    }
    setProjectOpen($data) {
        this.$projectOpen = $data;
    }
    checkProjectOpen($data) {
        return this.$projectOpen == $data;
    }
    newProject() {
        this.openProject({});
        this.dispatch(EventEnum.newProject, {});
    }
    openProject($data) {
        if ($data instanceof DataFlow) {
            let $project = this.getProjectById($data.Get('id'));
            if (!$project) {
                $project = $data;
                this.$data.Append('projects', $project);
            }
            this.dispatch(EventEnum.openProject, $project);
        }
        else {
            let data = new DataFlow(this);
            data.InitData($data, this.getPropertyByKey(PropertyEnum.main));
            this.$data.Append('projects', data);
            this.dispatch(EventEnum.openProject, { data });
            this.dispatch(EventEnum.showProperty, { data });
            this.dispatch(EventEnum.change, { data });
        }
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
            properties: this.getPropertyByKey(`node_${key}`)
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

var Desginer = /*#__PURE__*/Object.freeze({
    __proto__: null,
    DesginerView: DesginerView,
    Line: Line,
    Node: Node
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
    DockManager: DockManager
});

var index = {
    VisualFlow,
    SystemBase,
    ...Core,
    ...Dock,
    ...Desginer
};

module.exports = index;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5janMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL0NvbnN0YW50LnRzIiwiLi4vc3JjL2RvY2svRG9ja0Jhc2UudHMiLCIuLi9zcmMvZG9jay9Db250cm9sRG9jay50cyIsIi4uL3NyYy9kb2NrL1Byb2plY3REb2NrLnRzIiwiLi4vc3JjL2NvcmUvRWRpdG9yLnRzIiwiLi4vc3JjL2RvY2svUHJvcGVydHlEb2NrLnRzIiwiLi4vc3JjL2NvcmUvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvcmUvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29yZS9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb3JlL1V0aWxzLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0xpbmUudHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3X0V2ZW50LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld19Ub29sYmFyLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL05vZGUudHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3LnRzIiwiLi4vc3JjL2RvY2svVmlld0RvY2sudHMiLCIuLi9zcmMvZG9jay9Eb2NrTWFuYWdlci50cyIsIi4uL3NyYy9zeXN0ZW1zL2NvbnRyb2wudHMiLCIuLi9zcmMvc3lzdGVtcy9TeXN0ZW1CYXNlLnRzIiwiLi4vc3JjL1Zpc3VhbEZsb3cudHMiLCIuLi9zcmMvZG9jay9UYWJEb2NrLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBFdmVudEVudW0gPSB7XG4gIGluaXQ6IFwiaW5pdFwiLFxuICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcbiAgc2hvd1Byb3BlcnR5OiBcInNob3dQcm9wZXJ0eVwiLFxuICBvcGVuUHJvamVjdDogXCJvcGVuUHJvamVjdFwiLFxuICBuZXdQcm9qZWN0OiBcIm5ld1Byb2plY3RcIixcbiAgY2hhbmdlOiBcImNoYW5nZVwiLFxuICBkaXNwb3NlOiBcImRpc3Bvc2VcIlxufVxuXG5leHBvcnQgY29uc3QgRG9ja0VudW0gPSB7XG4gIGxlZnQ6IFwidnMtbGVmdFwiLFxuICB0b3A6IFwidnMtdG9wXCIsXG4gIHZpZXc6IFwidnMtdmlld1wiLFxuICBib3R0b206IFwidnMtYm90dG9tXCIsXG4gIHJpZ2h0OiBcInZzLXJpZ2h0XCIsXG59XG5cbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnLFxuICBncm91cENhdmFzOiBcIm1haW5fZ3JvdXBDYXZhc1wiLFxufTtcbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEb2NrQmFzZSB7XHJcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBwcm90ZWN0ZWQgZWxDb250ZW50OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJ0RvY2tCYXNlJztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBCb3hJbmZvKHRpdGxlOiBzdHJpbmcsICRjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd2cy1ib3hpbmZvJyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ib3hpbmZvJyk7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInZzLWJveGluZm9faGVhZGVyXCI+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX3RpdGxlXCI+JHt0aXRsZX08L3NwYW4+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX2J1dHRvblwiPjwvc3Bhbj48L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJ2cy1ib3hpbmZvX2NvbnRlbnRcIj48L2Rpdj5gO1xyXG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19jb250ZW50Jyk7XHJcbiAgICBpZiAoJGNhbGxiYWNrKSB7XHJcbiAgICAgICRjYWxsYmFjayh0aGlzLmVsQ29udGVudCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIENvbnRyb2xEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1jb250cm9sJyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdDb250cm9sJywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBsZXQgY29udHJvbHMgPSB0aGlzLm1haW4uZ2V0Q29udHJvbEFsbCgpO1xuICAgICAgY29uc29sZS5sb2coY29udHJvbHMpO1xuICAgICAgT2JqZWN0LmtleXMoY29udHJvbHMpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XG4gICAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcbiAgICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBpdGVtKTtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7Y29udHJvbHNbaXRlbV0uaWNvbn0gPHNwYW4+JHtjb250cm9sc1tpdGVtXS5uYW1lfTwvc3BhbmA7XG4gICAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuZHJhZ1N0YXJ0LmJpbmQodGhpcykpXG4gICAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbmQnLCB0aGlzLmRyYWdlbmQuYmluZCh0aGlzKSlcbiAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlIGRyYWdlbmQoZTogYW55KSB7XG4gICAgdGhpcy5tYWluLnNldENvbnRyb2xDaG9vc2UobnVsbCk7XG4gIH1cblxuICBwcml2YXRlIGRyYWdTdGFydChlOiBhbnkpIHtcbiAgICBsZXQga2V5ID0gZS50YXJnZXQuY2xvc2VzdChcIi5ub2RlLWl0ZW1cIikuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShrZXkpO1xuICAgIGlmIChlLnR5cGUgIT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKFwibm9kZVwiLCBrZXkpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFByb2plY3REb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1wcm9qZWN0Jyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdQcm9qZWN0JywgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLmNoYW5nZSwgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCAoZGV0YWlsOiBhbnkpID0+IHtcbiAgICAgIHRoaXMuZWxDb250ZW50Py5xdWVyeVNlbGVjdG9yQWxsKCcuYWN0aXZlJykuZm9yRWFjaCgoX25vZGUpID0+IHtcbiAgICAgICAgX25vZGUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLmVsQ29udGVudCAmJiBkZXRhaWw/LmRhdGE/LkdldCgnaWQnKSkge1xuICAgICAgICB0aGlzLmVsQ29udGVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm9qZWN0LWlkPVwiJHtkZXRhaWw/LmRhdGE/LkdldCgnaWQnKX1cIl1gKT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuICBwcml2YXRlIHJlbmRlclVJKCkge1xuICAgIGxldCAkbm9kZVJpZ2h0OiBIVE1MRWxlbWVudCB8IG51bGwgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19oZWFkZXIgLnZzLWJveGluZm9fYnV0dG9uJyk7XG4gICAgaWYgKCF0aGlzLmVsQ29udGVudCkgcmV0dXJuO1xuICAgIHRoaXMuZWxDb250ZW50LmlubmVySFRNTCA9IGBgO1xuICAgIGlmICgkbm9kZVJpZ2h0KSB7XG4gICAgICAkbm9kZVJpZ2h0LmlubmVySFRNTCA9IGBgO1xuICAgICAgbGV0IGJ1dHRvbk5ldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uTmV3KTtcbiAgICAgIGJ1dHRvbk5ldy5pbm5lckhUTUwgPSBgTmV3YDtcbiAgICAgIGJ1dHRvbk5ldy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMubWFpbi5uZXdQcm9qZWN0KCcnKSk7XG4gICAgfVxuXG4gICAgbGV0IHByb2plY3RzID0gdGhpcy5tYWluLmdldFByb2plY3RBbGwoKTtcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0LWlkJywgaXRlbS5HZXQoJ2lkJykpO1xuICAgICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgfSk7XG4gICAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV9uYW1lYCwgKCkgPT4ge1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLm1haW4uY2hlY2tQcm9qZWN0T3BlbihpdGVtKSkge1xuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB7IGRhdGE6IGl0ZW0gfSk7XG4gICAgICAgIHRoaXMubWFpbi5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCB7IGRhdGE6IGl0ZW0gfSk7XG5cbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbENvbnRlbnQ/LmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcbiAgICB9KTtcblxuICB9XG59XG4iLCJpbXBvcnQgeyBCYXNlRmxvdywgRmxvd0NvcmUgfSBmcm9tIFwiLi9CYXNlRmxvd1wiXG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuZXhwb3J0IGVudW0gRWRpdG9yVHlwZSB7XG4gIExhYmVsLFxuICBUZXh0LFxuICBJbmxpbmVcbn1cbmV4cG9ydCBjb25zdCBUYWdWaWV3ID0gWydTUEFOJywgJ0RJVicsICdQJywgJ1RFWFRBUkVBJ107XG5leHBvcnQgY2xhc3MgRGF0YVZpZXcge1xuICBwcml2YXRlIGtleU5hbWU6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgPSBcIlwiO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGRhdGE6IERhdGFGbG93LCBwcml2YXRlIGVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsKSB7XG4gICAgdGhpcy5rZXlOYW1lID0gZWw/LmdldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcpO1xuICAgIHRoaXMuYmluZERhdGEoKTtcbiAgfVxuICBwcml2YXRlIGJpbmREYXRhKCkge1xuICAgIGlmICh0aGlzLmtleU5hbWUgJiYgdGhpcy5lbCkge1xuICAgICAgdGhpcy5kYXRhLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke3RoaXMua2V5TmFtZX1gLCB0aGlzLmJpbmRJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5iaW5kRXZlbnQuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHVuQmluZERhdGEoKSB7XG4gICAgaWYgKHRoaXMua2V5TmFtZSAmJiB0aGlzLmVsKSB7XG4gICAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7dGhpcy5rZXlOYW1lfWAsIHRoaXMuYmluZElucHV0LmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmJpbmRFdmVudC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuYmluZEV2ZW50LmJpbmQodGhpcykpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGJpbmRJbnB1dCh7IHZhbHVlLCBzZW5kZXIgfTogYW55KSB7XG5cbiAgICBpZiAoc2VuZGVyICE9PSB0aGlzICYmIHRoaXMuZWwgJiYgc2VuZGVyLmVsICE9PSB0aGlzLmVsKSB7XG4gICAgICBjb25zb2xlLmxvZyh0aGlzLmVsLnRhZ05hbWUpO1xuICAgICAgY29uc29sZS5sb2coc2VuZGVyKTtcbiAgICAgIGlmIChUYWdWaWV3LmluY2x1ZGVzKHRoaXMuZWwudGFnTmFtZSkpIHtcbiAgICAgICAgdGhpcy5lbC5pbm5lclRleHQgPSBgJHt2YWx1ZX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKHRoaXMuZWwgYXMgYW55KS52YWx1ZSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwcml2YXRlIGJpbmRFdmVudCgpIHtcbiAgICBpZiAodGhpcy5rZXlOYW1lICYmIHRoaXMuZWwpIHtcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMua2V5TmFtZSk7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMua2V5TmFtZSwgKHRoaXMuZWwgYXMgYW55KS52YWx1ZSwgdGhpcyk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBzdGF0aWMgQmluZFZpZXcoZGF0YTogRGF0YUZsb3csIHJvb3Q6IEVsZW1lbnQpIHtcbiAgICBpZiAocm9vdCkge1xuICAgICAgcmV0dXJuIEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsKCdbbm9kZVxcXFw6bW9kZWxdJykpLm1hcCgoZWwpID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRhVmlldyhkYXRhLCBlbCBhcyBIVE1MRWxlbWVudCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRWRpdG9yIHtcbiAgcHJpdmF0ZSBpc0VkaXQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBlbElucHV0OiBIVE1MRGF0YUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBlbExhYmVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBkYXRhOiBEYXRhRmxvdywgcHJpdmF0ZSBrZXk6IHN0cmluZywgZWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGwsIHByaXZhdGUgdHlwZTogRWRpdG9yVHlwZSA9IEVkaXRvclR5cGUuTGFiZWwsIGNoYWduZTogYm9vbGVhbiA9IGZhbHNlKSB7XG5cbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIHRoaXMuZGF0YS5vblNhZmUoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHRoaXMuY2hhbmdlRGF0YS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmRhdGEub25TYWZlKEV2ZW50RW51bS5kaXNwb3NlLCB0aGlzLmRpc3Bvc2UuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5pc0VkaXQgPSB0eXBlID09PSBFZGl0b3JUeXBlLlRleHQ7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnbm9kZS1lZGl0b3InKTtcbiAgICBpZiAoY2hhZ25lICYmIGVsKSB7XG4gICAgICBlbC5wYXJlbnRFbGVtZW50Py5pbnNlcnRCZWZvcmUodGhpcy5lbE5vZGUsIGVsKTtcbiAgICAgIGVsLnBhcmVudEVsZW1lbnQ/LnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgIGVsPy5yZW1vdmUoKTtcbiAgICB9IGVsc2UgaWYgKGVsKSB7XG4gICAgICBlbC5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgfVxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIHJlbmRlcigpIHtcbiAgICBsZXQgZGF0YSA9IHRoaXMuZGF0YS5HZXQodGhpcy5rZXkpO1xuXG4gICAgaWYgKHRoaXMuaXNFZGl0KSB7XG4gICAgICBpZiAodGhpcy5lbExhYmVsKSB7XG4gICAgICAgIHRoaXMuZWxMYWJlbC5yZW1vdmVFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuc3dpdGNoTW9kZUVkaXQuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZWxMYWJlbC5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5lbExhYmVsID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmVsSW5wdXQpIHtcbiAgICAgICAgdGhpcy5lbElucHV0LnZhbHVlID0gZGF0YTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5lbElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgIHRoaXMuZWxJbnB1dC5jbGFzc0xpc3QuYWRkKCdub2RlLWZvcm0tY29udHJvbCcpO1xuICAgICAgdGhpcy5lbElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmlucHV0RGF0YS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxJbnB1dC52YWx1ZSA9IGRhdGE7XG4gICAgICB0aGlzLmVsSW5wdXQuc2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJywgdGhpcy5rZXkpO1xuICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbElucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuZWxJbnB1dCkge1xuICAgICAgICB0aGlzLmVsSW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmlucHV0RGF0YS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5lbElucHV0LnJlbW92ZSgpO1xuICAgICAgICB0aGlzLmVsSW5wdXQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZWxMYWJlbCkge1xuICAgICAgICB0aGlzLmVsTGFiZWwuaW5uZXJIVE1MID0gZGF0YTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5lbExhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgaWYgKHRoaXMudHlwZSA9PSBFZGl0b3JUeXBlLklubGluZSkge1xuICAgICAgICB0aGlzLmVsTGFiZWwuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLnN3aXRjaE1vZGVFZGl0LmJpbmQodGhpcykpO1xuICAgICAgfVxuICAgICAgdGhpcy5lbExhYmVsLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIHRoaXMua2V5KTtcbiAgICAgIHRoaXMuZWxMYWJlbC5pbm5lckhUTUwgPSBkYXRhO1xuICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbExhYmVsKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHN3aXRjaE1vZGVFZGl0KCkge1xuICAgIHRoaXMuaXNFZGl0ID0gdHJ1ZTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyBpbnB1dERhdGEoZTogYW55KSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLmRhdGEuU2V0KHRoaXMua2V5LCBlLnRhcmdldC52YWx1ZSwgdGhpcyk7XG4gICAgfSlcbiAgfVxuICBwdWJsaWMgY2hhbmdlRGF0YSh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyBkaXNwb3NlKCkge1xuICAgIHRoaXMuZWxJbnB1dD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaW5wdXREYXRhLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxMYWJlbD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLnN3aXRjaE1vZGVFZGl0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHt0aGlzLmtleX1gLCB0aGlzLmNoYW5nZURhdGEuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kaXNwb3NlLCB0aGlzLmRpc3Bvc2UuYmluZCh0aGlzKSk7XG4gIH1cblxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcbmltcG9ydCB7IEVkaXRvciwgRWRpdG9yVHlwZSB9IGZyb20gXCIuLi9jb3JlL0VkaXRvclwiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgUHJvcGVydHlEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwcml2YXRlIGxhc3REYXRhOiBEYXRhRmxvdyB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBsYWJlbEtleXM6IHN0cmluZ1tdID0gWydpZCcsICdrZXknLCAnZ3JvdXAnLCAnbGluZXMnLCAnbm9kZXMnLCAncHJvamVjdCcsICd4JywgJ3knXTtcbiAgcHJpdmF0ZSBoaWRlS2V5czogc3RyaW5nW10gPSBbJ2xpbmVzJywgJ25vZGVzJywgJ2dyb3VwcyddO1xuICBwcml2YXRlIHNvcnRLZXlzOiBzdHJpbmdbXSA9IFsnaWQnLCAna2V5JywgJ25hbWUnLCAnZ3JvdXAnXTtcbiAgcHJpdmF0ZSBkYXRhSnNvbjogSFRNTFRleHRBcmVhRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvcGVydHknKTtcbiAgICB0aGlzLkJveEluZm8oJ1Byb3BlcnR5JywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICBtYWluLm9uKEV2ZW50RW51bS5zaG93UHJvcGVydHksIChkZXRhaWw6IGFueSkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlclVJKG5vZGUsIGRldGFpbC5kYXRhKTtcbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclVJKG5vZGU6IEhUTUxFbGVtZW50LCBkYXRhOiBEYXRhRmxvdykge1xuICAgIGlmICh0aGlzLmxhc3REYXRhID09IGRhdGEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XG4gICAgbm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICBsZXQgcHJvcGVydGllczogYW55ID0gZGF0YS5nZXRQcm9wZXJ0aWVzKCk7XG4gICAgdGhpcy5zb3J0S2V5cy5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKHRoaXMuaGlkZUtleXMuaW5jbHVkZXMoa2V5KSB8fCAhcHJvcGVydGllc1trZXldKSByZXR1cm47XG4gICAgICBsZXQgcHJvcGVydHlJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHByb3BlcnR5TGFiZWwuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktbGFiZWwnKTtcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0ga2V5O1xuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHByb3BlcnR5VmFsdWUuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktdmFsdWUnKTtcbiAgICAgIGlmICh0aGlzLmxhYmVsS2V5cy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIG5ldyBFZGl0b3IoZGF0YSwga2V5LCBwcm9wZXJ0eVZhbHVlLCBFZGl0b3JUeXBlLkxhYmVsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ldyBFZGl0b3IoZGF0YSwga2V5LCBwcm9wZXJ0eVZhbHVlLCBFZGl0b3JUeXBlLlRleHQpO1xuICAgICAgfVxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5VmFsdWUpO1xuICAgICAgbm9kZS5hcHBlbmRDaGlsZChwcm9wZXJ0eUl0ZW0pO1xuICAgIH0pO1xuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAodGhpcy5oaWRlS2V5cy5pbmNsdWRlcyhrZXkpIHx8IHRoaXMuc29ydEtleXMuaW5jbHVkZXMoa2V5KSkgcmV0dXJuO1xuICAgICAgbGV0IHByb3BlcnR5SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgcHJvcGVydHlJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWl0ZW0nKTtcbiAgICAgIGxldCBwcm9wZXJ0eUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eUxhYmVsLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWxhYmVsJyk7XG4gICAgICBwcm9wZXJ0eUxhYmVsLmlubmVySFRNTCA9IGtleTtcbiAgICAgIGxldCBwcm9wZXJ0eVZhbHVlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eVZhbHVlLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LXZhbHVlJyk7XG4gICAgICBpZiAodGhpcy5sYWJlbEtleXMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICBuZXcgRWRpdG9yKGRhdGEsIGtleSwgcHJvcGVydHlWYWx1ZSwgRWRpdG9yVHlwZS5MYWJlbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXcgRWRpdG9yKGRhdGEsIGtleSwgcHJvcGVydHlWYWx1ZSwgRWRpdG9yVHlwZS5UZXh0KTtcbiAgICAgIH1cbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eUxhYmVsKTtcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eVZhbHVlKTtcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJdGVtKTtcbiAgICB9KTtcbiAgICAvLyBub2RlLmFwcGVuZENoaWxkKHRoaXMuZGF0YUpzb24pO1xuICAgIC8vIHRoaXMuZGF0YUpzb24udmFsdWUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgLy8gdGhpcy5kYXRhSnNvbi5jbGFzc0xpc3QuYWRkKCdub2RlLWZvcm0tY29udHJvbCcpO1xuXG4gICAgLy9kYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoKSA9PiB0aGlzLmRhdGFKc29uLnZhbHVlID0gZGF0YS50b1N0cmluZygpKVxuICB9XG59XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRGbG93IHtcclxuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCkgeyB9XHJcbiAgcHVibGljIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICB0aGlzLm9uKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIC8qIEV2ZW50cyAqL1xyXG4gIHB1YmxpYyBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgVGhlIGxpc3RlbmVyIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbiwgdGhlIGdpdmVuIHR5cGUgaXMgJHt0eXBlb2YgY2FsbGJhY2t9YCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIENoZWNrIGlmIHRoZSBldmVudCBpcyBub3QgYSBzdHJpbmdcclxuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XHJcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoaXMgZXZlbnQgbm90IGV4aXN0c1xyXG5cclxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcclxuXHJcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXHJcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXHJcbiAgICBjb25zdCBoYXNMaXN0ZW5lciA9IGxpc3RlbmVySW5kZXggPiAtMVxyXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuICAgIGlmICh0aGlzLmV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyOiBhbnkpID0+IHtcclxuICAgICAgbGlzdGVuZXIoZGV0YWlscyk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSVByb3BlcnR5IH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcclxuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcclxuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGF0YUZsb3cge1xyXG4gIHByaXZhdGUgZGF0YTogYW55ID0ge307XHJcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVzOiBhbnkgPSBudWxsO1xyXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XHJcbiAgcHVibGljIGdldFByb3BlcnRpZXMoKTogYW55IHtcclxuICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXM7XHJcbiAgfVxyXG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XHJcblxyXG4gICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xyXG4gIH1cclxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwcm9wZXJ0eTogSVByb3BlcnR5IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBkYXRhOiBhbnkgPSB1bmRlZmluZWQpIHtcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xyXG4gICAgaWYgKGRhdGEpIHtcclxuICAgICAgdGhpcy5sb2FkKGRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgSW5pdERhdGEoZGF0YTogYW55ID0gbnVsbCwgcHJvcGVydGllczogYW55ID0gLTEpIHtcclxuICAgIGlmIChwcm9wZXJ0aWVzICE9PSAtMSkge1xyXG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xyXG4gICAgfVxyXG4gICAgdGhpcy5sb2FkKGRhdGEpO1xyXG4gIH1cclxuICBwcml2YXRlIGV2ZW50RGF0YUNoYW5nZShrZXk6IHN0cmluZywga2V5Q2hpbGQ6IHN0cmluZywgdmFsdWVDaGlsZDogYW55LCBzZW5kZXJDaGlsZDogYW55LCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XHJcbiAgICBpZiAoaW5kZXgpIHtcclxuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9XyR7a2V5Q2hpbGR9YCwge1xyXG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9YCwge1xyXG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fV8ke2tleUNoaWxkfWAsIHtcclxuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcclxuICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcclxuICAgIH0pO1xyXG4gIH1cclxuICBwdWJsaWMgUmVtb3ZlRXZlbnREYXRhKGl0ZW06IERhdGFGbG93LCBrZXk6IHN0cmluZywgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKCFpdGVtKSByZXR1cm47XHJcbiAgICBpdGVtLnJlbW92ZUxpc3RlbmVyKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfWAsICh7IGtleToga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkIH06IGFueSkgPT4gdGhpcy5ldmVudERhdGFDaGFuZ2Uoa2V5LCBrZXlDaGlsZCwgdmFsdWVDaGlsZCwgc2VuZGVyQ2hpbGQsIGluZGV4KSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBPbkV2ZW50RGF0YShpdGVtOiBEYXRhRmxvdywga2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcclxuICAgIGlmICghaXRlbSkgcmV0dXJuO1xyXG4gICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xyXG4gIH1cclxuICBwcml2YXRlIEJpbmRFdmVudCh2YWx1ZTogYW55LCBrZXk6IHN0cmluZykge1xyXG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcclxuICAgICAgdGhpcy5PbkV2ZW50RGF0YSh2YWx1ZSBhcyBEYXRhRmxvdywga2V5KTtcclxuICAgIH1cclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAodmFsdWUgYXMgW10pLmxlbmd0aCA+IDAgJiYgdmFsdWVbMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xyXG4gICAgICAodmFsdWUgYXMgRGF0YUZsb3dbXSkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3csIGluZGV4OiBudW1iZXIpID0+IHRoaXMuT25FdmVudERhdGEoaXRlbSwga2V5LCBpbmRleCkpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgU2V0KGtleTogc3RyaW5nLCB2YWx1ZTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwsIGlzRGlzcGF0Y2g6IGJvb2xlYW4gPSB0cnVlKSB7XHJcbiAgICBpZiAodGhpcy5kYXRhW2tleV0gIT0gdmFsdWUpIHtcclxuICAgICAgaWYgKHRoaXMuZGF0YVtrZXldKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGF0YVtrZXldIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcclxuICAgICAgICAgIHRoaXMuUmVtb3ZlRXZlbnREYXRhKCh0aGlzLmRhdGFba2V5XSBhcyBEYXRhRmxvdyksIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGF0YVtrZXldKSAmJiAodGhpcy5kYXRhW2tleV0gYXMgW10pLmxlbmd0aCA+IDAgJiYgdGhpcy5kYXRhW2tleV1bMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xyXG4gICAgICAgICAgKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLlJlbW92ZUV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuQmluZEV2ZW50KHZhbHVlLCBrZXkpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kYXRhW2tleV0gPSB2YWx1ZTtcclxuICAgIGlmIChpc0Rpc3BhdGNoKSB7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcclxuICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcclxuICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xyXG4gICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG4gIHB1YmxpYyBTZXREYXRhKGRhdGE6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IGZhbHNlKSB7XHJcblxyXG4gICAgaWYgKGlzQ2xlYXJEYXRhKSB0aGlzLmRhdGEgPSB7fTtcclxuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcclxuICAgICAgbGV0ICRkYXRhOiBEYXRhRmxvdyA9IGRhdGEgYXMgRGF0YUZsb3c7XHJcbiAgICAgIGlmICghdGhpcy5wcm9wZXJ0eSAmJiAkZGF0YS5wcm9wZXJ0eSkgdGhpcy5wcm9wZXJ0eSA9ICRkYXRhLnByb3BlcnR5O1xyXG4gICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcclxuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoJGRhdGEuZ2V0UHJvcGVydGllcygpKSkge1xyXG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIHRoaXMuU2V0KGtleSwgZGF0YVtrZXldLCBzZW5kZXIsIGZhbHNlKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XHJcbiAgICAgIGRhdGFcclxuICAgIH0pO1xyXG4gIH1cclxuICBwdWJsaWMgR2V0KGtleTogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhW2tleV07XHJcbiAgfVxyXG4gIHB1YmxpYyBBcHBlbmQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcclxuICAgIGlmICghdGhpcy5kYXRhW2tleV0pIHRoaXMuZGF0YVtrZXldID0gW107XHJcbiAgICB0aGlzLmRhdGFba2V5XSA9IFsuLi50aGlzLmRhdGFba2V5XSwgdmFsdWVdO1xyXG4gICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBSZW1vdmUoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcclxuICAgIHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5kYXRhW2tleV0uaW5kZXhPZih2YWx1ZSk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICB0aGlzLlJlbW92ZUV2ZW50RGF0YSh0aGlzLmRhdGFba2V5XVtpbmRleF0sIGtleSk7XHJcbiAgICAgIHRoaXMuZGF0YVtrZXldLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xyXG4gICAgdGhpcy5kYXRhID0ge307XHJcbiAgICBpZiAoIXRoaXMucHJvcGVydGllcykge1xyXG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnR5Py5nZXRQcm9wZXJ0eUJ5S2V5KGRhdGEua2V5KTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLnByb3BlcnRpZXMpIHtcclxuICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcclxuICAgICAgICB0aGlzLmRhdGFba2V5XSA9IChkYXRhPy5ba2V5XSA/PyAoKHR5cGVvZiB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCA9PT0gXCJmdW5jdGlvblwiID8gdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQoKSA6IHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0KSA/PyBcIlwiKSk7XHJcbiAgICAgICAgaWYgKCEodGhpcy5kYXRhW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykgJiYgdGhpcy5kYXRhW2tleV0ua2V5KSB7XHJcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCB0aGlzLmRhdGFba2V5XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGF0YVtrZXldKSAmJiB0aGlzLnByb3BlcnR5ICYmICEodGhpcy5kYXRhW2tleV1bMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykpIHtcclxuICAgICAgICAgIHRoaXMuZGF0YVtrZXldID0gdGhpcy5kYXRhW2tleV0ubWFwKChpdGVtOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgaWYgKCEoaXRlbSBpbnN0YW5jZW9mIERhdGFGbG93KSAmJiBpdGVtLmtleSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgaXRlbSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLkJpbmRFdmVudCh0aGlzLmRhdGFba2V5XSwga2V5KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgdG9TdHJpbmcoKSB7XHJcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy50b0pzb24oKSk7XHJcbiAgfVxyXG4gIHB1YmxpYyB0b0pzb24oKSB7XHJcbiAgICBsZXQgcnM6IGFueSA9IHt9O1xyXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcclxuICAgICAgcnNba2V5XSA9IHRoaXMuR2V0KGtleSk7XHJcbiAgICAgIGlmIChyc1trZXldIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcclxuICAgICAgICByc1trZXldID0gcnNba2V5XS50b0pzb24oKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyc1trZXldKSAmJiAocnNba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiByc1trZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcclxuICAgICAgICByc1trZXldID0gcnNba2V5XS5tYXAoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLnRvSnNvbigpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJzO1xyXG4gIH1cclxuICBwdWJsaWMgZGVsZXRlKCkge1xyXG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XHJcbiAgICB0aGlzLmRhdGEgPSB7fTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuLi9kZXNnaW5lci9Ob2RlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVByb3BlcnR5IHtcbiAgZ2V0UHJvcGVydHlCeUtleShrZXk6IHN0cmluZyk6IGFueTtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbnRyb2xOb2RlIGV4dGVuZHMgSVByb3BlcnR5IHtcbiAgZ2V0Q29udHJvbE5vZGVCeUtleShrZXk6IHN0cmluZyk6IGFueTtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSUV2ZW50IHtcbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpOiB2b2lkO1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KTogdm9pZDtcbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSk6IHZvaWQ7XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSk6IHZvaWQ7XG59XG5leHBvcnQgaW50ZXJmYWNlIElNYWluIGV4dGVuZHMgSUNvbnRyb2xOb2RlLCBJRXZlbnQge1xuICBuZXdQcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICBvcGVuUHJvamVjdCgkbmFtZTogc3RyaW5nKTogdm9pZDtcbiAgZ2V0UHJvamVjdEFsbCgpOiBhbnlbXTtcbiAgc2V0UHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IHZvaWQ7XG4gIGNoZWNrUHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IGJvb2xlYW47XG4gIGdldENvbnRyb2xBbGwoKTogYW55O1xuICBzZXRDb250cm9sQ2hvb3NlKGtleTogc3RyaW5nIHwgbnVsbCk6IHZvaWQ7XG4gIGdldENvbnRyb2xDaG9vc2UoKTogc3RyaW5nIHwgbnVsbDtcbiAgZ2V0Q29udHJvbEJ5S2V5KGtleTogc3RyaW5nKTogYW55O1xuICByZW5kZXJIdG1sKG5vZGU6IE5vZGUpOiBzdHJpbmc7XG4gIGluaXRPcHRpb24ob3B0aW9uOiBhbnksIGlzRGVmYXVsdDogYm9vbGVhbik6IHZvaWQ7XG4gIGNoZWNrSW5pdE9wdGlvbigpOiBib29sZWFuO1xuICBpbXBvcnRKc29uKGRhdGE6IGFueSk6IHZvaWQ7XG4gIGV4cG9ydEpzb24oKTogYW55O1xufVxuZXhwb3J0IGNsYXNzIEZsb3dDb3JlIGltcGxlbWVudHMgSUV2ZW50IHtcbiAgcHVibGljIEdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdpZCcpO1xuICB9XG4gIHB1YmxpYyBTZXRJZChpZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ2lkJywgaWQpO1xuICB9XG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcbiAgcHVibGljIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgcHVibGljIENoZWNrRWxlbWVudENoaWxkKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHJldHVybiB0aGlzLmVsTm9kZSA9PSBlbCB8fCB0aGlzLmVsTm9kZS5jb250YWlucyhlbCk7XG4gIH1cbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgcHVibGljIFNldERhdGEoZGF0YTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmRhdGEuU2V0RGF0YShkYXRhLCBzZW5kZXIpO1xuICB9XG4gIHB1YmxpYyBTZXREYXRhRmxvdyhkYXRhOiBEYXRhRmxvdykge1xuICAgIHRoaXMuZGF0YS5TZXREYXRhKGRhdGEsIHRoaXMsIHRydWUpO1xuXG4gICAgdGhpcy5kaXNwYXRjaChgYmluZF9kYXRhX2V2ZW50YCwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7IGRhdGEsIHNlbmRlcjogdGhpcyB9KTtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBCaW5kRGF0YUV2ZW50KCkge1xuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5jaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgUmVtb3ZlRGF0YUV2ZW50KCkge1xuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uZGF0YUNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5jaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIHRoaXMuQmluZERhdGFFdmVudCgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCYXNlRmxvdzxUUGFyZW50IGV4dGVuZHMgRmxvd0NvcmU+IGV4dGVuZHMgRmxvd0NvcmUge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIHBhcmVudDogVFBhcmVudCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbn1cbiIsImV4cG9ydCBjb25zdCBMT0cgPSAobWVzc2FnZT86IGFueSwgLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiBjb25zb2xlLmxvZyhtZXNzYWdlLCBvcHRpb25hbFBhcmFtcyk7XG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IChuZXcgRGF0ZSgpKTtcbmV4cG9ydCBjb25zdCBnZXRUaW1lID0gKCkgPT4gZ2V0RGF0ZSgpLmdldFRpbWUoKTtcbmV4cG9ydCBjb25zdCBnZXRVdWlkID0gKCkgPT4ge1xuICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICBsZXQgczogYW55ID0gW107XG4gIGxldCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xuICB9XG4gIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcbiAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXG4gIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICByZXR1cm4gdXVpZDtcbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBhcmVTb3J0ID0gKGE6IGFueSwgYjogYW55KSA9PiB7XG4gIGlmIChhLnNvcnQgPCBiLnNvcnQpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKGEuc29ydCA+IGIuc29ydCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuIiwiaW1wb3J0IHsgRGF0YUZsb3csIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4vTm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgTGluZSB7XG4gIHB1YmxpYyBlbE5vZGU6IFNWR0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJzdmdcIik7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcbiAgcHJpdmF0ZSBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgdGVtcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGZyb206IE5vZGUsIHB1YmxpYyBmcm9tSW5kZXg6IG51bWJlciA9IDAsIHB1YmxpYyB0bzogTm9kZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCwgcHVibGljIHRvSW5kZXg6IG51bWJlciA9IDAsIGRhdGE6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKFwibWFpbi1wYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgJycpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJjb25uZWN0aW9uXCIpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxQYXRoKTtcbiAgICB0aGlzLmZyb20ucGFyZW50LmVsQ2FudmFzLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcblxuICAgIHRoaXMuZnJvbS5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudG8/LkFkZExpbmUodGhpcyk7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZGF0YS5Jbml0RGF0YShcbiAgICAgIHtcbiAgICAgICAgZnJvbTogdGhpcy5mcm9tLkdldElkKCksXG4gICAgICAgIGZyb21JbmRleDogdGhpcy5mcm9tSW5kZXgsXG4gICAgICAgIHRvOiB0aGlzLnRvPy5HZXRJZCgpLFxuICAgICAgICB0b0luZGV4OiB0aGlzLnRvSW5kZXhcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIC4uLiB0aGlzLmZyb20ucGFyZW50Lm1haW4uZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubGluZSkgfHwge31cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuZnJvbS5kYXRhLkFwcGVuZCgnbGluZXMnLCB0aGlzLmRhdGEpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVUbyh0b194OiBudW1iZXIsIHRvX3k6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5mcm9tIHx8IHRoaXMuZnJvbS5lbE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xuICAgIGxldCB7IHg6IGZyb21feCwgeTogZnJvbV95IH06IGFueSA9IHRoaXMuZnJvbS5nZXRQb3N0aXNpb25Eb3QodGhpcy5mcm9tSW5kZXgpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCk6IExpbmUge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvLmVsTm9kZSkge1xuICAgICAgbGV0IHsgeDogdG9feCwgeTogdG9feSB9OiBhbnkgPSB0aGlzLnRvLmdldFBvc3Rpc2lvbkRvdCh0aGlzLnRvSW5kZXgpO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIEFjdGl2ZShmbGc6IGFueSA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwsIGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5mcm9tLmRhdGEuUmVtb3ZlKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gICAgaWYgKHRoaXMuZnJvbSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50bz8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsUGF0aC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLmZyb20ucGFyZW50LnNldExpbmVDaG9vc2UodGhpcylcbiAgfVxuICBwdWJsaWMgc2V0Tm9kZVRvKG5vZGU6IE5vZGUgfCB1bmRlZmluZWQsIHRvSW5kZXg6IG51bWJlcikge1xuICAgIHRoaXMudG8gPSBub2RlO1xuICAgIHRoaXMudG9JbmRleCA9IHRvSW5kZXg7XG4gIH1cbiAgcHVibGljIENsb25lKCkge1xuICAgIGlmICh0aGlzLnRvICYmIHRoaXMudG9JbmRleCAmJiB0aGlzLmZyb20gIT0gdGhpcy50byAmJiAhdGhpcy5mcm9tLmNoZWNrTGluZUV4aXN0cyh0aGlzLmZyb21JbmRleCwgdGhpcy50bywgdGhpcy50b0luZGV4KSkge1xuICAgICAgcmV0dXJuIG5ldyBMaW5lKHRoaXMuZnJvbSwgdGhpcy5mcm9tSW5kZXgsIHRoaXMudG8sIHRoaXMudG9JbmRleCkuVXBkYXRlVUkoKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IGdldFRpbWUgfSBmcm9tIFwiLi4vY29yZS9VdGlsc1wiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuXG5leHBvcnQgZW51bSBNb3ZlVHlwZSB7XG4gIE5vbmUgPSAwLFxuICBOb2RlID0gMSxcbiAgQ2FudmFzID0gMixcbiAgTGluZSA9IDMsXG59XG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3X0V2ZW50IHtcblxuICBwcml2YXRlIHRpbWVGYXN0Q2xpY2s6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgdGFnSW5nb3JlID0gWydpbnB1dCcsICdidXR0b24nLCAnYScsICd0ZXh0YXJlYSddO1xuXG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgcHJpdmF0ZSBmbGdEcmFwOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgZmxnTW92ZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgYXZfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBhdl95OiBudW1iZXIgPSAwO1xuXG4gIHByaXZhdGUgcG9zX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgcG9zX3k6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb3VzZV95OiBudW1iZXIgPSAwO1xuXG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmUgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogRGVzZ2luZXJWaWV3KSB7XG4gICAgLyogTW91c2UgYW5kIFRvdWNoIEFjdGlvbnMgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG4gICAgLyogQ29udGV4dCBNZW51ICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcblxuICAgIC8qIERyb3AgRHJhcCAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5ub2RlX2Ryb3BFbmQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5ub2RlX2RyYWdvdmVyLmJpbmQodGhpcykpO1xuICAgIC8qIFpvb20gTW91c2UgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLnpvb21fZW50ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogRGVsZXRlICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWRvd24uYmluZCh0aGlzKSk7XG4gIH1cblxuICBwcml2YXRlIGNvbnRleHRtZW51KGV2OiBhbnkpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfVxuICBwcml2YXRlIG5vZGVfZHJhZ292ZXIoZXY6IGFueSkgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gIHByaXZhdGUgbm9kZV9kcm9wRW5kKGV2OiBhbnkpIHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGxldCBrZXlOb2RlOiBhbnkgPSB0aGlzLnBhcmVudC5tYWluLmdldENvbnRyb2xDaG9vc2UoKTtcbiAgICBpZiAoIWtleU5vZGUgJiYgZXYudHlwZSAhPT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xuICAgIH1cbiAgICBpZiAoIWtleU5vZGUpIHJldHVybjtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgbGV0IHkgPSB0aGlzLnBhcmVudC5DYWxjWSh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55IC0gZV9wb3NfeSk7XG5cbiAgICBpZiAodGhpcy5wYXJlbnQuY2hlY2tPbmx5Tm9kZShrZXlOb2RlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgbm9kZUl0ZW0gPSB0aGlzLnBhcmVudC5BZGROb2RlKGtleU5vZGUsIHtcbiAgICAgIGdyb3VwOiB0aGlzLnBhcmVudC5DdXJyZW50R3JvdXAoKVxuICAgIH0pO1xuICAgIG5vZGVJdGVtLnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICB9XG4gIHB1YmxpYyB6b29tX2VudGVyKGV2ZW50OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoZXZlbnQuY3RybEtleSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgaWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcbiAgICAgICAgLy8gWm9vbSBPdXRcbiAgICAgICAgdGhpcy5wYXJlbnQuem9vbV9vdXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFpvb20gSW5cbiAgICAgICAgdGhpcy5wYXJlbnQuem9vbV9pbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwcml2YXRlIFN0YXJ0TW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKHRoaXMudGFnSW5nb3JlLmluY2x1ZGVzKGV2LnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudGltZUZhc3RDbGljayA9IGdldFRpbWUoKTtcbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWFpbi1wYXRoJykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkNhbnZhcztcbiAgICBsZXQgbm9kZUNob29zZSA9IHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKTtcbiAgICBpZiAobm9kZUNob29zZSAmJiBub2RlQ2hvb3NlLkNoZWNrRWxlbWVudENoaWxkKGV2LnRhcmdldCkpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIGlmIChub2RlQ2hvb3NlICYmIHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuTm9kZSAmJiBldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibm9kZS1kb3RcIikpIHtcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xuICAgICAgbGV0IGZyb21JbmRleCA9IGV2LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSBuZXcgTGluZShub2RlQ2hvb3NlLCBmcm9tSW5kZXgpO1xuICAgICAgdGhpcy50ZW1wTGluZS50ZW1wID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICB0aGlzLmF2X3ggPSB0aGlzLnBhcmVudC5nZXRYKCk7XG4gICAgICB0aGlzLmF2X3kgPSB0aGlzLnBhcmVudC5nZXRZKCk7XG4gICAgfVxuICAgIHRoaXMuZmxnRHJhcCA9IHRydWU7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgdGhpcy5mbGdNb3ZlID0gdHJ1ZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLm1vdmVUeXBlKSB7XG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5hdl94ICsgdGhpcy5wYXJlbnQuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLmF2X3kgKyB0aGlzLnBhcmVudC5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xuICAgICAgICAgIHRoaXMucGFyZW50LnNldFkoeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wb3NfeSAtIGVfcG9zX3kpO1xuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgICAgICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgICAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLnBhcmVudC5lbENhbnZhcy5vZmZzZXRMZWZ0IC0geCwgdGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgICAgICBsZXQgbm9kZUVsID0gZXYudGFyZ2V0LmNsb3Nlc3QoJ1tub2RlLWlkXScpO1xuICAgICAgICAgICAgbGV0IG5vZGVJZCA9IG5vZGVFbD8uZ2V0QXR0cmlidXRlKCdub2RlLWlkJyk7XG4gICAgICAgICAgICBsZXQgbm9kZVRvID0gbm9kZUlkID8gdGhpcy5wYXJlbnQuR2V0Tm9kZUJ5SWQobm9kZUlkKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChub2RlVG8gJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IHRvSW5kZXggPSBub2RlRWw/LnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWRvdCcpPy5bMF0/LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xuICAgICAgdGhpcy5tb3VzZV95ID0gZV9wb3NfeTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBFbmRNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIC8vZml4IEZhc3QgQ2xpY2tcbiAgICBpZiAoKChnZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMTAwKSB8fCAhdGhpcy5mbGdNb3ZlKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBlX3Bvc194ID0gdGhpcy5tb3VzZV94O1xuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcbiAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xuICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcbiAgICAgIHRoaXMuYXZfeCA9IDA7XG4gICAgICB0aGlzLmF2X3kgPSAwO1xuICAgIH1cbiAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgdGhpcy50ZW1wTGluZS5DbG9uZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHByaXZhdGUga2V5ZG93bihldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKGV2LmtleSA9PT0gJ0RlbGV0ZScgfHwgKGV2LmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgZXYubWV0YUtleSkpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpPy5kZWxldGUoKTtcbiAgICAgIHRoaXMucGFyZW50LmdldExpbmVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgfVxuICAgIGlmIChldi5rZXkgPT09ICdGMicpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuXG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3X1Rvb2xiYXIge1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgZWxQYXRoR3JvdXA6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHByaXZhdGUgYnRuQmFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IERlc2dpbmVyVmlldykge1xuICAgIHRoaXMuZWxOb2RlID0gcGFyZW50LmVsVG9vbGJhcjtcbiAgICB0aGlzLmVsUGF0aEdyb3VwLmNsYXNzTGlzdC5hZGQoJ3Rvb2xiYXItZ3JvdXAnKTtcbiAgICB0aGlzLnJlbmRlclVJKCk7XG4gICAgdGhpcy5yZW5kZXJQYXRoR3JvdXAoKTtcbiAgfVxuICBwdWJsaWMgcmVuZGVyUGF0aEdyb3VwKCkge1xuICAgIHRoaXMuYnRuQmFjay5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYGRpc3BsYXk6bm9uZTtgKTtcbiAgICB0aGlzLmVsUGF0aEdyb3VwLmlubmVySFRNTCA9IGBgO1xuICAgIGxldCBncm91cHMgPSB0aGlzLnBhcmVudC5HZXRHcm91cE5hbWUoKTtcbiAgICBsZXQgbGVuID0gZ3JvdXBzLmxlbmd0aCAtIDE7XG4gICAgaWYgKGxlbiA8IDApIHJldHVybjtcbiAgICBsZXQgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICB0ZXh0LmlubmVySFRNTCA9IGBSb290YDtcbiAgICB0aGlzLmVsUGF0aEdyb3VwLmFwcGVuZENoaWxkKHRleHQpO1xuICAgIHRoaXMuYnRuQmFjay5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XG4gICAgZm9yIChsZXQgaW5kZXggPSBsZW47IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgIGxldCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgdGV4dC5pbm5lckhUTUwgPSBgPj4ke2dyb3Vwc1tpbmRleF19YDtcbiAgICAgIHRoaXMuZWxQYXRoR3JvdXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyByZW5kZXJVSSgpIHtcbiAgICBpZiAoIXRoaXMuZWxOb2RlKSByZXR1cm47XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgdGhpcy5idG5CYWNrLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuQmFja0dyb3VwKCkpO1xuICAgIHRoaXMuYnRuQmFjay5pbm5lckhUTUwgPSBgQmFja2A7XG4gICAgbGV0IGJ0blpvb21JbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21Jbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucGFyZW50Lnpvb21faW4oKSk7XG4gICAgYnRuWm9vbUluLmlubmVySFRNTCA9IGArYDtcbiAgICBsZXQgYnRuWm9vbU91dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21PdXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnBhcmVudC56b29tX291dCgpKTtcbiAgICBidG5ab29tT3V0LmlubmVySFRNTCA9IGAtYDtcbiAgICBsZXQgYnRuWm9vbVJlc2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYnRuWm9vbVJlc2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuem9vbV9yZXNldCgpKTtcbiAgICBidG5ab29tUmVzZXQuaW5uZXJIVE1MID0gYCpgO1xuICAgIGxldCBidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGJ1dHRvbkdyb3VwLmNsYXNzTGlzdC5hZGQoJ3Rvb2xiYXItYnV0dG9uJylcbiAgICBidXR0b25Hcm91cC5hcHBlbmRDaGlsZCh0aGlzLmJ0bkJhY2spO1xuICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKGJ0blpvb21Jbik7XG4gICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuWm9vbU91dCk7XG4gICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQoYnRuWm9vbVJlc2V0KTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aEdyb3VwKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChidXR0b25Hcm91cCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93LCBFdmVudEVudW0sIERhdGFGbG93LCBEYXRhVmlldyB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5cbmNvbnN0IGdldmFsID0gZXZhbDtcbmV4cG9ydCBjbGFzcyBOb2RlIGV4dGVuZHMgQmFzZUZsb3c8RGVzZ2luZXJWaWV3PiB7XG4gIC8qKlxuICAgKiBHRVQgU0VUIGZvciBEYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0TmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnbmFtZScpO1xuICB9XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneScpO1xuICB9XG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3gnKTtcbiAgfVxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3gnLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIENoZWNrS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2tleScpID09IGtleTtcbiAgfVxuICBwdWJsaWMgZ2V0RGF0YUxpbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2xpbmVzJykgPz8gW107XG4gIH1cbiAgcHVibGljIGNoZWNrTGluZUV4aXN0cyhmcm9tSW5kZXg6IG51bWJlciwgdG86IE5vZGUsIHRvSW5kZXg6IE51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmFyckxpbmUuZmlsdGVyKChpdGVtOiBMaW5lKSA9PiB7XG4gICAgICBpZiAoIWl0ZW0udGVtcCAmJiBpdGVtLnRvID09IHRvICYmIGl0ZW0udG9JbmRleCA9PSB0b0luZGV4ICYmIGl0ZW0uZnJvbUluZGV4ID09IGZyb21JbmRleCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghaXRlbS50ZW1wICYmIGl0ZW0uZnJvbSA9PSB0byAmJiBpdGVtLmZyb21JbmRleCA9PSB0b0luZGV4ICYmIGl0ZW0udG9JbmRleCA9PSBmcm9tSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9KS5sZW5ndGggPiAwO1xuICB9XG4gIHB1YmxpYyBlbENvbnRlbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgYXJyTGluZTogTGluZVtdID0gW107XG4gIHByaXZhdGUgb3B0aW9uOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBhcnJEYXRhVmlldzogRGF0YVZpZXdbXSA9IFtdO1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBEZXNnaW5lclZpZXcsIHByaXZhdGUga2V5Tm9kZTogYW55LCBkYXRhOiBhbnkgPSB7fSkge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5vcHRpb24gPSB0aGlzLnBhcmVudC5tYWluLmdldENvbnRyb2xOb2RlQnlLZXkoa2V5Tm9kZSk7XG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5vcHRpb24/LnByb3BlcnRpZXM7XG4gICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kYXRhLkluaXREYXRhKGRhdGEsIHRoaXMucHJvcGVydGllcyk7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhLkFwcGVuZCgnbm9kZXMnLCB0aGlzLmRhdGEpO1xuICAgIH1cbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtbm9kZScpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9uLmNsYXNzKTtcbiAgICB9XG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnbm9kZS1pZCcsIHRoaXMuR2V0SWQoKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMucmVuZGVyVUkoKTtcbiAgfVxuICBwdWJsaWMgZ2V0T3B0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbjtcbiAgfVxuICBwcml2YXRlIHJlbmRlclVJKCkge1xuICAgIGlmICh0aGlzLmVsTm9kZS5jb250YWlucyhkb2N1bWVudC5hY3RpdmVFbGVtZW50KSkgcmV0dXJuO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApO1xuICAgIGlmICh0aGlzLmdldE9wdGlvbigpPy5oaWRlVGl0bGUgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS10b3BcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJib2R5XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3R0b21cIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtcmlnaHRcIj48L2Rpdj5cbiAgICBgO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1sZWZ0XCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtdG9wXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnRcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj4ke3RoaXMub3B0aW9uLmljb259ICR7dGhpcy5nZXROYW1lKCl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWJvdHRvbVwiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1yaWdodFwiPjwvZGl2PlxuICAgIGA7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkTm9kZURvdCA9IChudW06IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQsIHN0YXJ0OiBudW1iZXIsIHF1ZXJ5OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChudW0pIHtcbiAgICAgICAgbGV0IG5vZGVRdWVyeSA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IocXVlcnkpO1xuICAgICAgICBpZiAobm9kZVF1ZXJ5KSB7XG4gICAgICAgICAgbm9kZVF1ZXJ5LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICAgICAgbGV0IG5vZGVEb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIG5vZGVEb3QuY2xhc3NMaXN0LmFkZCgnbm9kZS1kb3QnKTtcbiAgICAgICAgICAgIG5vZGVEb3Quc2V0QXR0cmlidXRlKCdub2RlJywgYCR7c3RhcnQgKyBpfWApO1xuICAgICAgICAgICAgbm9kZVF1ZXJ5LmFwcGVuZENoaWxkKG5vZGVEb3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LmxlZnQsIDEwMDAsICcubm9kZS1sZWZ0Jyk7XG4gICAgYWRkTm9kZURvdCh0aGlzLm9wdGlvbj8uZG90Py50b3AsIDIwMDAsICcubm9kZS10b3AnKTtcbiAgICBhZGROb2RlRG90KHRoaXMub3B0aW9uPy5kb3Q/LmJvdHRvbSwgMzAwMCwgJy5ub2RlLWJvdHRvbScpO1xuICAgIGFkZE5vZGVEb3QodGhpcy5vcHRpb24/LmRvdD8ucmlnaHQsIDQwMDAsICcubm9kZS1yaWdodCcpO1xuXG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcubm9kZS1jb250ZW50IC5ib2R5JykgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5wYXJlbnQubWFpbi5yZW5kZXJIdG1sKHRoaXMsIHRoaXMuZWxDb250ZW50KTtcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgZ2V2YWwoYChub2RlLHZpZXcpPT57JHt0aGlzLm9wdGlvbi5zY3JpcHR9fWApKHRoaXMsIHRoaXMucGFyZW50KTtcbiAgICB0aGlzLmFyckRhdGFWaWV3LmZvckVhY2goKGl0ZW0pID0+IGl0ZW0udW5CaW5kRGF0YSgpKTtcbiAgICBpZiAodGhpcy5lbENvbnRlbnQpXG4gICAgICB0aGlzLmFyckRhdGFWaWV3ID0gRGF0YVZpZXcuQmluZFZpZXcodGhpcy5kYXRhLCB0aGlzLmVsQ29udGVudCk7XG4gIH1cbiAgcHVibGljIG9wZW5Hcm91cCgpIHtcbiAgICBpZiAodGhpcy5DaGVja0tleSgnbm9kZV9ncm91cCcpKSB7XG4gICAgICB0aGlzLnBhcmVudC5vcGVuR3JvdXAodGhpcy5HZXRJZCgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgbGV0IHRlbXB4ID0geDtcbiAgICAgIGxldCB0ZW1weSA9IHk7XG4gICAgICBpZiAoIWlDaGVjaykge1xuICAgICAgICB0ZW1weSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgLSB5KTtcbiAgICAgICAgdGVtcHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCAtIHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB4ICE9PSB0aGlzLmdldFgoKSkge1xuICAgICAgICB0aGlzLnNldFgodGVtcHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB5ICE9PSB0aGlzLmdldFkoKSkge1xuICAgICAgICB0aGlzLnNldFkodGVtcHkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgQWN0aXZlKGZsZzogYW55ID0gdHJ1ZSkge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFJlbW92ZUxpbmUobGluZTogTGluZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuYXJyTGluZS5pbmRleE9mKGxpbmUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gIH1cbiAgcHVibGljIGdldFBvc3Rpc2lvbkRvdChpbmRleDogbnVtYmVyID0gMCkge1xuICAgIGxldCBlbERvdDogYW55ID0gdGhpcy5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3IoYC5ub2RlLWRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcbiAgICBpZiAoZWxEb3QpIHtcbiAgICAgIGxldCB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCArIGVsRG90Lm9mZnNldFRvcCArIDEwKTtcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0ICsgMTApO1xuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCkge1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMuZ2V0WSgpfXB4OyBsZWZ0OiAke3RoaXMuZ2V0WCgpfXB4O2ApO1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLlVwZGF0ZVVJKCk7XG4gICAgfSlcbiAgfVxuICBwdWJsaWMgZGVsZXRlKGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLmRlbGV0ZSh0aGlzLCBpc0NsZWFyRGF0YSkpO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMuZGF0YS5kZWxldGUoKTtcbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuUmVtb3ZlRGF0YUV2ZW50KCk7XG4gICAgfVxuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcbiAgICBpZiAoaXNDbGVhckRhdGEpXG4gICAgICB0aGlzLnBhcmVudC5SZW1vdmVOb2RlKHRoaXMpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBSZW5kZXJMaW5lKCkge1xuICAgIHRoaXMuZ2V0RGF0YUxpbmUoKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVGcm9tID0gdGhpcztcbiAgICAgIGxldCBub2RlVG8gPSB0aGlzLnBhcmVudC5HZXROb2RlQnlJZChpdGVtLkdldCgndG8nKSk7XG4gICAgICBsZXQgdG9JbmRleCA9IGl0ZW0uR2V0KCd0b0luZGV4Jyk7XG4gICAgICBsZXQgZnJvbUluZGV4ID0gaXRlbS5HZXQoJ2Zyb21JbmRleCcpO1xuICAgICAgbmV3IExpbmUobm9kZUZyb20sIGZyb21JbmRleCwgbm9kZVRvLCB0b0luZGV4LCBpdGVtKS5VcGRhdGVVSSgpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdywgRmxvd0NvcmUsIElNYWluLCBFdmVudEVudW0sIFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL2luZGV4XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfRXZlbnQgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdfRXZlbnRcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlld19Ub29sYmFyIH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3X1Rvb2xiYXJcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4vTm9kZVwiO1xuXG5leHBvcnQgY29uc3QgWm9vbSA9IHtcbiAgbWF4OiAxLjYsXG4gIG1pbjogMC42LFxuICB2YWx1ZTogMC4xLFxuICBkZWZhdWx0OiAxXG59XG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3IGV4dGVuZHMgRmxvd0NvcmUge1xuXG4gIC8qKlxuICAgKiBHRVQgU0VUIGZvciBEYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0Wm9vbSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd6b29tJyk7XG4gIH1cbiAgcHVibGljIHNldFpvb20odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgnem9vbScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd5Jyk7XG4gIH1cbiAgcHVibGljIHNldFkodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZ2V0RGF0YUdyb3VwKCkuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmdldERhdGFHcm91cCgpLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwcml2YXRlIGdyb3VwRGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgbGFzdEdyb3VwTmFtZTogc3RyaW5nID0gXCJcIjtcbiAgcHJpdmF0ZSBnZXREYXRhR3JvdXAoKTogRGF0YUZsb3cge1xuICAgIGlmICh0aGlzLiRsb2NrKSByZXR1cm4gdGhpcy5kYXRhO1xuICAgIC8vIGNhY2hlIGdyb3VwRGF0YVxuICAgIGlmICh0aGlzLmxhc3RHcm91cE5hbWUgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpIHJldHVybiB0aGlzLmdyb3VwRGF0YSA/PyB0aGlzLmRhdGE7XG4gICAgdGhpcy5sYXN0R3JvdXBOYW1lID0gdGhpcy5DdXJyZW50R3JvdXAoKTtcbiAgICBsZXQgZ3JvdXBzID0gdGhpcy5kYXRhLkdldCgnZ3JvdXBzJyk7XG4gICAgdGhpcy5ncm91cERhdGEgPSBncm91cHM/LmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KCdncm91cCcpID09IHRoaXMubGFzdEdyb3VwTmFtZSk/LlswXTtcblxuICAgIGlmICghdGhpcy5ncm91cERhdGEpIHtcbiAgICAgIHRoaXMuZ3JvdXBEYXRhID0gbmV3IERhdGFGbG93KHRoaXMubWFpbiwge1xuICAgICAgICBrZXk6IFByb3BlcnR5RW51bS5ncm91cENhdmFzLFxuICAgICAgICBncm91cDogdGhpcy5sYXN0R3JvdXBOYW1lXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGF0YS5BcHBlbmQoJ2dyb3VwcycsIHRoaXMuZ3JvdXBEYXRhKTtcbiAgICAgIHRoaXMuZ3JvdXBEYXRhLm9uU2FmZShFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5VcGRhdGVVSS5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ncm91cERhdGEub25TYWZlKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLlVwZGF0ZVVJLmJpbmQodGhpcykpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ncm91cERhdGE7XG4gIH1cbiAgcHJpdmF0ZSBncm91cDogYW55W10gPSBbXTtcbiAgcHVibGljIEdldEdyb3VwTmFtZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuZ3JvdXAubWFwKChpdGVtKSA9PiB0aGlzLkdldERhdGFCeUlkKGl0ZW0pPy5HZXQoJ25hbWUnKSk7XG4gIH1cbiAgcHVibGljIEJhY2tHcm91cCgpIHtcbiAgICB0aGlzLmdyb3VwLnNwbGljZSgwLCAxKTtcbiAgICB0aGlzLnRvb2xiYXIucmVuZGVyUGF0aEdyb3VwKCk7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBDdXJyZW50R3JvdXAoKSB7XG4gICAgbGV0IG5hbWUgPSB0aGlzLmdyb3VwPy5bMF07XG5cbiAgICBpZiAobmFtZSAmJiBuYW1lICE9ICcnKSB7XG4gICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG4gICAgcmV0dXJuICdyb290JztcbiAgfVxuICBwdWJsaWMgb3Blbkdyb3VwKGlkOiBhbnkpIHtcbiAgICB0aGlzLmdyb3VwID0gW2lkLCAuLi50aGlzLmdyb3VwXTtcbiAgICB0aGlzLnRvb2xiYXIucmVuZGVyUGF0aEdyb3VwKCk7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHByaXZhdGUgbGluZUNob29zZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldExpbmVDaG9vc2Uobm9kZTogTGluZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHRoaXMubGluZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubGluZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkge1xuICAgICAgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRMaW5lQ2hvb3NlKCk6IExpbmUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmxpbmVDaG9vc2U7XG4gIH1cbiAgcHJpdmF0ZSBub2RlczogTm9kZVtdID0gW107XG4gIHByaXZhdGUgbm9kZUNob29zZTogTm9kZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHNldE5vZGVDaG9vc2Uobm9kZTogTm9kZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHRoaXMubm9kZUNob29zZS5BY3RpdmUoZmFsc2UpO1xuICAgIHRoaXMubm9kZUNob29zZSA9IG5vZGU7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkge1xuICAgICAgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZSgpO1xuICAgICAgdGhpcy5zZXRMaW5lQ2hvb3NlKHVuZGVmaW5lZCk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5ub2RlQ2hvb3NlLmRhdGEgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLmRhdGEgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXROb2RlQ2hvb3NlKCk6IE5vZGUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLm5vZGVDaG9vc2U7XG4gIH1cbiAgcHVibGljIEFkZE5vZGVJdGVtKGRhdGE6IGFueSk6IE5vZGUge1xuICAgIHJldHVybiB0aGlzLkFkZE5vZGUoZGF0YS5HZXQoJ2tleScpLCBkYXRhKTtcbiAgfVxuICBwdWJsaWMgQWRkTm9kZShrZXlOb2RlOiBzdHJpbmcsIGRhdGE6IGFueSA9IHt9KTogTm9kZSB7XG4gICAgcmV0dXJuIHRoaXMuSW5zZXJ0Tm9kZShuZXcgTm9kZSh0aGlzLCBrZXlOb2RlLCBkYXRhKSk7XG4gIH1cbiAgcHVibGljIEluc2VydE5vZGUobm9kZTogTm9kZSk6IE5vZGUge1xuICAgIHRoaXMubm9kZXMgPSBbLi4udGhpcy5ub2Rlcywgbm9kZV07XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbiAgcHVibGljIFJlbW92ZU5vZGUobm9kZTogTm9kZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICB0aGlzLmRhdGEuUmVtb3ZlKCdub2RlcycsIG5vZGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xuICB9XG4gIHB1YmxpYyBDbGVhck5vZGUoKSB7XG4gICAgdGhpcy5ub2Rlcz8uZm9yRWFjaChpdGVtID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICB9XG4gIHB1YmxpYyBHZXREYXRhQWxsTm9kZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuICh0aGlzLmRhdGEuR2V0KCdub2RlcycpID8/IFtdKTtcbiAgfVxuICBwdWJsaWMgR2V0RGF0YU5vZGUoKTogYW55W10ge1xuICAgIHJldHVybiB0aGlzLkdldERhdGFBbGxOb2RlKCkuZmlsdGVyKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS5HZXQoXCJncm91cFwiKSA9PT0gdGhpcy5DdXJyZW50R3JvdXAoKSk7XG4gIH1cbiAgLyoqXG4gICAqIFZhcmlidXRlXG4gICovXG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIGVsVG9vbGJhcjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgcHVibGljIHRvb2xiYXI6IERlc2dpbmVyVmlld19Ub29sYmFyO1xuICBwdWJsaWMgJGxvY2s6IGJvb2xlYW4gPSB0cnVlO1xuICBwcml2YXRlIHpvb21fbGFzdF92YWx1ZTogYW55ID0gMTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGVsTm9kZTogSFRNTEVsZW1lbnQsIHB1YmxpYyBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5lbE5vZGUgPSBlbE5vZGU7XG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IHRoaXMubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5tYWluKTtcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoe30sIHByb3BlcnRpZXMpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICcnO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2Rlc2dpbmVyLXZpZXcnKVxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LnJlbW92ZShcImRlc2dpbmVyLWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdkZXNnaW5lci12aWV3JylcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5hZGQoXCJkZXNnaW5lci1jYW52YXNcIik7XG4gICAgdGhpcy5lbFRvb2xiYXIuY2xhc3NMaXN0LmFkZChcImRlc2dpbmVyLXRvb2xiYXJcIik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbENhbnZhcyk7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbFRvb2xiYXIpO1xuICAgIHRoaXMuZWxOb2RlLnRhYkluZGV4ID0gMDtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gICAgdGhpcy5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5SZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICBuZXcgRGVzZ2luZXJWaWV3X0V2ZW50KHRoaXMpO1xuICAgIHRoaXMudG9vbGJhciA9IG5ldyBEZXNnaW5lclZpZXdfVG9vbGJhcih0aGlzKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVWaWV3KHg6IGFueSwgeTogYW55LCB6b29tOiBhbnkpIHtcbiAgICB0aGlzLmVsQ2FudmFzLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt4fXB4LCAke3l9cHgpIHNjYWxlKCR7em9vbX0pYDtcbiAgfVxuICBwdWJsaWMgVXBkYXRlVUkoKSB7XG4gICAgdGhpcy51cGRhdGVWaWV3KHRoaXMuZ2V0WCgpLCB0aGlzLmdldFkoKSwgdGhpcy5nZXRab29tKCkpO1xuICB9XG4gIHB1YmxpYyBSZW5kZXJVSShkZXRhaWw6IGFueSA9IHt9KSB7XG4gICAgaWYgKGRldGFpbC5zZW5kZXIgJiYgZGV0YWlsLnNlbmRlciBpbnN0YW5jZW9mIE5vZGUpIHJldHVybjtcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgRGVzZ2luZXJWaWV3KSB7XG4gICAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuQ2xlYXJOb2RlKCk7XG4gICAgdGhpcy5HZXREYXRhTm9kZSgpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy5BZGROb2RlSXRlbShpdGVtKTtcbiAgICB9KTtcbiAgICB0aGlzLkdldEFsbE5vZGUoKS5mb3JFYWNoKChpdGVtOiBOb2RlKSA9PiB7XG4gICAgICBpdGVtLlJlbmRlckxpbmUoKTtcbiAgICB9KVxuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgfVxuICBwdWJsaWMgT3BlbigkZGF0YTogRGF0YUZsb3cpIHtcbiAgICB0aGlzLmRhdGEgPSAkZGF0YTtcbiAgICB0aGlzLiRsb2NrID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0R3JvdXBOYW1lID0gJyc7XG4gICAgdGhpcy5ncm91cERhdGEgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5ncm91cCA9IFtdO1xuICAgIHRoaXMudG9vbGJhci5yZW5kZXJQYXRoR3JvdXAoKTtcbiAgICB0aGlzLkJpbmREYXRhRXZlbnQoKTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gIH1cbiAgcHVibGljIENhbGNYKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudFdpZHRoIC8gKHRoaXMuZWxOb2RlPy5jbGllbnRXaWR0aCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHVibGljIENhbGNZKG51bWJlcjogYW55KSB7XG4gICAgcmV0dXJuIG51bWJlciAqICh0aGlzLmVsQ2FudmFzLmNsaWVudEhlaWdodCAvICh0aGlzLmVsTm9kZT8uY2xpZW50SGVpZ2h0ICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwdWJsaWMgR2V0QWxsTm9kZSgpOiBOb2RlW10ge1xuICAgIHJldHVybiB0aGlzLm5vZGVzIHx8IFtdO1xuICB9XG4gIHB1YmxpYyBHZXROb2RlQnlJZChpZDogc3RyaW5nKTogTm9kZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuR2V0QWxsTm9kZSgpLmZpbHRlcihub2RlID0+IG5vZGUuR2V0SWQoKSA9PSBpZCk/LlswXTtcbiAgfVxuXG4gIHB1YmxpYyBHZXREYXRhQnlJZChpZDogc3RyaW5nKTogRGF0YUZsb3cgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQWxsTm9kZSgpLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5HZXQoJ2lkJykgPT09IGlkKT8uWzBdO1xuICB9XG4gIGNoZWNrT25seU5vZGUoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gKHRoaXMubWFpbi5nZXRDb250cm9sQnlLZXkoa2V5KS5vbmx5Tm9kZSkgJiYgdGhpcy5ub2Rlcy5maWx0ZXIoaXRlbSA9PiBpdGVtLkNoZWNrS2V5KGtleSkpLmxlbmd0aCA+IDA7XG4gIH1cbiAgcHVibGljIHpvb21fcmVmcmVzaChmbGc6IGFueSA9IDApIHtcbiAgICBsZXQgdGVtcF96b29tID0gZmxnID09IDAgPyBab29tLmRlZmF1bHQgOiAodGhpcy5nZXRab29tKCkgKyBab29tLnZhbHVlICogZmxnKTtcbiAgICBpZiAoWm9vbS5tYXggPj0gdGVtcF96b29tICYmIHRlbXBfem9vbSA+PSBab29tLm1pbikge1xuICAgICAgdGhpcy5zZXRYKCh0aGlzLmdldFgoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XG4gICAgICB0aGlzLnNldFkoKHRoaXMuZ2V0WSgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGVtcF96b29tKTtcbiAgICAgIHRoaXMuem9vbV9sYXN0X3ZhbHVlID0gdGVtcF96b29tO1xuICAgICAgdGhpcy5zZXRab29tKHRoaXMuem9vbV9sYXN0X3ZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHpvb21faW4oKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMSk7XG4gIH1cbiAgcHVibGljIHpvb21fb3V0KCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKC0xKTtcbiAgfVxuICBwdWJsaWMgem9vbV9yZXNldCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgwKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuLi9kZXNnaW5lci9EZXNnaW5lclZpZXdcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFZpZXdEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwcml2YXRlIHZpZXc6IERlc2dpbmVyVmlldyB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG5cbiAgICB0aGlzLnZpZXcgPSBuZXcgRGVzZ2luZXJWaWV3KHRoaXMuZWxOb2RlLCBtYWluKTtcbiAgICB0aGlzLnZpZXcub24oRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgKGRhdGE6IGFueSkgPT4geyBtYWluLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIGRhdGEpOyB9KTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCAoaXRlbTogYW55KSA9PiB7XG4gICAgICB0aGlzLnZpZXc/Lk9wZW4oaXRlbS5kYXRhKTtcbiAgICAgIHRoaXMubWFpbi5zZXRQcm9qZWN0T3BlbihpdGVtLmRhdGEpO1xuICAgIH0pXG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IERvY2tFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IENvbnRyb2xEb2NrIH0gZnJvbSBcIi4vQ29udHJvbERvY2tcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcbmltcG9ydCB7IFByb2plY3REb2NrIH0gZnJvbSBcIi4vUHJvamVjdERvY2tcIjtcbmltcG9ydCB7IFByb3BlcnR5RG9jayB9IGZyb20gXCIuL1Byb3BlcnR5RG9ja1wiO1xuaW1wb3J0IHsgVGFiRG9jayB9IGZyb20gXCIuL1RhYkRvY2tcIjtcbmltcG9ydCB7IFZpZXdEb2NrIH0gZnJvbSBcIi4vVmlld0RvY2tcIjtcblxuZXhwb3J0IGNsYXNzIERvY2tNYW5hZ2VyIHtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHsgfVxuICBwdWJsaWMgcmVzZXQoKSB7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIgPSB7fTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgQ29udHJvbERvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5sZWZ0LCBQcm9qZWN0RG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnJpZ2h0LCBQcm9wZXJ0eURvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS52aWV3LCBWaWV3RG9jayk7XG4gIC8vICB0aGlzLmFkZERvY2soRG9ja0VudW0udG9wLCBUYWJEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0uYm90dG9tLCBEb2NrQmFzZSk7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBhZGREb2NrKCRrZXk6IHN0cmluZywgJHZpZXc6IGFueSkge1xuICAgIGlmICghdGhpcy4kZG9ja01hbmFnZXJbJGtleV0pXG4gICAgICB0aGlzLiRkb2NrTWFuYWdlclska2V5XSA9IFtdO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gWy4uLnRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldLCAkdmlld107XG4gIH1cblxuICBwdWJsaWMgUmVuZGVyVUkoKSB7XG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInZzLWxlZnQgdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZzLWNvbnRlbnRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXRvcCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy12aWV3IHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLWJvdHRvbSB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1yaWdodCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgYDtcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRkb2NrTWFuYWdlcikuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBxdWVyeVNlbGVjdG9yID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLiR7a2V5fWApO1xuICAgICAgaWYgKHF1ZXJ5U2VsZWN0b3IpIHtcbiAgICAgICAgdGhpcy4kZG9ja01hbmFnZXJba2V5XS5mb3JFYWNoKCgkaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgbmV3ICRpdGVtKHF1ZXJ5U2VsZWN0b3IsIHRoaXMubWFpbik7XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsImV4cG9ydCBjb25zdCBDb250cm9sID0ge1xuICBub2RlX2JlZ2luOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXBsYXlcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdCZWdpbicsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGNsYXNzOiAnbm9kZS10ZXN0JyxcbiAgICBodG1sOiAnJyxcbiAgICBkb3Q6IHtcbiAgICAgIHRvcDogMCxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgbGVmdDogMCxcbiAgICAgIGJvdHRvbTogMSxcbiAgICB9LFxuICAgIG9ubHlOb2RlOiB0cnVlXG4gIH0sXG4gIG5vZGVfZW5kOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3BcIj48L2k+JyxcbiAgICBzb3J0OiAwLFxuICAgIG5hbWU6ICdFbmQnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnJyxcbiAgICBkb3Q6IHtcbiAgICAgIGxlZnQ6IDAsXG4gICAgICB0b3A6IDEsXG4gICAgICByaWdodDogMCxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIG9ubHlOb2RlOiB0cnVlXG4gIH0sXG4gIG5vZGVfaWY6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtZXF1YWxzXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnSWYnLFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiAnPGRpdj5jb25kaXRpb246PGJyLz48aW5wdXQgbm9kZTptb2RlbD1cImNvbmRpdGlvblwiLz48L2Rpdj4nLFxuICAgIHNjcmlwdDogYGAsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH1cbiAgICB9LFxuICAgIG91dHB1dDogMlxuICB9LFxuICBub2RlX2dyb3VwOiB7XG4gICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLW9iamVjdC1ncm91cFwiPjwvaT4nLFxuICAgIHNvcnQ6IDAsXG4gICAgbmFtZTogJ0dyb3VwJyxcbiAgICBncm91cDogJ2NvbW1vbicsXG4gICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwIG5vZGUtZm9ybS1jb250cm9sXCI+R288L2J1dHRvbj48L2Rpdj4nLFxuICAgIHNjcmlwdDogYG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge25vZGUub3Blbkdyb3VwKCl9KTtgLFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIGNvbmRpdGlvbjoge1xuICAgICAgICBrZXk6IFwiY29uZGl0aW9uXCIsXG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9XG4gICAgfSxcbiAgICBvdXRwdXQ6IDJcbiAgfSxcbiAgbm9kZV9vcHRpb246IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnT3B0aW9uJyxcbiAgICBkb3Q6IHtcbiAgICAgIHRvcDogMSxcbiAgICAgIHJpZ2h0OiAwLFxuICAgICAgbGVmdDogMSxcbiAgICAgIGJvdHRvbTogMCxcbiAgICB9LFxuICAgIGdyb3VwOiAnY29tbW9uJyxcbiAgICBodG1sOiBgXG4gICAgPGRpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwMVwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDJcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGVudC1yb3dcIj48c3Bhbj5I4buNIHTDqm4gOjwvc3Bhbj48c3Bhbj48c3BhbiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjUwMDAzXCI+PC9zcGFuPjwvc3Bhbj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnQtcm93XCI+PHNwYW4+SOG7jSB0w6puIDo8L3NwYW4+PHNwYW4+PHNwYW4gY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCI1MDAwNFwiPjwvc3Bhbj48L3NwYW4+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50LXJvd1wiPjxzcGFuPkjhu40gdMOqbiA6PC9zcGFuPjxzcGFuPjxzcGFuIGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNTAwMDVcIj48L3NwYW4+PC9zcGFuPjwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGAsXG4gICAgc2NyaXB0OiBgbm9kZS5lbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7bm9kZS5vcGVuR3JvdXAoKX0pO2AsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgZGVmYXVsdDogJydcbiAgICAgIH1cbiAgICB9LFxuICAgIG91dHB1dDogMlxuICB9LFxuICBub2RlX3Byb2plY3Q6IHtcbiAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgc29ydDogMCxcbiAgICBuYW1lOiAnUHJvamVjdCcsXG4gICAgZ3JvdXA6ICdjb21tb24nLFxuICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48c2VsZWN0IGNsYXNzPVwibGlzdFByb2plY3Qgbm9kZS1mb3JtLWNvbnRyb2xcIiBub2RlOm1vZGVsPVwicHJvamVjdFwiPjwvc2VsZWN0PjwvZGl2PicsXG4gICAgc2NyaXB0OiBgXG4gICAgY29uc3QgcmVsb2FkUHJvamVjdCA9ICgpPT57XG4gICAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcubGlzdFByb2plY3QnKS5pbm5lckh0bWw9Jyc7XG4gICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICBvcHRpb24udGV4dD0nbm9uZSc7XG4gICAgICBvcHRpb24udmFsdWU9Jyc7XG4gICAgICBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcubGlzdFByb2plY3QnKS5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgbm9kZS5wYXJlbnQubWFpbi5nZXRQcm9qZWN0QWxsKCkuZm9yRWFjaCgoaXRlbSk9PntcbiAgICAgICAgbGV0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgICBvcHRpb24udGV4dD1pdGVtLkdldCgnbmFtZScpO1xuICAgICAgICBvcHRpb24udmFsdWU9aXRlbS5HZXQoJ2lkJyk7XG4gICAgICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5saXN0UHJvamVjdCcpLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgICB9KTtcbiAgICAgIG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5saXN0UHJvamVjdCcpLnZhbHVlPSBub2RlLmRhdGEuR2V0KCdwcm9qZWN0JylcbiAgICB9XG4gICAgcmVsb2FkUHJvamVjdCgpO1xuXG4gICA7YCxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBwcm9qZWN0OiB7XG4gICAgICAgIGtleTogXCJwcm9qZWN0XCIsXG4gICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICB9XG4gICAgfSxcbiAgfSxcbn1cbiIsImltcG9ydCB7IERhdGFGbG93LCBJTWFpbiwgY29tcGFyZVNvcnQsIEV2ZW50RW51bSwgUHJvcGVydHlFbnVtLCBFdmVudEZsb3csIGdldFRpbWUgfSBmcm9tIFwiLi4vY29yZS9pbmRleFwiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuLi9kZXNnaW5lci9pbmRleFwiO1xuaW1wb3J0IHsgQ29udHJvbCB9IGZyb20gXCIuL2NvbnRyb2xcIjtcblxuZXhwb3J0IGNsYXNzIFN5c3RlbUJhc2UgaW1wbGVtZW50cyBJTWFpbiB7XG4gIHByaXZhdGUgJGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KHRoaXMpO1xuICBwcml2YXRlICRwcm9qZWN0T3BlbjogYW55O1xuICBwcml2YXRlICRwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSAkY29udHJvbDogYW55ID0ge307XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3cgPSBuZXcgRXZlbnRGbG93KCk7XG4gIHByaXZhdGUgJGNvbnRyb2xDaG9vc2U6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlICRjaGVja09wdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XG4gICAgLy9zZXQgcHJvamVjdFxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLnNvbHV0aW9uXSA9IHtcbiAgICAgIGlkOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxuICAgICAgfSxcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0uc29sdXRpb25cbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGBzb2x1dGlvbi0ke2dldFRpbWUoKX1gXG4gICAgICB9LFxuICAgICAgcHJvamVjdHM6IHtcbiAgICAgICAgZGVmYXVsdDogW11cbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLmxpbmVdID0ge1xuICAgICAga2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFByb3BlcnR5RW51bS5saW5lXG4gICAgICB9LFxuICAgICAgZnJvbToge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgZnJvbUluZGV4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB0bzoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgdG9JbmRleDoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9XG4gICAgfTtcbiAgICAvL3NldCBwcm9qZWN0XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0ubWFpbl0gPSB7XG4gICAgICBpZDoge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGBGbG93LSR7Z2V0VGltZSgpfWBcbiAgICAgIH0sXG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLm1haW5cbiAgICAgIH0sXG4gICAgICBncm91cHM6IHtcbiAgICAgICAgZGVmYXVsdDogW11cbiAgICAgIH0sXG4gICAgICBub2Rlczoge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0uZ3JvdXBDYXZhc10gPSB7XG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLmdyb3VwQ2F2YXNcbiAgICAgIH0sXG4gICAgICBncm91cDoge1xuICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgfSxcbiAgICAgIHg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHk6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHpvb206IHtcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICB9XG4gIH1cbiAgZXhwb3J0SnNvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS50b0pzb24oKTtcbiAgfVxuICBwdWJsaWMgY2hlY2tJbml0T3B0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLiRjaGVja09wdGlvbjtcbiAgfVxuICBpbml0T3B0aW9uKG9wdGlvbjogYW55LCBpc0RlZmF1bHQ6IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgdGhpcy4kY2hlY2tPcHRpb24gPSB0cnVlO1xuICAgIC8vIHNldCBjb250cm9sXG4gICAgdGhpcy4kY29udHJvbCA9IGlzRGVmYXVsdCA/IHsgLi4ub3B0aW9uPy5jb250cm9sIHx8IHt9LCAuLi5Db250cm9sIH0gOiB7IC4uLm9wdGlvbj8uY29udHJvbCB8fCB7fSB9O1xuICAgIGxldCBjb250cm9sVGVtcDogYW55ID0ge307XG4gICAgT2JqZWN0LmtleXModGhpcy4kY29udHJvbCkubWFwKChrZXkpID0+ICh7IC4uLnRoaXMuJGNvbnRyb2xba2V5XSwga2V5LCBzb3J0OiAodGhpcy4kY29udHJvbFtrZXldLnNvcnQgPT09IHVuZGVmaW5lZCA/IDk5OTk5IDogdGhpcy4kY29udHJvbFtrZXldLnNvcnQpIH0pKS5zb3J0KGNvbXBhcmVTb3J0KS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIGNvbnRyb2xUZW1wW2l0ZW0ua2V5XSA9IHtcbiAgICAgICAgZG90OiB7XG4gICAgICAgICAgbGVmdDogMSxcbiAgICAgICAgICB0b3A6IDEsXG4gICAgICAgICAgcmlnaHQ6IDEsXG4gICAgICAgICAgYm90dG9tOiAxLFxuICAgICAgICB9LFxuICAgICAgICAuLi5pdGVtXG4gICAgICB9O1xuICAgICAgdGhpcy4kcHJvcGVydGllc1tgbm9kZV8ke2l0ZW0ua2V5fWBdID0ge1xuICAgICAgICAuLi4oaXRlbS5wcm9wZXJ0aWVzIHx8IHt9KSxcbiAgICAgICAgaWQ6IHtcbiAgICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgICAgfSxcbiAgICAgICAga2V5OiB7XG4gICAgICAgICAgZGVmYXVsdDogaXRlbS5rZXlcbiAgICAgICAgfSxcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgIGRlZmF1bHQ6IGl0ZW0ua2V5XG4gICAgICAgIH0sXG4gICAgICAgIHg6IHtcbiAgICAgICAgICBkZWZhdWx0OiAwXG4gICAgICAgIH0sXG4gICAgICAgIHk6IHtcbiAgICAgICAgICBkZWZhdWx0OiAwXG4gICAgICAgIH0sXG4gICAgICAgIGdyb3VwOiB7XG4gICAgICAgICAgZGVmYXVsdDogJydcbiAgICAgICAgfSxcbiAgICAgICAgbGluZXM6IHtcbiAgICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgdGhpcy4kY29udHJvbCA9IGNvbnRyb2xUZW1wO1xuICB9XG4gIHJlbmRlckh0bWwobm9kZTogTm9kZSwgZWxQYXJlbnQ6IEVsZW1lbnQpIHtcbiAgICBlbFBhcmVudC5pbm5lckhUTUwgPSBub2RlLmdldE9wdGlvbigpPy5odG1sO1xuICB9XG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgdGhpcy5ldmVudHMuZGlzcGF0Y2goZXZlbnQsIGRldGFpbHMpO1xuICB9XG5cbiAgZ2V0Q29udHJvbEFsbCgpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbCA/PyB7fTtcbiAgfVxuICBnZXRQcm9qZWN0QWxsKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJykgPz8gW107XG4gIH1cbiAgaW1wb3J0SnNvbihkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLiRkYXRhLkluaXREYXRhKGRhdGEsIHRoaXMuZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0uc29sdXRpb24pKTtcbiAgfVxuICBzZXRQcm9qZWN0T3BlbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy4kcHJvamVjdE9wZW4gPSAkZGF0YTtcbiAgfVxuICBjaGVja1Byb2plY3RPcGVuKCRkYXRhOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvamVjdE9wZW4gPT0gJGRhdGE7XG4gIH1cbiAgbmV3UHJvamVjdCgpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Qcm9qZWN0KHt9KTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5uZXdQcm9qZWN0LCB7fSk7XG4gIH1cbiAgb3BlblByb2plY3QoJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIGlmICgkZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICBsZXQgJHByb2plY3Q6IGFueSA9IHRoaXMuZ2V0UHJvamVjdEJ5SWQoJGRhdGEuR2V0KCdpZCcpKTtcbiAgICAgIGlmICghJHByb2plY3QpIHtcbiAgICAgICAgJHByb2plY3QgPSAkZGF0YTtcbiAgICAgICAgdGhpcy4kZGF0YS5BcHBlbmQoJ3Byb2plY3RzJywgJHByb2plY3QpO1xuICAgICAgfVxuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsICRwcm9qZWN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGRhdGEgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gICAgICBkYXRhLkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLm1haW4pKTtcbiAgICAgIHRoaXMuJGRhdGEuQXBwZW5kKCdwcm9qZWN0cycsIGRhdGEpO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsIHsgZGF0YSB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7IGRhdGEgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRQcm9qZWN0QnlJZCgkaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKS5maWx0ZXIoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLkdldCgnaWQnKSA9PT0gJGlkKT8uWzBdO1xuICB9XG4gIHNldENvbnRyb2xDaG9vc2Uoa2V5OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy4kY29udHJvbENob29zZSA9IGtleTtcbiAgfVxuICBnZXRDb250cm9sQ2hvb3NlKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sQ2hvb3NlO1xuICB9XG4gIGdldENvbnRyb2xCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sW2tleV0gfHwge307XG4gIH1cbiAgZ2V0Q29udHJvbE5vZGVCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLmdldENvbnRyb2xCeUtleShrZXkpLFxuICAgICAgcHJvcGVydGllczogdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KGBub2RlXyR7a2V5fWApXG4gICAgfVxuICB9XG4gIGdldFByb3BlcnR5QnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvcGVydGllc1trZXldO1xuICB9XG5cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSAnLi9jb3JlL0Jhc2VGbG93JztcbmltcG9ydCB7IERvY2tNYW5hZ2VyIH0gZnJvbSAnLi9kb2NrL0RvY2tNYW5hZ2VyJztcbmltcG9ydCB7IFN5c3RlbUJhc2UgfSBmcm9tICcuL3N5c3RlbXMvU3lzdGVtQmFzZSc7XG5leHBvcnQgY2xhc3MgVmlzdWFsRmxvdyB7XG4gIHByaXZhdGUgbWFpbjogSU1haW4gfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgJGRvY2tNYW5hZ2VyOiBEb2NrTWFuYWdlcjtcbiAgcHVibGljIGdldERvY2tNYW5hZ2VyKCk6IERvY2tNYW5hZ2VyIHtcbiAgICByZXR1cm4gdGhpcy4kZG9ja01hbmFnZXI7XG4gIH1cbiAgcHVibGljIHNldE9wdGlvbihkYXRhOiBhbnksIGlzRGVmYXVsdDogYm9vbGVhbiA9IHRydWUpIHtcbiAgICB0aGlzLm1haW4/LmluaXRPcHRpb24oZGF0YSwgaXNEZWZhdWx0KTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlci5yZXNldCgpO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG1haW46IElNYWluIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5tYWluID0gbWFpbiA/PyBuZXcgU3lzdGVtQmFzZSgpO1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ3ZzLWNvbnRhaW5lcicpO1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ3ZzLWNvbnRhaW5lcicpO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyID0gbmV3IERvY2tNYW5hZ2VyKHRoaXMuY29udGFpbmVyLCB0aGlzLm1haW4pO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyLnJlc2V0KCk7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/Lm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/Lm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMubWFpbj8ucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLm1haW4/LmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgZ2V0TWFpbigpOiBJTWFpbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubWFpbjtcbiAgfVxuICBuZXdQcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8ubmV3UHJvamVjdCgkbmFtZSk7XG4gIH1cbiAgb3BlblByb2plY3QoJG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5vcGVuUHJvamVjdCgkbmFtZSk7XG4gIH1cbiAgZ2V0UHJvamVjdEFsbCgpOiBhbnlbXSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TWFpbigpPy5nZXRQcm9qZWN0QWxsKCk7XG4gIH1cbiAgc2V0UHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuZ2V0TWFpbigpPy5zZXRQcm9qZWN0T3BlbigkZGF0YSk7XG4gIH1cbiAgaW1wb3J0SnNvbihkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmdldE1haW4oKT8uaW1wb3J0SnNvbihkYXRhKTtcbiAgfVxuICBleHBvcnRKc29uKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TWFpbigpPy5leHBvcnRKc29uKCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBUYWJEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy10YWInKTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCAoZGV0YWlsOiBhbnkpID0+IHtcbiAgICAgIHRoaXMuZWxOb2RlPy5xdWVyeVNlbGVjdG9yQWxsKCcuYWN0aXZlJykuZm9yRWFjaCgoX25vZGUpID0+IHtcbiAgICAgICAgX25vZGUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLmVsTm9kZSAmJiBkZXRhaWw/LmRhdGE/LkdldCgnaWQnKSkge1xuICAgICAgICB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wcm9qZWN0LWlkPVwiJHtkZXRhaWw/LmRhdGE/LkdldCgnaWQnKX1cIl1gKT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5uZXdQcm9qZWN0LCB0aGlzLnJlbmRlci5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcbiAgICBsZXQgcHJvamVjdHMgPSB0aGlzLm1haW4uZ2V0UHJvamVjdEFsbCgpO1xuICAgIHByb2plY3RzLmZvckVhY2goKGl0ZW06IERhdGFGbG93KSA9PiB7XG4gICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ25vZGUtaXRlbScpO1xuICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QtaWQnLCBpdGVtLkdldCgnaWQnKSk7XG4gICAgICBpdGVtLnJlbW92ZUxpc3RlbmVyKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV9uYW1lYCwgKCkgPT4ge1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICB9KTtcbiAgICAgIGl0ZW0ub24oYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMubWFpbi5jaGVja1Byb2plY3RPcGVuKGl0ZW0pKSB7XG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubWFpbi5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsIHsgZGF0YTogaXRlbSB9KTtcbiAgICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogaXRlbSB9KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbE5vZGU/LmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgVmlzdWFsRmxvdyB9IGZyb20gXCIuL1Zpc3VhbEZsb3dcIjtcbmltcG9ydCB7IFN5c3RlbUJhc2UgfSBmcm9tIFwiLi9zeXN0ZW1zL1N5c3RlbUJhc2VcIjtcbmltcG9ydCAqIGFzIENvcmUgZnJvbSAnLi9jb3JlL2luZGV4JztcbmltcG9ydCAqIGFzIERlc2dpbmVyIGZyb20gXCIuL2Rlc2dpbmVyL2luZGV4XCI7XG5pbXBvcnQgKiBhcyBEb2NrIGZyb20gJy4vZG9jay9pbmRleCc7XG5leHBvcnQgZGVmYXVsdCB7XG4gIFZpc3VhbEZsb3csXG4gIFN5c3RlbUJhc2UsXG4gIC4uLkNvcmUsXG4gIC4uLkRvY2ssXG4gIC4uLkRlc2dpbmVyXG59O1xuXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFPLE1BQU0sU0FBUyxHQUFHO0FBQ3ZCLElBQUEsSUFBSSxFQUFFLE1BQU07QUFDWixJQUFBLFVBQVUsRUFBRSxZQUFZO0FBQ3hCLElBQUEsWUFBWSxFQUFFLGNBQWM7QUFDNUIsSUFBQSxXQUFXLEVBQUUsYUFBYTtBQUMxQixJQUFBLFVBQVUsRUFBRSxZQUFZO0FBQ3hCLElBQUEsTUFBTSxFQUFFLFFBQVE7QUFDaEIsSUFBQSxPQUFPLEVBQUUsU0FBUztDQUNuQixDQUFBO0FBRU0sTUFBTSxRQUFRLEdBQUc7QUFDdEIsSUFBQSxJQUFJLEVBQUUsU0FBUztB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
