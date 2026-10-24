import type { SVGProps } from "react";

const ArrowUpSVG = (props: SVGProps<SVGSVGElement>) => (
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
      d="M12 8.99C12.19 8.99 12.38 9.06 12.53 9.21L16.06 12.74C16.35 13.03 16.35 13.51 16.06 13.8C15.77 14.09 15.29 14.09 15 13.8L12 10.8L9 13.8C8.71 14.09 8.23 14.09 7.94 13.8C7.65 13.51 7.65 13.03 7.94 12.74L11.47 9.21C11.62 9.06 11.81 8.99 12 8.99Z"
      fill="currentColor"
    />
  </svg>
);

export default ArrowUpSVG;
