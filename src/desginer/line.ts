import { Node } from "./node";
import { DesginerView } from "./view";

export class Line {
  public constructor(private parent: DesginerView, public from: Node, public to: Node | null = null, public fromIndex: number = 0, public toIndex: number = 0) { }
}
