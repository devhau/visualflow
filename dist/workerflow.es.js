
  /**
   * @license
   * author: Nguyen Van Hau
   * workerflow.js v0.0.1
   * Released under the MIT license.
   */

class ControlFlow {
    elControl;
    parent;
    constructor(parent) {
        this.parent = parent;
        this.elControl = parent.container?.querySelector('.workerflow-control__list');
        if (this.elControl) {
            this.elControl.innerHTML = "";
            let keys = Object.keys(parent.option.control);
            keys.forEach(key => {
                let Node = document.createElement('div');
                Node.setAttribute('draggable', 'true');
                Node.setAttribute('data-node', key);
                Node.classList.add("workerflow-control__item");
                Node.innerHTML = parent.option.control[key].name;
                Node.addEventListener('dragstart', this.dragStart.bind(this));
                Node.addEventListener('dragend', this.dragend.bind(this));
                this.elControl?.appendChild(Node);
            });
        }
    }
    dragend(e) {
        this.parent.dataNodeSelect = null;
    }
    dragStart(e) {
        if (e.type === "touchstart") {
            this.parent.dataNodeSelect = e.target.closest(".workerflow-control__item").getAttribute('data-node');
        }
        else {
            this.parent.dataNodeSelect = e.target.getAttribute('data-node');
            e.dataTransfer.setData("node", e.target.getAttribute('data-node'));
        }
    }
}

class NodeFlow {
    parent;
    elNode;
    elNodeInputs;
    elNodeOutputs;
    elNodeContent;
    nodeId;
    pos_x = 0;
    pos_y = 0;
    arrLine = [];
    AddLine(line) {
        this.arrLine = [...this.arrLine, line];
    }
    constructor(parent, id, option = null) {
        this.parent = parent;
        this.nodeId = id;
        this.elNode = document.createElement('div');
        this.elNode.classList.add("workerflow-node");
        this.elNode.id = `node-${id}`;
        this.elNodeInputs = document.createElement('div');
        this.elNodeInputs.classList.add('workerflow-node_inputs');
        this.elNodeInputs.innerHTML = `<div class="dot"></div>`;
        this.elNodeContent = document.createElement('div');
        this.elNodeContent.classList.add('workerflow-node_content');
        this.elNodeOutputs = document.createElement('div');
        this.elNodeOutputs.classList.add('workerflow-node_outputs');
        this.elNodeOutputs.innerHTML = `<div class="dot"></div>`;
        this.elNode.setAttribute('data-node', id);
        this.elNode.setAttribute('style', `top: ${this.pos_y}px; left: ${this.pos_x}px;`);
        this.elNode.addEventListener('mousedown', this.StartSelected.bind(this));
        this.elNode.addEventListener('touchstart', this.StartSelected.bind(this));
        this.elNode.appendChild(this.elNodeInputs);
        this.elNode.appendChild(this.elNodeContent);
        this.elNode.appendChild(this.elNodeOutputs);
        this.parent.elCanvas?.appendChild(this.elNode);
    }
    StartSelected(e) {
        this.parent.SelectNode(this);
    }
    updatePosition(x, y) {
        if (this.elNode) {
            this.pos_x = (this.elNode.offsetLeft - x);
            this.pos_y = (this.elNode.offsetTop - y);
            this.elNode.setAttribute('style', `top: ${this.pos_y}px; left: ${this.pos_x}px;`);
            this.arrLine.forEach((item) => {
                item.update();
            });
        }
    }
}

class ViewFlow {
    elView;
    elCanvas = null;
    parent;
    nodes = [];
    flgDrap = false;
    flgDrapMove = false;
    zoom = 1;
    zoom_max = 1.6;
    zoom_min = 0.5;
    zoom_value = 0.1;
    zoom_last_value = 1;
    canvas_x = 0;
    canvas_y = 0;
    pos_x = 0;
    pos_x_start = 0;
    pos_y = 0;
    pos_y_start = 0;
    mouse_x = 0;
    mouse_y = 0;
    nodeSelected = null;
    dotSelected = null;
    constructor(parent) {
        this.parent = parent;
        this.elView = this.parent.container?.querySelector('.workerflow-desgin .workerflow-view');
        if (this.elView) {
            this.elCanvas = document.createElement('div');
            this.elCanvas.classList.add("workerflow-canvas");
            this.elView.appendChild(this.elCanvas);
            this.elView.tabIndex = 0;
            this.addEvent();
            this.elView.addEventListener('drop', this.dropEnd.bind(this));
            this.elView.addEventListener('dragover', this.dragover.bind(this));
        }
    }
    dropEnd(ev) {
        if (!this.elCanvas || !this.elView)
            return;
        if (ev.type === "touchend") ;
        else {
            ev.preventDefault();
            ev.dataTransfer.getData("node");
        }
        let node = this.AddNode();
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
        e_pos_x = e_pos_x * (this.elView.clientWidth / (this.elView.clientWidth * this.zoom)) - (this.elView.getBoundingClientRect().x * (this.elView.clientWidth / (this.elView.clientWidth * this.zoom)));
        e_pos_y = e_pos_y * (this.elView.clientHeight / (this.elView.clientHeight * this.zoom)) - (this.elView.getBoundingClientRect().y * (this.elView.clientHeight / (this.elView.clientHeight * this.zoom)));
        node.updatePosition(e_pos_x, e_pos_y);
        console.log(ev);
    }
    dragover(e) {
        e.preventDefault();
    }
    UnSelectNode() {
        if (this.nodeSelected) {
            this.nodeSelected.elNode?.classList.remove('active');
        }
        this.nodeSelected = null;
    }
    SelectNode(node) {
        this.UnSelectNode();
        this.nodeSelected = node;
        this.nodeSelected.elNode?.classList.add('active');
    }
    UnSelectDot() {
        if (this.dotSelected) {
            this.dotSelected.elNode?.classList.remove('active');
        }
        this.dotSelected = null;
    }
    SelectDot(node) {
        this.UnSelectDot();
        this.dotSelected = node;
        this.dotSelected.elNode?.classList.add('active');
    }
    AddNode() {
        let node = new NodeFlow(this, this.parent.getUuid());
        this.nodes = [...this.nodes, node];
        return node;
    }
    addEvent() {
        if (!this.elView)
            return;
        /* Mouse and Touch Actions */
        this.elView.addEventListener('mouseup', this.EndMove.bind(this));
        this.elView.addEventListener('mouseleave', this.EndMove.bind(this));
        this.elView.addEventListener('mousemove', this.Move.bind(this));
        this.elView.addEventListener('mousedown', this.StartMove.bind(this));
        this.elView.addEventListener('touchend', this.EndMove.bind(this));
        this.elView.addEventListener('touchmove', this.Move.bind(this));
        this.elView.addEventListener('touchstart', this.StartMove.bind(this));
        /* Context Menu */
        this.elView.addEventListener('contextmenu', this.contextmenu.bind(this));
    }
    StartMove(e) {
        console.log(e);
        if (this.nodeSelected && (this.nodeSelected.elNode !== e.target && this.nodeSelected.elNode !== e.target.parents('.workerflow-node'))) {
            this.UnSelectNode();
        }
        if (e.type === "touchstart") {
            this.pos_x = e.touches[0].clientX;
            this.pos_x_start = e.touches[0].clientX;
            this.pos_y = e.touches[0].clientY;
            this.pos_y_start = e.touches[0].clientY;
        }
        else {
            this.pos_x = e.clientX;
            this.pos_x_start = e.clientX;
            this.pos_y = e.clientY;
            this.pos_y_start = e.clientY;
        }
        this.flgDrap = true;
        this.flgDrapMove = false;
    }
    Move(e) {
        if (!this.flgDrap)
            return;
        if (!this.elCanvas || !this.elView)
            return;
        this.flgDrapMove = true;
        let e_pos_x = 0;
        let e_pos_y = 0;
        if (e.type === "touchmove") {
            e_pos_x = e.touches[0].clientX;
            e_pos_y = e.touches[0].clientY;
        }
        else {
            e_pos_x = e.clientX;
            e_pos_y = e.clientY;
        }
        if (this.nodeSelected) {
            let x = (this.pos_x - e_pos_x) * this.elCanvas.clientWidth / (this.elCanvas.clientWidth * this.zoom);
            let y = (this.pos_y - e_pos_y) * this.elCanvas.clientHeight / (this.elCanvas.clientHeight * this.zoom);
            this.pos_x = e_pos_x;
            this.pos_y = e_pos_y;
            this.nodeSelected.updatePosition(x, y);
        }
        else {
            let x = this.canvas_x + (-(this.pos_x - e_pos_x));
            let y = this.canvas_y + (-(this.pos_y - e_pos_y));
            this.elCanvas.style.transform = "translate(" + x + "px, " + y + "px) scale(" + this.zoom + ")";
        }
        if (e.type === "touchmove") {
            this.mouse_x = e_pos_x;
            this.mouse_y = e_pos_y;
        }
    }
    EndMove(e) {
        if (this.flgDrapMove) {
            this.UnSelectNode();
        }
        this.flgDrapMove = false;
        this.flgDrap = false;
        let e_pos_x = 0;
        let e_pos_y = 0;
        if (e.type === "touchend") {
            e_pos_x = this.mouse_x;
            e_pos_y = this.mouse_y;
        }
        else {
            e_pos_x = e.clientX;
            e_pos_y = e.clientY;
        }
        this.canvas_x = this.canvas_x + (-(this.pos_x - e_pos_x));
        this.canvas_y = this.canvas_y + (-(this.pos_y - e_pos_y));
        this.pos_x = e_pos_x;
        this.pos_y = e_pos_y;
    }
    contextmenu(e) {
        e.preventDefault();
    }
}

class WorkerFlow {
    container;
    View;
    Control;
    dataNodeSelect = null;
    events = {};
    option;
    constructor(container, option = null) {
        this.container = container;
        this.container.classList.add("workerflow");
        this.option = option || {
            control: {
                Node1: {
                    name: '<i class="fab fa-aws"></i><span> AWS</span>',
                    html: "<div>Xin chào</div>",
                },
                Node2: {
                    name: "Node2",
                    html: "<div>Xin chào</div>",
                },
                Node3: {
                    name: "Node3",
                    html: "<div>Xin chào</div>",
                },
                Node4: {
                    name: "Node4",
                    html: "<div>Xin chào</div>",
                }
            }
        };
        this.container.innerHTML = `
    <div class="workerflow-control">
      <h2 class="workerflow-control__header">Node Control</h2>
      <div class="workerflow-control__list">
      <div draggable="true">Node 1</div>
      </div>
    </div>
    <div class="workerflow-desgin">
      <div class="workerflow-items">
        <div class="workerflow-item">Thông tin mới</div>
        <div class="workerflow-item">Thông tin mới123</div>
      </div>
      <div class="workerflow-view">
      </div>
    </div>
    `;
        this.View = new ViewFlow(this);
        this.Control = new ControlFlow(this);
    }
    getUuid() {
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
        let self = this;
        // Check if this event not exists
        if (this.events[event] === undefined) {
            // console.error(`This event: ${event} does not exist`);
            return false;
        }
        this.events[event].listeners.forEach((listener) => {
            listener(details, self);
        });
    }
}

export { WorkerFlow as default };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyZmxvdy5lcy5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbXBvbmVudHMvQ29udHJvbEZsb3cudHMiLCIuLi9zcmMvY29tcG9uZW50cy9Ob2RlRmxvdy50cyIsIi4uL3NyYy9jb21wb25lbnRzL1ZpZXdGbG93LnRzIiwiLi4vc3JjL1dvcmtlckZsb3cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV29ya2VyRmxvdyB9IGZyb20gXCIuLi9Xb3JrZXJGbG93XCI7XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sRmxvdyB7XG4gIHByaXZhdGUgZWxDb250cm9sOiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgcGFyZW50OiBXb3JrZXJGbG93O1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5lbENvbnRyb2wgPSBwYXJlbnQuY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKCcud29ya2VyZmxvdy1jb250cm9sX19saXN0Jyk7XG4gICAgaWYgKHRoaXMuZWxDb250cm9sKSB7XG4gICAgICB0aGlzLmVsQ29udHJvbC5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwYXJlbnQub3B0aW9uLmNvbnRyb2wpO1xuICAgICAga2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGxldCBOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIE5vZGUuc2V0QXR0cmlidXRlKCdkcmFnZ2FibGUnLCAndHJ1ZScpO1xuICAgICAgICBOb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJywga2V5KTtcbiAgICAgICAgTm9kZS5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvdy1jb250cm9sX19pdGVtXCIpO1xuICAgICAgICBOb2RlLmlubmVySFRNTCA9IHBhcmVudC5vcHRpb24uY29udHJvbFtrZXldLm5hbWU7XG4gICAgICAgIE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ3N0YXJ0JywgdGhpcy5kcmFnU3RhcnQuYmluZCh0aGlzKSlcbiAgICAgICAgTm9kZS5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW5kJywgdGhpcy5kcmFnZW5kLmJpbmQodGhpcykpXG4gICAgICAgIHRoaXMuZWxDb250cm9sPy5hcHBlbmRDaGlsZChOb2RlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBwdWJsaWMgZHJhZ2VuZChlOiBhbnkpIHtcbiAgICB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdCA9IG51bGw7XG4gIH1cblxuICBwdWJsaWMgZHJhZ1N0YXJ0KGU6IGFueSkge1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hzdGFydFwiKSB7XG4gICAgICB0aGlzLnBhcmVudC5kYXRhTm9kZVNlbGVjdCA9IGUudGFyZ2V0LmNsb3Nlc3QoXCIud29ya2VyZmxvdy1jb250cm9sX19pdGVtXCIpLmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGFyZW50LmRhdGFOb2RlU2VsZWN0ID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnKTtcbiAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJub2RlXCIsIGUudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1ub2RlJykpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgVmlld0Zsb3cgfSBmcm9tIFwiLi9WaWV3Rmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgTm9kZUZsb3cge1xuICBwdWJsaWMgcGFyZW50OiBWaWV3RmxvdztcbiAgcHVibGljIGVsTm9kZTogSFRNTEVsZW1lbnQ7XG4gIHB1YmxpYyBlbE5vZGVJbnB1dHM6IEhUTUxFbGVtZW50IHwgbnVsbCB8IG51bGw7XG4gIHB1YmxpYyBlbE5vZGVPdXRwdXRzOiBIVE1MRWxlbWVudCB8IG51bGwgfCBudWxsO1xuICBwdWJsaWMgZWxOb2RlQ29udGVudDogSFRNTEVsZW1lbnQgfCBudWxsIHwgbnVsbDtcbiAgcHVibGljIG5vZGVJZDogc3RyaW5nO1xuICBwdWJsaWMgcG9zX3g6IG51bWJlciA9IDA7XG4gIHB1YmxpYyBwb3NfeTogbnVtYmVyID0gMDtcbiAgcHVibGljIGFyckxpbmU6IExpbmVGbG93W10gPSBbXTtcbiAgcHVibGljIEFkZExpbmUobGluZTogTGluZUZsb3cpIHtcbiAgICB0aGlzLmFyckxpbmUgPSBbLi4udGhpcy5hcnJMaW5lLCBsaW5lXTtcbiAgfVxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBWaWV3RmxvdywgaWQ6IHN0cmluZywgb3B0aW9uOiBhbnkgPSBudWxsKSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5ub2RlSWQgPSBpZDtcbiAgICB0aGlzLmVsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LW5vZGVcIik7XG4gICAgdGhpcy5lbE5vZGUuaWQgPSBgbm9kZS0ke2lkfWA7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsTm9kZUlucHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfaW5wdXRzJyk7XG4gICAgdGhpcy5lbE5vZGVJbnB1dHMuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJkb3RcIj48L2Rpdj5gO1xuICAgIHRoaXMuZWxOb2RlQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlQ29udGVudC5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfY29udGVudCcpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5jbGFzc0xpc3QuYWRkKCd3b3JrZXJmbG93LW5vZGVfb3V0cHV0cycpO1xuICAgIHRoaXMuZWxOb2RlT3V0cHV0cy5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImRvdFwiPjwvZGl2PmA7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLW5vZGUnLCBpZCk7XG4gICAgdGhpcy5lbE5vZGUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGB0b3A6ICR7dGhpcy5wb3NfeX1weDsgbGVmdDogJHt0aGlzLnBvc194fXB4O2ApO1xuICAgIHRoaXMuZWxOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuU3RhcnRTZWxlY3RlZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsTm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydFNlbGVjdGVkLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlSW5wdXRzKTtcbiAgICB0aGlzLmVsTm9kZS5hcHBlbmRDaGlsZCh0aGlzLmVsTm9kZUNvbnRlbnQpO1xuICAgIHRoaXMuZWxOb2RlLmFwcGVuZENoaWxkKHRoaXMuZWxOb2RlT3V0cHV0cylcbiAgICB0aGlzLnBhcmVudC5lbENhbnZhcz8uYXBwZW5kQ2hpbGQodGhpcy5lbE5vZGUpO1xuICB9XG4gIHB1YmxpYyBTdGFydFNlbGVjdGVkKGU6IGFueSkge1xuICAgIHRoaXMucGFyZW50LlNlbGVjdE5vZGUodGhpcyk7XG4gIH1cbiAgcHVibGljIHVwZGF0ZVBvc2l0aW9uKHg6IGFueSwgeTogYW55KSB7XG4gICAgaWYgKHRoaXMuZWxOb2RlKSB7XG4gICAgICB0aGlzLnBvc194ID0gKHRoaXMuZWxOb2RlLm9mZnNldExlZnQgLSB4KTtcbiAgICAgIHRoaXMucG9zX3kgPSAodGhpcy5lbE5vZGUub2Zmc2V0VG9wIC0geSk7XG4gICAgICB0aGlzLmVsTm9kZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYHRvcDogJHt0aGlzLnBvc195fXB4OyBsZWZ0OiAke3RoaXMucG9zX3h9cHg7YCk7XG4gICAgICB0aGlzLmFyckxpbmUuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBpdGVtLnVwZGF0ZSgpO1xuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IFdvcmtlckZsb3cgfSBmcm9tIFwiLi4vV29ya2VyRmxvd1wiO1xuaW1wb3J0IHsgTGluZUZsb3cgfSBmcm9tIFwiLi9MaW5lRmxvd1wiO1xuaW1wb3J0IHsgTm9kZUZsb3cgfSBmcm9tIFwiLi9Ob2RlRmxvd1wiO1xuXG5leHBvcnQgY2xhc3MgVmlld0Zsb3cge1xuICBwcml2YXRlIGVsVmlldzogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgfCBudWxsO1xuICBwdWJsaWMgZWxDYW52YXM6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcGFyZW50OiBXb3JrZXJGbG93O1xuICBwcml2YXRlIG5vZGVzOiBOb2RlRmxvd1tdID0gW107XG4gIHByaXZhdGUgZmxnRHJhcDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIGZsZ0RyYXBNb3ZlOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgem9vbTogbnVtYmVyID0gMTtcbiAgcHJpdmF0ZSB6b29tX21heDogbnVtYmVyID0gMS42O1xuICBwcml2YXRlIHpvb21fbWluOiBudW1iZXIgPSAwLjU7XG4gIHByaXZhdGUgem9vbV92YWx1ZTogbnVtYmVyID0gMC4xO1xuICBwcml2YXRlIHpvb21fbGFzdF92YWx1ZTogbnVtYmVyID0gMTtcbiAgcHJpdmF0ZSBjYW52YXNfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBjYW52YXNfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwb3NfeDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwb3NfeF9zdGFydDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwb3NfeTogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBwb3NfeV9zdGFydDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBtb3VzZV94OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIG1vdXNlX3k6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbm9kZVNlbGVjdGVkOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRvdFNlbGVjdGVkOiBOb2RlRmxvdyB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyZW50OiBXb3JrZXJGbG93KSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5lbFZpZXcgPSB0aGlzLnBhcmVudC5jb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoJy53b3JrZXJmbG93LWRlc2dpbiAud29ya2VyZmxvdy12aWV3Jyk7XG4gICAgaWYgKHRoaXMuZWxWaWV3KSB7XG4gICAgICB0aGlzLmVsQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB0aGlzLmVsQ2FudmFzLmNsYXNzTGlzdC5hZGQoXCJ3b3JrZXJmbG93LWNhbnZhc1wiKTtcbiAgICAgIHRoaXMuZWxWaWV3LmFwcGVuZENoaWxkKHRoaXMuZWxDYW52YXMpO1xuICAgICAgdGhpcy5lbFZpZXcudGFiSW5kZXggPSAwO1xuICAgICAgdGhpcy5hZGRFdmVudCgpO1xuICAgICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMuZHJvcEVuZC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgdGhpcy5kcmFnb3Zlci5iaW5kKHRoaXMpKVxuICAgIH1cbiAgfVxuICBwcml2YXRlIGRyb3BFbmQoZXY6IGFueSkge1xuICAgIGlmICghdGhpcy5lbENhbnZhcyB8fCAhdGhpcy5lbFZpZXcpIHJldHVybjtcbiAgICBpZiAoZXYudHlwZSA9PT0gXCJ0b3VjaGVuZFwiKSB7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgZGF0YSA9IGV2LmRhdGFUcmFuc2Zlci5nZXREYXRhKFwibm9kZVwiKTtcbiAgICB9XG4gICAgbGV0IG5vZGUgPSB0aGlzLkFkZE5vZGUoKTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChldi50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICBlX3Bvc194ID0gZXYudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgZV9wb3NfeSA9IGV2LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGV2LmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZXYuY2xpZW50WTtcbiAgICB9XG4gICAgZV9wb3NfeCA9IGVfcG9zX3ggKiAodGhpcy5lbFZpZXcuY2xpZW50V2lkdGggLyAodGhpcy5lbFZpZXcuY2xpZW50V2lkdGggKiB0aGlzLnpvb20pKSAtICh0aGlzLmVsVmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS54ICogKHRoaXMuZWxWaWV3LmNsaWVudFdpZHRoIC8gKHRoaXMuZWxWaWV3LmNsaWVudFdpZHRoICogdGhpcy56b29tKSkpO1xuICAgIGVfcG9zX3kgPSBlX3Bvc195ICogKHRoaXMuZWxWaWV3LmNsaWVudEhlaWdodCAvICh0aGlzLmVsVmlldy5jbGllbnRIZWlnaHQgKiB0aGlzLnpvb20pKSAtICh0aGlzLmVsVmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55ICogKHRoaXMuZWxWaWV3LmNsaWVudEhlaWdodCAvICh0aGlzLmVsVmlldy5jbGllbnRIZWlnaHQgKiB0aGlzLnpvb20pKSk7XG5cbiAgICBub2RlLnVwZGF0ZVBvc2l0aW9uKGVfcG9zX3gsIGVfcG9zX3kpO1xuICAgIGNvbnNvbGUubG9nKGV2KTtcbiAgfVxuICBwcml2YXRlIGRyYWdvdmVyKGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3ROb2RlKCkge1xuICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCkge1xuICAgICAgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9XG4gICAgdGhpcy5ub2RlU2VsZWN0ZWQgPSBudWxsO1xuICB9XG4gIHB1YmxpYyBTZWxlY3ROb2RlKG5vZGU6IE5vZGVGbG93KSB7XG4gICAgdGhpcy5VblNlbGVjdE5vZGUoKTtcbiAgICB0aGlzLm5vZGVTZWxlY3RlZCA9IG5vZGU7XG4gICAgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgfVxuICBwdWJsaWMgVW5TZWxlY3REb3QoKSB7XG4gICAgaWYgKHRoaXMuZG90U2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMuZG90U2VsZWN0ZWQuZWxOb2RlPy5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICB9XG4gICAgdGhpcy5kb3RTZWxlY3RlZCA9IG51bGw7XG4gIH1cbiAgcHVibGljIFNlbGVjdERvdChub2RlOiBOb2RlRmxvdykge1xuICAgIHRoaXMuVW5TZWxlY3REb3QoKTtcbiAgICB0aGlzLmRvdFNlbGVjdGVkID0gbm9kZTtcbiAgICB0aGlzLmRvdFNlbGVjdGVkLmVsTm9kZT8uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gIH1cbiAgcHVibGljIEFkZE5vZGUoKTogTm9kZUZsb3cge1xuICAgIGxldCBub2RlID0gbmV3IE5vZGVGbG93KHRoaXMsIHRoaXMucGFyZW50LmdldFV1aWQoKSk7XG4gICAgdGhpcy5ub2RlcyA9IFsuLi50aGlzLm5vZGVzLCBub2RlXTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBwdWJsaWMgYWRkRXZlbnQoKSB7XG4gICAgaWYgKCF0aGlzLmVsVmlldykgcmV0dXJuO1xuICAgIC8qIE1vdXNlIGFuZCBUb3VjaCBBY3Rpb25zICovXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuRW5kTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLlN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5FbmRNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWxWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMuTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsVmlldy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5TdGFydE1vdmUuYmluZCh0aGlzKSk7XG4gICAgLyogQ29udGV4dCBNZW51ICovXG4gICAgdGhpcy5lbFZpZXcuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLmNvbnRleHRtZW51LmJpbmQodGhpcykpO1xuICB9XG5cbiAgcHVibGljIFN0YXJ0TW92ZShlOiBhbnkpIHtcbiAgICBjb25zb2xlLmxvZyhlKTtcbiAgICBpZiAodGhpcy5ub2RlU2VsZWN0ZWQgJiYgKHRoaXMubm9kZVNlbGVjdGVkLmVsTm9kZSAhPT0gZS50YXJnZXQgJiYgdGhpcy5ub2RlU2VsZWN0ZWQuZWxOb2RlICE9PSBlLnRhcmdldC5wYXJlbnRzKCcud29ya2VyZmxvdy1ub2RlJykpKSB7XG4gICAgICB0aGlzLlVuU2VsZWN0Tm9kZSgpO1xuICAgIH1cbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNoc3RhcnRcIikge1xuICAgICAgdGhpcy5wb3NfeCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeF9zdGFydCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICAgICAgdGhpcy5wb3NfeV9zdGFydCA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBvc194ID0gZS5jbGllbnRYO1xuICAgICAgdGhpcy5wb3NfeF9zdGFydCA9IGUuY2xpZW50WDtcbiAgICAgIHRoaXMucG9zX3kgPSBlLmNsaWVudFk7XG4gICAgICB0aGlzLnBvc195X3N0YXJ0ID0gZS5jbGllbnRZO1xuICAgIH1cbiAgICB0aGlzLmZsZ0RyYXAgPSB0cnVlO1xuICAgIHRoaXMuZmxnRHJhcE1vdmUgPSBmYWxzZTtcbiAgfVxuICBwdWJsaWMgTW92ZShlOiBhbnkpIHtcbiAgICBpZiAoIXRoaXMuZmxnRHJhcCkgcmV0dXJuO1xuICAgIGlmICghdGhpcy5lbENhbnZhcyB8fCAhdGhpcy5lbFZpZXcpIHJldHVybjtcbiAgICB0aGlzLmZsZ0RyYXBNb3ZlID0gdHJ1ZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2htb3ZlXCIpIHtcbiAgICAgIGVfcG9zX3ggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgZV9wb3NfeCA9IGUuY2xpZW50WDtcbiAgICAgIGVfcG9zX3kgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIGlmICh0aGlzLm5vZGVTZWxlY3RlZCkge1xuICAgICAgbGV0IHggPSAodGhpcy5wb3NfeCAtIGVfcG9zX3gpICogdGhpcy5lbENhbnZhcy5jbGllbnRXaWR0aCAvICh0aGlzLmVsQ2FudmFzLmNsaWVudFdpZHRoICogdGhpcy56b29tKTtcbiAgICAgIGxldCB5ID0gKHRoaXMucG9zX3kgLSBlX3Bvc195KSAqIHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0IC8gKHRoaXMuZWxDYW52YXMuY2xpZW50SGVpZ2h0ICogdGhpcy56b29tKTtcbiAgICAgIHRoaXMucG9zX3ggPSBlX3Bvc194O1xuICAgICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gICAgICB0aGlzLm5vZGVTZWxlY3RlZC51cGRhdGVQb3NpdGlvbih4LCB5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHggPSB0aGlzLmNhbnZhc194ICsgKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKVxuICAgICAgbGV0IHkgPSB0aGlzLmNhbnZhc195ICsgKC0odGhpcy5wb3NfeSAtIGVfcG9zX3kpKVxuICAgICAgdGhpcy5lbENhbnZhcy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHggKyBcInB4LCBcIiArIHkgKyBcInB4KSBzY2FsZShcIiArIHRoaXMuem9vbSArIFwiKVwiO1xuICAgIH1cbiAgICBpZiAoZS50eXBlID09PSBcInRvdWNobW92ZVwiKSB7XG4gICAgICB0aGlzLm1vdXNlX3ggPSBlX3Bvc194O1xuICAgICAgdGhpcy5tb3VzZV95ID0gZV9wb3NfeTtcbiAgICB9XG4gIH1cbiAgcHVibGljIEVuZE1vdmUoZTogYW55KSB7XG4gICAgaWYgKHRoaXMuZmxnRHJhcE1vdmUpIHtcbiAgICAgIHRoaXMuVW5TZWxlY3ROb2RlKCk7XG4gICAgfVxuICAgIHRoaXMuZmxnRHJhcE1vdmUgPSBmYWxzZTtcbiAgICB0aGlzLmZsZ0RyYXAgPSBmYWxzZTtcbiAgICBsZXQgZV9wb3NfeCA9IDA7XG4gICAgbGV0IGVfcG9zX3kgPSAwO1xuICAgIGlmIChlLnR5cGUgPT09IFwidG91Y2hlbmRcIikge1xuICAgICAgZV9wb3NfeCA9IHRoaXMubW91c2VfeDtcbiAgICAgIGVfcG9zX3kgPSB0aGlzLm1vdXNlX3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVfcG9zX3ggPSBlLmNsaWVudFg7XG4gICAgICBlX3Bvc195ID0gZS5jbGllbnRZO1xuICAgIH1cblxuICAgIHRoaXMuY2FudmFzX3ggPSB0aGlzLmNhbnZhc194ICsgKC0odGhpcy5wb3NfeCAtIGVfcG9zX3gpKTtcbiAgICB0aGlzLmNhbnZhc195ID0gdGhpcy5jYW52YXNfeSArICgtKHRoaXMucG9zX3kgLSBlX3Bvc195KSk7XG4gICAgdGhpcy5wb3NfeCA9IGVfcG9zX3g7XG4gICAgdGhpcy5wb3NfeSA9IGVfcG9zX3k7XG4gIH1cbiAgcHVibGljIGNvbnRleHRtZW51KGU6IGFueSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgQ29udHJvbEZsb3cgfSBmcm9tIFwiLi9jb21wb25lbnRzL0NvbnRyb2xGbG93XCI7XG5pbXBvcnQgeyBWaWV3RmxvdyB9IGZyb20gXCIuL2NvbXBvbmVudHMvVmlld0Zsb3dcIjtcblxuZXhwb3J0IGNsYXNzIFdvcmtlckZsb3cge1xuXG4gIHB1YmxpYyBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgcHVibGljIFZpZXc6IFZpZXdGbG93IHwgbnVsbDtcbiAgcHVibGljIENvbnRyb2w6IENvbnRyb2xGbG93IHwgbnVsbDtcbiAgcHVibGljIGRhdGFOb2RlU2VsZWN0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IHt9O1xuICBwdWJsaWMgb3B0aW9uOiBhbnk7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBvcHRpb246IGFueSA9IG51bGwpIHtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwid29ya2VyZmxvd1wiKTtcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbiB8fCB7XG4gICAgICBjb250cm9sOiB7XG4gICAgICAgIE5vZGUxOiB7XG4gICAgICAgICAgbmFtZTogJzxpIGNsYXNzPVwiZmFiIGZhLWF3c1wiPjwvaT48c3Bhbj4gQVdTPC9zcGFuPicsXG4gICAgICAgICAgaHRtbDogXCI8ZGl2PlhpbiBjaMOgbzwvZGl2PlwiLFxuICAgICAgICB9LFxuICAgICAgICBOb2RlMjoge1xuICAgICAgICAgIG5hbWU6IFwiTm9kZTJcIixcbiAgICAgICAgICBodG1sOiBcIjxkaXY+WGluIGNow6BvPC9kaXY+XCIsXG4gICAgICAgIH0sXG4gICAgICAgIE5vZGUzOiB7XG4gICAgICAgICAgbmFtZTogXCJOb2RlM1wiLFxuICAgICAgICAgIGh0bWw6IFwiPGRpdj5YaW4gY2jDoG88L2Rpdj5cIixcbiAgICAgICAgfSxcbiAgICAgICAgTm9kZTQ6IHtcbiAgICAgICAgICBuYW1lOiBcIk5vZGU0XCIsXG4gICAgICAgICAgaHRtbDogXCI8ZGl2PlhpbiBjaMOgbzwvZGl2PlwiLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBgXG4gICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbFwiPlxuICAgICAgPGgyIGNsYXNzPVwid29ya2VyZmxvdy1jb250cm9sX19oZWFkZXJcIj5Ob2RlIENvbnRyb2w8L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cIndvcmtlcmZsb3ctY29udHJvbF9fbGlzdFwiPlxuICAgICAgPGRpdiBkcmFnZ2FibGU9XCJ0cnVlXCI+Tm9kZSAxPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwid29ya2VyZmxvdy1kZXNnaW5cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1zXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1cIj5UaMO0bmcgdGluIG3hu5tpPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LWl0ZW1cIj5UaMO0bmcgdGluIG3hu5tpMTIzPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ3b3JrZXJmbG93LXZpZXdcIj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIGA7XG4gICAgdGhpcy5WaWV3ID0gbmV3IFZpZXdGbG93KHRoaXMpO1xuICAgIHRoaXMuQ29udHJvbCA9IG5ldyBDb250cm9sRmxvdyh0aGlzKTtcbiAgfVxuICBwdWJsaWMgZ2V0VXVpZCgpOiBzdHJpbmcge1xuICAgIC8vIGh0dHA6Ly93d3cuaWV0Zi5vcmcvcmZjL3JmYzQxMjIudHh0XG4gICAgbGV0IHM6IGFueSA9IFtdO1xuICAgIGxldCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM2OyBpKyspIHtcbiAgICAgIHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTApLCAxKTtcbiAgICB9XG4gICAgc1sxNF0gPSBcIjRcIjsgIC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxuICAgIHNbMTldID0gaGV4RGlnaXRzLnN1YnN0cigoc1sxOV0gJiAweDMpIHwgMHg4LCAxKTsgIC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG4gICAgc1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXG4gICAgbGV0IHV1aWQgPSBzLmpvaW4oXCJcIik7XG4gICAgcmV0dXJuIHV1aWQ7XG4gIH1cbiAgLyogRXZlbnRzICovXG4gIG9uKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgY2FsbGJhY2sgaXMgbm90IGEgZnVuY3Rpb25cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgbGlzdGVuZXIgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBjYWxsYmFja31gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGV2ZW50IGlzIG5vdCBhIHN0cmluZ1xuICAgIGlmICh0eXBlb2YgZXZlbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGUgZXZlbnQgbmFtZSBtdXN0IGJlIGEgc3RyaW5nLCB0aGUgZ2l2ZW4gdHlwZSBpcyAke3R5cGVvZiBldmVudH1gKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhpcyBldmVudCBub3QgZXhpc3RzXG4gICAgaWYgKHRoaXMuZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB7XG4gICAgICAgIGxpc3RlbmVyczogW11cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5ldmVudHNbZXZlbnRdLmxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50OiBzdHJpbmcsIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcblxuICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnRdKSByZXR1cm4gZmFsc2VcblxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnNcbiAgICBjb25zdCBsaXN0ZW5lckluZGV4ID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spXG4gICAgY29uc3QgaGFzTGlzdGVuZXIgPSBsaXN0ZW5lckluZGV4ID4gLTFcbiAgICBpZiAoaGFzTGlzdGVuZXIpIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSlcbiAgfVxuXG4gIGRpc3BhdGNoKGV2ZW50OiBzdHJpbmcsIGRldGFpbHM6IGFueSkge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAvLyBDaGVjayBpZiB0aGlzIGV2ZW50IG5vdCBleGlzdHNcbiAgICBpZiAodGhpcy5ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIGNvbnNvbGUuZXJyb3IoYFRoaXMgZXZlbnQ6ICR7ZXZlbnR9IGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZXZlbnRzW2V2ZW50XS5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXI6IGFueSkgPT4ge1xuICAgICAgbGlzdGVuZXIoZGV0YWlscywgc2VsZik7XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztNQUVhLFdBQVcsQ0FBQTtBQUNkLElBQUEsU0FBUyxDQUFpQztBQUMxQyxJQUFBLE1BQU0sQ0FBYTtBQUMzQixJQUFBLFdBQUEsQ0FBbUIsTUFBa0IsRUFBQTtBQUNuQyxRQUFBLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUM5RSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDbEIsWUFBQSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDOUIsWUFBQSxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDOUMsWUFBQSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRztnQkFDakIsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6QyxnQkFBQSxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN2QyxnQkFBQSxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNwQyxnQkFBQSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcs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
