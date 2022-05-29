export class WorkerScript {
  private runCodeInBrowser(script: string, variableObj: any) {
    return window.eval(this.GetTextInBrowser(script, variableObj));
  }
  private GetTextInBrowser(script: string, variableObj: any) {
    let paramText = "";
    let paramValue: any = [];
    if (!variableObj) variableObj = {};
    for (let key of Object.keys(variableObj)) {
      if (paramText != "") {
        paramText = `${paramText},${key}`;
      } else {
        paramText = key;
      }
      paramValue = [...paramValue, variableObj[key]];
    }
    return window.eval('((' + paramText + ')=>(`' + script + '`))')(...paramValue)
  }
  private GetTextInNode(script: string, variableObj: any) {
    return "";
  }
  private runCodeInNode(script: string, variableObj: any) {
    const { VM } = require('vm2');
    const vm = new VM();
    return vm.runInContext(script, variableObj);
  }
  public runCode(script: string, variableObj: any) {
    if (window != undefined && document != undefined) {
      return this.runCodeInBrowser(script, variableObj);
    } else {
      return this.runCodeInNode(script, variableObj);
    }
  }
  public getText(script: string, variableObj: any) {
    if (window != undefined && document != undefined) {
      return this.GetTextInBrowser(script, variableObj);
    } else {
      return this.GetTextInNode(script, variableObj);
    }
  }
}
