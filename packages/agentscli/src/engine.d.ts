declare module '#engine' {
  export function execute(
    command: string,
    options: any,
    dependencies?: any,
  ): Promise<any>;
}
