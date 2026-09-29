// Basic checks that a class name looks like an academic course title. They catch
// placeholders, random typing and abusive words; they cannot tell a real course from a
// plausible-sounding made-up one.

// Letters in any alphabet, digits, spaces and the only symbols allowed: ( ) . - &
const ALLOWED_CHARACTERS = /^[\p{L}\p{N}\s().\-&]+$/u;

const isWordCharacter = (character) => /[\p{L}\p{N}]/u.test(character);

// The nearest character that is not a space, looking backwards (step -1) or forwards (step 1).
const nearestCharacter = (title, index, step) => {
  for (let i = index + step; i >= 0 && i < title.length; i += step) {
    if (!/\s/.test(title[i])) return title[i];
  }
  return null;
};

// The allowed symbols must be used the way course titles use them, so they cannot be
// strung together into things like "Physics (&.-)" or "-- Maths &&".
const symbolProblem = (title) => {
  let insideBrackets = false;
  let bracketsHaveWord = false;

  for (let i = 0; i < title.length; i++) {
    const character = title[i];

    if (character === '(' || character === ')') {
      const opening = character === '(';
      if (opening === insideBrackets || (!opening && !bracketsHaveWord)) {
        return 'Brackets must be closed and have words inside, for example "Research Methods (Part I)"';
      }
      insideBrackets = opening;
      bracketsHaveWord = false;
    } else if (character === '.') {
      // Straight after a word, as in "Intro." or "2.0", which also rules out ".."
      if (i === 0 || !isWordCharacter(title[i - 1])) {
        return 'A full stop must come straight after a word, for example "Intro. to Physics"';
      }
    } else if (character === '-' || character === '&') {
      const before = nearestCharacter(title, i, -1);
      const after = nearestCharacter(title, i, 1);
      const wordBefore = before !== null && (isWordCharacter(before) || before === ')' || before === '.');
      const wordAfter = after !== null && (isWordCharacter(after) || after === '(');
      if (!wordBefore || !wordAfter) {
        return '"-" and "&" must go between words, for example "CSC 201 - Principles & Practice"';
      }
    } else if (insideBrackets && isWordCharacter(character)) {
      bracketsHaveWord = true;
    }
  }

  if (insideBrackets) {
    return 'Brackets must be closed and have words inside, for example "Research Methods (Part I)"';
  }
  return null;
};

// Words that never make a course title on their own. A title needs at least one word
// outside this list, so "Test Class" is rejected but "Software Testing" is not.
const PLACEHOLDER_WORDS = new Set([
  'test', 'tests', 'testing', 'demo', 'sample', 'example', 'dummy', 'placeholder', 'temp',
  'tmp', 'class', 'classes', 'course', 'courses', 'subject', 'lecture', 'lesson', 'module',
  'new', 'my', 'our', 'your', 'the', 'and', 'for', 'untitled', 'unnamed', 'name', 'title',
  'none', 'null', 'undefined', 'nil', 'nothing', 'something', 'anything', 'whatever',
  'stuff', 'thing', 'things', 'random', 'misc', 'hello', 'hey', 'lol', 'idk', 'okay', 'yes',
  'abc', 'xyz', 'foo', 'bar', 'baz', 'lorem', 'ipsum', 'blah', 'one', 'two', 'three',
]);

const OFFENSIVE_WORDS = new Set([
  'fuck', 'fucking', 'fucker', 'shit', 'shitty', 'bitch', 'bastard', 'asshole', 'dick',
  'cunt', 'whore', 'slut', 'porn', 'crap', 'damn',
]);

// Runs of neighbouring keys that no real word contains.
const KEYBOARD_RUNS = ['qwer', 'asdf', 'zxcv', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl', 'xcvb', 'cvbn', 'vbnm', 'uiop'];

const VOWEL = /[aeiouyàáâäãåèéêëìíîïòóôöõùúûü]/;
const ROMAN_NUMERAL = /^[ivxl]+$/;

// Returns why the title is not acceptable, or null when it is.
const courseTitleProblem = (title) => {
  if (!ALLOWED_CHARACTERS.test(title)) {
    return 'Course title can only contain letters, numbers, spaces and the symbols ( ) . - &';
  }

  const misusedSymbol = symbolProblem(title);
  if (misusedSymbol) {
    return misusedSymbol;
  }

  const words = title.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);

  if (words.some((word) => OFFENSIVE_WORDS.has(word))) {
    return 'Course title contains language that is not allowed';
  }

  const looksRandom = words.some((word) =>
    KEYBOARD_RUNS.some((run) => word.includes(run)) ||
    (/(\p{L})\1\1/u.test(word) && !ROMAN_NUMERAL.test(word)) ||
    /[bcdfghjklmnpqrstvwxz]{6,}/.test(word)
  );
  if (looksRandom) {
    return 'Course title looks like random typing. Enter the real course title';
  }

  // Needs one real word: three or more letters with a vowel, so course codes like "CSC"
  // and abbreviations do not count, and not a placeholder.
  const hasRealWord = words.some((word) =>
    word.length >= 3 && VOWEL.test(word) && !PLACEHOLDER_WORDS.has(word)
  );
  if (!hasRealWord) {
    return 'Enter the full course title, for example "Introduction to Physics"';
  }

  return null;
};

module.exports = {
  courseTitleProblem,
};
