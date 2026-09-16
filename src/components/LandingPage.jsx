import { ArrowRight, ChevronDown, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import canojaWordmark from "../assets/canoja-wordmark.png";
import LandingSections from "./LandingSections";
import LandingMoreSections from "./LandingMoreSections";
import LandingAgeGate from "./LandingAgeGate";
import { useAuth } from "../context/AuthContext";
import "./landingPage.css";

const navItems = ["Home", "Discover", "License Search", "Why Canoja", "For Operators", "Mobile App", "Platform Roadmap"];

function SearchPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("operators");
  const [location, setLocation] = useState("Denver, CO");
  const [operatorType, setOperatorType] = useState("all");
  const [radius, setRadius] = useState(10);
  const [licenseLocation, setLicenseLocation] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const explorePath = user?.role === "operator" ? "/operator/explore" : "/explore";
  const submit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const selectedLocation = tab === "licenses" ? licenseLocation : location;
    if (selectedLocation.trim()) params.set("location", selectedLocation.trim());
    if (tab === "licenses") params.set("license", licenseNumber.trim());
    else {
      params.set("type", operatorType);
      params.set("radius", String(radius));
    }
    navigate(`${explorePath}?${params.toString()}`);
  };
  return <form className="landing-search" onSubmit={submit}>
    <div className="landing-search__tabs" role="tablist">
      <button type="button" className={tab === "operators" ? "active" : ""} onClick={() => setTab("operators")}>Explore Operators</button>
      <button type="button" className={tab === "licenses" ? "active" : ""} onClick={() => setTab("licenses")}>Search Licenses</button>
    </div>
    <label>{tab === "licenses" ? "Location (optional)" : "Location or operator name"}<input value={tab === "licenses" ? licenseLocation : location} onChange={(e) => tab === "licenses" ? setLicenseLocation(e.target.value) : setLocation(e.target.value)} placeholder={tab === "licenses" ? "City or state (optional)" : "City, state, or operator"} /></label>
    {tab === "licenses" && <label className="landing-search__license">License number<input required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Enter license number" /></label>}
    {tab === "operators" && <div className="landing-search__row">
      <label>Operator type<span className="landing-select"><select className="select-field" value={operatorType} onChange={event => setOperatorType(event.target.value)}><option value="all">All Operators</option><option value="cannabis">Cannabis</option><option value="smoke">Smoke Shop</option></select><ChevronDown size={18} aria-hidden="true" /></span></label>
      <label>Distance<span className="landing-select"><select className="select-field" value={radius} onChange={event => setRadius(Number(event.target.value))}>{[5, 10, 25, 50, 100].map(miles => <option key={miles} value={miles}>Within {miles} Miles</option>)}</select><ChevronDown size={18} aria-hidden="true" /></span></label>
    </div>}
    <button className="primary-button landing-search__submit" type="submit">{tab === "operators" ? "Explore Operators" : "Search Licenses"}</button>
    <p>Canoja does not issue cannabis licenses. Official determinations remain with the applicable regulatory authority.</p>
  </form>;
}

export default function LandingPage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const explorePath = user?.role === "operator" ? "/operator/explore" : "/explore";
  return <main className="landing">
    <LandingAgeGate />
    <div className="landing-strip">Verified. Trusted. Connected. · Cannabis Discovery · License Visibility · Operator Profiles</div>
    <header className="landing-header">
      <Link className="landing-brand" to="/" aria-label="Canoja home"><img className="wordmark-image" src={canojaWordmark} alt="Canoja" /></Link>
      <nav className={menuOpen ? "open" : ""}>{navItems.map((item, index) => <a className={index === 0 ? "active" : ""} href={index === 0 ? "#home" : index < 3 ? "/explore" : `#${item.toLowerCase().replaceAll(" ", "-")}`} key={item}>{item}</a>)}</nav>
      <Link className="login-button" to="/login">Operator Login <ArrowRight size={22} /></Link>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
    </header>
    <section className="landing-hero" id="home">
      <div className="landing-hero__copy">
        <div className="eyebrow"><span />Verified. Trusted. Connected.</div>
        <h1>Discover licensed<br />cannabis businesses<br />with <em>confidence.</em></h1>
        <p>Canoja is a compliance-first cannabis technology platform that helps adult consumers discover licensed dispensaries and operators, review public license information, and connect directly with trusted cannabis businesses.</p>
        <div className="landing-actions"><Link className="primary-button" to={explorePath}>Explore Operators</Link><Link to={explorePath}>Verify a License</Link><a href="#mobile-app">Get the Mobile App</a></div>
        <div className="landing-trust"><span><i />Public license visibility</span><span><i />Clear verification indicators</span><span><i />Built for future compliance</span></div>
      </div>
      <SearchPanel />
    </section>
    <LandingSections />
    <LandingMoreSections />
  </main>;
}
