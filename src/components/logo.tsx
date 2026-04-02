/**
 * GoReady Logo — a stylised "G" formed by an arrow curving into a checkmark,
 * representing "Go" (movement/travel) + "Ready" (prepared/checked).
 */
export function GoReadyLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill="currentColor" className="text-primary" />

      {/* Stylised G made of an arc + arrow tip that doubles as a checkmark */}
      {/* Outer arc of the G */}
      <path
        d="M28 14.5C26.2 11.3 22.8 9.2 19 9.2C13 9.2 8.2 14 8.2 20C8.2 26 13 30.8 19 30.8C23.5 30.8 27.4 28 29 24"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Horizontal bar of G + arrow/check */}
      <path
        d="M19 20H29"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Checkmark / arrow tip */}
      <path
        d="M25.5 16.5L29 20L25.5 23.5"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
