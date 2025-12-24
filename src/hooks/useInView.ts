import { useEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "120px" }
    );

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}
