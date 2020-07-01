export function networkName(id: any) {
    switch (Number(id)) {
        case 1:
            return 'mainnet'
        case 3:
            return 'ropsten'
        case 4:
            return 'rinkeby'
        case 5:
            return 'goerli'
        case 42:
            return 'kovan'
        case NaN:
            return 'localhost'
        default:
            return 'localhost'
    }
}