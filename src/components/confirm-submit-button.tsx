"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const ok = window.confirm(confirmMessage);
    if (!ok) return;

    event.currentTarget.form?.requestSubmit();
  }

  return <button {...props} type="button" onClick={handleClick} />;
}