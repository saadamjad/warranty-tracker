import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { useLiveQuery } from "./useLiveQuery";

function Count() {
  const result = useLiveQuery(() => db.meta.count(), []);
  return <p>{result.status === "ready" ? `count ${result.value}` : result.status}</p>;
}

describe("useLiveQuery", () => {
  afterEach(() => db.meta.clear());

  it("renders loading, then updates when data changes", async () => {
    render(<Count />);
    expect(screen.getByText("loading")).toBeDefined();
    expect(await screen.findByText("count 0")).toBeDefined();
    await act(() => db.meta.put({ key: "k", value: 1 }));
    expect(await screen.findByText("count 1")).toBeDefined();
  });
});
