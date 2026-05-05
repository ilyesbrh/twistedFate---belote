/**
 * Maps AuthApiError codes to user-facing messages.
 *
 * Keep this list short and forgiving — server can introduce new
 * codes without crashing the UI; an unknown code yields a sensible
 * generic fallback.
 */

export function authErrorMessage(code: string): string {
  switch (code) {
    case "invalid_credentials":
      return "Wrong email or password.";
    case "email_taken":
      return "An account already exists with that email.";
    case "weak_password":
      return "Password must be at least 8 characters.";
    case "invalid_email":
      return "Please enter a valid email.";
    case "invalid_nickname":
      return "Nickname is required (1–32 characters).";
    case "unauthenticated":
      return "Please sign in to continue.";
    case "network":
      return "Couldn't reach the server. Check your connection.";
    default:
      return "Something went wrong. Please try again.";
  }
}
