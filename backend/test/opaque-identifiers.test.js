const test = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('crypto')
const prisma = require('../dist/prisma/client').default
const { issueActionToken, consumeActionToken, ActionTokenError } = require('../dist/services/action-token.service')
const { publicInvoiceView, isPublicId } = require('../dist/security/public-id')
const { redact } = require('../dist/middleware/request-context.middleware')

function mockStore(callback) {
  const records = new Map()
  const originals = {
    transaction: prisma.$transaction,
    findUnique: prisma.action_tokens.findUnique,
    updateMany: prisma.action_tokens.updateMany,
  }
  const update = async ({ where, data }) => {
    let count = 0
    for (const record of records.values()) {
      const matches = (!where.id || record.id === where.id)
        && (!where.action || record.action === where.action)
        && (!where.user_id || record.user_id === where.user_id)
        && (!where.guardian_id || record.guardian_id === where.guardian_id)
        && (!where.school_invoice_id || record.school_invoice_id === where.school_invoice_id)
        && (where.used_at !== null || record.used_at === null)
        && (where.revoked_at !== null || record.revoked_at === null)
        && (!where.expires_at?.gt || record.expires_at > where.expires_at.gt)
      if (matches) { Object.assign(record, data); count += 1 }
    }
    return { count }
  }
  prisma.$transaction = async work => work({ action_tokens: {
    updateMany: update,
    create: async ({ data }) => { const record = { ...data, used_at: null, revoked_at: null, created_at: new Date() }; records.set(data.id, record); return record },
  } })
  prisma.action_tokens.findUnique = async ({ where }) => records.get(where.id) ?? null
  prisma.action_tokens.updateMany = update
  return Promise.resolve().then(() => callback(records)).finally(() => {
    prisma.$transaction = originals.transaction
    prisma.action_tokens.findUnique = originals.findUnique
    prisma.action_tokens.updateMany = originals.updateMany
  })
}

test('public UUIDs are opaque, valid, and unique', () => {
  const first = randomUUID()
  const second = randomUUID()
  assert.equal(isPublicId(first), true)
  assert.equal(isPublicId(second), true)
  assert.notEqual(first, second)
  assert.equal(isPublicId('../1'), false)
})

test('raw action token is never stored and valid token is single-use', async () => mockStore(async records => {
  const issued = await issueActionToken('contact_confirmation', { userId: '10' }, 5)
  const record = [...records.values()][0]
  assert.equal(record.token_hash.length, 64)
  assert.equal(JSON.stringify(record, (_, value) => typeof value === 'bigint' ? value.toString() : value).includes(issued.token), false)
  await consumeActionToken(issued.token, 'contact_confirmation', { userId: '10' })
  await assert.rejects(() => consumeActionToken(issued.token, 'contact_confirmation'), ActionTokenError)
}))

test('expired token and token used for another action are refused', async () => mockStore(async records => {
  const issued = await issueActionToken('invitation', { userId: '11' }, 5)
  await assert.rejects(() => consumeActionToken(issued.token, 'password_reset'), ActionTokenError)
  const record = [...records.values()][0]
  record.expires_at = new Date(Date.now() - 1)
  await assert.rejects(() => consumeActionToken(issued.token, 'invitation'), ActionTokenError)
}))

test('reissuing an equivalent token revokes the previous token', async () => mockStore(async records => {
  const first = await issueActionToken('password_reset', { userId: '12' }, 5)
  const second = await issueActionToken('password_reset', { userId: '12' }, 5)
  assert.notEqual(first.token, second.token)
  await assert.rejects(() => consumeActionToken(first.token, 'password_reset'), ActionTokenError)
  await consumeActionToken(second.token, 'password_reset')
  assert.equal([...records.values()].filter(record => record.revoked_at).length, 1)
}))

test('invoice token cannot be used for another invoice', async () => mockStore(async () => {
  const publicId = randomUUID()
  const issued = await issueActionToken('invoice_download', { invoiceId: '20', resourcePublicId: publicId }, 5)
  await assert.rejects(() => consumeActionToken(issued.token, 'invoice_download', { invoiceId: '21' }), ActionTokenError)
  await assert.rejects(() => consumeActionToken(issued.token, 'invoice_download', { resourcePublicId: randomUUID() }), ActionTokenError)
  await consumeActionToken(issued.token, 'invoice_download', { invoiceId: '20', resourcePublicId: publicId })
}))

test('new sensitive invoice response exposes public_id but no internal id or storage path', () => {
  const view = publicInvoiceView({
    id: 99n, public_id: randomUUID(), invoice_number: 'PAR-001', invoice_type: 'parental_tracking',
    issue_date: new Date(), due_date: new Date(), total_amount: '10.00', currency: 'USD', status: 'issued', pdf_url: 'C:\\internal\\invoice.pdf',
  })
  assert.equal('id' in view, false)
  assert.equal('pdf_url' in view, false)
  assert.equal(isPublicId(view.public_id), true)
})

test('generated links contain only opaque token data and logs redact it', async () => mockStore(async () => {
  const issued = await issueActionToken('parent_activation', { guardianId: '30', resourcePublicId: randomUUID() }, 5)
  const path = `/activation-parent?token=${encodeURIComponent(issued.token)}`
  assert.equal(path.includes('parent@example.test'), false)
  assert.equal(path.includes('+243810000000'), false)
  assert.equal(JSON.stringify(redact({ token: issued.token, path })).includes(issued.token), false)
}))
