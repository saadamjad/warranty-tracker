// In-memory IndexedDB so Dexie-backed code runs under jsdom.
import "fake-indexeddb/auto";
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom's Blob/File don't survive structuredClone (which fake IndexedDB uses); Node's do, like browsers.
globalThis.Blob = NodeBlob as unknown as typeof Blob;
globalThis.File = NodeFile as unknown as typeof File;

// Testing Library only auto-cleans when Vitest globals are enabled; they aren't here.
afterEach(cleanup);

// jsdom has no object URLs; previews only need a stable string.
URL.createObjectURL ??= () => "blob:test";
URL.revokeObjectURL ??= () => {};
