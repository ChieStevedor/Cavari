type ClassValue = string | number | null | undefined | false | ClassValue[];

function flatten(inputs: ClassValue[], out: string[]) {
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      flatten(input, out);
    } else {
      out.push(String(input));
    }
  }
}

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  flatten(inputs, out);
  return out.join(" ");
}
