const fs = require("fs");
const readline = require("readline-sync");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { getMessageDetail } = require("./controller/messages");
const { logMessage } = require("./model/helper");
const { updateCredentials, getLastSelection, getCredentials } = require("./model/file_helper");

const EXPORT_DIR = "./downloads";

const initTelegramClient = async () => {
    const { apiHash, apiId, sessionId } = getCredentials();
    const stringSession = new StringSession(sessionId || "");
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    try {
        await client.start({
            phoneNumber: async () => await readline.question("Please enter your number: "),
            password: async () => await readline.question("Please enter your password: "),
            phoneCode: async () => await readline.question("Please enter the code you received: "),
            onError: (err) => logMessage.error(err),
        });
        logMessage.success("You should now be connected.");

        if (!sessionId) {
            const newSessionId = client.session.save();
            updateCredentials({ sessionId: newSessionId });
            logMessage.info(`To avoid login again and again session id has been saved to config.json, please don't share it with anyone`);
        }

        return client;
    } catch (err) {
        logMessage.error(err);
        return null;
    }
};

const downloadMessages = async (client, channelId, messageIds) => {
    try {
        await getMessageDetail(client, channelId, messageIds);
        logMessage.success("Done with downloading messages");
    } catch (err) {
        logMessage.error(err);
    } finally {
        await client.disconnect();
    }
};

const main = async () => {
    try {
        if (!fs.existsSync(EXPORT_DIR)) {
            fs.mkdirSync(EXPORT_DIR);
        }

        const client = await initTelegramClient();
        if (!client) {
            logMessage.error("Failed to initialize Telegram client");
            return;
        }

        const channelId = readline.question('Please Enter Channel ID: ');
        const messageIdsText = readline.question('Please Enter Message Id(s) (separated by comma): ');

        const messageIds = messageIdsText.split(",").map((id) => parseInt(id));

        await downloadMessages(client, channelId, messageIds);
        process.exit(0);
    } catch (err) {
        logMessage.error(err);
        process.exit(1);
    }
};

main();
