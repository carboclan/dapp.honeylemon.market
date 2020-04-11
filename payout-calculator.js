class payoutCalculator {
  constructor() {
    this.data = [
      { timestampString: '2020-02-01', mri: 0.00001641 },
      { timestampString: '2020-02-02', mri: 0.00001641 },
      { timestampString: '2020-02-03', mri: 0.00001645 },
      { timestampString: '2020-02-04', mri: 0.00001649 },
      { timestampString: '2020-02-05', mri: 0.00001646 },
      { timestampString: '2020-02-06', mri: 0.00001653 },
      { timestampString: '2020-02-07', mri: 0.00001655 },
      { timestampString: '2020-02-08', mri: 0.00001645 },
      { timestampString: '2020-02-09', mri: 0.00001643 },
      { timestampString: '2020-02-10', mri: 0.00001656 },
      { timestampString: '2020-02-11', mri: 0.0000165 },
      { timestampString: '2020-02-12', mri: 0.00001652 },
      { timestampString: '2020-02-13', mri: 0.00001649 },
      { timestampString: '2020-02-14', mri: 0.00001649 },
      { timestampString: '2020-02-15', mri: 0.00001643 },
      { timestampString: '2020-02-16', mri: 0.00001638 },
      { timestampString: '2020-02-17', mri: 0.00001638 },
      { timestampString: '2020-02-18', mri: 0.00001644 },
      { timestampString: '2020-02-19', mri: 0.00001646 },
      { timestampString: '2020-02-20', mri: 0.00001645 },
      { timestampString: '2020-02-21', mri: 0.00001637 },
      { timestampString: '2020-02-22', mri: 0.00001633 },
      { timestampString: '2020-02-23', mri: 0.00001633 },
      { timestampString: '2020-02-24', mri: 0.00001639 },
      { timestampString: '2020-02-25', mri: 0.00001644 },
      { timestampString: '2020-02-26', mri: 0.00001652 },
      { timestampString: '2020-02-27', mri: 0.00001647 },
      { timestampString: '2020-02-28', mri: 0.00001645 }
    ];
  }

  getMRIData() {
    return this.data;
  }
  getMRIDataForDay(n) {
    return this.data[n];
  }
}

module.exports = {
  Liquidator
};
