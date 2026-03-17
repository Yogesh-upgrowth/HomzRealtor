"use client";
import React, { useEffect, useState } from "react";
import HomesCard from "@/components/HomeCards";
import { PorjectListingData } from "@/context/utils/ProjectDetails";
import PromoBanner from "@/components/Common/PromoBanner";
import Link from "next/link";

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
};

const ProjectListing = () => {
  // Get the keys ("card1", "card2", etc.) instead of the values

  const homeDataKeys = Object.keys(
    PorjectListingData
  ) as (keyof typeof PorjectListingData)[];
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();
  const cardsPerPage = isMobile ? 4 : 8;
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  // Get the keys for the current page
  const currentCardKeys = homeDataKeys.slice(startIndex, endIndex);
  const totalPages = Math.ceil(homeDataKeys.length / cardsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="max-w-2xl md:max-w-7xl px-4 md:px-0 mx-auto mt-10">
      {/* Title */}
      <div className="flex items-center justify-center gap-4 w-full mb-6 mt-28">
        <div
          className={`md:w-[200px] w-[100px] h-px bg-gradient-to-r from-black/50 to-transparent `}
        />
        <h1
          className={`text-2xl md:text-3xl font-corbert text-black tracking-widest text-center whitespace-nowrap`}
        >
          Explore Homes
        </h1>
        <div
          className={`md:w-[200px] w-[100px] h-px bg-gradient-to-l from-black/50 to-transparent `}
        />
      </div>
      {/* homes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mx-auto items-center mb-2 ">
        {currentCardKeys.map((slug) => {
          // Get the specific home's data using its key (slug)
          const home = PorjectListingData[slug];

          return (
            <Link key={slug} href={`/project-listing/${slug}`}>
              <HomesCard {...home} />
            </Link>
          );
        })}
      </div>

      {/* pagination */}
      <div className="flex justify-center text-2xl items-center space-x-4 mt-8 mb-2">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded disabled:opacity-20 text-[#CEA44E] font-bold  cursor-pointer"
        >
          ˂
        </button>
        {/* page number buttons */}
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            className={`px-4 py-2 rounded text-white  cursor-pointer ${
              currentPage === pageNumber ? "bg-[#CEA44E]" : "bg-[#111111]"
            }`}
            onClick={() => setCurrentPage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        {/* Next Button */}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage == totalPages}
          className="px-3 py-2 rounded disabled:opacity-20 cursor-pointer text-[#CEA44E] font-bold"
        >
          ˃
        </button>
      </div>
      {/* promo Banner */}
      <div className="mb-2 mt-8">
        <PromoBanner
          heading="SPACES CRAFTED FOR YOUR NEXT CHAPTER"
          text="Step into homes that resonate with your aspirations. From timeless architecture to thoughtfully designed interiors, discover properties that elevate everyday living. Your perfect match is just a call away."
          buttonText="CONTACT NOW"
          buttonLink="/contact"
          imageSrc="/appointmentBG.jpg"
        />
      </div>
    </div>
  );
};

export default ProjectListing;
