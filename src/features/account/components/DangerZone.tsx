"use client";

import { useState } from "react";
import { deleteAccountAndBackup } from "@/features/sync/lib/account";
import { useAccount } from "@/features/sync/lib/hooks";
import { wipeDevice } from "../lib/wipe";

type Action = "wipe" | "delete-account";

const COPY: Record<Action, { button: string; confirm: string }> = {
  wipe: { button: "Remove everything from this device", confirm: "Remove everything" },
  "delete-account": { button: "Delete my account and backup", confirm: "Delete account and backup" },
};

/** Clear, confirmed deletion — the user stays in control of their data (BR-07, SPEC §7). */
export function DangerZone() {
  const account = useAccount();
  const [confirming, setConfirming] = useState<Action>();
  const [alsoWipe, setAlsoWipe] = useState(false);
  const [failed, setFailed] = useState(false);
  const signedIn = account.status === "ready" && Boolean(account.value);

  async function run(action: Action) {
    setFailed(false);
    try {
      if (action === "delete-account") await deleteAccountAndBackup();
      if (action === "wipe" || alsoWipe) await wipeDevice();
      window.location.assign("/");
    } catch (error) {
      console.error("Deletion failed", error);
      setFailed(true);
    }
  }

  const actions: Action[] = signedIn ? ["delete-account", "wipe"] : ["wipe"];

  return (
    <section aria-labelledby="delete-data-heading" className="flex flex-col gap-3">
      <h2 id="delete-data-heading" className="text-lg font-semibold">
        Delete data
      </h2>
      {actions.map((action) =>
        confirming === action ? (
          <ConfirmPanel
            key={action}
            action={action}
            signedIn={signedIn}
            alsoWipe={alsoWipe}
            onAlsoWipe={setAlsoWipe}
            onConfirm={() => run(action)}
            onCancel={() => setConfirming(undefined)}
          />
        ) : (
          <button key={action} type="button" onClick={() => setConfirming(action)} className="self-start text-danger hover:underline">
            {COPY[action].button}
          </button>
        ),
      )}
      {failed && (
        <p role="alert" className="text-danger">
          That didn&apos;t work. Check your connection and try again.
        </p>
      )}
    </section>
  );
}

type PanelProps = {
  action: Action;
  signedIn: boolean;
  alsoWipe: boolean;
  onAlsoWipe: (value: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmPanel({ action, signedIn, alsoWipe, onAlsoWipe, onConfirm, onCancel }: PanelProps) {
  return (
    <div role="alertdialog" aria-labelledby={`${action}-title`} className="flex flex-col gap-3 rounded-card border border-danger p-4">
      <p id={`${action}-title`} className="font-medium">
        {COPY[action].button}?
      </p>
      <p className="text-muted">{explanation(action, signedIn)}</p>
      {action === "delete-account" && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={alsoWipe} onChange={(event) => onAlsoWipe(event.target.checked)} className="h-5 w-5" />
          Also remove everything from this device
        </label>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onConfirm} className="rounded-card bg-danger px-4 py-2 text-on-primary hover:bg-danger-hover">
          {COPY[action].confirm}
        </button>
        <button type="button" onClick={onCancel} className="rounded-card border border-line px-4 py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

function explanation(action: Action, signedIn: boolean): string {
  if (action === "delete-account") {
    return "This permanently deletes your account and the backup of your purchases and documents. It can't be undone. Purchases on this device stay unless you also remove them.";
  }
  return signedIn
    ? "Your purchases and documents are removed from this device and you're signed out. Your backup stays — sign in again to get them back."
    : "Your purchases and documents are only on this device, so this can't be undone. Download them first if you want to keep a copy.";
}
