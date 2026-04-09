import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { GeneratedContent, GeneratedTitle, GeneratedTag } from '@/types/ai'

type ActiveTab = 'copy' | 'title' | 'tags' | 'export'

interface EditorState {
  // 세션 유지되는 데이터
  generatedContent: GeneratedContent | null
  generatedTitles: GeneratedTitle[]
  generatedTags: GeneratedTag[]
  activeTab: ActiveTab

  // 세션 유지 안 됨 (blob URL, 로딩 상태)
  renderedImageUrl: string | null
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

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'pagecraft-editor',
      storage: createJSONStorage(() => sessionStorage),
      // blob URL과 로딩 상태는 저장하지 않음
      partialize: (state) => ({
        generatedContent: state.generatedContent,
        generatedTitles: state.generatedTitles,
        generatedTags: state.generatedTags,
        activeTab: state.activeTab,
      }),
    },
  ),
)
