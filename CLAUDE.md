# Claude Development Notes

This file contains important context for Claude Code when working on this project.

## Project Overview

This is a California Auto Injury Settlement Calculator built with Next.js 15.3.2, React 19, and Tailwind CSS v3.4.17. The application helps users estimate potential settlement amounts for auto injury cases in California based on realistic industry data.

## Key Components & Architecture

### Form Structure
- **Multi-step form**: 6 steps using React Hook Form with validation
- **Step validation**: Custom validation for each step before progression
- **TypeScript**: Fully typed with comprehensive interfaces

### Major Components
- `SettlementCalculator.tsx` - Main form controller with step management
- `SettlementResults.tsx` - Results display with visual charts and breakdowns
- `InfoIcon.tsx` - Reusable tooltip component with smart positioning
- `steps/` directory - Individual form step components

### Calculation Logic
- `lib/settlementCalculator.ts` - Core settlement calculation algorithm
- Factors: medical costs, lost wages, pain & suffering, age, injury severity
- Attorney considerations: 33% fees, medical bill negotiation (60% reduction)

## Important Implementation Details

### CSS & Styling
- **Tailwind CSS v3.4.17** (NOT v4) - Downgraded from v4 alpha due to compatibility issues
- **CSS File**: `app/styles.css` (renamed from globals.css during troubleshooting)
- **Import**: Layout imports `./styles.css`

### Form Data Handling
- **String to Number Conversion**: All numeric form inputs are strings, converted with `Number()` in calculations
- **Default Values**: Form has sensible defaults (age: 35, income: empty string for placeholder)
- **Validation**: Custom validation for each step, prevents progression without required fields

### PWA Implementation
- **Manifest**: `/public/manifest.json` with app metadata
- **Service Worker**: `/public/sw.js` for offline functionality  
- **Icons**: SVG icons for different sizes (192x192, 512x512, 180x180)
- **iOS Optimization**: Apple-specific meta tags and mobile optimizations

### Key Fixes Applied

1. **Tailwind v4 → v3 Migration**: Resolved CSS loading issues
2. **CSS Import Issues**: Fixed by removing manual `<head>` tags that interfered with Next.js
3. **Form Validation**: Added step-by-step validation with error messaging
4. **Type Coercion**: Fixed string concatenation bugs in calculations
5. **Attorney Conditional Logic**: Medical negotiation and fees only apply when attorney selected
6. **InfoIcon Positioning**: Smart tooltip positioning to prevent screen overflow

## Development Commands

```bash
# Start development server (usually runs on port 3001 if 3000 is occupied)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Common Issues & Solutions

### CSS Not Loading
- Ensure Tailwind v3.4.17 is installed (not v4)
- Verify `app/styles.css` exists and is imported in layout.tsx
- Clear `.next` cache: `rm -rf .next`
- Check dev server is running on correct port

### Form Issues
- **Placeholder Disappearing**: Check default values in form initialization
- **Type Errors**: Ensure numeric calculations use `Number()` conversion
- **Validation**: Each step has custom validation logic in `validateCurrentStep()`

### PWA Issues
- Service worker registration is non-blocking (uses console.warn for errors)
- Manifest icons reference actual SVG files that exist
- No manual `<head>` tags - use Next.js metadata API

## Code Style & Patterns

- **TypeScript**: Strict typing with comprehensive interfaces
- **React Patterns**: Functional components with hooks
- **Form Management**: React Hook Form with validation
- **State Management**: Local component state with useState
- **Error Handling**: Graceful error handling with user feedback

## Testing Considerations

- Form validation works across all steps
- Calculations produce realistic settlement ranges
- PWA features work on mobile devices
- Responsive design tested on various screen sizes
- Attorney conditional logic properly toggles features

## Data Sources

Based on actual California insurance industry data and settlement patterns. Conservative estimates to provide realistic expectations, not inflated marketing promises.

---

**Note for Claude**: This project has been through significant troubleshooting, particularly around CSS loading and PWA implementation. The current configuration is stable and working. Be cautious about making structural changes that might reintroduce CSS loading issues.