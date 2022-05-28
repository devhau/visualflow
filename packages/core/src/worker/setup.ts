import { WorkerNode } from "./node";

export class WorkerSetup {
  nodes(): any[] {
    return [];
  }
  newNodes(): WorkerNode[] {
    return this.nodes().map((item) => (new item()))
  }
}
