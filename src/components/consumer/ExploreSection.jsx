import { useEffect, useRef, useState } from "react";
import BusinessCard from "./BusinessCard";

const ExploreSection = ({ title, shops, spotlight = false, emptyText, loading, onSeeAll }) => {
  const listRef = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!spotlight || shops.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      const list = listRef.current;
      if (!list) return;
      const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 8;
      list.scrollTo({ left: atEnd ? 0 : list.scrollLeft + list.clientWidth * 0.72, behavior: "smooth" });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [paused, shops.length, spotlight]);

  return (
    <section className={`consumer-section${spotlight ? " spotlight-section" : ""}`}>
      <div className="section-heading">
        <h2>{title}</h2>
        {onSeeAll && <button aria-label={`See all ${title}`} onClick={onSeeAll}>›</button>}
      </div>
      {loading ? (
        <div className="consumer-state">Finding operators near you…</div>
      ) : shops.length ? (
        <div
          ref={listRef}
          className={spotlight ? "spotlight-list" : "business-list"}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}>
          {shops.map((shop, index) => <BusinessCard key={shop._id || shop.place_id || index} shop={shop} spotlight={spotlight} />)}
        </div>
      ) : (
        <div className="consumer-state">{emptyText}</div>
      )}
    </section>
  );
};

export default ExploreSection;
