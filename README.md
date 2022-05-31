# Visual Flow Creator

website: https://visualflow.cc/

demo: https://demo.visualflow.cc/

Workflow package:

- @visualflow/core (Done)
- @visualflow/web (Planning)
- @visualflow/pc (Planning)
- @visualflow/office (Planning)
- @visualflow/moblie (Planning)

Setup:

```
npm i visualflow
```

setup on browser

```

  let optionFlow = {
    properties: {
      name: {
        default: ""
      },
    },
    control: {}
  }
  visualflow_core.workerManager.getControlNodes().forEach((item) => {
    optionFlow.control[item.key] = item;
  })
  let flow = (new visualflow.VisualFlow(document.getElementById("flow")));
  flow.setOption(optionFlow, false);
  flow.newSolution();
  flow.callbackRunProject((data, callbackEnd) => {
    console.log(data);
    setTimeout(() => {
      visualflow_core.workerManager.LoadData(data).excute();
      callbackEnd?.();
    });
  })
  flow.callbackStopProject(() => {
    visualflow_core.workerManager.stop();
  })
  visualflow_core.workerManager.on('worker_end', () => {
    flow.setRunning(false);
  });
```
