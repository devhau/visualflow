import { NodeItem } from "../desginer/index";
import { SystemBase } from "./SystemBase";
export class SystemVue extends SystemBase {
  public constructor(private render: any) {
    super();
  }
  renderHtml(node: NodeItem, elParent: Element) {
    if (parseInt(this.render.version) === 3) {
      //Vue 3
      let wrapper = this.render.h(node.getOption()?.html, { ...(node.getOption()?.props ?? {}), node }, (node.getOption()?.options ?? {}));
      wrapper.appContext = elParent;
      this.render.render(wrapper, elParent);

    } else {
      // Vue 2
      let wrapper = new this.render({
        parent: elParent,
        render: (h: any) => h(node.getOption()?.html, { props: { ...(node.getOption()?.props ?? {}), node } }),
        ...(node.getOption()?.options ?? {})
      }).$mount()
      //
      elParent.appendChild(wrapper.$el);
    }
  }
}
