import type { SVGProps } from "react";

const ZapSVG = (props: SVGProps<SVGSVGElement>) => (
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
      d="M6.67 11.02L13.11 2.22C13.69 1.43 14.93 1.84 14.93 2.82V8.65H18.25C19.06 8.65 19.5 9.61 18.98 10.23L12.54 19.03C11.96 19.82 10.72 19.41 10.72 18.43V12.6H7.4C6.59 12.6 6.15 11.64 6.67 11.02Z"
      fill="currentColor"
    />
    <path
      d="M9.83002 8.65L12.72 4.71C12.92 4.43 13.33 4.58 13.33 4.93V8.65H9.83002Z"
      fill="currentColor"
    />
    <path
      d="M14.17 12.6L11.28 16.54C11.08 16.82 10.67 16.67 10.67 16.32V12.6H14.17Z"
      fill="currentColor"
    />
  </svg>
);

export default ZapSVG;
