export const PRODUCTS_PER_CATEGORY = 25;

export const DEMO_CATEGORIES = ["Men", "Women", "Kids"];

export const DEMO_SUBCATEGORIES = [
  "Watch",
  "Shoes",
  "Glasses",
  "Pants",
  "Shirt",
  "Shalwar Kameez",
];

/* Verified working Unsplash URLs (HTTP 200 tested) */
const IMAGE_POOLS = {
  Watch: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&sat=-20&q=80",
  ],
  Shoes: [
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&blur=0&q=80&sat=10",
  ],
  Glasses: [
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop&sat=-15&q=80",
  ],
  Pants: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop&sat=10&q=80",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop&sat=-10&q=80",
  ],
  Shirt: [
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=80",
  ],
  "Shalwar Kameez": [
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&h=600&fit=crop&q=80",
  ],
};

const KIDS_EXTRA_IMAGES = [
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&h=600&fit=crop&q=80",
];

const NAME_PREFIX = {
  Men: {
    Watch: ["Heritage Chronograph", "Classic Steel", "Sport Diver", "Executive Gold", "Minimalist Dial"],
    Shoes: ["Oxford Leather", "Running Pro", "Casual Loafer", "Formal Derby", "Urban Sneaker"],
    Glasses: ["Aviator Classic", "Wayfarer Pro", "Clubmaster Elite", "Rimless Vision", "Polarized Shade"],
    Pants: ["Slim Chino", "Formal Trouser", "Cargo Flex", "Tailored Fit", "Denim Straight"],
    Shirt: ["Premium Cotton", "Linen Summer", "Oxford Button", "Polo Classic", "Checked Casual"],
    "Shalwar Kameez": ["Embroidered Festive", "Cotton Kurta", "Silk Formal", "Casual Shalwar", "Wedding Special"],
  },
  Women: {
    Watch: ["Rose Gold Elegance", "Pearl Dial", "Minimalist Chic", "Crystal Bezel", "Bangle Style"],
    Shoes: ["Stiletto Heels", "Ballet Flats", "Ankle Boots", "Platform Sandals", "Running Lite"],
    Glasses: ["Cat Eye Glam", "Oversized Chic", "Round Vintage", "Butterfly Frame", "Tinted Fashion"],
    Pants: ["High Waist Palazzo", "Skinny Fit", "Wide Leg", "Culotte Style", "Linen Casual"],
    Shirt: ["Silk Blouse", "Off Shoulder", "Wrap Top", "Casual Tee", "Crop Fashion"],
    "Shalwar Kameez": ["Bridal Embroidered", "Lawn Summer", "Chiffon Party", "Casual Cotton", "Designer Festive"],
  },
  Kids: {
    Watch: ["Color Splash", "Digital Fun", "Cartoon Classic", "Sport Junior", "LED Flash"],
    Shoes: ["School Sneaker", "Light Up Run", "Velcro Easy", "Sandals Play", "Sports Pro"],
    Glasses: ["Flexible Frame", "Colorful Round", "Sport Shield", "Blue Light Block", "Sun Protect"],
    Pants: ["Jogger Comfort", "School Uniform", "Denim Kids", "Cargo Play", "Track Pants"],
    Shirt: ["Graphic Tee", "Polo School", "Hoodie Cozy", "Striped Casual", "Superhero Print"],
    "Shalwar Kameez": ["Festive Kids", "Cotton Eid", "Embroidered Junior", "Casual Kurta", "Party Wear"],
  },
};

function getProductImage(category, subCategory, indexInCategory) {
  const pool = IMAGE_POOLS[subCategory] || IMAGE_POOLS.Shirt;
  const variantIndex = Math.floor(indexInCategory / DEMO_SUBCATEGORIES.length);

  if (category === "Kids" && variantIndex >= pool.length - 1) {
    return KIDS_EXTRA_IMAGES[variantIndex % KIDS_EXTRA_IMAGES.length];
  }

  return pool[variantIndex % pool.length];
}

export function getFallbackImage(productId) {
  return `https://picsum.photos/seed/${encodeURIComponent(productId || "velora")}/600/600`;
}

export function generateDemoProducts() {
  const products = [];
  let globalIndex = 1;

  for (const category of DEMO_CATEGORIES) {
    for (let i = 0; i < PRODUCTS_PER_CATEGORY; i++) {
      const subCategory = DEMO_SUBCATEGORIES[i % DEMO_SUBCATEGORIES.length];
      const namePool = NAME_PREFIX[category][subCategory];
      const variantIndex = Math.floor(i / DEMO_SUBCATEGORIES.length);
      const nameVariant = namePool[variantIndex % namePool.length];
      const slug = subCategory.toLowerCase().replace(/\s+/g, "-");
      const image = getProductImage(category, subCategory, i);

      products.push({
        _id: `${category.toLowerCase()}-${slug}-${i + 1}`,
        name: `Velora ${nameVariant} — ${category}`,
        category,
        subcategory: subCategory,
        price: 1499 + globalIndex * 275,
        productImage: image,
        images: [image],
        description: `Premium ${subCategory.toLowerCase()} from Velora's ${category} collection. Crafted with quality materials for style and comfort.`,
        stock: 15 + (globalIndex % 40),
        rating: 4 + (globalIndex % 10) / 10,
        reviews: 24 + globalIndex * 3,
        createdAt: new Date(Date.now() - globalIndex * 86400000).toISOString(),
        isNew: globalIndex <= 12,
        isSale: globalIndex % 4 === 0,
      });

      globalIndex++;
    }
  }

  return products;
}

export const DEMO_PRODUCTS = generateDemoProducts();

export function getCategoryProductCount(category) {
  return DEMO_PRODUCTS.filter((p) => p.category === category).length;
}

export function getDemoProductById(id) {
  return DEMO_PRODUCTS.find((p) => p._id === id) || null;
}

export function getRelatedDemoProducts(product, limit = 4) {
  if (!product) return [];
  return DEMO_PRODUCTS.filter(
    (p) =>
      p._id !== product._id &&
      (p.category === product.category || p.subcategory === product.subcategory),
  ).slice(0, limit);
}
