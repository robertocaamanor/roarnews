
import { GoogleGenAI } from "@google/genai";
import { ArticleData } from "../types";

// Always initialize with the named parameter 'apiKey' and use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TITLE_CASE_CONNECTORS = new Set([
  'a',
  'al',
  'con',
  'contra',
  'de',
  'del',
  'desde',
  'e',
  'el',
  'en',
  'entre',
  'hacia',
  'hasta',
  'la',
  'las',
  'los',
  'o',
  'para',
  'por',
  'que',
  'sin',
  'sobre',
  'tras',
  'u',
  'un',
  'una',
  'y'
]);

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const extractProtectedTitleWords = (...texts: Array<string | undefined>): Set<string> => {
  const protectedWords = new Set<string>();

  texts
    .filter((text): text is string => Boolean(text))
    .forEach(text => {
      const sequences = text.match(/\b(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)\b/g) ?? [];
      sequences.forEach(sequence => {
        sequence.split(/\s+/).forEach(word => protectedWords.add(word));
      });

      const repeatedTitleWords = text.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}\b/g) ?? [];
      const frequency = new Map<string, number>();

      repeatedTitleWords.forEach(word => {
        frequency.set(word, (frequency.get(word) ?? 0) + 1);
      });

      frequency.forEach((count, word) => {
        if (count > 1) {
          protectedWords.add(word);
        }
      });

      const acronyms = text.match(/\b[A-ZÁÉÍÓÚÑ]{2,}\b/g) ?? [];
      acronyms.forEach(word => protectedWords.add(word));
    });

  return protectedWords;
};

const normalizeArticleTitle = (title: string, subtitle?: string, body?: string): string => {
  const cleanedTitle = normalizeWhitespace(title.replace(/["“”«»]/g, ''));
  if (!cleanedTitle) {
    return title;
  }

  const protectedWords = extractProtectedTitleWords(cleanedTitle, subtitle, body);
  const tokens = cleanedTitle.split(/(\s+)/);
  let firstWordSeen = false;

  return tokens
    .map(token => {
      if (/^\s+$/.test(token)) {
        return token;
      }

      const match = token.match(/^([^A-Za-zÁÉÍÓÚÑáéíóúñ]*)([A-Za-zÁÉÍÓÚÑáéíóúñ]+)([^A-Za-zÁÉÍÓÚÑáéíóúñ]*)$/);
      if (!match) {
        return token;
      }

      const [, prefix, core, suffix] = match;
      const lowerCore = core.toLowerCase();
      let normalizedCore = core;

      if (!firstWordSeen) {
        normalizedCore = lowerCore.charAt(0).toUpperCase() + lowerCore.slice(1);
        firstWordSeen = true;
      } else if (protectedWords.has(core) || /^[A-ZÁÉÍÓÚÑ]{2,}$/.test(core) || /^(?:[IVXLCDM]+)$/i.test(core)) {
        normalizedCore = core;
      } else if (TITLE_CASE_CONNECTORS.has(lowerCore)) {
        normalizedCore = lowerCore;
      } else {
        normalizedCore = lowerCore;
      }

      return `${prefix}${normalizedCore}${suffix}`;
    })
    .join('');
};

const splitParagraphForReadability = (paragraph: string): string[] => {
  const cleanParagraph = normalizeWhitespace(paragraph);
  const sentences = cleanParagraph.match(/[^.!?]+(?:[.!?]+|$)/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? [];

  if (sentences.length < 4) {
    return [cleanParagraph];
  }

  const chunks: string[] = [];
  let index = 0;

  while (index < sentences.length) {
    let take = Math.min(2, sentences.length - index);
    const currentSentenceCount = sentences.slice(index, index + take).join(' ').split(/\s+/).length;

    if (currentSentenceCount < 30 && index + take < sentences.length) {
      take = Math.min(3, sentences.length - index);
    }

    chunks.push(sentences.slice(index, index + take).join(' '));
    index += take;
  }

  if (chunks.length === 1 && sentences.length >= 4) {
    const midpoint = Math.ceil(sentences.length / 2);
    return [
      sentences.slice(0, midpoint).join(' '),
      sentences.slice(midpoint).join(' ')
    ];
  }

  return chunks;
};

const normalizeBodyMarkdown = (body: string): string => {
  const blocks = body
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean);

  const normalizedBlocks: string[] = [];

  const isH2 = (block: string) => /^##\s+/.test(block) && !/^###\s+/.test(block);
  const isStructuralBlock = (block: string) => /^(###\s+|[*-]\s+|>\s+)/.test(block);

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (!isH2(block)) {
      normalizedBlocks.push(block);
      continue;
    }

    normalizedBlocks.push(block);
    const sectionBlocks: string[] = [];
    let cursor = i + 1;

    while (cursor < blocks.length && !isH2(blocks[cursor])) {
      sectionBlocks.push(blocks[cursor]);
      cursor += 1;
    }

    const paragraphIndexes = sectionBlocks.reduce<number[]>((indexes, currentBlock, index) => {
      if (!isStructuralBlock(currentBlock)) {
        indexes.push(index);
      }
      return indexes;
    }, []);

    if (paragraphIndexes.length === 1) {
      const paragraphIndex = paragraphIndexes[0];
      const splitParagraphs = splitParagraphForReadability(sectionBlocks[paragraphIndex]);

      if (splitParagraphs.length > 1) {
        sectionBlocks.splice(paragraphIndex, 1, ...splitParagraphs);
      }
    }

    normalizedBlocks.push(...sectionBlocks);
    i = cursor - 1;
  }

  return normalizedBlocks.join('\n\n');
};

const normalizeGeneratedArticle = (data: ArticleData): ArticleData => ({
  ...data,
  title: normalizeArticleTitle(data.title, data.subtitle, data.body),
  body: normalizeBodyMarkdown(data.body)
});

export const generateArticle = async (
  sources: string[], 
  tone: string, 
  criticalContext?: string
): Promise<ArticleData & { groundingSources?: any[] }> => {
  // Filter out empty sources
  const validSources = sources.filter(s => s.trim().length > 0);
  const sourcesText = validSources.map((s, i) => `Fuente ${i + 1}: ${s}`).join('\n\n');

  const criticalInstruction = criticalContext 
    ? `\n\nATENCIÓN: Dado que el tono es crítico/analítico, utiliza este CONTEXTO ESPECÍFICO para el análisis: "${criticalContext}". El artículo debe girar en torno a este ángulo crítico.`
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Eres un periodista de investigación senior. Tu objetivo es redactar una noticia profesional y verídica basada en la información proporcionada en las fuentes.

               FUENTES DE INFORMACIÓN:
               ${sourcesText}

               INSTRUCCIONES DE REDACCIÓN:
               1. ANALIZA las fuentes y utiliza 'googleSearch' para ampliar el contexto.
               2. ESTRUCTURA: Título, Bajada y Cuerpo (H2/H3).
               3. ESTILO: "${tone}". Periodismo moderno, voz activa.${criticalInstruction}
               4. EXTENSIÓN: 350-600 palabras.
               5. BÚSQUEDA DE IMÁGENES: Define 3 términos de búsqueda (keywords) exactos y optimizados para Google Images que permitan encontrar la fotografía principal perfecta para esta noticia. Deben ser específicos (incluyendo nombres, lugares y contexto).
               6. IDIOMA: Español.

               REGLAS DE LEGIBILIDAD (OBLIGATORIAS para pasar el análisis Yoast SEO):
               - FRASES CORTAS: El 80% o más de las frases deben tener MENOS de 20 palabras. Nunca escribas una frase de más de 25 palabras. Si una idea es compleja, divídela en dos frases cortas.
               - VOZ ACTIVA: Usa voz activa en más del 90% de las frases. Está PROHIBIDO usar construcciones pasivas como "fue anunciado", "fue confirmado", "fue detenido", "se llevó a cabo", "es considerado", "fue realizado". Reformúlalas siempre en activa: "anunció", "confirmó", "detuvo", "realizó".
               - VOCABULARIO SENCILLO: Usa palabras comunes y directas. Evita tecnicismos o palabras rebuscadas cuando existe una alternativa más simple.
               - PÁRRAFOS POR SECCIÓN: Después de cada H2 deben aparecer al menos 2 párrafos antes del siguiente H2. Evita dejar un solo bloque largo debajo de un subtítulo.
               - LONGITUD DE PÁRRAFOS: Cada párrafo debe tener entre 2 y 4 frases cortas. Si el contenido lo permite, divide cada sección en 2 o 3 párrafos breves.

               REGLA CRÍTICA DE FORMATO JSON: NUNCA uses comillas dobles (") dentro del valor de un string JSON. Si necesitas citar algo, usa comillas simples (') o comillas angulares («»). Ejemplo INCORRECTO: "los "desconocidos" que...". Ejemplo CORRECTO: "los 'desconocidos' que...". Respetar esto es obligatorio para que el JSON sea válido.

               FORMATO DE SALIDA (JSON):
               - title: Titular en sentence case. REGLA CRÍTICA: La primera palabra va en mayúscula y el resto solo debe llevar mayúscula si corresponde a un nombre propio real. NO uses Title Case. Ejemplo correcto: "Vasco Moulian y Faloon Larraguibel protagonizan cruce en 'Fiebre de baile'". Ejemplo incorrecto: "Vasco Moulian y Faloon Larraguibel Protagonizan Cruce En 'Fiebre de baile'".
               - subtitle: Bajada.
               - body: Cuerpo en Markdown.
               - seo: titleTag (MÁXIMO 60 caracteres, Yoast SEO lo exige), metaDescription (MÁXIMO 155 caracteres, Yoast SEO lo exige; resumen atractivo y completo dentro del límite), keywords (array), slug.
               - instagramSummary: JSON array con exactamente 3 strings, uno por párrafo.
               - microblogSummary: Resumen corto.
               - imageSearchQueries: Array de 3 strings con términos de búsqueda específicos.`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const text = response.text.trim();
  const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  // Extract JSON from the response robustly (handles markdown code fences)
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  let jsonString = start !== -1 && end !== -1 ? text.slice(start, end + 1) : text;

  // Sanitize unescaped double quotes inside JSON string values that the model may produce.
  // Strategy: inside each JSON string value, replace any " that is not already escaped and
  // is not the delimiter of the string itself, with a single quote.
  jsonString = jsonString.replace(
    /:[ \t]*"((?:[^"\\]|\\.)*)"/g,
    (_match: string, inner: string) => {
      // Re-escape any unescaped double quotes that slipped into the value
      const sanitized = inner.replace(/(?<!\\)"/g, "'");
      return `: "${sanitized}"`;
    }
  );

  try {
    const data = JSON.parse(jsonString) as ArticleData;
    // Normalize instagramSummary: ensure it's always an array
    if (typeof data.instagramSummary === 'string') {
      data.instagramSummary = data.instagramSummary.split(/\n\n+/).filter(Boolean);
    }
    return { ...normalizeGeneratedArticle(data), groundingSources };
  } catch (error) {
    console.error("Failed to parse AI response:", text);
    throw new Error("Error en el formato de la respuesta de la IA.");
  }
};
