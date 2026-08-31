import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import canojaLogo from "../assets/canojaLogo.png";
import api from "../services/api";

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
  const [selected, setSelected] = useState(null);
  const [remember, setRemember] = useState(true);
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
    if (selected === 0) return setDenied(true);
    if (selected !== 1) return;
    if (remember) {
      localStorage.setItem(REMEMBER_AGE_KEY, JSON.stringify({
        confirmed: true,
        expiryTimestamp: Date.now() + THIRTY_DAYS,
      }));
    }
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
    <main className="age-gate">
      <section className="age-gate__card">
        <img src={canojaLogo} alt="Canoja" className="age-gate__logo" />
        {denied ? (
          <>
            <h1>Access restricted</h1>
            <p>You must be at least 21 years old to use Canoja.</p>
            <button className="age-gate__secondary" onClick={() => navigate("/login")}>Back to login</button>
          </>
        ) : (
          <>
            <span className="age-gate__eyebrow">Welcome to Canoja</span>
            <h1>Are you 21 or older?</h1>
            <p>Please confirm that you are of legal age before browsing nearby businesses.</p>
            <div className="age-gate__choices">
              <button className={selected === 1 ? "active" : ""} onClick={() => setSelected(1)}>Yes, I am 21+</button>
              <button className={selected === 0 ? "active" : ""} onClick={() => setSelected(0)}>No, I am not</button>
            </div>
            <label className="age-gate__remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Remember my confirmation for 30 days
            </label>
            <button className="age-gate__continue" disabled={selected === null} onClick={continueToExplore}>Continue</button>
            <button className="age-gate__link" onClick={() => navigate("/login")}>Already have an account? Sign in</button>
          </>
        )}
      </section>
    </main>
  );
};

export default AgeVerification;
