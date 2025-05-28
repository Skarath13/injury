# California Auto Injury Settlement Calculator

A comprehensive, realistic settlement estimation tool for California auto injury cases, built with Next.js and React.

## Features

### Core Functionality
- **6-Step Assessment Process**: Demographics, accident details, injuries, treatment, life impact, and insurance
- **Realistic Estimates**: Based on actual insurance industry data and practices
- **Visual Results**: Interactive pie charts and settlement range visualizations
- **Form Validation**: Comprehensive validation with helpful error messages
- **Responsive Design**: Optimized for desktop and mobile devices

### Advanced Capabilities
- **Attorney Fee Calculations**: Conditional 33% attorney fees when applicable
- **Medical Bill Negotiation**: Automatic 60% reduction when attorney is involved
- **Multiple Injury Types**: Support for soft tissue, fractures, TBI, spinal issues
- **Treatment Tracking**: Detailed medical treatment and cost estimation
- **Pain & Suffering**: Calculated multipliers based on injury severity
- **Lost Wages**: Income-based calculations with missed work days

### User Experience
- **Hover Info Icons**: Contextual information without cluttering the interface
- **Progressive Disclosure**: Step-by-step form prevents overwhelming users
- **Smart Defaults**: Reasonable starting values for faster completion
- **Error Prevention**: Form validation prevents invalid submissions
- **Print Functionality**: Results can be printed for client meetings

## Technology Stack

- **Framework**: Next.js 15.3.2 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS v3.4.17
- **Forms**: React Hook Form with validation
- **Icons**: Lucide React
- **Components**: Radix UI primitives

## PWA Features

- **Progressive Web App**: Installable on mobile devices
- **Service Worker**: Offline functionality with caching
- **App Manifest**: Native app-like experience
- **iOS Optimized**: Special handling for iPhone Safari
- **Mobile-First**: Touch targets and responsive design

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx           # Home page
│   └── styles.css         # Global styles and Tailwind imports
├── components/
│   ├── Header.tsx         # Site header with navigation
│   ├── Footer.tsx         # Site footer with disclaimers
│   ├── InfoIcon.tsx       # Reusable tooltip component
│   ├── SettlementCalculator.tsx  # Main form controller
│   ├── SettlementResults.tsx     # Results display with charts
│   └── steps/             # Individual form steps
│       ├── DemographicsStep.tsx
│       ├── AccidentStep.tsx
│       ├── InjuriesStep.tsx
│       ├── TreatmentStep.tsx
│       ├── ImpactStep.tsx
│       └── InsuranceStep.tsx
├── lib/
│   └── settlementCalculator.ts  # Core calculation logic
├── types/
│   └── calculator.ts      # TypeScript type definitions
└── public/
    ├── manifest.json      # PWA manifest
    ├── sw.js             # Service worker
    └── *.svg             # App icons
```

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
git clone https://github.com/Skarath13/injury.git
cd injury
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Settlement Calculation Logic

### Base Value Calculation
1. **Medical Costs**: Estimated or actual treatment costs
2. **Lost Wages**: Based on income and missed work days
3. **Pain & Suffering**: Multiplier applied to medical costs (1.5x - 5x)

### Modifiers Applied
- **Age Factor**: Younger plaintiffs receive higher multipliers
- **Impact Severity**: Collision severity affects settlement value
- **Prior Injuries**: Reduces settlement value
- **TBI**: Significant positive multiplier for brain injuries
- **Spinal Issues**: Herniation, nerve compression increase value
- **Surgery**: Major positive impact on settlement range
- **Ongoing Treatment**: Increases future medical considerations

### Attorney Considerations
- **Legal Representation**: 33% contingency fee when applicable
- **Medical Negotiation**: 60% reduction in medical liens with attorney
- **Settlement Strategy**: Higher settlements typically achieved with representation

## Data Sources & Accuracy

This calculator is based on:
- **Insurance Industry Data**: Actual settlement ranges from claims databases
- **California Specific**: State-specific laws and precedents
- **Conservative Estimates**: Realistic ranges, not inflated promises
- **Adjuster Experience**: Built by experienced litigation professional

**Disclaimer**: This tool provides estimates only. Actual settlements vary based on numerous factors including specific case details, jurisdiction, jury composition, and negotiation skills. Always consult with a qualified attorney for legal advice.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For technical issues or questions about the calculator methodology, please open an issue on GitHub.

---

**Remember**: Most soft tissue injuries settle between $5,000-$25,000. This calculator provides realistic estimates based on actual industry data, not inflated marketing promises.