"use client";

import { useEffect, useState } from "react";

export function HudClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toISOString().slice(11, 19) + "Z");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular text-spark">{t || "——:——:——Z"}</span>;
}
