import { ArrowRight, ChevronDown, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import canojaWordmark from "../assets/canoja-wordmark.png";
import LandingSections from "./LandingSections";
import LandingMoreSections from "./LandingMoreSections";
import LandingAgeGate from "./LandingAgeGate";
import "./landingPage.css";

const navItems = ["Home", "Discover", "License Search", "Why Canoja", "For Operators", "Mobile App", "Platform Roadmap"];

function SearchPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("operators");
  const [location, setLocation] = useState("Denver, CO");
  const submit = (event) => { event.preventDefault(); navigate(`/explore?location=${encodeURIComponent(location)}`); };
  return <form className="landing-search" onSubmit={submit}>
    <div className="landing-search__tabs" role="tablist">
      <button type="button" className={tab === "operators" ? "active" : ""} onClick={() => setTab("operators")}>Explore Operators</button>
      <button type="button" className={tab === "licenses" ? "active" : ""} onClick={() => setTab("licenses")}>Search Licenses</button>
    </div>
    <label>Location or operator name<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, state, or operator" /></label>
    <div className="landing-search__row">
      <label>Operator type<span className="select-field">All Operators <ChevronDown size={19} /></span></label>
      <label>Distance<span className="select-field">Within 10 Miles <ChevronDown size={19} /></span></label>
    </div>
    <button className="primary-button landing-search__submit" type="submit">{tab === "operators" ? "Explore Operators" : "Search Licenses"}</button>
    <p>Canoja does not issue cannabis licenses. Official determinations remain with the applicable regulatory authority.</p>
  </form>;
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <main className="landing">
    <LandingAgeGate />
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
        <div className="landing-actions"><Link className="primary-button" to="/explore">Explore Operators</Link><a href="/explore">Verify a License</a><a href="#mobile-app">Get the Mobile App</a></div>
        <div className="landing-trust"><span><i />Public license visibility</span><span><i />Clear verification indicators</span><span><i />Built for future compliance</span></div>
      </div>
      <SearchPanel />
    </section>
    <LandingSections />
    <LandingMoreSections />
  </main>;
}
