const notify = (state: "visible" | "hidden") => {
  chrome.runtime.sendMessage({
    type: "PAGE_VISIBILITY",
    visibility: state,
  });
};

document.addEventListener("visibilitychange", () => {
  notify(document.visibilityState);
});

// sécurité : au chargement
notify(document.visibilityState);
