interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0e1729" />
          <stop offset="1" stopColor="#1a2540" />
        </linearGradient>
        <linearGradient id="logo-curve" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.32" stopColor="#ef4444" />
          <stop offset="0.6" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="logo-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ef4444" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="logo-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="64" height="64" rx="14" fill="url(#logo-bg)" />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="13"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.07"
      />

      <g stroke="#ffffff" strokeOpacity="0.055" strokeWidth="1">
        <line x1="8" y1="20" x2="56" y2="20" />
        <line x1="8" y1="32" x2="56" y2="32" />
        <line x1="8" y1="44" x2="56" y2="44" />
      </g>

      <path
        d="M 8 48 C 16 48, 20 15, 27 15 C 34 15, 38 44, 56 46 L 56 51 L 8 51 Z"
        fill="url(#logo-area)"
      />

      <path
        d="M 8 48 C 16 48, 20 15, 27 15 C 34 15, 38 44, 56 46"
        fill="none"
        stroke="url(#logo-curve)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* spreading case dots — staggered pulse tracing the rise */}
      <circle cx="13.5" cy="40" r="2" fill="#3b82f6">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" begin="0s" repeatCount="indefinite" />
      </circle>
      <circle cx="18" cy="31" r="1.9" fill="#ef4444">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="22.5" cy="22" r="1.7" fill="#f59e0b">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
      </circle>

      {/* outbreak peak — breathing glow */}
      <circle cx="27" cy="15" r="8.5" fill="url(#logo-glow)">
        <animate attributeName="r" values="7;10;7" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="27" cy="15" r="3.6" fill="#fde68a" />
    </svg>
  );
}
