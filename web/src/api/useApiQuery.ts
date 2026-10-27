import { useCallback, useEffect, useState } from "react";
import type { DependencyList } from "react";
import { describeError } from "./errors";

export type QueryState<Body> =
  | { phase: "loading" }
  | { phase: "ready"; value: Body }
  | { phase: "failed"; message: string };

export function useApiQuery<Body>(load: () => Promise<Body>, deps: DependencyList) {
  const [state, setState] = useState<QueryState<Body>>({ phase: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((previous) => (previous.phase === "ready" ? previous : { phase: "loading" }));
    load().then(
      (value) => !cancelled && setState({ phase: "ready", value }),
      (failure: unknown) => !cancelled && setState({ phase: "failed", message: describeError(failure) }),
    );
    return () => {
      cancelled = true;
    };
  }, [...deps, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);
  return { state, reload };
}
