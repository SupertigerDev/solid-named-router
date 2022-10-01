<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-named-router&background=tiles&project=%20" alt="solid-named-router">
</p>

# Solid Named Router

A third party router library for solidjs. Includes named routes inspired by vuejs.   
This router relies on the [route-parser](https://www.npmjs.com/package/route-parser) package.   
Note: this library is not complete. Please contribute and submit a PR to improve this library 💖

## Quick start

Install it:

```bash
npm i solid-named-router
```

Wrap your root component with the Router component:

```tsx
import { render } from "solid-js/web";
import { createRouter } from "solid-named-router";
import App from "./App";

const Router = createRouter({
  routes: [
    {
      name: 'Home',
      path: '/',
      element: () => <div>Home</div>
    },
  ]
});

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  document.getElementById("app")
);
```

Now add the `RouterView` component to display the current route.
```tsx
import {RouterView, Link} from "solid-named-router";

const App = () => {
  return (
    <>
      <RouterView/>
    </>
  );
};
```

## Methods & Hooks
### Link
```tsx
<Link to={{name: 'users', params: {}}}>User</Link>
<Link to='app/users/1234'>User</Link>
```
### navigate
```ts
navigate({name: 'users', params: {}})
navigate('app/users/1234')
```

### useNamedRoute
```ts
const namedRoute = useNamedRoute(); // -> {name, params};

<div>
  <div>name: {namedRoute()?.name}</div>
  <div>params: {namedRoute()?.params.userId}</div>
</div>
```