// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const isNativeApp = vi.fn();
vi.mock('../platform', () => ({ isNativeApp: () => isNativeApp() }));
const writeFile = vi.fn();
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: (...a) => writeFile(...a) },
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}));
const share = vi.fn();
vi.mock('@capacitor/share', () => ({ Share: { share: (...a) => share(...a) } }));

import { saveTextFile } from '../fileTransfer';

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllGlobals());

describe('saveTextFile', () => {
  it('web: downloads through an <a download> and never touches native plugins', async () => {
    isNativeApp.mockReturnValue(false);
    const createObjectURL = vi.fn(() => 'blob:x');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await saveTextFile('a.json', '{"x":1}');
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(writeFile).not.toHaveBeenCalled();
    expect(share).not.toHaveBeenCalled();
    click.mockRestore();
  });

  it('android: writes to the private cache, then opens the share sheet with that file', async () => {
    isNativeApp.mockReturnValue(true);
    writeFile.mockResolvedValue({ uri: 'file:///cache/a.json' });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    await saveTextFile('a.json', '{"x":1}');
    expect(writeFile).toHaveBeenCalledWith({ path: 'a.json', data: '{"x":1}', directory: 'CACHE', encoding: 'utf8' });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///cache/a.json'] }));
    expect(click).not.toHaveBeenCalled();
    click.mockRestore();
  });
});
