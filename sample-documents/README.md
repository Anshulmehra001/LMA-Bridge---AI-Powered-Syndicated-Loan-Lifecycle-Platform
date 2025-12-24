# Sample Loan Documents for Testing

This folder contains sample loan documents in various formats that you can use to test LMA Bridge's document analysis capabilities.

## 📁 **Available Sample Documents**

### **1. Standard Corporate Loan**
- **File**: `corporate-loan-agreement.txt`
- **Type**: Standard revolving credit facility
- **Amount**: $500,000,000 USD
- **Borrower**: TechCorp Industries Inc.
- **Features**: Basic covenants, standard terms

### **2. Sustainability-Linked Loan**
- **File**: `esg-loan-agreement.txt`
- **Type**: ESG-focused sustainability-linked loan
- **Amount**: $300,000,000 USD
- **Borrower**: Green Energy Solutions Inc.
- **Features**: ESG targets, interest rate discounts

### **3. Acquisition Financing**
- **File**: `acquisition-loan-agreement.txt`
- **Type**: Term loan for acquisition financing
- **Amount**: $750,000,000 USD
- **Borrower**: Global Manufacturing Corp
- **Features**: Higher leverage, acquisition-specific terms

### **4. Real Estate Financing**
- **File**: `real-estate-loan-agreement.txt`
- **Type**: Commercial real estate loan
- **Amount**: $200,000,000 USD
- **Borrower**: Property Development LLC
- **Features**: Property-specific covenants, construction terms

## 🔧 **How to Use These Documents**

### **Method 1: File Upload (Now Working!)**
1. Use the HTML files to create PDF/Word documents (see CONVERT_TO_PDF_WORD.md)
2. Go to LMA Bridge → Loan Origination → AI Document Analysis
3. Click "Choose File" and select your PDF, Word, or text file
4. The application will automatically extract text and analyze it
5. Review the extracted data and click "Verify & Lock"

### **Method 2: Copy and Paste (Always Works)**
1. Open any `.txt` file in this folder
2. Copy the entire content
3. Go to LMA Bridge → Loan Origination → AI Document Analysis
4. Paste the content in the text area
5. Click "Analyze Document"

### **Supported File Formats**
- ✅ **PDF files (.pdf)** - Text extraction and AI analysis
- ✅ **Word documents (.doc/.docx)** - Text extraction and AI analysis  
- ✅ **Text files (.txt)** - Direct processing
- ✅ **Maximum file size**: 10MB
- ✅ **Auto-analysis**: Files are automatically analyzed after upload

## 📋 **Document Structure**

Each sample document includes:
- **Borrower Information**: Company name and details
- **Facility Details**: Amount, currency, interest rate
- **Financial Covenants**: Leverage ratios, coverage ratios
- **ESG Targets**: Sustainability commitments (where applicable)
- **Legal Terms**: Standard loan agreement clauses

## 🎯 **Testing Scenarios**

### **Scenario 1: Basic Loan Processing**
Use `corporate-loan-agreement.txt` to test:
- Basic document analysis
- Standard covenant extraction
- Risk monitoring setup

### **Scenario 2: ESG Loan Management**
Use `esg-loan-agreement.txt` to test:
- ESG target extraction
- Sustainability milestone tracking
- Interest rate discount calculations

### **Scenario 3: High-Risk Loan**
Use `acquisition-loan-agreement.txt` to test:
- High leverage ratio handling
- Risk alert systems
- Covenant breach scenarios

### **Scenario 4: Specialized Financing**
Use `real-estate-loan-agreement.txt` to test:
- Industry-specific terms
- Property-related covenants
- Construction loan features

## 📝 **Creating Your Own Test Documents**

To create additional test documents, include these key elements:

```
LOAN AGREEMENT HEADER
Borrower: [Company Name]
Facility Amount: $[Amount] [Currency]
Interest Rate: [Base Rate] + [Margin]%
Maturity: [Date]

FINANCIAL COVENANTS:
- Maximum Leverage Ratio: [X.X]x
- Minimum Interest Coverage: [X.X]x

ESG TARGETS (if applicable):
- [Sustainability goal]
- Interest rate discount: [X.X]% upon achievement
```

## ⚠️ **Important Notes**

1. **These are fictional documents** created for testing purposes only
2. **Not legal documents** - do not use for actual loan agreements
3. **Text format only** - PDF/Word processing not yet implemented
4. **Sample data** - all companies and terms are fictional
5. **Testing purposes** - designed to demonstrate LMA Bridge capabilities

## 🔄 **Future Enhancements**

Planned improvements for document processing:
- PDF file upload and parsing
- Word document (.doc/.docx) support
- OCR for scanned documents
- Batch document processing
- Document version comparison
- Automated document classification