# comp
**Currently tightly coupled to our stuff. Docs to be added.*

comp helps build our site. comp renders react pages using data from our content api as a command line application.
comp also exports a express middleware to develop sites locally, allowing production content to be proxied from a remote server.


## comp.generator()
Interactively generates pages and templates in setup. Performs a diff from the last generation, and only displays changed pages.

## comp.server()
Use as an express middleware.

```js
import { proxy as compProxy } from '@ussu/comp';

server.use(compProxy());
```

Serves content from the remote, acting like proxy. Base template is rendered locally.

