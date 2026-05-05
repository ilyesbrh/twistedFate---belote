import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginScreen } from "../src/components/LoginScreen/LoginScreen.js";
import { AuthApiError } from "../src/auth/api.js";

function fillEmail(value: string): void {
  fireEvent.change(screen.getByTestId("login-email"), { target: { value } });
}
function fillPassword(value: string): void {
  fireEvent.change(screen.getByTestId("login-password"), { target: { value } });
}

describe("LoginScreen", () => {
  it("renders the form with email + password fields and a submit button", () => {
    render(
      <LoginScreen
        onSubmit={vi.fn()}
        onGotoSignup={vi.fn()}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    expect(screen.getByTestId("login-email")).toBeInTheDocument();
    expect(screen.getByTestId("login-password")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit")).toBeInTheDocument();
  });

  it("submit button is disabled until email + password are present", () => {
    render(
      <LoginScreen
        onSubmit={vi.fn()}
        onGotoSignup={vi.fn()}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    const submit = screen.getByTestId("login-submit");
    expect(submit).toBeDisabled();
    fillEmail("alice@example.com");
    expect(submit).toBeDisabled();
    fillPassword("hunter22-pw");
    expect(submit).toBeEnabled();
  });

  it("submitting calls onSubmit with the form values", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onSubmit = vi.fn();
    render(
      <LoginScreen
        onSubmit={onSubmit}
        onGotoSignup={vi.fn()}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    fillEmail("alice@example.com");
    fillPassword("hunter22-pw");
    await user.click(screen.getByTestId("login-submit"));
    expect(onSubmit).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "hunter22-pw",
    });
  });

  it("renders an error message when error is non-null", () => {
    render(
      <LoginScreen
        onSubmit={vi.fn()}
        onGotoSignup={vi.fn()}
        onCancel={vi.fn()}
        error={new AuthApiError("invalid_credentials", 401)}
        loading={false}
      />,
    );
    expect(screen.getByTestId("login-error")).toHaveTextContent(/wrong email or password/i);
  });

  it("renders a generic error message for unknown error codes", () => {
    render(
      <LoginScreen
        onSubmit={vi.fn()}
        onGotoSignup={vi.fn()}
        onCancel={vi.fn()}
        error={new AuthApiError("server_meltdown", 500)}
        loading={false}
      />,
    );
    expect(screen.getByTestId("login-error")).toBeInTheDocument();
  });

  it("disables the submit button while loading", () => {
    render(
      <LoginScreen
        onSubmit={vi.fn()}
        onGotoSignup={vi.fn()}
        onCancel={vi.fn()}
        error={null}
        loading
      />,
    );
    expect(screen.getByTestId("login-submit")).toBeDisabled();
  });

  it("clicking the Sign-up link calls onGotoSignup", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onGotoSignup = vi.fn();
    render(
      <LoginScreen
        onSubmit={vi.fn()}
        onGotoSignup={onGotoSignup}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    await user.click(screen.getByTestId("login-goto-signup"));
    expect(onGotoSignup).toHaveBeenCalledTimes(1);
  });

  it("clicking the Cancel link calls onCancel", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onCancel = vi.fn();
    render(
      <LoginScreen
        onSubmit={vi.fn()}
        onGotoSignup={vi.fn()}
        onCancel={onCancel}
        error={null}
        loading={false}
      />,
    );
    await user.click(screen.getByTestId("login-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("submitting via Enter in the password field also calls onSubmit", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onSubmit = vi.fn();
    render(
      <LoginScreen
        onSubmit={onSubmit}
        onGotoSignup={vi.fn()}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    fillEmail("alice@example.com");
    fillPassword("hunter22-pw");
    const password = screen.getByTestId("login-password");
    password.focus();
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
