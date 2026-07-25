// api/search.js

const LOCAL_CATALOG = [
  // Produce
  { name: "Bananas", price: 5.00, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Bananas Loose", price: 4.90, store: "Coles", aisle: "Fruit & Veg" },
  { name: "Bananas Loose", price: 4.90, store: "Woolworths", aisle: "Fruit & Veg" },
  { name: "Capsicum Green", price: 2.00, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Capsicum Red", price: 2.00, store: "Aldi", aisle: "Fruit & Veg" },
  
  // Meat & Deli
  { name: "Woolworths Beef Mince 500g", price: 9.00, store: "Woolworths", aisle: "Meat & Deli" },
  { name: "Woolworths Lean Beef Mince 500g", price: 11.00, store: "Woolworths", aisle: "Meat & Deli" },
  { name: "Woolworths Pork & Beef Mince 500g", price: 7.00, store: "Woolworths", aisle: "Meat & Deli" },
  { name: "Coles Regular Beef Mince 500g", price: 9.00, store: "Coles", aisle: "Meat & Deli" },
  { name: "Coles Lean Beef Mince 500g", price: 11.00, store: "Coles", aisle: "Meat & Deli" },
  { name: "Beef Mince 500g", price: 10.49, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Pork Mince 500g", price: 6.50, store: "Aldi", aisle: "Meat & Deli" },

  // Dairy & Eggs
  { name: "Cottage Cheese 500g", price: 5.49, store: "Aldi", aisle: "Dairy & Eggs" },
  { name: "Brancourts Low Fat Cottage Cheese 200g", price: 4.20, store: "Woolworths", aisle: "Dairy & Eggs" },
  { name: "Jalna Cottage Cheese 200g", price: 4.30, store: "Coles", aisle: "Dairy & Eggs" },
  { name: "Milk 3L", price: 5.15, store: "Aldi", aisle: "Dairy & Eggs" },
  { name: "Coles Full Cream Milk 3L", price: 5.25, store: "Coles", aisle: "Dairy & Eggs" },
  { name: "Woolworths Full Cream Milk 3L", price: 5.25, store: "Woolworths", aisle: "Dairy & Eggs" }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, store } = req.query;

  if (!q) {
    return res.status(200).json({ results: [] });
  }

  if (!store || !['Aldi', 'Coles', 'Woolworths'].includes(store)) {
    return res.status(400).json({ error: 'Please select a valid store (Aldi, Coles, or Woolworths).' });
  }

  let results = [];

  // 1. If Woolworths is selected, try live fetch
  if (store === 'Woolworths') {
    try {
      const wooliesRes = await fetch('https://www.woolworths.com.au/apis/ui/Search/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
      console.warn('Woolworths live fetch skipped/blocked:', err.message);
    }
  }

  // 2. Search local database filtered by the selected store
  const searchWords = q.toLowerCase().split(/\s+/).filter(Boolean);
  const storeCatalog = LOCAL_CATALOG.filter(item => item.store === store);

  let localMatches = storeCatalog.filter(item => {
    const itemText = `${item.name} ${item.aisle}`.toLowerCase();
    return searchWords.every(word => itemText.includes(word));
  });

  if (localMatches.length === 0) {
    localMatches = storeCatalog.filter(item => {
      const itemText = `${item.name} ${item.aisle}`.toLowerCase();
      return searchWords.some(word => word.length > 2 && itemText.includes(word));
    });
  }

  localMatches.forEach(item => {
    if (!results.some(r => r.name.toLowerCase() === item.name.toLowerCase())) {
      results.push(item);
    }
  });

  // 3. Fallback: If no specific product matched for this query, generate a custom entry so ANY random product can be added!
  if (results.length === 0) {
    // Capitalize user search query nicely
    const formattedName = q.charAt(0).toUpperCase() + q.slice(1);
    results.push({
      name: `${formattedName} (${store})`,
      price: null,
      store: store,
      aisle: "Pantry"
    });
  }

  return res.status(200).json({ results });
}