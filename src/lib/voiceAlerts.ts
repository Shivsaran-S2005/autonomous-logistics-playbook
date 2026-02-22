/**
 * Reliable voice alert system for Supplier Live Event Feed.
 * - Queues all alerts so multiple events in quick succession play in order (no overlap).
 * - Call enableFromUserGesture() from a click to unlock TTS (browser requirement).
 * - New request: "New request received. Product: ..., Category: ..., Type: ..., Quantity: ..., Message: ..."
 * - Resolved: "Issue resolved for Product: ..., Message: ..., Retailer notified"
 */

const MAX_QUEUE_SIZE = 50;
const queue: string[] = [];
let processing = false;
let enabled = false;

function isSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

function ensureVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices(); // can trigger voiceschanged
}

function processQueue(): void {
  if (!isSupported() || processing || queue.length === 0) return;
  processing = true;
  const text = queue.shift()!;
  ensureVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const en = voices.find((v) => v.lang.startsWith("en"));
  if (en) utterance.voice = en;
  utterance.onend = () => {
    processing = false;
    if (queue.length > 0) setTimeout(() => processQueue(), 150);
  };
  utterance.onerror = () => {
    processing = false;
    if (queue.length > 0) setTimeout(() => processQueue(), 150);
  };
  window.speechSynthesis.speak(utterance);
}

/**
 * Call from a user gesture (e.g. "Enable voice" button or first "Resolve Issue" click).
 * Enables future voice alerts and optionally speaks a test phrase.
 * Processes any already-queued messages so alerts are not missed.
 */
export function enableFromUserGesture(testPhrase?: string): void {
  if (!isSupported()) return;
  enabled = true;
  if (testPhrase) queue.push(testPhrase.trim());
  processQueue();
}

export function isVoiceEnabled(): boolean {
  return enabled && isSupported();
}

/**
 * Queue a phrase. Plays in order; no overlapping. Triggers for every new request and every resolve.
 */
export function speak(phrase: string): void {
  if (!phrase?.trim() || !isSupported()) return;
  const trimmed = phrase.trim();
  if (queue.length >= MAX_QUEUE_SIZE) queue.shift();
  queue.push(trimmed);
  if (enabled && !processing) processQueue();
}

/**
 * Speak immediately (used from supplier action click). Does not clear queue:
 * current utterance is cancelled but queued items still play after this one.
 */
export function speakNow(phrase: string): void {
  if (!phrase?.trim() || !isSupported()) return;
  enabled = true;
  if (window.speechSynthesis.cancel) window.speechSynthesis.cancel();
  ensureVoices();
  const utterance = new SpeechSynthesisUtterance(phrase.trim());
  utterance.rate = 1;
  const voices = window.speechSynthesis.getVoices();
  const en = voices.find((v) => v.lang.startsWith("en"));
  if (en) utterance.voice = en;
  utterance.onend = () => {
    processing = false;
    if (queue.length > 0) setTimeout(() => processQueue(), 150);
  };
  utterance.onerror = () => {
    processing = false;
    if (queue.length > 0) setTimeout(() => processQueue(), 150);
  };
  processing = true;
  window.speechSynthesis.speak(utterance);
}

/**
 * Queue new-request alert. Call when a new Pending request is detected.
 */
export function speakNewRequest(productName: string, retailerName: string): void {
  speak(`New request received for ${productName} from ${retailerName}.`);
}

/**
 * New issue alert: "New issue received. Product: [X], Category: [Y], Type: [Z], Quantity: [N], Message: [M]"
 */
export function speakNewIssue(
  productName: string,
  category: string,
  type: string,
  quantity: string | number,
  message: string
): void {
  const q = quantity === "" || quantity == null ? "—" : String(quantity);
  speak(
    `New issue received. Product: ${productName}, Category: ${category}, Type: ${type}, Quantity: ${q}, Message: ${message}`
  );
}

/**
 * New request alert for supplier live feed: "New request received. Product: [X], Category: [Y], Type: [Z], Quantity: [N], Message: [M]"
 */
export function speakNewRequestWithDetails(
  productName: string,
  category: string,
  type: string,
  quantity: string | number,
  message: string
): void {
  const q = quantity === "" || quantity == null ? "—" : String(quantity);
  speak(
    `New request received. Product: ${productName}, Category: ${category}, Type: ${type}, Quantity: ${q}, Message: ${message}`
  );
}

/**
 * Retailer-side: "Your issue was resolved. Product: [X], Message: [M]."
 * Call when retailer dashboard detects a request moved to Resolved (e.g. from supplier).
 */
export function speakRetailerResolved(productName: string, message: string): void {
  speak(`Your issue was resolved. Product: ${productName}. Message: ${message}.`);
}

/**
 * Resolve alert: "Issue resolved for Product: [X], Message: [M], Retailer notified"
 * Always queued so alerts never overlap; plays after any current or queued new-request alerts.
 */
export function speakResolvedForProductAndMessage(
  productName: string,
  message: string,
  fromUserClick = false
): void {
  const phrase = `Issue resolved for Product: ${productName}, Message: ${message}, Retailer notified`;
  if (fromUserClick) enableFromUserGesture();
  speak(phrase);
}

/**
 * Queue or speak resolve alert (legacy: product + retailer name).
 */
export function speakResolved(productName: string, retailerName: string, fromUserClick = false): void {
  const phrase = `Issue resolved for ${productName}, ${retailerName} notified.`;
  if (fromUserClick) {
    speakNow(phrase);
  } else {
    speak(phrase);
  }
}

/**
 * New error alert for live feed: reads error details.
 */
export function speakNewError(details: string): void {
  speak(`New error. ${details}`);
}

/**
 * Error resolved / actioned: reads resolution.
 */
export function speakErrorResolved(details: string, fromUserClick = false): void {
  const phrase = `Error resolved. ${details}`;
  if (fromUserClick) {
    speakNow(phrase);
  } else {
    speak(phrase);
  }
}
