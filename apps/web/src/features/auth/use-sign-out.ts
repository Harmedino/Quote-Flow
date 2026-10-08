import { useMutation } from '@tanstack/react-query';
import { signOut } from './session';

/** Signs out of this browser; the app layout then sends the user to the sign-in page. */
export function useSignOut() {
  return useMutation({ mutationFn: signOut });
}
