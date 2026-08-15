// Cloudflare Pages Function: GET /api/search?store=Woolworths&q=coffee
//
// Server-side proxy for in-app product search, called from js/app.js so
// search results can render inside the app instead of just opening the
// store's site in a new tab.
//
// IMPORTANT — why this lives under /functions/api, not /api:
// Cloudflare Pages only executes serverless code placed under /functions
// (file-based routing: functions/api/search.js -> route /api/search).
// A file at top-level /api/search.js is served as a plain static asset
// and never runs — that's why the old version of this feature never
// actually worked even when deployed.
//
// Scope: Woolworths only for now. Coles and Aldi sit behind heavier bot
// protection and realistically need a paid scraping-proxy service to
// work reliably (see claude/supermarket-search-plan doc in the project).
// The front end still falls back to opening those stores' sites directly
// for now.
//
// Caveat: the Woolworths endpoint below is undocumented/internal (not an
// official public API), so it can change shape, start requiring session
// cookies, or get blocked at any time without notice. This has NOT been
// tested against a live deployment yet (built from an environment with
// no outbound access to woolworths.com.au) — test it for real on the
// develop preview before relying on it, and expect to adjust the
// request/response handling once you see what actually comes back.

const WOOLWORTHS_SEARCH_URL = 'https://www.woolworths.com.au/apis/ui/Search/products';
const MAX_QUERY_LENGTH = 100;
const PAGE_SIZE = 12;

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const store = (url.searchParams.get('store') || '').trim();
  const query = (url.searchParams.get('q') || '').trim().slice(0, MAX_QUERY_LENGTH);

  if (!query) {
    return jsonResponse({ results: [], error: 'Missing search term.' }, 400);
  }

  if (store !== 'Woolworths') {
    // Coles/Aldi aren't wired up yet. Return 200 with an explanatory
    // error rather than a 4xx, so the front end treats this as "not
    // available yet" and falls back to window.open(), not as a crash.
    return jsonResponse(
      { results: [], error: `In-app search isn't available for ${store || 'this store'} yet.` },
      200
    );
  }

  try {
    const upstream = await fetch(WOOLWORTHS_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Origin': 'https://www.woolworths.com.au',
        'Referer': `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(query)}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        searchTerm: query,
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        sortType: 'TraderRelevance',
        location: `/shop/search/products?searchTerm=${query}`,
        formatObject: JSON.stringify({ name: query }),
        isSpecial: false,
        isBundle: false,
        isMobile: false,
        filters: [],
        groupEdmVariants: false
      })
    });

    if (!upstream.ok) {
      return jsonResponse(
        { results: [], error: `Woolworths search is unavailable right now (status ${upstream.status}).` },
        200
      );
    }

    const data = await upstream.json();
    const results = normalizeWoolworthsResults(data);
    return jsonResponse({ results }, 200);
  } catch (err) {
    return jsonResponse({ results: [], error: 'Could not reach Woolworths search right now.' }, 200);
  }
}

// Woolworths' search response nests actual products inside "bundle"
// group objects (multi-buy groupings etc.), so each top-level entry can
// either be a product itself or a wrapper with its own .Products array.
// Defensive handling here because the exact shape can't be confirmed
// without a live test — see the caveat above.
function normalizeWoolworthsResults(data) {
  const groups = Array.isArray(data?.Products) ? data.Products : [];
  const products = [];

  for (const group of groups) {
    const items = Array.isArray(group?.Products) ? group.Products : [group];
    for (const p of items) {
      if (!p || !p.Name) continue;
      products.push({
        name: String(p.Name).trim(),
        price: typeof p.Price === 'number' ? p.Price : null,
        wasPrice: typeof p.WasPrice === 'number' ? p.WasPrice : null,
        unit: p.PackageSize || null,
        image: p.SmallImageFile || p?.ImageUris?.medium || p?.ImageUris?.large || null,
        stockcode: p.Stockcode || null
      });
    }
  }

  // De-dupe by name+unit (bundle groups can repeat the same product)
  // and cap what we send back to the client.
  const seen = new Set();
  const deduped = [];
  for (const item of products) {
    const key = `${item.name.toLowerCase()}|${item.unit || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= PAGE_SIZE) break;
  }

  return deduped;
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
