const { getBtcMri } = require('./mri/index.js');

class HoneyLemon {
  constructor() {}
  fetchMRI = async timestamp => {
    const mri = await getBtcMri(new Date('04-01-2020 UTC'), 1);
    console.log('mri', mri);
  };
}

module.exports = {
  HoneyLemon
};
