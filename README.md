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
- **Body-Map Injury Severity**: Injury areas and severity ratings drive injury-specific estimate adjustments
- **County Venue Context**: Small California county trial-venue modifier using conservative/neutral/liberal venue tendencies
- **Treatment Tracking**: Detailed medical treatment and cost estimation
- **Pain & Suffering**: Calculated multipliers based on injury severity
- **Context Inputs**: Work disruption and insurance information can be recorded without capping estimate value

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
- **Deployment**: Cloudflare Workers with Edge Runtime

## App Metadata

- **App Manifest**: Mobile metadata and icons
- **Service Worker**: Not actively used; legacy registrations are cleaned up by `/sw.js`
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
    ├── manifest.json      # Web app metadata
    ├── sw.js             # Legacy service-worker cleanup stub
    └── *.svg             # App icons
```

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Wrangler CLI (for Cloudflare Workers deployment)

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

## Deployment

### Cloudflare Workers Deployment

This application is optimized for deployment on Cloudflare Workers for superior performance and global edge distribution.

#### Prerequisites
```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

#### Deploy to Workers
```bash
# Build and deploy in one command
npm run build && npm run prepare-worker && wrangler deploy

# Or use individual commands
npm run build          # Build Next.js application
npm run prepare-worker # Prepare static assets for Workers
wrangler deploy        # Deploy to Cloudflare Workers
```

#### Configuration
The `wrangler.toml` file contains the Workers configuration:
- **Runtime**: Edge Runtime with Node.js compatibility
- **Static Assets**: Served from `/dist` directory
- **API Routes**: Handled by the Worker function
- **Settlement Logic**: Self-contained calculation engine

#### Live Deployment
- **Production URL**: https://california-injury-calculator.drburton369.workers.dev
- **Edge Locations**: Global CDN with sub-100ms response times
- **Uptime**: 99.9% SLA with automatic failover

## Settlement Calculation Logic

### Base Value Calculation
1. **Medical Specials**: Estimated from selected treatment counts
2. **General Damages**: Multiplier applied to medical specials from body-map severity and treatment progression
3. **Gross Range**: Medical specials plus general damages, then range-shaped and adjusted for comparative fault

### Modifiers Applied
- **Age Factor**: Applied to general damages only
- **Impact Severity**: Progressively adjusts general damages
- **Body-Map Severity**: Selected injury areas and severity ratings drive the injury multiplier
- **County Venue Context**: Accident county adjusts general damages by venue tendency
- **Treatment Progression**: Imaging, therapy, injections, and surgery increase the general-damages multiplier

### Attorney Considerations
- **Legal Representation**: 33% contingency fee when applicable
- **Medical Negotiation**: 60% reduction in medical liens with attorney
- **Settlement Strategy**: Higher settlements typically achieved with representation

## Data Sources & Accuracy

This calculator is based on:
- **Insurance Industry Data**: Actual settlement ranges from claims databases
- **California Specific**: State-specific laws and precedents
- **County Venue Proxy**: California Secretary of State county-level election returns used as a conservative proxy for civil jury-pool tendency
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
