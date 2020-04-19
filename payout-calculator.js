class PayoutCalculator {
  constructor() {
    this.data = [
      { timeStamp: '2019-12-01', mri: 0.00001962 },
      { timeStamp: '2019-12-02', mri: 0.00001966 },
      { timeStamp: '2019-12-03', mri: 0.00001963 },
      { timeStamp: '2019-12-04', mri: 0.00001965 },
      { timeStamp: '2019-12-05', mri: 0.00001967 },
      { timeStamp: '2019-12-06', mri: 0.0000198 },
      { timeStamp: '2019-12-07', mri: 0.00001971 },
      { timeStamp: '2019-12-08', mri: 0.00001968 },
      { timeStamp: '2019-12-09', mri: 0.00001977 },
      { timeStamp: '2019-12-10', mri: 0.00001977 },
      { timeStamp: '2019-12-11', mri: 0.00001981 },
      { timeStamp: '2019-12-12', mri: 0.00001979 },
      { timeStamp: '2019-12-13', mri: 0.00001977 },
      { timeStamp: '2019-12-14', mri: 0.00001968 },
      { timeStamp: '2019-12-15', mri: 0.00001979 },
      { timeStamp: '2019-12-16', mri: 0.00001975 },
      { timeStamp: '2019-12-17', mri: 0.00001978 },
      { timeStamp: '2019-12-18', mri: 0.00001985 },
      { timeStamp: '2019-12-19', mri: 0.00001979 },
      { timeStamp: '2019-12-20', mri: 0.00001967 },
      { timeStamp: '2019-12-21', mri: 0.00001956 },
      { timeStamp: '2019-12-22', mri: 0.00001954 },
      { timeStamp: '2019-12-23', mri: 0.00001963 },
      { timeStamp: '2019-12-24', mri: 0.00001964 },
      { timeStamp: '2019-12-25', mri: 0.00001958 },
      { timeStamp: '2019-12-26', mri: 0.0000196 },
      { timeStamp: '2019-12-27', mri: 0.00001961 },
      { timeStamp: '2019-12-28', mri: 0.00001956 },
      { timeStamp: '2019-12-29', mri: 0.00001955 },
      { timeStamp: '2019-12-30', mri: 0.00001957 },
      { timeStamp: '2019-12-31', mri: 0.00001958 },
      { timeStamp: '2020-01-01', mri: 0.00001935 },
      { timeStamp: '2020-01-02', mri: 0.00001837 },
      { timeStamp: '2020-01-03', mri: 0.00001837 },
      { timeStamp: '2020-01-04', mri: 0.00001833 },
      { timeStamp: '2020-01-05', mri: 0.00001833 },
      { timeStamp: '2020-01-06', mri: 0.00001844 },
      { timeStamp: '2020-01-07', mri: 0.00001844 },
      { timeStamp: '2020-01-08', mri: 0.00001854 },
      { timeStamp: '2020-01-09', mri: 0.0000185 },
      { timeStamp: '2020-01-10', mri: 0.00001854 },
      { timeStamp: '2020-01-11', mri: 0.00001838 },
      { timeStamp: '2020-01-12', mri: 0.00001836 },
      { timeStamp: '2020-01-13', mri: 0.00001841 },
      { timeStamp: '2020-01-14', mri: 0.00001842 },
      { timeStamp: '2020-01-15', mri: 0.0000173 },
      { timeStamp: '2020-01-16', mri: 0.00001722 },
      { timeStamp: '2020-01-17', mri: 0.00001723 },
      { timeStamp: '2020-01-18', mri: 0.00001721 },
      { timeStamp: '2020-01-19', mri: 0.00001716 },
      { timeStamp: '2020-01-20', mri: 0.00001718 },
      { timeStamp: '2020-01-21', mri: 0.0000172 },
      { timeStamp: '2020-01-22', mri: 0.0000172 },
      { timeStamp: '2020-01-23', mri: 0.0000172 },
      { timeStamp: '2020-01-24', mri: 0.00001716 },
      { timeStamp: '2020-01-25', mri: 0.00001711 },
      { timeStamp: '2020-01-26', mri: 0.00001712 },
      { timeStamp: '2020-01-27', mri: 0.00001724 },
      { timeStamp: '2020-01-28', mri: 0.00001672 },
      { timeStamp: '2020-01-29', mri: 0.00001642 },
      { timeStamp: '2020-01-30', mri: 0.00001642 },
      { timeStamp: '2020-01-31', mri: 0.00001646 },
      { timeStamp: '2020-02-01', mri: 0.00001641 },
      { timeStamp: '2020-02-02', mri: 0.00001641 },
      { timeStamp: '2020-02-03', mri: 0.00001645 },
      { timeStamp: '2020-02-04', mri: 0.00001649 },
      { timeStamp: '2020-02-05', mri: 0.00001646 },
      { timeStamp: '2020-02-06', mri: 0.00001653 },
      { timeStamp: '2020-02-07', mri: 0.00001655 },
      { timeStamp: '2020-02-08', mri: 0.00001645 },
      { timeStamp: '2020-02-09', mri: 0.00001643 },
      { timeStamp: '2020-02-10', mri: 0.00001656 },
      { timeStamp: '2020-02-11', mri: 0.0000165 },
      { timeStamp: '2020-02-12', mri: 0.00001652 },
      { timeStamp: '2020-02-13', mri: 0.00001649 },
      { timeStamp: '2020-02-14', mri: 0.00001649 },
      { timeStamp: '2020-02-15', mri: 0.00001643 },
      { timeStamp: '2020-02-16', mri: 0.00001638 },
      { timeStamp: '2020-02-17', mri: 0.00001638 },
      { timeStamp: '2020-02-18', mri: 0.00001644 },
      { timeStamp: '2020-02-19', mri: 0.00001646 },
      { timeStamp: '2020-02-20', mri: 0.00001645 },
      { timeStamp: '2020-02-21', mri: 0.00001637 },
      { timeStamp: '2020-02-22', mri: 0.00001633 },
      { timeStamp: '2020-02-23', mri: 0.00001633 },
      { timeStamp: '2020-02-24', mri: 0.00001639 },
      { timeStamp: '2020-02-25', mri: 0.00001644 },
      { timeStamp: '2020-02-26', mri: 0.00001652 },
      { timeStamp: '2020-02-27', mri: 0.00001647 },
      { timeStamp: '2020-02-28', mri: 0.00001645 },
      { timeStamp: '2020-02-29', mri: 0.00001641 },
      { timeStamp: '2020-03-01', mri: 0.00001634 },
      { timeStamp: '2020-03-02', mri: 0.00001644 },
      { timeStamp: '2020-03-03', mri: 0.00001645 },
      { timeStamp: '2020-03-04', mri: 0.00001642 },
      { timeStamp: '2020-03-05', mri: 0.00001643 },
      { timeStamp: '2020-03-06', mri: 0.00001646 },
      { timeStamp: '2020-03-07', mri: 0.00001639 },
      { timeStamp: '2020-03-08', mri: 0.00001637 },
      { timeStamp: '2020-03-09', mri: 0.00001582 },
      { timeStamp: '2020-03-10', mri: 0.00001545 },
      { timeStamp: '2020-03-11', mri: 0.0000155 },
      { timeStamp: '2020-03-12', mri: 0.00001568 },
      { timeStamp: '2020-03-13', mri: 0.00001601 },
      { timeStamp: '2020-03-14', mri: 0.0000157 },
      { timeStamp: '2020-03-15', mri: 0.00001562 },
      { timeStamp: '2020-03-16', mri: 0.00001582 },
      { timeStamp: '2020-03-17', mri: 0.00001581 },
      { timeStamp: '2020-03-18', mri: 0.00001593 },
      { timeStamp: '2020-03-19', mri: 0.00001597 },
      { timeStamp: '2020-03-20', mri: 0.00001607 }
    ];
  }

  getMRIData() {
    return this.data;
  }

  getMRIDataForDay(n) {
    return this.data[n].mri;
  }

  getMRILookBackDataForDay(n) {
    if (n < 28) {
      // looking to early in data set.
      return 0;
    }
    // Calculate average over last 28 days
    let averageMRI = 0;
    for (let i = n - 28; i < n + 1; i++) {
      averageMRI += this.data[i].mri;
    }
    return averageMRI.toFixed(8); // we only have 8 decimals of precision. drop rounding error
  }

  getDateForDay(n) {
    return this.data[n].timeStamp;
  }

  // MRI-BTC-28D-20200501
  getTokenNameFor(n) {
    // Regex to remove all `-` from timestamps
    return 'MRI-BTC-28D-' + this.getDateForDay(n).replace(/\-/g, '');
  }
}

module.exports = {
  PayoutCalculator
};
