import pool from '../config/db';

export type Category = 'whitelist' | 'blacklist';
export type RuleType = 'ip' | 'url' | 'port';

export interface Rule {
  id?: number;
  category: Category;
  type: RuleType;
  value: string;
  active?: boolean;
  created_at?: string;
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
  const result = await pool.query<Rule>('SELECT * FROM firewall_rules ORDER BY id ASC');
  const rules = result.rows;

  const response: RulesResponse = {
    ips: { whitelist: [], blacklist: [] },
    urls: { whitelist: [], blacklist: [] },
    ports: { whitelist: [], blacklist: [] },
  };

  rules.forEach(rule => {
    const item: RuleItem = {
      id: rule.id!,
      value: rule.value,
      active: rule.active ?? true,
    };
    if (rule.type === 'ip') response.ips[rule.category].push(item);
    if (rule.type === 'url') response.urls[rule.category].push(item);
    if (rule.type === 'port') response.ports[rule.category].push(item);
  });

  return response;
};

// --------------------
// Fetch single rule by ID
// --------------------
export const fetchRuleById = async (id: number): Promise<Rule | null> => {
  const result = await pool.query<Rule>(
    'SELECT * FROM firewall_rules WHERE id = $1 LIMIT 1',
    [id]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// --------------------
// Insert (no duplicates)
// --------------------
export const insertRules = async (rules: Rule[]): Promise<Rule[]> => {
  const inserted: Rule[] = [];
  for (const rule of rules) {
    const existing = await pool.query<Rule>(
      'SELECT * FROM firewall_rules WHERE category=$1 AND type=$2 AND value=$3',
      [rule.category, rule.type, rule.value]
    );

    if (existing.rowCount === 0) {
      const res = await pool.query<Rule>(
        'INSERT INTO firewall_rules (category, type, value, active) VALUES ($1, $2, $3, $4) RETURNING *',
        [rule.category, rule.type, rule.value, rule.active ?? true]
      );
      inserted.push(res.rows[0]);
    }
  }
  return inserted;
};

// --------------------
// Delete by values
// --------------------
export const deleteRules = async (
  category: Category,
  type: RuleType,
  values: (string | number)[]
): Promise<Rule[]> => {
  const deleted: Rule[] = [];
  for (const value of values) {
    const res = await pool.query<Rule>(
      'DELETE FROM firewall_rules WHERE category=$1 AND type=$2 AND value=$3 RETURNING *',
      [category, type, value]
    );
    if (res.rows.length > 0) deleted.push(...res.rows);
  }
  return deleted;
};

// --------------------
// Delete by IDs
// --------------------
export const deleteRulesByIds = async (ids: number[]): Promise<Rule[]> => {
  if (!ids || ids.length === 0) return [];
  const result = await pool.query(
    'DELETE FROM firewall_rules WHERE id = ANY($1::int[]) RETURNING *',
    [ids]
  );
  return result.rows;
};

// --------------------
// Toggle activation
// --------------------
export const toggleRules = async (ids: number[], active: boolean): Promise<Rule[]> => {
  const updated: Rule[] = [];
  for (const id of ids) {
    const res = await pool.query<Rule>(
      'UPDATE firewall_rules SET active=$1 WHERE id=$2 RETURNING *',
      [active, id]
    );
    if (res.rows.length > 0) updated.push(...res.rows);
  }
  return updated;
};
