"use client";
import { useEffect } from "react";
import { startApp } from "@/client/engine";
import type { ClientState } from "@/lib/state";

type BootUser = { id: string; email: string; username: string; name: string } | null;

/** Starts the interactive app on top of the server-rendered shell, with server-loaded state. */
export default function Boot({ state, user }: { state: ClientState | null; user: BootUser }) {
  useEffect(() => {
    startApp({ state, user });
  }, [state, user]);
  return null;
}
