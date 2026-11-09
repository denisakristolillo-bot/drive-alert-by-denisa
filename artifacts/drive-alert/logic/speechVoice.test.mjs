import assert from 'node:assert/strict';
import test from 'node:test';
import { selectAlertVoice } from './speechVoice.ts';

const voice = (language, identifier) => ({
  language,
  identifier,
  name: identifier,
  quality: 'Default',
});

test('uses an installed voice matching the active language', () => {
  assert.deepEqual(
    selectAlertVoice(
      [voice('it-IT', 'italian'), voice('nl-NL', 'dutch')],
      'nl',
    ),
    { language: 'nl-NL', voice: 'dutch' },
  );
});

test('falls back to an installed Italian voice when the active voice is missing', () => {
  assert.deepEqual(
    selectAlertVoice([voice('it-IT', 'italian')], 'ru'),
    { language: 'it-IT', voice: 'italian' },
  );
});

test('requests Italian when neither the active nor Italian voice is listed', () => {
  assert.deepEqual(
    selectAlertVoice([voice('en-US', 'english')], 'ko'),
    { language: 'it-IT' },
  );
});

test('matches language codes with either hyphens or underscores', () => {
  assert.deepEqual(
    selectAlertVoice([voice('pl_PL', 'polish')], 'pl'),
    { language: 'pl_PL', voice: 'polish' },
  );
});
