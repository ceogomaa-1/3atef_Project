import OpenAI from 'openai'
import type { PolicyAnalysis } from '@/lib/types'

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const SYSTEM_PROMPT = `You are a hotel booking policy analyst. Given raw hotel policy text, extract:
1. refund_policy: A single concise sentence describing the refund terms
2. cancellation_penalty: The cancellation fee or penalty description
3. no_show_policy: The no-show fee or consequence
4. risk_flags: Array of strings — only include: "NO REFUND", "100% PENALTY", "NO MODIFICATIONS", "NON-REFUNDABLE", "NO DATE CHANGE" if they apply

Respond ONLY with valid JSON matching: { refund_policy, cancellation_penalty, no_show_policy, risk_flags }`

export async function analyzePolicy(rawPolicyText: string): Promise<PolicyAnalysis> {
  if (!rawPolicyText.trim()) {
    return {
      refundPolicy: 'No policy information available',
      cancellationPenalty: 'Unknown',
      noShowPolicy: 'Unknown',
      riskFlags: [],
    }
  }

  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: rawPolicyText.slice(0, 2000) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 400,
    })

    const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
    return {
      refundPolicy: parsed.refund_policy ?? 'Not specified',
      cancellationPenalty: parsed.cancellation_penalty ?? 'Not specified',
      noShowPolicy: parsed.no_show_policy ?? 'Not specified',
      riskFlags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
    }
  } catch (err) {
    console.error('[policyAgent] GPT-4o call failed:', err)
    return {
      refundPolicy: 'Analysis unavailable',
      cancellationPenalty: 'Analysis unavailable',
      noShowPolicy: 'Analysis unavailable',
      riskFlags: [],
    }
  }
}

export async function runPolicyAgent(
  hotels: Array<{ name: string; rawPolicy?: string }>
): Promise<Map<string, PolicyAnalysis>> {
  const results = new Map<string, PolicyAnalysis>()

  // Batch to avoid rate limits — process up to 5 concurrently
  const BATCH = 5
  for (let i = 0; i < hotels.length; i += BATCH) {
    const batch = hotels.slice(i, i + BATCH)
    const analyses = await Promise.all(
      batch.map((h) => analyzePolicy(h.rawPolicy ?? ''))
    )
    batch.forEach((h, idx) => results.set(h.name, analyses[idx]))
  }

  return results
}
