import { useLocation, useNavigate } from "react-router-dom";
import canojaShop from "../../assets/canoja-shop.png";
import BusinessActions from "./BusinessActions";
import BusinessDetailExtras from "./BusinessDetailExtras";
import BusinessHours from "./BusinessHours";
import useAdminTheme from "../admin/useAdminTheme";
import "./consumerDetail.css";

const readStoredBusiness = () => {
  try { return JSON.parse(sessionStorage.getItem("selectedBusiness")); } catch { return null; }
};

const ConsumerBusinessDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();
  const business = location.state?.business || readStoredBusiness();
  if (!business) return <main className={`consumer-detail empty-detail consumer-detail--${theme}`}><h1>Business unavailable</h1><button onClick={() => navigate("/explore")}>Back to Explore</button></main>;
  const image = business.photo_url || business.photos?.[0]?.url || canojaShop;
  const name = business.name || business.business_name || "Canoja operator";
  const address = business.address || business.business_address;

  return (
    <main className={`consumer-detail consumer-detail--${theme}`}>
      <header className="detail-hero">
        <img src={image} alt="" onError={({ currentTarget }) => { currentTarget.onerror = null; currentTarget.src = canojaShop; }} />
        <button className="detail-back" onClick={() => navigate(-1)} aria-label="Back">‹</button>
      </header>
      <div className="detail-content">
        <div className="detail-primary-grid">
          <section className="business-info-card">
            <div className="business-info-heading"><div><h1>{name}</h1>{address && <p>{address}</p>}</div>{business.rating && <strong>★ {business.rating}/5 ({business.user_ratings_total || 0})</strong>}</div>
            <div className="business-status"><span>Business Status:</span><strong className={business.open_now ? "open" : "closed"}>● {business.open_now ? "Open Now" : "Closed Now"}</strong></div>
            <BusinessActions business={business} />
          </section>
          <BusinessHours value={business.working_hours || business.opening_hours} />
        </div>
        <BusinessDetailExtras business={business} theme={theme} />
      </div>
    </main>
  );
};

export default ConsumerBusinessDetail;
