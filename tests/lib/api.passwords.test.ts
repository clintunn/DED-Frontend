import {
  ApiError,
  changePassword,
  forgotPassword,
  resetPassword,
  setAccessTokenGetter,
} from "@/lib/api";

describe("password auth API client methods", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    setAccessTokenGetter(() => "session-token");
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls POST /auth/forgot-password and unwraps data envelope", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: { ok: true, token: "dev-reset-token" },
        }),
        { status: 200 }
      )
    );

    const result = await forgotPassword("person@example.com");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/auth/forgot-password",
      expect.objectContaining({
        method: "POST",
      })
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ email: "person@example.com" });
    expect(result).toEqual({ ok: true, token: "dev-reset-token" });
  });

  it("calls POST /auth/reset-password with token and password", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: { ok: true },
        }),
        { status: 200 }
      )
    );

    const result = await resetPassword("reset-token", "newpassword123");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3000/auth/reset-password");
    expect(JSON.parse(String(init.body))).toEqual({
      token: "reset-token",
      newPassword: "newpassword123",
    });
    expect(result).toEqual({ ok: true });
  });

  it("calls POST /auth/change-password with bearer token", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: { ok: true },
        }),
        { status: 200 }
      )
    );

    await changePassword("oldpassword123", "newpassword123", "explicit-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/auth/change-password",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer explicit-token",
        }),
      })
    );
  });

  it("surfaces backend message for user-facing errors", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          message: "Reset token is invalid or expired.",
        }),
        { status: 400 }
      )
    );

    await expect(resetPassword("bad-token", "newpassword123")).rejects.toMatchObject<
      Partial<ApiError>
    >({
      message: "Reset token is invalid or expired.",
      status: 400,
    });
  });
});
