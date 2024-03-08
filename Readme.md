
Teleloader
Teleloader is a Node.js application that simplifies the process of archiving content from Telegram channels, groups, or users for offline viewing or storage.

Setup
To use the Telegram Channel Downloader, follow these steps:

Create a Telegram App: Visit https://my.telegram.org/apps and create a new application.

Get API Credentials: After creating the app, copy the API ID and API Hash provided by Telegram.

Configure config.json:
In the root directory of the application, create a file named config.json and paste the following code:

```json

{
    "apiId": YOUR_API_ID,
    "apiHash": "YOUR_API_HASH",
    "sessionId": ""
}```

Replace YOUR_API_ID and YOUR_API_HASH with the values obtained in step 2. 
Keep the sessionId blank for now; it will be updated automatically after logging in for the first time.

Usage
Once the setup is complete, you can start using the Telegram Channel Downloader:

Run the Script:
Open your terminal or command prompt and navigate to the directory where the Telegram Channel Downloader is located. Run the following command to start the script:

npm start

Login:
The script will prompt you to enter your phone number and the code sent to your phone or Telegram account. This authentication is required for the first time you run the script.

Enter Channel/Group/User Name:

After logging in, enter the name of the channel, group, or user from which you want to download media files and messages.

Wait for Download:

The script will start downloading all available media files and messages from the specified channel, group, or user. Depending on the size of the content, this process may take some time.

Access Downloaded Files:

Once the download is complete, you can find the downloaded media files and messages in the downloads/ directory within the Telegram Channel Downloader directory.

Additional Notes*
Session Handling:
The sessionId field in the config.json file will be automatically updated after logging in for the first time. This session ID is used for subsequent logins to avoid re-entering your credentials.

Media Types:
The Telegram Channel Downloader supports downloading various types of media files, including images, videos, audio files, documents, and other attachments shared within the specified channel, group, or user.

Contributing

```Orginal source got from MR : Abhishek Kumar```

``Please follow him : "https://github.com/abhishekjnvk/"

Contributions are welcome! If you have any suggestions, bug reports, or feature requests, please open an issue or submit a pull request.