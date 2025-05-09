export const getPasswordResetEmailTemplate = (resetUrl: string) => ({
  subject: 'Reset Your Student Hub Password',
  text: `You requested a password reset for your Student Hub account. Click the link to reset your password: ${resetUrl}\n\nIf you didn't request this, please ignore this email.`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border: 1px solid #e9ecef;">
        <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Student Hub Password Reset</h2>
        <p style="color: #666; line-height: 1.6;">
          Hello,
        </p>
        <p style="color: #666; line-height: 1.6;">
          We received a request to reset your password for your Student Hub account. 
          Click the button below to reset your password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          If you didn't request this password reset, you can safely ignore this email.
          The link will expire in 5 minutes.
        </p>
        <p style="color: #666; line-height: 1.6;">
          Best regards,<br>
          The Student Hub Team
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        © ${new Date().getFullYear()} Student Hub. All rights reserved.
      </div>
    </div>
  `,
})
