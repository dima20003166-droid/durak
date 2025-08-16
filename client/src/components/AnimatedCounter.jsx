import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export default function AnimatedCounter({ value, className = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    });
    return controls.stop;
  }, [value]);

  return <motion.span className={`odometer ${className}`}>{rounded}</motion.span>;
}

AnimatedCounter.propTypes = {
  value: PropTypes.number.isRequired,
  className: PropTypes.string,
};
