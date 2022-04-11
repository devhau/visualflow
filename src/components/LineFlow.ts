import { NodeFlow } from "./NodeFlow";

export class LineFlow {
  private elConnection: any;
  private elPath: any;
  private curvature = 0.5;
  public constructor(public fromNode: NodeFlow, public toNode: NodeFlow) {
    this.elConnection = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    this.elPath = document.createElementNS('http://www.w3.org/2000/svg', "path");
    this.elPath.classList.add("main-path");
    this.elPath.setAttributeNS(null, 'd', '');
    this.elConnection.classList.add("connection");
    this.elConnection.appendChild(this.elPath);
    this.fromNode.parent.elCanvas?.appendChild(this.elConnection);
    this.fromNode.AddLine(this);
    this.toNode.AddLine(this);
  }
  private createCurvature(start_pos_x: number, start_pos_y: number, end_pos_x: number, end_pos_y: number, curvature_value: number, type: string) {
    let line_x = start_pos_x;
    let line_y = start_pos_y;
    let x = end_pos_x;
    let y = end_pos_y;
    let curvature = curvature_value;
    //type openclose open close other
    switch (type) {
      case 'open':
        if (start_pos_x >= end_pos_x) {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * (curvature * -1);
        } else {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;

        break
      case 'close':
        if (start_pos_x >= end_pos_x) {
          var hx1 = line_x + Math.abs(x - line_x) * (curvature * -1);
          var hx2 = x - Math.abs(x - line_x) * curvature;
        } else {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;
        break;
      case 'other':
        if (start_pos_x >= end_pos_x) {
          var hx1 = line_x + Math.abs(x - line_x) * (curvature * -1);
          var hx2 = x - Math.abs(x - line_x) * (curvature * -1);
        } else {
          var hx1 = line_x + Math.abs(x - line_x) * curvature;
          var hx2 = x - Math.abs(x - line_x) * curvature;
        }
        return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;
        break;
      default:

        var hx1 = line_x + Math.abs(x - line_x) * curvature;
        var hx2 = x - Math.abs(x - line_x) * curvature;

        return ' M ' + line_x + ' ' + line_y + ' C ' + hx1 + ' ' + line_y + ' ' + hx2 + ' ' + y + ' ' + x + '  ' + y;
    }
  }
  public updateTo(to_x: number, to_y: number) {
    let from_x = this.fromNode.pos_x + this.fromNode.elNode.clientWidth + 5;
    let from_y = this.fromNode.pos_y + this.fromNode.elNode.clientHeight / 2;
    var lineCurve = this.createCurvature(from_x, from_y, to_x, to_y, this.curvature, 'openclose');
    this.elPath.setAttributeNS(null, 'd', lineCurve);
  }
  public update() {
    //Postion output
    let to_x = this.toNode.pos_x - 5;
    let to_y = this.toNode.pos_y + this.toNode.elNode.clientHeight / 2;
    this.updateTo(to_x, to_y);
  }
}
