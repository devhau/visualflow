# Visual Flow Creator

demo: https://devhau.github.io/visualflow/

npm i visualflow

```
 let optionFlow = {
    properties: {
      name: {
        default: ""
      },
      x: {
        default: 0
      },
      y: {
        default: 0
      },
      zoom: {
        default: 0
      }
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
  let flow = (new visualflow(document.getElementById("flow"), optionFlow));
```
