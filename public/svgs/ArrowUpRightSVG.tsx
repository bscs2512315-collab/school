import type { SVGProps } from "react";

const ArrowUpRightSVG = (props: SVGProps<SVGSVGElement>) => (
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
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      fill="currentColor"
    />
    <path
      d="M15.75 8.25C15.75 7.84 15.41 7.5 15 7.5H9.75C9.34 7.5 9 7.84 9 8.25C9 8.66 9.34 9 9.75 9H13.69L7.72 14.97C7.43 15.26 7.43 15.74 7.72 16.03C7.87 16.18 8.06 16.25 8.25 16.25C8.44 16.25 8.63 16.18 8.78 16.03L14.75 10.06V14C14.75 14.41 15.09 14.75 15.5 14.75C15.91 14.75 16.25 14.41 16.25 14V8.75C16.25 8.48 16.11 8.33 15.75 8.25Z"
      fill="currentColor"
    />
  </svg>
);

export default ArrowUpRightSVG;
