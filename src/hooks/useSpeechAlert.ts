import { useEffect, useRef, useCallback } from "react";
import { SimEvent } from "@/simulation/types";

// Track globally which event IDs have been spoken to prevent duplicates across re-renders
const spokenEventIds = new Set<string>();

export function useSpeechAlert(events: SimEvent[]) {
  const userInteracted = useRef(false);
  const voicesLoaded = useRef(false);

  // Gate: require user interaction before speaking
  useEffect(() => {
    const handler = () => {
      userInteracted.current = true;
    };
    window.addEventListener("click", handler, { once: false });
    window.addEventListener("keydown", handler, { once: false });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices();
      if (voices && voices.length > 0) voicesLoaded.current = true;
    };
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || !userInteracted.current) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const english = voices.find((v) => v.lang.startsWith("en"));
    if (english) utterance.voice = english;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Watch for new events
  useEffect(() => {
    if (!events.length) return;
    const latest = events[0]; // events are newest-first
    if (!latest || spokenEventIds.has(latest.id)) return;

    spokenEventIds.add(latest.id);

    // Keep set bounded
    if (spokenEventIds.size > 200) {
      const iter = spokenEventIds.values();
      for (let i = 0; i < 100; i++) {
        const v = iter.next().value;
        if (v) spokenEventIds.delete(v);
      }
    }

    if (latest.severity === "critical") {
      speak(`Warning. Issue detected. ${latest.message}`);
    } else if (latest.severity === "warning") {
      speak(`Project is under checking. ${latest.message}`);
    } else if (latest.severity === "info" && latest.type === "order") {
      speak("Project is in progress.");
    }
  }, [events, speak]);
}
