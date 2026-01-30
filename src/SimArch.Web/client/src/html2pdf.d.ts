declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[]
    filename?: string
    image?: { type?: string; quality?: number }
    html2canvas?: Record<string, unknown>
    jsPDF?: Record<string, unknown>
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker
    from(src: string | HTMLElement, type?: string): Html2PdfWorker
    save(): Promise<void>
  }

  function html2pdf(src?: string | HTMLElement, opt?: Html2PdfOptions): Html2PdfWorker
  export default html2pdf
}
