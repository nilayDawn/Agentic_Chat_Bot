import { getFileTypeDetails, formatFileSize } from "../utils/fileUtils";
import { FileText, FileCode } from "lucide-react";

/**
 * AttachmentCard
 * Compact read-only file indicator rendered inside an assistant/user message bubble.
 * Does NOT show upload-status — that is the responsibility of FileCard.
 *
 * @param {{ fileName: string, fileSize: number }} props
 */
export default function AttachmentCard({ fileName, fileSize }) {
  const details     = getFileTypeDetails(fileName);
  const fileSizeStr = formatFileSize(fileSize);
  const ext         = "." + fileName.split(".").pop().toLowerCase();
  const IconComponent = ext === ".py" ? FileCode : FileText;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        background: "#1f1f1f",
        border: "1px solid #3c3c3c",
        borderRadius: "10px",
        marginBottom: "8px",
        width: "fit-content",
        maxWidth: "240px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        alignSelf: "flex-start",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "6px",
          background: details.bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconComponent size={16} color={details.iconColor} />
      </div>

      {/* Filename + size */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, textAlign: "left" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#ececec",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={fileName}
        >
          {fileName}
        </span>
        {fileSizeStr && (
          <span style={{ fontSize: "10px", color: "#8a8a8a", marginTop: "1px" }}>
            {fileSizeStr}
          </span>
        )}
      </div>
    </div>
  );
}
