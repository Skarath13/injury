const currentStorage = globalThis.localStorage as Storage | undefined;

if (!currentStorage || typeof currentStorage.getItem !== 'function') {
  const storageShim: Storage = {
    get length() {
      return 0;
    },
    clear() {},
    getItem() {
      return null;
    },
    key() {
      return null;
    },
    removeItem() {},
    setItem() {}
  };

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storageShim
  });
}

export {};
