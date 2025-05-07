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

// Send OTP verification email
export const sendOTPVerificationEmail = async (
  email: string,
  otp: string
) => {
  const transporter = createTransporter()

  const mailOptions = {
    from: `${process.env.EMAIL_SERVER_USER}`,
    to: email,
    subject: 'Email Verification OTP',
    text: `
      Hello,
      
      Your OTP for email verification is: ${otp}
      
      This OTP will expire in 10 minutes.
      
      If you did not request this OTP, please ignore this email.
      
      Regards,
      Student Hub Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Email Verification OTP</h2>
        <p>Hello,</p>
        <p>Your OTP for email verification is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f3f4f6; padding: 20px; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 4px;">
            ${otp}
          </div>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
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
