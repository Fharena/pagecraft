export interface GeneratedContent {
  product_name: string
  subtitle: string
  main_copy: string
  selling_points: string[]
  description: string
  specs: SpecItem[]
  keywords: string[]
  caution: string
}

export interface SpecItem {
  key: string
  value: string
}

export interface GeneratedTitle {
  rank: number
  strategy: string
  title: string
  used_keywords: string[]
  char_count: number
}

export interface GeneratedTag {
  text: string
  isTrending: boolean
}

export interface AIGenerateRequest {
  images: string[]
  brand: string
  productName: string
  price: string
  category: string
  platform: string
  memo: string
  features: string[]
}

export interface AITitleRequest {
  productName: string
  category: string
  brand: string
  keywords: string[]
  coupangSuggestions: string[]
}

export interface AITagRequest {
  productName: string
  category: string
  brand: string
  generatedContent?: GeneratedContent
  coupangSuggestions: string[]
}

export interface AIModelImageRequest {
  productName: string
  category: string
  gender: 'male' | 'female'
  images: string[]
}

export interface RenderRequest {
  data: GeneratedContent
  price: string
  images: string[]
  storeIntroImage?: string
  termsImage?: string
}
