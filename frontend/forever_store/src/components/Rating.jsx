import { IoStar, IoStarHalf, IoStarOutline } from "react-icons/io5";

const Rating = ({ rating }) => {
  const safeRating = Number(rating || 0);

  return (
    <div className="flex items-center gap-[2px] my-1">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        if (safeRating >= starValue) {
          return <IoStar key={index} className="text-black text-[15px]" />;
        } else {
          if (safeRating >= starValue - 0.5) {
            return (
              <IoStarHalf key={index} className="text-black text-[15px]" />
            );
          } else {
            return (
              <IoStarOutline key={index} className="text-black text-[15px]" />
            );
          }
        }
      })}
    </div>
  );
};

export default Rating;
