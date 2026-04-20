const MAX_SIZE = 4096
const QUALITY = 0.92

export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          } else {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(mimeType, QUALITY))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return new Blob([array], { type: mime })
}

export function cropImage(
  dataUrl: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * 서버 전송용 이미지 리사이즈
 * @param maxSize 최대 픽셀 (가로/세로 중 긴 쪽)
 * @param quality JPEG 품질 (0~1)
 */
export function resizeForUpload(dataUrl: string, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/** AI 텍스트 분석용 — 400px, 품질 0.5 (Gemini가 내용만 파악) */
export function compressForAI(dataUrl: string) {
  return resizeForUpload(dataUrl, 400, 0.5)
}

/** AI 이미지 생성/배경제거용 — 1024px, 품질 0.9 (Gemini 출력 품질 보존) */
export function compressForImageGen(dataUrl: string) {
  return resizeForUpload(dataUrl, 1024, 0.9)
}

/** 서버 렌더링 전송용 — 780px, 품질 0.75 (Vercel 4.5MB 대응) */
export function compressForRender(dataUrl: string) {
  return resizeForUpload(dataUrl, 780, 0.75)
}

/**
 * 배경 제거 결과 후처리 — 연한 회색/흰색 배경을 순수 #FFFFFF로 강제
 * Gemini가 완벽한 흰색을 못 만드는 문제 해결
 *
 * @param threshold 이 값 이상인 RGB는 순수 흰색으로 치환 (기본 245)
 */
export function whitenNearWhite(dataUrl: string, threshold: number = 245): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // RGB 3채널 모두 threshold 이상 + 비교적 균일(회색조)이면 순수 흰색으로
        const minVal = Math.min(r, g, b)
        const maxVal = Math.max(r, g, b)
        const isNearWhite = minVal >= threshold && (maxVal - minVal) < 30
        if (isNearWhite) {
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
        }
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
