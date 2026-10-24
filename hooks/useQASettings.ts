"use client";

import { useState, useEffect } from "react";

export interface QASettings {
  enabled_questions: boolean;
  enabled_nova: boolean;
  enabled_teacher_paper: boolean;
}

const DEFAULT_SETTINGS: QASettings = {
  enabled_questions: true,
  enabled_nova: true,
  enabled_teacher_paper: true,
};

let cachedSettings: QASettings = { ...DEFAULT_SETTINGS };
let hasFetched = false;
const listeners = new Set<(s: QASettings) => void>();

export function updateLocalQASettings(newSettings: QASettings) {
  cachedSettings = { ...newSettings };
  listeners.forEach((listener) => listener(cachedSettings));
}

export function useQASettings() {
  const [settings, setSettings] = useState<QASettings>(cachedSettings);
  const [loading, setLoading] = useState(!hasFetched);

  useEffect(() => {
    listeners.add(setSettings);

    if (!hasFetched) {
      fetch("/api/qa/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data?.settings) {
            cachedSettings = data.settings;
            hasFetched = true;
            updateLocalQASettings(data.settings);
          }
        })
        .catch(() => {
          // ignore error, keep defaults
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  return { settings, loading, refetch: () => {
    hasFetched = false;
    fetch("/api/qa/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          updateLocalQASettings(data.settings);
        }
      });
  }};
}
