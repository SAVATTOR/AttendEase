const { courseTitleProblem } = require('../../src/utils/courseTitle');

describe('Course Title Rules', () => {
  it.each([
    'Introduction to Physics',
    'CSC 201 - Data Structures',
    'Calculus III',
    'C++ Programming',
    'C# and .NET Development',
    'Research Methods (Part I)',
    'Software Testing and Quality Assurance',
    'Business Law',
    'Law',
    'Strengths-Based Counselling',
    'Introduction à la Littérature Française',
    'Accounting: Principles & Practice',
    'Rhythm and Harmony',
  ])('should accept "%s"', (title) => {
    expect(courseTitleProblem(title)).toBeNull();
  });

  it.each([
    ['test', /full course title/],
    ['Test Class', /full course title/],
    ['my class 2', /full course title/],
    ['New Course', /full course title/],
    ['CSC 201', /full course title/],
    ['n/a', /full course title/],
    ['12345', /full course title/],
    ['asdfgh', /random typing/],
    ['qwerty', /random typing/],
    ['aaaaaa', /random typing/],
    ['Physicsssss', /random typing/],
    ['xkcdbfgt', /random typing/],
    ['Shit Class', /not allowed/],
    ['Physics!!!', /can only contain/],
    ['Maths 😀', /can only contain/],
    ['<script>', /can only contain/],
  ])('should reject "%s"', (title, reason) => {
    expect(courseTitleProblem(title)).toMatch(reason);
  });
});
