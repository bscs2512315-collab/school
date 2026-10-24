import type { SVGProps } from "react";

const ArrowRightSVG = (props: SVGProps<SVGSVGElement>) => (
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
      d="M15.0099 12.0001C15.0099 12.1901 14.9399 12.3801 14.7899 12.5301L11.2599 16.0601C10.9699 16.3501 10.4899 16.3501 10.1999 16.0601C9.90995 15.7701 9.90995 15.2901 10.1999 15.0001L13.1999 12.0001L10.1999 9.00006C9.90995 8.71006 9.90995 8.23006 10.1999 7.94006C10.4899 7.65006 10.9699 7.65006 11.2599 7.94006L14.7899 11.4701C14.9399 11.6201 15.0099 11.8101 15.0099 12.0001Z"
      fill="currentColor"
    />
  </svg>
);

export default ArrowRightSVG;
