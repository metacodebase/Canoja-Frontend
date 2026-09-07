import { Check, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import appleIcon from "../assets/apple-store.png";
import googleIcon from "../assets/google-play.png";
import mobileHero from "../assets/canoja-mobile-hero.png";
import mobileShowcase from "../assets/canoja-mobile-showcase.png";
import canojaWordmark from "../assets/canoja-wordmark.png";

const appFeatures = [
  ["Search nearby operators", "Explore businesses by location, category and distance."],
  ["Review license visibility", "See public license information and verification indicators."],
  ["Save favorites", "Keep a personal list of operators you want to revisit."],
  ["Stay connected", "Receive future updates, operator news and platform notifications."],
];
const phases = [
  { phase: "Phase I", title: "Discover", text: "Operator search, maps, business profiles, public license visibility, favorites, notifications and profile management." },
  { phase: "Phase II", title: "Order", text: "Live menus, product discovery, online ordering, pickup, checkout, promotions and operator order management." },
  { phase: "Phase III", title: "Deliver", text: "Compliant delivery coordination, driver and customer authentication, live tracking and digital proof of delivery." },
  { phase: "Future platform", title: "Intelligence", text: "Canoja intelligence™ and Ask Canoja™ for regulatory, market, compliance and business intelligence." },
];

function MobileSection() {
  return <section className="mobile-section" id="mobile-app"><div className="section-shell">
    <div className="mobile-intro"><div><span className="section-kicker">Canoja mobile app</span><h2>Trusted cannabis discovery,<br />wherever you go.</h2><p>Take Canoja with you and explore licensed dispensaries, cultivators, manufacturers and other cannabis operators from your phone. The Canoja mobile app is designed to make trusted discovery faster, easier and more convenient.</p><div className="mobile-features">{appFeatures.map(([title, text]) => <article key={title}><Check /><div><strong>{title}</strong><p>{text}</p></div></article>)}</div><div className="store-buttons"><button><img src={appleIcon} alt="" />Download on the <b>App Store</b></button><button><img src={googleIcon} alt="" />Get it on <b>Google Play</b></button></div></div><img className="mobile-device-art" src={mobileHero} alt="Canoja mobile app with download QR code" /></div>
    <div className="app-showcase"><span className="section-kicker">Canoja mobile app</span><h2>Explore cannabis with confidence,<br />right from your phone.</h2><div className="mobile-showcase-scroll"><img className="mobile-showcase-art" src={mobileShowcase} alt="Canoja mobile app screens" /></div><div className="slider-dots"><i /><i className="active" /><i /></div></div>
  </div></section>;
}

function RoadmapSection() {
  return <section className="roadmap" id="platform-roadmap"><div className="section-shell"><div className="section-intro"><div><span className="section-kicker dark">Product roadmap</span><h2>One platform that<br />grows with market.</h2></div><p>Canoja launches with trusted discovery and public license visibility, then expands into ordering, delivery and cannabis intelligence through one connected platform.</p></div><div className="phase-grid">{phases.map((item, index) => <article className={index === 0 ? "active" : ""} key={item.phase}><span>{item.phase}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>;
}

function SiteFooter() {
  return <><section className="ecosystem"><div><span className="section-kicker">Be part of the Canoja ecosystem</span><h2>A more trusted cannabis ecosystem<br />starts here.</h2><p>Explore licensed operators, claim your business profile, join as a strategic partner or learn more about Canoja's growth and investment vision.</p></div><div><a className="primary-button" href="#mobile-app">Download The App</a><a href="mailto:hello@canoja.com">Contact Canoja</a></div></section><footer className="site-footer"><div className="footer-main"><div className="footer-brand"><Link className="landing-brand footer-logo" to="/" aria-label="Canoja home"><img className="wordmark-image" src={canojaWordmark} alt="Canoja" /></Link><p>A compliance-first cannabis technology platform connecting adult consumers and licensed operators through discovery, public license visibility and trusted information.</p><span><a href="#" aria-label="LinkedIn"><strong>in</strong></a><a href="mailto:hello@canoja.com" aria-label="Email Canoja"><Mail /></a></span></div><div><h4>Privacy Policy</h4><a href="/explore">Discover Operators</a><a href="/explore">Search Licenses</a><a href="#">Favourites</a><a href="#mobile-app">Download the App</a></div><div><h4>Operators</h4><Link to="/login">Operator Login</Link><Link to="/claim-business">Claim Your Profile</Link><a href="/explore">Profile Correction</a><a href="#">Operator FAQ</a></div><div><h4>Company</h4><a href="#platform-roadmap">Platform Roadmap</a><a href="#">Partners &amp; Investors</a><a href="mailto:hello@canoja.com">Contact</a><a href="#">Privacy</a></div></div><div className="footer-bottom"><span>© 2026 Canoja. Verified. Trusted. Connected.</span><span>Canoja does not issue cannabis licenses or provide legal, medical or regulatory advice.</span></div></footer></>;
}

export default function LandingMoreSections() { return <><MobileSection /><RoadmapSection /><SiteFooter /></>; }
