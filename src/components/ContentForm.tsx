import type { QrContent } from '@/types/qr';
import { Field } from './ui/Field';
import { Input, Select, TextArea } from './ui/Input';
import { Toggle } from './ui/Toggle';

interface ContentFormProps {
  content: QrContent;
  errors: Partial<Record<string, string>>;
  onChange: (content: QrContent) => void;
}

export function ContentForm({ content, errors, onChange }: ContentFormProps) {
  /** Patches one field of the current content object, preserving its kind. */
  const set = <K extends string>(field: K, value: unknown) =>
    onChange({ ...content, [field]: value } as QrContent);

  switch (content.kind) {
    case 'url':
      return (
        <Field
          label="Destination URL"
          hint="https:// is added automatically if you leave it off."
          error={errors.url}
        >
          {(id, describedBy) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={Boolean(errors.url)}
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="yoursite.com/launch"
              value={content.url}
              onChange={(e) => set('url', e.target.value)}
            />
          )}
        </Field>
      );

    case 'text':
      return (
        <Field label="Text" hint="Any plain text. Shorter text makes a denser, easier-to-scan code.">
          {(id, describedBy) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              placeholder="Type anything…"
              value={content.text}
              onChange={(e) => set('text', e.target.value)}
            />
          )}
        </Field>
      );

    case 'wifi':
      return (
        <div className="space-y-4">
          <Field label="Network name (SSID)">
            {(id) => (
              <Input
                id={id}
                placeholder="Cafe Guest"
                value={content.ssid}
                onChange={(e) => set('ssid', e.target.value)}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Security">
              {(id) => (
                <Select
                  id={id}
                  value={content.encryption}
                  onChange={(e) => set('encryption', e.target.value)}
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open (no password)</option>
                </Select>
              )}
            </Field>
            <Field label="Password" error={errors.password}>
              {(id, describedBy) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={Boolean(errors.password)}
                  type="text"
                  autoComplete="off"
                  disabled={content.encryption === 'nopass'}
                  placeholder={content.encryption === 'nopass' ? 'Not required' : '••••••••'}
                  value={content.password}
                  onChange={(e) => set('password', e.target.value)}
                />
              )}
            </Field>
          </div>
          <Toggle
            label="Hidden network"
            description="Tick if the SSID is not broadcast."
            checked={content.hidden}
            onChange={(v) => set('hidden', v)}
          />
        </div>
      );

    case 'vcard':
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              {(id) => (
                <Input
                  id={id}
                  autoComplete="given-name"
                  value={content.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                />
              )}
            </Field>
            <Field label="Last name">
              {(id) => (
                <Input
                  id={id}
                  autoComplete="family-name"
                  value={content.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                />
              )}
            </Field>
            <Field label="Organisation">
              {(id) => (
                <Input
                  id={id}
                  autoComplete="organization"
                  value={content.organization}
                  onChange={(e) => set('organization', e.target.value)}
                />
              )}
            </Field>
            <Field label="Job title">
              {(id) => (
                <Input
                  id={id}
                  autoComplete="organization-title"
                  value={content.title}
                  onChange={(e) => set('title', e.target.value)}
                />
              )}
            </Field>
            <Field label="Phone">
              {(id) => (
                <Input
                  id={id}
                  type="tel"
                  autoComplete="tel"
                  value={content.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              )}
            </Field>
            <Field label="Email" error={errors.email}>
              {(id, describedBy) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={Boolean(errors.email)}
                  type="email"
                  autoComplete="email"
                  value={content.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              )}
            </Field>
          </div>
          <Field label="Website">
            {(id) => (
              <Input
                id={id}
                type="url"
                value={content.website}
                onChange={(e) => set('website', e.target.value)}
              />
            )}
          </Field>
          <Field label="Address">
            {(id) => (
              <Input
                id={id}
                autoComplete="street-address"
                value={content.address}
                onChange={(e) => set('address', e.target.value)}
              />
            )}
          </Field>
        </div>
      );

    case 'email':
      return (
        <div className="space-y-4">
          <Field label="To" error={errors.to}>
            {(id, describedBy) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={Boolean(errors.to)}
                type="email"
                placeholder="hello@example.com"
                value={content.to}
                onChange={(e) => set('to', e.target.value)}
              />
            )}
          </Field>
          <Field label="Subject">
            {(id) => (
              <Input
                id={id}
                value={content.subject}
                onChange={(e) => set('subject', e.target.value)}
              />
            )}
          </Field>
          <Field label="Message">
            {(id) => (
              <TextArea
                id={id}
                value={content.body}
                onChange={(e) => set('body', e.target.value)}
              />
            )}
          </Field>
        </div>
      );

    case 'sms':
      return (
        <div className="space-y-4">
          <Field label="Phone number">
            {(id) => (
              <Input
                id={id}
                type="tel"
                placeholder="+91 98765 43210"
                value={content.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            )}
          </Field>
          <Field label="Prefilled message">
            {(id) => (
              <TextArea
                id={id}
                value={content.message}
                onChange={(e) => set('message', e.target.value)}
              />
            )}
          </Field>
        </div>
      );

    case 'phone':
      return (
        <Field label="Phone number" hint="Scanning starts a call to this number.">
          {(id, describedBy) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="tel"
              placeholder="+91 98765 43210"
              value={content.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          )}
        </Field>
      );

    case 'geo':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude" error={errors.latitude}>
            {(id, describedBy) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={Boolean(errors.latitude)}
                inputMode="decimal"
                placeholder="18.5204"
                value={content.latitude}
                onChange={(e) => set('latitude', e.target.value)}
              />
            )}
          </Field>
          <Field label="Longitude" error={errors.longitude}>
            {(id, describedBy) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={Boolean(errors.longitude)}
                inputMode="decimal"
                placeholder="73.8567"
                value={content.longitude}
                onChange={(e) => set('longitude', e.target.value)}
              />
            )}
          </Field>
        </div>
      );

    case 'event':
      return (
        <div className="space-y-4">
          <Field label="Event title">
            {(id) => (
              <Input
                id={id}
                value={content.title}
                onChange={(e) => set('title', e.target.value)}
              />
            )}
          </Field>
          <Field label="Location">
            {(id) => (
              <Input
                id={id}
                value={content.location}
                onChange={(e) => set('location', e.target.value)}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts">
              {(id) => (
                <Input
                  id={id}
                  type="datetime-local"
                  value={content.start}
                  onChange={(e) => set('start', e.target.value)}
                />
              )}
            </Field>
            <Field label="Ends" error={errors.end}>
              {(id, describedBy) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={Boolean(errors.end)}
                  type="datetime-local"
                  value={content.end}
                  onChange={(e) => set('end', e.target.value)}
                />
              )}
            </Field>
          </div>
        </div>
      );
  }
}
