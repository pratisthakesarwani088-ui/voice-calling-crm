import { BRAND } from "../utils/constants.js";

/**
 * Original TechNova Electronics logo — a flat, minimal "TN" monogram in
 * a rounded square badge, drawn entirely as inline SVG (no external
 * image assets, no copyrighted material). Reused everywhere the brand
 * appears: landing page, login, signup, sidebar, navbar, dashboard —
 * per Module 4, this branding is not redesigned again.
 *
 * `size` controls the badge's pixel size. `withWordmark` also renders
 * the company name next to it (used where there's room, e.g. navbar,
 * expanded sidebar, landing/auth pages); omit it for icon-only contexts
 * like a collapsed sidebar.
 */
function Logo({ size = 40, withWordmark = false, wordmarkClassName = "" }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        role="img"
        aria-label={`${BRAND.name} logo`}
        className="shrink-0"
      >
        <rect width="40" height="40" rx="10" fill="#1D4ED8" />
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="9"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="1"
          opacity="0.6"
        />
        <text
          x="50%"
          y="53%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FFFFFF"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="700"
          fontSize="17"
          letterSpacing="0.5"
        >
          TN
        </text>
      </svg>

      {withWordmark && (
        <span className={`font-semibold text-gray-900 leading-tight ${wordmarkClassName}`}>
          {BRAND.name}
        </span>
      )}
    </div>
  );
}

export default Logo;
