/**
 * Error handler - catches browser errors and sends to error-daemon collector
 */

const DEFAULT_COLLECTOR = 'http://localhost:4098/error';

let source = 'unknown';
let collectorUrl = DEFAULT_COLLECTOR;

function send(error) {
  try {
    fetch(collectorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        message: error.message || String(error),
        stack: error.stack || null,
        url: window.location ? window.location.href : null
      })
    }).catch(() => {}); // Swallow - never throw from error handler
  } catch (e) {
    // Swallow
  }
}

function handleError(message, url, line, col, error) {
  send({
    message: message,
    stack: error ? error.stack : `at ${url}:${line}:${col}`
  });
  return false; // Don't prevent default handling
}

function handleRejection(event) {
  const reason = event.reason;
  send({
    message: 'Unhandled Promise Rejection: ' + (reason ? reason.message || reason : 'unknown'),
    stack: reason ? reason.stack : null
  });
}

export function initErrorHandler(appSource, customCollectorUrl) {
  source = appSource || 'unknown';
  collectorUrl = customCollectorUrl || DEFAULT_COLLECTOR;

  window.onerror = handleError;
  window.onunhandledrejection = handleRejection;

  console.log(`[error-handler] Initialized for ${source} → ${collectorUrl}`);
}

export function reportError(error) {
  send(error instanceof Error ? error : { message: String(error) });
}
