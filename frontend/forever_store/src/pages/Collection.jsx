import React from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ShopContext } from "../context";
import Card from "../components/Card";
import { TitleLeft } from "../components/Title";
import { assets } from "../assets/frontend_assets/assets";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Range, getTrackBackground } from "react-range";

const Collection = () => {
  const { products } = useContext(ShopContext);
  const [categories, setCategories] = useState([]);
  const [filterButton, setFilterButton] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedRatingRanges, setSelectedRatingRanges] = useState([]);
  const [customMinPrice, setCustomMinPrice] = useState(0);
  const [customMaxPrice, setCustomMaxPrice] = useState(1000);
  const [sortOption, setSortOption] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const location = useLocation();
  const latestSearchQueryRef = useRef("");
  const isPriceInitializedRef = useRef(false);
  const skeletonCards = Array.from({ length: 10 });

  const priceRangeOptions = [
    { value: "below-100", label: "Below $100" },
    { value: "100-200", label: "$100 - $200" },
    { value: "200-500", label: "$200 - $500" },
    { value: "above-500", label: "Above $500" },
  ];

  const ratingRangeOptions = [5, 4, 3];

  const maxAvailablePrice = useMemo(() => {
    const prices = products.map((product) => Number(product?.price || 0));
    const maxPrice = Math.max(...prices, 0);
    return maxPrice > 0 ? maxPrice : 1000;
  }, [products]);

  const minPriceLimit = 0;

  const minSliderPercent =
    ((customMinPrice - minPriceLimit) /
      (maxAvailablePrice - minPriceLimit || 1)) *
    100;
  const maxSliderPercent =
    ((customMaxPrice - minPriceLimit) /
      (maxAvailablePrice - minPriceLimit || 1)) *
    100;

  useEffect(() => {
    if (location.state?.openSearch) {
      setShowSearchBar(true);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

        const response = await axios.get(`${apiBaseUrl}/api/categories/list`);
        setCategories(response.data?.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    // Initialize min/max on first load, and always clamp current values
    // when the computed maxAvailablePrice changes to avoid invalid Range values.
    if (!isPriceInitializedRef.current) {
      setCustomMinPrice(0);
      setCustomMaxPrice(maxAvailablePrice);
      isPriceInitializedRef.current = true;
      return;
    }

    // If products updated and maxAvailablePrice decreased, clamp custom values
    setCustomMinPrice((prev) =>
      Math.max(minPriceLimit, Math.min(prev, maxAvailablePrice)),
    );
    setCustomMaxPrice((prev) =>
      Math.max(minPriceLimit, Math.min(prev, maxAvailablePrice)),
    );
  }, [maxAvailablePrice]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      latestSearchQueryRef.current = "";
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    latestSearchQueryRef.current = trimmedQuery;
    setIsSearching(true);

    const debounceTimer = setTimeout(async () => {
      try {
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

        const params = new URLSearchParams({
          pageNumber: "1",
          keyword: trimmedQuery,
        });

        const firstResponse = await axios.get(
          `${apiBaseUrl}/api/products/list?${params.toString()}`,
        );

        const firstPageProducts = firstResponse.data?.products || [];
        const totalPages = Number(firstResponse.data?.pages || 1);

        let allMatchedProducts = [...firstPageProducts];

        if (totalPages > 1) {
          for (let page = 2; page <= totalPages; page += 1) {
            const response = await axios.get(
              `${apiBaseUrl}/api/products/list?pageNumber=${page}&keyword=${encodeURIComponent(trimmedQuery)}`,
            );
            allMatchedProducts = [
              ...allMatchedProducts,
              ...(response.data?.products || []),
            ];
          }
        }

        if (latestSearchQueryRef.current !== trimmedQuery) {
          return;
        }

        setSearchResults(allMatchedProducts);
      } catch (error) {
        if (latestSearchQueryRef.current === trimmedQuery) {
          setSearchResults([]);
        }
        console.error("Failed to search products:", error);
      } finally {
        if (latestSearchQueryRef.current === trimmedQuery) {
          setIsSearching(false);
        }
      }
    }, 450);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleCategoryChange = (e) => {
    if (selectedCategories.includes(e.target.value)) {
      setSelectedCategories(
        selectedCategories.filter((category) => category !== e.target.value),
      );
    } else {
      setSelectedCategories([...selectedCategories, e.target.value]);
    }
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handlePriceRangeChange = (e) => {
    const rangeValue = e.target.value;

    if (selectedPriceRanges.includes(rangeValue)) {
      setSelectedPriceRanges(
        selectedPriceRanges.filter((range) => range !== rangeValue),
      );
    } else {
      setSelectedPriceRanges([...selectedPriceRanges, rangeValue]);
    }
  };

  const handleRatingRangeChange = (minRating) => {
    const rangeValue = Number(minRating);

    if (selectedRatingRanges.includes(rangeValue)) {
      setSelectedRatingRanges(
        selectedRatingRanges.filter((range) => range !== rangeValue),
      );
    } else {
      setSelectedRatingRanges([...selectedRatingRanges, rangeValue]);
    }
  };

  const matchesPriceRange = (price, range) => {
    const safePrice = Number(price || 0);

    if (range === "below-100") return safePrice < 100;
    if (range === "100-200") return safePrice >= 100 && safePrice <= 200;
    if (range === "200-500") return safePrice > 200 && safePrice <= 500;
    if (range === "above-500") return safePrice > 500;

    return true;
  };

  const matchesRatingRange = (rating, range) => {
    const safeRating = Number(rating || 0);
    return safeRating >= Number(range || 0);
  };

  const renderStarLabel = (minRating) => {
    const filled = "★".repeat(minRating);
    const empty = "☆".repeat(5 - minRating);
    return `${filled}${empty} & up`;
  };

  const displayedProducts = useMemo(() => {
    try {
      const sourceProducts = searchQuery.trim() ? searchResults : products;
      let derivedProducts = Array.isArray(sourceProducts)
        ? [...sourceProducts]
        : [];

      if (selectedCategories.length > 0) {
        derivedProducts = derivedProducts.filter((product) => {
          const productCategories = Array.isArray(product.categories)
            ? product.categories
            : [];

          return productCategories.some((category) => {
            const categoryId = String(category?._id || category || "");
            return selectedCategories.includes(categoryId);
          });
        });
      }

      if (selectedPriceRanges.length > 0) {
        derivedProducts = derivedProducts.filter((product) =>
          selectedPriceRanges.some((range) =>
            matchesPriceRange(product.price, range),
          ),
        );
      }

      derivedProducts = derivedProducts.filter((product) => {
        const safePrice = Number(product?.price || 0);
        return safePrice >= customMinPrice && safePrice <= customMaxPrice;
      });

      if (selectedRatingRanges.length > 0) {
        derivedProducts = derivedProducts.filter((product) =>
          selectedRatingRanges.some((range) =>
            matchesRatingRange(product.rating, range),
          ),
        );
      }

      if (sortOption === "low-to-high") {
        derivedProducts.sort(
          (a, b) => Number(a.price || 0) - Number(b.price || 0),
        );
      } else if (sortOption === "high-to-low") {
        derivedProducts.sort(
          (a, b) => Number(b.price || 0) - Number(a.price || 0),
        );
      } else if (sortOption === "highest-rated") {
        derivedProducts.sort(
          (a, b) => Number(b.rating || 0) - Number(a.rating || 0),
        );
      } else if (sortOption === "most-reviewed") {
        derivedProducts.sort(
          (a, b) => Number(b.no_Reviews || 0) - Number(a.no_Reviews || 0),
        );
      }

      return derivedProducts;
    } catch (err) {
      console.error("Error computing displayedProducts:", err);
      return [];
    }
  }, [
    products,
    searchResults,
    selectedCategories,
    searchQuery,
    selectedPriceRanges,
    selectedRatingRanges,
    customMinPrice,
    customMaxPrice,
    sortOption,
  ]);

  return (
    <div className="container mb-5">
      <hr className="text-gray-300 bg-gray-200 w-full h-[1px]" />
      <div className="flex flex-col md:flex-row gap-0 md:gap-5 md:h-[calc(100vh-120px)] md:overflow-hidden">
        <div className="flex flex-col w-full md:w-65 md:sticky md:top-0 md:self-start">
          <div
            className="flex items-center  w-full px-5 mt-5 gap-2"
            onClick={() => setFilterButton(!filterButton)}
          >
            <h3 className="text-xl font-medium ">FILTERS </h3>
            <span>
              <img
                src={assets.dropdown_icon}
                className={` w-4 h-4 object-contain mb-[3px] transition-transform duration-200 ${filterButton ? "rotate-180" : "rotate-0"}`}
                alt="Filter"
              />
            </span>
          </div>

          <div
            className={`md:flex flex-col gap-2 border border-gray-300 p-4 mt-4 ${filterButton ? "flex" : "hidden "}`}
          >
            <h3 className="text-medium font-medium">CATEGORIES</h3>
            {categories.map((category) => (
              <label
                key={category._id}
                className="flex items-center justify-start gap-3"
              >
                <input
                  type="checkbox"
                  value={category._id}
                  checked={selectedCategories.includes(String(category._id))}
                  onChange={handleCategoryChange}
                />
                {category.name}
              </label>
            ))}
          </div>

          <div
            className={`md:flex flex-col gap-2 border border-gray-300 p-4 mt-4 ${filterButton ? "flex" : "hidden "}`}
          >
            <h3 className="text-medium font-medium">PRICE</h3>
            {priceRangeOptions.map((range) => (
              <label
                key={range.value}
                className="flex items-center justify-start gap-3"
              >
                <input
                  type="checkbox"
                  value={range.value}
                  checked={selectedPriceRanges.includes(range.value)}
                  onChange={handlePriceRangeChange}
                />
                {range.label}
              </label>
            ))}

            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Custom range</p>
                <button
                  type="button"
                  className="text-[11px] text-gray-500 hover:text-black"
                  onClick={() => {
                    setCustomMinPrice(minPriceLimit);
                    setCustomMaxPrice(maxAvailablePrice);
                  }}
                >
                  Reset
                </button>
              </div>

              <div className="relative h-6 flex items-center">
                {customMaxPrice <= maxAvailablePrice ? (
                  <Range
                    values={[customMinPrice, customMaxPrice]}
                    step={10}
                    min={minPriceLimit}
                    max={maxAvailablePrice}
                    onChange={(values) => {
                      setCustomMinPrice(values[0]);
                      setCustomMaxPrice(values[1]);
                    }}
                    renderTrack={({ props, children }) => (
                      <div
                        onMouseDown={props.onMouseDown}
                        onTouchStart={props.onTouchStart}
                        className="w-full h-6 flex"
                      >
                        <div
                          ref={props.ref}
                          className="h-1 w-full rounded-full self-center"
                          style={{
                            background: getTrackBackground({
                              values: [customMinPrice, customMaxPrice],
                              colors: ["#e5e7eb", "#111827", "#e5e7eb"],
                              min: minPriceLimit,
                              max: maxAvailablePrice,
                            }),
                          }}
                        >
                          {children}
                        </div>
                      </div>
                    )}
                    renderThumb={({ props }) => (
                      <div
                        {...props}
                        key={props.key}
                        className="h-4 w-4 rounded-full bg-black border-2 border-white shadow"
                      />
                    )}
                  />
                ) : (
                  <div className="w-full h-6" />
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700">
                  Min: ${customMinPrice}
                </div>
                <div className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 text-right">
                  Max: ${customMaxPrice}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`md:flex flex-col gap-2 border border-gray-300 p-4 mt-4 ${filterButton ? "flex" : "hidden "}`}
          >
            <h3 className="text-medium font-medium">RATING</h3>
            {ratingRangeOptions.map((range) => (
              <label
                key={range}
                className="flex items-center justify-start gap-3"
              >
                <input
                  type="checkbox"
                  checked={selectedRatingRanges.includes(range)}
                  onChange={() => handleRatingRangeChange(range)}
                />
                <span className="text-black tracking-[1px]">
                  {renderStarLabel(range)}
                </span>
              </label>
            ))}
          </div>
        </div>{" "}
        <div className="flex flex-col w-full md:h-full md:overflow-y-auto md:pr-1">
          {showSearchBar ? (
            <div className="flex justify-center w-full px-3 mt-5">
              <div className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 w-full max-w-2xl bg-white shadow-sm">
                <img
                  src={assets.search_icon}
                  alt="Search"
                  className="w-4 h-4"
                />
                <input
                  type="text"
                  className="w-full outline-none text-sm"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  autoFocus
                />
                {searchQuery ? (
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-black"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex justify-between w-full px-3 md:px-3">
            <div>
              <TitleLeft text1={"ALL"} text2={"COLLECTIONS"} />
            </div>
            <div>
              <select
                className="border border-gray-300 px-1 md:px-3 py-2.5  text-sm mt-5 focus:outline-none focus:ring-1 focus:ring-gray-300"
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="default">Sort By: Default</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
                <option value="highest-rated">Rating: High to Low</option>
                <option value="most-reviewed">Most Reviewed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 gap-y-6 mt-3 px-3 ">
            {isSearching
              ? skeletonCards.map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse flex flex-col h-full"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100" />
                    <div className="p-3 flex flex-col flex-grow space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-4/5" />
                      <div className="h-5 bg-gray-100 rounded w-2/5 mt-auto" />
                    </div>
                  </div>
                ))
              : displayedProducts.map((product) => (
                  <Card key={product._id} product={product} />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;
