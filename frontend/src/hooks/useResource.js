import { useCallback, useEffect, useRef, useState } from "react";
// The caller memoizes load with useCallback so requests only restart when inputs change.
export function useResource(load) {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  const active = useRef(null);
  const reload = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    try {
      const value = await load(controller.signal);
      if (!controller.signal.aborted) setData(value);
    } catch (e) {
      if (!controller.signal.aborted) setError(e);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    reload();
    return () => active.current?.abort();
  }, [reload]);
  return { data, loading, error, reload };
}
