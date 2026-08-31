import { useEffect, useState } from "react";

const getSavedTheme = () => localStorage.getItem("canoja-theme") || "dark";

const useAdminTheme = () => {
  const [theme, setTheme] = useState(getSavedTheme);

  useEffect(() => {
    localStorage.setItem("canoja-theme", theme);
    localStorage.removeItem("canoja-login-theme");
    document.body.classList.toggle("canoja-admin-dark", theme === "dark");
    return () => document.body.classList.remove("canoja-admin-dark");
  }, [theme]);

  return { theme, toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark") };
};

export default useAdminTheme;
