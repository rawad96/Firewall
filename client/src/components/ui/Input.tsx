import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  errorMessage?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", errorMessage, ...props }, ref) => {
    return (
      <div>
        <input
          ref={ref}
          className={
            "w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-black/10 dark:focus:ring-white/15 transition " +
            className
          }
          {...props}
        />
        {errorMessage && (
          <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";


