const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

let currentDir = process.cwd();
let currentIndex = 0;

function getDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const dirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
  const files = entries.filter(entry => entry.isFile()).map(entry => entry);
  return { dirs, files };
}

function display(files, currentIndex) {
  console.clear();
  console.log(currentDir);
  console.log(currentIndex);
  files.dirs.sort();
  files.dirs.unshift('..');
  files.dirs.forEach((dir, index) => {
    if (index === currentIndex && index < files.dirs.length) {
      console.log(chalk.bgGreen.black(dir));
    } else {
      console.log(chalk.green(dir));
    }
  });
  files.files.forEach((file, index) => {
    const fileName = file.name;
    if (index + files.dirs.length === currentIndex) {
      console.log(chalk.bgYellow.black(fileName));
    } else {
      console.log(chalk.yellow(fileName));
    }
  });
  return files;
}

function handleKeyPress(str, key) {
  let files = getDir(currentDir);
  if (key.name === 'w' || key.name === 'up') {
    currentIndex = currentIndex === 0 ? (files.dirs.length + files.files.length) : currentIndex -1;
  } else if (key.name === 's' || key.name === 'down') {
    currentIndex = currentIndex >= (files.dirs.length + files.files.length) ? 0 : currentIndex + 1;
  } else if (key.name === 'c' || key.name === 'escape') {
    process.exit()
  } else if (key.name === 'return') {
    let selected = currentIndex <= files.dirs.length ? files.dirs[currentIndex - 1] : files.files[currentIndex - files.dirs.length - 1].name;
    if (currentIndex === 0) {
      currentDir = path.resolve(currentDir, '..');
      currentIndex = 0;
    } else {
      const fullpath = path.join(currentDir, selected);
      if (fs.lstatSync(fullpath).isDirectory()) {
        currentDir = path.resolve(fullpath);
        currentIndex = 0;
      } else {
        const ext = path.extname(fullpath).toLowerCase();
        let command;
        if (ext === '.exe' && process.platform === 'win32') {
          command = `start "" "${fullpath}"`;
        } else if (['.txt', '.md', '.js', '.json', '.html', '.css'].includes(ext)) {
          if (process.platform === 'win32') {
            command = `notepad "${fullpath}"`;
          } else {
            command = `nano "${fullpath}"`;
          }
        } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
          if (process.platform === 'win32') {
            command = `start "" "${fullpath}"`;
          } else if (process.platform === 'darwin') {
            command = `open "${fullpath}"`;
          } else {
            command = `xdg-open "${fullpath}"`;
          }
        } else {
          command = `"${fullpath}"`; // Attempt to run the file directly
        }

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error opening file: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
          }
          console.log(stdout);
        });
      }
    }
    files = getDir(currentDir)
  }
  display(files, currentIndex);
}


function navigate() {
  let files = getDir(currentDir);
  display(files, currentIndex);

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.on('keypress', handleKeyPress);
}

navigate();