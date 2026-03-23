"use client";

import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ChangePasswordView(props: any) {
  const {
    oldPassword,
    newPassword,
    confirm,
    showOld,
    showNew,
    showConfirm,
    loading,
    msg,
    error,
    passwordChecks,
    setOldPassword,
    setNewPassword,
    setConfirm,
    setShowOld,
    setShowNew,
    setShowConfirm,
    onSubmit,
  } = props;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow lg:grid-cols-2">

          {/* LEFT */}
          <div className="flex items-center bg-slate-950 px-8 py-10 text-white">
            <div>
              <h1 className="text-3xl font-extrabold">
                Changement obligatoire du mot de passe
              </h1>
            </div>
          </div>

          {/* RIGHT */}
          <div className="p-8">
            <form onSubmit={onSubmit} className="space-y-5">

              <PasswordField
                label="Mot de passe actuel"
                value={oldPassword}
                setValue={setOldPassword}
                show={showOld}
                setShow={setShowOld}
              />

              <PasswordField
                label="Nouveau mot de passe"
                value={newPassword}
                setValue={setNewPassword}
                show={showNew}
                setShow={setShowNew}
              />

              <PasswordField
                label="Confirmer"
                value={confirm}
                setValue={setConfirm}
                show={showConfirm}
                setShow={setShowConfirm}
              />

              <div>
                {passwordChecks.map((c: any) => (
                  <div key={c.label}>{c.label}</div>
                ))}
              </div>

              {error && <AlertBox type="error" message={error} />}
              {msg && <AlertBox type="success" message={msg} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white p-3 rounded"
              >
                {loading ? "..." : "Changer mot de passe"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, setValue, show, setShow }: any) {
  return (
    <div>
      <label>{label}</label>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="button" onClick={() => setShow(!show)}>
        {show ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}

function AlertBox({ type, message }: any) {
  return <div>{message}</div>;
}