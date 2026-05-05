import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdentityChip } from "../src/components/IdentityChip/IdentityChip.js";
import type { Identity } from "@belote/protocol";

const USER: Identity = { kind: "user", id: "u_1", nickname: "Alice" };
const GUEST: Identity = { kind: "guest", id: "g_1", nickname: "Guest-abcd" };

describe("IdentityChip", () => {
  it("renders the user nickname", () => {
    render(
      <IdentityChip identity={USER} onSignIn={vi.fn()} onSignUp={vi.fn()} onSignOut={vi.fn()} />,
    );
    expect(screen.getByTestId("identity-chip")).toBeInTheDocument();
    expect(screen.getByTestId("identity-chip-label")).toHaveTextContent("Alice");
  });

  it("renders the guest nickname", () => {
    render(
      <IdentityChip identity={GUEST} onSignIn={vi.fn()} onSignUp={vi.fn()} onSignOut={vi.fn()} />,
    );
    expect(screen.getByTestId("identity-chip-label")).toHaveTextContent("Guest-abcd");
  });

  it("user dropdown shows Sign out only", async () => {
    const user = userEvent.setup();
    render(
      <IdentityChip identity={USER} onSignIn={vi.fn()} onSignUp={vi.fn()} onSignOut={vi.fn()} />,
    );
    await user.click(screen.getByTestId("identity-chip"));
    expect(screen.getByTestId("identity-action-signout")).toBeInTheDocument();
    expect(screen.queryByTestId("identity-action-signin")).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-action-signup")).not.toBeInTheDocument();
  });

  it("guest dropdown shows Sign in + Sign up", async () => {
    const user = userEvent.setup();
    render(
      <IdentityChip identity={GUEST} onSignIn={vi.fn()} onSignUp={vi.fn()} onSignOut={vi.fn()} />,
    );
    await user.click(screen.getByTestId("identity-chip"));
    expect(screen.getByTestId("identity-action-signin")).toBeInTheDocument();
    expect(screen.getByTestId("identity-action-signup")).toBeInTheDocument();
    expect(screen.queryByTestId("identity-action-signout")).not.toBeInTheDocument();
  });

  it("clicking Sign in fires onSignIn", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(
      <IdentityChip identity={GUEST} onSignIn={onSignIn} onSignUp={vi.fn()} onSignOut={vi.fn()} />,
    );
    await user.click(screen.getByTestId("identity-chip"));
    await user.click(screen.getByTestId("identity-action-signin"));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("clicking Sign up fires onSignUp", async () => {
    const user = userEvent.setup();
    const onSignUp = vi.fn();
    render(
      <IdentityChip identity={GUEST} onSignIn={vi.fn()} onSignUp={onSignUp} onSignOut={vi.fn()} />,
    );
    await user.click(screen.getByTestId("identity-chip"));
    await user.click(screen.getByTestId("identity-action-signup"));
    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  it("clicking Sign out fires onSignOut", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(
      <IdentityChip identity={USER} onSignIn={vi.fn()} onSignUp={vi.fn()} onSignOut={onSignOut} />,
    );
    await user.click(screen.getByTestId("identity-chip"));
    await user.click(screen.getByTestId("identity-action-signout"));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when identity is null (loading)", () => {
    render(
      <IdentityChip identity={null} onSignIn={vi.fn()} onSignUp={vi.fn()} onSignOut={vi.fn()} />,
    );
    expect(screen.queryByTestId("identity-chip")).not.toBeInTheDocument();
  });

  it("user dropdown shows a 'View history' item when onViewHistory is provided", async () => {
    const user = userEvent.setup();
    const onViewHistory = vi.fn();
    render(
      <IdentityChip
        identity={USER}
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onSignOut={vi.fn()}
        onViewHistory={onViewHistory}
      />,
    );
    await user.click(screen.getByTestId("identity-chip"));
    const historyItem = screen.getByTestId("identity-action-history");
    expect(historyItem).toBeInTheDocument();
    await user.click(historyItem);
    expect(onViewHistory).toHaveBeenCalledTimes(1);
  });

  it("user dropdown shows a 'Friends' item when onViewFriends is provided", async () => {
    const user = userEvent.setup();
    const onViewFriends = vi.fn();
    render(
      <IdentityChip
        identity={USER}
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onSignOut={vi.fn()}
        onViewFriends={onViewFriends}
      />,
    );
    await user.click(screen.getByTestId("identity-chip"));
    const friendsItem = screen.getByTestId("identity-action-friends");
    expect(friendsItem).toBeInTheDocument();
    await user.click(friendsItem);
    expect(onViewFriends).toHaveBeenCalledTimes(1);
  });

  it("guest dropdown does not show 'Friends' even when handler is provided", async () => {
    const user = userEvent.setup();
    render(
      <IdentityChip
        identity={GUEST}
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onSignOut={vi.fn()}
        onViewFriends={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("identity-chip"));
    expect(screen.queryByTestId("identity-action-friends")).not.toBeInTheDocument();
  });

  it("guest dropdown does not show 'View history' even when handler is provided", async () => {
    const user = userEvent.setup();
    render(
      <IdentityChip
        identity={GUEST}
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onSignOut={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("identity-chip"));
    expect(screen.queryByTestId("identity-action-history")).not.toBeInTheDocument();
  });

  it("user chip shows a 'user' kind data attribute, guest shows 'guest'", () => {
    const { rerender } = render(
      <IdentityChip identity={USER} onSignIn={vi.fn()} onSignUp={vi.fn()} onSignOut={vi.fn()} />,
    );
    expect(screen.getByTestId("identity-chip")).toHaveAttribute("data-kind", "user");
    rerender(
      <IdentityChip identity={GUEST} onSignIn={vi.fn()} onSignUp={vi.fn()} onSignOut={vi.fn()} />,
    );
    expect(screen.getByTestId("identity-chip")).toHaveAttribute("data-kind", "guest");
  });
});
