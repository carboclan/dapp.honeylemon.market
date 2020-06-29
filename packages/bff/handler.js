'use strict';

module.exports.api = async event => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(
      {
        message: 'Yo yo!',
        maintenance_mode: process.env.MAINTENANCE_MODE
      },
      null,
      2
    ),
  };
};
