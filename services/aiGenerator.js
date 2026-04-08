// aiGenerator V11 — FLUX (Pollinations) + Gemini Imagen 3 + Gemini Flash para Memorias
// 🔥 Motor dual: FLUX como primario (sin API key), Gemini como upgrade cuando haya key válida
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/**
 * Genera un render con FLUX via Pollinations (sin API key)
 * Modelo: FLUX de Black Forest Labs — excelente para renders arquitectónicos
 * @param {string} prompt - El prompt completo
 * @returns {string|null} - URL de la imagen generada
 */
async function generarImagenFLUX(prompt) {
  try {
    // Truncar prompt — Pollinations funciona mejor con prompts cortos
    let p = prompt;
    if (p.length > 450) p = p.substring(0, 450);
    // Branding sutil
    p += ', professional architectural visualization, designed by StandMatch.com';
    
    // FLUX via Pollinations — 16:9 (1344x756)
    const encodedPrompt = encodeURIComponent(p);
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1344&height=756&model=flux&seed=${seed}&nologo=true`;
    
    console.log('🎨 Generando render con FLUX (Pollinations)...');
    console.log('📝 Prompt length:', p.length, 'chars');
    console.log('📝 URL length:', url.length, 'chars');
    
    // Descargar la imagen completa como buffer y convertir a base64
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      console.log('✅ Render FLUX generado correctamente, size:', Math.round(buffer.length / 1024), 'KB');
      return `data:image/jpeg;base64,${base64}`;
    }
    
    console.error('⚠️ FLUX respondió:', response.status);
    return null;
  } catch (err) {
    console.error('❌ Error FLUX:', err.message);
    return null;
  }
}

/**
 * Genera un render con Gemini Imagen 3 (requiere API key válida)
 * @param {string} prompt - El prompt completo
 * @returns {string|null} - Base64 de la imagen o null
 */
async function generarImagenGemini(prompt) {
  if (!ai) return null;
  
  let promptFinal = prompt;
  if (promptFinal.length > 1500) promptFinal = promptFinal.substring(0, 1500);

  try {
    console.log('🎨 Intentando Gemini Imagen 3...');
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: promptFinal,
      config: { numberOfImages: 1, aspectRatio: '16:9' },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageBytes = response.generatedImages[0].image.imageBytes;
      console.log('✅ Render Gemini generado');
      return `data:image/png;base64,${imageBytes}`;
    }
    return null;
  } catch (err) {
    console.error('❌ Gemini Imagen 3 falló:', err.message);
    return null;
  }
}

/**
 * Genera un render con OpenAI DALL-E 3 (mejor calidad)
 * @param {string} prompt - El prompt completo
 * @returns {string|null} - Base64 de la imagen o null
 */
async function generarImagenOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY) return null;
  
  try {
    // DALL-E 3 acepta prompts largos pero mejor optimizado a ~1000 chars
    let p = prompt;
    if (p.length > 1000) p = p.substring(0, 1000);
    
    console.log('🎨 Intentando OpenAI DALL-E 3...');
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: p,
        n: 1,
        size: '1792x1024',
        quality: 'hd',
        response_format: 'b64_json'
      }),
      signal: AbortSignal.timeout(120000)
    });
    
    if (!response.ok) {
      const errBody = await response.text();
      console.error('❌ OpenAI DALL-E 3 error:', response.status, errBody.substring(0, 200));
      return null;
    }
    
    const data = await response.json();
    if (data.data && data.data[0] && data.data[0].b64_json) {
      const b64 = data.data[0].b64_json;
      console.log('✅ Render OpenAI DALL-E 3 generado, size:', Math.round(b64.length * 0.75 / 1024), 'KB');
      return `data:image/png;base64,${b64}`;
    }
    return null;
  } catch (err) {
    console.error('❌ Error OpenAI DALL-E 3:', err.message);
    return null;
  }
}

/**
 * Motor principal: OpenAI DALL-E 3 → Gemini → FLUX fallback
 */
export async function generarImagenIA(prompt) {
  // 1. Intentar OpenAI DALL-E 3 (mejor calidad)
  const openaiResult = await generarImagenOpenAI(prompt);
  if (openaiResult) return { image: openaiResult, engine: 'openai-dalle-3' };
  
  // 2. Intentar Gemini si hay key
  if (ai) {
    const geminiResult = await generarImagenGemini(prompt);
    if (geminiResult) return { image: geminiResult, engine: 'gemini-imagen-3' };
  }
  
  // 3. Fallback a FLUX (último recurso)
  const fluxResult = await generarImagenFLUX(prompt);
  if (fluxResult) return { image: fluxResult, engine: 'flux-pollinations' };
  
  return null;
}

// Alias para compatibilidad
export { generarImagenIA as generarImagenGemini };

/**
 * Genera una memoria descriptiva con Gemini 2.0 Flash
 */
export async function generarMemoriaIA(briefingData, cotizacion, nivel = 'B') {
  const nivelLabels = { A: 'Premium', B: 'Equilibrada', C: 'Económica' };
  const nivelLabel = nivelLabels[nivel] || 'Equilibrada';
  
  let textoMemoria = `Stand de ${briefingData.m2 || 0}m² para ${briefingData.empresa || 'la empresa'}. Propuesta ${nivelLabel}.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Eres un arquitecto experto en diseño de stands feriales de alto nivel. 
Redacta una memoria descriptiva COMERCIAL en español para el cliente sobre su stand.
Propuesta nivel: ${nivelLabel} (${nivel})
Empresa: ${briefingData.empresa || 'N/A'}
Feria: ${briefingData.feria || 'N/A'} en ${briefingData.ciudad || 'N/A'}
Superficie: ${briefingData.m2 || 20}m²
Sistema: ${briefingData.sistema || 'custom'}
Configuración: ${briefingData.config || 'EN_U'}
Altura paredes: ${briefingData.altura || 3}m
Presupuesto total sin IVA: ${cotizacion?.totalSinIva ? Math.round(cotizacion.totalSinIva) + '€' : 'en cálculo'}
Número de partidas: ${cotizacion?.items?.length || 0}

INSTRUCCIONES:
- Redacta 2-3 párrafos persuasivos y descriptivos
- NO menciones precios exactos, solo sensación de valor
- Si es Premium (A): enfatiza materiales de lujo, iluminación dramática, impacto visual
- Si es Equilibrada (B): enfatiza relación calidad-precio, profesionalidad, inteligencia del diseño  
- Si es Económica (C): enfatiza eficiencia, funcionalidad, aprovechamiento del espacio
- Usa un tono comercial de alto nivel, como una agencia de diseño premium
- Menciona elementos específicos del briefing si los hay`,
      });
      
      textoMemoria = response.text;
    } catch (error) {
      console.error('⚠️ Error Gemini Text:', error.message || error);
    }
  }

  return { 
    titulo: `Propuesta ${nivel} — ${nivelLabel}`,
    texto: textoMemoria 
  };
}

/**
 * Genera un render con retry automático (2 intentos)
 */
async function generarConRetry(prompt, label = '') {
  for (let intento = 1; intento <= 2; intento++) {
    console.log(`🎨 [${label}] Intento ${intento}/2...`);
    const result = await generarImagenIA(prompt);
    if (result) {
      console.log(`✅ [${label}] Render generado con ${result.engine}`);
      return result;
    }
    if (intento < 2) {
      console.log(`⚠️ [${label}] Falló, reintentando en 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  console.error(`❌ [${label}] Falló tras 2 intentos`);
  return null;
}

/**
 * Genera los 3 renders para A/B/C — SECUENCIAL con delay
 * (Pollinations se satura con 3 simultáneas)
 */
export async function generar3Renders(prompts) {
  console.log('🎨🎨🎨 Generando 3 renders SECUENCIALES (evitar rate-limit)...');
  
  // Render A
  const renderA = await generarConRetry(prompts[0], 'PREMIUM');
  
  // Pausa 3s para no saturar
  await new Promise(r => setTimeout(r, 3000));
  
  // Render B
  const renderB = await generarConRetry(prompts[1], 'EQUILIBRADA');
  
  // Pausa 3s
  await new Promise(r => setTimeout(r, 3000));
  
  // Render C
  const renderC = await generarConRetry(prompts[2], 'ECONÓMICA');
  
  return {
    A: renderA ? renderA.image : null,
    B: renderB ? renderB.image : null,
    C: renderC ? renderC.image : null,
    engines: {
      A: renderA ? renderA.engine : 'failed',
      B: renderB ? renderB.engine : 'failed',
      C: renderC ? renderC.engine : 'failed',
    }
  };
}

/**
 * Procesa el Briefing AI (Ruta Mágica) usando Gemini Vision Multimodal
 * @param {Object} baseData - Los datos limpios recogidos del briefing exprés
 * @param {Array} attachments - Archivos { mimeType, data (base64) }
 */
export async function parseBriefingWithVision(baseData, attachments) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ No hay API Key de OpenAI. Skipando Vision parsing...");
    return baseData;
  }
  
  try {
    console.log("👁️ Iniciando OpenAI (gpt-4o-mini) Vision Parsing con", attachments?.length || 0, "adjuntos.");
    
    let textPrompt = `Eres el Arquitecto Jefe de StandMatch. Analiza el siguiente documento/prompt.
Parámetros obligatorios intocables:
- Feria: ${baseData.feria}
- Metros: ${baseData.fachada}m x ${baseData.fondo}m (${baseData.m2}m2)
- Altura permitida: ${baseData.altura}m
- Presupuesto sugerido orientativo: ${baseData.presupuesto}
- Prompt/Texto del Usuario: "${baseData.magicPrompt || 'Sin texto'}"

TAREA:
1. Si hay imágenes o planos, léelos a fondo: deduce si es ISLA o PENINSULA, cuenta caras abiertas.
2. Identifica colores corporativos, tipologías de stands (madera, modular, híbrido). Recuerda las reglas técnicas: "Usa el catálogo EGGER para madera, y Formica si hay curvas".
3. Identifica si reclaman elementos aéreos complejos (rigging), TV, vitrinas, estanterías, sala de reuniones, pantallas gigantes o elementos extravagantes.
4. Devuelve UNICAMENTE un objeto JSON plano combinando los datos obligatorios con todas las variables extra descubiertas (ej. \`sistema\`, \`tipoSuelo\`, \`tieneTecho\`, \`ledWall_preset1\`, etc). Absolutamente nada más que el JSON válido sin bloques markdown \`\`\`json.`;

    const contentArray = [{ type: "text", text: textPrompt }];
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        contentArray.push({
          type: "image_url",
          image_url: {
            url: `data:${att.mimeType};base64,${att.data}`
          }
        });
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: contentArray
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
       const errBody = await response.text();
       throw new Error(`OpenAI API error: ${response.status} - ${errBody}`);
    }

    const data = await response.json();
    let responseText = data.choices[0].message.content || '';
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsedData = JSON.parse(responseText);
      console.log("✅ Vision AI Parseó el Documento Exitosamente con GPT-4o-mini.");
      return { ...baseData, ...parsedData };
    } catch(e) {
      console.error("❌ Falló el JSON parse del output Vision. Fallback a crudo.");
      return baseData;
    }
  } catch(err) {
    console.error("❌ Error API Vision Parsing OpenAI:", err.message);
    return baseData;
  }
}
