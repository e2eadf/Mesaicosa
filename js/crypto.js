// Chiffrement local (WebCrypto) : PBKDF2-SHA256 → AES-GCM 256 bits.
// Le mot de passe ne quitte jamais l'appareil et n'est jamais enregistré.
const ITER = 250000;
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export const available = () => !!(globalThis.crypto && crypto.subtle);
export const newSalt = () => b64(crypto.getRandomValues(new Uint8Array(16)));

// Identifiant + mot de passe → clé. L'identifiant n'est pas sensible à la casse.
export async function deriveKey(user, pass, saltB64, iter = ITER) {
  const material = await crypto.subtle.importKey('raw', enc.encode(user.trim().toLowerCase() + '\u0000' + pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: iter },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptText(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
  return { iv: b64(iv), ct: b64(ct) };
}

// Lève une erreur si la clé est mauvaise (AES-GCM authentifie le contenu).
export async function decryptText(key, box) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct));
  return dec.decode(pt);
}

export const ITERATIONS = ITER;
