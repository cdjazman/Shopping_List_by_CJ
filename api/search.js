// api/search.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, store } = req.query;
  const apiKey = process.env.SCRAPER_API_KEY;

  if (!q) {
    return res.status(200).json({ totalResults: 0, results: [] });
  }

  const targetStore = store || 'Woolworths';
  let results = [];
  let totalResults = 0;

  function inferAisle(name) {
    const text = name.toLowerCase();
    if (text.match(/apple|banana|berry|tomato|lettuce|cucumber|potato|onion|fruit|veg|capsicum|carrot|spinach/)) return "Fruit & Veg";
    if (text.match(/bread|muffin|wrap|roll|croissant|bagel|tortilla|bakery/)) return "Bakery";
    if (text.match(/beef|mince|chicken|pork|bacon|ham|steak|sausage|lamb|turkey|deli/)) return "Meat & Deli";
    if (text.match(/milk|cheese|yogurt|yoghurt|butter|cream|egg|cottage/)) return "Dairy & Eggs";
    if (text.match(/cereal|rice|pasta|sauce|oil|spice|canned|coffee|tea|sugar|flour|snack|chips|pantry/)) return "Pantry";
    if (text.match(/water|juice|soda|coke|pepsi|drink|energy|beer|wine/)) return "Drinks";
    if (text.match(/soap|cleaner|paper|tissue|toilet|shampoo|wipe|detergent|household/)) return "Household & Other";
    if (text.match(/frozen|ice cream|pizza|nugget|pie|freezer/)) return "Freezer";
    return "Pantry";
  }

  // 1. WOOLWORTHS DIRECT SEARCH
  if (targetStore === 'Woolworths') {
    try {
      const wooliesUrl = 'https://www.woolworths.com.au/apis/ui/Search/products';
      
      const endpoint = apiKey 
        ? `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(wooliesUrl)}&country_code=au`
        : wooliesUrl;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Origin': 'https://www.woolworths.com.au',
          'Referer': `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(q)}`
        },
        body: JSON.stringify({
          SearchTerm: q,
          PageSize: 48, // Woolworths maximum page size limit
          PageNumber: 1,
          SortType: "TraderRelevance"
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Extract exact total total found count from store response header
        totalResults = data.TotalRecordCount || data.ProductsCount || 0;
        
        const productGroups = data.Products || [];

        productGroups.forEach(group => {
          const prod = group.Products?.[0];
          if (prod && prod.Name && prod.Price != null) {
            results.push({
              name: prod.Name,
              price: prod.Price,
              store: 'Woolworths',
              aisle: inferAisle(prod.Name)
            });
          }
        });
      }
    } catch (err) {
      console.error('Woolworths API search error:', err.message);
    }
  }

  // If totalResults wasn't provided directly, fall back to returned length
  if (!totalResults) {
    totalResults = results.length;
  }

  return res.status(200).json({ totalResults, results });
}