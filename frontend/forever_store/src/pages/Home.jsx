import React from "react";
import Hero from "../components/Hero";
import Title from "../components/Title";
import OurPolicy from "../components/OurPolicy";
import NewsLetterBox from "../components/NewsLetterBox";
import LatestCollection from "../components/LatestCollection";
import BestSellersComp from "../components/BestSellers";
const Home = () => {
  return (
    <div>
      <Hero></Hero>

      <LatestCollection></LatestCollection>
      <BestSellersComp></BestSellersComp>
      <OurPolicy></OurPolicy>
      <NewsLetterBox></NewsLetterBox>
    </div>
  );
};

export default Home;
