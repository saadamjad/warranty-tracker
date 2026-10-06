import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignInForm } from "./SignInForm";

describe("SignInForm", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("explains a refused email without technical words", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json(url.includes("csrf") ? { csrfToken: "t" } : {})));
    render(<SignInForm error="Configuration" />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/wait 10 minutes/);
  });

  it("explains a refused connection in plain words", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json(url.includes("csrf") ? { csrfToken: "t" } : {})));
    render(<SignInForm error="TooMany" />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/wait an hour/);
  });

  it("says sign-in needs a connection when offline", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    render(<SignInForm />);
    expect(await screen.findByText(/needs an internet connection/)).toBeDefined();
  });
});
