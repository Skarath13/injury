'use client';

import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  CALIFORNIA_COUNTIES,
  formatCounty,
  normalizeCounty,
  rankCaliforniaCountyMatches
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

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);

    updateMatches();
    mediaQuery.addEventListener('change', updateMatches);
    return () => mediaQuery.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}

function countyMatches(search: string, counties: readonly string[]) {
  const normalized = normalizeCounty(search);
  if (normalized.length < 2) return [...counties];
  return rankCaliforniaCountyMatches(search, counties.length, counties);
}

const TOUCH_SELECTION_MOVEMENT_LIMIT = 8;

export default function CountyCombobox({
  id,
  value,
  onValueChange,
  counties = CALIFORNIA_COUNTIES,
  error,
  disabled = false
}: CountyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const touchStartRef = useRef<{ county: string; x: number; y: number } | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const selectedLabel = value ? formatCounty(value) : '';
  const visibleCounties = useMemo(() => countyMatches(search, counties), [counties, search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const selectCounty = (county: string) => {
    onValueChange(county);
    setOpen(false);
  };

  const handleCountyPointerDown = (county: string) => (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;

    touchStartRef.current = {
      county,
      x: event.clientX,
      y: event.clientY
    };
  };

  const handleCountyPointerUp = (county: string) => (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;

    const touchStart = touchStartRef.current;
    touchStartRef.current = null;

    if (!touchStart || touchStart.county !== county) return;

    const movedX = Math.abs(event.clientX - touchStart.x);
    const movedY = Math.abs(event.clientY - touchStart.y);
    if (movedX > TOUCH_SELECTION_MOVEMENT_LIMIT || movedY > TOUCH_SELECTION_MOVEMENT_LIMIT) return;

    event.preventDefault();
    event.stopPropagation();
    selectCounty(county);
  };

  const clearCountyPointerSelection = () => {
    touchStartRef.current = null;
  };

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      size="lg"
      disabled={disabled}
      role="combobox"
      aria-expanded={open}
      aria-invalid={Boolean(error)}
      className={cn(
        'h-11 w-full justify-between px-3 text-left text-base font-normal',
        !selectedLabel && 'text-muted-foreground'
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Search data-icon="inline-start" />
        <span className="truncate">{selectedLabel || 'Search county'}</span>
      </span>
      <ChevronsUpDown data-icon="inline-end" />
    </Button>
  );

  const countyCommand = (
    <Command shouldFilter={false} className="rounded-none border-0 shadow-none">
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Type county name"
        autoFocus
      />
      <CommandList className="max-h-[min(58dvh,22rem)]">
        {visibleCounties.length > 0 ? (
          <CommandGroup heading={normalizeCounty(search).length < 2 ? 'California counties' : 'Matches'}>
            {visibleCounties.map((county) => (
              <CommandItem
                key={county}
                value={county}
                data-checked={county === value}
                onSelect={() => selectCounty(county)}
                onPointerDown={handleCountyPointerDown(county)}
                onPointerUp={handleCountyPointerUp(county)}
                onPointerCancel={clearCountyPointerSelection}
                className="min-h-11 text-base"
              >
                <span>{formatCounty(county)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <CommandEmpty>No California county found.</CommandEmpty>
        )}
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[88dvh] pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader className="pb-2 text-left">
            <DrawerTitle>Accident county</DrawerTitle>
            <DrawerDescription className="sr-only">
              Select the California county where the accident happened.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {countyCommand}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        {countyCommand}
      </PopoverContent>
    </Popover>
  );
}
