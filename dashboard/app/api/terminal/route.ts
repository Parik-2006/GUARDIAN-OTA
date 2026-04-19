import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// List of project-specific commands that should be forwarded to the Go backend
const PROJECT_COMMANDS = ["fleet", "logs", "device", "blockchain", "ota", "campaigns"];

// Essential shell commands allowed for repository management
const SHELL_COMMANDS = ["git", "npm", "ls", "pwd", "date"];

function isProjectCommand(command: string): boolean {
  const baseCmd = command.trim().split(" ")[0];
  return PROJECT_COMMANDS.includes(baseCmd);
}

function isShellCommand(command: string): boolean {
  const baseCmd = command.trim().split(" ")[0];
  return SHELL_COMMANDS.includes(baseCmd);
}

export async function POST(request: Request) {
  try {
    const { command } = await request.json();

    if (!command || typeof command !== "string") {
      return Response.json(
        { output: ["Error: Invalid command format"], status: "error" },
        { status: 400 }
      );
    }

    const trimmedCmd = command.trim();

    // 1. Handle Project Commands (Forward to Go Backend)
    if (isProjectCommand(trimmedCmd)) {
      try {
        const backendRes = await fetch("http://localhost:8080/api/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: trimmedCmd }),
        });

        if (!backendRes.ok) {
          throw new Error(`Backend responded with ${backendRes.status}`);
        }

        const data = await backendRes.json();
        return Response.json(data);
      } catch (err) {
        return Response.json({
          output: [`[ERROR] Could not reach Go backend: ${err instanceof Error ? err.message : "Unknown error"}`],
          status: "error",
        }, { status: 502 });
      }
    }

    // 2. Handle Allowed Shell Commands (Execute Locally)
    if (!isShellCommand(trimmedCmd)) {
      return Response.json(
        { 
          output: [
            "Error: Command not recognized or allowed.",
            "PROJECT COMMANDS: fleet, logs, device, blockchain",
            "SYSTEM COMMANDS: git, npm, ls, pwd"
          ],
          status: "error"
        },
        { status: 403 }
      );
    }

    // Execute in project root
    const projectRoot = path.join(process.cwd(), "..", "..");
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: projectRoot,
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      const output = stdout.trim().split("\n").filter(line => line.length > 0);
      
      if (stderr && !output.includes(stderr)) {
        output.push(stderr);
      }

      return Response.json({
        output: output.length > 0 ? output : ["Command executed successfully"],
        status: "success",
      });
    } catch (execError) {
      const error = execError as any;
      const errorOutput = error.stderr || error.stdout || error.message || "Unknown error";
      
      return Response.json({
        output: errorOutput.split("\n").filter((line: string) => line.length > 0),
        status: "error",
      });
    }
  } catch (error) {
    return Response.json(
      { 
        output: [`Error: ${error instanceof Error ? error.message : "Unknown error"}`],
        status: "error"
      },
      { status: 500 }
    );
  }
}
