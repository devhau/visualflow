import { Node } from "./Node";

export class Line {
  public elNode: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', "svg");
  public elPath: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', "path");
  private curvature: number = 0.5;
  public constructor(public from: Node, public fromIndex: number = 0, public to: Node | undefined = undefined, public toIndex: number = 0) {
    this.elPath.classList.add("main-path");
    this.elPath.addEventListener('mousedown', this.StartSelected.bind(this));
    this.elPath.addEventListener('touchstart', this.StartSelected.bind(this));
    this.elPath.setAttributeNS(null, 'd', '');
    this.elNode.classList.add("connection");
    this.elNode.appendChild(this.elPath);
    this.from.parent.elCanvas.appendChild(this.elNode);
    this.from.AddLine(this);
    this.to?.AddLine(this);
  }
  public updateTo(to_x: number, to_y: number) {
    if (!this.from || this.from.elNode == null) return;
    let { x: from_x, y: from_y }: any = this.from.getPostisionDot(this.fromIndex);
    var lineCurve = this.createCurvature(from_x, from_y, to_x, to_y, this.curvature, 'openclose');
    this.elPath.setAttributeNS(null, 'd', lineCurve);
  }
  public UpdateUI(): Line {
    //Postion output
    if (this.to && this.to.elNode) {
      let { x: to_x, y: to_y }: any = this.to.getPostisionDot(this.toIndex);
      this.updateTo(to_x, to_y);
    }
    return this;
  }
  public Active(flg: any = true) {
    if (flg) {
      this.elPath.classList.add('active');
    } else {
      this.elPath.classList.remove('active');
    }
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
    if (this.from != nodeThis)
      this.from.RemoveLine(this);
    if (this.to != nodeThis)
      this.to?.RemoveLine(this);
    this.elNode?.remove();
  }
  public StartSelected(e: any) {
    this.from.parent.setLineChoose(this)
  }
  public setNodeTo(node: Node | undefined, toIndex: number) {
    this.to = node;
    this.toIndex = toIndex;
  }
  public Clone() {
    if (this.to && this.toIndex) {
      return new Line(this.from, this.fromIndex, this.to, this.toIndex).UpdateUI();
    }
  }
}
