const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const parseHours = (hours) => {
  if (!hours) return null;
  if (typeof hours === "string") {
    try { return JSON.parse(hours); } catch { return null; }
  }
  return hours;
};

const getDayValue = (hours, day) => {
  const key = Object.keys(hours).find((item) => item.toLowerCase() === day.toLowerCase());
  const value = key ? hours[key] : null;
  if (!value) return "Closed";
  if (typeof value === "string") return value;
  if (value.is24Hours || value.open24Hours) return "24 hours";
  if (value.closed || value.isClosed) return "Closed";
  return value.label || value.formatted || `${value.open || value.opening || ""}${value.close || value.closing ? ` – ${value.close || value.closing}` : ""}` || "Closed";
};

const BusinessHours = ({ value }) => {
  const hours = parseHours(value);
  if (!hours || !Object.keys(hours).length) return null;
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());

  return (
    <section className="detail-hours">
      <h2>Hours of Operation</h2>
      <div className="hours-list">
        {DAYS.map((day) => <div key={day} className={day === today ? "today" : ""}><strong>{day}{day === today ? " (Today)" : ""}</strong><span>{getDayValue(hours, day)}</span></div>)}
      </div>
    </section>
  );
};

export default BusinessHours;
