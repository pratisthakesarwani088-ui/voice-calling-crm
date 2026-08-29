import { useEffect, useState } from "react";

import { checkBackendHealth } from "../services/healthService.js";

/**
 * Fetches backend health status on mount.
 *
 * Kept simple and dependency-free (no external data-fetching library)
 * since Module 1 only needs to prove connectivity, not full data
 * management — that's introduced when real features arrive.
 */
export function useBackendHealth() {
  const [status, setStatus] = useState("checking"); // checking | online | offline
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    checkBackendHealth()
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setStatus("online");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("offline");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { status, data };
}
