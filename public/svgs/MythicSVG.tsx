"use client";

import { useId, type SVGProps } from 'react';

const MythicSVG = (props: SVGProps<SVGSVGElement>) => {
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
        <path fillRule="evenodd" clipRule="evenodd" d="M53 62C54.1046 62 55 62.8954 55 64C55 65.1046 54.1046 66 53 66H35C34.8824 66 34.7673 65.9899 34.6553 65.9704C28.2305 65.687 22.3308 63.3828 17.5761 59.6779C17.1894 59.3766 16.6067 58.8771 16.1748 58.5013C15.8054 58.1799 15.3333 58 14.8436 58H10C8.89543 58 8 57.1046 8 56C8 54.8954 8.89543 54 10 54H12C13.1046 54 14 53.1046 14 52C14 50.8954 13.1046 50 12 50H7C5.89543 50 5 49.1046 5 48C5 46.8954 5.89543 46 7 46H8C9.10457 46 10 45.1046 10 44C10 42.8954 9.10457 42 8 42C7.1913 42 6.49962 41.4171 6.36506 40.6196C6.31617 40.3299 6.27734 40.0966 6.27093 40.0492C6.09227 38.7249 6 37.3732 6 36C6 19.4315 19.4315 6 36 6C41 6 46 6 51 6C52.1046 6 53 6.89543 53 8C53 9.10457 52.1046 10 51 10H48C46.8954 10 46 10.8954 46 12C46 13.1046 46.8954 14 48 14H60C61.1046 14 62 14.8954 62 16C62 17.1038 61.1058 17.9988 60.0022 18L57 18C55.8954 18 55 18.8954 55 20C55 21.1046 55.8954 22 57 22H61.306C62.0624 22 62.7556 22.4259 63.0835 23.1075C63.2807 23.5171 63.488 23.959 63.6237 24.2783C65.1536 27.8793 66 31.8408 66 36C66 37.3068 65.9164 38.5942 65.7544 39.8569C65.7271 40.0692 65.6853 40.3418 65.6398 40.6208C65.5093 41.4213 64.8111 42 64 42C62.8954 42 62 42.8954 62 44C62 45.1046 62.8954 46 64 46H65C66.1046 46 67 46.8954 67 48C67 49.1046 66.1046 50 65 50H63.7162C62.9901 50 62.3224 50.3942 61.9597 51.0232C61.7241 51.4317 61.4621 51.8761 61.2675 52.1794C60.8114 52.8903 60.326 53.5807 59.8132 54.2489C59.2981 54.9201 58.7553 55.5688 58.1864 56.1934C57.8743 56.5362 57.3685 57.044 56.974 57.4341C56.605 57.799 56.1061 58 55.5871 58H50C48.8954 58 48 58.8954 48 60C48 61.0969 48.883 61.9875 49.9769 61.9999L53 62Z" fill={`url(#paint0_linear_0_10848_${id})`} />
        <g opacity="0.2">
            <path fillRule="evenodd" clipRule="evenodd" d="M32.9985 12.6767C34.8549 11.6049 37.1421 11.6049 38.9985 12.6767L54.6971 21.7403C56.5535 22.8121 57.6971 24.7928 57.6971 26.9364V45.0635C57.6971 47.2071 56.5535 49.1879 54.6971 50.2597L38.9985 59.3232C37.1421 60.395 34.8549 60.395 32.9985 59.3232L17.3 50.2597C15.4436 49.1879 14.3 47.2071 14.3 45.0635L14.3 26.9364C14.3 24.7928 15.4436 22.8121 17.3 21.7403L32.9985 12.6767Z" fill="#A4053A" fillOpacity="0.2" style={{ mixBlendMode: "multiply" }} />
        </g>
        <g filter={`url(#filter0_d_0_10848_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M22 33H38V63.382C38 64.1253 37.2177 64.6088 36.5528 64.2764L30 61L23.4472 64.2764C22.7823 64.6088 22 64.1253 22 63.382V33Z" fill="#7F45F6" />
        </g>
        <g filter={`url(#filter1_d_0_10848_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M34 33H50V63.382C50 64.1253 49.2177 64.6088 48.5528 64.2764L42 61L35.4472 64.2764C34.7823 64.6088 34 64.1253 34 63.382V33Z" fill="#7F45F6" />
        </g>
        <g filter={`url(#filter2_d_0_10848_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M28 38H44V68.382C44 69.1253 43.2177 69.6088 42.5528 69.2764L36 66L29.4472 69.2764C28.7823 69.6088 28 69.1253 28 68.382V38Z" fill="white" />
        </g>
        <mask id={`mask0_0_10848_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="28" y="38" width="16" height="32">
            <path fillRule="evenodd" clipRule="evenodd" d="M28 38H44V68.382C44 69.1253 43.2177 69.6088 42.5528 69.2764L36 66L29.4472 69.2764C28.7823 69.6088 28 69.1253 28 68.382V38Z" fill="white" />
        </mask>
        <g mask={`url(#mask0_0_10848_${id})`}>
            <rect x="32" y="38" width="8" height="32" fill="#F55462" />
        </g>
        <path opacity="0.8" fillRule="evenodd" clipRule="evenodd" d="M34 16.1547C35.2376 15.4401 36.7624 15.4401 38 16.1547L53.9186 25.3453C55.1562 26.0598 55.9186 27.3803 55.9186 28.8094V47.1906C55.9186 48.6196 55.1562 49.9401 53.9186 50.6547L38 59.8453C36.7624 60.5598 35.2376 60.5598 34 59.8453L18.0814 50.6547C16.8438 49.9401 16.0814 48.6196 16.0814 47.1906L16.0814 28.8094C16.0814 27.3803 16.8438 26.0598 18.0814 25.3453L34 16.1547Z" fill="#A4053A" fillOpacity="0.2" style={{ mixBlendMode: "multiply" }} />
        <path fillRule="evenodd" clipRule="evenodd" d="M19 24.5L14 22.5V21.5L9.19842 19.4993C8.7262 19.3026 8.24014 19.7491 8.39628 20.2363L14.0921 38.0074C14.1912 38.3164 14.4339 38.5581 14.7433 38.6558L19 40V24.5Z" fill={`url(#paint1_linear_0_10848_${id})`} stroke={`url(#paint2_linear_0_10848_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <mask id={`mask1_0_10848_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="8" y="20" width="12" height="20">
            <path fillRule="evenodd" clipRule="evenodd" d="M19 25.8541C19 25.0363 18.5021 24.3008 17.7428 23.9971L14.4679 22.6871C14.1853 22.5741 14 22.3005 14 21.9961C14 21.6957 13.8194 21.4247 13.5421 21.3092L11.9947 20.6644C10.4206 20.0086 8.80039 21.4971 9.32087 23.121L13.9343 37.5148C14.1323 38.1327 14.6178 38.6161 15.2366 38.8115L16.3978 39.1782C17.6868 39.5853 19 38.6229 19 37.2711V25.8541Z" fill="white" stroke="white" />
        </mask>
        <g mask={`url(#mask1_0_10848_${id})`}>
            <g opacity="0.6" filter={`url(#filter3_i_0_10848_${id})`} style={{ mixBlendMode: "multiply" }}>
                <path d="M19.1857 30.0358C19.4421 30.1383 19.5668 30.4293 19.4643 30.6857C19.3617 30.9421 19.0708 31.0668 18.8144 30.9642L13.8144 28.9642C13.6245 28.8883 13.5001 28.7045 13.5001 28.5V27.8333L7.80775 25.4615C7.55285 25.3553 7.43231 25.0626 7.53852 24.8077C7.64472 24.5528 7.93746 24.4323 8.19236 24.5385L14.1924 27.0385C14.3787 27.1161 14.5001 27.2982 14.5001 27.5V28.1615L19.1857 30.0358Z" fill="#FABC10" />
            </g>
            <g opacity="0.6" filter={`url(#filter4_i_0_10848_${id})`} style={{ mixBlendMode: "multiply" }}>
                <path d="M20.1857 36.0358C20.4421 36.1383 20.5668 36.4293 20.4643 36.6857C20.3617 36.9421 20.0708 37.0668 19.8144 36.9642L14.8144 34.9642C14.6245 34.8883 14.5001 34.7045 14.5001 34.5V33.8333L8.80775 31.4615C8.55285 31.3553 8.43231 31.0626 8.53852 30.8077C8.64472 30.5528 8.93746 30.4323 9.19236 30.5385L15.1924 33.0385C15.3787 33.1161 15.5001 33.2982 15.5001 33.5V34.1615L20.1857 36.0358Z" fill="#FABC10" />
            </g>
            <g opacity="0.2">
                <path fillRule="evenodd" clipRule="evenodd" d="M32.9986 12.6767C34.855 11.6049 37.1422 11.6049 38.9986 12.6767L54.6971 21.7403C56.5535 22.8121 57.6971 24.7928 57.6971 26.9364V45.0635C57.6971 47.2071 56.5535 49.1879 54.6971 50.2597L38.9986 59.3232C37.1422 60.395 34.855 60.395 32.9986 59.3232L17.3 50.2597C15.4436 49.1879 14.3 47.2071 14.3 45.0635L14.3 26.9364C14.3 24.7928 15.4436 22.8121 17.3 21.7403L32.9986 12.6767Z" fill="#A4053A" fillOpacity="0.2" style={{ mixBlendMode: "multiply" }} />
            </g>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M53 24.5L58 22.5V21.5L62.8016 19.4993C63.2739 19.3026 63.7599 19.7491 63.6038 20.2363L57.9079 38.0074C57.8089 38.3164 57.5661 38.5581 57.2568 38.6558L53 40V24.5Z" fill={`url(#paint3_linear_0_10848_${id})`} stroke={`url(#paint4_linear_0_10848_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <mask id={`mask2_0_10848_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="52" y="20" width="12" height="20">
            <path fillRule="evenodd" clipRule="evenodd" d="M53 25.8541C53 25.0363 53.4979 24.3008 54.2572 23.9971L57.5322 22.6871C57.8148 22.5741 58 22.3005 58 21.9961C58 21.6957 58.1807 21.4247 58.458 21.3092L60.0054 20.6644C61.5795 20.0086 63.1997 21.4971 62.6792 23.121L58.0658 37.5148C57.8678 38.1327 57.3822 38.6161 56.7635 38.8115L55.6023 39.1782C54.3133 39.5853 53 38.6229 53 37.2711V25.8541Z" fill="white" stroke="white" />
        </mask>
        <g mask={`url(#mask2_0_10848_${id})`}>
            <g opacity="0.6" filter={`url(#filter5_i_0_10848_${id})`} style={{ mixBlendMode: "multiply" }}>
                <path d="M52.8143 30.0358C52.5579 30.1383 52.4332 30.4293 52.5358 30.6857C52.6383 30.9421 52.9293 31.0668 53.1857 30.9642L58.1857 28.9642C58.3756 28.8883 58.5 28.7045 58.5 28.5V27.8333L64.1923 25.4615C64.4472 25.3553 64.5678 25.0626 64.4616 24.8077C64.3554 24.5528 64.0626 24.4323 63.8077 24.5385L57.8077 27.0385C57.6214 27.1161 57.5 27.2982 57.5 27.5V28.1615L52.8143 30.0358Z" fill="#FABC10" />
            </g>
            <g opacity="0.6" filter={`url(#filter6_i_0_10848_${id})`} style={{ mixBlendMode: "multiply" }}>
                <path d="M51.8143 36.0358C51.5579 36.1383 51.4332 36.4293 51.5358 36.6857C51.6383 36.9421 51.9293 37.0668 52.1857 36.9642L57.1857 34.9642C57.3756 34.8883 57.5 34.7045 57.5 34.5V33.8333L63.1923 31.4615C63.4472 31.3553 63.5678 31.0626 63.4616 30.8077C63.3554 30.5528 63.0626 30.4323 62.8077 30.5385L56.8077 33.0385C56.6214 33.1161 56.5 33.2982 56.5 33.5V34.1615L51.8143 36.0358Z" fill="#FABC10" />
            </g>
            <g opacity="0.2">
                <path fillRule="evenodd" clipRule="evenodd" d="M39.0015 12.6767C37.1451 11.6049 34.8579 11.6049 33.0015 12.6767L17.303 21.7403C15.4466 22.8121 14.303 24.7928 14.303 26.9364V45.0635C14.303 47.2071 15.4466 49.1879 17.303 50.2597L33.0015 59.3232C34.8579 60.395 37.1451 60.395 39.0015 59.3232L54.7 50.2597C56.5564 49.1879 57.7 47.2071 57.7 45.0635L57.7 26.9364C57.7 24.7928 56.5564 22.8121 54.7 21.7403L39.0015 12.6767Z" fill="#A4053A" fillOpacity="0.2" style={{ mixBlendMode: "multiply" }} />
            </g>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M18 42.0001L14.474 43.7631C14.1775 43.9113 13.9738 44.1968 13.93 44.5253L13.1603 50.2983C13.0946 50.7906 13.6214 51.145 14.0527 50.8985L20 47.5001L18 42.0001Z" fill={`url(#paint5_linear_0_10848_${id})`} stroke={`url(#paint6_linear_0_10848_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <mask id={`mask3_0_10848_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="13" y="42" width="8" height="9">
            <path fillRule="evenodd" clipRule="evenodd" d="M18.7669 44.109C18.3584 42.9856 17.0621 42.469 15.9929 43.0036L14.948 43.5261C14.3551 43.8225 13.9476 44.3935 13.86 45.0506L13.5341 47.4942C13.3153 49.1353 15.0714 50.3164 16.5089 49.495L18.5368 48.3362C19.3822 47.8531 19.7569 46.8313 19.4241 45.9162L18.7669 44.109Z" fill="white" stroke="white" />
        </mask>
        <g mask={`url(#mask3_0_10848_${id})`}>
            <g opacity="0.1">
                <path fillRule="evenodd" clipRule="evenodd" d="M32.78 12.6768C34.6364 11.6051 36.9236 11.6051 38.78 12.6768L54.4785 21.7404C56.3349 22.8122 57.4785 24.793 57.4785 26.9365V45.0636C57.4785 47.2072 56.3349 49.188 54.4785 50.2598L38.78 59.3233C36.9236 60.3951 34.6364 60.3951 32.78 59.3233L17.0815 50.2598C15.2251 49.188 14.0815 47.2072 14.0815 45.0636L14.0815 26.9365C14.0815 24.793 15.2251 22.8122 17.0815 21.7404L32.78 12.6768Z" fill="#F37E02" style={{ mixBlendMode: "multiply" }} />
            </g>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M54 42.0001L57.5261 43.7631C57.8225 43.9113 58.0263 44.1968 58.0701 44.5253L58.8398 50.2983C58.9054 50.7906 58.3786 51.145 57.9474 50.8985L52 47.5001L54 42.0001Z" fill={`url(#paint7_linear_0_10848_${id})`} stroke={`url(#paint8_linear_0_10848_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <mask id={`mask4_0_10848_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="51" y="41" width="9" height="11">
            <path fillRule="evenodd" clipRule="evenodd" d="M54 42.0001L57.5261 43.7631C57.8225 43.9113 58.0263 44.1968 58.0701 44.5253L58.8398 50.2983C58.9054 50.7906 58.3786 51.145 57.9474 50.8985L52 47.5001L54 42.0001Z" fill="white" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
        <g mask={`url(#mask4_0_10848_${id})`}>
            <g opacity="0.1">
                <path fillRule="evenodd" clipRule="evenodd" d="M39.2201 12.6768C37.3637 11.6051 35.0765 11.6051 33.2201 12.6768L17.5216 21.7404C15.6652 22.8122 14.5216 24.793 14.5216 26.9365V45.0636C14.5216 47.2072 15.6652 49.188 17.5216 50.2598L33.2201 59.3233C35.0765 60.3951 37.3637 60.3951 39.2201 59.3233L54.9186 50.2598C56.775 49.188 57.9186 47.2072 57.9186 45.0636L57.9186 26.9365C57.9186 24.793 56.775 22.8122 54.9186 21.7404L39.2201 12.6768Z" fill="#F37E02" style={{ mixBlendMode: "multiply" }} />
            </g>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M30.0204 23.6749C30.0204 25.2091 29.143 26.608 27.7619 27.2759L25.8026 28.2235C23.1464 29.508 20.0611 27.5729 20.0611 24.6224V19.7797C20.0611 19.0652 20.4423 18.405 21.0611 18.0477L28.5204 13.7411C29.1871 13.3562 30.0204 13.8373 30.0204 14.6071V23.6749Z" fill={`url(#paint9_linear_0_10848_${id})`} />
        <path opacity="0.4" d="M21.2066 18.5398L28.7812 14.1675" stroke="#FDEDAC" strokeLinecap="round" />
        <path fillRule="evenodd" clipRule="evenodd" d="M41.9797 23.6749C41.9797 25.2091 42.8571 26.608 44.2382 27.2759L46.1975 28.2235C48.8537 29.508 51.939 27.5729 51.939 24.6224V19.7797C51.939 19.0652 51.5578 18.405 50.939 18.0477L43.4797 13.7411C42.813 13.3562 41.9797 13.8373 41.9797 14.6071V23.6749Z" fill={`url(#paint10_linear_0_10848_${id})`} />
        <path opacity="0.4" d="M50.7934 18.5398L43.2188 14.1675" stroke="#FDEDAC" strokeLinecap="round" />
        <path fillRule="evenodd" clipRule="evenodd" d="M34 14.1547C35.2376 13.4402 36.7624 13.4402 38 14.1547L53.9186 23.3453C55.1562 24.0598 55.9186 25.3803 55.9186 26.8094V45.1906C55.9186 46.6197 55.1562 47.9402 53.9186 48.6547L38 57.8453C36.7624 58.5598 35.2376 58.5598 34 57.8453L18.0814 48.6547C16.8438 47.9402 16.0814 46.6197 16.0814 45.1906V26.8094C16.0814 25.3803 16.8438 24.0598 18.0814 23.3453L34 14.1547Z" fill={`url(#paint11_linear_0_10848_${id})`} stroke="#FFF04D" strokeOpacity="0.4" />
        <mask id={`mask5_0_10848_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="16" y="13" width="40" height="46">
            <path fillRule="evenodd" clipRule="evenodd" d="M35 13.5774C35.6188 13.2201 36.3812 13.2201 37 13.5774L54.9186 23.9226C55.5374 24.2799 55.9186 24.9402 55.9186 25.6547V46.3453C55.9186 47.0598 55.5374 47.7201 54.9186 48.0774L37 58.4226C36.3812 58.7799 35.6188 58.7799 35 58.4226L17.0814 48.0774C16.4626 47.7201 16.0814 47.0598 16.0814 46.3453V25.6547C16.0814 24.9402 16.4626 24.2799 17.0814 23.9226L35 13.5774Z" fill="white" />
        </mask>
        <g mask={`url(#mask5_0_10848_${id})`}>
            <g opacity="0.8" filter={`url(#filter7_i_0_10848_${id})`} style={{ mixBlendMode: "multiply" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M51.671 25.1885L37.5166 17.0068C36.5781 16.4644 35.4219 16.4644 34.4835 17.0068L20.329 25.1885C19.3906 25.7309 18.8125 26.7334 18.8125 27.8183V33.7207L17.665 35.4439C17.4415 35.7796 17.4415 36.2167 17.665 36.5524L18.8125 38.2757V44.1816C18.8125 45.2665 19.3906 46.269 20.329 46.8115L34.4835 54.9931C35.4219 55.5356 36.5781 55.5356 37.5166 54.9931L51.671 46.8115C52.6094 46.269 53.1875 45.2665 53.1875 44.1816V38.2757L54.335 36.5524C54.5586 36.2167 54.5586 35.7796 54.335 35.4439L53.1875 33.7207V27.8183C53.1875 26.7334 52.6094 25.7309 51.671 25.1885ZM19.8235 38.2757V44.1816C19.8235 44.9049 20.2089 45.5732 20.8345 45.9348L34.989 54.1165C35.6146 54.4781 36.3854 54.4781 37.011 54.1165L51.1655 45.9348C51.7911 45.5732 52.1765 44.9049 52.1765 44.1816V38.2757L51.029 36.5524C50.8055 36.2167 50.8055 35.7796 51.029 35.4439L52.1765 33.7207V27.8183C52.1765 27.095 51.7911 26.4267 51.1655 26.0651L37.011 17.8834C36.3854 17.5218 35.6146 17.5218 34.989 17.8834L20.8345 26.0651C20.2089 26.4267 19.8235 27.095 19.8235 27.8183V33.7207L20.971 35.4439C21.1945 35.7796 21.1945 36.2167 20.971 36.5524L19.8235 38.2757Z" fill="#FABC10" />
            </g>
            <path d="M37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3315 23.7783C17.2485 24.4035 16.5815 25.5589 16.5815 26.8094L16.5815 45.1906C16.5815 46.441 17.2485 47.5964 18.3315 48.2217L34.25 57.4123C35.3329 58.0375 36.6671 58.0375 37.75 57.4123L53.6686 48.2217C54.7515 47.5964 55.4186 46.441 55.4186 45.1906V26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877Z" stroke="#FAB90A" />
            <path opacity="0.4" d="M37.75 57.4123C39.6222 56.3314 40.9487 55.5655 41.7297 55.1146" stroke="white" strokeLinecap="round" />
            <path d="M55.4186 45.1906V26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3315 23.7783C17.2485 24.4035 16.5815 25.5589 16.5815 26.8094L16.5815 45.1906" stroke="#FAC81C" strokeLinecap="round" />
            <path opacity="0.6" d="M55.4186 26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3315 23.7783C17.2485 24.4035 16.5815 25.5589 16.5815 26.8094" stroke="#FDDB3D" strokeLinecap="round" />
            <path opacity="0.6" d="M37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877C34.25 14.5877 28.9438 17.6512 26.2907 19.183" stroke="white" strokeLinecap="round" />
            <path d="M34.25 14.5876C34.25 14.5876 31.4418 16.209 30.2704 16.8853" stroke="white" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter8_d_0_10848_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M35 20.5774C35.6188 20.2201 36.3812 20.2201 37 20.5774L48.8564 27.4226C49.4752 27.7799 49.8564 28.4402 49.8564 29.1547V42.8453C49.8564 43.5598 49.4752 44.2201 48.8564 44.5774L37 51.4226C36.3812 51.7799 35.6188 51.7799 35 51.4226L23.1436 44.5774C22.5248 44.2201 22.1436 43.5598 22.1436 42.8453V29.1547C22.1436 28.4402 22.5248 27.7799 23.1436 27.4226L35 20.5774Z" fill={`url(#paint12_linear_0_10848_${id})`} />
            <path d="M34.75 20.1445C35.5235 19.6979 36.4765 19.6979 37.25 20.1445L49.1065 26.9893C49.8798 27.4358 50.3563 28.2613 50.3565 29.1543V42.8457C50.3563 43.7387 49.8798 44.5642 49.1065 45.0107L37.25 51.8555C36.4765 52.3021 35.5235 52.3021 34.75 51.8555L22.8936 45.0107C22.1202 44.5642 21.6437 43.7387 21.6436 42.8457V29.1543C21.6437 28.2613 22.1202 27.4358 22.8936 26.9893L34.75 20.1445Z" stroke="#F5900D" strokeOpacity="0.1" style={{ mixBlendMode: "multiply" }} />
        </g>
        <mask id={`mask6_0_10848_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="20" width="28" height="32">
            <path fillRule="evenodd" clipRule="evenodd" d="M35 20.5774C35.6188 20.2201 36.3812 20.2201 37 20.5774L48.8564 27.4226C49.4752 27.7799 49.8564 28.4402 49.8564 29.1547V42.8453C49.8564 43.5598 49.4752 44.2201 48.8564 44.5774L37 51.4226C36.3812 51.7799 35.6188 51.7799 35 51.4226L23.1436 44.5774C22.5248 44.2201 22.1436 43.5598 22.1436 42.8453V29.1547C22.1436 28.4402 22.5248 27.7799 23.1436 27.4226L35 20.5774Z" fill="white" />
        </mask>
        <g mask={`url(#mask6_0_10848_${id})`}>
            <g opacity="0.3" style={{ mixBlendMode: "multiply" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M36 36L20 40V32L36 36ZM36 36L40 20H32L36 36ZM36 36L52 32V40L36 36ZM36 36L44.4853 21.8579L50.1421 27.5147L36 36ZM36 36L44.4853 50.1421L50.1421 44.4853L36 36ZM36 36L32 52H40L36 36ZM36 36L27.5147 50.1421L21.8579 44.4853L36 36Z" fill="#FFD640" />
                <path d="M27.5147 21.8579L21.8579 27.5147L36 36L27.5147 21.8579Z" fill="#FFD640" />
            </g>
            <path opacity="0.4" d="M48.6064 27.8557L36.75 21.0104C36.2859 20.7425 35.7141 20.7425 35.25 21.0104C33.8556 21.8155 32.8676 22.3859 32.2859 22.7217C31.0754 23.4206 30.0874 23.9911 29.3218 24.4331C28.0044 25.1936 26.0284 26.3345 23.3936 27.8557" stroke="white" strokeLinecap="round" />
            <path d="M35.25 21.0104C33.8556 21.8154 32.8676 22.3859 32.2859 22.7217" stroke="white" strokeLinecap="round" />
            <path opacity="0.4" d="M48.6064 44.11L36.75 50.9553C36.2859 51.2232 35.7141 51.2232 35.25 50.9553" stroke="white" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter9_d_0_10848_${id})`}>
            <path d="M29.7778 30.5573L36 26.8334L42.2222 30.5573V41.4427L36 45.1667L29.7778 41.4427V30.5573Z" fill="white" />
            <path d="M43.2221 41.4427C43.2221 41.7944 43.0375 42.1206 42.7358 42.3011L36.5131 46.0248C36.197 46.2138 35.8028 46.2138 35.4868 46.0248L29.2641 42.3011C28.9624 42.1206 28.7778 41.7944 28.7778 41.4427V30.557C28.7779 30.2056 28.9626 29.8801 29.2641 29.6996L35.4868 25.975L35.6088 25.9135C35.9003 25.7895 36.2366 25.8097 36.5131 25.975L42.7358 29.6996C43.0373 29.8801 43.222 30.2055 43.2221 30.557V41.4427Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M29.7778 30.5573L36 26.8334V30.8438L33.1717 32.5625L29.7778 30.5573Z" fill={`url(#paint13_linear_0_10848_${id})`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M29.7778 30.5574V41.4428L33.1717 39.4376V32.5626L29.7778 30.5574Z" fill={`url(#paint14_linear_0_10848_${id})`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M36 45.1667L29.7778 41.4428L33.1717 39.4376L36 41.1563V45.1667Z" fill={`url(#paint15_linear_0_10848_${id})`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M36 45.1667L42.2222 41.4428L38.8283 39.4376L36 41.1563V45.1667Z" fill={`url(#paint16_linear_0_10848_${id})`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M42.2222 30.5574V41.4428L38.8283 39.4376V32.5626L42.2222 30.5574Z" fill={`url(#paint17_linear_0_10848_${id})`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M42.2222 30.5573L36 26.8334V30.8438L38.8283 32.5625L42.2222 30.5573Z" fill={`url(#paint18_linear_0_10848_${id})`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M33.1718 39.4375L36.0001 41.1562L38.8283 39.4375V32.5625L36.0001 30.8438L33.1718 32.5625V39.4375Z" fill={`url(#paint19_linear_0_10848_${id})`} />
        <g filter={`url(#filter10_d_0_10848_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M46.9109 29.7799L46.3916 29.5751C46.074 29.4498 45.918 29.0908 46.0433 28.7732C46.1061 28.6138 46.2323 28.4877 46.3916 28.4249L46.9109 28.2201C47.5098 27.9839 47.9839 27.5098 48.2201 26.9109L48.4249 26.3916C48.5502 26.0739 48.9092 25.918 49.2268 26.0433C49.3862 26.1061 49.5123 26.2322 49.5751 26.3916L49.7799 26.9109C50.0161 27.5098 50.4902 27.9839 51.0891 28.2201L51.6084 28.4249C51.9261 28.5502 52.082 28.9092 51.9567 29.2268C51.8939 29.3862 51.7678 29.5123 51.6084 29.5751L51.0891 29.7799C50.4902 30.0161 50.0161 30.4902 49.7799 31.0891L49.5751 31.6084C49.4499 31.9261 49.0908 32.082 48.7732 31.9567C48.6139 31.8939 48.4877 31.7678 48.4249 31.6084L48.2201 31.0891C47.9839 30.4902 47.5098 30.0161 46.9109 29.7799Z" fill="white" />
        </g>
        <g filter={`url(#filter11_d_0_10848_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M24.6073 46.52L24.2611 46.3834C24.0493 46.2999 23.9454 46.0605 24.0289 45.8488C24.0708 45.7426 24.1548 45.6585 24.2611 45.6166L24.6073 45.48C25.0065 45.3226 25.3226 45.0065 25.4801 44.6073L25.6166 44.261C25.7001 44.0493 25.9395 43.9453 26.1512 44.0289C26.2574 44.0707 26.3415 44.1548 26.3834 44.261L26.52 44.6073C26.6774 45.0065 26.9935 45.3226 27.3927 45.48L27.739 45.6166C27.9507 45.7001 28.0547 45.9395 27.9712 46.1512C27.9293 46.2574 27.8452 46.3415 27.739 46.3834L27.3927 46.52C26.9935 46.6774 26.6774 46.9935 26.52 47.3927L26.3834 47.739C26.2999 47.9507 26.0606 48.0547 25.8488 47.9711C25.7426 47.9293 25.6585 47.8452 25.6166 47.739L25.4801 47.3927C25.3226 46.9935 25.0065 46.6774 24.6073 46.52Z" fill="white" />
        </g>
        <g filter={`url(#filter12_d_0_10848_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M20.7591 31.1499L20.3263 30.9793C20.0616 30.8749 19.9317 30.5757 20.0361 30.311C20.0884 30.1782 20.1935 30.0731 20.3263 30.0207L20.7591 29.8501C21.2582 29.6532 21.6532 29.2582 21.8501 28.7591L22.0208 28.3263C22.1251 28.0616 22.4243 27.9317 22.689 28.0361C22.8218 28.0884 22.9269 28.1935 22.9793 28.3263L23.15 28.7591C23.3468 29.2582 23.7419 29.6532 24.2409 29.8501L24.6737 30.0207C24.9384 30.1251 25.0683 30.4243 24.964 30.689C24.9116 30.8218 24.8065 30.9269 24.6737 30.9793L24.2409 31.1499C23.7419 31.3468 23.3468 31.7418 23.15 32.2409L22.9793 32.6737C22.8749 32.9384 22.5757 33.0683 22.311 32.9639C22.1782 32.9116 22.0731 32.8065 22.0208 32.6737L21.8501 32.2409C21.6532 31.7418 21.2582 31.3468 20.7591 31.1499Z" fill="white" />
        </g>
        <g filter={`url(#filter13_d_0_10848_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M46.4555 44.89L46.1958 44.7876C46.037 44.7249 45.959 44.5454 46.0217 44.3866C46.0531 44.3069 46.1161 44.2439 46.1958 44.2124L46.4555 44.11C46.7549 43.9919 46.9919 43.7549 47.11 43.4555L47.2125 43.1958C47.2751 43.037 47.4546 42.959 47.6134 43.0216C47.6931 43.0531 47.7562 43.1161 47.7876 43.1958L47.89 43.4555C48.0081 43.7549 48.2451 43.9919 48.5446 44.11L48.8042 44.2124C48.963 44.2751 49.041 44.4546 48.9784 44.6134C48.947 44.6931 48.8839 44.7561 48.8042 44.7876L48.5446 44.89C48.2451 45.0081 48.0081 45.2451 47.89 45.5445L47.7876 45.8042C47.7249 45.963 47.5454 46.041 47.3866 45.9784C47.3069 45.9469 47.2439 45.8839 47.2125 45.8042L47.11 45.5445C46.9919 45.2451 46.7549 45.0081 46.4555 44.89Z" fill="white" />
        </g>
        <defs>
            <filter id={`filter0_d_0_10848_${id}`} x="20" y="33" width="20" height="35.3832" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.921569 0 0 0 0 0.215686 0 0 0 0 0.305882 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10848" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10848" result="shape" />
            </filter>
            <filter id={`filter1_d_0_10848_${id}`} x="32" y="33" width="20" height="35.3832" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.921569 0 0 0 0 0.215686 0 0 0 0 0.305882 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10848" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10848" result="shape" />
            </filter>
            <filter id={`filter2_d_0_10848_${id}`} x="26" y="38" width="20" height="35.3832" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.921569 0 0 0 0 0.215686 0 0 0 0 0.305882 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10848" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10848" result="shape" />
            </filter>
            <filter id={`filter3_i_0_10848_${id}`} x="7.49992" y="24.4999" width="12.0003" height="7.50024" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10848" />
            </filter>
            <filter id={`filter4_i_0_10848_${id}`} x="8.49992" y="30.4999" width="12.0003" height="7.50024" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10848" />
            </filter>
            <filter id={`filter5_i_0_10848_${id}`} x="52.4999" y="24.4999" width="12.0003" height="7.50024" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10848" />
            </filter>
            <filter id={`filter6_i_0_10848_${id}`} x="51.4999" y="30.4999" width="12.0003" height="7.50024" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10848" />
            </filter>
            <filter id={`filter7_i_0_10848_${id}`} x="17.4973" y="16.6" width="37.0053" height="39.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10848" />
            </filter>
            <filter id={`filter8_d_0_10848_${id}`} x="19.1436" y="18.3094" width="33.7128" height="37.3812" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.927721 0 0 0 0 0.665867 0 0 0 0 0.0535899 0 0 0 0.4 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10848" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10848" result="shape" />
            </filter>
            <filter id={`filter9_d_0_10848_${id}`} x="25.7778" y="23.8334" width="20.4445" height="26.3333" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.996078 0 0 0 0 0.733333 0 0 0 0 0.105882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10848" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10848" result="shape" />
            </filter>
            <filter id={`filter10_d_0_10848_${id}`} x="44" y="24" width="10" height="10" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10848" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10848" result="shape" />
            </filter>
            <filter id={`filter11_d_0_10848_${id}`} x="22" y="42" width="8" height="8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10848" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10848" result="shape" />
            </filter>
            <filter id={`filter12_d_0_10848_${id}`} x="18" y="26" width="9" height="9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10848" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10848" result="shape" />
            </filter>
            <filter id={`filter13_d_0_10848_${id}`} x="44" y="41" width="7" height="7" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10848" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10848" result="shape" />
            </filter>
            <linearGradient id={`paint0_linear_0_10848_${id}`} x1="5" y1="6" x2="5" y2="66" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF7F7D" />
                <stop offset="1" stopColor="#EC2E4A" />
            </linearGradient>
            <linearGradient id={`paint1_linear_0_10848_${id}`} x1="8.00003" y1="19" x2="8.00003" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint2_linear_0_10848_${id}`} x1="8.00003" y1="19" x2="8.00003" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint3_linear_0_10848_${id}`} x1="64" y1="19" x2="64" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint4_linear_0_10848_${id}`} x1="64" y1="19" x2="64" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint5_linear_0_10848_${id}`} x1="13" y1="42.0001" x2="13" y2="51.5001" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint6_linear_0_10848_${id}`} x1="13" y1="42.0001" x2="13" y2="51.5001" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint7_linear_0_10848_${id}`} x1="59" y1="42.0001" x2="59" y2="51.5001" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint8_linear_0_10848_${id}`} x1="59" y1="42.0001" x2="59" y2="51.5001" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint9_linear_0_10848_${id}`} x1="20.0611" y1="13.6069" x2="20.0611" y2="28.9387" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBCC24" />
                <stop offset="1" stopColor="#F9B800" />
            </linearGradient>
            <linearGradient id={`paint10_linear_0_10848_${id}`} x1="51.939" y1="13.6069" x2="51.939" y2="28.9387" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBCC24" />
                <stop offset="1" stopColor="#F9B800" />
            </linearGradient>
            <linearGradient id={`paint11_linear_0_10848_${id}`} x1="13" y1="13" x2="13" y2="59" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE046" />
                <stop offset="1" stopColor="#F9B800" />
            </linearGradient>
            <linearGradient id={`paint12_linear_0_10848_${id}`} x1="20" y1="20" x2="20" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF550" />
                <stop offset="1" stopColor="#FFD541" />
            </linearGradient>
            <linearGradient id={`paint13_linear_0_10848_${id}`} x1="36.4699" y1="30.7863" x2="34.776" y2="27.6091" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFD3D3" />
                <stop offset="1" stopColor="#FF7E8A" />
            </linearGradient>
            <linearGradient id={`paint14_linear_0_10848_${id}`} x1="33.1717" y1="41.4428" x2="33.1717" y2="30.5574" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF8B89" />
                <stop offset="1" stopColor="#F34C5D" />
            </linearGradient>
            <linearGradient id={`paint15_linear_0_10848_${id}`} x1="34.4936" y1="43.9549" x2="35.8599" y2="40.9108" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF7F7D" />
                <stop offset="1" stopColor="#F21248" />
            </linearGradient>
            <linearGradient id={`paint16_linear_0_10848_${id}`} x1="42.2222" y1="45.1667" x2="42.2222" y2="39.4376" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF8B89" />
                <stop offset="1" stopColor="#F34C5D" />
            </linearGradient>
            <linearGradient id={`paint17_linear_0_10848_${id}`} x1="42.2222" y1="41.4428" x2="42.2222" y2="30.5574" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF8B89" />
                <stop offset="1" stopColor="#F34C5D" />
            </linearGradient>
            <linearGradient id={`paint18_linear_0_10848_${id}`} x1="38.9222" y1="32.4881" x2="40.4562" y2="29.517" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF7F7D" />
                <stop offset="1" stopColor="#F21248" />
            </linearGradient>
            <linearGradient id={`paint19_linear_0_10848_${id}`} x1="38.8283" y1="41.1562" x2="38.8283" y2="30.8438" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF7F7D" />
                <stop offset="1" stopColor="#F21248" />
            </linearGradient>
        </defs>
    </svg>
    );
};

export default MythicSVG;
