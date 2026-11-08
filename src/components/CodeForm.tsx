"use client";

import { useActionState } from "react";
import type { LoginState } from "@/app/login/actions";

type Props = {
  action: (prev: LoginState, form: FormData) => Promise<LoginState>;
  initial: LoginState;
  /** Toon het e-mailveld in de eerste stap (login). Bij het partnerslot is het adres al bekend. */
  askEmail: boolean;
  sendLabel: string;
  next?: string;
};

export default function CodeForm({ action, initial, askEmail, sendLabel, next }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);

  if (state.step === "email") {
    return (
      <form action={formAction} className="form">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {askEmail ? (
          <>
            <label htmlFor="email">Je FP&amp;P-mailadres</label>
            <input id="email" name="email" type="email" autoComplete="email" required placeholder="naam@fpnp.nl" />
          </>
        ) : null}
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
        <button className="btn" name="intent" value="send" disabled={pending}>
          {pending ? "Bezig…" : sendLabel}
        </button>
      </form>
    );
  }

  return (
    <form action={formAction} className="form">
      <input type="hidden" name="email" value={state.email ?? ""} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.info ? <p className="form-info">{state.info}</p> : null}
      <label htmlFor="token">Code uit je mail</label>
      <input
        id="token"
        name="token"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        required
        placeholder="123456"
        className="code-input"
      />
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <div className="form-row">
        <button className="btn" name="intent" value="verify" disabled={pending}>
          {pending ? "Bezig…" : "Verder"}
        </button>
        <button className="btn-ghost" name="intent" value="resend" formNoValidate disabled={pending}>
          Nieuwe code
        </button>
      </div>
    </form>
  );
}
