
  /**
   * @license
   * author: Nguyen Van Hau
   * visualflow.js v0.0.1-beta2
   * Released under the MIT license.
   */

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

export { VisualFlow as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5lcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvQ29uc3RhbnQudHMiLCIuLi9zcmMvZG9jay9Eb2NrQmFzZS50cyIsIi4uL3NyYy9kb2NrL0NvbnRyb2xEb2NrLnRzIiwiLi4vc3JjL2RvY2svUHJvamVjdERvY2sudHMiLCIuLi9zcmMvY29yZS9FZGl0b3IudHMiLCIuLi9zcmMvZG9jay9Qcm9wZXJ0eURvY2sudHMiLCIuLi9zcmMvZG9jay9UYWJEb2NrLnRzIiwiLi4vc3JjL2NvcmUvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvcmUvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29yZS9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb3JlL1V0aWxzLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0xpbmUudHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3X0V2ZW50LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld19Ub29sYmFyLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL05vZGUudHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3LnRzIiwiLi4vc3JjL2RvY2svVmlld0RvY2sudHMiLCIuLi9zcmMvZG9jay9Eb2NrTWFuYWdlci50cyIsIi4uL3NyYy9WaXN1YWxGbG93LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBFdmVudEVudW0gPSB7XHJcbiAgaW5pdDogXCJpbml0XCIsXHJcbiAgZGF0YUNoYW5nZTogXCJkYXRhQ2hhbmdlXCIsXHJcbiAgc2hvd1Byb3BlcnR5OiBcInNob3dQcm9wZXJ0eVwiLFxyXG4gIG9wZW5Qcm9qZWN0OiBcIm9wZW5Qcm9qZWN0XCIsXHJcbiAgbmV3UHJvamVjdDogXCJuZXdQcm9qZWN0XCIsXHJcbiAgY2hhbmdlOiBcImNoYW5nZVwiLFxyXG4gIGRpc3Bvc2U6IFwiZGlzcG9zZVwiXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBEb2NrRW51bSA9IHtcclxuICBsZWZ0OiBcInZzLWxlZnRcIixcclxuICB0b3A6IFwidnMtdG9wXCIsXHJcbiAgdmlldzogXCJ2cy12aWV3XCIsXHJcbiAgYm90dG9tOiBcInZzLWJvdHRvbVwiLFxyXG4gIHJpZ2h0OiBcInZzLXJpZ2h0XCIsXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XHJcbiAgbWFpbjogXCJtYWluX3Byb2plY3RcIixcclxuICBzb2x1dGlvbjogJ21haW5fc29sdXRpb24nLFxyXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxyXG4gIHZhcmlhYmxlOiAnbWFpbl92YXJpYWJsZSdcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBjb21wYXJlU29ydCA9IChhOiBhbnksIGI6IGFueSkgPT4ge1xyXG4gIGlmIChhLnNvcnQgPCBiLnNvcnQpIHtcclxuICAgIHJldHVybiAtMTtcclxuICB9XHJcbiAgaWYgKGEuc29ydCA+IGIuc29ydCkge1xyXG4gICAgcmV0dXJuIDE7XHJcbiAgfVxyXG4gIHJldHVybiAwO1xyXG59XHJcbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEb2NrQmFzZSB7XHJcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBwcm90ZWN0ZWQgZWxDb250ZW50OiBFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJ0RvY2tCYXNlJztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBCb3hJbmZvKHRpdGxlOiBzdHJpbmcsICRjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCd2cy1ib3hpbmZvJyk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ib3hpbmZvJyk7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInZzLWJveGluZm9faGVhZGVyXCI+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX3RpdGxlXCI+JHt0aXRsZX08L3NwYW4+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX2J1dHRvblwiPjwvc3Bhbj48L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJ2cy1ib3hpbmZvX2NvbnRlbnRcIj48L2Rpdj5gO1xyXG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19jb250ZW50Jyk7XHJcbiAgICBpZiAoJGNhbGxiYWNrKSB7XHJcbiAgICAgICRjYWxsYmFjayh0aGlzLmVsQ29udGVudCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbnRyb2xEb2NrIGV4dGVuZHMgRG9ja0Jhc2Uge1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcclxuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1jb250cm9sJyk7XHJcbiAgICB0aGlzLkJveEluZm8oJ0NvbnRyb2wnLCAobm9kZTogSFRNTEVsZW1lbnQpID0+IHtcclxuICAgICAgbGV0IGNvbnRyb2xzID0gdGhpcy5tYWluLmdldENvbnRyb2xBbGwoKTtcclxuICAgICAgT2JqZWN0LmtleXMoY29udHJvbHMpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAgIGxldCBub2RlSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ25vZGUtaXRlbScpO1xyXG4gICAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZHJhZ2dhYmxlJywgJ3RydWUnKTtcclxuICAgICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtbm9kZScsIGl0ZW0pO1xyXG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2NvbnRyb2xzW2l0ZW1dLmljb259IDxzcGFuPiR7Y29udHJvbHNbaXRlbV0ubmFtZX08L3NwYW5gO1xyXG4gICAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdzdGFydCcsIHRoaXMuZHJhZ1N0YXJ0LmJpbmQodGhpcykpXHJcbiAgICAgICAgbm9kZUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VuZCcsIHRoaXMuZHJhZ2VuZC5iaW5kKHRoaXMpKVxyXG4gICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQobm9kZUl0ZW0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBwcml2YXRlIGRyYWdlbmQoZTogYW55KSB7XHJcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShudWxsKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZHJhZ1N0YXJ0KGU6IGFueSkge1xyXG4gICAgbGV0IGtleSA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIubm9kZS1pdGVtXCIpLmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJyk7XHJcbiAgICB0aGlzLm1haW4uc2V0Q29udHJvbENob29zZShrZXkpO1xyXG4gICAgaWYgKGUudHlwZSAhPT0gXCJ0b3VjaHN0YXJ0XCIpIHtcclxuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwga2V5KTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xyXG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xyXG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL0RhdGFGbG93XCI7XHJcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9qZWN0RG9jayBleHRlbmRzIERvY2tCYXNlIHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvamVjdCcpO1xyXG4gICAgdGhpcy5Cb3hJbmZvKCdQcm9qZWN0JywgdGhpcy5yZW5kZXJVSS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0uY2hhbmdlLCB0aGlzLnJlbmRlclVJLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKGRldGFpbDogYW55KSA9PiB7XHJcbiAgICAgIHRoaXMuZWxDb250ZW50Py5xdWVyeVNlbGVjdG9yQWxsKCcuYWN0aXZlJykuZm9yRWFjaCgoX25vZGUpID0+IHtcclxuICAgICAgICBfbm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuICAgICAgfSk7XHJcbiAgICAgIGlmICh0aGlzLmVsQ29udGVudCAmJiBkZXRhaWw/LmRhdGE/LkdldCgnaWQnKSkge1xyXG4gICAgICAgIHRoaXMuZWxDb250ZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXByb2plY3QtaWQ9XCIke2RldGFpbD8uZGF0YT8uR2V0KCdpZCcpfVwiXWApPy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcbiAgcHJpdmF0ZSByZW5kZXJVSSgpIHtcclxuICAgIGxldCAkbm9kZVJpZ2h0OiBIVE1MRWxlbWVudCB8IG51bGwgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcudnMtYm94aW5mb19oZWFkZXIgLnZzLWJveGluZm9fYnV0dG9uJyk7XHJcbiAgICBpZiAoIXRoaXMuZWxDb250ZW50KSByZXR1cm47XHJcbiAgICB0aGlzLmVsQ29udGVudC5pbm5lckhUTUwgPSBgYDtcclxuICAgIGlmICgkbm9kZVJpZ2h0KSB7XHJcbiAgICAgICRub2RlUmlnaHQuaW5uZXJIVE1MID0gYGA7XHJcbiAgICAgIGxldCBidXR0b25OZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcclxuICAgICAgJG5vZGVSaWdodD8uYXBwZW5kQ2hpbGQoYnV0dG9uTmV3KTtcclxuICAgICAgYnV0dG9uTmV3LmlubmVySFRNTCA9IGBOZXdgO1xyXG4gICAgICBidXR0b25OZXcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLm1haW4ubmV3UHJvamVjdCgnJykpO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBwcm9qZWN0cyA9IHRoaXMubWFpbi5nZXRQcm9qZWN0QWxsKCk7XHJcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xyXG4gICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XHJcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcclxuICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QtaWQnLCBpdGVtLkdldCgnaWQnKSk7XHJcbiAgICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XHJcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xyXG4gICAgICB9KTtcclxuICAgICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcclxuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAodGhpcy5tYWluLkNoZWNrUHJvamVjdE9wZW4oaXRlbSkpIHtcclxuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgfVxyXG4gICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB7IGRhdGE6IGl0ZW0gfSk7XHJcbiAgICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogaXRlbSB9KTtcclxuXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLmVsQ29udGVudD8uYXBwZW5kQ2hpbGQobm9kZUl0ZW0pO1xyXG4gICAgfSk7XHJcblxyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBCYXNlRmxvdywgRmxvd0NvcmUgfSBmcm9tIFwiLi9CYXNlRmxvd1wiXHJcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XHJcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgTE9HIH0gZnJvbSBcIi4vVXRpbHNcIjtcclxuZXhwb3J0IGVudW0gRWRpdG9yVHlwZSB7XHJcbiAgTGFiZWwsXHJcbiAgVGV4dCxcclxuICBJbmxpbmVcclxufVxyXG5leHBvcnQgY2xhc3MgRWRpdG9yIHtcclxuICBwcml2YXRlIGlzRWRpdDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gIHByaXZhdGUgZWxJbnB1dDogSFRNTERhdGFFbGVtZW50IHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSBlbExhYmVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZGF0YTogRGF0YUZsb3csIHByaXZhdGUga2V5OiBzdHJpbmcsIGVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsLCBwcml2YXRlIHR5cGU6IEVkaXRvclR5cGUgPSBFZGl0b3JUeXBlLkxhYmVsLCBjaGFnbmU6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cclxuICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICB0aGlzLmRhdGEub25TYWZlKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB0aGlzLmNoYW5nZURhdGEuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmRhdGEub25TYWZlKEV2ZW50RW51bS5kaXNwb3NlLCB0aGlzLmRpc3Bvc2UuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmlzRWRpdCA9IHR5cGUgPT09IEVkaXRvclR5cGUuVGV4dDtcclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ25vZGUtZWRpdG9yJyk7XHJcbiAgICBpZiAoY2hhZ25lICYmIGVsKSB7XHJcbiAgICAgIGVsLnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZSh0aGlzLmVsTm9kZSwgZWwpO1xyXG4gICAgICBlbC5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZChlbCk7XHJcbiAgICAgIGVsPy5yZW1vdmUoKTtcclxuICAgIH0gZWxzZSBpZiAoZWwpIHtcclxuICAgICAgZWwuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5yZW5kZXIoKTtcclxuICB9XHJcbiAgcHVibGljIHJlbmRlcigpIHtcclxuICAgIGxldCBkYXRhID0gdGhpcy5kYXRhLkdldCh0aGlzLmtleSk7XHJcblxyXG4gICAgaWYgKHRoaXMuaXNFZGl0KSB7XHJcbiAgICAgIGlmICh0aGlzLmVsTGFiZWwpIHtcclxuICAgICAgICB0aGlzLmVsTGFiZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLnN3aXRjaE1vZGVFZGl0LmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuZWxMYWJlbC5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLmVsTGFiZWwgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLmVsSW5wdXQpIHtcclxuICAgICAgICB0aGlzLmVsSW5wdXQudmFsdWUgPSBkYXRhO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmVsSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gICAgICB0aGlzLmVsSW5wdXQuY2xhc3NMaXN0LmFkZCgnbm9kZS1mb3JtLWNvbnRyb2wnKTtcclxuICAgICAgdGhpcy5lbElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmlucHV0RGF0YS5iaW5kKHRoaXMpKTtcclxuICAgICAgdGhpcy5lbElucHV0LnZhbHVlID0gZGF0YTtcclxuICAgICAgdGhpcy5lbElucHV0LnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIHRoaXMua2V5KTtcclxuICAgICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbElucHV0KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh0aGlzLmVsSW5wdXQpIHtcclxuICAgICAgICB0aGlzLmVsSW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmlucHV0RGF0YS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmVsSW5wdXQucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy5lbElucHV0ID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5lbExhYmVsKSB7XHJcbiAgICAgICAgdGhpcy5lbExhYmVsLmlubmVySFRNTCA9IGRhdGE7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuZWxMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgaWYgKHRoaXMudHlwZSA9PSBFZGl0b3JUeXBlLklubGluZSkge1xyXG4gICAgICAgIHRoaXMuZWxMYWJlbC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuc3dpdGNoTW9kZUVkaXQuYmluZCh0aGlzKSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5lbExhYmVsLnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIHRoaXMua2V5KTtcclxuICAgICAgdGhpcy5lbExhYmVsLmlubmVySFRNTCA9IGRhdGE7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxMYWJlbCk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBzd2l0Y2hNb2RlRWRpdCgpIHtcclxuICAgIHRoaXMuaXNFZGl0ID0gdHJ1ZTtcclxuICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBpbnB1dERhdGEoZTogYW55KSB7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLmtleSwgZS50YXJnZXQudmFsdWUsIHRoaXMpO1xyXG4gICAgfSlcclxuICB9XHJcbiAgcHVibGljIGNoYW5nZURhdGEoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSB7XHJcbiAgICB0aGlzLnJlbmRlcigpO1xyXG4gIH1cclxuICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgIHRoaXMuZWxJbnB1dD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaW5wdXREYXRhLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbExhYmVsPy5yZW1vdmVFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuc3dpdGNoTW9kZUVkaXQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7dGhpcy5rZXl9YCwgdGhpcy5jaGFuZ2VEYXRhLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kaXNwb3NlLCB0aGlzLmRpc3Bvc2UuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XHJcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgRWRpdG9yLCBFZGl0b3JUeXBlIH0gZnJvbSBcIi4uL2NvcmUvRWRpdG9yXCI7XHJcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eURvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XHJcbiAgcHJpdmF0ZSBsYXN0RGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XHJcbiAgcHJpdmF0ZSBsYWJlbEtleXM6IHN0cmluZ1tdID0gWydpZCcsICdrZXknLCAnZ3JvdXAnXTtcclxuICBwcml2YXRlIGRhdGFKc29uOiBIVE1MVGV4dEFyZWFFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcclxuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XHJcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xyXG5cclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb3BlcnR5Jyk7XHJcbiAgICB0aGlzLkJveEluZm8oJ1Byb3BlcnR5JywgKG5vZGU6IEhUTUxFbGVtZW50KSA9PiB7XHJcbiAgICAgIG1haW4ub24oRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgKGRldGFpbDogYW55KSA9PiB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJVSShub2RlLCBkZXRhaWwuZGF0YSk7XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcHJpdmF0ZSByZW5kZXJVSShub2RlOiBIVE1MRWxlbWVudCwgZGF0YTogRGF0YUZsb3cpIHtcclxuICAgIGlmICh0aGlzLmxhc3REYXRhID09IGRhdGEpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5sYXN0RGF0YSA9IGRhdGE7XHJcbiAgICBub2RlLmlubmVySFRNTCA9ICcnO1xyXG4gICAgbGV0IHByb3BlcnRpZXM6IGFueSA9IGRhdGEuZ2V0UHJvcGVydGllcygpXHJcbiAgICBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICBsZXQgcHJvcGVydHlJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgIHByb3BlcnR5SXRlbS5jbGFzc0xpc3QuYWRkKCdwcm9wZXJ0eS1pdGVtJyk7XHJcbiAgICAgIGxldCBwcm9wZXJ0eUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgIHByb3BlcnR5TGFiZWwuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktbGFiZWwnKTtcclxuICAgICAgcHJvcGVydHlMYWJlbC5pbm5lckhUTUwgPSBrZXk7XHJcbiAgICAgIGxldCBwcm9wZXJ0eVZhbHVlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgIHByb3BlcnR5VmFsdWUuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktdmFsdWUnKTtcclxuICAgICAgaWYgKHRoaXMubGFiZWxLZXlzLmluY2x1ZGVzKGtleSkpIHtcclxuICAgICAgICBuZXcgRWRpdG9yKGRhdGEsIGtleSwgcHJvcGVydHlWYWx1ZSwgRWRpdG9yVHlwZS5MYWJlbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbmV3IEVkaXRvcihkYXRhLCBrZXksIHByb3BlcnR5VmFsdWUsIEVkaXRvclR5cGUuVGV4dCk7XHJcbiAgICAgIH1cclxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xyXG4gICAgICBwcm9wZXJ0eUl0ZW0uYXBwZW5kQ2hpbGQocHJvcGVydHlWYWx1ZSk7XHJcbiAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocHJvcGVydHlJdGVtKTtcclxuICAgIH0pO1xyXG4gICAgbm9kZS5hcHBlbmRDaGlsZCh0aGlzLmRhdGFKc29uKTtcclxuICAgIHRoaXMuZGF0YUpzb24udmFsdWUgPSBkYXRhLnRvU3RyaW5nKCk7XHJcbiAgICB0aGlzLmRhdGFKc29uLmNsYXNzTGlzdC5hZGQoJ25vZGUtZm9ybS1jb250cm9sJyk7XHJcbiAgICBkYXRhLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoKSA9PiB0aGlzLmRhdGFKc29uLnZhbHVlID0gZGF0YS50b1N0cmluZygpKVxyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XHJcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFRhYkRvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xyXG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcclxuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBgO1xyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtdGFiJyk7XHJcbiAgICB0aGlzLm1haW4ub24oRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCAoZGV0YWlsOiBhbnkpID0+IHtcclxuICAgICAgdGhpcy5lbE5vZGU/LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY3RpdmUnKS5mb3JFYWNoKChfbm9kZSkgPT4ge1xyXG4gICAgICAgIF9ub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYgKHRoaXMuZWxOb2RlICYmIGRldGFpbD8uZGF0YT8uR2V0KCdpZCcpKSB7XHJcbiAgICAgICAgdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcihgW2RhdGEtcHJvamVjdC1pZD1cIiR7ZGV0YWlsPy5kYXRhPy5HZXQoJ2lkJyl9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ubmV3UHJvamVjdCwgdGhpcy5yZW5kZXIuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG5cclxuICByZW5kZXIoKSB7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcclxuICAgIGxldCBwcm9qZWN0cyA9IHRoaXMubWFpbi5nZXRQcm9qZWN0QWxsKCk7XHJcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xyXG4gICAgICBsZXQgbm9kZUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XHJcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcclxuICAgICAgbm9kZUl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLXByb2plY3QtaWQnLCBpdGVtLkdldCgnaWQnKSk7XHJcbiAgICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XHJcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xyXG4gICAgICB9KTtcclxuICAgICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcclxuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpZiAodGhpcy5tYWluLkNoZWNrUHJvamVjdE9wZW4oaXRlbSkpIHtcclxuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgfVxyXG4gICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB7IGRhdGE6IGl0ZW0gfSk7XHJcbiAgICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogaXRlbSB9KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuZWxOb2RlPy5hcHBlbmRDaGlsZChub2RlSXRlbSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiZXhwb3J0IGNsYXNzIEV2ZW50RmxvdyB7XHJcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHsgfVxyXG4gIHB1YmxpYyBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgdGhpcy5vbihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICAvKiBFdmVudHMgKi9cclxuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNhbGxiYWNrIGlzIG5vdCBhIGZ1bmN0aW9uXHJcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXHJcbiAgICBpZiAodHlwZW9mIGV2ZW50ICE9PSAnc3RyaW5nJykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgZXZlbnQgbmFtZSBtdXN0IGJlIGEgc3RyaW5nLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBldmVudH1gKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXHJcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0ge1xyXG4gICAgICAgIGxpc3RlbmVyczogW11cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcclxuXHJcbiAgICBpZiAoIXRoaXMuZXZlbnRzW2V2ZW50XSkgcmV0dXJuIGZhbHNlXHJcblxyXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVyc1xyXG4gICAgY29uc3QgbGlzdGVuZXJJbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKVxyXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcclxuICAgIGlmIChoYXNMaXN0ZW5lcikgbGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXHJcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XHJcbiAgICAgIGxpc3RlbmVyKGRldGFpbHMpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IElQcm9wZXJ0eSB9IGZyb20gXCIuL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XHJcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gXCIuL0V2ZW50Rmxvd1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcclxuICBwcml2YXRlIGRhdGE6IGFueSA9IHt9O1xyXG4gIHByaXZhdGUgcHJvcGVydGllczogYW55ID0gbnVsbDtcclxuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xyXG4gIHB1YmxpYyBnZXRQcm9wZXJ0aWVzKCk6IGFueSB7XHJcbiAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzO1xyXG4gIH1cclxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLm9uKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xyXG5cclxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcclxuICB9XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvcGVydHk6IElQcm9wZXJ0eSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCwgZGF0YTogYW55ID0gdW5kZWZpbmVkKSB7XHJcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgIHRoaXMubG9hZChkYXRhKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIEluaXREYXRhKGRhdGE6IGFueSA9IG51bGwsIHByb3BlcnRpZXM6IGFueSA9IC0xKSB7XHJcbiAgICBpZiAocHJvcGVydGllcyAhPT0gLTEpIHtcclxuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gcHJvcGVydGllcztcclxuICAgIH1cclxuICAgIHRoaXMubG9hZChkYXRhKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBldmVudERhdGFDaGFuZ2Uoa2V5OiBzdHJpbmcsIGtleUNoaWxkOiBzdHJpbmcsIHZhbHVlQ2hpbGQ6IGFueSwgc2VuZGVyQ2hpbGQ6IGFueSwgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKGluZGV4KSB7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fV8ke2luZGV4fV8ke2tleUNoaWxkfWAsIHtcclxuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcclxuICAgICAgfSk7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fV8ke2luZGV4fWAsIHtcclxuICAgICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCwgaW5kZXhcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtrZXlDaGlsZH1gLCB7XHJcbiAgICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XHJcbiAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcHVibGljIFJlbW92ZUV2ZW50RGF0YShpdGVtOiBEYXRhRmxvdywga2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcclxuICAgIGlmICghaXRlbSkgcmV0dXJuO1xyXG4gICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xyXG4gIH1cclxuICBwdWJsaWMgT25FdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XHJcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcclxuICAgIGl0ZW0ub24oYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9YCwgKHsga2V5OiBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGQgfTogYW55KSA9PiB0aGlzLmV2ZW50RGF0YUNoYW5nZShrZXksIGtleUNoaWxkLCB2YWx1ZUNoaWxkLCBzZW5kZXJDaGlsZCwgaW5kZXgpKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBCaW5kRXZlbnQodmFsdWU6IGFueSwga2V5OiBzdHJpbmcpIHtcclxuICAgIGlmICghdmFsdWUpIHJldHVybjtcclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XHJcbiAgICAgIHRoaXMuT25FdmVudERhdGEodmFsdWUgYXMgRGF0YUZsb3csIGtleSk7XHJcbiAgICB9XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgKHZhbHVlIGFzIFtdKS5sZW5ndGggPiAwICYmIHZhbHVlWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcclxuICAgICAgKHZhbHVlIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLk9uRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIFNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0Rpc3BhdGNoOiBib29sZWFuID0gdHJ1ZSkge1xyXG4gICAgaWYgKHRoaXMuZGF0YVtrZXldICE9IHZhbHVlKSB7XHJcbiAgICAgIGlmICh0aGlzLmRhdGFba2V5XSkge1xyXG4gICAgICAgIGlmICh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XHJcbiAgICAgICAgICB0aGlzLlJlbW92ZUV2ZW50RGF0YSgodGhpcy5kYXRhW2tleV0gYXMgRGF0YUZsb3cpLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFba2V5XSkgJiYgKHRoaXMuZGF0YVtrZXldIGFzIFtdKS5sZW5ndGggPiAwICYmIHRoaXMuZGF0YVtrZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcclxuICAgICAgICAgICh0aGlzLmRhdGFba2V5XSBhcyBEYXRhRmxvd1tdKS5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdywgaW5kZXg6IG51bWJlcikgPT4gdGhpcy5SZW1vdmVFdmVudERhdGEoaXRlbSwga2V5LCBpbmRleCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLkJpbmRFdmVudCh2YWx1ZSwga2V5KTtcclxuICAgIH1cclxuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XHJcbiAgICBpZiAoaXNEaXNwYXRjaCkge1xyXG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XHJcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XHJcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcclxuICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuICBwdWJsaWMgU2V0RGF0YShkYXRhOiBhbnksIHNlbmRlcjogYW55ID0gbnVsbCwgaXNDbGVhckRhdGEgPSBmYWxzZSkge1xyXG5cclxuICAgIGlmIChpc0NsZWFyRGF0YSkgdGhpcy5kYXRhID0ge307XHJcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XHJcbiAgICAgIGxldCAkZGF0YTogRGF0YUZsb3cgPSBkYXRhIGFzIERhdGFGbG93O1xyXG4gICAgICBpZiAoIXRoaXMucHJvcGVydHkgJiYgJGRhdGEucHJvcGVydHkpIHRoaXMucHJvcGVydHkgPSAkZGF0YS5wcm9wZXJ0eTtcclxuICAgICAgaWYgKHRoaXMucHJvcGVydGllcykge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICB0aGlzLlNldChrZXksICRkYXRhLkdldChrZXkpLCBzZW5kZXIsIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKCRkYXRhLmdldFByb3BlcnRpZXMoKSkpIHtcclxuICAgICAgICAgIHRoaXMuU2V0KGtleSwgJGRhdGEuR2V0KGtleSksIHNlbmRlciwgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIE9iamVjdC5rZXlzKGRhdGEpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICB0aGlzLlNldChrZXksIGRhdGFba2V5XSwgc2VuZGVyLCBmYWxzZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xyXG4gICAgICBkYXRhXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcHVibGljIEdldChrZXk6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrZXldO1xyXG4gIH1cclxuICBwdWJsaWMgQXBwZW5kKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICBpZiAoIXRoaXMuZGF0YVtrZXldKSB0aGlzLmRhdGFba2V5XSA9IFtdO1xyXG4gICAgdGhpcy5kYXRhW2tleV0gPSBbLi4udGhpcy5kYXRhW2tleV0sIHZhbHVlXTtcclxuICAgIHRoaXMuQmluZEV2ZW50KHZhbHVlLCBrZXkpO1xyXG4gIH1cclxuICBwdWJsaWMgUmVtb3ZlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICB0aGlzLmRhdGFba2V5XS5pbmRleE9mKHZhbHVlKTtcclxuICAgIHZhciBpbmRleCA9IHRoaXMuZGF0YVtrZXldLmluZGV4T2YodmFsdWUpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgdGhpcy5SZW1vdmVFdmVudERhdGEodGhpcy5kYXRhW2tleV1baW5kZXhdLCBrZXkpO1xyXG4gICAgICB0aGlzLmRhdGFba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgbG9hZChkYXRhOiBhbnkpIHtcclxuICAgIHRoaXMuZGF0YSA9IHt9O1xyXG4gICAgaWYgKCF0aGlzLnByb3BlcnRpZXMpIHtcclxuICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5wcm9wZXJ0eT8uZ2V0UHJvcGVydHlCeUtleShkYXRhLmtleSk7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhW2tleV0gPSAoZGF0YT8uW2tleV0gPz8gKCh0eXBlb2YgdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0KCkgOiB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCkgPz8gXCJcIikpO1xyXG4gICAgICAgIGlmICghKHRoaXMuZGF0YVtrZXldIGluc3RhbmNlb2YgRGF0YUZsb3cpICYmIHRoaXMuZGF0YVtrZXldLmtleSkge1xyXG4gICAgICAgICAgdGhpcy5kYXRhW2tleV0gPSBuZXcgRGF0YUZsb3codGhpcy5wcm9wZXJ0eSwgdGhpcy5kYXRhW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFba2V5XSkgJiYgdGhpcy5wcm9wZXJ0eSAmJiAhKHRoaXMuZGF0YVtrZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpKSB7XHJcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IHRoaXMuZGF0YVtrZXldLm1hcCgoaXRlbTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghKGl0ZW0gaW5zdGFuY2VvZiBEYXRhRmxvdykgJiYgaXRlbS5rZXkpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGFGbG93KHRoaXMucHJvcGVydHksIGl0ZW0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiBpdGVtO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5CaW5kRXZlbnQodGhpcy5kYXRhW2tleV0sIGtleSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIHRvU3RyaW5nKCkge1xyXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudG9Kc29uKCkpO1xyXG4gIH1cclxuICBwdWJsaWMgdG9Kc29uKCkge1xyXG4gICAgbGV0IHJzOiBhbnkgPSB7fTtcclxuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XHJcbiAgICAgIHJzW2tleV0gPSB0aGlzLkdldChrZXkpO1xyXG4gICAgICBpZiAocnNba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XHJcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0udG9Kc29uKCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocnNba2V5XSkgJiYgKHJzW2tleV0gYXMgW10pLmxlbmd0aCA+IDAgJiYgcnNba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XHJcbiAgICAgICAgcnNba2V5XSA9IHJzW2tleV0ubWFwKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS50b0pzb24oKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBycztcclxuICB9XHJcbiAgcHVibGljIGRlbGV0ZSgpIHtcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xyXG4gICAgdGhpcy5kYXRhID0ge307XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcclxuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcclxuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElQcm9wZXJ0eSB7XHJcbiAgZ2V0UHJvcGVydHlCeUtleShrZXk6IHN0cmluZyk6IGFueTtcclxufVxyXG5leHBvcnQgaW50ZXJmYWNlIElDb250cm9sTm9kZSBleHRlbmRzIElQcm9wZXJ0eSB7XHJcbiAgZ2V0Q29udHJvbE5vZGVCeUtleShrZXk6IHN0cmluZyk6IGFueTtcclxufVxyXG5leHBvcnQgaW50ZXJmYWNlIElFdmVudCB7XHJcbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpOiB2b2lkO1xyXG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpOiB2b2lkO1xyXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpOiB2b2lkO1xyXG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSk6IHZvaWQ7XHJcbn1cclxuZXhwb3J0IGludGVyZmFjZSBJTWFpbiBleHRlbmRzIElDb250cm9sTm9kZSwgSUV2ZW50IHtcclxuICBuZXdQcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkO1xyXG4gIG9wZW5Qcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkO1xyXG4gIGdldFByb2plY3RBbGwoKTogYW55W107XHJcbiAgU2V0UHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IHZvaWQ7XHJcbiAgQ2hlY2tQcm9qZWN0T3BlbigkZGF0YTogYW55KTogYm9vbGVhbjtcclxuICBvcGVuKCRkYXRhOiBhbnkpOiB2b2lkO1xyXG4gIGdldENvbnRyb2xBbGwoKTogYW55W107XHJcbiAgc2V0Q29udHJvbENob29zZShrZXk6IHN0cmluZyB8IG51bGwpOiB2b2lkO1xyXG4gIGdldENvbnRyb2xDaG9vc2UoKTogc3RyaW5nIHwgbnVsbDtcclxuICBnZXRDb250cm9sQnlLZXkoa2V5OiBzdHJpbmcpOiBhbnk7XHJcbn1cclxuZXhwb3J0IGNsYXNzIEZsb3dDb3JlIGltcGxlbWVudHMgSUV2ZW50IHtcclxuICBwdWJsaWMgR2V0SWQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnaWQnKTtcclxuICB9XHJcbiAgcHVibGljIFNldElkKGlkOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCdpZCcsIGlkKTtcclxuICB9XHJcbiAgcHVibGljIHByb3BlcnRpZXM6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xyXG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblxyXG4gIHB1YmxpYyBDaGVja0VsZW1lbnRDaGlsZChlbDogSFRNTEVsZW1lbnQpIHtcclxuICAgIHJldHVybiB0aGlzLmVsTm9kZSA9PSBlbCB8fCB0aGlzLmVsTm9kZS5jb250YWlucyhlbCk7XHJcbiAgfVxyXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XHJcbiAgcHVibGljIFNldERhdGEoZGF0YTogYW55LCBzZW5kZXI6IGFueSA9IG51bGwpIHtcclxuICAgIHRoaXMuZGF0YS5TZXREYXRhKGRhdGEsIHNlbmRlcik7XHJcbiAgfVxyXG4gIHB1YmxpYyBTZXREYXRhRmxvdyhkYXRhOiBEYXRhRmxvdykge1xyXG4gICAgdGhpcy5kYXRhLlNldERhdGEoZGF0YSwgdGhpcywgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5kaXNwYXRjaChgYmluZF9kYXRhX2V2ZW50YCwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XHJcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHsgZGF0YSwgc2VuZGVyOiB0aGlzIH0pO1xyXG4gIH1cclxuICBvblNhZmUoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub25TYWZlKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xyXG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcclxuICB9XHJcbiAgQmluZERhdGFFdmVudCgpIHtcclxuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB7XHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgdGhpcy5kYXRhLm9uKEV2ZW50RW51bS5jaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XHJcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgUmVtb3ZlRGF0YUV2ZW50KCkge1xyXG4gICAgdGhpcy5kYXRhLnJlbW92ZUxpc3RlbmVyKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pXHJcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmNoYW5nZSwgKHsga2V5LCB2YWx1ZSwgc2VuZGVyIH06IGFueSkgPT4ge1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHtcclxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcclxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcclxuICAgIHRoaXMuQmluZERhdGFFdmVudCgpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJhc2VGbG93PFRQYXJlbnQgZXh0ZW5kcyBGbG93Q29yZT4gZXh0ZW5kcyBGbG93Q29yZSB7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJlbnQ6IFRQYXJlbnQpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgfVxyXG59XHJcbiIsImV4cG9ydCBjb25zdCBMT0cgPSAobWVzc2FnZT86IGFueSwgLi4ub3B0aW9uYWxQYXJhbXM6IGFueVtdKSA9PiBjb25zb2xlLmxvZyhtZXNzYWdlLCBvcHRpb25hbFBhcmFtcyk7XHJcbmV4cG9ydCBjb25zdCBnZXREYXRlID0gKCkgPT4gKG5ldyBEYXRlKCkpO1xyXG5leHBvcnQgY29uc3QgZ2V0VGltZSA9ICgpID0+IGdldERhdGUoKS5nZXRUaW1lKCk7XHJcbmV4cG9ydCBjb25zdCBnZXRVdWlkID0gKCkgPT4ge1xyXG4gIC8vIGh0dHA6Ly93d3cuaWV0Zi5vcmcvcmZjL3JmYzQxMjIudHh0XHJcbiAgbGV0IHM6IGFueSA9IFtdO1xyXG4gIGxldCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM2OyBpKyspIHtcclxuICAgIHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApLCAxKTtcclxuICB9XHJcbiAgc1sxNF0gPSBcIjRcIjsgIC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxyXG4gIHNbMTldID0gaGV4RGlnaXRzLnN1YnN0cigoc1sxOV0gJiAweDMpIHwgMHg4LCAxKTsgIC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXHJcbiAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xyXG5cclxuICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcclxuICByZXR1cm4gdXVpZDtcclxufVxyXG4iLCJpbXBvcnQgeyBQcm9wZXJ0eUVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xyXG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL0RhdGFGbG93XCI7XHJcbmltcG9ydCB7IE5vZGUgfSBmcm9tIFwiLi9Ob2RlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTGluZSB7XHJcbiAgcHVibGljIGVsTm9kZTogU1ZHRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInN2Z1wiKTtcclxuICBwdWJsaWMgZWxQYXRoOiBTVkdQYXRoRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInBhdGhcIik7XHJcbiAgcHJpdmF0ZSBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xyXG4gIHByaXZhdGUgY3VydmF0dXJlOiBudW1iZXIgPSAwLjU7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBmcm9tOiBOb2RlLCBwdWJsaWMgZnJvbUluZGV4OiBudW1iZXIgPSAwLCBwdWJsaWMgdG86IE5vZGUgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsIHB1YmxpYyB0b0luZGV4OiBudW1iZXIgPSAwLCBkYXRhOiBhbnkgPSBudWxsKSB7XHJcbiAgICB0aGlzLmVsUGF0aC5jbGFzc0xpc3QuYWRkKFwibWFpbi1wYXRoXCIpO1xyXG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgJycpO1xyXG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZChcImNvbm5lY3Rpb25cIik7XHJcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XHJcbiAgICB0aGlzLmZyb20ucGFyZW50LmVsQ2FudmFzLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlKTtcclxuXHJcbiAgICB0aGlzLmZyb20uQWRkTGluZSh0aGlzKTtcclxuICAgIHRoaXMudG8/LkFkZExpbmUodGhpcyk7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoXHJcbiAgICAgIHtcclxuICAgICAgICBmcm9tOiB0aGlzLmZyb20uR2V0SWQoKSxcclxuICAgICAgICBmcm9tSW5kZXg6IHRoaXMuZnJvbUluZGV4LFxyXG4gICAgICAgIHRvOiB0aGlzLnRvPy5HZXRJZCgpLFxyXG4gICAgICAgIHRvSW5kZXg6IHRoaXMudG9JbmRleFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgLi4uIHRoaXMuZnJvbS5wYXJlbnQubWFpbi5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5saW5lKSB8fCB7fVxyXG4gICAgICB9XHJcbiAgICApO1xyXG4gICAgdGhpcy5mcm9tLmRhdGEuQXBwZW5kKCdsaW5lcycsIHRoaXMuZGF0YSk7XHJcbiAgfVxyXG4gIHB1YmxpYyB1cGRhdGVUbyh0b194OiBudW1iZXIsIHRvX3k6IG51bWJlcikge1xyXG4gICAgaWYgKCF0aGlzLmZyb20gfHwgdGhpcy5mcm9tLmVsTm9kZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICBsZXQgeyB4OiBmcm9tX3gsIHk6IGZyb21feSB9OiBhbnkgPSB0aGlzLmZyb20uZ2V0UG9zdGlzaW9uRG90KHRoaXMuZnJvbUluZGV4KTtcclxuICAgIHZhciBsaW5lQ3VydmUgPSB0aGlzLmNyZWF0ZUN1cnZhdHVyZShmcm9tX3gsIGZyb21feSwgdG9feCwgdG9feSwgdGhpcy5jdXJ2YXR1cmUsICdvcGVuY2xvc2UnKTtcclxuICAgIHRoaXMuZWxQYXRoLnNldEF0dHJpYnV0ZU5TKG51bGwsICdkJywgbGluZUN1cnZlKTtcclxuICB9XHJcbiAgcHVibGljIFVwZGF0ZVVJKCk6IExpbmUge1xyXG4gICAgLy9Qb3N0aW9uIG91dHB1dFxyXG4gICAgaWYgKHRoaXMudG8gJiYgdGhpcy50by5lbE5vZGUpIHtcclxuICAgICAgbGV0IHsgeDogdG9feCwgeTogdG9feSB9OiBhbnkgPSB0aGlzLnRvLmdldFBvc3Rpc2lvbkRvdCh0aGlzLnRvSW5kZXgpO1xyXG4gICAgICB0aGlzLnVwZGF0ZVRvKHRvX3gsIHRvX3kpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XHJcbiAgICBpZiAoZmxnKSB7XHJcbiAgICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHByaXZhdGUgY3JlYXRlQ3VydmF0dXJlKHN0YXJ0X3Bvc194OiBudW1iZXIsIHN0YXJ0X3Bvc195OiBudW1iZXIsIGVuZF9wb3NfeDogbnVtYmVyLCBlbmRfcG9zX3k6IG51bWJlciwgY3VydmF0dXJlX3ZhbHVlOiBudW1iZXIsIHR5cGU6IHN0cmluZykge1xyXG4gICAgbGV0IGxpbmVfeCA9IHN0YXJ0X3Bvc194O1xyXG4gICAgbGV0IGxpbmVfeSA9IHN0YXJ0X3Bvc195O1xyXG4gICAgbGV0IHggPSBlbmRfcG9zX3g7XHJcbiAgICBsZXQgeSA9IGVuZF9wb3NfeTtcclxuICAgIGxldCBjdXJ2YXR1cmUgPSBjdXJ2YXR1cmVfdmFsdWU7XHJcbiAgICAvL3R5cGUgb3BlbmNsb3NlIG9wZW4gY2xvc2Ugb3RoZXJcclxuICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICBjYXNlICdvcGVuJzpcclxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XHJcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XHJcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xyXG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xyXG5cclxuICAgICAgICBicmVha1xyXG4gICAgICBjYXNlICdjbG9zZSc6XHJcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xyXG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcclxuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcclxuICAgICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAnIE0gJyArIGxpbmVfeCArICcgJyArIGxpbmVfeSArICcgQyAnICsgaHgxICsgJyAnICsgbGluZV95ICsgJyAnICsgaHgyICsgJyAnICsgeSArICcgJyArIHggKyAnICAnICsgeTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnb3RoZXInOlxyXG4gICAgICAgIGlmIChzdGFydF9wb3NfeCA+PSBlbmRfcG9zX3gpIHtcclxuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XHJcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogY3VydmF0dXJlO1xyXG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG5cclxuICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XHJcbiAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcclxuXHJcbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgZGVsZXRlKG5vZGVUaGlzOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IHRydWUpIHtcclxuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcclxuICAgIGlmIChpc0NsZWFyRGF0YSlcclxuICAgICAgdGhpcy5mcm9tLmRhdGEuUmVtb3ZlKCdsaW5lcycsIHRoaXMuZGF0YSk7XHJcbiAgICBpZiAodGhpcy5mcm9tICE9IG5vZGVUaGlzKVxyXG4gICAgICB0aGlzLmZyb20uUmVtb3ZlTGluZSh0aGlzKTtcclxuICAgIGlmICh0aGlzLnRvICE9IG5vZGVUaGlzKVxyXG4gICAgICB0aGlzLnRvPy5SZW1vdmVMaW5lKHRoaXMpO1xyXG4gICAgdGhpcy5lbFBhdGgucmVtb3ZlKCk7XHJcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmUoKTtcclxuICB9XHJcbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XHJcbiAgICB0aGlzLmZyb20ucGFyZW50LnNldExpbmVDaG9vc2UodGhpcylcclxuICB9XHJcbiAgcHVibGljIHNldE5vZGVUbyhub2RlOiBOb2RlIHwgdW5kZWZpbmVkLCB0b0luZGV4OiBudW1iZXIpIHtcclxuICAgIHRoaXMudG8gPSBub2RlO1xyXG4gICAgdGhpcy50b0luZGV4ID0gdG9JbmRleDtcclxuICB9XHJcbiAgcHVibGljIENsb25lKCkge1xyXG4gICAgaWYgKHRoaXMudG8gJiYgdGhpcy50b0luZGV4KSB7XHJcbiAgICAgIHJldHVybiBuZXcgTGluZSh0aGlzLmZyb20sIHRoaXMuZnJvbUluZGV4LCB0aGlzLnRvLCB0aGlzLnRvSW5kZXgpLlVwZGF0ZVVJKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IGdldFRpbWUgfSBmcm9tIFwiLi4vY29yZS9VdGlsc1wiO1xyXG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcclxuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcclxuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuL05vZGVcIjtcclxuXHJcbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcclxuICBOb25lID0gMCxcclxuICBOb2RlID0gMSxcclxuICBDYW52YXMgPSAyLFxyXG4gIExpbmUgPSAzLFxyXG59XHJcbmV4cG9ydCBjbGFzcyBEZXNnaW5lclZpZXdfRXZlbnQge1xyXG5cclxuICBwcml2YXRlIHRpbWVGYXN0Q2xpY2s6IG51bWJlciA9IDA7XHJcbiAgcHJpdmF0ZSB0YWdJbmdvcmUgPSBbJ2lucHV0JywgJ2J1dHRvbicsICdhJywgJ3RleHRhcmVhJ107XHJcblxyXG4gIHByaXZhdGUgbW92ZVR5cGU6IE1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcclxuICBwcml2YXRlIGZsZ0RyYXA6IGJvb2xlYW4gPSBmYWxzZTtcclxuICBwcml2YXRlIGZsZ01vdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgcHJpdmF0ZSBhdl94OiBudW1iZXIgPSAwO1xyXG4gIHByaXZhdGUgYXZfeTogbnVtYmVyID0gMDtcclxuXHJcbiAgcHJpdmF0ZSBwb3NfeDogbnVtYmVyID0gMDtcclxuICBwcml2YXRlIHBvc195OiBudW1iZXIgPSAwO1xyXG4gIHByaXZhdGUgbW91c2VfeDogbnVtYmVyID0gMDtcclxuICBwcml2YXRlIG1vdXNlX3k6IG51bWJlciA9IDA7XHJcblxyXG4gIHByaXZhdGUgdGVtcExpbmU6IExpbmUgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBEZXNnaW5lclZpZXcpIHtcclxuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXHJcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLkVuZE1vdmUuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5Nb3ZlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcclxuICAgIC8qIENvbnRleHQgTWVudSAqL1xyXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5jb250ZXh0bWVudS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvKiBEcm9wIERyYXAgKi9cclxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5ub2RlX2Ryb3BFbmQuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCB0aGlzLm5vZGVfZHJhZ292ZXIuYmluZCh0aGlzKSk7XHJcbiAgICAvKiBab29tIE1vdXNlICovXHJcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLnpvb21fZW50ZXIuYmluZCh0aGlzKSk7XHJcbiAgICAvKiBEZWxldGUgKi9cclxuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duLmJpbmQodGhpcykpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjb250ZXh0bWVudShldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cclxuICBwcml2YXRlIG5vZGVfZHJhZ292ZXIoZXY6IGFueSkgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyB9XHJcbiAgcHJpdmF0ZSBub2RlX2Ryb3BFbmQoZXY6IGFueSkge1xyXG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcclxuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xyXG4gICAgbGV0IGtleU5vZGU6IGFueSA9IHRoaXMucGFyZW50Lm1haW4uZ2V0Q29udHJvbENob29zZSgpO1xyXG4gICAgaWYgKCFrZXlOb2RlICYmIGV2LnR5cGUgIT09IFwidG91Y2hlbmRcIikge1xyXG4gICAgICBrZXlOb2RlID0gZXYuZGF0YVRyYW5zZmVyLmdldERhdGEoXCJub2RlXCIpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFrZXlOb2RlKSByZXR1cm47XHJcbiAgICBsZXQgZV9wb3NfeCA9IDA7XHJcbiAgICBsZXQgZV9wb3NfeSA9IDA7XHJcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xyXG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xyXG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XHJcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xyXG4gICAgfVxyXG4gICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XHJcbiAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcclxuXHJcbiAgICBpZiAodGhpcy5wYXJlbnQuY2hlY2tPbmx5Tm9kZShrZXlOb2RlKSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBsZXQgbm9kZUl0ZW0gPSB0aGlzLnBhcmVudC5BZGROb2RlKGtleU5vZGUsIHtcclxuICAgICAgZ3JvdXA6IHRoaXMucGFyZW50LkN1cnJlbnRHcm91cCgpXHJcbiAgICB9KTtcclxuICAgIG5vZGVJdGVtLnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xyXG4gIH1cclxuICBwdWJsaWMgem9vbV9lbnRlcihldmVudDogYW55KSB7XHJcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcclxuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuICAgICAgaWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcclxuICAgICAgICAvLyBab29tIE91dFxyXG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21fb3V0KCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gWm9vbSBJblxyXG4gICAgICAgIHRoaXMucGFyZW50Lnpvb21faW4oKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBwcml2YXRlIFN0YXJ0TW92ZShldjogYW55KSB7XHJcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcclxuICAgIGlmICh0aGlzLnRhZ0luZ29yZS5pbmNsdWRlcyhldi50YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLnRpbWVGYXN0Q2xpY2sgPSBnZXRUaW1lKCk7XHJcbiAgICBpZiAoZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbWFpbi1wYXRoJykpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XHJcbiAgICAgIHRoaXMucG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XHJcbiAgICAgIHRoaXMucG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnBvc194ID0gZXYuY2xpZW50WDtcclxuICAgICAgdGhpcy5wb3NfeSA9IGV2LmNsaWVudFk7XHJcbiAgICB9XHJcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuQ2FudmFzO1xyXG4gICAgbGV0IG5vZGVDaG9vc2UgPSB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk7XHJcbiAgICBpZiAobm9kZUNob29zZSAmJiBub2RlQ2hvb3NlLkNoZWNrRWxlbWVudENoaWxkKGV2LnRhcmdldCkpIHtcclxuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vZGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbiAgICBpZiAobm9kZUNob29zZSAmJiB0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLk5vZGUgJiYgZXYudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcIm5vZGUtZG90XCIpKSB7XHJcbiAgICAgIHRoaXMubW92ZVR5cGUgPSBNb3ZlVHlwZS5MaW5lO1xyXG4gICAgICBsZXQgZnJvbUluZGV4ID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xyXG4gICAgICB0aGlzLnRlbXBMaW5lID0gbmV3IExpbmUobm9kZUNob29zZSwgZnJvbUluZGV4KTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLkNhbnZhcykge1xyXG4gICAgICB0aGlzLmF2X3ggPSB0aGlzLnBhcmVudC5nZXRYKCk7XHJcbiAgICAgIHRoaXMuYXZfeSA9IHRoaXMucGFyZW50LmdldFkoKTtcclxuICAgIH1cclxuICAgIHRoaXMuZmxnRHJhcCA9IHRydWU7XHJcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcclxuICB9XHJcbiAgcHVibGljIE1vdmUoZXY6IGFueSkge1xyXG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XHJcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xyXG4gICAgdGhpcy5mbGdNb3ZlID0gdHJ1ZTtcclxuICAgIGxldCBlX3Bvc194ID0gMDtcclxuICAgIGxldCBlX3Bvc195ID0gMDtcclxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XHJcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XHJcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcclxuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XHJcbiAgICB9XHJcbiAgICBzd2l0Y2ggKHRoaXMubW92ZVR5cGUpIHtcclxuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcclxuICAgICAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXHJcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRYKHgpO1xyXG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgY2FzZSBNb3ZlVHlwZS5Ob2RlOlxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wb3NfeCAtIGVfcG9zX3gpO1xyXG4gICAgICAgICAgbGV0IHkgPSB0aGlzLnBhcmVudC5DYWxjWSh0aGlzLnBvc195IC0gZV9wb3NfeSk7XHJcbiAgICAgICAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcclxuICAgICAgICAgIHRoaXMucG9zX3kgPSBlX3Bvc195O1xyXG4gICAgICAgICAgdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpPy51cGRhdGVQb3NpdGlvbih4LCB5KTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgY2FzZSBNb3ZlVHlwZS5MaW5lOlxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XHJcbiAgICAgICAgICAgIGxldCB4ID0gdGhpcy5wYXJlbnQuQ2FsY1godGhpcy5wYXJlbnQuZWxDYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkueCAtIGVfcG9zX3gpO1xyXG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcclxuICAgICAgICAgICAgdGhpcy50ZW1wTGluZS51cGRhdGVUbyh0aGlzLnBhcmVudC5lbENhbnZhcy5vZmZzZXRMZWZ0IC0geCwgdGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0VG9wIC0geSk7XHJcbiAgICAgICAgICAgIGxldCBub2RlRWwgPSBldi50YXJnZXQuY2xvc2VzdCgnW25vZGUtaWRdJyk7XHJcbiAgICAgICAgICAgIGxldCBub2RlSWQgPSBub2RlRWw/LmdldEF0dHJpYnV0ZSgnbm9kZS1pZCcpO1xyXG4gICAgICAgICAgICBsZXQgbm9kZVRvID0gbm9kZUlkID8gdGhpcy5wYXJlbnQuR2V0Tm9kZUJ5SWQobm9kZUlkKSA6IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgaWYgKG5vZGVUbyAmJiBldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibm9kZS1kb3RcIikpIHtcclxuICAgICAgICAgICAgICBsZXQgdG9JbmRleCA9IGV2LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcclxuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gbm9kZUVsPy5xdWVyeVNlbGVjdG9yKCcubm9kZS1kb3QnKT8uWzBdPy5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcclxuICAgICAgICAgICAgICB0aGlzLnRlbXBMaW5lLnNldE5vZGVUbyhub2RlVG8sIHRvSW5kZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcclxuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcclxuICAgICAgdGhpcy5tb3VzZV95ID0gZV9wb3NfeTtcclxuICAgIH1cclxuICB9XHJcbiAgcHJpdmF0ZSBFbmRNb3ZlKGV2OiBhbnkpIHtcclxuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xyXG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcclxuICAgIC8vZml4IEZhc3QgQ2xpY2tcclxuICAgIGlmICgoKGdldFRpbWUoKSAtIHRoaXMudGltZUZhc3RDbGljaykgPCAxMDApIHx8ICF0aGlzLmZsZ01vdmUpIHtcclxuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XHJcbiAgICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xyXG4gICAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBlX3Bvc194ID0gMDtcclxuICAgIGxldCBlX3Bvc195ID0gMDtcclxuICAgIGlmIChldi50eXBlID09PSBcInRvdWNoZW5kXCIpIHtcclxuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcclxuICAgICAgZV9wb3NfeSA9IHRoaXMubW91c2VfeTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xyXG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcclxuICAgICAgbGV0IHggPSB0aGlzLmF2X3ggKyB0aGlzLnBhcmVudC5DYWxjWCgtKHRoaXMucG9zX3ggLSBlX3Bvc194KSlcclxuICAgICAgbGV0IHkgPSB0aGlzLmF2X3kgKyB0aGlzLnBhcmVudC5DYWxjWSgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSlcclxuICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcclxuICAgICAgdGhpcy5wYXJlbnQuc2V0WSh5KTtcclxuICAgICAgdGhpcy5hdl94ID0gMDtcclxuICAgICAgdGhpcy5hdl95ID0gMDtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLnRlbXBMaW5lKSB7XHJcbiAgICAgIHRoaXMudGVtcExpbmUuQ2xvbmUoKTtcclxuICAgICAgdGhpcy50ZW1wTGluZS5kZWxldGUoKTtcclxuICAgICAgdGhpcy50ZW1wTGluZSA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xyXG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XHJcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcclxuICAgIHRoaXMuZmxnRHJhcCA9IGZhbHNlO1xyXG4gICAgdGhpcy5mbGdNb3ZlID0gZmFsc2U7XHJcbiAgfVxyXG4gIHByaXZhdGUga2V5ZG93bihldjogYW55KSB7XHJcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcclxuICAgIGlmIChldi5rZXkgPT09ICdEZWxldGUnIHx8IChldi5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGV2Lm1ldGFLZXkpKSB7XHJcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcclxuXHJcbiAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8uZGVsZXRlKCk7XHJcbiAgICAgIHRoaXMucGFyZW50LmdldExpbmVDaG9vc2UoKT8uZGVsZXRlKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoZXYua2V5ID09PSAnRjInKSB7XHJcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3X1Rvb2xiYXIge1xyXG4gIHByaXZhdGUgZWxOb2RlOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcclxuICBwcml2YXRlIGVsUGF0aEdyb3VwOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogRGVzZ2luZXJWaWV3KSB7XHJcbiAgICB0aGlzLmVsTm9kZSA9IHBhcmVudC5lbFRvb2xiYXI7XHJcbiAgICB0aGlzLnJlbmRlclVJKCk7XHJcbiAgICB0aGlzLnJlbmRlclBhdGhHcm91cCgpO1xyXG4gIH1cclxuICBwdWJsaWMgcmVuZGVyUGF0aEdyb3VwKCkge1xyXG4gICAgdGhpcy5lbFBhdGhHcm91cC5pbm5lckhUTUwgPSBgYDtcclxuICAgIGxldCBncm91cHMgPSB0aGlzLnBhcmVudC5HZXRHcm91cE5hbWUoKTtcclxuICAgIGxldCBsZW4gPSBncm91cHMubGVuZ3RoIC0gMTtcclxuICAgIGlmIChsZW4gPCAwKSByZXR1cm47XHJcbiAgICBsZXQgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIHRleHQuaW5uZXJIVE1MID0gYFJvb3RgO1xyXG4gICAgdGhpcy5lbFBhdGhHcm91cC5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuICAgIGZvciAobGV0IGluZGV4ID0gbGVuOyBpbmRleCA+PSAwOyBpbmRleC0tKSB7XHJcbiAgICAgIGxldCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICB0ZXh0LmlubmVySFRNTCA9IGA+PiR7Z3JvdXBzW2luZGV4XX1gO1xyXG4gICAgICB0aGlzLmVsUGF0aEdyb3VwLmFwcGVuZENoaWxkKHRleHQpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgcmVuZGVyVUkoKSB7XHJcbiAgICBpZiAoIXRoaXMuZWxOb2RlKSByZXR1cm47XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgYDtcclxuICAgIGxldCBidG5CYWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgICBidG5CYWNrLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuQmFja0dyb3VwKCkpO1xyXG4gICAgYnRuQmFjay5pbm5lckhUTUwgPSBgQmFja2A7XHJcbiAgICBsZXQgYnRuWm9vbUluID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XHJcbiAgICBidG5ab29tSW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnBhcmVudC56b29tX2luKCkpO1xyXG4gICAgYnRuWm9vbUluLmlubmVySFRNTCA9IGBab29tK2A7XHJcbiAgICBsZXQgYnRuWm9vbU91dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xyXG4gICAgYnRuWm9vbU91dC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucGFyZW50Lnpvb21fb3V0KCkpO1xyXG4gICAgYnRuWm9vbU91dC5pbm5lckhUTUwgPSBgWm9vbS1gO1xyXG4gICAgdGhpcy5lbE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5lbFBhdGhHcm91cCk7XHJcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChidG5CYWNrKTtcclxuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGJ0blpvb21Jbik7XHJcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChidG5ab29tT3V0KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQmFzZUZsb3cgfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xyXG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xyXG5pbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcclxuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcclxuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi4vY29yZS9EYXRhRmxvd1wiO1xyXG5cclxuY29uc3QgZ2V2YWwgPSBldmFsO1xyXG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIEJhc2VGbG93PERlc2dpbmVyVmlldz4ge1xyXG4gIC8qKlxyXG4gICAqIEdFVCBTRVQgZm9yIERhdGFcclxuICAgKi9cclxuICBwdWJsaWMgZ2V0TmFtZSgpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCduYW1lJyk7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXRZKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd5Jyk7XHJcbiAgfVxyXG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd5JywgdmFsdWUsIHRoaXMpO1xyXG4gIH1cclxuICBwdWJsaWMgZ2V0WCgpIHtcclxuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneCcpO1xyXG4gIH1cclxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcclxuICB9XHJcbiAgcHVibGljIENoZWNrS2V5KGtleTogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgna2V5JykgPT0ga2V5O1xyXG4gIH1cclxuICBwdWJsaWMgZ2V0RGF0YUxpbmUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnbGluZXMnKSA/PyBbXTtcclxuICB9XHJcbiAgcHVibGljIGVsQ29udGVudDogRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIGFyckxpbmU6IExpbmVbXSA9IFtdO1xyXG4gIHByaXZhdGUgb3B0aW9uOiBhbnkgPSB7fTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcmVudDogRGVzZ2luZXJWaWV3LCBwcml2YXRlIGtleU5vZGU6IGFueSwgZGF0YTogYW55ID0ge30pIHtcclxuICAgIHN1cGVyKHBhcmVudCk7XHJcbiAgICB0aGlzLm9wdGlvbiA9IHRoaXMucGFyZW50Lm1haW4uZ2V0Q29udHJvbE5vZGVCeUtleShrZXlOb2RlKTtcclxuICAgIHRoaXMucHJvcGVydGllcyA9IHRoaXMub3B0aW9uPy5wcm9wZXJ0aWVzO1xyXG4gICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xyXG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5kYXRhLkluaXREYXRhKGRhdGEsIHRoaXMucHJvcGVydGllcyk7XHJcbiAgICAgIHRoaXMucGFyZW50LmRhdGEuQXBwZW5kKCdub2RlcycsIHRoaXMuZGF0YSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCd2cy1ub2RlJyk7XHJcblxyXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb24uY2xhc3MpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xyXG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdub2RlLWlkJywgdGhpcy5HZXRJZCgpKTtcclxuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xyXG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xyXG4gICAgdGhpcy5yZW5kZXJVSSgpO1xyXG4gIH1cclxuICBwcml2YXRlIHJlbmRlclVJKCkge1xyXG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBkaXNwbGF5Om5vbmU7YCk7XHJcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgXHJcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiNDAwMFwiPjwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGFpbmVyXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtdG9wXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiMTAwMFwiPjwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWNvbnRlbnRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwidGl0bGVcIj4ke3RoaXMub3B0aW9uLmljb259ICR7dGhpcy5nZXROYW1lKCl9PC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlcIj4ke3RoaXMub3B0aW9uLmh0bWx9PC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtYm90dG9tXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiMjAwMFwiPjwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtcmlnaHRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1kb3RcIiAgbm9kZT1cIjMwMDBcIj48L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcbiAgICBgO1xyXG4gICAgdGhpcy5lbENvbnRlbnQgPSB0aGlzLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcubm9kZS1jb250ZW50IC5ib2R5Jyk7XHJcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XHJcbiAgICBnZXZhbChgKG5vZGUsdmlldyk9Pnske3RoaXMub3B0aW9uLnNjcmlwdH19YCkodGhpcywgdGhpcy5wYXJlbnQpO1xyXG4gIH1cclxuICBwdWJsaWMgb3Blbkdyb3VwKCkge1xyXG4gICAgaWYgKHRoaXMuQ2hlY2tLZXkoJ25vZGVfZ3JvdXAnKSkge1xyXG4gICAgICB0aGlzLnBhcmVudC5vcGVuR3JvdXAodGhpcy5HZXRJZCgpKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55LCBpQ2hlY2sgPSBmYWxzZSkge1xyXG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XHJcbiAgICAgIGxldCB0ZW1weCA9IHg7XHJcbiAgICAgIGxldCB0ZW1weSA9IHk7XHJcbiAgICAgIGlmICghaUNoZWNrKSB7XHJcbiAgICAgICAgdGVtcHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSk7XHJcbiAgICAgICAgdGVtcHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCAtIHgpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0ZW1weCAhPT0gdGhpcy5nZXRYKCkpIHtcclxuICAgICAgICB0aGlzLnNldFgodGVtcHgpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0ZW1weSAhPT0gdGhpcy5nZXRZKCkpIHtcclxuICAgICAgICB0aGlzLnNldFkodGVtcHkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XHJcbiAgICBpZiAoZmxnKSB7XHJcbiAgICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHB1YmxpYyBSZW1vdmVMaW5lKGxpbmU6IExpbmUpIHtcclxuICAgIHZhciBpbmRleCA9IHRoaXMuYXJyTGluZS5pbmRleE9mKGxpbmUpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgdGhpcy5hcnJMaW5lLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5hcnJMaW5lO1xyXG4gIH1cclxuICBwdWJsaWMgQWRkTGluZShsaW5lOiBMaW5lKSB7XHJcbiAgICB0aGlzLmFyckxpbmUgPSBbLi4udGhpcy5hcnJMaW5lLCBsaW5lXTtcclxuICB9XHJcbiAgcHVibGljIGdldFBvc3Rpc2lvbkRvdChpbmRleDogbnVtYmVyID0gMCkge1xyXG4gICAgbGV0IGVsRG90OiBhbnkgPSB0aGlzLmVsTm9kZT8ucXVlcnlTZWxlY3RvcihgLm5vZGUtZG90W25vZGU9XCIke2luZGV4fVwiXWApO1xyXG4gICAgaWYgKGVsRG90KSB7XHJcbiAgICAgIGxldCB5ID0gKHRoaXMuZWxOb2RlLm9mZnNldFRvcCArIGVsRG90Lm9mZnNldFRvcCArIDEwKTtcclxuICAgICAgbGV0IHggPSAodGhpcy5lbE5vZGUub2Zmc2V0TGVmdCArIGVsRG90Lm9mZnNldExlZnQgKyAxMCk7XHJcbiAgICAgIHJldHVybiB7IHgsIHkgfTtcclxuICAgIH1cclxuICAgIHJldHVybiB7fTtcclxuICB9XHJcbiAgcHVibGljIFVwZGF0ZVVJKCkge1xyXG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5nZXRZKCl9cHg7IGxlZnQ6ICR7dGhpcy5nZXRYKCl9cHg7YCk7XHJcbiAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4ge1xyXG4gICAgICBpdGVtLlVwZGF0ZVVJKCk7XHJcbiAgICB9KVxyXG4gIH1cclxuICBwdWJsaWMgZGVsZXRlKGlzQ2xlYXJEYXRhID0gdHJ1ZSkge1xyXG4gICAgdGhpcy5hcnJMaW5lLmZvckVhY2goKGl0ZW0pID0+IGl0ZW0uZGVsZXRlKHRoaXMsIGlzQ2xlYXJEYXRhKSk7XHJcbiAgICBpZiAoaXNDbGVhckRhdGEpXHJcbiAgICAgIHRoaXMuZGF0YS5kZWxldGUoKTtcclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XHJcbiAgICAgIHRoaXMuUmVtb3ZlRGF0YUV2ZW50KCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcclxuICAgIHRoaXMuZWxOb2RlLnJlbW92ZSgpO1xyXG4gICAgdGhpcy5hcnJMaW5lID0gW107XHJcbiAgICBpZiAoaXNDbGVhckRhdGEpXHJcbiAgICAgIHRoaXMucGFyZW50LlJlbW92ZU5vZGUodGhpcyk7XHJcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHt9KTtcclxuICB9XHJcbiAgcHVibGljIFJlbmRlckxpbmUoKSB7XHJcbiAgICB0aGlzLmdldERhdGFMaW5lKCkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3cpID0+IHtcclxuICAgICAgbGV0IG5vZGVGcm9tID0gdGhpcztcclxuICAgICAgbGV0IG5vZGVUbyA9IHRoaXMucGFyZW50LkdldE5vZGVCeUlkKGl0ZW0uR2V0KCd0bycpKTtcclxuICAgICAgbGV0IHRvSW5kZXggPSBpdGVtLkdldCgndG9JbmRleCcpO1xyXG4gICAgICBsZXQgZnJvbUluZGV4ID0gaXRlbS5HZXQoJ2Zyb21JbmRleCcpO1xyXG4gICAgICBuZXcgTGluZShub2RlRnJvbSwgZnJvbUluZGV4LCBub2RlVG8sIHRvSW5kZXgsIGl0ZW0pLlVwZGF0ZVVJKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRmxvd0NvcmUsIElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuaW1wb3J0IHsgRXZlbnRFbnVtLCBQcm9wZXJ0eUVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xyXG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL0RhdGFGbG93XCI7XHJcbmltcG9ydCB7IERlc2dpbmVyVmlld19FdmVudCB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld19FdmVudFwiO1xyXG5pbXBvcnQgeyBEZXNnaW5lclZpZXdfVG9vbGJhciB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld19Ub29sYmFyXCI7XHJcbmltcG9ydCB7IExpbmUgfSBmcm9tIFwiLi9MaW5lXCI7XHJcbmltcG9ydCB7IE5vZGUgfSBmcm9tIFwiLi9Ob2RlXCI7XHJcblxyXG5leHBvcnQgY29uc3QgWm9vbSA9IHtcclxuICBtYXg6IDEuNixcclxuICBtaW46IDAuNixcclxuICB2YWx1ZTogMC4xLFxyXG4gIGRlZmF1bHQ6IDFcclxufVxyXG5leHBvcnQgY2xhc3MgRGVzZ2luZXJWaWV3IGV4dGVuZHMgRmxvd0NvcmUge1xyXG5cclxuICAvKipcclxuICAgKiBHRVQgU0VUIGZvciBEYXRhXHJcbiAgICovXHJcbiAgcHVibGljIGdldFpvb20oKSB7XHJcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3pvb20nKTtcclxuICB9XHJcbiAgcHVibGljIHNldFpvb20odmFsdWU6IGFueSkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3pvb20nLCB2YWx1ZSwgdGhpcyk7XHJcbiAgfVxyXG4gIHB1YmxpYyBnZXRZKCkge1xyXG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd5Jyk7XHJcbiAgfVxyXG4gIHB1YmxpYyBzZXRZKHZhbHVlOiBhbnkpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd5JywgdmFsdWUsIHRoaXMpO1xyXG4gIH1cclxuICBwdWJsaWMgZ2V0WCgpIHtcclxuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgneCcpO1xyXG4gIH1cclxuICBwdWJsaWMgc2V0WCh2YWx1ZTogYW55KSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgneCcsIHZhbHVlLCB0aGlzKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBncm91cDogYW55W10gPSBbXTtcclxuICBwdWJsaWMgR2V0R3JvdXBOYW1lKCk6IGFueVtdIHtcclxuICAgIHJldHVybiB0aGlzLmdyb3VwLm1hcCgoaXRlbSkgPT4gdGhpcy5HZXREYXRhQnlJZChpdGVtKT8uR2V0KCduYW1lJykpO1xyXG4gIH1cclxuICBwdWJsaWMgQmFja0dyb3VwKCkge1xyXG4gICAgdGhpcy5ncm91cC5zcGxpY2UoMCwgMSk7XHJcbiAgICB0aGlzLnRvb2xiYXIucmVuZGVyUGF0aEdyb3VwKCk7XHJcbiAgICB0aGlzLlJlbmRlclVJKCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBDdXJyZW50R3JvdXAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ncm91cD8uWzBdID8/ICdyb290JztcclxuICB9XHJcbiAgcHVibGljIG9wZW5Hcm91cChpZDogYW55KSB7XHJcbiAgICB0aGlzLmdyb3VwID0gW2lkLCAuLi50aGlzLmdyb3VwXTtcclxuICAgIHRoaXMudG9vbGJhci5yZW5kZXJQYXRoR3JvdXAoKTtcclxuICAgIHRoaXMuUmVuZGVyVUkoKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBsaW5lQ2hvb3NlOiBMaW5lIHwgdW5kZWZpbmVkO1xyXG4gIHB1YmxpYyBzZXRMaW5lQ2hvb3NlKG5vZGU6IExpbmUgfCB1bmRlZmluZWQpOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHRoaXMubGluZUNob29zZS5BY3RpdmUoZmFsc2UpO1xyXG4gICAgdGhpcy5saW5lQ2hvb3NlID0gbm9kZTtcclxuICAgIGlmICh0aGlzLmxpbmVDaG9vc2UpIHtcclxuICAgICAgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZSgpO1xyXG4gICAgICB0aGlzLnNldE5vZGVDaG9vc2UodW5kZWZpbmVkKTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGdldExpbmVDaG9vc2UoKTogTGluZSB8IHVuZGVmaW5lZCB7XHJcbiAgICByZXR1cm4gdGhpcy5saW5lQ2hvb3NlO1xyXG4gIH1cclxuICBwcml2YXRlIG5vZGVzOiBOb2RlW10gPSBbXTtcclxuICBwcml2YXRlIG5vZGVDaG9vc2U6IE5vZGUgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIHNldE5vZGVDaG9vc2Uobm9kZTogTm9kZSB8IHVuZGVmaW5lZCk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZShmYWxzZSk7XHJcbiAgICB0aGlzLm5vZGVDaG9vc2UgPSBub2RlO1xyXG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkge1xyXG4gICAgICB0aGlzLm5vZGVDaG9vc2UuQWN0aXZlKCk7XHJcbiAgICAgIHRoaXMuc2V0TGluZUNob29zZSh1bmRlZmluZWQpO1xyXG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5ub2RlQ2hvb3NlLmRhdGEgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5zaG93UHJvcGVydHksIHsgZGF0YTogdGhpcy5kYXRhIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgZ2V0Tm9kZUNob29zZSgpOiBOb2RlIHwgdW5kZWZpbmVkIHtcclxuICAgIHJldHVybiB0aGlzLm5vZGVDaG9vc2U7XHJcbiAgfVxyXG4gIHB1YmxpYyBBZGROb2RlSXRlbShkYXRhOiBhbnkpOiBOb2RlIHtcclxuICAgIHJldHVybiB0aGlzLkFkZE5vZGUoZGF0YS5HZXQoJ2tleScpLCBkYXRhKTtcclxuICB9XHJcbiAgcHVibGljIEFkZE5vZGUoa2V5Tm9kZTogc3RyaW5nLCBkYXRhOiBhbnkgPSB7fSk6IE5vZGUge1xyXG4gICAgcmV0dXJuIHRoaXMuSW5zZXJ0Tm9kZShuZXcgTm9kZSh0aGlzLCBrZXlOb2RlLCBkYXRhKSk7XHJcbiAgfVxyXG4gIHB1YmxpYyBJbnNlcnROb2RlKG5vZGU6IE5vZGUpOiBOb2RlIHtcclxuICAgIHRoaXMubm9kZXMgPSBbLi4udGhpcy5ub2Rlcywgbm9kZV07XHJcbiAgICByZXR1cm4gbm9kZTtcclxuICB9XHJcbiAgcHVibGljIFJlbW92ZU5vZGUobm9kZTogTm9kZSkge1xyXG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xyXG4gICAgdGhpcy5kYXRhLlJlbW92ZSgnbm9kZXMnLCBub2RlKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLm5vZGVzO1xyXG4gIH1cclxuICBwdWJsaWMgQ2xlYXJOb2RlKCkge1xyXG4gICAgdGhpcy5ub2Rlcz8uZm9yRWFjaChpdGVtID0+IGl0ZW0uZGVsZXRlKGZhbHNlKSk7XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgfVxyXG4gIHB1YmxpYyBHZXREYXRhQWxsTm9kZSgpOiBhbnlbXSB7XHJcbiAgICByZXR1cm4gKHRoaXMuZGF0YS5HZXQoJ25vZGVzJykgPz8gW10pO1xyXG4gIH1cclxuICBwdWJsaWMgR2V0RGF0YU5vZGUoKTogYW55W10ge1xyXG4gICAgcmV0dXJuIHRoaXMuR2V0RGF0YUFsbE5vZGUoKS5maWx0ZXIoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLkdldChcImdyb3VwXCIpID09PSB0aGlzLkN1cnJlbnRHcm91cCgpKTtcclxuICB9XHJcbiAgLyoqXHJcbiAgICogVmFyaWJ1dGVcclxuICAqL1xyXG4gIHB1YmxpYyBlbENhbnZhczogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICBwdWJsaWMgZWxUb29sYmFyOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gIHB1YmxpYyB0b29sYmFyOiBEZXNnaW5lclZpZXdfVG9vbGJhcjtcclxuICBwdWJsaWMgJGxvY2s6IGJvb2xlYW4gPSB0cnVlO1xyXG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBhbnkgPSAxO1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihlbE5vZGU6IEhUTUxFbGVtZW50LCBwdWJsaWMgbWFpbjogSU1haW4pIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgICB0aGlzLmVsTm9kZSA9IGVsTm9kZTtcclxuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSB0aGlzLm1haW4uZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0ubWFpbik7XHJcbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoe30sIHByb3BlcnRpZXMpO1xyXG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJyc7XHJcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdkZXNnaW5lci12aWV3JylcclxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LnJlbW92ZShcImRlc2dpbmVyLWNhbnZhc1wiKTtcclxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2Rlc2dpbmVyLXZpZXcnKVxyXG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QuYWRkKFwiZGVzZ2luZXItY2FudmFzXCIpO1xyXG4gICAgdGhpcy5lbFRvb2xiYXIuY2xhc3NMaXN0LmFkZChcImRlc2dpbmVyLXRvb2xiYXJcIik7XHJcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsQ2FudmFzKTtcclxuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxUb29sYmFyKTtcclxuICAgIHRoaXMuZWxOb2RlLnRhYkluZGV4ID0gMDtcclxuICAgIHRoaXMuUmVuZGVyVUkoKTtcclxuICAgIHRoaXMub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMuUmVuZGVyVUkuYmluZCh0aGlzKSk7XHJcbiAgICBuZXcgRGVzZ2luZXJWaWV3X0V2ZW50KHRoaXMpO1xyXG4gICAgdGhpcy50b29sYmFyID0gbmV3IERlc2dpbmVyVmlld19Ub29sYmFyKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHVwZGF0ZVZpZXcoeDogYW55LCB5OiBhbnksIHpvb206IGFueSkge1xyXG4gICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7eH1weCwgJHt5fXB4KSBzY2FsZSgke3pvb219KWA7XHJcbiAgfVxyXG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcclxuICAgIHRoaXMudXBkYXRlVmlldyh0aGlzLmdldFgoKSwgdGhpcy5nZXRZKCksIHRoaXMuZ2V0Wm9vbSgpKTtcclxuICB9XHJcbiAgcHVibGljIFJlbmRlclVJKGRldGFpbDogYW55ID0ge30pIHtcclxuICAgIGlmIChkZXRhaWwuc2VuZGVyICYmIGRldGFpbC5zZW5kZXIgaW5zdGFuY2VvZiBOb2RlKSByZXR1cm47XHJcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgRGVzZ2luZXJWaWV3KSB7XHJcbiAgICAgIHRoaXMuVXBkYXRlVUkoKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5DbGVhck5vZGUoKTtcclxuICAgIHRoaXMuR2V0RGF0YU5vZGUoKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcclxuICAgICAgdGhpcy5BZGROb2RlSXRlbShpdGVtKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5HZXRBbGxOb2RlKCkuZm9yRWFjaCgoaXRlbTogTm9kZSkgPT4ge1xyXG4gICAgICBpdGVtLlJlbmRlckxpbmUoKTtcclxuICAgIH0pXHJcbiAgICB0aGlzLlVwZGF0ZVVJKCk7XHJcbiAgfVxyXG4gIHB1YmxpYyBPcGVuKCRkYXRhOiBEYXRhRmxvdykge1xyXG4gICAgdGhpcy5kYXRhID0gJGRhdGE7XHJcbiAgICB0aGlzLiRsb2NrID0gZmFsc2U7XHJcbiAgICB0aGlzLmdyb3VwID0gW107XHJcbiAgICB0aGlzLnRvb2xiYXIucmVuZGVyUGF0aEdyb3VwKCk7XHJcbiAgICB0aGlzLkJpbmREYXRhRXZlbnQoKTtcclxuICAgIHRoaXMuUmVuZGVyVUkoKTtcclxuICB9XHJcbiAgcHVibGljIENhbGNYKG51bWJlcjogYW55KSB7XHJcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50V2lkdGggLyAodGhpcy5lbE5vZGU/LmNsaWVudFdpZHRoICogdGhpcy5nZXRab29tKCkpKTtcclxuICB9XHJcbiAgcHVibGljIENhbGNZKG51bWJlcjogYW55KSB7XHJcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxOb2RlPy5jbGllbnRIZWlnaHQgKiB0aGlzLmdldFpvb20oKSkpO1xyXG4gIH1cclxuICBwdWJsaWMgR2V0QWxsTm9kZSgpOiBOb2RlW10ge1xyXG4gICAgcmV0dXJuIHRoaXMubm9kZXMgfHwgW107XHJcbiAgfVxyXG4gIHB1YmxpYyBHZXROb2RlQnlJZChpZDogc3RyaW5nKTogTm9kZSB8IHVuZGVmaW5lZCB7XHJcbiAgICByZXR1cm4gdGhpcy5HZXRBbGxOb2RlKCkuZmlsdGVyKG5vZGUgPT4gbm9kZS5HZXRJZCgpID09IGlkKT8uWzBdO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIEdldERhdGFCeUlkKGlkOiBzdHJpbmcpOiBEYXRhRmxvdyB8IG51bGwge1xyXG4gICAgcmV0dXJuIHRoaXMuR2V0RGF0YUFsbE5vZGUoKS5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uR2V0KCdpZCcpID09PSBpZCk/LlswXTtcclxuICB9XHJcbiAgY2hlY2tPbmx5Tm9kZShrZXk6IHN0cmluZykge1xyXG4gICAgcmV0dXJuICh0aGlzLm1haW4uZ2V0Q29udHJvbEJ5S2V5KGtleSkub25seU5vZGUpICYmIHRoaXMubm9kZXMuZmlsdGVyKGl0ZW0gPT4gaXRlbS5DaGVja0tleShrZXkpKS5sZW5ndGggPiAwO1xyXG4gIH1cclxuICBwdWJsaWMgem9vbV9yZWZyZXNoKGZsZzogYW55ID0gMCkge1xyXG4gICAgbGV0IHRlbXBfem9vbSA9IGZsZyA9PSAwID8gWm9vbS5kZWZhdWx0IDogKHRoaXMuZ2V0Wm9vbSgpICsgWm9vbS52YWx1ZSAqIGZsZyk7XHJcbiAgICBpZiAoWm9vbS5tYXggPj0gdGVtcF96b29tICYmIHRlbXBfem9vbSA+PSBab29tLm1pbikge1xyXG4gICAgICB0aGlzLnNldFgoKHRoaXMuZ2V0WCgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGVtcF96b29tKTtcclxuICAgICAgdGhpcy5zZXRZKCh0aGlzLmdldFkoKSAvIHRoaXMuem9vbV9sYXN0X3ZhbHVlKSAqIHRlbXBfem9vbSk7XHJcbiAgICAgIHRoaXMuem9vbV9sYXN0X3ZhbHVlID0gdGVtcF96b29tO1xyXG4gICAgICB0aGlzLnNldFpvb20odGhpcy56b29tX2xhc3RfdmFsdWUpO1xyXG4gICAgfVxyXG4gIH1cclxuICBwdWJsaWMgem9vbV9pbigpIHtcclxuICAgIHRoaXMuem9vbV9yZWZyZXNoKDEpO1xyXG4gIH1cclxuICBwdWJsaWMgem9vbV9vdXQoKSB7XHJcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgtMSk7XHJcbiAgfVxyXG4gIHB1YmxpYyB6b29tX3Jlc2V0KCkge1xyXG4gICAgdGhpcy56b29tX3JlZnJlc2goMCk7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcclxuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcclxuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld1wiO1xyXG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVmlld0RvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XHJcbiAgcHJpdmF0ZSB2aWV3OiBEZXNnaW5lclZpZXcgfCB1bmRlZmluZWQ7XHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xyXG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcclxuXHJcbiAgICB0aGlzLnZpZXcgPSBuZXcgRGVzZ2luZXJWaWV3KHRoaXMuZWxOb2RlLCBtYWluKTtcclxuICAgIHRoaXMudmlldy5vbihFdmVudEVudW0uc2hvd1Byb3BlcnR5LCAoZGF0YTogYW55KSA9PiB7IG1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgZGF0YSk7IH0pO1xyXG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICB0aGlzLnZpZXc/Lk9wZW4oaXRlbS5kYXRhKTtcclxuICAgICAgdGhpcy5tYWluLlNldFByb2plY3RPcGVuKGl0ZW0uZGF0YSk7XHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XHJcbmltcG9ydCB7IERvY2tFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcclxuaW1wb3J0IHsgQ29udHJvbERvY2sgfSBmcm9tIFwiLi9Db250cm9sRG9ja1wiO1xyXG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XHJcbmltcG9ydCB7IFByb2plY3REb2NrIH0gZnJvbSBcIi4vUHJvamVjdERvY2tcIjtcclxuaW1wb3J0IHsgUHJvcGVydHlEb2NrIH0gZnJvbSBcIi4vUHJvcGVydHlEb2NrXCI7XHJcbmltcG9ydCB7IFRhYkRvY2sgfSBmcm9tIFwiLi9UYWJEb2NrXCI7XHJcbmltcG9ydCB7IFZpZXdEb2NrIH0gZnJvbSBcIi4vVmlld0RvY2tcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEb2NrTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IGFueSA9IHt9O1xyXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikgeyB9XHJcbiAgcHVibGljIHJlc2V0KCkge1xyXG4gICAgdGhpcy4kZG9ja01hbmFnZXIgPSB7fTtcclxuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5sZWZ0LCBDb250cm9sRG9jayk7XHJcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ubGVmdCwgUHJvamVjdERvY2spO1xyXG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnJpZ2h0LCBQcm9wZXJ0eURvY2spO1xyXG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnZpZXcsIFZpZXdEb2NrKTtcclxuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS50b3AsIFRhYkRvY2spO1xyXG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLmJvdHRvbSwgRG9ja0Jhc2UpO1xyXG4gICAgdGhpcy5SZW5kZXJVSSgpO1xyXG4gIH1cclxuICBwdWJsaWMgYWRkRG9jaygka2V5OiBzdHJpbmcsICR2aWV3OiBhbnkpIHtcclxuICAgIGlmICghdGhpcy4kZG9ja01hbmFnZXJbJGtleV0pXHJcbiAgICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gW107XHJcbiAgICB0aGlzLiRkb2NrTWFuYWdlclska2V5XSA9IFsuLi50aGlzLiRkb2NrTWFuYWdlclska2V5XSwgJHZpZXddO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIFJlbmRlclVJKCkge1xyXG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gYFxyXG4gICAgICA8ZGl2IGNsYXNzPVwidnMtbGVmdCB2cy1kb2NrXCI+PC9kaXY+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1jb250ZW50XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXRvcCB2cy1kb2NrXCI+PC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXZpZXcgdnMtZG9ja1wiPjwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy1ib3R0b20gdnMtZG9ja1wiPjwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cInZzLXJpZ2h0IHZzLWRvY2tcIj48L2Rpdj5cclxuICAgIGA7XHJcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRkb2NrTWFuYWdlcikuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgbGV0IHF1ZXJ5U2VsZWN0b3IgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAuJHtrZXl9YCk7XHJcbiAgICAgIGlmIChxdWVyeVNlbGVjdG9yKSB7XHJcbiAgICAgICAgdGhpcy4kZG9ja01hbmFnZXJba2V5XS5mb3JFYWNoKCgkaXRlbTogYW55KSA9PiB7XHJcbiAgICAgICAgICBuZXcgJGl0ZW0ocXVlcnlTZWxlY3RvciwgdGhpcy5tYWluKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tICcuL2NvcmUvQmFzZUZsb3cnO1xyXG5pbXBvcnQgeyBEb2NrTWFuYWdlciB9IGZyb20gJy4vZG9jay9Eb2NrTWFuYWdlcic7XHJcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gJy4vY29yZS9FdmVudEZsb3cnO1xyXG5pbXBvcnQgeyBjb21wYXJlU29ydCwgRXZlbnRFbnVtLCBQcm9wZXJ0eUVudW0gfSBmcm9tICcuL2NvcmUvQ29uc3RhbnQnO1xyXG5pbXBvcnQgeyBnZXRUaW1lLCBnZXRVdWlkIH0gZnJvbSAnLi9jb3JlL1V0aWxzJztcclxuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tICcuL2NvcmUvRGF0YUZsb3cnO1xyXG5leHBvcnQgY2xhc3MgVmlzdWFsRmxvdyBpbXBsZW1lbnRzIElNYWluIHtcclxuICBwcml2YXRlICRkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdyh0aGlzKTtcclxuICBwcml2YXRlICRwcm9qZWN0T3BlbjogYW55O1xyXG4gIHByaXZhdGUgJHByb3BlcnRpZXM6IGFueSA9IHt9O1xyXG4gIHByaXZhdGUgJGNvbnRyb2w6IGFueSA9IHt9O1xyXG4gIHByaXZhdGUgJGNvbnRyb2xEZWZhdWx0OiBhbnkgPSB7XHJcbiAgICBub2RlX2JlZ2luOiB7XHJcbiAgICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1wbGF5XCI+PC9pPicsXHJcbiAgICAgIHNvcnQ6IDAsXHJcbiAgICAgIG5hbWU6ICdCZWdpbicsXHJcbiAgICAgIGNsYXNzOiAnbm9kZS10ZXN0JyxcclxuICAgICAgaHRtbDogJycsXHJcbiAgICAgIG91dHB1dDogMSxcclxuICAgICAgaW5wdXQ6IDAsXHJcbiAgICAgIG9ubHlOb2RlOiB0cnVlXHJcbiAgICB9LFxyXG4gICAgbm9kZV9lbmQ6IHtcclxuICAgICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3BcIj48L2k+JyxcclxuICAgICAgc29ydDogMCxcclxuICAgICAgbmFtZTogJ0VuZCcsXHJcbiAgICAgIGh0bWw6ICcnLFxyXG4gICAgICBvdXRwdXQ6IDAsXHJcbiAgICAgIG9ubHlOb2RlOiB0cnVlXHJcbiAgICB9LFxyXG4gICAgbm9kZV9pZjoge1xyXG4gICAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtZXF1YWxzXCI+PC9pPicsXHJcbiAgICAgIHNvcnQ6IDAsXHJcbiAgICAgIG5hbWU6ICdJZicsXHJcbiAgICAgIGh0bWw6ICc8ZGl2PmNvbmRpdGlvbjo8YnIvPjxpbnB1dCBub2RlOm1vZGVsPVwiY29uZGl0aW9uXCIvPjwvZGl2PicsXHJcbiAgICAgIHNjcmlwdDogYGAsXHJcbiAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICBjb25kaXRpb246IHtcclxuICAgICAgICAgIGtleTogXCJjb25kaXRpb25cIixcclxuICAgICAgICAgIGRlZmF1bHQ6ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBvdXRwdXQ6IDJcclxuICAgIH0sXHJcbiAgICBub2RlX2dyb3VwOiB7XHJcbiAgICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1vYmplY3QtZ3JvdXBcIj48L2k+JyxcclxuICAgICAgc29ydDogMCxcclxuICAgICAgbmFtZTogJ0dyb3VwJyxcclxuICAgICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0ZXh0LWNlbnRlciBwM1wiPjxidXR0b24gY2xhc3M9XCJidG5Hb0dyb3VwXCI+R288L2J1dHRvbj48L2Rpdj4nLFxyXG4gICAgICBzY3JpcHQ6IGBub2RlLmVsTm9kZS5xdWVyeVNlbGVjdG9yKCcuYnRuR29Hcm91cCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtub2RlLm9wZW5Hcm91cCgpfSk7YCxcclxuICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgIGNvbmRpdGlvbjoge1xyXG4gICAgICAgICAga2V5OiBcImNvbmRpdGlvblwiLFxyXG4gICAgICAgICAgZGVmYXVsdDogJydcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIG91dHB1dDogMlxyXG4gICAgfSxcclxuICB9XHJcbiAgcHJpdmF0ZSAkY29udHJvbENob29zZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgcHJpdmF0ZSAkZG9ja01hbmFnZXI6IERvY2tNYW5hZ2VyO1xyXG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XHJcbiAgcHVibGljIGdldERvY2tNYW5hZ2VyKCk6IERvY2tNYW5hZ2VyIHtcclxuICAgIHJldHVybiB0aGlzLiRkb2NrTWFuYWdlcjtcclxuICB9XHJcbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLm9uU2FmZShldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5vbihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XHJcbiAgICB0aGlzLmV2ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcclxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcclxuICB9XHJcbiAgZ2V0Q29udHJvbEFsbCgpIHtcclxuICAgIHJldHVybiB0aGlzLiRjb250cm9sID8/IHt9O1xyXG4gIH1cclxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBvcHRpb246IGFueSA9IG51bGwpIHtcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RmxvdygpO1xyXG4gICAgLy9zZXQgcHJvamVjdFxyXG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0uc29sdXRpb25dID0ge1xyXG4gICAgICBpZDoge1xyXG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxyXG4gICAgICB9LFxyXG4gICAgICBrZXk6IHtcclxuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0uc29sdXRpb25cclxuICAgICAgfSxcclxuICAgICAgbmFtZToge1xyXG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGBzb2x1dGlvbi0ke2dldFRpbWUoKX1gXHJcbiAgICAgIH0sXHJcbiAgICAgIHByb2plY3RzOiB7XHJcbiAgICAgICAgZGVmYXVsdDogW11cclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIHRoaXMuJHByb3BlcnRpZXNbUHJvcGVydHlFbnVtLmxpbmVdID0ge1xyXG4gICAgICBrZXk6IHtcclxuICAgICAgICBkZWZhdWx0OiBQcm9wZXJ0eUVudW0ubGluZVxyXG4gICAgICB9LFxyXG4gICAgICBmcm9tOiB7XHJcbiAgICAgICAgZGVmYXVsdDogMFxyXG4gICAgICB9LFxyXG4gICAgICBmcm9tSW5kZXg6IHtcclxuICAgICAgICBkZWZhdWx0OiAwXHJcbiAgICAgIH0sXHJcbiAgICAgIHRvOiB7XHJcbiAgICAgICAgZGVmYXVsdDogMFxyXG4gICAgICB9LFxyXG4gICAgICB0b0luZGV4OiB7XHJcbiAgICAgICAgZGVmYXVsdDogMFxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgLy9zZXQgcHJvamVjdFxyXG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0ubWFpbl0gPSB7XHJcbiAgICAgIC4uLihvcHRpb24/LnByb3BlcnRpZXMgfHwge30pLFxyXG4gICAgICBpZDoge1xyXG4gICAgICAgIGRlZmF1bHQ6ICgpID0+IGdldFRpbWUoKVxyXG4gICAgICB9LFxyXG4gICAgICBuYW1lOiB7XHJcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gYGFwcC0ke2dldFRpbWUoKX1gXHJcbiAgICAgIH0sXHJcbiAgICAgIGtleToge1xyXG4gICAgICAgIGRlZmF1bHQ6IFByb3BlcnR5RW51bS5tYWluXHJcbiAgICAgIH0sXHJcbiAgICAgIHg6IHtcclxuICAgICAgICBkZWZhdWx0OiAwXHJcbiAgICAgIH0sXHJcbiAgICAgIHk6IHtcclxuICAgICAgICBkZWZhdWx0OiAwXHJcbiAgICAgIH0sXHJcbiAgICAgIHpvb206IHtcclxuICAgICAgICBkZWZhdWx0OiAxXHJcbiAgICAgIH0sXHJcbiAgICAgIG5vZGVzOiB7XHJcbiAgICAgICAgZGVmYXVsdDogW11cclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIC8vIHNldCBjb250cm9sXHJcbiAgICB0aGlzLiRjb250cm9sID0geyAuLi5vcHRpb24/LmNvbnRyb2wgfHwge30sIC4uLnRoaXMuJGNvbnRyb2xEZWZhdWx0IH07XHJcbiAgICBsZXQgY29udHJvbFRlbXA6IGFueSA9IHt9O1xyXG4gICAgT2JqZWN0LmtleXModGhpcy4kY29udHJvbCkubWFwKChrZXkpID0+ICh7IC4uLnRoaXMuJGNvbnRyb2xba2V5XSwga2V5LCBzb3J0OiAodGhpcy4kY29udHJvbFtrZXldLnNvcnQgPT09IHVuZGVmaW5lZCA/IDk5OTk5IDogdGhpcy4kY29udHJvbFtrZXldLnNvcnQpIH0pKS5zb3J0KGNvbXBhcmVTb3J0KS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcclxuICAgICAgY29udHJvbFRlbXBbaXRlbS5rZXldID0gaXRlbTtcclxuICAgICAgdGhpcy4kcHJvcGVydGllc1tgbm9kZV8ke2l0ZW0ua2V5fWBdID0ge1xyXG4gICAgICAgIC4uLihpdGVtLnByb3BlcnRpZXMgfHwge30pLFxyXG4gICAgICAgIGlkOiB7XHJcbiAgICAgICAgICBkZWZhdWx0OiAoKSA9PiBnZXRUaW1lKClcclxuICAgICAgICB9LFxyXG4gICAgICAgIGtleToge1xyXG4gICAgICAgICAgZGVmYXVsdDogaXRlbS5rZXlcclxuICAgICAgICB9LFxyXG4gICAgICAgIG5hbWU6IHtcclxuICAgICAgICAgIGRlZmF1bHQ6IGl0ZW0ua2V5XHJcbiAgICAgICAgfSxcclxuICAgICAgICB4OiB7XHJcbiAgICAgICAgICBkZWZhdWx0OiAwXHJcbiAgICAgICAgfSxcclxuICAgICAgICB5OiB7XHJcbiAgICAgICAgICBkZWZhdWx0OiAwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBncm91cDoge1xyXG4gICAgICAgICAgZGVmYXVsdDogJydcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxpbmVzOiB7XHJcbiAgICAgICAgICBkZWZhdWx0OiBbXVxyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy4kY29udHJvbCA9IGNvbnRyb2xUZW1wO1xyXG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgndnMtY29udGFpbmVyJyk7XHJcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCd2cy1jb250YWluZXInKTtcclxuICAgIHRoaXMuJGRvY2tNYW5hZ2VyID0gbmV3IERvY2tNYW5hZ2VyKHRoaXMuY29udGFpbmVyLCB0aGlzKTtcclxuICAgIHRoaXMuJGRvY2tNYW5hZ2VyLnJlc2V0KCk7XHJcbiAgICB0aGlzLiRkYXRhLkluaXREYXRhKHt9LCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLnNvbHV0aW9uKSk7XHJcblxyXG4gIH1cclxuICBnZXRQcm9qZWN0QWxsKCk6IGFueVtdIHtcclxuICAgIHJldHVybiB0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKSA/PyBbXTtcclxuICB9XHJcbiAgb3BlbigkZGF0YTogYW55KTogdm9pZCB7XHJcbiAgICB0aGlzLiRkYXRhLkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLnNvbHV0aW9uKSk7XHJcbiAgfVxyXG4gIFNldFByb2plY3RPcGVuKCRkYXRhOiBhbnkpOiB2b2lkIHtcclxuICAgIHRoaXMuJHByb2plY3RPcGVuID0gJGRhdGE7XHJcbiAgfVxyXG4gIENoZWNrUHJvamVjdE9wZW4oJGRhdGE6IGFueSk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuJHByb2plY3RPcGVuID09ICRkYXRhO1xyXG4gIH1cclxuICBuZXdQcm9qZWN0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5vcGVuUHJvamVjdCh7fSk7XHJcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5uZXdQcm9qZWN0LCB7fSk7XHJcbiAgfVxyXG4gIG9wZW5Qcm9qZWN0KCRkYXRhOiBhbnkpOiB2b2lkIHtcclxuICAgIGlmICgkZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XHJcbiAgICAgIGxldCAkcHJvamVjdDogYW55ID0gdGhpcy5nZXRQcm9qZWN0QnlJZCgkZGF0YS5HZXQoJ2lkJykpO1xyXG4gICAgICBpZiAoISRwcm9qZWN0KSB7XHJcbiAgICAgICAgJHByb2plY3QgPSAkZGF0YTtcclxuICAgICAgICB0aGlzLiRkYXRhLkFwcGVuZCgncHJvamVjdHMnLCAkcHJvamVjdCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsICRwcm9qZWN0KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxldCBkYXRhID0gbmV3IERhdGFGbG93KHRoaXMpO1xyXG4gICAgICBkYXRhLkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLm1haW4pKTtcclxuICAgICAgdGhpcy4kZGF0YS5BcHBlbmQoJ3Byb2plY3RzJywgZGF0YSk7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB7IGRhdGEgfSk7XHJcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhIH0pO1xyXG4gICAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHsgZGF0YSB9KTtcclxuICAgIH1cclxuICB9XHJcbiAgcHVibGljIGdldFByb2plY3RCeUlkKCRpZDogYW55KSB7XHJcbiAgICByZXR1cm4gdGhpcy4kZGF0YS5HZXQoJ3Byb2plY3RzJykuZmlsdGVyKChpdGVtOiBEYXRhRmxvdykgPT4gaXRlbS5HZXQoJ2lkJykgPT09ICRpZCk/LlswXTtcclxuICB9XHJcbiAgc2V0Q29udHJvbENob29zZShrZXk6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcclxuICAgIHRoaXMuJGNvbnRyb2xDaG9vc2UgPSBrZXk7XHJcbiAgfVxyXG4gIGdldENvbnRyb2xDaG9vc2UoKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbENob29zZTtcclxuICB9XHJcbiAgZ2V0Q29udHJvbEJ5S2V5KGtleTogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbFtrZXldIHx8IHt9O1xyXG4gIH1cclxuICBnZXRDb250cm9sTm9kZUJ5S2V5KGtleTogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi50aGlzLmdldENvbnRyb2xCeUtleShrZXkpLFxyXG4gICAgICBwcm9wZXJ0aWVzOiB0aGlzLmdldFByb3BlcnR5QnlLZXkoYG5vZGVfJHtrZXl9YClcclxuICAgIH1cclxuICB9XHJcbiAgZ2V0UHJvcGVydHlCeUtleShrZXk6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIHRoaXMuJHByb3BlcnRpZXNba2V5XTtcclxuICB9XHJcbn1cclxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQU8sTUFBTSxTQUFTLEdBQUc7QUFDdkIsSUFBQSxJQUFJLEVBQUUsTUFBTTtBQUNaLElBQUEsVUFB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
