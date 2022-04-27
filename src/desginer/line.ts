import { Node } from "./Node";
import { DesginerView } from "./DesginerView";

export class Line {
  public constructor(public from: Node, public to: Node | null = null, public fromIndex: number = 0, public toIndex: number = 0) { }
  UpdateUI(elNode: Node | null = null) {
    if (this.from != elNode) this.from.UpdateUI();
    if (this.to && this.to != elNode) this.to.UpdateUI();
  }
}
