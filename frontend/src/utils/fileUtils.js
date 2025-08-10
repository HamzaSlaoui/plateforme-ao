export const getFileExtension = (filename) => {
  return filename.split(".").pop().toLowerCase();
};

export const getFileType = (filename) => {
  const extension = getFileExtension(filename);
  
  if (extension === "pdf") return "pdf";
  if (["txt", "md", "csv", "log", "json"].includes(extension)) return "text";
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) return "image";
  if (["doc", "docx"].includes(extension)) return "document";
  if (["xls", "xlsx"].includes(extension)) return "spreadsheet";
  
  return "other";
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};