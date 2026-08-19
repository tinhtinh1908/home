/*
 * Cầu nối mở ứng dụng Chủ đề trên HyperOS.
 * Hoạt động trực tiếp bằng Android Intent hoặc qua bridge khi đóng web thành APK.
 */
(function createHyperOSBridge() {
  const themePackage = 'com.android.thememanager';
  const searchActivity = 'com.android.thememanager.search.ThemeSearchActivity';

  function notify(message, type = 'info') {
    window.dispatchEvent(new CustomEvent('hyperos-native-message', {
      detail: {
        message,
        type
      }
    }));
  }

  function createIntentUri(themeName) {
    const component = `${themePackage}/${searchActivity}`;
    const encodedName = encodeURIComponent(themeName);

    return [
      'intent:#Intent',
      'action=android.intent.action.VIEW',
      `component=${component}`,
      `S.REQUEST_RELATED_TITLE=${encodedName}`,
      'S.REQUEST_SEARCH_SOURCE=hyperos_viet_hoa',
      'end'
    ].join(';');
  }

  function sendToNative(themeName) {
    const request = JSON.stringify({
      action: 'openThemeSearch',
      payload: {
        packageName: themePackage,
        activity: searchActivity,
        themeName
      }
    });

    const bridge = window.HyperOSNative || window.Android;
    if (!bridge || typeof bridge.performAction !== 'function') return false;

    try {
      bridge.performAction(request);
      return true;
    } catch {
      notify('Không thể mở ứng dụng Chủ đề', 'error');
      return false;
    }
  }

  window.HyperOSActions = {
    openThemeSearch(themeName) {
      const searchName = String(themeName || '').trim();
      if (!searchName) {
        notify('Theme chưa có tên tìm kiếm', 'warning');
        return false;
      }

      if (sendToNative(searchName)) return true;

      if (/Android/i.test(navigator.userAgent)) {
        window.location.href = createIntentUri(searchName);
        return true;
      }

      notify('Chức năng mở Chủ đề chỉ hỗ trợ thiết bị Android', 'warning');
      return false;
    }
  };
})();
