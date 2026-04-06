import PDFDocument from 'pdfkit';
import fs from 'fs';
import https from 'https';
import http from 'http';

function fetchImageAsBuffer(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}

export async function cretePDF(data, outputPath) {
  const { briefingData, cotizacion, memoriaText } = data;
  const m2 = briefingData.m2 || 0;

  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // === HEADER ===
  doc.fontSize(28).font('Helvetica-Bold')
     .fillColor('#1a1a1a').text('STAND', 50, 50, { continued: true })
     .fillColor('#00bcd4').text('MATCH');
  doc.fontSize(10).fillColor('#888')
     .text('Propuesta V10 Generada por Inteligencia Artificial', 50, 85);
  doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#00bcd4').lineWidth(2).stroke();

  // === RENDER IMAGE ===
  let yPos = 120;
  if (data.imagenVisual) {
    try {
      let imgBuf;
      if (data.imagenVisual.startsWith('data:image')) {
        const b64 = data.imagenVisual.split(',')[1];
        imgBuf = Buffer.from(b64, 'base64');
        console.log(`📸 Imagen base64 decodificada: ${imgBuf.length} bytes`);
      } else {
        imgBuf = await fetchImageAsBuffer(data.imagenVisual);
        console.log(`📸 Imagen URL descargada: ${imgBuf ? imgBuf.length : 0} bytes`);
      }
      if (imgBuf && imgBuf.length > 1000) {
        // Detectar formato por magic bytes
        const isJpeg = imgBuf[0] === 0xFF && imgBuf[1] === 0xD8;
        const isPng = imgBuf[0] === 0x89 && imgBuf[1] === 0x50;
        console.log(`📸 Formato detectado: ${isJpeg ? 'JPEG' : isPng ? 'PNG' : 'DESCONOCIDO'} (${imgBuf.length} bytes)`);
        doc.image(imgBuf, 50, yPos, { width: 495, height: 250 });
        yPos += 260;
        console.log('✅ Imagen incrustada en PDF correctamente');
      } else {
        console.log(`⚠️ Imagen descartada: buffer ${imgBuf ? imgBuf.length : 'null'} bytes (mínimo 1000)`);
      }
    } catch(e) { console.error('❌ Error incrustando imagen en PDF:', e.message, e.stack); }
  }

  // === TITULO ===
  doc.fontSize(20).fillColor('#1a1a1a').font('Helvetica-Bold')
     .text(`Dossier Ejecutivo: Su Stand de ${m2}m²`, 50, yPos);
  yPos += 35;

  // === MEMORIA DESCRIPTIVA ===
  doc.fontSize(14).fillColor('#00bcd4').font('Helvetica-Bold')
     .text('1. Concepto Arquitectónico', 50, yPos);
  yPos += 22;

  // Background box
  doc.roundedRect(50, yPos, 495, 120, 5).fillColor('#f1f5f9').fill();
  doc.fontSize(10).fillColor('#333').font('Helvetica')
     .text(memoriaText || 'Memoria descriptiva pendiente de generación.', 60, yPos + 10, { width: 475, lineGap: 4 });
  yPos += 135;

  // === COTIZACION ===
  if (yPos > 650) { doc.addPage(); yPos = 50; }
  doc.fontSize(14).fillColor('#00bcd4').font('Helvetica-Bold')
     .text('2. Resumen de Cotización V10', 50, yPos);
  yPos += 25;

  // Dark budget box
  doc.roundedRect(50, yPos, 495, 30, 3).fillColor('#1a1a1a').fill();
  doc.fontSize(9).fillColor('#888').font('Helvetica-Bold')
     .text('CATEGORÍA', 60, yPos + 10)
     .text('CONCEPTO', 200, yPos + 10)
     .text('SUBTOTAL', 460, yPos + 10, { align: 'right', width: 75 });
  yPos += 35;

  const items = cotizacion.items || [];
  items.forEach((item, idx) => {
    if (yPos > 740) { doc.addPage(); yPos = 50; }
    
    const bgColor = idx % 2 === 0 ? '#222' : '#1a1a1a';
    doc.roundedRect(50, yPos - 3, 495, 22, 0).fillColor(bgColor).fill();

    const totalStr = `${(item.total || 0).toLocaleString('es-ES')} €`;
    doc.fontSize(8).fillColor('#ccc').font('Helvetica')
       .text((item.categoria || '').substring(0, 20), 60, yPos, { width: 130 })
       .text((item.concepto || '').substring(0, 45), 195, yPos, { width: 260 });
    
    doc.fillColor(item.total === 0 ? '#666' : '#00bcd4').font('Helvetica-Bold')
       .text(totalStr, 445, yPos, { align: 'right', width: 90 });
    yPos += 22;
  });

  // TOTAL BAR
  yPos += 5;
  if (yPos > 740) { doc.addPage(); yPos = 50; }
  doc.roundedRect(50, yPos, 495, 35, 3).fillColor('#00bcd4').fill();
  doc.fontSize(14).fillColor('#fff').font('Helvetica-Bold')
     .text(`TOTAL ESTIMADO: ${(cotizacion.totalSinIva || 0).toLocaleString('es-ES')} €`, 60, yPos + 10, { width: 475, align: 'right' });
  doc.fontSize(8).fillColor('rgba(255,255,255,0.7)').font('Helvetica')
     .text('(Sin IVA)', 60, yPos + 10, { width: 475, align: 'left' });

  // FOOTER
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(7).fillColor('#aaa')
       .text('Documento Confidencial · StandMatch.com · Revisión Pendiente', 50, 800, { align: 'center', width: 495 });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => { console.log('✅ PDF generado con PDFKit'); resolve(); });
    stream.on('error', reject);
  });
}
