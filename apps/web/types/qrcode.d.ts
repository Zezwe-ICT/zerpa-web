// Minimal types for the `qrcode` package (only what Zerpa uses).
declare module "qrcode" {
  export function toDataURL(text: string, options?: { margin?: number; width?: number }): Promise<string>;
}
