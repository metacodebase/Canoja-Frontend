import { useEffect, useState } from "react";
import canojaWordmark from "../assets/canoja-wordmark.png";

const AGE_KEY = "canojaLandingAgeVerified";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export default function LandingAgeGate() {
  const [open, setOpen] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(AGE_KEY));
      setOpen(!saved?.confirmed || saved.expiryTimestamp <= Date.now());
    } catch {
      localStorage.removeItem(AGE_KEY);
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const confirm = () => {
    localStorage.setItem(AGE_KEY, JSON.stringify({ confirmed: true, expiryTimestamp: Date.now() + THIRTY_DAYS }));
    setOpen(false);
  };

  if (!open) return null;
  return <div className="landing-age" role="dialog" aria-modal="true" aria-labelledby="age-title">
    <section className="landing-age__card">
      <img src={canojaWordmark} alt="Canoja" />
      <h2 id="age-title">{denied ? "Access restricted" : "Are you 21 or older?"}</h2>
      <p>{denied ? "You must be at least 21 years old to use Canoja." : "Please confirm that you are of legal age before browsing nearby businesses."}</p>
      {denied ? <button className="landing-age__back" onClick={() => setDenied(false)}>Go back</button> : <div className="landing-age__actions"><button onClick={confirm}>Yes</button><button onClick={() => setDenied(true)}>No</button></div>}
    </section>
  </div>;
}
