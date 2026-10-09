import { matchRoutes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '@/app/router';
import { FOOTER_COLUMNS, MARKETING_NAV } from '@/components/marketing/marketing-nav';

const pathOf = (href: string) => href.split('#')[0] ?? href;

describe('website routes', () => {
  it.each(MARKETING_NAV.map((item) => [item.label, item.to]))(
    '%s (%s) is its own public page',
    (_label, to) => {
      const matches = matchRoutes(routes, to) ?? [];
      expect(matches.at(-1)?.route.path).toBe(to);
      expect(matches.flatMap((match) => match.route.middleware ?? [])).toEqual([]);
    },
  );

  it('links the footer only to pages that exist', () => {
    for (const link of FOOTER_COLUMNS.flatMap((column) => column.links)) {
      expect(matchRoutes(routes, pathOf(link.to))?.at(-1)?.route.path, link.to).not.toBe('*');
    }
  });
});
