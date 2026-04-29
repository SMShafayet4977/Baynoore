import { Minus, Plus } from "lucide-react";

export default function QuantitySelector({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="flex items-center border border-beige rounded-xl overflow-hidden">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-3 py-2.5 text-brown hover:bg-cream transition-colors disabled:opacity-40"
      >
        <Minus size={16} />
      </button>
      <span className="px-4 py-2.5 text-sm font-semibold text-brown min-w-[3rem] text-center border-x border-beige">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="px-3 py-2.5 text-brown hover:bg-cream transition-colors disabled:opacity-40"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
