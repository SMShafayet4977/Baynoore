import { Helmet } from "react-helmet-async";

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
}) {
  const siteName = "Baynoore";
  const defaultDesc =
    "Premium modest fashion in Bangladesh. Shop Burka, Hijab, One Piece, Two Piece, and Punjabi with Cash on Delivery, manual bKash, and WhatsApp support.";
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} | Modesty with Elegance`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDesc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDesc} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
