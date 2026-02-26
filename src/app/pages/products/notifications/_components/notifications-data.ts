"use client";

import type { Language } from "@/contexts/language-context";

export type TemplateChannel = "mailing" | "notifications";
export type TemplateStatus = "active" | "inactive" | "draft";
export type TemplateKey =
  | "otpCode"
  | "otpReminder"
  | "securityAlert"
  | "monthlySummary"
  | "transferPush"
  | "cashOutAlert"
  | (string & {});

export interface TemplateGroup {
  id: string;
  name: string;
  description: string;
  channel: TemplateChannel;
}

export interface TemplateVariable {
  key: string;
  label: string;
  placeholder: string;
  sampleValue: string;
  required?: boolean;
  description?: string;
}

export interface NotificationTemplate {
  id: string;
  key: TemplateKey;
  groupId: string;
  channelGroup: TemplateChannel;
  channel: "email" | "push";
  status: TemplateStatus;
  updatedAt: string;
  lastUsed: string;
  metrics: {
    openRate: number;
    ctr: number;
  };
  from?: string;
  name?: string;
  subject?: string;
  description?: string;
  html: Record<Language, string>;
  variables?: TemplateVariable[];
}

export const DEFAULT_TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    id: "otp-flows",
    name: "OTP",
    description: "Notificaciones de verificación y códigos de un solo uso.",
    channel: "mailing",
  },
  {
    id: "security-alerts",
    name: "Alertas de seguridad",
    description: "Correos críticos para accesos sospechosos o bloqueos.",
    channel: "mailing",
  },
  {
    id: "monthly-reports",
    name: "Reportes mensuales",
    description: "Resúmenes y reportes periódicos para tus clientes.",
    channel: "mailing",
  },
  {
    id: "login-alerts",
    name: "Alertas de inicio de sesión",
    description: "Notifica accesos exitosos y novedades de autenticación.",
    channel: "mailing",
  },
  {
    id: "account-statements",
    name: "Estados de cuenta",
    description: "Reportes automáticos con movimientos y saldos.",
    channel: "mailing",
  },
  {
    id: "transactions",
    name: "Transacciones",
    description: "Actualizaciones sobre transferencias y cash-ins.",
    channel: "mailing",
  },
  {
    id: "payments",
    name: "Pagos",
    description: "Confirmaciones y recordatorios de pagos programados.",
    channel: "mailing",
  },
  {
    id: "push-transfers",
    name: "Push cash-outs",
    description: "Notificaciones push transaccionales.",
    channel: "notifications",
  },
  {
    id: "push-alerts",
    name: "Alertas push",
    description: "Alertas in-app y push para cash-outs inusuales.",
    channel: "notifications",
  },
];

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "tpl_mail_otp_delivery",
    key: "otpCode",
    groupId: "otp-flows",
    channelGroup: "mailing",
    channel: "email",
    status: "active",
    name: "Envío de Código OTP",
    subject: "Tu código para continuar",
    description: "Entrega códigos de verificación seguros.",
    updatedAt: "2024-06-18T10:15:00Z",
    lastUsed: "2024-06-25T14:21:00Z",
    metrics: {
      openRate: 78,
      ctr: 21,
    },
    variables: [
      {
        key: "code",
        label: "Código OTP",
        placeholder: "${code}",
        sampleValue: "000000",
        required: true,
      },
      {
        key: "safeName",
        label: "Usuario",
        placeholder: "${safeName}",
        sampleValue: "Usuario",
        required: true,
      },
      {
        key: "year",
        label: "Año",
        placeholder: "${year}",
        sampleValue: "2025",
        required: true,
      },
    ],
    html: {
      es: `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verificación de correo</title>
  </head>
  <body style="margin:0; padding:0; background-color:#cfd4dd; font-family:'Helvetica Neue', Arial, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden;">Tu código para continuar con Zelify es \${code}</div>
    <center style="width:100%; background-color:#cfd4dd;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:760px; margin:0 auto;">
        <tr>
          <td style="background-color:#0c2344; padding:48px 16px 32px; text-align:center;">
            <img
              src="https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/LOGO-ZELIFY-GRIS-2025.png"
              alt="Zelify"
              width="220"
              height="70"
              style="display:block; margin:0 auto;"
            />
          </td>
        </tr>
        <tr>
          <td style="background-color:#cfd4dd; padding:0 16px 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff; border-radius:28px; box-shadow:0 12px 24px rgba(12,35,68,0.15); padding:48px 56px;">
              <tr>
                <td style="text-align:center;">
                  <h1 style="margin:0; font-size:32px; color:#0c2344;">Verifique su correo</h1>
                  <div style="width:100%; height:1px; background-color:#e2e6ed; margin:24px 0;"></div>
                  <p style="margin:0; font-size:16px; line-height:1.7; color:#536079;">
                    Estimado \${safeName}, para verificar su dirección de correo electrónico,
                    ingrese el siguiente código en el cuadro de verificación:
                  </p>
                  <p style="margin:32px 0 16px; font-size:64px; letter-spacing:8px; font-weight:700; color:#1f4aa5;">\${code}</p>
                  <p style="margin:0; font-size:14px; color:#6c768a;">Si no solicitó esta verificación, ignore este correo electrónico.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 16px 32px; text-align:center;">
            <div style="display:inline-flex; align-items:center; gap:12px;">
              <img
                src="https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/ISO-ZELIFY-2025.png"
                alt="Zelify icon"
                width="48"
                height="48"
                style="display:block;"
              />
              <span style="font-size:18px; color:#1f4aa5;">Thinking Beyond Finances</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#9ffc28; text-align:center; padding:16px;">
            <p style="margin:0; font-size:13px; color:#0c2344;">Powered by Zwippe Tech Inc. · © \${year} Zelify</p>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`.trim(),
      en: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email verification</title>
  </head>
  <body style="margin:0; padding:0; background-color:#cfd4dd; font-family:'Helvetica Neue', Arial, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden;">Your code to continue with Zelify is \${code}</div>
    <center style="width:100%; background-color:#cfd4dd;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:760px; margin:0 auto;">
        <tr>
          <td style="background-color:#0c2344; padding:48px 16px 32px; text-align:center;">
            <img
              src="https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/LOGO-ZELIFY-GRIS-2025.png"
              alt="Zelify"
              width="220"
              height="70"
              style="display:block; margin:0 auto;"
            />
          </td>
        </tr>
        <tr>
          <td style="background-color:#cfd4dd; padding:0 16px 48px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff; border-radius:28px; box-shadow:0 12px 24px rgba(12,35,68,0.15); padding:48px 56px;">
              <tr>
                <td style="text-align:center;">
                  <h1 style="margin:0; font-size:32px; color:#0c2344;">Verify your email</h1>
                  <div style="width:100%; height:1px; background-color:#e2e6ed; margin:24px 0;"></div>
                  <p style="margin:0; font-size:16px; line-height:1.7; color:#536079;">
                    Dear \${safeName}, to verify your email address please type the following code:
                  </p>
                  <p style="margin:32px 0 16px; font-size:64px; letter-spacing:8px; font-weight:700; color:#1f4aa5;">\${code}</p>
                  <p style="margin:0; font-size:14px; color:#6c768a;">If you didn’t request this verification, simply ignore this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 16px 32px; text-align:center;">
            <div style="display:inline-flex; align-items:center; gap:12px;">
              <img
                src="https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/ISO-ZELIFY-2025.png"
                alt="Zelify icon"
                width="48"
                height="48"
                style="display:block;"
              />
              <span style="font-size:18px; color:#1f4aa5;">Thinking Beyond Finances</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#9ffc28; text-align:center; padding:16px;">
            <p style="margin:0; font-size:13px; color:#0c2344;">Powered by Zwippe Tech Inc. · © \${year} Zelify</p>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`.trim(),
    },
  },
  {
    id: "tpl_mail_otp_reminder",
    key: "otpReminder",
    groupId: "otp-flows",
    channelGroup: "mailing",
    channel: "email",
    status: "inactive",
    name: "Recordatorio de OTP",
    subject: "Tu código sigue activo",
    description: "Recordatorio antes de que expire el código.",
    updatedAt: "2024-06-10T09:00:00Z",
    lastUsed: "2024-06-12T11:30:00Z",
    metrics: {
      openRate: 65,
      ctr: 15,
    },
    variables: [
      {
        key: "code",
        label: "Código OTP",
        placeholder: "${code}",
        sampleValue: "000000",
        required: true,
      },
      {
        key: "safeName",
        label: "Usuario",
        placeholder: "${safeName}",
        sampleValue: "Usuario",
        required: true,
      },
      {
        key: "expiresAt",
        label: "Hora de expiración",
        placeholder: "${expiresAt}",
        sampleValue: "10 minutos",
        required: true,
      },
    ],
    html: {
      es: `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:32px; font-family:'Inter', Arial, sans-serif; background:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:linear-gradient(180deg,#111f3b 0%,#0a1323 100%); border-radius:28px; color:#e2e8f0; box-shadow:0 24px 50px rgba(0,0,0,0.35); overflow:hidden;">
      <tr>
        <td style="padding:40px 48px;">
          <img src="https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/LOGO-ZELIFY-GRIS-2025.png" alt="Zelify" width="180" style="display:block; margin:0 auto 30px;" />
          <p style="margin:0; font-size:12px; letter-spacing:0.35em; text-transform:uppercase; color:#38bdf8; text-align:center;">
            Recordatorio de verificación
          </p>
          <h1 style="margin:16px 0 0; font-size:30px; text-align:center;">Tu código aún está activo</h1>
          <p style="margin:16px 0 0; font-size:15px; line-height:1.7; color:#94a3b8; text-align:center;">
            Hola \${safeName}, ingresa este código antes de <strong>\${expiresAt}</strong> para continuar con tu flujo seguro.
          </p>
          <div style="margin:32px auto 24px; max-width:360px; border-radius:24px; padding:24px; background:rgba(15,118,110,0.12); border:1px solid rgba(16,185,129,0.35); text-align:center;">
            <p style="margin:0; font-size:58px; letter-spacing:10px; font-weight:700; color:#22d3ee;">\${code}</p>
            <p style="margin-top:12px; font-size:13px; color:#cbd5f5;">Este código expira pronto</p>
          </div>
          <div style="text-align:center;">
            <a href="#" style="display:inline-flex; align-items:center; gap:10px; padding:12px 32px; background:#06b6d4; color:#0f172a; border-radius:999px; text-decoration:none; font-weight:600;">Abrir panel</a>
          </div>
          <p style="margin:28px 0 0; font-size:13px; color:#94a3b8; text-align:center;">
            Si no solicitaste este acceso, puedes ignorar este mensaje.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim(),
      en: `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:32px; font-family:'Inter', Arial, sans-serif; background:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:linear-gradient(180deg,#111f3b 0%,#0a1323 100%); border-radius:28px; color:#e2e8f0; box-shadow:0 24px 50px rgba(0,0,0,0.35); overflow:hidden;">
      <tr>
        <td style="padding:40px 48px;">
          <img src="https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/LOGO-ZELIFY-GRIS-2025.png" alt="Zelify" width="180" style="display:block; margin:0 auto 30px;" />
          <p style="margin:0; font-size:12px; letter-spacing:0.35em; text-transform:uppercase; color:#38bdf8; text-align:center;">
            Verification reminder
          </p>
          <h1 style="margin:16px 0 0; font-size:30px; text-align:center;">Your code is still active</h1>
          <p style="margin:16px 0 0; font-size:15px; line-height:1.7; color:#94a3b8; text-align:center;">
            Hi \${safeName}, enter this code before <strong>\${expiresAt}</strong> to finish securely.
          </p>
          <div style="margin:32px auto 24px; max-width:360px; border-radius:24px; padding:24px; background:rgba(15,118,110,0.12); border:1px solid rgba(16,185,129,0.35); text-align:center;">
            <p style="margin:0; font-size:58px; letter-spacing:10px; font-weight:700; color:#22d3ee;">\${code}</p>
            <p style="margin-top:12px; font-size:13px; color:#cbd5f5;">This code expires soon</p>
          </div>
          <div style="text-align:center;">
            <a href="#" style="display:inline-flex; align-items:center; gap:10px; padding:12px 32px; background:#06b6d4; color:#0f172a; border-radius:999px; text-decoration:none; font-weight:600;">Open dashboard</a>
          </div>
          <p style="margin:28px 0 0; font-size:13px; color:#94a3b8; text-align:center;">
            If you didn’t request this login, simply ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim(),
    },
  },
  {
    id: "tpl_mail_security_alert",
    key: "securityAlert",
    groupId: "security-alerts",
    channelGroup: "mailing",
    channel: "email",
    status: "inactive",
    name: "Alerta de seguridad",
    updatedAt: "2024-06-12T09:00:00Z",
    lastUsed: "2024-06-22T12:05:00Z",
    metrics: {
      openRate: 63,
      ctr: 14,
    },
    html: {
      es: `
<!DOCTYPE html>
<html>
  <body style="font-family: Inter, Arial, sans-serif; background:#0f172a; padding:32px; color:#f8fafc;">
    <div style="max-width:520px; margin:0 auto; border-radius:18px; background:#1e293b; padding:32px;">
      <p style="letter-spacing:0.2em; color:#f97316; font-size:11px; text-transform:uppercase;">Alerta de seguridad</p>
      <h1 style="font-size:28px; margin:12px 0;">Detectamos un acceso inusual</h1>
      <p style="font-size:15px; line-height:22px; color:#cbd5f5;">
        Hola {{firstName}}, hubo un inicio de sesión desde {{city}} usando un dispositivo {{device}}. Si no fuiste tú, responde este correo o bloquea tu cuenta.
      </p>
      <div style="margin-top:28px;">
        <a style="display:inline-block; background:#f97316; padding:12px 20px; border-radius:999px; color:#0f172a; font-weight:600; text-decoration:none;">Revisar actividad</a>
      </div>
    </div>
  </body>
</html>`.trim(),
      en: `
<!DOCTYPE html>
<html>
  <body style="font-family: Inter, Arial, sans-serif; background:#0f172a; padding:32px; color:#f8fafc;">
    <div style="max-width:520px; margin:0 auto; border-radius:18px; background:#1e293b; padding:32px;">
      <p style="letter-spacing:0.2em; color:#f97316; font-size:11px; text-transform:uppercase;">Security alert</p>
      <h1 style="font-size:28px; margin:12px 0;">Unusual access detected</h1>
      <p style="font-size:15px; line-height:22px; color:#cbd5f5;">
        Hi {{firstName}}, we noticed a sign in from {{city}} using a {{device}} device. If it was not you, reply to this email or block your account.
      </p>
      <div style="margin-top:28px;">
        <a style="display:inline-block; background:#f97316; padding:12px 20px; border-radius:999px; color:#0f172a; font-weight:600; text-decoration:none;">Review activity</a>
      </div>
    </div>
  </body>
</html>`.trim(),
    },
  },
  {
    id: "tpl_mail_monthly_summary",
    key: "monthlySummary",
    groupId: "monthly-reports",
    channelGroup: "mailing",
    channel: "email",
    status: "inactive",
    name: "Resumen mensual",
    updatedAt: "2024-05-30T17:40:00Z",
    lastUsed: "2024-05-31T11:00:00Z",
    metrics: {
      openRate: 70,
      ctr: 9,
    },
    html: {
      es: `
<!DOCTYPE html>
<html>
  <body style="font-family: 'Space Grotesk', Arial, sans-serif; background:#eef2ff; padding:32px;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; padding:32px; border-radius:20px;">
      <h2 style="margin:0; font-size:24px; color:#1d4ed8;">Tu resumen del mes</h2>
      <p style="margin-top:12px; color:#475467; font-size:15px;">
        Total movido: {{totalAmount}} · Cash-ins: {{cashIns}} · Cash-outs: {{cashOuts}}
      </p>
      <div style="display:flex; gap:16px; margin-top:24px;">
        <div style="flex:1; background:#eff6ff; border-radius:12px; padding:16px;">
          <p style="margin:0; color:#1d4ed8; font-size:12px;">Top destino</p>
          <p style="margin:6px 0 0 0; font-size:18px; font-weight:600; color:#0f172a;">{{topDestination}}</p>
        </div>
        <div style="flex:1; background:#fffbeb; border-radius:12px; padding:16px;">
          <p style="margin:0; color:#b45309; font-size:12px;">Próximo pago</p>
          <p style="margin:6px 0 0 0; font-size:18px; font-weight:600; color:#78350f;">{{nextPaymentDate}}</p>
        </div>
      </div>
    </div>
  </body>
</html>`.trim(),
      en: `
<!DOCTYPE html>
<html>
  <body style="font-family: 'Space Grotesk', Arial, sans-serif; background:#eef2ff; padding:32px;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; padding:32px; border-radius:20px;">
      <h2 style="margin:0; font-size:24px; color:#1d4ed8;">Your monthly summary</h2>
      <p style="margin-top:12px; color:#475467; font-size:15px;">
        Total moved: {{totalAmount}} · Cash-ins: {{cashIns}} · Cash-outs: {{cashOuts}}
      </p>
      <div style="display:flex; gap:16px; margin-top:24px;">
        <div style="flex:1; background:#eff6ff; border-radius:12px; padding:16px;">
          <p style="margin:0; color:#1d4ed8; font-size:12px;">Top destination</p>
          <p style="margin:6px 0 0 0; font-size:18px; font-weight:600; color:#0f172a;">{{topDestination}}</p>
        </div>
        <div style="flex:1; background:#fffbeb; border-radius:12px; padding:16px;">
          <p style="margin:0; color:#b45309; font-size:12px;">Next scheduled payment</p>
          <p style="margin:6px 0 0 0; font-size:18px; font-weight:600; color:#78350f;">{{nextPaymentDate}}</p>
        </div>
      </div>
    </div>
  </body>
</html>`.trim(),
    },
  },
  {
    id: "tpl_push_transfer",
    key: "transferPush",
    groupId: "push-transfers",
    channelGroup: "notifications",
    channel: "push",
    status: "active",
    name: "Transfer Push",
    updatedAt: "2024-06-20T08:00:00Z",
    lastUsed: "2024-06-25T09:45:00Z",
    metrics: {
      openRate: 91,
      ctr: 55,
    },
    html: {
      es: `
<div style="font-family: 'Inter', system-ui; padding:16px;">
  <p style="margin:0; color:#0f172a; font-size:16px; font-weight:600;">Transferencia enviada ✅</p>
  <p style="margin:6px 0 0 0; color:#334155;">Tu cash-out a {{destination}} se acreditó por {{amount}}. Guarda el comprobante {{transactionId}}.</p>
</div>`.trim(),
      en: `
<div style="font-family: 'Inter', system-ui; padding:16px;">
  <p style="margin:0; color:#0f172a; font-size:16px; font-weight:600;">Transfer sent ✅</p>
  <p style="margin:6px 0 0 0; color:#334155;">Your cash-out to {{destination}} was processed for {{amount}}. Save receipt {{transactionId}}.</p>
</div>`.trim(),
    },
  },
  {
    id: "tpl_push_cashout_alert",
    key: "cashOutAlert",
    groupId: "push-alerts",
    channelGroup: "notifications",
    channel: "push",
    status: "inactive",
    name: "Cash-out Alert",
    updatedAt: "2024-06-15T07:50:00Z",
    lastUsed: "2024-06-19T10:00:00Z",
    metrics: {
      openRate: 84,
      ctr: 48,
    },
    html: {
      es: `
<div style="font-family: 'Inter', system-ui; padding:16px;">
  <p style="margin:0; color:#991b1b; font-size:16px; font-weight:600;">Revisa este retiro inusual ⚠️</p>
  <p style="margin:6px 0 0 0; color:#475467;">Detectamos un intento de cash-out por {{amount}} a {{destination}}. Confirma si reconoces la operación.</p>
</div>`.trim(),
      en: `
<div style="font-family: 'Inter', system-ui; padding:16px;">
  <p style="margin:0; color:#991b1b; font-size:16px; font-weight:600;">Unusual cash-out detected ⚠️</p>
  <p style="margin:6px 0 0 0; color:#475467;">We detected a cash-out attempt of {{amount}} to {{destination}}. Confirm if you made this transaction.</p>
</div>`.trim(),
    },
  },
];
