export const menuOpen = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width="26px"
            height="26px"
            className="menu-icon"
          >
            <linearGradient
              id="9iHXMuvV7brSX7hFt~tsna"
              x1="12.066"
              x2="34.891"
              y1=".066"
              y2="22.891"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".237" stopColor="#3bc9f3" />
              <stop offset=".85" stopColor="#1591d8" />
            </linearGradient>
            <path
              fill="url(#9iHXMuvV7brSX7hFt~tsna)"
              d="M43,15H5c-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h38c1.1,0,2,0.9,2,2v2C45,14.1,44.1,15,43,15z"
            />
            <linearGradient
              id="9iHXMuvV7brSX7hFt~tsnb"
              x1="12.066"
              x2="34.891"
              y1="12.066"
              y2="34.891"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".237" stopColor="#3bc9f3" />
              <stop offset=".85" stopColor="#1591d8" />
            </linearGradient>
            <path
              fill="url(#9iHXMuvV7brSX7hFt~tsnb)"
              d="M43,27H5c-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h38c1.1,0,2,0.9,2,2v2C45,26.1,44.1,27,43,27z"
            />
            <linearGradient
              id="9iHXMuvV7brSX7hFt~tsnc"
              x1="12.066"
              x2="34.891"
              y1="24.066"
              y2="46.891"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".237" stopColor="#3bc9f3" />
              <stop offset=".85" stopColor="#1591d8" />
            </linearGradient>
            <path
              fill="url(#9iHXMuvV7brSX7hFt~tsnc)"
              d="M43,39H5c-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h38c1.1,0,2,0.9,2,2v2C45,38.1,44.1,39,43,39z"
            />
          </svg>
    );
}

export const menuClose = (setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
  return <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36px"
          height="36px"
          viewBox="0 0 24 24"
          fill="none"
          className="close-icon"
          onClick={() => setIsMenuOpen(false)}
        >
          <path
            //   className="close-menu"
            d="M6.99486 7.00636C6.60433 7.39689 6.60433 8.03005 6.99486 8.42058L10.58 12.0057L6.99486 15.5909C6.60433 15.9814 6.60433 16.6146 6.99486 17.0051C7.38538 17.3956 8.01855 17.3956 8.40907 17.0051L11.9942 13.4199L15.5794 17.0051C15.9699 17.3956 16.6031 17.3956 16.9936 17.0051C17.3841 16.6146 17.3841 15.9814 16.9936 15.5909L13.4084 12.0057L16.9936 8.42059C17.3841 8.03007 17.3841 7.3969 16.9936 7.00638C16.603 6.61585 15.9699 6.61585 15.5794 7.00638L11.9942 10.5915L8.40907 7.00636C8.01855 6.61584 7.38538 6.61584 6.99486 7.00636Z"
            fill="#3bc9f3"
          />
        </svg>
}
