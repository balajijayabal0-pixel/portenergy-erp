/* Sets the Port Energy icon and version details on the Windows .exe (works on Linux and Windows, no Wine needed) */
const fs = require('fs');
const path = require('path');

exports.default = async function (ctx) {
  if (ctx.electronPlatformName !== 'win32') return;
  const ResEdit = await import('resedit');
  const R = ResEdit.default || ResEdit;
  const pkg = require('./package.json');
  const exe = path.join(ctx.appOutDir, `${pkg.productName}.exe`);
  const ico = path.join(__dirname, 'build', 'icon.ico');
  const data = fs.readFileSync(exe);
  const pe = R.NtExecutable.from(data, { ignoreCert: true });
  const res = R.NtExecutableResource.from(pe);
  const iconFile = R.Data.IconFile.from(fs.readFileSync(ico));
  R.Resource.IconGroupEntry.replaceIconsForResource(res.entries, 1, 1033, iconFile.icons.map((i) => i.data));
  const vi = R.Resource.VersionInfo.fromEntries(res.entries)[0];
  const [a, b, c] = pkg.version.split('.').map(Number);
  vi.setFileVersion(a, b, c, 0, 1033);
  vi.setProductVersion(a, b, c, 0, 1033);
  vi.setStringValues({ lang: 1033, codepage: 1200 }, {
    CompanyName: 'Port Energy Private Limited', FileDescription: 'Port Energy ERP', ProductName: 'Port Energy ERP',
    LegalCopyright: pkg.copyright, OriginalFilename: `${pkg.productName}.exe`, InternalName: 'PortEnergyERP'
  });
  vi.outputToResourceEntries(res.entries);
  res.outputResource(pe);
  fs.writeFileSync(exe, Buffer.from(pe.generate()));
  console.log('  • Port Energy icon + version set on', path.basename(exe));
};
