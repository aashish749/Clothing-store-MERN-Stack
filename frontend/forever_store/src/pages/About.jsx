import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/frontend_assets/assets";
import WhyChooseUs from "../components/WhyChooseUs";
import Footer from "../components/Footer";
import NewsLetterBox from "../components/NewsLetterBox";

const About = () => {
  return (
    <div>
      <div>
        <hr className="container text-gray-200 mb-8" />
        <Title text1={"ABOUT"} text2={"US"}></Title>
        <div className="container flex flex-col md:flex-row gap-10 lg:gap-15 mt-8 mb-10">
          <div className="w-full md:w-5/12 md:max-w-[450px] ">
            <img
              src={assets.about_img}
              alt=""
              className="w-full h-auto object-cover"
            />
          </div>{" "}
          <div className="w-full md:w-6/12 flex flex-col gap-4 justify-center ">
            <p>
              Forever was born out of a passion for innovation and a desire to
              revolutionize the way people shop online. Our journey began with a
              simple idea: to provide a platform where customers can easily
              discover, explore, and purchase a wide range of products from the
              comfort of their homes.
            </p>
            <p>
              Since our inception, we've worked tirelessly to curate a diverse
              selection of high-quality products that cater to every taste and
              preference. From fashion and beauty to electronics and home
              essentials, we offer an extensive collection sourced from trusted
              brands and suppliers.
            </p>
            <h3 className="text-md font-bold  ">Our Mission</h3>{" "}
            <p>
              Our mission at Forever is to empower customers with choice,
              convenience, and confidence. We're dedicated to providing a
              seamless shopping experience that exceeds expectations, from
              browsing and ordering to delivery and beyond.
            </p>
          </div>
        </div>
      </div>
      <WhyChooseUs></WhyChooseUs>
      <NewsLetterBox></NewsLetterBox>
    </div>
  );
};

export default About;
