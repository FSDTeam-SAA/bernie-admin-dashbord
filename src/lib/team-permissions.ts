export const ALL_ACCESS_PERMISSION = "All Access";

export const TEAM_ROUTE_PERMISSIONS = [
  { name: "Dashboard Overview", href: "/", permission: "Dashboard Overview" },
  {
    name: "User Management",
    href: "/user-management",
    permission: "User Management",
  },
  {
    name: "Journey Management",
    href: "/journey-management",
    permission: "Journey Management",
  },
  {
    name: "Category Management",
    href: "/category-management",
    permission: "Category Management",
  },
  {
    name: "Token Management",
    href: "/token-management",
    permission: "Token Management",
  },
  { name: "Set Prizes", href: "/set-prizes", permission: "Set Prizes" },
  {
    name: "Transaction Management",
    href: "/transaction-management",
    permission: "Transaction Management",
  },
  {
    name: "Subscription Management",
    href: "/subscription-management",
    permission: "Subscription Management",
  },
  {
    name: "Membership Management",
    href: "/membership-management",
    permission: "Membership Management",
  },
  {
    name: "Insurance Listing",
    href: "/insurance-listing",
    permission: "Insurance Listing",
  },
  { name: "Settings", href: "/settings", permission: "Settings" },
] as const;

export const ASSIGNABLE_TEAM_PERMISSIONS = TEAM_ROUTE_PERMISSIONS.map(
  (route) => route.permission,
);

export type TeamPermission = (typeof ASSIGNABLE_TEAM_PERMISSIONS)[number];

export function hasAllAccess(permissions?: string[] | null) {
  return Boolean(permissions?.includes(ALL_ACCESS_PERMISSION));
}

export function canAccessPermission(
  permissions: string[] | null | undefined,
  permission: string,
) {
  return hasAllAccess(permissions) || Boolean(permissions?.includes(permission));
}

export function getRequiredPermissionForPath(pathname: string) {
  const sortedRoutes = [...TEAM_ROUTE_PERMISSIONS].sort(
    (left, right) => right.href.length - left.href.length,
  );

  return sortedRoutes.find((route) => {
    if (route.href === "/") return pathname === "/";
    return pathname === route.href || pathname.startsWith(`${route.href}/`);
  })?.permission;
}

export function getFirstAllowedRoute(permissions?: string[] | null) {
  if (hasAllAccess(permissions)) return "/";

  return (
    TEAM_ROUTE_PERMISSIONS.find((route) =>
      permissions?.includes(route.permission),
    )?.href || null
  );
}
