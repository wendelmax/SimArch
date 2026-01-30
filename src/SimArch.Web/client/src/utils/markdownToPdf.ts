import { marked } from 'marked'
import html2pdf from 'html2pdf.js'

export async function markdownToPdf(markdown: string, filename: string): Promise<void> {
  const html = marked.parse(markdown, { async: false }) as string
  const styledHtml = `<div style="padding:24px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;line-height:1.5;color:#1f2937">${html}</div>`
  const pdf = html2pdf()
  await pdf.set({
    margin: 10,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(styledHtml, 'string').save()
}
