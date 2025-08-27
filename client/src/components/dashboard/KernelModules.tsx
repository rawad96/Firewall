import React from "react";

export default function KernelModules({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="w-full h-full p-6">
      <h2 className="text-xl font-semibold mb-2">Kernel Modules</h2>
      {isAdmin ? (
        <p className="text-neutral-600 dark:text-neutral-400">Admin can manage kernel modules here. (Coming soon)</p>
      ) : (
        <p className="text-neutral-600 dark:text-neutral-400">You do not have permission to manage kernel modules.</p>
      )}
    </div>
  );
}
