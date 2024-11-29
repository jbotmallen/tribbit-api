export const resetPasswordEmailTemplate = (resetUrl: string): string => `
  <h1>Reset Your Password</h1>
  <p>Click the link below to reset your password:</p>
  <a href="${resetUrl}">Reset Password</a>
  <p>This link is valid for one hour.</p>
`;

export const verifyEmailTemplate = (verificationUrl: string): string => `
  <h1>Verify Your Email</h1>
  <p>Click the link below to verify your email:</p>
  <a href="${verificationUrl}">Verify Email</a>
`;