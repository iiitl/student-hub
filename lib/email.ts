import nodemailer from 'nodemailer'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import { getPasswordResetEmailTemplate } from './emailTemplates'

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

function validateEmailEnvVars() {
  const requiredEnvVars = [
    'EMAIL_SERVER_HOST',
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD',
    'EMAIL_SERVER_FROM',
  ]

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])
  if (missingVars.length > 0) {
    console.warn(
      `Missing SMTP environment variables: ${missingVars.join(', ')}`
    )
  }
}

function validateMailgunEnvVars(): boolean {
  const requiredVars = [
    'MAILGUN_API_KEY',
    'MAILGUN_DOMAIN',
    'EMAIL_SERVER_FROM',
  ]
  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.warn(
      `Missing Mailgun environment variables: ${missingVars.join(', ')}`
    )
    return false
  }
  return true
}

let transporter: nodemailer.Transporter | null = null
let mailgunClient: ReturnType<Mailgun['client']> | null = null

function getMailgunClient() {
  if (!mailgunClient && validateMailgunEnvVars()) {
    const mailgun = new Mailgun(FormData)
    mailgunClient = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || '',
      url: process.env.MAILGUN_URL || 'https://api.mailgun.net',
    })
  }
  return mailgunClient
}

function getTransporter() {
  validateEmailEnvVars()

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })
  }

  return transporter
}

async function sendEmailWithMailgun({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<boolean> {
  const mg = getMailgunClient()

  if (!mg || !process.env.MAILGUN_DOMAIN) {
    console.log('Mailgun client not initialized or domain missing')
    return false
  }

  try {
    // Ensure from address is in proper format
    const fromAddress = process.env.EMAIL_SERVER_FROM || ''

    console.log('Attempting to send email via Mailgun:', {
      domain: process.env.MAILGUN_DOMAIN,
      from: fromAddress,
      to: to,
    })

    const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: fromAddress,
      to: [to],
      subject,
      text,
      html,
    })

    console.log('Email sent successfully via Mailgun:', data.id)
    return true
  } catch (error: unknown) {
    const err = error as {
      message?: string
      status?: number
      details?: string
      body?: unknown
    }
    console.error('Mailgun error details:', {
      message: err?.message,
      status: err?.status,
      details: err?.details,
      body: err?.body,
    })
    return false
  }
}

async function sendEmailWithSMTP({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<void> {
  const transporter = getTransporter()

  console.log('Attempting to send email via SMTP:', {
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    from: process.env.EMAIL_SERVER_FROM,
    to: to,
  })

  await transporter.sendMail({
    from: process.env.EMAIL_SERVER_FROM,
    to,
    subject,
    text,
    html,
  })
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<void> {
  // Try Mailgun first
  const mailgunSuccess = await sendEmailWithMailgun({ to, subject, text, html })

  if (mailgunSuccess) {
    console.log('Email sent successfully via Mailgun')
    return
  }

  // Fallback to SMTP if Mailgun fails
  console.log('Falling back to SMTP...')
  try {
    await sendEmailWithSMTP({ to, subject, text, html })
    console.log('Email sent successfully via SMTP')
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; command?: string }
    console.error('SMTP error details:', {
      message: err?.message,
      code: err?.code,
      command: err?.command,
    })
    throw new Error('Failed to send email via both Mailgun and SMTP')
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
