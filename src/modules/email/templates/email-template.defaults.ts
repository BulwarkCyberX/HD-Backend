export type EmailTemplateDefault = {
  key: string;
  name: string;
  category: string;
  description: string;
  subject: string;
  title: string;
  preheader?: string;
  innerHtml: string;
  textBody: string;
  variables: string[];
};

export const EMAIL_TEMPLATE_DEFAULTS: EmailTemplateDefault[] = [
  {
    key: 'SIGNUP_VERIFICATION',
    name: 'Signup — email verification',
    category: 'auth',
    description: 'Sent after registration with OTP and verify link.',
    subject: 'Verify your HackersDeal email',
    title: 'Verify your HackersDeal email',
    preheader: 'Your verification code is inside.',
    variables: ['firstName', 'email', 'otp', 'verifyUrl', 'expiresHours'],
    innerHtml: `<p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Verify your email</p>
<p style="margin:0 0 16px 0;">Hi {{firstName}}, thanks for joining HackersDeal. Confirm that <strong>{{email}}</strong> belongs to you.</p>
<p style="margin:0 0 8px 0;">Your one-time verification code:</p>
<p style="margin:16px 0;font-size:28px;letter-spacing:0.25em;font-weight:700;color:#34d399;font-family:ui-monospace,Consolas,monospace;">{{otp}}</p>
<p style="margin:0 0 16px 0;font-size:13px;color:#a3a3a3;">This code and the link below expire in <strong>{{expiresHours}} hours</strong>.</p>
<p style="margin:20px 0;"><a href="{{verifyUrl}}" style="display:inline-block;padding:12px 20px;background:#34d399;color:#052e16;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Verify email (link)</a></p>
<p style="margin:16px 0 0 0;font-size:13px;color:#a3a3a3;">If the button does not work, paste this URL into your browser:<br/><span style="word-break:break-all;color:#d4d4d4;">{{verifyUrl}}</span></p>
<p style="margin:20px 0 0 0;font-size:13px;color:#737373;">If you did not create an account, you can ignore this message.</p>`,
    textBody: `Hi {{firstName}},

Verify your HackersDeal email with this one-time code:

{{otp}}

Or open this link (expires in {{expiresHours}} hours):
{{verifyUrl}}

If you did not sign up, ignore this email.`,
  },
  {
    key: 'EMAIL_VERIFIED_WELCOME',
    name: 'Welcome after verification',
    category: 'auth',
    description: 'Sent when email verification succeeds.',
    subject: 'Welcome to HackersDeal',
    title: 'Welcome to HackersDeal',
    preheader: 'Your email is verified.',
    variables: ['firstName', 'loginUrl'],
    innerHtml: `<p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">You are all set</p>
<p style="margin:0 0 16px 0;">Hi {{firstName}}, your email is verified. Welcome to HackersDeal.</p>
<p style="margin:20px 0;"><a href="{{loginUrl}}" style="display:inline-block;padding:12px 20px;background:#34d399;color:#052e16;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Sign in</a></p>`,
    textBody: `Hi {{firstName}},

Your email is verified. Welcome to HackersDeal.

Sign in: {{loginUrl}}`,
  },
  {
    key: 'LOGIN_OTP',
    name: 'Login — one-time code',
    category: 'auth',
    description: 'Passwordless login OTP email.',
    subject: 'Your HackersDeal login code',
    title: 'Your HackersDeal login code',
    preheader: 'Your sign-in code',
    variables: ['code', 'ttlMinutes'],
    innerHtml: `<p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Your sign-in code</p>
<p style="margin:0 0 8px 0;">Use this one-time code to sign in to HackersDeal:</p>
<p style="margin:16px 0;font-size:28px;letter-spacing:0.25em;font-weight:700;color:#34d399;font-family:ui-monospace,Consolas,monospace;">{{code}}</p>
<p style="margin:0;font-size:13px;color:#a3a3a3;">This code expires in {{ttlMinutes}} minutes. If you did not request it, you can ignore this email.</p>`,
    textBody: `Use this one-time code to sign in:

{{code}}

Expires in {{ttlMinutes}} minutes.`,
  },
  {
    key: 'PASSWORD_RESET',
    name: 'Password reset',
    category: 'auth',
    description: 'Forgot password link email.',
    subject: 'Reset your HackersDeal password',
    title: 'Reset your HackersDeal password',
    preheader: 'Password reset requested.',
    variables: ['resetUrl', 'expiresHours'],
    innerHtml: `<p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Reset your password</p>
<p style="margin:0 0 16px 0;">We received a request to reset the password for your HackersDeal account.</p>
<p style="margin:20px 0;"><a href="{{resetUrl}}" style="display:inline-block;padding:12px 20px;background:#34d399;color:#052e16;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Choose a new password</a></p>
<p style="margin:16px 0 0 0;font-size:13px;color:#a3a3a3;">This link expires in <strong>{{expiresHours}} hours</strong>.</p>
<p style="margin:12px 0 0 0;font-size:13px;color:#737373;">If you did not ask for a reset, you can ignore this email.</p>`,
    textBody: `Reset your HackersDeal password using this link:
{{resetUrl}}

Link expires in {{expiresHours}} hours.`,
  },
  {
    key: 'PROJECT_CREATED',
    name: 'Project created (client)',
    category: 'project',
    description: 'Confirmation when a client creates a project.',
    subject: 'Project created: {{projectTitle}}',
    title: 'Your project was created',
    preheader: '{{projectTitle}}',
    variables: ['clientName', 'projectTitle', 'projectUrl'],
    innerHtml: `<p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Project created</p>
<p style="margin:0 0 16px 0;">Hi {{clientName}}, your project <strong>{{projectTitle}}</strong> has been saved as a draft.</p>
<p style="margin:20px 0;"><a href="{{projectUrl}}" style="display:inline-block;padding:12px 20px;background:#34d399;color:#052e16;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Open project</a></p>`,
    textBody: `Hi {{clientName}},

Your project "{{projectTitle}}" was created (draft).
{{projectUrl}}`,
  },
  {
    key: 'BID_PLACED_PROVIDER',
    name: 'Bid submitted (provider)',
    category: 'project',
    description: 'Confirmation to provider after placing a bid.',
    subject: 'Bid submitted: {{projectTitle}}',
    title: 'Bid submitted',
    preheader: '{{projectTitle}}',
    variables: ['providerName', 'projectTitle', 'amount'],
    innerHtml: `<p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Bid submitted</p>
<p style="margin:0 0 16px 0;">Hi {{providerName}}, your bid on <strong>{{projectTitle}}</strong> was submitted successfully.</p>
<p style="margin:0;font-size:14px;color:#d4d4d4;">Proposed amount: <strong>{{amount}}</strong></p>`,
    textBody: `Hi {{providerName}},

Your bid on "{{projectTitle}}" was submitted.
Amount: {{amount}}`,
  },
  {
    key: 'WEEKLY_DIGEST',
    name: 'Weekly activity digest',
    category: 'notification',
    description: 'Weekly summary of platform notifications for opted-in users.',
    subject: 'Your HackersDeal weekly digest',
    title: 'Your weekly digest',
    preheader: '{{itemCount}} updates this week',
    variables: ['firstName', 'itemCount', 'digestHtml', 'digestText', 'dashboardUrl'],
    innerHtml: `<p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">Weekly digest</p>
<p style="margin:0 0 16px 0;">Hi {{firstName}}, here is your activity summary ({{itemCount}} items).</p>
<div style="margin:0 0 16px 0;font-size:14px;color:#d4d4d4;line-height:1.5;">{{digestHtml}}</div>
<p style="margin:20px 0;"><a href="{{dashboardUrl}}" style="display:inline-block;padding:12px 20px;background:#34d399;color:#052e16;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Open dashboard</a></p>`,
    textBody: `Hi {{firstName}},

Your weekly HackersDeal digest ({{itemCount}} items):

{{digestText}}

Dashboard: {{dashboardUrl}}`,
  },
  {
    key: 'NOTIFICATION_GENERIC',
    name: 'In-app notification (email)',
    category: 'notification',
    description: 'Rich notification emails (bids, reports, payments).',
    subject: '{{subject}}',
    title: '{{subject}}',
    preheader: '{{message}}',
    variables: ['heading', 'message', 'dashboardUrl', 'subject'],
    innerHtml: `<p style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#fafafa;">{{heading}}</p>
<p style="margin:0 0 16px 0;">{{message}}</p>
<p style="margin:20px 0;"><a href="{{dashboardUrl}}" style="display:inline-block;padding:12px 20px;background:#34d399;color:#052e16;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Open dashboard</a></p>`,
    textBody: `{{heading}}

{{message}}

{{dashboardUrl}}`,
  },
];
