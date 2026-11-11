import { useCallback, useEffect, useState } from "react";
import type { ApiResult, ApiState } from "../types/api";

export function useApiData<T>(
  loader: (signal: AbortSignal) => Promise<ApiResult<T>>,
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    metrics: null,
    loading: true,
    error: null,
  });

  const reload = useCallback(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));
    loader(controller.signal)
      .then((result) => setState({ ...result, loading: false, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        }));
      });
    return () => controller.abort();
  }, [loader]);

  useEffect(() => reload(), [reload]);
  return { ...state, reload };
}
