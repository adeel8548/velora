import { supabase } from "../lib/supabase";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fetchCategoriesAdmin() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return (data || []).map(mapCategory);
}

export async function createCategory({ name, description, image_url, sort_order }) {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug: slugify(name),
      description,
      image_url,
      sort_order: sort_order || 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCategory(data);
}

export async function updateCategory(id, updates) {
  const payload = { ...updates };
  if (updates.name) payload.slug = slugify(updates.name);

  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapCategory(data);
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSubcategoriesAdmin() {
  const { data, error } = await supabase
    .from("subcategories")
    .select("*, categories(id, name)")
    .order("sort_order");

  if (error) throw error;
  return (data || []).map(mapSubcategory);
}

export async function createSubcategory({
  name,
  category_id,
  description,
  image_url,
  sort_order,
}) {
  const { data, error } = await supabase
    .from("subcategories")
    .insert({
      name,
      slug: slugify(name),
      category_id,
      description,
      image_url,
      sort_order: sort_order || 0,
      is_active: true,
    })
    .select("*, categories(id, name)")
    .single();

  if (error) throw error;
  return mapSubcategory(data);
}

export async function updateSubcategory(id, updates) {
  const payload = { ...updates };
  if (updates.name) payload.slug = slugify(updates.name);

  const { data, error } = await supabase
    .from("subcategories")
    .update(payload)
    .eq("id", id)
    .select("*, categories(id, name)")
    .single();

  if (error) throw error;
  return mapSubcategory(data);
}

export async function deleteSubcategory(id) {
  const { error } = await supabase.from("subcategories").delete().eq("id", id);
  if (error) throw error;
}

function mapCategory(row) {
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image_url,
    image_url: row.image_url,
    sort_order: row.sort_order,
    is_active: row.is_active,
    createdAt: row.created_at,
    created_at: row.created_at,
  };
}

function mapSubcategory(row) {
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image_url,
    image_url: row.image_url,
    category_id: row.category_id,
    category: row.categories
      ? { _id: row.categories.id, id: row.categories.id, name: row.categories.name }
      : null,
    sort_order: row.sort_order,
    createdAt: row.created_at,
  };
}
