import type { SVGProps } from "react";

const VoteSVG = (props: SVGProps<SVGSVGElement>) => (
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
      d="M6.44 9.15 9.9 5.7c1.17-1.17 3.08-1.17 4.24 0l3.45 3.45c.59.59.59 1.54 0 2.12L14.14 14.7c-1.17 1.17-3.07 1.17-4.24 0L6.44 11.27c-.58-.58-.58-1.54 0-2.12Z"
      fill="currentColor"
    />
    <path
      d="M4 16.75h16c.41 0 .75.34.75.75v1.5c0 1.52-1.23 2.75-2.75 2.75H6c-1.52 0-2.75-1.23-2.75-2.75V17.5c0-.41.34-.75.75-.75ZM12.53 8.03c-.29-.29-.77-.29-1.06 0l-2.12 2.12c-.29.29-.29.77 0 1.06.15.15.34.22.53.22s.38-.07.53-.22l1.59-1.59 3.18 3.18c.15.15.34.22.53.22s.38-.07.53-.22c.29-.29.29-.77 0-1.06l-3.71-3.71Z"
      fill="currentColor"
    />
  </svg>
);

export default VoteSVG;
