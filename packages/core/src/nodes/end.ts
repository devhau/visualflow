import { WorkerNode } from "../worker/node";

export class CoreEndNode extends WorkerNode {
  key(): string {
    return "core_end";
  }
  name() {
    return "End";
  }
  icon(): string {
    return '<i class="fas fa-stop"></i>';
  }
  option() {
    return {
      onlyNode: true,
      sort: 0,
      dot: {
        left: 1,
        top: 0,
        right: 0,
        bottom: 0,
      }
    };
  }

}
