import type { Component } from "solid-js";

import { RouterView, Link, navigate } from "../src";

const App: Component = () => {

const navigateTest = () => {
  navigate({
    name: "Users",
    params: {userId: 123},
    query: {test: "1234"}
  })
}

  return (
    <>
      <Link to={{ name: "Home" }}>Home</Link>
      <Link to={{ name: "App" }}>App</Link>
      <Link to={{ name: "Users", params: { userId: 123 }, query: {test: "lol"} }}>Users</Link>


      <div onclick={navigateTest}> Navigate Click Test</div>

      <RouterView />
    </>
  );
};

export default App;
