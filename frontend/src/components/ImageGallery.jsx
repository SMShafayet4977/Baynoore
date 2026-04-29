import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageGallery({ images = [], productName = "" }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-product bg-cream rounded-2xl flex items-center justify-center">
        <p className="text-brown-light text-sm">No image available</p>
      </div>
    );
  }

  const prev = () => setActive((a) => (a === 0 ? images.length - 1 : a - 1));
  const next = () => setActive((a) => (a === images.length - 1 ? 0 : a + 1));

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-product bg-cream rounded-2xl overflow-hidden group">
        <img
          src={images[active].image_url}
          alt={`${productName} - image ${active + 1}`}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={18} className="text-brown" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={18} className="text-brown" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                i === active ? "border-gold-muted" : "border-transparent"
              }`}
            >
              <img
                src={img.image_url}
                alt={`${productName} thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
