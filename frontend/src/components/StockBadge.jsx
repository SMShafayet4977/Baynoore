export default function StockBadge({ stock }) {
  if (stock === undefined || stock === null) return null;
  if (stock === 0) {
    return (
      <span className="inline-block bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
        Out of Stock
      </span>
    );
  }
  if (stock <= 3) {
    return (
      <span className="inline-block bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
        Only {stock} left
      </span>
    );
  }
  return (
    <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
      In Stock
    </span>
  );
}
