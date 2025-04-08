/**
 * Utility function to create a delay
 * @param ms - Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms)); 