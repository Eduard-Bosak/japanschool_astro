/* =============================================
   Forms Component - Modern Implementation
   Компонент форм - Современная реализация
   ============================================= */

import { track } from '../utils/analytics';
import { sendToBackend } from '../utils/api';

/* EN: Lead form elements
   RU: Элементы формы лидов */
let leadForm: HTMLFormElement | null = null;
let leadStatusEl: HTMLElement | null = null;
let submitBtn: HTMLButtonElement | null = null;
let progressBar: HTMLElement | null = null;
let progressText: HTMLElement | null = null;

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

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

interface FieldValidation {
  [key: string]: ValidationRule;
}

/* EN: Validation rules
   RU: Правила валидации */
const validationRules: FieldValidation = {
  leadName: {
    validate: (v) => v.trim().length >= 2,
    message: 'Минимум 2 символа'
  },
  leadEmail: {
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    message: 'Введите корректный email'
  },
  leadGoal: {
    validate: (v) => v.length > 0,
    message: 'Выберите цель изучения'
  },
  leadLevel: {
    validate: (v) => v.length > 0,
    message: 'Укажите ваш уровень'
  }
};

/**
 * EN: Show field as valid
 * RU: Показать поле как валидное
 */
function setFieldValid(field: HTMLElement): void {
  const container = field.closest('.form__field');
  if (!container) return;

  container.classList.remove('invalid');
  container.classList.add('valid');
  field.setAttribute('aria-invalid', 'false');
}

/**
 * EN: Show field as invalid
 * RU: Показать поле как невалидное
 */
function setFieldInvalid(field: HTMLElement): void {
  const container = field.closest('.form__field');
  if (!container) return;

  container.classList.remove('valid');
  container.classList.add('invalid');
  field.setAttribute('aria-invalid', 'true');
}

/**
 * EN: Clear field validation state
 * RU: Очистить состояние валидации поля
 */
function clearFieldState(field: HTMLElement): void {
  const container = field.closest('.form__field');
  if (!container) return;

  container.classList.remove('valid', 'invalid');
  field.removeAttribute('aria-invalid');
}

/**
 * EN: Validate a single field
 * RU: Валидация одного поля
 */
function validateField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  const rule = validationRules[field.id];
  if (!rule) return true;

  const value = field.value;
  const isValid = rule.validate(value);

  if (value.length === 0 && !field.required) {
    clearFieldState(field);
    return true;
  }

  if (isValid) {
    setFieldValid(field);
  } else if (value.length > 0) {
    setFieldInvalid(field);
  }

  return isValid;
}

/**
 * EN: Update form progress bar
 * RU: Обновление прогресс-бара формы
 */
function updateProgress(): void {
  if (!leadForm || !progressBar || !progressText) return;

  const fields = ['leadName', 'leadEmail', 'leadGoal', 'leadLevel'] as const;
  let filledCount = 0;

  fields.forEach((id) => {
    const field = leadForm?.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
    if (field && field.value.trim().length > 0) {
      filledCount++;
    }
  });

  const percent = Math.round((filledCount / fields.length) * 100);
  progressBar.style.setProperty('--progress', `${percent}%`);
  progressText.textContent = `${percent}% заполнено`;
}

/**
 * EN: Update character counter for message field
 * RU: Обновление счётчика символов для поля сообщения
 */
function updateCharCount(): void {
  const msgField = document.getElementById('leadMsg') as HTMLTextAreaElement;
  const charCount = document.getElementById('msgCharCount');
  const charContainer = document.querySelector('.form__char-count');

  if (!msgField || !charCount || !charContainer) return;

  const count = msgField.value.length;
  charCount.textContent = String(count);

  charContainer.classList.remove('warning', 'danger');
  if (count > 450) {
    charContainer.classList.add('danger');
  } else if (count > 350) {
    charContainer.classList.add('warning');
  }
}

/**
 * EN: Validate lead form fields
 * RU: Валидация полей формы лидов
 */
function validateLead(): boolean {
  if (!leadForm) return false;

  let allValid = true;
  const fields = ['leadName', 'leadEmail', 'leadGoal', 'leadLevel'] as const;

  fields.forEach((id) => {
    const field = leadForm?.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
    if (field && !validateField(field)) {
      allValid = false;
    }
  });

  return allValid;
}

/**
 * EN: Set button loading state
 * RU: Установка состояния загрузки кнопки
 */
function setButtonState(state: 'default' | 'loading' | 'success'): void {
  if (!submitBtn) return;

  submitBtn.classList.remove('loading', 'success');
  submitBtn.disabled = state === 'loading';

  if (state !== 'default') {
    submitBtn.classList.add(state);
  }
}

/**
 * EN: Show status message
 * RU: Показ сообщения статуса
 */
function showStatus(message: string, type: 'success' | 'error'): void {
  if (!leadStatusEl) return;

  leadStatusEl.textContent = message;
  leadStatusEl.className = `form__status show ${type}`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    leadStatusEl?.classList.remove('show');
  }, 5000);
}

/**
 * EN: Handle select placeholder styling
 * RU: Обработка стилей плейсхолдера для select
 */
function handleSelectChange(select: HTMLSelectElement): void {
  if (select.value) {
    select.classList.add('has-value');
  } else {
    select.classList.remove('has-value');
  }
}

/**
 * EN: Setup lead form validation and submission
 * RU: Настройка валидации и отправки формы лидов
 */
function setupLeadForm(): void {
  leadForm = document.getElementById('leadForm') as HTMLFormElement;
  if (!leadForm) return;

  leadStatusEl = leadForm.querySelector('.form__status');
  submitBtn = leadForm.querySelector('#submitBtn') as HTMLButtonElement;
  progressBar = leadForm.querySelector('.form__progress-bar');
  progressText = leadForm.querySelector('.form__progress-text');

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

  /* EN: Setup select handlers
     RU: Настройка обработчиков для select */
  const selects = leadForm.querySelectorAll('select');
  selects.forEach((select) => {
    select.addEventListener('change', () => {
      handleSelectChange(select as HTMLSelectElement);
      validateField(select as HTMLSelectElement);
      updateProgress();
    });
  });

  /* EN: Setup input handlers for real-time validation
     RU: Настройка обработчиков ввода для валидации в реальном времени */
  const inputs = leadForm.querySelectorAll('input, textarea');
  inputs.forEach((input) => {
    // Add has-value class if input is not empty
    input.addEventListener('input', () => {
      const el = input as HTMLInputElement | HTMLTextAreaElement;

      if (el.value.trim()) {
        el.classList.add('has-value');
      } else {
        el.classList.remove('has-value');
      }

      updateProgress();

      if (el.id === 'leadMsg') {
        updateCharCount();
      }
    });

    // Validate on blur
    input.addEventListener('blur', () => {
      const el = input as HTMLInputElement | HTMLTextAreaElement;
      if (el.value.trim()) {
        validateField(el);
      }
    });
  });

  /* EN: Form submission
     RU: Отправка формы */
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateLead() || !leadForm) {
      showStatus('Исправьте ошибки в форме', 'error');

      // Focus first invalid field
      const firstInvalid = leadForm.querySelector(
        '.form__field.invalid input, .form__field.invalid select'
      );
      if (firstInvalid) {
        (firstInvalid as HTMLElement).focus();
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
      message: elements.leadMsg?.value?.trim() || '',
      source: 'landing_form'
    };

    setButtonState('loading');

    track('lead_form_submit', { goal: payload.goal, level: payload.level });

    /* EN: Send to backend
       RU: Отправка на бэкенд */
    const result = await sendToBackend('lead', payload);

    if (result.ok) {
      setButtonState('success');
      showStatus('Заявка отправлена! Мы свяжемся с вами в течение 24 часов.', 'success');

      // Reset form after delay
      setTimeout(() => {
        leadForm?.reset();
        setButtonState('default');
        updateProgress();

        // Clear validation states
        leadForm?.querySelectorAll('.form__field').forEach((f) => {
          f.classList.remove('valid', 'invalid');
        });
        leadForm?.querySelectorAll('.has-value').forEach((f) => {
          f.classList.remove('has-value');
        });
      }, 2000);

      track('lead_form_success', { mode: 'live' });
    } else if (result.mock) {
      setButtonState('success');
      showStatus('Заявка принята! Мы свяжемся с вами скоро.', 'success');

      setTimeout(() => {
        leadForm?.reset();
        setButtonState('default');
        updateProgress();

        leadForm?.querySelectorAll('.form__field').forEach((f) => {
          f.classList.remove('valid', 'invalid');
        });
        leadForm?.querySelectorAll('.has-value').forEach((f) => {
          f.classList.remove('has-value');
        });
      }, 2000);

      track('lead_form_success', { mode: 'mock', reason: result.error });
    } else {
      setButtonState('default');
      showStatus('Не удалось отправить. Попробуйте позже или свяжитесь через Telegram.', 'error');
      track('lead_form_error', { error: result.error });
    }
  });
}

/**
 * EN: Open program modal
 * RU: Открытие модального окна программы
 */
function openModal(prog: string): void {
  if (!programModal || !hiddenProgramInput) return;

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
  if (!programModal) return;

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
  if (!programModal) return;

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
        programStatusEl.textContent = '✓ Заявка принята!';
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
