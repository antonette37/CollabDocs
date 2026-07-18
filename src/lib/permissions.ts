export type AccessLevel = "view" | "edit";

export type DocumentAccess =
  | { canView: false; canEdit: false; role: "none" }
  | { canView: true; canEdit: true; role: "owner" }
  | { canView: true; canEdit: boolean; role: "shared"; accessLevel: AccessLevel };

export type DocumentPermissionInput = {
  ownerId: string;
  currentUserId: string;
  share?: { accessLevel: string } | null;
};

export function normalizeAccessLevel(value: string): AccessLevel | null {
  if (value === "view" || value === "edit") {
    return value;
  }
  return null;
}

export function getDocumentAccess(
  input: DocumentPermissionInput,
): DocumentAccess {
  const { ownerId, currentUserId, share } = input;

  if (ownerId === currentUserId) {
    return { canView: true, canEdit: true, role: "owner" };
  }

  if (!share) {
    return { canView: false, canEdit: false, role: "none" };
  }

  const accessLevel = normalizeAccessLevel(share.accessLevel);
  if (!accessLevel) {
    return { canView: false, canEdit: false, role: "none" };
  }

  return {
    canView: true,
    canEdit: accessLevel === "edit",
    role: "shared",
    accessLevel,
  };
}

export function assertCanView(access: DocumentAccess): void {
  if (!access.canView) {
    throw new Error("Unauthorized access");
  }
}

export function assertCanEdit(access: DocumentAccess): void {
  if (!access.canEdit) {
    throw new Error("Unauthorized access");
  }
}
