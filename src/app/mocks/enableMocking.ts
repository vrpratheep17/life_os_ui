export async function enableMocking() {
  if (!import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { worker } = await import('./browser')
  await worker.start({
    quiet: true,
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error()
    },
  })
}
