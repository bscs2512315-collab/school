import type { SVGProps } from "react";

const ArrowDownSVG = (props: SVGProps<SVGSVGElement>) => (
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
      d="M12 15.01C11.81 15.01 11.62 14.94 11.47 14.79L7.94003 11.26C7.65003 10.97 7.65003 10.49 7.94003 10.2C8.23003 9.91004 8.71003 9.91004 9.00003 10.2L12 13.2L15 10.2C15.29 9.91004 15.77 9.91004 16.06 10.2C16.35 10.49 16.35 10.97 16.06 11.26L12.53 14.79C12.38 14.94 12.19 15.01 12 15.01Z"
      fill="currentColor"
    />
  </svg>
);

export default ArrowDownSVG;
