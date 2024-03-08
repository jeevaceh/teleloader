const mimeDB = require("mime-db");
const fs = require("fs");

const consoleColors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

const getMediaType = (message) => {
  if (!message.media) return "unknown";

  const { media } = message;
  if (media.photo) return "photo";
  if (media.document) return media.document.mimeType || "Document";
  if (media.video) return "video";
  if (media.audio) return "audio";
  if (media.webpage) return "webpage";
  if (media.poll) return "poll";
  if (media.geo) return "geo";
  if (media.contact) return "contact";
  if (media.venue) return "venue";
  if (media.sticker) return "sticker";

  return "unknown";
};

const getMediaName = (message) => {
  if (!message || !message.media) return "unknown";

  const { media } = message;
  let fileName = `${message.id}_file`;

  if (media.document) {
    const { document } = media;
    const docAttributes = document.attributes || [];
    const fileNameObj = docAttributes.find(
      (e) => e.className === "DocumentAttributeFilename"
    );

    if (fileNameObj) {
      fileName = fileNameObj.fileName;
    } else {
      const ext = mimeDB[document.mimeType]?.extensions?.[0];
      if (ext) fileName += `.${ext}`;
    }
  } else if (media.video) {
    fileName += ".mp4";
  } else if (media.audio) {
    fileName += ".mp3";
  } else if (media.photo) {
    fileName += ".jpg";
  }

  return fileName;
};

const logMessage = {
  info: (message) => {
    console.log(`📢: ${consoleColors.magenta} ${message} ${consoleColors.reset}`);
  },
  error: (message) => {
    console.error(`❌ ${consoleColors.red} ${message} ${consoleColors.reset}`);
  },
  success: (message) => {
    console.log(`✅ ${consoleColors.cyan} ${message} ${consoleColors.reset}`);
  },
  debug: (message) => {
    console.log(`⚠️ ${message}`);
  },
};

const wait = (seconds) => {
  logMessage.debug(`Waiting for ${seconds} seconds to avoid blocking`);
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

const filterString = (string) => string.replace(/[^a-zA-Z0-9]/g, "");

const circularStringify = (circularString, indent = 2) => {
  const cache = new Set();
  return JSON.stringify(
    circularString,
    (key, value) =>
      typeof value === "object" && value !== null
        ? cache.has(value)
          ? undefined // Duplicate reference found, discard key
          : (cache.add(value), value) // Store value in our collection
        : value,
    indent
  );
};

const appendToJSONArrayFile = async (filePath, dataToAppend) => {
  try {
    const dataArray = await fs.readFile(filePath, "utf8")
      .then(data => JSON.parse(data))
      .catch(() => []);

    dataArray.push(dataToAppend);
    await fs.writeFile(filePath, JSON.stringify(dataArray, null, 2));
  } catch (error) {
    logMessage.error(`Error appending to JSON Array file ${filePath}`);
    console.error(error);
  }
};

function getDialogType(dialog) {
  if (dialog.isChannel) {
    return "Channel";
  }
  if (dialog.isGroup) {
    return "Group";
  }
  if (dialog.isUser) {
    return "User";
  }
  return "Unknown";
}

module.exports = {
  getMediaType,
  getMediaName,
  getDialogType,
  logMessage,
  wait,
  filterString,
  appendToJSONArrayFile,
  circularStringify,
};
