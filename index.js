import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generarMemoriaIA } from './services/aiGenerator.js';
import { cretePDF } from './services/pdfMaker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large JSON if it has embedded images

// Ensure PDF output directory exists
const pdfsDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
}

// Inicializamos el generador de correos fantasma
import { initMailer } from './services/mailer.js';
initMailer();

app.post('/api/submit-briefing', (req, res) => {
  console.log('📬 Nuevo Briefing Recibido! Respondiendo OK inmediato al cliente.');
  
  // 1. RESPONDER INMEDIATAMENTE AL FRONTEND PARA CORTAR LA CONEXIÓN
  res.status(200).json({ 
    success: true, 
    message: 'Stand analizado. Renders IA en proceso...',
    pdfId: `StandMatch_Briefing_${Date.now()}.pdf`
  });

  // 2. LANZAR EL HILO ASINCRONO PARA IA, PDF Y EMAILS
  (async () => {
    try {
      const { briefingData, cotizacion, userDetails } = req.body;
      
      console.log('🧠 Solicitando Memoria Descriptiva a Gemini IA...');
      const memoriaInfo = await generarMemoriaIA(briefingData, cotizacion);
      
      console.log('🎨 Generando render fotorrealista...');
      const { generarImagenMvpIA } = await import('./services/aiGenerator.js');
      const imagenBase64 = await generarImagenMvpIA(briefingData);

      console.log('📄 Generando PDF corporativo...');
      const filename = `StandMatch_Briefing_${Date.now()}.pdf`;
      const filepath = path.join(pdfsDir, filename);
      
      await cretePDF({
        briefingData,
        cotizacion,
        memoriaText: memoriaInfo.texto,
        imagenVisual: imagenBase64
      }, filepath);
      
      console.log(`✅ ¡PDF Generado con éxito! Guardado en: ${filepath}`);

      const targetEmail = (userDetails && userDetails.email) ? userDetails.email.toLowerCase().trim() : '';
      const whitelistVIP = ['damian@marketing121.net', 'matias@magrada.com', 'jonasseul@protonmail.com', 'elenaamafutskaya@gmail.com', 'enric.carreras74@gmail.com'];
      
      import('./services/mailer.js').then(async ({ enviarAgradecimientoCliente, enviarPdfAgencia }) => {
         if (whitelistVIP.includes(targetEmail) || targetEmail.includes('standmatch')) {
            console.log(`👑 VIP detectado (${targetEmail}) -> Enviando PDF.`);
            await enviarPdfAgencia(targetEmail, filepath, filename);
         } else {
            console.log(`👤 Cliente normal (${targetEmail}) -> Enviando acuse recibo.`);
            await enviarAgradecimientoCliente(targetEmail);
         }
      });
    } catch (error) {
      console.error('❌ Error asíncrono fabricando Dossier:', error);
    }
  })();
});

app.listen(PORT, () => {
  console.log(`🚀 StandMatch Backend Server corriendo en http://localhost:${PORT}`);
  console.log(`📁 Los PDFs generados se guardarán en: ${pdfsDir}`);
});
