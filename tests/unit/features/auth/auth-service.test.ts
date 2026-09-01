import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { AuthService } from "../../../../src/features/auth/application/services/auth.service";
import type {
  IUserAuthRepository,
  IUserProfileRepository,
} from "../../../../src/features/auth/domain/interfaces";

const fakeUser = { uid: "u1", email: "a@b.com" } as User;

function makeRepos() {
  const authRepo: IUserAuthRepository = {
    register: vi.fn().mockResolvedValue(fakeUser),
    login: vi.fn().mockResolvedValue(fakeUser),
    logout: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    getCurrentUser: vi.fn().mockReturnValue(fakeUser),
    onAuthStateChanged: vi.fn().mockReturnValue(() => {}),
  };
  const profileRepo: IUserProfileRepository = {
    watchProfile: vi.fn().mockReturnValue(() => {}),
    getProfile: vi.fn().mockResolvedValue(null),
    createProfile: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    createBusiness: vi.fn().mockResolvedValue(undefined),
  };
  return { authRepo, profileRepo };
}

describe("AuthService", () => {
  let authRepo: IUserAuthRepository;
  let profileRepo: IUserProfileRepository;
  let service: AuthService;

  beforeEach(() => {
    ({ authRepo, profileRepo } = makeRepos());
    service = new AuthService(authRepo, profileRepo);
  });

  it("login delega en authRepository.login", async () => {
    const user = await service.login({ email: "a@b.com", password: "secret" });
    expect(authRepo.login).toHaveBeenCalledWith("a@b.com", "secret");
    expect(user).toBe(fakeUser);
  });

  it("logout delega en authRepository.logout", async () => {
    await service.logout();
    expect(authRepo.logout).toHaveBeenCalledOnce();
  });

  it("resetPassword delega en authRepository.resetPassword", async () => {
    await service.resetPassword({ email: "a@b.com" });
    expect(authRepo.resetPassword).toHaveBeenCalledWith("a@b.com");
  });

  it("updateProfile delega con userId y patch", async () => {
    await service.updateProfile({ userId: "u1", patch: { market: "bar" } });
    expect(profileRepo.updateProfile).toHaveBeenCalledWith("u1", { market: "bar" });
  });

  it("register crea usuario, perfil y negocio", async () => {
    await service.register({
      email: "a@b.com",
      password: "secret",
      businessName: "Mi Tienda",
      country: "CO",
      market: "store",
    });
    expect(authRepo.register).toHaveBeenCalledWith("a@b.com", "secret");
    expect(profileRepo.createProfile).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ uid: "u1", businessName: "Mi Tienda", market: "store", country: "CO" })
    );
    expect(profileRepo.createBusiness).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ initialized: true, businessName: "Mi Tienda", market: "store" })
    );
  });

  it("propaga errores del repositorio en login", async () => {
    (authRepo.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("bad creds"));
    await expect(service.login({ email: "x", password: "y" })).rejects.toThrow("bad creds");
  });
});
