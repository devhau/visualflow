# Visual Flow Creator

demo: https://devhau.github.io/visualflow/

```
npm i visualflow
```

https://www.npmjs.com/package/visualflow

https://github.com/devhau/visualflow

```
  let optionFlow = {
    properties: {
      name: {
        default: ""
      },
    },
    control: {
      node_note: {
        icon: '<i class="fas fa-comment-alt"></i>',
        name: 'Note',
        html: '<div><textarea node:model="note"></textarea></div>',
        properties: {
          note: {
            key: "note",
            default: ""
          }
        }
      }
    }
  }
  let flow = (new visualflow.VisualFlow(document.getElementById("flow")));
  flow.setOption(optionFlow);
  flow.newProject();
```
