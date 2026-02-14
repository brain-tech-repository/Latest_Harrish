export function formatNumberShort(value: number): string {
  // if (value >= 1_000_000_000_000) {
  //   return (value / 1_000_000_000_000).toFixed(2).replace(/\.00$/, '') + 'T';
  // } 
  // else if (value >= 1_000_000_000) {
  //   return (value / 1_000_000_000).toFixed(2).replace(/\.00$/, '') + 'B';
  // } 
  // else
  if (value >= 1_00_000) {
    // return (value / 1_00_000).toFixed(2) + 'L';
    return (value).toLocaleString(undefined, { maximumFractionDigits: 0 });
  } 
  // else if (value >= 1_000) {
  //   return (value / 1_000).toFixed(2).replace(/\.00$/, '') + 'K';
  // } 
  else {
    return value.toString();
  }
}