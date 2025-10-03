/* =============================================
   Preloader Component
   Компонент прелоадера
   ============================================= */

/**
 * EN: Preloader initialization and fade out
 * RU: Инициализация прелоадера и его исчезновение
 */
export function init() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  
  /* EN: Fade out preloader after page load
     RU: Исчезновение прелоадера после загрузки страницы */
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('fade-out');
    }, 350);
  });
}
