import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn.js';

/** Brand lockup asset (shield + SENTINEL + SCANNER) — place PNG in `public/logo-sentinel-lockup.png` */
export const SENTINEL_LOGO_SRC = '/logo-sentinel-lockup.png';

function LogoImage({
  size,
  variant,
}: {
  size: 'sm' | 'md' | 'lg';
  variant: 'lockup' | 'wordmark';
}) {
  const heightClass =
    variant === 'wordmark'
      ? 'h-11 max-h-11 w-auto sm:h-12 sm:max-h-12'
      : size === 'sm'
        ? 'h-10 max-h-10 w-auto sm:h-11 sm:max-h-11'
        : size === 'lg'
          ? 'h-20 max-h-20 w-auto'
          : 'h-14 max-h-14 w-auto sm:h-16 sm:max-h-16';

  return (
    <img
      src={SENTINEL_LOGO_SRC}
      alt=""
      width={320}
      height={64}
      className={cn('object-contain object-left', heightClass)}
      decoding="async"
      draggable={false}
    />
  );
}

export interface SentinelLogoProps {
  variant?: 'lockup' | 'wordmark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  to?: string;
  href?: string;
  'aria-label'?: string;
}

export const SentinelLogo: React.FC<SentinelLogoProps> = ({
  variant = 'lockup',
  size = 'md',
  className,
  to,
  href,
  'aria-label': ariaLabel = 'Sentinel Scanner',
}) => {
  const lockupSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
  const inner = <LogoImage size={lockupSize} variant={variant} />;

  const cls = cn('inline-flex max-w-full items-center outline-none transition-opacity hover:opacity-95', className);

  if (to) {
    return (
      <Link to={to} className={cls} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <span className={cls} aria-label={ariaLabel}>
      {inner}
    </span>
  );
};
