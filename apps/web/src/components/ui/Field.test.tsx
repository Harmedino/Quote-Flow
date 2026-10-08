import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Field } from './Field';
import { Input } from './Input';
import { Select } from './Select';

function attribute(html: string, element: string, name: string): string | undefined {
  const tag = new RegExp(`<${element}\\b[^>]*>`).exec(html)?.[0] ?? '';
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

describe('Field', () => {
  it('links the label, hint and error to its control', () => {
    const html = renderToStaticMarkup(
      <Field label="Email" hint="We never share it." error="Enter a valid email address" required>
        <Input name="email" type="email" />
      </Field>,
    );

    const id = attribute(html, 'input', 'id');
    expect(id).toBeTruthy();
    expect(attribute(html, 'label', 'for')).toBe(id);
    expect(attribute(html, 'input', 'aria-describedby')).toBe(`${id}-hint ${id}-error`);
    expect(attribute(html, 'input', 'aria-invalid')).toBe('true');
    expect(attribute(html, 'input', 'aria-required')).toBe('true');
    expect(html).toContain(`id="${id}-hint"`);
    expect(html).toContain(`id="${id}-error"`);
  });

  it('uses the id given to the field and omits absent descriptions', () => {
    const html = renderToStaticMarkup(
      <Field label="Currency" id="currency">
        <Select name="currency" aria-describedby="currency-help">
          <option value="USD">USD</option>
        </Select>
      </Field>,
    );

    expect(attribute(html, 'select', 'id')).toBe('currency');
    expect(attribute(html, 'label', 'for')).toBe('currency');
    expect(attribute(html, 'select', 'aria-describedby')).toBe('currency-help');
    expect(attribute(html, 'select', 'aria-invalid')).toBeUndefined();
  });

  it('leaves standalone controls untouched', () => {
    const html = renderToStaticMarkup(<Input id="search" aria-label="Search" />);

    expect(attribute(html, 'input', 'id')).toBe('search');
    expect(attribute(html, 'input', 'aria-describedby')).toBeUndefined();
  });
});
