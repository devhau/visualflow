import { NodeItem } from "../desginer/index";
import { SystemBase } from "./SystemBase";
export class SystemVue extends SystemBase {
  public constructor(private render: any) {
    super();
  }
  renderHtml({ elNode, main, node }: any) {
    if (parseInt(this.render.version) === 3) {
      //Vue 3
      let wrapper = this.render.h(node.getOption()?.html, { ...(node.getOption()?.props ?? {}), node }, (node.getOption()?.options ?? {}));
      wrapper.appContext = elNode;
      this.render.render(wrapper, elNode);

    } else {
      // Vue 2
      let wrapper = new this.render({
        parent: elNode,
        render: (h: any) => h(node.getOption()?.html, { props: { ...(node.getOption()?.props ?? {}), node } }),
        ...(node.getOption()?.options ?? {})
      }).$mount()
      //
      elNode.appendChild(wrapper.$el);
    }
  }
}
