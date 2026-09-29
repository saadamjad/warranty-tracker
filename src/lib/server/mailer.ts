import nodemailer, { type Transporter } from "nodemailer";
import { serverEnv } from "./env";

export type Mail = { to: string; subject: string; text: string; html: string };

let transport: Transporter | undefined;

/** Sends through SMTP in production; without SMTP (local dev) prints the email instead (D-21). */
export async function sendMail(mail: Mail): Promise<void> {
  const env = serverEnv();
  if (!env.SMTP_HOST) {
    console.info(`\n[email to ${mail.to}] ${mail.subject}\n${mail.text}\n`);
    return;
  }
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  await transport.sendMail({ from: env.EMAIL_FROM, ...mail });
}
