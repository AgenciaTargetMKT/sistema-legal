// Store de caché simple para datos compartidos
class CacheStore {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  }

  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return null;

    // Verificar si el caché expiró
    if (Date.now() - timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear(key) {
    if (key) {
      this.cache.delete(key);
      this.timestamps.delete(key);
    } else {
      this.cache.clear();
      this.timestamps.clear();
    }
  }

  // Método para invalidar caché relacionado
  invalidatePattern(pattern) {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.clear(key);
      }
    });
  }
}

export const cacheStore = new CacheStore();

// Funciones helper para consultas comunes
export const getCachedQuery = async (key, queryFn) => {
  const cached = cacheStore.get(key);
  if (cached) {
 
    return cached;
  }

  const data = await queryFn();
  cacheStore.set(key, data);
  return data;
};

// Invalidar caché cuando hay cambios
export const invalidateCache = (pattern) => {
    
  cacheStore.invalidatePattern(pattern);
};
