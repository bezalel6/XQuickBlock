import React from "react";
import styled from "@emotion/styled";
import { Tooltip } from "@mui/material";

const Button = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #ffdd00;
  color: #000000;
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;
const STEAM_RISE_DISTANCE = -12;
const STEAM_DURATION = 1.5; // seconds
const STEAM_DELAY = 0.4; // seconds
const Steam: React.FC<React.SVGProps<SVGPathElement> & { offset: number }> = ({
  offset,
  ...props
}) => (
  <path
    d={`M${6 + 4 * offset} 1V4`}
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);

const CoffeeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={24}
    height={24}
    overflow={"visible"}
    stroke={"black"}
    fill="white"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* <!-- Coffee Cup --> */}
    <path
      d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18"
      stroke="currentColor"
      strokeWidth="2"
      fillOpacity={0}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 8H18V17C18 18.0609 17.5786 19.0783 16.8284 19.8284C16.0783 20.5786 15.0609 21 14 21H6C4.93913 21 3.92172 20.5786 3.17157 19.8284C2.42143 19.0783 2 18.0609 2 17V8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* <!-- Steam lines with staggered animation --> */}
    {/* First steam line */}
    <Steam offset={0}>
      <animateTransform
        attributeName="transform"
        type="translate"
        values={`0,0; 0,${STEAM_RISE_DISTANCE}`}
        dur={`${STEAM_DURATION}s`}
        repeatCount="indefinite"
      />
    </Steam>

    {/* Second steam line */}
    <Steam offset={1}>
      <animateTransform
        attributeName="transform"
        type="translate"
        values={`0,0; 0,${STEAM_RISE_DISTANCE}`}
        dur={`${STEAM_DURATION}s`}
        begin={`${STEAM_DELAY * 2}s`}
        repeatCount="indefinite"
      />
    </Steam>

    {/* Third steam line */}
    <Steam offset={2}>
      <animateTransform
        attributeName="transform"
        type="translate"
        values={`0,0; 0,${STEAM_RISE_DISTANCE}`}
        dur={`${STEAM_DURATION}s`}
        begin={`${STEAM_DELAY}s`}
        repeatCount="indefinite"
      />
    </Steam>
  </svg>
);

const BuyMeACoffee = () => {
  return (
    <Tooltip title="Buy me a coffee">
      <Button
        style={{ overflow: "hidden" }}
        href="https://www.buymeacoffee.com/RNDev"
        target="_blank"
        rel="noopener noreferrer"
      >
        <CoffeeIcon />
      </Button>
    </Tooltip>
  );
};

export default BuyMeACoffee;
