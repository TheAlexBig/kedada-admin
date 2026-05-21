import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Algo salio mal</p>
          <p className="mt-1 text-sm text-red-800">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-teal-900">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
}
