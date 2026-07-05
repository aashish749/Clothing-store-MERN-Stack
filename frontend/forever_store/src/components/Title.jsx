import React from "react";

const Title = ({ text1, text2, para }) => {
  return (
    <div className="section">
      <div className="flex  justify-start items-center mt-5">
        <div className="flex text-gray-500 mx-auto  text-3xl md:text-3xl gap-2 font-medium   text-center md:text-left  items-center">
          <h1 className="">
            {text1}{" "}
            <span className="text-[#414141] text-3xl md:text-3xl">{text2}</span>
          </h1>
          <hr className="w-8 md:w-11 h-[2px] bg-gray-500 font-bold  md:block" />
        </div>
      </div>
      <p className="container text-center px-4  mt-3">{para}</p>
    </div>
  );
};
export const TitleLeft = ({ text1, text2, para }) => {
  return (
    <div className="section">
      <div className="flex container w-full  items-center mt-5">
        <div className="flex text-gray-500 w-full  text-xl md:text-2xl gap-2 font-medium   text-left md:text-left  items-center">
          <h1 className="">
            {text1}{" "}
            <span className="text-[#414141] text-xl md:text-2xl">{text2}</span>
          </h1>
          <hr className="w-8 md:w-11 h-[2px] bg-gray-500 font-bold  md:block" />
        </div>
      </div>
      <p className="container text-center px-4  mt-3">{para}</p>
    </div>
  );
};

export default Title;
