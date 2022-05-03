
  /**
   * @license
   * author: Nguyen Van Hau
   * visualflow.js v0.0.1-beta2
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
    variable: 'main_variable'
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
            if (this.main.CheckProjectOpen(item)) {
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
    labelKeys = ['id', 'key', 'group'];
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
            if (this.main.CheckProjectOpen(item)) {
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
    constructor(parent) {
        this.parent = parent;
        this.elNode = parent.elToolbar;
        this.renderUI();
        this.renderPathGroup();
    }
    renderPathGroup() {
        this.elPathGroup.innerHTML = ``;
        let groups = this.parent.GetGroupName();
        let len = groups.length - 1;
        if (len < 0)
            return;
        let text = document.createElement('span');
        text.innerHTML = `Root`;
        this.elPathGroup.appendChild(text);
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
        let btnBack = document.createElement('button');
        btnBack.addEventListener('click', () => this.parent.BackGroup());
        btnBack.innerHTML = `Back`;
        let btnZoomIn = document.createElement('button');
        btnZoomIn.addEventListener('click', () => this.parent.zoom_in());
        btnZoomIn.innerHTML = `Zoom+`;
        let btnZoomOut = document.createElement('button');
        btnZoomOut.addEventListener('click', () => this.parent.zoom_out());
        btnZoomOut.innerHTML = `Zoom-`;
        this.elNode.appendChild(this.elPathGroup);
        this.elNode.appendChild(btnBack);
        this.elNode.appendChild(btnZoomIn);
        this.elNode.appendChild(btnZoomOut);
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
    elContent;
    arrLine = [];
    option = {};
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
        <div class="node-content">
        <div class="title">${this.option.icon} ${this.getName()}</div>
        <div class="body">${this.option.html}</div>
        </div>
        <div class="node-bottom">
          <div class="node-dot" node="2000"></div>
        </div>
      </div>
      <div class="node-right">
        <div class="node-dot"  node="3000"></div>
      </div>
    `;
        this.elContent = this.elNode.querySelector('.node-content .body');
        this.UpdateUI();
        geval(`(node,view)=>{${this.option.script}}`)(this, this.parent);
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
        return this.group?.[0] ?? 'root';
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
            this.main.SetProjectOpen(item.data);
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
        this.addDock(DockEnum.top, TabDock);
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
    $data = new DataFlow(this);
    $projectOpen;
    $properties = {};
    $control = {};
    $controlDefault = {
        node_begin: {
            icon: '<i class="fas fa-play"></i>',
            sort: 0,
            name: 'Begin',
            class: 'node-test',
            html: '',
            output: 1,
            input: 0,
            onlyNode: true
        },
        node_end: {
            icon: '<i class="fas fa-stop"></i>',
            sort: 0,
            name: 'End',
            html: '',
            output: 0,
            onlyNode: true
        },
        node_if: {
            icon: '<i class="fas fa-equals"></i>',
            sort: 0,
            name: 'If',
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
            html: '<div class="text-center p3"><button class="btnGoGroup">Go</button></div>',
            script: `node.elNode.querySelector('.btnGoGroup')?.addEventListener('click', () => {node.openGroup()});`,
            properties: {
                condition: {
                    key: "condition",
                    default: ''
                }
            },
            output: 2
        },
    };
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
            ...(option?.properties || {}),
            id: {
                default: () => getTime()
            },
            name: {
                default: () => `app-${getTime()}`
            },
            key: {
                default: PropertyEnum.main
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
        this.$control = { ...option?.control || {}, ...this.$controlDefault };
        let controlTemp = {};
        Object.keys(this.$control).map((key) => ({ ...this.$control[key], key, sort: (this.$control[key].sort === undefined ? 99999 : this.$control[key].sort) })).sort(compareSort).forEach((item) => {
            controlTemp[item.key] = item;
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
        this.container.classList.remove('vs-container');
        this.container.classList.add('vs-container');
        this.$dockManager = new DockManager(this.container, this);
        this.$dockManager.reset();
        this.$data.InitData({}, this.getPropertyByKey(PropertyEnum.solution));
    }
    getProjectAll() {
        return this.$data.Get('projects') ?? [];
    }
    open($data) {
        this.$data.InitData($data, this.getPropertyByKey(PropertyEnum.solution));
    }
    SetProjectOpen($data) {
        this.$projectOpen = $data;
    }
    CheckProjectOpen($data) {
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

module.exports = VisualFlow;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5janMuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb3JlL0NvbnN0YW50LnRzIiwiLi4vc3JjL2RvY2svRG9ja0Jhc2UudHMiLCIuLi9zcmMvZG9jay9Db250cm9sRG9jay50cyIsIi4uL3NyYy9kb2NrL1Byb2plY3REb2NrLnRzIiwiLi4vc3JjL2NvcmUvRWRpdG9yLnRzIiwiLi4vc3JjL2RvY2svUHJvcGVydHlEb2NrLnRzIiwiLi4vc3JjL2RvY2svVGFiRG9jay50cyIsIi4uL3NyYy9jb3JlL0V2ZW50Rmxvdy50cyIsIi4uL3NyYy9jb3JlL0RhdGFGbG93LnRzIiwiLi4vc3JjL2NvcmUvQmFzZUZsb3cudHMiLCIuLi9zcmMvY29yZS9VdGlscy50cyIsIi4uL3NyYy9kZXNnaW5lci9MaW5lLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld19FdmVudC50cyIsIi4uL3NyYy9kZXNnaW5lci9EZXNnaW5lclZpZXdfVG9vbGJhci50cyIsIi4uL3NyYy9kZXNnaW5lci9Ob2RlLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlldy50cyIsIi4uL3NyYy9kb2NrL1ZpZXdEb2NrLnRzIiwiLi4vc3JjL2RvY2svRG9ja01hbmFnZXIudHMiLCIuLi9zcmMvVmlzdWFsRmxvdy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgRXZlbnRFbnVtID0ge1xuICBpbml0OiBcImluaXRcIixcbiAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXG4gIHNob3dQcm9wZXJ0eTogXCJzaG93UHJvcGVydHlcIixcbiAgb3BlblByb2plY3Q6IFwib3BlblByb2plY3RcIixcbiAgbmV3UHJvamVjdDogXCJuZXdQcm9qZWN0XCIsXG4gIGNoYW5nZTogXCJjaGFuZ2VcIixcbiAgZGlzcG9zZTogXCJkaXNwb3NlXCJcbn1cblxuZXhwb3J0IGNvbnN0IERvY2tFbnVtID0ge1xuICBsZWZ0OiBcInZzLWxlZnRcIixcbiAgdG9wOiBcInZzLXRvcFwiLFxuICB2aWV3OiBcInZzLXZpZXdcIixcbiAgYm90dG9tOiBcInZzLWJvdHRvbVwiLFxuICByaWdodDogXCJ2cy1yaWdodFwiLFxufVxuXG5leHBvcnQgY29uc3QgUHJvcGVydHlFbnVtID0ge1xuICBtYWluOiBcIm1haW5fcHJvamVjdFwiLFxuICBzb2x1dGlvbjogJ21haW5fc29sdXRpb24nLFxuICBsaW5lOiAnbWFpbl9saW5lJyxcbiAgdmFyaWFibGU6ICdtYWluX3ZhcmlhYmxlJ1xufTtcblxuZXhwb3J0IGNvbnN0IGNvbXBhcmVTb3J0ID0gKGE6IGFueSwgYjogYW55KSA9PiB7XG4gIGlmIChhLnNvcnQgPCBiLnNvcnQpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKGEuc29ydCA+IGIuc29ydCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgRG9ja0Jhc2Uge1xuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwcm90ZWN0ZWQgZWxDb250ZW50OiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9ICdEb2NrQmFzZSc7XG4gIH1cblxuICBwdWJsaWMgQm94SW5mbyh0aXRsZTogc3RyaW5nLCAkY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5yZW1vdmUoJ3ZzLWJveGluZm8nKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ib3hpbmZvJyk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJ2cy1ib3hpbmZvX2hlYWRlclwiPjxzcGFuIGNsYXNzPVwidnMtYm94aW5mb190aXRsZVwiPiR7dGl0bGV9PC9zcGFuPjxzcGFuIGNsYXNzPVwidnMtYm94aW5mb19idXR0b25cIj48L3NwYW4+PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInZzLWJveGluZm9fY29udGVudFwiPjwvZGl2PmA7XG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19jb250ZW50Jyk7XG4gICAgaWYgKCRjYWxsYmFjaykge1xuXG4gICAgICAkY2FsbGJhY2sodGhpcy5lbENvbnRlbnQpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgQ29udHJvbERvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLWNvbnRyb2wnKTtcbiAgICB0aGlzLkJveEluZm8oJ0NvbnRyb2wnLCAobm9kZTogSFRNTEVsZW1lbnQpID0+IHtcbiAgICAgIGxldCBjb250cm9scyA9IHRoaXMubWFpbi5nZXRDb250cm9sQWxsKCk7XG4gICAgICBPYmplY3Qua2V5cyhjb250cm9scykuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgIGxldCBub2RlSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcbiAgICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkcmFnZ2FibGUnLCAndHJ1ZScpO1xuICAgICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScsIGl0ZW0pO1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtjb250cm9sc1tpdGVtXS5pY29ufSA8c3Bhbj4ke2NvbnRyb2xzW2l0ZW1dLm5hbWV9PC9zcGFuYDtcbiAgICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcbiAgICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsIHRoaXMuZHJhZ2VuZC5iaW5kKHRoaXMpKVxuICAgICAgICBub2RlLmFwcGVuZENoaWxkKG5vZGVJdGVtKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgZHJhZ2VuZChlOiBhbnkpIHtcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShudWxsKTtcbiAgfVxuXG4gIHByaXZhdGUgZHJhZ1N0YXJ0KGU6IGFueSkge1xuICAgIGxldCBrZXkgPSBlLnRhcmdldC5jbG9zZXN0KFwiLm5vZGUtaXRlbVwiKS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScpO1xuICAgIHRoaXMubWFpbi5zZXRDb250cm9sQ2hvb3NlKGtleSk7XG4gICAgaWYgKGUudHlwZSAhPT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJub2RlXCIsIGtleSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi4vY29yZS9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgUHJvamVjdERvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb2plY3QnKTtcbiAgICB0aGlzLkJveEluZm8oJ1Byb2plY3QnLCB0aGlzLnJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uY2hhbmdlLCB0aGlzLnJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIChkZXRhaWw6IGFueSkgPT4ge1xuICAgICAgdGhpcy5lbENvbnRlbnQ/LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY3RpdmUnKS5mb3JFYWNoKChfbm9kZSkgPT4ge1xuICAgICAgICBfbm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuZWxDb250ZW50ICYmIGRldGFpbD8uZGF0YT8uR2V0KCdpZCcpKSB7XG4gICAgICAgIHRoaXMuZWxDb250ZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3QtaWQ9XCIke2RldGFpbD8uZGF0YT8uR2V0KCdpZCcpfVwiXWApPy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIHByaXZhdGUgcmVuZGVyVUkoKSB7XG4gICAgbGV0ICRub2RlUmlnaHQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2hlYWRlciAudnMtYm94aW5mb19idXR0b24nKTtcbiAgICBpZiAoIXRoaXMuZWxDb250ZW50KSByZXR1cm47XG4gICAgdGhpcy5lbENvbnRlbnQuaW5uZXJIVE1MID0gYGA7XG4gICAgaWYgKCRub2RlUmlnaHQpIHtcbiAgICAgICRub2RlUmlnaHQuaW5uZXJIVE1MID0gYGA7XG4gICAgICBsZXQgYnV0dG9uTmV3ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAkbm9kZVJpZ2h0Py5hcHBlbmRDaGlsZChidXR0b25OZXcpO1xuICAgICAgYnV0dG9uTmV3LmlubmVySFRNTCA9IGBOZXdgO1xuICAgICAgYnV0dG9uTmV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5tYWluLm5ld1Byb2plY3QoJycpKTtcbiAgICB9XG5cbiAgICBsZXQgcHJvamVjdHMgPSB0aGlzLm1haW4uZ2V0UHJvamVjdEFsbCgpO1xuICAgIHByb2plY3RzLmZvckVhY2goKGl0ZW06IERhdGFGbG93KSA9PiB7XG4gICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ25vZGUtaXRlbScpO1xuICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QtaWQnLCBpdGVtLkdldCgnaWQnKSk7XG4gICAgICBpdGVtLnJlbW92ZUxpc3RlbmVyKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV9uYW1lYCwgKCkgPT4ge1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICB9KTtcbiAgICAgIGl0ZW0ub24oYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMubWFpbi5DaGVja1Byb2plY3RPcGVuKGl0ZW0pKSB7XG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubWFpbi5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsIHsgZGF0YTogaXRlbSB9KTtcbiAgICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogaXRlbSB9KTtcblxuICAgICAgfSk7XG4gICAgICB0aGlzLmVsQ29udGVudD8uYXBwZW5kQ2hpbGQobm9kZUl0ZW0pO1xuICAgIH0pO1xuXG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93LCBGbG93Q29yZSB9IGZyb20gXCIuL0Jhc2VGbG93XCJcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBMT0cgfSBmcm9tIFwiLi9VdGlsc1wiO1xuZXhwb3J0IGVudW0gRWRpdG9yVHlwZSB7XG4gIExhYmVsLFxuICBUZXh0LFxuICBJbmxpbmVcbn1cbmV4cG9ydCBjbGFzcyBFZGl0b3Ige1xuICBwcml2YXRlIGlzRWRpdDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGVsSW5wdXQ6IEhUTUxEYXRhRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGVsTGFiZWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGRhdGE6IERhdGFGbG93LCBwcml2YXRlIGtleTogc3RyaW5nLCBlbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbCwgcHJpdmF0ZSB0eXBlOiBFZGl0b3JUeXBlID0gRWRpdG9yVHlwZS5MYWJlbCwgY2hhZ25lOiBib29sZWFuID0gZmFsc2UpIHtcblxuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgdGhpcy5kYXRhLm9uU2FmZShgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwgdGhpcy5jaGFuZ2VEYXRhLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZGF0YS5vblNhZmUoRXZlbnRFbnVtLmRpc3Bvc2UsIHRoaXMuZGlzcG9zZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmlzRWRpdCA9IHR5cGUgPT09IEVkaXRvclR5cGUuVGV4dDtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdub2RlLWVkaXRvcicpO1xuICAgIGlmIChjaGFnbmUgJiYgZWwpIHtcbiAgICAgIGVsLnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZSh0aGlzLmVsTm9kZSwgZWwpO1xuICAgICAgZWwucGFyZW50RWxlbWVudD8ucmVtb3ZlQ2hpbGQoZWwpO1xuICAgICAgZWw/LnJlbW92ZSgpO1xuICAgIH0gZWxzZSBpZiAoZWwpIHtcbiAgICAgIGVsLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuICBwdWJsaWMgcmVuZGVyKCkge1xuICAgIGxldCBkYXRhID0gdGhpcy5kYXRhLkdldCh0aGlzLmtleSk7XG5cbiAgICBpZiAodGhpcy5pc0VkaXQpIHtcbiAgICAgIGlmICh0aGlzLmVsTGFiZWwpIHtcbiAgICAgICAgdGhpcy5lbExhYmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5zd2l0Y2hNb2RlRWRpdC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5lbExhYmVsLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLmVsTGFiZWwgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZWxJbnB1dCkge1xuICAgICAgICB0aGlzLmVsSW5wdXQudmFsdWUgPSBkYXRhO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmVsSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgdGhpcy5lbElucHV0LmNsYXNzTGlzdC5hZGQoJ25vZGUtZm9ybS1jb250cm9sJyk7XG4gICAgICB0aGlzLmVsSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaW5wdXREYXRhLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5lbElucHV0LnZhbHVlID0gZGF0YTtcbiAgICAgIHRoaXMuZWxJbnB1dC5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCB0aGlzLmtleSk7XG4gICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsSW5wdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5lbElucHV0KSB7XG4gICAgICAgIHRoaXMuZWxJbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuaW5wdXREYXRhLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmVsSW5wdXQucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuZWxJbnB1dCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5lbExhYmVsKSB7XG4gICAgICAgIHRoaXMuZWxMYWJlbC5pbm5lckhUTUwgPSBkYXRhO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmVsTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBpZiAodGhpcy50eXBlID09IEVkaXRvclR5cGUuSW5saW5lKSB7XG4gICAgICAgIHRoaXMuZWxMYWJlbC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuc3dpdGNoTW9kZUVkaXQuYmluZCh0aGlzKSk7XG4gICAgICB9XG4gICAgICB0aGlzLmVsTGFiZWwuc2V0QXR0cmlidXRlKCdub2RlOm1vZGVsJywgdGhpcy5rZXkpO1xuICAgICAgdGhpcy5lbExhYmVsLmlubmVySFRNTCA9IGRhdGE7XG4gICAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTGFiZWwpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgc3dpdGNoTW9kZUVkaXQoKSB7XG4gICAgdGhpcy5pc0VkaXQgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIGlucHV0RGF0YShlOiBhbnkpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuZGF0YS5TZXQodGhpcy5rZXksIGUudGFyZ2V0LnZhbHVlLCB0aGlzKTtcbiAgICB9KVxuICB9XG4gIHB1YmxpYyBjaGFuZ2VEYXRhKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5lbElucHV0Py5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5pbnB1dERhdGEuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbExhYmVsPy5yZW1vdmVFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuc3dpdGNoTW9kZUVkaXQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke3RoaXMua2V5fWAsIHRoaXMuY2hhbmdlRGF0YS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmRpc3Bvc2UsIHRoaXMuZGlzcG9zZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi4vY29yZS9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgRWRpdG9yLCBFZGl0b3JUeXBlIH0gZnJvbSBcIi4uL2NvcmUvRWRpdG9yXCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHByaXZhdGUgbGFzdERhdGE6IERhdGFGbG93IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGxhYmVsS2V5czogc3RyaW5nW10gPSBbJ2lkJywgJ2tleScsICdncm91cCddO1xuICBwcml2YXRlIGRhdGFKc29uOiBIVE1MVGV4dEFyZWFFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG5cbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1wcm9wZXJ0eScpO1xuICAgIHRoaXMuQm94SW5mbygnUHJvcGVydHknLCAobm9kZTogSFRNTEVsZW1lbnQpID0+IHtcbiAgICAgIG1haW4ub24oRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgKGRldGFpbDogYW55KSA9PiB7XG4gICAgICAgIHRoaXMucmVuZGVyVUkobm9kZSwgZGV0YWlsLmRhdGEpO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxuICBwcml2YXRlIHJlbmRlclVJKG5vZGU6IEhUTUxFbGVtZW50LCBkYXRhOiBEYXRhRmxvdykge1xuICAgIGlmICh0aGlzLmxhc3REYXRhID09IGRhdGEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XG4gICAgbm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICBsZXQgcHJvcGVydGllczogYW55ID0gZGF0YS5nZXRQcm9wZXJ0aWVzKClcbiAgICBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IHByb3BlcnR5SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgcHJvcGVydHlJdGVtLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWl0ZW0nKTtcbiAgICAgIGxldCBwcm9wZXJ0eUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eUxhYmVsLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LWxhYmVsJyk7XG4gICAgICBwcm9wZXJ0eUxhYmVsLmlubmVySFRNTCA9IGtleTtcbiAgICAgIGxldCBwcm9wZXJ0eVZhbHVlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eVZhbHVlLmNsYXNzTGlzdC5hZGQoJ3Byb3BlcnR5LXZhbHVlJyk7XG4gICAgICBpZiAodGhpcy5sYWJlbEtleXMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICBuZXcgRWRpdG9yKGRhdGEsIGtleSwgcHJvcGVydHlWYWx1ZSwgRWRpdG9yVHlwZS5MYWJlbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXcgRWRpdG9yKGRhdGEsIGtleSwgcHJvcGVydHlWYWx1ZSwgRWRpdG9yVHlwZS5UZXh0KTtcbiAgICAgIH1cbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eUxhYmVsKTtcbiAgICAgIHByb3BlcnR5SXRlbS5hcHBlbmRDaGlsZChwcm9wZXJ0eVZhbHVlKTtcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJdGVtKTtcbiAgICB9KTtcbiAgICBub2RlLmFwcGVuZENoaWxkKHRoaXMuZGF0YUpzb24pO1xuICAgIHRoaXMuZGF0YUpzb24udmFsdWUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgdGhpcy5kYXRhSnNvbi5jbGFzc0xpc3QuYWRkKCdub2RlLWZvcm0tY29udHJvbCcpO1xuICAgIGRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsICgpID0+IHRoaXMuZGF0YUpzb24udmFsdWUgPSBkYXRhLnRvU3RyaW5nKCkpXG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBUYWJEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy10YWInKVxuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIChkZXRhaWw6IGFueSkgPT4ge1xuICAgICAgdGhpcy5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY3RpdmUnKS5mb3JFYWNoKChfbm9kZSkgPT4ge1xuICAgICAgICBfbm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuZWxOb2RlICYmIGRldGFpbD8uZGF0YT8uR2V0KCdpZCcpKSB7XG4gICAgICAgIHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3QtaWQ9XCIke2RldGFpbD8uZGF0YT8uR2V0KCdpZCcpfVwiXWApPy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm5ld1Byb2plY3QsIHRoaXMucmVuZGVyLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBgO1xuICAgIGxldCBwcm9qZWN0cyA9IHRoaXMubWFpbi5nZXRQcm9qZWN0QWxsKCk7XG4gICAgcHJvamVjdHMuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3cpID0+IHtcbiAgICAgIGxldCBub2RlSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XG4gICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdC1pZCcsIGl0ZW0uR2V0KCdpZCcpKTtcbiAgICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIH0pO1xuICAgICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5tYWluLkNoZWNrUHJvamVjdE9wZW4oaXRlbSkpIHtcbiAgICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICB9XG4gICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgeyBkYXRhOiBpdGVtIH0pO1xuICAgICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiBpdGVtIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmVsTm9kZT8uYXBwZW5kQ2hpbGQobm9kZUl0ZW0pO1xuICAgIH0pO1xuICB9XG59XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRGbG93IHtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7IH1cbiAgcHVibGljIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICAgIHRoaXMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICAvKiBFdmVudHMgKi9cbiAgcHVibGljIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgZXZlbnQgbmFtZSBtdXN0IGJlIGEgc3RyaW5nLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBldmVudH1gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XG4gICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG5cbiAgICBpZiAoIXRoaXMuZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlXG5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzXG4gICAgY29uc3QgbGlzdGVuZXJJbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKVxuICAgIGNvbnN0IGhhc0xpc3RlbmVyID0gbGlzdGVuZXJJbmRleCA+IC0xXG4gICAgaWYgKGhhc0xpc3RlbmVyKSBsaXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpXG4gIH1cblxuICBwdWJsaWMgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xuICAgICAgbGlzdGVuZXIoZGV0YWlscyk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElQcm9wZXJ0eSB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBEYXRhRmxvdyB7XG4gIHByaXZhdGUgZGF0YTogYW55ID0ge307XG4gIHByaXZhdGUgcHJvcGVydGllczogYW55ID0gbnVsbDtcbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgcHVibGljIGdldFByb3BlcnRpZXMoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzO1xuICB9XG4gIG9uU2FmZShldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gIH1cbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KSB7XG5cbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvcGVydHk6IElQcm9wZXJ0eSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCwgZGF0YTogYW55ID0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IC0xKSB7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIH1cbiAgICB0aGlzLmxvYWQoZGF0YSk7XG4gIH1cbiAgcHJpdmF0ZSBldmVudERhdGFDaGFuZ2Uoa2V5OiBzdHJpbmcsIGtleUNoaWxkOiBzdHJpbmcsIHZhbHVlQ2hpbGQ6IGFueSwgc2VuZGVyQ2hpbGQ6IGFueSwgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmIChpbmRleCkge1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9XyR7a2V5Q2hpbGR9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9XyR7aW5kZXh9YCwge1xuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaChgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fJHtrZXl9YCwge1xuICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlRXZlbnREYXRhKGl0ZW06IERhdGFGbG93LCBrZXk6IHN0cmluZywgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGlmICghaXRlbSkgcmV0dXJuO1xuICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9YCwgKHsga2V5OiBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGQgfTogYW55KSA9PiB0aGlzLmV2ZW50RGF0YUNoYW5nZShrZXksIGtleUNoaWxkLCB2YWx1ZUNoaWxkLCBzZW5kZXJDaGlsZCwgaW5kZXgpKTtcbiAgfVxuICBwdWJsaWMgT25FdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHByaXZhdGUgQmluZEV2ZW50KHZhbHVlOiBhbnksIGtleTogc3RyaW5nKSB7XG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICB0aGlzLk9uRXZlbnREYXRhKHZhbHVlIGFzIERhdGFGbG93LCBrZXkpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgKHZhbHVlIGFzIFtdKS5sZW5ndGggPiAwICYmIHZhbHVlWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICh2YWx1ZSBhcyBEYXRhRmxvd1tdKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdywgaW5kZXg6IG51bWJlcikgPT4gdGhpcy5PbkV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCwgaXNEaXNwYXRjaDogYm9vbGVhbiA9IHRydWUpIHtcbiAgICBpZiAodGhpcy5kYXRhW2tleV0gIT0gdmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmRhdGFba2V5XSkge1xuICAgICAgICBpZiAodGhpcy5kYXRhW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICAgIHRoaXMuUmVtb3ZlRXZlbnREYXRhKCh0aGlzLmRhdGFba2V5XSBhcyBEYXRhRmxvdyksIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhW2tleV0pICYmICh0aGlzLmRhdGFba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiB0aGlzLmRhdGFba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLlJlbW92ZUV2ZW50RGF0YShpdGVtLCBrZXksIGluZGV4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuQmluZEV2ZW50KHZhbHVlLCBrZXkpO1xuICAgIH1cbiAgICB0aGlzLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgIGlmIChpc0Rpc3BhdGNoKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICB9XG5cbiAgfVxuICBwdWJsaWMgU2V0RGF0YShkYXRhOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCwgaXNDbGVhckRhdGEgPSBmYWxzZSkge1xuXG4gICAgaWYgKGlzQ2xlYXJEYXRhKSB0aGlzLmRhdGEgPSB7fTtcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICBsZXQgJGRhdGE6IERhdGFGbG93ID0gZGF0YSBhcyBEYXRhRmxvdztcbiAgICAgIGlmICghdGhpcy5wcm9wZXJ0eSAmJiAkZGF0YS5wcm9wZXJ0eSkgdGhpcy5wcm9wZXJ0eSA9ICRkYXRhLnByb3BlcnR5O1xuICAgICAgaWYgKHRoaXMucHJvcGVydGllcykge1xuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5wcm9wZXJ0aWVzKSkge1xuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoJGRhdGEuZ2V0UHJvcGVydGllcygpKSkge1xuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICB0aGlzLlNldChrZXksIGRhdGFba2V5XSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgIGRhdGFcbiAgICB9KTtcbiAgfVxuICBwdWJsaWMgR2V0KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xuICB9XG4gIHB1YmxpYyBBcHBlbmQoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBpZiAoIXRoaXMuZGF0YVtrZXldKSB0aGlzLmRhdGFba2V5XSA9IFtdO1xuICAgIHRoaXMuZGF0YVtrZXldID0gWy4uLnRoaXMuZGF0YVtrZXldLCB2YWx1ZV07XG4gICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gIH1cbiAgcHVibGljIFJlbW92ZShrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xuICAgIHZhciBpbmRleCA9IHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLlJlbW92ZUV2ZW50RGF0YSh0aGlzLmRhdGFba2V5XVtpbmRleF0sIGtleSk7XG4gICAgICB0aGlzLmRhdGFba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcbiAgICB0aGlzLmRhdGEgPSB7fTtcbiAgICBpZiAoIXRoaXMucHJvcGVydGllcykge1xuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0eT8uZ2V0UHJvcGVydHlCeUtleShkYXRhLmtleSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BlcnRpZXMpIHtcbiAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgIHRoaXMuZGF0YVtrZXldID0gKGRhdGE/LltrZXldID8/ICgodHlwZW9mIHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0ID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCgpIDogdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQpID8/IFwiXCIpKTtcbiAgICAgICAgaWYgKCEodGhpcy5kYXRhW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykgJiYgdGhpcy5kYXRhW2tleV0ua2V5KSB7XG4gICAgICAgICAgdGhpcy5kYXRhW2tleV0gPSBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgdGhpcy5kYXRhW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGF0YVtrZXldKSAmJiB0aGlzLnByb3BlcnR5ICYmICEodGhpcy5kYXRhW2tleV1bMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykpIHtcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IHRoaXMuZGF0YVtrZXldLm1hcCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoIShpdGVtIGluc3RhbmNlb2YgRGF0YUZsb3cpICYmIGl0ZW0ua2V5KSB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgaXRlbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLkJpbmRFdmVudCh0aGlzLmRhdGFba2V5XSwga2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnRvSnNvbigpKTtcbiAgfVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICAgIGxldCByczogYW55ID0ge307XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcbiAgICAgIHJzW2tleV0gPSB0aGlzLkdldChrZXkpO1xuICAgICAgaWYgKHJzW2tleV0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICByc1trZXldID0gcnNba2V5XS50b0pzb24oKTtcbiAgICAgIH1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHJzW2tleV0pICYmIChyc1trZXldIGFzIFtdKS5sZW5ndGggPiAwICYmIHJzW2tleV1bMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgICByc1trZXldID0gcnNba2V5XS5tYXAoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLnRvSnNvbigpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJzO1xuICB9XG4gIHB1YmxpYyBkZWxldGUoKSB7XG4gICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRGbG93KCk7XG4gICAgdGhpcy5kYXRhID0ge307XG4gIH1cbn1cbiIsImltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJUHJvcGVydHkge1xuICBnZXRQcm9wZXJ0eUJ5S2V5KGtleTogc3RyaW5nKTogYW55O1xufVxuZXhwb3J0IGludGVyZmFjZSBJQ29udHJvbE5vZGUgZXh0ZW5kcyBJUHJvcGVydHkge1xuICBnZXRDb250cm9sTm9kZUJ5S2V5KGtleTogc3RyaW5nKTogYW55O1xufVxuZXhwb3J0IGludGVyZmFjZSBJRXZlbnQge1xuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSk6IHZvaWQ7XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpOiB2b2lkO1xuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KTogdm9pZDtcbiAgZGlzcGF0Y2goZXZlbnQ6IHN0cmluZywgZGV0YWlsczogYW55KTogdm9pZDtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSU1haW4gZXh0ZW5kcyBJQ29udHJvbE5vZGUsIElFdmVudCB7XG4gIG5ld1Byb2plY3QoJG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIG9wZW5Qcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICBnZXRQcm9qZWN0QWxsKCk6IGFueVtdO1xuICBvcGVuKCRkYXRhOiBhbnkpOiB2b2lkO1xuICBnZXRDb250cm9sQWxsKCk6IGFueVtdO1xuICBzZXRDb250cm9sQ2hvb3NlKGtleTogc3RyaW5nIHwgbnVsbCk6IHZvaWQ7XG4gIGdldENvbnRyb2xDaG9vc2UoKTogc3RyaW5nIHwgbnVsbDtcbiAgZ2V0Q29udHJvbEJ5S2V5KGtleTogc3RyaW5nKTogYW55O1xufVxuZXhwb3J0IGNsYXNzIEZsb3dDb3JlIGltcGxlbWVudHMgSUV2ZW50IHtcbiAgcHVibGljIEdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdpZCcpO1xuICB9XG4gIHB1YmxpYyBTZXRJZChpZDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ2lkJywgaWQpO1xuICB9XG4gIHB1YmxpYyBwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcbiAgcHVibGljIGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KCk7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgcHVibGljIENoZWNrRWxlbWVudENoaWxkKGVsOiBIVE1MRWxlbWVudCkge1xuICAgIHJldHVybiB0aGlzLmVsTm9kZSA9PSBlbCB8fCB0aGlzLmVsTm9kZS5jb250YWlucyhlbCk7XG4gIH1cbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgcHVibGljIFNldERhdGEoZGF0YTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmRhdGEuU2V0RGF0YShkYXRhLCBzZW5kZXIpO1xuICB9XG4gIHB1YmxpYyBTZXREYXRhRmxvdyhkYXRhOiBEYXRhRmxvdykge1xuICAgIHRoaXMuZGF0YS5TZXREYXRhKGRhdGEsIHRoaXMsIHRydWUpO1xuXG4gICAgdGhpcy5kaXNwYXRjaChgYmluZF9kYXRhX2V2ZW50YCwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XG4gICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7IGRhdGEsIHNlbmRlcjogdGhpcyB9KTtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBCaW5kRGF0YUV2ZW50KCkge1xuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5jaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgUmVtb3ZlRGF0YUV2ZW50KCkge1xuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uZGF0YUNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5jaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIHRoaXMuQmluZERhdGFFdmVudCgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCYXNlRmxvdzxUUGFyZW50IGV4dGVuZHMgRmxvd0NvcmU+IGV4dGVuZHMgRmxvd0NvcmUge1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIHBhcmVudDogVFBhcmVudCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbn1cbiIsImV4cG9ydCBjb25zdCBMT0cgPSAobWVzc2FnZT86IGFueSwgLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiBjb25zb2xlLmxvZyhtZXNzYWdlLCBvcHRpb25hbFBhcmFtcyk7XG5leHBvcnQgY29uc3QgZ2V0RGF0ZSA9ICgpID0+IChuZXcgRGF0ZSgpKTtcbmV4cG9ydCBjb25zdCBnZXRUaW1lID0gKCkgPT4gZ2V0RGF0ZSgpLmdldFRpbWUoKTtcbmV4cG9ydCBjb25zdCBnZXRVdWlkID0gKCkgPT4ge1xuICAvLyBodHRwOi8vd3d3LmlldGYub3JnL3JmYy9yZmM0MTIyLnR4dFxuICBsZXQgczogYW55ID0gW107XG4gIGxldCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNjsgaSsrKSB7XG4gICAgc1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMCksIDEpO1xuICB9XG4gIHNbMTRdID0gXCI0XCI7ICAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcbiAgc1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKChzWzE5XSAmIDB4MykgfCAweDgsIDEpOyAgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcbiAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXG4gIGxldCB1dWlkID0gcy5qb2luKFwiXCIpO1xuICByZXR1cm4gdXVpZDtcbn1cbiIsImltcG9ydCB7IFByb3BlcnR5RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4vTm9kZVwiO1xuXG5leHBvcnQgY2xhc3MgTGluZSB7XG4gIHB1YmxpYyBlbE5vZGU6IFNWR0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgXCJzdmdcIik7XG4gIHB1YmxpYyBlbFBhdGg6IFNWR1BhdGhFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwicGF0aFwiKTtcbiAgcHJpdmF0ZSBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xuICBwcml2YXRlIGN1cnZhdHVyZTogbnVtYmVyID0gMC41O1xuICBwdWJsaWMgY29uc3RydWN0b3IocHVibGljIGZyb206IE5vZGUsIHB1YmxpYyBmcm9tSW5kZXg6IG51bWJlciA9IDAsIHB1YmxpYyB0bzogTm9kZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCwgcHVibGljIHRvSW5kZXg6IG51bWJlciA9IDAsIGRhdGE6IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKFwibWFpbi1wYXRoXCIpO1xuICAgIHRoaXMuZWxQYXRoLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgJycpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJjb25uZWN0aW9uXCIpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxQYXRoKTtcbiAgICB0aGlzLmZyb20ucGFyZW50LmVsQ2FudmFzLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcblxuICAgIHRoaXMuZnJvbS5BZGRMaW5lKHRoaXMpO1xuICAgIHRoaXMudG8/LkFkZExpbmUodGhpcyk7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZGF0YS5Jbml0RGF0YShcbiAgICAgIHtcbiAgICAgICAgZnJvbTogdGhpcy5mcm9tLkdldElkKCksXG4gICAgICAgIGZyb21JbmRleDogdGhpcy5mcm9tSW5kZXgsXG4gICAgICAgIHRvOiB0aGlzLnRvPy5HZXRJZCgpLFxuICAgICAgICB0b0luZGV4OiB0aGlzLnRvSW5kZXhcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIC4uLiB0aGlzLmZyb20ucGFyZW50Lm1haW4uZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubGluZSkgfHwge31cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuZnJvbS5kYXRhLkFwcGVuZCgnbGluZXMnLCB0aGlzLmRhdGEpO1xuICB9XG4gIHB1YmxpYyB1cGRhdGVUbyh0b194OiBudW1iZXIsIHRvX3k6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5mcm9tIHx8IHRoaXMuZnJvbS5lbE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xuICAgIGxldCB7IHg6IGZyb21feCwgeTogZnJvbV95IH06IGFueSA9IHRoaXMuZnJvbS5nZXRQb3N0aXNpb25Eb3QodGhpcy5mcm9tSW5kZXgpO1xuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsIGxpbmVDdXJ2ZSk7XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCk6IExpbmUge1xuICAgIC8vUG9zdGlvbiBvdXRwdXRcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvLmVsTm9kZSkge1xuICAgICAgbGV0IHsgeDogdG9feCwgeTogdG9feSB9OiBhbnkgPSB0aGlzLnRvLmdldFBvc3Rpc2lvbkRvdCh0aGlzLnRvSW5kZXgpO1xuICAgICAgdGhpcy51cGRhdGVUbyh0b194LCB0b195KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgcHVibGljIEFjdGl2ZShmbGc6IGFueSA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xuICAgIGxldCBsaW5lX3ggPSBzdGFydF9wb3NfeDtcbiAgICBsZXQgbGluZV95ID0gc3RhcnRfcG9zX3k7XG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XG4gICAgbGV0IHkgPSBlbmRfcG9zX3k7XG4gICAgbGV0IGN1cnZhdHVyZSA9IGN1cnZhdHVyZV92YWx1ZTtcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgJ29wZW4nOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcblxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnY2xvc2UnOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdvdGhlcic6XG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiAoY3VydmF0dXJlICogLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcblxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBkZWxldGUobm9kZVRoaXM6IGFueSA9IG51bGwsIGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGg/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5mcm9tLmRhdGEuUmVtb3ZlKCdsaW5lcycsIHRoaXMuZGF0YSk7XG4gICAgaWYgKHRoaXMuZnJvbSAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMuZnJvbS5SZW1vdmVMaW5lKHRoaXMpO1xuICAgIGlmICh0aGlzLnRvICE9IG5vZGVUaGlzKVxuICAgICAgdGhpcy50bz8uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICB0aGlzLmVsUGF0aC5yZW1vdmUoKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgfVxuICBwdWJsaWMgU3RhcnRTZWxlY3RlZChlOiBhbnkpIHtcbiAgICB0aGlzLmZyb20ucGFyZW50LnNldExpbmVDaG9vc2UodGhpcylcbiAgfVxuICBwdWJsaWMgc2V0Tm9kZVRvKG5vZGU6IE5vZGUgfCB1bmRlZmluZWQsIHRvSW5kZXg6IG51bWJlcikge1xuICAgIHRoaXMudG8gPSBub2RlO1xuICAgIHRoaXMudG9JbmRleCA9IHRvSW5kZXg7XG4gIH1cbiAgcHVibGljIENsb25lKCkge1xuICAgIGlmICh0aGlzLnRvICYmIHRoaXMudG9JbmRleCkge1xuICAgICAgcmV0dXJuIG5ldyBMaW5lKHRoaXMuZnJvbSwgdGhpcy5mcm9tSW5kZXgsIHRoaXMudG8sIHRoaXMudG9JbmRleCkuVXBkYXRlVUkoKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IGdldFRpbWUgfSBmcm9tIFwiLi4vY29yZS9VdGlsc1wiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuL05vZGVcIjtcblxuZXhwb3J0IGVudW0gTW92ZVR5cGUge1xuICBOb25lID0gMCxcbiAgTm9kZSA9IDEsXG4gIENhbnZhcyA9IDIsXG4gIExpbmUgPSAzLFxufVxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlld19FdmVudCB7XG5cbiAgcHJpdmF0ZSB0aW1lRmFzdENsaWNrOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHRhZ0luZ29yZSA9IFsnaW5wdXQnLCAnYnV0dG9uJywgJ2EnLCAndGV4dGFyZWEnXTtcblxuICBwcml2YXRlIG1vdmVUeXBlOiBNb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gIHByaXZhdGUgZmxnRHJhcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIGF2X3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgYXZfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHBvc194OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3g6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbW91c2VfeTogbnVtYmVyID0gMDtcblxuICBwcml2YXRlIHRlbXBMaW5lOiBMaW5lIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IERlc2dpbmVyVmlldykge1xuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuICAgIC8qIENvbnRleHQgTWVudSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuY29udGV4dG1lbnUuYmluZCh0aGlzKSk7XG5cbiAgICAvKiBEcm9wIERyYXAgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMubm9kZV9kcm9wRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHRoaXMubm9kZV9kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBab29tIE1vdXNlICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy56b29tX2VudGVyLmJpbmQodGhpcykpO1xuICAgIC8qIERlbGV0ZSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb250ZXh0bWVudShldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cbiAgcHJpdmF0ZSBub2RlX2RyYWdvdmVyKGV2OiBhbnkpIHsgZXYucHJldmVudERlZmF1bHQoKTsgfVxuICBwcml2YXRlIG5vZGVfZHJvcEVuZChldjogYW55KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBsZXQga2V5Tm9kZTogYW55ID0gdGhpcy5wYXJlbnQubWFpbi5nZXRDb250cm9sQ2hvb3NlKCk7XG4gICAgaWYgKCFrZXlOb2RlICYmIGV2LnR5cGUgIT09IFwidG91Y2hlbmRcIikge1xuICAgICAga2V5Tm9kZSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwibm9kZVwiKTtcbiAgICB9XG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xuICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuXG4gICAgaWYgKHRoaXMucGFyZW50LmNoZWNrT25seU5vZGUoa2V5Tm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IG5vZGVJdGVtID0gdGhpcy5wYXJlbnQuQWRkTm9kZShrZXlOb2RlLCB7XG4gICAgICBncm91cDogdGhpcy5wYXJlbnQuQ3VycmVudEdyb3VwKClcbiAgICB9KTtcbiAgICBub2RlSXRlbS51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgfVxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGlmIChldmVudC5kZWx0YVkgPiAwKSB7XG4gICAgICAgIC8vIFpvb20gT3V0XG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21fb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBab29tIEluXG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21faW4oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBTdGFydE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmICh0aGlzLnRhZ0luZ29yZS5pbmNsdWRlcyhldi50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSBnZXRUaW1lKCk7XG4gICAgaWYgKGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21haW4tcGF0aCcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5DYW52YXM7XG4gICAgbGV0IG5vZGVDaG9vc2UgPSB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk7XG4gICAgaWYgKG5vZGVDaG9vc2UgJiYgbm9kZUNob29zZS5DaGVja0VsZW1lbnRDaGlsZChldi50YXJnZXQpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh1bmRlZmluZWQpO1xuICAgIH1cbiAgICBpZiAobm9kZUNob29zZSAmJiB0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vZGUgJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTGluZTtcbiAgICAgIGxldCBmcm9tSW5kZXggPSBldi50YXJnZXQuZ2V0QXR0cmlidXRlKCdub2RlJyk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmUobm9kZUNob29zZSwgZnJvbUluZGV4KTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT0gTW92ZVR5cGUuQ2FudmFzKSB7XG4gICAgICB0aGlzLmF2X3ggPSB0aGlzLnBhcmVudC5nZXRYKCk7XG4gICAgICB0aGlzLmF2X3kgPSB0aGlzLnBhcmVudC5nZXRZKCk7XG4gICAgfVxuICAgIHRoaXMuZmxnRHJhcCA9IHRydWU7XG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gIH1cbiAgcHVibGljIE1vdmUoZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmICghdGhpcy5mbGdEcmFwKSByZXR1cm47XG4gICAgdGhpcy5mbGdNb3ZlID0gdHJ1ZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLm1vdmVUeXBlKSB7XG4gICAgICBjYXNlIE1vdmVUeXBlLkNhbnZhczpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5hdl94ICsgdGhpcy5wYXJlbnQuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLmF2X3kgKyB0aGlzLnBhcmVudC5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xuICAgICAgICAgIHRoaXMucGFyZW50LnNldFkoeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTm9kZTpcbiAgICAgICAge1xuICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xuICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wb3NfeSAtIGVfcG9zX3kpO1xuICAgICAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgICAgICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgICAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgTW92ZVR5cGUuTGluZTpcbiAgICAgICAge1xuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICAgICAgICAgIGxldCB5ID0gdGhpcy5wYXJlbnQuQ2FsY1kodGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueSAtIGVfcG9zX3kpO1xuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLnBhcmVudC5lbENhbnZhcy5vZmZzZXRMZWZ0IC0geCwgdGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgICAgICBsZXQgbm9kZUVsID0gZXYudGFyZ2V0LmNsb3Nlc3QoJ1tub2RlLWlkXScpO1xuICAgICAgICAgICAgbGV0IG5vZGVJZCA9IG5vZGVFbD8uZ2V0QXR0cmlidXRlKCdub2RlLWlkJyk7XG4gICAgICAgICAgICBsZXQgbm9kZVRvID0gbm9kZUlkID8gdGhpcy5wYXJlbnQuR2V0Tm9kZUJ5SWQobm9kZUlkKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChub2RlVG8gJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IHRvSW5kZXggPSBub2RlRWw/LnF1ZXJ5U2VsZWN0b3IoJy5ub2RlLWRvdCcpPy5bMF0/LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xuICAgICAgdGhpcy5tb3VzZV95ID0gZV9wb3NfeTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBFbmRNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIC8vZml4IEZhc3QgQ2xpY2tcbiAgICBpZiAoKChnZXRUaW1lKCkgLSB0aGlzLnRpbWVGYXN0Q2xpY2spIDwgMTAwKSB8fCAhdGhpcy5mbGdNb3ZlKSB7XG4gICAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgICBlX3Bvc194ID0gdGhpcy5tb3VzZV94O1xuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgaWYgKHRoaXMubW92ZVR5cGUgPT09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcbiAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xuICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcbiAgICAgIHRoaXMuYXZfeCA9IDA7XG4gICAgICB0aGlzLmF2X3kgPSAwO1xuICAgIH1cbiAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgdGhpcy50ZW1wTGluZS5DbG9uZSgpO1xuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xuICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHByaXZhdGUga2V5ZG93bihldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKGV2LmtleSA9PT0gJ0RlbGV0ZScgfHwgKGV2LmtleSA9PT0gJ0JhY2tzcGFjZScgJiYgZXYubWV0YUtleSkpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpPy5kZWxldGUoKTtcbiAgICAgIHRoaXMucGFyZW50LmdldExpbmVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgfVxuICAgIGlmIChldi5rZXkgPT09ICdGMicpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuXG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3X1Rvb2xiYXIge1xuICBwcml2YXRlIGVsTm9kZTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgZWxQYXRoR3JvdXA6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogRGVzZ2luZXJWaWV3KSB7XG4gICAgdGhpcy5lbE5vZGUgPSBwYXJlbnQuZWxUb29sYmFyO1xuICAgIHRoaXMucmVuZGVyVUkoKTtcbiAgICB0aGlzLnJlbmRlclBhdGhHcm91cCgpO1xuICB9XG4gIHB1YmxpYyByZW5kZXJQYXRoR3JvdXAoKSB7XG4gICAgdGhpcy5lbFBhdGhHcm91cC5pbm5lckhUTUwgPSBgYDtcbiAgICBsZXQgZ3JvdXBzID0gdGhpcy5wYXJlbnQuR2V0R3JvdXBOYW1lKCk7XG4gICAgbGV0IGxlbiA9IGdyb3Vwcy5sZW5ndGggLSAxO1xuICAgIGlmIChsZW4gPCAwKSByZXR1cm47XG4gICAgbGV0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgdGV4dC5pbm5lckhUTUwgPSBgUm9vdGA7XG4gICAgdGhpcy5lbFBhdGhHcm91cC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICBmb3IgKGxldCBpbmRleCA9IGxlbjsgaW5kZXggPj0gMDsgaW5kZXgtLSkge1xuICAgICAgbGV0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICB0ZXh0LmlubmVySFRNTCA9IGA+PiR7Z3JvdXBzW2luZGV4XX1gO1xuICAgICAgdGhpcy5lbFBhdGhHcm91cC5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHJlbmRlclVJKCkge1xuICAgIGlmICghdGhpcy5lbE5vZGUpIHJldHVybjtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcbiAgICBsZXQgYnRuQmFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0bkJhY2suYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnBhcmVudC5CYWNrR3JvdXAoKSk7XG4gICAgYnRuQmFjay5pbm5lckhUTUwgPSBgQmFja2A7XG4gICAgbGV0IGJ0blpvb21JbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGJ0blpvb21Jbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucGFyZW50Lnpvb21faW4oKSk7XG4gICAgYnRuWm9vbUluLmlubmVySFRNTCA9IGBab29tK2A7XG4gICAgbGV0IGJ0blpvb21PdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBidG5ab29tT3V0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuem9vbV9vdXQoKSk7XG4gICAgYnRuWm9vbU91dC5pbm5lckhUTUwgPSBgWm9vbS1gO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxQYXRoR3JvdXApO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGJ0bkJhY2spO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGJ0blpvb21Jbik7XG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQoYnRuWm9vbU91dCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEJhc2VGbG93IH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL0RhdGFGbG93XCI7XG5cbmNvbnN0IGdldmFsID0gZXZhbDtcbmV4cG9ydCBjbGFzcyBOb2RlIGV4dGVuZHMgQmFzZUZsb3c8RGVzZ2luZXJWaWV3PiB7XG4gIC8qKlxuICAgKiBHRVQgU0VUIGZvciBEYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0TmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnbmFtZScpO1xuICB9XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneScpO1xuICB9XG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3gnKTtcbiAgfVxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3gnLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIENoZWNrS2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2tleScpID09IGtleTtcbiAgfVxuICBwdWJsaWMgZ2V0RGF0YUxpbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ2xpbmVzJykgPz8gW107XG4gIH1cbiAgcHVibGljIGVsQ29udGVudDogRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBhcnJMaW5lOiBMaW5lW10gPSBbXTtcbiAgcHJpdmF0ZSBvcHRpb246IGFueSA9IHt9O1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJlbnQ6IERlc2dpbmVyVmlldywgcHJpdmF0ZSBrZXlOb2RlOiBhbnksIGRhdGE6IGFueSA9IHt9KSB7XG4gICAgc3VwZXIocGFyZW50KTtcbiAgICB0aGlzLm9wdGlvbiA9IHRoaXMucGFyZW50Lm1haW4uZ2V0Q29udHJvbE5vZGVCeUtleShrZXlOb2RlKTtcbiAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLm9wdGlvbj8ucHJvcGVydGllcztcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRhdGEuSW5pdERhdGEoZGF0YSwgdGhpcy5wcm9wZXJ0aWVzKTtcbiAgICAgIHRoaXMucGFyZW50LmRhdGEuQXBwZW5kKCdub2RlcycsIHRoaXMuZGF0YSk7XG4gICAgfVxuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ub2RlJyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb24uY2xhc3MpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb24uY2xhc3MpO1xuICAgIH1cbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdub2RlLWlkJywgdGhpcy5HZXRJZCgpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5yZW5kZXJVSSgpO1xuICB9XG4gIHByaXZhdGUgcmVuZGVyVUkoKSB7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtbGVmdFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNDAwMFwiPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtdG9wXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjEwMDBcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInRpdGxlXCI+JHt0aGlzLm9wdGlvbi5pY29ufSAke3RoaXMuZ2V0TmFtZSgpfTwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiYm9keVwiPiR7dGhpcy5vcHRpb24uaHRtbH08L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWJvdHRvbVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCIyMDAwXCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibm9kZS1yaWdodFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1kb3RcIiAgbm9kZT1cIjMwMDBcIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcubm9kZS1jb250ZW50IC5ib2R5Jyk7XG4gICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgIGdldmFsKGAobm9kZSx2aWV3KT0+eyR7dGhpcy5vcHRpb24uc2NyaXB0fX1gKSh0aGlzLCB0aGlzLnBhcmVudCk7XG4gIH1cbiAgcHVibGljIG9wZW5Hcm91cCgpIHtcbiAgICBpZiAodGhpcy5DaGVja0tleSgnbm9kZV9ncm91cCcpKSB7XG4gICAgICB0aGlzLnBhcmVudC5vcGVuR3JvdXAodGhpcy5HZXRJZCgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xuICAgIGlmICh0aGlzLmVsTm9kZSkge1xuICAgICAgbGV0IHRlbXB4ID0geDtcbiAgICAgIGxldCB0ZW1weSA9IHk7XG4gICAgICBpZiAoIWlDaGVjaykge1xuICAgICAgICB0ZW1weSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgLSB5KTtcbiAgICAgICAgdGVtcHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCAtIHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB4ICE9PSB0aGlzLmdldFgoKSkge1xuICAgICAgICB0aGlzLnNldFgodGVtcHgpO1xuICAgICAgfVxuICAgICAgaWYgKHRlbXB5ICE9PSB0aGlzLmdldFkoKSkge1xuICAgICAgICB0aGlzLnNldFkodGVtcHkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBwdWJsaWMgQWN0aXZlKGZsZzogYW55ID0gdHJ1ZSkge1xuICAgIGlmIChmbGcpIHtcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFJlbW92ZUxpbmUobGluZTogTGluZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuYXJyTGluZS5pbmRleE9mKGxpbmUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICB0aGlzLmFyckxpbmUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYXJyTGluZTtcbiAgfVxuICBwdWJsaWMgQWRkTGluZShsaW5lOiBMaW5lKSB7XG4gICAgdGhpcy5hcnJMaW5lID0gWy4uLnRoaXMuYXJyTGluZSwgbGluZV07XG4gIH1cbiAgcHVibGljIGdldFBvc3Rpc2lvbkRvdChpbmRleDogbnVtYmVyID0gMCkge1xuICAgIGxldCBlbERvdDogYW55ID0gdGhpcy5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3IoYC5ub2RlLWRvdFtub2RlPVwiJHtpbmRleH1cIl1gKTtcbiAgICBpZiAoZWxEb3QpIHtcbiAgICAgIGxldCB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCArIGVsRG90Lm9mZnNldFRvcCArIDEwKTtcbiAgICAgIGxldCB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgKyBlbERvdC5vZmZzZXRMZWZ0ICsgMTApO1xuICAgICAgcmV0dXJuIHsgeCwgeSB9O1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCkge1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgdG9wOiAke3RoaXMuZ2V0WSgpfXB4OyBsZWZ0OiAke3RoaXMuZ2V0WCgpfXB4O2ApO1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLlVwZGF0ZVVJKCk7XG4gICAgfSlcbiAgfVxuICBwdWJsaWMgZGVsZXRlKGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xuICAgIHRoaXMuYXJyTGluZS5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLmRlbGV0ZSh0aGlzLCBpc0NsZWFyRGF0YSkpO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMuZGF0YS5kZWxldGUoKTtcbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uZGF0YUNoYW5nZSwgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuUmVtb3ZlRGF0YUV2ZW50KCk7XG4gICAgfVxuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcbiAgICB0aGlzLmFyckxpbmUgPSBbXTtcbiAgICBpZiAoaXNDbGVhckRhdGEpXG4gICAgICB0aGlzLnBhcmVudC5SZW1vdmVOb2RlKHRoaXMpO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge30pO1xuICB9XG4gIHB1YmxpYyBSZW5kZXJMaW5lKCkge1xuICAgIHRoaXMuZ2V0RGF0YUxpbmUoKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVGcm9tID0gdGhpcztcbiAgICAgIGxldCBub2RlVG8gPSB0aGlzLnBhcmVudC5HZXROb2RlQnlJZChpdGVtLkdldCgndG8nKSk7XG4gICAgICBsZXQgdG9JbmRleCA9IGl0ZW0uR2V0KCd0b0luZGV4Jyk7XG4gICAgICBsZXQgZnJvbUluZGV4ID0gaXRlbS5HZXQoJ2Zyb21JbmRleCcpO1xuICAgICAgbmV3IExpbmUobm9kZUZyb20sIGZyb21JbmRleCwgbm9kZVRvLCB0b0luZGV4LCBpdGVtKS5VcGRhdGVVSSgpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBGbG93Q29yZSwgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtLCBQcm9wZXJ0eUVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi4vY29yZS9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3X0V2ZW50IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3X0V2ZW50XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfVG9vbGJhciB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld19Ub29sYmFyXCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuL05vZGVcIjtcblxuZXhwb3J0IGNvbnN0IFpvb20gPSB7XG4gIG1heDogMS42LFxuICBtaW46IDAuNixcbiAgdmFsdWU6IDAuMSxcbiAgZGVmYXVsdDogMVxufVxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlldyBleHRlbmRzIEZsb3dDb3JlIHtcblxuICAvKipcbiAgICogR0VUIFNFVCBmb3IgRGF0YVxuICAgKi9cbiAgcHVibGljIGdldFpvb20oKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd6b29tJyk7XG4gIH1cbiAgcHVibGljIHNldFpvb20odmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd6b29tJywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBnZXRZKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneScpO1xuICB9XG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WCgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3gnKTtcbiAgfVxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3gnLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHJpdmF0ZSBncm91cDogYW55W10gPSBbXTtcbiAgcHVibGljIEdldEdyb3VwTmFtZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuZ3JvdXAubWFwKChpdGVtKSA9PiB0aGlzLkdldERhdGFCeUlkKGl0ZW0pPy5HZXQoJ25hbWUnKSk7XG4gIH1cbiAgcHVibGljIEJhY2tHcm91cCgpIHtcbiAgICB0aGlzLmdyb3VwLnNwbGljZSgwLCAxKTtcbiAgICB0aGlzLnRvb2xiYXIucmVuZGVyUGF0aEdyb3VwKCk7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBDdXJyZW50R3JvdXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ3JvdXA/LlswXSA/PyAncm9vdCc7XG4gIH1cbiAgcHVibGljIG9wZW5Hcm91cChpZDogYW55KSB7XG4gICAgdGhpcy5ncm91cCA9IFtpZCwgLi4udGhpcy5ncm91cF07XG4gICAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgfVxuICBwcml2YXRlIGxpbmVDaG9vc2U6IExpbmUgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBzZXRMaW5lQ2hvb3NlKG5vZGU6IExpbmUgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5saW5lQ2hvb3NlKSB0aGlzLmxpbmVDaG9vc2UuQWN0aXZlKGZhbHNlKTtcbiAgICB0aGlzLmxpbmVDaG9vc2UgPSBub2RlO1xuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHtcbiAgICAgIHRoaXMubGluZUNob29zZS5BY3RpdmUoKTtcbiAgICAgIHRoaXMuc2V0Tm9kZUNob29zZSh1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZ2V0TGluZUNob29zZSgpOiBMaW5lIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5saW5lQ2hvb3NlO1xuICB9XG4gIHByaXZhdGUgbm9kZXM6IE5vZGVbXSA9IFtdO1xuICBwcml2YXRlIG5vZGVDaG9vc2U6IE5vZGUgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBzZXROb2RlQ2hvb3NlKG5vZGU6IE5vZGUgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5ub2RlQ2hvb3NlKSB0aGlzLm5vZGVDaG9vc2UuQWN0aXZlKGZhbHNlKTtcbiAgICB0aGlzLm5vZGVDaG9vc2UgPSBub2RlO1xuICAgIGlmICh0aGlzLm5vZGVDaG9vc2UpIHtcbiAgICAgIHRoaXMubm9kZUNob29zZS5BY3RpdmUoKTtcbiAgICAgIHRoaXMuc2V0TGluZUNob29zZSh1bmRlZmluZWQpO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCB7IGRhdGE6IHRoaXMubm9kZUNob29zZS5kYXRhIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5kYXRhIH0pO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZ2V0Tm9kZUNob29zZSgpOiBOb2RlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlQ2hvb3NlO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlSXRlbShkYXRhOiBhbnkpOiBOb2RlIHtcbiAgICByZXR1cm4gdGhpcy5BZGROb2RlKGRhdGEuR2V0KCdrZXknKSwgZGF0YSk7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUoa2V5Tm9kZTogc3RyaW5nLCBkYXRhOiBhbnkgPSB7fSk6IE5vZGUge1xuICAgIHJldHVybiB0aGlzLkluc2VydE5vZGUobmV3IE5vZGUodGhpcywga2V5Tm9kZSwgZGF0YSkpO1xuICB9XG4gIHB1YmxpYyBJbnNlcnROb2RlKG5vZGU6IE5vZGUpOiBOb2RlIHtcbiAgICB0aGlzLm5vZGVzID0gWy4uLnRoaXMubm9kZXMsIG5vZGVdO1xuICAgIHJldHVybiBub2RlO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVOb2RlKG5vZGU6IE5vZGUpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yobm9kZSk7XG4gICAgdGhpcy5kYXRhLlJlbW92ZSgnbm9kZXMnLCBub2RlKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ub2RlcztcbiAgfVxuICBwdWJsaWMgQ2xlYXJOb2RlKCkge1xuICAgIHRoaXMubm9kZXM/LmZvckVhY2goaXRlbSA9PiBpdGVtLmRlbGV0ZShmYWxzZSkpO1xuICAgIHRoaXMubm9kZXMgPSBbXTtcbiAgfVxuICBwdWJsaWMgR2V0RGF0YUFsbE5vZGUoKTogYW55W10ge1xuICAgIHJldHVybiAodGhpcy5kYXRhLkdldCgnbm9kZXMnKSA/PyBbXSk7XG4gIH1cbiAgcHVibGljIEdldERhdGFOb2RlKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5HZXREYXRhQWxsTm9kZSgpLmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KFwiZ3JvdXBcIikgPT09IHRoaXMuQ3VycmVudEdyb3VwKCkpO1xuICB9XG4gIC8qKlxuICAgKiBWYXJpYnV0ZVxuICAqL1xuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyBlbFRvb2xiYXI6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyB0b29sYmFyOiBEZXNnaW5lclZpZXdfVG9vbGJhcjtcbiAgcHVibGljICRsb2NrOiBib29sZWFuID0gdHJ1ZTtcbiAgcHJpdmF0ZSB6b29tX2xhc3RfdmFsdWU6IGFueSA9IDE7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZWxOb2RlID0gZWxOb2RlO1xuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubWFpbik7XG4gICAgdGhpcy5kYXRhLkluaXREYXRhKHt9LCBwcm9wZXJ0aWVzKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdkZXNnaW5lci12aWV3JylcbiAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5yZW1vdmUoXCJkZXNnaW5lci1jYW52YXNcIik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgnZGVzZ2luZXItdmlldycpXG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QuYWRkKFwiZGVzZ2luZXItY2FudmFzXCIpO1xuICAgIHRoaXMuZWxUb29sYmFyLmNsYXNzTGlzdC5hZGQoXCJkZXNnaW5lci10b29sYmFyXCIpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxDYW52YXMpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxUb29sYmFyKTtcbiAgICB0aGlzLmVsTm9kZS50YWJJbmRleCA9IDA7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICAgIHRoaXMub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMuUmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgbmV3IERlc2dpbmVyVmlld19FdmVudCh0aGlzKTtcbiAgICB0aGlzLnRvb2xiYXIgPSBuZXcgRGVzZ2luZXJWaWV3X1Rvb2xiYXIodGhpcyk7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlVmlldyh4OiBhbnksIHk6IGFueSwgem9vbTogYW55KSB7XG4gICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7eH1weCwgJHt5fXB4KSBzY2FsZSgke3pvb219KWA7XG4gIH1cbiAgcHVibGljIFVwZGF0ZVVJKCkge1xuICAgIHRoaXMudXBkYXRlVmlldyh0aGlzLmdldFgoKSwgdGhpcy5nZXRZKCksIHRoaXMuZ2V0Wm9vbSgpKTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyVUkoZGV0YWlsOiBhbnkgPSB7fSkge1xuICAgIGlmIChkZXRhaWwuc2VuZGVyICYmIGRldGFpbC5zZW5kZXIgaW5zdGFuY2VvZiBOb2RlKSByZXR1cm47XG4gICAgaWYgKGRldGFpbC5zZW5kZXIgJiYgZGV0YWlsLnNlbmRlciBpbnN0YW5jZW9mIERlc2dpbmVyVmlldykge1xuICAgICAgdGhpcy5VcGRhdGVVSSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLkNsZWFyTm9kZSgpO1xuICAgIHRoaXMuR2V0RGF0YU5vZGUoKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHRoaXMuQWRkTm9kZUl0ZW0oaXRlbSk7XG4gICAgfSk7XG4gICAgdGhpcy5HZXRBbGxOb2RlKCkuZm9yRWFjaCgoaXRlbTogTm9kZSkgPT4ge1xuICAgICAgaXRlbS5SZW5kZXJMaW5lKCk7XG4gICAgfSlcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XG4gIH1cbiAgcHVibGljIE9wZW4oJGRhdGE6IERhdGFGbG93KSB7XG4gICAgdGhpcy5kYXRhID0gJGRhdGE7XG4gICAgdGhpcy4kbG9jayA9IGZhbHNlO1xuICAgIHRoaXMuZ3JvdXAgPSBbXTtcbiAgICB0aGlzLnRvb2xiYXIucmVuZGVyUGF0aEdyb3VwKCk7XG4gICAgdGhpcy5CaW5kRGF0YUV2ZW50KCk7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBDYWxjWChudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRXaWR0aCAvICh0aGlzLmVsTm9kZT8uY2xpZW50V2lkdGggKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHB1YmxpYyBDYWxjWShudW1iZXI6IGFueSkge1xuICAgIHJldHVybiBudW1iZXIgKiAodGhpcy5lbENhbnZhcy5jbGllbnRIZWlnaHQgLyAodGhpcy5lbE5vZGU/LmNsaWVudEhlaWdodCAqIHRoaXMuZ2V0Wm9vbSgpKSk7XG4gIH1cbiAgcHVibGljIEdldEFsbE5vZGUoKTogTm9kZVtdIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlcyB8fCBbXTtcbiAgfVxuICBwdWJsaWMgR2V0Tm9kZUJ5SWQoaWQ6IHN0cmluZyk6IE5vZGUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLkdldEFsbE5vZGUoKS5maWx0ZXIobm9kZSA9PiBub2RlLkdldElkKCkgPT0gaWQpPy5bMF07XG4gIH1cblxuICBwdWJsaWMgR2V0RGF0YUJ5SWQoaWQ6IHN0cmluZyk6IERhdGFGbG93IHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuR2V0RGF0YUFsbE5vZGUoKS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uR2V0KCdpZCcpID09PSBpZCk/LlswXTtcbiAgfVxuICBjaGVja09ubHlOb2RlKGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuICh0aGlzLm1haW4uZ2V0Q29udHJvbEJ5S2V5KGtleSkub25seU5vZGUpICYmIHRoaXMubm9kZXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5DaGVja0tleShrZXkpKS5sZW5ndGggPiAwO1xuICB9XG4gIHB1YmxpYyB6b29tX3JlZnJlc2goZmxnOiBhbnkgPSAwKSB7XG4gICAgbGV0IHRlbXBfem9vbSA9IGZsZyA9PSAwID8gWm9vbS5kZWZhdWx0IDogKHRoaXMuZ2V0Wm9vbSgpICsgWm9vbS52YWx1ZSAqIGZsZyk7XG4gICAgaWYgKFpvb20ubWF4ID49IHRlbXBfem9vbSAmJiB0ZW1wX3pvb20gPj0gWm9vbS5taW4pIHtcbiAgICAgIHRoaXMuc2V0WCgodGhpcy5nZXRYKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0ZW1wX3pvb20pO1xuICAgICAgdGhpcy5zZXRZKCh0aGlzLmdldFkoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XG4gICAgICB0aGlzLnpvb21fbGFzdF92YWx1ZSA9IHRlbXBfem9vbTtcbiAgICAgIHRoaXMuc2V0Wm9vbSh0aGlzLnpvb21fbGFzdF92YWx1ZSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB6b29tX2luKCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKDEpO1xuICB9XG4gIHB1YmxpYyB6b29tX291dCgpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgtMSk7XG4gIH1cbiAgcHVibGljIHpvb21fcmVzZXQoKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goMCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi4vZGVzZ2luZXIvRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBWaWV3RG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHJpdmF0ZSB2aWV3OiBEZXNnaW5lclZpZXcgfCB1bmRlZmluZWQ7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuXG4gICAgdGhpcy52aWV3ID0gbmV3IERlc2dpbmVyVmlldyh0aGlzLmVsTm9kZSwgbWFpbik7XG4gICAgdGhpcy52aWV3Lm9uKEV2ZW50RW51bS5zaG93UHJvcGVydHksIChkYXRhOiBhbnkpID0+IHsgbWFpbi5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCBkYXRhKTsgfSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKGl0ZW06IGFueSkgPT4ge1xuICAgICAgdGhpcy52aWV3Py5PcGVuKGl0ZW0uZGF0YSk7XG4gICAgICB0aGlzLm1haW4uU2V0UHJvamVjdE9wZW4oaXRlbS5kYXRhKTtcbiAgICB9KVxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBEb2NrRW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBDb250cm9sRG9jayB9IGZyb20gXCIuL0NvbnRyb2xEb2NrXCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5pbXBvcnQgeyBQcm9qZWN0RG9jayB9IGZyb20gXCIuL1Byb2plY3REb2NrXCI7XG5pbXBvcnQgeyBQcm9wZXJ0eURvY2sgfSBmcm9tIFwiLi9Qcm9wZXJ0eURvY2tcIjtcbmltcG9ydCB7IFRhYkRvY2sgfSBmcm9tIFwiLi9UYWJEb2NrXCI7XG5pbXBvcnQgeyBWaWV3RG9jayB9IGZyb20gXCIuL1ZpZXdEb2NrXCI7XG5cbmV4cG9ydCBjbGFzcyBEb2NrTWFuYWdlciB7XG4gIHByaXZhdGUgJGRvY2tNYW5hZ2VyOiBhbnkgPSB7fTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7IH1cbiAgcHVibGljIHJlc2V0KCkge1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyID0ge307XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLmxlZnQsIENvbnRyb2xEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgUHJvamVjdERvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5yaWdodCwgUHJvcGVydHlEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0udmlldywgVmlld0RvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS50b3AsIFRhYkRvY2spO1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5ib3R0b20sIERvY2tCYXNlKTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gIH1cbiAgcHVibGljIGFkZERvY2soJGtleTogc3RyaW5nLCAkdmlldzogYW55KSB7XG4gICAgaWYgKCF0aGlzLiRkb2NrTWFuYWdlclska2V5XSlcbiAgICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gW107XG4gICAgdGhpcy4kZG9ja01hbmFnZXJbJGtleV0gPSBbLi4udGhpcy4kZG9ja01hbmFnZXJbJGtleV0sICR2aWV3XTtcbiAgfVxuXG4gIHB1YmxpYyBSZW5kZXJVSSgpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgICA8ZGl2IGNsYXNzPVwidnMtbGVmdCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidnMtY29udGVudFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwidnMtdG9wIHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXZpZXcgdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwidnMtYm90dG9tIHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZzLXJpZ2h0IHZzLWRvY2tcIj48L2Rpdj5cbiAgICBgO1xuICAgIE9iamVjdC5rZXlzKHRoaXMuJGRvY2tNYW5hZ2VyKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgbGV0IHF1ZXJ5U2VsZWN0b3IgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAuJHtrZXl9YCk7XG4gICAgICBpZiAocXVlcnlTZWxlY3Rvcikge1xuICAgICAgICB0aGlzLiRkb2NrTWFuYWdlcltrZXldLmZvckVhY2goKCRpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICBuZXcgJGl0ZW0ocXVlcnlTZWxlY3RvciwgdGhpcy5tYWluKTtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tICcuL2NvcmUvQmFzZUZsb3cnO1xuaW1wb3J0IHsgRG9ja01hbmFnZXIgfSBmcm9tICcuL2RvY2svRG9ja01hbmFnZXInO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSAnLi9jb3JlL0V2ZW50Rmxvdyc7XG5pbXBvcnQgeyBjb21wYXJlU29ydCwgRXZlbnRFbnVtLCBQcm9wZXJ0eUVudW0gfSBmcm9tICcuL2NvcmUvQ29uc3RhbnQnO1xuaW1wb3J0IHsgZ2V0VGltZSwgZ2V0VXVpZCB9IGZyb20gJy4vY29yZS9VdGlscyc7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gJy4vY29yZS9EYXRhRmxvdyc7XG5leHBvcnQgY2xhc3MgVmlzdWFsRmxvdyBpbXBsZW1lbnRzIElNYWluIHtcbiAgcHJpdmF0ZSAkZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gIHByaXZhdGUgJHByb2plY3RPcGVuOiBhbnk7XG4gIHByaXZhdGUgJHByb3BlcnRpZXM6IGFueSA9IHt9O1xuICBwcml2YXRlICRjb250cm9sOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSAkY29udHJvbERlZmF1bHQ6IGFueSA9IHtcbiAgICBub2RlX2JlZ2luOiB7XG4gICAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtcGxheVwiPjwvaT4nLFxuICAgICAgc29ydDogMCxcbiAgICAgIG5hbWU6ICdCZWdpbicsXG4gICAgICBjbGFzczogJ25vZGUtdGVzdCcsXG4gICAgICBodG1sOiAnJyxcbiAgICAgIG91dHB1dDogMSxcbiAgICAgIGlucHV0OiAwLFxuICAgICAgb25seU5vZGU6IHRydWVcbiAgICB9LFxuICAgIG5vZGVfZW5kOiB7XG4gICAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtc3RvcFwiPjwvaT4nLFxuICAgICAgc29ydDogMCxcbiAgICAgIG5hbWU6ICdFbmQnLFxuICAgICAgaHRtbDogJycsXG4gICAgICBvdXRwdXQ6IDAsXG4gICAgICBvbmx5Tm9kZTogdHJ1ZVxuICAgIH0sXG4gICAgbm9kZV9pZjoge1xuICAgICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLWVxdWFsc1wiPjwvaT4nLFxuICAgICAgc29ydDogMCxcbiAgICAgIG5hbWU6ICdJZicsXG4gICAgICBodG1sOiAnPGRpdj5jb25kaXRpb246PGJyLz48aW5wdXQgbm9kZTptb2RlbD1cImNvbmRpdGlvblwiLz48L2Rpdj4nLFxuICAgICAgc2NyaXB0OiBgYCxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgY29uZGl0aW9uOiB7XG4gICAgICAgICAga2V5OiBcImNvbmRpdGlvblwiLFxuICAgICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvdXRwdXQ6IDJcbiAgICB9LFxuICAgIG5vZGVfZ3JvdXA6IHtcbiAgICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JyxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBuYW1lOiAnR3JvdXAnLFxuICAgICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwXCI+R288L2J1dHRvbj48L2Rpdj4nLFxuICAgICAgc2NyaXB0OiBgbm9kZS5lbE5vZGUucXVlcnlTZWxlY3RvcignLmJ0bkdvR3JvdXAnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7bm9kZS5vcGVuR3JvdXAoKX0pO2AsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGNvbmRpdGlvbjoge1xuICAgICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgb3V0cHV0OiAyXG4gICAgfSxcbiAgfVxuICBwcml2YXRlICRjb250cm9sQ2hvb3NlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IERvY2tNYW5hZ2VyO1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBwdWJsaWMgZ2V0RG9ja01hbmFnZXIoKTogRG9ja01hbmFnZXIge1xuICAgIHJldHVybiB0aGlzLiRkb2NrTWFuYWdlcjtcbiAgfVxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBnZXRDb250cm9sQWxsKCkge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sID8/IHt9O1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG9wdGlvbjogYW55ID0gbnVsbCkge1xuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5zb2x1dGlvbl0gPSB7XG4gICAgICBpZDoge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgIH0sXG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLnNvbHV0aW9uXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBgc29sdXRpb24tJHtnZXRUaW1lKCl9YFxuICAgICAgfSxcbiAgICAgIHByb2plY3RzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5saW5lXSA9IHtcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubGluZVxuICAgICAgfSxcbiAgICAgIGZyb206IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIGZyb21JbmRleDoge1xuICAgICAgICBkZWZhdWx0OiAwXG4gICAgICB9LFxuICAgICAgdG86IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHRvSW5kZXg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfVxuICAgIH07XG4gICAgLy9zZXQgcHJvamVjdFxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLm1haW5dID0ge1xuICAgICAgLi4uKG9wdGlvbj8ucHJvcGVydGllcyB8fCB7fSksXG4gICAgICBpZDoge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgIH0sXG4gICAgICBuYW1lOiB7XG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGBhcHAtJHtnZXRUaW1lKCl9YFxuICAgICAgfSxcbiAgICAgIGtleToge1xuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubWFpblxuICAgICAgfSxcbiAgICAgIHg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHk6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHpvb206IHtcbiAgICAgICAgZGVmYXVsdDogMVxuICAgICAgfSxcbiAgICAgIG5vZGVzOiB7XG4gICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICB9XG4gICAgfTtcbiAgICAvLyBzZXQgY29udHJvbFxuICAgIHRoaXMuJGNvbnRyb2wgPSB7IC4uLm9wdGlvbj8uY29udHJvbCB8fCB7fSwgLi4udGhpcy4kY29udHJvbERlZmF1bHQgfTtcbiAgICBsZXQgY29udHJvbFRlbXA6IGFueSA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMuJGNvbnRyb2wpLm1hcCgoa2V5KSA9PiAoeyAuLi50aGlzLiRjb250cm9sW2tleV0sIGtleSwgc29ydDogKHRoaXMuJGNvbnRyb2xba2V5XS5zb3J0ID09PSB1bmRlZmluZWQgPyA5OTk5OSA6IHRoaXMuJGNvbnRyb2xba2V5XS5zb3J0KSB9KSkuc29ydChjb21wYXJlU29ydCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICBjb250cm9sVGVtcFtpdGVtLmtleV0gPSBpdGVtO1xuICAgICAgdGhpcy4kcHJvcGVydGllc1tgbm9kZV8ke2l0ZW0ua2V5fWBdID0ge1xuICAgICAgICAuLi4oaXRlbS5wcm9wZXJ0aWVzIHx8IHt9KSxcbiAgICAgICAgaWQ6IHtcbiAgICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcbiAgICAgICAgfSxcbiAgICAgICAga2V5OiB7XG4gICAgICAgICAgZGVmYXVsdDogaXRlbS5rZXlcbiAgICAgICAgfSxcbiAgICAgICAgbmFtZToge1xuICAgICAgICAgIGRlZmF1bHQ6IGl0ZW0ua2V5XG4gICAgICAgIH0sXG4gICAgICAgIHg6IHtcbiAgICAgICAgICBkZWZhdWx0OiAwXG4gICAgICAgIH0sXG4gICAgICAgIHk6IHtcbiAgICAgICAgICBkZWZhdWx0OiAwXG4gICAgICAgIH0sXG4gICAgICAgIGdyb3VwOiB7XG4gICAgICAgICAgZGVmYXVsdDogJydcbiAgICAgICAgfSxcbiAgICAgICAgbGluZXM6IHtcbiAgICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuICAgIHRoaXMuJGNvbnRyb2wgPSBjb250cm9sVGVtcDtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCd2cy1jb250YWluZXInKTtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IG5ldyBEb2NrTWFuYWdlcih0aGlzLmNvbnRhaW5lciwgdGhpcyk7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIucmVzZXQoKTtcbiAgICB0aGlzLiRkYXRhLkluaXREYXRhKHt9LCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLnNvbHV0aW9uKSk7XG5cbiAgfVxuICBnZXRQcm9qZWN0QWxsKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJykgPz8gW107XG4gIH1cbiAgb3BlbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy4kZGF0YS5Jbml0RGF0YSgkZGF0YSwgdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5zb2x1dGlvbikpO1xuICB9XG4gIFNldFByb2plY3RPcGVuKCRkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLiRwcm9qZWN0T3BlbiA9ICRkYXRhO1xuICB9XG4gIENoZWNrUHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiRwcm9qZWN0T3BlbiA9PSAkZGF0YTtcbiAgfVxuICBuZXdQcm9qZWN0KCk6IHZvaWQge1xuICAgIHRoaXMub3BlblByb2plY3Qoe30pO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLm5ld1Byb2plY3QsIHt9KTtcbiAgfVxuICBvcGVuUHJvamVjdCgkZGF0YTogYW55KTogdm9pZCB7XG4gICAgaWYgKCRkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIGxldCAkcHJvamVjdDogYW55ID0gdGhpcy5nZXRQcm9qZWN0QnlJZCgkZGF0YS5HZXQoJ2lkJykpO1xuICAgICAgaWYgKCEkcHJvamVjdCkge1xuICAgICAgICAkcHJvamVjdCA9ICRkYXRhO1xuICAgICAgICB0aGlzLiRkYXRhLkFwcGVuZCgncHJvamVjdHMnLCAkcHJvamVjdCk7XG4gICAgICB9XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgJHByb2plY3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgZGF0YSA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcbiAgICAgIGRhdGEuSW5pdERhdGEoJGRhdGEsIHRoaXMuZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubWFpbikpO1xuICAgICAgdGhpcy4kZGF0YS5BcHBlbmQoJ3Byb2plY3RzJywgZGF0YSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgeyBkYXRhIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCB7IGRhdGEgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHsgZGF0YSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldFByb2plY3RCeUlkKCRpZDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEuR2V0KCdwcm9qZWN0cycpLmZpbHRlcigoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0uR2V0KCdpZCcpID09PSAkaWQpPy5bMF07XG4gIH1cbiAgc2V0Q29udHJvbENob29zZShrZXk6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLiRjb250cm9sQ2hvb3NlID0ga2V5O1xuICB9XG4gIGdldENvbnRyb2xDaG9vc2UoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuJGNvbnRyb2xDaG9vc2U7XG4gIH1cbiAgZ2V0Q29udHJvbEJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuJGNvbnRyb2xba2V5XSB8fCB7fTtcbiAgfVxuICBnZXRDb250cm9sTm9kZUJ5S2V5KGtleTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRoaXMuZ2V0Q29udHJvbEJ5S2V5KGtleSksXG4gICAgICBwcm9wZXJ0aWVzOiB0aGlzLmdldFByb3BlcnR5QnlLZXkoYG5vZGVfJHtrZXl9YClcbiAgICB9XG4gIH1cbiAgZ2V0UHJvcGVydHlCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLiRwcm9wZXJ0aWVzW2tleV07XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQU8sTUFBTSxTQUFTLEdBQUc7QUFDdkIsSUFBQSxJQUFJLEVBQUUsTUFBTTtBQUNaLElBQUEsVUFBVSxFQUFFLFlBQVk7QUFDeEIsSUFB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
