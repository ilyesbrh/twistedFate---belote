import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupScreen } from "../src/components/SignupScreen/SignupScreen.js";
import { AuthApiError } from "../src/auth/api.js";

function fill(testId: string, value: string): void {
  fireEvent.change(screen.getByTestId(testId), { target: { value } });
}

describe("SignupScreen", () => {
  it("renders email + password + nickname fields and a submit button", () => {
    render(
      <SignupScreen
        onSubmit={vi.fn()}
        onGotoLogin={vi.fn()}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    expect(screen.getByTestId("signup-screen")).toBeInTheDocument();
    expect(screen.getByTestId("signup-email")).toBeInTheDocument();
    expect(screen.getByTestId("signup-password")).toBeInTheDocument();
    expect(screen.getByTestId("signup-nickname")).toBeInTheDocument();
    expect(screen.getByTestId("signup-submit")).toBeInTheDocument();
  });

  it("submit is disabled until all three fields are filled with valid values", () => {
    render(
      <SignupScreen
        onSubmit={vi.fn()}
        onGotoLogin={vi.fn()}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    const submit = screen.getByTestId("signup-submit");
    expect(submit).toBeDisabled();
    fill("signup-email", "alice@example.com");
    expect(submit).toBeDisabled();
    fill("signup-password", "hunter22-pw");
    expect(submit).toBeDisabled();
    fill("signup-nickname", "Alice");
    expect(submit).toBeEnabled();
  });

  it("submit stays disabled if password is too short (client-side guard)", () => {
    render(
      <SignupScreen
        onSubmit={vi.fn()}
        onGotoLogin={vi.fn()}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    fill("signup-email", "alice@example.com");
    fill("signup-password", "short");
    fill("signup-nickname", "Alice");
    expect(screen.getByTestId("signup-submit")).toBeDisabled();
  });

  it("submitting calls onSubmit with trimmed nickname", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onSubmit = vi.fn();
    render(
      <SignupScreen
        onSubmit={onSubmit}
        onGotoLogin={vi.fn()}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    fill("signup-email", "alice@example.com");
    fill("signup-password", "hunter22-pw");
    fill("signup-nickname", "  Alice  ");
    await user.click(screen.getByTestId("signup-submit"));
    expect(onSubmit).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "hunter22-pw",
      nickname: "Alice",
    });
  });

  it("renders the email_taken error inline", () => {
    render(
      <SignupScreen
        onSubmit={vi.fn()}
        onGotoLogin={vi.fn()}
        onCancel={vi.fn()}
        error={new AuthApiError("email_taken", 409)}
        loading={false}
      />,
    );
    expect(screen.getByTestId("signup-error")).toHaveTextContent(/already exists/i);
  });

  it("renders a generic error for unknown codes", () => {
    render(
      <SignupScreen
        onSubmit={vi.fn()}
        onGotoLogin={vi.fn()}
        onCancel={vi.fn()}
        error={new AuthApiError("space_invader", 500)}
        loading={false}
      />,
    );
    expect(screen.getByTestId("signup-error")).toBeInTheDocument();
  });

  it("clicking 'Sign in instead' calls onGotoLogin", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onGotoLogin = vi.fn();
    render(
      <SignupScreen
        onSubmit={vi.fn()}
        onGotoLogin={onGotoLogin}
        onCancel={vi.fn()}
        error={null}
        loading={false}
      />,
    );
    await user.click(screen.getByTestId("signup-goto-login"));
    expect(onGotoLogin).toHaveBeenCalledTimes(1);
  });

  it("clicking Cancel calls onCancel", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onCancel = vi.fn();
    render(
      <SignupScreen
        onSubmit={vi.fn()}
        onGotoLogin={vi.fn()}
        onCancel={onCancel}
        error={null}
        loading={false}
      />,
    );
    await user.click(screen.getByTestId("signup-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
