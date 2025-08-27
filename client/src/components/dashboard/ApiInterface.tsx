import React, { useEffect, useMemo, useState } from "react";

type Method = "get" | "post" | "put" | "delete" | "patch";

interface SwaggerSpec {
  paths: Record<string, Partial<Record<Method, any>>>;
}

function schemaToExample(schema: any): any {
  if (!schema) return undefined;
  const s = schema.$ref ? schema : schema.schema ? schema.schema : schema;
  const type = s.type;
  if (s.example !== undefined) return s.example;
  if (type === "object") {
    const obj: any = {};
    const props = s.properties || {};
    for (const key of Object.keys(props)) {
      obj[key] = schemaToExample(props[key]);
    }
    return obj;
  }
  if (type === "array") {
    return [schemaToExample(s.items || { type: "string" })];
  }
  if (type === "integer") return 0;
  if (type === "number") return 0;
  if (type === "boolean") return true;
  // string with format
  return "string";
}

function buildExampleFromRequestBody(requestBody: any): any {
  if (!requestBody || !requestBody.content) return undefined;
  const json = requestBody.content["application/json"]; 
  if (!json) return undefined;
  return schemaToExample(json.schema);
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ApiInterface({ isAdmin }: { isAdmin: boolean }) {
  const [spec, setSpec] = useState<SwaggerSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Execute block state
  const [execPath, setExecPath] = useState<string>("");
  const [execMethod, setExecMethod] = useState<Method>("get");
  const [execBody, setExecBody] = useState<string>("{}");
  const [execHeaders, setExecHeaders] = useState<string>("{\n  \"Content-Type\": \"application/json\"\n}");
  const [execLoading, setExecLoading] = useState(false);
  const [execStatus, setExecStatus] = useState<string>("");
  const [execResponse, setExecResponse] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/swagger.json`);
        if (!res.ok) throw new Error("Failed to load swagger");
        const data = await res.json();
        setSpec(data);
      } catch (e: any) {
        setError(e.message || "Failed to load swagger");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const endpoints = useMemo(() => {
    if (!spec) return [] as { path: string; method: Method; operation: any; example?: any }[];
    const out: { path: string; method: Method; operation: any; example?: any }[] = [];
    for (const path of Object.keys(spec.paths || {})) {
      const ops = spec.paths[path] as any;
      (Object.keys(ops) as Method[]).forEach((method) => {
        const operation = ops[method];
        const example = buildExampleFromRequestBody(operation?.requestBody);
        out.push({ path, method, operation, example });
      });
    }
    return out.sort((a, b) => a.path.localeCompare(b.path));
  }, [spec]);

  const selectEndpoint = (key: string) => {
    const found = endpoints.find((e) => `${e.method}:${e.path}` === key);
    if (!found) return;
    setExecMethod(found.method);
    setExecPath(found.path);
    setExecBody(found.example !== undefined ? JSON.stringify(found.example, null, 2) : "{}");
  };

  const executeRequest = async () => {
    setExecLoading(true);
    setExecStatus("");
    setExecResponse("");
    try {
      const headers = JSON.parse(execHeaders || "{}");
      // If token exists in localStorage, add Authorization header unless already provided
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token && !headers["Authorization"]) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
      const options: RequestInit = {
        method: execMethod.toUpperCase(),
        headers,
      } as any;
      if (["post", "put", "patch", "delete"].includes(execMethod)) {
        options.body = execBody && execBody.trim() ? execBody : undefined;
      }
      const res = await fetch(`${API_BASE}${execPath}`, options);
      setExecStatus(`${res.status} ${res.statusText}`);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setExecResponse(JSON.stringify(json, null, 2));
      } catch {
        setExecResponse(text);
      }
    } catch (e: any) {
      setExecStatus("Request failed");
      setExecResponse(e.message || String(e));
    } finally {
      setExecLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-6 space-y-6">
      <h3 className="text-3xl font-semibold">API Interface</h3>
      {loading && <div className="text-sm">Loading swagger...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <>
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div key={`${ep.method}:${ep.path}`} className="rounded border border-black/5 dark:border-white/10 p-4 bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-mono">
                    <span className="uppercase font-bold mr-2">{ep.method}</span>
                    <span>{ep.path}</span>
                  </div>
                  {ep.operation?.summary && (
                    <div className="text-sm opacity-70">{ep.operation.summary}</div>
                  )}
                </div>
                {ep.example !== undefined && (
                  <div className="mt-3">
                    <div className="text-xs mb-1 opacity-70">Example request (application/json):</div>
                    <pre className="text-xs bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded overflow-auto">
{JSON.stringify(ep.example, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Execute block */}
          <div className="rounded border border-black/5 dark:border-white/10 p-5 bg-white dark:bg-neutral-900">
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Warning:</strong> Using Execute can cause real changes to the database. 
                Be careful when sending POST, PUT or DELETE requests.
              </p>
            </div>
            <h3 className="text-3xl font-semibold mb-3">Execute request</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="flex flex-col">
                <label className="text-sm mb-1">Endpoint</label>
                <select onChange={(e) => selectEndpoint(e.target.value)} className="border rounded px-3 py-2 bg-transparent">
                  <option value="">Select from swagger...</option>
                  {endpoints.map((ep) => (
                    <option key={`${ep.method}:${ep.path}`} value={`${ep.method}:${ep.path}`}>
                      {ep.method.toUpperCase()} {ep.path}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-1">Method</label>
                <select value={execMethod} onChange={(e) => setExecMethod(e.target.value as Method)} className="border rounded px-3 py-2 bg-transparent">
                  <option value="get">GET</option>
                  <option value="post">POST</option>
                  <option value="put">PUT</option>
                  <option value="delete">DELETE</option>
                  <option value="patch">PATCH</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-1">Path</label>
                <input value={execPath} onChange={(e) => setExecPath(e.target.value)} className="border rounded px-3 py-2 bg-transparent" placeholder="/auth/login" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col">
                <label className="text-sm mb-1">Headers (JSON)</label>
                <textarea value={execHeaders} onChange={(e) => setExecHeaders(e.target.value)} className="border rounded px-3 py-2 bg-transparent min-h-28 font-mono text-xs" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-1">Body (JSON)</label>
                <textarea value={execBody} onChange={(e) => setExecBody(e.target.value)} className="border rounded px-3 py-2 bg-transparent min-h-28 font-mono text-xs" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button onClick={executeRequest} className="px-5 py-2 rounded bg-black text-white dark:bg-white dark:text-black cursor-pointer">
                {execLoading ? "Executing..." : "Execute"}
              </button>
              {execLoading && <span className="text-sm opacity-70">Please wait...</span>}
            </div>

            {execStatus && (
              <div className="mb-2 text-sm">Status: {execStatus}</div>
            )}
            <div className="text-xs bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded overflow-auto min-h-16">
              {execResponse ? <pre>{execResponse}</pre> : <span className="opacity-60">Response will appear here...</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
