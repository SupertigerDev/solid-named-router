import { createComputed, createMemo, createSignal, JSX, Show } from "solid-js";
import {Route as RouteParser} from "@supertiger/route-parser";
import { guardEvent, removeTrailingSlash } from "./utils";
import { createStore, reconcile } from "solid-js/store";


type RouteOptions = {
  name?: string;
  path: string;
  element?: JSX.Element;
  elements?: Record<string, JSX.Element>;
  routes?: Omit<RouteOptions, "routes">[];
};

interface RouterOptions {
  routes: RouteOptions[];
}


const createLocation = () => {
  const [path, setPath] = createSignal(window.location.pathname);

  const set = (_path: string, pushState = true) => {
    if (path() === _path) return;
    setPath(_path);
    pushState && window.history.pushState(history.state, "", _path);
  };

  return { setPath: set, path };
};
const location = createLocation();


const [namedRoute, setNamedRoute] = createStore<{ name?: string; params: Record<string, any>, pathname: string }>({
  params: {},
  get pathname() {
    return location.path();
  }
});



const [currentRoute, setCurrentRoute] = createSignal<null | RouteOptions>(null);



const createNamedRoutes = () => {
  let namedRoutes: Record<string, string> = {};

  const setRoutes = (routes: RouteOptions[]) => {
    namedRoutes = {};
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (!route.routes?.length && route.name) {
        if (namedRoutes[route.name]) {
          console.warn("Duplicate", route.name, "found.");
        }
        namedRoutes[route.name] = removeTrailingSlash(route.path);
        continue;
      }
      if (!route.routes?.length) continue;
      for (let y = 0; y < route.routes.length; y++) {
        const routeY = route.routes[y];
        if (routeY.name) {
          if (namedRoutes[routeY.name]) {
            console.warn("Duplicate", routeY.name, "found.");
          }
          namedRoutes[routeY.name] = removeTrailingSlash(route.path + routeY.path);
        }
      }
    }
  };
  const removeAll = () => {
    namedRoutes = {};
  };
  const getRoute = (name: string) => namedRoutes[name];

  type ParseOverloads = {
    (path: string): string | false;
    (to: { name: string; params?: Record<string, string> }): string | false;
  };

  const parse: ParseOverloads = (parseOpts: any) => {
    if (typeof parseOpts === "string") {
      const path = parseOpts;
      return path;
    }
    if (!getRoute(parseOpts.name)) {
      throw new Error(`${parseOpts.name} Route does not exist!`);
    }
    const parser = new RouteParser(getRoute(parseOpts.name));
    return parser.reverse(parseOpts.params || {});
  };

  return { setRoutes, getRoute, removeAll, parse };
};
const namedRoutes = createNamedRoutes();
let routes: RouteOptions[] | null = null;
const [ready, setReady] = createSignal<boolean>(false);

type NavigateOverloads = {
  (path: string): void;
  (opts: { name: string; params?: Record<string, any> }): void;
};

export const navigate: NavigateOverloads = (opts: any) => {
  const path = namedRoutes.parse(opts);
  if (path === false) {
    throw new Error("Invalid path");
  }
  location.setPath(path);
};

export const createRouter = (opts: RouterOptions) => {
  routes = opts.routes;
  namedRoutes.setRoutes(opts.routes);
  setReady(true);

  window.onpopstate = function (e) {
    location.setPath(window.location.pathname, false);
  };

  return (props: { children: JSX.Element }) => {
    createComputed(() => {
      if (!ready()) return;
      for (let i = 0; i < routes!.length; i++) {
        const route = routes![i];
        if (!route.routes?.length) {
          const parser = new RouteParser(removeTrailingSlash(route.path));
          const match = parser.match(removeTrailingSlash(location.path()));
          if (match !== false) {
            setCurrentRoute(route);
            return setNamedRoute(reconcile({ name: route.name, params: match,   get pathname() {
              return location.path();
            } }));
          }
          continue;
        }
        if (!route.routes?.length) continue;
        for (let y = 0; y < route.routes.length; y++) {
          const routeY = route.routes[y];
          const fullPath = removeTrailingSlash(route.path + routeY.path);
          const parser = new RouteParser(removeTrailingSlash(fullPath));
          const match = parser.match(removeTrailingSlash(location.path()));
          // console.log(match !== false, fullPath, location.path(), routeY.name)
          if (match !== false) {
            setCurrentRoute(routeY);
            return setNamedRoute(reconcile({ name: routeY.name, params: match,   get pathname() {
              return location.path();
            } }));
          }
        }
      }
      setNamedRoute(reconcile({ params: {},   get pathname() {
        return location.path();
      } }));
    });

    return <Show when={ready()}>{props.children}</Show>;
  };
};

export const RouterView = () => {
  const matchedRoute = createMemo(() =>
    routes?.find((route) => {
      const currentPath = removeTrailingSlash(location.path());
      if (!route.routes?.length) {
        const parser = new RouteParser(removeTrailingSlash(route.path));
        const match = parser.match(currentPath);
        return match !== false;
      }
      for (let i = 0; i < route.routes.length; i++) {
        const routeY = route.routes[i];
        const fullPath = removeTrailingSlash(route.path + routeY.path);

        const parser = new RouteParser(fullPath);
        const match = parser.match(currentPath);
        if (match !== false) return true;
      }
    }),
  );

  return <Show when={ready() && matchedRoute()}>{matchedRoute()?.element}</Show>;
};

export const Outlet = (props: { name?: string }) => {
  return (
    <>
      <Show when={!props.name && currentRoute()?.element}>{currentRoute()?.element}</Show>
      <Show when={props.name && currentRoute()?.elements?.[props.name]}>
        {currentRoute()?.elements?.[props.name!]}
      </Show>
    </>
  );
};

export function useNamedRoute<T = Record<string, any>>() {
  return namedRoute as { name?: string; params: T };
}
export function useParams<T = Record<string, any>>() {
  return namedRoute.params as T;
}

type LinkProps = {
  children?: JSX.Element;
  onClick?: (event: MouseEvent) => void;
} & ({ to: string } | { to: { name: string; params?: Record<string, any> } });

export const Link = (props: LinkProps) => {
  const path = () => {
    return namedRoutes.parse(props.to as any);
  };
  if (path() === false) {
    throw new Error("Invalid Link path");
  }
  const onClick = (event: MouseEvent) => {
    props.onClick?.(event);

    if (guardEvent(event)) {
      location.setPath(path() as string);
    }
  };
  return <a {...{ ...(props as any), onClick, to: undefined }} href={path()} />;
};
