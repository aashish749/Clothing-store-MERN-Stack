import { useContext } from "react";
import { ShopContext } from "../context";
import Title from "./Title";
import Card from "./Card";
import SkeletonCard from "./SkeletonCard";

const BestSellersComp = () => {
  const { bestSellers } = useContext(ShopContext);

  // BestSellers.jsx
  return (
    <div className=" container md:px-4 mt-16">
      <Title
        text1={"BEST"}
        text2={"SELLERS"}
        para={
          "Shop our most-loved products — top picks that our customers can't get enough of."
        }
      />
      <div className="mt-10"></div>
      {/* grid-cols-2: Mobile (default)
      sm:grid-cols-3: Tablets
      lg:grid-cols-5: Desktop (1024px+)
    */}
      {!bestSellers || bestSellers.length === 0 ? (
        <SkeletonCard />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {bestSellers.map((product) => (
            <Card key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BestSellersComp;
