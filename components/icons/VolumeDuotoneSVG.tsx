import React, { type SVGProps } from "react";

export function VolumeDuotoneSVG({
  muted = false,
  ...props
}: SVGProps<SVGSVGElement> & { muted?: boolean }) {
  if (muted) {
    return (
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
          d="M15 8.37V15.63C15 17.58 13.68 18.35 12.06 17.34L8.71 15.24C8.42 15.06 8.03 14.93 7.68 14.93H5C3.34 14.93 2 13.59 2 11.93V11.07C2 9.41 3.34 8.07 5 8.07H7.68C8.03 8.07 8.42 7.94 8.71 7.76L12.06 5.66C13.68 4.65 15 5.42 15 7.37V8.37Z"
          fill="currentColor"
        />
        <path
          d="M18 10L22 14M22 10L18 14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
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
        d="M15 8.37V15.63C15 17.58 13.68 18.35 12.06 17.34L8.71 15.24C8.42 15.06 8.03 14.93 7.68 14.93H5C3.34 14.93 2 13.59 2 11.93V11.07C2 9.41 3.34 8.07 5 8.07H7.68C8.03 8.07 8.42 7.94 8.71 7.76L12.06 5.66C13.68 4.65 15 5.42 15 7.37V8.37Z"
        fill="currentColor"
      />
      <path
        d="M18.5 8C19.5 9.2 20 10.6 20 12C20 13.4 19.5 14.8 18.5 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 5.5C22.5 7.4 23.5 9.6 23.5 12C23.5 14.4 22.5 16.6 21 18.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default VolumeDuotoneSVG;
