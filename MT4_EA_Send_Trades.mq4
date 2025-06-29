const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';

app.post('/trade', async (req, res) => {
  const {
    ticket, symbol, type, lots,
    open_price, sl, tp, opentime,
    close_price, closetime, profit
  } = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const row = [
      ticket, symbol, type, lots,
      open_price, sl, tp, opentime,
      close_price, closetime, profit
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });

    res.status(200).send('Trade saved to sheet');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving trade');
  }
});

app.listen(3000, () => {
  console.log('✅ Server listening at http://localhost:3000');
});