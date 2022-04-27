import { IControlNode } from './../core/BaseFlow';
export class VisualStudio implements IControlNode {
  private $properties: any = {};
  private $control: any = {};
  public constructor(container: HTMLElement, option: any = null) {
    //set project
    this.$properties['project'] = {
      ...(option?.properties || {}),
      name: {
        defautl: ""
      },
      x: {
        defautl: 0
      },
      y: {
        default: 0
      },
      zoom: {
        default: 0
      }
    };
    // set control
    this.$control = option?.control || {};
    Object.keys(this.$control).forEach((key: string) => {
      this.$properties[`node_${key}`] = {
        ...(this.$control[key].properties || {}),
        key: {
          defautl: key
        },
        name: {
          defautl: ""
        },
        x: {
          defautl: 0
        },
        y: {
          default: 0
        },
      };
    });

  }
  getControlNodeByKey(key: string) {
    return {
      ...this.$control[key],
      properties: this.getPropertyByKey(key)
    }
  }
  getPropertyByKey(key: string) {
    return this.$properties[key];
  }
}
