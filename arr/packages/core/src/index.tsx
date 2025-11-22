import * as React from "react";

export interface CoreButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style of the button.
   */
  variant?: "primary" | "secondary";
}

/**
 * A small example React component that can be consumed from this library.
 */
export const CoreButton: React.FC<CoreButtonProps> = ({
  variant = "primary",
  children,
  className = "",
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const variants: Record<NonNullable<CoreButtonProps["variant"]>, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200"
  };

  const classes = [base, variants[variant], className].filter(Boolean).join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

/**
 * Example hook: simple boolean toggle with optional initial value.
 */
export function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = React.useState<boolean>(initial);
  const toggle = React.useCallback(() => {
    setValue((prev) => !prev);
  }, []);
  return [value, toggle];
}


