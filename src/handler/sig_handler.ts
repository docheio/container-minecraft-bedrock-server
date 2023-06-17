async function exit(signal: string, value: number) {
  console.log(`${signal} received`);
  process.exit(value);
}

export async function sig_up(callback: Function = () => {}) {
  process.on("SIGUP", async () => {
    await callback();
    await exit("SIGUP", 1);
  });
}
export async function sig_int(callback: Function = () => {}) {
  process.on("SIGINT", async () => {
    await callback();
    await exit("SIGINT", 2);
  });
}

export async function sig_term(callback: Function = () => {}) {
  process.on("SIGTERM", async () => {
    await callback();
    await exit("SIGTERM", 15);
  });
}

export async function sig_end_kit(callback: Function = () => {}) {
  sig_up(callback);
  sig_int(callback);
  sig_term(callback);
}
