import type { SVGProps } from "react";

const FileDuotoneSVG = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      opacity="0.4"
      d="M18.5 20H5.5C4.95 20 4.5 19.55 4.5 19V5C4.5 4.45 4.95 4 5.5 4H13.5L19.5 10V19C19.5 19.55 19.05 20 18.5 20Z"
      fill="currentColor"
    />
    <path
      d="M13.5 4L19.5 10H15C14.45 10 13.98 9.8 13.59 9.41C13.2 9.02 13 8.55 13 8V4Z"
      fill="currentColor"
    />
    <path
      d="M8 13.5H16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 17H14"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default FileDuotoneSVG;