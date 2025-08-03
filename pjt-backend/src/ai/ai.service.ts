// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

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

    console.log(financialSummary);

    const systemPrompt = `Você é um consultor especializado em negócios de barbearia. Gere 5 insights personalizados com base no seguinte resumo financeiro (em JSON). Seja direto e estratégico, focando em sugestões que podem ajudar o dono a economizar, investir ou expandir. Não é necessário um texto de apresentção, apenas os 5 insights listados em tópicos`;

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
