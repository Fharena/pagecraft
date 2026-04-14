'use client'

import { useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'

/** 원본 File → dataURL 변환 (압축 없음, 서버에 안 보내니까) */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useImageUpload() {
  const { addImages } = useImageStore()

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith('image/'),
      )
      if (fileArray.length === 0) return

      const dataUrls = await Promise.all(fileArray.map(fileToDataUrl))
      addImages(dataUrls)
    },
    [addImages],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return { handleFiles, handleDrop, handleDragOver }
}
