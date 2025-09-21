import { NextRequest, NextResponse } from 'next/server';

interface ParseResult {
  text: string;
  metadata: {
    fileType: string;
    fileSize: number;
    extractionMethod: 'text' | 'pdf-parse' | 'mammoth' | 'ocr-vision' | 'ocr-tesseract';
    confidence?: number;
    error?: string;
    pages?: number;
  };
}

interface DocumentParserOptions {
  maxFileSize?: number; // in bytes, default 10MB
  enableOCR?: boolean;
  ocrFallback?: boolean;
}

class ServerDocumentParser {
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly SUPPORTED_TYPES = ['.txt', '.pdf', '.docx'];

  static async parse(file: File, options: DocumentParserOptions = {}): Promise<ParseResult> {
    const {
      maxFileSize = ServerDocumentParser.DEFAULT_MAX_SIZE,
      enableOCR = true,
      ocrFallback = true
    } = options;

    // Validate file size
    if (file.size > maxFileSize) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${(maxFileSize / 1024 / 1024).toFixed(1)}MB)`);
    }

    // Get file buffer and detect type
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    try {
      const { fileTypeFromBuffer } = await import('file-type');
      const fileType = await fileTypeFromBuffer(uint8Array);
      const detectedType = fileType?.ext || this.getExtensionFromName(file.name);

      // Validate supported file type
      if (!this.isSupportedType(detectedType)) {
        throw new Error(`Unsupported file type: ${detectedType}. Supported types: ${ServerDocumentParser.SUPPORTED_TYPES.join(', ')}`);
      }

      switch (detectedType) {
        case 'txt':
          return await this.parseTextFile(file, uint8Array);

        case 'pdf':
          return await this.parsePDFFile(uint8Array, enableOCR, ocrFallback);

        case 'docx':
          return await this.parseDocxFile(uint8Array);

        default:
          throw new Error(`Unsupported file type: ${detectedType}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static getExtensionFromName(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private static isSupportedType(type: string): boolean {
    return ServerDocumentParser.SUPPORTED_TYPES.some(supported => supported.includes(type));
  }

  private static async parseTextFile(file: File, buffer: Uint8Array): Promise<ParseResult> {
    try {
      const text = await file.text();

      if (!text || text.trim() === '') {
        throw new Error('File appears to be empty or contains no readable text');
      }

      return {
        text: text.trim(),
        metadata: {
          fileType: 'text/plain',
          fileSize: file.size,
          extractionMethod: 'text'
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async parsePDFFile(buffer: Uint8Array, enableOCR: boolean, ocrFallback: boolean): Promise<ParseResult> {
    try {
      // Dynamic import to avoid bundling issues
      const pdfParse = (await import('pdf-parse')).default;

      console.log('Starting PDF text extraction...');

      // Simple, direct PDF text extraction (like the user's working approach)
      const pdfData = await pdfParse(Buffer.from(buffer));

      const extractedText = pdfData.text?.trim() || '';
      const pageCount = pdfData.numpages || 0;
      const textLength = extractedText.length;

      console.log(`PDF text extraction completed: ${textLength} characters extracted from ${pageCount} pages`);

      // If we got ANY text at all, use it (don't be picky about quality)
      if (textLength > 0) {
        console.log('PDF text extraction successful, proceeding with extracted text');
        return {
          text: extractedText,
          metadata: {
            fileType: 'application/pdf',
            fileSize: buffer.length,
            extractionMethod: 'pdf-parse',
            confidence: 1.0,
            pages: pageCount
          }
        };
      }

      // Only try OCR if we got absolutely NO text from pdf-parse
      console.log('No text extracted from PDF, checking OCR options...');

      if (enableOCR) {
        console.log('Attempting OCR processing as fallback...');
        return await this.performOCR(buffer, 'application/pdf', ocrFallback);
      }

      throw new Error(`PDF contains no extractable text and OCR is disabled. This appears to be an image-based PDF with ${pageCount} pages.`);
    } catch (error) {
      console.error('PDF parsing error:', error);

      // If pdf-parse failed completely and OCR is available, try it as a fallback
      if (enableOCR && ocrFallback) {
        try {
          console.log('PDF parsing failed, attempting OCR fallback...');
          return await this.performOCR(buffer, 'application/pdf', ocrFallback);
        } catch (ocrError) {
          const errorMsg = ocrError instanceof Error ? ocrError.message : 'Unknown OCR error';
          throw new Error(`PDF text extraction failed, and OCR processing also failed: ${errorMsg}. Please try a different document or convert to a text-based format.`);
        }
      }
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async parseDocxFile(buffer: Uint8Array): Promise<ParseResult> {
    try {
      // Dynamic import to avoid bundling issues
      const mammoth = await import('mammoth');

      const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer as ArrayBuffer });

      if (!result.value || result.value.trim() === '') {
        throw new Error('DOCX file appears to be empty or contains no readable text');
      }

      return {
        text: result.value.trim(),
        metadata: {
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileSize: buffer.length,
          extractionMethod: 'mammoth',
          confidence: 1.0
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async performOCR(buffer: Uint8Array, fileType: string, useFallback: boolean): Promise<ParseResult> {
    const ocrTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OCR processing timeout after 60 seconds')), 60000);
    });

    // First try Google Cloud Vision (if available)
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        console.log('Attempting Google Cloud Vision OCR...');
        const text = await Promise.race([
          this.performCloudVisionOCR(buffer),
          ocrTimeoutPromise
        ]);

        console.log(`Google Cloud Vision OCR successful: ${text.length} characters extracted`);
        return {
          text: text.trim(),
          metadata: {
            fileType,
            fileSize: buffer.length,
            extractionMethod: 'ocr-vision',
            confidence: 0.9
          }
        };
      } catch (error) {
        console.warn('Google Cloud Vision OCR failed:', error);
        if (!useFallback) {
          throw error;
        }
      }
    }

    // Fallback to Tesseract.js (server-side)
    if (useFallback) {
      try {
        console.log('Attempting Tesseract.js OCR fallback...');
        const text = await Promise.race([
          this.performTesseractOCR(buffer),
          ocrTimeoutPromise
        ]);

        console.log(`Tesseract.js OCR successful: ${text.length} characters extracted`);
        return {
          text: text.trim(),
          metadata: {
            fileType,
            fileSize: buffer.length,
            extractionMethod: 'ocr-tesseract',
            confidence: 0.7
          }
        };
      } catch (error) {
        throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error('OCR is not available - missing API credentials');
  }

  private static async performCloudVisionOCR(buffer: Uint8Array): Promise<string> {
    try {
      // Dynamic import to avoid bundling issues
      const vision = await import('@google-cloud/vision');

      // Initialize the client
      // This will use GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_VISION_API_KEY env vars
      const client = new vision.ImageAnnotatorClient();

      // Perform text detection
      const [result] = await client.textDetection({
        image: { content: Buffer.from(buffer) },
      });

      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        throw new Error('No text detected in document');
      }

      // The first annotation contains the full detected text
      const text = detections[0].description;

      if (!text || text.trim() === '') {
        throw new Error('No readable text found in document');
      }

      return text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Google Cloud Vision OCR failed: ${error.message}`);
      }
      throw new Error('Google Cloud Vision OCR failed: Unknown error');
    }
  }

  private static async performTesseractOCR(buffer: Uint8Array): Promise<string> {
    // Dynamic import to avoid bundling issues
    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker(['eng']);

    try {
      const { data: { text } } = await worker.recognize(Buffer.from(buffer));

      if (!text || text.trim() === '') {
        throw new Error('OCR could not extract any text from the document');
      }

      return text;
    } finally {
      await worker.terminate();
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Parse the document with enhanced options
    const result = await ServerDocumentParser.parse(file, {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      enableOCR: true,
      ocrFallback: true
    });

    console.log(`Document parsing successful: ${result.metadata.extractionMethod} extracted ${result.text.length} characters`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Document parsing error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Provide more specific error responses
    let statusCode = 500;
    let userFriendlyMessage = errorMessage;

    if (errorMessage.includes('timeout')) {
      statusCode = 408;
      if (errorMessage.includes('OCR')) {
        userFriendlyMessage = 'OCR processing timed out. This document may be too complex for text recognition. Please try a text-based PDF or different document format.';
      } else {
        userFriendlyMessage = 'Document processing timed out. Please try again or contact support if the issue persists.';
      }
    } else if (errorMessage.includes('File size') && errorMessage.includes('exceeds')) {
      statusCode = 413;
      userFriendlyMessage = errorMessage; // Keep the original size message
    } else if (errorMessage.includes('Unsupported file type')) {
      statusCode = 415;
      userFriendlyMessage = errorMessage; // Keep the original unsupported type message
    } else if (errorMessage.includes('empty') || errorMessage.includes('no readable text')) {
      statusCode = 422;
      userFriendlyMessage = 'The document appears to be empty or contains no readable text. Please check your file and try again.';
    } else if (errorMessage.includes('OCR failed') || errorMessage.includes('OCR is not available')) {
      statusCode = 422;
      userFriendlyMessage = 'Unable to extract text from this document. The file may be a scanned image or corrupted PDF. Please try uploading a text-based document.';
    }

    return NextResponse.json(
      {
        error: userFriendlyMessage,
        details: errorMessage !== userFriendlyMessage ? errorMessage : undefined
      },
      { status: statusCode }
    );
  }
}