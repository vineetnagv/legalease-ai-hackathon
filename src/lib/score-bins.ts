/**
 * Utility functions for binning AI-generated scores into categorical labels
 *
 * AI-generated numeric scores are non-deterministic and can vary between runs.
 * Binning provides more stable and interpretable categories.
 */

export interface ScoreBin {
  label: string;
  color: string;
}

/**
 * Bins confidence scores into High/Medium/Low categories
 * @param confidence - Confidence score (0-100)
 * @returns Object with label and Tailwind color class
 */
export function getConfidenceBin(confidence: number): ScoreBin {
  if (confidence > 80) {
    return {
      label: "High Confidence",
      color: "text-green-600 dark:text-green-400"
    };
  }
  if (confidence >= 50) {
    return {
      label: "Medium Confidence",
      color: "text-yellow-600 dark:text-yellow-400"
    };
  }
  return {
    label: "Low Confidence",
    color: "text-red-600 dark:text-red-400"
  };
}

/**
 * Bins risk scores into Low/Medium/High categories
 * @param riskScore - Risk score (0-100)
 * @returns Object with label and Tailwind color class
 */
export function getRiskCategory(riskScore: number): ScoreBin {
  if (riskScore <= 30) {
    return {
      label: "Low Risk",
      color: "text-green-600 dark:text-green-400"
    };
  }
  if (riskScore <= 70) {
    return {
      label: "Medium Risk",
      color: "text-yellow-600 dark:text-yellow-400"
    };
  }
  return {
    label: "High Risk",
    color: "text-red-600 dark:text-red-400"
  };
}

/**
 * Gets the background color class for risk score progress bars
 * @param riskScore - Risk score (0-100)
 * @returns Tailwind background color class
 */
export function getRiskBarColor(riskScore: number): string {
  if (riskScore <= 30) return 'bg-green-500';
  if (riskScore <= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}
