import React, { useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import adminApi, { getAdminAuthHeaders } from "../../../lib/adminApi";

const emptyVariantRow = () => ({ name: "", valuesText: "" });

const emptyStockRow = () => ({
  option1Name: "",
  option1Value: "",
  option2Name: "",
  option2Value: "",
  stock: "0",
});

const toTextValue = (values = []) => values.join(", ");

const uniqueStrings = (items = []) =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const MAX_VARIANT_TYPES = 2;

const normalizeVariantDefinition = (variant = {}) => {
  const name = String(variant?.name || "").trim();
  const values = uniqueStrings(
    String(variant?.valuesText || "")
      .split(",")
      .map((value) => value.trim()),
  );

  return { name, values };
};

const buildVariantStockKey = (entry = {}) =>
  [
    entry.option1Name || "",
    entry.option1Value || "",
    entry.option2Name || "",
    entry.option2Value || "",
  ].join("||");

const buildVariantStocksFromDefinitions = (
  definitions = [],
  currentStocks = [],
) => {
  const rowVariant = definitions[0] || null;
  const columnVariant = definitions[1] || null;
  const rowValues = rowVariant?.values?.length ? rowVariant.values : [""];
  const columnValues = columnVariant?.values?.length
    ? columnVariant.values
    : [""];
  const previousStocks = new Map(
    currentStocks.map((stock) => [buildVariantStockKey(stock), stock]),
  );

  const nextStocks = [];

  rowValues.forEach((rowValue) => {
    columnValues.forEach((columnValue) => {
      const entry = {
        option1Name: rowVariant?.name || "",
        option1Value: rowValue || "",
        option2Name: columnVariant?.name || "",
        option2Value: columnValue || "",
        stock: "0",
      };

      const existing = previousStocks.get(buildVariantStockKey(entry));
      nextStocks.push({
        ...entry,
        stock: String(existing?.stock ?? 0),
      });
    });
  });

  return nextStocks.length > 0
    ? nextStocks
    : [
        {
          option1Name: "",
          option1Value: "",
          option2Name: "",
          option2Value: "",
          stock: "0",
        },
      ];
};

const ProductForm = ({
  open,
  mode,
  product,
  categories,
  onClose,
  onSubmit,
  submitting,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [markedPrice, setMarkedPrice] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imageFilePreviews, setImageFilePreviews] = useState([]);
  const [variants, setVariants] = useState([emptyVariantRow()]);
  const [variantStocks, setVariantStocks] = useState([emptyStockRow()]);
  const [bulkStockValue, setBulkStockValue] = useState("");
  const [error, setError] = useState("");
  const [generatingDescription, setGeneratingDescription] = useState(false);

  useEffect(() => {
    const nextPreviews = imageFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImageFilePreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) =>
        URL.revokeObjectURL(preview.previewUrl),
      );
    };
  }, [imageFiles]);

  useEffect(() => {
    if (!open) return;

    setName(product?.name || "");
    setDescription(product?.description || "");
    setPrice(product?.price != null ? String(product.price) : "");
    setMarkedPrice(
      product?.markedPrice != null ? String(product.markedPrice) : "",
    );
    setCategoryIds(
      (product?.categories || []).map((item) => item?._id || item),
    );
    setImageUrls(uniqueStrings(product?.images || []));
    setDraftImageUrl("");
    setImageFiles([]);

    const nextVariants =
      product?.variants?.length > 0
        ? product.variants.map((variant) => ({
            name: variant?.name || "",
            valuesText: toTextValue(variant?.values || []),
          }))
        : [emptyVariantRow()];

    const nextStocks =
      product?.variantStocks?.length > 0
        ? product.variantStocks.map((stock) => ({
            option1Name: stock?.option1Name || "",
            option1Value: stock?.option1Value || "",
            option2Name: stock?.option2Name || "",
            option2Value: stock?.option2Value || "",
            stock: String(stock?.stock ?? 0),
          }))
        : [emptyStockRow()];

    setVariants(nextVariants);
    setVariantStocks(nextStocks);
    setError("");
  }, [open, product]);

  useEffect(() => {
    const normalizedDefinitions = variants
      .map(normalizeVariantDefinition)
      .filter((variant) => variant.name && variant.values.length > 0)
      .slice(0, MAX_VARIANT_TYPES);

    setVariantStocks((currentStocks) =>
      buildVariantStocksFromDefinitions(normalizedDefinitions, currentStocks),
    );
  }, [variants]);

  const modeLabel = mode === "edit" ? "Update product" : "Create product";

  const categoryOptions = useMemo(() => categories || [], [categories]);

  const selectedCategoryNames = useMemo(() => {
    return categoryIds
      .map((categoryId) => {
        const matchedCategory = categoryOptions.find(
          (category) => category._id === categoryId,
        );
        return matchedCategory?.name || "";
      })
      .filter(Boolean);
  }, [categoryIds, categoryOptions]);

  const generateDescription = async () => {
    const trimmedName = name.trim();
    const parsedPrice = Number(price);

    if (!trimmedName) {
      setError("Enter product name first before generating a description.");
      return;
    }

    if (!price || Number.isNaN(parsedPrice)) {
      setError("Enter a valid price first before generating a description.");
      return;
    }

    setError("");
    setGeneratingDescription(true);

    try {
      const { data } = await adminApi.post(
        "/api/ai/product-description",
        {
          name: trimmedName,
          price: parsedPrice,
          category:
            selectedCategoryNames[0] ||
            categoryOptions.find((category) => categoryIds.includes(category._id))
              ?.name ||
            "",
        },
        {
          headers: getAdminAuthHeaders(),
        },
      );

      const nextDescription = String(data.description || "").trim();
      if (!nextDescription) {
        toast.error("AI did not return a description");
        return;
      }

      setDescription(nextDescription);
      toast.success("Description generated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate description");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const variantDefinitions = useMemo(
    () =>
      variants
        .map(normalizeVariantDefinition)
        .filter((variant) => variant.name && variant.values.length > 0)
        .slice(0, MAX_VARIANT_TYPES),
    [variants],
  );

  const rowVariant = variantDefinitions[0] || null;
  const columnVariant = variantDefinitions[1] || null;
  const matrixRows = rowVariant?.values?.length
    ? rowVariant.values
    : ["Default"];
  const matrixColumns = columnVariant?.values?.length
    ? columnVariant.values
    : ["Stock"];

  const getMatrixEntry = (rowValue, columnValue) => {
    return (
      variantStocks.find((stockRow) => {
        return (
          (stockRow.option1Name || "") === (rowVariant?.name || "") &&
          (stockRow.option1Value || "") === rowValue &&
          (stockRow.option2Name || "") === (columnVariant?.name || "") &&
          (stockRow.option2Value || "") ===
            (columnValue === "Stock" ? "" : columnValue)
        );
      }) || {
        option1Name: rowVariant?.name || "",
        option1Value: rowValue,
        option2Name: columnVariant?.name || "",
        option2Value: columnValue === "Stock" ? "" : columnValue,
        stock: "0",
      }
    );
  };

  const updateMatrixStock = (rowValue, columnValue, value) => {
    setVariantStocks((current) => {
      const nextValue = String(value);
      const columnSelection = columnValue === "Stock" ? "" : columnValue;

      return current.map((stockRow) => {
        const matchesRow =
          (stockRow.option1Name || "") === (rowVariant?.name || "") &&
          (stockRow.option1Value || "") === rowValue;
        const matchesColumn =
          (stockRow.option2Name || "") === (columnVariant?.name || "") &&
          (stockRow.option2Value || "") === columnSelection;

        return matchesRow && matchesColumn
          ? { ...stockRow, stock: nextValue }
          : stockRow;
      });
    });
  };

  const applyStockToAll = () => {
    const normalizedValue = String(bulkStockValue).trim();
    const parsedValue = normalizedValue === "" ? NaN : Number(normalizedValue);

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      setError("Bulk stock must be a valid number.");
      return;
    }

    setVariantStocks((current) =>
      current.map((stockRow) => ({ ...stockRow, stock: String(parsedValue) })),
    );
  };

  const toggleCategory = (categoryId) => {
    setCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  };

  const updateVariantRow = (index, key, value) => {
    setVariants((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  };

  const addImageUrl = () => {
    const nextUrl = draftImageUrl.trim();

    if (!nextUrl) return;

    setImageUrls((current) => uniqueStrings([...current, nextUrl]));
    setDraftImageUrl("");
  };

  const removeImageUrl = (urlIndex) => {
    setImageUrls((current) => current.filter((_, index) => index !== urlIndex));
  };

  const removeImageFile = (fileIndex) => {
    setImageFiles((current) =>
      current.filter((_, index) => index !== fileIndex),
    );
  };

  const addVariantRow = () => {
    if (variants.length >= MAX_VARIANT_TYPES) {
      setError("This editor supports up to 2 variant types.");
      return;
    }

    setVariants((current) => [...current, emptyVariantRow()]);
  };

  const removeVariantRow = (index) => {
    setVariants((current) =>
      current.filter((_, rowIndex) => rowIndex !== index),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const parsedPrice = Number(price);
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!price || Number.isNaN(parsedPrice)) {
      setError("Product price must be a valid number.");
      return;
    }

    const cleanedVariants = variants
      .map((variant) => ({
        name: variant.name.trim(),
        values: variant.valuesText
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      }))
      .filter((variant) => variant.name || variant.values.length > 0);

    const cleanedStocks = variantStocks.map((stock) => ({
      option1Name: stock.option1Name.trim(),
      option1Value: stock.option1Value.trim(),
      option2Name: stock.option2Name.trim(),
      option2Value: stock.option2Value.trim(),
      stock: Number(stock.stock),
    }));

    if (cleanedStocks.length === 0) {
      setError("Add at least one stock row.");
      return;
    }

    if (
      cleanedStocks.some(
        (stock) => Number.isNaN(stock.stock) || stock.stock < 0,
      )
    ) {
      setError("Stock values must be zero or greater.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      categories: categoryIds,
      variants: cleanedVariants,
      variantStocks: cleanedStocks,
    };

    if (markedPrice.trim() !== "") {
      const parsedMarkedPrice = Number(markedPrice);
      if (Number.isNaN(parsedMarkedPrice)) {
        setError("Marked price must be a valid number.");
        return;
      }

      payload.markedPrice = parsedMarkedPrice;
    }

    const trimmedUrls = uniqueStrings(imageUrls);

    if (imageFiles.length === 0 && trimmedUrls.length > 0) {
      payload.images = trimmedUrls;
    }

    if (
      imageFiles.length === 0 &&
      trimmedUrls.length === 0 &&
      mode === "create"
    ) {
      setError("Add at least one image URL or choose image files.");
      return;
    }

    if (
      mode === "edit" &&
      imageFiles.length === 0 &&
      trimmedUrls.length === 0
    ) {
      payload.images = [];
    }

    onSubmit(payload, imageFiles);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              Product manager
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {modeLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-slate-900"
                    placeholder="Product name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Price
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-slate-900"
                    placeholder="999"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Marked price
                  </label>
                  <input
                    type="number"
                    value={markedPrice}
                    onChange={(event) => setMarkedPrice(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-slate-900"
                    placeholder="1199"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <button
                      type="button"
                      onClick={generateDescription}
                      disabled={generatingDescription}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generatingDescription ? "Generating..." : "Generate with AI"}
                    </button>
                  </div>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-slate-900"
                    placeholder="Short product description"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Images
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                      Add files or paste one image URL at a time.
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => {
                    const nextFiles = Array.from(event.target.files || []);
                    setImageFiles((current) => [...current, ...nextFiles]);
                    event.target.value = "";
                  }}
                  className="mt-3 block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={draftImageUrl}
                    onChange={(event) => setDraftImageUrl(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-colors focus:border-slate-900"
                    placeholder="Paste image URL"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    Add URL
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {imageUrls.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="h-36 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageUrl(index)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/85 text-white shadow-lg transition-transform hover:scale-105"
                        aria-label="Remove image"
                      >
                        <FiX className="text-sm" />
                      </button>
                    </div>
                  ))}

                  {imageFilePreviews.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-36 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageFile(index)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/85 text-white shadow-lg transition-transform hover:scale-105"
                        aria-label="Remove uploaded image"
                      >
                        <FiX className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>

                {imageUrls.length === 0 && imageFilePreviews.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-500">
                    No images selected yet.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Categories</p>
                <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {categoryOptions.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No categories found.
                    </p>
                  ) : (
                    categoryOptions.map((category) => (
                      <label
                        key={category._id}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={categoryIds.includes(category._id)}
                          onChange={() => toggleCategory(category._id)}
                          className="h-4 w-4 rounded border-slate-300 text-black"
                        />
                        <span>{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-700">Variants</p>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    disabled={variants.length >= MAX_VARIANT_TYPES}
                    className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiPlus /> Add type
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Use rows and columns for the combination matrix. This editor
                  supports up to 2 variant types.
                </p>

                <div className="mt-4 space-y-3">
                  {variants.map((variant, index) => (
                    <div
                      key={index}
                      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                          Variant {index + 1}
                        </p>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariantRow(index)}
                            className="text-slate-400 transition-colors hover:text-red-500"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                      <input
                        value={variant.name}
                        onChange={(event) =>
                          updateVariantRow(index, "name", event.target.value)
                        }
                        placeholder={index === 0 ? "Color" : "Size"}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-900"
                      />
                      <input
                        value={variant.valuesText}
                        onChange={(event) =>
                          updateVariantRow(
                            index,
                            "valuesText",
                            event.target.value,
                          )
                        }
                        placeholder={index === 0 ? "Red, Black" : "7, 8, 9"}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-900"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Stock matrix
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Fill stocks by combination. Use the bulk input to apply
                      one value to all cells.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={bulkStockValue}
                      onChange={(event) =>
                        setBulkStockValue(event.target.value)
                      }
                      placeholder="All stock"
                      className="w-28 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-900"
                    />
                    <button
                      type="button"
                      onClick={applyStockToAll}
                      className="rounded-2xl bg-black px-4 py-2 text-xs font-medium text-white"
                    >
                      Apply to all
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="border-b border-r border-slate-200 px-4 py-3 font-medium">
                          {rowVariant?.name || "Variant"}
                        </th>
                        {matrixColumns.map((columnValue) => (
                          <th
                            key={columnValue}
                            className="border-b border-slate-200 px-4 py-3 text-center font-medium"
                          >
                            {columnVariant?.name || "Stock"}
                            <div className="mt-1 text-xs text-slate-400">
                              {columnValue}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRows.map((rowValue) => (
                        <tr key={rowValue}>
                          <th className="border-r border-b border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700">
                            {rowValue || "Default"}
                          </th>
                          {matrixColumns.map((columnValue) => {
                            const entry = getMatrixEntry(rowValue, columnValue);

                            return (
                              <td
                                key={`${rowValue}-${columnValue}`}
                                className="border-b border-slate-200 px-3 py-3"
                              >
                                <input
                                  type="number"
                                  min="0"
                                  value={entry.stock}
                                  onChange={(event) =>
                                    updateMatrixStock(
                                      rowValue,
                                      columnValue,
                                      event.target.value,
                                    )
                                  }
                                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition-colors focus:border-slate-900"
                                  placeholder="0"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : modeLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
