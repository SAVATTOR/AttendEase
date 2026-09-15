# Testing Guide

This project uses **Vitest** for unit and integration testing, along with **React Testing Library** for component testing.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `__tests__/` - Test files co-located with source files
- `test/setup.ts` - Global test setup and mocks

## Writing Tests

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Service Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myService } from './myService';

describe('myService', () => {
  it('should call API correctly', async () => {
    const result = await myService.getData();
    expect(result).toBeDefined();
  });
});
```

## Mocking

- Use `vi.mock()` to mock modules
- Use `vi.fn()` to create mock functions
- Mock localStorage, window, etc. in `test/setup.ts`

