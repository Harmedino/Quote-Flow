import { TextLink } from '@/components/ui/TextLink';

export interface AuthFooterLinkProps {
  prompt: string;
  to: string;
  label: string;
}

/** The "Don't have an account? Start free" line under auth forms. */
export function AuthFooterLink({ prompt, to, label }: AuthFooterLinkProps) {
  return (
    <p className="mt-8 text-center text-sm text-zinc-600">
      {prompt} <TextLink to={to}>{label}</TextLink>
    </p>
  );
}
