// type Point = { x: number; y: number; z: number };
// type KPoint = { [K in keyof Point]: string };

// const p: Computed<Point, 'z', 'y'> = { x: 1, y: ({ z }) => 12, z: 44 };
// export type Computed<
//   FullObject,
//   Dep extends keyof FullObject,
//   V extends keyof Omit<FullObject, Dep>,
// > = Omit<FullObject, V> & { V: (props: Dep) => FullObject[V] };

// A type that allows properties to be either direct values or computed functions
export type Computable<T> = {
  [K in keyof T]: T[K] | ((deps: Omit<T, K>) => T[K]);
};

// Helper function for better readability (optional)
function computed<T, K extends keyof T>(
  fn: (deps: Omit<T, K>) => T[K]
): (deps: Omit<T, K>) => T[K] {
  return fn;
}

// Example usage
type Point = { x: number; y: number; z: number };

const obj = {
  x: 2,
  y: ({ x, z }) => x + z * 2, // Inferred as (deps: Omit<Point, 'y'>) => number
  z: 1,
} satisfies Computable<Point>;
console.log(computed(obj.y)(obj));
const obj2: Computable<Point> = {
  x: 5,
  y: computed<Point, 'y'>(({ x }) => x * 2), // Explicit generic parameters
  z: computed<Point, 'z'>(({ x }) => x + 2),
};

// Type guard to check if a value is a computed function
export function isComputed<T, K extends keyof T>(
  value: T[K] | ((deps: Omit<T, K>) => T[K])
): value is (deps: Omit<T, K>) => T[K] {
  return typeof value === 'function';
}

// Extract the actual value from a computable property
export function getComputedValue<T, K extends keyof T>(obj: Computable<T>, key: K): T[K] {
  const value = obj[key];
  if (isComputed<T, K>(value)) {
    const deps = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key)) as Omit<T, K>;
    return value(deps) as T[K];
  }
  return value as T[K];
}

// Get all dependencies for a computable property
export function getComputedDependencies<T, K extends keyof T>(
  obj: Computable<T>,
  key: K
): (keyof Omit<T, K>)[] {
  const value = obj[key];
  if (!isComputed<T, K>(value)) {
    return [];
  }
  return Object.keys(obj).filter(k => k !== key) as (keyof Omit<T, K>)[];
}

// Create a new object with all computable values resolved
export function resolveComputable<T>(obj: Computable<T>): T {
  const result = {} as T;
  const keys = Object.keys(obj) as (keyof T)[];

  // First pass: resolve non-computed values
  for (const key of keys) {
    const value = obj[key];
    if (!isComputed<T, keyof T>(value)) {
      result[key] = value as T[keyof T];
    }
  }

  // Second pass: resolve computed values
  for (const key of keys) {
    const value = obj[key];
    if (isComputed<T, keyof T>(value)) {
      result[key] = value(result) as T[keyof T];
    }
  }

  return result;
}

// Type for a property that can be computed from specific dependencies
export type ComputableProperty<T, K extends keyof T, D extends keyof Omit<T, K>> = {
  [P in K]: (deps: Pick<T, D>) => T[P];
};

// Example usage of new utilities
const point: Computable<Point> = {
  x: 1,
  y: ({ x, z }) => x + z,
  z: ({ x }) => x * 2,
};

// Get computed value
const yValue = getComputedValue(point, 'y'); // Resolves to 3

// Get dependencies
const yDeps = getComputedDependencies(point, 'y'); // ['x', 'z']

// Resolve entire object
const resolvedPoint = resolveComputable(point); // { x: 1, y: 3, z: 2 }
