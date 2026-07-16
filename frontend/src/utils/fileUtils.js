/**
 * utils/fileUtils.js
 * Pure utility functions for file type detection and size formatting.
 *
 * Previously these were exported from FileCard.jsx and imported by
 * AttachmentCard.jsx — creating an anti-pattern of component-to-component
 * utility imports. Moving them here breaks that coupling.
 */

/** Allowed file extensions for document upload. */
export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".py", ".csv"];

/** Maximum upload size: 10 MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Returns icon colour, background colour, and a short label for a given filename.
 * @param {string} fileName
 * @returns {{ iconColor: string, bgColor: string, label: string }}
 */
export function getFileTypeDetails(fileName) {
  const ext = "." + fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case ".pdf":
      return { iconColor: "#ef4444", bgColor: "rgba(239, 68, 68, 0.15)",    label: "PDF"    };
    case ".docx":
      return { iconColor: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.15)",   label: "DOCX"   };
    case ".csv":
      return { iconColor: "#10b981", bgColor: "rgba(16, 185, 129, 0.15)",   label: "CSV"    };
    case ".py":
      return { iconColor: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.15)",   label: "Python" };
    case ".txt":
    case ".md":
      return { iconColor: "#a3a3a3", bgColor: "rgba(163, 163, 163, 0.15)", label: "Text"   };
    default:
      return { iconColor: "#9333ea", bgColor: "rgba(147, 51, 234, 0.15)",   label: "File"   };
  }
}

/**
 * Formats a byte count into a human-readable string (e.g. "2.4 MB").
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Returns true when a file passes all upload validations.
 * Sets error state via the provided setters on failure.
 * @param {File} file
 * @param {function} setUploadState
 * @param {function} setUploadError
 * @returns {boolean}
 */
export function validateFile(file, setUploadState, setUploadError) {
  const ext = "." + file.name.split(".").pop().toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    setUploadState("error");
    setUploadError("Unsupported file type. Upload PDF, DOCX, TXT, MD, PY, or CSV.");
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    setUploadState("error");
    setUploadError("File size exceeds 10 MB limit.");
    return false;
  }
  if (file.size === 0) {
    setUploadState("error");
    setUploadError("File is empty.");
    return false;
  }
  return true;
}
