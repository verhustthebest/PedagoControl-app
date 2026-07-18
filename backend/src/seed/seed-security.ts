export function assertSeedAllowed(kind: 'admin' | 'demo', environment = process.env.NODE_ENV) {
  if (environment === 'production') throw new Error(`${kind} seed is disabled in production`)
}

export function seedPassword(name: 'ADMIN_SEED_PASSWORD' | 'DEMO_SEED_PASSWORD') {
  const value = process.env[name]
  if (!value || value.length < 12 || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) {
    throw new Error(`${name} must be configured with a strong development-only password`)
  }
  return value
}
