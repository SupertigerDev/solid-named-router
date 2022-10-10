import { createComputed, createMemo, createSignal, JSX, Show } from "solid-js";
import { Route as RouteParser } from "@supertiger/route-parser";
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
  const [query, setQuery] = createStore(urlToQueryObject(window.location.href));

  const set = (_path: string, pushState = true, replaceState = false) => {
    setQuery(reconcile(urlToQueryObject(_path)));
    const beforePath = window.location.pathname + window.location.search;
    if (beforePath === _path) return;
    (pushState && !replaceState) && window.history.pushState(history.state, "", _path);
    replaceState && window.history.replaceState(history.state, "", _path);
    setPath(urlToPathname(_path));
  };

  return { setPath: set, path, query };
};
const location = createLocation();

const [params, setParams] = createStore<Record<string, any>>({});

const [namedRoute, setNamedRoute] = createStore<{ name?: string; params: Record<string, any>, pathname: string, query: Record<string, any> }>({
  get params() {
    return params;
  },
  get pathname() {
    return location.path();
  },
  get query() {
    return location.query
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

interface navigateOptions {
  replace?: boolean
}

type NavigateOverloads = {
  (path: string, options?: navigateOptions): void;
  (to: { name: string; params?: Record<string, any>, query?: Record<string, any>, options?: navigateOptions }): void;
};

export const navigate: NavigateOverloads = (to: any, opts?: navigateOptions) => {
  let path = namedRoutes.parse(to);
  if (path === false) {
    throw new Error("Invalid path");
  }

  const queryObj = to.query;
  const query = queryObj ? setUrlQueries(path, queryObj) : false
  if (query) {
    path = path + query;
  }

  location.setPath(path, true, opts?.replace);
};

export const createRouter = (opts: RouterOptions) => {
  routes = opts.routes;
  namedRoutes.setRoutes(opts.routes);
  setReady(true);

  window.onpopstate = function (e) {
    location.setPath(window.location.href, false);
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
            setParams(match);
            return setNamedRoute('name', reconcile(route.name));
          }
          continue;
        }
        if (!route.routes?.length) continue;
        for (let y = 0; y < route.routes.length; y++) {
          const routeY = route.routes[y];
          const fullPath = removeTrailingSlash(route.path + routeY.path);
          const parser = new RouteParser(removeTrailingSlash(fullPath));
          const match = parser.match(removeTrailingSlash(location.path()));

          if (match !== false) {
            setCurrentRoute(routeY);
            setParams(reconcile(match))
            return setNamedRoute('name', reconcile(routeY.name));
          }
        }
      }
      setParams(reconcile({}));
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

export function useNamedRoute() {
  return namedRoute as { name?: string; params: Record<string, any>, query: Record<string, any>, pathname: string; };
}

const p = createMemo(() => {
  const route = useNamedRoute();
  return route.params;
})

export function useParams<T = Record<string, any>>() {
  return p();
}
export function useQuery<T = Record<string, any>>() {
  return namedRoute.query as T;
}

type LinkProps = {
  children?: JSX.Element;
  onClick?: (event: MouseEvent) => void;
  class?: string;
  style?: string | JSX.CSSProperties | undefined;

} & ({ to: string } | { to: { name: string; params?: Record<string, any>, query?: Record<string, any> } });

export const Link = (props: LinkProps) => {
  const path = () => {
    let partialPath = namedRoutes.parse(props.to as any);
    if (!partialPath) return partialPath;
    const queryObj = (props.to as any).query;
    const query = queryObj ? setUrlQueries(partialPath, queryObj) : false
    if (query) {
      partialPath = partialPath + query;
    }
    return partialPath
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


function setUrlQueries(path: string, query: Record<string, any>) {
  const url = new URL(path.startsWith("/") ? "http://uwu.uwu" + path : path);
  for (let key in query) {
    const value = query[key];
    url.searchParams.set(key, value.toString());
  }
  return url.search;
}

function urlToQueryObject(path: string) {
  const url = new URL(path.startsWith("/") ? "http://uwu.uwu" + path : path);
  return Object.fromEntries(url.searchParams);
}


function urlToPathname(path: string) {
  const url = new URL(path.startsWith("/") ? "http://uwu.uwu" + path : path);
  return url.pathname;
}