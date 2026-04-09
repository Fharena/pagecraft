export interface Product {
  id?: string
  brand: string
  name: string
  price: string
  category: string
  platform: string
  memo: string
  features: string[]
  createdAt?: string
  updatedAt?: string
}

export interface ProductImage {
  id: string
  dataUrl: string
  file?: File
  bgRemoved: boolean
  order: number
}

export interface CropState {
  imageIndex: number
  x: number
  y: number
  width: number
  height: number
}
