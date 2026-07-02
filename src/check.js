export const DEFAULT_ENDPOINT = "cos.ap-shenzhen-fsi.myqcloud.com";
export const DEFAULT_TIMEOUT_MS = 6000;
export const DEFAULT_PROBE_METHOD = "GET";
export const DEFAULT_PROBE_PROTOCOL = "http";

export const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function envValue(env, name) {
  if (env && env[name]) return env[name];
  if (typeof process !== "undefined" && process.env && process.env[name]) return process.env[name];
  return undefined;
}

export function getEndpoint(env = {}) {
  return envValue(env, "ENDPOINT") || DEFAULT_ENDPOINT;
}

export function getProbeMethod(env = {}) {
  return String(envValue(env, "PROBE_METHOD") || DEFAULT_PROBE_METHOD).toUpperCase();
}

export function getProbeProtocol(env = {}) {
  const protocol = String(envValue(env, "PROBE_PROTOCOL") || DEFAULT_PROBE_PROTOCOL).toLowerCase().replace(/:$/, "");
  return protocol === "https" ? "https" : "http";
}

export function cleanDomain(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

export function validateDomain(domain) {
  if (!domain) return "Enter a domain name.";
  if (domain.length > 253) return "Domain name is too long.";
  if (domain.includes(":")) return "Enter a domain name without a port.";
  if (!/^[a-z0-9.-]+$/.test(domain)) return "Use letters, numbers, dots, and hyphens only.";
  if (!domain.includes(".")) return "Enter a full domain name.";
  if (domain.split(".").some((part) => !part || part.length > 63)) return "Check the dots in the domain name.";
  if (domain.split(".").some((part) => part.startsWith("-") || part.endsWith("-"))) return "Domain labels cannot start or end with a hyphen.";
  return "";
}

export function verdictFromStatus(status) {
  if (status === 400 || status === 404) {
    return { result: "not_likely_blocked", label: "Not likely blocked in China", summary: "The endpoint returned a normal rejection for this host." };
  }
  if (status === 418 || status === "ERR") {
    return { result: "likely_blocked", label: "Likely blocked in China", summary: "The endpoint returned the blocked signal for this host." };
  }
  return { result: "unknown", label: "Needs another look", summary: "The endpoint returned an unexpected result." };
}

export async function checkWithFetch({ domain, endpoint, timeoutMs, method, protocol }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${protocol}://${endpoint}/`, {
      method,
      headers: { Host: domain },
      redirect: "follow",
      signal: controller.signal,
    });
    return { status: response.status, error: null };
  } catch (error) {
    return { status: "ERR", error: error?.name === "AbortError" ? "Timed out" : "Request failed" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkDomain(domain, env = {}, runner = checkWithFetch) {
  const endpoint = getEndpoint(env);
  const timeoutMs = Number(envValue(env, "TIMEOUT_MS") || DEFAULT_TIMEOUT_MS);
  const method = getProbeMethod(env);
  const protocol = getProbeProtocol(env);
  const checkedAt = new Date().toISOString();
  const clean = cleanDomain(domain);
  const validationError = validateDomain(clean);
  if (validationError) return { ok: false, error: validationError, domain: clean, endpoint, checkedAt };
  const probe = await runner({ domain: clean, endpoint, timeoutMs, method, protocol });
  const verdict = verdictFromStatus(probe.status);
  return { ok: true, domain: clean, endpoint, method, protocol, checkedAt, status: probe.status, error: probe.error, ...verdict };
}

