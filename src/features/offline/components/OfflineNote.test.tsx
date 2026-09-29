import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackupStatus } from "@/features/sync/components/BackupStatus";
import { OfflineNote } from "./OfflineNote";

describe("OfflineNote", () => {
  afterEach(() => vi.restoreAllMocks());

  it("appears calmly when the connection drops and goes away when it returns", () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    render(<OfflineNote />);
    expect(screen.queryByText(/You're offline/)).toBeNull();

    online.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByText(/Everything still works and saves on this device/)).toBeDefined();

    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.queryByText(/You're offline/)).toBeNull();
  });
});

describe("BackupStatus (AC-13)", () => {
  it("says the purchase is saved on this device before any backup exists", () => {
    render(<BackupStatus />);
    expect(screen.getByRole("status").textContent).toContain("Saved on this device");
  });
});
