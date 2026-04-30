import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {
  CALCULATOR_DRAFT_DOCUMENT_ATTRIBUTE,
  CALCULATOR_DRAFT_NONE,
  CALCULATOR_DRAFT_PRESENT,
  CALCULATOR_DRAFT_STORAGE_KEY,
  CALCULATOR_DRAFT_VERSION,
  createCalculatorDraftBootstrapScript,
  normalizeCalculatorDraft
} from '../lib/calculatorDraft';

function clampTestStep(step: unknown) {
  const numericStep = Number(step);
  if (!Number.isFinite(numericStep)) return 1;
  return Math.min(Math.max(Math.round(numericStep), 1), 5);
}

test('calculator draft normalizer accepts the current draft shape', () => {
  const draft = normalizeCalculatorDraft(
    {
      version: CALCULATOR_DRAFT_VERSION,
      data: { demographics: {} },
      hasStarted: true,
      currentStep: 9,
      bodyModel: 'female',
      savedAt: '2026-04-29T00:00:00.000Z'
    },
    clampTestStep
  );

  assert.ok(draft);
  assert.equal(draft.version, CALCULATOR_DRAFT_VERSION);
  assert.equal(draft.currentStep, 5);
  assert.equal(draft.bodyModel, 'female');
  assert.equal(draft.savedAt, '2026-04-29T00:00:00.000Z');
});

test('calculator draft normalizer rejects stale or malformed drafts', () => {
  assert.equal(normalizeCalculatorDraft(null, clampTestStep), null);
  assert.equal(normalizeCalculatorDraft({ version: 0, data: {} }, clampTestStep), null);
  assert.equal(normalizeCalculatorDraft({ version: CALCULATOR_DRAFT_VERSION, data: null }, clampTestStep), null);
  assert.equal(normalizeCalculatorDraft({ version: CALCULATOR_DRAFT_VERSION, data: [] }, clampTestStep), null);
});

test('calculator draft bootstrap sets the document state before React hydration', () => {
  const statuses: string[] = [];
  const storedDraft = JSON.stringify({
    version: CALCULATOR_DRAFT_VERSION,
    data: { demographics: {} },
    currentStep: 2
  });

  vm.runInNewContext(createCalculatorDraftBootstrapScript(), {
    document: {
      documentElement: {
        setAttribute(attribute: string, status: string) {
          statuses.push(`${attribute}:${status}`);
        }
      }
    },
    window: {
      localStorage: {
        getItem(key: string) {
          assert.equal(key, CALCULATOR_DRAFT_STORAGE_KEY);
          return storedDraft;
        },
        removeItem() {
          throw new Error('valid draft should not be removed');
        }
      }
    }
  });

  assert.deepEqual(statuses, [`${CALCULATOR_DRAFT_DOCUMENT_ATTRIBUTE}:${CALCULATOR_DRAFT_PRESENT}`]);
});

test('calculator draft bootstrap removes invalid drafts and shows start state', () => {
  const statuses: string[] = [];
  const removedKeys: string[] = [];

  vm.runInNewContext(createCalculatorDraftBootstrapScript(), {
    document: {
      documentElement: {
        setAttribute(attribute: string, status: string) {
          statuses.push(`${attribute}:${status}`);
        }
      }
    },
    window: {
      localStorage: {
        getItem() {
          return JSON.stringify({ version: 0, data: {} });
        },
        removeItem(key: string) {
          removedKeys.push(key);
        }
      }
    }
  });

  assert.deepEqual(removedKeys, [CALCULATOR_DRAFT_STORAGE_KEY]);
  assert.deepEqual(statuses, [`${CALCULATOR_DRAFT_DOCUMENT_ATTRIBUTE}:${CALCULATOR_DRAFT_NONE}`]);
});
