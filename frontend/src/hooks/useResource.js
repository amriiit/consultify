import { useCallback, useEffect, useRef, useState } from "react";
// Old responses cannot overwrite a newer search or a different route.
export function useResource(loader, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const data = await loader();
      if (current === generation.current)
        setState({ data, loading: false, error: "" });
    } catch (error) {
      if (current === generation.current)
        setState({ data: null, loading: false, error: error.message });
    }
  }, dependencies);
  useEffect(() => {
    reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
  return { ...state, reload };
}
