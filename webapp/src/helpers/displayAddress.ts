// This shortens an Address string to a maximum length, if the original exceeds
// the maximum length. The default maximum length is 13 characters 
export const displayAddress = (address: string, maxLength: number = 13) => {
  if (address.length <= maxLength) {
    return address
  }
  const charsToKeep = Math.floor((maxLength - 5)/2)
  return address.substring(0, charsToKeep + 2) + "..." + address.substring(address.length - 1 - charsToKeep, address.length - 1);
}