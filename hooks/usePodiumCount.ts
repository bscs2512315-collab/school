"use client";

import { useEffect, useState } from "react";

export function usePodiumCount(): number {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 1280px)").matches) {
        setCount(5);
        return;
      }
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCount(3);
        return;
      }
      if (window.matchMedia("(min-width: 768px)").matches) {
        setCount(2);
        return;
      }
      setCount(1);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}
