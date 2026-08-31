import { useNavigate } from "react-router-dom";
import canojaLogo from "../../assets/canojaLogo.png";
import { useAuth } from "../../context/AuthContext";

const ExploreHeader = ({ view, onViewChange }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <header className="consumer-header">
        <button className="consumer-brand" onClick={() => navigate("/explore")}>
          <img src={canojaLogo} alt="" />
          <span>Canoja</span>
        </button>
        <div className="view-toggle" aria-label="Result view">
          <button className={view === "list" ? "active" : ""} onClick={() => onViewChange("list")} aria-label="List view">☰</button>
          <button className={view === "map" ? "active" : ""} onClick={() => onViewChange("map")} aria-label="Map view">⌖</button>
        </div>
      </header>
      <div className="verified-strip">
        <img src={canojaLogo} alt="" />
        <span><strong>Verified operators near you</strong>Licensed · Verified · Trusted · Intelligent</span>
      </div>
      <div className="explore-title-row">
        <h1>Explore</h1>
        {!isAuthenticated && <button onClick={() => navigate("/login")}>Login</button>}
      </div>
    </>
  );
};

export default ExploreHeader;
