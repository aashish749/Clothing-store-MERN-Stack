import React from "react";
import Title from "./Title";
const WhyChooseUs = () => {
  return (
    <div className="mb-10">
      <Title text1={"WHY"} text2={"CHOOSE US"} />
      <div className="container flex flex-col md:flex-row  mt-8">
        <div className="flex flex-col justify-center gap-1 border border-gray-200  px-5 py-16 w-full md:w-1/3">
          <h3 className="text-md font-bold">Quality Assurance:</h3>
          <p className="text-gray-500">
            We meticulously select and vet each product to ensure it meets our
            stringent quality standards.
          </p>
        </div>{" "}
        <div className="flex flex-col justify-center gap-1 border border-gray-200  px-5 py-13 w-full md:w-1/3">
          <h3 className="text-md font-bold">Convenience</h3>
          <p className="text-gray-500">
            With our user-friendly interface and hassle-free ordering process,
            shopping has never been easier.
          </p>
        </div>{" "}
        <div className="flex flex-col justify-center gap-1 border border-gray-200  px-5 py-13 w-full md:w-1/3">
          <h3 className="text-md font-bold">Exceptional Customer Service:</h3>
          <p className="text-gray-500">
            Our team of dedicated professionals is here to assist you the way,
            ensuring your satisfaction is our top priority. .
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseUs;
