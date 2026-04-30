import type { InjuryCalculatorData } from '@/types/calculator';

export const DEFAULT_WAGE_LOSS_OCCUPATION = 'Other';
export const DEFAULT_WAGE_LOSS_ANNUAL_INCOME = 87500;

export function applyWageLossDefaults(data: InjuryCalculatorData): InjuryCalculatorData {
  if (!data.impact?.hasWageLoss) return data;

  const demographics = data.demographics || {
    age: 0,
    dateOfBirth: '',
    occupation: '',
    annualIncome: ''
  };
  const annualIncome = Number(demographics.annualIncome || 0) > 0
    ? demographics.annualIncome
    : DEFAULT_WAGE_LOSS_ANNUAL_INCOME;

  return {
    ...data,
    demographics: {
      ...demographics,
      occupation: demographics.occupation || DEFAULT_WAGE_LOSS_OCCUPATION,
      annualIncome
    }
  };
}
