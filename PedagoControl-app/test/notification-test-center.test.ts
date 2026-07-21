import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';const read=(p:string)=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');test('route réservée au bloc SUPER_ADMIN',()=>{const app=read('src/App.tsx'),block=app.slice(app.indexOf("allowedRoles={['SUPER_ADMIN']}"),app.indexOf('allowedRoles={DIRECTION_ROLES}'));assert.match(block,/management\/notifications\/tests/);assert.match(block,/ManagementNotificationTests/)});test('cinq workflows utilisent les endpoints réels',()=>{const page=read('src/pages/management/ManagementNotificationTests.tsx'),service=read('src/services/notificationTests.ts');for(const workflow of['PARENT_OTP','PARENT_INVITATION','ATTACHMENT_DECISION','PARENT_CONTRIBUTION_REMINDER','SCHOOL_INVOICE'])assert.ok(page.includes(workflow));assert.match(service,/notifications\/tests\/config/);assert.match(service,/notifications\/tests\/send/)});test('aucun secret OTP ou token affiché',()=>{const page=read('src/pages/management/ManagementNotificationTests.tsx');assert.doesNotMatch(page,/api[_-]?key|accessToken|csrfToken|code OTP|token réel/i);assert.match(page,/request_id/)});test('responsive sans débordement',()=>{const css=read('src/pages/management/management-notification-tests.css');for(const width of['1024px','768px','480px'])assert.ok(css.includes(width));assert.match(css,/overflow-wrap:anywhere/)});

import { apiRequest } from '../src/services/api.ts'

test('le clic de soumission déclenche le POST exact et le résultat reste affichable', async () => {
  const page = read('src/pages/management/ManagementNotificationTests.tsx')
  const service = read('src/services/notificationTests.ts')
  assert.match(page, /<form[^>]+onSubmit={submit}[^>]+noValidate/)
  assert.match(page, /<button type="submit" disabled={sending}>/)
  assert.match(page, /notificationTestsApi\.send\(\{/)
  assert.match(service, /apiRequest<TestResult>\('\/notifications\/tests\/send',\{method:'POST'/)

  let requestedUrl = ''
  let requestedOptions: RequestInit | undefined
  globalThis.fetch = async (input, options) => {
    requestedUrl = String(input)
    requestedOptions = options
    return new Response(JSON.stringify({
      public_id: 'notification-test-public-id',
      channel: 'email',
      provider: 'mailtrap',
      status: 'SENT',
      created_at: '2026-07-21T10:00:00.000Z',
      request_id: 'req-notification-test',
    }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  }

  const result = await apiRequest<{
    request_id: string
    status: string
  }>('/notifications/tests/send', {
    method: 'POST',
    body: JSON.stringify({
      workflow: 'PARENT_INVITATION', channel: 'email', destination: 'parent@example.com',
    }),
  })

  assert.equal(requestedUrl, '/api/notifications/tests/send')
  assert.equal(requestedOptions?.method, 'POST')
  assert.equal(requestedOptions?.credentials, 'include')
  assert.deepEqual(JSON.parse(String(requestedOptions?.body)), {
    workflow: 'PARENT_INVITATION', channel: 'email', destination: 'parent@example.com',
  })
  assert.equal(result.request_id, 'req-notification-test')
  assert.equal(result.status, 'SENT')
})
