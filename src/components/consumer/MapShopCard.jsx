import { ChevronLeft, ChevronRight, MapPin, Phone, Navigation } from "lucide-react";

const value = (shop, ...keys) => keys.map((key) => shop?.[key]).find(Boolean);

const MapShopCard = ({ shop, index, total, onPrevious, onNext, onOpen }) => {
  const types = value(shop, "type", "business_type", "found_by_query");
  const distance = value(shop, "distance_miles", "distance", "distance_from_user");

  return (
    <div className="map-card-dock">
      <div className="map-card-stack" aria-live="polite">
        <span className="map-card-peek map-card-peek--left" />
        <article className="map-shop-card">
          <h3>{value(shop, "name", "business_name") || "Canoja operator"}</h3>
          <p><MapPin size={16} />{value(shop, "address", "business_address") || "Address unavailable"}</p>
          {value(shop, "phone", "phone_number") && <p><Phone size={16} />{value(shop, "phone", "phone_number")}</p>}
          <p><Navigation size={16} />{distance != null ? `${Number(distance).toFixed(1)} mi away` : "Distance unavailable"}</p>
          {types && <span className="map-shop-type">{Array.isArray(types) ? types.join(" · ") : types}</span>}
          <button className="map-card-open" onClick={onOpen} aria-label="Open operator details"><ChevronRight size={20} /></button>
        </article>
        <span className="map-card-peek map-card-peek--right" />
      </div>
      <div className="map-card-pagination">
        <button onClick={onPrevious} disabled={index === 0} aria-label="Previous operator"><ChevronLeft /></button>
        <strong>{index + 1} / {total}</strong>
        <button onClick={onNext} disabled={index === total - 1} aria-label="Next operator"><ChevronRight /></button>
      </div>
    </div>
  );
};

export default MapShopCard;
