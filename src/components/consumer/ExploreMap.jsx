import { useEffect, useMemo, useRef, useState } from "react";
import canojaLogo from "../../assets/canojaLogo.png";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const loadGoogleMaps = () => {
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

const positionOf = (shop) => {
  const coordinates = shop.location?.coordinates || shop.coordinates;
  const lat = Number(shop.lat ?? shop.latitude ?? shop.gps_coordinates?.latitude ?? (Array.isArray(coordinates) ? coordinates[1] : coordinates?.latitude));
  const lng = Number(shop.lng ?? shop.longitude ?? shop.gps_coordinates?.longitude ?? (Array.isArray(coordinates) ? coordinates[0] : coordinates?.longitude));
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const ExploreMap = ({ shops, coords, locating, locationError, onShopSelect }) => {
  const mapNode = useRef(null);
  const [mapError, setMapError] = useState("");
  const mappedShops = useMemo(() => shops.map((shop) => ({ shop, position: positionOf(shop) })).filter(({ position }) => position), [shops]);

  useEffect(() => {
    if (!apiKey) { setMapError("Google Maps API key is unavailable."); return undefined; }
    let disposed = false;
    const overlays = [];
    loadGoogleMaps().then((maps) => {
      if (disposed || !mapNode.current) return;
      const userPosition = coords ? { lat: coords.lat, lng: coords.lng } : null;
      const center = userPosition || mappedShops[0]?.position || { lat: 18.3358, lng: -64.8963 };
      const map = new maps.Map(mapNode.current, { center, zoom: 12, minZoom: 3, maxZoom: 18, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, gestureHandling: "greedy", styles: [{ elementType: "geometry", stylers: [{ color: "#17201f" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#91a59e" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#17201f" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3532" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#071a19" }] }, { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }] });
      const bounds = new maps.LatLngBounds();
      mappedShops.forEach(({ shop, position }) => {
        const marker = new maps.Marker({ map, position, title: shop.name || shop.business_name, icon: { url: canojaLogo, scaledSize: new maps.Size(38, 38), anchor: new maps.Point(19, 19) } });
        marker.addListener("click", () => onShopSelect(shop));
        overlays.push(marker); bounds.extend(position);
      });
      if (userPosition) { const user = new maps.Marker({ map, position: userPosition, title: "Your location", icon: { path: maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#40ea54", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 } }); overlays.push(user); bounds.extend(userPosition); }
      if (!bounds.isEmpty()) { map.fitBounds(bounds, 54); maps.event.addListenerOnce(map, "idle", () => { if (map.getZoom() > 14) map.setZoom(14); }); }
    }).catch(() => setMapError("Google Maps could not be loaded."));
    return () => { disposed = true; overlays.forEach((overlay) => overlay.setMap(null)); };
  }, [coords, mappedShops, onShopSelect]);

  return <section className="consumer-map" aria-label="Nearby operators map"><div ref={mapNode} className="google-map-canvas" />{mapError && <div className="map-error">{mapError}</div>}<div className="map-result-count"><strong>{mappedShops.length} operators in this area</strong>{locating ? "Finding your location…" : locationError}</div></section>;
};

export default ExploreMap;
