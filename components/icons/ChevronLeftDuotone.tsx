import type { SVGProps } from "react";

export default function ChevronLeftDuotone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".18" />
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeOpacity=".28" strokeWidth="1.5" />
      <path
        d="m13.75 7.5-4.5 4.5 4.5 4.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
