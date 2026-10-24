"use client";

import { useId, type SVGProps } from 'react';

const ChampionSVG = (props: SVGProps<SVGSVGElement>) => {
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
        <path fillRule="evenodd" clipRule="evenodd" d="M53 62C54.1046 62 55 62.8954 55 64C55 65.1046 54.1046 66 53 66H35C34.8824 66 34.7673 65.9899 34.6553 65.9704C28.2305 65.687 22.3308 63.3828 17.5761 59.6779C17.1894 59.3766 16.6067 58.8771 16.1748 58.5013C15.8054 58.1799 15.3333 58 14.8436 58H10C8.89543 58 8 57.1046 8 56C8 54.8954 8.89543 54 10 54H12C13.1046 54 14 53.1046 14 52C14 50.8954 13.1046 50 12 50H7C5.89543 50 5 49.1046 5 48C5 46.8954 5.89543 46 7 46H8C9.10457 46 10 45.1046 10 44C10 42.8954 9.10457 42 8 42C7.1913 42 6.49962 41.4171 6.36506 40.6196C6.31617 40.3299 6.27734 40.0966 6.27093 40.0492C6.09227 38.7249 6 37.3732 6 36C6 19.4315 19.4315 6 36 6C41 6 46 6 51 6C52.1046 6 53 6.89543 53 8C53 9.10457 52.1046 10 51 10H48C46.8954 10 46 10.8954 46 12C46 13.1046 46.8954 14 48 14H60C61.1046 14 62 14.8954 62 16C62 17.1038 61.1058 17.9988 60.0022 18L57 18C55.8954 18 55 18.8954 55 20C55 21.1046 55.8954 22 57 22H61.306C62.0624 22 62.7556 22.4259 63.0835 23.1075C63.2807 23.5171 63.488 23.959 63.6237 24.2783C65.1536 27.8793 66 31.8408 66 36C66 37.3068 65.9164 38.5942 65.7544 39.8569C65.7271 40.0692 65.6853 40.3418 65.6398 40.6208C65.5093 41.4213 64.8111 42 64 42C62.8954 42 62 42.8954 62 44C62 45.1046 62.8954 46 64 46H65C66.1046 46 67 46.8954 67 48C67 49.1046 66.1046 50 65 50H63.7162C62.9901 50 62.3224 50.3942 61.9597 51.0232C61.7241 51.4317 61.4621 51.8761 61.2675 52.1794C60.8114 52.8903 60.326 53.5807 59.8132 54.2489C59.2981 54.9201 58.7553 55.5688 58.1864 56.1934C57.8743 56.5362 57.3685 57.044 56.974 57.4341C56.605 57.799 56.1061 58 55.5871 58H50C48.8954 58 48 58.8954 48 60C48 61.0969 48.883 61.9875 49.9769 61.9999L53 62Z" fill={`url(#paint0_linear_0_10658_${id})`} />
        <g opacity="0.1">
            <path fillRule="evenodd" clipRule="evenodd" d="M32.9985 12.6768C34.8549 11.605 37.1421 11.605 38.9985 12.6768L54.697 21.7403C56.5534 22.8121 57.697 24.7929 57.697 26.9365V45.0636C57.697 47.2072 56.5534 49.1879 54.697 50.2597L38.9985 59.3233C37.1421 60.3951 34.8549 60.3951 32.9985 59.3233L17.3 50.2597C15.4436 49.1879 14.3 47.2072 14.3 45.0636L14.3 26.9365C14.3 24.7929 15.4436 22.8121 17.3 21.7403L32.9985 12.6768Z" fill="#0274F3" style={{ mixBlendMode: "multiply" }} />
        </g>
        <g filter={`url(#filter0_d_0_10658_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M29.0718 33L42.9282 41L26.76 69.0041C26.3829 69.6573 25.446 69.6738 25.0461 69.0344L21.125 62.7643L13.7344 62.5035C12.9806 62.4769 12.5265 61.6573 12.9036 61.0041L29.0718 33Z" fill="#2DCD6B" />
        </g>
        <mask id={`mask0_0_10658_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="12" y="33" width="31" height="37">
            <path fillRule="evenodd" clipRule="evenodd" d="M29.0718 33L42.9282 41L26.76 69.0041C26.3829 69.6573 25.446 69.6738 25.0461 69.0344L21.125 62.7643L13.7344 62.5035C12.9806 62.4769 12.5265 61.6573 12.9036 61.0041L29.0718 33Z" fill="white" />
        </mask>
        <g mask={`url(#mask0_0_10658_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M24.5359 48.8564L31.4641 52.8564L22.4641 68.4449L15.5359 64.4449L24.5359 48.8564Z" fill="white" />
        </g>
        <g filter={`url(#filter1_d_0_10658_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M42.9282 33L29.0718 41L45.24 69.0041C45.6171 69.6573 46.554 69.6738 46.9539 69.0344L50.875 62.7643L58.2656 62.5035C59.0194 62.4769 59.4735 61.6573 59.0964 61.0041L42.9282 33Z" fill="#2DCD6B" />
        </g>
        <mask id={`mask1_0_10658_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="29" y="33" width="31" height="37">
            <path fillRule="evenodd" clipRule="evenodd" d="M42.9282 33L29.0718 41L45.24 69.0041C45.6171 69.6573 46.554 69.6738 46.9539 69.0344L50.875 62.7643L58.2656 62.5035C59.0194 62.4769 59.4735 61.6573 59.0964 61.0041L42.9282 33Z" fill="white" />
        </mask>
        <g mask={`url(#mask1_0_10658_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M47.4641 48.8564L40.5359 52.8564L49.5359 68.4449L56.4641 64.4449L47.4641 48.8564Z" fill="white" />
        </g>
        <path opacity="0.2" fillRule="evenodd" clipRule="evenodd" d="M34 16.1547C35.2376 15.4401 36.7624 15.4401 38 16.1547L53.9186 25.3453C55.1562 26.0598 55.9186 27.3803 55.9186 28.8094V47.1906C55.9186 48.6196 55.1562 49.9401 53.9186 50.6547L38 59.8453C36.7624 60.5598 35.2376 60.5598 34 59.8453L18.0814 50.6547C16.8438 49.9401 16.0814 48.6196 16.0814 47.1906L16.0814 28.8094C16.0814 27.3803 16.8438 26.0598 18.0814 25.3453L34 16.1547Z" fill="#0274F3" style={{ mixBlendMode: "multiply" }} />
        <path fillRule="evenodd" clipRule="evenodd" d="M34 14.1547C35.2376 13.4402 36.7624 13.4402 38 14.1547L53.9186 23.3453C55.1562 24.0598 55.9186 25.3803 55.9186 26.8094V45.1906C55.9186 46.6197 55.1562 47.9402 53.9186 48.6547L38 57.8453C36.7624 58.5598 35.2376 58.5598 34 57.8453L18.0814 48.6547C16.8438 47.9402 16.0814 46.6197 16.0814 45.1906V26.8094C16.0814 25.3803 16.8438 24.0598 18.0814 23.3453L34 14.1547Z" fill={`url(#paint1_linear_0_10658_${id})`} stroke="#FFF04D" strokeOpacity="0.4" />
        <mask id={`mask2_0_10658_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="15" y="13" width="42" height="46">
            <path fillRule="evenodd" clipRule="evenodd" d="M34 14.1547C35.2376 13.4402 36.7624 13.4402 38 14.1547L53.9186 23.3453C55.1562 24.0598 55.9186 25.3803 55.9186 26.8094V45.1906C55.9186 46.6197 55.1562 47.9402 53.9186 48.6547L38 57.8453C36.7624 58.5598 35.2376 58.5598 34 57.8453L18.0814 48.6547C16.8438 47.9402 16.0814 46.6197 16.0814 45.1906V26.8094C16.0814 25.3803 16.8438 24.0598 18.0814 23.3453L34 14.1547Z" fill="white" stroke="white" />
        </mask>
        <g mask={`url(#mask2_0_10658_${id})`}>
            <path d="M37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3314 23.7783C17.2485 24.4035 16.5814 25.5589 16.5814 26.8094L16.5814 45.1906C16.5814 46.441 17.2485 47.5964 18.3314 48.2217L34.25 57.4123C35.3329 58.0375 36.6671 58.0375 37.75 57.4123L53.6686 48.2217C54.7515 47.5964 55.4186 46.441 55.4186 45.1906V26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877Z" stroke="#F9B607" strokeLinecap="round" />
            <path d="M55.4186 45.1906V26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3314 23.7783C17.2485 24.4035 16.5814 25.5589 16.5814 26.8094L16.5814 45.1906" stroke="#FBC618" strokeLinecap="round" />
            <path opacity="0.6" d="M55.4186 26.8094C55.4186 25.5589 54.7515 24.4035 53.6686 23.7783L37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877L18.3314 23.7783C17.2485 24.4035 16.5814 25.5589 16.5814 26.8094" stroke="#FFF24E" strokeLinecap="round" />
            <path opacity="0.4" d="M37.75 14.5877C36.6671 13.9625 35.3329 13.9625 34.25 14.5877C34.25 14.5877 28.9438 17.6512 26.2907 19.183" stroke="white" strokeLinecap="round" />
            <path d="M34.25 14.5876C34.25 14.5876 31.4418 16.209 30.2704 16.8853" stroke="white" strokeLinecap="round" />
            <path opacity="0.4" d="M37.75 57.4123C39.6222 56.3314 40.9487 55.5655 41.7297 55.1146" stroke="white" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter2_d_0_10658_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M35 20.5774C35.6188 20.2201 36.3812 20.2201 37 20.5774L48.8564 27.4226C49.4752 27.7799 49.8564 28.4402 49.8564 29.1547V42.8453C49.8564 43.5598 49.4752 44.2201 48.8564 44.5774L37 51.4226C36.3812 51.7799 35.6188 51.7799 35 51.4226L23.1436 44.5774C22.5248 44.2201 22.1436 43.5598 22.1436 42.8453V29.1547C22.1436 28.4402 22.5248 27.7799 23.1436 27.4226L35 20.5774Z" fill={`url(#paint2_linear_0_10658_${id})`} />
            <path d="M34.75 20.1445C35.5235 19.6979 36.4765 19.6979 37.25 20.1445L49.1065 26.9893C49.8798 27.4358 50.3563 28.2613 50.3565 29.1543V42.8457C50.3563 43.7387 49.8798 44.5642 49.1065 45.0107L37.25 51.8555C36.4765 52.3021 35.5235 52.3021 34.75 51.8555L22.8936 45.0107C22.1202 44.5642 21.6437 43.7387 21.6436 42.8457V29.1543C21.6437 28.2613 22.1202 27.4358 22.8936 26.9893L34.75 20.1445Z" stroke="#F5900D" strokeOpacity="0.1" style={{ mixBlendMode: "multiply" }} />
        </g>
        <mask id={`mask3_0_10658_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="20" width="28" height="32">
            <path fillRule="evenodd" clipRule="evenodd" d="M35 20.5774C35.6188 20.2201 36.3812 20.2201 37 20.5774L48.8564 27.4226C49.4752 27.7799 49.8564 28.4402 49.8564 29.1547V42.8453C49.8564 43.5598 49.4752 44.2201 48.8564 44.5774L37 51.4226C36.3812 51.7799 35.6188 51.7799 35 51.4226L23.1436 44.5774C22.5248 44.2201 22.1436 43.5598 22.1436 42.8453V29.1547C22.1436 28.4402 22.5248 27.7799 23.1436 27.4226L35 20.5774Z" fill="white" />
        </mask>
        <g mask={`url(#mask3_0_10658_${id})`}>
            <g opacity="0.3" style={{ mixBlendMode: "multiply" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M36 35.9999L40 20H32L36 36L27.5147 21.8579L21.8579 27.5147L36 36L20 32V40L36 36L21.8579 44.4853L27.5147 50.1422L36 36L32 52H40L36 36L44.4853 50.1421L50.1421 44.4853L36 36L52 40V32L36 35.9999ZM36 35.9999L50.1421 27.5147L44.4853 21.8578L36 35.9999Z" fill="#FFD640" />
            </g>
            <path opacity="0.4" d="M48.6064 27.8556L36.75 21.0103C36.2859 20.7423 35.7141 20.7423 35.25 21.0103C33.8556 21.8154 32.8676 22.3858 32.2859 22.7216C31.0754 23.4205 30.0874 23.9909 29.3218 24.4329C28.0044 25.1935 26.0284 26.3344 23.3936 27.8556" stroke="white" strokeLinecap="round" />
            <path d="M35.25 21.0103C33.8556 21.8153 32.8676 22.3858 32.2859 22.7216" stroke="white" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter3_d_0_10658_${id})`}>
            <path d="M33.4498 32.49L36 28.7689L38.5502 32.49L42.8772 33.7655L40.1263 37.3407L40.2503 41.8501L36 40.3387L31.7497 41.8501L31.8737 37.3407L29.1228 33.7655L33.4498 32.49Z" fill="white" />
            <path d="M35.9998 27.7689C36.3296 27.7689 36.6385 27.9315 36.825 28.2035L39.1736 31.6302L43.1599 32.806C43.4762 32.8993 43.7259 33.1428 43.8279 33.4564C43.9298 33.7701 43.8708 34.114 43.6697 34.3754L41.1355 37.6683L41.2498 41.8226C41.2588 42.1523 41.1045 42.4657 40.8377 42.6595C40.5709 42.8531 40.2254 42.9028 39.9148 42.7924L35.9998 41.3998L32.0847 42.7924C31.7741 42.9028 31.4287 42.8533 31.1619 42.6595C30.8951 42.4657 30.7407 42.1523 30.7498 41.8226L30.863 37.6683L28.3298 34.3754C28.1288 34.114 28.0697 33.77 28.1716 33.4564C28.2735 33.1429 28.5234 32.8994 28.8396 32.806L32.825 31.6302L35.1755 28.2035L35.2507 28.1068C35.4392 27.8935 35.7113 27.769 35.9998 27.7689Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <g filter={`url(#filter4_i_0_10658_${id})`}>
            <path d="M33.4498 32.49L36 28.7689L38.5502 32.49L42.8772 33.7655L40.1263 37.3407L40.2503 41.8501L36 40.3387L31.7497 41.8501L31.8737 37.3407L29.1228 33.7655L33.4498 32.49Z" fill={`url(#paint3_linear_0_10658_${id})`} />
        </g>
        <g filter={`url(#filter5_d_0_10658_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M45.9109 28.7799L45.3916 28.5751C45.074 28.4498 44.918 28.0908 45.0433 27.7732C45.1061 27.6138 45.2323 27.4877 45.3916 27.4249L45.9109 27.2201C46.5098 26.9839 46.9839 26.5098 47.2201 25.9109L47.4249 25.3916C47.5502 25.0739 47.9092 24.918 48.2268 25.0433C48.3862 25.1061 48.5123 25.2322 48.5751 25.3916L48.7799 25.9109C49.0161 26.5098 49.4902 26.9839 50.0891 27.2201L50.6084 27.4249C50.9261 27.5502 51.082 27.9092 50.9567 28.2268C50.8939 28.3862 50.7678 28.5123 50.6084 28.5751L50.0891 28.7799C49.4902 29.0161 49.0161 29.4902 48.7799 30.0891L48.5751 30.6084C48.4499 30.9261 48.0908 31.082 47.7732 30.9567C47.6139 30.8939 47.4877 30.7678 47.4249 30.6084L47.2201 30.0891C46.9839 29.4902 46.5098 29.0161 45.9109 28.7799Z" fill="white" />
        </g>
        <g filter={`url(#filter6_d_0_10658_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M25.6073 44.52L25.2611 44.3834C25.0493 44.2999 24.9454 44.0605 25.0289 43.8488C25.0708 43.7426 25.1548 43.6585 25.2611 43.6166L25.6073 43.48C26.0066 43.3226 26.3226 43.0065 26.4801 42.6073L26.6166 42.261C26.7001 42.0493 26.9395 41.9453 27.1512 42.0289C27.2575 42.0707 27.3415 42.1548 27.3834 42.261L27.52 42.6073C27.6774 43.0065 27.9935 43.3226 28.3928 43.48L28.739 43.6166C28.9507 43.7001 29.0547 43.9395 28.9712 44.1512C28.9293 44.2574 28.8452 44.3415 28.739 44.3834L28.3928 44.52C27.9935 44.6774 27.6774 44.9935 27.52 45.3927L27.3834 45.739C27.2999 45.9507 27.0606 46.0547 26.8488 45.9711C26.7426 45.9293 26.6585 45.8452 26.6166 45.739L26.4801 45.3927C26.3226 44.9935 26.0066 44.6774 25.6073 44.52Z" fill="white" />
        </g>
        <g filter={`url(#filter7_d_0_10658_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M24.3037 29.26L24.1305 29.1917C24.0247 29.1499 23.9727 29.0303 24.0144 28.9244C24.0354 28.8713 24.0774 28.8292 24.1305 28.8083L24.3037 28.74C24.5033 28.6613 24.6613 28.5033 24.74 28.3036L24.8083 28.1305C24.8501 28.0246 24.9698 27.9727 25.0756 28.0144C25.1287 28.0354 25.1708 28.0774 25.1917 28.1305L25.26 28.3036C25.3387 28.5033 25.4968 28.6613 25.6964 28.74L25.8695 28.8083C25.9754 28.8501 26.0273 28.9697 25.9856 29.0756C25.9646 29.1287 25.9226 29.1708 25.8695 29.1917L25.6964 29.26C25.4968 29.3387 25.3387 29.4967 25.26 29.6964L25.1917 29.8695C25.15 29.9754 25.0303 30.0273 24.9244 29.9856C24.8713 29.9646 24.8293 29.9226 24.8083 29.8695L24.74 29.6964C24.6613 29.4967 24.5033 29.3387 24.3037 29.26Z" fill="white" />
        </g>
        <g filter={`url(#filter8_d_0_10658_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M45.4555 45.89L45.1958 45.7876C45.037 45.7249 44.959 45.5454 45.0217 45.3866C45.0531 45.3069 45.1161 45.2439 45.1958 45.2124L45.4555 45.11C45.7549 44.9919 45.9919 44.7549 46.11 44.4555L46.2125 44.1958C46.2751 44.037 46.4546 43.959 46.6134 44.0216C46.6931 44.0531 46.7562 44.1161 46.7876 44.1958L46.89 44.4555C47.0081 44.7549 47.2451 44.9919 47.5446 45.11L47.8042 45.2124C47.963 45.2751 48.041 45.4546 47.9784 45.6134C47.947 45.6931 47.8839 45.7561 47.8042 45.7876L47.5446 45.89C47.2451 46.0081 47.0081 46.2451 46.89 46.5445L46.7876 46.8042C46.7249 46.963 46.5454 47.041 46.3866 46.9784C46.3069 46.9469 46.2439 46.8839 46.2125 46.8042L46.11 46.5445C45.9919 46.2451 45.7549 46.0081 45.4555 45.89Z" fill="white" />
        </g>
        <defs>
            <filter id={`filter0_d_0_10658_${id}`} x="10.7683" y="33" width="34.1599" height="40.5042" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.333333 0 0 0 0 0.615373 0 0 0 0 0.819608 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10658" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10658" result="shape" />
            </filter>
            <filter id={`filter1_d_0_10658_${id}`} x="27.0718" y="33" width="34.1599" height="40.5042" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="2" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.333333 0 0 0 0 0.615373 0 0 0 0 0.819608 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_0_10658" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10658" result="shape" />
            </filter>
            <filter id={`filter2_d_0_10658_${id}`} x="19.1436" y="18.3094" width="33.7128" height="37.3811" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.927721 0 0 0 0 0.665867 0 0 0 0 0.0535899 0 0 0 0.4 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10658" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10658" result="shape" />
            </filter>
            <filter id={`filter3_d_0_10658_${id}`} x="25.1228" y="25.7689" width="21.7544" height="21.0812" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.996078 0 0 0 0 0.733333 0 0 0 0 0.105882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10658" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10658" result="shape" />
            </filter>
            <filter id={`filter4_i_0_10658_${id}`} x="29.1228" y="28.7689" width="13.7544" height="14.0812" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.634454 0 0 0 0 0 0 0 0 0.4 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_10658" />
            </filter>
            <filter id={`filter5_d_0_10658_${id}`} x="43" y="23" width="10" height="10" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10658" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10658" result="shape" />
            </filter>
            <filter id={`filter6_d_0_10658_${id}`} x="23" y="40" width="8" height="8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10658" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10658" result="shape" />
            </filter>
            <filter id={`filter7_d_0_10658_${id}`} x="22" y="26" width="6" height="6" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10658" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10658" result="shape" />
            </filter>
            <filter id={`filter8_d_0_10658_${id}`} x="43" y="42" width="7" height="7" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.94902 0 0 0 0 0.305882 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_10658" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_10658" result="shape" />
            </filter>
            <linearGradient id={`paint0_linear_0_10658_${id}`} x1="5" y1="6" x2="5" y2="66" gradientUnits="userSpaceOnUse">
                <stop stopColor="#90B3FF" />
                <stop offset="1" stopColor="#0066FF" />
            </linearGradient>
            <linearGradient id={`paint1_linear_0_10658_${id}`} x1="13" y1="13" x2="13" y2="59" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE046" />
                <stop offset="1" stopColor="#F9B800" />
            </linearGradient>
            <linearGradient id={`paint2_linear_0_10658_${id}`} x1="20" y1="20" x2="20" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF550" />
                <stop offset="1" stopColor="#FFD541" />
            </linearGradient>
            <linearGradient id={`paint3_linear_0_10658_${id}`} x1="28.7688" y1="28.7689" x2="28.7688" y2="43.2311" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFC823" />
                <stop offset="1" stopColor="#FCA50E" />
            </linearGradient>
        </defs>
    </svg>

    );
};

export default ChampionSVG;
