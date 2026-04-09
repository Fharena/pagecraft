export interface TemplateColors {
  bg: string
  black: string
  gold: string
  yellow: string
  dark: string
  lgray: string
  ivory: string
}

export interface TemplateConfig {
  name: string
  width: number
  colors: TemplateColors
  fonts: {
    regular: string
    bold: string
  }
}

const baseTemplate: TemplateConfig = {
  name: 'base',
  width: 800,
  colors: {
    bg: '#ffffff',
    black: '#0f0f0f',
    gold: '#c8a050',
    yellow: '#ffc800',
    dark: '#161616',
    lgray: '#d2d2d2',
    ivory: '#f8f7f4',
  },
  fonts: {
    regular: 'KoreanRegular',
    bold: 'KoreanBold',
  },
}

export function getTemplateConfig(templateName?: string): TemplateConfig {
  // 추후 템플릿 확장 시 templateName으로 분기
  if (templateName === 'fashion') {
    return {
      ...baseTemplate,
      name: 'fashion',
      colors: {
        ...baseTemplate.colors,
        gold: '#c8a050',
        ivory: '#f8f7f4',
      },
    }
  }
  return baseTemplate
}
