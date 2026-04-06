const ESTILOS_TOKENS = {
  // Corporativo
  'Corporativo': 'corporate exhibition booth, professional, clean branding, well-lit, open space, institutional, modern office style',
  'Institucional': 'institutional pavilion, governmental booth, clean, bright, flags, official',
  // Moderno-Tech
  'Minimalista': 'minimalist design, clean lines, white space, scandinavian aesthetic, simple forms, bright, uncrowded',
  'Tecnológico': 'high-tech booth, glowing led lines, digital screens, modern tech environment',
  // Premium
  'Luxury': 'luxury brand exhibition, high-end materials, dark marble, gold accents, warm dramatic lighting, elegant, boutique style',
  // Natural
  'Orgánico': 'organic shapes, curved walls, biomorphic design, natural materials, plants, eco-friendly',
  // Industrial
  'Industrial': 'industrial loft style, exposed metal, concrete textures, raw materials, urban vibe'
};

const TRADUCCIONES = {
  'ISLA': 'island booth, open on all 4 sides',
  'PENINSULA': 'peninsula booth, open on 3 sides',
  'ESQUINA_IZQ': 'corner booth, open on 2 sides',
  'ESQUINA_DER': 'corner booth, open on 2 sides',
  'EN_U': 'in-line booth, open on 1 side',
  'IRREGULAR': 'irregular shaped booth, custom footprint'
};

export function generarPromptIngles(briefingData) {
  const m2 = briefingData.m2 || 20;
  const config = TRADUCCIONES[briefingData.config || 'EN_U'];
  const empresa = briefingData.empresa || 'Brand';
  const color1 = briefingData.colorNombre || briefingData.colorPrimario || '#0A4E91';
  let estilos = briefingData.estilos || ['Luxury'];
  if (!Array.isArray(estilos) || estilos.length === 0) estilos = ['Luxury'];

  const themeTokens = estilos.map(e => ESTILOS_TOKENS[e] || ESTILOS_TOKENS['Minimalista']).join(', ');

  // Base prompt structure optimized for architecture/booth generation
  return `A highly detailed photorealistic render of an exhibition booth for ${empresa}, size ${m2} sqm, ${config}. Primary brand color: ${color1}. Style: ${themeTokens}. Architectural photography, highly detailed, photorealistic 8k, unreal engine 5 render, trade show lighting.`;
}
