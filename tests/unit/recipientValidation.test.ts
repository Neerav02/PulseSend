import { describe, it, expect } from 'vitest';
import { schedulingService } from '../../server/src/services/scheduling.service';

describe('Recipient Validation & Deduplication', () => {
  it('correctly categorizes valid, duplicate, and invalid emails', () => {
    const rawBatch = [
      { email: 'alex@stripe.com', name: 'Alex' },
      { email: 'sarah@datadog.com', name: 'Sarah' },
      { email: 'alex@stripe.com', name: 'Alex Duplicate' }, // Duplicate
      { email: 'ALEX@STRIPE.COM', name: 'Alex Caps' }, // Duplicate case-insensitive
      { email: 'invalid-email-no-at', name: 'Bad' }, // Invalid
      { email: 'missing-tld@domain', name: 'Bad TLD' }, // Invalid
      { email: 'lisa@figma.com', name: 'Lisa' },
    ];

    const result = schedulingService.validateRecipients(rawBatch);

    expect(result.valid).toHaveLength(3);
    expect(result.valid.map((r) => r.email)).toEqual([
      'alex@stripe.com',
      'sarah@datadog.com',
      'lisa@figma.com',
    ]);
    expect(result.duplicates).toHaveLength(2);
    expect(result.invalid).toHaveLength(2);
  });
});

