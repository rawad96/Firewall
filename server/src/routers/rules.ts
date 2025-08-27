import { Router, Request, Response } from 'express';
import {
  insertRules,
  deleteRules,
  fetchAllRules,
  toggleRules,
  deleteRulesByIds,
  Category,
  RuleType,
  fetchRuleById,
} from '../controllers/rules_controller';
import { validCategories, validTypes, validateValuesByType } from '../utils/validation';
import { log } from 'node:console';

const router = Router();

// --------------------
// Add IP/URL/Port
// --------------------
router.post('/api/firewall/:type', async (req: Request, res: Response) => {
  const { type } = req.params;
  const { values, mode } = req.body;

  if (!validTypes.includes(type as RuleType)) return res.status(400).json({ error: 'Invalid type' });
  if (!validCategories.includes(mode)) return res.status(400).json({ error: 'Invalid mode' });
  if (!Array.isArray(values) || values.length === 0) return res.status(400).json({ error: 'No values provided' });

  const { valid, invalid } = validateValuesByType(type as RuleType, values);

  if (valid.length === 0) return res.status(400).json({ error: 'No valid values', invalid });

  try {
    const inserted = await insertRules(valid.map((v: any) => ({
      category: mode,
      type: type as RuleType,
      value: v
    })));
    res.json({ type, mode, values: valid, invalid, status: 'success', inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --------------------
// Remove IP/URL/Port
// --------------------
router.delete('/api/firewall/:type', async (req: Request, res: Response) => {
  const { type } = req.params;
  const { values, mode } = req.body;

  if (!validTypes.includes(type as RuleType)) return res.status(400).json({ error: 'Invalid type' });
  if (!validCategories.includes(mode)) return res.status(400).json({ error: 'Invalid mode' });
  if (!Array.isArray(values) || values.length === 0) return res.status(400).json({ error: 'No values provided' });

  try {
    const deleted = await deleteRules(mode, type as RuleType, values);
    if(deleted.length === 0) return res.status(404).json({ error: 'No rules found to delete' });
    res.json({ type, mode, values, status: 'success', deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --------------------
// Delete multiple rules by IDs
// --------------------
router.delete('/api/firewall/many/rules', async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No IDs provided' });
  }

  try {
    const deleted = await deleteRulesByIds(ids);
    res.json({ status: 'success', deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --------------------
// Get all rules
// --------------------
router.get('/api/firewall/rules', async (_req: Request, res: Response) => {
  try {
    const rules = await fetchAllRules();
    res.json(rules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --------------------
// Get single rule by ID
// --------------------
router.get('/api/firewall/rules/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const rule = await fetchRuleById(numericId);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    return res.status(200).json(rule);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --------------------
// Toggle rule activation
// --------------------
router.put('/api/firewall/rules', async (req: Request, res: Response) => {
  const { ips, urls, ports } = req.body;
  const updated: any[] = [];

  try {
    if (ips?.ids?.length) {
      const resIps = await toggleRules(ips.ids, ips.active);
      updated.push(...resIps);
    }
    if (urls?.ids?.length) {
      const resUrls = await toggleRules(urls.ids, urls.active);
      updated.push(...resUrls);
    }
    if (ports?.ids?.length) {
      const resPorts = await toggleRules(ports.ids, ports.active);
      updated.push(...resPorts);
    }

    res.json({ updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
