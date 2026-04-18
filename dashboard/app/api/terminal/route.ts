import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// List of allowed commands for security (whitelist approach)
const ALLOWED_COMMANDS = [
  "git",
  "npm",
  "npm run",
  "git add",
  "git commit",
  "git push",
  "git pull",
  "git status",
  "git log",
  "git diff",
  "git checkout",
  "git branch",
  "ls",
  "pwd",
  "whoami",
  "date",
  "echo",
];

function validateCommand(command: string): boolean {
  // Check if command starts with an allowed command
  const trimmedCmd = command.trim();
  return ALLOWED_COMMANDS.some(allowed => 
    trimmedCmd.startsWith(allowed) && (trimmedCmd[allowed.length] === " " || trimmedCmd[allowed.length] === undefined)
  );
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

    // Security Check
    if (!validateCommand(command)) {
      return Response.json(
        { 
          output: ["Error: Command not allowed. Allowed commands: git, npm, ls, pwd, etc."],
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
