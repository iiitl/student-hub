// Password must have at least 8 characters, uppercase, lowercase, number, and special char
export const PASSWORD_REGEX =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#\.?!@$%^&*()/\\\[\]{}~`+=,<|>;:'"-]).{8,}$/

export const validatePassword = (password: string): string | null => {
  if (PASSWORD_REGEX.test(password)) {
    return null
  }
  return 'Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character'
}
