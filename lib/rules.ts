import type { Finding } from "@/lib/types";

type RuleFn = (a:{ repo:string; commit:string; path:string; text:string }) => Finding[];

function addFinding(arr: Finding[], path:string, line:number, id:string, title:string, severity:Finding["severity"], description:string, recommendation:string) {
  arr.push({ id: `${id}:${path}:${line}`, title, severity, filePath: path, startLine: line, endLine: line, rule: id, description, recommendation });
}

const jsEval: RuleFn = ({path, text}) => {
  const out: Finding[] = []; const re = /\beval\s*\(/g;
  let m:RegExpExecArray|null; while ((m = re.exec(text))){ addFinding(out, path, text.slice(0,m.index).split(/\r?\n/).length, "eval", "Use of eval()", "high", "eval() executes arbitrary code.", "Avoid eval; use safe parsing or explicit logic."); }
  return out;
};

const jsChildProc: RuleFn = ({path, text}) => {
  const imports = /require\(\s*['"]child_process['"]\s*\)|from\s+['"]child_process['"]/.test(text);
  if (!imports) return [];
  const out: Finding[] = []; const re = /\b(child_process\.)?(exec|spawn|execFile|fork)\s*\(/g;
  let m:RegExpExecArray|null; while ((m = re.exec(text))){ addFinding(out, path, text.slice(0,m.index).split(/\r?\n/).length, "childproc", "Child process execution", "high", "Shelling out can be risky.", "Validate/escape args; prefer library calls; use execFile with argv."); }
  return out;
};

const reactDangerHTML: RuleFn = ({path, text}) => {
  if (!/\.(jsx?|tsx?)$/.test(path)) return [];
  const out: Finding[] = []; const re = /dangerouslySetInnerHTML\s*=\s*\{/g;
  let m:RegExpExecArray|null; while ((m = re.exec(text))){ addFinding(out, path, text.slice(0,m.index).split(/\r?\n/).length, "dangerous-html", "dangerouslySetInnerHTML usage", "medium", "Inner HTML can cause XSS if unsanitized.", "Sanitize or avoid raw HTML."); }
  return out;
};

const secrets: RuleFn = ({path, text}) => {
  const out: Finding[] = [];
  const re = /(AWS|SECRET|PASSWORD|TOKEN|API[_-]?KEY)[^\n]{0,60}['"][A-Za-z0-9_\-]{12,}['"]/g;
  let m:RegExpExecArray|null; while ((m = re.exec(text))){ addFinding(out, path, text.slice(0,m.index).split(/\r?\n/).length, "secret", "Suspicious hardcoded secret", "high", "Credentials in code may leak.", "Move to env vars/secret manager."); }
  return out;
};

const pyYamlLoad: RuleFn = ({path, text}) => {
  if (!/\.py$/.test(path)) return [];
  if (!/yaml\.load\s*\(/.test(text)) return [];
  if (/Loader\s*=\s*SafeLoader/.test(text)) return [];
  const line = text.split(/\r?\n/).findIndex(l => /yaml\.load\s*\(/.test(l)) + 1;
  if (line < 1) return [];
  return [{ id: `py-yaml-load:${path}:${line}`, title: "yaml.load without SafeLoader", severity: "high", filePath: path, startLine: line, endLine: line, rule: "py-yaml-load", description: "Unsafe YAML load can execute arbitrary objects.", recommendation: "Use yaml.safe_load or specify Loader=SafeLoader." }];
};

const pySubprocessShell: RuleFn = ({path, text}) => {
  if (!/\.py$/.test(path)) return [];
  const out: Finding[] = []; const re = /subprocess\.(call|run|Popen)\s*\([^)]*shell\s*=\s*True/gi;
  let m:RegExpExecArray|null; while ((m = re.exec(text))){ addFinding(out, path, text.slice(0,m.index).split(/\r?\n/).length, "py-subprocess-shell", "subprocess shell=True", "high", "shell=True may allow injection.", "Avoid shell=True; pass argv list and validate inputs."); }
  return out;
};

const goExec: RuleFn = ({path, text}) => {
  if (!/\.go$/.test(path)) return [];
  const out: Finding[] = []; const re = /\bexec\.Command\s*\(/g;
  let m:RegExpExecArray|null; while ((m = re.exec(text))){ addFinding(out, path, text.slice(0,m.index).split(/\r?\n/).length, "go-exec", "exec.Command usage", "high", "Spawning processes can be risky.", "Validate args; avoid shell; consider libraries or context timeouts."); }
  return out;
};

export function ruleScan(repo: string, commit: string, path: string, text: string): Finding[] {
  const fns: RuleFn[] = [jsEval, jsChildProc, reactDangerHTML, secrets, pyYamlLoad, pySubprocessShell, goExec];
  return fns.flatMap(fn => fn({ repo, commit, path, text }));
}
