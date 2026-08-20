export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
};

export const VALID_ROLES = [ROLES.ADMIN, ROLES.USER];

export const ROLE_LABELS = {
  ADMIN: "Admin",
  USER: "User",
};

export const HOME_PATH = "/";

export function homePathForRole() {
  return HOME_PATH;
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}

function matchesPath(pathname, prefixes) {
  return prefixes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

const ADMIN_ONLY_PAGES = ["/settings", "/strategy", "/users"];
const ADMIN_ONLY_APIS = ["/api/users", "/api/target-matrix", "/api/logs/seed"];

export function canAccessPage(role, pathname) {
  if (!role) return false;
  if (pathname === "/login") return true;
  if (role === ROLES.ADMIN) return true;
  if (role === ROLES.USER) {
    return !matchesPath(pathname, ADMIN_ONLY_PAGES);
  }
  return false;
}

export function canAccessApi(role, pathname, method = "GET") {
  if (!role) return false;
  if (matchesPath(pathname, ["/api/auth"])) return true;
  if (role === ROLES.ADMIN) return true;

  if (role === ROLES.USER) {
    if (matchesPath(pathname, ADMIN_ONLY_APIS)) return false;
    if (matchesPath(pathname, ["/api/config"]) && method !== "GET") {
      return false;
    }
    return true;
  }

  return false;
}

export function safeNextPathForRole(role, nextPath) {
  const home = homePathForRole(role);
  if (!nextPath || !canAccessPage(role, nextPath)) return home;
  return nextPath;
}
