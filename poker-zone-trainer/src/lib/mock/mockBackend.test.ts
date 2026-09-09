import { describe, expect, it } from "vitest";
import { mockBackend } from "./mockBackend";

describe("mockBackend", () => {
  it("supports sign up, profile update, and reading it back", async () => {
    const { error: signUpError } = await mockBackend.auth.signUp({ email: "a@example.com", password: "pw123456" });
    expect(signUpError).toBeNull();

    const { data: userData } = await mockBackend.auth.getUser();
    expect(userData.user?.id).toBeTruthy();
    const userId = userData.user!.id;

    await mockBackend.from("profiles").update({ onboarding_completed: true }).eq("id", userId);

    const { data: profile, error } = await mockBackend.from("profiles").select("*").eq("id", userId).single();
    expect(error).toBeNull();
    expect(profile.onboarding_completed).toBe(true);
    expect(profile.focus).toBe("mtt"); // default from signup
  });

  it("gates paid modules by trial count and lets the free module through unconditionally", async () => {
    await mockBackend.auth.signUp({ email: "b@example.com", password: "pw123456" });

    for (let i = 0; i < 5; i++) {
      const { data } = await mockBackend.rpc("start_module_session", { p_module: "mq" });
      expect(data.allowed).toBe(true);
    }
    const { data: sixth } = await mockBackend.rpc("start_module_session", { p_module: "mq" });
    expect(sixth.allowed).toBe(false);

    const { data: free } = await mockBackend.rpc("start_module_session", { p_module: "ranges" });
    expect(free.allowed).toBe(true);
  });

  it("judges record_attempt against the scenario's real correct_action", async () => {
    await mockBackend.auth.signUp({ email: "c@example.com", password: "pw123456" });

    const { data: scenarios } = await mockBackend.from("scenario_bank").select("*").eq("module", "ranges").limit(1);
    const scenario = scenarios[0];
    expect(scenario).toBeTruthy();

    const { data: correctResult } = await mockBackend.rpc("record_attempt", {
      p_scenario_id: scenario.id,
      p_chosen_action: scenario.correct_action,
    });
    expect(correctResult.is_correct).toBe(true);
    expect(correctResult.correct_action).toBe(scenario.correct_action);

    const wrongAction = scenario.correct_action === "FOLD" ? "RAISE" : "FOLD";
    const { data: wrongResult } = await mockBackend.rpc("record_attempt", {
      p_scenario_id: scenario.id,
      p_chosen_action: wrongAction,
    });
    expect(wrongResult.is_correct).toBe(false);
  });

  it("removes all of a user's data on delete_own_account", async () => {
    await mockBackend.auth.signUp({ email: "d@example.com", password: "pw123456" });
    const { data: userData } = await mockBackend.auth.getUser();
    const userId = userData.user!.id;

    await mockBackend.rpc("delete_own_account");

    const { data: session } = await mockBackend.auth.getSession();
    expect(session.session).toBeNull();

    const { data: profile } = await mockBackend.from("profiles").select("*").eq("id", userId).single();
    expect(profile).toBeNull();

    // Re-registering the same email must work again post-deletion.
    const { error } = await mockBackend.auth.signUp({ email: "d@example.com", password: "pw123456" });
    expect(error).toBeNull();
  });
});
