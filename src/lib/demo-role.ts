"use client";

import { useSyncExternalStore } from "react";

export type DemoRole = "collaborator" | "editor" | "admin";
const KEY = "facto_demo_role";
const EVENT = "facto:role-changed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function getSnapshot(): DemoRole {
  return (window.localStorage.getItem(KEY) as DemoRole | null) ?? "collaborator";
}

export function useDemoRole() {
  const role = useSyncExternalStore<DemoRole>(subscribe, getSnapshot, () => "collaborator");
  function setRole(next: DemoRole) {
    window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  }
  return { role, setRole };
}

export const roleLabels: Record<DemoRole, string> = {
  collaborator: "Colaboradora",
  editor: "Editora",
  admin: "Administradora",
};
