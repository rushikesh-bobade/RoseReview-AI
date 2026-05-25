export class EngineeringMetricsService {
  /**
   * Generates a realistic fluctuating health score trend over the past 7 days.
   * Perfect for a Recharts LineChart.
   */
  generateHealthTrend() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const baseScore = 85;
    
    return days.map(day => {
      // Fluctuate between -5 and +5
      const variance = Math.floor(Math.random() * 11) - 5;
      return {
        name: day,
        value: Math.min(100, Math.max(0, baseScore + variance))
      };
    });
  }

  /**
   * Generates a realistic distribution of issue severities.
   * Perfect for a Recharts PieChart or DonutChart.
   */
  generateSeverityDistribution() {
    return [
      { name: "Info", value: 45, fill: "#3b82f6" }, // Blue
      { name: "Warning", value: 25, fill: "#eab308" }, // Yellow
      { name: "Critical", value: 5, fill: "#ef4444" }, // Red
      { name: "Resolved", value: 120, fill: "#22c55e" } // Green
    ];
  }

  /**
   * Generates a realistic activity timeline of reviews vs deployments.
   * Perfect for a Recharts BarChart.
   */
  generateActivityTimeline() {
    const dates = ["10-01", "10-02", "10-03", "10-04", "10-05", "10-06", "10-07"];
    
    return dates.map(date => {
      return {
        date,
        reviews: Math.floor(Math.random() * 20) + 5,
        deployments: Math.floor(Math.random() * 8) + 1,
      };
    });
  }
}

export const engineeringMetricsService = new EngineeringMetricsService();
