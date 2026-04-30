import type { BodyMapGender, InjuryCalculatorData } from '@/types/calculator';

export const CALCULATOR_DRAFT_STORAGE_KEY = 'injury-calculator:draft:v1';
export const CALCULATOR_DRAFT_VERSION = 1;
export const CALCULATOR_DRAFT_DOCUMENT_ATTRIBUTE = 'data-calculator-draft';
export const CALCULATOR_DRAFT_PRESENT = 'present';
export const CALCULATOR_DRAFT_NONE = 'none';

export type CalculatorDraftStatus = typeof CALCULATOR_DRAFT_PRESENT | typeof CALCULATOR_DRAFT_NONE;
export type WorkLifeBooleanField =
  | 'hasWageLoss'
  | 'emotionalDistress'
  | 'lossOfConsortium'
  | 'permanentImpairment'
  | 'hasAttorney';
export type WorkLifeBooleanAnswers = Partial<Record<WorkLifeBooleanField, boolean>>;

const WORK_LIFE_BOOLEAN_FIELDS: WorkLifeBooleanField[] = [
  'hasWageLoss',
  'emotionalDistress',
  'lossOfConsortium',
  'permanentImpairment',
  'hasAttorney'
];

export interface CalculatorDraft {
  version: typeof CALCULATOR_DRAFT_VERSION;
  data: InjuryCalculatorData;
  hasStarted: boolean;
  currentStep: number;
  bodyModel: BodyMapGender | '';
  savedAt: string;
  workLifeBooleanAnswers?: WorkLifeBooleanAnswers;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function isCalculatorDraftPayload(value: unknown): value is Record<string, unknown> {
  if (!isPlainRecord(value)) return false;

  return value.version === CALCULATOR_DRAFT_VERSION && isPlainRecord(value.data);
}

export function normalizeCalculatorDraft(
  value: unknown,
  clampStep: (step: unknown) => number
): CalculatorDraft | null {
  if (!isCalculatorDraftPayload(value)) return null;

  return {
    version: CALCULATOR_DRAFT_VERSION,
    data: value.data as InjuryCalculatorData,
    hasStarted: Boolean(value.hasStarted),
    currentStep: clampStep(value.currentStep),
    bodyModel: value.bodyModel === 'female' || value.bodyModel === 'male' ? value.bodyModel : '',
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : new Date().toISOString(),
    workLifeBooleanAnswers: normalizeWorkLifeBooleanAnswers(value.workLifeBooleanAnswers)
  };
}

function normalizeWorkLifeBooleanAnswers(value: unknown): WorkLifeBooleanAnswers {
  if (!isPlainRecord(value)) return {};

  return WORK_LIFE_BOOLEAN_FIELDS.reduce<WorkLifeBooleanAnswers>((answers, field) => {
    if (typeof value[field] === 'boolean') {
      answers[field] = value[field];
    }

    return answers;
  }, {});
}

export function setCalculatorDraftDocumentStatus(status: CalculatorDraftStatus) {
  if (typeof document === 'undefined') return;

  if (document.documentElement.getAttribute(CALCULATOR_DRAFT_DOCUMENT_ATTRIBUTE) === status) return;

  document.documentElement.setAttribute(CALCULATOR_DRAFT_DOCUMENT_ATTRIBUTE, status);
}

export function createCalculatorDraftBootstrapScript() {
  const key = JSON.stringify(CALCULATOR_DRAFT_STORAGE_KEY);
  const attribute = JSON.stringify(CALCULATOR_DRAFT_DOCUMENT_ATTRIBUTE);
  const present = JSON.stringify(CALCULATOR_DRAFT_PRESENT);
  const none = JSON.stringify(CALCULATOR_DRAFT_NONE);

  return `(function(){var root=document.documentElement;function setStatus(status){root.setAttribute(${attribute},status)}try{var storage=window.localStorage;if(!storage||typeof storage.getItem!=="function"||typeof storage.removeItem!=="function"){setStatus(${none});return}var storedDraft=storage.getItem(${key});if(!storedDraft){setStatus(${none});return}var draft=JSON.parse(storedDraft);if(!draft||typeof draft!=="object"||Array.isArray(draft)||draft.version!==${CALCULATOR_DRAFT_VERSION}||!draft.data||typeof draft.data!=="object"||Array.isArray(draft.data)){storage.removeItem(${key});setStatus(${none});return}setStatus(${present})}catch(error){try{window.localStorage&&window.localStorage.removeItem(${key})}catch(_error){}setStatus(${none})}})();`;
}
