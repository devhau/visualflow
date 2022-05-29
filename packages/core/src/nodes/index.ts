import { WorkerSetup } from "../worker/setup";
import { CoreAlertNode } from "./alert";
import { CoreAssignNode } from "./assign";
import { CoreBeginNode } from "./begin";
import { CoreConsoleNode } from "./console";
import { CoreDelayNode } from "./delay";
import { CoreEndNode } from "./end";
import { CoreForNode } from "./for";
import { CoreGroupNode } from "./group";
import { CoreIfNode } from "./if";
import { CoreProjectNode } from "./project";
import { CoreSwitchNode } from "./switch";

export class CoreSetup extends WorkerSetup {
  nodes(): any[] {
    return [
      CoreBeginNode,
      CoreEndNode,
      CoreAssignNode,
      CoreDelayNode,
      CoreIfNode,
      CoreSwitchNode,
      CoreForNode,
      CoreAlertNode,
      CoreConsoleNode,
      CoreProjectNode,
      CoreGroupNode,
    ];
  }
}
