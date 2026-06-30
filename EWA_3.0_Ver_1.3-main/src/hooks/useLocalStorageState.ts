import { useEffect, useState } from 'react';
import { loadState, saveState } from '../data';

/**
 * Combines useState + the localStorage load/save useEffect pair into one
 * call. App.tsx previously repeated this pattern 11 times (one
 * useState + one useEffect per slice of state) — this collapses each
 * occurrence to a single line.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  hydrate?: (loaded: T) => T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const loaded = loadState(key, defaultValue);
    return hydrate ? hydrate(loaded) : loaded;
  });

  useEffect(() => {
    saveState(key, value);
  }, [key, value]);

  return [value, setValue];
}
