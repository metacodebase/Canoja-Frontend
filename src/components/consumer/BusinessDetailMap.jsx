import { useEffect, useRef, useState } from "react";
import { hasGoogleMapsKey, loadGoogleMaps, positionOf } from "./googleMaps";

const resolvePosition = (maps, business) => {
  const position = positionOf(business);
  if (position) return Promise.resolve(position);

  const address = business.address || business.business_address;
  if (!address) return Promise.reject(new Error("Business location is unavailable."));

  return new Promise((resolve, reject) => {
    new maps.Geocoder().geocode({ address }, (results, status) => {
      const location = results?.[0]?.geometry?.location;
      if (status === "OK" && location) resolve({ lat: location.lat(), lng: location.lng() });
      else reject(new Error("Business location could not be found."));
    });
  });
};

const BusinessDetailMap = ({ business, mapUrl }) => {
  const mapNode = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasGoogleMapsKey) {
      setError("Google Maps API key is unavailable.");
      return undefined;
    }

    let disposed = false;
    loadGoogleMaps()
      .then(async (maps) => {
        const position = await resolvePosition(maps, business);
        if (disposed || !mapNode.current) return;
        const map = new maps.Map(mapNode.current, {
          center: position,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        new maps.Marker({ map, position, title: business.name || business.business_name });
      })
      .catch((mapError) => !disposed && setError(mapError.message || "Google Maps could not be loaded."));

    return () => { disposed = true; };
  }, [business]);

  return (
    <div className="map-preview">
      <div ref={mapNode} className="detail-map-canvas" />
      {error && <a href={mapUrl} target="_blank" rel="noreferrer">{error} Open in Google Maps.</a>}
    </div>
  );
};

export default BusinessDetailMap;
