import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

interface ParseResult {
  text: string;
  metadata: {
    fileType: string;
    fileSize: number;
    extractionMethod: 'text' | 'pdf-parse' | 'mammoth' | 'ocr-gemini' | 'ocr-vision';
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
  private static readonly SUPPORTED_TYPES = ['.txt', '.pdf', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp'];

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

      // Check if it's an image type
      if (this.isImageType(detectedType)) {
        return await this.parseImageFile(uint8Array, detectedType, enableOCR);
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

  private static getImageMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
      'webp': 'image/webp'
    };
    return mimeTypes[extension] || 'image/jpeg';
  }

  private static isImageType(extension: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp'].includes(extension);
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

  private static async parseImageFile(buffer: Uint8Array, extension: string, enableOCR: boolean): Promise<ParseResult> {
    if (!enableOCR) {
      throw new Error('Image files require OCR processing. Please enable OCR to process image files.');
    }

    try {
      console.log(`Processing image file (${extension})...`);
      const mimeType = this.getImageMimeType(extension);
      return await this.performOCR(buffer, mimeType, true);
    } catch (error) {
      throw new Error(`Failed to process image file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async performOCR(buffer: Uint8Array, fileType: string, useFallback: boolean): Promise<ParseResult> {
    const ocrTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('OCR processing timeout after 120 seconds')), 120000);
    });

    // First try Gemini Vision (uses GEMINI_API_KEY which is already configured)
    try {
      console.log('Attempting Gemini Vision OCR (primary method)...');
      const text = await Promise.race([
        this.performGeminiVisionOCR(buffer, fileType),
        ocrTimeoutPromise
      ]);

      console.log(`✓ Gemini Vision OCR successful: ${text.length} characters extracted`);
      return {
        text: text.trim(),
        metadata: {
          fileType,
          fileSize: buffer.length,
          extractionMethod: 'ocr-gemini',
          confidence: 0.95
        }
      };
    } catch (error) {
      console.warn('✗ Gemini Vision OCR failed:', error instanceof Error ? error.message : 'Unknown error');
      if (!useFallback) {
        throw error;
      }
    }

    // Fallback to Google Cloud Vision (if available and configured)
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        console.log('Attempting Google Cloud Vision OCR as fallback...');
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
        console.warn('Google Cloud Vision OCR also failed:', error);
        throw new Error(`All OCR methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error('OCR failed with Gemini Vision. Google Cloud Vision is not configured. Please ensure GEMINI_API_KEY is set correctly.');
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

  private static async performGeminiVisionOCR(buffer: Uint8Array, contentType: string): Promise<string> {
    try {
      console.log(`Starting Gemini Vision OCR for ${contentType}...`);

      // Convert buffer to base64 for Gemini API
      const base64Data = Buffer.from(buffer).toString('base64');

      // Use Gemini to extract text from the document
      const response = await ai.generate({
        prompt: [
          {
            text: `You are an expert OCR system. Extract ALL text from this document image or PDF.

INSTRUCTIONS:
1. Extract every piece of text you can see in the document
2. Preserve the original structure and formatting as much as possible
3. Include headers, body text, footnotes, tables, and any other text elements
4. Maintain paragraph breaks and line spacing
5. Do NOT add any commentary, explanations, or metadata
6. Output ONLY the extracted text

If the document contains multiple pages, extract text from all visible pages in order.`
          },
          {
            media: {
              url: `data:${contentType};base64,${base64Data}`,
              contentType: contentType
            }
          }
        ],
        config: {
          temperature: 0.1, // Low temperature for accurate extraction
        },
      });

      const extractedText = response.text?.trim() || '';

      if (!extractedText || extractedText.length === 0) {
        throw new Error('Gemini Vision could not extract any text from the document');
      }

      console.log(`Gemini Vision OCR successful: ${extractedText.length} characters extracted`);
      return extractedText;

    } catch (error) {
      if (error instanceof Error) {
        console.error('Gemini Vision OCR error:', error.message);
        throw new Error(`Gemini Vision OCR failed: ${error.message}`);
      }
      throw new Error('Gemini Vision OCR failed: Unknown error');
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