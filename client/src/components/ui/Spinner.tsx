import React from "react";

export default function Spinner({ size = 20 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <div
      className="animate-spin rounded-full border-2 border-neutral-300 dark:border-neutral-700 border-t-black dark:border-t-white"
      style={{ width: px, height: px }}
      aria-label="Loading"
    />
  );
}
