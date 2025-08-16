import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export default function AnimatedCounter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(display, Number(value || 0), {
      duration: 0.5,
      onUpdate: v => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);
  return <span>{display.toFixed(2)}</span>;
}
