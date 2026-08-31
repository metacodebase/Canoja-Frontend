const getEntryAsset = (documentRoot) =>
  documentRoot.querySelector('script[type="module"][src]')?.getAttribute("src");

export const reloadWhenDeploymentChanges = async () => {
  if (import.meta.env.DEV) return;

  try {
    const response = await fetch(`/index.html?version=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    const latestDocument = new DOMParser().parseFromString(await response.text(), "text/html");
    const currentAsset = getEntryAsset(document);
    const latestAsset = getEntryAsset(latestDocument);

    if (currentAsset && latestAsset && currentAsset !== latestAsset) {
      window.location.reload();
    }
  } catch {
    // Keep the current app available when the version check cannot reach the server.
  }
};
