import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'GoReady <noreply@goready.com.au>';
const APP_URL = process.env.CLIENT_URL || 'https://goready.com.au';

export async function sendInviteEmail({
  to,
  inviterName,
  tripTitle,
  tripDestination,
  isNewUser,
}: {
  to: string;
  inviterName: string;
  tripTitle: string;
  tripDestination: string;
  isNewUser: boolean;
}) {
  const signUpUrl = `${APP_URL}/register`;
  const loginUrl = `${APP_URL}/login`;
  const actionUrl = isNewUser ? signUpUrl : loginUrl;
  const actionLabel = isNewUser ? 'Join GoReady Free' : 'View Trip';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;letter-spacing:-0.5px;">GoReady</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your all-in-one trip planner</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">You've been invited!</p>
              <h2 style="margin:0 0 24px;font-size:22px;color:#111827;font-weight:600;line-height:1.3;">
                ${inviterName} wants you to join their trip to ${tripDestination}
              </h2>

              <!-- Trip card -->
              <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:28px;border-left:4px solid #2563eb;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Trip</p>
                <p style="margin:0;font-size:18px;font-weight:600;color:#111827;">${tripTitle}</p>
                <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">📍 ${tripDestination}</p>
              </div>

              ${isNewUser ? `
              <!-- New user benefits -->
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                <strong>${inviterName}</strong> is using GoReady to plan this trip and wants you on board.
                Create your free account in 30 seconds to:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#374151;">✅ &nbsp;View and collaborate on the trip itinerary</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#374151;">✅ &nbsp;Track shared expenses — no more awkward money talks</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#374151;">✅ &nbsp;Add your own bookings, flights & hotels</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#374151;">✅ &nbsp;Get day-by-day plans with maps & directions</td>
                </tr>
              </table>
              <p style="margin:0 0 28px;font-size:13px;color:#9ca3af;line-height:1.5;">
                Thousands of travellers use GoReady to plan trips together. It's completely free — no credit card needed.
              </p>
              ` : `
              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
                Log in to GoReady to view the trip details, collaborate on the itinerary, and manage shared expenses.
              </p>
              `}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:50px;box-shadow:0 2px 8px rgba(37,99,235,0.3);">${actionLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                This invitation was sent by ${inviterName} via GoReady.<br>
                If you don't know this person, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send');
    return false;
  }

  try {
    console.log(`[Email] Sending invite to ${to} (isNewUser: ${isNewUser})`);
    console.log(`[Email] From: ${FROM_EMAIL}`);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${inviterName} invited you to join "${tripTitle}" on GoReady`,
      html,
    });

    console.log('[Email] Send result:', JSON.stringify(result));
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send:', error?.message || error);
    if (error?.response) console.error('[Email] Response:', JSON.stringify(error.response));
    return false;
  }
}
