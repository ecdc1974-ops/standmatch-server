import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generarMemoriaIA, generarImagenGemini, generar3Renders } from './services/aiGenerator.js';
import { cretePDF } from './services/pdfMaker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pdfsDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
}

import { initMailer } from './services/mailer.js';
initMailer();

// ─── ENDPOINT: Generar 1 render (llamado desde frontend) ──────
app.post('/api/generate-render', async (req, res) => {
  try {
    const { prompt, nivel } = req.body;
    console.log(`🎨 Render solicitado para propuesta ${nivel} (prompt: ${prompt?.length || 0} chars)`);
    
    const imageBase64 = await generarImagenGemini(prompt);
    
    if (imageBase64) {
      console.log(`✅ Render ${nivel} generado correctamente`);
      res.json({ success: true, imageBase64, nivel });
    } else {
      res.status(500).json({ success: false, error: 'No se pudo generar la imagen' });
    }
  } catch (err) {
    console.error('❌ Error generando render:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ENDPOINT: Generar 3 renders de golpe ──────
app.post('/api/generate-all-renders', async (req, res) => {
  try {
    const { prompts } = req.body; // Array de 3 prompts
    console.log('🎨🎨🎨 Generando 3 renders en paralelo...');
    
    const renders = await generar3Renders(prompts);
    
    console.log('✅ Renders: A=', !!renders.A, 'B=', !!renders.B, 'C=', !!renders.C);
    res.json({ success: true, renders });
  } catch (err) {
    console.error('❌ Error renders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ENDPOINT: Submit briefing completo (3 propuestas) ──────
app.post('/api/submit-briefing', (req, res) => {
  console.log('📬 Nuevo Briefing V11 Recibido! (3 propuestas A/B/C)');
  
  res.status(200).json({ 
    success: true, 
    message: 'Briefing V11 recibido. Procesando 3 propuestas...',
    pdfId: `StandMatch_V11_${Date.now()}.pdf`
  });

  (async () => {
    try {
      const { briefingData, propuestas, renders, userDetails } = req.body;
      
      console.log('🧠 Procesando 3 propuestas...');
      console.log('   A (Premium):', propuestas?.[0]?.cotizacion?.totalSinIva + '€');
      console.log('   B (Equilibrada):', propuestas?.[1]?.cotizacion?.totalSinIva + '€');
      console.log('   C (Económica):', propuestas?.[2]?.cotizacion?.totalSinIva + '€');

      console.log('📄 Generando PDF corporativo V11...');
      const filename = `StandMatch_V11_${Date.now()}.pdf`;
      const filepath = path.join(pdfsDir, filename);
      
      // Usar la primera propuesta como principal para el PDF
      const mainProp = propuestas?.[1] || propuestas?.[0]; // B como default
      await cretePDF({
        briefingData,
        cotizacion: mainProp?.cotizacion,
        memoriaText: mainProp?.memoria?.texto || '',
        imagenVisual: renders?.B || renders?.A || null
      }, filepath);
      
      console.log(`✅ PDF V11 generado: ${filepath}`);

      const targetEmail = (userDetails?.email || '').toLowerCase().trim();
      const whitelistVIP = ['damian@marketing121.net', 'matias@magrada.com', 'jonasseul@protonmail.com', 'elenaamafutskaya@gmail.com', 'enric.carreras74@gmail.com'];
      
      import('./services/mailer.js').then(async ({ enviarAgradecimientoCliente, enviarPdfAgencia }) => {
         if (whitelistVIP.includes(targetEmail) || targetEmail.includes('standmatch')) {
            console.log(`👑 VIP (${targetEmail}) -> Enviando PDF.`);
            await enviarPdfAgencia(targetEmail, filepath, filename);
         } else if (targetEmail) {
            console.log(`👤 Cliente (${targetEmail}) -> Acuse recibo.`);
            await enviarAgradecimientoCliente(targetEmail);
         }
      });
    } catch (error) {
      console.error('❌ Error asíncrono:', error);
    }
  })();
});

app.listen(PORT, () => {
  console.log(`🚀 StandMatch V11 Backend en http://localhost:${PORT}`);
  console.log(`📁 PDFs en: ${pdfsDir}`);
  console.log(`🎨 Render engine: Gemini Imagen 3`);
});
