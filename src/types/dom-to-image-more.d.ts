declare module 'dom-to-image-more' {
  const domtoimage: {
    toBlob: (node: HTMLElement, options?: Record<string, unknown>) => Promise<Blob>
    toPng: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>
    toJpeg: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>
    toSvg: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>
  }
  export default domtoimage
}
