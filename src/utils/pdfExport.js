import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportToPDF(elementId, filename) {
  const el = document.getElementById(elementId)
  if (!el) throw new Error('Element not found: ' + elementId)

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: true,
    width: el.scrollWidth,
    height: el.scrollHeight,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  })

  if (!canvas.width || !canvas.height) {
    throw new Error('Canvas has zero dimensions — element may not be visible')
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.92)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgRatio = canvas.height / canvas.width
  const imgHeightMm = pageWidth * imgRatio

  if (imgHeightMm <= pageHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeightMm)
  } else {
    const pxPerMm = canvas.width / pageWidth
    const pageHeightPx = Math.floor(pageHeight * pxPerMm)
    let yOffset = 0
    while (yOffset < canvas.height) {
      const sliceH = Math.min(pageHeightPx, canvas.height - yOffset)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceH
      const ctx = sliceCanvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(canvas, 0, -yOffset)
      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92)
      if (yOffset > 0) pdf.addPage()
      pdf.addImage(sliceData, 'JPEG', 0, 0, pageWidth, sliceH / pxPerMm)
      yOffset += pageHeightPx
    }
  }

  pdf.save(filename)
}
