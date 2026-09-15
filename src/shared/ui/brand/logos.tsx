import logoRed from '../../../assets/brand/logo-codev-red.png';
import logoWhite from '../../../assets/brand/logo-codev-white.png';

type LogoProps = {
  /** Rendered height in px. Width follows the bitmap's aspect ratio. */
  height?: number;
  className?: string;
};

/** The master codev wordmark in brand red. The .fig ships this as a bitmap,
 *  not a vector, so it is used as-is and never redrawn (spec 002 FR-013). */
export function CoDevRedMasterLogo({ height = 39, className }: LogoProps) {
  return <img src={logoRed} alt="codev" height={height} className={className} style={{ height, width: 'auto' }} />;
}

/** The same mark knocked out for dark grounds. */
export function CoDevWhiteMasterLogo({ height = 39, className }: LogoProps) {
  return <img src={logoWhite} alt="codev" height={height} className={className} style={{ height, width: 'auto' }} />;
}

/** The product lockup: the mark above the product name. Used in the top bar
 *  and on the login card. */
export function CoDevSupplyRequestsLogo({
  productName = 'SUPPLY REQUESTS',
  markHeight = 36,
  className,
}: {
  productName?: string;
  markHeight?: number;
  className?: string;
}) {
  return (
    <div className={`flex w-fit flex-col items-start gap-4 ${className ?? ''}`}>
      <CoDevRedMasterLogo height={markHeight} />
      <span className="font-sans text-14 font-semibold leading-body whitespace-nowrap text-ink-primary">
        {productName}
      </span>
    </div>
  );
}
