import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import Spinner from "./Spinner";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmWord?: string; // e.g., "delete permanently"
  confirmText?: string; // button text
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export default function ConfirmModal({ open, title, message, confirmWord = "delete permanently", confirmText = "Confirm", onClose, onConfirm, loading = false }: ConfirmModalProps) {
  const [input, setInput] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setInput("");
  }, [open]);

  if (!open) return null;

  const requiredDisplay = `"${confirmWord}"`;
  const requiredRaw = confirmWord;
  const canConfirm = input.trim().toLowerCase() === requiredRaw.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div ref={dialogRef} className="w-full max-w-md rounded-lg bg-white dark:bg-neutral-900 shadow p-5">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{message}</p>

        <label className="text-sm mb-1 block">Type: <span className="font-mono font-semibold">{requiredDisplay}</span></label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-transparent"
          placeholder={requiredRaw}
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose} disabled={loading} className="cursor-pointer">Cancel</Button>
          <Button onClick={onConfirm} disabled={!canConfirm || loading} className="cursor-pointer">
            {loading ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Processing...</span>) : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
