
'use server';

import { suggestUserRole } from '@/ai/flows/suggest-user-role';

/**
 * A placeholder function for suggesting a user role.
 * In a real application, this would call an AI model.
 * @param documentText The text content of the legal document.
 * @returns A promise that resolves to a hardcoded role string.
 */
export async function suggestRole(documentText: string): Promise<string> {
  if (!documentText) {
    throw new Error('Document text is required to suggest a role.');
  }
  
  const role = await suggestUserRole(documentText);
  return role;
}
