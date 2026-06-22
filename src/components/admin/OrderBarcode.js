import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

/**
 * Scannable barcode for order number (packing label / warehouse).
 */
export default function OrderBarcode({ value, className = "", height = 48 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, String(value), {
        format: "CODE128",
        width: 1.6,
        height,
        displayValue: true,
        fontSize: 12,
        margin: 4,
        background: "#ffffff",
      });
    } catch {
      // invalid barcode value — leave empty
    }
  }, [value, height]);

  if (!value) return null;

  return (
    <div className={`inline-block ${className}`}>
      <svg ref={svgRef} role="img" aria-label={`Barcode ${value}`} />
    </div>
  );
}
