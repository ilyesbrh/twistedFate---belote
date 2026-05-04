import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatButton } from "../src/components/ChatButton/ChatButton.js";

describe("ChatButton", () => {
  it("renders with the chat-button testid", () => {
    render(<ChatButton onClick={vi.fn()} />);
    expect(screen.getByTestId("chat-button")).toBeInTheDocument();
  });

  it("exposes an accessible 'Open chat' label", () => {
    render(<ChatButton onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /open chat/i })).toBeInTheDocument();
  });

  it("is marked as a primary touch target", () => {
    render(<ChatButton onClick={vi.fn()} />);
    expect(screen.getByTestId("chat-button")).toHaveAttribute("data-touch", "primary");
  });

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ChatButton onClick={onClick} />);
    await user.click(screen.getByTestId("chat-button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not render the unread badge when count is 0", () => {
    render(<ChatButton onClick={vi.fn()} unreadCount={0} />);
    expect(screen.queryByLabelText(/unread/i)).not.toBeInTheDocument();
  });

  it("renders the unread badge with count when > 0", () => {
    render(<ChatButton onClick={vi.fn()} unreadCount={3} />);
    expect(screen.getByLabelText("3 unread")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the badge label at 9+", () => {
    render(<ChatButton onClick={vi.fn()} unreadCount={42} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });
});
