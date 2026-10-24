import type { SVGProps } from "react";

const CalculatorSVG = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Outer calculator body */}
    <rect
      opacity="0.4"
      x="4"
      y="2"
      width="16"
      height="20"
      rx="4"
      fill="currentColor"
    />
    {/* Screen Display */}
    <rect
      x="7"
      y="5"
      width="10"
      height="4"
      rx="1.5"
      fill="currentColor"
    />
    {/* Grid Keypad buttons */}
    <circle cx="8" cy="12" r="1.1" fill="currentColor" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    <circle cx="16" cy="12" r="1.1" fill="currentColor" />
    <circle cx="8" cy="15.5" r="1.1" fill="currentColor" />
    <circle cx="12" cy="15.5" r="1.1" fill="currentColor" />
    <circle cx="16" cy="15.5" r="1.1" fill="currentColor" />
    <circle cx="8" cy="18.8" r="1.1" fill="currentColor" />
    <rect x="11" y="17.8" width="6" height="2" rx="1" fill="currentColor" />
  </svg>
);

export default CalculatorSVG;
