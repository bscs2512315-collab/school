import type { SVGProps } from "react";

const ImageSVG = (props: SVGProps<SVGSVGElement>) => (
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
      d="M22 7.81V16.19C22 19.83 19.83 22 16.19 22H7.81C4.17 22 2 19.83 2 16.19V7.81C2 4.17 4.17 2 7.81 2H16.19C19.83 2 22 4.17 22 7.81Z"
      fill="currentColor"
    />
    <path
      d="M9 10.38C10.3144 10.38 11.38 9.31444 11.38 8C11.38 6.68556 10.3144 5.62 9 5.62C7.68556 5.62 6.62 6.68556 6.62 8C6.62 9.31444 7.68556 10.38 9 10.38Z"
      fill="currentColor"
    />
    <path
      d="M21.97 19.53C21.8 20.01 21.55 20.45 21.23 20.84C20.34 21.95 18.93 22.61 17.24 22.61H6.76C5.07 22.61 3.66 21.95 2.77 20.84C2.45 20.45 2.2 20.01 2.03 19.53L7.59 15.65C8.39 15.11 9.52 15.17 10.23 15.79L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L21.97 19.53Z"
      fill="currentColor"
    />
  </svg>
);

export default ImageSVG;
