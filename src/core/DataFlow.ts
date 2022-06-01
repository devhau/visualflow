import { IProperty } from "./IFlow";
import { EventEnum } from "./Constant";
import { EventFlow } from "./EventFlow";
import { isFunction } from "./Utils";

export class DataFlow {
  private data: any = {};
  private properties: any = null;
  private events: EventFlow;
  public getProperties(): any {
    return this.properties;
  }
  onSafe(event: string, callback: any) {
    this.events.onSafe(event, callback);
  }
  on(event: string, callback: any) {
    this.events.on(event, callback);
  }
  removeListener(event: string, callback: any) {
    this.events.removeListener(event, callback);
  }
  dispatch(event: string, details: any) {
    this.events.dispatch(event, details);
  }
  public constructor(private property: IProperty | undefined = undefined, data: any = undefined) {
    this.events = new EventFlow();
    if (data) {
      this.load(data);
    }
  }
  public InitData(data: any = null, properties: any = -1) {
    if (properties !== -1) {
      this.properties = properties;
    }
    this.load(data);
  }
  private eventDataChange(key: string, keyChild: string, valueChild: any, senderChild: any, index: number | undefined = undefined) {
    if (index) {
      this.dispatch(`${EventEnum.dataChange}_${key}_${index}_${keyChild}`, {
        key, keyChild, value: valueChild, sender: senderChild, index
      });
      this.dispatch(`${EventEnum.dataChange}_${key}_${index}`, {
        key, keyChild, value: valueChild, sender: senderChild, index
      });
    } else {
      this.dispatch(`${EventEnum.dataChange}_${key}_${keyChild}`, {
        key, keyChild, value: valueChild, sender: senderChild
      });
    }
    this.dispatch(`${EventEnum.dataChange}_${key}`, {
      key, keyChild, value: valueChild, sender: senderChild
    });
  }
  public RemoveEventData(item: DataFlow, key: string, index: number | undefined = undefined) {
    if (!item) return;
    item.removeListener(`${EventEnum.dataChange}`, ({ key: keyChild, value: valueChild, sender: senderChild }: any) => this.eventDataChange(key, keyChild, valueChild, senderChild, index));
  }
  public OnEventData(item: DataFlow, key: string, index: number | undefined = undefined) {
    if (!item) return;
    item.on(`${EventEnum.dataChange}`, ({ key: keyChild, value: valueChild, sender: senderChild }: any) => this.eventDataChange(key, keyChild, valueChild, senderChild, index));
  }
  private BindEvent(value: any, key: string) {
    if (!value) return;
    if (value instanceof DataFlow) {
      this.OnEventData(value as DataFlow, key);
    }
    if (Array.isArray(value) && (value as []).length > 0 && value[0] instanceof DataFlow) {
      (value as DataFlow[]).forEach((item: DataFlow, index: number) => this.OnEventData(item, key, index));
    }
  }
  public Set(key: string, value: any, sender: any = null, isDispatch: boolean = true) {
    if (this.data[key] != value) {
      if (this.data[key]) {
        if (this.data[key] instanceof DataFlow) {
          this.RemoveEventData((this.data[key] as DataFlow), key);
        }
        if (Array.isArray(this.data[key]) && (this.data[key] as []).length > 0 && this.data[key][0] instanceof DataFlow) {
          (this.data[key] as DataFlow[]).forEach((item: DataFlow, index: number) => this.RemoveEventData(item, key, index));
        }
      }
      this.BindEvent(value, key);
    }
    this.data[key] = value;
    if (isDispatch) {
      this.dispatch(`${EventEnum.dataChange}_${key}`, {
        key, value, sender
      });
      this.dispatch(EventEnum.dataChange, {
        key, value, sender
      });
      this.dispatch(EventEnum.change, {
        key, value, sender
      });
    }

  }
  public SetData(data: any, sender: any = null, isClearData = false) {

    if (isClearData) this.data = {};
    if (data instanceof DataFlow) {
      let $data: DataFlow = data as DataFlow;
      if (!this.property && $data.property) this.property = $data.property;
      if (this.properties) {
        for (let key of Object.keys(this.properties)) {
          this.Set(key, $data.Get(key), sender, false);
        }
      } else {
        for (let key of Object.keys($data.getProperties())) {
          this.Set(key, $data.Get(key), sender, false);
        }
      }
    }
    else {
      Object.keys(data).forEach(key => {
        this.Set(key, data[key], sender, false);
      });
    }

    this.dispatch(EventEnum.change, {
      data
    });
  }
  public Get(key: string) {
    return this.data[key];
  }
  public Increase(key: string, max: any = undefined) {
    if (!max || (max > this.data[key]))
      this.Set(key, ++this.data[key]);
  }
  public Decrease(key: string, min: any = undefined) {
    if (!min || (min < this.data[key]))
      this.Set(key, --this.data[key]);
  }
  public Append(key: string, value: any) {
    if (!this.data[key]) this.data[key] = [];
    this.data[key] = [...this.data[key], value];
    this.BindEvent(value, key);
  }
  public Remove(key: string, value: any) {
    this.data[key].indexOf(value);
    var index = this.data[key].indexOf(value);
    if (index > -1) {
      this.RemoveEventData(this.data[key][index], key);
      this.data[key].splice(index, 1);
    }
  }
  public load(data: any) {
    this.data = {};
    if (!this.properties) {
      this.properties = this.property?.getPropertyByKey(data.key);
    }
    if (this.properties) {
      const funcSetValue = (key: string, value: any) => {
        let valueSet = value;
        if (isFunction(value)) {
          valueSet = value();
        }
        if (Array.isArray(valueSet)) {
          valueSet = valueSet.map((item: any) => {
            if (item.key) {
              return new DataFlow(this.property, item);
            }
            return item;
          });
        } else if (valueSet?.key) {
          valueSet = new DataFlow(this.property, valueSet);
        }
        this.data[key] = valueSet;
        this.BindEvent(this.data[key], key);
      }
      for (let key of Object.keys(this.properties)) {
        const property = this.properties[key];
        if (property.sub && data) {
          for (let field of Object.keys(data)) {
            if (field.startsWith(key)) {
              funcSetValue(field, data?.[field] ?? this.properties[key]?.default);
            }
          }
        } else {
          funcSetValue(key, data?.[key] ?? this.properties[key]?.default);
        }
      }
    }
  }
  public toString() {
    return JSON.stringify(this.toJson());
  }
  public toJson() {
    let rs: any = {};
    if (!this.properties) {
      this.properties = this.property?.getPropertyByKey(this.data.key);
    }
    const setRS = (key: string) => {
      let valueRS = this.Get(key);
      if (valueRS instanceof DataFlow) {
        rs[key] = valueRS.toJson();
      } else if (Array.isArray(valueRS)) {
        rs[key] = valueRS.map((item: any) => {
          if (item instanceof DataFlow) {
            return item.toJson();
          }
          return item;
        })
      } else {
        rs[key] = valueRS;
      }
    }
    for (let key of Object.keys(this.properties)) {
      const property = this.properties[key];
      if (property.sub) {
        for (let field of Object.keys(this.data)) {
          if (field.startsWith(key)) {
            setRS(field);
          }
        }
      } else {
        setRS(key);
      }
    }
    return rs;
  }
  public delete() {
    this.events = new EventFlow();
    this.data = {};
  }
}
