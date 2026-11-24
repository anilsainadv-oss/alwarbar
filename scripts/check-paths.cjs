const fs = require('fs');
const { execSync } = require('child_process');

function checkDir(dir) {
  console.log(`\n======================================================`);
  console.log(`Directory: ${dir}`);
  console.log(`======================================================`);
  if (!fs.existsSync(dir)) {
    console.log('Exists: FALSE');
    return;
  }
  console.log('Exists: TRUE');

  try {
    const branch = execSync(`git -C "${dir}" branch --show-current`, { encoding: 'utf-8' }).trim();
    console.log('Current Branch:', branch);
  } catch (e) {
    console.log('Branch error:', e.message);
  }

  try {
    const remote = execSync(`git -C "${dir}" remote -v`, { encoding: 'utf-8' }).trim();
    console.log('Git Remote URL:\n' + remote);
  } catch (e) {
    console.log('Remote error:', e.message);
  }

  try {
    const status = execSync(`git -C "${dir}" status --short`, { encoding: 'utf-8' }).trim();
    console.log('Git Status (modified tracked files):');
    const modified = status.split('\n').filter(l => l.startsWith(' M') || l.startsWith('M '));
    console.log(modified.join('\n') || 'None');
  } catch (e) {
    console.log('Status error:', e.message);
  }

  const nextDir = `${dir}/.next`;
  const hasNext = fs.existsSync(nextDir);
  console.log('.next folder exists:', hasNext);
  if (hasNext) {
    const manifestPath = `${nextDir}/build-manifest.json`;
    if (fs.existsSync(manifestPath)) {
      const stat = fs.statSync(manifestPath);
      console.log('Latest Production Build Manifest Time:', stat.mtime.toISOString());
    }
  }
}

checkDir('C:/alwar-advocates');
checkDir('C:/Users/Pranika/Documents/GitHub/alwarbar');
