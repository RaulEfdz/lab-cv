import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'
import crypto from 'crypto'
import type { CvJson } from '@/lib/types/cv-lab'

// =============================================================================
// PDF GENERATOR FOR CV LAB
// Generates professional PDF from CvJson
// =============================================================================

interface PdfFonts {
  regular: PDFFont
  bold: PDFFont
}

interface DrawTextOptions {
  x: number
  y: number
  size: number
  font: PDFFont
  color?: { r: number; g: number; b: number }
  maxWidth?: number
}

const COLORS = {
  black: { r: 0, g: 0, b: 0 },
  darkGray: { r: 0.2, g: 0.2, b: 0.2 },
  gray: { r: 0.4, g: 0.4, b: 0.4 },
  lightGray: { r: 0.6, g: 0.6, b: 0.6 },
  accent: { r: 0.15, g: 0.35, b: 0.6 } // Professional blue
}

const MARGINS = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50
}

const PAGE_WIDTH = 612 // Letter size
const PAGE_HEIGHT = 792
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right

/**
 * Sanitize text to ensure it is compatible with WinAnsi encoding (standard PDF fonts)
 */
function sanitizeText(text: string | undefined | null): string {
  if (!text) return ''
  return text
    .replace(/\u2011/g, '-') // Non-breaking hyphen
    .replace(/\u2013/g, '-') // En dash
    .replace(/\u2014/g, '-') // Em dash
    .replace(/\u2018/g, "'") // Left single quote
    .replace(/\u2019/g, "'") // Right single quote
    .replace(/\u201c/g, '"') // Left double quote
    .replace(/\u201d/g, '"') // Right double quote
}

/**
 * Word wrap text to fit within a maximum width
 */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)

    if (width <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
}

/**
 * Draw text with word wrapping, returns new Y position
 */
function drawWrappedText(
  page: PDFPage,
  text: string,
  options: DrawTextOptions,
  lineHeight: number = 1.4
): number {
  const { x, y, size, font, color = COLORS.black, maxWidth = CONTENT_WIDTH } = options
  const lines = wrapText(text, font, size, maxWidth)
  let currentY = y

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      font,
      color: rgb(color.r, color.g, color.b)
    })
    currentY -= size * lineHeight
  }

  return currentY
}

/**
 * Draw a horizontal line
 */
function drawLine(page: PDFPage, y: number, color = COLORS.lightGray) {
  page.drawLine({
    start: { x: MARGINS.left, y },
    end: { x: PAGE_WIDTH - MARGINS.right, y },
    thickness: 0.5,
    color: rgb(color.r, color.g, color.b)
  })
}

/**
 * Generate a professional PDF from CV JSON
 */
export async function generateCvPdf(cvJson: CvJson): Promise<{
  pdfBytes: Uint8Array
  renderHash: string
}> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  const fonts: PdfFonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  }

  let y = PAGE_HEIGHT - MARGINS.top

  // =========================================================================
  // HEADER SECTION
  // =========================================================================

  // Name
  page.drawText(sanitizeText(cvJson.header.fullName || 'Your Name'), {
    x: MARGINS.left,
    y,
    size: 24,
    font: fonts.bold,
    color: rgb(COLORS.black.r, COLORS.black.g, COLORS.black.b)
  })
  y -= 28

  // Headline
  if (cvJson.header.headline) {
    page.drawText(sanitizeText(cvJson.header.headline), {
      x: MARGINS.left,
      y,
      size: 12,
      font: fonts.regular,
      color: rgb(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b)
    })
    y -= 18
  }

  // Contact info line
  const contactParts = [
    cvJson.header.email,
    cvJson.header.phone,
    cvJson.header.location
  ].filter(Boolean)

  if (contactParts.length > 0) {
    page.drawText(sanitizeText(contactParts.join(' | ')), {
      x: MARGINS.left,
      y,
      size: 10,
      font: fonts.regular,
      color: rgb(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b)
    })
    y -= 16
  }

  // Links
  if (cvJson.header.links.length > 0) {
    const linksText = cvJson.header.links.map(l => l.url).join(' | ')
    page.drawText(sanitizeText(linksText), {
      x: MARGINS.left,
      y,
      size: 9,
      font: fonts.regular,
      color: rgb(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b)
    })
    y -= 20
  }

  drawLine(page, y)
  y -= 20

  // =========================================================================
  // SUMMARY SECTION
  // =========================================================================

  if (cvJson.summary) {
    page.drawText('RESUMEN PROFESIONAL', {
      x: MARGINS.left,
      y,
      size: 11,
      font: fonts.bold,
      color: rgb(COLORS.black.r, COLORS.black.g, COLORS.black.b)
    })
    y -= 16

    y = drawWrappedText(page, sanitizeText(cvJson.summary), {
      x: MARGINS.left,
      y,
      size: 10,
      font: fonts.regular,
      color: COLORS.darkGray,
      maxWidth: CONTENT_WIDTH
    }, 1.5)

    y -= 15
    drawLine(page, y)
    y -= 20
  }

  // =========================================================================
  // EXPERIENCE SECTION
  // =========================================================================

  if (cvJson.experience.length > 0) {
    page.drawText('EXPERIENCIA PROFESIONAL', {
      x: MARGINS.left,
      y,
      size: 11,
      font: fonts.bold,
      color: rgb(COLORS.black.r, COLORS.black.g, COLORS.black.b)
    })
    y -= 18

    for (const exp of cvJson.experience) {
      // Role and Company
      const roleCompany = `${exp.role} - ${exp.company}`
      page.drawText(sanitizeText(roleCompany), {
        x: MARGINS.left,
        y,
        size: 11,
        font: fonts.bold,
        color: rgb(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b)
      })
      y -= 14

      // Date and Location
      const dateLocation = `${exp.startDate} - ${exp.endDate || 'Presente'} | ${exp.location}`
      page.drawText(sanitizeText(dateLocation), {
        x: MARGINS.left,
        y,
        size: 9,
        font: fonts.regular,
        color: rgb(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b)
      })
      y -= 14

      // Bullets
      for (const bullet of exp.bullets) {
        const bulletText = `• ${bullet}`
        y = drawWrappedText(page, sanitizeText(bulletText), {
          x: MARGINS.left + 10,
          y,
          size: 10,
          font: fonts.regular,
          color: COLORS.darkGray,
          maxWidth: CONTENT_WIDTH - 10
        }, 1.4)
        y -= 2
      }

      y -= 10

      // Check if we need a new page
      if (y < MARGINS.bottom + 100) {
        // For MVP, just stop adding content (one-page constraint)
        break
      }
    }

    y -= 5
    drawLine(page, y)
    y -= 20
  }

  // =========================================================================
  // EDUCATION SECTION
  // =========================================================================

  if (cvJson.education.length > 0 && y > MARGINS.bottom + 80) {
    page.drawText('EDUCACIÓN', {
      x: MARGINS.left,
      y,
      size: 11,
      font: fonts.bold,
      color: rgb(COLORS.black.r, COLORS.black.g, COLORS.black.b)
    })
    y -= 16

    for (const edu of cvJson.education) {
      page.drawText(sanitizeText(`${edu.degree}${edu.field ? ` en ${edu.field}` : ''}`), {
        x: MARGINS.left,
        y,
        size: 10,
        font: fonts.bold,
        color: rgb(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b)
      })
      y -= 14

      page.drawText(sanitizeText(`${edu.institution} | ${edu.dates}`), {
        x: MARGINS.left,
        y,
        size: 9,
        font: fonts.regular,
        color: rgb(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b)
      })
      y -= 16

      if (y < MARGINS.bottom + 60) break
    }

    y -= 5
    drawLine(page, y)
    y -= 20
  }

  // =========================================================================
  // SKILLS SECTION
  // =========================================================================

  if ((cvJson.skills.hard.length > 0 || cvJson.skills.soft.length > 0) && y > MARGINS.bottom + 50) {
    page.drawText('HABILIDADES', {
      x: MARGINS.left,
      y,
      size: 11,
      font: fonts.bold,
      color: rgb(COLORS.black.r, COLORS.black.g, COLORS.black.b)
    })
    y -= 16

    if (cvJson.skills.hard.length > 0) {
      const hardSkills = `Técnicas: ${cvJson.skills.hard.join(', ')}`
      y = drawWrappedText(page, sanitizeText(hardSkills), {
        x: MARGINS.left,
        y,
        size: 10,
        font: fonts.regular,
        color: COLORS.darkGray,
        maxWidth: CONTENT_WIDTH
      }, 1.4)
      y -= 4
    }

    if (cvJson.skills.soft.length > 0 && y > MARGINS.bottom + 30) {
      const softSkills = `Blandas: ${cvJson.skills.soft.join(', ')}`
      y = drawWrappedText(page, sanitizeText(softSkills), {
        x: MARGINS.left,
        y,
        size: 10,
        font: fonts.regular,
        color: COLORS.darkGray,
        maxWidth: CONTENT_WIDTH
      }, 1.4)
    }
  }

  // Generate PDF bytes and hash
  const pdfBytes = await pdfDoc.save()
  const renderHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(cvJson))
    .digest('hex')
    .substring(0, 64)

  return { pdfBytes, renderHash }
}

/**
 * Generate a preview PDF with watermark
 */
export async function generatePreviewPdf(cvJson: CvJson): Promise<Uint8Array> {
  const { pdfBytes } = await generateCvPdf(cvJson)

  // For preview, we could add a watermark here
  // For now, just return the same PDF
  return pdfBytes
}
