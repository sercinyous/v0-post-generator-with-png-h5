interface BellLogoProps {
  fill?: string
  width?: number | string
  height?: number | string
  className?: string
}

export function BellLogo({ 
  fill = "#ffffff", 
  width = "100%", 
  height = "auto",
  className = ""
}: BellLogoProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Bell shape */}
      <path
        d="M100 30C100 30 70 45 70 75C70 90 75 100 75 115L125 115C125 100 130 90 130 75C130 45 100 30 100 30Z"
        fill={fill}
        stroke={fill}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Clapper inside */}
      <circle cx="100" cy="85" r="8" fill={fill} opacity="0.8" />
      {/* Sound waves - left */}
      <path
        d="M60 50 Q50 55 50 65"
        stroke={fill}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M55 40 Q40 50 40 70"
        stroke={fill}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Sound waves - right */}
      <path
        d="M140 50 Q150 55 150 65"
        stroke={fill}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M145 40 Q160 50 160 70"
        stroke={fill}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  )
}
