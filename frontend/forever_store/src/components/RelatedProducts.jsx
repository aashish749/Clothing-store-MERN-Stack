import React from "react";
import { useContext } from "react";
import { ShopContext } from "../context";
import Title from "./Title";
import Card from "./Card";

const RelatedProducts = ({ product }) => {
  const { products } = useContext(ShopContext);
  const category = product.category;
  const subCategory = product.subCategory;
  const RelatedProductsarray = products.filter((item) => {
    return (
      item.category === product.category &&
      item.subCategory === product.subCategory &&
      item._id !== product._id
    );
  });

  // RelatedProducts.jsx
  if (RelatedProductsarray.length === 0) {
    return null; // Don't render the section if there are no related products
  } else {
    return (
      <div className=" container md:px-4  ">
        <Title
          text1={"RELATED"}
          text2={"PRODUCTS"}
          para={
            "Complete your look with items that pair perfectly with your selection."
          }
        />
        <div className="mt-10"></div>
        {/* grid-cols-2: Mobile (default)
      sm:grid-cols-3: Tablets
      lg:grid-cols-5: Desktop (1024px+)
    */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {RelatedProductsarray.map((product) => (
            <Card key={product._id} product={product} />
          ))}
        </div>
      </div>
    );
  }
};

export default RelatedProducts;
