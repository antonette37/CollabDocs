import { describe, expect, it } from "vitest";
import {
  assertCanEdit,
  assertCanView,
  getDocumentAccess,
  normalizeAccessLevel,
} from "../src/lib/permissions";

describe("normalizeAccessLevel", () => {
  it("accepts view and edit", () => {
    expect(normalizeAccessLevel("view")).toBe("view");
    expect(normalizeAccessLevel("edit")).toBe("edit");
  });

  it("rejects unknown values", () => {
    expect(normalizeAccessLevel("admin")).toBeNull();
    expect(normalizeAccessLevel("")).toBeNull();
  });
});

describe("getDocumentAccess", () => {
  it("gives owners full access", () => {
    const access = getDocumentAccess({
      ownerId: "alice",
      currentUserId: "alice",
      share: null,
    });

    expect(access).toEqual({
      canView: true,
      canEdit: true,
      role: "owner",
    });
  });

  it("denies access when there is no share", () => {
    const access = getDocumentAccess({
      ownerId: "alice",
      currentUserId: "bob",
      share: null,
    });

    expect(access).toEqual({
      canView: false,
      canEdit: false,
      role: "none",
    });
  });

  it("allows view-only shared users to read but not edit", () => {
    const access = getDocumentAccess({
      ownerId: "alice",
      currentUserId: "bob",
      share: { accessLevel: "view" },
    });

    expect(access).toEqual({
      canView: true,
      canEdit: false,
      role: "shared",
      accessLevel: "view",
    });
  });

  it("allows edit shared users to read and write", () => {
    const access = getDocumentAccess({
      ownerId: "alice",
      currentUserId: "charlie",
      share: { accessLevel: "edit" },
    });

    expect(access).toEqual({
      canView: true,
      canEdit: true,
      role: "shared",
      accessLevel: "edit",
    });
  });

  it("treats invalid share levels as no access", () => {
    const access = getDocumentAccess({
      ownerId: "alice",
      currentUserId: "bob",
      share: { accessLevel: "owner" },
    });

    expect(access.canView).toBe(false);
    expect(access.canEdit).toBe(false);
  });
});

describe("assert helpers", () => {
  it("throws Unauthorized access when view is denied", () => {
    expect(() =>
      assertCanView({ canView: false, canEdit: false, role: "none" }),
    ).toThrow("Unauthorized access");
  });

  it("throws Unauthorized access when edit is denied", () => {
    expect(() =>
      assertCanEdit({
        canView: true,
        canEdit: false,
        role: "shared",
        accessLevel: "view",
      }),
    ).toThrow("Unauthorized access");
  });

  it("allows owners to edit", () => {
    expect(() =>
      assertCanEdit({ canView: true, canEdit: true, role: "owner" }),
    ).not.toThrow();
  });
});
