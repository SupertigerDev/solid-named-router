import { render } from "solid-js/web";
import "./styles.css";

import App from "./App";

import { createRouter, useNamedRoute } from "../src";

const Router = createRouter({
  routes: [
    {
      name: "Home",
      path: "/",
      element: () => <div>Home Page</div>,
    },
    {
      path: "/app",
      element: () => <MainApp />,
      routes: [
        {
          name: "App",
          path: "/",
        },
        {
          name: "Users",
          path: "/users/:userId",
        },
      ],
    },
  ],
});

const MainApp = () => {
  const namedRoute = useNamedRoute();
  return <div style="white-space: pre;">{JSON.stringify(namedRoute(), null, 2)}</div>;
};

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  document.getElementById("root")!,
);
