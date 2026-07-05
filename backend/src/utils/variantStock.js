const normalizeOptionValue = (value) => String(value || "").trim();

export const normalizeSelectedOptions = (selectedOptions = {}) => {
  return {
    option1Name: normalizeOptionValue(selectedOptions.option1Name),
    option1Value: normalizeOptionValue(selectedOptions.option1Value),
    option2Name: normalizeOptionValue(selectedOptions.option2Name),
    option2Value: normalizeOptionValue(selectedOptions.option2Value),
  };
};

const normalizeVariantStockEntry = (entry = {}) => {
  return {
    option1Name: normalizeOptionValue(entry.option1Name),
    option1Value: normalizeOptionValue(entry.option1Value),
    option2Name: normalizeOptionValue(entry.option2Name),
    option2Value: normalizeOptionValue(entry.option2Value),
    stock: Number(entry.stock || 0),
  };
};

const hasVariantStockEntries = (product) => {
  return Array.isArray(product?.variantStocks) && product.variantStocks.length > 0;
};

export const findVariantStockEntry = (product, selectedOptions = {}) => {
  if (!hasVariantStockEntries(product)) {
    return null;
  }

  const normalizedOptions = normalizeSelectedOptions(selectedOptions);

  return (
    product.variantStocks.find((entry) => {
      const normalizedEntry = normalizeVariantStockEntry(entry);
      return (
        normalizedEntry.option1Name === normalizedOptions.option1Name &&
        normalizedEntry.option1Value === normalizedOptions.option1Value &&
        normalizedEntry.option2Name === normalizedOptions.option2Name &&
        normalizedEntry.option2Value === normalizedOptions.option2Value
      );
    }) || null
  );
};

export const getAvailableStockForSelection = (product, selectedOptions = {}) => {
  const matchingEntry = findVariantStockEntry(product, selectedOptions);
  if (!matchingEntry) {
    return 0;
  }

  return Number(matchingEntry.stock || 0);
};

export const decrementStockForSelection = (
  product,
  selectedOptions = {},
  quantity = 0,
) => {
  const qty = Number(quantity || 0);
  if (!Number.isFinite(qty) || qty <= 0) {
    return false;
  }

  if (!hasVariantStockEntries(product)) {
    return false;
  }

  const matchingEntry = findVariantStockEntry(product, selectedOptions);
  if (!matchingEntry) {
    return false;
  }

  const currentVariantStock = Number(matchingEntry.stock || 0);
  if (currentVariantStock < qty) {
    return false;
  }

  matchingEntry.stock = currentVariantStock - qty;

  return true;
};
