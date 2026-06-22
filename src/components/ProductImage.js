import React, { useState } from "react";
import { getFallbackImage } from "../data/demoProducts";

export default function ProductImage({
  src,
  alt,
  productId,
  className = "",
  loading = "lazy",
}) {
  const [imgSrc, setImgSrc] = useState(src || getFallbackImage(productId));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(getFallbackImage(productId));
    }
  };

  return (
    <img
      src={imgSrc || getFallbackImage(productId)}
      alt={alt || "Product"}
      className={className}
      loading={loading}
      onError={handleError}
    />
  );
}
