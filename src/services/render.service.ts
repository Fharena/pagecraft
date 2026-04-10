/* eslint-disable @typescript-eslint/no-explicit-any */
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import type { RenderRequest } from '@/types/ai'
import { getTemplateConfig, type TemplateConfig } from '@/templates/base.template'

const FONT_CDN_URLS = [
  'https://cdn.jsdelivr.net/gh/nicekid1/Pretendard@latest/packages/pretendard/dist/public/static/Pretendard-Regular.otf',
  'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk/Sans/OTF/Korean/NotoSansCJKkr-Regular.otf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-400-normal.otf',
]

const FONT_CDN_BOLD_URLS = [
  'https://cdn.jsdelivr.net/gh/nicekid1/Pretendard@latest/packages/pretendard/dist/public/static/Pretendard-Black.otf',
  'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk/Sans/OTF/Korean/NotoSansCJKkr-Black.otf',
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-900-normal.otf',
]

let fontsLoaded = false

async function downloadFont(urls: string[], savePath: string): Promise<boolean> {
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) continue
      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.length < 1000) continue
      const dir = savePath.substring(0, savePath.lastIndexOf('/'))
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      writeFileSync(savePath, buffer)
      return true
    } catch {
      continue
    }
  }
  return false
}

async function ensureFonts(): Promise<void> {
  if (fontsLoaded) return

  const fontDirs = [
    join(process.cwd(), 'fonts'),
    join(process.cwd(), 'public', 'fonts'),
    '/tmp/pagecraft-fonts',
  ]

  let regularLoaded = false
  let boldLoaded = false

  for (const dir of fontDirs) {
    if (!existsSync(dir)) continue
    const files = readdirSync(dir)
    for (const f of files) {
      const lower = f.toLowerCase()
      const path = join(dir, f)
      if (
        (lower.includes('regular') || lower.includes('400')) &&
        (lower.endsWith('.otf') || lower.endsWith('.ttf'))
      ) {
        GlobalFonts.registerFromPath(path, 'KoreanRegular')
        regularLoaded = true
      }
      if (
        (lower.includes('bold') || lower.includes('black') || lower.includes('900')) &&
        (lower.endsWith('.otf') || lower.endsWith('.ttf'))
      ) {
        GlobalFonts.registerFromPath(path, 'KoreanBold')
        boldLoaded = true
      }
    }
  }

  const cacheDir = '/tmp/pagecraft-fonts'
  if (!regularLoaded) {
    const path = `${cacheDir}/regular.otf`
    if (existsSync(path) || (await downloadFont(FONT_CDN_URLS, path))) {
      GlobalFonts.registerFromPath(path, 'KoreanRegular')
      regularLoaded = true
    }
  }
  if (!boldLoaded) {
    const path = `${cacheDir}/bold.otf`
    if (existsSync(path) || (await downloadFont(FONT_CDN_BOLD_URLS, path))) {
      GlobalFonts.registerFromPath(path, 'KoreanBold')
      boldLoaded = true
    }
  }

  if (!regularLoaded) {
    console.warn('한글 Regular 폰트 로드 실패 — 기본 폰트 사용')
  }
  if (!boldLoaded) {
    console.warn('한글 Bold 폰트 로드 실패 — 기본 폰트 사용')
  }

  fontsLoaded = true
}

function drawImageCover(
  ctx: any,
  img: any,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const imgRatio = img.width / img.height
  const boxRatio = dw / dh
  let sx: number, sy: number, sw: number, sh: number

  if (imgRatio > boxRatio) {
    sh = img.height
    sw = sh * boxRatio
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / boxRatio
    sx = 0
    sy = (img.height - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  const chars = text.split('')
  let currentLine = ''

  for (const char of chars) {
    const testLine = currentLine + char
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = char
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

export async function renderDetailPage(req: RenderRequest): Promise<Buffer> {
  await ensureFonts()

  const config = getTemplateConfig()
  const { data, price, images } = req
  const W = config.width

  const loadedImages = await Promise.all(
    images.map(async (src) => {
      try {
        return await loadImage(Buffer.from(src.split(',')[1], 'base64'))
      } catch {
        return null
      }
    }),
  )

  let storeIntroImg: any = null
  if (req.storeIntroImage) {
    try {
      storeIntroImg = await loadImage(
        Buffer.from(req.storeIntroImage.split(',')[1], 'base64'),
      )
    } catch { /* ignore */ }
  }

  let termsImg: any = null
  if (req.termsImage) {
    try {
      termsImg = await loadImage(
        Buffer.from(req.termsImage.split(',')[1], 'base64'),
      )
    } catch { /* ignore */ }
  }

  const estimatedHeight = calculateHeight(config, data, loadedImages, storeIntroImg, termsImg)
  const canvas = createCanvas(W, estimatedHeight)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = config.colors.bg
  ctx.fillRect(0, 0, W, estimatedHeight)

  let y = 0

  // Store intro image
  if (storeIntroImg) {
    const h = Math.round((W / storeIntroImg.width) * storeIntroImg.height)
    drawImageCover(ctx, storeIntroImg, 0, y, W, h)
    y += h
  }

  // Header section
  ctx.fillStyle = config.colors.dark
  ctx.fillRect(0, y, W, 110)
  ctx.fillStyle = config.colors.gold
  ctx.font = `bold 28px KoreanBold, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(data.product_name || '', W / 2, y + 50)
  ctx.fillStyle = '#cccccc'
  ctx.font = `16px KoreanRegular, sans-serif`
  ctx.fillText(data.subtitle || '', W / 2, y + 80)
  y += 110

  // Main product image
  if (loadedImages[0]) {
    drawImageCover(ctx, loadedImages[0], 0, y, W, W)
    y += W
  }

  // Main copy section
  ctx.fillStyle = config.colors.ivory
  ctx.fillRect(0, y, W, 190)
  ctx.fillStyle = config.colors.gold
  ctx.fillRect(W / 2 - 30, y + 30, 60, 2)
  ctx.fillStyle = config.colors.black
  ctx.font = `bold 22px KoreanBold, sans-serif`
  ctx.textAlign = 'center'
  const mainCopyLines = wrapText(ctx, data.main_copy || '', W - 80)
  let mcY = y + 70
  for (const line of mainCopyLines) {
    ctx.fillText(line, W / 2, mcY)
    mcY += 30
  }
  y += 190

  // Selling points (3 columns)
  ctx.fillStyle = config.colors.bg
  ctx.fillRect(0, y, W, 270)
  const spArr = data.selling_points || []
  const colW = Math.floor(W / 3)
  for (let i = 0; i < 3; i++) {
    const cx = colW * i + colW / 2
    ctx.fillStyle = config.colors.gold
    ctx.font = `bold 36px KoreanBold, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`0${i + 1}`, cx, y + 50)
    ctx.fillStyle = config.colors.black
    ctx.font = `14px KoreanRegular, sans-serif`
    const spLines = wrapText(ctx, spArr[i] || '', colW - 40)
    let spY = y + 90
    for (const line of spLines) {
      ctx.fillText(line, cx, spY)
      spY += 22
    }
  }
  y += 270

  // Product story
  const descParagraphs = (data.description || '').split('\n').filter(Boolean)
  if (descParagraphs.length > 0) {
    ctx.fillStyle = config.colors.ivory
    ctx.fillRect(0, y, W, 180)
    ctx.fillStyle = config.colors.black
    ctx.font = `15px KoreanRegular, sans-serif`
    ctx.textAlign = 'center'
    const storyLines = wrapText(ctx, descParagraphs[0], W - 80)
    let storyY = y + 40
    for (const line of storyLines) {
      ctx.fillText(line, W / 2, storyY)
      storyY += 24
    }
    y += 180
  }

  // 나머지 이미지 순서대로 전부 렌더링 (index 1부터)
  for (let i = 1; i < loadedImages.length; i++) {
    const img = loadedImages[i]
    if (!img) continue
    drawImageCover(ctx, img, 0, y, W, 600)
    y += 600

    // 대응하는 설명이 있으면 표시
    const descIdx = i
    if (descParagraphs[descIdx]) {
      ctx.fillStyle = config.colors.ivory
      ctx.fillRect(0, y, W, 140)
      ctx.fillStyle = config.colors.black
      ctx.font = `15px KoreanRegular, sans-serif`
      ctx.textAlign = 'center'
      const dLines = wrapText(ctx, descParagraphs[descIdx], W - 80)
      let dY = y + 40
      for (const line of dLines) {
        ctx.fillText(line, W / 2, dY)
        dY += 24
      }
      y += 140
    }
  }

  // Specs table
  const specs = data.specs || []
  if (specs.length > 0) {
    const tableH = 60 + specs.length * 36 + 40
    ctx.fillStyle = config.colors.bg
    ctx.fillRect(0, y, W, tableH)
    ctx.fillStyle = config.colors.gold
    ctx.font = `bold 18px KoreanBold, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('SPECIFICATION', W / 2, y + 40)
    ctx.fillStyle = config.colors.gold
    ctx.fillRect(W / 2 - 30, y + 50, 60, 2)

    let specY = y + 80
    for (const spec of specs) {
      ctx.fillStyle = '#666666'
      ctx.font = `14px KoreanRegular, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(spec.key, W / 2 - 20, specY)
      ctx.fillStyle = config.colors.black
      ctx.textAlign = 'left'
      ctx.fillText(spec.value, W / 2 + 20, specY)
      specY += 36
    }
    y += tableH
  }

  // Keywords
  if (data.keywords && data.keywords.length > 0) {
    ctx.fillStyle = config.colors.ivory
    ctx.fillRect(0, y, W, 120)
    ctx.fillStyle = '#888888'
    ctx.font = `13px KoreanRegular, sans-serif`
    ctx.textAlign = 'center'
    const tagText = data.keywords.map((k) => `#${k}`).join('  ')
    const tagLines = wrapText(ctx, tagText, W - 60)
    let tagY = y + 40
    for (const line of tagLines) {
      ctx.fillText(line, W / 2, tagY)
      tagY += 22
    }
    y += 120
  }

  // Price footer
  if (price) {
    ctx.fillStyle = config.colors.dark
    ctx.fillRect(0, y, W, 90)
    ctx.fillStyle = config.colors.gold
    ctx.font = `bold 24px KoreanBold, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(`₩${Number(price).toLocaleString()}`, W / 2, y + 45)
    ctx.fillStyle = '#999999'
    ctx.font = `12px KoreanRegular, sans-serif`
    ctx.fillText(data.caution || '', W / 2, y + 72)
    y += 90
  }

  // Terms image
  if (termsImg) {
    const h = Math.round((W / termsImg.width) * termsImg.height)
    drawImageCover(ctx, termsImg, 0, y, W, h)
    y += h
  }

  return canvas.toBuffer('image/png') as unknown as Buffer
}

function calculateHeight(
  config: TemplateConfig,
  data: RenderRequest['data'],
  images: any[],
  storeIntro: any,
  terms: any,
): number {
  let h = 0
  const W = config.width

  if (storeIntro) h += Math.round((W / storeIntro.width) * storeIntro.height)
  h += 110 // header
  if (images[0]) h += W // main image
  h += 190 // main copy
  h += 270 // selling points
  if (data.description) h += 180 // story

  // 나머지 이미지 (index 1~)
  for (let i = 1; i < images.length; i++) {
    if (images[i]) h += 740 // image 600 + desc 140
  }

  if (data.specs?.length) h += 60 + data.specs.length * 36 + 40
  if (data.keywords?.length) h += 120
  h += 90 // price footer
  if (terms) h += Math.round((W / terms.width) * terms.height)

  return h + 100 // buffer
}
