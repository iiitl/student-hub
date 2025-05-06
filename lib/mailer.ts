import nodemailer from 'nodemailer'

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: process.env.EMAIL_SERVER_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
) => {
  const transporter = createTransporter()

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${encodeURIComponent(resetToken)}`

  const mailOptions = {
    from: `${process.env.EMAIL_SERVER_USER}`,
    to: email,
    subject: 'Reset Your Password',
    text: `
      Hello,
      
      You requested to reset your password for your Student Hub account.
      
      Please click the link below to reset your password. This link will expire in 1 hour.
      
      ${resetUrl}
      
      If you did not request a password reset, please ignore this email.
      
      Regards,
      Student Hub Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for your Student Hub account.</p>
        <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a 
            href="${resetUrl}" 
            style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;"
          >
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Regards,<br>Student Hub Team</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
