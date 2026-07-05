import { useContext } from "react";
import { ShopContext } from "../context";
import Title from "./Title";
import Card from "./Card";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  const { latestProducts } = useContext(ShopContext);
  // LatestCollection.jsx
  return (
    <div className=" container md:px-4  ">
      <Title
        text1={"LATEST"}
        text2={"COLLECTIONS"}
        para={
          "Discover our newest arrivals — fresh styles curated to keep you ahead of the trends."
        }
      />
      <div className="mt-10"></div>
      {/* grid-cols-2: Mobile (default)
      sm:grid-cols-3: Tablets
      lg:grid-cols-5: Desktop (1024px+)
    */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {latestProducts.map((product) => (
          <Card key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default LatestCollection;
