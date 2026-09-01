import { useState } from "react";
import { ChevronRight } from "lucide-react";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const parseDay = (value) => {
  if (!value || String(value).toLowerCase().includes("closed")) return { closed: true, open24Hours: false, open: "09:00", close: "17:00" };
  if (String(value).toLowerCase().includes("24")) return { closed: false, open24Hours: true, open: "09:00", close: "17:00" };
  const match = String(value).match(/(\d+)(?::(\d+))?\s*(a\.?m\.?|p\.?m\.?)?\s*-\s*(\d+)(?::(\d+))?\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!match) return { closed: true, open24Hours: false, open: "09:00", close: "17:00" };
  const to24Hour = (hour, minute, period) => {
    let hours = Number(hour);
    const normalizedPeriod = period?.toLowerCase().replace(/\./g, "");
    if (normalizedPeriod === "pm" && hours !== 12) hours += 12;
    if (normalizedPeriod === "am" && hours === 12) hours = 0;
    if (!normalizedPeriod && hours < 8) hours += 12;
    return `${String(hours).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
  };
  return { closed: false, open24Hours: false, open: to24Hour(match[1], match[2], match[3]), close: to24Hour(match[4], match[5], match[6]) };
};

const serializeDay = ({ closed, open24Hours, open, close }) => closed ? "Closed" : open24Hours ? "Open 24 hours" : `${open}-${close}`;
const getDayValue = (hours, day) => {
  const key = Object.keys(hours || {}).find((item) => item.toLowerCase() === day.toLowerCase());
  return key ? hours[key] : null;
};
const formatTime = (value) => {
  const [hourValue, minute] = value.split(":").map(Number);
  return `${hourValue % 12 || 12}:${String(minute).padStart(2, "0")} ${hourValue >= 12 ? "PM" : "AM"}`;
};

const OperatingHoursEditor = ({ value = {}, onChange }) => {
  const [editingDay, setEditingDay] = useState(null);
  const updateDay = (day, updates) => onChange({ ...value, [day]: serializeDay({ ...parseDay(getDayValue(value, day)), ...updates }) });

  return <div className="operating-hours-editor"><div className="operating-hours-list">{WEEKDAYS.map((day) => {
    const schedule = parseDay(getDayValue(value, day));
    return <div className={`operating-hours-row${schedule.closed ? " is-closed" : ""}${editingDay === day ? " is-editing" : ""}`} key={day}>
      <button className="hours-row-summary" type="button" onClick={() => !schedule.closed && setEditingDay(editingDay === day ? null : day)}>
        <strong>{day.slice(0, 3)}</strong><span>{schedule.closed ? "Closed" : schedule.open24Hours ? "Open 24 hours" : `${formatTime(schedule.open)} – ${formatTime(schedule.close)}`}</span>{!schedule.closed && <ChevronRight className="hours-chevron" size={21} />}
      </button>
      <button className={`hours-switch${schedule.closed ? "" : " active"}`} type="button" role="switch" aria-label={`${schedule.closed ? "Open" : "Close"} ${day}`} aria-checked={!schedule.closed} onClick={() => { updateDay(day, { closed: !schedule.closed, open24Hours: false }); if (!schedule.closed) setEditingDay(null); }}><i /></button>
      {!schedule.closed && <div className="operating-hours-window"><label><small>Opens</small><input aria-label={`${day} opening time`} type="time" value={schedule.open} onChange={(event) => updateDay(day, { open: event.target.value })} /></label><span className="hours-divider">to</span><label><small>Closes</small><input aria-label={`${day} closing time`} type="time" value={schedule.close} onChange={(event) => updateDay(day, { close: event.target.value })} /></label><button className={`hours-all-day-toggle${schedule.open24Hours ? " active" : ""}`} type="button" onClick={() => updateDay(day, { open24Hours: !schedule.open24Hours })}>24 hours</button></div>}
    </div>;
  })}</div></div>;
};

export default OperatingHoursEditor;
