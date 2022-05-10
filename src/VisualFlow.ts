import { IMain } from './core/BaseFlow';
import { DockManager } from './dock/DockManager';
import { SystemBase } from './systems/SystemBase';
export class VisualFlow {
  private main: IMain | undefined;
  private $dockManager: DockManager;
  public getDockManager(): DockManager {
    return this.$dockManager;
  }
  public setOption(data: any) {
    this.main?.initOption(data);
    this.$dockManager.reset();
  }
  public constructor(private container: HTMLElement, main: IMain | undefined = undefined) {
    this.main = main ?? new SystemBase();
    this.container.classList.remove('vs-container');
    this.container.classList.add('vs-container');
    this.$dockManager = new DockManager(this.container, this.main);
    this.$dockManager.reset();
  }
  onSafe(event: string, callback: any) {
    this.main?.onSafe(event, callback);
  }
  on(event: string, callback: any) {
    this.main?.on(event, callback);
  }
  removeListener(event: string, callback: any) {
    this.main?.removeListener(event, callback);
  }
  dispatch(event: string, details: any) {
    this.main?.dispatch(event, details);
  }
  public getMain(): IMain | undefined {
    return this.main;
  }
}
