/* /llms.txt: the site for language models, generated at build time from the same data as the pages
 * (docs/GEO.md). Czech first (the company's language), then English. Published cases only. */
import type { APIRoute } from 'astro';
import { pick, loc, type Lang } from '../i18n';
import chrome from '../i18n/chrome.json';
import services from '../i18n/services.json';
import geo from '../i18n/geo.json';
import { ENABLED_SERVICES } from '../data/capabilities';
import { CASE_STUDIES } from '../data/caseStudies';
import { routes } from '../data/routes';

export const prerender = true;

type Plain = { title: string; body: string; facts: { label: string; value: string }[] };
type Page = { plain?: Plain; faq?: { q: string; a: string }[]; meta?: { title: string; description: string } };

function section(lang: Lang, site: URL) {
  const t = pick(chrome, lang);
  const s = pick(services, lang);
  const g = pick(geo, lang);
  const pages = g.pages as Record<string, Page>;
  const abs = (p: string) => new URL(p, site).href;
  const out: string[] = [];
  const H = lang === 'cs';

  out.push(`# ADV Innovations${H ? '' : ' (English)'}`);
  out.push('');
  out.push(`> ${g.company.description}`);
  out.push('');
  const home = pages.home?.plain;
  if (home) {
    out.push(home.body);
    out.push('');
    for (const f of home.facts) out.push(`- ${f.label}: ${f.value}`);
    out.push('');
  }
  out.push(`- ${H ? 'Kontakt' : 'Contact'}: ${t.brand.email}, ${t.brand.phone}, ${t.brand.address}`);
  out.push(`- ${H ? 'Web' : 'Website'}: ${abs(routes.home(lang))}`);
  out.push('');

  out.push(`## ${H ? 'Služby' : 'Services'}`);
  out.push('');
  for (const sv of ENABLED_SERVICES) {
    const copy = s.capabilities.items.find((i) => i.slug === sv.slug)!;
    const p = pages[sv.slug];
    const url = abs(routes.service(lang, sv.slug));
    out.push(`- [${copy.title}](${url}): ${p?.plain?.body ?? copy.long}`);
  }
  out.push('');

  out.push(`## ${H ? 'Otázky a odpovědi' : 'Questions and answers'}`);
  out.push('');
  for (const key of ['home', ...ENABLED_SERVICES.map((x) => x.slug)]) {
    for (const f of pages[key]?.faq ?? []) {
      out.push(`- ${f.q} ${f.a}`);
    }
  }
  out.push('');

  const cases = CASE_STUDIES.filter((c) => c.status === 'published');
  if (cases.length) {
    out.push(`## ${H ? 'Realizace' : 'Work'}`);
    out.push('');
    for (const c of cases) {
      out.push(
        `- [${loc(c.client, lang)}](${abs(routes.case(lang, c.slug))}) (${loc(c.sector, lang)}): ${loc(c.outcome, lang)}`,
      );
    }
    out.push('');
  }

  out.push(`## ${H ? 'Stránky' : 'Pages'}`);
  out.push('');
  out.push(`- [${t.nav.services}](${abs(routes.services(lang))})`);
  out.push(`- [${t.nav.work}](${abs(routes.work(lang))})`);
  out.push(`- [${t.nav.about}](${abs(routes.about(lang))})`);
  out.push(`- [${t.nav.contact}](${abs(routes.contact(lang))})`);
  out.push('');
  return out.join('\n');
}

export const GET: APIRoute = ({ site }) => {
  const body = [section('cs', site!), '', '---', '', section('en', site!)].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
