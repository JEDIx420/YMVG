"use client";

import { useDeferredValue, useId, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import type { SwirClub } from "@/types/database.types";

interface ClubComboboxProps {
  clubs: SwirClub[];
  value: string;
  onChange: (clubId: string) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function ClubCombobox({
  clubs,
  value,
  onChange,
  label = "SWIR Club",
  disabled = false,
  required = false,
}: ClubComboboxProps) {
  const listboxId = useId();
  const selectedClub = clubs.find((club) => club.id === value) ?? null;
  const [query, setQuery] = useState(selectedClub?.canonical_name ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filteredClubs = clubs.filter((club) => {
    if (!deferredQuery) return true;
    return `${club.canonical_name} ${club.imis_club_id} district ${club.district_number}`
      .toLowerCase()
      .includes(deferredQuery);
  });

  const chooseClub = (club: SwirClub) => {
    onChange(club.id);
    setQuery(club.canonical_name);
    setOpen(false);
    setActiveIndex(0);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={`${listboxId}-input`} className="block text-sm font-bold text-blue-950">
        {label}{required ? " *" : ""}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
        <input
          id={`${listboxId}-input`}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-activedescendant={open && filteredClubs[activeIndex] ? `${listboxId}-${filteredClubs[activeIndex].id}` : undefined}
          autoComplete="off"
          disabled={disabled}
          required={required}
          value={query}
          placeholder="Search by club, district, or iMIS ID"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange("");
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, filteredClubs.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && filteredClubs[activeIndex]) {
              event.preventDefault();
              chooseClub(filteredClubs[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <ChevronsUpDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-slate-400" />

        {open && !disabled && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl"
          >
            {filteredClubs.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No matching SWIR club.</p>
            ) : (
              filteredClubs.map((club, index) => (
                <button
                  type="button"
                  role="option"
                  id={`${listboxId}-${club.id}`}
                  aria-selected={club.id === value}
                  key={club.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseClub(club)}
                  className={`flex w-full items-start justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition ${
                    index === activeIndex ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{club.canonical_name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      District {club.district_number} - Zone {club.zone_number} - iMIS {club.imis_club_id}
                    </span>
                  </span>
                  {club.id === value && <Check className="mt-1 h-4 w-4 shrink-0 text-blue-600" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedClub && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-950 sm:grid-cols-4">
          <span><strong>Club:</strong> {selectedClub.canonical_name}</span>
          <span><strong>District:</strong> {selectedClub.district_number}</span>
          <span><strong>Zone:</strong> {selectedClub.zone_number}</span>
          <span><strong>Region:</strong> {selectedClub.region_code}</span>
        </div>
      )}
    </div>
  );
}
