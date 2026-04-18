#!/usr/bin/env node

/**
 * 🚀 GUARDIAN-OTA Full Stack Runtime
 * 
 * Single file to run the entire project:
 * - Frontend (Next.js on 3000)
 * - Backend (Go on 8080)
 * - Infrastructure (Docker Compose)
 * 
 * Usage: node run.js
 * Or in VSCode: Right-click → Run Code / or F5
 */

const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = __dirname;
const isWindows = os.platform() === "win32";
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

let backendProcess = null;
let frontendProcess = null;
let dockerProcess = null;

// Cleanup function
const cleanup = (signal) => {
  log.info("Shutting down...");
  
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
  
  if (dockerProcess) {
    dockerProcess.kill();
    exec(`docker compose -f "${path.join(ROOT, "deploy")}/docker-compose.yml" down`, () => {});
  }
  
  process.exit(0);
};

process.on("SIGINT", () => cleanup("SIGINT"));
process.on("SIGTERM", () => cleanup("SIGTERM"));

/**
 * Execute command and return promise
 */
const runCmd = (cmd, cwd = ROOT) => {
  return new Promise((resolve, reject) => {
    const child = exec(cmd, { cwd, shell: true }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
    child.on("error", reject);
  });
};

/**
 * Spawn process with output
 */
const spawnProcess = (name, cmd, args, cwd, showOutput = true) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: isWindows ? true : false,
      stdio: showOutput ? "inherit" : "pipe",
    });

    child.on("error", (err) => {
      log.error(`${name} failed: ${err.message}`);
      reject(err);
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`${name} exited with code ${code}`));
      }
    });

    // Resolve immediately so we can continue with other processes
    setTimeout(() => resolve(child), 1000);
  });
};

/**
 * Main orchestration
 */
async function main() {
  log.title("🚀 GUARDIAN-OTA FULL STACK LAUNCHER");
  
  try {
    // Step 1: Docker Infrastructure
    log.title("─ Step 1: Starting Docker Infrastructure");
    log.info("Starting PostgreSQL, Mosquitto, MinIO...");
    
    const dockerCmd = isWindows
      ? `docker compose -f "${path.join(ROOT, "deploy")}/docker-compose.yml" up -d`
      : `docker compose -f ${path.join(ROOT, "deploy")}/docker-compose.yml up -d`;
    
    await runCmd(dockerCmd);
    log.success("Docker services started");
    
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Backend Dependencies
    log.title("─ Step 2: Backend Setup");
    log.info("Installing Go dependencies...");
    
    try {
      await runCmd("go mod download", path.join(ROOT, "backend"));
      log.success("Go dependencies ready");
    } catch (e) {
      log.warn("Go not found or mod download failed - backend may fail to start");
    }
    
    // Step 3: Frontend Dependencies
    log.title("─ Step 3: Frontend Setup");
    log.info("Installing npm packages...");
    
    try {
      await runCmd("npm install --legacy-peer-deps", path.join(ROOT, "dashboard"));
      log.success("npm dependencies ready");
    } catch (e) {
      log.error("npm installation failed");
      throw e;
    }
    
    // Step 4: Start Backend
    log.title("─ Step 4: Starting Backend");
    log.info("Launching Go server on :8080...");
    
    try {
      backendProcess = await spawnProcess(
        "Backend",
        isWindows ? "cmd" : "go",
        isWindows ? ["/c", "go run ."] : ["run", "."],
        path.join(ROOT, "backend")
      );
      log.success("Backend started");
    } catch (e) {
      log.warn("Backend may not be available");
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Start Frontend
    log.title("─ Step 5: Starting Frontend");
    log.info("Launching Next.js dev server on :3000...");
    
    frontendProcess = await spawnProcess(
      "Frontend",
      "npm",
      ["run", "dev"],
      path.join(ROOT, "dashboard")
    );
    log.success("Frontend started");
    
    log.title("✨ ALL SYSTEMS ONLINE ✨");
    log.info("🌐 Dashboard: http://localhost:3000");
    log.info("🔌 Backend API: http://localhost:8080");
    log.info("📊 MQTT: localhost:1883");
    log.info("💾 MinIO: http://localhost:9001 (minio/miniopass)");
    log.info("🗄️  PostgreSQL: localhost:5432 (ota/ota)");
    log.warn("Press Ctrl+C to stop all services");
    
    // Keep process alive
    await new Promise(() => {});
    
  } catch (err) {
    log.error(`Startup failed: ${err.message}`);
    cleanup("ERROR");
  }
}

// Run
main().catch((err) => {
  log.error(err.message);
  cleanup("ERROR");
});
