import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getReminderPrefs } from "@/features/warranty/lib/prefs";
import { db } from "@/lib/db";
import { ReminderSettings } from "./ReminderSettings";

describe("ReminderSettings (FR-19)", () => {
  afterEach(() => db.meta.clear());

  it("changes reminder timing and turns off the final reminder", async () => {
    render(<ReminderSettings />);
    fireEvent.change(screen.getByLabelText("Remind me before a return date", { exact: false }), { target: { value: "5" } });
    fireEvent.click(screen.getByLabelText("Also remind me a week before"));
    await waitFor(async () => expect(await getReminderPrefs()).toMatchObject({ returnDaysBefore: 5, finalDaysBefore: null }));
  });

  it("explains when notifications aren't available", () => {
    render(<ReminderSettings />);
    expect(screen.getByText(/can't show notifications/)).toBeDefined();
  });
});
