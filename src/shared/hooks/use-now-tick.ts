import { useEffect, useState } from "react";

/** Devuelve Date.now() y se re-renderiza cada `intervalMs`, para countdowns en vivo. */
export function useNowTick(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
