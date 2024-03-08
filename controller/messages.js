const fs = require("fs");

const {
  getMediaType,
  getMediaName,
  logMessage,
  wait,
  filterString,
  appendToJSONArrayFile,
  circularStringify,
} = require("../model/helper");
const {
  getLastSelection,
  updateLastSelection,
} = require("../model/file_helper");
const path = require("path");

const MAX_PARALLEL_DOWNLOAD = 10;
const MESSAGE_LIMIT = 100;

let { messageOffsetId } = getLastSelection();

const downloadMessageMedia = async (client, message, outputFolder) => {
  try {
    if (message.media) {
      let folderType = filterString(getMediaType(message));
      outputFolder = path.join(outputFolder, folderType);

      let fileName = getMediaName(message);
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
      }

      if (message.media.webpage) {
        let url = message.media.webpage.url;
        if (url) {
          let urlPath = path.join(outputFolder, `${message.id}_url.txt`);
          fs.writeFileSync(urlPath, url);
        }
        fileName = `${message.id}_image.jpeg`;
      }

      if (message.media.poll) {
        let pollPath = path.join(outputFolder, `${message.id}_poll.json`);
        fs.writeFileSync(
          pollPath,
          circularStringify(message.media.poll, null, 2)
        );
      }

      let filePath = path.join(outputFolder, fileName);
      //check if file already exists
      if (fs.existsSync(filePath)) {
        logMessage.info(`File already exists: ${filePath}, Changing name`);
        let ext = path.extname(filePath);
        let baseName = path.basename(filePath, ext);
        let newFileName = `${baseName}_${message.id}${ext}`;
        filePath = path.join(outputFolder, newFileName);
      }

      await client.downloadMedia(message, {
        outputFile: filePath,
      });
      return true;
    } else {
      return false;
    }
  } catch (err) {
    logMessage.error("Error in downloadMessageMedia()");
    console.log(err);
    return false;
  }
};

const getMessages = async (client, channelId, downloadMedia = false) => {
  try {
    let offsetId = messageOffsetId;
    let outputFolder = path.join(__dirname, "../downloads/", `${channelId}`);
    let rawMessagePath = path.join(outputFolder, "raw_message.json");
    let messageFilePath = path.join(outputFolder, "all_message.json");
    let totalFetched = 0;

    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }

    while (true) {
      let allMessages = [];
      let messages = await client.getMessages(channelId, {
        limit: MESSAGE_LIMIT,
        offsetId: offsetId,
      });
      totalFetched += messages.length;
      appendToJSONArrayFile(rawMessagePath, messages);
      logMessage.info(
        `getting messages (${totalFetched}/${messages.total}) : ${Math.round(
          (totalFetched * 100) / messages.total
        )}%`
      );
      messages = messages.filter(
        (message) => message.message != undefined || message.media != undefined
      );
      messages.forEach((message) => {
        let obj = {
          id: message.id,
          message: message.message,
          date: message.date,
          sender: message.fromId?.userId,
        };
        if (message.media) {
          obj.mediaType = message.media ? getMediaType(message) : null;
          obj.mediaName = getMediaName(message);
          obj.isMedia = true;
        }
        allMessages.push(obj);
      });
      if (messages.length === 0) {
        logMessage.success(`Done with all messages (${totalFetched}) 100%`);
        break;
      }
      if (downloadMedia) {
        let promArr = [];
        for (let i = 0; i < messages.length; i++) {
          promArr.push(downloadMessageMedia(client, messages[i], outputFolder));
          if (promArr.length === MAX_PARALLEL_DOWNLOAD) {
            logMessage.info(
              `Waiting for files to be downloaded (${MAX_PARALLEL_DOWNLOAD} at a time)`
            );
            await Promise.all(promArr);
            logMessage.success(
              "Files downloaded successfully, adding more files"
            );
            promArr = [];
          }
        }
        if (promArr.length > 0) {
          logMessage.info("Waiting for files to be downloaded");
          await Promise.all(promArr);
          logMessage.success("Files downloaded successfully");
        }
      }

      appendToJSONArrayFile(messageFilePath, allMessages);
      offsetId = messages[messages.length - 1].id;
      updateLastSelection({ messageOffsetId: offsetId });

      await wait(3);
    }

    return true;
  } catch (err) {
    logMessage.error("Error in getMessages()");
    console.log(err);
  }
};

const getMessageDetail = async (client, channelId, messageIds) => {
  try {
    const result = await client.getMessages(channelId, {
      ids: messageIds,
    });
    let outputFolder = `../downloads/${channelId}`;
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }

    let promArr = [];

    for (let i = 0; i < result.length; i++) {
      let message = result[i];
      if (message.media) {
        promArr.push(downloadMessageMedia(client, message, outputFolder));
      }
      if (promArr.length === MAX_PARALLEL_DOWNLOAD) {
        logMessage.info(
          `Waiting for files to be downloaded ${MAX_PARALLEL_DOWNLOAD} at a time`
        );
        await Promise.all(promArr);
        logMessage.success("Files downloaded successfully, adding more files");
        promArr = [];
      }
    }
    if (promArr.length > 0) {
      logMessage.info("Waiting for files to be downloaded");
      await Promise.all(promArr);
      logMessage.success("Files downloaded successfully");
    }
    return true;
  } catch (err) {
    logMessage.error("Error in getMessageDetail()");
    console.log(err);
  }
};

const sendMessage = async (client, channelId, message) => {
  try {
    let res = await client.sendMessage(channelId, { message });

    logMessage.success(`Message sent successfully with ID: ${res.id}`);
  } catch (err) {
    logMessage.error("Error in sendMessage()");
    console.log(err);
  }
};

module.exports = {
  getMessages,
  getMessageDetail,
  sendMessage,
};
