// In-memory IndexedDB so Dexie-backed code runs under jsdom.
import "fake-indexeddb/auto";
import { Blob as NodeBlob } from "node:buffer";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom's Blob doesn't survive structuredClone (which fake IndexedDB uses); Node's does, like browsers.
globalThis.Blob = NodeBlob as unknown as typeof Blob;

// Testing Library only auto-cleans when Vitest globals are enabled; they aren't here.
afterEach(cleanup);
