"use client";

import { useId, type SVGProps } from 'react';

const EliteSVG = (props: SVGProps<SVGSVGElement>) => {
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
        <path fillRule="evenodd" clipRule="evenodd" d="M53 62C54.1046 62 55 62.8954 55 64C55 65.1046 54.1046 66 53 66H35C34.8824 66 34.7673 65.9899 34.6553 65.9704C28.2305 65.687 22.3308 63.3828 17.5761 59.6779C17.1894 59.3766 16.6067 58.8771 16.1748 58.5013C15.8054 58.1799 15.3333 58 14.8436 58H10C8.89543 58 8 57.1046 8 56C8 54.8954 8.89543 54 10 54H12C13.1046 54 14 53.1046 14 52C14 50.8954 13.1046 50 12 50H7C5.89543 50 5 49.1046 5 48C5 46.8954 5.89543 46 7 46H8C9.10457 46 10 45.1046 10 44C10 42.8954 9.10457 42 8 42C7.1913 42 6.49962 41.4171 6.36506 40.6196C6.31617 40.3299 6.27734 40.0966 6.27093 40.0492C6.09227 38.7249 6 37.3732 6 36C6 19.4315 19.4315 6 36 6C41 6 46 6 51 6C52.1046 6 53 6.89543 53 8C53 9.10457 52.1046 10 51 10H48C46.8954 10 46 10.8954 46 12C46 13.1046 46.8954 14 48 14H60C61.1046 14 62 14.8954 62 16C62 17.1038 61.1058 17.9988 60.0022 18L57 18C55.8954 18 55 18.8954 55 20C55 21.1046 55.8954 22 57 22H61.306C62.0624 22 62.7556 22.4259 63.0835 23.1075C63.2807 23.5171 63.488 23.959 63.6237 24.2783C65.1536 27.8793 66 31.8408 66 36C66 37.3068 65.9164 38.5942 65.7544 39.8569C65.7271 40.0692 65.6853 40.3418 65.6398 40.6208C65.5093 41.4213 64.8111 42 64 42C62.8954 42 62 42.8954 62 44C62 45.1046 62.8954 46 64 46H65C66.1046 46 67 46.8954 67 48C67 49.1046 66.1046 50 65 50H63.7162C62.9901 50 62.3224 50.3942 61.9597 51.0232C61.7241 51.4317 61.4621 51.8761 61.2675 52.1794C60.8114 52.8903 60.326 53.5807 59.8132 54.2489C59.2981 54.9201 58.7553 55.5688 58.1864 56.1934C57.8743 56.5362 57.3685 57.044 56.974 57.4341C56.605 57.799 56.1061 58 55.5871 58H50C48.8954 58 48 58.8954 48 60C48 61.0969 48.883 61.9875 49.9769 61.9999L53 62Z" fill={`url(#paint0_linear_0_10773_${id})`} />
        <g opacity="0.1">
            <path fillRule="evenodd" clipRule="evenodd" d="M32.9985 12.6767C34.8549 11.6049 37.1421 11.6049 38.9985 12.6767L54.6971 21.7403C56.5535 22.8121 57.6971 24.7928 57.6971 26.9364V45.0635C57.6971 47.2071 56.5535 49.1879 54.6971 50.2597L38.9985 59.3232C37.1421 60.395 34.8549 60.395 32.9985 59.3232L17.3 50.2597C15.4436 49.1879 14.3 47.2071 14.3 45.0635L14.3 26.9364C14.3 24.7928 15.4436 22.8121 17.3 21.7403L32.9985 12.6767Z" fill="#7705A4" style={{ mixBlendMode: "multiply" }} />
        </g>
        <g filter={`url(#filter0_d_0_10773_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M22 33H38V63.382C38 64.1253 37.2177 64.6088 36.5528 64.2764L30 61L23.4472 64.2764C22.7823 64.6088 22 64.1253 22 63.382V33Z" fill="#32B4FF" />
        </g>
        <g filter={`url(#filter1_d_0_10773_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M34 33H50V63.382C50 64.1253 49.2177 64.6088 48.5528 64.2764L42 61L35.4472 64.2764C34.7823 64.6088 34 64.1253 34 63.382V33Z" fill="#32B4FF" />
        </g>
        <g filter={`url(#filter2_d_0_10773_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M28 38H44V68.382C44 69.1253 43.2177 69.6088 42.5528 69.2764L36 66L29.4472 69.2764C28.7823 69.6088 28 69.1253 28 68.382V38Z" fill="white" />
        </g>
        <mask id={`mask0_0_10773_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="28" y="38" width="16" height="32">
            <path fillRule="evenodd" clipRule="evenodd" d="M28 38H44V68.382C44 69.1253 43.2177 69.6088 42.5528 69.2764L36 66L29.4472 69.2764C28.7823 69.6088 28 69.1253 28 68.382V38Z" fill="white" />
        </mask>
        <g mask={`url(#mask0_0_10773_${id})`}>
            <rect x="32" y="38" width="8" height="32" fill="#F55462" />
        </g>
        <path opacity="0.2" fillRule="evenodd" clipRule="evenodd" d="M34 16.1547C35.2376 15.4401 36.7624 15.4401 38 16.1547L53.9186 25.3453C55.1562 26.0598 55.9186 27.3803 55.9186 28.8094V47.1906C55.9186 48.6196 55.1562 49.9401 53.9186 50.6547L38 59.8453C36.7624 60.5598 35.2376 60.5598 34 59.8453L18.0814 50.6547C16.8438 49.9401 16.0814 48.6196 16.0814 47.1906L16.0814 28.8094C16.0814 27.3803 16.8438 26.0598 18.0814 25.3453L34 16.1547Z" fill="#7705A4" style={{ mixBlendMode: "multiply" }} />
        <path fillRule="evenodd" clipRule="evenodd" d="M54 22.677C54 22.2681 54.249 21.9004 54.6286 21.7486L58.1772 20.3291C58.5713 20.1715 59 20.4617 59 20.8862V36.323C59 36.7319 58.7511 37.0996 58.3714 37.2514L54 39V22.677Z" fill={`url(#paint1_linear_0_10773_${id})`} stroke={`url(#paint2_linear_0_10773_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <mask id={`mask1_0_10773_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="53" y="19" width="7" height="21">
            <path fillRule="evenodd" clipRule="evenodd" d="M54 22.677C54 22.2681 54.249 21.9004 54.6286 21.7486L58.1772 20.3291C58.5713 20.1715 59 20.4617 59 20.8862V36.323C59 36.7319 58.7511 37.0996 58.3714 37.2514L54 39V22.677Z" fill="white" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
        <g mask={`url(#mask1_0_10773_${id})`}>
            <g opacity="0.6" filter={`url(#filter3_i_0_10773_${id})`} style={{ mixBlendMode: "multiply" }}>
                <path d="M54.5 28.8333L60.1923 26.4615C60.4472 26.3553 60.5678 26.0626 60.4616 25.8077C60.3554 25.5528 60.0626 25.4323 59.8077 25.5385L53.8077 28.0385C53.6214 28.1161 54.5 28.8333 54.5 28.8333Z" fill="#FABC10" />
            </g>
            <g opacity="0.6" filter={`url(#filter4_i_0_10773_${id})`} style={{ mixBlendMode: "multiply" }}>
                <path d="M54.5 34.8333L60.1923 32.4615C60.4472 32.3553 60.5678 32.0626 60.4616 31.8077C60.3554 31.5528 60.0626 31.4323 59.8077 31.5385L53.8077 34.0385C53.6214 34.1161 54.5 34.8333 54.5 34.8333Z" fill="#FABC10" />
            </g>
            <g opacity="0.04">
                <path fillRule="evenodd" clipRule="evenodd" d="M38.9986 12.6767C37.1422 11.6049 34.855 11.6049 32.9986 12.6767L17.3001 21.7403C15.4436 22.8121 14.3001 24.7928 14.3001 26.9364V45.0635C14.3001 47.2071 15.4436 49.1879 17.3001 50.2597L32.9986 59.3232C34.855 60.395 37.1422 60.395 38.9986 59.3232L54.6971 50.2597C56.5535 49.1879 57.6971 47.2071 57.6971 45.0635L57.6971 26.9364C57.6971 24.7928 56.5535 22.8121 54.6971 21.7403L38.9986 12.6767Z" fill="#7705A4" style={{ mixBlendMode: "multiply" }} />
            </g>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M18 22.677C18 22.2681 17.7511 21.9004 17.3714 21.7486L13.8229 20.3291C13.4287 20.1715 13 20.4617 13 20.8862V36.323C13 36.7319 13.249 37.0996 13.6286 37.2514L18 39V22.677Z" fill={`url(#paint3_linear_0_10773_${id})`} stroke={`url(#paint4_linear_0_10773_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <mask id={`mask2_0_10773_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="12" y="19" width="7" height="21">
            <path fillRule="evenodd" clipRule="evenodd" d="M18 22.677C18 22.2681 17.7511 21.9004 17.3714 21.7486L13.8229 20.3291C13.4287 20.1715 13 20.4617 13 20.8862V36.323C13 36.7319 13.249 37.0996 13.6286 37.2514L18 39V22.677Z" fill="white" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
        <g mask={`url(#mask2_0_10773_${id})`}>
            <g opacity="0.6" filter={`url(#filter5_i_0_10773_${id})`} style={{ mixBlendMode: "multiply" }}>
                <path d="M17.5001 28.8333L11.8077 26.4615C11.5528 26.3553 11.4323 26.0626 11.5385 25.8077C11.6447 25.5528 11.9375 25.4323 12.1924 25.5385L18.1924 28.0385C18.3787 28.1161 17.5001 28.8333 17.5001 28.8333Z" fill="#FABC10" />
            </g>
            <g opacity="0.6" filter={`url(#filter6_i_0_10773_${id})`} style={{ mixBlendMode: "multiply" }}>
                <path d="M17.5001 34.8333L11.8077 32.4615C11.5528 32.3553 11.4323 32.0626 11.5385 31.8077C11.6447 31.5528 11.9375 31.4323 12.1924 31.5385L18.1924 34.0385C18.3787 34.1161 17.5001 34.8333 17.5001 34.8333Z" fill="#FABC10" />
            </g>
            <g opacity="0.04">
                <path fillRule="evenodd" clipRule="evenodd" d="M32.9986 12.6767C34.855 11.6049 37.1422 11.6049 38.9986 12.6767L54.6971 21.7403C56.5535 22.8121 57.6971 24.7928 57.6971 26.9364V45.0635C57.6971 47.2071 56.5535 49.1879 54.6971 50.2597L38.9986 59.3232C37.1422 60.395 34.855 60.395 32.9986 59.3232L17.3 50.2597C15.4436 49.1879 14.3 47.2071 14.3 45.0635L14.3 26.9364C14.3 24.7928 15.4436 22.8121 17.3 21.7403L32.9986 12.6767Z" fill="#7705A4" style={{ mixBlendMode: "multiply" }} />
            </g>
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M50 17.3258C50 16.6614 49.3641 16.1818 48.7253 16.3643L36 20.0001L23.2748 16.3643C22.6359 16.1818 22 16.6614 22 17.3258V32.0001C22 32.5524 22.4477 33.0001 23 33.0001H49C49.5523 33.0001 50 32.5524 50 32.0001V17.3258Z" fill={`url(#paint5_linear_0_10773_${id})`} stroke={`url(#paint6_linear_0_10773_${id})`} strokeLinecap="round" strokeLinejoin="round" />
        <path fillRule="evenodd" clipRule="evenodd" d="M34 14.1547C35.2376 13.4402 36.7624 13.4402 38 14.1547L53.9186 23.3453C55.1562 24.0598 55.9186 25.3803 55.9186 26.8094V45.1906C55.9186 46.6197 55.1562 47.9402 53.9186 48.6547L38 57.8453C36.7624 58.5598 35.2376 58.5598 34 57.8453L18.0814 48.6547C16.8438 47.9402 16.0814 46.6197 16.0814 45.1906V26.8094C16.0814 25.3803 16.8438 24.0598 18.0814 23.3453L34 14.1547Z" fill={`url(#paint7_linear_0_10773_${id})`} stroke="#FFF04D" strokeOpacity="0.4" />
        <g opacity="0.8" filter={`url(#filter7_i_0_10773_${id})`} style={{ mixBlendMode: "multiply" }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M51.671 25.1885L37.5165 17.0068C36.5781 16.4644 35.4219 16.4644 34.4834 17.0068L20.329 25.1885C19.3906 25.7309 18.8124 26.7334 18.8124 27.8183V33.7207L17.665 35.4439C17.4415 35.7796 17.4415 36.2167 17.665 36.5524L18.8124 38.2756V44.1816C18.8124 45.2665 19.3906 46.269 20.329 46.8115L34.4834 54.9931C35.4219 55.5356 36.5781 55.5356 37.5165 54.9931L51.671 46.8115C52.6094 46.269 53.1875 45.2665 53.1875 44.1816V38.2757L54.335 36.5524C54.5585 36.2167 54.5585 35.7796 54.335 35.4439L53.1875 33.7207V27.8183C53.1875 26.7334 52.6094 25.7309 51.671 25.1885ZM19.8235 38.2757V44.1816C19.8235 44.9049 20.2089 45.5732 20.8345 45.9348L34.9889 54.1165C35.6146 54.4781 36.3854 54.4781 37.011 54.1165L51.1654 45.9348C51.7911 45.5732 52.1765 44.9049 52.1765 44.1816V38.2756L51.029 36.5524C50.8055 36.2167 50.8055 35.7796 51.029 35.4439L52.1765 33.7207V27.8183C52.1765 27.095 51.7911 26.4267 51.1654 26.0651L37.011 17.8834C36.3854 17.5218 35.6146 17.5218 34.9889 17.8834L20.8345 26.0651C20.2089 26.4267 19.8235 27.095 19.8235 27.8183V33.7206L20.971 35.4439C21.1945 35.7796 21.1945 36.2167 20.971 36.5524L19.8235 38.2757Z" fill="#FABC10" />
        </g>
        <path d="M37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3315 23.7783C17.2485 24.4035 16.5815 25.5589 16.5815 26.8094L16.5815 45.1906C16.5815 46.441 17.2485 47.5964 18.3315 48.2217L34.25 57.4123C35.3329 58.0375 36.6671 58.0375 37.75 57.4123L53.6686 48.2217C54.7515 47.5964 55.4186 46.441 55.4186 45.1906V26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877Z" stroke="#F9B307" />
        <path opacity="0.4" d="M37.75 57.4123C39.6222 56.3314 40.9487 55.5655 41.7297 55.1146" stroke="white" strokeLinecap="round" />
        <path d="M55.4186 45.1906V26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3315 23.7783C17.2485 24.4035 16.5815 25.5589 16.5815 26.8094L16.5815 45.1906" stroke="#FAC00E" strokeLinecap="round" />
        <path opacity="0.6" d="M55.4186 26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3315 23.7783C17.2485 24.4035 16.5815 25.5589 16.5815 26.8094" stroke="#FDDB3D" strokeLinecap="round" />
        <path opacity="0.6" d="M37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877C34.25 14.5877 28.9438 17.6512 26.2907 19.183" stroke="white" strokeLinecap="round" />
        <path d="M34.25 14.5876C34.25 14.5876 31.4418 16.209 30.2704 16.8853" stroke="white" strokeLinecap="round" />
        <g filter={`url(#filter8_d_0_10773_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M35 20.5774C35.6188 20.2201 36.3812 20.2201 37 20.5774L48.8564 27.4226C49.4752 27.7799 49.8564 28.4402 49.8564 29.1547V42.8453C49.8564 43.5598 49.4752 44.2201 48.8564 44.5774L37 51.4226C36.3812 51.7799 35.6188 51.7799 35 51.4226L23.1436 44.5774C22.5248 44.2201 22.1436 43.5598 22.1436 42.8453V29.1547C22.1436 28.4402 22.5248 27.7799 23.1436 27.4226L35 20.5774Z" fill={`url(#paint8_linear_0_10773_${id})`} />
            <path d="M34.75 20.1445C35.5235 19.6979 36.4765 19.6979 37.25 20.1445L49.1065 26.9893C49.8798 27.4358 50.3563 28.2613 50.3565 29.1543V42.8457C50.3563 43.7387 49.8798 44.5642 49.1065 45.0107L37.25 51.8555C36.4765 52.3021 35.5235 52.3021 34.75 51.8555L22.8936 45.0107C22.1202 44.5642 21.6437 43.7387 21.6436 42.8457V29.1543C21.6437 28.2613 22.1202 27.4358 22.8936 26.9893L34.75 20.1445Z" stroke="#F5900D" strokeOpacity="0.1" style={{ mixBlendMode: "multiply" }} />
        </g>
        <mask id={`mask3_0_10773_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="20" width="28" height="32">
            <path fillRule="evenodd" clipRule="evenodd" d="M35 20.5774C35.6188 20.2201 36.3812 20.2201 37 20.5774L48.8564 27.4226C49.4752 27.7799 49.8564 28.4402 49.8564 29.1547V42.8453C49.8564 43.5598 49.4752 44.2201 48.8564 44.5774L37 51.4226C36.3812 51.7799 35.6188 51.7799 35 51.4226L23.1436 44.5774C22.5248 44.2201 22.1436 43.5598 22.1436 42.8453V29.1547C22.1436 28.4402 22.5248 27.7799 23.1436 27.4226L35 20.5774Z" fill="white" />
        </mask>
        <g mask={`url(#mask3_0_10773_${id})`}>
            <g opacity="0.3" style={{ mixBlendMode: "multiply" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M36 36L40 20H32L36 36ZM36 36L52 32V40L36 36ZM36 36L44.4853 21.8579L50.1421 27.5147L36 36ZM36 36L44.4853 50.1421L50.1421 44.4853L36 36ZM36 36L32 52H40L36 36ZM36 36L20 40V32L36 36ZM36 36L27.5147 50.1421L21.8579 44.4853L36 36ZM27.5147 21.8579L21.8579 27.5147L36 36L27.5147 21.8579Z" fill="#FFD640" />
            </g>
            <path opacity="0.4" d="M48.6064 27.8557L36.75 21.0104C36.2859 20.7425 35.7141 20.7425 35.25 21.0104C33.8556 21.8155 32.8676 22.3859 32.2859 22.7217C31.0754 23.4206 30.0874 23.9911 29.3218 24.4331C28.0044 25.1936 26.0284 26.3345 23.3936 27.8557" stroke="white" strokeLinecap="round" />
            <path opacity="0.4" d="M48.6064 44.11L36.75 50.9553C36.2859 51.2233 35.7141 51.2233 35.25 50.9553" stroke="white" strokeLinecap="round" />
            <path d="M35.25 21.0104C33.8556 21.8154 32.8676 22.3859 32.2859 22.7217" stroke="white" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter9_d_0_10773_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M36 27L44 36L36 45L28 36L36 27Z" fill="white" />
            <path d="M36 26C36.2857 26 36.5573 26.1224 36.7471 26.3359L44.7471 35.3359C45.0839 35.7148 45.0839 36.2852 44.7471 36.6641L36.7471 45.6641C36.5573 45.8776 36.2857 46 36 46C35.7144 46 35.4427 45.8776 35.2529 45.6641L27.2529 36.6641C26.9162 36.2852 26.9162 35.7148 27.2529 35.3359L35.2529 26.3359L35.3272 26.2598C35.5103 26.0933 35.75 26 36 26Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <path fillRule="evenodd" clipRule="evenodd" d="M36 27L44 36H28L36 27Z" fill={`url(#paint9_linear_0_10773_${id})`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M36 45L44 36H28L36 45Z" fill={`url(#paint10_linear_0_10773_${id})`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M36 27L32.1429 36H39.8571L36 27Z" fill={`url(#paint11_linear_0_10773_${id})`} />
        <path fillRule="evenodd" clipRule="evenodd" d="M36 45L32.1429 36H39.8571L36 45Z" fill={`url(#paint12_linear_0_10773_${id})`} />
        <g filter={`url(#filter10_d_0_10773_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M46.9109 29.7799L46.3916 29.5751C46.074 29.4498 45.918 29.0908 46.0433 28.7732C46.1061 28.6138 46.2323 28.4877 46.3916 28.4249L46.9109 28.2201C47.5098 27.9839 47.9839 27.5098 48.2201 26.9109L48.4249 26.3916C48.5502 26.0739 48.9092 25.918 49.2269 26.0433C49.3862 26.1061 49.5123 26.2322 49.5751 26.3916L49.78 26.9109C50.0162 27.5098 50.4902 27.9839 51.0891 28.2201L51.6085 28.4249C51.9261 28.5502 52.082 28.9092 51.9568 29.2268C51.8939 29.3862 51.7678 29.5123 51.6085 29.5751L51.0891 29.7799C50.4902 30.0161 50.0162 30.4902 49.78 31.0891L49.5751 31.6084C49.4499 31.9261 49.0908 32.082 48.7732 31.9567C48.6139 31.8939 48.4878 31.7678 48.4249 31.6084L48.2201 31.0891C47.9839 30.4902 47.5098 30.0161 46.9109 29.7799Z" fill="white" />
        </g>
        <g filter={`url(#filter11_d_0_10773_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M26.6073 45.52L26.2611 45.3834C26.0493 45.2999 25.9454 45.0605 26.0289 44.8488C26.0708 44.7426 26.1549 44.6585 26.2611 44.6166L26.6073 44.48C27.0066 44.3226 27.3226 44.0065 27.4801 43.6073L27.6166 43.261C27.7001 43.0493 27.9395 42.9453 28.1512 43.0289C28.2575 43.0707 28.3415 43.1548 28.3834 43.261L28.52 43.6073C28.6775 44.0065 28.9935 44.3226 29.3928 44.48L29.739 44.6166C29.9507 44.7001 30.0547 44.9395 29.9712 45.1512C29.9293 45.2574 29.8452 45.3415 29.739 45.3834L29.3928 45.52C28.9935 45.6774 28.6775 45.9935 28.52 46.3927L28.3834 46.739C28.2999 46.9507 28.0606 47.0547 27.8488 46.9711C27.7426 46.9293 27.6585 46.8452 27.6166 46.739L27.4801 46.3927C27.3226 45.9935 27.0066 45.6774 26.6073 45.52Z" fill="white" />
        </g>
        <g filter={`url(#filter12_d_0_10773_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M20.7591 31.1499L20.3263 30.9793C20.0616 30.8749 19.9317 30.5757 20.0361 30.311C20.0885 30.1782 20.1936 30.0731 20.3263 30.0207L20.7591 29.8501C21.2582 29.6532 21.6533 29.2582 21.8501 28.7591L22.0208 28.3263C22.1252 28.0616 22.4244 27.9317 22.689 28.0361C22.8218 28.0884 22.9269 28.1935 22.9793 28.3263L23.15 28.7591C23.3468 29.2582 23.7419 29.6532 24.2409 29.8501L24.6737 30.0207C24.9384 30.1251 25.0684 30.4243 24.964 30.689C24.9116 30.8218 24.8065 30.9269 24.6737 30.9793L24.2409 31.1499C23.7419 31.3468 23.3468 31.7418 23.15 32.2409L22.9793 32.6737C22.8749 32.9384 22.5757 33.0683 22.311 32.9639C22.1782 32.9116 22.0731 32.8065 22.0208 32.6737L21.8501 32.2409C21.6533 31.7418 21.2582 31.3468 20.7591 31.1499Z" fill="white" />
        </g>
        <g filter={`url(#filter13_d_0_10773_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M46.4555 45.89L46.1958 45.7876C46.037 45.7249 45.959 45.5454 46.0217 45.3866C46.0531 45.3069 46.1161 45.2439 46.1958 45.2124L46.4555 45.11C46.7549 44.9919 46.992 44.7549 47.1101 44.4555L47.2125 44.1958C47.2751 44.037 47.4546 43.959 47.6134 44.0216C47.6931 44.0531 47.7562 44.1161 47.7876 44.1958L47.89 44.4555C48.0081 44.7549 48.2451 44.9919 48.5446 45.11L48.8042 45.2124C48.9631 45.2751 49.041 45.4546 48.9784 45.6134C48.947 45.6931 48.8839 45.7561 48.8042 45.7876L48.5446 45.89C48.2451 46.0081 48.0081 46.2451 47.89 46.5445L47.7876 46.8042C47.725 46.963 47.5454 47.041 47.3866 46.9784C47.307 46.9469 47.2439 46.8839 47.2125 46.8042L47.1101 46.5445C46.992 46.2451 46.7549 46.0081 46.4555 45.89Z" fill="white" />
        </g>
        <defs>
            <filter id={`filter0_d_0_10773_${id}`} x="20" y="33" width="20" height="35.3832" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.309804 0 0 0 0 0.247059 0 0 0 0 0.866667 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10773" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10773" result="shape" />
            </filter>
            <filter id={`filter1_d_0_10773_${id}`} x="32" y="33" width="20" height="35.3832" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.309804 0 0 0 0 0.247059 0 0 0 0 0.866667 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10773" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10773" result="shape" />
            </filter>
            <filter id={`filter2_d_0_10773_${id}`} x="26" y="38" width="20" height="35.3832" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.309804 0 0 0 0 0.247059 0 0 0 0 0.866667 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10773" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10773" result="shape" />
            </filter>
            <filter id={`filter3_i_0_10773_${id}`} x="53.7818" y="25.4999" width="6.71837" height="4.3335" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10773" />
            </filter>
            <filter id={`filter4_i_0_10773_${id}`} x="53.7818" y="31.4999" width="6.71837" height="4.3335" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10773" />
            </filter>
            <filter id={`filter5_i_0_10773_${id}`} x="11.4999" y="25.4999" width="6.71837" height="4.3335" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10773" />
            </filter>
            <filter id={`filter6_i_0_10773_${id}`} x="11.4999" y="31.4999" width="6.71837" height="4.3335" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10773" />
            </filter>
            <filter id={`filter7_i_0_10773_${id}`} x="17.4973" y="16.6" width="37.0053" height="39.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.976471 0 0 0 0 0.713726 0 0 0 0 0.0352941 0 0 0 1 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10773" />
            </filter>
            <filter id={`filter8_d_0_10773_${id}`} x="19.1436" y="18.3094" width="33.7128" height="37.3812" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.927721 0 0 0 0 0.665867 0 0 0 0 0.0535899 0 0 0 0.4 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10773" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10773" result="shape" />
            </filter>
            <filter id={`filter9_d_0_10773_${id}`} x="24" y="24" width="24" height="26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.996078 0 0 0 0 0.733333 0 0 0 0 0.105882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10773" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10773" result="shape" />
            </filter>
            <filter id={`filter10_d_0_10773_${id}`} x="44" y="24" width="10" height="10" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10773" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10773" result="shape" />
            </filter>
            <filter id={`filter11_d_0_10773_${id}`} x="24" y="41" width="8" height="8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10773" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10773" result="shape" />
            </filter>
            <filter id={`filter12_d_0_10773_${id}`} x="18" y="26" width="9" height="9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10773" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10773" result="shape" />
            </filter>
            <filter id={`filter13_d_0_10773_${id}`} x="44" y="42" width="7" height="7" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10773" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10773" result="shape" />
            </filter>
            <linearGradient id={`paint0_linear_0_10773_${id}`} x1="5.95475" y1="6" x2="5.95475" y2="64.1521" gradientUnits="userSpaceOnUse">
                <stop stopColor="#AE66FF" />
                <stop offset="1" stopColor="#7E07E0" />
            </linearGradient>
            <linearGradient id={`paint1_linear_0_10773_${id}`} x1="59" y1="20" x2="59" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint2_linear_0_10773_${id}`} x1="59" y1="20" x2="59" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint3_linear_0_10773_${id}`} x1="13" y1="20" x2="13" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint4_linear_0_10773_${id}`} x1="13" y1="20" x2="13" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint5_linear_0_10773_${id}`} x1="22" y1="16.3538" x2="22" y2="33.0001" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7C71A" />
                <stop offset="1" stopColor="#FBAA00" />
            </linearGradient>
            <linearGradient id={`paint6_linear_0_10773_${id}`} x1="22" y1="16.3538" x2="22" y2="33.0001" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDF6B" />
                <stop offset="1" stopColor="#F8A60A" />
            </linearGradient>
            <linearGradient id={`paint7_linear_0_10773_${id}`} x1="13" y1="13" x2="13" y2="59" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE046" />
                <stop offset="1" stopColor="#F9B800" />
            </linearGradient>
            <linearGradient id={`paint8_linear_0_10773_${id}`} x1="20" y1="20" x2="20" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF550" />
                <stop offset="1" stopColor="#FFD541" />
            </linearGradient>
            <linearGradient id={`paint9_linear_0_10773_${id}`} x1="28" y1="27" x2="28" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#27DEEB" />
                <stop offset="1" stopColor="#08C9FF" />
            </linearGradient>
            <linearGradient id={`paint10_linear_0_10773_${id}`} x1="28" y1="36" x2="28" y2="45" gradientUnits="userSpaceOnUse">
                <stop stopColor="#009BF6" />
                <stop offset="1" stopColor="#00B5FF" />
            </linearGradient>
            <linearGradient id={`paint11_linear_0_10773_${id}`} x1="32.1429" y1="27" x2="32.1429" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8AFFFF" />
                <stop offset="1" stopColor="#0DF3FF" />
            </linearGradient>
            <linearGradient id={`paint12_linear_0_10773_${id}`} x1="32.1429" y1="36" x2="32.1429" y2="45" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00BAF3" />
                <stop offset="1" stopColor="#00B5FF" />
            </linearGradient>
        </defs>
    </svg>

    );
};

export default EliteSVG;
