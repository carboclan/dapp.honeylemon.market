// This shortens an Address string to a maximum length, if the original exceeds
// the maximum length. The default output maximum length is 13 characters 
export const displayAddress = (address: string, maxLength: number = 13) => {
  if (address.length <= maxLength) {
    return address
  }
  const charsToKeep = Math.floor((maxLength - 3)/2)
  return address.substring(0, charsToKeep) + "..." + address.substring(address.length - (charsToKeep + 1), address.length - 1);
}