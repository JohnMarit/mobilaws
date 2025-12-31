/**
 * Utility to format HTML content for display
 * Converts HTML tags to properly formatted text
 */

/**
 * Strips HTML tags and converts to plain text with proper formatting
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Convert to plain text with proper spacing
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Formats HTML content for display, preserving structure but cleaning tags
 */
export function formatHtmlContent(html: string): string {
  if (!html) return '';
  
  // Create a temporary DOM element
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Process the content
  let formatted = '';
  
  // Process each child node
  const processNode = (node: Node): string => {
    let result = '';
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() || '';
      if (text) {
        result += text + ' ';
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      switch (tagName) {
        case 'p':
          // Paragraph - add double line break
          const pContent = Array.from(element.childNodes)
            .map(processNode)
            .join('')
            .trim();
          if (pContent) {
            result += pContent + '\n\n';
          }
          break;
          
        case 'strong':
        case 'b':
          // Bold text - keep as is (will be styled with CSS)
          const boldContent = Array.from(element.childNodes)
            .map(processNode)
            .join('')
            .trim();
          if (boldContent) {
            result += boldContent;
          }
          break;
          
        case 'em':
        case 'i':
          // Italic text
          const italicContent = Array.from(element.childNodes)
            .map(processNode)
            .join('')
            .trim();
          if (italicContent) {
            result += italicContent;
          }
          break;
          
        case 'ul':
          // Unordered list
          const listItems = Array.from(element.querySelectorAll('li'));
          listItems.forEach((li, index) => {
            const liContent = Array.from(li.childNodes)
              .map(processNode)
              .join('')
              .trim();
            if (liContent) {
              result += `• ${liContent}\n`;
            }
          });
          result += '\n';
          break;
          
        case 'ol':
          // Ordered list
          const orderedItems = Array.from(element.querySelectorAll('li'));
          orderedItems.forEach((li, index) => {
            const liContent = Array.from(li.childNodes)
              .map(processNode)
              .join('')
              .trim();
            if (liContent) {
              result += `${index + 1}. ${liContent}\n`;
            }
          });
          result += '\n';
          break;
          
        case 'li':
          // List item - handled by parent ul/ol
          result += Array.from(element.childNodes)
            .map(processNode)
            .join('')
            .trim();
          break;
          
        case 'br':
          // Line break
          result += '\n';
          break;
          
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          // Headings
          const headingContent = Array.from(element.childNodes)
            .map(processNode)
            .join('')
            .trim();
          if (headingContent) {
            result += headingContent + '\n\n';
          }
          break;
          
        default:
          // Other elements - process children
          result += Array.from(element.childNodes)
            .map(processNode)
            .join('');
          break;
      }
    }
    
    return result;
  };
  
  // Process all nodes
  formatted = Array.from(tempDiv.childNodes)
    .map(processNode)
    .join('');
  
  // Clean up extra whitespace and line breaks
  formatted = formatted
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
    .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
    .trim();
  
  return formatted;
}

/**
 * Renders HTML content safely with proper formatting
 * This preserves HTML structure but ensures it's clean
 */
export function renderHtmlContent(html: string): string {
  if (!html) return '';
  
  // First, try to clean and format the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove script tags and other dangerous elements
  const scripts = tempDiv.querySelectorAll('script, style, iframe, object, embed');
  scripts.forEach(el => el.remove());
  
  // Clean up the HTML
  let cleanedHtml = tempDiv.innerHTML;
  
  // Ensure proper spacing for paragraphs
  cleanedHtml = cleanedHtml.replace(/<p>/gi, '<p class="mb-4">');
  cleanedHtml = cleanedHtml.replace(/<ul>/gi, '<ul class="list-disc list-inside mb-4 space-y-2">');
  cleanedHtml = cleanedHtml.replace(/<ol>/gi, '<ol class="list-decimal list-inside mb-4 space-y-2">');
  cleanedHtml = cleanedHtml.replace(/<li>/gi, '<li class="ml-4">');
  cleanedHtml = cleanedHtml.replace(/<strong>/gi, '<strong class="font-semibold">');
  cleanedHtml = cleanedHtml.replace(/<h1>/gi, '<h1 class="text-2xl font-bold mb-4 mt-6">');
  cleanedHtml = cleanedHtml.replace(/<h2>/gi, '<h2 class="text-xl font-bold mb-3 mt-5">');
  cleanedHtml = cleanedHtml.replace(/<h3>/gi, '<h3 class="text-lg font-semibold mb-2 mt-4">');
  
  return cleanedHtml;
}

