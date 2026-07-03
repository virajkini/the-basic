import PDFDocument from 'pdfkit';
import { Profile, calculateAge } from '../models/profile.js';

type PDFDoc = InstanceType<typeof PDFDocument>;

const COLOR = {
  maroon: '#8B0000',
  gold: '#C9A86A',
  goldSoft: '#E8D5A8',
  charcoal: '#2A2A2A',
  ink: '#3F3F3F',
  muted: '#7A6A4F',
  cream: '#FFF8E7',
  paper: '#FFFEF9',
} as const;

const PAGE_MARGIN = 56;
const FONT_BODY = 'Times-Roman';
const FONT_BOLD = 'Times-Bold';
const FONT_ITALIC = 'Times-Italic';

const EMPTY = '\u2014';

interface RenderOptions {
  profile: Profile;
  photos: Buffer[];
  familyDetails?: string | null;
  /** Logo PNG — on closing page, directly under the “Made by…” line. */
  logoBuffer?: Buffer;
  /** Login mobile number (from JWT) for the Contact section. */
  contactPhone?: string;
  /**
   * Whitelist of field keys to include. When undefined/empty all fields are
   * rendered (existing behaviour). Recognised keys:
   * dob, gender, height, nativePlace, foodPreference, education, aboutMe,
   * phone, workingStatus, company, designation, workLocation, salaryRange,
   * placeOfBirth, birthTiming, gothra, nakshatra, kuldeva
   */
  includedFields?: string[];
}

const PERSONAL_KEYS = ['dob', 'gender', 'height', 'nativePlace', 'foodPreference', 'education', 'aboutMe'];
const PROFESSIONAL_KEYS = ['workingStatus', 'company', 'designation', 'workLocation', 'salaryRange'];
const JATAK_KEYS = ['placeOfBirth', 'birthTiming', 'gothra', 'nakshatra', 'kuldeva'];

export async function renderProfilePdf(opts: RenderOptions): Promise<Buffer> {
  const { profile, photos, familyDetails, logoBuffer, contactPhone, includedFields } = opts;

  const included = includedFields && includedFields.length > 0 ? new Set(includedFields) : null;
  const inc = (key: string) => !included || included.has(key);

  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: PAGE_MARGIN,
      bottom: PAGE_MARGIN,
      left: PAGE_MARGIN,
      right: PAGE_MARGIN,
    },
    info: {
      Title: `${formatName(profile)} — Bio-Data`,
      Author: 'Amgel Jodi',
      Subject: 'Matrimony Bio-Data',
      Creator: 'Amgel Jodi — https://amgeljodi.com/',
    },
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  drawCover(doc, profile, photos[0]);

  doc.addPage();
  if (!included || PERSONAL_KEYS.some(k => included.has(k))) {
    drawSection(doc, 'Personal Details', () => drawPersonalDetails(doc, profile, inc));
  }
  if (inc('phone')) {
    drawSection(doc, 'Contact Details', () => drawContactDetails(doc, contactPhone));
  }
  if (!included || PROFESSIONAL_KEYS.some(k => included.has(k))) {
    drawSection(doc, 'Professional Details', () => drawProfessionalDetails(doc, profile, inc));
  }
  if (!included || JATAK_KEYS.some(k => included.has(k))) {
    drawSection(doc, 'Astrological Details (Jatak)', () => drawAstrologicalDetails(doc, profile, inc));
  }

  const trimmedFamily = (familyDetails || '').trim();
  if (trimmedFamily) {
    drawSection(doc, 'Family Details', () => drawFamilyDetails(doc, trimmedFamily));
  }

  const galleryPhotos = photos.slice(1, 5);
  if (galleryPhotos.length > 0) {
    drawSection(doc, 'Photographs', () => drawPhotoGallery(doc, galleryPhotos));
  }

  snapCursorToSafeArea(doc);

  drawClosingPage(doc, logoBuffer);

  drawFooterOnAllPages(doc);

  doc.end();
  return done;
}

function drawCover(doc: PDFDoc, profile: Profile, primaryPhoto?: Buffer) {
  const { width, height } = doc.page;

  doc.save();
  doc.rect(0, 0, width, height).fill(COLOR.paper);
  doc.restore();

  drawDoubleBorder(doc, 32, 32, width - 64, height - 64);

  const ornamentY = 96;
  drawOrnament(doc, width / 2, ornamentY, 18);

  doc
    .fillColor(COLOR.muted)
    .font(FONT_ITALIC)
    .fontSize(11)
    .text('with reverence', 0, ornamentY + 26, { align: 'center', width });

  doc
    .fillColor(COLOR.maroon)
    .font(FONT_BOLD)
    .fontSize(34)
    .text('Bio-Data', 0, ornamentY + 52, { align: 'center', width });

  drawGoldRule(doc, width / 2 - 80, ornamentY + 102, 160);

  const fullName = formatName(profile);
  doc
    .fillColor(COLOR.charcoal)
    .font(FONT_BODY)
    .fontSize(22)
    .text(fullName, 0, ornamentY + 122, { align: 'center', width });

  const ageStr = profile.dob ? `${calculateAge(profile.dob)} years` : null;
  const subtitleParts = [
    ageStr,
    profile.height || null,
    profile.nativePlace || null,
  ].filter(Boolean) as string[];
  if (subtitleParts.length > 0) {
    doc
      .fillColor(COLOR.muted)
      .font(FONT_ITALIC)
      .fontSize(13)
      .text(subtitleParts.join('   \u2022   '), 0, ornamentY + 156, {
        align: 'center',
        width,
      });
  }

  if (primaryPhoto) {
    const photoW = 220;
    const photoH = 280;
    const photoX = (width - photoW) / 2;
    const photoY = ornamentY + 200;

    drawPhotoFrame(doc, photoX, photoY, photoW, photoH, primaryPhoto);
  }

  drawOrnament(doc, width / 2, height - 120, 14);
  doc
    .fillColor(COLOR.muted)
    .font(FONT_ITALIC)
    .fontSize(10)
    .text(`Generated on ${formatDate(new Date())}`, 0, height - 88, {
      align: 'center',
      width,
    });
}

function drawSection(doc: PDFDoc, title: string, body: () => void) {
  ensureSpace(doc, 64);

  const startX = doc.page.margins.left;
  const innerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .fillColor(COLOR.maroon)
    .font(FONT_BOLD)
    .fontSize(15)
    .text(title.toUpperCase(), startX, doc.y, {
      width: innerWidth,
      characterSpacing: 1.5,
    });

  const ruleY = doc.y + 4;
  doc.save();
  doc.lineWidth(1.2).strokeColor(COLOR.gold).moveTo(startX, ruleY).lineTo(startX + innerWidth, ruleY).stroke();
  doc.restore();

  safeMoveDown(doc, 0.55);
  body();
  sectionTrailGap(doc);
}

/** Breathing room before the next section heading. */
function sectionTrailGap(doc: PDFDoc) {
  const gap = 22;
  const bottomLimit = doc.page.height - doc.page.margins.bottom - 52;
  if (doc.y + gap <= bottomLimit) {
    doc.y += gap;
  }
}

function formatPhoneDisplay(phone: string | undefined): string {
  if (!phone || !String(phone).trim()) return '';
  const d = String(phone).replace(/\D/g, '');
  if (d.length >= 12 && d.startsWith('91')) {
    const rest = d.slice(2, 12);
    return `+91 ${rest.slice(0, 5)} ${rest.slice(5)}`.trim();
  }
  if (d.length === 10) {
    return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  }
  return phone.trim();
}

/** Avoid PDFKit creating an extra blank page when moveDown would overflow the printable area. */
function safeMoveDown(doc: PDFDoc, lines: number) {
  const lh = doc.currentLineHeight() || 14;
  const bottomLimit = doc.page.height - doc.page.margins.bottom - 52;
  if (doc.y + lh * lines <= bottomLimit) {
    doc.moveDown(lines);
  }
}

function drawPersonalDetails(doc: PDFDoc, profile: Profile, inc: (k: string) => boolean) {
  const rows: Array<[string, string]> = [];
  if (inc('dob')) {
    rows.push(['Date of Birth', profile.dob ? formatDob(profile.dob) : EMPTY]);
    rows.push(['Age', profile.dob ? `${calculateAge(profile.dob)} years` : EMPTY]);
  }
  if (inc('gender')) rows.push(['Gender', formatGender(profile.gender)]);
  if (inc('height')) rows.push(['Height', profile.height || EMPTY]);
  if (inc('nativePlace')) rows.push(['Native Place', profile.nativePlace || EMPTY]);
  if (inc('foodPreference')) rows.push(['Food Preference', formatFood(profile.foodPreference)]);
  if (inc('education')) rows.push(['Education', profile.education || EMPTY]);

  if (rows.length > 0) drawKeyValueRows(doc, rows);

  if (inc('aboutMe') && profile.aboutMe && profile.aboutMe.trim()) {
    ensureSpace(doc, 48);
    drawParagraphBlock(doc, 'About', profile.aboutMe.trim());
  }
}

function drawContactDetails(doc: PDFDoc, rawPhone?: string) {
  const phone = formatPhoneDisplay(rawPhone);
  drawKeyValueRows(doc, [['Mobile', phone || EMPTY]]);
}

function drawProfessionalDetails(doc: PDFDoc, profile: Profile, inc: (k: string) => boolean) {
  const rows: Array<[string, string]> = [];
  if (inc('workingStatus')) rows.push(['Working Status', formatWorkingStatus(profile.workingStatus)]);
  if (inc('company')) rows.push(['Company', profile.company || EMPTY]);
  if (inc('designation')) rows.push(['Designation', profile.designation || EMPTY]);
  if (inc('workLocation')) rows.push(['Work Location', profile.workLocation || EMPTY]);
  if (inc('salaryRange')) rows.push(['Salary Range', profile.salaryRange ? `${profile.salaryRange} per annum` : EMPTY]);
  if (rows.length > 0) drawKeyValueRows(doc, rows);
}

function drawAstrologicalDetails(doc: PDFDoc, profile: Profile, inc: (k: string) => boolean) {
  const rows: Array<[string, string]> = [];
  if (inc('placeOfBirth')) rows.push(['Place of Birth', profile.placeOfBirth || EMPTY]);
  if (inc('birthTiming')) rows.push(['Time of Birth', profile.birthTiming || EMPTY]);
  if (inc('gothra')) rows.push(['Gothra', profile.gothra || EMPTY]);
  if (inc('nakshatra')) rows.push(['Nakshatra', profile.nakshatra || EMPTY]);
  if (inc('kuldeva')) rows.push(['Kuldeva', profile.kuldeva || EMPTY]);
  if (rows.length > 0) drawKeyValueRows(doc, rows);
}

function drawFamilyDetails(doc: PDFDoc, text: string) {
  drawParagraphBlock(doc, null, text);
}

function drawPhotoGallery(doc: PDFDoc, photos: Buffer[]) {
  const startX = doc.page.margins.left;
  const innerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const gap = 16;
  const cellW = (innerWidth - gap) / 2;
  const cellH = cellW * 1.25;

  const rows = Math.ceil(photos.length / 2);
  for (let r = 0; r < rows; r++) {
    ensureSpace(doc, cellH + gap + 12);
    const y = doc.y;
    const i0 = r * 2;
    drawPhotoFrame(doc, startX, y, cellW, cellH, photos[i0]);
    if (i0 + 1 < photos.length) {
      drawPhotoFrame(doc, startX + cellW + gap, y, cellW, cellH, photos[i0 + 1]);
    }
    doc.y = y + cellH + gap;
  }
}

function drawKeyValueRows(doc: PDFDoc, rows: Array<[string, string]>) {
  const startX = doc.page.margins.left;
  const innerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const labelWidth = 150;
  const valueX = startX + labelWidth + 16;
  const valueWidth = innerWidth - labelWidth - 16;
  const rowGap = 6;

  for (const [label, value] of rows) {
    ensureSpace(doc, 36);
    const rowY = doc.y;

    doc
      .fillColor(COLOR.maroon)
      .font(FONT_ITALIC)
      .fontSize(11)
      .text(label, startX, rowY, { width: labelWidth, continued: false });

    const labelEndY = doc.y;

    doc
      .fillColor(COLOR.charcoal)
      .font(FONT_BODY)
      .fontSize(12)
      .text(value || EMPTY, valueX, rowY, { width: valueWidth });

    doc.y = Math.max(labelEndY, doc.y) + rowGap;
  }
}

function drawParagraphBlock(doc: PDFDoc, label: string | null, text: string) {
  const startX = doc.page.margins.left;
  const innerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  if (label) {
    ensureSpace(doc, 28);
    doc
      .fillColor(COLOR.maroon)
      .font(FONT_ITALIC)
      .fontSize(11)
      .text(label, startX, doc.y, { width: innerWidth });
    safeMoveDown(doc, 0.2);
  }

  const bodyFontSize = 12;
  const lineGap = 3;
  doc.font(FONT_BODY).fontSize(bodyFontSize);
  const textHeight = doc.heightOfString(text, {
    width: innerWidth,
    lineGap,
  });
  ensureSpace(doc, Math.min(textHeight + 24, 520));

  doc
    .fillColor(COLOR.ink)
    .font(FONT_BODY)
    .fontSize(bodyFontSize)
    .text(text, startX, doc.y, {
      width: innerWidth,
      align: 'left',
      lineGap,
    });
}

/** If the text cursor drifted past the printable area, continue on a new page. */
function snapCursorToSafeArea(doc: PDFDoc) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom - 52;
  if (doc.y > bottomLimit) {
    doc.addPage();
    doc.y = doc.page.margins.top;
  }
}

function drawDoubleBorder(doc: PDFDoc, x: number, y: number, w: number, h: number) {
  doc.save();
  doc.lineWidth(1.4).strokeColor(COLOR.maroon).rect(x, y, w, h).stroke();
  doc.lineWidth(0.6).strokeColor(COLOR.gold).rect(x + 6, y + 6, w - 12, h - 12).stroke();
  doc.restore();
}

function drawGoldRule(doc: PDFDoc, x: number, y: number, length: number) {
  doc.save();
  doc.lineWidth(0.8).strokeColor(COLOR.gold).moveTo(x, y).lineTo(x + length, y).stroke();
  doc.circle(x + length / 2, y, 2).fill(COLOR.gold);
  doc.restore();
}

function drawOrnament(doc: PDFDoc, cx: number, cy: number, size: number) {
  doc.save();
  doc
    .lineWidth(0.8)
    .strokeColor(COLOR.gold)
    .fillColor(COLOR.gold)
    .moveTo(cx, cy - size)
    .lineTo(cx + size * 0.6, cy)
    .lineTo(cx, cy + size)
    .lineTo(cx - size * 0.6, cy)
    .closePath()
    .fillAndStroke(COLOR.gold, COLOR.gold);

  doc.circle(cx - size * 1.5, cy, 1.6).fill(COLOR.gold);
  doc.circle(cx + size * 1.5, cy, 1.6).fill(COLOR.gold);
  doc.circle(cx - size * 2.2, cy, 1).fill(COLOR.goldSoft);
  doc.circle(cx + size * 2.2, cy, 1).fill(COLOR.goldSoft);
  doc.restore();
}

function drawPhotoFrame(doc: PDFDoc, x: number, y: number, w: number, h: number, photo: Buffer) {
  doc.save();
  try {
    doc.rect(x, y, w, h).clip();
    doc.image(photo, x, y, { width: w, height: h });
  } catch {
    doc.rect(x, y, w, h).fill(COLOR.cream);
  }
  doc.restore();

  doc.save();
  doc.lineWidth(1).strokeColor(COLOR.gold).rect(x, y, w, h).stroke();
  doc.lineWidth(0.4).strokeColor(COLOR.maroon).rect(x - 3, y - 3, w + 6, h + 6).stroke();
  doc.restore();
}

function drawClosingPage(doc: PDFDoc, logoBuffer?: Buffer) {
  const topMargin = doc.page.margins.top;
  /** If snapCursorToSafeArea just opened a new page, cursor is at top — do not addPage again (avoids a blank sheet). */
  const pageHasLittleContent = doc.y <= topMargin + 20;
  if (!pageHasLittleContent) {
    doc.addPage();
  }

  const { width } = doc.page;
  const inner = width - PAGE_MARGIN * 2;

  doc.x = PAGE_MARGIN;
  doc.y = PAGE_MARGIN + 42;

  doc.font(FONT_BOLD).fontSize(17).fillColor(COLOR.maroon);
  doc.text('Made by Amgel Jodi — GSB matrimony', { width: inner, align: 'center' });

  let y = doc.y + 10;
  if (logoBuffer) {
    try {
      const logoW = 42;
      doc.image(logoBuffer, (width - logoW) / 2, y, { width: logoW });
      y += logoW + 18;
    } catch {
      y += 6;
    }
  } else {
    y += 6;
  }

  doc.y = y;

  doc.font(FONT_BODY).fontSize(11).fillColor(COLOR.ink);
  doc.text('Website', { width: inner, align: 'center' });
  doc.font(FONT_BODY).fontSize(11).fillColor(COLOR.maroon);
  doc.text('https://amgeljodi.com/', {
    width: inner,
    align: 'center',
    link: 'https://amgeljodi.com/',
    underline: true,
  });

  doc.y += 14;

  doc.fillColor(COLOR.ink).text('Android app', { width: inner, align: 'center' });
  doc.fillColor(COLOR.maroon).text('Get the Amgel Jodi app', {
    width: inner,
    align: 'center',
    link: 'https://play.google.com/store/apps/details?id=com.amgeljodi.app',
    underline: true,
  });
}

function drawFooterOnAllPages(doc: PDFDoc) {
  const range = doc.bufferedPageRange();
  /** Total sheets in the document (handles buffered tail after any flush). */
  const globalTotal = range.start + range.count;
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const { width, height } = doc.page;
    const footerY = height - 32;

    doc.save();
    doc
      .lineWidth(0.35)
      .strokeColor(COLOR.goldSoft)
      .moveTo(PAGE_MARGIN, footerY - 8)
      .lineTo(width - PAGE_MARGIN, footerY - 8)
      .stroke();

    const label = `Page ${i + 1} of ${globalTotal}`;
    doc.fillColor(COLOR.muted).font(FONT_BODY).fontSize(8);
    const textWidth = doc.widthOfString(label);
    const textX = (width - textWidth) / 2;
    // Never pass `width` here: wrapped text uses LineWrapper and will call
    // continueOnNewPage() when near the bottom, creating blank extra pages and
    // leaving earlier pages without a visible footer.
    doc.text(label, textX, footerY, { lineBreak: false });
    doc.restore();
  }
}

function ensureSpace(doc: PDFDoc, needed: number) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom - 52;
  if (doc.y + needed > bottomLimit) {
    doc.addPage();
  }
}

function formatName(profile: Profile): string {
  const fn = (profile.firstName || '').trim();
  const ln = (profile.lastName || '').trim();
  const combined = [fn, ln].filter(Boolean).join(' ');
  if (combined) return combined;
  return (profile.name || '').trim() || 'Bio-Data';
}

function formatGender(g: Profile['gender']): string {
  if (g === 'M') return 'Male';
  if (g === 'F') return 'Female';
  return EMPTY;
}

function formatFood(food: Profile['foodPreference']): string {
  if (!food) return EMPTY;
  switch (food) {
    case 'pure_veg':
      return 'Pure Vegetarian';
    case 'non_veg':
      return 'Non-Vegetarian';
    case 'eggetarian':
      return 'Eggetarian';
    default:
      return EMPTY;
  }
}

function formatWorkingStatus(status: Profile['workingStatus']): string {
  if (status === undefined || status === null) return EMPTY;
  if (typeof status === 'boolean') return status ? 'Working' : 'Not working';
  switch (status) {
    case 'employed':
      return 'Employed';
    case 'self-employed':
      return 'Self-employed';
    case 'not-working':
      return 'Not working';
    default:
      return EMPTY;
  }
}

function formatDob(dob: string): string {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
