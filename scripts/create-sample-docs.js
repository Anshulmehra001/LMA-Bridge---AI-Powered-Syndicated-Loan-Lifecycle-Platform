/**
 * Script to create sample PDF and Word documents for testing
 * Run with: node scripts/create-sample-docs.js
 */

const fs = require('fs');
const path = require('path');

// Create sample documents folder if it doesn't exist
const sampleDocsDir = path.join(__dirname, '..', 'sample-documents');
if (!fs.existsSync(sampleDocsDir)) {
  fs.mkdirSync(sampleDocsDir, { recursive: true });
}

// Read the text content from existing files
const corporateLoanText = fs.readFileSync(
  path.join(sampleDocsDir, 'corporate-loan-agreement.txt'), 
  'utf8'
);

const esgLoanText = fs.readFileSync(
  path.join(sampleDocsDir, 'esg-loan-agreement.txt'), 
  'utf8'
);

// Create simple HTML versions that can be saved as PDF
const createHTMLDocument = (title, content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .article {
            margin: 20px 0;
        }
        .article-title {
            font-weight: bold;
            color: #2980b9;
            margin: 15px 0 5px 0;
        }
        .signature-section {
            margin-top: 40px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }
        pre {
            white-space: pre-wrap;
            font-family: 'Times New Roman', serif;
        }
    </style>
</head>
<body>
    <pre>${content}</pre>
    <div class="signature-section">
        <p><em>This is a sample document created for testing LMA Bridge document processing capabilities.</em></p>
        <p><strong>Note:</strong> This is not a real legal document and should not be used for actual loan agreements.</p>
    </div>
</body>
</html>
`;

// Create HTML files that can be converted to PDF
fs.writeFileSync(
  path.join(sampleDocsDir, 'corporate-loan-agreement.html'),
  createHTMLDocument('Corporate Loan Agreement', corporateLoanText)
);

fs.writeFileSync(
  path.join(sampleDocsDir, 'esg-loan-agreement.html'),
  createHTMLDocument('Sustainability-Linked Loan Agreement', esgLoanText)
);

// Create instructions for users
const instructionsContent = `# Converting Sample Documents to PDF/Word

Since we cannot programmatically create PDF or Word files without additional dependencies, please follow these steps to create test documents:

## Creating PDF Files

### Method 1: Using Browser
1. Open the HTML files in this folder with your web browser:
   - corporate-loan-agreement.html
   - esg-loan-agreement.html
2. Press Ctrl+P (or Cmd+P on Mac) to print
3. Select "Save as PDF" as the destination
4. Save as:
   - corporate-loan-agreement.pdf
   - esg-loan-agreement.pdf

### Method 2: Using Online Converter
1. Go to any HTML to PDF converter (like htmltopdf.com)
2. Upload the HTML files
3. Download the converted PDF files

## Creating Word Files

### Method 1: Copy and Paste
1. Open the .txt files in this folder
2. Copy the content
3. Open Microsoft Word
4. Paste the content
5. Save as:
   - corporate-loan-agreement.docx
   - esg-loan-agreement.docx

### Method 2: Using Online Converter
1. Go to any text to Word converter
2. Upload the .txt files
3. Download the converted Word files

## Testing the Documents

Once you have PDF and Word files:
1. Go to LMA Bridge application
2. Navigate to Loan Origination tab
3. Select "AI Document Analysis"
4. Click "Choose File" and upload your PDF or Word document
5. The application will extract the text and analyze it

## File Formats Supported

✅ **Text Files (.txt)** - Direct upload and processing
✅ **PDF Files (.pdf)** - Text extraction and processing  
✅ **Word Files (.doc/.docx)** - Text extraction and processing

Maximum file size: 10MB
`;

fs.writeFileSync(
  path.join(sampleDocsDir, 'CONVERT_TO_PDF_WORD.md'),
  instructionsContent
);

console.log('✅ Sample document templates created successfully!');
console.log('📁 Files created in sample-documents folder:');
console.log('   - corporate-loan-agreement.html');
console.log('   - esg-loan-agreement.html');
console.log('   - CONVERT_TO_PDF_WORD.md');
console.log('');
console.log('📋 Next steps:');
console.log('1. Open the HTML files in your browser');
console.log('2. Print to PDF to create test PDF files');
console.log('3. Copy content to Word to create test Word files');
console.log('4. Test the file upload feature in LMA Bridge');