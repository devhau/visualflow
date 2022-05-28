const { workerManager } = require('../');
const data = { "id": 1653670870128, "key": "main_solution", "name": "", "project": 1653670870129, "projects": [{ "id": 1653670870129, "name": "Flow 1", "key": "main_project", "variable": [], "groups": [{ "key": "main_groupCavas", "group": "root", "x": 0, "y": 0, "zoom": 1 }], "nodes": [{ "id": 1653670873011, "key": "node_CoreBeginNode", "name": "Begin", "x": 184.8571319580078, "y": 52, "group": "root", "lines": [{ "key": "main_line", "from": 1653670873011, "fromIndex": "4000", "to": 1653670875761, "toIndex": "1000" }] }, { "id": 1653670875761, "key": "node_end", "name": "End", "x": 613.8571319580078, "y": 170, "group": "root", "lines": [] }] }] };

(() => {
  console.log(workerManager.getControlNodes());
  workerManager.LoadData(data)
  workerManager.excute();
})();
