import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import * as authModule from "@/components/auth/AuthContext";
import * as apiModule from "@/lib/api";

const replaceMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/components/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    changePassword: vi.fn(),
  };
});

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.useAuth).mockReturnValue({
      accessToken: "access-token",
      logout: logoutMock,
    } as ReturnType<typeof authModule.useAuth>);
    vi.mocked(apiModule.changePassword).mockResolvedValue({ ok: true });
  });

  it("validates required current password, min length, and match", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("New password"), "short");
    await user.type(screen.getByLabelText("Confirm new password"), "different");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(screen.getByText("Current password is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Password must be at least 8 characters.")
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(apiModule.changePassword).not.toHaveBeenCalled();
  });

  it("submits and shows success feedback", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("Current password"), "oldpassword123");
    await user.type(screen.getByLabelText("New password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm new password"), "newpassword123");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      expect(apiModule.changePassword).toHaveBeenCalledWith(
        "oldpassword123",
        "newpassword123",
        "access-token"
      );
    });
    expect(screen.getByText("Password changed successfully.")).toBeInTheDocument();
  });

  it("handles 401 by logging out and redirecting to login", async () => {
    vi.mocked(apiModule.changePassword).mockRejectedValue(
      new apiModule.ApiError("Unauthorized", 401)
    );
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("Current password"), "oldpassword123");
    await user.type(screen.getByLabelText("New password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm new password"), "newpassword123");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
    expect(
      screen.getByText("Your session has expired. Please log in again.")
    ).toBeInTheDocument();
  });
});
