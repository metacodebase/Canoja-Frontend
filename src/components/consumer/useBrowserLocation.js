import { useEffect, useState } from "react";

const clearStoredLocation = () => {
  localStorage.removeItem("userLatitude");
  localStorage.removeItem("userLongitude");
  localStorage.removeItem("userLocationUpdatedAt");
};

const useBrowserLocation = () => {
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      clearStoredLocation();
      setLocationError("Location is unavailable. Select a region to search.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: current }) => {
        const next = { lat: current.latitude, lng: current.longitude };
        localStorage.setItem("userLatitude", String(next.lat));
        localStorage.setItem("userLongitude", String(next.lng));
        localStorage.setItem("userLocationUpdatedAt", String(Date.now()));
        setCoords(next);
        setLocating(false);
      },
      () => {
        clearStoredLocation();
        setLocationError("Enable location access or select a region to search.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  return { coords, locating, locationError };
};

export default useBrowserLocation;
