'use client'

import { useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { compressImage } from '@/lib/image'

export function useImageUpload() {
  const { addImages } = useImageStore()

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith('image/'),
      )
      if (fileArray.length === 0) return

      const compressed = await Promise.all(fileArray.map(compressImage))
      addImages(compressed)
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
