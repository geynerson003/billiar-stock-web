import { describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { RegisterUseCase } from "../../../../src/features/auth/domain/use-cases/register.use-case";
import type {
  IUserAuthRepository,
  IUserProfileRepository,
} from "../../../../src/features/auth/domain/interfaces";

const fakeUser = { uid: "u1" } as User;

function setup(profileOverrides: Partial<IUserProfileRepository> = {}) {
  const authRepo: IUserAuthRepository = {
    register: vi.fn().mockResolvedValue(fakeUser),
    login: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    getCurrentUser: vi.fn(),
    onAuthStateChanged: vi.fn(),
  };
  const profileRepo: IUserProfileRepository = {
    watchProfile: vi.fn(),
    getProfile: vi.fn(),
    createProfile: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn(),
    createBusiness: vi.fn().mockResolvedValue(undefined),
    ...profileOverrides,
  };
  return { authRepo, profileRepo, useCase: new RegisterUseCase(authRepo, profileRepo) };
}

const input = {
  email: "a@b.com",
  password: "secret",
  businessName: "Mi Tienda",
  country: "CO",
  market: "store",
};

describe("RegisterUseCase", () => {
  it("orquesta register -> createProfile -> createBusiness y devuelve el user", async () => {
    const { useCase, profileRepo } = setup();
    const user = await useCase.execute(input);
    expect(user).toBe(fakeUser);
    expect(profileRepo.createProfile).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ uid: "u1", email: "a@b.com", market: "store" })
    );
    expect(profileRepo.createBusiness).toHaveBeenCalled();
  });

  it("lanza un mensaje en español si falla la creación del perfil", async () => {
    const { useCase } = setup({
      createProfile: vi.fn().mockRejectedValue(new Error("firestore down")),
    });
    await expect(useCase.execute(input)).rejects.toThrow(
      "No fue posible completar el registro del perfil. Intenta de nuevo."
    );
  });
});
