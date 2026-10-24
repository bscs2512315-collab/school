import type { SVGProps } from "react";

const ScrollSVG = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Scroll paper body */}
    <path
      opacity="0.4"
      d="M19 19C19 20.66 17.66 22 16 22H6C4.34 22 3 20.66 3 19V7C3 5.34 4.34 4 6 4H17C18.66 4 20 5.34 20 7V17C20 17.74 19.73 18.43 19.29 18.96C19.11 19.18 19 19.46 19 19Z"
      fill="currentColor"
    />
    {/* Roll edge and text lines */}
    <path
      d="M19 19C19 17.9 19.9 17 21 17H21.5C21.78 17 22 17.22 22 17.5V19C22 20.66 20.66 22 19 22H6C4.34 22 3 20.66 3 19C3 17.9 3.9 17 5 17H19V19Z"
      fill="currentColor"
    />
    <path
      d="M7.5 8.5H15.5C15.91 8.5 16.25 8.16 16.25 7.75C16.25 7.34 15.91 7 15.5 7H7.5C7.09 7 6.75 7.34 6.75 7.75C6.75 8.16 7.09 8.5 7.5 8.5Z"
      fill="currentColor"
    />
    <path
      d="M7.5 12H13.5C13.91 12 14.25 11.66 14.25 11.25C14.25 10.84 13.91 10.5 13.5 10.5H7.5C7.09 10.5 6.75 10.84 6.75 11.25C6.75 11.66 7.09 12 7.5 12Z"
      fill="currentColor"
    />
  </svg>
);

export default ScrollSVG;
