'use client';

import { useFormContext, get } from 'react-hook-form';

function useError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext();
  const err = get(errors, name);
  return err?.message as string | undefined;
}

const baseInput =
  'w-full border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 transition-colors';
const okBorder = 'border-gray-300 focus:ring-yellow-300 focus:border-yellow-400';
const errBorder = 'border-red-400 focus:ring-red-200';

function ErrorText({ name }: { name: string }) {
  const msg = useError(name);
  if (!msg) return null;
  return (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <span>⚠️</span> {msg}
    </p>
  );
}

export function Label({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="ml-2 text-red-500 text-xs">必須</span>}
      {hint && <span className="ml-2 text-gray-400 text-xs font-normal">{hint}</span>}
    </label>
  );
}

interface FieldProps {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  type?: string;
}

export function TextField({ name, label, required, placeholder, hint, type = 'text' }: FieldProps) {
  const { register } = useFormContext();
  const msg = useError(name);
  return (
    <div className="mb-4">
      <Label required={required} hint={hint}>
        {label}
      </Label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`${baseInput} ${msg ? errBorder : okBorder}`}
      />
      <ErrorText name={name} />
    </div>
  );
}

export function NumberField({ name, label, required, placeholder, hint }: FieldProps) {
  const { register } = useFormContext();
  const msg = useError(name);
  return (
    <div className="mb-4">
      <Label required={required} hint={hint}>
        {label}
      </Label>
      <input
        type="number"
        placeholder={placeholder}
        {...register(name)}
        className={`${baseInput} ${msg ? errBorder : okBorder}`}
      />
      <ErrorText name={name} />
    </div>
  );
}

export function DateField({ name, label, required, hint }: FieldProps) {
  const { register } = useFormContext();
  const msg = useError(name);
  return (
    <div className="mb-4">
      <Label required={required} hint={hint}>
        {label}
      </Label>
      <input
        type="date"
        {...register(name)}
        className={`${baseInput} ${msg ? errBorder : okBorder}`}
      />
      <ErrorText name={name} />
    </div>
  );
}

interface SelectProps extends FieldProps {
  options: { value: string; label: string }[];
}

export function SelectField({ name, label, required, options, hint }: SelectProps) {
  const { register } = useFormContext();
  const msg = useError(name);
  return (
    <div className="mb-4">
      <Label required={required} hint={hint}>
        {label}
      </Label>
      <select
        {...register(name)}
        className={`${baseInput} bg-white ${msg ? errBorder : okBorder}`}
      >
        <option value="">選択してください</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ErrorText name={name} />
    </div>
  );
}

export function CheckboxField({ name, label }: { name: string; label: string }) {
  const { register } = useFormContext();
  return (
    <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
      <input type="checkbox" {...register(name)} className="w-4 h-4 accent-yellow-500" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
