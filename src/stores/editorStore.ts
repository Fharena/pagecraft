import { create } from 'zustand'
import type { GeneratedContent, GeneratedTitle, GeneratedTag } from '@/types/ai'

type ActiveTab = 'copy' | 'title' | 'tags' | 'export'

interface EditorState {
  generatedContent: GeneratedContent | null
  generatedTitles: GeneratedTitle[]
  generatedTags: GeneratedTag[]
  renderedImageUrl: string | null
  activeTab: ActiveTab

  isGenerating: boolean
  isRenderingPng: boolean
  isGeneratingTitles: boolean
  isGeneratingTags: boolean
  loadingMessage: string

  setGeneratedContent: (content: GeneratedContent | null) => void
  setGeneratedTitles: (titles: GeneratedTitle[]) => void
  setGeneratedTags: (tags: GeneratedTag[]) => void
  setRenderedImageUrl: (url: string | null) => void
  setActiveTab: (tab: ActiveTab) => void
  setIsGenerating: (loading: boolean) => void
  setIsRenderingPng: (loading: boolean) => void
  setIsGeneratingTitles: (loading: boolean) => void
  setIsGeneratingTags: (loading: boolean) => void
  setLoadingMessage: (message: string) => void
  resetEditor: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  generatedContent: null,
  generatedTitles: [],
  generatedTags: [],
  renderedImageUrl: null,
  activeTab: 'copy',

  isGenerating: false,
  isRenderingPng: false,
  isGeneratingTitles: false,
  isGeneratingTags: false,
  loadingMessage: '',

  setGeneratedContent: (content) => set({ generatedContent: content }),
  setGeneratedTitles: (titles) => set({ generatedTitles: titles }),
  setGeneratedTags: (tags) => set({ generatedTags: tags }),
  setRenderedImageUrl: (url) => set({ renderedImageUrl: url }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsGenerating: (loading) => set({ isGenerating: loading }),
  setIsRenderingPng: (loading) => set({ isRenderingPng: loading }),
  setIsGeneratingTitles: (loading) => set({ isGeneratingTitles: loading }),
  setIsGeneratingTags: (loading) => set({ isGeneratingTags: loading }),
  setLoadingMessage: (message) => set({ loadingMessage: message }),
  resetEditor: () =>
    set({
      generatedContent: null,
      generatedTitles: [],
      generatedTags: [],
      renderedImageUrl: null,
      activeTab: 'copy',
      isGenerating: false,
      isRenderingPng: false,
      isGeneratingTitles: false,
      isGeneratingTags: false,
      loadingMessage: '',
    }),
}))
