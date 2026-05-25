import { FastifyInstance } from "fastify";
import { TrendPoint } from "./dashboard.types";

export class ReviewAnalyticsService {
  constructor(private app: FastifyInstance) {}

  async riskTrends(days = 14): Promise<TrendPoint[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const risks = await this.app.prisma.deploymentRisk.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" }
    });

    const grouped = new Map<string, number[]>();
    for (const risk of risks) {
      const key = risk.createdAt.toISOString().slice(0, 10);
      const arr = grouped.get(key) ?? [];
      arr.push(risk.score);
      grouped.set(key, arr);
    }

    return Array.from(grouped.entries()).map(([label, scores]) => ({
      label,
      value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }));
  }

  async severityDistribution() {
    const findings = await this.app.prisma.finding.findMany({ select: { severity: true } });
    const out = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      const k = (f.severity || "info").toLowerCase();
      if (k in out) out[k as keyof typeof out] += 1;
      else out.info += 1;
    }
    return out;
  }
}
