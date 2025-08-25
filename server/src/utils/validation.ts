import { Category, RuleType } from "../controllers/rules_controller";

// --------------------
// Regex Patterns
// --------------------
const ipRegex =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

const domainRegex =
  /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;

// --------------------

// Exports
// --------------------
export const isValidIP = (ip: string): boolean => ipRegex.test(ip);

export const isValidPort = (port: number): boolean =>
  Number.isInteger(port) && port >= 0 && port <= 65535;

export const isValidDomain = (domain: string): boolean => domainRegex.test(domain);

export const validCategories: Category[] = ["whitelist", "blacklist"];
export const validTypes: RuleType[] = ["ip", "url", "port"];

// --------------------
// Validation by type
// --------------------
export const validateValuesByType = (
  type: RuleType,
  values: any[]
): { valid: any[]; invalid: any[] } => {
  const valid: any[] = [];
  const invalid: any[] = [];

  values.forEach((v) => {
    if (type === "ip") {
      isValidIP(v) ? valid.push(v) : invalid.push(v);
    } else if (type === "port") {
      isValidPort(Number(v)) ? valid.push(Number(v)) : invalid.push(v);
    } else if (type === "url") {
      isValidDomain(v) ? valid.push(v) : invalid.push(v);
    }
  });

  return { valid, invalid };
};
