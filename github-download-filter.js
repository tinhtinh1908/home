/* Chỉ tính lượt tải APK khi script.js đọc danh sách GitHub Releases. */
(() => {
  const nativeFetch = window.fetch.bind(window);
  const releasesApi = /^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/releases(?:\?|$)/i;

  window.fetch = async (input, init) => {
    const response = await nativeFetch(input, init);
    const url = typeof input === 'string' ? input : input?.url || '';

    if (!releasesApi.test(url) || !response.ok) return response;

    try {
      const data = await response.clone().json();
      if (!Array.isArray(data)) return response;

      const filtered = data.map((release) => ({
        ...release,
        assets: Array.isArray(release.assets)
          ? release.assets.filter((asset) => String(asset?.name || '').toLowerCase().endsWith('.apk'))
          : []
      }));

      const headers = new Headers(response.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');

      return new Response(JSON.stringify(filtered), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch {
      return response;
    }
  };
})();
