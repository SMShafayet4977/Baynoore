export function formatPrice(amount) {
  if (amount === null || amount === undefined) return "";
  return `৳${Number(amount).toLocaleString("en-BD")}`;
}
