const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const hasGoogleMapsKey = Boolean(apiKey);

export const DARK_MAP_STYLES = [{ elementType: "geometry", stylers: [{ color: "#17201f" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#91a59e" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#17201f" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3532" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#071a19" }] }, { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }];

export const loadGoogleMaps = () => {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.canojaGoogleMapsPromise) return window.canojaGoogleMapsPromise;

  window.canojaGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return window.canojaGoogleMapsPromise;
};

export const positionOf = (shop) => {
  const coordinates = shop.location?.coordinates || shop.coordinates;
  const lat = Number(shop.lat ?? shop.latitude ?? shop.gps_coordinates?.latitude ?? (Array.isArray(coordinates) ? coordinates[1] : coordinates?.latitude));
  const lng = Number(shop.lng ?? shop.longitude ?? shop.gps_coordinates?.longitude ?? (Array.isArray(coordinates) ? coordinates[0] : coordinates?.longitude));
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};
