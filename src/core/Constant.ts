export const EventEnum = {
  init: "init",
  dataChange: "dataChange",
  showProperty: "showProperty",
  openProject: "openProject",
  change: "change",
  dispose: "dispose"
}

export const DockEnum = {
  left: "vs-left",
  top: "vs-top",
  view: "vs-view",
  bottom: "vs-bottom",
  right: "vs-right",
}

export const PropertyEnum = {
  main: "main_project"
};

export const compareSort = (a: any, b: any) => {
  if (a.sort < b.sort) {
    return -1;
  }
  if (a.sort > b.sort) {
    return 1;
  }
  return 0;
}
