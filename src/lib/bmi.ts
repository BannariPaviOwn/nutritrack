export function calcBmi(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const meters = heightCm / 100;
  const bmi = weightKg / (meters * meters);
  return Math.round(bmi * 10) / 10;
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
