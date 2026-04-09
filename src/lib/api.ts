const API_BASE = ''

interface ApiOptions extends RequestInit {
  timeout?: number
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const { timeout = 60000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '')
      throw new ApiError(res.status, errorBody || res.statusText)
    }

    const contentType = res.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return res.json()
    }

    return res.blob() as unknown as T
  } finally {
    clearTimeout(timeoutId)
  }
}

export const api = {
  get<T>(url: string, options?: ApiOptions) {
    return request<T>(url, { ...options, method: 'GET' })
  },
  post<T>(url: string, body: unknown, options?: ApiOptions) {
    return request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}

export { ApiError }
