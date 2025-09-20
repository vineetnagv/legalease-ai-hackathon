
'use server';

import { suggestUserRole } from '@/ai/flows/suggest-user-role';

/**
 * Calls an AI model to suggest a user's role based on the document's text.
 * @param documentText The text content of the legal document.
 * @returns A promise that resolves to the suggested role string.
 * @throws An error if the document text is empty.
 */
export async function suggestRole(documentText: string): Promise<string> {
  if (!documentText) {
    throw new Error('Document text is required to suggest a role.');
  }

  const role = await suggestUserRole(documentText);
  return role;
}
