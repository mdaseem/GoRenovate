import React, { useState } from "react";
import "./ImageCarousel.css";
import Image from "next/image";

export const ImageCarousel = (props: { imageUrl: string[] }) => {
  const RealData = props.imageUrl;
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [clickRight, setClickRight] = useState(false);
  const currentImage = RealData?.[currentImgIndex];

  return (
    <>
      <div className="trending-main-container">
        <button
          className="btn-left"
          onClick={() => {
            setClickRight(false);
            if (currentImgIndex === 0) {
              setCurrentImgIndex(RealData.length - 1);
            } else {
              setCurrentImgIndex(currentImgIndex - 1);
            }
          }}
        >
          <i className="fa-solid fa-less-than btn-color"></i>
        </button>
        <div className="carousel-container">
          <Image
            className={`carousel-img ${
              clickRight ? "right-transition" : "left-transition"
            }`}
            src={currentImage}
            alt="Carousel Image"
            key={Math.random()}
            width={230}
            height={220}
          />
          <p className="img-number">
            {currentImgIndex + 1}/{RealData.length}
          </p>
        </div>
        <button
          className="btn-right"
          onClick={() => {
            setClickRight(true);
            if (currentImgIndex === RealData?.length - 1) {
              setCurrentImgIndex(0);
            } else {
              setCurrentImgIndex(currentImgIndex + 1);
            }
          }}
        >
          <i className="fa-solid fa-greater-than btn-color"></i>
        </button>
      </div>
    </>
  );
};
