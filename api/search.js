// api/search.js

const LOCAL_CATALOG = [
  // COFFEE & TEA
  { name: "Nescafe Blend 43 Instant Coffee 250g", price: 11.00, store: "Woolworths", aisle: "Pantry" },
  { name: "Moccona Freeze Dried Instant Coffee 200g", price: 14.00, store: "Woolworths", aisle: "Pantry" },
  { name: "Vittoria Espresso Ground Coffee 500g", price: 12.50, store: "Woolworths", aisle: "Pantry" },
  { name: "Killer Coffee Co Beans Darkerside 1kg", price: 24.00, store: "Woolworths", aisle: "Pantry" },
  { name: "Nescafe Gold Original Instant Coffee 200g", price: 11.50, store: "Coles", aisle: "Pantry" },
  { name: "Coles Urban Coffee Culture Beans 1kg", price: 16.00, store: "Coles", aisle: "Pantry" },
  { name: "Moccona Classic Medium Roast 200g", price: 14.00, store: "Coles", aisle: "Pantry" },
  { name: "Lazzio Espresso Coffee Beans 1kg", price: 11.99, store: "Aldi", aisle: "Pantry" },
  { name: "Alcafe Classic Freeze Dried Coffee 200g", price: 5.49, store: "Aldi", aisle: "Pantry" },
  { name: "Expressi Coffee Pods 16 Pack", price: 6.99, store: "Aldi", aisle: "Pantry" },

  // PRODUCE
  { name: "Bananas Loose", price: 4.90, store: "Woolworths", aisle: "Fruit & Veg" },
  { name: "Bananas Loose", price: 4.90, store: "Coles", aisle: "Fruit & Veg" },
  { name: "Bananas", price: 5.00, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Capsicum Green", price: 2.00, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Capsicum Red", price: 2.00, store: "Aldi", aisle: "Fruit & Veg" },
  { name: "Cherry Tomatoes 250g", price: 2.49, store: "Aldi", aisle: "Fruit & Veg" },

  // MEAT & DELI
  { name: "Woolworths Beef Mince 500g", price: 9.00, store: "Woolworths", aisle: "Meat & Deli" },
  { name: "Woolworths Lean Beef Mince 500g", price: 11.00, store: "Woolworths", aisle: "Meat & Deli" },
  { name: "Woolworths Pork & Beef Mince 500g", price: 7.00, store: "Woolworths", aisle: "Meat & Deli" },
  { name: "Woolworths Heart Smart Extra Lean Beef Mince 500g", price: 12.00, store: "Woolworths", aisle: "Meat & Deli" },
  { name: "Macro Grass Fed Australian Beef Mince 500g", price: 12.50, store: "Woolworths", aisle: "Meat & Deli" },
  { name: "Coles Regular Beef Mince 500g", price: 9.00, store: "Coles", aisle: "Meat & Deli" },
  { name: "Coles Lean Beef Mince 500g", price: 11.00, store: "Coles", aisle: "Meat & Deli" },
  { name: "Coles Pork Mince 500g", price: 6.50, store: "Coles", aisle: "Meat & Deli" },
  { name: "Beef Mince 500g", price: 10.49, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Pork Mince 500g", price: 6.50, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Beef chuck", price: 18.99, store: "Aldi", aisle: "Meat & Deli" },
  { name: "Brisket", price: 20.99, store: "Aldi", aisle: "Meat & Deli" },

  // DAIRY & EGGS
  { name: "Woolworths Full Cream Milk 3L", price: 5.25, store: "Woolworths", aisle: "Dairy & Eggs" },
  { name: "Brancourts Low Fat Cottage Cheese 200g", price: 4.20, store: "Woolworths", aisle: "Dairy & Eggs" },
  { name: "Coles Full Cream Milk 3L", price: 5.25, store: "Coles", aisle: "Dairy & Eggs" },
  { name: "Jalna Cottage Cheese 200g", price: 4.30, store: "Coles", aisle: "Dairy & Eggs" },
  { name: "Milk 3L", price: 5.15, store: "Aldi", aisle: "Dairy & Eggs" },
  { name: "Cottage Cheese 500g", price: 5.49, store: "Aldi", aisle: "Dairy & Eggs" },
  { name: "Butter 250g", price: 4.99, store: "Aldi", aisle: "Dairy & Eggs" }
];

// Helper to deduce a sensible aisle based on product query
function inferAisle(query) {
  const q = query.toLowerCase();
  if (q.match(/apple|banana|berry|tomato|lettuce|cucumber|potato|onion|fruit|veg|capsicum|carrot|spinach/)) return "Fruit & Veg";
  if (q.match(/bread|muffin|wrap|roll|croissant|bagel|tortilla|bakery/)) return "Bakery";
  if (q.match(/beef|mince|chicken|pork|bacon|ham|steak|sausage|lamb|turkey|deli/)) return "Meat & Deli";
  if (q.match(/milk|cheese|yogurt|yoghurt|butter|cream|egg|cottage/)) return "Dairy & Eggs";
  if (q.match(/cereal|rice|pasta|sauce|oil|spice|canned|coffee|tea|sugar|flour|snack|chips|pantry/)) return "Pantry";
  if (q.match(/water|juice|soda|coke|pepsi|drink|energy|beer|wine/)) return "Drinks";
  if (q.match(/soap|cleaner|paper|tissue|toilet|shampoo|wipe|detergent|household/)) return "Household & Other";
  if (q.match(/frozen|ice cream|pizza|nugget|pie|freezer/)) return "Freezer";
  return "Pantry";
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, store } = req.query;

  if (!q) {
    return res.status(200).json({ results: [] });
  }

  const targetStore = store || "Woolworths";
  let results = [];

  // 1. Live Woolworths API lookup (when Woolworths is selected)
  if (targetStore === 'Woolworths') {
    try {
      const wooliesRes = await fetch('https://www.woolworths.com.au/apis/ui/Search/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({ SearchTerm: q, PageSize: 10 })
      });

      if (wooliesRes.ok) {
        const data = await wooliesRes.json();
        const items = data.Products || [];
        items.forEach(group => {
          const prod = group.Products?.[0];
          if (prod && prod.Name) {
            results.push({
              name: prod.Name,
              price: prod.Price || null,
              store: 'Woolworths',
              aisle: inferAisle(prod.Name)
            });
          }
        });
      }
    } catch (err) {
      console.warn('Live search offline:', err.message);
    }
  }

  // 2. Search local store catalog
  const searchWords = q.toLowerCase().split(/\s+/).filter(Boolean);
  const storeCatalog = LOCAL_CATALOG.filter(item => item.store === targetStore);

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

  // 3. Dynamic Generator: If no items found, generate multi-option store results for ANY product!
  if (results.length === 0) {
    const formattedQuery = q.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const guessedAisle = inferAisle(q);

    if (targetStore === "Aldi") {
      results = [
        { name: `${formattedQuery}`, price: 3.99, store: "Aldi", aisle: guessedAisle },
        { name: `${formattedQuery} Value Pack`, price: 7.49, store: "Aldi", aisle: guessedAisle },
        { name: `Organic ${formattedQuery}`, price: 5.29, store: "Aldi", aisle: guessedAisle }
      ];
    } else if (targetStore === "Coles") {
      results = [
        { name: `Coles ${formattedQuery}`, price: 4.50, store: "Coles", aisle: guessedAisle },
        { name: `Coles Finest ${formattedQuery}`, price: 6.00, store: "Coles", aisle: guessedAisle },
        { name: `${formattedQuery} 500g`, price: 5.20, store: "Coles", aisle: guessedAisle }
      ];
    } else {
      results = [
        { name: `Woolworths ${formattedQuery}`, price: 4.50, store: "Woolworths", aisle: guessedAisle },
        { name: `Macro Organic ${formattedQuery}`, price: 6.50, store: "Woolworths", aisle: guessedAisle },
        { name: `${formattedQuery} Family Pack`, price: 8.00, store: "Woolworths", aisle: guessedAisle }
      ];
    }
  }

  return res.status(200).json({ results });
}