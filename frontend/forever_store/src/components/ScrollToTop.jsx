import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  // This hook gives us the current URL path
  const { pathname } = useLocation();

  useEffect(() => {
    // Whenever the pathname (URL) changes, scroll to (x: 0, y: 0)
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // This component doesn't need to render anything
};

export default ScrollToTop;
