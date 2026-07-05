export const adminTokenKey = "token";
export const adminUserKey = "user";

export const getStoredAdminUser = () => {
  try {
    return JSON.parse(localStorage.getItem(adminUserKey) || "null");
  } catch {
    return null;
  }
};

export const isAdminUser = (user) => {
  if (!user || typeof user !== "object") return false;

  return Boolean(user.isAdmin || user.isadmin);
};

export const isAdminAuthenticated = () => {
  const token = localStorage.getItem(adminTokenKey);
  const user = getStoredAdminUser();

  return Boolean(token) && isAdminUser(user);
};

export const setAdminSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(adminTokenKey, token);
  }

  if (user) {
    localStorage.setItem(adminUserKey, JSON.stringify(user));
  }
};

export const clearAdminSession = () => {
  localStorage.removeItem(adminTokenKey);
  localStorage.removeItem(adminUserKey);
};