import { useSyncExternalStore } from "react";

const STORAGE_KEY = "exhibit-a:connected-repos";
const CHANGE_EVENT = "exhibit-a:connected-repos-changed";

function read(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function decode(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/** Repos the visitor connected, kept in this browser only: the site has no backend. */
export function useConnectedRepos(): readonly string[] {
  return decode(useSyncExternalStore(subscribe, read, () => "[]"));
}

export function saveConnectedRepos(repos: readonly string[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(repos)]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
