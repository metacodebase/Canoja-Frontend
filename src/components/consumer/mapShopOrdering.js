const shopId = shop => shop.original?._id || shop._id || shop.place_id || shop.id;

export const isSpotlightShop = shop => {
  const record = shop.original || shop;
  return (shop.featured ?? record.featured) === true && record.claimed === true && ['starter', 'pro'].includes(record.plan_tier);
};

export const orderMapShops = (shops, prioritizeSpotlight) => {
  const seen = new Set();
  const unique = shops.filter(shop => {
    const id = shopId(shop);
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return prioritizeSpotlight ? [...unique].sort((a, b) => Number(isSpotlightShop(b)) - Number(isSpotlightShop(a))) : unique;
};

export const allSectionShops = shops => orderMapShops(shops, false)
  .sort((a, b) => Number(b.featured === true) - Number(a.featured === true));
