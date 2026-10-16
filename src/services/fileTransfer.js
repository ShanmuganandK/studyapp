import { isNativeApp } from './platform';

/**
 * fileTransfer — hands a text file to the parent. Web: the Blob + `<a download>` the PWA has always
 * used. Android (Capacitor): `<a download>` does nothing in the WebView, so the file is written to
 * the app's private cache and offered through the system share sheet (save to Drive/Files, send to
 * another phone). Nothing is uploaded by the app: the parent chooses the destination.
 *
 * Import needs no equivalent: `<input type="file">` works in the Android WebView.
 *
 * @param {string} filename
 * @param {string} text
 * @param {string} [mimeType]
 */
export async function saveTextFile(filename, text, mimeType = 'application/json') {
  if (isNativeApp()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, files: [uri], dialogTitle: 'Save progress backup' });
    return;
  }

  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
