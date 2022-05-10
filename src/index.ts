import { VisualFlow } from "./VisualFlow";
import { SystemBase } from "./systems/SystemBase";
import * as Core from './core/index';
import * as Desginer from "./desginer/index";
import * as Dock from './dock/index';
export default {
  VisualFlow,
  SystemBase,
  ...Core,
  ...Dock,
  ...Desginer
};

