import React, { useEffect, useMemo } from "react";
import { createContext, useState } from "react";
import axios from "axios";
export const ShopContext = createContext();
const ShopContextProvider = ({ children }) => {
  const currency = "$";
  const delivery_fee = 5;
  const [products, setProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [cartItems, setCartItems] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartShippingFee, setCartShippingFee] = useState(0);
  const [shippingFeeConfig, setShippingFeeConfig] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [shippingSettingsLoaded, setShippingSettingsLoaded] = useState(false);
  const [cartItemsArray, setCartItemsArray] = useState([]);

  const calculateShippingFee = (subtotal) => {
    const safeSubtotal = Number(subtotal || 0);
    const safeFee = Number(shippingFeeConfig || 0);
    const safeThreshold = Number(freeShippingThreshold || 0);

    if (safeSubtotal <= 0) return 0;
    if (safeThreshold > 0 && safeSubtotal >= safeThreshold) return 0;
    return safeFee;
  };

  const fetchShippingSettings = async () => {
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const response = await axios.get(`${apiBaseUrl}/api/shipping`);
      const shipping = response.data?.shipping || {};

      setShippingFeeConfig(Number(shipping.fee || 0));
      setFreeShippingThreshold(Number(shipping.freeShippingThreshold || 0));
      setShippingSettingsLoaded(true);
      return {
        fee: Number(shipping.fee || 0),
        threshold: Number(shipping.freeShippingThreshold || 0),
      };
    } catch (error) {
      console.error("Failed to fetch shipping settings:", error);
      setShippingSettingsLoaded(false);
      return null;
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const response = await axios.get(
        `${apiBaseUrl}/api/site-settings/public`,
      );
      const settings = response.data?.settings || {};
      setSiteSettings(settings);
      return settings;
    } catch (error) {
      console.error("Failed to fetch site settings:", error);
      setSiteSettings({});
      return null;
    }
  };

  const mapCartPayloadToState = (cartPayload) => {
    const items = cartPayload?.items || [];
    const mappedItems = items.map((item) => ({
      itemId: item._id,
      productid: item.productId,
      quantity: item.quantity,
      name: item.product?.name || "Unnamed Product",
      price: Number(item.priceAtAdd || item.product?.price || 0),
      image:
        item.product?.images?.[0] ||
        "https://via.placeholder.com/120x140?text=No+Image",
      selectedOptions: item.selectedOptions || {},
      size:
        item.selectedOptions?.option1Value ||
        item.selectedOptions?.option2Value ||
        "",
    }));

    setCartItemsArray(mappedItems);
    setCartTotal(Number(cartPayload?.summary?.subtotal || 0));
    setCartCount(Number(cartPayload?.summary?.itemCount || 0));

    const subtotal = Number(cartPayload?.summary?.subtotal || 0);
    const shippingFromSettings = calculateShippingFee(subtotal);
    const fallbackShipping = Number(cartPayload?.summary?.shippingFee || 0);
    setCartShippingFee(
      shippingSettingsLoaded && Number.isFinite(shippingFromSettings)
        ? shippingFromSettings
        : fallbackShipping,
    );
  };

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCartItemsArray([]);
      setCartTotal(0);
      setCartCount(0);
      setCartShippingFee(0);
      return;
    }

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const response = await axios.get(`${apiBaseUrl}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchShippingSettings();

      mapCartPayloadToState(response.data?.cart);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setCartItemsArray([]);
      setCartTotal(0);
      setCartCount(0);
      setCartShippingFee(0);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

        const firstResponse = await axios.get(
          `${apiBaseUrl}/api/products/list?pageNumber=1`,
        );

        const firstPageProducts = firstResponse.data?.products || [];
        const totalPages = firstResponse.data?.pages || 1;

        let allProducts = [...firstPageProducts];

        if (totalPages > 1) {
          for (let page = 2; page <= totalPages; page += 1) {
            const response = await axios.get(
              `${apiBaseUrl}/api/products/list?pageNumber=${page}`,
            );
            allProducts = [...allProducts, ...(response.data?.products || [])];
          }
        }

        const normalizedProducts = allProducts.map((product) => ({
          ...product,
          image: product.images || product.image || [],
        }));

        setProducts(normalizedProducts);
        // Fetch best sellers from backend (uses sales aggregation)
        try {
          const bestResp = await axios.get(
            `${apiBaseUrl}/api/products/list?pageNumber=1&sortBy=sales&sortOrder=desc`,
          );
          setBestSellers(bestResp.data?.products?.slice(0, 5) || []);
        } catch (err) {
          console.error("Failed to fetch best sellers:", err);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (!shippingSettingsLoaded) return;
    setCartShippingFee(calculateShippingFee(cartTotal));
  }, [
    shippingSettingsLoaded,
    shippingFeeConfig,
    freeShippingThreshold,
    cartTotal,
  ]);

  const latestProducts = useMemo(() => {
    try {
      return [...products]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    } catch (err) {
      return products.slice(0, 10);
    }
  }, [products]);

  let cartData = structuredClone(cartItems);
  const addToCart = (product_id, size) => {
    if (!size) {
      alert("Please select a size before adding to cart.");
      return;
    }
    if (cartData[product_id]) {
      if (cartData[product_id][size]) {
        cartData[product_id][size] += 1;
      } else {
        cartData[product_id][size] = 1;
      }
    } else {
      cartData[product_id] = {};
      cartData[product_id][size] = 1;
    }
    setCartItems(cartData);
  };
  const [size, setSize] = useState("");
  //updating the cart

  const updateCart = async ({ itemId, quantity }) => {
    const token = localStorage.getItem("token");
    if (!token || !itemId) return;

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const response = await axios.put(
        `${apiBaseUrl}/api/cart/items/${itemId}`,
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      mapCartPayloadToState(response.data?.cart);
    } catch (error) {
      console.error("Failed to update cart item:", error);
    }
  };
  const deleteCart = async ({ itemId }) => {
    const token = localStorage.getItem("token");
    if (!token || !itemId) return;

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

      const response = await axios.delete(
        `${apiBaseUrl}/api/cart/items/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      mapCartPayloadToState(response.data?.cart);
    } catch (error) {
      console.error("Failed to delete cart item:", error);
    }
  };
  const value = {
    products,
    currency,
    delivery_fee,
    latestProducts,
    bestSellers,
    cartItems,
    setCartItems,
    addToCart,
    cartCount,
    setCartCount,
    cartTotal,
    cartShippingFee,
    size,
    setSize,
    cartData,
    cartItemsArray,
    setCartItemsArray,
    fetchCart,
    updateCart,
    deleteCart,
    siteSettings,
  };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
