# LMA Bridge
### AI-Powered Syndicated Loan Lifecycle Platform

A web application that demonstrates AI-powered document analysis and loan management workflows for syndicated lending.

---

## What is LMA Bridge?

LMA Bridge is a prototype platform that showcases how AI can be integrated into syndicated loan management processes. It provides a user interface for document analysis, ESG tracking, risk monitoring, and trading workflows.

## Features

### Document Analysis
- Upload loan documents (PDF, Word, text)
- AI-powered extraction of key loan terms
- Fallback to demo data when AI is unavailable
- Support for both live AI analysis and demo mode

### Risk Dashboard
- Interactive leverage ratio monitoring
- Covenant tracking with visual indicators
- Real-time risk calculations
- Historical trend visualization

### ESG Management
- ESG target tracking from loan documents
- Interest rate discount calculations
- Milestone verification workflow
- Compliance status monitoring

### Trading Interface
- Loan facility overview
- Lender allocation management
- Trade execution simulation
- Portfolio summary views

---

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **AI Integration**: Google Gemini API
- **UI Components**: Tailwind CSS, Radix UI
- **Testing**: Jest with 130+ tests
- **Build Tool**: Next.js with Turbopack

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Anshulmehra001/LMA-Bridge---AI-Powered-Syndicated-Loan-Lifecycle-Platform.git
cd lma-bridge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
```bash
cp .env.example .env.local
# Add your Google Gemini API key to .env.local
# GEMINI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Mode

The application works without an API key by using demo data. This allows you to explore all features without external dependencies.

---

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint

---

## Project Structure

```
src/
├── actions/          # Server actions (AI analysis)
├── app/             # Next.js app router pages
├── components/      # React components
│   ├── tabs/        # Main feature tabs
│   └── ui/          # Reusable UI components
├── contexts/        # React context providers
├── lib/             # Utility functions
└── types/           # TypeScript type definitions
```

---

## Testing

The project includes comprehensive testing:
- Unit tests for components and functions
- Integration tests for user workflows
- Property-based testing for data validation
- UI responsiveness tests

Run tests with:
```bash
npm test
```

Current test status: 126/130 tests passing (96.9% pass rate)

---

## API Integration

### Google Gemini AI
The application can integrate with Google's Gemini AI for document analysis. When configured with an API key, it will:
- Extract loan terms from uploaded documents
- Parse structured data from unstructured text
- Validate extracted information

### Fallback Behavior
Without an API key, the application:
- Uses predefined demo data
- Maintains full functionality
- Shows appropriate user notifications

---

## Development Notes

### Demo Data
The application includes realistic demo data for:
- Sample loan agreements
- ESG targets and milestones
- Risk metrics and covenants
- Trading scenarios

### Error Handling
- Graceful degradation when AI is unavailable
- User-friendly error messages
- Comprehensive logging for debugging
- Fallback to demo data on failures

### Responsive Design
- Works on desktop, tablet, and mobile
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Contributing

This is a prototype application. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

---

## Disclaimer

This is a demonstration application built to showcase AI integration in loan management workflows. It is not intended for production use in actual financial transactions.