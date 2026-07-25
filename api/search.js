// api/search.js

const LOCAL_CATALOG = [
  { name: "Bananas", price: 5.00, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Capsicum Green", price: 2.00, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Capsicum Red", price: 2.00, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Cherry Tomatoes 250g", price: 2.49, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Cos Lettuce 2 Pack", price: 2.99, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Lebanese Cucumbers Loose", price: 1.15, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Salad Leaf Mix 300g", price: 3.99, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Spudlite Potatoes 1.5kg", price: 5.99, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Beef chuck", price: 18.99, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Beef Mince 500g", price: 10.49, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Brisket", price: 20.99, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Chicken Breast Value Pack", price: 20.88, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Free Range Marinated Chicken Breast", price: 9.50, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Short Cut Bacon 500g", price: 6.99, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Leg Ham Thinly Sliced 4 Pack 400g", price: 5.39, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Chicken Breast Tenders Southern Style 1kg", price: 9.99, store: "Aldi", aisle: "Freezer" },
  { name: "Brancourts Low Fat Cottage Cheese 200g", price: 4.20, store: "Woolworths", aisle: "Dairy & Eggs" },
  { name: "Cottage Cheese 500g", price: 5.49, store: "Aldi", aisle: "Dairy & Eggs" },
  { name: "Milk 3L", price: 5.15, store: "Aldi", aisle: "Dairy & Eggs" },
  { name: "Butter 250g", price: 4.99, store: "Aldi", aisle: "Dairy & Eggs" },
  { name: "Greek Style Strained Yogurt Plain 900g", price: 5.89, store: "Aldi", aisle: "Dairy & Eggs" },
  { name: "Eggs 700g", price: 6.19, store: "Aldi", aisle: "Dairy & Eggs" },
  { name: "Apple Cider Vinegar", price: 3.29, store: "Aldi", aisle: "Pantry" },
  { name: "Baked Beans", price: 3.99, store: "Aldi", aisle: "Pantry" },
  { name: "BAKERS LIFE Lower Carb Higher Protein Bread 600g", price: 5.49, store: "Aldi", aisle: "Pantry" },
  { name: "Evaporated Milk", price: 5.00, store: "Woolworths", aisle: "Pantry" },
  { name: "Killer Coffee Co Beans Darkerside", price: 24.00, store: "Woolworths", aisle: "Pantry" },
  { name: "Sanitarium Weet-bix Bites Wild Berry Breakfast Cereal", price: 4.00, store: "Woolworths", aisle: "Pantry" }
];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;

  if (!q) {
    return res.status(200).json({ results: [] });
  }

  let results = [];

  // 1. Try external Woolworths UI API
  try {
    const wooliesRes = await fetch('https://www.woolworths.com.au/apis/ui/Search/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({ SearchTerm: q, PageSize: 5 })
    });

    if (wooliesRes.ok) {
      const data = await wooliesRes.json();
      const items = data.Products || [];
      items.slice(0, 5).forEach(group => {
        const prod = group.Products?.[0];
        if (prod) {
          results.push({
            name: prod.Name,
            price: prod.Price || null,
            store: 'Woolworths',
            aisle: 'Pantry'
          });
        }
      });
    }
  } catch (err) {
    console.warn('External search fallback triggered:', err.message);
  }

  // 2. Fuzzy/Word match fallback across local catalog
  if (results.length === 0) {
    const searchWords = q.toLowerCase().split(/\s+/).filter(Boolean);
    results = LOCAL_CATALOG.filter(item => {
      const itemText = `${item.name} ${item.store} ${item.aisle}`.toLowerCase();
      return searchWords.every(word => itemText.includes(word));
    });
  }

  return res.status(200).json({ results });
}