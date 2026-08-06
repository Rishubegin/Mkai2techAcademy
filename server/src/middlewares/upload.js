const multer = require("multer");
const path = require("path");

// Every upload in the app goes through Cloudinary (see utils/cloudinaryUpload),
// so nothing is ever written to disk — memoryStorage hands the route a Buffer.
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".zip",
];

const extensionFilter = (allowed, label) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error(`Unsupported ${label} type`));
  }
  cb(null, true);
};

const createUploader = ({ allowed, label, maxBytes }) =>
  multer({
    storage: multer.memoryStorage(),
    fileFilter: extensionFilter(allowed, label),
    limits: { fileSize: maxBytes },
  });

// Images: avatars, event banners, gallery items, enrollment photos. These were
// four separate modules with byte-identical config; they differed only in the
// name they exported, so they now share one instance.
const imageUpload = createUploader({
  allowed: IMAGE_EXTENSIONS,
  label: "image",
  maxBytes: 5 * 1024 * 1024,
});

// Course materials: larger limit, document formats rather than images.
const documentUpload = createUploader({
  allowed: DOCUMENT_EXTENSIONS,
  label: "file",
  maxBytes: 20 * 1024 * 1024,
});

module.exports = { imageUpload, documentUpload };
