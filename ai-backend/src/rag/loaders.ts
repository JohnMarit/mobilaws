import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { Document } from '@langchain/core/documents';

/**
 * Load a PDF file and convert to Document array
 */
async function loadPDF(filePath: string): Promise<Document[]> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  
  const fileName = path.basename(filePath);
  const documents: Document[] = [];
  
  // If pdf-parse provides page info, split by page
  if (data.numpages && data.numpages > 1) {
    // pdf-parse doesn't directly give page text, so we split the text heuristically
    const avgCharsPerPage = Math.ceil(data.text.length / data.numpages);
    const pageTexts: string[] = [];
    
    for (let i = 0; i < data.numpages; i++) {
      const start = i * avgCharsPerPage;
      const end = (i + 1) * avgCharsPerPage;
      pageTexts.push(data.text.slice(start, end));
    }
    
    pageTexts.forEach((pageText, idx) => {
      if (pageText.trim()) {
        documents.push(
          new Document({
            pageContent: pageText.trim(),
            metadata: {
              source: fileName,
              filePath: filePath,
              page: idx + 1,
              totalPages: data.numpages,
              title: fileName.replace(/\.pdf$/i, ''),
            },
          })
        );
      }
    });
  } else {
    // Single page or no page info
    documents.push(
      new Document({
        pageContent: data.text.trim(),
        metadata: {
          source: fileName,
          filePath: filePath,
          page: 1,
          totalPages: data.numpages || 1,
          title: fileName.replace(/\.pdf$/i, ''),
        },
      })
    );
  }
  
  return documents;
}

/**
 * Load a TXT file and convert to Document
 */
async function loadTXT(filePath: string): Promise<Document[]> {
  const text = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  
  return [
    new Document({
      pageContent: text.trim(),
      metadata: {
        source: fileName,
        filePath: filePath,
        page: 1,
        title: fileName.replace(/\.txt$/i, ''),
      },
    }),
  ];
}

/**
 * Load a DOCX file and convert to Document
 */
async function loadDOCX(filePath: string): Promise<Document[]> {
  const result = await mammoth.extractRawText({ path: filePath });
  const fileName = path.basename(filePath);
  
  return [
    new Document({
      pageContent: result.value.trim(),
      metadata: {
        source: fileName,
        filePath: filePath,
        page: 1,
        title: fileName.replace(/\.docx?$/i, ''),
      },
    }),
  ];
}

/**
 * Load a file based on its extension
 */
export async function loadFile(filePath: string): Promise<Document[]> {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    switch (ext) {
      case '.pdf':
        return await loadPDF(filePath);
      case '.txt':
        return await loadTXT(filePath);
      case '.docx':
      case '.doc':
        return await loadDOCX(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error(`❌ Error loading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Load multiple files
 */
export async function loadFiles(filePaths: string[]): Promise<Document[]> {
  const allDocuments: Document[] = [];
  
  for (const filePath of filePaths) {
    const docs = await loadFile(filePath);
    allDocuments.push(...docs);
  }
  
  console.log(`📚 Loaded ${allDocuments.length} documents from ${filePaths.length} files`);
  
  return allDocuments;
}


