export const rolePermissions = {
  owner: ["read", "comment", "edit", "share", "admin", "billing"],
  editor: ["read", "comment", "edit", "share"],
  commenter: ["read", "comment"],
  viewer: ["read"],
  guest: ["read"]
};

export function can(role, permission) {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getRoleLabel(role) {
  const labels = {
    owner: "Owner",
    editor: "Editor",
    commenter: "Commenter",
    viewer: "Viewer",
    guest: "Guest"
  };

  return labels[role] ?? "Viewer";
}

export function createShareToken(fileId, role) {
  return `${fileId}.${role}.${Math.random().toString(36).slice(2, 10)}`;
}
