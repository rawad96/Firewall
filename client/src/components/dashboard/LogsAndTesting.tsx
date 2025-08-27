import React, { useState } from "react";
import Spinner from "../ui/Spinner";
import { log } from "console";

interface TestResult {
  id: string;
  name: string;
  status: "passed" | "failed" | "running";
  duration?: number;
  message?: string;
  timestamp: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const AVAILABLE_TESTS = [
  { id: "rules_get", name: "Get All Rules", description: "Test GET /api/firewall/rules endpoint" },
  { id: "rules_post", name: "Create Test Rule", description: "Test POST /api/firewall/ip endpoint" },
  { id: "rules_delete", name: "Delete Test Rule", description: "Test DELETE /api/firewall/ip endpoint" },
  { id: "users_get", name: "Get All Users", description: "Test GET /users endpoint" },
  { id: "users_post", name: "Create Test User", description: "Test POST /users endpoint" },
  { id: "users_delete", name: "Delete Test User", description: "Test DELETE /users/{id} endpoint" },
  { id: "auth_test", name: "Authentication Test", description: "Test JWT token validation" }
];

export default function LogsAndTesting({ isAdmin }: { isAdmin: boolean }) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const runTest = async (testId: string) => {
    if (runningTests.has(testId)) return;
    
    setRunningTests(prev => new Set(prev).add(testId));
    
    const test = AVAILABLE_TESTS.find(t => t.id === testId);
    if (!test) return;

    const testResult: TestResult = {
      id: Date.now().toString(),
      name: test.name,
      status: "running",
      timestamp: new Date().toISOString()
    };

    setTestResults(prev => [testResult, ...prev]);

    const startTime = Date.now();
    let success = false;
    let message = "";
    let createdRuleId: number | null = null;
    let createdUserId: number | null = null;

    try {
      switch (testId) {
        case "rules_get":
          const rulesResponse = await fetch(`${API_BASE}/rules/api/firewall/rules`, {
            headers: getAuthHeaders()
          });
          success = rulesResponse.ok;
          message = success ? `Retrieved ${(await rulesResponse.json()).length} rules` : `Failed: ${rulesResponse.statusText}`;
          break;

        case "rules_post":
          const createRuleResponse = await fetch(`${API_BASE}/rules/api/firewall/ip`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              mode: "whitelist",
              values: ["192.168.1.100"]
            })
          });
          success = createRuleResponse.ok;
          if (success) {
            const createdRule = await createRuleResponse.json();
            createdRuleId = createdRule.id;
            message = "Test rule created successfully";
          } else {
            message = `Failed: ${createRuleResponse.statusText}`;
          }
          break;

          case "rules_delete":
            try {
              const deleteRuleResponse = await fetch(`${API_BASE}/rules/api/firewall/ip`, {
                method: "DELETE",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  mode: "whitelist",
                  values: ["192.168.1.100"]
                })
              });
          
              if (deleteRuleResponse.ok) {
                console.log(deleteRuleResponse);
                
                success = true;
                message = "Test rule deleted successfully";
              } else if (deleteRuleResponse.status === 404) {
                // השרת מחזיר 404 אם החוק לא קיים
                success = false;
                message = "No test rule found to delete - run Create Test Rule first";
              } else {
                success = false;
                message = `Failed: ${deleteRuleResponse.status} ${deleteRuleResponse.statusText}`;
              }
            } catch (err) {
              success = false;
              message = `Error deleting rule: ${err}`;
            }
            break;

        case "users_get":
          const usersResponse = await fetch(`${API_BASE}/users`, {
            headers: getAuthHeaders()
          });
          success = usersResponse.ok;
          message = success ? `Retrieved ${(await usersResponse.json()).length} users` : `Failed: ${usersResponse.statusText}`;
          break;

        case "users_post":
          const createUserResponse = await fetch(`${API_BASE}/users`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              email: `test-${Date.now()}@example.com`,
              password: "testpassword123",
              role: "user"
            })
          });
          success = createUserResponse.ok;
          if (success) {
            const createdUser = await createUserResponse.json();
            createdUserId = createdUser.id;
            message = "Test user created successfully";
          } else {
            message = `Failed: ${createUserResponse.statusText}`;
          }
          break;

          case "users_delete":
            try {
              const deleteUserResponse = await fetch(`${API_BASE}/users/${createdUserId}`, {
                method: "DELETE",
                headers: getAuthHeaders()
              });
          
              if (deleteUserResponse.ok) {
                success = true;
                message = "Test user deleted successfully";
                createdUserId = null; 
              } else if (deleteUserResponse.status === 404) {
                success = false;
                message = "No test user found to delete - run Create Test User first";
              } else {
                success = false;
                message = `Failed: ${deleteUserResponse.status} ${deleteUserResponse.statusText}`;
              }
            } catch (err) {
              success = false;
              message = `Error deleting user: ${err}`;
            }
            break;

        case "auth_test":
          const authResponse = await fetch(`${API_BASE}/access/me`, {
            headers: getAuthHeaders()
          });
          success = authResponse.ok;
          if (success) {
            const userData = await authResponse.json();
            message = `Authenticated as ${userData.email} (${userData.role})`;
          } else {
            message = `Failed: ${authResponse.statusText}`;
          }
          break;

        default:
          success = false;
          message = "Unknown test";
      }
    } catch (error) {
      success = false;
      message = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    const duration = Date.now() - startTime;
    
    setTestResults(prev => prev.map(result => 
      result.id === testResult.id 
        ? {
            ...result,
            status: success ? "passed" : "failed",
            duration: duration,
            message: message
          }
        : result
    ));
    
    setRunningTests(prev => {
      const newSet = new Set(prev);
      newSet.delete(testId);
      return newSet;
    });
  };

  const runAllTests = () => {
    AVAILABLE_TESTS.forEach(test => runTest(test.id));
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  if (!isAdmin) {
    return (
      <div className="w-full h-full p-6">
        <h2 className="text-3xl font-semibold mb-4">Testing</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            You do not have permission to run tests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 space-y-6">
      <h2 className="text-3xl font-semibold">System Testing</h2>
      
      {/* Testing Section */}
      <div className="rounded border border-black/5 dark:border-white/10 p-5 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">API Endpoint Tests</h3>
          <div className="flex gap-2">
            <button
              onClick={runAllTests}
              disabled={runningTests.size > 0}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              Run All Tests
            </button>
            <button
              onClick={clearTestResults}
              className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 cursor-pointer text-sm"
            >
              Clear Results
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {AVAILABLE_TESTS.map(test => (
            <div key={test.id} className="border rounded p-3 bg-neutral-50 dark:bg-neutral-800">
              <h4 className="font-medium mb-1">{test.name}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{test.description}</p>
              <button
                onClick={() => runTest(test.id)}
                disabled={runningTests.has(test.id)}
                className="w-full px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {runningTests.has(test.id) ? <Spinner  /> : "Run Test"}
              </button>
            </div>
          ))}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Test Results</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.map(result => (
                <div key={result.id} className="flex items-center justify-between p-3 border rounded bg-neutral-50 dark:bg-neutral-800">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${result.status === "passed" ? "text-green-600" : result.status === "failed" ? "text-red-600" : "text-blue-600"}`}>
                      {result.status === "passed" ? "✅" : result.status === "failed" ? "❌" : "🔄"}
                    </span>
                    <div>
                      <div className="font-medium">{result.name}</div>
                      {result.message && <div className="text-sm text-neutral-600 dark:text-neutral-400">{result.message}</div>}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{new Date(result.timestamp).toLocaleTimeString()}</div>
                    {result.duration !== undefined && <div>{(result.duration / 1000).toFixed(1)}s</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
