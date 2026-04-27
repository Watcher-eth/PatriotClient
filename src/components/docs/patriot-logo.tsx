'use client'

export function PatriotLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="#dc2626"
        strokeWidth="2"
        fill="none"
      />
      {/* Inner ring */}
      <circle
        cx="50"
        cy="50"
        r="30"
        stroke="#dc2626"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Center ring */}
      <circle
        cx="50"
        cy="50"
        r="15"
        stroke="#dc2626"
        strokeWidth="1"
        fill="none"
      />
      {/* Center dot */}
      <circle
        cx="50"
        cy="50"
        r="4"
        fill="#dc2626"
      />
      {/* Crosshairs */}
      <line x1="50" y1="5" x2="50" y2="35" stroke="#dc2626" strokeWidth="1.5" />
      <line x1="50" y1="65" x2="50" y2="95" stroke="#dc2626" strokeWidth="1.5" />
      <line x1="5" y1="50" x2="35" y2="50" stroke="#dc2626" strokeWidth="1.5" />
      <line x1="65" y1="50" x2="95" y2="50" stroke="#dc2626" strokeWidth="1.5" />
    </svg>
  )
}
