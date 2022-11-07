<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-named-router&background=tiles&project=%20" alt="solid-named-router">
</p>

# Solid Named Router

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

A third party router library for solidjs. Includes named routes inspired by vuejs.   
This router relies on the [route-parser](https://github.com/Unnamed-Chat-App/route-parser) package.   
Note: This library is not complete. Please contribute and submit PRs to improve this library 💖

## What this fork changes
* Added `end` option to `useMatch` method.

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
    {
      name: 'Users',
      path: '/users/:userId',
      element: () => <div>Users</div>
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
<Link to={{name: 'Users', params: {userId: 1234}, query: {hideInfo: "1"}}}>User</Link>
<Link to='app/users/1234'>User</Link>
```
### navigate
```ts
navigate({name: 'Users', params: {userId: 1234}, query: {hideInfo: "1"}})
navigate('app/users/1234')
```

### useNamedRoute
```ts
const namedRoute = useNamedRoute(); // -> {name, params, pathname, query};

<div>
  <div>name: {namedRoute.name}</div>
  <div>params: {namedRoute.params.userId}</div>
  <div>params: {namedRoute.pathname}</div>
</div>
```
### useParams
```ts
const params = useParams(); // -> {userId};

<div>
  <div>name: {params.userId}</div>
</div>
```

### Outlet Example
```tsx

const Router = createRouter({
  routes: [
    {
      name: 'Users',
      path: '/users/:userId',
      elements: {
        drawer: () => <div>Drawer Here</div>,
        content: () => <div>Content Here</div>
      },
      element: () => (
        <div>
          <Outlet name="drawer">
          <Outlet name="content">
        </div>
      ),
    },
  ]
});
```

