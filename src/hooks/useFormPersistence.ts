import { useState, useEffect } from "react";

/**
 * Custom hook to persist form data in localStorage.
 * @param key Unique key for the form draft
 * @param initialState Initial form state
 * @param isEdit If true, persistence is disabled or handled differently (to avoid overwriting real data with old drafts)
 * @param id Optional ID for specific entity draft (useful for edit pages)
 */
export function useFormPersistence<T>(key: string, initialState: T, isEdit: boolean = false, id?: string) {
  const storageKey = `form_draft_${key}${id ? `_${id}` : ""}`;

  const [formData, setFormData] = useState<T>(() => {
    // If it's an edit page without a specific draft for this ID, we might want to start fresh 
    // unless there is a specific draft for THIS ID.
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse form draft", e);
      }
    }
    return initialState;
  });

  useEffect(() => {
    // Only save if it's NOT the initial state or if it has been modified
    // To keep it simple, we save whenever formData changes.
    // If it's an edit mode, we still save drafts so that if the user edits and leaves, they don't lose changes.
    localStorage.setItem(storageKey, JSON.stringify(formData));
  }, [storageKey, formData]);

  const clearDraft = () => {
    localStorage.removeItem(storageKey);
  };

  return [formData, setFormData, clearDraft] as const;
}
