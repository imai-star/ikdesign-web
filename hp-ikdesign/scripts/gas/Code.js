// この関数を実行して権限を承認してください
function authorize() {
  Logger.log('承認完了');
  Logger.log('スプレッドシートアクセス: ' + SpreadsheetApp.getActiveSpreadsheet());
  Logger.log('メール送信テスト準備完了');
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);

    // スプレッドシートに保存
    var ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss;
    if (ssId) {
      ss = SpreadsheetApp.openById(ssId);
    } else {
      ss = SpreadsheetApp.create('IKDesign お問い合わせ一覧');
      PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
      var sheet = ss.getActiveSheet();
      sheet.appendRow(['日時', '名前', 'フリガナ', 'メール', '電話', '相談内容', '詳細']);
    }
    var sheet = ss.getActiveSheet();
    sheet.appendRow([
      new Date(),
      data.name,
      data.kana,
      data.email,
      data.phone,
      data.category,
      data.message
    ]);

    // メール送信
    var subject = '【IKDesign HP】お問い合わせ: ' + data.category;
    var body = '━━━━━━━━━━━━━━━━━━━━\n';
    body += 'IKDesign HP お問い合わせ\n';
    body += '━━━━━━━━━━━━━━━━━━━━\n\n';
    body += '■ お名前: ' + data.name + '\n';
    body += '■ フリガナ: ' + (data.kana || '未入力') + '\n';
    body += '■ メール: ' + data.email + '\n';
    body += '■ 電話: ' + (data.phone || '未入力') + '\n';
    body += '■ 相談内容: ' + data.category + '\n';
    body += '■ 詳細:\n' + data.message + '\n';

    GmailApp.sendEmail('info@ikd-kk.com', subject, body, {
      replyTo: data.email
    });

    return ContentService
      .createTextOutput(JSON.stringify({result: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({result: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
