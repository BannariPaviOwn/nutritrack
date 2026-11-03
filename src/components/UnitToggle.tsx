"use client";

type Option<T extends string> = { value: T; label: string };

export function UnitToggle<T extends string>({
  name,
  value,
  options,
  onChange,
  legend,
}: {
  name: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (next: T) => void;
  legend: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-slate-700">
        {legend}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="accent-teal-700"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
