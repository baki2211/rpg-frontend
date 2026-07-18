import React from 'react';

interface IconProps {
  /** Icon id from the @altrex-ui/icons library, e.g. "generic-apple", "brand-github", "flag-us". */
  name: string;
  size?: number | string;
  color?: string;
  className?: string;
  /** Accessible label. Omit for purely decorative icons (default: hidden from assistive tech). */
  title?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color, className, title }) => (
  <svg
    width={size}
    height={size}
    className={className}
    style={color ? { color } : undefined}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    focusable="false"
  >
    <use href={`/icons/altrex.svg#${name}`} />
  </svg>
);

export default Icon;
