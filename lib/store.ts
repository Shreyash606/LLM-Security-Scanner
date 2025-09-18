type Store = Map<string, any>;
declare global { var __MEM_STORE: Store | undefined; }
const mem: Store = globalThis.__MEM_STORE ?? new Map();
if (!globalThis.__MEM_STORE) globalThis.__MEM_STORE = mem;
export async function get(key: string) { return mem.get(key); }
export async function set(key: string, val: any) { mem.set(key, val); }