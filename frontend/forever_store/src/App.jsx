import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Orders from "./pages/Orders";
import PlaceOrder from "./pages/PlaceOrder";
import Product from "./pages/Product";
import Collection from "./pages/Collection";
import MyProfile from "./pages/MyProfile";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster
        position="bottom-left"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "6px",
            fontSize: "14px",
          },
        }}
      />
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <Navbar></Navbar>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Product needs a dynamic ID to know which item to show */}
            <Route path="/product/:productId" element={<Product />} />

            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/place-order" element={<PlaceOrder />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer></Footer>
      </div>
    </>
  );
}

export default App;
