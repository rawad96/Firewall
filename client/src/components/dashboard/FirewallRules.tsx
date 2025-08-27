import React, { useEffect, useMemo, useState } from "react";
import { api, RuleType, Category } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";

interface RuleItem { id: number; value: string; active: boolean; }
interface FlatRule extends RuleItem { type: RuleType; category: Category }

export default function FirewallRules({ isAdmin }: { isAdmin: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Add form state
  const [type, setType] = useState<RuleType>("ip");
  const [mode, setMode] = useState<Category>("whitelist");
  const [values, setValues] = useState<string>("");

  // List state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [toggleActive, setToggleActive] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<"all" | RuleType>("all");
  const [filterCategory, setFilterCategory] = useState<"all" | Category>("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchAllRules();
      setData(res);
    } catch (e: any) {
      setError(e.message || "Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Flatten all rules with type and category
  const allRules: FlatRule[] = useMemo(() => {
    if (!data) return [];
    const out: FlatRule[] = [];
    const pushGroup = (arr: RuleItem[], type: RuleType, category: Category) => {
      arr?.forEach((r) => out.push({ ...r, type, category }));
    };
    pushGroup(data.ips?.whitelist ?? [], "ip", "whitelist");
    pushGroup(data.ips?.blacklist ?? [], "ip", "blacklist");
    pushGroup(data.urls?.whitelist ?? [], "url", "whitelist");
    pushGroup(data.urls?.blacklist ?? [], "url", "blacklist");
    pushGroup(data.ports?.whitelist ?? [], "port", "whitelist");
    pushGroup(data.ports?.blacklist ?? [], "port", "blacklist");
    return out.sort((a, b) => a.id - b.id);
  }, [data]);

  const filteredRules = useMemo(() => {
    return allRules.filter((r) => {
      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (filterActive === "active" && !r.active) return false;
      if (filterActive === "inactive" && r.active) return false;
      return true;
    });
  }, [allRules, filterType, filterCategory, filterActive]);

  const idToType = useMemo(() => {
    const map = new Map<number, RuleType>();
    allRules.forEach((r) => map.set(r.id, r.type));
    return map;
  }, [allRules]);

  const onAdd = async () => {
    if (!isAdmin) return;
    const items = values
      .split(/[\,\n]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await api.addRules(type, mode, items as (string|number)[]);
      setValues("");
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to add rules");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteSelected = async () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin || selectedIds.size === 0) { setConfirmOpen(false); return; }
    setConfirmLoading(true);
    setError(null);
    try {
      await api.deleteRulesByIds(Array.from(selectedIds));
      setSelectedIds(new Set());
      await load();
      setConfirmOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to delete selected rules");
    } finally {
      setConfirmLoading(false);
    }
  };

  const onToggleSelected = async () => {
    if (!isAdmin || selectedIds.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      const byType: Record<RuleType, number[]> = { ip: [], url: [], port: [] };
      Array.from(selectedIds).forEach((id) => {
        const t = idToType.get(id);
        if (t) byType[t].push(id);
      });
      const payload: any = {};
      if (byType.ip.length) payload.ips = { ids: byType.ip, active: toggleActive };
      if (byType.url.length) payload.urls = { ids: byType.url, active: toggleActive };
      if (byType.port.length) payload.ports = { ids: byType.port, active: toggleActive };
      if (!payload.ips && !payload.urls && !payload.ports) throw new Error("No valid selection");
      await api.toggleRules(payload);
      setSelectedIds(new Set());
      await load();
    } catch (e: any) {
      setError(e.message || "Failed to update rules");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full h-full p-6 space-y-6">
      {/* Block 1: Add form (two inputs per row, equal width) */}
      <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 shadow">
        <h3 className="text-3xl font-semibold mb-5">Add new rule</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as RuleType)} className="border rounded px-3 py-2 bg-transparent w-full">
              <option value="ip">IP</option>
              <option value="url">URL</option>
              <option value="port">Port</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as Category)} className="border rounded px-3 py-2 bg-transparent w-full">
              <option value="whitelist">Whitelist</option>
              <option value="blacklist">Blacklist</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Values (comma or newline separated)</label>
            <textarea value={values} onChange={(e) => setValues(e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent min-h-10" placeholder="1.1.1.1, 2.2.2.2" />
          </div>
          <div className="hidden sm:block" />
        </div>
        {isAdmin && (
          <div className="mt-5">
            <Button onClick={onAdd} disabled={loading} className="cursor-pointer px-15">{loading ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Adding...</span>) : "Add"}</Button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* Block 2: Rules list with filters */}
      <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-3xl font-semibold">All rules</h3>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <label className="text-sm flex items-center gap-2">
                <span>Active:</span>
                <input type="checkbox" checked={toggleActive} onChange={(e) => setToggleActive(e.target.checked)} />
              </label>
              <Button onClick={onToggleSelected} disabled={loading || selectedIds.size === 0} className="cursor-pointer">{loading ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Updating...</span>) : "Toggle selected"}</Button>
              <Button onClick={onDeleteSelected} disabled={loading || selectedIds.size === 0} className="cursor-pointer">Delete selected</Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="border rounded px-3 py-2 bg-transparent">
              <option value="all">All</option>
              <option value="ip">IP</option>
              <option value="url">URL</option>
              <option value="port">Port</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="border rounded px-3 py-2 bg-transparent">
              <option value="all">All</option>
              <option value="whitelist">Whitelist</option>
              <option value="blacklist">Blacklist</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Status</label>
            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as any)} className="border rounded px-3 py-2 bg-transparent">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="py-4 text-sm inline-flex items-center gap-2"><Spinner size={16} /> Loading...</div>
        )}
        {!loading && filteredRules.length === 0 && (
          <div className="py-4 text-sm">No rules found.</div>
        )}

        <div className="space-y-2">
          {!loading && filteredRules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border border-black/5 dark:border-white/10 px-3 py-2">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelected(r.id)} />
                <div className="text-sm">
                  <div className="font-medium">{String(r.value)}</div>
                  <div className="opacity-60">ID: {r.id} • Type: {r.type} • {r.category}</div>
                </div>
              </div>
              <div className="text-sm">{r.active ? 'Active' : 'Inactive'}</div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete selected rules"
        message="This action cannot be undone. To confirm deletion, please type the phrase below and press Delete."
        confirmWord="delete permanently"
        confirmText="Delete"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={confirmLoading}
      />
    </div>
  );
}
