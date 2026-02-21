import { useEffect, useRef, useCallback } from "react";

export function useManualModeAlert(isLocked: boolean, isManualMode: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Repeat alert every 10 seconds when locked in MANUAL_MODE
  useEffect(() => {
    if (isLocked && isManualMode) {
      const message = "Critical issue detected. Please resolve manually.";
      speak(message);
      intervalRef.current = setInterval(() => speak(message), 10000);
    } else {
      // Stop speaking when unlocked or not in manual mode
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.speechSynthesis?.cancel();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.speechSynthesis?.cancel();
    };
  }, [isLocked, isManualMode, speak]);
}
