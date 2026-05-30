"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the component has mounted on the client. Used to avoid
 * hydration mismatches when rendering values from persisted (localStorage) stores.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
