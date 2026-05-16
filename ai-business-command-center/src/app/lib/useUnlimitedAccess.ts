import { useEffect, useState } from "react";

import { auth } from "./apiClient";
import type { Mode } from "../AppContext";

type UnlimitedAccessState = {
  loading: boolean;
  unlimited: boolean;
  role: "user" | "admin" | "owner" | null;
};

export function useUnlimitedAccess(mode: Mode): UnlimitedAccessState {
  const [state, setState] = useState<UnlimitedAccessState>({
    loading: mode === "live",
    unlimited: false,
    role: null,
  });

  useEffect(() => {
    if (mode !== "live") {
      setState({
        loading: false,
        unlimited: false,
        role: null,
      });

      return;
    }

    let cancelled = false;

    setState((current) => ({
      ...current,
      loading: true,
    }));

    void auth
      .me()
      .then(({ user }) => {
        if (cancelled) {
          return;
        }

        const unlimited = user.role === "owner" || user.role === "admin";

        setState({
          loading: false,
          unlimited,
          role: user.role,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          unlimited: false,
          role: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  return state;
}
