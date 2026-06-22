import { supabase } from "../lib/supabase";
import { mapProduct } from "../lib/mappers";

function withStockLevel(row) {
  return {
    ...row,
    stock_level:
      row.stock <= 0
        ? "out"
        : row.stock <= 5
          ? "low"
          : row.stock <= 20
            ? "medium"
            : "high",
    stock_label:
      row.stock <= 0
        ? "Out of Stock"
        : row.stock <= 5
          ? "Low Stock"
          : row.stock <= 20
            ? "Medium Stock"
            : "High Stock",
  };
}

async function fetchProductsFromTable(filters = {}) {
  let query = supabase.from("products").select("*");

  if (filters.activeOnly) query = query.eq("is_active", true);
  if (filters.id) query = query.eq("id", filters.id);
  if (filters.excludeId) query = query.neq("id", filters.excludeId);
  if (filters.limit) query = query.limit(filters.limit);

  query = query.order("created_at", { ascending: false });

  const { data, error } = filters.id ? await query.single() : await query;
  if (error) throw error;
  return data;
}

export async function fetchAllProducts() {
  try {
    const data = await fetchProductsFromTable({ activeOnly: true });
    return (Array.isArray(data) ? data : [data])
      .filter(Boolean)
      .map((row) => mapProduct(withStockLevel(row)));
  } catch {
    const { data, error } = await supabase
      .from("products_with_stock_level")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapProduct);
  }
}

export async function fetchProductById(id) {
  try {
    const data = await fetchProductsFromTable({ id });
    return mapProduct(withStockLevel(data));
  } catch {
    const fallback = await supabase
      .from("products_with_stock_level")
      .select("*")
      .eq("id", id)
      .single();
    if (fallback.error) throw fallback.error;
    return mapProduct(fallback.data);
  }
}

export async function fetchRelatedProducts(product, limit = 4) {
  if (!product) return [];

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .neq("id", product.id || product._id)
      .limit(20);

    if (error) throw error;

    return (data || [])
      .filter(
        (p) =>
          p.category === product.category ||
          p.subcategory === product.subcategory,
      )
      .slice(0, limit)
      .map((row) => mapProduct(withStockLevel(row)));
  } catch {
    const { data, error } = await supabase
      .from("products_with_stock_level")
      .select("*")
      .eq("is_active", true)
      .neq("id", product.id || product._id)
      .limit(20);

    if (error) return [];

    return (data || [])
      .filter(
        (p) =>
          p.category === product.category ||
          p.subcategory === product.subcategory,
      )
      .slice(0, limit)
      .map(mapProduct);
  }
}

export async function fetchAdminProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    const fallback = await supabase
      .from("products_with_stock_level")
      .select("*")
      .order("created_at", { ascending: false });
    if (fallback.error) throw fallback.error;
    return (fallback.data || []).map(mapProduct);
  }

  return (data || []).map((row) => mapProduct(withStockLevel(row)));
}

export async function createProduct(product) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadProductImage(file) {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data || [];
}

export async function fetchSubcategories(categoryName) {
  let query = supabase
    .from("subcategories")
    .select("*, categories(name)")
    .eq("is_active", true)
    .order("sort_order");

  if (categoryName) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id")
      .eq("name", categoryName)
      .single();

    if (cats?.id) query = query.eq("category_id", cats.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
