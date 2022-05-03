
  /**
   * @license
   * author: Nguyen Van Hau
   * visualflow.js v0.0.1-beta2
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

    return VisualFlow;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlzdWFsZmxvdy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvcmUvQ29uc3RhbnQudHMiLCIuLi9zcmMvZG9jay9Eb2NrQmFzZS50cyIsIi4uL3NyYy9kb2NrL0NvbnRyb2xEb2NrLnRzIiwiLi4vc3JjL2RvY2svUHJvamVjdERvY2sudHMiLCIuLi9zcmMvY29yZS9FZGl0b3IudHMiLCIuLi9zcmMvZG9jay9Qcm9wZXJ0eURvY2sudHMiLCIuLi9zcmMvZG9jay9UYWJEb2NrLnRzIiwiLi4vc3JjL2NvcmUvRXZlbnRGbG93LnRzIiwiLi4vc3JjL2NvcmUvRGF0YUZsb3cudHMiLCIuLi9zcmMvY29yZS9CYXNlRmxvdy50cyIsIi4uL3NyYy9jb3JlL1V0aWxzLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0xpbmUudHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3X0V2ZW50LnRzIiwiLi4vc3JjL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld19Ub29sYmFyLnRzIiwiLi4vc3JjL2Rlc2dpbmVyL05vZGUudHMiLCIuLi9zcmMvZGVzZ2luZXIvRGVzZ2luZXJWaWV3LnRzIiwiLi4vc3JjL2RvY2svVmlld0RvY2sudHMiLCIuLi9zcmMvZG9jay9Eb2NrTWFuYWdlci50cyIsIi4uL3NyYy9WaXN1YWxGbG93LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBFdmVudEVudW0gPSB7XG4gIGluaXQ6IFwiaW5pdFwiLFxuICBkYXRhQ2hhbmdlOiBcImRhdGFDaGFuZ2VcIixcbiAgc2hvd1Byb3BlcnR5OiBcInNob3dQcm9wZXJ0eVwiLFxuICBvcGVuUHJvamVjdDogXCJvcGVuUHJvamVjdFwiLFxuICBuZXdQcm9qZWN0OiBcIm5ld1Byb2plY3RcIixcbiAgY2hhbmdlOiBcImNoYW5nZVwiLFxuICBkaXNwb3NlOiBcImRpc3Bvc2VcIlxufVxuXG5leHBvcnQgY29uc3QgRG9ja0VudW0gPSB7XG4gIGxlZnQ6IFwidnMtbGVmdFwiLFxuICB0b3A6IFwidnMtdG9wXCIsXG4gIHZpZXc6IFwidnMtdmlld1wiLFxuICBib3R0b206IFwidnMtYm90dG9tXCIsXG4gIHJpZ2h0OiBcInZzLXJpZ2h0XCIsXG59XG5cbmV4cG9ydCBjb25zdCBQcm9wZXJ0eUVudW0gPSB7XG4gIG1haW46IFwibWFpbl9wcm9qZWN0XCIsXG4gIHNvbHV0aW9uOiAnbWFpbl9zb2x1dGlvbicsXG4gIGxpbmU6ICdtYWluX2xpbmUnLFxuICB2YXJpYWJsZTogJ21haW5fdmFyaWFibGUnXG59O1xuXG5leHBvcnQgY29uc3QgY29tcGFyZVNvcnQgPSAoYTogYW55LCBiOiBhbnkpID0+IHtcbiAgaWYgKGEuc29ydCA8IGIuc29ydCkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICBpZiAoYS5zb3J0ID4gYi5zb3J0KSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHByb3RlY3RlZCBlbENvbnRlbnQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJ0RvY2tCYXNlJztcbiAgfVxuXG4gIHB1YmxpYyBCb3hJbmZvKHRpdGxlOiBzdHJpbmcsICRjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgndnMtYm94aW5mbycpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLWJveGluZm8nKTtcbiAgICB0aGlzLmVsTm9kZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInZzLWJveGluZm9faGVhZGVyXCI+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX3RpdGxlXCI+JHt0aXRsZX08L3NwYW4+PHNwYW4gY2xhc3M9XCJ2cy1ib3hpbmZvX2J1dHRvblwiPjwvc3Bhbj48L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwidnMtYm94aW5mb19jb250ZW50XCI+PC9kaXY+YDtcbiAgICB0aGlzLmVsQ29udGVudCA9IHRoaXMuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy52cy1ib3hpbmZvX2NvbnRlbnQnKTtcbiAgICBpZiAoJGNhbGxiYWNrKSB7XG5cbiAgICAgICRjYWxsYmFjayh0aGlzLmVsQ29udGVudCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sRG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtY29udHJvbCcpO1xuICAgIHRoaXMuQm94SW5mbygnQ29udHJvbCcsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbGV0IGNvbnRyb2xzID0gdGhpcy5tYWluLmdldENvbnRyb2xBbGwoKTtcbiAgICAgIE9iamVjdC5rZXlzKGNvbnRyb2xzKS5mb3JFYWNoKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIG5vZGVJdGVtLmNsYXNzTGlzdC5hZGQoJ25vZGUtaXRlbScpO1xuICAgICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XG4gICAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywgaXRlbSk7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2NvbnRyb2xzW2l0ZW1dLmljb259IDxzcGFuPiR7Y29udHJvbHNbaXRlbV0ubmFtZX08L3NwYW5gO1xuICAgICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdkcmFnc3RhcnQnLCB0aGlzLmRyYWdTdGFydC5iaW5kKHRoaXMpKVxuICAgICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW5kJywgdGhpcy5kcmFnZW5kLmJpbmQodGhpcykpXG4gICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQobm9kZUl0ZW0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcHJpdmF0ZSBkcmFnZW5kKGU6IGFueSkge1xuICAgIHRoaXMubWFpbi5zZXRDb250cm9sQ2hvb3NlKG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBkcmFnU3RhcnQoZTogYW55KSB7XG4gICAgbGV0IGtleSA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIubm9kZS1pdGVtXCIpLmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJyk7XG4gICAgdGhpcy5tYWluLnNldENvbnRyb2xDaG9vc2Uoa2V5KTtcbiAgICBpZiAoZS50eXBlICE9PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIm5vZGVcIiwga2V5KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBEb2NrQmFzZSB9IGZyb20gXCIuL0RvY2tCYXNlXCI7XG5cbmV4cG9ydCBjbGFzcyBQcm9qZWN0RG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikge1xuICAgIHN1cGVyKGNvbnRhaW5lciwgbWFpbik7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtcHJvamVjdCcpO1xuICAgIHRoaXMuQm94SW5mbygnUHJvamVjdCcsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5jaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKGRldGFpbDogYW55KSA9PiB7XG4gICAgICB0aGlzLmVsQ29udGVudD8ucXVlcnlTZWxlY3RvckFsbCgnLmFjdGl2ZScpLmZvckVhY2goKF9ub2RlKSA9PiB7XG4gICAgICAgIF9ub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5lbENvbnRlbnQgJiYgZGV0YWlsPy5kYXRhPy5HZXQoJ2lkJykpIHtcbiAgICAgICAgdGhpcy5lbENvbnRlbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtcHJvamVjdC1pZD1cIiR7ZGV0YWlsPy5kYXRhPy5HZXQoJ2lkJyl9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgcHJpdmF0ZSByZW5kZXJVSSgpIHtcbiAgICBsZXQgJG5vZGVSaWdodDogSFRNTEVsZW1lbnQgfCBudWxsID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLnZzLWJveGluZm9faGVhZGVyIC52cy1ib3hpbmZvX2J1dHRvbicpO1xuICAgIGlmICghdGhpcy5lbENvbnRlbnQpIHJldHVybjtcbiAgICB0aGlzLmVsQ29udGVudC5pbm5lckhUTUwgPSBgYDtcbiAgICBpZiAoJG5vZGVSaWdodCkge1xuICAgICAgJG5vZGVSaWdodC5pbm5lckhUTUwgPSBgYDtcbiAgICAgIGxldCBidXR0b25OZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgICRub2RlUmlnaHQ/LmFwcGVuZENoaWxkKGJ1dHRvbk5ldyk7XG4gICAgICBidXR0b25OZXcuaW5uZXJIVE1MID0gYE5ld2A7XG4gICAgICBidXR0b25OZXcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLm1haW4ubmV3UHJvamVjdCgnJykpO1xuICAgIH1cblxuICAgIGxldCBwcm9qZWN0cyA9IHRoaXMubWFpbi5nZXRQcm9qZWN0QWxsKCk7XG4gICAgcHJvamVjdHMuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3cpID0+IHtcbiAgICAgIGxldCBub2RlSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnbm9kZS1pdGVtJyk7XG4gICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICBub2RlSXRlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHJvamVjdC1pZCcsIGl0ZW0uR2V0KCdpZCcpKTtcbiAgICAgIGl0ZW0ucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9X25hbWVgLCAoKSA9PiB7XG4gICAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIH0pO1xuICAgICAgaXRlbS5vbihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5tYWluLkNoZWNrUHJvamVjdE9wZW4oaXRlbSkpIHtcbiAgICAgICAgbm9kZUl0ZW0uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICB9XG4gICAgICBub2RlSXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgdGhpcy5tYWluLmRpc3BhdGNoKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgeyBkYXRhOiBpdGVtIH0pO1xuICAgICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiBpdGVtIH0pO1xuXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxDb250ZW50Py5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgfSk7XG5cbiAgfVxufVxuIiwiaW1wb3J0IHsgQmFzZUZsb3csIEZsb3dDb3JlIH0gZnJvbSBcIi4vQmFzZUZsb3dcIlxuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4vQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4vRGF0YUZsb3dcIjtcbmltcG9ydCB7IExPRyB9IGZyb20gXCIuL1V0aWxzXCI7XG5leHBvcnQgZW51bSBFZGl0b3JUeXBlIHtcbiAgTGFiZWwsXG4gIFRleHQsXG4gIElubGluZVxufVxuZXhwb3J0IGNsYXNzIEVkaXRvciB7XG4gIHByaXZhdGUgaXNFZGl0OiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgZWxJbnB1dDogSFRNTERhdGFFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZWxMYWJlbDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwdWJsaWMgZGF0YTogRGF0YUZsb3csIHByaXZhdGUga2V5OiBzdHJpbmcsIGVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsLCBwcml2YXRlIHR5cGU6IEVkaXRvclR5cGUgPSBFZGl0b3JUeXBlLkxhYmVsLCBjaGFnbmU6IGJvb2xlYW4gPSBmYWxzZSkge1xuXG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLmRhdGEub25TYWZlKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB0aGlzLmNoYW5nZURhdGEuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5kYXRhLm9uU2FmZShFdmVudEVudW0uZGlzcG9zZSwgdGhpcy5kaXNwb3NlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuaXNFZGl0ID0gdHlwZSA9PT0gRWRpdG9yVHlwZS5UZXh0O1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ25vZGUtZWRpdG9yJyk7XG4gICAgaWYgKGNoYWduZSAmJiBlbCkge1xuICAgICAgZWwucGFyZW50RWxlbWVudD8uaW5zZXJ0QmVmb3JlKHRoaXMuZWxOb2RlLCBlbCk7XG4gICAgICBlbC5wYXJlbnRFbGVtZW50Py5yZW1vdmVDaGlsZChlbCk7XG4gICAgICBlbD8ucmVtb3ZlKCk7XG4gICAgfSBlbHNlIGlmIChlbCkge1xuICAgICAgZWwuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG4gIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgbGV0IGRhdGEgPSB0aGlzLmRhdGEuR2V0KHRoaXMua2V5KTtcblxuICAgIGlmICh0aGlzLmlzRWRpdCkge1xuICAgICAgaWYgKHRoaXMuZWxMYWJlbCkge1xuICAgICAgICB0aGlzLmVsTGFiZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLnN3aXRjaE1vZGVFZGl0LmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmVsTGFiZWwucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuZWxMYWJlbCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5lbElucHV0KSB7XG4gICAgICAgIHRoaXMuZWxJbnB1dC52YWx1ZSA9IGRhdGE7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICB0aGlzLmVsSW5wdXQuY2xhc3NMaXN0LmFkZCgnbm9kZS1mb3JtLWNvbnRyb2wnKTtcbiAgICAgIHRoaXMuZWxJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5pbnB1dERhdGEuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLmVsSW5wdXQudmFsdWUgPSBkYXRhO1xuICAgICAgdGhpcy5lbElucHV0LnNldEF0dHJpYnV0ZSgnbm9kZTptb2RlbCcsIHRoaXMua2V5KTtcbiAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxJbnB1dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmVsSW5wdXQpIHtcbiAgICAgICAgdGhpcy5lbElucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5pbnB1dERhdGEuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZWxJbnB1dC5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5lbElucHV0ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmVsTGFiZWwpIHtcbiAgICAgICAgdGhpcy5lbExhYmVsLmlubmVySFRNTCA9IGRhdGE7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxMYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgIGlmICh0aGlzLnR5cGUgPT0gRWRpdG9yVHlwZS5JbmxpbmUpIHtcbiAgICAgICAgdGhpcy5lbExhYmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5zd2l0Y2hNb2RlRWRpdC5iaW5kKHRoaXMpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZWxMYWJlbC5zZXRBdHRyaWJ1dGUoJ25vZGU6bW9kZWwnLCB0aGlzLmtleSk7XG4gICAgICB0aGlzLmVsTGFiZWwuaW5uZXJIVE1MID0gZGF0YTtcbiAgICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxMYWJlbCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBzd2l0Y2hNb2RlRWRpdCgpIHtcbiAgICB0aGlzLmlzRWRpdCA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuICBwdWJsaWMgaW5wdXREYXRhKGU6IGFueSkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5kYXRhLlNldCh0aGlzLmtleSwgZS50YXJnZXQudmFsdWUsIHRoaXMpO1xuICAgIH0pXG4gIH1cbiAgcHVibGljIGNoYW5nZURhdGEoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICB0aGlzLmVsSW5wdXQ/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmlucHV0RGF0YS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTGFiZWw/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5zd2l0Y2hNb2RlRWRpdC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7dGhpcy5rZXl9YCwgdGhpcy5jaGFuZ2VEYXRhLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uZGlzcG9zZSwgdGhpcy5kaXNwb3NlLmJpbmQodGhpcykpO1xuICB9XG5cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuLi9jb3JlL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuLi9jb3JlL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBFZGl0b3IsIEVkaXRvclR5cGUgfSBmcm9tIFwiLi4vY29yZS9FZGl0b3JcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFByb3BlcnR5RG9jayBleHRlbmRzIERvY2tCYXNlIHtcbiAgcHJpdmF0ZSBsYXN0RGF0YTogRGF0YUZsb3cgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgbGFiZWxLZXlzOiBzdHJpbmdbXSA9IFsnaWQnLCAna2V5JywgJ2dyb3VwJ107XG4gIHByaXZhdGUgZGF0YUpzb246IEhUTUxUZXh0QXJlYUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcblxuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXByb3BlcnR5Jyk7XG4gICAgdGhpcy5Cb3hJbmZvKCdQcm9wZXJ0eScsIChub2RlOiBIVE1MRWxlbWVudCkgPT4ge1xuICAgICAgbWFpbi5vbihFdmVudEVudW0uc2hvd1Byb3BlcnR5LCAoZGV0YWlsOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXJVSShub2RlLCBkZXRhaWwuZGF0YSk7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG4gIHByaXZhdGUgcmVuZGVyVUkobm9kZTogSFRNTEVsZW1lbnQsIGRhdGE6IERhdGFGbG93KSB7XG4gICAgaWYgKHRoaXMubGFzdERhdGEgPT0gZGF0YSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmxhc3REYXRhID0gZGF0YTtcbiAgICBub2RlLmlubmVySFRNTCA9ICcnO1xuICAgIGxldCBwcm9wZXJ0aWVzOiBhbnkgPSBkYXRhLmdldFByb3BlcnRpZXMoKVxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgcHJvcGVydHlJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwcm9wZXJ0eUl0ZW0uY2xhc3NMaXN0LmFkZCgncHJvcGVydHktaXRlbScpO1xuICAgICAgbGV0IHByb3BlcnR5TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHByb3BlcnR5TGFiZWwuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktbGFiZWwnKTtcbiAgICAgIHByb3BlcnR5TGFiZWwuaW5uZXJIVE1MID0ga2V5O1xuICAgICAgbGV0IHByb3BlcnR5VmFsdWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHByb3BlcnR5VmFsdWUuY2xhc3NMaXN0LmFkZCgncHJvcGVydHktdmFsdWUnKTtcbiAgICAgIGlmICh0aGlzLmxhYmVsS2V5cy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIG5ldyBFZGl0b3IoZGF0YSwga2V5LCBwcm9wZXJ0eVZhbHVlLCBFZGl0b3JUeXBlLkxhYmVsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ldyBFZGl0b3IoZGF0YSwga2V5LCBwcm9wZXJ0eVZhbHVlLCBFZGl0b3JUeXBlLlRleHQpO1xuICAgICAgfVxuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5TGFiZWwpO1xuICAgICAgcHJvcGVydHlJdGVtLmFwcGVuZENoaWxkKHByb3BlcnR5VmFsdWUpO1xuICAgICAgbm9kZS5hcHBlbmRDaGlsZChwcm9wZXJ0eUl0ZW0pO1xuICAgIH0pO1xuICAgIG5vZGUuYXBwZW5kQ2hpbGQodGhpcy5kYXRhSnNvbik7XG4gICAgdGhpcy5kYXRhSnNvbi52YWx1ZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICB0aGlzLmRhdGFKc29uLmNsYXNzTGlzdC5hZGQoJ25vZGUtZm9ybS1jb250cm9sJyk7XG4gICAgZGF0YS5vbihFdmVudEVudW0uZGF0YUNoYW5nZSwgKCkgPT4gdGhpcy5kYXRhSnNvbi52YWx1ZSA9IGRhdGEudG9TdHJpbmcoKSlcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRXZlbnRFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcbmltcG9ydCB7IERvY2tCYXNlIH0gZnJvbSBcIi4vRG9ja0Jhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFRhYkRvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBwcm90ZWN0ZWQgbWFpbjogSU1haW4pIHtcbiAgICBzdXBlcihjb250YWluZXIsIG1haW4pO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBgO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ3ZzLXRhYicpXG4gICAgdGhpcy5tYWluLm9uKEV2ZW50RW51bS5vcGVuUHJvamVjdCwgKGRldGFpbDogYW55KSA9PiB7XG4gICAgICB0aGlzLmVsTm9kZT8ucXVlcnlTZWxlY3RvckFsbCgnLmFjdGl2ZScpLmZvckVhY2goKF9ub2RlKSA9PiB7XG4gICAgICAgIF9ub2RlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy5lbE5vZGUgJiYgZGV0YWlsPy5kYXRhPy5HZXQoJ2lkJykpIHtcbiAgICAgICAgdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcihgW2RhdGEtcHJvamVjdC1pZD1cIiR7ZGV0YWlsPy5kYXRhPy5HZXQoJ2lkJyl9XCJdYCk/LmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ubmV3UHJvamVjdCwgdGhpcy5yZW5kZXIuYmluZCh0aGlzKSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgbGV0IHByb2plY3RzID0gdGhpcy5tYWluLmdldFByb2plY3RBbGwoKTtcbiAgICBwcm9qZWN0cy5mb3JFYWNoKChpdGVtOiBEYXRhRmxvdykgPT4ge1xuICAgICAgbGV0IG5vZGVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdub2RlLWl0ZW0nKTtcbiAgICAgIG5vZGVJdGVtLmlubmVySFRNTCA9IGAke2l0ZW0uR2V0KCduYW1lJyl9YDtcbiAgICAgIG5vZGVJdGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1wcm9qZWN0LWlkJywgaXRlbS5HZXQoJ2lkJykpO1xuICAgICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1fbmFtZWAsICgpID0+IHtcbiAgICAgICAgbm9kZUl0ZW0uaW5uZXJIVE1MID0gYCR7aXRlbS5HZXQoJ25hbWUnKX1gO1xuICAgICAgfSk7XG4gICAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV9uYW1lYCwgKCkgPT4ge1xuICAgICAgICBub2RlSXRlbS5pbm5lckhUTUwgPSBgJHtpdGVtLkdldCgnbmFtZScpfWA7XG4gICAgICB9KTtcbiAgICAgIGlmICh0aGlzLm1haW4uQ2hlY2tQcm9qZWN0T3BlbihpdGVtKSkge1xuICAgICAgICBub2RlSXRlbS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgIH1cbiAgICAgIG5vZGVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLm9wZW5Qcm9qZWN0LCB7IGRhdGE6IGl0ZW0gfSk7XG4gICAgICAgIHRoaXMubWFpbi5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCB7IGRhdGE6IGl0ZW0gfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuZWxOb2RlPy5hcHBlbmRDaGlsZChub2RlSXRlbSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBFdmVudEZsb3cge1xuICBwcml2YXRlIGV2ZW50czogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHsgfVxuICBwdWJsaWMgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XG4gICAgdGhpcy5vbihldmVudCwgY2FsbGJhY2spO1xuICB9XG4gIC8qIEV2ZW50cyAqL1xuICBwdWJsaWMgb24oZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBjYWxsYmFjayBpcyBub3QgYSBmdW5jdGlvblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBsaXN0ZW5lciBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGNhbGxiYWNrfWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGUgZXZlbnQgaXMgbm90IGEgc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBldmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZSBldmVudCBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIHRoZSBnaXZlbiB0eXBlIGlzICR7dHlwZW9mIGV2ZW50fWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHtcbiAgICAgICAgbGlzdGVuZXJzOiBbXVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV2ZW50c1tldmVudF0ubGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIHB1YmxpYyBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcjogYW55KSA9PiB7XG4gICAgICBsaXN0ZW5lcihkZXRhaWxzKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgSVByb3BlcnR5IH0gZnJvbSBcIi4vQmFzZUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSB9IGZyb20gXCIuL0NvbnN0YW50XCI7XG5pbXBvcnQgeyBFdmVudEZsb3cgfSBmcm9tIFwiLi9FdmVudEZsb3dcIjtcblxuZXhwb3J0IGNsYXNzIERhdGFGbG93IHtcbiAgcHJpdmF0ZSBkYXRhOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSBwcm9wZXJ0aWVzOiBhbnkgPSBudWxsO1xuICBwcml2YXRlIGV2ZW50czogRXZlbnRGbG93O1xuICBwdWJsaWMgZ2V0UHJvcGVydGllcygpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXM7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcblxuICAgIHRoaXMuZXZlbnRzLmRpc3BhdGNoKGV2ZW50LCBkZXRhaWxzKTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwcm9wZXJ0eTogSVByb3BlcnR5IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBkYXRhOiBhbnkgPSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgdGhpcy5sb2FkKGRhdGEpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgSW5pdERhdGEoZGF0YTogYW55ID0gbnVsbCwgcHJvcGVydGllczogYW55ID0gLTEpIHtcbiAgICBpZiAocHJvcGVydGllcyAhPT0gLTEpIHtcbiAgICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgfVxuICAgIHRoaXMubG9hZChkYXRhKTtcbiAgfVxuICBwcml2YXRlIGV2ZW50RGF0YUNoYW5nZShrZXk6IHN0cmluZywga2V5Q2hpbGQ6IHN0cmluZywgdmFsdWVDaGlsZDogYW55LCBzZW5kZXJDaGlsZDogYW55LCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGluZGV4KSB7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1fJHtrZXlDaGlsZH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1fJHtpbmRleH1gLCB7XG4gICAgICAgIGtleSwga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkLCBpbmRleFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fV8ke2tleUNoaWxkfWAsIHtcbiAgICAgICAga2V5LCBrZXlDaGlsZCwgdmFsdWU6IHZhbHVlQ2hpbGQsIHNlbmRlcjogc2VuZGVyQ2hpbGRcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICBrZXksIGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBSZW1vdmVFdmVudERhdGEoaXRlbTogRGF0YUZsb3csIGtleTogc3RyaW5nLCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgaXRlbS5yZW1vdmVMaXN0ZW5lcihgJHtFdmVudEVudW0uZGF0YUNoYW5nZX1gLCAoeyBrZXk6IGtleUNoaWxkLCB2YWx1ZTogdmFsdWVDaGlsZCwgc2VuZGVyOiBzZW5kZXJDaGlsZCB9OiBhbnkpID0+IHRoaXMuZXZlbnREYXRhQ2hhbmdlKGtleSwga2V5Q2hpbGQsIHZhbHVlQ2hpbGQsIHNlbmRlckNoaWxkLCBpbmRleCkpO1xuICB9XG4gIHB1YmxpYyBPbkV2ZW50RGF0YShpdGVtOiBEYXRhRmxvdywga2V5OiBzdHJpbmcsIGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWl0ZW0pIHJldHVybjtcbiAgICBpdGVtLm9uKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfWAsICh7IGtleToga2V5Q2hpbGQsIHZhbHVlOiB2YWx1ZUNoaWxkLCBzZW5kZXI6IHNlbmRlckNoaWxkIH06IGFueSkgPT4gdGhpcy5ldmVudERhdGFDaGFuZ2Uoa2V5LCBrZXlDaGlsZCwgdmFsdWVDaGlsZCwgc2VuZGVyQ2hpbGQsIGluZGV4KSk7XG4gIH1cbiAgcHJpdmF0ZSBCaW5kRXZlbnQodmFsdWU6IGFueSwga2V5OiBzdHJpbmcpIHtcbiAgICBpZiAoIXZhbHVlKSByZXR1cm47XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHRoaXMuT25FdmVudERhdGEodmFsdWUgYXMgRGF0YUZsb3csIGtleSk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAodmFsdWUgYXMgW10pLmxlbmd0aCA+IDAgJiYgdmFsdWVbMF0gaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgKHZhbHVlIGFzIERhdGFGbG93W10pLmZvckVhY2goKGl0ZW06IERhdGFGbG93LCBpbmRleDogbnVtYmVyKSA9PiB0aGlzLk9uRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIFNldChrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0Rpc3BhdGNoOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICh0aGlzLmRhdGFba2V5XSAhPSB2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZGF0YVtrZXldKSB7XG4gICAgICAgIGlmICh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICAgICAgdGhpcy5SZW1vdmVFdmVudERhdGEoKHRoaXMuZGF0YVtrZXldIGFzIERhdGFGbG93KSwga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmRhdGFba2V5XSkgJiYgKHRoaXMuZGF0YVtrZXldIGFzIFtdKS5sZW5ndGggPiAwICYmIHRoaXMuZGF0YVtrZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgICAgICAodGhpcy5kYXRhW2tleV0gYXMgRGF0YUZsb3dbXSkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3csIGluZGV4OiBudW1iZXIpID0+IHRoaXMuUmVtb3ZlRXZlbnREYXRhKGl0ZW0sIGtleSwgaW5kZXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5CaW5kRXZlbnQodmFsdWUsIGtleSk7XG4gICAgfVxuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgaWYgKGlzRGlzcGF0Y2gpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2goYCR7RXZlbnRFbnVtLmRhdGFDaGFuZ2V9XyR7a2V5fWAsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHtcbiAgICAgICAga2V5LCB2YWx1ZSwgc2VuZGVyXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgIH0pO1xuICAgIH1cblxuICB9XG4gIHB1YmxpYyBTZXREYXRhKGRhdGE6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IGZhbHNlKSB7XG5cbiAgICBpZiAoaXNDbGVhckRhdGEpIHRoaXMuZGF0YSA9IHt9O1xuICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIGxldCAkZGF0YTogRGF0YUZsb3cgPSBkYXRhIGFzIERhdGFGbG93O1xuICAgICAgaWYgKCF0aGlzLnByb3BlcnR5ICYmICRkYXRhLnByb3BlcnR5KSB0aGlzLnByb3BlcnR5ID0gJGRhdGEucHJvcGVydHk7XG4gICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cygkZGF0YS5nZXRQcm9wZXJ0aWVzKCkpKSB7XG4gICAgICAgICAgdGhpcy5TZXQoa2V5LCAkZGF0YS5HZXQoa2V5KSwgc2VuZGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIHRoaXMuU2V0KGtleSwgZGF0YVtrZXldLCBzZW5kZXIsIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwge1xuICAgICAgZGF0YVxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBHZXQoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhW2tleV07XG4gIH1cbiAgcHVibGljIEFwcGVuZChrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGlmICghdGhpcy5kYXRhW2tleV0pIHRoaXMuZGF0YVtrZXldID0gW107XG4gICAgdGhpcy5kYXRhW2tleV0gPSBbLi4udGhpcy5kYXRhW2tleV0sIHZhbHVlXTtcbiAgICB0aGlzLkJpbmRFdmVudCh2YWx1ZSwga2V5KTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgdGhpcy5kYXRhW2tleV0uaW5kZXhPZih2YWx1ZSk7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5kYXRhW2tleV0uaW5kZXhPZih2YWx1ZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuUmVtb3ZlRXZlbnREYXRhKHRoaXMuZGF0YVtrZXldW2luZGV4XSwga2V5KTtcbiAgICAgIHRoaXMuZGF0YVtrZXldLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBsb2FkKGRhdGE6IGFueSkge1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIGlmICghdGhpcy5wcm9wZXJ0aWVzKSB7XG4gICAgICB0aGlzLnByb3BlcnRpZXMgPSB0aGlzLnByb3BlcnR5Py5nZXRQcm9wZXJ0eUJ5S2V5KGRhdGEua2V5KTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcGVydGllcykge1xuICAgICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcykpIHtcbiAgICAgICAgdGhpcy5kYXRhW2tleV0gPSAoZGF0YT8uW2tleV0gPz8gKCh0eXBlb2YgdGhpcy5wcm9wZXJ0aWVzW2tleV0/LmRlZmF1bHQgPT09IFwiZnVuY3Rpb25cIiA/IHRoaXMucHJvcGVydGllc1trZXldPy5kZWZhdWx0KCkgOiB0aGlzLnByb3BlcnRpZXNba2V5XT8uZGVmYXVsdCkgPz8gXCJcIikpO1xuICAgICAgICBpZiAoISh0aGlzLmRhdGFba2V5XSBpbnN0YW5jZW9mIERhdGFGbG93KSAmJiB0aGlzLmRhdGFba2V5XS5rZXkpIHtcbiAgICAgICAgICB0aGlzLmRhdGFba2V5XSA9IG5ldyBEYXRhRmxvdyh0aGlzLnByb3BlcnR5LCB0aGlzLmRhdGFba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kYXRhW2tleV0pICYmIHRoaXMucHJvcGVydHkgJiYgISh0aGlzLmRhdGFba2V5XVswXSBpbnN0YW5jZW9mIERhdGFGbG93KSkge1xuICAgICAgICAgIHRoaXMuZGF0YVtrZXldID0gdGhpcy5kYXRhW2tleV0ubWFwKChpdGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICghKGl0ZW0gIGluc3RhbmNlb2YgRGF0YUZsb3cpICYmIGl0ZW0ua2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGFGbG93KHRoaXMucHJvcGVydHksIGl0ZW0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy5CaW5kRXZlbnQodGhpcy5kYXRhW2tleV0sIGtleSk7XG4gICAgfVxuICB9XG59XG4gIHB1YmxpYyB0b1N0cmluZygpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudG9Kc29uKCkpO1xufVxuICBwdWJsaWMgdG9Kc29uKCkge1xuICBsZXQgcnM6IGFueSA9IHt9O1xuICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXModGhpcy5wcm9wZXJ0aWVzKSkge1xuICAgIHJzW2tleV0gPSB0aGlzLkdldChrZXkpO1xuICAgIGlmIChyc1trZXldIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHJzW2tleV0gPSByc1trZXldLnRvSnNvbigpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShyc1trZXldKSAmJiAocnNba2V5XSBhcyBbXSkubGVuZ3RoID4gMCAmJiByc1trZXldWzBdIGluc3RhbmNlb2YgRGF0YUZsb3cpIHtcbiAgICAgIHJzW2tleV0gPSByc1trZXldLm1hcCgoaXRlbTogRGF0YUZsb3cpID0+IGl0ZW0udG9Kc29uKCkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcnM7XG59XG4gIHB1YmxpYyBkZWxldGUgKCkge1xuICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgdGhpcy5kYXRhID0ge307XG59XG59XG4iLCJpbXBvcnQgeyBEYXRhRmxvdyB9IGZyb20gXCIuL0RhdGFGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi9Db25zdGFudFwiO1xuaW1wb3J0IHsgRXZlbnRGbG93IH0gZnJvbSBcIi4vRXZlbnRGbG93XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVByb3BlcnR5IHtcbiAgZ2V0UHJvcGVydHlCeUtleShrZXk6IHN0cmluZyk6IGFueTtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbnRyb2xOb2RlIGV4dGVuZHMgSVByb3BlcnR5IHtcbiAgZ2V0Q29udHJvbE5vZGVCeUtleShrZXk6IHN0cmluZyk6IGFueTtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSUV2ZW50IHtcbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpOiB2b2lkO1xuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KTogdm9pZDtcbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnQ6IHN0cmluZywgY2FsbGJhY2s6IGFueSk6IHZvaWQ7XG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSk6IHZvaWQ7XG59XG5leHBvcnQgaW50ZXJmYWNlIElNYWluIGV4dGVuZHMgSUNvbnRyb2xOb2RlLCBJRXZlbnQge1xuICBuZXdQcm9qZWN0KCRuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICBvcGVuUHJvamVjdCgkbmFtZTogc3RyaW5nKTogdm9pZDtcbiAgZ2V0UHJvamVjdEFsbCgpOiBhbnlbXTtcbiAgb3BlbigkZGF0YTogYW55KTogdm9pZDtcbiAgZ2V0Q29udHJvbEFsbCgpOiBhbnlbXTtcbiAgc2V0Q29udHJvbENob29zZShrZXk6IHN0cmluZyB8IG51bGwpOiB2b2lkO1xuICBnZXRDb250cm9sQ2hvb3NlKCk6IHN0cmluZyB8IG51bGw7XG4gIGdldENvbnRyb2xCeUtleShrZXk6IHN0cmluZyk6IGFueTtcbn1cbmV4cG9ydCBjbGFzcyBGbG93Q29yZSBpbXBsZW1lbnRzIElFdmVudCB7XG4gIHB1YmxpYyBHZXRJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLkdldCgnaWQnKTtcbiAgfVxuICBwdWJsaWMgU2V0SWQoaWQ6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCdpZCcsIGlkKTtcbiAgfVxuICBwdWJsaWMgcHJvcGVydGllczogYW55ID0ge307XG4gIHB1YmxpYyBkYXRhOiBEYXRhRmxvdyA9IG5ldyBEYXRhRmxvdygpO1xuICBwdWJsaWMgZWxOb2RlOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIHB1YmxpYyBDaGVja0VsZW1lbnRDaGlsZChlbDogSFRNTEVsZW1lbnQpIHtcbiAgICByZXR1cm4gdGhpcy5lbE5vZGUgPT0gZWwgfHwgdGhpcy5lbE5vZGUuY29udGFpbnMoZWwpO1xuICB9XG4gIHByaXZhdGUgZXZlbnRzOiBFdmVudEZsb3c7XG4gIHB1YmxpYyBTZXREYXRhKGRhdGE6IGFueSwgc2VuZGVyOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5kYXRhLlNldERhdGEoZGF0YSwgc2VuZGVyKTtcbiAgfVxuICBwdWJsaWMgU2V0RGF0YUZsb3coZGF0YTogRGF0YUZsb3cpIHtcbiAgICB0aGlzLmRhdGEuU2V0RGF0YShkYXRhLCB0aGlzLCB0cnVlKTtcblxuICAgIHRoaXMuZGlzcGF0Y2goYGJpbmRfZGF0YV9ldmVudGAsIHsgZGF0YSwgc2VuZGVyOiB0aGlzIH0pO1xuICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLmNoYW5nZSwgeyBkYXRhLCBzZW5kZXI6IHRoaXMgfSk7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgQmluZERhdGFFdmVudCgpIHtcbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwge1xuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KVxuICAgIHRoaXMuZGF0YS5vbihFdmVudEVudW0uY2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFJlbW92ZURhdGFFdmVudCgpIHtcbiAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsICh7IGtleSwgdmFsdWUsIHNlbmRlciB9OiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmRpc3BhdGNoKGAke0V2ZW50RW51bS5kYXRhQ2hhbmdlfV8ke2tleX1gLCB7XG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uZGF0YUNoYW5nZSwge1xuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgICAgICBrZXksIHZhbHVlLCBzZW5kZXJcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KVxuICAgIHRoaXMuZGF0YS5yZW1vdmVMaXN0ZW5lcihFdmVudEVudW0uY2hhbmdlLCAoeyBrZXksIHZhbHVlLCBzZW5kZXIgfTogYW55KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7XG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGtleSwgdmFsdWUsIHNlbmRlclxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICB0aGlzLkJpbmREYXRhRXZlbnQoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQmFzZUZsb3c8VFBhcmVudCBleHRlbmRzIEZsb3dDb3JlPiBleHRlbmRzIEZsb3dDb3JlIHtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJlbnQ6IFRQYXJlbnQpIHtcbiAgICBzdXBlcigpO1xuICB9XG59XG4iLCJleHBvcnQgY29uc3QgTE9HID0gKG1lc3NhZ2U/OiBhbnksIC4uLm9wdGlvbmFsUGFyYW1zOiBhbnlbXSkgPT4gY29uc29sZS5sb2cobWVzc2FnZSwgb3B0aW9uYWxQYXJhbXMpO1xuZXhwb3J0IGNvbnN0IGdldERhdGUgPSAoKSA9PiAobmV3IERhdGUoKSk7XG5leHBvcnQgY29uc3QgZ2V0VGltZSA9ICgpID0+IGdldERhdGUoKS5nZXRUaW1lKCk7XG5leHBvcnQgY29uc3QgZ2V0VXVpZCA9ICgpID0+IHtcbiAgLy8gaHR0cDovL3d3dy5pZXRmLm9yZy9yZmMvcmZjNDEyMi50eHRcbiAgbGV0IHM6IGFueSA9IFtdO1xuICBsZXQgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzY7IGkrKykge1xuICAgIHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApLCAxKTtcbiAgfVxuICBzWzE0XSA9IFwiNFwiOyAgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG4gIHNbMTldID0gaGV4RGlnaXRzLnN1YnN0cigoc1sxOV0gJiAweDMpIHwgMHg4LCAxKTsgIC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG4gIHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblxuICBsZXQgdXVpZCA9IHMuam9pbihcIlwiKTtcbiAgcmV0dXJuIHV1aWQ7XG59XG4iLCJpbXBvcnQgeyBQcm9wZXJ0eUVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi4vY29yZS9EYXRhRmxvd1wiO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gXCIuL05vZGVcIjtcblxuZXhwb3J0IGNsYXNzIExpbmUge1xuICBwdWJsaWMgZWxOb2RlOiBTVkdFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIFwic3ZnXCIpO1xuICBwdWJsaWMgZWxQYXRoOiBTVkdQYXRoRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBcInBhdGhcIik7XG4gIHByaXZhdGUgZGF0YTogRGF0YUZsb3cgPSBuZXcgRGF0YUZsb3coKTtcbiAgcHJpdmF0ZSBjdXJ2YXR1cmU6IG51bWJlciA9IDAuNTtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHB1YmxpYyBmcm9tOiBOb2RlLCBwdWJsaWMgZnJvbUluZGV4OiBudW1iZXIgPSAwLCBwdWJsaWMgdG86IE5vZGUgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsIHB1YmxpYyB0b0luZGV4OiBudW1iZXIgPSAwLCBkYXRhOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZChcIm1haW4tcGF0aFwiKTtcbiAgICB0aGlzLmVsUGF0aC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0U2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbFBhdGguYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsUGF0aC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnZCcsICcnKTtcbiAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKFwiY29ubmVjdGlvblwiKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aCk7XG4gICAgdGhpcy5mcm9tLnBhcmVudC5lbENhbnZhcy5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZSk7XG5cbiAgICB0aGlzLmZyb20uQWRkTGluZSh0aGlzKTtcbiAgICB0aGlzLnRvPy5BZGRMaW5lKHRoaXMpO1xuICAgIGlmIChkYXRhKSB7XG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRhdGEuSW5pdERhdGEoXG4gICAgICB7XG4gICAgICAgIGZyb206IHRoaXMuZnJvbS5HZXRJZCgpLFxuICAgICAgICBmcm9tSW5kZXg6IHRoaXMuZnJvbUluZGV4LFxuICAgICAgICB0bzogdGhpcy50bz8uR2V0SWQoKSxcbiAgICAgICAgdG9JbmRleDogdGhpcy50b0luZGV4XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAuLi4gdGhpcy5mcm9tLnBhcmVudC5tYWluLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLmxpbmUpIHx8IHt9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmZyb20uZGF0YS5BcHBlbmQoJ2xpbmVzJywgdGhpcy5kYXRhKTtcbiAgfVxuICBwdWJsaWMgdXBkYXRlVG8odG9feDogbnVtYmVyLCB0b195OiBudW1iZXIpIHtcbiAgICBpZiAoIXRoaXMuZnJvbSB8fCB0aGlzLmZyb20uZWxOb2RlID09IG51bGwpIHJldHVybjtcbiAgICBsZXQgeyB4OiBmcm9tX3gsIHk6IGZyb21feSB9OiBhbnkgPSB0aGlzLmZyb20uZ2V0UG9zdGlzaW9uRG90KHRoaXMuZnJvbUluZGV4KTtcbiAgICB2YXIgbGluZUN1cnZlID0gdGhpcy5jcmVhdGVDdXJ2YXR1cmUoZnJvbV94LCBmcm9tX3ksIHRvX3gsIHRvX3ksIHRoaXMuY3VydmF0dXJlLCAnb3BlbmNsb3NlJyk7XG4gICAgdGhpcy5lbFBhdGguc2V0QXR0cmlidXRlTlMobnVsbCwgJ2QnLCBsaW5lQ3VydmUpO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpOiBMaW5lIHtcbiAgICAvL1Bvc3Rpb24gb3V0cHV0XG4gICAgaWYgKHRoaXMudG8gJiYgdGhpcy50by5lbE5vZGUpIHtcbiAgICAgIGxldCB7IHg6IHRvX3gsIHk6IHRvX3kgfTogYW55ID0gdGhpcy50by5nZXRQb3N0aXNpb25Eb3QodGhpcy50b0luZGV4KTtcbiAgICAgIHRoaXMudXBkYXRlVG8odG9feCwgdG9feSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHB1YmxpYyBBY3RpdmUoZmxnOiBhbnkgPSB0cnVlKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgdGhpcy5lbFBhdGguY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxQYXRoLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIGNyZWF0ZUN1cnZhdHVyZShzdGFydF9wb3NfeDogbnVtYmVyLCBzdGFydF9wb3NfeTogbnVtYmVyLCBlbmRfcG9zX3g6IG51bWJlciwgZW5kX3Bvc195OiBudW1iZXIsIGN1cnZhdHVyZV92YWx1ZTogbnVtYmVyLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBsZXQgbGluZV94ID0gc3RhcnRfcG9zX3g7XG4gICAgbGV0IGxpbmVfeSA9IHN0YXJ0X3Bvc195O1xuICAgIGxldCB4ID0gZW5kX3Bvc194O1xuICAgIGxldCB5ID0gZW5kX3Bvc195O1xuICAgIGxldCBjdXJ2YXR1cmUgPSBjdXJ2YXR1cmVfdmFsdWU7XG4gICAgLy90eXBlIG9wZW5jbG9zZSBvcGVuIGNsb3NlIG90aGVyXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdvcGVuJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG5cbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgaWYgKHN0YXJ0X3Bvc194ID49IGVuZF9wb3NfeCkge1xuICAgICAgICAgIHZhciBoeDEgPSBsaW5lX3ggKyBNYXRoLmFicyh4IC0gbGluZV94KSAqIChjdXJ2YXR1cmUgKiAtMSk7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb3RoZXInOlxuICAgICAgICBpZiAoc3RhcnRfcG9zX3ggPj0gZW5kX3Bvc194KSB7XG4gICAgICAgICAgdmFyIGh4MSA9IGxpbmVfeCArIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgICB2YXIgaHgyID0geCAtIE1hdGguYWJzKHggLSBsaW5lX3gpICogKGN1cnZhdHVyZSAqIC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgICAgdmFyIGh4MiA9IHggLSBNYXRoLmFicyh4IC0gbGluZV94KSAqIGN1cnZhdHVyZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyBNICcgKyBsaW5lX3ggKyAnICcgKyBsaW5lX3kgKyAnIEMgJyArIGh4MSArICcgJyArIGxpbmVfeSArICcgJyArIGh4MiArICcgJyArIHkgKyAnICcgKyB4ICsgJyAgJyArIHk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcblxuICAgICAgICB2YXIgaHgxID0gbGluZV94ICsgTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG4gICAgICAgIHZhciBoeDIgPSB4IC0gTWF0aC5hYnMoeCAtIGxpbmVfeCkgKiBjdXJ2YXR1cmU7XG5cbiAgICAgICAgcmV0dXJuICcgTSAnICsgbGluZV94ICsgJyAnICsgbGluZV95ICsgJyBDICcgKyBoeDEgKyAnICcgKyBsaW5lX3kgKyAnICcgKyBoeDIgKyAnICcgKyB5ICsgJyAnICsgeCArICcgICcgKyB5O1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZGVsZXRlKG5vZGVUaGlzOiBhbnkgPSBudWxsLCBpc0NsZWFyRGF0YSA9IHRydWUpIHtcbiAgICB0aGlzLmVsUGF0aD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxQYXRoPy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIGlmIChpc0NsZWFyRGF0YSlcbiAgICAgIHRoaXMuZnJvbS5kYXRhLlJlbW92ZSgnbGluZXMnLCB0aGlzLmRhdGEpO1xuICAgIGlmICh0aGlzLmZyb20gIT0gbm9kZVRoaXMpXG4gICAgICB0aGlzLmZyb20uUmVtb3ZlTGluZSh0aGlzKTtcbiAgICBpZiAodGhpcy50byAhPSBub2RlVGhpcylcbiAgICAgIHRoaXMudG8/LlJlbW92ZUxpbmUodGhpcyk7XG4gICAgdGhpcy5lbFBhdGgucmVtb3ZlKCk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlKCk7XG4gIH1cbiAgcHVibGljIFN0YXJ0U2VsZWN0ZWQoZTogYW55KSB7XG4gICAgdGhpcy5mcm9tLnBhcmVudC5zZXRMaW5lQ2hvb3NlKHRoaXMpXG4gIH1cbiAgcHVibGljIHNldE5vZGVUbyhub2RlOiBOb2RlIHwgdW5kZWZpbmVkLCB0b0luZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLnRvID0gbm9kZTtcbiAgICB0aGlzLnRvSW5kZXggPSB0b0luZGV4O1xuICB9XG4gIHB1YmxpYyBDbG9uZSgpIHtcbiAgICBpZiAodGhpcy50byAmJiB0aGlzLnRvSW5kZXgpIHtcbiAgICAgIHJldHVybiBuZXcgTGluZSh0aGlzLmZyb20sIHRoaXMuZnJvbUluZGV4LCB0aGlzLnRvLCB0aGlzLnRvSW5kZXgpLlVwZGF0ZVVJKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBnZXRUaW1lIH0gZnJvbSBcIi4uL2NvcmUvVXRpbHNcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlldyB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcbmltcG9ydCB7IE5vZGUgfSBmcm9tIFwiLi9Ob2RlXCI7XG5cbmV4cG9ydCBlbnVtIE1vdmVUeXBlIHtcbiAgTm9uZSA9IDAsXG4gIE5vZGUgPSAxLFxuICBDYW52YXMgPSAyLFxuICBMaW5lID0gMyxcbn1cbmV4cG9ydCBjbGFzcyBEZXNnaW5lclZpZXdfRXZlbnQge1xuXG4gIHByaXZhdGUgdGltZUZhc3RDbGljazogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSB0YWdJbmdvcmUgPSBbJ2lucHV0JywgJ2J1dHRvbicsICdhJywgJ3RleHRhcmVhJ107XG5cbiAgcHJpdmF0ZSBtb3ZlVHlwZTogTW92ZVR5cGUgPSBNb3ZlVHlwZS5Ob25lO1xuICBwcml2YXRlIGZsZ0RyYXA6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBmbGdNb3ZlOiBib29sZWFuID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBhdl94OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGF2X3k6IG51bWJlciA9IDA7XG5cbiAgcHJpdmF0ZSBwb3NfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwb3NfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb3VzZV94OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3k6IG51bWJlciA9IDA7XG5cbiAgcHJpdmF0ZSB0ZW1wTGluZTogTGluZSB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBEZXNnaW5lclZpZXcpIHtcbiAgICAvKiBNb3VzZSBhbmQgVG91Y2ggQWN0aW9ucyAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLk1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcbiAgICAvKiBDb250ZXh0IE1lbnUgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLmNvbnRleHRtZW51LmJpbmQodGhpcykpO1xuXG4gICAgLyogRHJvcCBEcmFwICovXG4gICAgdGhpcy5wYXJlbnQuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLm5vZGVfZHJvcEVuZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCB0aGlzLm5vZGVfZHJhZ292ZXIuYmluZCh0aGlzKSk7XG4gICAgLyogWm9vbSBNb3VzZSAqL1xuICAgIHRoaXMucGFyZW50LmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuem9vbV9lbnRlci5iaW5kKHRoaXMpKTtcbiAgICAvKiBEZWxldGUgKi9cbiAgICB0aGlzLnBhcmVudC5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5ZG93bi5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHByaXZhdGUgY29udGV4dG1lbnUoZXY6IGFueSkgeyBldi5wcmV2ZW50RGVmYXVsdCgpOyB9XG4gIHByaXZhdGUgbm9kZV9kcmFnb3ZlcihldjogYW55KSB7IGV2LnByZXZlbnREZWZhdWx0KCk7IH1cbiAgcHJpdmF0ZSBub2RlX2Ryb3BFbmQoZXY6IGFueSkge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgbGV0IGtleU5vZGU6IGFueSA9IHRoaXMucGFyZW50Lm1haW4uZ2V0Q29udHJvbENob29zZSgpO1xuICAgIGlmICgha2V5Tm9kZSAmJiBldi50eXBlICE9PSBcInRvdWNoZW5kXCIpIHtcbiAgICAgIGtleU5vZGUgPSBldi5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcIm5vZGVcIik7XG4gICAgfVxuICAgIGlmICgha2V5Tm9kZSkgcmV0dXJuO1xuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICBlX3Bvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnggLSBlX3Bvc194KTtcbiAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcblxuICAgIGlmICh0aGlzLnBhcmVudC5jaGVja09ubHlOb2RlKGtleU5vZGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBub2RlSXRlbSA9IHRoaXMucGFyZW50LkFkZE5vZGUoa2V5Tm9kZSwge1xuICAgICAgZ3JvdXA6IHRoaXMucGFyZW50LkN1cnJlbnRHcm91cCgpXG4gICAgfSk7XG4gICAgbm9kZUl0ZW0udXBkYXRlUG9zaXRpb24oeCwgeSk7XG4gIH1cbiAgcHVibGljIHpvb21fZW50ZXIoZXZlbnQ6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmIChldmVudC5jdHJsS2V5KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAoZXZlbnQuZGVsdGFZID4gMCkge1xuICAgICAgICAvLyBab29tIE91dFxuICAgICAgICB0aGlzLnBhcmVudC56b29tX291dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gWm9vbSBJblxuICAgICAgICB0aGlzLnBhcmVudC56b29tX2luKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHByaXZhdGUgU3RhcnRNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAodGhpcy50YWdJbmdvcmUuaW5jbHVkZXMoZXYudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy50aW1lRmFzdENsaWNrID0gZ2V0VGltZSgpO1xuICAgIGlmIChldi50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtYWluLXBhdGgnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcbiAgICAgIHRoaXMucG9zX3ggPSBldi50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICB0aGlzLnBvc195ID0gZXYudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBvc194ID0gZXYuY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBldi5jbGllbnRZO1xuICAgIH1cbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuQ2FudmFzO1xuICAgIGxldCBub2RlQ2hvb3NlID0gdGhpcy5wYXJlbnQuZ2V0Tm9kZUNob29zZSgpO1xuICAgIGlmIChub2RlQ2hvb3NlICYmIG5vZGVDaG9vc2UuQ2hlY2tFbGVtZW50Q2hpbGQoZXYudGFyZ2V0KSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodW5kZWZpbmVkKTtcbiAgICB9XG4gICAgaWYgKG5vZGVDaG9vc2UgJiYgdGhpcy5tb3ZlVHlwZSA9PSBNb3ZlVHlwZS5Ob2RlICYmIGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJub2RlLWRvdFwiKSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLkxpbmU7XG4gICAgICBsZXQgZnJvbUluZGV4ID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSgnbm9kZScpO1xuICAgICAgdGhpcy50ZW1wTGluZSA9IG5ldyBMaW5lKG5vZGVDaG9vc2UsIGZyb21JbmRleCk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09IE1vdmVUeXBlLkNhbnZhcykge1xuICAgICAgdGhpcy5hdl94ID0gdGhpcy5wYXJlbnQuZ2V0WCgpO1xuICAgICAgdGhpcy5hdl95ID0gdGhpcy5wYXJlbnQuZ2V0WSgpO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICB9XG4gIHB1YmxpYyBNb3ZlKGV2OiBhbnkpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQuJGxvY2spIHJldHVybjtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIHRoaXMuZmxnTW92ZSA9IHRydWU7XG4gICAgbGV0IGVfcG9zX3ggPSAwO1xuICAgIGxldCBlX3Bvc195ID0gMDtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgZV9wb3NfeCA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBldi50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tb3ZlVHlwZSkge1xuICAgICAgY2FzZSBNb3ZlVHlwZS5DYW52YXM6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMuYXZfeCArIHRoaXMucGFyZW50LkNhbGNYKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgICAgIGxldCB5ID0gdGhpcy5hdl95ICsgdGhpcy5wYXJlbnQuQ2FsY1koLSh0aGlzLnBvc195IC0gZV9wb3NfeSkpXG4gICAgICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5zZXRZKHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLk5vZGU6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgeCA9IHRoaXMucGFyZW50LkNhbGNYKHRoaXMucG9zX3ggLSBlX3Bvc194KTtcbiAgICAgICAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucG9zX3kgLSBlX3Bvc195KTtcbiAgICAgICAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICAgICAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICAgICAgICB0aGlzLnBhcmVudC5nZXROb2RlQ2hvb3NlKCk/LnVwZGF0ZVBvc2l0aW9uKHgsIHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIE1vdmVUeXBlLkxpbmU6XG4gICAgICAgIHtcbiAgICAgICAgICBpZiAodGhpcy50ZW1wTGluZSkge1xuICAgICAgICAgICAgbGV0IHggPSB0aGlzLnBhcmVudC5DYWxjWCh0aGlzLnBhcmVudC5lbENhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54IC0gZV9wb3NfeCk7XG4gICAgICAgICAgICBsZXQgeSA9IHRoaXMucGFyZW50LkNhbGNZKHRoaXMucGFyZW50LmVsQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnkgLSBlX3Bvc195KTtcbiAgICAgICAgICAgIHRoaXMudGVtcExpbmUudXBkYXRlVG8odGhpcy5wYXJlbnQuZWxDYW52YXMub2Zmc2V0TGVmdCAtIHgsIHRoaXMucGFyZW50LmVsQ2FudmFzLm9mZnNldFRvcCAtIHkpO1xuICAgICAgICAgICAgbGV0IG5vZGVFbCA9IGV2LnRhcmdldC5jbG9zZXN0KCdbbm9kZS1pZF0nKTtcbiAgICAgICAgICAgIGxldCBub2RlSWQgPSBub2RlRWw/LmdldEF0dHJpYnV0ZSgnbm9kZS1pZCcpO1xuICAgICAgICAgICAgbGV0IG5vZGVUbyA9IG5vZGVJZCA/IHRoaXMucGFyZW50LkdldE5vZGVCeUlkKG5vZGVJZCkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAobm9kZVRvICYmIGV2LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJub2RlLWRvdFwiKSkge1xuICAgICAgICAgICAgICBsZXQgdG9JbmRleCA9IGV2LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCB0b0luZGV4ID0gbm9kZUVsPy5xdWVyeVNlbGVjdG9yKCcubm9kZS1kb3QnKT8uWzBdPy5nZXRBdHRyaWJ1dGUoJ25vZGUnKTtcbiAgICAgICAgICAgICAgdGhpcy50ZW1wTGluZS5zZXROb2RlVG8obm9kZVRvLCB0b0luZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaG1vdmVcIikge1xuICAgICAgdGhpcy5tb3VzZV94ID0gZV9wb3NfeDtcbiAgICAgIHRoaXMubW91c2VfeSA9IGVfcG9zX3k7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgRW5kTW92ZShldjogYW55KSB7XG4gICAgaWYgKHRoaXMucGFyZW50LiRsb2NrKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLmZsZ0RyYXApIHJldHVybjtcbiAgICAvL2ZpeCBGYXN0IENsaWNrXG4gICAgaWYgKCgoZ2V0VGltZSgpIC0gdGhpcy50aW1lRmFzdENsaWNrKSA8IDEwMCkgfHwgIXRoaXMuZmxnTW92ZSkge1xuICAgICAgdGhpcy5tb3ZlVHlwZSA9IE1vdmVUeXBlLk5vbmU7XG4gICAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICAgIHRoaXMuZmxnTW92ZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBlX3Bvc194ID0gMDtcbiAgICBsZXQgZV9wb3NfeSA9IDA7XG4gICAgaWYgKGV2LnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBldi5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm1vdmVUeXBlID09PSBNb3ZlVHlwZS5DYW52YXMpIHtcbiAgICAgIGxldCB4ID0gdGhpcy5hdl94ICsgdGhpcy5wYXJlbnQuQ2FsY1goLSh0aGlzLnBvc194IC0gZV9wb3NfeCkpXG4gICAgICBsZXQgeSA9IHRoaXMuYXZfeSArIHRoaXMucGFyZW50LkNhbGNZKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgdGhpcy5wYXJlbnQuc2V0WCh4KTtcbiAgICAgIHRoaXMucGFyZW50LnNldFkoeSk7XG4gICAgICB0aGlzLmF2X3ggPSAwO1xuICAgICAgdGhpcy5hdl95ID0gMDtcbiAgICB9XG4gICAgaWYgKHRoaXMudGVtcExpbmUpIHtcbiAgICAgIHRoaXMudGVtcExpbmUuQ2xvbmUoKTtcbiAgICAgIHRoaXMudGVtcExpbmUuZGVsZXRlKCk7XG4gICAgICB0aGlzLnRlbXBMaW5lID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnBvc194ID0gZV9wb3NfeDtcbiAgICB0aGlzLnBvc195ID0gZV9wb3NfeTtcbiAgICB0aGlzLm1vdmVUeXBlID0gTW92ZVR5cGUuTm9uZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ01vdmUgPSBmYWxzZTtcbiAgfVxuICBwcml2YXRlIGtleWRvd24oZXY6IGFueSkge1xuICAgIGlmICh0aGlzLnBhcmVudC4kbG9jaykgcmV0dXJuO1xuICAgIGlmIChldi5rZXkgPT09ICdEZWxldGUnIHx8IChldi5rZXkgPT09ICdCYWNrc3BhY2UnICYmIGV2Lm1ldGFLZXkpKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgIHRoaXMucGFyZW50LmdldE5vZGVDaG9vc2UoKT8uZGVsZXRlKCk7XG4gICAgICB0aGlzLnBhcmVudC5nZXRMaW5lQ2hvb3NlKCk/LmRlbGV0ZSgpO1xuICAgIH1cbiAgICBpZiAoZXYua2V5ID09PSAnRjInKSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBEZXNnaW5lclZpZXcgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIERlc2dpbmVyVmlld19Ub29sYmFyIHtcbiAgcHJpdmF0ZSBlbE5vZGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIGVsUGF0aEdyb3VwOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IERlc2dpbmVyVmlldykge1xuICAgIHRoaXMuZWxOb2RlID0gcGFyZW50LmVsVG9vbGJhcjtcbiAgICB0aGlzLnJlbmRlclVJKCk7XG4gICAgdGhpcy5yZW5kZXJQYXRoR3JvdXAoKTtcbiAgfVxuICBwdWJsaWMgcmVuZGVyUGF0aEdyb3VwKCkge1xuICAgIHRoaXMuZWxQYXRoR3JvdXAuaW5uZXJIVE1MID0gYGA7XG4gICAgbGV0IGdyb3VwcyA9IHRoaXMucGFyZW50LkdldEdyb3VwTmFtZSgpO1xuICAgIGxldCBsZW4gPSBncm91cHMubGVuZ3RoIC0gMTtcbiAgICBpZiAobGVuIDwgMCkgcmV0dXJuO1xuICAgIGxldCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHRleHQuaW5uZXJIVE1MID0gYFJvb3RgO1xuICAgIHRoaXMuZWxQYXRoR3JvdXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSBsZW47IGluZGV4ID49IDA7IGluZGV4LS0pIHtcbiAgICAgIGxldCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgdGV4dC5pbm5lckhUTUwgPSBgPj4ke2dyb3Vwc1tpbmRleF19YDtcbiAgICAgIHRoaXMuZWxQYXRoR3JvdXAuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyByZW5kZXJVSSgpIHtcbiAgICBpZiAoIXRoaXMuZWxOb2RlKSByZXR1cm47XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gYGA7XG4gICAgbGV0IGJ0bkJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBidG5CYWNrLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5wYXJlbnQuQmFja0dyb3VwKCkpO1xuICAgIGJ0bkJhY2suaW5uZXJIVE1MID0gYEJhY2tgO1xuICAgIGxldCBidG5ab29tSW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBidG5ab29tSW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnBhcmVudC56b29tX2luKCkpO1xuICAgIGJ0blpvb21Jbi5pbm5lckhUTUwgPSBgWm9vbStgO1xuICAgIGxldCBidG5ab29tT3V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgYnRuWm9vbU91dC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucGFyZW50Lnpvb21fb3V0KCkpO1xuICAgIGJ0blpvb21PdXQuaW5uZXJIVE1MID0gYFpvb20tYDtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsUGF0aEdyb3VwKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChidG5CYWNrKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZChidG5ab29tSW4pO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKGJ0blpvb21PdXQpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBCYXNlRmxvdyB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSBcIi4vTGluZVwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4vRGVzZ2luZXJWaWV3XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tIFwiLi4vY29yZS9EYXRhRmxvd1wiO1xuXG5jb25zdCBnZXZhbCA9IGV2YWw7XG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIEJhc2VGbG93PERlc2dpbmVyVmlldz4ge1xuICAvKipcbiAgICogR0VUIFNFVCBmb3IgRGF0YVxuICAgKi9cbiAgcHVibGljIGdldE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5HZXQoJ25hbWUnKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3knKTtcbiAgfVxuICBwdWJsaWMgc2V0WSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3knLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIGdldFgoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd4JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHB1YmxpYyBDaGVja0tleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdrZXknKSA9PSBrZXk7XG4gIH1cbiAgcHVibGljIGdldERhdGFMaW5lKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuR2V0KCdsaW5lcycpID8/IFtdO1xuICB9XG4gIHB1YmxpYyBlbENvbnRlbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgYXJyTGluZTogTGluZVtdID0gW107XG4gIHByaXZhdGUgb3B0aW9uOiBhbnkgPSB7fTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBEZXNnaW5lclZpZXcsIHByaXZhdGUga2V5Tm9kZTogYW55LCBkYXRhOiBhbnkgPSB7fSkge1xuICAgIHN1cGVyKHBhcmVudCk7XG4gICAgdGhpcy5vcHRpb24gPSB0aGlzLnBhcmVudC5tYWluLmdldENvbnRyb2xOb2RlQnlLZXkoa2V5Tm9kZSk7XG4gICAgdGhpcy5wcm9wZXJ0aWVzID0gdGhpcy5vcHRpb24/LnByb3BlcnRpZXM7XG4gICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBEYXRhRmxvdykge1xuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kYXRhLkluaXREYXRhKGRhdGEsIHRoaXMucHJvcGVydGllcyk7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhLkFwcGVuZCgnbm9kZXMnLCB0aGlzLmRhdGEpO1xuICAgIH1cbiAgICB0aGlzLmRhdGEub24oRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LmFkZCgndnMtbm9kZScpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9uLmNsYXNzKSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9uLmNsYXNzKTtcbiAgICB9XG4gICAgdGhpcy5wYXJlbnQuZWxDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnbm9kZS1pZCcsIHRoaXMuR2V0SWQoKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMucGFyZW50LnNldE5vZGVDaG9vc2UodGhpcykpO1xuICAgIHRoaXMucmVuZGVyVUkoKTtcbiAgfVxuICBwcml2YXRlIHJlbmRlclVJKCkge1xuICAgIHRoaXMuZWxOb2RlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBgZGlzcGxheTpub25lO2ApO1xuICAgIHRoaXMuZWxOb2RlLmlubmVySFRNTCA9IGBcbiAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWxlZnRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtZG90XCIgbm9kZT1cIjQwMDBcIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtY29udGFpbmVyXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLXRvcFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJub2RlLWRvdFwiIG5vZGU9XCIxMDAwXCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1jb250ZW50XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ0aXRsZVwiPiR7dGhpcy5vcHRpb24uaWNvbn0gJHt0aGlzLmdldE5hbWUoKX08L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImJvZHlcIj4ke3RoaXMub3B0aW9uLmh0bWx9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1ib3R0b21cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibm9kZS1kb3RcIiBub2RlPVwiMjAwMFwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtcmlnaHRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIm5vZGUtZG90XCIgIG5vZGU9XCIzMDAwXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICBgO1xuICAgIHRoaXMuZWxDb250ZW50ID0gdGhpcy5lbE5vZGUucXVlcnlTZWxlY3RvcignLm5vZGUtY29udGVudCAuYm9keScpO1xuICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICBnZXZhbChgKG5vZGUsdmlldyk9Pnske3RoaXMub3B0aW9uLnNjcmlwdH19YCkodGhpcywgdGhpcy5wYXJlbnQpO1xuICB9XG4gIHB1YmxpYyBvcGVuR3JvdXAoKSB7XG4gICAgaWYgKHRoaXMuQ2hlY2tLZXkoJ25vZGVfZ3JvdXAnKSkge1xuICAgICAgdGhpcy5wYXJlbnQub3Blbkdyb3VwKHRoaXMuR2V0SWQoKSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyB1cGRhdGVQb3NpdGlvbih4OiBhbnksIHk6IGFueSwgaUNoZWNrID0gZmFsc2UpIHtcbiAgICBpZiAodGhpcy5lbE5vZGUpIHtcbiAgICAgIGxldCB0ZW1weCA9IHg7XG4gICAgICBsZXQgdGVtcHkgPSB5O1xuICAgICAgaWYgKCFpQ2hlY2spIHtcbiAgICAgICAgdGVtcHkgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSk7XG4gICAgICAgIHRlbXB4ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KTtcbiAgICAgIH1cbiAgICAgIGlmICh0ZW1weCAhPT0gdGhpcy5nZXRYKCkpIHtcbiAgICAgICAgdGhpcy5zZXRYKHRlbXB4KTtcbiAgICAgIH1cbiAgICAgIGlmICh0ZW1weSAhPT0gdGhpcy5nZXRZKCkpIHtcbiAgICAgICAgdGhpcy5zZXRZKHRlbXB5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHVibGljIEFjdGl2ZShmbGc6IGFueSA9IHRydWUpIHtcbiAgICBpZiAoZmxnKSB7XG4gICAgICB0aGlzLmVsTm9kZS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBSZW1vdmVMaW5lKGxpbmU6IExpbmUpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmFyckxpbmUuaW5kZXhPZihsaW5lKTtcbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgdGhpcy5hcnJMaW5lLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFyckxpbmU7XG4gIH1cbiAgcHVibGljIEFkZExpbmUobGluZTogTGluZSkge1xuICAgIHRoaXMuYXJyTGluZSA9IFsuLi50aGlzLmFyckxpbmUsIGxpbmVdO1xuICB9XG4gIHB1YmxpYyBnZXRQb3N0aXNpb25Eb3QoaW5kZXg6IG51bWJlciA9IDApIHtcbiAgICBsZXQgZWxEb3Q6IGFueSA9IHRoaXMuZWxOb2RlPy5xdWVyeVNlbGVjdG9yKGAubm9kZS1kb3Rbbm9kZT1cIiR7aW5kZXh9XCJdYCk7XG4gICAgaWYgKGVsRG90KSB7XG4gICAgICBsZXQgeSA9ICh0aGlzLmVsTm9kZS5vZmZzZXRUb3AgKyBlbERvdC5vZmZzZXRUb3AgKyAxMCk7XG4gICAgICBsZXQgeCA9ICh0aGlzLmVsTm9kZS5vZmZzZXRMZWZ0ICsgZWxEb3Qub2Zmc2V0TGVmdCArIDEwKTtcbiAgICAgIHJldHVybiB7IHgsIHkgfTtcbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLmdldFkoKX1weDsgbGVmdDogJHt0aGlzLmdldFgoKX1weDtgKTtcbiAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgaXRlbS5VcGRhdGVVSSgpO1xuICAgIH0pXG4gIH1cbiAgcHVibGljIGRlbGV0ZShpc0NsZWFyRGF0YSA9IHRydWUpIHtcbiAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4gaXRlbS5kZWxldGUodGhpcywgaXNDbGVhckRhdGEpKTtcbiAgICBpZiAoaXNDbGVhckRhdGEpXG4gICAgICB0aGlzLmRhdGEuZGVsZXRlKCk7XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmRhdGEucmVtb3ZlTGlzdGVuZXIoRXZlbnRFbnVtLmRhdGFDaGFuZ2UsIHRoaXMucmVuZGVyVUkuYmluZCh0aGlzKSk7XG4gICAgICB0aGlzLlJlbW92ZURhdGFFdmVudCgpO1xuICAgIH1cbiAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLnBhcmVudC5zZXROb2RlQ2hvb3NlKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKCkgPT4gdGhpcy5wYXJlbnQuc2V0Tm9kZUNob29zZSh0aGlzKSk7XG4gICAgdGhpcy5lbE5vZGUucmVtb3ZlKCk7XG4gICAgdGhpcy5hcnJMaW5lID0gW107XG4gICAgaWYgKGlzQ2xlYXJEYXRhKVxuICAgICAgdGhpcy5wYXJlbnQuUmVtb3ZlTm9kZSh0aGlzKTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5jaGFuZ2UsIHt9KTtcbiAgfVxuICBwdWJsaWMgUmVuZGVyTGluZSgpIHtcbiAgICB0aGlzLmdldERhdGFMaW5lKCkuZm9yRWFjaCgoaXRlbTogRGF0YUZsb3cpID0+IHtcbiAgICAgIGxldCBub2RlRnJvbSA9IHRoaXM7XG4gICAgICBsZXQgbm9kZVRvID0gdGhpcy5wYXJlbnQuR2V0Tm9kZUJ5SWQoaXRlbS5HZXQoJ3RvJykpO1xuICAgICAgbGV0IHRvSW5kZXggPSBpdGVtLkdldCgndG9JbmRleCcpO1xuICAgICAgbGV0IGZyb21JbmRleCA9IGl0ZW0uR2V0KCdmcm9tSW5kZXgnKTtcbiAgICAgIG5ldyBMaW5lKG5vZGVGcm9tLCBmcm9tSW5kZXgsIG5vZGVUbywgdG9JbmRleCwgaXRlbSkuVXBkYXRlVUkoKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRmxvd0NvcmUsIElNYWluIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUZsb3dcIjtcbmltcG9ydCB7IEV2ZW50RW51bSwgUHJvcGVydHlFbnVtIH0gZnJvbSBcIi4uL2NvcmUvQ29uc3RhbnRcIjtcbmltcG9ydCB7IERhdGFGbG93IH0gZnJvbSBcIi4uL2NvcmUvRGF0YUZsb3dcIjtcbmltcG9ydCB7IERlc2dpbmVyVmlld19FdmVudCB9IGZyb20gXCIuL0Rlc2dpbmVyVmlld19FdmVudFwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3X1Rvb2xiYXIgfSBmcm9tIFwiLi9EZXNnaW5lclZpZXdfVG9vbGJhclwiO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gXCIuL0xpbmVcIjtcbmltcG9ydCB7IE5vZGUgfSBmcm9tIFwiLi9Ob2RlXCI7XG5cbmV4cG9ydCBjb25zdCBab29tID0ge1xuICBtYXg6IDEuNixcbiAgbWluOiAwLjYsXG4gIHZhbHVlOiAwLjEsXG4gIGRlZmF1bHQ6IDFcbn1cbmV4cG9ydCBjbGFzcyBEZXNnaW5lclZpZXcgZXh0ZW5kcyBGbG93Q29yZSB7XG5cbiAgLyoqXG4gICAqIEdFVCBTRVQgZm9yIERhdGFcbiAgICovXG4gIHB1YmxpYyBnZXRab29tKCkge1xuICAgIHJldHVybiArdGhpcy5kYXRhLkdldCgnem9vbScpO1xuICB9XG4gIHB1YmxpYyBzZXRab29tKHZhbHVlOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLlNldCgnem9vbScsIHZhbHVlLCB0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0WSgpIHtcbiAgICByZXR1cm4gK3RoaXMuZGF0YS5HZXQoJ3knKTtcbiAgfVxuICBwdWJsaWMgc2V0WSh2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5TZXQoJ3knLCB2YWx1ZSwgdGhpcyk7XG4gIH1cbiAgcHVibGljIGdldFgoKSB7XG4gICAgcmV0dXJuICt0aGlzLmRhdGEuR2V0KCd4Jyk7XG4gIH1cbiAgcHVibGljIHNldFgodmFsdWU6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmRhdGEuU2V0KCd4JywgdmFsdWUsIHRoaXMpO1xuICB9XG4gIHByaXZhdGUgZ3JvdXA6IGFueVtdID0gW107XG4gIHB1YmxpYyBHZXRHcm91cE5hbWUoKTogYW55W10ge1xuICAgIHJldHVybiB0aGlzLmdyb3VwLm1hcCgoaXRlbSkgPT4gdGhpcy5HZXREYXRhQnlJZChpdGVtKT8uR2V0KCduYW1lJykpO1xuICB9XG4gIHB1YmxpYyBCYWNrR3JvdXAoKSB7XG4gICAgdGhpcy5ncm91cC5zcGxpY2UoMCwgMSk7XG4gICAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgfVxuICBwdWJsaWMgQ3VycmVudEdyb3VwKCkge1xuICAgIHJldHVybiB0aGlzLmdyb3VwPy5bMF0gPz8gJ3Jvb3QnO1xuICB9XG4gIHB1YmxpYyBvcGVuR3JvdXAoaWQ6IGFueSkge1xuICAgIHRoaXMuZ3JvdXAgPSBbaWQsIC4uLnRoaXMuZ3JvdXBdO1xuICAgIHRoaXMudG9vbGJhci5yZW5kZXJQYXRoR3JvdXAoKTtcbiAgICB0aGlzLlJlbmRlclVJKCk7XG4gIH1cbiAgcHJpdmF0ZSBsaW5lQ2hvb3NlOiBMaW5lIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgc2V0TGluZUNob29zZShub2RlOiBMaW5lIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubGluZUNob29zZSkgdGhpcy5saW5lQ2hvb3NlLkFjdGl2ZShmYWxzZSk7XG4gICAgdGhpcy5saW5lQ2hvb3NlID0gbm9kZTtcbiAgICBpZiAodGhpcy5saW5lQ2hvb3NlKSB7XG4gICAgICB0aGlzLmxpbmVDaG9vc2UuQWN0aXZlKCk7XG4gICAgICB0aGlzLnNldE5vZGVDaG9vc2UodW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldExpbmVDaG9vc2UoKTogTGluZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubGluZUNob29zZTtcbiAgfVxuICBwcml2YXRlIG5vZGVzOiBOb2RlW10gPSBbXTtcbiAgcHJpdmF0ZSBub2RlQ2hvb3NlOiBOb2RlIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgc2V0Tm9kZUNob29zZShub2RlOiBOb2RlIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubm9kZUNob29zZSkgdGhpcy5ub2RlQ2hvb3NlLkFjdGl2ZShmYWxzZSk7XG4gICAgdGhpcy5ub2RlQ2hvb3NlID0gbm9kZTtcbiAgICBpZiAodGhpcy5ub2RlQ2hvb3NlKSB7XG4gICAgICB0aGlzLm5vZGVDaG9vc2UuQWN0aXZlKCk7XG4gICAgICB0aGlzLnNldExpbmVDaG9vc2UodW5kZWZpbmVkKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhOiB0aGlzLm5vZGVDaG9vc2UuZGF0YSB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uc2hvd1Byb3BlcnR5LCB7IGRhdGE6IHRoaXMuZGF0YSB9KTtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldE5vZGVDaG9vc2UoKTogTm9kZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMubm9kZUNob29zZTtcbiAgfVxuICBwdWJsaWMgQWRkTm9kZUl0ZW0oZGF0YTogYW55KTogTm9kZSB7XG4gICAgcmV0dXJuIHRoaXMuQWRkTm9kZShkYXRhLkdldCgna2V5JyksIGRhdGEpO1xuICB9XG4gIHB1YmxpYyBBZGROb2RlKGtleU5vZGU6IHN0cmluZywgZGF0YTogYW55ID0ge30pOiBOb2RlIHtcbiAgICByZXR1cm4gdGhpcy5JbnNlcnROb2RlKG5ldyBOb2RlKHRoaXMsIGtleU5vZGUsIGRhdGEpKTtcbiAgfVxuICBwdWJsaWMgSW5zZXJ0Tm9kZShub2RlOiBOb2RlKTogTm9kZSB7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgUmVtb3ZlTm9kZShub2RlOiBOb2RlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgIHRoaXMuZGF0YS5SZW1vdmUoJ25vZGVzJywgbm9kZSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubm9kZXM7XG4gIH1cbiAgcHVibGljIENsZWFyTm9kZSgpIHtcbiAgICB0aGlzLm5vZGVzPy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5kZWxldGUoZmFsc2UpKTtcbiAgICB0aGlzLm5vZGVzID0gW107XG4gIH1cbiAgcHVibGljIEdldERhdGFBbGxOb2RlKCk6IGFueVtdIHtcbiAgICByZXR1cm4gKHRoaXMuZGF0YS5HZXQoJ25vZGVzJykgPz8gW10pO1xuICB9XG4gIHB1YmxpYyBHZXREYXRhTm9kZSgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuR2V0RGF0YUFsbE5vZGUoKS5maWx0ZXIoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLkdldChcImdyb3VwXCIpID09PSB0aGlzLkN1cnJlbnRHcm91cCgpKTtcbiAgfVxuICAvKipcbiAgICogVmFyaWJ1dGVcbiAgKi9cbiAgcHVibGljIGVsQ2FudmFzOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwdWJsaWMgZWxUb29sYmFyOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBwdWJsaWMgdG9vbGJhcjogRGVzZ2luZXJWaWV3X1Rvb2xiYXI7XG4gIHB1YmxpYyAkbG9jazogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgem9vbV9sYXN0X3ZhbHVlOiBhbnkgPSAxO1xuICBwdWJsaWMgY29uc3RydWN0b3IoZWxOb2RlOiBIVE1MRWxlbWVudCwgcHVibGljIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmVsTm9kZSA9IGVsTm9kZTtcbiAgICBsZXQgcHJvcGVydGllczogYW55ID0gdGhpcy5tYWluLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLm1haW4pO1xuICAgIHRoaXMuZGF0YS5Jbml0RGF0YSh7fSwgcHJvcGVydGllcyk7XG4gICAgdGhpcy5lbE5vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgdGhpcy5lbE5vZGUuY2xhc3NMaXN0LnJlbW92ZSgnZGVzZ2luZXItdmlldycpXG4gICAgdGhpcy5lbENhbnZhcy5jbGFzc0xpc3QucmVtb3ZlKFwiZGVzZ2luZXItY2FudmFzXCIpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoJ2Rlc2dpbmVyLXZpZXcnKVxuICAgIHRoaXMuZWxDYW52YXMuY2xhc3NMaXN0LmFkZChcImRlc2dpbmVyLWNhbnZhc1wiKTtcbiAgICB0aGlzLmVsVG9vbGJhci5jbGFzc0xpc3QuYWRkKFwiZGVzZ2luZXItdG9vbGJhclwiKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsQ2FudmFzKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsVG9vbGJhcik7XG4gICAgdGhpcy5lbE5vZGUudGFiSW5kZXggPSAwO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgICB0aGlzLm9uKEV2ZW50RW51bS5kYXRhQ2hhbmdlLCB0aGlzLlJlbmRlclVJLmJpbmQodGhpcykpO1xuICAgIG5ldyBEZXNnaW5lclZpZXdfRXZlbnQodGhpcyk7XG4gICAgdGhpcy50b29sYmFyID0gbmV3IERlc2dpbmVyVmlld19Ub29sYmFyKHRoaXMpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZVZpZXcoeDogYW55LCB5OiBhbnksIHpvb206IGFueSkge1xuICAgIHRoaXMuZWxDYW52YXMuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3h9cHgsICR7eX1weCkgc2NhbGUoJHt6b29tfSlgO1xuICB9XG4gIHB1YmxpYyBVcGRhdGVVSSgpIHtcbiAgICB0aGlzLnVwZGF0ZVZpZXcodGhpcy5nZXRYKCksIHRoaXMuZ2V0WSgpLCB0aGlzLmdldFpvb20oKSk7XG4gIH1cbiAgcHVibGljIFJlbmRlclVJKGRldGFpbDogYW55ID0ge30pIHtcbiAgICBpZiAoZGV0YWlsLnNlbmRlciAmJiBkZXRhaWwuc2VuZGVyIGluc3RhbmNlb2YgTm9kZSkgcmV0dXJuO1xuICAgIGlmIChkZXRhaWwuc2VuZGVyICYmIGRldGFpbC5zZW5kZXIgaW5zdGFuY2VvZiBEZXNnaW5lclZpZXcpIHtcbiAgICAgIHRoaXMuVXBkYXRlVUkoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5DbGVhck5vZGUoKTtcbiAgICB0aGlzLkdldERhdGFOb2RlKCkuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICB0aGlzLkFkZE5vZGVJdGVtKGl0ZW0pO1xuICAgIH0pO1xuICAgIHRoaXMuR2V0QWxsTm9kZSgpLmZvckVhY2goKGl0ZW06IE5vZGUpID0+IHtcbiAgICAgIGl0ZW0uUmVuZGVyTGluZSgpO1xuICAgIH0pXG4gICAgdGhpcy5VcGRhdGVVSSgpO1xuICB9XG4gIHB1YmxpYyBPcGVuKCRkYXRhOiBEYXRhRmxvdykge1xuICAgIHRoaXMuZGF0YSA9ICRkYXRhO1xuICAgIHRoaXMuJGxvY2sgPSBmYWxzZTtcbiAgICB0aGlzLmdyb3VwID0gW107XG4gICAgdGhpcy50b29sYmFyLnJlbmRlclBhdGhHcm91cCgpO1xuICAgIHRoaXMuQmluZERhdGFFdmVudCgpO1xuICAgIHRoaXMuUmVuZGVyVUkoKTtcbiAgfVxuICBwdWJsaWMgQ2FsY1gobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50V2lkdGggLyAodGhpcy5lbE5vZGU/LmNsaWVudFdpZHRoICogdGhpcy5nZXRab29tKCkpKTtcbiAgfVxuICBwdWJsaWMgQ2FsY1kobnVtYmVyOiBhbnkpIHtcbiAgICByZXR1cm4gbnVtYmVyICogKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxOb2RlPy5jbGllbnRIZWlnaHQgKiB0aGlzLmdldFpvb20oKSkpO1xuICB9XG4gIHB1YmxpYyBHZXRBbGxOb2RlKCk6IE5vZGVbXSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZXMgfHwgW107XG4gIH1cbiAgcHVibGljIEdldE5vZGVCeUlkKGlkOiBzdHJpbmcpOiBOb2RlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5HZXRBbGxOb2RlKCkuZmlsdGVyKG5vZGUgPT4gbm9kZS5HZXRJZCgpID09IGlkKT8uWzBdO1xuICB9XG5cbiAgcHVibGljIEdldERhdGFCeUlkKGlkOiBzdHJpbmcpOiBEYXRhRmxvdyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLkdldERhdGFBbGxOb2RlKCkuZmlsdGVyKChpdGVtKSA9PiBpdGVtLkdldCgnaWQnKSA9PT0gaWQpPy5bMF07XG4gIH1cbiAgY2hlY2tPbmx5Tm9kZShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiAodGhpcy5tYWluLmdldENvbnRyb2xCeUtleShrZXkpLm9ubHlOb2RlKSAmJiB0aGlzLm5vZGVzLmZpbHRlcihpdGVtID0+IGl0ZW0uQ2hlY2tLZXkoa2V5KSkubGVuZ3RoID4gMDtcbiAgfVxuICBwdWJsaWMgem9vbV9yZWZyZXNoKGZsZzogYW55ID0gMCkge1xuICAgIGxldCB0ZW1wX3pvb20gPSBmbGcgPT0gMCA/IFpvb20uZGVmYXVsdCA6ICh0aGlzLmdldFpvb20oKSArIFpvb20udmFsdWUgKiBmbGcpO1xuICAgIGlmIChab29tLm1heCA+PSB0ZW1wX3pvb20gJiYgdGVtcF96b29tID49IFpvb20ubWluKSB7XG4gICAgICB0aGlzLnNldFgoKHRoaXMuZ2V0WCgpIC8gdGhpcy56b29tX2xhc3RfdmFsdWUpICogdGVtcF96b29tKTtcbiAgICAgIHRoaXMuc2V0WSgodGhpcy5nZXRZKCkgLyB0aGlzLnpvb21fbGFzdF92YWx1ZSkgKiB0ZW1wX3pvb20pO1xuICAgICAgdGhpcy56b29tX2xhc3RfdmFsdWUgPSB0ZW1wX3pvb207XG4gICAgICB0aGlzLnNldFpvb20odGhpcy56b29tX2xhc3RfdmFsdWUpO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgem9vbV9pbigpIHtcbiAgICB0aGlzLnpvb21fcmVmcmVzaCgxKTtcbiAgfVxuICBwdWJsaWMgem9vbV9vdXQoKSB7XG4gICAgdGhpcy56b29tX3JlZnJlc2goLTEpO1xuICB9XG4gIHB1YmxpYyB6b29tX3Jlc2V0KCkge1xuICAgIHRoaXMuem9vbV9yZWZyZXNoKDApO1xuICB9XG59XG4iLCJpbXBvcnQgeyBJTWFpbiB9IGZyb20gXCIuLi9jb3JlL0Jhc2VGbG93XCI7XG5pbXBvcnQgeyBFdmVudEVudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgRGVzZ2luZXJWaWV3IH0gZnJvbSBcIi4uL2Rlc2dpbmVyL0Rlc2dpbmVyVmlld1wiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuXG5leHBvcnQgY2xhc3MgVmlld0RvY2sgZXh0ZW5kcyBEb2NrQmFzZSB7XG4gIHByaXZhdGUgdmlldzogRGVzZ2luZXJWaWV3IHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgcHJvdGVjdGVkIG1haW46IElNYWluKSB7XG4gICAgc3VwZXIoY29udGFpbmVyLCBtYWluKTtcblxuICAgIHRoaXMudmlldyA9IG5ldyBEZXNnaW5lclZpZXcodGhpcy5lbE5vZGUsIG1haW4pO1xuICAgIHRoaXMudmlldy5vbihFdmVudEVudW0uc2hvd1Byb3BlcnR5LCAoZGF0YTogYW55KSA9PiB7IG1haW4uZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgZGF0YSk7IH0pO1xuICAgIHRoaXMubWFpbi5vbihFdmVudEVudW0ub3BlblByb2plY3QsIChpdGVtOiBhbnkpID0+IHtcbiAgICAgIHRoaXMudmlldz8uT3BlbihpdGVtLmRhdGEpO1xuICAgICAgdGhpcy5tYWluLlNldFByb2plY3RPcGVuKGl0ZW0uZGF0YSk7XG4gICAgfSlcbiAgfVxufVxuIiwiaW1wb3J0IHsgSU1haW4gfSBmcm9tIFwiLi4vY29yZS9CYXNlRmxvd1wiO1xuaW1wb3J0IHsgRG9ja0VudW0gfSBmcm9tIFwiLi4vY29yZS9Db25zdGFudFwiO1xuaW1wb3J0IHsgQ29udHJvbERvY2sgfSBmcm9tIFwiLi9Db250cm9sRG9ja1wiO1xuaW1wb3J0IHsgRG9ja0Jhc2UgfSBmcm9tIFwiLi9Eb2NrQmFzZVwiO1xuaW1wb3J0IHsgUHJvamVjdERvY2sgfSBmcm9tIFwiLi9Qcm9qZWN0RG9ja1wiO1xuaW1wb3J0IHsgUHJvcGVydHlEb2NrIH0gZnJvbSBcIi4vUHJvcGVydHlEb2NrXCI7XG5pbXBvcnQgeyBUYWJEb2NrIH0gZnJvbSBcIi4vVGFiRG9ja1wiO1xuaW1wb3J0IHsgVmlld0RvY2sgfSBmcm9tIFwiLi9WaWV3RG9ja1wiO1xuXG5leHBvcnQgY2xhc3MgRG9ja01hbmFnZXIge1xuICBwcml2YXRlICRkb2NrTWFuYWdlcjogYW55ID0ge307XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHByb3RlY3RlZCBtYWluOiBJTWFpbikgeyB9XG4gIHB1YmxpYyByZXNldCgpIHtcbiAgICB0aGlzLiRkb2NrTWFuYWdlciA9IHt9O1xuICAgIHRoaXMuYWRkRG9jayhEb2NrRW51bS5sZWZ0LCBDb250cm9sRG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLmxlZnQsIFByb2plY3REb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0ucmlnaHQsIFByb3BlcnR5RG9jayk7XG4gICAgdGhpcy5hZGREb2NrKERvY2tFbnVtLnZpZXcsIFZpZXdEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0udG9wLCBUYWJEb2NrKTtcbiAgICB0aGlzLmFkZERvY2soRG9ja0VudW0uYm90dG9tLCBEb2NrQmFzZSk7XG4gICAgdGhpcy5SZW5kZXJVSSgpO1xuICB9XG4gIHB1YmxpYyBhZGREb2NrKCRrZXk6IHN0cmluZywgJHZpZXc6IGFueSkge1xuICAgIGlmICghdGhpcy4kZG9ja01hbmFnZXJbJGtleV0pXG4gICAgICB0aGlzLiRkb2NrTWFuYWdlclska2V5XSA9IFtdO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldID0gWy4uLnRoaXMuJGRvY2tNYW5hZ2VyWyRrZXldLCAkdmlld107XG4gIH1cblxuICBwdWJsaWMgUmVuZGVyVUkoKSB7XG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cInZzLWxlZnQgdnMtZG9ja1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZzLWNvbnRlbnRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLXRvcCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ2cy12aWV3IHZzLWRvY2tcIj48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInZzLWJvdHRvbSB2cy1kb2NrXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ2cy1yaWdodCB2cy1kb2NrXCI+PC9kaXY+XG4gICAgYDtcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRkb2NrTWFuYWdlcikuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIGxldCBxdWVyeVNlbGVjdG9yID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLiR7a2V5fWApO1xuICAgICAgaWYgKHF1ZXJ5U2VsZWN0b3IpIHtcbiAgICAgICAgdGhpcy4kZG9ja01hbmFnZXJba2V5XS5mb3JFYWNoKCgkaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgbmV3ICRpdGVtKHF1ZXJ5U2VsZWN0b3IsIHRoaXMubWFpbik7XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IElNYWluIH0gZnJvbSAnLi9jb3JlL0Jhc2VGbG93JztcbmltcG9ydCB7IERvY2tNYW5hZ2VyIH0gZnJvbSAnLi9kb2NrL0RvY2tNYW5hZ2VyJztcbmltcG9ydCB7IEV2ZW50RmxvdyB9IGZyb20gJy4vY29yZS9FdmVudEZsb3cnO1xuaW1wb3J0IHsgY29tcGFyZVNvcnQsIEV2ZW50RW51bSwgUHJvcGVydHlFbnVtIH0gZnJvbSAnLi9jb3JlL0NvbnN0YW50JztcbmltcG9ydCB7IGdldFRpbWUsIGdldFV1aWQgfSBmcm9tICcuL2NvcmUvVXRpbHMnO1xuaW1wb3J0IHsgRGF0YUZsb3cgfSBmcm9tICcuL2NvcmUvRGF0YUZsb3cnO1xuZXhwb3J0IGNsYXNzIFZpc3VhbEZsb3cgaW1wbGVtZW50cyBJTWFpbiB7XG4gIHByaXZhdGUgJGRhdGE6IERhdGFGbG93ID0gbmV3IERhdGFGbG93KHRoaXMpO1xuICBwcml2YXRlICRwcm9qZWN0T3BlbjogYW55O1xuICBwcml2YXRlICRwcm9wZXJ0aWVzOiBhbnkgPSB7fTtcbiAgcHJpdmF0ZSAkY29udHJvbDogYW55ID0ge307XG4gIHByaXZhdGUgJGNvbnRyb2xEZWZhdWx0OiBhbnkgPSB7XG4gICAgbm9kZV9iZWdpbjoge1xuICAgICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXBsYXlcIj48L2k+JyxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBuYW1lOiAnQmVnaW4nLFxuICAgICAgY2xhc3M6ICdub2RlLXRlc3QnLFxuICAgICAgaHRtbDogJycsXG4gICAgICBvdXRwdXQ6IDEsXG4gICAgICBpbnB1dDogMCxcbiAgICAgIG9ubHlOb2RlOiB0cnVlXG4gICAgfSxcbiAgICBub2RlX2VuZDoge1xuICAgICAgaWNvbjogJzxpIGNsYXNzPVwiZmFzIGZhLXN0b3BcIj48L2k+JyxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBuYW1lOiAnRW5kJyxcbiAgICAgIGh0bWw6ICcnLFxuICAgICAgb3V0cHV0OiAwLFxuICAgICAgb25seU5vZGU6IHRydWVcbiAgICB9LFxuICAgIG5vZGVfaWY6IHtcbiAgICAgIGljb246ICc8aSBjbGFzcz1cImZhcyBmYS1lcXVhbHNcIj48L2k+JyxcbiAgICAgIHNvcnQ6IDAsXG4gICAgICBuYW1lOiAnSWYnLFxuICAgICAgaHRtbDogJzxkaXY+Y29uZGl0aW9uOjxici8+PGlucHV0IG5vZGU6bW9kZWw9XCJjb25kaXRpb25cIi8+PC9kaXY+JyxcbiAgICAgIHNjcmlwdDogYGAsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGNvbmRpdGlvbjoge1xuICAgICAgICAgIGtleTogXCJjb25kaXRpb25cIixcbiAgICAgICAgICBkZWZhdWx0OiAnJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgb3V0cHV0OiAyXG4gICAgfSxcbiAgICBub2RlX2dyb3VwOiB7XG4gICAgICBpY29uOiAnPGkgY2xhc3M9XCJmYXMgZmEtb2JqZWN0LWdyb3VwXCI+PC9pPicsXG4gICAgICBzb3J0OiAwLFxuICAgICAgbmFtZTogJ0dyb3VwJyxcbiAgICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidGV4dC1jZW50ZXIgcDNcIj48YnV0dG9uIGNsYXNzPVwiYnRuR29Hcm91cFwiPkdvPC9idXR0b24+PC9kaXY+JyxcbiAgICAgIHNjcmlwdDogYG5vZGUuZWxOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5idG5Hb0dyb3VwJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge25vZGUub3Blbkdyb3VwKCl9KTtgLFxuICAgICAgcHJvcGVydGllczoge1xuICAgICAgICBjb25kaXRpb246IHtcbiAgICAgICAgICBrZXk6IFwiY29uZGl0aW9uXCIsXG4gICAgICAgICAgZGVmYXVsdDogJydcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG91dHB1dDogMlxuICAgIH0sXG4gIH1cbiAgcHJpdmF0ZSAkY29udHJvbENob29zZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgJGRvY2tNYW5hZ2VyOiBEb2NrTWFuYWdlcjtcbiAgcHJpdmF0ZSBldmVudHM6IEV2ZW50RmxvdztcbiAgcHVibGljIGdldERvY2tNYW5hZ2VyKCk6IERvY2tNYW5hZ2VyIHtcbiAgICByZXR1cm4gdGhpcy4kZG9ja01hbmFnZXI7XG4gIH1cbiAgb25TYWZlKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5vblNhZmUoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBvbihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMub24oZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICByZW1vdmVMaXN0ZW5lcihldmVudDogc3RyaW5nLCBjYWxsYmFjazogYW55KSB7XG4gICAgdGhpcy5ldmVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNhbGxiYWNrKTtcbiAgfVxuICBkaXNwYXRjaChldmVudDogc3RyaW5nLCBkZXRhaWxzOiBhbnkpIHtcbiAgICB0aGlzLmV2ZW50cy5kaXNwYXRjaChldmVudCwgZGV0YWlscyk7XG4gIH1cbiAgZ2V0Q29udHJvbEFsbCgpIHtcbiAgICByZXR1cm4gdGhpcy4kY29udHJvbCA/PyB7fTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBjb250YWluZXI6IEhUTUxFbGVtZW50LCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEZsb3coKTtcbiAgICAvL3NldCBwcm9qZWN0XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0uc29sdXRpb25dID0ge1xuICAgICAgaWQ6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICB9LFxuICAgICAga2V5OiB7XG4gICAgICAgIGRlZmF1bHQ6IFByb3BlcnR5RW51bS5zb2x1dGlvblxuICAgICAgfSxcbiAgICAgIG5hbWU6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gYHNvbHV0aW9uLSR7Z2V0VGltZSgpfWBcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0czoge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy4kcHJvcGVydGllc1tQcm9wZXJ0eUVudW0ubGluZV0gPSB7XG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLmxpbmVcbiAgICAgIH0sXG4gICAgICBmcm9tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICBmcm9tSW5kZXg6IHtcbiAgICAgICAgZGVmYXVsdDogMFxuICAgICAgfSxcbiAgICAgIHRvOiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB0b0luZGV4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH1cbiAgICB9O1xuICAgIC8vc2V0IHByb2plY3RcbiAgICB0aGlzLiRwcm9wZXJ0aWVzW1Byb3BlcnR5RW51bS5tYWluXSA9IHtcbiAgICAgIC4uLihvcHRpb24/LnByb3BlcnRpZXMgfHwge30pLFxuICAgICAgaWQ6IHtcbiAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICB9LFxuICAgICAgbmFtZToge1xuICAgICAgICBkZWZhdWx0OiAoKSA9PiBgYXBwLSR7Z2V0VGltZSgpfWBcbiAgICAgIH0sXG4gICAgICBrZXk6IHtcbiAgICAgICAgZGVmYXVsdDogUHJvcGVydHlFbnVtLm1haW5cbiAgICAgIH0sXG4gICAgICB4OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB5OiB7XG4gICAgICAgIGRlZmF1bHQ6IDBcbiAgICAgIH0sXG4gICAgICB6b29tOiB7XG4gICAgICAgIGRlZmF1bHQ6IDFcbiAgICAgIH0sXG4gICAgICBub2Rlczoge1xuICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgfVxuICAgIH07XG4gICAgLy8gc2V0IGNvbnRyb2xcbiAgICB0aGlzLiRjb250cm9sID0geyAuLi5vcHRpb24/LmNvbnRyb2wgfHwge30sIC4uLnRoaXMuJGNvbnRyb2xEZWZhdWx0IH07XG4gICAgbGV0IGNvbnRyb2xUZW1wOiBhbnkgPSB7fTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLiRjb250cm9sKS5tYXAoKGtleSkgPT4gKHsgLi4udGhpcy4kY29udHJvbFtrZXldLCBrZXksIHNvcnQ6ICh0aGlzLiRjb250cm9sW2tleV0uc29ydCA9PT0gdW5kZWZpbmVkID8gOTk5OTkgOiB0aGlzLiRjb250cm9sW2tleV0uc29ydCkgfSkpLnNvcnQoY29tcGFyZVNvcnQpLmZvckVhY2goKGl0ZW06IGFueSkgPT4ge1xuICAgICAgY29udHJvbFRlbXBbaXRlbS5rZXldID0gaXRlbTtcbiAgICAgIHRoaXMuJHByb3BlcnRpZXNbYG5vZGVfJHtpdGVtLmtleX1gXSA9IHtcbiAgICAgICAgLi4uKGl0ZW0ucHJvcGVydGllcyB8fCB7fSksXG4gICAgICAgIGlkOiB7XG4gICAgICAgICAgZGVmYXVsdDogKCkgPT4gZ2V0VGltZSgpXG4gICAgICAgIH0sXG4gICAgICAgIGtleToge1xuICAgICAgICAgIGRlZmF1bHQ6IGl0ZW0ua2V5XG4gICAgICAgIH0sXG4gICAgICAgIG5hbWU6IHtcbiAgICAgICAgICBkZWZhdWx0OiBpdGVtLmtleVxuICAgICAgICB9LFxuICAgICAgICB4OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZGVmYXVsdDogMFxuICAgICAgICB9LFxuICAgICAgICBncm91cDoge1xuICAgICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICAgIH0sXG4gICAgICAgIGxpbmVzOiB7XG4gICAgICAgICAgZGVmYXVsdDogW11cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcbiAgICB0aGlzLiRjb250cm9sID0gY29udHJvbFRlbXA7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgndnMtY29udGFpbmVyJyk7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCgndnMtY29udGFpbmVyJyk7XG4gICAgdGhpcy4kZG9ja01hbmFnZXIgPSBuZXcgRG9ja01hbmFnZXIodGhpcy5jb250YWluZXIsIHRoaXMpO1xuICAgIHRoaXMuJGRvY2tNYW5hZ2VyLnJlc2V0KCk7XG4gICAgdGhpcy4kZGF0YS5Jbml0RGF0YSh7fSwgdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KFByb3BlcnR5RW51bS5zb2x1dGlvbikpO1xuXG4gIH1cbiAgZ2V0UHJvamVjdEFsbCgpOiBhbnlbXSB7XG4gICAgcmV0dXJuIHRoaXMuJGRhdGEuR2V0KCdwcm9qZWN0cycpID8/IFtdO1xuICB9XG4gIG9wZW4oJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuJGRhdGEuSW5pdERhdGEoJGRhdGEsIHRoaXMuZ2V0UHJvcGVydHlCeUtleShQcm9wZXJ0eUVudW0uc29sdXRpb24pKTtcbiAgfVxuICBTZXRQcm9qZWN0T3BlbigkZGF0YTogYW55KTogdm9pZCB7XG4gICAgdGhpcy4kcHJvamVjdE9wZW4gPSAkZGF0YTtcbiAgfVxuICBDaGVja1Byb2plY3RPcGVuKCRkYXRhOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvamVjdE9wZW4gPT0gJGRhdGE7XG4gIH1cbiAgbmV3UHJvamVjdCgpOiB2b2lkIHtcbiAgICB0aGlzLm9wZW5Qcm9qZWN0KHt9KTtcbiAgICB0aGlzLmRpc3BhdGNoKEV2ZW50RW51bS5uZXdQcm9qZWN0LCB7fSk7XG4gIH1cbiAgb3BlblByb2plY3QoJGRhdGE6IGFueSk6IHZvaWQge1xuICAgIGlmICgkZGF0YSBpbnN0YW5jZW9mIERhdGFGbG93KSB7XG4gICAgICBsZXQgJHByb2plY3Q6IGFueSA9IHRoaXMuZ2V0UHJvamVjdEJ5SWQoJGRhdGEuR2V0KCdpZCcpKTtcbiAgICAgIGlmICghJHByb2plY3QpIHtcbiAgICAgICAgJHByb2plY3QgPSAkZGF0YTtcbiAgICAgICAgdGhpcy4kZGF0YS5BcHBlbmQoJ3Byb2plY3RzJywgJHByb2plY3QpO1xuICAgICAgfVxuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsICRwcm9qZWN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGRhdGEgPSBuZXcgRGF0YUZsb3codGhpcyk7XG4gICAgICBkYXRhLkluaXREYXRhKCRkYXRhLCB0aGlzLmdldFByb3BlcnR5QnlLZXkoUHJvcGVydHlFbnVtLm1haW4pKTtcbiAgICAgIHRoaXMuJGRhdGEuQXBwZW5kKCdwcm9qZWN0cycsIGRhdGEpO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0ub3BlblByb2plY3QsIHsgZGF0YSB9KTtcbiAgICAgIHRoaXMuZGlzcGF0Y2goRXZlbnRFbnVtLnNob3dQcm9wZXJ0eSwgeyBkYXRhIH0pO1xuICAgICAgdGhpcy5kaXNwYXRjaChFdmVudEVudW0uY2hhbmdlLCB7IGRhdGEgfSk7XG4gICAgfVxuICB9XG4gIHB1YmxpYyBnZXRQcm9qZWN0QnlJZCgkaWQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLiRkYXRhLkdldCgncHJvamVjdHMnKS5maWx0ZXIoKGl0ZW06IERhdGFGbG93KSA9PiBpdGVtLkdldCgnaWQnKSA9PT0gJGlkKT8uWzBdO1xuICB9XG4gIHNldENvbnRyb2xDaG9vc2Uoa2V5OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy4kY29udHJvbENob29zZSA9IGtleTtcbiAgfVxuICBnZXRDb250cm9sQ2hvb3NlKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sQ2hvb3NlO1xuICB9XG4gIGdldENvbnRyb2xCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLiRjb250cm9sW2tleV0gfHwge307XG4gIH1cbiAgZ2V0Q29udHJvbE5vZGVCeUtleShrZXk6IHN0cmluZykge1xuICAgIHJldHVybiB7XG4gICAgICAuLi50aGlzLmdldENvbnRyb2xCeUtleShrZXkpLFxuICAgICAgcHJvcGVydGllczogdGhpcy5nZXRQcm9wZXJ0eUJ5S2V5KGBub2RlXyR7a2V5fWApXG4gICAgfVxuICB9XG4gIGdldFByb3BlcnR5QnlLZXkoa2V5OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy4kcHJvcGVydGllc1trZXldO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFBTyxNQUFNLFNBQVMsR0FBRztJQUN2QixJQUFBLElBQUksRUFBRSxNQUFNO0lBQ1osSUFBQSxVQUFVLEVBQUUsWUFBWTtJQUN4QixJQUFBLFlBQVksRUFBRSxjQUFjO0lBQzVCLElBQUEsV0FBVyxFQUFFLGFBQWE7SUFDMUIsSUFBQSxV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O0lBRTNELFFBQUEsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1RCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDO1lBQzFDLElBQUksSUFBSSxZQUFZLFFBQVEsRUFBRTtJQUM1QixZQUFBLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLFNBQUE7SUFBTSxhQUFBO2dCQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDMUMsWUFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QyxTQUFBO0lBQ0QsUUFBQSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDN0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRXJDLFFBQUEsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtJQUNyQixZQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlDLFNBQUE7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ2xELFFBQUEsSUFBSSxDQUFDLE1BQU0sQ0FB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
