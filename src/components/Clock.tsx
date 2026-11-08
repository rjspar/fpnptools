"use client";

import { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("nl-NL", { timeZone: "Europe/Amsterdam", hour12: false });
    const first = setTimeout(() => setTime(fmt()), 0);
    const t = setInterval(() => setTime(fmt()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  return <span>AMS {time ?? "--:--:--"}</span>;
}
