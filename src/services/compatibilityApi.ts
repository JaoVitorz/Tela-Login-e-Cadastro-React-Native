import axios from 'axios';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://pet-joyful-backend.onrender.com').replace(/\/+$/, '');

export type CompatibilityResult = {
  score: number;
  assessment: string;
  alerts: string[];
  tips: string[];
};

export type CompatibilityInput = {
  adopter: {
    livingSpace: string;
    experience: string;
    timeAvailable: string;
    familyComposition: string;
    lifestyle: string;
  };
  pet: {
    type: string;
    breed: string;
    temperament: string;
    energy: string;
    specialNeeds: string;
    description: string;
  };
};

function parseResult(reply: string): CompatibilityResult {
  const normalized = reply.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start = normalized.indexOf('{');
  const end = normalized.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('A IA retornou uma análise em formato inválido. Tente novamente.');
  const parsed = JSON.parse(normalized.slice(start, end + 1)) as Partial<CompatibilityResult>;
  const score = Number(parsed.score);
  if (!Number.isFinite(score) || !parsed.assessment) throw new Error('Não foi possível interpretar o resultado da análise. Tente novamente.');
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    assessment: String(parsed.assessment),
    alerts: Array.isArray(parsed.alerts) ? parsed.alerts.map(String) : [],
    tips: Array.isArray(parsed.tips) ? parsed.tips.map(String) : [],
  };
}

export async function analyzeCompatibility({ adopter, pet }: CompatibilityInput): Promise<CompatibilityResult> {
  const prompt = `Analise a compatibilidade entre este adotante potencial e o pet descrito.

PERFIL DO ADOTANTE:
- Espaço de moradia: ${adopter.livingSpace}
- Experiência com animais: ${adopter.experience}
- Tempo disponível diariamente: ${adopter.timeAvailable}
- Composição familiar: ${adopter.familyComposition || 'Não informado'}
- Estilo de vida: ${adopter.lifestyle || 'Não informado'}

PERFIL DO PET:
- Tipo: ${pet.type}
- Raça: ${pet.breed}
- Temperamento: ${pet.temperament || 'Não informado'}
- Nível de energia: ${pet.energy || 'Não informado'}
- Necessidades especiais: ${pet.specialNeeds || 'Nenhuma informada'}
- Descrição adicional: ${pet.description || 'Não informada'}

Por favor, forneça:
1. Score de compatibilidade (0-100%)
2. Avaliação geral (2-3 linhas)
3. Lista de alertas/incompatibilidades (se houver)
4. Dicas para melhorar a adoção

Responda em JSON com este formato:
{
  "score": número,
  "assessment": "texto da avaliação",
  "alerts": ["alerta 1", "alerta 2"],
  "tips": ["dica 1", "dica 2"]
}`;

  try {
    const response = await axios.post<{ reply?: string; error?: string; success?: boolean }>(
      `${API_URL}/api/chat`,
      { message: prompt },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60000 },
    );
    if (!response.data.reply) throw new Error(response.data.error || 'A IA não retornou uma análise. Tente novamente.');
    return parseResult(response.data.reply);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.response?.data?.message;
      if (message) throw new Error(message);
      if (error.code === 'ECONNABORTED') throw new Error('A análise demorou para responder. Tente novamente.');
      if (!error.response) throw new Error('Não foi possível conectar ao serviço de IA. Verifique sua conexão e tente novamente.');
      throw new Error(`O serviço de IA respondeu com erro (${error.response.status}). Tente novamente.`);
    }
    throw error;
  }
}
