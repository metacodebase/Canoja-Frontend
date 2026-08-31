import { useNavigate } from "react-router-dom";
import canojaShop from "../../assets/canoja-shop.png";

const getImage = (shop) => shop.photo_url || shop.photos?.[0]?.url || shop.image;
const getDistance = (shop) => shop.distance_miles ?? shop.distance ?? shop.distance_from_user;

const BusinessCard = ({ shop, spotlight = false }) => {
  const navigate = useNavigate();
  const image = getImage(shop);
  const distance = getDistance(shop);
  const status = shop.open_now === true ? "Open" : shop.open_now === false ? "Closed" : "N/A";
  const isFeatured = spotlight || shop.featured || shop.spotlight;
  const businessId = shop._id || shop.place_id || shop.id;
  const openDetails = () => {
    sessionStorage.setItem("selectedBusiness", JSON.stringify(shop));
    navigate(`/business/${encodeURIComponent(businessId || "selected")}`, { state: { business: shop } });
  };

  return (
    <article
      className={`consumer-business-card${isFeatured ? " spotlight-card" : ""}`}
      role="button"
      tabIndex="0"
      onClick={openDetails}
      onKeyDown={(event) => ["Enter", " "].includes(event.key) && openDetails()}>
      {isFeatured && <span className="featured-badge">★ Featured</span>}
      <div className="business-photo">
        <img
          src={image || canojaShop}
          alt=""
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = canojaShop;
          }}
        />
      </div>
      <div className="business-copy">
        <h3>{shop.name || shop.business_name || "Canoja operator"}</h3>
        <span>{shop.found_by_query || shop.business_type || "Cannabis operator"}</span>
        <p>{shop.address || shop.business_address || "Address unavailable"}</p>
        <small>
          {distance != null ? `${Number(distance).toFixed(1)} mi away` : "Distance unavailable"}
          {" · "}<b className={status === "Open" ? "open" : "closed"}>{status}</b>
        </small>
      </div>
      {shop.rating && <div className="business-rating">★ {shop.rating}</div>}
    </article>
  );
};

export default BusinessCard;
