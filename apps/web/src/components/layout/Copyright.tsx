import { APP_NAME } from '@/app/constants';

export function Copyright() {
  return (
    <p className="text-xs text-zinc-500">
      © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
    </p>
  );
}
