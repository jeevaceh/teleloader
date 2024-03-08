const fs = require("fs");
const readline = require("readline-sync");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { selectDialog, getDialogName } = require("./controller/dialoges");
const { getMessages } = require("./controller/messages");
const { logMessage } = require("./model/helper");
const { updateCredentials, getLastSelection, getCredentials } = require("./model/file_helper");
let { apiHash, apiId, sessionId } = getCredentials();


const stringSession = new StringSession(sessionId || "");
let { channelId } = getLastSelection();
var client = null;

const init = async () => {
    if (!fs.existsSync("./downloads")) {
        fs.mkdirSync("./downloads");
    }

    client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    try {
        await client.start({
            phoneNumber: async () => await readline.question("Please enter your number: "),
            password: async () => await readline.question("Please enter your password: "),
            phoneCode: async () =>
                await readline.question("Please enter the code you received: "),
            onError: (err) => logMessage.error(err),
        });
        logMessage.success("You should now be connected.");
        if (!sessionId) {
            sessionId = client.session.save();
            updateCredentials({sessionId});
            logMessage.info(`To avoid login again and again session id has been saved to config.json, please don't share it with anyone`);
        }

        return client;
    }
    catch (err) {
        logMessage.error(err);
    }
};

(async () => {
    await init();
    if (!channelId) {
        channelId = await selectDialog(client);
    } else {
        logMessage.success(`Selected channel is: ${getDialogName(channelId)}`);
        if (readline.keyInYN('Do you want to change channel?')) {
            channelId = await selectDialog(client);
        }
    }

    let downloadMedia = false;
    if (readline.keyInYN('Do you want to download media?')) {
        downloadMedia = true;
    }

    await getMessages(client, channelId, downloadMedia);
    await client.disconnect();
    process.exit(0);

})();
