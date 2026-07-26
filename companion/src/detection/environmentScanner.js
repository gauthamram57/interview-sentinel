import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { screen } from "electron";

const execFileAsync = promisify(execFile);

/**
 * Flags more than one active display. No legitimate single-candidate
 * interview setup needs a second monitor — worth a flag, not a block.
 * @returns {Array<{kind: string, detail: string}>}
 */
export function scanMonitors() {
  const displays = screen.getAllDisplays();
  if (displays.length <= 1) return [];
  return [{
    kind: "multiple_monitors",
    detail: `${displays.length} displays active`,
  }];
}

/**
 * Flags common signs the OS is running inside a VM. No legitimate
 * candidate needs a virtual machine for an interview — this is a stronger
 * signal than most, worth surfacing even on its own.
 * @returns {Promise<Array<{kind: string, detail: string}>>}
 */
export async function scanVirtualMachine() {
  try {
    if (process.platform === "win32") return await scanWindowsVM();
    if (process.platform === "darwin") return await scanMacVM();
  } catch (err) {
    console.error("VM scan failed:", err.message);
  }
  return [];
}

async function scanWindowsVM() {
  const { stdout } = await execFileAsync("powershell.exe", [
    "-NoProfile", "-Command",
    "(Get-CimInstance -ClassName Win32_ComputerSystem).Model",
  ]);
  const model = stdout.trim().toLowerCase();
  const vmSignatures = ["virtualbox", "vmware", "kvm", "qemu", "virtual machine", "hyper-v"];
  const match = vmSignatures.find((sig) => model.includes(sig));
  if (!match) return [];
  return [{ kind: "virtual_machine", detail: `System model reports "${stdout.trim()}"` }];
}

async function scanMacVM() {
  const { stdout } = await execFileAsync("system_profiler", ["SPHardwareDataType"]);
  const lower = stdout.toLowerCase();
  const vmSignatures = ["vmware", "parallels", "virtualbox", "qemu"];
  const match = vmSignatures.find((sig) => lower.includes(sig));
  if (!match) return [];
  return [{ kind: "virtual_machine", detail: `Hardware profile matches "${match}"` }];
}
