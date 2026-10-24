"use client";

import { useEffect, useState, useCallback } from "react";
import type { StoredUser } from "@/types/user";
import { useUserProfile } from "@/hooks/user/useUserProfile";
import { normalizeClassLevel } from "@/lib/teacher/class-level";

function readLocalStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const storedUser = localStorage.getItem("exboard_user");
  if (!storedUser || storedUser === "undefined" || storedUser === "null") {
    return null;
  }

  try {
    const parsed = JSON.parse(storedUser) as StoredUser;
    if (parsed) {
      parsed.class = normalizeClassLevel(parsed.class) || parsed.class || "XII";
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useStoredUser() {
  const [user, setUser] = useState<StoredUser | null>(() => readLocalStoredUser());
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Initial hydration & storage event listeners
  const syncFromStorage = useCallback(() => {
    const current = readLocalStoredUser();
    setUser(current);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    syncFromStorage();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "exboard_user" || e.key === null) {
        syncFromStorage();
      }
    };

    const handleAuthChanged = () => {
      syncFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("exboard_auth_changed", handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("exboard_auth_changed", handleAuthChanged);
    };
  }, [syncFromStorage]);

  // 2. Automatically sync live profile from server to keep class/stream/avatar up to date
  const profileQuery = useUserProfile();

  useEffect(() => {
    if (!profileQuery.data) return;
    const profile = profileQuery.data;

    setUser((prev) => {
      const normalizedClass =
        normalizeClassLevel(profile.class) || profile.class || prev?.class || "XII";
      const merged: StoredUser = {
        ...(prev ?? {}),
        id: profile.id ?? prev?.id ?? "",
        name: profile.name ?? prev?.name ?? "Student",
        email: profile.email ?? prev?.email ?? "",
        role: (profile.role as StoredUser["role"]) ?? prev?.role ?? ("student" as StoredUser["role"]),
        class: normalizedClass,
        board: profile.board ?? prev?.board,
        stream: profile.stream ?? prev?.stream,
        schoolName: profile.schoolName ?? prev?.schoolName,
        points: profile.points ?? prev?.points ?? 0,
        city: profile.city ?? prev?.city,
        profileImage: profile.profileImage ?? prev?.profileImage,
        username: profile.username ?? prev?.username,
        phone: profile.phone ?? prev?.phone,
        address: profile.address ?? prev?.address,
        studentCount: profile.studentCount ?? prev?.studentCount,
        isVerified: (profile as { isVerified?: boolean }).isVerified ?? prev?.isVerified ?? true,
      };

      try {
        localStorage.setItem("exboard_user", JSON.stringify(merged));
      } catch {
        // Ignore persistence errors
      }

      return merged;
    });
  }, [profileQuery.data]);

  // If user is already loaded from localStorage, isReady is true immediately upon hydration.
  // If localStorage was empty, isReady waits until the live server profile query has either succeeded or finished loading.
  const isReady = isHydrated && (Boolean(user) || !profileQuery.isLoading);

  return { user, isReady, isLoading: !isReady };
}
