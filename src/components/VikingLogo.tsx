interface VikingLogoProps {
  size?: number;
  className?: string;
  logoUrl?: string | null;
}

export function VikingLogo({ size = 64, className = '', logoUrl = null }: VikingLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo del Club"
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield outline */}
      <path
        d="M50 4 L90 16 V52 C90 74 72 90 50 96 C28 90 10 74 10 52 V16 Z"
        fill="#131318"
        stroke="#c9a227"
        strokeWidth="2.5"
      />
      {/* Inner shield border */}
      <path
        d="M50 10 L84 20 V51 C84 70 68 84 50 89 C32 84 16 70 16 51 V20 Z"
        stroke="#8b6914"
        strokeWidth="1"
        fill="none"
      />
      {/* Helmet top */}
      <path
        d="M30 38 C30 28 40 22 50 22 C60 22 70 28 70 38 L70 44 L30 44 Z"
        fill="#3a3a42"
        stroke="#c9a227"
        strokeWidth="1.5"
      />
      {/* Horns left */}
      <path
        d="M30 38 C22 36 16 30 14 22 C18 28 24 32 30 34 Z"
        fill="#c9a227"
        stroke="#8b6914"
        strokeWidth="1"
      />
      {/* Horns right */}
      <path
        d="M70 38 C78 36 84 30 86 22 C82 28 76 32 70 34 Z"
        fill="#c9a227"
        stroke="#8b6914"
        strokeWidth="1"
      />
      {/* Helmet nose guard */}
      <rect x="48" y="44" width="4" height="14" fill="#3a3a42" stroke="#c9a227" strokeWidth="1" />
      {/* Eye slits */}
      <rect x="38" y="42" width="8" height="3" rx="1" fill="#c9a227" />
      <rect x="54" y="42" width="8" height="3" rx="1" fill="#c9a227" />
      {/* Beard */}
      <path
        d="M36 58 L42 70 L46 62 L50 72 L54 62 L58 70 L64 58 C64 58 60 66 50 68 C40 66 36 58 36 58 Z"
        fill="#4a3520"
        stroke="#8b6914"
        strokeWidth="0.8"
      />
      {/* Runes */}
      <text
        x="50"
        y="82"
        textAnchor="middle"
        fontSize="8"
        fill="#c9a227"
        fontFamily="serif"
        fontWeight="bold"
      >
        ᚹ
      </text>
    </svg>
  );
}
