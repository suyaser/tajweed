/**
 * Saves a text file. JSON backups go through the share sheet when the browser can share files
 * (iOS home-screen apps drop <a download> blob links); otherwise a download link that stays valid for a minute.
 */
export function download(name: string, text: string, type = 'application/json') {
  const file = typeof File === 'function' ? new File([text], name, { type }) : null
  if (type === 'application/json' && file && navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file] }).catch((e: DOMException) => { if (e?.name !== 'AbortError') link(name, text, type) })
    return
  }
  link(name, text, type)
}

function link(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
