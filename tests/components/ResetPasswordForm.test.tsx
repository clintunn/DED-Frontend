import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import * as apiModule from "@/lib/api";

const replaceMock = vi.fn();
const getTokenMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => ({ get: getTokenMock }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    resetPassword: vi.fn(),
  };
});

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTokenMock.mockReturnValue("reset-token");
    vi.mocked(apiModule.resetPassword).mockResolvedValue({ ok: true });
  });

  it("prevents submit and shows error when token is missing", async () => {
    getTokenMock.mockReturnValue(null);
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password"), "password123");
    await user.type(screen.getByLabelText("Confirm password"), "password123");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      screen.getByText("Password reset token is missing. Please use the reset link from your email.")
    ).toBeInTheDocument();
    expect(apiModule.resetPassword).not.toHaveBeenCalled();
  });

  it("validates min length and password confirmation before submit", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password"), "short");
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(
      screen.getByText("Password must be at least 8 characters.")
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(apiModule.resetPassword).not.toHaveBeenCalled();
  });

  it("submits valid password reset and redirects to login", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("New password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm password"), "newpassword123");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(apiModule.resetPassword).toHaveBeenCalledWith(
        "reset-token",
        "newpassword123"
      );
    });
    expect(screen.getByText("Password updated. Please log in.")).toBeInTheDocument();
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
