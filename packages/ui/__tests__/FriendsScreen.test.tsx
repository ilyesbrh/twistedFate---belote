import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FriendsScreen } from "../src/components/FriendsScreen/FriendsScreen.js";
import type { Friend, FriendRequest } from "../src/online/api/friends.js";

function noop(): void {
  /* no-op */
}

const FRIEND_ALICE: Friend = {
  userId: "u_alice",
  email: "alice@x.com",
  nickname: "Alice",
  avatarUrl: null,
};
const REQ_BOB: FriendRequest = {
  id: "r_bob",
  otherUserId: "u_bob",
  otherEmail: "bob@x.com",
  otherNickname: "Bob",
  createdAt: 1_000,
};

describe("FriendsScreen", () => {
  it("renders the loading state when loading", () => {
    render(
      <FriendsScreen
        friends={[]}
        incoming={[]}
        outgoing={[]}
        loading
        error={null}
        mutating={false}
        onSendRequest={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
        onBack={noop}
      />,
    );
    expect(screen.getByTestId("friends-loading")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(
      <FriendsScreen
        friends={[]}
        incoming={[]}
        outgoing={[]}
        loading={false}
        error={null}
        mutating={false}
        onSendRequest={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
        onBack={noop}
      />,
    );
    expect(screen.getByTestId("friends-empty")).toBeInTheDocument();
  });

  it("renders friends list with nicknames", () => {
    render(
      <FriendsScreen
        friends={[FRIEND_ALICE]}
        incoming={[]}
        outgoing={[]}
        loading={false}
        error={null}
        mutating={false}
        onSendRequest={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
        onBack={noop}
      />,
    );
    expect(screen.getByTestId("friend-row-u_alice")).toHaveTextContent("Alice");
  });

  it("clicking Remove calls onRemove with the friend's userId", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onRemove = vi.fn();
    render(
      <FriendsScreen
        friends={[FRIEND_ALICE]}
        incoming={[]}
        outgoing={[]}
        loading={false}
        error={null}
        mutating={false}
        onSendRequest={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onCancel={vi.fn()}
        onRemove={onRemove}
        onBack={noop}
      />,
    );
    await user.click(screen.getByTestId("friend-remove-u_alice"));
    expect(onRemove).toHaveBeenCalledWith("u_alice");
  });

  it("incoming requests show Accept and Reject buttons", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onAccept = vi.fn();
    const onReject = vi.fn();
    render(
      <FriendsScreen
        friends={[]}
        incoming={[REQ_BOB]}
        outgoing={[]}
        loading={false}
        error={null}
        mutating={false}
        onSendRequest={vi.fn()}
        onAccept={onAccept}
        onReject={onReject}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
        onBack={noop}
      />,
    );
    expect(screen.getByTestId("incoming-row-r_bob")).toBeInTheDocument();
    await user.click(screen.getByTestId("incoming-accept-r_bob"));
    expect(onAccept).toHaveBeenCalledWith("r_bob");
    await user.click(screen.getByTestId("incoming-reject-r_bob"));
    expect(onReject).toHaveBeenCalledWith("r_bob");
  });

  it("outgoing requests show Cancel button", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onCancel = vi.fn();
    render(
      <FriendsScreen
        friends={[]}
        incoming={[]}
        outgoing={[REQ_BOB]}
        loading={false}
        error={null}
        mutating={false}
        onSendRequest={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onCancel={onCancel}
        onRemove={vi.fn()}
        onBack={noop}
      />,
    );
    expect(screen.getByTestId("outgoing-row-r_bob")).toBeInTheDocument();
    await user.click(screen.getByTestId("outgoing-cancel-r_bob"));
    expect(onCancel).toHaveBeenCalledWith("r_bob");
  });

  it("submitting the add-friend form calls onSendRequest with the email", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onSendRequest = vi.fn();
    render(
      <FriendsScreen
        friends={[]}
        incoming={[]}
        outgoing={[]}
        loading={false}
        error={null}
        mutating={false}
        onSendRequest={onSendRequest}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
        onBack={noop}
      />,
    );
    fireEvent.change(screen.getByTestId("add-friend-email"), {
      target: { value: "bob@x.com" },
    });
    await user.click(screen.getByTestId("add-friend-submit"));
    expect(onSendRequest).toHaveBeenCalledWith("bob@x.com");
  });

  it("clicking Back fires onBack", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onBack = vi.fn();
    render(
      <FriendsScreen
        friends={[]}
        incoming={[]}
        outgoing={[]}
        loading={false}
        error={null}
        mutating={false}
        onSendRequest={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
        onBack={onBack}
      />,
    );
    await user.click(screen.getByTestId("friends-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
