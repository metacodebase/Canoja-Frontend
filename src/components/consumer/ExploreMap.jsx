import { useEffect, useMemo, useRef, useState } from "react";
import canojaLogo from "../../assets/canojaLogo.png";
import MapShopCard from "./MapShopCard";
import { DARK_MAP_STYLES, hasGoogleMapsKey, loadGoogleMaps, positionOf } from "./googleMaps";

const addShopMarker = (maps, map, item, onSelect) => {
  class CanojaMarker extends maps.OverlayView {
    onAdd() {
      this.node = document.createElement("button");
      this.node.type = "button";
      this.node.className = "canoja-map-marker";
      this.node.innerHTML = `<span class="canoja-marker-icon"><img src="${canojaLogo}" alt=""></span>`;
      this.node.setAttribute("aria-label", item.shop.name || item.shop.business_name || "Canoja operator");
      this.node.addEventListener("click", onSelect);
      this.getPanes().overlayMouseTarget.appendChild(this.node);
    }
    draw() {
      const point = this.getProjection().fromLatLngToDivPixel(item.position);
      if (point && this.node) this.node.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -42px)`;
    }
    setSelected(selected) { this.node?.classList.toggle("is-selected", selected); }
    onRemove() { this.node?.removeEventListener("click", onSelect); this.node?.remove(); }
  }
  const marker = new CanojaMarker();
  marker.setMap(map);
  return marker;
};

const ExploreMap = ({ shops, coords, locating, locationError, onShopSelect, theme, canLoadMore, nextLimit, onLoadMore }) => {
  const sectionRef = useRef(null);
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const selectedIndexRef = useRef(0);
  const lastPannedIndexRef = useRef(0);
  const [mapError, setMapError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mappedShops = useMemo(() => shops.map((shop) => ({ shop, position: positionOf(shop) })).filter(({ position }) => position), [shops]);

  useEffect(() => {
    const updateFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === sectionRef.current);
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  useEffect(() => {
    if (!hasGoogleMapsKey) { setMapError("Google Maps API key is unavailable."); return undefined; }
    let disposed = false;
    const overlays = [];
    loadGoogleMaps().then((maps) => {
      if (disposed || !mapNode.current) return;
      mapNode.current.replaceChildren();
      const userPosition = coords ? { lat: coords.lat, lng: coords.lng } : null;
      const center = userPosition || mappedShops[0]?.position || { lat: 18.3358, lng: -64.8963 };
      const map = new maps.Map(mapNode.current, { center, zoom: 12, minZoom: 3, maxZoom: 18, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, cameraControl: false, rotateControl: false, gestureHandling: "greedy", styles: theme === "light" ? null : DARK_MAP_STYLES });
      mapRef.current = map;
      const bounds = new maps.LatLngBounds();
      mappedShops.forEach((item, index) => {
        const { position } = item;
        const marker = addShopMarker(maps, map, item, () => setSelectedIndex(index));
        marker.setSelected(index === selectedIndexRef.current);
        overlays.push(marker); bounds.extend(position);
      });
      markersRef.current = overlays;
      if (userPosition) { const user = new maps.Marker({ map, position: userPosition, title: "Your location", icon: { path: maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#40ea54", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 } }); overlays.push(user); bounds.extend(userPosition); }
      if (!bounds.isEmpty()) { map.fitBounds(bounds, 54); maps.event.addListenerOnce(map, "idle", () => { if (map.getZoom() > 14) map.setZoom(14); }); }
    }).catch(() => setMapError("Google Maps could not be loaded."));
    return () => { disposed = true; overlays.forEach((overlay) => overlay.setMap(null)); markersRef.current = []; };
  }, [coords, mappedShops, theme]);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
    if (selectedIndex >= mappedShops.length) setSelectedIndex(0);
    markersRef.current.forEach((marker, index) => marker.setSelected?.(index === selectedIndex));
    const selected = mappedShops[selectedIndex];
    if (selected && mapRef.current && selectedIndex !== lastPannedIndexRef.current) {
      mapRef.current.panTo(selected.position);
      lastPannedIndexRef.current = selectedIndex;
    }
  }, [mappedShops, selectedIndex]);

  const selected = mappedShops[selectedIndex]?.shop;
  const toggleFullscreen = () => isFullscreen ? document.exitFullscreen() : sectionRef.current?.requestFullscreen();
  return <section ref={sectionRef} className="consumer-map" aria-label="Nearby operators map"><div ref={mapNode} className="google-map-canvas" /><button type="button" className="map-fullscreen" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}>{isFullscreen ? "×" : "⛶"}</button>{mapError && <div className="map-error">{mapError}</div>}{canLoadMore && <button type="button" className="map-load-more" onClick={onLoadMore}>Load up to {nextLimit} operators</button>}{selected && <MapShopCard shop={selected} index={selectedIndex} total={mappedShops.length} onPrevious={() => setSelectedIndex((index) => Math.max(0, index - 1))} onNext={() => setSelectedIndex((index) => Math.min(mappedShops.length - 1, index + 1))} onOpen={() => onShopSelect(selected)} />}<div className="map-result-count"><strong>{mappedShops.length} operators in this area</strong>{locating ? "Finding your location…" : locationError}</div></section>;
};

export default ExploreMap;
