// client/src/components/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';

const baseClasses = 'px-4 py-2 rounded transition-transform duration-200 hover:scale-105 active:scale-95 shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed';
const variants = {
  primary: 'bg-primary text-text',
  accent: 'bg-accent text-bg',
  danger: 'bg-danger text-text',
  default: 'bg-surface text-text',
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  const variantClasses = variants[variant] || variants.primary;
  return <button className={`${baseClasses} ${variantClasses} ${className}`} {...props} />;
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'accent', 'danger', 'default']),
  className: PropTypes.string,
};
