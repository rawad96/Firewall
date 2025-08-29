import prisma from '../config/db';

export type Category = 'whitelist' | 'blacklist';
export type RuleType = 'ip' | 'url' | 'port';

export interface Rule {
  id?: number;
  category: Category;
  type: RuleType;
  value: string;
  active?: boolean;
  createdAt?: Date;
}

interface RuleItem {
  id: number;
  value: string;
  active: boolean;
}

interface RulesResponse {
  ips: { whitelist: RuleItem[]; blacklist: RuleItem[] };
  urls: { whitelist: RuleItem[]; blacklist: RuleItem[] };
  ports: { whitelist: RuleItem[]; blacklist: RuleItem[] };
}

// --------------------
// Fetch all rules
// --------------------
export const fetchAllRules = async (): Promise<RulesResponse> => {
  try {
    const rules = await prisma.firewallRule.findMany({
      orderBy: { id: 'asc' }
    });

    const response: RulesResponse = {
      ips: { whitelist: [], blacklist: [] },
      urls: { whitelist: [], blacklist: [] },
      ports: { whitelist: [], blacklist: [] },
    };

    rules.forEach((rule: any) => {
      const item: RuleItem = {
        id: rule.id,
        value: rule.value,
        active: rule.active,
      };
      if (rule.type === 'ip') response.ips[rule.category as Category].push(item);
      if (rule.type === 'url') response.urls[rule.category as Category].push(item);
      if (rule.type === 'port') response.ports[rule.category as Category].push(item);
    });

    return response;
  } catch (error) {
    throw error;
  }
};

// --------------------
// Fetch single rule by ID
// --------------------
export const fetchRuleById = async (id: number): Promise<Rule | null> => {
  try {
    const rule = await prisma.firewallRule.findUnique({
      where: { id }
    });
    return rule;
  } catch (error) {
    throw error;
  }
};

// --------------------
// Insert (no duplicates)
// --------------------
export const insertRules = async (rules: Rule[]): Promise<Rule[]> => {
  try {
    const inserted: Rule[] = [];
    for (const rule of rules) {
      const existing = await prisma.firewallRule.findFirst({
        where: {
          category: rule.category,
          type: rule.type,
          value: rule.value
        }
      });

      if (!existing) {
        const newRule = await prisma.firewallRule.create({
          data: {
            category: rule.category,
            type: rule.type,
            value: rule.value,
            active: rule.active ?? true
          }
        });
        inserted.push(newRule);
      }
    }
    return inserted;
  } catch (error) {
    throw error;
  }
};

// --------------------
// Delete by values
// --------------------
export const deleteRules = async (
  category: Category,
  type: RuleType,
  values: (string | number)[]
): Promise<number> => {
  try {
    const result = await prisma.firewallRule.deleteMany({
      where: {
        category,
        type,
        value: { in: values.map(v => v.toString()) }
      }
    });

    return result.count; // כמה חוקים נמחקו בפועל
  } catch (error) {
    throw error;
  }
};
// --------------------
// Delete by IDs
// --------------------
export const deleteRulesByIds = async (ids: number[]): Promise<Rule[]> => {
  try {
    if (!ids || ids.length === 0) return [];
    
    // First fetch the rules to return them
    const rulesToDelete = await prisma.firewallRule.findMany({
      where: { id: { in: ids } }
    });
    
    // Then delete them
    await prisma.firewallRule.deleteMany({
      where: { id: { in: ids } }
    });
    
    return rulesToDelete;
  } catch (error) {
    throw error;
  }
};

// --------------------
// Toggle activation
// --------------------
export const toggleRules = async (ids: number[], active: boolean): Promise<Rule[]> => {
  try {
    const updated: Rule[] = [];
    for (const id of ids) {
      const updatedRule = await prisma.firewallRule.update({
        where: { id },
        data: { active }
      });
      updated.push(updatedRule);
    }
    return updated;
  } catch (error) {
    throw error;
  }
};
