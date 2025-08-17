import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { animate } from 'framer-motion';

export default function AnimatedCounter({ value, formatValue }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(display, Number(value || 0), {
      duration: 0.5,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);
  return <span>{formatValue(display)}</span>;
}

AnimatedCounter.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  formatValue: PropTypes.func,
};

AnimatedCounter.defaultProps = {
  formatValue: (v) => v.toFixed(2),
};
