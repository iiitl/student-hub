import nodemailer from 'nodemailer'
import { getPasswordResetEmailTemplate } from './emailTemplates'

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

const requiredEnvVars = [
  'EMAIL_SERVER_HOST',
  'EMAIL_SERVER_USER',
  'EMAIL_SERVER_PASSWORD',
  'EMAIL_SERVER_FROM',
]

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])
if (missingVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  )
}

// In production, throw an error to prevent runtime failures
if (process.env.NODE_ENV === 'production') {
  throw new Error(
    `Missing required email configuration: ${missingVars.join(', ')}`
  )
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_SERVER_FROM,
      to,
      subject,
      text,
      html,
    })
  } catch (error) {
    console.error(
      'Error sending email:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    throw new Error('Failed to send email')
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<void> {
  if (!process.env.NEXTAUTH_URL) {
    throw new Error(
      'Environment variable NEXTAUTH_URL is required for password reset links'
    )
  }
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${encodeURIComponent(resetToken)}`
  const { subject, text, html } = getPasswordResetEmailTemplate(resetUrl)
  await sendEmail({ to, subject, text, html })
}
