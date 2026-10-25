/**
 * Contact forms ([data-form]): posted to /api/contact with fetch, answered inline.
 * Without JS the form still posts (the endpoint answers JSON, and the visitor sees a plain reply).
 * Phone: optional, checked loosely for shape and strictly for digit count (9 to 15), and only once the
 * field has been left, so the form never argues while someone is typing.
 */
const PHONE_SHAPE = /^\+?[\d][\d\s()./-]*$/;
const phoneOk = (raw: string) => {
  const v = raw.trim();
  if (!v) return true;
  if (!PHONE_SHAPE.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 9 && digits <= 15;
};

document.querySelectorAll<HTMLFormElement>('[data-form]').forEach((form) => {
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const phone = form.querySelector<HTMLInputElement>('input[type="tel"]');
  const phoneErr = form.querySelector<HTMLElement>('[data-phone-error]');
  const label = button.innerHTML;

  const checkPhone = () => {
    if (!phone || !phoneErr) return true;
    const ok = phoneOk(phone.value);
    phone.setAttribute('aria-invalid', String(!ok));
    phoneErr.hidden = ok;
    return ok;
  };
  phone?.addEventListener('blur', checkPhone);
  phone?.addEventListener('input', () => phone.getAttribute('aria-invalid') === 'true' && checkPhone());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!checkPhone()) {
      phone?.focus();
      return;
    }
    if (!form.reportValidity()) return;
    button.disabled = true;
    button.textContent = form.dataset.sending ?? '…';
    status.dataset.state = '';
    status.textContent = '';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        status.dataset.state = 'ok';
        status.textContent = form.dataset.success ?? data.message ?? '';
        form.reset();
      } else {
        status.dataset.state = 'error';
        status.innerHTML = '';
        status.append(document.createTextNode(`${data.message ?? form.dataset.error ?? ''} `));
        const mail = form.dataset.mail;
        if (mail && res.status >= 500) {
          const a = document.createElement('a');
          a.href = `mailto:${mail}`;
          a.textContent = mail;
          status.append(a);
        }
      }
    } catch {
      status.dataset.state = 'error';
      status.innerHTML = `${form.dataset.error ?? ''} <a href="mailto:${form.dataset.mail}">${form.dataset.mail}</a>`;
    } finally {
      button.disabled = false;
      button.innerHTML = label;
    }
  });
});
