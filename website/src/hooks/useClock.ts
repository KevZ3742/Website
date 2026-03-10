import { useEffect, useState } from "react";

export function useClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    setTimeout(() => setNow(new Date()), 0);
    return () => clearInterval(id);
  }, []);

  return now;
}