import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../store/cartSlice";
import {
  fetchProductById,
  fetchRelatedProducts,
} from "../services/productService";
import { getDemoProductById, getRelatedDemoProducts } from "../data/demoProducts";
import ProductImage from "../components/ProductImage";
import Swal from "sweetalert2";
import { productHasDiscount, buildCartItem, getStockBadge } from "../lib/mappers";
import SalePriceHighlight, { SaleRibbon } from "../components/SalePriceHighlight";

function formatPKR(price) {
  return `Rs. ${price?.toLocaleString("en-PK")}`;
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [mainImage, setMainImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const prod = await fetchProductById(id);
      setProduct(prod);
      setMainImage(prod.productImage || prod.images?.[0] || null);
      const related = await fetchRelatedProducts(prod);
      setRelatedProducts(related);
    } catch {
      const demo = getDemoProductById(id);
      if (demo) {
        setProduct(demo);
        setMainImage(demo.productImage || demo.images?.[0] || null);
        setRelatedProducts(getRelatedDemoProducts(demo));
      } else {
        Swal.fire({ title: "Error!", text: "Product not found", icon: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || quantity <= 0 || product.stock <= 0) return;

    dispatch(addItem(buildCartItem(product, parseInt(quantity, 10))));

    setAddedToCart(true);
    Swal.fire({
      title: "Added!",
      text: `${quantity} x ${product.name}`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
    setTimeout(() => {
      setAddedToCart(false);
      setQuantity(1);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Product not found</h2>
        <button
          type="button"
          onClick={() => navigate("/shop")}
          className="px-6 py-3 bg-slate-900 text-white rounded-lg"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const allImages = product.productImage
    ? [product.productImage, ...(product.images || [])]
    : product.images || [];

  const stockBadge = getStockBadge(product.stock, product.stockLevel);

  const onSale = productHasDiscount(product);
  const displayPrice = product.salePrice ?? product.price;

  return (
    <div className="bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <button type="button" onClick={() => navigate("/shop")} className="hover:text-amber-600">
            Shop
          </button>
          <span>/</span>
          <span className="text-slate-900 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white rounded-2xl shadow-sm p-8 mb-12">
          <div>
            <div className="mb-4 bg-slate-100 rounded-xl overflow-hidden aspect-square relative">
              {onSale && <SaleRibbon discountPercent={product.discountPercent} />}
              <ProductImage
                src={mainImage}
                alt={product.name}
                productId={product._id}
                className="w-full h-full object-cover"
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMainImage(img)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      mainImage === img ? "border-amber-500" : "border-slate-200"
                    }`}
                  >
                    <ProductImage src={img} alt="" productId={`${product._id}-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">
              {product.category} · {product.subcategory}
            </p>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{product.name}</h1>
            <p className="text-slate-600 mb-6">{product.description}</p>

            {onSale ? (
              <SalePriceHighlight
                salePrice={displayPrice}
                originalPrice={product.originalPrice}
                discountPercent={product.discountPercent}
                size="lg"
                variant="card"
                className="mb-4"
              />
            ) : (
              <div className="mb-4">
                <span className="text-4xl font-bold text-slate-900">{formatPKR(displayPrice)}</span>
              </div>
            )}

            <span className={`inline-block mb-6 rounded-full px-3 py-1 text-sm font-bold ${stockBadge.className}`}>
              {stockBadge.label}
            </span>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold">Qty:</span>
              <div className="flex items-center border rounded-lg">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2">−</button>
                <span className="w-10 text-center">{quantity}</span>
                <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-4 py-2">+</button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-full py-4 rounded-xl font-bold text-white ${
                product.stock <= 0 ? "bg-slate-300 cursor-not-allowed" : addedToCart ? "bg-emerald-600" : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {addedToCart ? "Added to Bag ✓" : "Add to Bag"}
            </button>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProd) => (
                <button
                  key={relProd._id}
                  type="button"
                  onClick={() => navigate(`/product/${relProd._id}`)}
                  className="bg-white rounded-xl shadow-sm overflow-hidden text-left hover:shadow-md transition relative border border-slate-100 data-[sale]:border-amber-300 data-[sale]:ring-1 data-[sale]:ring-amber-200"
                  data-sale={productHasDiscount(relProd) ? true : undefined}
                >
                  {productHasDiscount(relProd) && (
                    <SaleRibbon discountPercent={relProd.discountPercent} />
                  )}
                  <ProductImage
                    src={relProd.productImage}
                    alt={relProd.name}
                    productId={relProd._id}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-2 text-sm">{relProd.name}</h3>
                    {productHasDiscount(relProd) ? (
                      <SalePriceHighlight
                        salePrice={relProd.salePrice ?? relProd.price}
                        originalPrice={relProd.originalPrice}
                        discountPercent={relProd.discountPercent}
                        size="sm"
                        variant="card"
                        className="mt-2"
                      />
                    ) : (
                      <p className="font-bold mt-2">{formatPKR(relProd.price)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
