/* =========================================================
   📝  Forms.js — إرسال النماذج إلى بوت تيليجرام
   ========================================================= */

(function() {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const endpoint = (cfg.telegram && cfg.telegram.endpoint) || 'api/send_to_telegram.php';

  // ============= إرسال نموذج =============
  async function submitForm(form, endpointPath) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);

      // Honeypot (حماية بسيطة من البوتات)
      if (formData.get('website')) {
        throw new Error('تم رفض الإرسال');
      }

      // فحص حجم الملفات
      const fileInputs = form.querySelectorAll('input[type="file"]');
      for (const fi of fileInputs) {
        if (fi.files.length > 0) {
          if (fi.files[0].size > 5 * 1024 * 1024) {
            throw new Error('حجم الملف كبير جداً (الحد 5MB)');
          }
        }
      }

      const response = await fetch(endpointPath, {
        method: 'POST',
        body: formData,
        credentials: 'omit'
      });

      const data = await response.json().catch(() => ({ ok: false, error: 'استجابة غير صالحة' }));

      if (!response.ok || !data.ok) {
        throw new Error(data.error || `خطأ في الخادم (${response.status})`);
      }

      // نجح
      window.showToast(
        form.id === 'joinForm'
          ? 'تم استلام طلب انضمامك بنجاح! سنتواصل معك قريباً.'
          : 'تم إرسال طلبك بنجاح! سنتواصل معك خلال 24 ساعة.',
        'success'
      );
      form.reset();
      // إخفاء حقل تفاصيل الخبرة بعد reset
      const wrap = document.getElementById('experienceDetailsWrap');
      if (wrap) wrap.style.display = 'none';
      return data;

    } catch (err) {
      console.error('Form submit error:', err);
      window.showToast(
        err.message || 'حدث خطأ، حاول مرة أخرى',
        'error'
      );
      throw err;
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  // ============= تهيئة النماذج =============
  function initForms() {
    const serviceForm = document.getElementById('serviceForm');
    const joinForm    = document.getElementById('joinForm');

    if (serviceForm) {
      serviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitForm(serviceForm, endpoint);
      });
    }

    if (joinForm) {
      joinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitForm(joinForm, endpoint);
      });
    }

    // تحقق فوري من الحقول المطلوبة
    document.querySelectorAll('input[required], select[required], textarea[required]').forEach(el => {
      el.addEventListener('invalid', (e) => {
        e.preventDefault();
        window.showToast('الرجاء إكمال جميع الحقول المطلوبة', 'error');
        el.style.borderColor = '#ff4444';
        el.focus();
      });
      el.addEventListener('input', () => { el.style.borderColor = ''; });
      el.addEventListener('change', () => { el.style.borderColor = ''; });
    });
  }

  document.addEventListener('DOMContentLoaded', initForms);
})();
