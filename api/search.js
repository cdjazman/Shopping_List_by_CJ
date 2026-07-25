// api/search.js
export default async function handler(req, res) {
  // Enable CORS so your GitHub Pages app can talk to this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q, store } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing search query parameter: q' });
  }

  try {
    let results = [];

    // Woolworths Public Search Endpoint
    if (store === 'Woolworths' || store === 'ALL') {
      const wooliesRes = await fetch('https://www.woolworths.com.au/apis/ui/Search/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
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
    }

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch store data', details: error.message });
  }
}
