"use client";

import { useState } from "react";

type CopyCodeButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyCodeButton({
  value,
  label = "Copier",
  className = "button"
}: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className={className} type="button" onClick={handleCopy}>
      {copied ? "Copié" : label}
    </button>
  );
}