export function formatPKR(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;
}
