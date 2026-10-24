"use client";

import { useId, type SVGProps } from 'react';
const KnightSVG = (props: SVGProps<SVGSVGElement>) => {
    const rawId = useId();
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return (
    <svg
        width={216}
        height={248}
        viewBox='0 0 216 248'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        {...props}
    >
        <g filter={`url(#filter0_d_2502_3340_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M88 126L129.569 150L81.0646 234.012C79.9333 235.972 77.1227 236.021 75.923 234.103L64.1596 215.293L41.9877 214.511C39.7265 214.431 38.3641 211.972 39.4954 210.012L88 126Z" fill="#2D0EC1" />
        </g>
        <mask id={`mask0_2502_3340_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="39" y="126" width="91" height="110">
            <path fillRule="evenodd" clipRule="evenodd" d="M88 126L129.569 150L81.0646 234.012C79.9333 235.972 77.1227 236.021 75.923 234.103L64.1596 215.293L41.9877 214.511C39.7265 214.431 38.3641 211.972 39.4954 210.012L88 126Z" fill="white" />
        </mask>
        <g mask={`url(#mask0_2502_3340_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M74.3924 173.569L95.177 185.569L68.177 232.335L47.3924 220.335L74.3924 173.569Z" fill="#B7C3D6" />
        </g>
        <g filter={`url(#filter1_d_2502_3340_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M129.569 126L88 150L136.505 234.012C137.636 235.972 140.447 236.021 141.646 234.103L153.41 215.293L175.582 214.511C177.843 214.431 179.205 211.972 178.074 210.012L129.569 126Z" fill="#3118CC" />
        </g>
        <mask id={`mask1_2502_3340_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="88" y="126" width="91" height="110">
            <path fillRule="evenodd" clipRule="evenodd" d="M129.569 126L88 150L136.505 234.012C137.636 235.972 140.447 236.021 141.646 234.103L153.41 215.293L175.582 214.511C177.843 214.431 179.205 211.972 178.074 210.012L129.569 126Z" fill="white" />
        </mask>
        <g mask={`url(#mask1_2502_3340_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M143.177 173.569L122.392 185.569L149.392 232.335L170.177 220.335L143.177 173.569Z" fill="#B4C0D3" />
        </g>
        <mask id={`mask2_2502_3340_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="24" y="24" width="168" height="169">
            <circle cx="108" cy="108" r="84" fill="white" />
        </mask>
        <g mask={`url(#mask2_2502_3340_${id})`}>
            <circle cx="108" cy="108" r="84" fill={`url(#paint0_linear_2502_3340_${id})`} />
            <g opacity="0.04" style={{ mixBlendMode: "color-burn" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M33.0002 32.999C26.3728 32.999 21.0002 38.3716 21.0002 44.999C21.0002 51.6264 26.3728 56.999 33.0002 56.999H54.0002C60.6276 56.999 66.0002 51.6264 66.0002 44.999C66.0002 38.3716 60.6276 32.999 54.0002 32.999H33.0002ZM141 81.0008C134.373 81.0008 129 86.3734 129 93.0008C129 99.6282 134.373 105.001 141 105.001H213C219.628 105.001 225 99.6282 225 93.0008C225 86.3734 219.628 81.0008 213 81.0008H141ZM108 165C108 158.373 113.373 153 120 153H192C198.628 153 204 158.373 204 165C204 171.627 198.628 177 192 177H120C113.373 177 108 171.627 108 165ZM30.0001 129C23.3727 129 18.0001 134.373 18.0001 141C18.0001 147.628 23.3727 153 30.0001 153H78.0001C84.6275 153 90.0001 147.628 90.0001 141C90.0001 134.373 84.6275 129 78.0001 129H30.0001ZM12.0001 101.999C12.0001 98.6856 14.6864 95.9993 18.0001 95.9993H45.0001C48.3138 95.9993 51.0001 98.6856 51.0001 101.999C51.0001 105.313 48.3138 107.999 45.0001 107.999H18.0001C14.6864 107.999 12.0001 105.313 12.0001 101.999ZM18.0001 68.9999C14.6864 68.9999 12.0001 71.6862 12.0001 74.9999C12.0001 78.3136 14.6864 80.9999 18.0001 80.9999H102C105.314 80.9999 108 78.3136 108 74.9999C108 71.6862 105.314 68.9999 102 68.9999H18.0001ZM90 38.999C90 35.6853 92.6863 32.999 96 32.999H180C183.314 32.999 186 35.6853 186 38.999C186 42.3127 183.314 44.999 180 44.999H96C92.6863 44.999 90 42.3127 90 38.999ZM6.00011 171C2.6864 171 0.000106812 173.687 0.000106812 177C0.000106812 180.314 2.6864 183 6.00011 183H90.0001C93.3138 183 96.0001 180.314 96.0001 177C96.0001 173.687 93.3138 171 90.0001 171H6.00011ZM129 63.0011C129 59.6873 131.686 57.0011 135 57.0011H219C222.314 57.0011 225 59.6873 225 63.0011C225 66.3148 222.314 69.0011 219 69.0011H135C131.686 69.0011 129 66.3148 129 63.0011ZM118.6 116.999C113.74 116.999 109.8 120.939 109.8 125.799C109.8 130.659 113.74 134.599 118.6 134.599H191.4C196.261 134.599 200.2 130.659 200.2 125.799C200.2 120.939 196.261 116.999 191.4 116.999H118.6Z" fill="black" />
            </g>
        </g>
        <g opacity="0.1">
            <circle cx="108" cy="108" r="66" fill="#50C22B" style={{ mixBlendMode: "multiply" }} />
        </g>
        <circle opacity="0.2" cx="108" cy="114" r="60" fill="#62CF3F" style={{ mixBlendMode: "multiply" }} />
        <circle cx="108" cy="108" r="60" fill={`url(#paint1_linear_2502_3340_${id})`} />
        <mask id={`mask3_2502_3340_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="48" y="48" width="120" height="120">
            <circle cx="108" cy="108" r="60" fill="white" />
        </mask>
        <g mask={`url(#mask3_2502_3340_${id})`}>
            <path d="M49.5001 108C49.5001 140.309 75.6914 166.5 108 166.5C140.309 166.5 166.5 140.309 166.5 108" stroke="#64788F" strokeWidth="3" />
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M147 119.258L182.258 84" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M132 86.258L167.258 51" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M21.0001 143.258L56.258 108" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M153 77.258L188.258 42" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M42.0001 134.258L77.258 99" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M93.0001 170.258L128.258 135" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M141 149.258L176.258 114" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <path d="M149.366 149.366C159.952 138.779 166.5 124.154 166.5 108C166.5 75.6913 140.309 49.5 108 49.5C75.6914 49.5 49.5001 75.6913 49.5001 108C49.5001 124.154 56.0479 138.779 66.6343 149.366" stroke="#196CEE" strokeWidth="3" strokeLinecap="round" />
            <path opacity="0.4" d="M166.5 108C166.5 75.6913 140.309 49.5 108 49.5C75.6914 49.5 49.5001 75.6913 49.5001 108" stroke="#CCD8EA" strokeWidth="3" strokeLinecap="round" />
            <path opacity="0.2" d="M108 49.5C97.0254 49.5 86.7566 52.522 77.9805 57.7793" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path opacity="0.6" d="M97.5425 50.432C94.7565 50.9348 92.0392 51.6348 89.4054 52.5171" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter2_d_2502_3340_${id})`}>
            <circle cx="108" cy="108" r="45" fill={`url(#paint2_linear_2502_3340_${id})`} />
            <circle cx="108" cy="108" r="46.5" stroke="#64788F" strokeOpacity="0.06" strokeWidth="3" />
        </g>
        <mask id={`mask4_2502_3340_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="63" y="63" width="90" height="90">
            <circle cx="108" cy="108" r="45" fill="white" />
        </mask>
        <g mask={`url(#mask4_2502_3340_${id})`}>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M132 80.258L167.258 45" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M153 71.258L188.258 36" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M42.0001 128.258L77.2581 93" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M93.0001 164.258L128.258 129" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <g opacity="0.12" style={{ mixBlendMode: "multiply" }}>
                <path d="M147 113.258L182.258 78" stroke="#78A2A9" strokeWidth="6" strokeLinecap="round" />
            </g>
            <path opacity="0.6" d="M108 64.5C102.102 64.5 96.4783 65.6738 91.3495 67.8005" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter3_d_2502_3340_${id})`}>
            <path d="M90.8006 108L108 85.8865L125.199 108L108 130.114L90.8006 108Z" fill="white" />
            <path d="M108 82.8865C108.926 82.8865 109.8 83.3139 110.368 84.0447L127.567 106.158C128.41 107.241 128.41 108.758 127.567 109.842L110.368 131.956C109.8 132.686 108.925 133.114 108 133.114C107.074 133.114 106.2 132.686 105.632 131.956L88.4325 109.842C87.59 108.758 87.5899 107.241 88.4325 106.158L105.632 84.0447C106.2 83.314 107.074 82.8865 108 82.8865Z" stroke="white" strokeWidth="6" strokeLinejoin="round" />
        </g>
        <g filter={`url(#filter4_i_2502_3340_${id})`}>
            <path d="M90.8006 108L108 85.8865L125.199 108L108 130.114L90.8006 108Z" fill={`url(#paint3_linear_2502_3340_${id})`} />
        </g>
        <defs>
            <filter id={`filter0_d_2502_3340_${id}`} x="33.0895" y="126" width="102.48" height="121.512" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="6" />
                <feGaussianBlur stdDeviation="3" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.333333 0 0 0 0 0.615373 0 0 0 0 0.819608 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_2502_3340" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2502_3340" result="shape" />
            </filter>
            <filter id={`filter1_d_2502_3340_${id}`} x="82" y="126" width="102.48" height="121.512" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="6" />
                <feGaussianBlur stdDeviation="3" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.333333 0 0 0 0 0.615373 0 0 0 0 0.819608 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_2502_3340" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2502_3340" result="shape" />
            </filter>
            <filter id={`filter2_d_2502_3340_${id}`} x="48" y="51" width="120" height="120" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="3" />
                <feGaussianBlur stdDeviation="6" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.279884 0 0 0 0 0.409586 0 0 0 0 0.470833 0 0 0 0.2 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2502_3340" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2502_3340" result="shape" />
            </filter>
            <filter id={`filter3_d_2502_3340_${id}`} x="78.8006" y="76.8865" width="58.3988" height="68.2271" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="3" />
                <feGaussianBlur stdDeviation="3" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.19669 0 0 0 0 0.27695 0 0 0 0 0.483333 0 0 0 0.2 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2502_3340" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2502_3340" result="shape" />
            </filter>
            <filter id={`filter4_i_2502_3340_${id}`} x="90.8006" y="85.8865" width="34.3988" height="47.2271" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="3" />
                <feGaussianBlur stdDeviation="1.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.324977 0 0 0 0 0.428027 0 0 0 0 0.579167 0 0 0 0.4 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_2502_3340" />
            </filter>
            <linearGradient id={`paint0_linear_2502_3340_${id}`} x1="24" y1="24" x2="24" y2="192" gradientUnits="userSpaceOnUse">
                <stop stopColor="#425DE2" />
                <stop offset="1" stopColor="#2A00C4" />
            </linearGradient>
            <linearGradient id={`paint1_linear_2502_3340_${id}`} x1="48" y1="48" x2="48" y2="168" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ABB7CC" />
                <stop offset="1" stopColor="#76879C" />
            </linearGradient>
            <linearGradient id={`paint2_linear_2502_3340_${id}`} x1="63" y1="63" x2="63" y2="153" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C6D1E4" />
                <stop offset="1" stopColor="#A4B1C4" />
            </linearGradient>
            <linearGradient id={`paint3_linear_2502_3340_${id}`} x1="90.8006" y1="85.8865" x2="90.8006" y2="130.114" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0F6AFD" />
                <stop offset="1" stopColor="#1C3251" />
            </linearGradient>
        </defs>
    </svg>


    );
};

export default KnightSVG;