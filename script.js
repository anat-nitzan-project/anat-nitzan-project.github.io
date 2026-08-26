/* ==========================================================================
   גוף ונפש בתקופת הבגרויות - סקריפט האתר
   ניהול לשוניות (Tabs), תפריט מובייל ואנימציות כניסה
   אין תלות בספריות חיצוניות, אין שימוש ב-localStorage/sessionStorage
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     איתור אלמנטים בסיסיים
     ------------------------------------------------------------------------ */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.tabpanel'));
  var navTabsList = document.getElementById('nav-tabs');
  var hamburger = document.getElementById('hamburger');
  var scrollIndicator = document.getElementById('scroll-indicator');
  var panelsContainer = document.querySelector('.panels');

  /**
   * מפעיל לשונית נתונה: מציג את הפאנל המתאים ומסתיר את השאר,
   * מעדכן aria-selected/tabindex, ומעדכן את ה-hash בכתובת.
   * @param {string} targetId - מזהה הפאנל להצגה
   * @param {boolean} updateHash - האם לעדכן את location.hash
   * @param {boolean} moveFocus - האם להעביר פוקוס ללשונית הפעילה
   */
  function activateTab(targetId, updateHash, moveFocus) {
    var found = false;

    tabs.forEach(function (tab) {
      var isMatch = tab.getAttribute('data-target') === targetId;
      tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      tab.tabIndex = isMatch ? 0 : -1;
      if (isMatch) found = true;
      if (isMatch && moveFocus) {
        tab.focus();
      }
    });

    if (!found) return;

    panels.forEach(function (panel) {
      if (panel.id === targetId) {
        panel.hidden = false;
        panel.classList.add('active');
        // הפעלת אנימציית כניסה לתוכן הפאנל שנפתח
        revealPanelChildren(panel);
      } else {
        panel.hidden = true;
        panel.classList.remove('active');
      }
    });

    if (updateHash) {
      history.replaceState(null, '', '#' + targetId);
    }

    // סגירת תפריט המובייל אם פתוח
    closeMobileMenu();
  }

  /**
   * מפעיל מחדש את אנימציית ה-fadeInUp על תוכן הפאנל שנחשף
   * @param {HTMLElement} panel
   */
  function revealPanelChildren(panel) {
    var items = panel.querySelectorAll('.reveal');
    items.forEach(function (el) {
      el.classList.remove('is-visible');
      // "ריפרוש" קטן כדי להבטיח שהאנימציה תרוץ מחדש בכל פתיחה
      void el.offsetWidth;
      el.classList.add('is-visible');
    });
  }

  /* ------------------------------------------------------------------------
     האזנה ללחיצה על לשוניות
     ------------------------------------------------------------------------ */
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateTab(tab.getAttribute('data-target'), true, false);
    });
  });

  /* ------------------------------------------------------------------------
     תמיכה במקלדת: חיצים בין לשוניות, Enter/Space להפעלה
     ------------------------------------------------------------------------ */
  navTabsList.addEventListener('keydown', function (event) {
    var currentIndex = tabs.findIndex(function (t) {
      return document.activeElement === t;
    });
    if (currentIndex === -1) return;

    var nextIndex = null;

    switch (event.key) {
      case 'ArrowRight':
        // ב-RTL חץ ימינה עובר ללשונית הקודמת (ימין = הבא ברצף הוויזואלי)
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        activateTab(tabs[currentIndex].getAttribute('data-target'), true, true);
        return;
      default:
        return;
    }

    event.preventDefault();
    if (nextIndex !== null) {
      var nextTab = tabs[nextIndex];
      activateTab(nextTab.getAttribute('data-target'), true, true);
    }
  });

  /* ------------------------------------------------------------------------
     תפריט מובייל (המבורגר)
     ------------------------------------------------------------------------ */
  function openMobileMenu() {
    navTabsList.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMobileMenu() {
    navTabsList.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  function toggleMobileMenu() {
    var isOpen = navTabsList.classList.contains('open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  hamburger.addEventListener('click', function (event) {
    event.stopPropagation();
    toggleMobileMenu();
  });

  // סגירת התפריט בלחיצה מחוץ לו
  document.addEventListener('click', function (event) {
    var isOpen = navTabsList.classList.contains('open');
    if (!isOpen) return;

    var clickedInsideMenu = navTabsList.contains(event.target);
    var clickedHamburger = hamburger.contains(event.target);

    if (!clickedInsideMenu && !clickedHamburger) {
      closeMobileMenu();
    }
  });

  // סגירת התפריט במקש Escape
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && navTabsList.classList.contains('open')) {
      closeMobileMenu();
      hamburger.focus();
    }
  });

  /* ------------------------------------------------------------------------
     כפתור אינדיקטור הגלילה בשער
     ------------------------------------------------------------------------ */
  if (scrollIndicator && panelsContainer) {
    scrollIndicator.addEventListener('click', function () {
      panelsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ------------------------------------------------------------------------
     קריאת ה-hash בטעינת הדף לפתיחת הלשונית המתאימה
     ------------------------------------------------------------------------ */
  function initFromHash() {
    var hash = window.location.hash.replace('#', '');
    var validTarget = panels.some(function (panel) { return panel.id === hash; });

    if (hash && validTarget) {
      activateTab(hash, false, false);
    } else {
      // ברירת מחדל: הלשונית הראשונה
      activateTab(tabs[0].getAttribute('data-target'), false, false);
    }
  }

  window.addEventListener('hashchange', initFromHash);
  initFromHash();

  /* ------------------------------------------------------------------------
     IntersectionObserver - אנימציות כניסה בעת גלילה
     ------------------------------------------------------------------------ */
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // דפדפן ללא תמיכה - הצגת התוכן ישירות
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

})();
