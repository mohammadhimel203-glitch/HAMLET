export const formatBDT = (amount) => {
  if (amount === undefined || amount === null) return '৳0.00';
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
