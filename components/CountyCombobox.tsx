'use client';

import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CALIFORNIA_COUNTIES,
  formatCounty,
  normalizeCounty,
  rankCaliforniaCountyMatches,
  resolveCountyAutocompleteValue
} from '@/lib/californiaCounties';
import { cn } from '@/lib/utils';

interface CountyComboboxProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  counties?: readonly string[];
  error?: string;
  disabled?: boolean;
}

export default function CountyCombobox({
  id,
  value,
  onValueChange,
  counties = CALIFORNIA_COUNTIES,
  error,
  disabled = false
}: CountyComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(() => formatCounty(value));
  const [isFocused, setIsFocused] = useState(false);
  const hasCommittedCounty = Boolean(value);
  const trimmedInput = normalizeCounty(inputValue);
  const matches = useMemo(() => (
    rankCaliforniaCountyMatches(inputValue, 8, counties)
  ), [inputValue, counties]);
  const exactMatch = useMemo(() => (
    resolveCountyAutocompleteValue(inputValue, counties)
  ), [inputValue, counties]);
  const showSuggestions = !hasCommittedCounty && isFocused && trimmedInput.length >= 2 && matches.length > 1;

  useEffect(() => {
    if (value) {
      setInputValue(formatCounty(value));
      return;
    }

    if (!isFocused) {
      setInputValue('');
    }
  }, [value, isFocused]);

  const commitCounty = (county: string) => {
    onValueChange(county);
    setInputValue(formatCounty(county));
    setIsFocused(false);
  };

  const clearCanonicalCounty = () => {
    if (value) {
      onValueChange('');
    }
  };

  const changeCounty = () => {
    onValueChange('');
    setInputValue('');
    setIsFocused(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const resolveAndMaybeCommit = (rawValue: string) => {
    const resolved = resolveCountyAutocompleteValue(rawValue, counties);

    if (resolved) {
      commitCounty(resolved);
      return true;
    }

    clearCanonicalCounty();
    return false;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (hasCommittedCounty) return;

    const nextValue = event.target.value;
    setInputValue(nextValue);
    setIsFocused(true);

    if (normalizeCounty(nextValue).length < 2) {
      clearCanonicalCounty();
      return;
    }

    const resolved = resolveCountyAutocompleteValue(nextValue, counties);
    if (resolved) {
      commitCounty(resolved);
      return;
    }

    clearCanonicalCounty();
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (hasCommittedCounty) {
        setIsFocused(false);
        return;
      }

      if (!resolveAndMaybeCommit(inputValue)) {
        setIsFocused(false);
      }
    }, 120);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (hasCommittedCounty) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      resolveAndMaybeCommit(inputValue);
    }

    if (event.key === 'Escape') {
      setIsFocused(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="address-level2"
          inputMode="text"
          value={inputValue}
          placeholder="Type county name"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-invalid={Boolean(error)}
          aria-readonly={hasCommittedCounty}
          readOnly={hasCommittedCounty}
          disabled={disabled}
          onChange={handleChange}
          onFocus={() => !hasCommittedCounty && setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn('h-11 text-base', hasCommittedCounty && 'cursor-default bg-muted/40')}
        />
        {hasCommittedCounty && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={changeCounty}
            className="h-11 px-3"
          >
            Change
          </Button>
        )}
      </div>
      {showSuggestions && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-56 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {matches.map((county) => (
            <Button
              key={county}
              type="button"
              variant="ghost"
              role="option"
              aria-selected={county === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commitCounty(county)}
              className={cn(
                'h-11 w-full justify-start px-3 text-base font-normal',
                county === value && 'bg-muted'
              )}
            >
              {formatCounty(county)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
