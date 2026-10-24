import type { SVGProps } from "react";

const ArrowLeftSVG = (props: SVGProps<SVGSVGElement>) => (
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
      d="M8.99005 12.0001C8.99005 11.8101 9.06005 11.6201 9.21005 11.4701L12.7401 7.94006C13.0301 7.65006 13.5101 7.65006 13.8001 7.94006C14.0901 8.23006 14.0901 8.71006 13.8001 9.00006L10.8001 12.0001L13.8001 15.0001C14.0901 15.2901 14.0901 15.7701 13.8001 16.0601C13.5101 16.3501 13.0301 16.3501 12.7401 16.0601L9.21005 12.5301C9.06005 12.3801 8.99005 12.1901 8.99005 12.0001Z"
      fill="currentColor"
    />
  </svg>
);

export default ArrowLeftSVG;
