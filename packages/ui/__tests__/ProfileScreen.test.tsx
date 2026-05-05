import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileScreen } from "../src/components/ProfileScreen/ProfileScreen.js";
import type { PublicProfile, SelfProfile } from "../src/online/api/profile.js";

const SELF: SelfProfile = {
  id: "u_1",
  email: "alice@x.com",
  nickname: "Alice",
  avatarUrl: null,
  createdAt: 1_000,
  updatedAt: 2_000,
  stats: { total: 5, wins: 3, losses: 2, winRate: 0.6 },
};

const OTHER: PublicProfile = {
  id: "u_2",
  nickname: "Bob",
  avatarUrl: null,
  createdAt: 3_000,
  stats: { total: 0, wins: 0, losses: 0, winRate: 0 },
};

describe("ProfileScreen", () => {
  it("shows the loading state when loading", () => {
    render(
      <ProfileScreen
        profile={null}
        isSelf
        loading
        error={null}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("profile-loading")).toBeInTheDocument();
  });

  it("renders the user's nickname and stats", () => {
    render(
      <ProfileScreen
        profile={SELF}
        isSelf
        loading={false}
        error={null}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("profile-nickname")).toHaveTextContent("Alice");
    expect(screen.getByTestId("profile-stat-total")).toHaveTextContent("5");
    expect(screen.getByTestId("profile-stat-wins")).toHaveTextContent("3");
  });

  it("shows the email for self-profile", () => {
    render(
      <ProfileScreen
        profile={SELF}
        isSelf
        loading={false}
        error={null}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("profile-email")).toHaveTextContent("alice@x.com");
  });

  it("does not show email for non-self profile", () => {
    render(
      <ProfileScreen
        profile={OTHER}
        isSelf={false}
        loading={false}
        error={null}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("profile-email")).not.toBeInTheDocument();
  });

  it("Edit button only renders for self", () => {
    const { rerender } = render(
      <ProfileScreen
        profile={SELF}
        isSelf
        loading={false}
        error={null}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("profile-edit")).toBeInTheDocument();
    rerender(
      <ProfileScreen
        profile={OTHER}
        isSelf={false}
        loading={false}
        error={null}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("profile-edit")).not.toBeInTheDocument();
  });

  it("clicking Edit reveals a nickname input + Save", async () => {
    const user = userEvent.setup({ delay: 0 });
    render(
      <ProfileScreen
        profile={SELF}
        isSelf
        loading={false}
        error={null}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("profile-edit"));
    expect(screen.getByTestId("profile-nickname-input")).toBeInTheDocument();
    expect(screen.getByTestId("profile-save")).toBeInTheDocument();
  });

  it("Save calls onSave with the new nickname", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onSave = vi.fn();
    render(
      <ProfileScreen
        profile={SELF}
        isSelf
        loading={false}
        error={null}
        onSave={onSave}
        onBack={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("profile-edit"));
    fireEvent.change(screen.getByTestId("profile-nickname-input"), {
      target: { value: "Alicia" },
    });
    await user.click(screen.getByTestId("profile-save"));
    expect(onSave).toHaveBeenCalledWith({ nickname: "Alicia" });
  });

  it("Cancel exits edit mode without saving", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onSave = vi.fn();
    render(
      <ProfileScreen
        profile={SELF}
        isSelf
        loading={false}
        error={null}
        onSave={onSave}
        onBack={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("profile-edit"));
    await user.click(screen.getByTestId("profile-cancel-edit"));
    expect(screen.queryByTestId("profile-nickname-input")).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("clicking Back fires onBack", async () => {
    const user = userEvent.setup({ delay: 0 });
    const onBack = vi.fn();
    render(
      <ProfileScreen
        profile={SELF}
        isSelf
        loading={false}
        error={null}
        onSave={vi.fn()}
        onBack={onBack}
      />,
    );
    await user.click(screen.getByTestId("profile-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders an error", () => {
    render(
      <ProfileScreen
        profile={null}
        isSelf
        loading={false}
        error="something broke"
        onSave={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId("profile-error")).toHaveTextContent(/something broke/i);
  });
});
