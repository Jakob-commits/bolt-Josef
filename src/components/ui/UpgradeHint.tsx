interface UpgradeHintProps {
  text?: string;
}

export function UpgradeHint({
  text = "Funktion nicht im aktuellen Paket enthalten – bitte Upgrade durchführen!",
}: UpgradeHintProps) {
  return (
    <div className="mt-4 w-full rounded-md border border-yellow-300 bg-yellow-100 px-4 py-2 text-center text-xs font-medium text-yellow-700">
      {text}
    </div>
  );
}
