"use client";

import { useId, type SVGProps } from 'react';

const HeroSVG = (props: SVGProps<SVGSVGElement>) => {
    const rawId = useId();
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return (
    <svg
        width={216}
        height={221}
        viewBox='0 0 216 221'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        {...props}
    >
        <mask id={`mask0_503_13460_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="24" y="24" width="168" height="169">
            <circle cx="108" cy="108" r="84" fill="white" />
        </mask>
        <g mask={`url(#mask0_503_13460_${id})`}>
            <circle cx="108" cy="108" r="84" fill={`url(#paint0_linear_503_13460_${id})`} />
            <g opacity="0.04" style={{ mixBlendMode: "color-burn" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M33.0002 32.999C26.3728 32.999 21.0002 38.3716 21.0002 44.999C21.0002 51.6264 26.3728 56.999 33.0002 56.999H54.0002C60.6276 56.999 66.0002 51.6264 66.0002 44.999C66.0002 38.3716 60.6276 32.999 54.0002 32.999H33.0002ZM141 81.0008C134.373 81.0008 129 86.3734 129 93.0008C129 99.6282 134.373 105.001 141 105.001H213C219.628 105.001 225 99.6282 225 93.0008C225 86.3734 219.628 81.0008 213 81.0008H141ZM108 165C108 158.373 113.373 153 120 153H192C198.628 153 204 158.373 204 165C204 171.627 198.628 177 192 177H120C113.373 177 108 171.627 108 165ZM30.0001 129C23.3727 129 18.0001 134.373 18.0001 141C18.0001 147.628 23.3727 153 30.0001 153H78.0001C84.6275 153 90.0001 147.628 90.0001 141C90.0001 134.373 84.6275 129 78.0001 129H30.0001ZM12.0001 101.999C12.0001 98.6856 14.6864 95.9993 18.0001 95.9993H45.0001C48.3138 95.9993 51.0001 98.6856 51.0001 101.999C51.0001 105.313 48.3138 107.999 45.0001 107.999H18.0001C14.6864 107.999 12.0001 105.313 12.0001 101.999ZM18.0001 68.9999C14.6864 68.9999 12.0001 71.6862 12.0001 74.9999C12.0001 78.3136 14.6864 80.9999 18.0001 80.9999H102C105.314 80.9999 108 78.3136 108 74.9999C108 71.6862 105.314 68.9999 102 68.9999H18.0001ZM90 38.999C90 35.6853 92.6863 32.999 96 32.999H180C183.314 32.999 186 35.6853 186 38.999C186 42.3127 183.314 44.999 180 44.999H96C92.6863 44.999 90 42.3127 90 38.999ZM6.00009 171C2.68638 171 9.15527e-05 173.687 9.15527e-05 177C9.15527e-05 180.314 2.68638 183 6.00009 183H90.0001C93.3138 183 96.0001 180.314 96.0001 177C96.0001 173.687 93.3138 171 90.0001 171H6.00009ZM129 63.0011C129 59.6873 131.686 57.0011 135 57.0011H219C222.314 57.0011 225 59.6873 225 63.0011C225 66.3148 222.314 69.0011 219 69.0011H135C131.686 69.0011 129 66.3148 129 63.0011ZM118.6 116.999C113.74 116.999 109.8 120.939 109.8 125.799C109.8 130.659 113.74 134.599 118.6 134.599H191.4C196.261 134.599 200.2 130.659 200.2 125.799C200.2 120.939 196.26 116.999 191.4 116.999H118.6Z" fill="black" />
            </g>
        </g>
        <g opacity="0.1">
            <path fillRule="evenodd" clipRule="evenodd" d="M97.4199 40.687C103.729 36.1034 112.271 36.1034 118.58 40.687L168.749 77.1368C175.058 81.7204 177.698 89.8451 175.288 97.2615L156.125 156.239C153.715 163.655 146.804 168.676 139.006 168.676H76.9939C69.1958 168.676 62.2846 163.655 59.8749 156.239L40.712 97.2615C38.3023 89.8451 40.9422 81.7204 47.2509 77.1369L97.4199 40.687Z" fill="#07C32F" style={{ mixBlendMode: "multiply" }} />
        </g>
        <g filter={`url(#filter0_d_503_13460_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M84 108H132V205.009C132 207.272 129.591 208.72 127.593 207.659L108 197.25L88.4075 207.659C86.4093 208.72 84 207.272 84 205.009V108Z" fill="#128204" />
        </g>
        <mask id={`mask1_503_13460_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="84" y="108" width="48" height="101">
            <path fillRule="evenodd" clipRule="evenodd" d="M84 108H132V205.009C132 207.272 129.591 208.72 127.593 207.659L108 197.25L88.4075 207.659C86.4093 208.72 84 207.272 84 205.009V108Z" fill="white" />
        </mask>
        <g mask={`url(#mask1_503_13460_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M96 156H120V210H96V156Z" fill="#0A7D00" />
        </g>
        <path opacity="0.2" fillRule="evenodd" clipRule="evenodd" d="M100.947 50.1246C105.153 47.0688 110.848 47.0688 115.054 50.1246L166.57 87.5532C170.775 90.6089 172.535 96.0253 170.929 100.97L151.252 161.53C149.645 166.475 145.038 169.822 139.839 169.822H76.1615C70.9628 169.822 66.3553 166.475 64.7488 161.53L45.0714 100.97C43.4649 96.0253 45.2248 90.6089 49.4307 87.5532L100.947 50.1246Z" fill="#07C32F" style={{ mixBlendMode: "multiply" }} />
        <path fillRule="evenodd" clipRule="evenodd" d="M100.947 44.1246C105.152 41.0689 110.848 41.0689 115.053 44.1246L166.569 81.5532C170.775 84.6089 172.535 90.0254 170.929 94.9696L151.251 155.53C149.645 160.475 145.037 163.822 139.839 163.822H76.1613C70.9626 163.822 66.3551 160.475 64.7486 155.53L45.0713 94.9696C43.4648 90.0254 45.2247 84.6089 49.4305 81.5532L100.947 44.1246Z" fill={`url(#paint1_linear_503_13460_${id})`} stroke="#FEFFFF" strokeOpacity="0.2" strokeWidth="3" />
        <mask id={`mask2_503_13460_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="42" y="40" width="132" height="126">
            <path fillRule="evenodd" clipRule="evenodd" d="M100.947 44.1246C105.152 41.0689 110.848 41.0689 115.053 44.1246L166.569 81.5532C170.775 84.6089 172.535 90.0254 170.929 94.9696L151.251 155.53C149.645 160.475 145.037 163.822 139.839 163.822H76.1613C70.9626 163.822 66.3551 160.475 64.7486 155.53L45.0713 94.9696C43.4648 90.0254 45.2247 84.6089 49.4305 81.5532L100.947 44.1246Z" fill="white" stroke="white" strokeWidth="3" />
        </mask>
        <g mask={`url(#mask2_503_13460_${id})`}>
            <path d="M114.172 45.3381C110.492 42.6643 105.508 42.6643 101.828 45.3381L50.3122 82.7667C46.6321 85.4405 45.0922 90.1798 46.4979 94.506L66.1753 155.067C67.581 159.393 71.6125 162.322 76.1614 162.322H139.839C144.388 162.322 148.419 159.393 149.825 155.067L169.502 94.506C170.908 90.1798 169.368 85.4405 165.688 82.7667L114.172 45.3381Z" stroke="#94BD99" strokeWidth="3" strokeLinecap="round" />
            <path d="M149.825 155.067L169.502 94.5061" stroke="#B1D0B3" strokeWidth="3" strokeLinecap="round" />
            <path d="M46.4978 94.5061L66.1752 155.067" stroke="#B1D0B3" strokeWidth="3" strokeLinecap="round" />
            <path d="M169.502 94.506C170.908 90.1798 169.368 85.4405 165.688 82.7667L114.172 45.3381C110.492 42.6643 105.508 42.6643 101.828 45.3381L50.3122 82.7667C46.6321 85.4405 45.0922 90.1798 46.4979 94.506" stroke="#C3E6E7" strokeWidth="3" strokeLinecap="round" />
            <path opacity="0.4" d="M114.172 45.3381C110.492 42.6643 105.508 42.6643 101.828 45.3381L50.3123 82.7667" stroke="#E5FEFF" strokeWidth="3" strokeLinecap="round" />
            <path d="M101.828 45.3381L88.9492 54.6953" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter1_d_503_13460_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M104.473 62.5623C106.576 61.0344 109.424 61.0344 111.527 62.5623L150.124 90.6049C152.227 92.1327 153.107 94.8409 152.304 97.3131L137.561 142.687C136.758 145.159 134.454 146.833 131.854 146.833H84.1456C81.5462 146.833 79.2425 145.159 78.4392 142.687L63.6964 97.3131C62.8931 94.8409 63.7731 92.1327 65.876 90.6049L104.473 62.5623Z" fill={`url(#paint2_linear_503_13460_${id})`} />
            <path d="M103.592 61.3486C106.22 59.439 109.78 59.439 112.408 61.3486L151.006 89.3916C153.634 91.3014 154.734 94.6864 153.73 97.7764L138.987 143.15C137.983 146.241 135.104 148.333 131.854 148.333H84.1455C80.8963 148.333 78.0167 146.241 77.0127 143.15L62.2695 97.7764C61.2657 94.6864 62.3657 91.3014 64.9941 89.3916L103.592 61.3486Z" stroke="#94A0A4" strokeOpacity="0.06" strokeWidth="3" />
        </g>
        <mask id={`mask3_503_13460_${id}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="63" y="61" width="90" height="86">
            <path fillRule="evenodd" clipRule="evenodd" d="M104.473 62.5623C106.576 61.0344 109.424 61.0344 111.527 62.5623L150.124 90.6049C152.227 92.1327 153.107 94.8409 152.304 97.3131L137.561 142.687C136.758 145.159 134.454 146.833 131.854 146.833H84.1456C81.5462 146.833 79.2425 145.159 78.4392 142.687L63.6964 97.3131C62.8931 94.8409 63.7731 92.1327 65.876 90.6049L104.473 62.5623Z" fill="white" />
        </mask>
        <g mask={`url(#mask3_503_13460_${id})`}>
            <g opacity="0.2" style={{ mixBlendMode: "multiply" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M108 108L60 120V96L108 108ZM108 108L120 60H96L108 108ZM108 108L156 96V120L108 108ZM108 108L133.456 65.5736L150.426 82.5442L108 108ZM108 108L133.456 150.426L150.426 133.456L108 108ZM108 108L96 156H120L108 108ZM108 108L82.5442 150.426L65.5736 133.456L108 108Z" fill={`url(#paint3_linear_503_13460_${id})`} />
                <path d="M82.5442 65.5736L65.5736 82.5442L108 108L82.5442 65.5736Z" fill={`url(#paint4_linear_503_13460_${id})`} />
            </g>
            <path d="M100.531 67.2809C98.4479 68.7941 96.8396 69.9626 95.7057 70.7864" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g filter={`url(#filter2_d_503_13460_${id})`}>
            <path d="M100.349 97.4699L108 86.3068L115.651 97.4699L128.631 101.296L120.379 112.022L120.751 125.55L108 121.016L95.249 125.55L95.621 112.022L87.3684 101.296L100.349 97.4699Z" fill="white" />
            <path d="M108 83.3068C108.99 83.3069 109.916 83.7944 110.475 84.6105L117.522 94.8927L129.48 98.4191C130.429 98.6988 131.179 99.4283 131.485 100.369C131.79 101.31 131.612 102.342 131.009 103.126L123.407 113.005L123.75 125.468C123.777 126.457 123.314 127.396 122.514 127.978C121.713 128.559 120.677 128.709 119.745 128.377L107.999 124.2L96.2542 128.377C95.322 128.709 94.286 128.559 93.4856 127.978C92.6851 127.396 92.2231 126.457 92.2502 125.468L92.592 113.006L84.9905 103.126C84.3871 102.342 84.2091 101.31 84.5149 100.369C84.8206 99.4284 85.5709 98.6989 86.5198 98.4191L98.4768 94.8937L105.526 84.6105L105.634 84.462C106.2 83.7357 107.072 83.3068 108 83.3068Z" stroke="white" strokeWidth="6" strokeLinejoin="round" />
        </g>
        <g filter={`url(#filter3_i_503_13460_${id})`}>
            <path d="M100.349 97.4699L108 86.3068L115.651 97.4699L128.631 101.296L120.379 112.022L120.751 125.55L108 121.016L95.249 125.55L95.621 112.022L87.3684 101.296L100.349 97.4699Z" fill={`url(#paint5_linear_503_13460_${id})`} />
        </g>
        <path d="M100.349 97.4699L108 86.3068L115.651 97.4699L128.631 101.296L120.379 112.022L120.751 125.55L108 121.016L95.249 125.55L95.621 112.022L87.3684 101.296L100.349 97.4699Z" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <g filter={`url(#filter4_d_503_13460_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M91.8218 148.56L90.7831 148.15C90.1479 147.9 89.836 147.182 90.0866 146.546C90.2122 146.228 90.4645 145.975 90.7831 145.85L91.8218 145.44C93.0196 144.968 93.9677 144.02 94.4401 142.822L94.8498 141.783C95.1003 141.148 95.8184 140.836 96.4536 141.087C96.7723 141.212 97.0245 141.464 97.1502 141.783L97.5599 142.822C98.0323 144.02 98.9804 144.968 100.178 145.44L101.217 145.85C101.852 146.1 102.164 146.818 101.913 147.454C101.788 147.772 101.536 148.025 101.217 148.15L100.178 148.56C98.9804 149.032 98.0323 149.98 97.5599 151.178L97.1502 152.217C96.8997 152.852 96.1816 153.164 95.5464 152.913C95.2277 152.788 94.9755 152.536 94.8498 152.217L94.4401 151.178C93.9677 149.98 93.0196 149.032 91.8218 148.56Z" fill="#097A00" />
        </g>
        <g filter={`url(#filter5_d_503_13460_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M143.277 96.4498L141.979 95.9378C141.185 95.6246 140.795 94.727 141.108 93.9329C141.265 93.5346 141.581 93.2193 141.979 93.0622L143.277 92.5502C144.774 91.9597 145.96 90.7745 146.55 89.2773L147.062 87.9789C147.375 87.1849 148.273 86.795 149.067 87.1082C149.465 87.2653 149.781 87.5806 149.938 87.9789L150.45 89.2773C151.04 90.7745 152.226 91.9597 153.723 92.5502L155.021 93.0622C155.815 93.3754 156.205 94.273 155.892 95.0671C155.735 95.4654 155.419 95.7807 155.021 95.9378L153.723 96.4498C152.226 97.0403 151.04 98.2255 150.45 99.7227L149.938 101.021C149.625 101.815 148.727 102.205 147.933 101.892C147.535 101.735 147.219 101.419 147.062 101.021L146.55 99.7227C145.96 98.2255 144.774 97.0403 143.277 96.4498Z" fill="#075B23" />
        </g>
        <g filter={`url(#filter6_d_503_13460_${id})`}>
            <path fillRule="evenodd" clipRule="evenodd" d="M70.3664 110.67L69.5874 110.363C69.1109 110.175 68.877 109.636 69.0649 109.16C69.1592 108.921 69.3484 108.732 69.5874 108.637L70.3664 108.33C71.2647 107.976 71.9758 107.265 72.3301 106.366L72.6373 105.587C72.8252 105.111 73.3638 104.877 73.8402 105.065C74.0792 105.159 74.2684 105.348 74.3627 105.587L74.6699 106.366C75.0242 107.265 75.7353 107.976 76.6336 108.33L77.4126 108.637C77.8891 108.825 78.123 109.364 77.9351 109.84C77.8408 110.079 77.6516 110.268 77.4126 110.363L76.6336 110.67C75.7353 111.024 75.0242 111.735 74.6699 112.634L74.3627 113.413C74.1748 113.889 73.6362 114.123 73.1598 113.935C72.9208 113.841 72.7316 113.652 72.6373 113.413L72.3301 112.634C71.9758 111.735 71.2647 111.024 70.3664 110.67Z" fill="#075B23" />
        </g>
        <defs>
            <filter id={`filter0_d_503_13460_${id}`} x="78" y="108" width="60" height="112.013" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="6" />
                <feGaussianBlur stdDeviation="3" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.333333 0 0 0 0 0.790431 0 0 0 0 0.819608 0 0 0 0.2 0" />
                <feBlend mode="darken" in2="BackgroundImageFix" result="effect1_dropShadow_503_13460" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_503_13460" result="shape" />
            </filter>
            <filter id={`filter1_d_503_13460_${id}`} x="54.4021" y="55.4164" width="107.196" height="103.416" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="3" />
                <feGaussianBlur stdDeviation="3" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.0196078 0 0 0 0 0.443137 0 0 0 0 0.643137 0 0 0 0.12 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_503_13460" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_503_13460" result="shape" />
            </filter>
            <filter id={`filter2_d_503_13460_${id}`} x="75.3683" y="77.3068" width="65.2632" height="63.2435" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="3" />
                <feGaussianBlur stdDeviation="3" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.596078 0 0 0 0 0.745098 0 0 0 0 0.780392 0 0 0 0.5 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_503_13460" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_503_13460" result="shape" />
            </filter>
            <filter id={`filter3_i_503_13460_${id}`} x="84.3684" y="83.3068" width="47.2631" height="48.2435" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="3" />
                <feGaussianBlur stdDeviation="1.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.508286 0 0 0 0 0.694443 0 0 0 0 0.72829 0 0 0 0.4 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_503_13460" />
            </filter>
            <filter id={`filter4_d_503_13460_${id}`} x="84" y="135" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="3" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.705882 0 0 0 0 0.823529 0 0 0 0 0.831373 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_503_13460" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_503_13460" result="shape" />
            </filter>
            <filter id={`filter5_d_503_13460_${id}`} x="135" y="81" width="27" height="27" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="3" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.705882 0 0 0 0 0.823529 0 0 0 0 0.831373 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_503_13460" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_503_13460" result="shape" />
            </filter>
            <filter id={`filter6_d_503_13460_${id}`} x="63" y="99" width="21" height="21" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset />
                <feGaussianBlur stdDeviation="3" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.705882 0 0 0 0 0.823529 0 0 0 0 0.831373 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_503_13460" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_503_13460" result="shape" />
            </filter>
            <linearGradient id={`paint0_linear_503_13460_${id}`} x1="24" y1="24" x2="24" y2="192" gradientUnits="userSpaceOnUse">
                <stop stopColor="#166B1B" />
                <stop offset="1" stopColor="#40E864" />
            </linearGradient>
            <linearGradient id={`paint1_linear_503_13460_${id}`} x1="39" y1="39" x2="39" y2="177" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C4ECEB" />
                <stop offset="1" stopColor="#A7BCC1" />
            </linearGradient>
            <linearGradient id={`paint2_linear_503_13460_${id}`} x1="60" y1="60" x2="60" y2="156" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F0FBFE" />
                <stop offset="1" stopColor="#C0DCDC" />
            </linearGradient>
            <linearGradient id={`paint3_linear_503_13460_${id}`} x1="64.439" y1="60" x2="64.439" y2="147.122" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1DE949" />
                <stop offset="1" stopColor="#329802" stopOpacity="0.57" />
            </linearGradient>
            <linearGradient id={`paint4_linear_503_13460_${id}`} x1="64.439" y1="60" x2="64.439" y2="147.122" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1DE949" />
                <stop offset="1" stopColor="#329802" stopOpacity="0.57" />
            </linearGradient>
            <linearGradient id={`paint5_linear_503_13460_${id}`} x1="87.3684" y1="86.3068" x2="87.3684" y2="125.55" gradientUnits="userSpaceOnUse">
                <stop stopColor="#31A431" />
                <stop offset="1" stopColor="#2B7610" />
            </linearGradient>
        </defs>
    </svg>

    );
};

export default HeroSVG;
