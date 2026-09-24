// IKDesign HP お問い合わせ受付（Google Apps Script ウェブアプリ）
// - ikd-kk.com/contact のフォームから JSON を受け取り、スプレッドシートに記録して
//   info@ikd-kk.com へ通知、お客様へ自動返信する。
// - imai@maintecs.com のアカウントで「自分として実行・全員がアクセス可」でデプロイする
//   （info@ikd-kk.com はログイン用アカウントではないため。自動返信の返信先は info@ にする）。
// - 初回だけエディタで authorize() を実行して権限を許可すること。

var NOTIFY_TO = 'info@ikd-kk.com';

var HEADERS = ['受付日時', 'ご相談の種類', 'お名前', 'フリガナ', '会社名', 'メール', '電話', '希望の連絡方法', 'ご相談内容', '送信元ページ'];
var LIMITS = { name: 60, kana: 60, company: 100, email: 120, phone: 30, category: 40, contactBy: 20, message: 4000, page: 200 };

// 初回のみエディタから実行：権限の許可とスプレッドシートの作成
function authorize() {
  var sheet = getSheet_();
  Logger.log('スプレッドシート: ' + sheet.getParent().getUrl());
  Logger.log('メール送信の残り枠（本日）: ' + MailApp.getRemainingDailyQuota());
}

// 動作確認用（ブラウザでURLを開くと ok が返る）
function doGet() {
  return json_({ result: 'ok' });
}

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // ボット対策：人には見えない欄に入力がある／送信が速すぎるものは、成功を装って破棄
    if (data.website || (data.elapsed && Number(data.elapsed) < 3000)) {
      return json_({ result: 'success' });
    }

    var d = {};
    Object.keys(LIMITS).forEach(function (k) {
      d[k] = String(data[k] == null ? '' : data[k]).trim().slice(0, LIMITS[k]);
    });
    if (!d.name || !d.email || !d.category || !d.message) {
      return json_({ result: 'error', message: '必須項目が入力されていません。' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
      return json_({ result: 'error', message: 'メールアドレスの形式が正しくありません。' });
    }

    // 同じメールアドレスからの連投を抑止（10分に3件まで）
    var cache = CacheService.getScriptCache();
    var key = 'n:' + d.email.toLowerCase();
    var count = Number(cache.get(key) || 0);
    if (count >= 3) {
      return json_({ result: 'error', message: '短時間に複数回送信されています。しばらくしてからお試しください。' });
    }
    cache.put(key, String(count + 1), 600);

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      getSheet_().appendRow([new Date(), d.category, d.name, d.kana, d.company, d.email, d.phone, d.contactBy, d.message, d.page].map(safeCell_));
    } finally {
      lock.releaseLock();
    }

    sendNotify_(d);
    sendAutoReply_(d);
    return json_({ result: 'success' });
  } catch (err) {
    console.error(err);
    return json_({ result: 'error', message: '送信処理でエラーが発生しました。' });
  }
}

function sendNotify_(d) {
  var body = [
    'ホームページからお問い合わせがありました。',
    '（このメールに返信すると、お客様宛てに送られます）',
    '',
    '■ ご相談の種類：' + d.category,
    '■ お名前　　　：' + d.name + (d.kana ? '（' + d.kana + '）' : ''),
    '■ 会社名　　　：' + (d.company || '―'),
    '■ メール　　　：' + d.email,
    '■ 電話　　　　：' + (d.phone || '―'),
    '■ 希望の連絡方法：' + (d.contactBy || '―'),
    '',
    '■ ご相談内容',
    d.message,
    '',
    '――',
    '送信元ページ：' + (d.page || '―'),
    '一覧：' + getSheet_().getParent().getUrl()
  ].join('\n');
  MailApp.sendEmail({
    to: NOTIFY_TO,
    subject: '【HP問い合わせ】' + d.category + '／' + d.name + ' 様',
    body: body,
    replyTo: d.email,
    name: 'IKDesign HP'
  });
}

function sendAutoReply_(d) {
  var body = [
    d.name + ' 様',
    '',
    'このたびはIKDesign株式会社にお問い合わせいただき、ありがとうございます。',
    '以下の内容で受け付けました。担当者より、原則2営業日以内にご連絡いたします。',
    '',
    '――――――――――――――――',
    'ご相談の種類：' + d.category,
    'お名前：' + d.name,
    '電話：' + (d.phone || '―'),
    '希望の連絡方法：' + (d.contactBy || '―'),
    '',
    'ご相談内容：',
    d.message,
    '――――――――――――――――',
    '',
    '※本メールは自動送信です。追加のご連絡は、このメールにそのまま返信してください（info@ikd-kk.com に届きます）。',
    '※お心当たりのない場合は、お手数ですが本メールを破棄してください。',
    '',
    'IKDesign株式会社',
    '〒150-0001 東京都渋谷区神宮前3-24-1 原宿鈴木ビル3階',
    'TEL 0495-23-3555（9:00〜18:00・土日祝除く）',
    'info@ikd-kk.com',
    'https://ikd-kk.com/'
  ].join('\n');
  MailApp.sendEmail({
    to: d.email,
    subject: '【IKDesign】お問い合わせを受け付けました',
    body: body,
    replyTo: NOTIFY_TO,
    name: 'IKDesign株式会社'
  });
}

// このスクリプトはスプレッドシート「IKDesign HP お問い合わせ一覧」に紐づいている（コンテナバインド）
function getSheet_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) {
    sh.setName('問い合わせ');
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#e2e8ec');
  }
  return sh;
}

// スプレッドシートの数式として解釈されないようにする
function safeCell_(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
