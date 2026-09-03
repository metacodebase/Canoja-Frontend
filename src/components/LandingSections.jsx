import { ArrowRight, Link2, ScanSearch, Sprout, Users } from "lucide-react";
import { Link } from "react-router-dom";
import cityImage from "../assets/canoja-city.jpg";

const operators = [
  { badge: "CANOJA VERIFIED", name: "Green Summit Wellness", type: "Dispensary", place: "Denver, Colorado", distance: "2.1 mi", license: "MED-001482", status: "License active", position: "center" },
  { badge: "PUBLIC LICENSE FOUND", name: "Highland Botanical Co.", type: "Cultivator", place: "Aurora, Colorado", distance: "7.8 mi", license: "CUL-008714", status: "License active", position: "left" },
  { badge: "CANOJA VERIFIED", name: "Mile High Extracts", type: "Manufacturer", place: "Lakewood, Colorado", distance: "9.4 mi", license: "MFG-004033", status: "Under review", position: "right" },
];

const benefits = [
  { icon: ScanSearch, title: "Discover nearby", text: "Search by location, operator type, business category, or license status." },
  { icon: Sprout, title: "Review status", text: "Review public license information and Canoja verification indicators in one view." },
  { icon: Users, title: "Compare profiles", text: "Compare hours, services, contact details, locations and operator-supplied information." },
  { icon: Link2, title: "Connect directly", text: "Get directions, visit operator websites and report information that may need review." },
];

function DiscoverySection() {
  return <section className="discovery section-shell" id="discover">
    <div className="section-intro"><div><span className="section-kicker">Trusted operator discovery</span><h2>A clearer way to<br />discover cannabis<br />operators.</h2></div><p>Review business details, operator category, public license information, verification indicators, hours, services and direct links before choosing where to visit.</p></div>
    <div className="operator-grid">{operators.map((operator) => <article className="operator-card" key={operator.name}>
      <div className="operator-card__image"><img src={cityImage} style={{ objectPosition: operator.position }} alt="Aerial view of a Colorado community" /><span>{operator.badge}</span></div>
      <div className="operator-card__body"><h3>{operator.name}</h3><p>{operator.type} · {operator.place} · {operator.distance}</p><div className={`license-status ${operator.status === "Under review" ? "review" : ""}`}><strong>{operator.status}</strong><span>{operator.license}</span></div><Link to="/explore">View operator profile <ArrowRight size={14} /></Link></div>
    </article>)}</div>
  </section>;
}

function PlatformSection() {
  return <section className="platform-section" id="why-canoja"><div className="section-shell">
    <div className="section-intro"><div><span className="section-kicker dark">Trusted operator discovery</span><h2>One trusted platform<br />for cannabis discovery.</h2></div><p>Canoja brings operator discovery, public license visibility and business profile management together in one simple experience designed for consumers and licensed operators.</p></div>
    <div className="benefit-grid">{benefits.map(({ icon: Icon, title, text }) => <article key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div>
  </div></section>;
}

function OperatorSection() {
  return <section className="operator-section section-shell" id="for-operators">
    <div className="operator-top"><div><span className="section-kicker">For licensed operators</span><h2>Own your digital<br />presence on Canoja.</h2><p>Licensed operators can claim and manage their Canoja profiles, update business details, add photos and hours, highlight services, and improve how their business appears to consumers.</p><div className="operator-buttons"><Link className="primary-button" to="/login">Operator Login <ArrowRight size={16} /></Link><Link to="/claim-business">Claim Your Business</Link></div></div>
      <aside><span>Canoja verification</span><h3>Operator visibility supported by public data.</h3><p>License numbers, status, dates and verification indicators are reviewed against available public sources. Canoja sources information but does not issue, grant or enforce cannabis licenses.</p><Link to="/explore">Request a License Correction <ArrowRight size={14} /></Link></aside></div>
    <div className="steps">{[["01", "Find your profile"], ["02", "Submit a claim"], ["03", "Canoja review"], ["04", "Manage content"]].map(([step, title]) => <article key={step}><span>Step {step}</span><h3>{title}</h3><p>{step === "01" ? "Locate your existing Canoja business profile." : step === "02" ? "Submit ownership or management authority and supporting details." : step === "03" ? "Canoja reviews identity, business and public license information." : "Update and maintain your public-facing business information."}</p></article>)}</div>
  </section>;
}

export default function LandingSections() { return <><DiscoverySection /><PlatformSection /><OperatorSection /></>; }
