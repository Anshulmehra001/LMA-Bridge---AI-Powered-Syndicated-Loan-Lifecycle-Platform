/**
 * Document Processing Utilities
 * Handles PDF, Word, and text file processing for loan document analysis
 */

// Note: These imports work in Node.js environment
// For client-side processing, we'll handle files differently

export interface ProcessedDocument {
  text: string;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pageCount?: number;
    wordCount: number;
  };
}

/**
 * Process uploaded file and extract text content
 */
export async function processDocument(file: File): Promise<ProcessedDocument> {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  let extractedText = '';
  let pageCount: number | undefined;

  try {
    switch (fileExtension) {
      case '.txt':
        extractedText = await processTextFile(file);
        break;
      case '.pdf':
        const pdfResult = await processPDFFile(file);
        extractedText = pdfResult.text;
        pageCount = pdfResult.pageCount;
        break;
      case '.doc':
      case '.docx':
        extractedText = await processWordFile(file);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    // Clean up the extracted text
    const cleanedText = cleanExtractedText(extractedText);
    
    return {
      text: cleanedText,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: fileExtension,
        pageCount,
        wordCount: countWords(cleanedText)
      }
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error(`Failed to process ${fileExtension} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process text file
 */
async function processTextFile(file: File): Promise<string> {
  return await file.text();
}

/**
 * Process PDF file using pdf-parse
 * Note: This is a client-side implementation using FileReader
 */
async function processPDFFile(file: File): Promise<{ text: string; pageCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        // For client-side PDF processing, we'll use a different approach
        // Since pdf-parse requires Node.js, we'll implement a basic PDF text extraction
        
        // Convert ArrayBuffer to Uint8Array
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Basic PDF text extraction (simplified)
        // In a real implementation, you'd use a proper PDF parsing library
        const text = await extractTextFromPDFBuffer(uint8Array);
        
        resolve({
          text,
          pageCount: estimatePageCount(text)
        });
      } catch (error) {
        reject(new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Process Word document using mammoth
 */
async function processWordFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        // For client-side Word processing, we'll implement a basic extraction
        // In a real implementation, you'd use mammoth.js or similar
        const text = await extractTextFromWordBuffer(arrayBuffer);
        
        resolve(text);
      } catch (error) {
        reject(new Error(`Word document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Word document'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Basic PDF text extraction (simplified implementation)
 * Note: This is a basic implementation. For production use, consider using PDF.js or similar
 */
async function extractTextFromPDFBuffer(buffer: Uint8Array): Promise<string> {
  // Convert buffer to string and look for text content
  const pdfString = new TextDecoder('latin1').decode(buffer);
  
  // Basic PDF text extraction using regex patterns
  // This is a simplified approach - real PDF parsing is much more complex
  const textMatches = pdfString.match(/\(([^)]+)\)/g) || [];
  const streamMatches = pdfString.match(/stream\s*([\s\S]*?)\s*endstream/g) || [];
  
  let extractedText = '';
  
  // Extract text from PDF objects
  textMatches.forEach(match => {
    const text = match.slice(1, -1); // Remove parentheses
    if (text.length > 2 && /[a-zA-Z]/.test(text)) {
      extractedText += text + ' ';
    }
  });
  
  // If no text found in objects, try to extract from streams
  if (extractedText.trim().length === 0) {
    streamMatches.forEach(match => {
      const streamContent = match.replace(/^stream\s*/, '').replace(/\s*endstream$/, '');
      // Basic text extraction from stream content
      const textInStream = streamContent.match(/[A-Za-z0-9\s.,;:!?()-]+/g) || [];
      extractedText += textInStream.join(' ') + ' ';
    });
  }
  
  // If still no text, provide a helpful message
  if (extractedText.trim().length === 0) {
    throw new Error('No readable text found in PDF. The PDF might be image-based or encrypted. Please try copying the text manually.');
  }
  
  return extractedText.trim();
}

/**
 * Basic Word document text extraction
 * Note: This is a simplified implementation
 */
async function extractTextFromWordBuffer(buffer: ArrayBuffer): Promise<string> {
  // For .docx files, we can try to extract from the XML content
  const uint8Array = new Uint8Array(buffer);
  const docString = new TextDecoder('utf-8').decode(uint8Array);
  
  // Look for text content in Word document structure
  // This is a very basic implementation
  const textMatches = docString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
  
  let extractedText = '';
  textMatches.forEach(match => {
    const text = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
    extractedText += text + ' ';
  });
  
  // If no XML structure found, try basic text extraction
  if (extractedText.trim().length === 0) {
    // Look for readable text patterns
    const readableText = docString.match(/[A-Za-z0-9\s.,;:!?()-]{10,}/g) || [];
    extractedText = readableText.join(' ');
  }
  
  if (extractedText.trim().length === 0) {
    throw new Error('No readable text found in Word document. Please try copying the text manually or saving as a .txt file.');
  }
  
  return extractedText.trim();
}

/**
 * Clean and normalize extracted text
 */
function cleanExtractedText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters that might interfere with processing
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove multiple consecutive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimate page count based on text length
 */
function estimatePageCount(text: string): number {
  // Rough estimate: ~250 words per page
  const wordCount = countWords(text);
  return Math.max(1, Math.ceil(wordCount / 250));
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB. Please choose a smaller file.'
    };
  }
  
  if (!allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: 'Please upload a PDF, Word document (.doc/.docx), or text file (.txt).'
    };
  }
  
  return { isValid: true };
}