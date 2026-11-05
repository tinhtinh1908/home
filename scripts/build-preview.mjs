import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'build/preview');
const css = await readFile(path.join(root, 'style.css'));
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {cwd:root, encoding:'utf8'}).trim();
const version = `miuix-${commit}-${createHash('sha256').update(css).digest('hex').slice(0,8)}`;
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
for (const name of ['index.html','style.css','preview.css','sw.js','manifest.webmanifest','assets','content','js']) {
  await cp(path.join(root,name), path.join(output,name), {recursive:true});
}
async function versionFiles(directory) {
  const {readdir} = await import('node:fs/promises');
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const name = path.join(directory,entry.name);
    if (entry.isDirectory()) await versionFiles(name);
    else if (/\.(html|js|webmanifest)$/.test(name)) {
      const value = await readFile(name,'utf8');
      await writeFile(name,value.replaceAll('__BUILD__',version));
    }
  }
}
await versionFiles(output);
await writeFile(path.join(output,'START.txt'),'Bản thử nghiệm giao diện Miuix. Chạy tại thư mục này:\npython3 -m http.server 8000\nSau đó mở http://localhost:8000\n');
console.log(`${output}\nVersion: ${version}`);
