/* =============================================
   Forms Component (Validation, Submission, Modals)
   Компонент форм (Валидация, Отправка, Модальные окна)
   ============================================= */

import { track } from '../utils/analytics';
import { sendToBackend } from '../utils/api';

/* EN: Lead form elements
   RU: Элементы формы лидов */
let leadForm: HTMLFormElement | null = null;
let leadStatusEl: HTMLElement | null = null;

/* EN: Program modal elements
   RU: Элементы модального окна программ */
let programModal: HTMLElement | null = null;
let programForm: HTMLFormElement | null = null;
let programStatusEl: HTMLElement | null = null;
let hiddenProgramInput: HTMLInputElement | null = null;

interface LeadFormElements extends HTMLFormControlsCollection {
  leadName: HTMLInputElement;
  leadEmail: HTMLInputElement;
  leadGoal: HTMLSelectElement;
  leadLevel: HTMLSelectElement;
  leadMsg: HTMLTextAreaElement;
}

interface ProgramFormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
}

/**
 * EN: Show field error message
 * RU: Показ сообщения об ошибке поля
 */
function showFieldError(field: HTMLElement, msgId: string): void {
  const err = document.getElementById(msgId);
  if (err) {
    err.hidden = false;
  }
  field.classList.add('invalid');
  field.setAttribute('aria-invalid', 'true');
}

/**
 * EN: Clear field error message
 * RU: Очистка сообщения об ошибке поля
 */
function clearFieldError(field: HTMLElement, msgId: string): void {
  const err = document.getElementById(msgId);
  if (err) {
    err.hidden = true;
  }
  field.classList.remove('invalid');
  field.removeAttribute('aria-invalid');
}

/**
 * EN: Validate lead form fields
 * RU: Валидация полей формы лидов
 */
function validateLead(): boolean {
  if (!leadForm) {
    return false;
  }

  let ok = true;

  /* EN: Validate name
     RU: Валидация имени */
  const name = leadForm.querySelector('#leadName') as HTMLInputElement;
  if (name) {
    if (name.value.trim().length < 2) {
      showFieldError(name, 'errName');
      ok = false;
    } else {
      clearFieldError(name, 'errName');
    }
  }

  /* EN: Validate email
     RU: Валидация email */
  const email = leadForm.querySelector('#leadEmail') as HTMLInputElement;
  if (email) {
    const v = email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      showFieldError(email, 'errEmail');
      ok = false;
    } else {
      clearFieldError(email, 'errEmail');
    }
  }

  /* EN: Validate goal
     RU: Валидация цели */
  const goal = leadForm.querySelector('#leadGoal') as HTMLSelectElement;
  if (goal) {
    if (!goal.value) {
      showFieldError(goal, 'errGoal');
      ok = false;
    } else {
      clearFieldError(goal, 'errGoal');
    }
  }

  /* EN: Validate level
     RU: Валидация уровня */
  const level = leadForm.querySelector('#leadLevel') as HTMLSelectElement;
  if (level) {
    if (!level.value) {
      showFieldError(level, 'errLevel');
      ok = false;
    } else {
      clearFieldError(level, 'errLevel');
    }
  }

  return ok;
}

/**
 * EN: Setup lead form validation and submission
 * RU: Настройка валидации и отправки формы лидов
 */
function setupLeadForm(): void {
  leadForm = document.getElementById('leadForm') as HTMLFormElement;
  if (!leadForm) {
    return;
  }

  leadStatusEl = leadForm.querySelector('.form__status');

  /* EN: Create aria-live region for form errors
     RU: Создание aria-live региона для ошибок формы */
  let liveRegion = document.getElementById('formErrorsLive');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'formErrorsLive';
    liveRegion.className = 'visually-hidden';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    leadForm.appendChild(liveRegion);
  }

  /* EN: Announce form errors to screen readers
     RU: Объявление ошибок формы для скринридеров */
  function announceErrors(): void {
    const errors = leadForm?.querySelectorAll('.invalid');
    if (errors && errors.length > 0 && liveRegion) {
      const errorCount = errors.length;
      liveRegion.textContent = `Форма содержит ${errorCount} ${errorCount === 1 ? 'ошибку' : 'ошибки'}. Исправьте выделенные поля.`;
    } else if (liveRegion) {
      liveRegion.textContent = '';
    }
  }

  /* EN: Real-time validation on input/change/blur
     RU: Валидация в реальном времени при input/change/blur */
  ['input', 'change', 'blur'].forEach((ev) => {
    leadForm?.addEventListener(ev, (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) {
        return;
      }

      if (
        t.id === 'leadName' ||
        t.id === 'leadEmail' ||
        t.id === 'leadGoal' ||
        t.id === 'leadLevel'
      ) {
        validateLead();
        // EN: Debounced announcement | RU: Объявление с задержкой
        if (ev === 'blur') {
          announceErrors();
        }
      }
    });
  });

  /* EN: Form submission
     RU: Отправка формы */
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateLead() || !leadForm || !leadStatusEl) {
      if (leadStatusEl) {
        leadStatusEl.textContent = 'Исправьте ошибки формы';
        leadStatusEl.style.color = 'var(--danger)';
      }
      return;
    }

    const elements = leadForm.elements as LeadFormElements;

    /* EN: Build payload
       RU: Формирование данных */
    const payload = {
      name: elements.leadName?.value?.trim(),
      email: elements.leadEmail?.value?.trim(),
      goal: elements.leadGoal?.value || '',
      level: elements.leadLevel?.value || '',
      message: elements.leadMsg?.value?.trim() || ''
    };

    leadStatusEl.textContent = 'Отправка...';
    leadStatusEl.style.color = 'var(--ink-dim)';

    track('lead_form_submit', { goal: payload.goal, level: payload.level });

    /* EN: Send to backend
       RU: Отправка на бэкенд */
    const result = await sendToBackend('lead', payload);

    if (result.ok) {
      leadStatusEl.textContent = 'Заявка отправлена! Мы свяжемся.';
      leadStatusEl.style.color = 'var(--accent)';
      leadForm.reset();
      track('lead_form_success', { mode: 'live' });
    } else if (result.mock) {
      leadStatusEl.textContent =
        'Заявка сохранена (демо-режим). Подключите backend для реальной отправки.';
      leadStatusEl.style.color = 'var(--accent)';
      leadForm.reset();
      track('lead_form_success', { mode: 'mock', reason: result.error });
    } else {
      leadStatusEl.textContent = 'Не удалось отправить. Попробуйте позже.';
      leadStatusEl.style.color = 'var(--danger)';
      track('lead_form_error', { error: result.error });
    }
  });
}

/**
 * EN: Open program modal
 * RU: Открытие модального окна программы
 */
function openModal(prog: string): void {
  if (!programModal || !hiddenProgramInput) {
    return;
  }

  programModal.removeAttribute('hidden');
  hiddenProgramInput.value = prog;
  document.body.style.overflow = 'hidden';

  track('program_modal_open', { program: prog });

  /* EN: Focus trap
     RU: Ловушка фокуса */
  const focusables = programModal.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (first) {
    first.focus();
  }

  function trap(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  (programModal as any).__trapHandler = trap;
  window.addEventListener('keydown', trap);
}

/**
 * EN: Close program modal
 * RU: Закрытие модального окна программы
 */
function closeModal(): void {
  if (!programModal) {
    return;
  }

  programModal.setAttribute('hidden', '');
  document.body.style.overflow = '';

  if ((programModal as any).__trapHandler) {
    window.removeEventListener('keydown', (programModal as any).__trapHandler);
    delete (programModal as any).__trapHandler;
  }
}

/**
 * EN: Setup program modal and form
 * RU: Настройка модального окна программы и формы
 */
function setupProgramModal(): void {
  programModal = document.getElementById('programModal');
  if (!programModal) {
    return;
  }

  programForm = document.getElementById('programForm') as HTMLFormElement;
  programStatusEl = programForm?.querySelector('.form__status--mini');
  hiddenProgramInput = programForm?.querySelector('input[name="program"]') as HTMLInputElement;

  /* EN: Open modal buttons
     RU: Кнопки открытия модального окна */
  const programButtons = document.querySelectorAll('[data-program]');
  programButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const prog = btn.getAttribute('data-program');
      if (prog) openModal(prog);
    });
  });

  /* EN: Close modal on backdrop click
     RU: Закрытие модального окна при клике на подложку */
  programModal.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).hasAttribute('data-close')) {
      closeModal();
    }
  });

  /* EN: Close button
     RU: Кнопка закрытия */
  programModal.querySelector('.modal-close')?.addEventListener('click', closeModal);

  /* EN: Escape key closes modal
     RU: Клавиша Escape закрывает модальное окно */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && programModal && !programModal.hasAttribute('hidden')) {
      closeModal();
    }
  });

  /* EN: Form submission
     RU: Отправка формы */
  if (programForm) {
    programForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!programForm || !programStatusEl) return;

      if (!programForm.checkValidity()) {
        programStatusEl.textContent = 'Введите корректный email';
        programStatusEl.classList.remove('success');
        programStatusEl.classList.add('show', 'error');
        return;
      }

      programStatusEl.textContent = 'Отправляем...';
      programStatusEl.classList.remove('success', 'error');
      programStatusEl.classList.add('show');

      const elements = programForm.elements as ProgramFormElements;

      const payload = {
        email: elements.email?.value?.trim(),
        program: hiddenProgramInput?.value || 'unknown'
      };

      track('program_form_submit', { program: payload.program });

      const result = await sendToBackend('program', payload);

      if (result.ok) {
        programStatusEl.textContent = '✓ Готово! Мы свяжемся с вами.';
        programStatusEl.classList.remove('error');
        programStatusEl.classList.add('show', 'success');
        programForm.reset();
        track('program_form_success', { mode: 'live' });

        setTimeout(() => {
          closeModal();
        }, 2000);
      } else if (result.mock) {
        programStatusEl.textContent = '✓ Заявка принята! Мы свяжемся с вами.';
        programStatusEl.classList.remove('error');
        programStatusEl.classList.add('show', 'success');
        programForm.reset();
        track('program_form_success', { mode: 'mock', reason: result.error });

        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        programStatusEl.textContent = '✗ Не удалось отправить. Попробуйте позже.';
        programStatusEl.classList.remove('success');
        programStatusEl.classList.add('show', 'error');
        track('program_form_error', { error: result.error });
      }
    });
  }
}

/**
 * EN: Update current year in footer
 * RU: Обновление текущего года в футере
 */
function updateCurrentYear(): void {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}

/**
 * EN: Initialize forms component
 * RU: Инициализация компонента форм
 */
export function init(): void {
  setupLeadForm();
  setupProgramModal();
  updateCurrentYear();
}

/* EN: Export modal controls for external use
   RU: Экспорт контролей модального окна для внешнего использования */
export { openModal, closeModal };
