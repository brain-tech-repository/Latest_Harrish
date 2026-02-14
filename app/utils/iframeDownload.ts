export function iframeDownload(url: string) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;

  document.body.appendChild(iframe);

  // cleanup
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 3000);
}
