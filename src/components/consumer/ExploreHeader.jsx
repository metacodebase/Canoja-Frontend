import { useNavigate } from "react-router-dom";
import canojaLogo from "../../assets/canojaLogo.png";
import { useAuth } from "../../context/AuthContext";
import AdminThemeToggle from "../admin/AdminThemeToggle";
import MaterialIcon from "./MaterialIcon";
import CanojaVerifiedBadge from "../CanojaVerifiedBadge";
import "../admin/adminTheme.css";

const ExploreHeader = ({ view, onViewChange, theme, onThemeToggle }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <header className="consumer-header">
        <button className="consumer-brand" onClick={() => navigate("/explore")}>
          <img src={canojaLogo} alt="" />
          <span>Canoja</span>
        </button>
        <div className="consumer-header-actions">
          <div className="view-toggle" aria-label="Result view">
            <button className={view === "list" ? "active" : ""} onClick={() => onViewChange("list")} aria-label="List view"><MaterialIcon name="menu" size={24} /></button>
            <button className={view === "map" ? "active" : ""} onClick={() => onViewChange("map")} aria-label="Map view"><MaterialIcon name="map" size={24} /></button>
          </div>
          {!isAuthenticated && <AdminThemeToggle theme={theme} onToggle={onThemeToggle} />}
        </div>
      </header>
      <div className="verified-strip">
        <CanojaVerifiedBadge size={46} />
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
