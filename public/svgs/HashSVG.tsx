import type { SVGProps } from "react";

const HashSVG = (props: SVGProps<SVGSVGElement>) => (
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
      d="M10 3.75c.41 0 .75.34.75.75v15c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-15c0-.41.34-.75.75-.75ZM14 3.75c.41 0 .75.34.75.75v15c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-15c0-.41.34-.75.75-.75Z"
      fill="currentColor"
    />
    <path
      d="M4.5 9.25h15c.41 0 .75.34.75.75s-.34.75-.75.75h-15c-.41 0-.75-.34-.75-.75s.34-.75.75-.75ZM4.5 13.25h15c.41 0 .75.34.75.75s-.34.75-.75.75h-15c-.41 0-.75-.34-.75-.75s.34-.75.75-.75Z"
      fill="currentColor"
    />
  </svg>
);

export default HashSVG;
