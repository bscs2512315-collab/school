"use client";

import AppSelect, { type AppSelectOption } from "@/components/AppSelect";

interface AppDropdownOption extends AppSelectOption {}

interface AppDropdownProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onBlur"> {
  options?: AppDropdownOption[];
  placeholder?: string;
  searchable?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement> | React.FocusEvent<HTMLSelectElement>) => void;
}

export default function AppDropdown({
  options,
  placeholder = "Select an option",
  searchable = false,
  className,
  value,
  disabled,
  id,
  name,
  onChange,
  onBlur,
}: AppDropdownProps) {
  const isSubjectDropdown = Boolean(
    id?.toLowerCase().includes("subject") ||
      name?.toLowerCase().includes("subject") ||
      placeholder?.toLowerCase().includes("subject"),
  );
  const shouldBeSearchable = searchable || isSubjectDropdown;

  return (
    <AppSelect
      options={options}
      placeholder={placeholder}
      searchable={shouldBeSearchable}
      className={className}
      value={typeof value === "string" ? value : value === undefined ? "" : String(value)}
      disabled={disabled}
      id={id}
      name={name}
      onChange={onChange}
      onBlur={onBlur as any}
    />
  );
}
