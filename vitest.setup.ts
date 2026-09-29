// In-memory IndexedDB so Dexie-backed code runs under jsdom.
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only auto-cleans when Vitest globals are enabled; they aren't here.
afterEach(cleanup);
