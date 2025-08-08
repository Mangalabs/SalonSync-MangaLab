// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1', // Groq base
    });
  }

  async generateInsight(financialSummary: any): Promise<string[]> {
    const userPrompt = JSON.stringify(financialSummary, null, 2);

    // const systemPrompt = `Você é um consultor especializado em negócios de barbearia. Gere 5 insights personalizados com base no seguinte resumo financeiro (em JSON). Seja direto e estratégico, focando em sugestões que podem ajudar o dono a economizar, investir ou expandir. Cada insight deve ter um título e um breve texto explicando. O formato de cada insight deve ser: TITULO: DESCRIÇÃO. Não use ** ou qualquer outra formatação markdowm. Não é necessário um texto apresentando os insights como: "Aqui estão os 5 insights" ou similares. A drescrição deve estar em portugues brasileiro, se necessáiro traduza os termos para portugues. Se necessário, traduza appointments como "atendimentos".`;

    const systemPrompt = `Você é um consultor sênior especializado em gestão estratégica de barbearias e salões de beleza. Sua missão é analisar cuidadosamente o resumo financeiro a seguir (em JSON) e gerar exatamente 5 insights estratégicos que possam me ajudar a aumentar o lucro, reduzir custos, otimizar recursos ou expandir o negócio. Cada insight deve ter um título curto e objetivo em letras maiúsculas e apresentar uma descrição breve, clara e aplicável à realidade do negócio. Use português brasileiro e traduza automaticamente qualquer termo em inglês (por exemplo, "appointments" = "atendimentos"). Fundamente cada sugestão nos dados fornecidos, evitando recomendações genéricas que não se apliquem ao contexto. Priorize oportunidades de melhoria operacional, estratégias de marketing e gestão financeira. O formato de saída deve ser exatamente: TITULO: DESCRIÇÃO. Não inclua textos introdutórios ou explicações fora dos insights..`;

    const completion = await this.openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content ?? '';
    return response.split('\n').filter((line) => line.trim().length > 0);
  }
}
