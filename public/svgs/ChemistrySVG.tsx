import type { SVGProps } from "react";

const ChemistrySVG = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Liquid and bottom flask chamber */}
    <path
      opacity="0.4"
      d="M19.78 17.56L15 9.5V4.75H15.75C16.16 4.75 16.5 4.41 16.5 4C16.5 3.59 16.16 3.25 15.75 3.25H8.25C7.84 3.25 7.5 3.59 7.5 4C7.5 4.41 7.84 4.75 8.25 4.75H9V9.5L4.22 17.56C3.25 19.2 4.43 21.25 6.33 21.25H17.67C19.57 21.25 20.75 19.2 19.78 17.56Z"
      fill="currentColor"
    />
    {/* Flask neck, rim, measurement lines, and bubbles */}
    <path
      d="M15.75 3.25H8.25C7.84 3.25 7.5 3.59 7.5 4C7.5 4.41 7.84 4.75 8.25 4.75H9V9.5L10.5 12H13.5L15 9.5V4.75H15.75C16.16 4.75 16.5 4.41 16.5 4C16.5 3.59 16.16 3.25 15.75 3.25Z"
      fill="currentColor"
    />
    <path
      d="M8.5 16H15.5C15.91 16 16.25 15.66 16.25 15.25C16.25 14.84 15.91 14.5 15.5 14.5H8.5C8.09 14.5 7.75 14.84 7.75 15.25C7.75 15.66 8.09 16 8.5 16Z"
      fill="currentColor"
    />
    <path
      d="M10 18.75H14C14.41 18.75 14.75 18.41 14.75 18C14.75 17.59 14.41 17.25 14 17.25H10C9.59 17.25 9.25 17.59 9.25 18C9.25 18.41 9.59 18.75 10 18.75Z"
      fill="currentColor"
    />
    <circle cx="10" cy="13.5" r="1" fill="currentColor" />
    <circle cx="14" cy="14" r="0.75" fill="currentColor" />
  </svg>
);

export default ChemistrySVG;
