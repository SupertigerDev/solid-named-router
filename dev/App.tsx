import type { Component } from "solid-js";

import { RouterView, Link } from "../src";

const App: Component = () => {
  return (
    <>
      <Link to={{ name: "Home" }}>Home</Link>
      <Link to={{ name: "App" }}>App</Link>
      <Link to={{ name: "Users", params: { userId: 123 } }}>Users</Link>
      <RouterView />
    </>
  );
};

export default App;
