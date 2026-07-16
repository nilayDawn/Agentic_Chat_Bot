import { X, Loader2, AlertCircle, CheckCircle, FileText, FileCode } from "lucide-react";
import { getFileTypeDetails, formatFileSize } from "../utils/fileUtils";

/**
 * FileCard
 * Shows a pending-upload file card inside the chat input area.
 * Displays the file name, size, and live ingestion status (uploading / success / error).
 *
 * @param {{ file: File, onRemove: function, uploadState: string, uploadError: string }} props
 */
export default function FileCard({ file, onRemove, uploadState, uploadError }) {
  const details       = getFileTypeDetails(file.name);
  const fileSizeStr   = formatFileSize(file.size);
  const ext           = "." + file.name.split(".").pop().toLowerCase();
  const IconComponent = ext === ".py" ? FileCode : FileText;

  return (
    <div
      style={{
        width: "250px",
        background: "#252525",
        border: "1px solid #3c3c3c",
        borderRadius: "12px",
        padding: "12px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        title="Remove file"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: "50%",
          width: "22px",
          height: "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#888",
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#333";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#1e1e1e";
          e.currentTarget.style.color = "#888";
        }}
      >
        <X size={12} />
      </button>

      {/* File info row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingRight: "18px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: details.bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconComponent size={20} color={details.iconColor} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#ececec",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={file.name}
          >
            {file.name}
          </span>
          <span style={{ fontSize: "11px", color: "#8a8a8a", marginTop: "2px" }}>
            {fileSizeStr}
          </span>
        </div>
      </div>

      {/* Ingestion status row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          paddingTop: "8px",
          borderTop: "1px solid #333",
        }}
      >
        {uploadState === "uploading" && (
          <>
            <Loader2 size={12} color="#f59e0b" className="spin" />
            <span style={{ color: "#f59e0b", fontWeight: 500 }}>Ingesting...</span>
          </>
        )}
        {uploadState === "success" && (
          <>
            <CheckCircle size={12} color="#10b981" />
            <span style={{ color: "#10b981", fontWeight: 500 }}>Ingested successfully</span>
          </>
        )}
        {uploadState === "error" && (
          <>
            <AlertCircle size={12} color="#ef4444" />
            <span
              style={{
                color: "#ef4444",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "180px",
              }}
              title={uploadError}
            >
              {uploadError || "Ingestion failed"}
            </span>
          </>
        )}
      </div>

      {/* Animated progress bar while uploading */}
      {uploadState === "uploading" && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "2.5px",
            width: "100%",
            background: "#222",
            borderRadius: "0 0 12px 12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #f59e0b, #eab308)",
              animation: "progressPulse 1.5s infinite ease-in-out",
              width: "50%",
            }}
          />
        </div>
      )}
    </div>
  );
}
