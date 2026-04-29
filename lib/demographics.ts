import { InjuryCalculatorData } from '@/types/calculator';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateOnly(value: unknown) {
  if (typeof value !== 'string') return null;

  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function dateInputValueForAge(age: number, referenceDate = new Date()) {
  const date = new Date(
    referenceDate.getFullYear() - age,
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join('-');
}

export function ageFromDateOfBirth(dateOfBirth: unknown, referenceDate = new Date()): number | null {
  const parsed = parseDateOnly(dateOfBirth);
  if (!parsed) return null;

  let age = referenceDate.getFullYear() - parsed.year;
  const birthdayHasPassed =
    referenceDate.getMonth() + 1 > parsed.month ||
    (referenceDate.getMonth() + 1 === parsed.month && referenceDate.getDate() >= parsed.day);

  if (!birthdayHasPassed) age -= 1;

  return age;
}

export function ageIsInAllowedRange(age: unknown, minimumAge = 18, maximumAge = 100) {
  const numericAge = Number(age);
  return Number.isFinite(numericAge) && numericAge >= minimumAge && numericAge <= maximumAge;
}

export function dateOfBirthIsInAllowedRange(
  dateOfBirth: unknown,
  referenceDate = new Date(),
  minimumAge = 18,
  maximumAge = 100
) {
  const age = ageFromDateOfBirth(dateOfBirth, referenceDate);
  return ageIsInAllowedRange(age, minimumAge, maximumAge);
}

export function calculatorAgeFromDemographics(
  demographics: Pick<InjuryCalculatorData['demographics'], 'age' | 'dateOfBirth'>,
  referenceDate = new Date()
) {
  const dateOfBirthAge = ageFromDateOfBirth(demographics.dateOfBirth, referenceDate);
  if (ageIsInAllowedRange(dateOfBirthAge)) return dateOfBirthAge as number;

  const legacyAge = Number(demographics.age);
  return ageIsInAllowedRange(legacyAge) ? legacyAge : 0;
}
