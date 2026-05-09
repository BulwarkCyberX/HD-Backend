"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = escapeHtml;
exports.wrapMail = wrapMail;
exports.buttonRow = buttonRow;
exports.codeBlock = codeBlock;
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function wrapMail(opts) {
    const title = escapeHtml(opts.title);
    const pre = opts.preheader ? escapeHtml(opts.preheader) : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Segoe UI,system-ui,sans-serif;color:#e5e5e5;">
  ${pre ? `<div style="display:none;max-height:0;overflow:hidden;">${pre}</div>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#141414;border:1px solid #262626;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px 28px;font-size:20px;font-weight:600;color:#fafafa;">HackersDeal</td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;font-size:15px;line-height:1.55;color:#d4d4d4;">
              ${opts.innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;font-size:12px;line-height:1.5;color:#737373;border-top:1px solid #262626;">
              You are receiving this because of activity on your HackersDeal account.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
function buttonRow(label, url) {
    const safeUrl = escapeHtml(url);
    const safeLabel = escapeHtml(label);
    return `<p style="margin:20px 0;">
    <a href="${safeUrl}" style="display:inline-block;padding:12px 20px;background:#34d399;color:#052e16;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${safeLabel}</a>
  </p>`;
}
function codeBlock(code) {
    const c = escapeHtml(code);
    return `<p style="margin:16px 0;font-size:28px;letter-spacing:0.25em;font-weight:700;color:#34d399;font-family:ui-monospace,Consolas,monospace;">${c}</p>`;
}
//# sourceMappingURL=mail-layout.js.map