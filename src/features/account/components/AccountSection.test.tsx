import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { setAccount, setSyncStatus } from "@/features/sync/lib/state";
import { db } from "@/lib/db";
import { AccountSection } from "./AccountSection";

describe("AccountSection", () => {
  afterEach(() => db.meta.clear());

  it("explains device-only storage and offers backup (EC-22)", async () => {
    render(<AccountSection />);
    expect(await screen.findByText(/won't come with you unless you turn on backup/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Turn on backup" }).getAttribute("href")).toBe("/signin");
  });

  it("shows who backup goes to", async () => {
    await setAccount({ id: "u1", email: "a@example.com" });
    render(<AccountSection />);
    expect(await screen.findByText("Backing up to a@example.com")).toBeDefined();
    expect(screen.getByRole("button", { name: "Back up now" })).toBeDefined();
  });

  it("asks to sign in again when the session expired, reassuring data is safe", async () => {
    await setAccount({ id: "u1", email: "a@example.com" });
    await setSyncStatus({ phase: "signed-out" });
    render(<AccountSection />);
    expect(await screen.findByText(/safe on this device/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Sign in again" })).toBeDefined();
  });
});
