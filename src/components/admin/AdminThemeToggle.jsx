const AdminThemeToggle = ({ theme, onToggle, sidebar = false }) => (
  <button className={`admin-theme-toggle${sidebar ? " admin-theme-toggle--sidebar" : ""}`} onClick={onToggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
    <svg className={theme === "dark" ? "active" : ""} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </svg>
    <svg className={theme === "light" ? "active" : ""} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5a8.5 8.5 0 1 0 11.7 11.7Z" />
    </svg>
    {sidebar && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
  </button>
);

export default AdminThemeToggle;
