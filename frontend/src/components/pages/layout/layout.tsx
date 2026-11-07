import { Outlet } from "react-router-dom";
import { Sidebar } from "../../sidebar/sidebar";
import styles from "./layout.module.css";

export const Layout = () => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <svg
        className={styles.sun}
        width="998"
        height="832"
        viewBox="0 0 998 832"
        fill="radial-gradient(28.88% 29.71% at 75.85% 39.78%, rgb(255, 220, 150) 0%, rgb(236, 179, 65) 24.829933047294617%, rgb(222, 134, 57) 49.65986609458923%, rgb(234, 80, 18) 100%), radial-gradient(29.94% 30.79% at 62.18% 38.72%, rgb(188, 255, 0) 0%, rgb(211, 248, 107) 25.961539149284363%, rgb(34, 42, 126) 68.80730390548706%, rgb(19, 23, 59) 100%);"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#filter0_f_57_3)">
          <path
            d="M1317.97 147.699C1317.97 379.273 1052.36 852.397 986.068 681.5C892.97 441.5 -148.03 368 525.47 90.6518C739.598 2.47363 802.764 -271.601 986.068 -271.601C1169.37 -271.601 1317.97 -83.8738 1317.97 147.699Z"
            fill="url(#paint0_radial_57_3)"
          />
          <path
            d="M1317.97 147.699C1317.97 379.273 1052.36 852.397 986.068 681.5C892.97 441.5 -148.03 368 525.47 90.6518C739.598 2.47363 802.764 -271.601 986.068 -271.601C1169.37 -271.601 1317.97 -83.8738 1317.97 147.699Z"
            fill="url(#paint1_radial_57_3)"
          />
        </g>
        <defs>
          <filter
            id="filter0_f_57_3"
            x="0"
            y="-571.601"
            width="1617.97"
            height="1589.53"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="150"
              result="effect1_foregroundBlur_57_3"
            />
          </filter>
          <radialGradient
            id="paint0_radial_57_3"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(920.97 122) rotate(90) scale(294 294)"
          >
            <stop stopColor="#FFDC96" />
            <stop offset="0.248299" stopColor="#ECB341" />
            <stop offset="0.496599" stopColor="#DE8639" />
            <stop offset="1" stopColor="#EA5012" />
          </radialGradient>
          <radialGradient
            id="paint1_radial_57_3"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(932.97 111.5) rotate(92.2567) scale(304.737 304.736)"
          >
            <stop stopColor="#BCFF00" />
            <stop offset="0.259615" stopColor="#D3F86B" />
            <stop offset="0.688073" stopColor="#222A7E" />
            <stop offset="1" stopColor="#13173B" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};
