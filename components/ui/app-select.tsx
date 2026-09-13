"use client";

import * as React from "react";
import Select, { GroupBase, StylesConfig, Props as ReactSelectProps } from "react-select";

export type AppSelectOption = { value: string; label: string };

const styles: StylesConfig<AppSelectOption, false, GroupBase<AppSelectOption>> = {
  control: (base, state) => ({
    ...base,
    minHeight: 32,
    height: 32,
    borderRadius: "calc(var(--radius) * 0.9)",
    borderColor: state.isFocused ? "var(--ring)" : "var(--input)",
    backgroundColor: "var(--background)",
    boxShadow: state.isFocused ? "0 0 0 3px var(--ring)" : "none",
    borderWidth: 1,
    fontSize: "0.875rem",
    cursor: "pointer",
    ":hover": { borderColor: "var(--ring)" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px", gap: 2 }),
  input: (base) => ({ ...base, color: "var(--foreground)", margin: 0, padding: 0 }),
  placeholder: (base) => ({ ...base, color: "var(--muted-foreground)", fontSize: "0.875rem" }),
  singleValue: (base) => ({ ...base, color: "var(--foreground)", fontSize: "0.875rem" }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    boxShadow: "0 10px 30px -10px oklch(0 0 0 / 0.3)",
    zIndex: 50,
  }),
  menuList: (base) => ({ ...base, padding: 4, backgroundColor: "var(--popover)" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--primary)"
      : state.isFocused
        ? "var(--accent)"
        : "transparent",
    color: state.isSelected ? "var(--primary-foreground)" : "var(--foreground)",
    fontSize: "0.875rem",
    borderRadius: 6,
    padding: "6px 8px",
    cursor: "pointer",
    ":active": { backgroundColor: "var(--accent)" },
  }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: "var(--border)" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: "var(--muted-foreground)",
    padding: 4,
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : undefined,
    transition: "transform 0.15s",
  }),
  clearIndicator: (base) => ({ ...base, color: "var(--muted-foreground)", padding: 4 }),
  indicatorsContainer: (base) => ({ ...base, paddingRight: 2 }),
};

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  isClearable = false,
  isSearchable = true,
  isDisabled = false,
  className,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
  isDisabled?: boolean;
  className?: string;
} & Omit<ReactSelectProps<AppSelectOption, false, GroupBase<AppSelectOption>>, "value" | "onChange" | "options">) {
  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  return (
    <Select<AppSelectOption, false, GroupBase<AppSelectOption>>
      value={selected}
      onChange={(opt) => onChange((opt as AppSelectOption | null)?.value ?? "")}
      options={options}
      placeholder={placeholder}
      isClearable={isClearable}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      styles={styles}
      className={className}
      classNamePrefix="app-select"
      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
      menuPosition="fixed"
      {...props}
    />
  );
}
