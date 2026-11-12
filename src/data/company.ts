/* Legal identity of the company behind advinnovations.com. One place, so the footer, the privacy policy and
 * the JSON-LD cannot drift apart. Source: ARES / commercial register (checked Nov 11 2026).
 * Not a VAT payer (neplátce DPH), so there is deliberately no DIČ. If that changes, add `dic` here and
 * show it in components/Footer.astro and templates/Privacy.astro. */
export const COMPANY = {
  legalName: 'ADV Innovations s.r.o.',
  ico: '17223997',
  /** registered seat, as in the commercial register */
  seat: 'Rybná 716/24, 110 00 Praha 1',
  email: 'info@advinnovations.com',
  vatPayer: false,
} as const;
