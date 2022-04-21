import { NodeFlow } from "./NodeFlow";
import { ViewFlow } from "./ViewFlow";

export class LineFlow {
  public elConnection: SVGElement | null;
  public elPath: SVGPathElement;
  private curvature: number = 0.5;
  public constructor(private parent: ViewFlow, public fromNode: NodeFlow, public toNode: NodeFlow | null = null, public outputIndex: number = 0) {
    this.elConnection = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    this.elPath = document.createElementNS('http://www.w3.org/2000/svg', "path");
    this.elPath.classList.add("main-path");
    this.elPath.addEventListener('mousedown', this.StartSelected.bind(this));
    this.elPath.addEventListener('touchstart', this.StartSelected.bind(this));
    this.elPath.setAttributeNS(null, 'd', '');
    this.elConnection.classList.add("connection");
    this.elConnection.appendChild(this.elPath);
    this.parent.elCanvas?.appendChild(this.elConnection);
    this.fromNode.AddLine(this);
    this.toNode?.AddLine(this);
    this.update();
  }
  public StartSelected(e: any) {
    this.parent.SelectLine(this);
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
  public delete(nodeThis: any = null) {
    this.elPath?.removeEventListener('mousedown', this.StartSelected.bind(this));
    this.elPath?.removeEventListener('touchstart', this.StartSelected.bind(this));
    if (this.fromNode != nodeThis)
      this.fromNode.RemoveLine(this);
    if (this.toNode != nodeThis)
      this.toNode?.RemoveLine(this);
    this.elConnection?.remove();
    this.elConnection = null;
  }
  public updateTo(to_x: number, to_y: number) {
    if (this.fromNode.elNode == null) return;
    let from_x = this.fromNode.getX() + this.fromNode.elNode.clientWidth + 5;
    let from_y = this.fromNode.getY() + (this.fromNode.output() > 1 ? (((this.outputIndex - 1) * 21) + 15) : (2 + this.fromNode.elNode.clientHeight / 2));
    var lineCurve = this.createCurvature(from_x, from_y, to_x, to_y, this.curvature, 'openclose');
    this.elPath.setAttributeNS(null, 'd', lineCurve);
  }
  public update() {
    //Postion output
    if (this.toNode && this.toNode.elNode) {
      let to_x = this.toNode.getX() - 5;
      let to_y = this.toNode.getY() + this.toNode.elNode.clientHeight / 2;
      this.updateTo(to_x, to_y);
    }

  }
}
