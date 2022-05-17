import { VisualFlow } from "./VisualFlow";
import * as SystemBase from "./systems/index";
import * as Core from './core/index';
import * as Desginer from "./desginer/index";
import * as Dock from './dock/index';
export default {
  VisualFlow,
  ...SystemBase,
  ...Core,
  ...Dock,
  ...Desginer
};

