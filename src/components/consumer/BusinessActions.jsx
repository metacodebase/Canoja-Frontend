import MaterialIcon from "./MaterialIcon";

const BusinessActions = ({ business }) => {
  const phone = business.phone || business.formatted_phone_number || business.contact_information?.phone;
  const email = business.email || business.contact_information?.email;
  const website = business.website || business.contact_information?.website;
  const menu = business.menu || business.menu_link;
  const websiteHref = website && (/^https?:\/\//i.test(website) ? website : `https://${website}`);

  return (
    <>
      <div className="business-contacts">
        <div><MaterialIcon name="phone" size={16} />{phone ? <a href={`tel:${phone}`}>{phone}</a> : <span>phone not available</span>}</div>
        <div><MaterialIcon name="email" size={16} />{email ? <a href={`mailto:${email}`}>{email}</a> : <span>email not available</span>}</div>
        <div><MaterialIcon name="language" size={16} />{website ? <a href={websiteHref} target="_blank" rel="noreferrer">{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a> : <span>website not available</span>}</div>
      </div>
      {menu && <a className="view-menu" href={menu} target="_blank" rel="noreferrer"><MaterialIcon name="menu" size={19} />View Menu</a>}
    </>
  );
};

export default BusinessActions;
