// BUILDFEST DEMO BUILD -- purely cosmetic, client-side login gate.
// No backend involved: credentials are hardcoded here, and "logged in"
// is just a flag in localStorage. This is NOT real security -- anyone
// can open devtools and flip the flag, or read the password straight out
// of this file. Fine for a demo where the only goal is "don't show the
// dashboard to someone who just stumbled onto the URL"; do not reuse
// this pattern for anything that needs actual protection.

const DEMO_PHONE = "08111111111";
const DEMO_PASSWORD = "buildfest@2026";
const STORAGE_KEY = "demo_logged_in";

export function checkCredentials(phone, password) {
  return phone.trim() === DEMO_PHONE && password === DEMO_PASSWORD;
}

export function login() {
  localStorage.setItem(STORAGE_KEY, "true");
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}
