export const calculateOrderCost = (productPrice, printAreaPrice, quantity, sellingPrice) => {
  const pPrice = Number(productPrice) || 0;
  const aPrice = Number(printAreaPrice) || 0;
  const qty = Number(quantity) || 1;
  const sPrice = Number(sellingPrice) || 0;

  const baseCost = (pPrice + aPrice) * qty;
  const profit = sPrice - baseCost;

  return { baseCost, profit };
};
