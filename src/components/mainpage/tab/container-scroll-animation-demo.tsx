"use client";
import React from "react";
import { ContainerScroll } from "./container-scroll-animation";

export default function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              Elevate Your Advertising <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                With TechAds Scroll Effects
              </span>
            </h1>
          </>
        }
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          width={1400}
          height={720}
          draggable={false}
        >
          <source src="/landingPage/page.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </ContainerScroll>
    </div>
  );
}
