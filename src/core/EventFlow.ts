import { IEvent } from "./IFlow";

export class EventFlow implements IEvent {
  private events: any = {};
  public constructor() {
  }
  public onSafe(event: string, callback: any) {
    this.removeListener(event, callback);
    this.on(event, callback);
  }
  /* Events */
  public on(event: string, callback: any) {
    // Check if the callback is not a function
    if (typeof callback !== 'function') {
      console.error(`The listener callback must be a function, the given type is ${typeof callback}`);
      return false;
    }
    // Check if the event is not a string
    if (typeof event !== 'string') {
      console.error(`The event name must be a string, the given type is ${typeof event}`);
      return false;
    }
    // Check if this event not exists
    if (this.events[event] === undefined) {
      this.events[event] = {
        listeners: []
      }
    }
    this.events[event].listeners.push(callback);
  }

  public removeListener(event: string, callback: any) {
    // Check if this event not exists

    if (!this.events[event]) return false

    const listeners = this.events[event].listeners
    const listenerIndex = listeners.indexOf(callback)
    const hasListener = listenerIndex > -1
    if (hasListener) listeners.splice(listenerIndex, 1)
  }

  public dispatch(event: string, details: any) {
    // Check if this event not exists
    if (this.events[event] === undefined) {
      return false;
    }
    this.events[event].listeners.forEach((listener: any) => {
      listener(details);
    });
  }
}
