"use client";

import { useId, type SVGProps } from 'react';

const GrandmasterSVG = (props: SVGProps<SVGSVGElement>) => {
    const rawId = useId();
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return (
    <svg
        width={72}
        height={74}
        viewBox='0 0 72 74'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        {...props}
    >
        <path fillRule="evenodd" clipRule="evenodd" d="M53 62C54.1046 62 55 62.8954 55 64C55 65.1046 54.1046 66 53 66H35C34.8824 66 34.7673 65.9899 34.6553 65.9704C28.2305 65.687 22.3308 63.3828 17.5761 59.6779C17.1894 59.3766 16.6067 58.8771 16.1748 58.5013C15.8054 58.1799 15.3333 58 14.8436 58H10C8.89543 58 8 57.1046 8 56C8 54.8954 8.89543 54 10 54H12C13.1046 54 14 53.1046 14 52C14 50.8954 13.1046 50 12 50H7C5.89543 50 5 49.1046 5 48C5 46.8954 5.89543 46 7 46H8C9.10457 46 10 45.1046 10 44C10 42.8954 9.10457 42 8 42C7.1913 42 6.49962 41.4171 6.36506 40.6196C6.31617 40.3299 6.27734 40.0966 6.27093 40.0492C6.09227 38.7249 6 37.3732 6 36C6 19.4315 19.4315 6 36 6C41 6 46 6 51 6C52.1046 6 53 6.89543 53 8C53 9.10457 52.1046 10 51 10H48C46.8954 10 46 10.8954 46 12C46 13.1046 46.8954 14 48 14H60C61.1046 14 62 14.8954 62 16C62 17.1038 61.1058 17.9988 60.0022 18L57 18C55.8954 18 55 18.8954 55 20C55 21.1046 55.8954 22 57 22H61.306C62.0624 22 62.7556 22.4259 63.0835 23.1075C63.2807 23.5171 63.488 23.959 63.6237 24.2783C65.1536 27.8793 66 31.8408 66 36C66 37.3068 65.9164 38.5942 65.7544 39.8569C65.7271 40.0692 65.6853 40.3418 65.6398 40.6208C65.5093 41.4213 64.8111 42 64 42C62.8954 42 62 42.8954 62 44C62 45.1046 62.8954 46 64 46H65C66.1046 46 67 46.8954 67 48C67 49.1046 66.1046 50 65 50H63.7162C62.9901 50 62.3224 50.3942 61.9597 51.0232C61.7241 51.4317 61.4621 51.8761 61.2675 52.1794C60.8114 52.8903 60.326 53.5807 59.8132 54.2489C59.2981 54.9201 58.7553 55.5688 58.1864 56.1934C57.8743 56.5362 57.3685 57.044 56.974 57.4341C56.605 57.799 56.1061 58 55.5871 58H50C48.8954 58 48 58.8954 48 60C48 61.0969 48.883 61.9875 49.9769 61.9999L53 62Z" fill={`url(#paint0_linear_0_10706_${id})`} />
        <g opacity="0.1">
            <path fillRule="evenodd" clipRule="evenodd" d="M32.9985 12.6768C34.8549 11.605 37.1421 11.605 38.9985 12.6768L54.697 21.7403C56.5534 22.8121 57.697 24.7929 57.697 26.9365V45.0636C57.697 47.2072 56.5534 49.1879 54.697 50.2597L38.9985 59.3233C37.1421 60.3951 34.8549 60.3951 32.9985 59.3233L17.3 50.2597C15.4436 49.1879 14.3 47.2072 14.3 45.0636L14.3 26.9365C14.3 24.7929 15.4436 22.8121 17.3 21.7403L32.9985 12.6768Z" fill="#0602F3" style={{ mixBlendMode: "multiply" }} />
        </g>
        <g filter={`url(#filter0_d_0_10706_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M29.0718 33L42.9282 41L26.76 69.0041C26.3829 69.6573 25.446 69.6738 25.0461 69.0344L21.125 62.7643L13.7343 62.5035C12.9806 62.4769 12.5265 61.6573 12.9036 61.0041L29.0718 33Z" fill="#F55462" />
        </g>
        <mask id={`mask0_0_10706_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="12" y="33" width="31" height="37">
            <path fillRule="evenodd" clipRule="evenodd" d="M29.0718 33L42.9282 41L26.76 69.0041C26.3829 69.6573 25.446 69.6738 25.0461 69.0344L21.125 62.7643L13.7343 62.5035C12.9806 62.4769 12.5265 61.6573 12.9036 61.0041L29.0718 33Z" fill="white" />
        </mask>
        <g mask={`url(#mask0_0_10706_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M24.5359 48.8564L31.4641 52.8564L22.4641 68.4449L15.5359 64.4449L24.5359 48.8564Z" fill="white" />
        </g>
        <g filter={`url(#filter1_d_0_10706_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M42.9282 33L29.0718 41L45.24 69.0041C45.6171 69.6573 46.5539 69.6738 46.9538 69.0344L50.875 62.7643L58.2656 62.5035C59.0193 62.4769 59.4735 61.6573 59.0964 61.0041L42.9282 33Z" fill="#F55462" />
        </g>
        <mask id={`mask1_0_10706_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="29" y="33" width="31" height="37">
            <path fillRule="evenodd" clipRule="evenodd" d="M42.9282 33L29.0718 41L45.24 69.0041C45.6171 69.6573 46.5539 69.6738 46.9538 69.0344L50.875 62.7643L58.2656 62.5035C59.0193 62.4769 59.4735 61.6573 59.0964 61.0041L42.9282 33Z" fill="white" />
        </mask>
        <g mask={`url(#mask1_0_10706_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M47.4641 48.8564L40.5359 52.8564L49.5359 68.4449L56.4641 64.4449L47.4641 48.8564Z" fill="white" />
        </g>
        <path opacity="0.2" fillRule="evenodd" clipRule="evenodd" d="M34 16.1547C35.2376 15.4401 36.7624 15.4401 38 16.1547L53.9186 25.3453C55.1562 26.0598 55.9186 27.3803 55.9186 28.8094V47.1906C55.9186 48.6196 55.1562 49.9401 53.9186 50.6547L38 59.8453C36.7624 60.5598 35.2376 60.5598 34 59.8453L18.0814 50.6547C16.8438 49.9401 16.0814 48.6196 16.0814 47.1906L16.0814 28.8094C16.0814 27.3803 16.8438 26.0598 18.0814 25.3453L34 16.1547Z" fill="#0602F3" style={{ mixBlendMode: "multiply" }} />
        <path fillRule="evenodd" clipRule="evenodd" d="M54 22.677C54 22.2681 54.2489 21.9004 54.6286 21.7486L58.1771 20.3291C58.5713 20.1715 59 20.4617 59 20.8862V36.323C59 36.7319 58.751 37.0996 58.3714 37.2514L54 39V22.677Z" fill={`url(#paint1_linear_0_10706_${id})`} stroke={`url(#paint2_linear_0_10706_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <mask id={`mask2_0_10706_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="53" y="20" width="7" height="19">
            <path fillRule="evenodd" clipRule="evenodd" d="M54 23.3541C54 22.5363 54.4979 21.8008 55.2572 21.4971L56.2572 21.0971C57.5709 20.5716 59 21.5391 59 22.9541V35.6459C59 36.4637 58.5021 37.1992 57.7428 37.5029L56.7428 37.9029C55.429 38.4284 54 37.4609 54 36.0459V23.3541Z" fill="white" stroke="white" />
        </mask>
        <g mask={`url(#mask2_0_10706_${id})`}>
            <g opacity="0.04">
                <path fillRule="evenodd" clipRule="evenodd" d="M38.9985 12.6768C37.1421 11.605 34.8549 11.605 32.9985 12.6768L17.3 21.7403C15.4436 22.8121 14.3 24.7929 14.3 26.9365V45.0636C14.3 47.2072 15.4436 49.1879 17.3 50.2597L32.9985 59.3233C34.8549 60.3951 37.1421 60.3951 38.9985 59.3233L54.697 50.2597C56.5534 49.1879 57.697 47.2072 57.697 45.0636L57.697 26.9365C57.697 24.7929 56.5534 22.8121 54.697 21.7403L38.9985 12.6768Z" fill="#0602F3" style={{ mixBlendMode: "multiply" }} />
            </g>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M18 22.677C18 22.2681 17.751 21.9004 17.3714 21.7486L13.8228 20.3291C13.4287 20.1715 13 20.4617 13 20.8862V36.323C13 36.7319 13.2489 37.0996 13.6286 37.2514L18 39V22.677Z" fill={`url(#paint3_linear_0_10706_${id})`} stroke={`url(#paint4_linear_0_10706_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <mask id={`mask3_0_10706_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="12" y="20" width="7" height="19">
            <path fillRule="evenodd" clipRule="evenodd" d="M18 23.3541C18 22.5363 17.5021 21.8008 16.7428 21.4971L15.7428 21.0971C14.429 20.5716 13 21.5391 13 22.9541V35.6459C13 36.4637 13.4979 37.1992 14.2572 37.5029L15.2572 37.9029C16.5709 38.4284 18 37.4609 18 36.0459V23.3541Z" fill="white" stroke="white" />
        </mask>
        <g mask={`url(#mask3_0_10706_${id})`}>
            <g opacity="0.04">
                <path fillRule="evenodd" clipRule="evenodd" d="M32.9985 12.6768C34.8549 11.605 37.1421 11.605 38.9985 12.6768L54.697 21.7403C56.5534 22.8121 57.697 24.7929 57.697 26.9365V45.0636C57.697 47.2072 56.5534 49.1879 54.697 50.2597L38.9985 59.3233C37.1421 60.3951 34.8549 60.3951 32.9985 59.3233L17.3 50.2597C15.4436 49.1879 14.3 47.2072 14.3 45.0636L14.3 26.9365C14.3 24.7929 15.4436 22.8121 17.3 21.7403L32.9985 12.6768Z" fill="#0602F3" style={{ mixBlendMode: "multiply" }} />
            </g>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M49 17.354C49 16.6812 48.3489 16.2004 47.7059 16.3982L36 20.0001L24.2941 16.3982C23.651 16.2004 23 16.6812 23 17.354V32.0001C23 32.5524 23.4477 33.0001 24 33.0001H48C48.5523 33.0001 49 32.5524 49 32.0001V17.354Z" fill={`url(#paint5_linear_0_10706_${id})`} stroke={`url(#paint6_linear_0_10706_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <mask id={`mask4_0_10706_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="15" width="28" height="10">
            <path fillRule="evenodd" clipRule="evenodd" d="M49 17.354C49 16.6812 48.3489 16.2003 47.7059 16.3982L36 20L24.2941 16.3982C23.651 16.2003 23 16.6812 23 17.354V23C23 23.5523 23.4477 24 24 24H48C48.5523 24 49 23.5523 49 23V17.354Z" fill="white" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
        <g mask={`url(#mask4_0_10706_${id})`}>
            <g opacity="0.04">
                <path fillRule="evenodd" clipRule="evenodd" d="M32.9985 12.6768C34.8549 11.605 37.1421 11.605 38.9985 12.6768L54.6971 21.7403C56.5535 22.8121 57.6971 24.7929 57.6971 26.9365V45.0636C57.6971 47.2072 56.5535 49.1879 54.6971 50.2597L38.9985 59.3233C37.1421 60.3951 34.8549 60.3951 32.9985 59.3233L17.3 50.2597C15.4436 49.1879 14.3 47.2072 14.3 45.0636L14.3 26.9365C14.3 24.7929 15.4436 22.8121 17.3 21.7403L32.9985 12.6768Z" fill="#0602F3" style={{ mixBlendMode: "multiply" }} />
            </g>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M34 14.1547C35.2376 13.4402 36.7624 13.4402 38 14.1547L53.9186 23.3453C55.1562 24.0598 55.9186 25.3803 55.9186 26.8094V45.1906C55.9186 46.6197 55.1562 47.9402 53.9186 48.6547L38 57.8453C36.7624 58.5598 35.2376 58.5598 34 57.8453L18.0814 48.6547C16.8438 47.9402 16.0814 46.6197 16.0814 45.1906V26.8094C16.0814 25.3803 16.8438 24.0598 18.0814 23.3453L34 14.1547Z" fill={`url(#paint7_linear_0_10706_${id})`} stroke="#FFF04D" strokeOpacity="0.4" />
        <path d="M37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3314 23.7783C17.2485 24.4035 16.5814 25.5589 16.5814 26.8094L16.5814 45.1906C16.5814 46.441 17.2485 47.5964 18.3314 48.2217L34.25 57.4123C35.3329 58.0375 36.6671 58.0375 37.75 57.4123L53.6686 48.2217C54.7515 47.5964 55.4186 46.441 55.4186 45.1906V26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877Z" stroke="#F9B307" />
        <path opacity="0.4" d="M37.75 57.4123C39.6221 56.3314 40.9487 55.5655 41.7296 55.1146" stroke="white" strokeLinecap="round" />
        <path d="M55.4186 45.1906V26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3314 23.7783C17.2485 24.4035 16.5814 25.5589 16.5814 26.8094L16.5814 45.1906" stroke="#FAC00E" strokeLinecap="round" />
        <path opacity="0.6" d="M55.4186 26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3314 23.7783C17.2485 24.4035 16.5814 25.5589 16.5814 26.8094" stroke="#FDDB3D" strokeLinecap="round" />
        <path opacity="0.6" d="M37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877C34.25 14.5877 28.9438 17.6512 26.2907 19.183" stroke="white" strokeLinecap="round" />
        <path d="M34.25 14.5876C34.25 14.5876 31.4417 16.209 30.2703 16.8853" stroke="white" strokeLinecap="round" />
        <g filter={`url(#filter2_d_0_10706_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M35 20.5774C35.6188 20.2201 36.3812 20.2201 37 20.5774L48.8564 27.4226C49.4752 27.7799 49.8564 28.4402 49.8564 29.1547V42.8453C49.8564 43.5598 49.4752 44.2201 48.8564 44.5774L37 51.4226C36.3812 51.7799 35.6188 51.7799 35 51.4226L23.1436 44.5774C22.5248 44.2201 22.1436 43.5598 22.1436 42.8453V29.1547C22.1436 28.4402 22.5248 27.7799 23.1436 27.4226L35 20.5774Z" fill={`url(#paint8_linear_0_10706_${id})`} />
            <path d="M34.75 20.1445C35.5235 19.6979 36.4765 19.6979 37.25 20.1445L49.1064 26.9893C49.8798 27.4358 50.3563 28.2613 50.3564 29.1543V42.8457C50.3563 43.7387 49.8798 44.5642 49.1064 45.0107L37.25 51.8555C36.4765 52.3021 35.5235 52.3021 34.75 51.8555L22.8935 45.0107C22.1201 44.5642 21.6437 43.7387 21.6435 42.8457V29.1543C21.6437 28.2613 22.1201 27.4358 22.8935 26.9893L34.75 20.1445Z" stroke="#F5900D" strokeOpacity="0.1" style={{ mixBlendMode: "multiply" }} />
        </g>
        <mask id={`mask5_0_10706_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="20" width="28" height="32">
            <path fillRule="evenodd" clipRule="evenodd" d="M35 20.5774C35.6188 20.2201 36.3812 20.2201 37 20.5774L48.8564 27.4226C49.4752 27.7799 49.8564 28.4402 49.8564 29.1547V42.8453C49.8564 43.5598 49.4752 44.2201 48.8564 44.5774L37 51.4226C36.3812 51.7799 35.6188 51.7799 35 51.4226L23.1436 44.5774C22.5248 44.2201 22.1436 43.5598 22.1436 42.8453V29.1547C22.1436 28.4402 22.5248 27.7799 23.1436 27.4226L35 20.5774Z" fill="white" />
        </mask>
        <g mask={`url(#mask5_0_10706_${id})`}>
            <g opacity="0.3" style={{ mixBlendMode: "multiply" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M36 36L20 40V32L36 36ZM36 36L40 20H32L36 36ZM36 36L52 32V40L36 36ZM36 36L44.4853 21.8579L50.1421 27.5147L36 36ZM36 36L44.4853 50.1421L50.1421 44.4853L36 36ZM36 36L32 52H40L36 36ZM36 36L27.5147 50.1421L21.8578 44.4853L36 36Z" fill="#FFD640" />
                <path d="M27.5147 21.8579L21.8578 27.5147L36 36L27.5147 21.8579Z" fill="#FFD640" />
            </g>
            <path opacity="0.4" d="M48.6064 27.8556L36.75 21.0103C36.2859 20.7423 35.7141 20.7423 35.25 21.0103C33.8555 21.8154 32.8675 22.3858 32.2859 22.7216C31.0754 23.4205 30.0873 23.9909 29.3218 24.4329C28.0044 25.1935 26.0283 26.3344 23.3936 27.8556" stroke="white" strokeLinecap="round" />
            <path opacity="0.4" d="M48.6064 44.1099L36.75 50.9552C36.2859 51.2231 35.7141 51.2231 35.25 50.9552" stroke="white" strokeLinecap="round" />
            <path d="M35.25 21.0103C33.8555 21.8153 32.8675 22.3858 32.2859 22.7216" stroke="white" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter3_d_0_10706_${id})`}>
            <path d="M33.4498 32.49L35.9999 28.7689L38.5501 32.49L42.8771 33.7655L40.1263 37.3407L40.2503 41.8501L35.9999 40.3387L31.7496 41.8501L31.8736 37.3407L29.1228 33.7655L33.4498 32.49Z" fill="white" />
            <path d="M35.9997 27.7689C36.3295 27.7689 36.6385 27.9315 36.8249 28.2035L39.1736 31.6302L43.1599 32.806C43.4762 32.8993 43.7259 33.1428 43.8279 33.4564C43.9298 33.7701 43.8708 34.114 43.6696 34.3754L41.1355 37.6683L41.2497 41.8226C41.2588 42.1523 41.1044 42.4657 40.8376 42.6595C40.5709 42.8531 40.2253 42.9028 39.9148 42.7924L35.9997 41.3998L32.0847 42.7924C31.774 42.9028 31.4286 42.8533 31.1618 42.6595C30.895 42.4657 30.7407 42.1523 30.7497 41.8226L30.863 37.6683L28.3298 34.3754C28.1288 34.114 28.0697 33.77 28.1716 33.4564C28.2735 33.1429 28.5234 32.8994 28.8396 32.806L32.8249 31.6302L35.1755 28.2035L35.2507 28.1068C35.4391 27.8935 35.7113 27.769 35.9997 27.7689Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <path d="M33.4498 32.49L35.9999 28.7689L38.5501 32.49L42.8771 33.7655L40.1263 37.3407L40.2503 41.8501L35.9999 40.3387L31.7496 41.8501L31.8736 37.3407L29.1228 33.7655L33.4498 32.49Z" fill={`url(#paint9_linear_0_10706_${id})`} />
        <path opacity="0.4" d="M36 36V28.7689L33.4159 32.4388L36 36Z" fill={`url(#paint10_linear_0_10706_${id})`} />
        <path opacity="0.8" d="M36 36L33.4159 32.4387L29.1228 33.7654L36 36Z" fill={`url(#paint11_linear_0_10706_${id})`} />
        <path opacity="0.5" d="M36 36L31.8158 37.3613L31.7496 41.8501L36 36Z" fill={`url(#paint12_linear_0_10706_${id})`} />
        <path opacity="0.4" d="M40.2503 41.8501L40.1841 37.3613L36 36L40.2503 41.8501Z" fill={`url(#paint13_linear_0_10706_${id})`} />
        <path d="M40.1841 37.3613L42.8771 33.7655L36 36L40.1841 37.3613Z" fill="#FEBA1B" />
        <path opacity="0.6" d="M42.8771 33.7654L38.5841 32.4387L36 36L42.8771 33.7654Z" fill={`url(#paint14_linear_0_10706_${id})`} />
        <g filter={`url(#filter4_d_0_10706_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M46.9109 29.7799L46.3915 29.5751C46.0739 29.4498 45.918 29.0908 46.0432 28.7732C46.1061 28.6138 46.2322 28.4877 46.3915 28.4249L46.9109 28.2201C47.5098 27.9839 47.9838 27.5098 48.22 26.9109L48.4249 26.3916C48.5501 26.0739 48.9092 25.918 49.2268 26.0433C49.3861 26.1061 49.5122 26.2322 49.5751 26.3916L49.7799 26.9109C50.0161 27.5098 50.4902 27.9839 51.0891 28.2201L51.6084 28.4249C51.926 28.5502 52.082 28.9092 51.9567 29.2268C51.8939 29.3862 51.7677 29.5123 51.6084 29.5751L51.0891 29.7799C50.4902 30.0161 50.0161 30.4902 49.7799 31.0891L49.5751 31.6084C49.4498 31.9261 49.0908 32.082 48.7731 31.9567C48.6138 31.8939 48.4877 31.7678 48.4249 31.6084L48.22 31.0891C47.9838 30.4902 47.5098 30.0161 46.9109 29.7799Z" fill="white" />
        </g>
        <g filter={`url(#filter5_d_0_10706_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M24.6072 46.52L24.261 46.3834C24.0493 46.2999 23.9453 46.0605 24.0288 45.8488C24.0707 45.7426 24.1548 45.6585 24.261 45.6166L24.6072 45.48C25.0065 45.3226 25.3225 45.0065 25.48 44.6073L25.6166 44.261C25.7001 44.0493 25.9394 43.9453 26.1512 44.0289C26.2574 44.0707 26.3415 44.1548 26.3834 44.261L26.5199 44.6073C26.6774 45.0065 26.9934 45.3226 27.3927 45.48L27.7389 45.6166C27.9507 45.7001 28.0546 45.9395 27.9711 46.1512C27.9292 46.2574 27.8451 46.3415 27.7389 46.3834L27.3927 46.52C26.9934 46.6774 26.6774 46.9935 26.5199 47.3927L26.3834 47.739C26.2999 47.9507 26.0605 48.0547 25.8488 47.9711C25.7425 47.9293 25.6585 47.8452 25.6166 47.739L25.48 47.3927C25.3225 46.9935 25.0065 46.6774 24.6072 46.52Z" fill="white" />
        </g>
        <g filter={`url(#filter6_d_0_10706_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M20.7591 31.1499L20.3263 30.9793C20.0616 30.8749 19.9316 30.5757 20.036 30.311C20.0884 30.1782 20.1935 30.0731 20.3263 30.0207L20.7591 29.8501C21.2581 29.6532 21.6532 29.2582 21.85 28.7591L22.0207 28.3263C22.1251 28.0616 22.4243 27.9317 22.689 28.0361C22.8218 28.0884 22.9269 28.1935 22.9792 28.3263L23.1499 28.7591C23.3467 29.2582 23.7418 29.6532 24.2409 29.8501L24.6737 30.0207C24.9384 30.1251 25.0683 30.4243 24.9639 30.689C24.9115 30.8218 24.8064 30.9269 24.6737 30.9793L24.2409 31.1499C23.7418 31.3468 23.3467 31.7418 23.1499 32.2409L22.9792 32.6737C22.8748 32.9384 22.5756 33.0683 22.311 32.9639C22.1782 32.9116 22.0731 32.8065 22.0207 32.6737L21.85 32.2409C21.6532 31.7418 21.2581 31.3468 20.7591 31.1499Z" fill="white" />
        </g>
        <g filter={`url(#filter7_d_0_10706_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M46.4554 45.89L46.1958 45.7876C46.0369 45.7249 45.959 45.5454 46.0216 45.3866C46.053 45.3069 46.1161 45.2439 46.1958 45.2124L46.4554 45.11C46.7549 44.9919 46.9919 44.7549 47.11 44.4555L47.2124 44.1958C47.275 44.037 47.4546 43.959 47.6134 44.0216C47.693 44.0531 47.7561 44.1161 47.7875 44.1958L47.8899 44.4555C48.008 44.7549 48.2451 44.9919 48.5445 45.11L48.8042 45.2124C48.963 45.2751 49.041 45.4546 48.9783 45.6134C48.9469 45.6931 48.8839 45.7561 48.8042 45.7876L48.5445 45.89C48.2451 46.0081 48.008 46.2451 47.8899 46.5445L47.7875 46.8042C47.7249 46.963 47.5454 47.041 47.3866 46.9784C47.3069 46.9469 47.2438 46.8839 47.2124 46.8042L47.11 46.5445C46.9919 46.2451 46.7549 46.0081 46.4554 45.89Z" fill="white" />
        </g>
        <defs>
            <filter id={`filter0_d_0_10706_${id}`} x="10.7683" y="33" width="34.1599" height="40.5042" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.401412 0 0 0 0 0.333333 0 0 0 0 0.819608 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10706" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10706" result="shape" />
            </filter>
            <filter id={`filter1_d_0_10706_${id}`} x="27.0717" y="33" width="34.1599" height="40.5042" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.401412 0 0 0 0 0.333333 0 0 0 0 0.819608 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10706" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10706" result="shape" />
            </filter>
            <filter id={`filter2_d_0_10706_${id}`} x="19.1436" y="18.3094" width="33.7128" height="37.3812" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.927721 0 0 0 0 0.665867 0 0 0 0 0.0535899 0 0 0 0.4 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10706" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10706" result="shape" />
            </filter>
            <filter id={`filter3_d_0_10706_${id}`} x="25.1227" y="25.7689" width="21.7544" height="21.0812" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.996078 0 0 0 0 0.733333 0 0 0 0 0.105882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10706" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10706" result="shape" />
            </filter>
            <filter id={`filter4_d_0_10706_${id}`} x="44" y="24" width="10" height="10" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10706" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10706" result="shape" />
            </filter>
            <filter id={`filter5_d_0_10706_${id}`} x="22" y="42" width="8" height="8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10706" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10706" result="shape" />
            </filter>
            <filter id={`filter6_d_0_10706_${id}`} x="18" y="26" width="9" height="9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10706" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10706" result="shape" />
            </filter>
            <filter id={`filter7_d_0_10706_${id}`} x="44" y="42" width="7" height="7" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10706" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10706" result="shape" />
            </filter>
            <linearGradient id={`paint0_linear_0_10706_${id}`} x1="5" y1="6" x2="5" y2="66" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6F61EC" />
                <stop offset="1" stopColor="#3D2CD4" />
            </linearGradient>
            <linearGradient id={`paint1_linear_0_10706_${id}`} x1="59" y1="20" x2="59" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint2_linear_0_10706_${id}`} x1="59" y1="20" x2="59" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint3_linear_0_10706_${id}`} x1="13" y1="20" x2="13" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint4_linear_0_10706_${id}`} x1="13" y1="20" x2="13" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint5_linear_0_10706_${id}`} x1="23" y1="16.3538" x2="23" y2="33.0001" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint6_linear_0_10706_${id}`} x1="23" y1="16.3538" x2="23" y2="33.0001" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint7_linear_0_10706_${id}`} x1="13" y1="13" x2="13" y2="59" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE046" />
                <stop offset="1" stopColor="#F9B800" />
            </linearGradient>
            <linearGradient id={`paint8_linear_0_10706_${id}`} x1="20" y1="20" x2="20" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF550" />
                <stop offset="1" stopColor="#FFD541" />
            </linearGradient>
            <linearGradient id={`paint9_linear_0_10706_${id}`} x1="28.7688" y1="28.7689" x2="28.7688" y2="43.2311" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FCA50E" />
                <stop offset="1" stopColor="#FFC823" />
            </linearGradient>
            <linearGradient id={`paint10_linear_0_10706_${id}`} x1="33.4159" y1="26.9611" x2="29.1399" y2="30.0173" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFEC36" stopOpacity="0.467505" />
                <stop offset="1" stopColor="#FFF7AB" />
            </linearGradient>
            <linearGradient id={`paint11_linear_0_10706_${id}`} x1="29.1663" y1="33.3178" x2="33.1959" y2="38.278" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFED08" stopOpacity="0.8" />
                <stop offset="1" stopColor="white" />
            </linearGradient>
            <linearGradient id={`paint12_linear_0_10706_${id}`} x1="33.8748" y1="43.3126" x2="37.2899" y2="38.3502" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFED08" stopOpacity="0.01" />
                <stop offset="1" stopColor="#FFEF63" />
            </linearGradient>
            <linearGradient id={`paint13_linear_0_10706_${id}`} x1="36" y1="34.5375" x2="32.5849" y2="39.4999" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFEC36" stopOpacity="0.467505" />
                <stop offset="1" stopColor="#FFE94A" />
            </linearGradient>
            <linearGradient id={`paint14_linear_0_10706_${id}`} x1="36" y1="31.5484" x2="34.9198" y2="35.7203" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFEC36" stopOpacity="0.467505" />
                <stop offset="1" stopColor="#FFF7AB" />
            </linearGradient>
        </defs>
    </svg>

    );
};

export default GrandmasterSVG;
