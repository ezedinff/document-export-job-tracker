const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const APP_PORT = process.env.E2E_PORT || '3123';
const BASE_URL = `http://127.0.0.1:${APP_PORT}`;
const ARTIFACT_DIR = path.join(process.cwd(), 'artifacts', 'ui');

let serverProcess;
let driver;
let tempDir;
let logFile;
let stdoutListener;
let stderrListener;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopServerProcess(proc) {
  if (!proc) {
    return;
  }
  if (proc.exitCode !== null || proc.killed) {
    return;
  }

  await new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    proc.once('exit', finish);
    proc.kill('SIGTERM');

    setTimeout(() => {
      if (proc.exitCode === null && !proc.killed) {
        proc.kill('SIGKILL');
      }
    }, 3000);

    setTimeout(finish, 5000);
  });
}

async function clickButtonWithText(text) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const button = await driver.wait(until.elementLocated(By.xpath(`//button[contains(., '${text}')]`)), 5000);
      await button.click();
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await sleep(250);
    }
  }
}

async function waitForHealth(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // retry until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('App did not become healthy in time');
}

describe('Export UI smoke tests', () => {
  beforeAll(async () => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-export-ui-'));
    logFile = path.join(ARTIFACT_DIR, 'ui-test-server.log');
    fs.writeFileSync(logFile, '');
    const dbPath = path.join(tempDir, 'e2e.db');
    const exportDir = path.join(tempDir, 'exports');

    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: APP_PORT,
        DB_PATH: dbPath,
        EXPORT_DIR: exportDir
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    stdoutListener = (data) => fs.appendFileSync(logFile, data.toString());
    stderrListener = (data) => fs.appendFileSync(logFile, data.toString());
    serverProcess.stdout.on('data', stdoutListener);
    serverProcess.stderr.on('data', stderrListener);

    await waitForHealth();

    const options = new chrome.Options();
    options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  afterEach(async () => {
    if (!driver) {
      return;
    }
    const state = expect.getState();
    if (state.currentTestName) {
      const png = await driver.takeScreenshot();
      const filename = `${state.currentTestName.replace(/\W+/g, '-').toLowerCase()}.png`;
      fs.writeFileSync(path.join(ARTIFACT_DIR, filename), png, 'base64');
    }
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
    if (serverProcess) {
      if (stdoutListener) {
        serverProcess.stdout.off('data', stdoutListener);
      }
      if (stderrListener) {
        serverProcess.stderr.off('data', stderrListener);
      }
      await stopServerProcess(serverProcess);
    }
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('opens page and creates an export job', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('h1')), 5000);
    const title = await driver.findElement(By.css('h1')).getText();
    expect(title).toContain('Document Export Job Tracker');

    const input = await driver.findElement(By.id('job-name'));
    await input.sendKeys('Smoke test CSV');
    await driver.findElement(By.css('#create-job-form button[type="submit"]')).click();

    await driver.wait(until.elementLocated(By.css('#jobs-body tr')), 5000);
    const firstName = await driver.findElement(By.css('#jobs-body tr td:nth-child(2)')).getText();
    expect(firstName).toContain('Smoke test CSV');
  });

  it('can start and complete a job then show download link', async () => {
    await driver.get(BASE_URL);
    const input = await driver.findElement(By.id('job-name'));
    await input.clear();
    await input.sendKeys('Lifecycle job');
    await driver.findElement(By.css('#create-job-form button[type="submit"]')).click();

    await driver.wait(until.elementLocated(By.css('#jobs-body tr')), 5000);

    await clickButtonWithText('Start');
    await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Complete')]")), 5000);
    await clickButtonWithText('Complete');

    await driver.wait(until.elementLocated(By.css("a[data-testid^='download-link-']")), 5000);
    const linkText = await driver.findElement(By.css("a[data-testid^='download-link-']")).getText();
    expect(linkText).toBe('Download CSV');
  });
});
