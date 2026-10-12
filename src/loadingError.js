const container = document.getElementById('loading-error')
const message = document.getElementById('loading-error-message')
const retryButton = document.getElementById('retry-loading')

export function showLoadingError(text, retry) {
  message.textContent = text
  retryButton.hidden = !retry
  retryButton.onclick = retry || null
  container.hidden = false
}

export function clearLoadingError() {
  container.hidden = true
  retryButton.onclick = null
}
