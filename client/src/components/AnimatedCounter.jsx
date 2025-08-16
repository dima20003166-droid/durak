import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export default function AnimatedCounter({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => Math.round(latest).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: 'easeOut' });
    return controls.stop;
  }, [value]);

  return <motion.span className="odometer">{rounded}</motion.span>;
}

AnimatedCounter.propTypes = {
  value: PropTypes.number.isRequired,
};
