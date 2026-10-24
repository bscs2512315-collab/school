import type { SVGProps } from "react";

const GlobeSVG = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Globe base sphere */}
    <circle
      opacity="0.4"
      cx="12"
      cy="12"
      r="9.5"
      fill="currentColor"
    />
    {/* Longitude and Latitude grid */}
    <path
      d="M12 2.5C7.86 2.5 4.5 6.75 4.5 12C4.5 17.25 7.86 21.5 12 21.5C16.14 21.5 19.5 17.25 19.5 12C19.5 6.75 16.14 2.5 12 2.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M2.8 12H21.2M4.5 7.5H19.5M4.5 16.5H19.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default GlobeSVG;
