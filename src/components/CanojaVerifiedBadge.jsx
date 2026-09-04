import canojaVerifiedBadge from "../assets/canoja-verified-badge.png";

export default function CanojaVerifiedBadge({ size = 54, className = "", style = {} }) {
  return (
    <img
      className={className}
      src={canojaVerifiedBadge}
      alt="Canoja Verified"
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, ...style }}
    />
  );
}
