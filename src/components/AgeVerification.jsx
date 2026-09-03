import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import canojaWordmark from "../assets/canoja-wordmark.png";
import api from "../services/api";
import "./landingPage.css";

const REMEMBER_AGE_KEY = "RememberAge";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const requestLocation = () => new Promise((resolve) => {
  if (!navigator.geolocation) return resolve();
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      localStorage.setItem("userLatitude", String(coords.latitude));
      localStorage.setItem("userLongitude", String(coords.longitude));
      localStorage.setItem("userLocationUpdatedAt", String(Date.now()));
      resolve();
    },
    resolve,
    { enableHighAccuracy: true, timeout: 10000 },
  );
});

const AgeVerification = () => {
  const navigate = useNavigate();
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_AGE_KEY));
      if (saved?.expiryTimestamp > Date.now()) navigate("/explore", { replace: true });
    } catch {
      localStorage.removeItem(REMEMBER_AGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const continueToExplore = async () => {
    localStorage.setItem(REMEMBER_AGE_KEY, JSON.stringify({
      confirmed: true,
      expiryTimestamp: Date.now() + THIRTY_DAYS,
    }));
    api.post("/age-verification/log", {
      confirmed_age: true,
      min_age: 21,
      platform: "web",
      timestamp: new Date().toISOString(),
    }).catch(() => {});
    await requestLocation();
    navigate("/explore", { replace: true });
  };

  if (loading) return null;

  return (
    <main className="landing-age landing-age--page" role="dialog" aria-modal="true" aria-labelledby="age-title">
      <section className="landing-age__card">
        <img src={canojaWordmark} alt="Canoja" />
        <h1 id="age-title">{denied ? "Access restricted" : "Are you 21 or older?"}</h1>
        <p>{denied ? "You must be at least 21 years old to use Canoja." : "Please confirm that you are of legal age before browsing nearby businesses."}</p>
        {denied ? (
          <button className="landing-age__back" onClick={() => setDenied(false)}>Go back</button>
        ) : (
          <div className="landing-age__actions">
            <button onClick={continueToExplore}>Yes</button>
            <button onClick={() => setDenied(true)}>No</button>
          </div>
        )}
      </section>
    </main>
  );
};

export default AgeVerification;
