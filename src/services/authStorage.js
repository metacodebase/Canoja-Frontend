import {
  getActiveBusinessId,
  removeActiveBusinessId,
  removeRefreshToken,
  removeToken,
  setActiveBusinessId,
  setRefreshToken,
  setToken,
} from "./api";

const USER_KEY = "canojaUser";

export const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const persistSession = (token, user, refreshToken) => {
  setToken(token);
  if (refreshToken) setRefreshToken(refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const persistUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const selectInitialBusiness = (businesses = []) => {
  const storedId = getActiveBusinessId();
  const nextId = businesses.some(({ _id }) => _id === storedId)
    ? storedId
    : businesses.length === 1 ? businesses[0]._id : null;
  setActiveBusinessId(nextId);
  return nextId;
};

export const clearSession = () => {
  removeToken();
  removeRefreshToken();
  removeActiveBusinessId();
  localStorage.removeItem(USER_KEY);
};
