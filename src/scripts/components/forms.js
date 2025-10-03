/* =============================================
   Forms Component (Validation, Submission, Modals)
   Компонент форм (Валидация, Отправка, Модальные окна)
   ============================================= */

import { track } from '../utils/analytics.js';
import { sendToBackend } from '../utils/api.js';

/* EN: Lead form elements
   RU: Элементы формы лидов */
let leadForm, leadStatusEl;

/* EN: Program modal elements
   RU: Элементы модального окна программ */
let programModal, programForm, programStatusEl, hiddenProgramInput;

/**
 * EN: Show field error message
 * RU: Показ сообщения об ошибке поля
 * 
 * @param {HTMLElement} field - Form field | Поле формы
 * @param {string} msgId - Error message element ID | ID элемента сообщения об ошибке
 */
function showFieldError(field, msgId) {
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
 * 
 * @param {HTMLElement} field - Form field | Поле формы
 * @param {string} msgId - Error message element ID | ID элемента сообщения об ошибке
 */
function clearFieldError(field, msgId) {
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
 * 
 * @returns {boolean} - Is form valid | Форма валидна
 */
function validateLead() {
  if (!leadForm) return false;
  
  let ok = true;
  
  /* EN: Validate name
     RU: Валидация имени */
  const name = leadForm.querySelector('#leadName');
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
  const email = leadForm.querySelector('#leadEmail');
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
  const goal = leadForm.querySelector('#leadGoal');
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
  const level = leadForm.querySelector('#leadLevel');
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
function setupLeadForm() {
  leadForm = document.getElementById('leadForm');
  if (!leadForm) return;
  
  leadStatusEl = leadForm.querySelector('.form-status');
  
  /* EN: Real-time validation on input/change/blur
     RU: Валидация в реальном времени при input/change/blur */
  ['input', 'change', 'blur'].forEach(ev => {
    leadForm.addEventListener(ev, (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      
      if (t.id === 'leadName' || t.id === 'leadEmail' || 
          t.id === 'leadGoal' || t.id === 'leadLevel') {
        validateLead();
      }
    });
  });
  
  /* EN: Form submission
     RU: Отправка формы */
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateLead()) {
      leadStatusEl.textContent = 'Исправьте ошибки формы';
      leadStatusEl.style.color = 'var(--danger)';
      return;
    }
    
    /* EN: Build payload
       RU: Формирование данных */
    const payload = {
      name: leadForm.leadName?.value?.trim(),
      email: leadForm.leadEmail?.value?.trim(),
      goal: leadForm.leadGoal?.value || '',
      level: leadForm.leadLevel?.value || '',
      message: leadForm.leadMsg?.value?.trim() || ''
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
      leadStatusEl.textContent = 'Заявка сохранена (демо-режим). Подключите backend для реальной отправки.';
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
 * 
 * @param {string} prog - Program name | Название программы
 */
function openModal(prog) {
  if (!programModal) return;
  
  programModal.removeAttribute('hidden');
  hiddenProgramInput.value = prog;
  document.body.style.overflow = 'hidden';
  
  track('program_modal_open', { program: prog });
  
  /* EN: Focus trap
     RU: Ловушка фокуса */
  const focusables = programModal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  
  if (first) first.focus();
  
  function trap(e) {
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
  
  programModal.__trapHandler = trap;
  window.addEventListener('keydown', trap);
}

/**
 * EN: Close program modal
 * RU: Закрытие модального окна программы
 */
function closeModal() {
  if (!programModal) return;
  
  programModal.setAttribute('hidden', '');
  document.body.style.overflow = '';
  
  if (programModal.__trapHandler) {
    window.removeEventListener('keydown', programModal.__trapHandler);
    delete programModal.__trapHandler;
  }
}

/**
 * EN: Setup program modal and form
 * RU: Настройка модального окна программы и формы
 */
function setupProgramModal() {
  programModal = document.getElementById('programModal');
  if (!programModal) return;
  
  programForm = document.getElementById('programForm');
  programStatusEl = programForm?.querySelector('.mini-status');
  hiddenProgramInput = programForm?.querySelector('input[name="program"]');
  
  /* EN: Open modal buttons
     RU: Кнопки открытия модального окна */
  const programButtons = document.querySelectorAll('[data-program]');
  programButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      openModal(btn.getAttribute('data-program'));
    });
  });
  
  /* EN: Close modal on backdrop click
     RU: Закрытие модального окна при клике на подложку */
  programModal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) {
      closeModal();
    }
  });
  
  /* EN: Close button
     RU: Кнопка закрытия */
  programModal.querySelector('.modal-close')?.addEventListener('click', closeModal);
  
  /* EN: Escape key closes modal
     RU: Клавиша Escape закрывает модальное окно */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !programModal.hasAttribute('hidden')) {
      closeModal();
    }
  });
  
  /* EN: Form submission
     RU: Отправка формы */
  if (programForm) {
    programForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!programForm.checkValidity()) {
        programStatusEl.textContent = 'Введите корректный email';
        programStatusEl.style.color = 'var(--danger)';
        return;
      }
      
      programStatusEl.textContent = 'Отправляем...';
      programStatusEl.style.color = 'var(--ink-dim)';
      
      const payload = {
        email: programForm.elements.email?.value?.trim(),
        program: hiddenProgramInput?.value || 'unknown'
      };
      
      track('program_form_submit', { program: payload.program });
      
      const result = await sendToBackend('program', payload);
      
      if (result.ok) {
        programStatusEl.textContent = 'Готово! Мы свяжемся.';
        programStatusEl.style.color = 'var(--accent)';
        programForm.reset();
        track('program_form_success', { mode: 'live' });
      } else if (result.mock) {
        programStatusEl.textContent = 'Заявка сохранена (демо-режим). Подключите backend.';
        programStatusEl.style.color = 'var(--accent)';
        programForm.reset();
        track('program_form_success', { mode: 'mock', reason: result.error });
      } else {
        programStatusEl.textContent = 'Не удалось отправить. Попробуйте позже.';
        programStatusEl.style.color = 'var(--danger)';
        track('program_form_error', { error: result.error });
      }
    });
  }
}

/**
 * EN: Update current year in footer
 * RU: Обновление текущего года в футере
 */
function updateCurrentYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * EN: Initialize forms component
 * RU: Инициализация компонента форм
 */
export function init() {
  setupLeadForm();
  setupProgramModal();
  updateCurrentYear();
}

/* EN: Export modal controls for external use
   RU: Экспорт контролей модального окна для внешнего использования */
export { openModal, closeModal };
