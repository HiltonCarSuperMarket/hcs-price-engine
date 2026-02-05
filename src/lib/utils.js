import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { toast } from "sonner";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Toast utility functions for consistent notification handling
 */
export const toastUtils = {
  /**
   * Show a success toast notification
   * @param {string} message - The success message to display
   * @param {object} options - Additional toast options (duration, action, etc.)
   */
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Show an error toast notification
   * @param {string} message - The error message to display
   * @param {object} options - Additional toast options (duration, action, etc.)
   */
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  /**
   * Show an info toast notification
   * @param {string} message - The info message to display
   * @param {object} options - Additional toast options (duration, action, etc.)
   */
  info: (message, options = {}) => {
    return toast.info(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Show a warning toast notification
   * @param {string} message - The warning message to display
   * @param {object} options - Additional toast options (duration, action, etc.)
   */
  warning: (message, options = {}) => {
    return toast.warning(message, {
      duration: 4000,
      ...options,
    });
  },

  /**
   * Show a loading toast notification
   * @param {string} message - The loading message to display
   * @param {object} options - Additional toast options
   * @returns {string|number} - Toast ID for dismissing
   */
  loading: (message, options = {}) => {
    return toast.loading(message, options);
  },

  /**
   * Dismiss a toast by ID
   * @param {string|number} toastId - The toast ID to dismiss
   */
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};
