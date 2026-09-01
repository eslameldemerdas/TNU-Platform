/**
 * Universal safe API error message extractor.
 * Prevents React child rendering errors when backend returns structured error objects { code, message }.
 */
export function parseApiError(data: any, fallbackMessage: string = 'حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.'): string {
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return data;
  if (typeof data.error === 'string') return data.error;
  if (data.error && typeof data.error.message === 'string') return data.error.message;
  if (typeof data.errorMessage === 'string') return data.errorMessage;
  if (typeof data.errorString === 'string') return data.errorString;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.details === 'string') return data.details;
  if (data.error && typeof data.error.details === 'string') return data.error.details;
  return fallbackMessage;
}
