module.exports = ({
  collateralPerUnit = 69287,
  contractName = 'MRI-BTC-28D-test',
  index = 0,
  currentMRI = 1833,
  isSettled = false,
  settlementIndex = 28,
  revenuePerUnit = 51324
}) => {
  const contract = {
    collateralPerUnit: collateralPerUnit.toString(),
    contractName: 'MRI-BTC-28D-test',
    createdAt: '127',
    currentMRI: currentMRI.toString(),
    id: '0x69d13b87a14dd0e48c51a475d198c5720fb746a8',
    index: index.toString(),
    settlement: null
  };

  if (isSettled) {
    contract.settlement = {
      index: settlementIndex.toString(),
      revenuePerUnit: revenuePerUnit.toString()
    };
  }

  return contract;
};
