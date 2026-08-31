import { Link } from "react-router-dom";
import MaterialIcon from "./MaterialIcon";

const getMapUrl = (business) => {
  const destination = business.lat && business.lng
    ? `${business.lat},${business.lng}`
    : business.address || business.business_address || business.name;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination || "")}`;
};

const BusinessDetailExtras = ({ business }) => {
  const services = Array.isArray(business.services) ? business.services.filter(Boolean) : [];
  const mapUrl = business.location_link || getMapUrl(business);
  const reviewsLink = business.reviews_link;
  const claimQuery = new URLSearchParams({
    pharmacyId: business._id || "",
    businessName: business.name || business.business_name || "",
    address: business.address || business.business_address || "",
  });

  return (
    <>
      {services.length > 0 && <section className="detail-extra-section"><h2>Products/Services Offered</h2><div className="service-chips">{services.map((service) => <span key={service}>{service}</span>)}</div></section>}
      <a className="directions-card" href={mapUrl} target="_blank" rel="noreferrer"><strong>Directions</strong><span><MaterialIcon name="location-pin" size={18} />Go To Map</span></a>
      <a className="map-preview" href={mapUrl} target="_blank" rel="noreferrer" aria-label="Open directions in Google Maps"><span><MaterialIcon name="location-pin" size={34} /></span></a>
      {reviewsLink && <section className="detail-extra-section reviews-section"><h2>Reviews</h2><p>More reviews are available on Google.</p><a href={reviewsLink} target="_blank" rel="noreferrer">See all reviews →</a></section>}
      <footer className="claim-footer">
        {business.claimed
          ? <div><MaterialIcon name="verified" size={20} />Already Claimed</div>
          : <Link to={`/claim-business?${claimQuery}`}>Claim This Business</Link>}
      </footer>
    </>
  );
};

export default BusinessDetailExtras;
