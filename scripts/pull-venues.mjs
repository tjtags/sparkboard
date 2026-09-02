const kalshi = await fetch(
  "https://external-api.kalshi.com/trade-api/v2/events?status=open&with_nested_markets=true&limit=5",
);
const poly = await fetch(
  "https://gamma-api.polymarket.com/markets?closed=false&limit=5&order=volume24hr&ascending=false",
);
console.log("kalshi", kalshi.status, "polymarket", poly.status);
const ke = await kalshi.json();
const pm = await poly.json();
console.log("kalshi events", ke.events?.length, "poly markets", Array.isArray(pm) ? pm.length : "?");
