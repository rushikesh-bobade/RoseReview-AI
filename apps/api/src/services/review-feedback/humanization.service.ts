export class HumanizationService {
  humanize(text: string) {
    const softened = text
      .replace(/potential vulnerability detected/gi, "this area may become risky under production conditions")
      .replace(/issue found/gi, "this behavior could be improved")
      .replace(/error identified/gi, "this path may fail in some runtime scenarios");

    return softened.endsWith(".") ? softened : `${softened}.`;
  }

  calmRecommendation(reason: string, suggestion: string) {
    return `This implementation works, though ${this.humanize(
      reason
    ).toLowerCase()} ${suggestion}`;
  }
}
