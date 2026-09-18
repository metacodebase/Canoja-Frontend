const validPosition = (lat, lng) => {
  if (lat == null || lng == null || lat === "" || lng === "") return null;
  const position = {lat: Number(lat), lng: Number(lng)};
  return Number.isFinite(position.lat) && Number.isFinite(position.lng)
    && Math.abs(position.lat) <= 90 && Math.abs(position.lng) <= 180
    ? position : null;
};

export const formatShopDistance = (shop, userCoords) => {
  const user = validPosition(userCoords?.lat, userCoords?.lng);
  const coordinates = shop.location?.coordinates || shop.coordinates;
  const destination = validPosition(
    shop.lat ?? shop.latitude ?? shop.gps_coordinates?.latitude
      ?? (Array.isArray(coordinates) ? coordinates[1] : coordinates?.latitude),
    shop.lng ?? shop.longitude ?? shop.gps_coordinates?.longitude
      ?? (Array.isArray(coordinates) ? coordinates[0] : coordinates?.longitude),
  );
  if (!user || !destination) return "Distance unavailable";
  const radians = degrees => degrees * Math.PI / 180;
  const a = Math.sin(radians(destination.lat - user.lat) / 2) ** 2
    + Math.cos(radians(user.lat)) * Math.cos(radians(destination.lat))
    * Math.sin(radians(destination.lng - user.lng) / 2) ** 2;
  const miles = 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
  return `${miles.toFixed(1)} mi away`;
};
