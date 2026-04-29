import { useEffect, useState } from "react";
import SEO from "../components/SEO";
import LoadingSpinner from "../components/LoadingSpinner";
import { productApi } from "../services/productApi";

export default function ExchangePolicy() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi.getExchangePolicy()
      .then((res) => setPolicy(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO title="Exchange Policy" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-brown mb-2">
            {policy?.title || "Exchange Policy"}
          </h1>
          <div className="gold-line mx-auto" />
        </div>
        {loading ? (
          <LoadingSpinner className="py-20" />
        ) : policy ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="prose prose-sm max-w-none text-brown-light leading-relaxed whitespace-pre-line">
              {policy.content}
            </div>
          </div>
        ) : (
          <p className="text-center text-brown-light">Policy not available.</p>
        )}
      </div>
    </>
  );
}
